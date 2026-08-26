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
    { code: 'ur', country: 'IN', name: 'Urdu', nativeName: 'اردو' },
    { code: 'es', country: 'ES', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', country: 'FR', name: 'French', nativeName: 'Français' },
    { code: 'de', country: 'DE', name: 'German', nativeName: 'Deutsch' },
    { code: 'ja', country: 'JP', name: 'Japanese', nativeName: '日本語' },
    { code: 'ar', country: 'SA', name: 'Arabic', nativeName: 'العربية' }
  ];

  const GLOBE_SVG = `<svg class="gt-trigger-icon notranslate" translate="no" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  const CLOSE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  function getSavedLanguage() {
    if (typeof document === 'undefined') return 'en';
    const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!match) return 'en';
    const val = decodeURIComponent(match[1]);
    const parts = val.split('/');
    return parts[parts.length - 1] || 'en';
  }

  function setLanguageCookie(langCode) {
    const hostname = window.location.hostname;
    
    if (langCode === 'en') {
      // Clear cookie to reset to original language
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;';
      if (hostname && hostname !== 'localhost') {
        const parts = hostname.split('.');
        if (parts.length > 1) {
          const apex = '.' + parts.slice(-2).join('.');
          document.cookie = `googtrans=; domain=${apex}; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
        }
        document.cookie = `googtrans=; domain=.${hostname}; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      }
    } else {
      const cookieVal = `/en/${langCode}`;
      document.cookie = `googtrans=${cookieVal}; path=/; max-age=31536000; SameSite=Lax`;
      if (hostname && !hostname.match(/^(\d+\.){3}\d+$/) && hostname !== 'localhost') {
        const parts = hostname.split('.');
        if (parts.length > 1) {
          const apex = '.' + parts.slice(-2).join('.');
          document.cookie = `googtrans=${cookieVal}; domain=${apex}; path=/; max-age=31536000; SameSite=Lax`;
        }
        document.cookie = `googtrans=${cookieVal}; domain=.${hostname}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }

  function triggerGoogleCombo(langCode) {
    let combo = document.querySelector('.goog-te-combo');
    if (!combo) {
      const hidden = document.getElementById('google_translate_hidden_element');
      if (hidden) combo = hidden.querySelector('select');
    }
    if (!combo || !combo.options || combo.options.length <= 1) {
      return false;
    }

    let targetIndex = -1;
    let targetValue = '';

    if (langCode === 'en') {
      for (let i = 0; i < combo.options.length; i++) {
        const val = combo.options[i].value;
        if (val === '' || val === 'en' || val === 'auto') {
          targetIndex = i;
          targetValue = val;
          break;
        }
      }
      if (targetIndex === -1) {
        targetIndex = 0;
        targetValue = combo.options[0].value;
      }
    } else {
      for (let i = 0; i < combo.options.length; i++) {
        const val = combo.options[i].value;
        if (val.toLowerCase() === langCode.toLowerCase()) {
          targetIndex = i;
          targetValue = val;
          break;
        }
      }
    }

    if (targetIndex === -1) {
      return false;
    }

    combo.selectedIndex = targetIndex;
    combo.value = targetValue;

    combo.dispatchEvent(new Event('change', { bubbles: true }));
    combo.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof combo.onchange === 'function') {
      try { combo.onchange(); } catch (e) {}
    }

    if (langCode === 'en') {
      try {
        const bannerFrame = document.querySelector('.goog-te-banner-frame');
        if (bannerFrame && bannerFrame.contentDocument) {
          const closeBtn = bannerFrame.contentDocument.querySelector('.goog-close-link');
          if (closeBtn) closeBtn.click();
        }
      } catch (e) {}
    }

    return true;
  }

  function injectGoogleScript() {
    // 1. Ensure hidden translation element exists in body
    if (!document.getElementById('google_translate_hidden_element')) {
      const hiddenDiv = document.createElement('div');
      hiddenDiv.id = 'google_translate_hidden_element';
      hiddenDiv.className = 'hidden-translate-engine notranslate';
      hiddenDiv.setAttribute('translate', 'no');
      document.body.appendChild(hiddenDiv);
    }

    // 2. Define global callback
    window.googleTranslateElementInit = function () {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            autoDisplay: false
          },
          'google_translate_hidden_element'
        );
      } catch (e) {
        console.warn('Google translate init warning:', e);
      }
    };

    // 3. Inject script if not already added
    if (!document.getElementById('google-translate-api-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-api-script';
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }
  }

  class GoogleTranslateWidget {
    constructor(options = {}) {
      this.languages = options.languages || DEFAULT_LANGUAGES;
      this.container = typeof options.container === 'string' 
        ? document.querySelector(options.container) 
        : (options.container || document.getElementById('google-translate-widget'));
      this.currentLang = getSavedLanguage();
      this.tempSelectedLang = this.currentLang;
      this.theme = options.theme || 'dark';

      this.init();
    }

    init() {
      injectGoogleScript();
      this.renderTrigger();
      this.renderModal();
      this.bindEvents();

      // If user had previously selected a non-English language, apply it when Google Translate is ready
      if (this.currentLang && this.currentLang !== 'en') {
        let initAttempts = 0;
        const initPoll = () => {
          const success = triggerGoogleCombo(this.currentLang);
          if (!success && initAttempts < 60) {
            initAttempts++;
            setTimeout(initPoll, 100);
          }
        };
        initPoll();
      }
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
              <p class="gt-header-subtitle notranslate" translate="no">Customize your preferred language</p>
            </div>
            <button type="button" class="gt-close-btn notranslate" translate="no" aria-label="Close">${CLOSE_SVG}</button>
          </div>
          <div class="gt-modal-body notranslate" translate="no">
            <div class="gt-section-header notranslate" translate="no">
              ${GLOBE_SVG}
              <span class="gt-section-title notranslate" translate="no">Select Language</span>
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

      // Update button text
      if (this.triggerBtn) {
        const textSpan = this.triggerBtn.querySelector('.gt-btn-text');
        if (textSpan) textSpan.textContent = this.getCurrentLangName();
      }

      // Smooth trigger combo directly without any window.location.reload()
      let attempts = 0;
      const executeTrigger = () => {
        const success = triggerGoogleCombo(langCode);
        if (!success && attempts < 60) {
          attempts++;
          setTimeout(executeTrigger, 100);
        }
      };
      executeTrigger();
    }
  }

  // Global factory function
  window.initGoogleTranslate = function (options) {
    return new GoogleTranslateWidget(options);
  };

  // Auto-init on page load if default container exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('google-translate-widget')) {
        window.initGoogleTranslate({ container: '#google-translate-widget' });
      }
    });
  } else {
    if (document.getElementById('google-translate-widget')) {
      window.initGoogleTranslate({ container: '#google-translate-widget' });
    }
  }

})(window, document);
