const { Pool } = require('pg');
const { Resend } = require('resend');
const { DateTime } = require('luxon');

const SHOP_TZ = 'Europe/Rome';
const MIN_HOUR = 9;
const MAX_HOUR = 19;
const MAX_BOOKINGS_PER_SLOT = 3;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function normalizePhoneForWhatsApp(phone) {
  return String(phone || '').replace(/[^\d]/g, '');
}

function validatePayload(payload) {
  const required = ['name', 'phone', 'email', 'service', 'date', 'hourSlot'];
  for (const key of required) {
    if (!payload[key] || String(payload[key]).trim() === '') {
      return `Missing required field: ${key}`;
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    return 'Invalid date format. Use YYYY-MM-DD.';
  }

  if (!/^([01]\d|2[0-3]):00$/.test(payload.hourSlot)) {
    return 'Invalid hourSlot format. Use HH:00 in 24h format.';
  }

  const hour = Number(payload.hourSlot.slice(0, 2));
  if (hour < MIN_HOUR || hour > MAX_HOUR) {
    return `hourSlot must be between ${String(MIN_HOUR).padStart(2, '0')}:00 and ${String(MAX_HOUR).padStart(2, '0')}:00.`;
  }

  return null;
}

function parseRomeSlot(date, hourSlot) {
  const slotStart = DateTime.fromISO(`${date}T${hourSlot}:00`, { zone: SHOP_TZ });
  if (!slotStart.isValid) return null;
  return {
    slotStart,
    slotEnd: slotStart.plus({ hours: 1 })
  };
}

function buildIcs({ bookingId, service, name, phone, notes, slotStartUtc, slotEndUtc }) {
  const formatUtc = (dt) => dt.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
  const nowUtc = DateTime.utc().toFormat("yyyyLLdd'T'HHmmss'Z'");
  const description = [
    `Booking reference: ${bookingId}`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Notes: ${notes || '-'}`
  ].join('\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DIF Nails//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${bookingId}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${formatUtc(slotStartUtc)}`,
    `DTEND:${formatUtc(slotEndUtc)}`,
    `SUMMARY:Nail appointment - ${service}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

async function countConfirmedForSlot(client, slotStartUtcIso) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM bookings
     WHERE slot_start = $1::timestamptz AND status = 'confirmed'`,
    [slotStartUtcIso]
  );
  return result.rows[0].count;
}

async function findAlternativeSlots(client, date, selectedHour, limit = 3) {
  const alternatives = [];

  const candidateHours = [];
  for (let h = selectedHour + 1; h <= MAX_HOUR; h += 1) candidateHours.push(h);
  for (let h = MIN_HOUR; h < selectedHour; h += 1) candidateHours.push(h);

  for (const hour of candidateHours) {
    if (alternatives.length >= limit) break;
    const hourSlot = `${String(hour).padStart(2, '0')}:00`;
    const parsed = parseRomeSlot(date, hourSlot);
    if (!parsed) continue;

    const count = await countConfirmedForSlot(client, parsed.slotStart.toUTC().toISO());
    if (count < MAX_BOOKINGS_PER_SLOT) {
      alternatives.push({ date, hourSlot });
    }
  }

  return alternatives;
}

async function sendEmails({ bookingId, payload, slotStart, slotEnd }) {
  if (!resend) {
    return { warning: 'RESEND_API_KEY not configured. Emails were not sent.' };
  }

  const from = 'DIF Nails <onboarding@resend.dev>';
  const businessEmail = process.env.BUSINESS_EMAIL;
  const slotLabel = slotStart.setZone(SHOP_TZ).toFormat("dd/LL/yyyy 'alle' HH:mm");
  const icsContent = buildIcs({
    bookingId,
    service: payload.service,
    name: payload.name,
    phone: payload.phone,
    notes: payload.notes,
    slotStartUtc: slotStart,
    slotEndUtc: slotEnd
  });

  const attachments = [
    {
      filename: `booking-${bookingId}.ics`,
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8'
    }
  ];

  const customerHtml = `
    <p>Ciao ${payload.name},</p>
    <p>la tua prenotazione e confermata.</p>
    <p><strong>Riferimento:</strong> ${bookingId}<br>
    <strong>Servizio:</strong> ${payload.service}<br>
    <strong>Quando:</strong> ${slotLabel}<br>
    <strong>Telefono:</strong> ${payload.phone}</p>
    <p>A presto,<br>DIF Nails</p>
  `;

  const businessHtml = `
    <p>Nuova prenotazione confermata.</p>
    <p><strong>Riferimento:</strong> ${bookingId}<br>
    <strong>Nome:</strong> ${payload.name}<br>
    <strong>Email:</strong> ${payload.email}<br>
    <strong>Telefono:</strong> ${payload.phone}<br>
    <strong>Servizio:</strong> ${payload.service}<br>
    <strong>Quando:</strong> ${slotLabel}<br>
    <strong>Note:</strong> ${payload.notes || '-'}</p>
  `;

  const messages = [
    resend.emails.send({
      from,
      to: payload.email,
      subject: `Conferma prenotazione ${bookingId}`,
      html: customerHtml,
      attachments
    })
  ];

  if (businessEmail) {
    messages.push(
      resend.emails.send({
        from,
        to: businessEmail,
        subject: `Nuova prenotazione ${bookingId}`,
        html: businessHtml,
        attachments
      })
    );
  }

  await Promise.all(messages);
  return {};
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  if (!process.env.DATABASE_URL) {
    return sendJson(res, 500, { ok: false, error: 'DATABASE_URL is not configured' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const validationError = validatePayload(payload);
    if (validationError) {
      return sendJson(res, 400, { ok: false, error: validationError });
    }

    const parsed = parseRomeSlot(payload.date, payload.hourSlot);
    if (!parsed) {
      return sendJson(res, 400, { ok: false, error: 'Invalid date/hour slot for Europe/Rome timezone.' });
    }

    const slotStartUtc = parsed.slotStart.toUTC();
    const slotEndUtc = parsed.slotEnd.toUTC();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentCount = await countConfirmedForSlot(client, slotStartUtc.toISO());
      if (currentCount >= MAX_BOOKINGS_PER_SLOT) {
        await client.query('ROLLBACK');
        const selectedHour = Number(payload.hourSlot.slice(0, 2));
        const alternatives = await findAlternativeSlots(client, payload.date, selectedHour, 3);
        return sendJson(res, 409, { ok: false, error: 'Slot full', alternatives });
      }

      const insertResult = await client.query(
        `INSERT INTO bookings (name, phone, email, service, slot_start, slot_end, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed')
         RETURNING id`,
        [
          payload.name.trim(),
          payload.phone.trim(),
          payload.email.trim(),
          payload.service.trim(),
          slotStartUtc.toISO(),
          slotEndUtc.toISO(),
          payload.notes ? payload.notes.trim() : null
        ]
      );

      await client.query('COMMIT');

      const bookingId = insertResult.rows[0].id;
      let emailWarning;
      try {
        const emailResult = await sendEmails({
          bookingId,
          payload,
          slotStart: slotStartUtc,
          slotEnd: slotEndUtc
        });
        emailWarning = emailResult.warning;
      } catch (emailErr) {
        emailWarning = 'Booking saved, but confirmation email failed.';
      }

      const businessWaNumber = normalizePhoneForWhatsApp(process.env.BUSINESS_WHATSAPP_NUMBER);
      const waText = [
        'Ciao DIF Nails, confermo la mia prenotazione.',
        `Ref: ${bookingId}`,
        `Nome: ${payload.name}`,
        `Servizio: ${payload.service}`,
        `Data: ${payload.date}`,
        `Orario: ${payload.hourSlot}`
      ].join('\n');

      const whatsappUrl = businessWaNumber
        ? `https://wa.me/${businessWaNumber}?text=${encodeURIComponent(waText)}`
        : null;

      return sendJson(res, 200, {
        ok: true,
        bookingId,
        whatsappUrl,
        warning: emailWarning || null
      });
    } finally {
      client.release();
    }
  } catch (err) {
    return sendJson(res, 500, {
      ok: false,
      error: 'Internal server error'
    });
  }
};
