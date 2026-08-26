# 🚀 Quick Integration Guide

Use this translation system in your projects using **NPM**, **Git Submodule**, or **Direct HTML/CSS/JS**.

---

## ⚡ Method 1: Install via NPM (React / Angular / Bundlers)

### 1. Install
```bash
npm install git+https://github.com/TitanXS75/Lang-translation.git
```
*(For React, also ensure `npm install lucide-react` is installed).*

### 2. Usage

#### ⚛️ React / Vite / Next.js
```tsx
import 'lang-translation/styles.css';
import { GoogleTranslate } from 'lang-translation';

export default function Header() {
  return (
    <nav>
      <GoogleTranslate />
    </nav>
  );
}
```

#### 🅰️ Angular
1. In `src/styles.scss`:
```scss
@import "lang-translation/angular/styles-override.scss";
```
2. In your component:
```typescript
import { Component } from '@angular/core';
import { GoogleTranslateComponent } from 'lang-translation/angular';

@Component({
  standalone: true,
  imports: [GoogleTranslateComponent],
  template: `<app-google-translate></app-google-translate>`
})
export class NavbarComponent {}
```

---

## 🌐 Method 2: Pure HTML / CSS / Vanilla JS Website

No framework required! Works on any static HTML, WordPress, PHP, or Laravel website.

### 1. Copy or Link the 2 Files
Copy [`vanilla/google-translate.css`](./vanilla/google-translate.css) and [`vanilla/google-translate.js`](./vanilla/google-translate.js) into your project.

### 2. Add to your HTML Page
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- 1. Include CSS in <head> -->
  <link rel="stylesheet" href="./google-translate.css">
</head>
<body>

  <header>
    <!-- 2. Drop the trigger container anywhere in your navbar -->
    <div id="google-translate-widget"></div>
  </header>

  <!-- 3. Include Script at the end of <body> (Auto-initializes) -->
  <script src="./google-translate.js"></script>
</body>
</html>
```

---

## 🔄 Method 3: Git Submodule (Source Sync)

### 1. Add Submodule
```bash
git submodule add https://github.com/TitanXS75/Lang-translation.git src/shared/lang-translation
```

### 2. Usage
* **HTML/CSS**: Link `src/shared/lang-translation/vanilla/google-translate.css` and `.js`.
* **React**: Import from `./shared/lang-translation/react/GoogleTranslate`.
* **Angular**: Import from `./shared/lang-translation/angular/google-translate.component`.

---

## 🔁 Updating to Latest

* **NPM**: `npm update lang-translation`
* **Submodule**: `git submodule update --remote --merge`
