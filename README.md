# 💎 Free-Resource — Hidden Free Web Components & Zero-Cost Client-Side Gems

> **Enterprise Web Power. Zero Cloud Invoices.**  
> A curated repository of 100% free, zero-API-cost, client-side web components that replace expensive commercial APIs ($500+/mo) with on-device neural networks and sleek client-side tools.

[![GitHub Repo](https://img.shields.io/badge/GitHub-TitanXS75%2FFree--resource-blue?style=flat&logo=github)](https://github.com/TitanXS75/Free-resource)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Zero API Cost](https://img.shields.io/badge/API%20Cost-%240.00%20Forever-success)](#)
[![Client-Side Privacy](https://img.shields.io/badge/Privacy-100%25%20On--Device-brightgreen)](#)

---

## 🌟 Available Free Components

| Component | Description | Free Engine | Commercial API Alternative |
| :--- | :--- | :--- | :--- |
| [**👤 Neural Face Biometrics**](./Face%20Recognition/) | Real-time face detection, 68-point landmarks & 128-D biometric vector matching on-device. | TensorFlow.js + Face-API | AWS Rekognition / Face++ ($150–$500/mo) |
| [**🌐 Zero-Branding Translation**](./Language%20Translation/) | Client-side multi-language translation (16+ languages) with suppressed Google banners and **zero page reloads**. | Google Translation Client Engine | Google Cloud Translation API ($20/1M chars) |

---

## 🚀 Live Showcase & Demos

1. **Combined Apple-Style Showcase Portal**: Open [`index.html`](./index.html) in your browser.
2. **Neural Face ID Biometric Studio**: Open [`Face Recognition/examples/vanilla-demo/index.html`](./Face%20Recognition/examples/vanilla-demo/index.html).
3. **Multi-Language Translation Hub**: Open [`Language Translation/index.html`](./Language%20Translation/index.html).

---

## 📁 Repository Structure

```
D:\Projects\Free-resource/
├── index.html                    ← Combined Apple-Grade Showcase Portal
├── styles.css                    ← Apple Design System (Dark obsidian, frosted glass, tokens)
├── app.js                        ← Master Showcase Controller & Live Sandboxes
├── models/                       ← Pre-trained Neural Network Weights (Face-API)
├── face-api.min.js               ← Standalone Neural Runtime
│
├── Face Recognition/             ← Component 1: Face Recognition & Biometrics
│   ├── README.md                 ← Comprehensive Face Recognition Documentation
│   ├── models/                   ← Neural weights (TinyFaceDetector, Landmarks, 128-D Net)
│   ├── src/                      ← Core SDK (Engine, Types, Storage Adapters)
│   └── examples/
│       ├── vanilla-demo/         ← Apple-grade Biometric Optical Scanner & Database Studio
│       ├── react-demo/           ← React Hook (`useFaceRecognition.ts`)
│       └── angular-demo/         ← Angular Standalone Component
│
└── Language Translation/         ← Component 2: Zero-Branding Language Translation
    ├── README.md                 ← Translation Integration & Architecture Docs
    ├── index.html                ← Dedicated Showcase Landing Page
    ├── styles.css                ← Styles
    ├── vanilla/                  ← Zero-Reload Google Translate Vanilla Module (.js & .css)
    ├── react/                    ← React TSX / JSX Components & Global Overrides
    └── angular/                  ← Angular Component & Scss Overrides
```

---

## 💡 Key Highlights

### 1. 👤 Face Recognition & Biometric Engine
- **60 FPS On-Device Detection**: Uses WebGL hardware acceleration to scan frames without sending imagery to any remote server.
- **Biometric Vector Extraction**: Converts facial geometry into a unique **128-dimensional vector embedding**.
- **Vector Database**: Built-in LocalStorage vector registry with JSON export/import and sample profiles.
- **Privacy Compliant**: 100% GDPR, HIPAA, and biometric compliance since no raw video leaves the client device.

### 2. 🌐 Zero-Branding Language Translation
- **Zero Page Reload**: Dynamically translates the entire page in-place via DOM combo events without refreshing the page or showing tab loading icons.
- **Zero Google Branding**: Completely suppresses top frames, popups, tooltips, and gadget icons via specialized CSS overrides.
- **16+ Global Languages**: Preconfigured with English, Spanish, French, German, Japanese, Arabic, and major Indian languages (Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Urdu).
- **Persistent Selection**: Stores preferred language in cookies across user visits.

---

## 💻 Quick Integration Examples

### Language Translation (Vanilla JS)
```html
<link rel="stylesheet" href="google-translate.css">
<div id="google-translate-widget"></div>

<script src="google-translate.js"></script>
<script>
  window.initGoogleTranslate({
    container: '#google-translate-widget',
    theme: 'dark'
  });
</script>
```

### Face Recognition (Vanilla JS)
```javascript
// Load neural weights
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
]);

// Detect face and extract 128-D vector
const detection = await faceapi
  .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
  .withFaceLandmarks()
  .withFaceDescriptor();

// Match against enrolled biometrics
const matcher = new faceapi.FaceMatcher(enrolledDescriptors, 0.45);
const match = matcher.findBestMatch(detection.descriptor);
console.log('Match result:', match.toString());
```

---

## 💰 Cost Comparison vs Commercial Cloud APIs

| Scale (Monthly Active Users) | Free-Resource Cost | Commercial Cloud Cost | Annual Savings |
| :--- | :--- | :--- | :--- |
| **10,000 MAU** | **$0.00** | ~$80 / month | **$960 / year** |
| **100,000 MAU** | **$0.00** | ~$750 / month | **$9,000 / year** |
| **1,000,000 MAU** | **$0.00** | ~$3,500 / month | **$42,000 / year** |

---

## 🤝 Contributing

Contributions of new **100% free, zero-API-cost client-side components** (e.g. client-side OCR, speech recognition, image background removal) are welcome!

1. Fork the repository (`https://github.com/TitanXS75/Free-resource`)
2. Create your feature branch (`git checkout -b feature/free-ocr-component`)
3. Commit your changes (`git commit -m 'Add free client-side OCR component'`)
4. Push to branch (`git push origin feature/free-ocr-component`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License** — free for personal and commercial applications.
