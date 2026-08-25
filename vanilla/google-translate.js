/**
 * Vanilla JavaScript Google Translate Module
 * 100% Free, Zero-Branding, Client-Side Translation
 */
(function (window, document) {
  'use strict';

  const DEFAULT_LANGUAGES = [
    { code: 'en', country: 'US', name: 'English' },
    { code: 'hi', country: 'IN', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', country: 'IN', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'te', country: 'IN', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mr', country: 'IN', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'ta', country: 'IN', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'gu', country: 'IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'kn', country: 'IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml', country: 'IN', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'pa', country: 'IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'ur', country: 'IN', name: 'Urdu', nativeName: 'اردو' }
  ];

  const GLOBE_SVG = `<svg class="gt-trigger-icon notranslate" translate="no" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  const CLOSE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  function getSavedLanguage() {
    const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z\-]+)/);
    return match ? match[1] : 'en';
  }

  function setLanguageCookie(langCode) {
    const hostname = window.location.hostname;
    const cookieValue = `/en/${langCode}`;
    
    // Set for current domain & root path
    document.cookie = `googtrans=${cookieValue}; path=/; max-age=31536000`;
    
    // Also set for apex domain if not on localhost/ip
    if (hostname && !hostname.match(/^(\d+\.){3}\d+$/) && hostname !== 'localhost') {
      const parts = hostname.split('.');
      if (parts.length > 1) {
        const rootDomain = '.' + parts.slice(-2).join('.');
        document.cookie = `googtrans=${cookieValue}; domain=${rootDomain}; path=/; max-age=31536000`;
      }
    }
  }

  function injectGoogleScript() {
    if (document.getElementById('google-translate-api-script')) return;

    // Create hidden translation container if not present
    if (!document.getElementById('google_translate_hidden_element')) {
      const hiddenDiv = document.createElement('div');
      hiddenDiv.id = 'google_translate_hidden_element';
      hiddenDiv.className = 'hidden-translate-engine notranslate';
      hiddenDiv.setAttribute('translate', 'no');
      document.body.appendChild(hiddenDiv);
    }

    // Define callback
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        },
        'google_translate_hidden_element'
      );
    };

    const script = document.createElement('script');
    script.id = 'google-translate-api-script';
    script.type = 'text/javascript';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  class GoogleTranslateWidget {
    constructor(options = {}) {
      this.languages = options.languages || DEFAULT_LANGUAGES;
      this.container = typeof options.container === 'string' 
        ? document.querySelector(options.container) 
        : (options.container || document.getElementById('google-translate-widget'));
      this.currentLang = getSavedLanguage();
      this.tempSelectedLang = this.currentLang;
      this.theme = options.theme || 'dark'; // 'light' or 'dark'

      this.init();
    }

    init() {
      injectGoogleScript();
      this.renderTrigger();
      this.renderModal();
      this.bindEvents();
    }

    getCurrentLangName() {
      const found = this.languages.find(l => l.code === this.currentLang);
      return found ? found.name : 'English';
    }

    renderTrigger() {
      if (!this.container) return;
      this.container.innerHTML = `
        <button type="button" class="gt-trigger-btn notranslate ${this.theme === 'light' ? 'light' : ''}" translate="no" aria-label="Select Language">
          ${GLOBE_SVG}
          <span class="gt-btn-text notranslate" translate="no">${this.getCurrentLangName()}</span>
        </button>
      `;
      this.triggerBtn = this.container.querySelector('.gt-trigger-btn');
    }

    renderModal() {
      // Check if modal already in DOM
      let backdrop = document.getElementById('gt-modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'gt-modal-backdrop';
        backdrop.className = 'gt-modal-backdrop notranslate';
        backdrop.setAttribute('translate', 'no');
        document.body.appendChild(backdrop);
      }
      this.modalBackdrop = backdrop;
      this.updateModalContent();
    }

    updateModalContent() {
      const cardsHtml = this.languages.map(lang => `
        <button type="button" class="gt-lang-card notranslate ${this.tempSelectedLang === lang.code ? 'selected' : ''}" translate="no" data-code="${lang.code}">
          <div class="gt-card-main-row notranslate" translate="no">
            <span class="gt-country-badge notranslate" translate="no">${lang.country}</span>
            <span class="gt-lang-name notranslate" translate="no">${lang.name}</span>
          </div>
          ${lang.nativeName ? `<span class="gt-native-name notranslate" translate="no">${lang.nativeName}</span>` : ''}
        </button>
      `).join('');

      this.modalBackdrop.innerHTML = `
        <div class="gt-modal-card notranslate" translate="no" role="dialog" aria-modal="true">
          <div class="gt-modal-header notranslate" translate="no">
            <div>
              <h2 class="gt-header-title notranslate" translate="no">Language Settings</h2>
              <p class="gt-header-subtitle notranslate" translate="no">Customize your viewing language</p>
            </div>
            <button type="button" class="gt-close-btn notranslate" translate="no" aria-label="Close">${CLOSE_SVG}</button>
          </div>
          <div class="gt-modal-body notranslate" translate="no">
            <div class="gt-section-header notranslate" translate="no">
              ${GLOBE_SVG}
              <span class="gt-section-title notranslate" translate="no">Select Preferred Language</span>
            </div>
            <div class="gt-languages-grid notranslate" translate="no">
              ${cardsHtml}
            </div>
          </div>
          <div class="gt-modal-footer notranslate" translate="no">
            <button type="button" class="gt-apply-btn notranslate" translate="no">Apply Language Change</button>
          </div>
        </div>
      `;
    }

    openModal() {
      this.tempSelectedLang = this.currentLang;
      this.updateModalContent();
      this.modalBackdrop.classList.add('gt-show');
      this.bindModalEvents();
    }

    closeModal() {
      this.modalBackdrop.classList.remove('gt-show');
    }

    bindEvents() {
      if (this.triggerBtn) {
        this.triggerBtn.addEventListener('click', () => this.openModal());
      }
    }

    bindModalEvents() {
      const closeBtn = this.modalBackdrop.querySelector('.gt-close-btn');
      const applyBtn = this.modalBackdrop.querySelector('.gt-apply-btn');
      const cards = this.modalBackdrop.querySelectorAll('.gt-lang-card');

      if (closeBtn) closeBtn.onclick = () => this.closeModal();
      
      this.modalBackdrop.onclick = (e) => {
        if (e.target === this.modalBackdrop) this.closeModal();
      };

      cards.forEach(card => {
        card.onclick = () => {
          this.tempSelectedLang = card.getAttribute('data-code');
          cards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        };
      });

      if (applyBtn) {
        applyBtn.onclick = () => this.applyLanguage(this.tempSelectedLang);
      }
    }

    applyLanguage(langCode) {
      this.currentLang = langCode;
      setLanguageCookie(langCode);
      this.closeModal();

      // Update Trigger text
      if (this.triggerBtn) {
        const textSpan = this.triggerBtn.querySelector('.gt-btn-text');
        if (textSpan) textSpan.textContent = this.getCurrentLangName();
      }

      // Trigger Google Combo change or reload DOM
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = langCode;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        window.location.reload();
      }
    }
  }

  // Global factory function
  window.initGoogleTranslate = function (options) {
    return new GoogleTranslateWidget(options);
  };

  // Auto-init on page load if default container exists
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('google-translate-widget')) {
      window.initGoogleTranslate({ container: '#google-translate-widget' });
    }
  });

})(window, document);
