# 🌐 Zero-Cost Real-Time Multi-Language Translation System

> **A 100% free, production-ready, client-side translation system for web applications (Angular, React, Vue, Next.js, Vite).**  
> Features a modern custom modal popup, full elimination of Google branding/sidebars/banners, and instant real-time DOM translation.

---

## 📌 Table of Contents
0. [⚡ Quick Installation (NPM / Submodule)](#-quick-installation)
1. [Core Features](#-core-features)
2. [How It Works (Under the Hood)](#-how-it-works-under-the-hood)
3. [The Secrets: Suppressing Google UI & Unwanted Sidebars](#-the-secrets-suppressing-google-ui--unwanted-sidebars)
4. [Preventing Modal Auto-Translation (notranslate)](#-preventing-modal-auto-translation-notranslate)
5. [Angular Integration Guide](#-angular-integration-guide)
6. [React / Vite / Next.js Integration Guide](#-react--vite--nextjs-integration-guide)
7. [Supported Languages Customization](#-supported-languages-customization)
8. [Full Integration Guide (INTEGRATION.md)](./INTEGRATION.md)
9. [File Structure in This Package](#-file-structure-in-this-package)

---

## ⚡ Quick Installation

You can install this package directly into any project without manual cloning:

```bash
# Direct NPM install via GitHub
npm install git+https://github.com/TitanXS75/Lang-translation.git

# Or add as a Git Submodule
git submodule add https://github.com/TitanXS75/Lang-translation.git src/shared/lang-translation
```

👉 See the complete [**INTEGRATION.md**](./INTEGRATION.md) for full React, Next.js, and Angular setup examples.

---

## ✨ Core Features

* **100% Free Forever**: Uses Google’s client-side Website Translator engine—**no API keys, no Google Cloud account, and no credit card required**.
* **Modern Custom UI**: Replaces the outdated default Google Translate dropdown with a sleek trigger button and a 3-column language card selection modal.
* **Zero Google Branding**: Removes all Google logos, "Powered by Google" badges, top banners, translation balloons, floating sidebars, and tooltip popups.
* **Persistent Choice**: Automatically persists user preferences via the `googtrans` cookie across page reloads and route transitions.
* **Hardcoded Settings Dialog**: Uses `translate="no"` and `class="notranslate"` so the language modal itself is never translated into broken text.
* **Multi-Framework Ready**: Full drop-in code templates provided for both **Angular** and **React / Next.js / Vite**.

---

## ⚙️ How It Works (Under the Hood)

```
+------------------------+       +------------------------------------+
|  User Clicks Trigger   | ----> | Opens Custom Modal (notranslate)   |
+------------------------+       +------------------------------------+
                                                   |
                                                   v
                                 +------------------------------------+
                                 | Selects Language Card (e.g. Hindi) |
                                 +------------------------------------+
                                                   |
                                                   v
+------------------------+       +------------------------------------+
|  Instant Realtime DOM  | <---- | Sets `googtrans=/en/hi` Cookie &   |
|  Language Translation  |       | Triggers Hidden Google Combo       |
+------------------------+       +------------------------------------+
```

1. **Hidden Translation Engine**:
   A hidden `<div>` with `id="google_translate_hidden_element"` is instantiated. The Google Translate script (`//translate.google.com/translate_a/element.js`) downloads asynchronously and initializes `new window.google.translate.TranslateElement(...)`.

2. **Custom Selection & Cookie Dispatch**:
   When the user selects a language (e.g., Marathi `mr` or Hindi `hi`) and clicks **Apply Language Change**:
   - For a foreign language: Sets `document.cookie = "googtrans=/en/${langCode}; path=/; domain=..."`.
   - For English (original): Clears the `googtrans` cookie by expiring it.
   - Triggers the hidden `.goog-te-combo` select element in the DOM (or reloads the window if initialized headlessly).

3. **Client-Side Translation**:
   Google’s script detects the cookie change, traverses all text nodes in the DOM, requests translations from Google’s translation CDN in the background, and dynamically replaces the text in real-time.

---

## 🛡️ The Secrets: Suppressing Google UI & Unwanted Sidebars

Google Translate normally injects intrusive elements:
- Top banner iframe (`.goog-te-banner-frame`) that pushes `body` down by 40px.
- Floating sidebar tabs (`.goog-te-ftab`, `iframe.goog-te-ftab-frame`).
- Translation tooltip balloons (`#goog-gt-tt`, `.goog-tooltip`).
- Google feedback modals (`.VIpgJd-ZVi9od-OR94Gd-PR6tc`).

### Global CSS Suppression Rules (Add to your global `styles.scss` or `index.css`):
```scss
/* 1. Prevent Layout Shifting on Body */
body {
  top: 0 !important;
  position: static !important;
}

/* 2. Completely eliminate all floating sidebars, banner frames, and tooltips */
.goog-te-banner-frame,
iframe.goog-te-banner-frame,
.goog-te-banner-frame.skiptranslate,
.goog-te-ftab-frame,
iframe.goog-te-ftab-frame,
.goog-te-ftab,
.goog-te-balloon-frame,
iframe.goog-te-balloon-frame,
#goog-gt-tt,
.goog-tooltip,
.goog-tooltip:hover,
.goog-text-highlight,
iframe[id^=":0.container"],
iframe[id^=":1.container"],
iframe[id^=":2.container"],
.VIpgJd-ZVi9od-OR94Gd-PR6tc,
iframe.VIpgJd-ZVi9od-OR94Gd-PR6tc,
.VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
.VIpgJd-ZVi9od-aZ2wEe-wOHMyf-ti6hGc,
.VIpgJd-y606eb-L7AdLc,
div.skiptranslate:not(.google-translate-container):not(.translate-widget),
.goog-logo-link,
.goog-logo-link:link,
.goog-logo-link:visited,
.goog-logo-link:hover,
.goog-logo-link:active,
.goog-te-gadget-icon {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  height: 0 !important;
  width: 0 !important;
  max-height: 0 !important;
  max-width: 0 !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
}

/* 3. Keep the translation engine completely off-screen */
#google_translate_hidden_element,
.hidden-translate-engine {
  display: none !important;
  visibility: hidden !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
}
```

---

## 🔒 Preventing Modal Auto-Translation (notranslate)

By default, Google Translate translates **everything** on the page. If the page translates to Hindi, the word "Settings" would turn to "सेटिंग्स", and language cards would be mangled.

**Solution**:
Add `class="notranslate"` and `translate="no"` to:
1. The Trigger button
2. The entire Modal Backdrop and Dialog Card
3. Every single language card and label

```html
<!-- Example of non-translatable container -->
<div class="modal-card notranslate" translate="no">
  <h1 class="notranslate" translate="no">Settings</h1>
  <button class="lang-card notranslate" translate="no">
    <span class="notranslate" translate="no">Hindi</span>
  </button>
</div>
```

---

## 🅰️ Angular Integration Guide

### Step 1: Copy Component Files
Copy the `angular/` folder files into your project:
* `src/app/components/google-translate/google-translate.component.ts`
* `src/app/components/google-translate/google-translate.component.html`
* `src/app/components/google-translate/google-translate.component.scss`

### Step 2: Add Global Suppression Styles
Add the rules from `angular/styles-override.scss` to your root `src/styles.scss`.

### Step 3: Insert into Navbar or Header
In your navigation component (e.g. `tab-bar.component.ts` or `header.component.ts`):
```typescript
import { GoogleTranslateComponent } from './components/google-translate/google-translate.component';

@Component({
  standalone: true,
  imports: [GoogleTranslateComponent, ...],
  ...
})
```
In template (`header.component.html`):
```html
<app-google-translate></app-google-translate>
```

---

## ⚛️ React / Vite / Next.js Integration Guide

### Step 1: Install Icons (if not already installed)
```bash
npm install lucide-react
```

### Step 2: Copy Component
Copy `react/GoogleTranslate.jsx` (or `.tsx`) into `src/components/GoogleTranslate.jsx`.

### Step 3: Add Global CSS
Add `react/global-override.css` to your `src/index.css` or `globals.css`.

### Step 4: Add to Navigation Header
```jsx
import GoogleTranslate from './components/GoogleTranslate';

export function Navbar() {
  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white border-b">
      <Logo />
      <div className="flex items-center gap-4">
        <GoogleTranslate />
      </div>
    </header>
  );
}
```

---

## 🌍 Supported Languages Customization

You can easily add, remove, or modify languages in the `SUPPORTED_LANGUAGES` array:

```typescript
export const SUPPORTED_LANGUAGES = [
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
  // Add international languages if needed:
  // { code: 'es', country: 'ES', name: 'Spanish', nativeName: 'Español' },
  // { code: 'fr', country: 'FR', name: 'French', nativeName: 'Français' },
  // { code: 'de', country: 'DE', name: 'German', nativeName: 'Deutsch' },
  // { code: 'ja', country: 'JP', name: 'Japanese', nativeName: '日本語' },
];
```

---

## 📂 File Structure in This Package

```
Lang-translation/
├── package.json                        <-- NPM Git package definition & export maps
├── INTEGRATION.md                      <-- Step-by-step setup for NPM & Submodules
├── README.md                           <-- Architecture & technical breakdown
├── angular/
│   ├── google-translate.component.ts   <-- Angular Standalone Component Logic
│   ├── google-translate.component.html <-- Custom Settings Modal Template
│   ├── google-translate.component.scss <-- Themed Styling (Light & Dark)
│   └── styles-override.scss            <-- Global Google Frame Suppressor
└── react/
    ├── GoogleTranslate.jsx             <-- React Drop-in Component
    ├── GoogleTranslate.tsx             <-- React TypeScript Component
    └── global-override.css             <-- Global CSS for React / Next.js / Vite
```
