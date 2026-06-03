/* Navigation */
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');

if (toggle && nav) {
  const setNavOpen = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
  };

  toggle.addEventListener('click', () => {
    setNavOpen(!nav.classList.contains('open'));
  });
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setNavOpen(false));
  });
}

/* Scroll reveal */
const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
if (revealEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

/* Contact form */
const form = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');
const formError = document.getElementById('form-error');

function validateContactForm() {
  const phone = form.querySelector('#form-phone')?.value.trim();
  const email = form.querySelector('#form-email')?.value.trim();
  const art = form.querySelector('[name=kontakt_art]:checked')?.value;

  if (!art) {
    return 'Bitte wählen Sie, wie Sie kontaktiert werden möchten.';
  }
  if ((art === 'Telefon' || art === 'WhatsApp') && !phone) {
    return 'Bitte geben Sie Ihre Telefonnummer an — für Telefon und WhatsApp ist sie erforderlich.';
  }
  if (art === 'E-Mail' && !email) {
    return 'Bitte geben Sie Ihre E-Mail-Adresse an.';
  }
  if (!phone && !email) {
    return 'Bitte geben Sie mindestens Telefon oder E-Mail an.';
  }
  return '';
}

if (form && formSuccess) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn.textContent;
    const errorMsg = validateContactForm();

    if (errorMsg) {
      if (formError) {
        formError.textContent = errorMsg;
        formError.classList.remove('hidden');
      }
      return;
    }

    formError?.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Wird gesendet…';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(form),
      });
      const data = await res.json();
      if (data.success) {
        form.classList.add('hidden');
        formSuccess.classList.remove('hidden');
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        form.reset();
      } else {
        throw new Error(data.message || 'Fehler');
      }
    } catch {
      btn.disabled = false;
      btn.textContent = originalText;
      if (formError) {
        formError.textContent = 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder rufen Sie mich direkt an.';
        formError.classList.remove('hidden');
      }
    }
  });
}

/* Testimonial slideshow */
function initTestimonialSlider() {
  const slider = document.getElementById('testimonial-slider');
  const track = document.getElementById('testimonial-track');
  const dotsWrap = document.getElementById('testimonial-dots');
  if (!slider || !track || !dotsWrap) return;

  const slides = [...track.querySelectorAll('.testimonial-slide')];
  const prevBtn = slider.querySelector('.testimonial-prev');
  const nextBtn = slider.querySelector('.testimonial-next');
  let index = 0;
  let timer = null;
  const interval = 6000;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'testimonial-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Rezension ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(dot);
  });

  const dots = [...dotsWrap.querySelectorAll('.testimonial-dot')];

  function goTo(i, manual = false) {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, n) => slide.classList.toggle('is-active', n === index));
    dots.forEach((dot, n) => {
      dot.classList.toggle('is-active', n === index);
      dot.setAttribute('aria-selected', n === index ? 'true' : 'false');
    });
    if (manual) restartAutoplay();
  }

  function next(manual = false) { goTo(index + 1, manual); }
  function prev(manual = false) { goTo(index - 1, manual); }

  function startAutoplay() {
    if (reducedMotion || slides.length < 2) return;
    timer = setInterval(next, interval);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  prevBtn?.addEventListener('click', () => prev(true));
  nextBtn?.addEventListener('click', () => next(true));

  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);
  slider.addEventListener('focusin', stopAutoplay);
  slider.addEventListener('focusout', startAutoplay);

  startAutoplay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestimonialSlider);
} else {
  initTestimonialSlider();
}
