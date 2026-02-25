
lucide.createIcons();


const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelectorAll('#mobile-menu a');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');

        const icon = mobileMenuBtn.querySelector('svg');
        if (mobileMenu.classList.contains('hidden')) {
            mobileMenuBtn.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
        } else {
            mobileMenuBtn.innerHTML = '<i data-lucide="x" class="w-6 h-6"></i>';
        }
        lucide.createIcons();
    });


    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
            lucide.createIcons();
        });
    });
}


const revealElements = document.querySelectorAll('.scroll-reveal');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Reveal only once
        }
    });
};

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach(el => revealObserver.observe(el));


const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('shadow-md', 'bg-white/95');
        navbar.classList.remove('bg-milk/90');
    } else {
        navbar.classList.remove('shadow-md', 'bg-white/95');
        navbar.classList.add('bg-milk/90');
    }
});


const langData = {
    it: {
        hero_title: 'Unghie impeccabili,<br>effetto <span class="italic text-gold">luxury</span>.',
        hero_subtitle: 'Igiene assoluta, tecnica perfetta e disponibilità anche last-minute. Il tuo momento di bellezza a Milano.',
        cta_whatsapp: 'Prenota su WhatsApp',
        cta_services: 'Vedi i Servizi',
        trust_clean: 'Pulitissimo & Igienizzato',
        trust_fast: 'Veloci & Puntuali',
        trust_prices: 'Prezzi Onesti',
        services_title: 'I Nostri Trattamenti',
        services_subtitle: 'Dalla manicure espressa ai trattamenti SPA. Utilizziamo solo prodotti certificati e sterilizzati.',
        why_title: 'Perché scegliere DIF Nails?',
        why_desc: 'Non siamo il solito salone. Crediamo che l\'igiene sia la base del lusso e che la velocità non debba mai compromettere la qualità. Ogni strumento viene sterilizzato in autoclave medica.',
        book_title: 'Prenota in 30 secondi'
    },
    en: {
        hero_title: 'Flawless nails,<br><span class="italic text-gold">luxury</span> effect.',
        hero_subtitle: 'Absolute hygiene, perfect technique, and last-minute availability. Your beauty moment in Milan.',
        cta_whatsapp: 'Book via WhatsApp',
        cta_services: 'View Services',
        trust_clean: 'Super Clean & Sanitized',
        trust_fast: 'Fast & Punctual',
        trust_prices: 'Honest Prices',
        services_title: 'Our Treatments',
        services_subtitle: 'From express manicures to SPA treatments. We use only certified and sterilized products.',
        why_title: 'Why choose DIF Nails?',
        why_desc: 'Not your usual salon. We believe hygiene is the foundation of luxury and speed should never compromise quality. Every tool is medical-grade sterilized.',
        book_title: 'Book in 30 seconds'
    }
};

let currentLang = 'it';
const langBtns = [document.getElementById('lang-switch'), document.getElementById('lang-switch-mobile')];

langBtns.forEach(btn => {
    if(!btn) return;
    btn.addEventListener('click', () => {
        currentLang = currentLang === 'it' ? 'en' : 'it';
        

        langBtns.forEach(b => {
             if(b.id === 'lang-switch') b.textContent = currentLang === 'it' ? 'EN' : 'IT';
             else b.textContent = currentLang === 'it' ? 'Switch to English' : 'Torna in Italiano';
        });


        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (langData[currentLang][key]) {
                el.innerHTML = langData[currentLang][key];
            }
        });
    });
});



const bookingForm = document.getElementById('booking-form');

if (bookingForm) {
    const bookingSubmitBtn = document.getElementById('booking-submit-btn');
    const bookingFeedback = document.getElementById('booking-feedback');
    const bookingResult = document.getElementById('booking-result');
    const bookingAlternatives = document.getElementById('booking-alternatives');
    const bookingAlternativeList = document.getElementById('booking-alternative-list');
    const bookingWhatsappBtn = document.getElementById('booking-whatsapp-btn');
    const initialSubmitText = bookingSubmitBtn ? bookingSubmitBtn.textContent : 'Invia Richiesta';

    const hideElement = (el) => {
        if (!el) return;
        el.classList.add('hidden');
    };

    const setFeedback = (message, kind = 'error') => {
        if (!bookingFeedback) return;
        bookingFeedback.className = 'rounded-lg px-4 py-3 text-sm';
        if (kind === 'success') {
            bookingFeedback.classList.add('bg-green-100', 'text-green-800');
        } else {
            bookingFeedback.classList.add('bg-red-100', 'text-red-800');
        }
        bookingFeedback.textContent = message;
        bookingFeedback.classList.remove('hidden');
    };

    const clearAlternatives = () => {
        if (!bookingAlternativeList) return;
        bookingAlternativeList.innerHTML = '';
        hideElement(bookingAlternatives);
    };

    const renderAlternatives = (alternatives) => {
        if (!Array.isArray(alternatives) || alternatives.length === 0 || !bookingAlternativeList || !bookingAlternatives) {
            clearAlternatives();
            return;
        }

        bookingAlternativeList.innerHTML = '';
        alternatives.forEach((slot) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'px-3 py-2 rounded-full text-xs font-medium border border-gold text-espresso hover:bg-gold hover:text-white transition-colors';
            button.textContent = `${slot.date} ${slot.hourSlot}`;
            button.addEventListener('click', () => {
                const dateInput = document.getElementById('booking-date');
                const hourInput = document.getElementById('booking-hour-slot');
                if (dateInput) dateInput.value = slot.date;
                if (hourInput) hourInput.value = slot.hourSlot;
            });
            bookingAlternativeList.appendChild(button);
        });
        bookingAlternatives.classList.remove('hidden');
    };

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        hideElement(bookingFeedback);
        hideElement(bookingResult);
        hideElement(bookingWhatsappBtn);
        clearAlternatives();

        if (!bookingForm.checkValidity()) {
            bookingForm.reportValidity();
            return;
        }

        const payload = {
            name: String(bookingForm.name.value || '').trim(),
            phone: String(bookingForm.phone.value || '').trim(),
            email: String(bookingForm.email.value || '').trim(),
            service: String(bookingForm.service.value || '').trim(),
            date: String(bookingForm.date.value || '').trim(),
            hourSlot: String(bookingForm.hourSlot.value || '').trim(),
            notes: String(bookingForm.notes.value || '').trim()
        };

        if (bookingSubmitBtn) {
            bookingSubmitBtn.disabled = true;
            bookingSubmitBtn.textContent = 'Invio in corso...';
        }

        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok || !result.ok) {
                if (response.status === 409 && Array.isArray(result.alternatives)) {
                    setFeedback(result.error || 'Lo slot selezionato non è disponibile.');
                    renderAlternatives(result.alternatives);
                } else {
                    setFeedback(result.error || 'Errore durante la prenotazione. Riprova.');
                }
                return;
            }

            setFeedback('Prenotazione confermata.', 'success');
            if (bookingResult) {
                bookingResult.innerHTML = `Riferimento prenotazione: <strong>${result.bookingId}</strong><br>${payload.date} alle ${payload.hourSlot} - ${payload.service}`;
                bookingResult.classList.remove('hidden');
            }

            if (bookingWhatsappBtn && result.whatsappUrl) {
                bookingWhatsappBtn.href = result.whatsappUrl;
                bookingWhatsappBtn.classList.remove('hidden');
            }

            bookingForm.reset();
        } catch (err) {
            setFeedback('Errore di rete. Verifica la connessione e riprova.');
        } finally {
            if (bookingSubmitBtn) {
                bookingSubmitBtn.disabled = false;
                bookingSubmitBtn.textContent = initialSubmitText;
            }
        }
    });
}
