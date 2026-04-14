// Premium interactions: nav toggle, smooth scroll, hero gallery, services slideshow,
// reveal fallback, contact form feedback, AOS + GLightbox init
(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.getElementById('site-nav');
  const header = document.querySelector('.site-header');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Lazy Loading for Hero Gallery Images
  const lazyLoadHeroImages = () => {
    const heroItems = document.querySelectorAll('.hero-gallery-item[data-bg]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const item = entry.target;
            const bgUrl = item.getAttribute('data-bg');
            
            // Preload image
            const img = new Image();
            img.onload = () => {
              item.style.backgroundImage = `url('${bgUrl}')`;
              item.removeAttribute('data-bg');
              item.classList.add('loaded');
            };
            img.src = bgUrl;
            
            observer.unobserve(item);
          }
        });
      }, {
        rootMargin: '50px' // Start loading 50px before visible
      });
      
      heroItems.forEach(item => imageObserver.observe(item));
    } else {
      // Fallback for older browsers
      heroItems.forEach(item => {
        const bgUrl = item.getAttribute('data-bg');
        item.style.backgroundImage = `url('${bgUrl}')`;
        item.removeAttribute('data-bg');
      });
    }
  };

  // Initialize lazy loading on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lazyLoadHeroImages);
  } else {
    lazyLoadHeroImages();
  }

  // Mobile Navigation Toggle
  if (navToggle && siteNav) {
    console.log('Navigation elements found, setting up mobile menu');
    console.log('Nav toggle element:', navToggle);
    console.log('Site nav element:', siteNav);
    
    // nav toggle click is handled by the consolidated handler further below
    
    // Close menu when clicking nav links
    const navLinks = siteNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!navToggle.contains(e.target) && !siteNav.contains(e.target)) {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  } else {
    console.log('Navigation elements not found:', {navToggle, siteNav});
  }

  // Header scroll effect
  if (header) {
    let lastScrollY = window.scrollY;
    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader(); // Initial call
  }

  // Hero Gallery Animation
  let heroGalleryIndex = 0;
  const galleryItems = document.querySelectorAll('.hero-gallery-item');
  function rotateGallery() {
    if (!galleryItems.length) return;
    galleryItems.forEach(item => item.classList.remove('active'));
    heroGalleryIndex = (heroGalleryIndex + 1) % galleryItems.length;
    galleryItems[heroGalleryIndex].classList.add('active');
  }
  if (galleryItems.length > 0) setInterval(rotateGallery, 4500);

  // Services Slideshow
  let currentSlideIndex = 0;
  const slides = document.querySelectorAll('.services-slide');
  const slideBtns = document.querySelectorAll('.slide-btn');

  window.showSlide = function(index) {
    slides.forEach(s => s.classList.remove('active'));
    slideBtns.forEach(b => b.classList.remove('active'));
    slides[index].classList.add('active');
    slideBtns[index].classList.add('active');
    currentSlideIndex = index;
  }
  window.changeSlide = function(direction) {
    const newIndex = (currentSlideIndex + direction + slides.length) % slides.length;
    window.showSlide(newIndex);
  }
  window.currentSlide = function(index) { window.showSlide(index - 1); }
  if (slides.length > 0) setInterval(() => changeSlide(1), 6500);

  // Gallery Slideshow
  let currentGallerySlideIndex = 0;
  const gallerySlides = document.querySelectorAll('.gallery-slide');
  const galleryBtns = document.querySelectorAll('.gallery-btn');

  window.showGallerySlide = function(index) {
    gallerySlides.forEach(s => s.classList.remove('active'));
    galleryBtns.forEach(b => b.classList.remove('active'));
    gallerySlides[index].classList.add('active');
    galleryBtns[index].classList.add('active');
    currentGallerySlideIndex = index;
  }
  window.changeGallerySlide = function(direction) {
    const newIndex = (currentGallerySlideIndex + direction + gallerySlides.length) % gallerySlides.length;
    window.showGallerySlide(newIndex);
  }
  window.currentGallerySlide = function(index) { window.showGallerySlide(index - 1); }
  if (gallerySlides.length > 0) setInterval(() => changeGallerySlide(1), 5000);

  // Qualifications Slideshow (for about page)
  let currentQualIndex = 0;
  const qualSlides = document.querySelectorAll('.qual-slide');
  const qualBtns = document.querySelectorAll('.qual-btn');

  window.showQualSlide = function(index) {
    qualSlides.forEach(s => s.classList.remove('active'));
    qualBtns.forEach(b => b.classList.remove('active'));
    if (qualSlides[index]) qualSlides[index].classList.add('active');
    if (qualBtns[index]) qualBtns[index].classList.add('active');
    currentQualIndex = index;
  }
  window.changeQualSlide = function(direction) {
    const newIndex = (currentQualIndex + direction + qualSlides.length) % qualSlides.length;
    window.showQualSlide(newIndex);
  }
  window.currentQualSlide = function(index) { window.showQualSlide(index - 1); }
  if (qualSlides.length > 0) setInterval(() => changeQualSlide(1), 4000);

  // Quotes Slideshow (for about page)
  let currentQuoteIndex = 0;
  const quoteSlides = document.querySelectorAll('.quote-slide');
  const quoteBtns = document.querySelectorAll('.quote-btn');

  window.showQuoteSlide = function(index) {
    quoteSlides.forEach(s => s.classList.remove('active'));
    quoteBtns.forEach(b => b.classList.remove('active'));
    if (quoteSlides[index]) quoteSlides[index].classList.add('active');
    if (quoteBtns[index]) quoteBtns[index].classList.add('active');
    currentQuoteIndex = index;
  }
  window.changeQuoteSlide = function(direction) {
    const newIndex = (currentQuoteIndex + direction + quoteSlides.length) % quoteSlides.length;
    window.showQuoteSlide(newIndex);
  }
  window.currentQuoteSlide = function(index) { window.showQuoteSlide(index - 1); }
  if (quoteSlides.length > 0) setInterval(() => changeQuoteSlide(1), 8000);

  // Mobile nav toggle
  function closeNav(){ siteNav.classList.remove('open'); navToggle?.setAttribute('aria-expanded','false'); }
  function openNav(){ siteNav.classList.add('open'); navToggle?.setAttribute('aria-expanded','true'); }
  navToggle?.addEventListener('click', () => {
    const isOpen = siteNav.classList.contains('open');
    isOpen ? closeNav() : openNav();
  });
  siteNav?.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', closeNav));

  // Smooth scroll offset for sticky header
  const headerHeight = () => header?.offsetHeight || 0;
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#' || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - (headerHeight() + 8);
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.pushState(null, '', hash);
    });
  });

  // Header style on scroll
  const onScroll = () => {
    const scrolled = window.scrollY > 6;
    header?.classList.toggle('scrolled', scrolled);
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Reveal fallback
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => obs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  // Contact form handling with Web3Forms (new flow)
  const form = document.getElementById('form') || document.getElementById('contactForm');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (form && submitBtn) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      formData.set('access_key', '0697e1bf-0224-41c9-b952-bf80dea963ef');

      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          alert('Success! Your message has been sent.');
          form.reset();
        } else {
          alert('Error: ' + data.message);
        }

      } catch (error) {
        alert('Something went wrong. Please try again.');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // Success Modal Function
  function showSuccessModal() {
    const modal = document.getElementById('successModal');
    const countdownEl = document.getElementById('countdown');
    
    if (!modal) return;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Countdown and redirect
    let countdown = 3;
    countdownEl.textContent = countdown;
    
    const countdownInterval = setInterval(() => {
      countdown--;
      countdownEl.textContent = countdown;
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        window.location.href = 'index.html';
      }
    }, 1000);
  }

  // Init AOS (if loaded)
  window.addEventListener('DOMContentLoaded', () => {
    if (window.AOS) AOS.init({ once: true, duration: 700, easing: 'ease-out-cubic' });
    if (window.GLightbox) GLightbox({ selector: '.glightbox' });
  });
})();

// Contact Form: Prefilled messages based on prescription selection
(function () {
  const prescriptionSelect = document.getElementById('prescription');
  const concernSelect = document.getElementById('anliegen');
  const nameInput = document.getElementById('name');
  const messageTextarea = document.getElementById('message');

  if (!prescriptionSelect || !concernSelect || !messageTextarea) return;

  let lastAutoTemplate = '';

  function buildTemplate() {
    const prescriptionValue = (prescriptionSelect.value || '').toLowerCase();
    const hasPrescription = prescriptionValue.includes('ja');
    const concernValue = (concernSelect.value || '').toLowerCase();
    const isAppointment = concernValue.includes('termin');
    const name = (nameInput?.value || '').trim();

    const greeting = 'Guten Tag,';
    const signature = name ? `Mit freundlichen Grüßen\n${name}` : 'Mit freundlichen Grüßen';

    if (isAppointment) {
      const prescriptionLine = hasPrescription
        ? 'Ich habe bereits ein Rezept.'
        : 'Ich habe noch kein Rezept. Bitte teilen Sie mir mit, wie ich am besten vorgehen soll.';

      return `${greeting}\n\nich benötige einen Termin. ${prescriptionLine}\n\n${signature}`;
    }

    // Allgemeine Frage
    const prescriptionNote = hasPrescription ? 'Rezept vorhanden.' : 'Rezept nicht vorhanden.';
    return `${greeting}\n\nich habe eine allgemeine Frage und bitte um Rückmeldung.\n\n${prescriptionNote}\n\n${signature}`;
  }

  function applyTemplateFromSelection() {
    const nextTemplate = buildTemplate();

    const current = messageTextarea.value.trim();
    const canAutofill = current.length === 0 || current === lastAutoTemplate;

    if (canAutofill) {
      messageTextarea.value = nextTemplate;
      lastAutoTemplate = nextTemplate;
    }
  }

  prescriptionSelect.addEventListener('change', applyTemplateFromSelection);
  concernSelect.addEventListener('change', applyTemplateFromSelection);
  if (nameInput) nameInput.addEventListener('input', applyTemplateFromSelection);
  applyTemplateFromSelection();
})();

// FAQ Toggle Function for Index Page
function toggleFAQ(button) {
  const faqItem = button.parentElement;
  const answer = faqItem.querySelector('.faq-answer');
  const icon = button.querySelector('.faq-icon');
  const isActive = faqItem.classList.contains('active');
  
  // Close all other FAQs
  document.querySelectorAll('.faq-item').forEach(item => {
    if (item !== faqItem) {
      item.classList.remove('active');
      const otherAnswer = item.querySelector('.faq-answer');
      const otherIcon = item.querySelector('.faq-icon');
      if (otherAnswer) otherAnswer.style.maxHeight = null;
      if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
    }
  });
  
  // Toggle current FAQ
  if (isActive) {
    faqItem.classList.remove('active');
    answer.style.maxHeight = null;
    icon.style.transform = 'rotate(0deg)';
  } else {
    faqItem.classList.add('active');
    answer.style.maxHeight = (answer.scrollHeight + 50) + 'px';
    icon.style.transform = 'rotate(180deg)';
  }
}

(function () {
  if (typeof window === 'undefined' || window.location.protocol === 'file:') return;

  const path = window.location.pathname.toLowerCase();
  if (path.endsWith('/datenschutz.html') || path.endsWith('/impressum.html')) return;

  const endpoint = '/api/chatbot';
  const quickQuestions = [
    'Welches Paket passt bei Pflegegrad?',
    'Was kostet Angehörigen-Entlastung?',
    'Wie läuft Hilfe nach dem Krankenhaus ab?',
    'Wie kann ich Kontakt aufnehmen?'
  ];

  const state = {
    open: false,
    busy: false,
    history: [],
  };

  let shell;
  let messagesEl;
  let inputEl;
  let submitEl;
  let toggleEl;

  const contactActions = {
    contact: { label: 'Kontaktseite', href: 'kontakt.html', icon: 'fa-regular fa-envelope' },
    whatsapp: { label: 'WhatsApp', href: 'https://wa.me/4915226560105?text=Hallo,%20ich%20interessiere%20mich%20f%C3%BCr%20Case%20Management%20und%20Alltagsbegleitung.', icon: 'fa-brands fa-whatsapp' },
    phone: { label: 'Anrufen', href: 'tel:+4915226560105', icon: 'fa-solid fa-phone' },
    email: { label: 'E-Mail', href: 'mailto:casekompass@gmx.de', icon: 'fa-regular fa-envelope-open' },
  };

  function includesAny(text, needles) {
    return needles.some((needle) => text.includes(needle));
  }

  function localChatFallback(message) {
    const text = String(message || '').toLowerCase();

    if (includesAny(text, ['pflegegrad', 'begutachtung', 'md', 'einstufung', 'widerspruch'])) {
      return 'Zum Thema Pflegegrad passt meist das Pflegegrad-Startpaket für 199 Euro. Es umfasst ein Erstgespräch, einen Unterlagen-Check und die Vorbereitung auf die Begutachtung. Details finden Sie auf der Detailseite oder über die Kontaktseite.';
    }

    if (includesAny(text, ['angehörig', 'angehoerig', 'entlastung', 'überfordert', 'ueberfordert'])) {
      return 'Dafür passt meist das Paket Angehörigen-Entlastung für 249 Euro. Es enthält ein Orientierungsgespräch, einen Struktur- und Maßnahmenplan und einen kurzen Nachfasskontakt.';
    }

    if (includesAny(text, ['krankenhaus', 'reha', 'entlassung'])) {
      return 'Wenn nach Krankenhaus oder Reha unklar ist, wie es zuhause weitergeht, passt das Paket Nach Krankenhaus wieder zuhause für 349 Euro. Es umfasst ein Aufnahmegespräch, einen Versorgungsplan und eine Checkliste für die ersten Tage.';
    }

    if (includesAny(text, ['umbau', 'wohnraumanpassung', 'zuschuss'])) {
      return 'Für dieses Thema passt das Paket Wohnraumanpassung & Umbauzuschuss für 279 Euro. Es unterstützt bei Analyse, Unterlagen und Vorbereitung des Zuschussantrags.';
    }

    if (includesAny(text, ['pflegekasse', 'entlastungsbetrag', 'pflegehilfsmittel', 'leistungen'])) {
      return 'Dafür passt meist der Pflegekassen-Leistungen-Check für 179 Euro. Er zeigt, welche Leistungen möglich sind und welche Schritte jetzt sinnvoll sind.';
    }

    if (includesAny(text, ['alltagsbegleitung', 'alltag', 'begleitung'])) {
      return 'Für Unterstützung im Alltag passt das Alltagsbegleitung zuhause - Startpaket für 159 Euro. Es enthält ein Vorgespräch, 4 Stunden Alltagsbegleitung und eine erste Einschätzung des weiteren Bedarfs.';
    }

    if (includesAny(text, ['kontakt', 'telefon', 'whatsapp', 'termin', 'anrufen', 'mail', 'email'])) {
      return 'Sie können mich hier kontaktieren:';
    }

    return 'Ich kann Fragen zu Pflegegrad, Angehörigen-Entlastung, Hilfe nach dem Krankenhaus, Wohnraumanpassung, Pflegekassen-Leistungen, Alltagsbegleitung, Preisen und Kontakt beantworten. Beschreiben Sie kurz Ihre Situation, dann nenne ich das passende Paket.';
  }

  function extractActions(text) {
    const normalized = String(text || '');
    const actions = [];

    if (normalized.includes('kontakt.html') || /kontaktseite|kontakt aufnehmen|kontakt/i.test(normalized)) {
      actions.push(contactActions.contact);
    }
    if (normalized.includes('wa.me/') || /whatsapp/i.test(normalized)) {
      actions.push(contactActions.whatsapp);
    }
    if (normalized.includes('015226560105') || /telefonisch|anrufen|telefon/i.test(normalized)) {
      actions.push(contactActions.phone);
    }
    if (normalized.includes('casekompass@gmx.de') || /e-mail|email/i.test(normalized)) {
      actions.push(contactActions.email);
    }

    return actions.filter((action, index, array) => array.findIndex((item) => item.href === action.href) === index);
  }

  function sanitizeBotText(text, actions) {
    const normalized = String(text || '');

    if (actions?.length && (/kontakt\.html|wa\.me\/|casekompass@gmx\.de|015226560105/i.test(normalized) || /kontaktseite|whatsapp|telefon|e-mail|email/i.test(normalized))) {
      return 'Sie können mich hier kontaktieren:';
    }

    return normalized
      .replace(/https:\/\/wa\.me\/[^\s]+/gi, 'WhatsApp')
      .replace(/kontakt\.html/gi, 'Kontaktseite')
      .replace(/casekompass@gmx\.de/gi, 'E-Mail')
      .replace(/\b015226560105\b/g, 'Telefon')
      .trim();
  }

  function buildMessageActions(actions) {
    if (!actions.length) return null;

    const wrap = document.createElement('div');
    wrap.className = 'chatbot-message-actions';

    actions.forEach((action) => {
      const link = document.createElement('a');
      link.className = 'chatbot-action-button';
      link.href = action.href;
      link.innerHTML = `<i class="${action.icon}" aria-hidden="true"></i><span>${action.label}</span>`;

      if (/^https?:/i.test(action.href)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      wrap.appendChild(link);
    });

    return wrap;
  }

  function createMessage(role, text, options) {
    const node = document.createElement('div');
    node.className = `chatbot-message ${role}`;
    if (options?.loading) node.classList.add('is-loading');

    const body = document.createElement('div');
    body.className = 'chatbot-message-body';

    if (role === 'bot' && !options?.loading) {
      const actions = buildMessageActions(extractActions(text));
      body.textContent = sanitizeBotText(text, extractActions(text));
      node.appendChild(body);
      if (actions) node.appendChild(actions);
      return node;
    }

    body.textContent = text;
    node.appendChild(body);
    return node;
  }

  function scrollMessagesToBottom() {
    if (!messagesEl) return;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(role, text, options) {
    const node = createMessage(role, text, options);
    messagesEl.appendChild(node);
    scrollMessagesToBottom();
    return node;
  }

  function renderHistory() {
    messagesEl.innerHTML = '';

    if (!state.history.length) {
      appendMessage('bot', 'Hallo. Ich beantworte Fragen zu den Leistungen, Paketen, Preisen und Kontaktmöglichkeiten von casekompass.de.');
      renderSuggestions();
      return;
    }

    state.history.forEach((entry) => {
      appendMessage(entry.role === 'assistant' ? 'bot' : 'user', entry.content);
    });
  }

  function renderSuggestions() {
    const wrap = document.createElement('div');
    wrap.className = 'chatbot-suggestions';

    quickQuestions.forEach((question) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chatbot-chip';
      button.textContent = question;
      button.addEventListener('click', () => sendMessage(question));
      wrap.appendChild(button);
    });

    messagesEl.appendChild(wrap);
    scrollMessagesToBottom();
  }

  function setBusy(isBusy) {
    state.busy = isBusy;
    submitEl.disabled = isBusy;
    inputEl.disabled = isBusy;
    submitEl.textContent = isBusy ? 'Senden...' : 'Senden';
  }

  function toggleChat(forceOpen) {
    state.open = typeof forceOpen === 'boolean' ? forceOpen : !state.open;
    shell.classList.toggle('is-open', state.open);
    toggleEl.setAttribute('aria-expanded', String(state.open));
    toggleEl.setAttribute('aria-label', state.open ? 'KI-Assistent schließen' : 'KI-Assistent öffnen');

    if (state.open) {
      window.setTimeout(() => inputEl.focus(), 80);
      scrollMessagesToBottom();
    }
  }

  async function sendMessage(prefill) {
    if (state.busy) return;

    const text = (typeof prefill === 'string' ? prefill : inputEl.value).trim();
    if (!text) return;

    if (!state.open) toggleChat(true);

    state.history.push({ role: 'user', content: text });
    renderHistory();

    if (!prefill) inputEl.value = '';

    setBusy(true);
    const loadingNode = appendMessage('bot', 'Ich prüfe gerade die passenden Leistungen ...', { loading: true });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: state.history.slice(-8, -1),
        }),
      });

      const data = await response.json().catch(() => ({}));
      loadingNode.remove();

      if (!response.ok || !data?.answer) {
        throw new Error(data?.message || 'Chatbot nicht erreichbar');
      }

      state.history.push({ role: 'assistant', content: data.answer });
      renderHistory();
    } catch (error) {
      loadingNode.remove();
      const fallback = localChatFallback(text);
      state.history.push({ role: 'assistant', content: fallback });
      renderHistory();
    } finally {
      setBusy(false);
    }
  }

  function buildWidget() {
    toggleEl = document.createElement('button');
    toggleEl.type = 'button';
    toggleEl.className = 'chatbot-toggle';
    toggleEl.setAttribute('aria-label', 'KI-Assistent öffnen');
    toggleEl.setAttribute('aria-expanded', 'false');
    toggleEl.innerHTML = '<span class="chatbot-toggle-badge" aria-hidden="true"><i class="fa-solid fa-robot"></i></span>';

    shell = document.createElement('section');
    shell.className = 'chatbot-shell';
    shell.setAttribute('aria-label', 'Chatbot für Leistungen');
    shell.innerHTML = `
      <div class="chatbot-header">
        <div>
          <h2 class="chatbot-title">KI-Assistent</h2>
          <p class="chatbot-subtitle">Fragen zu Leistungen, Paketen und Kontakt.</p>
        </div>
        <button type="button" class="chatbot-close" aria-label="KI-Assistent schließen">×</button>
      </div>
      <div class="chatbot-messages"></div>
      <form class="chatbot-form">
        <div class="chatbot-input-row">
          <textarea class="chatbot-input" rows="2" maxlength="500" placeholder="Stellen Sie eine Frage zu unseren Leistungen ..."></textarea>
          <button class="chatbot-submit" type="submit">Senden</button>
        </div>
        <p class="chatbot-note">Der Chat beantwortet nur Fragen zu den Leistungen von casekompass.de.</p>
      </form>
    `;

    document.body.appendChild(shell);
    document.body.appendChild(toggleEl);

    messagesEl = shell.querySelector('.chatbot-messages');
    inputEl = shell.querySelector('.chatbot-input');
    submitEl = shell.querySelector('.chatbot-submit');

    shell.querySelector('.chatbot-close').addEventListener('click', () => toggleChat(false));
    toggleEl.addEventListener('click', () => toggleChat());

    shell.querySelector('.chatbot-form').addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage();
    });

    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    renderHistory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();