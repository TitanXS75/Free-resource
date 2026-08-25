# 🚀 Quick Integration Guide

Use this component in your projects using **NPM** or **Git Submodule**.

---

## ⚡ Method 1: Install via NPM (Easiest)

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

## 🔄 Method 2: Git Submodule (Source Sync)

### 1. Add Submodule
```bash
git submodule add https://github.com/TitanXS75/Lang-translation.git src/shared/lang-translation
```

### 2. Usage

#### ⚛️ React
```tsx
import './shared/lang-translation/react/global-override.css';
import { GoogleTranslate } from './shared/lang-translation/react/GoogleTranslate';

<GoogleTranslate />
```

#### 🅰️ Angular
```scss
// in styles.scss:
@import "./shared/lang-translation/angular/styles-override.scss";
```
```typescript
// in component:
import { GoogleTranslateComponent } from './shared/lang-translation/angular/google-translate.component';
```

---

## 🔁 Updating to Latest

* **NPM**: `npm update lang-translation`
* **Submodule**: `git submodule update --remote --merge`
