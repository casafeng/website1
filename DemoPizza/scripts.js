document.addEventListener('DOMContentLoaded', () => {

    lucide.createIcons();


    gsap.registerPlugin(ScrollTrigger);


    gsap.from(".reveal-text", {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: 0.2
    });


    const nav = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });


    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const content = item.querySelector('.faq-content');
            const icon = item.querySelector('[data-lucide]');
            
            const isOpen = !content.classList.contains('hidden');
            

            document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.faq-item [data-lucide]').forEach(i => i.style.transform = 'rotate(0deg)');

            if (!isOpen) {
                content.classList.remove('hidden');
                icon.style.transform = 'rotate(45deg)';
                gsap.from(content, { opacity: 0, y: -10, duration: 0.3 });
            }
        });
    });


    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(bookingForm);
            const name = bookingForm.querySelector('input[type="text"]').value;
            const date = bookingForm.querySelector('input[type="date"]').value;
            const people = bookingForm.querySelector('input[type="number"]').value;
            

            const message = `Ciao Cirispaccio! Vorrei prenotare un tavolo a nome ${name} per il ${date} per ${people} persone.`;
            const encoded = encodeURIComponent(message);
            

            const btn = bookingForm.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Invio in corso...";
            btn.classList.add('opacity-50');
            
            setTimeout(() => {
                window.location.href = `https://wa.me/390123456789?text=${encoded}`;
                btn.innerText = originalText;
                btn.classList.remove('opacity-50');
            }, 800);
        });
    }


    gsap.utils.toArray('.group').forEach(card => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 90%",
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out"
        });
    });


    const marquee = document.querySelector('.marquee');
    if (marquee) {
        const content = marquee.innerHTML;
        marquee.innerHTML += content; 
    }
});
