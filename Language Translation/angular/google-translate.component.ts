import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface LanguageOption {
  code: string;
  country: string;
  name: string;
  nativeName?: string;
}

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

@Component({
  selector: 'app-google-translate',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './google-translate.component.html',
  styleUrl: './google-translate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleTranslateComponent implements OnInit {
  readonly isModalOpen = signal(false);
  readonly currentLang = signal('en');
  readonly tempSelectedLang = signal('en');

  readonly languages: LanguageOption[] = [
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
  ];

  ngOnInit(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const savedLang = this.getSavedLanguage();
    this.currentLang.set(savedLang);
    this.tempSelectedLang.set(savedLang);

    // Initialize hidden Google Translate engine
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: this.languages.map((l) => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_hidden_element'
        );
      }
    };

    if (!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: this.languages.map((l) => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_hidden_element'
        );
      } catch {
        // Element already initialized
      }
    }
  }

  openModal(): void {
    this.tempSelectedLang.set(this.currentLang());
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  selectTempLanguage(code: string): void {
    this.tempSelectedLang.set(code);
  }

  applyLanguage(): void {
    const selected = this.tempSelectedLang();
    const current = this.currentLang();

    this.currentLang.set(selected);
    this.closeModal();

    if (selected === current) {
      return;
    }

    const domain = window.location.hostname;

    if (selected === 'en') {
      // Clear translation cookies to restore original English
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      if (domain.includes('.')) {
        const rootDomain = domain.split('.').slice(-2).join('.');
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`;
      }
    } else {
      // Set googtrans cookie for target language
      document.cookie = `googtrans=/en/${selected}; path=/;`;
      document.cookie = `googtrans=/en/${selected}; path=/; domain=${domain};`;
      if (domain.includes('.')) {
        const rootDomain = domain.split('.').slice(-2).join('.');
        document.cookie = `googtrans=/en/${selected}; path=/; domain=.${rootDomain};`;
      }
    }

    // Trigger instant DOM translation via combo without page reload
    const triggerCombo = (attempts = 0): void => {
      let combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (!combo) {
        const hidden = document.getElementById('google_translate_hidden_element');
        if (hidden) combo = hidden.querySelector('select');
      }

      if (combo) {
        if (selected === 'en') {
          let defaultVal = '';
          for (let i = 0; i < combo.options.length; i++) {
            const val = combo.options[i].value;
            if (val === '' || val === 'en' || val === 'auto') {
              defaultVal = val;
              break;
            }
          }
          combo.value = defaultVal;
        } else {
          combo.value = selected;
        }
        combo.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }

      if (attempts < 25) {
        setTimeout(() => triggerCombo(attempts + 1), 100);
      }
    };

    triggerCombo();
  }

  getCurrentLanguageName(): string {
    const found = this.languages.find((l) => l.code === this.currentLang());
    return found ? found.name : 'Language';
  }

  private getSavedLanguage(): string {
    if (typeof document === 'undefined') return 'en';
    const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z\-]+)/);
    return match ? match[1] : 'en';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isModalOpen()) {
      this.closeModal();
    }
  }
}
