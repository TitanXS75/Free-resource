/**
 * NeuralFace ID - Apple-Grade Biometric Web Engine
 * 100% Free • Zero-API-Cost • TensorFlow.js / Face-API
 */

// DOM Element Selectors
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const systemBadge = document.getElementById('system-badge');
const detectionStatus = document.getElementById('detection-status');
const detectionPulse = document.getElementById('detection-pulse');
const meterFill = document.getElementById('meter-fill');
const qualityText = document.getElementById('quality-text');

// Match UI
const matchResultCard = document.getElementById('live-recognition-result');
const matchAvatarCircle = document.getElementById('match-avatar-circle');
const matchAvatarInitials = document.getElementById('match-avatar-initials');
const recBadge = document.getElementById('rec-badge');
const recName = document.getElementById('rec-name');
const recRoleTag = document.getElementById('rec-role-tag');
const recConf = document.getElementById('rec-conf');

// Telemetry & Toggles
const hudFps = document.getElementById('hud-fps');
const hudLatency = document.getElementById('hud-latency');
const toggleLandmarksCb = document.getElementById('toggle-landmarks-cb');
const toggleCameraBtn = document.getElementById('toggle-camera-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const soundOnIcon = document.getElementById('sound-on-icon');
const soundOffIcon = document.getElementById('sound-off-icon');

// Mode Buttons
const modeScanBtn = document.getElementById('mode-scan-btn');
const modeRegisterBtn = document.getElementById('mode-register-btn');
const registerCard = document.getElementById('register-card');

// Registration Form & Database
const captureBtn = document.getElementById('capture-face-btn');
const personNameInput = document.getElementById('person-name');
const personRoleInput = document.getElementById('person-display-name');
const registeredList = document.getElementById('registered-list');
const faceCount = document.getElementById('face-count');
const clearAllBtn = document.getElementById('clear-all-btn');
const exportDbBtn = document.getElementById('export-db-btn');
const importDbBtn = document.getElementById('import-db-btn');
const importFileInput = document.getElementById('import-file-input');
const loadSamplesBtn = document.getElementById('load-samples-btn');
const appToast = document.getElementById('app-toast');

// State Variables
let currentMode = 'scan'; // 'scan' | 'register'
let labeledDescriptors = [];
let faceMatcher = null;
let isLoopRunning = false;
let cameraStream = null;
let isCameraPaused = false;
let isSoundEnabled = true;
let showLandmarks = true;
const STORAGE_KEY = 'FACE_REC_STANDALONE_DB';

// Telemetry tracking
let frameCount = 0;
let lastFpsUpdate = performance.now();
let lastLatency = 0;

// Last match cache to prevent sound spam
let lastMatchedLabel = null;
let lastMatchedTime = 0;

// ==========================================
// 1. Audio Synthesizer (Zero external files)
// ==========================================
class BiometricAudio {
  constructor() {
    this.ctx = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMatchChime() {
    if (!isSoundEnabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio play warning:', e);
    }
  }

  playEnrollSuccess() {
    if (!isSoundEnabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch (e) {
      console.warn('Audio play warning:', e);
    }
  }
}

const audioFX = new BiometricAudio();

// ==========================================
// 2. Toast Notifications
// ==========================================
function showToast(msg, duration = 3000) {
  if (!appToast) return;
  appToast.innerText = msg;
  appToast.classList.add('show');
  setTimeout(() => {
    appToast.classList.remove('show');
  }, duration);
}

// ==========================================
// 3. Neural Network & Camera Initialization
// ==========================================
async function initEngine() {
  try {
    systemBadge.className = 'system-status-pill loading';
    systemBadge.querySelector('.status-text').innerText = 'Loading Neural Weights...';

    // Load Neural Models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    ]);

    systemBadge.className = 'system-status-pill ready';
    systemBadge.querySelector('.status-text').innerText = 'Neural Engine Ready (TensorFlow)';

    loadDatabase();
    await startCamera();
    startProcessingLoop();
    showToast('✨ Neural Engine loaded successfully');
  } catch (err) {
    console.error('Initialization failed:', err);
    systemBadge.className = 'system-status-pill error';
    systemBadge.querySelector('.status-text').innerText = 'Model Load Error';
    detectionStatus.innerText = 'Error loading models: ' + err.message;
    showToast('❌ Failed to load neural network weights');
  }
}

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });
    video.srcObject = cameraStream;
    await new Promise((resolve) => (video.onloadedmetadata = resolve));
    video.play();
  } catch (err) {
    detectionStatus.innerText = 'Camera access denied: ' + err.message;
    showToast('⚠️ Camera permission denied or not found');
  }
}

// ==========================================
// 4. Database Persistence & Management
// ==========================================
function loadDatabase() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    labeledDescriptors = [];
    rebuildMatcher();
    renderRegisteredList();
    return;
  }

  try {
    const list = JSON.parse(raw);
    labeledDescriptors = list.map((item) => {
      const descriptors = item.descriptors.map((d) => new Float32Array(d));
      const ld = new faceapi.LabeledFaceDescriptors(item.label, descriptors);
      ld.role = item.role || '';
      return ld;
    });
    rebuildMatcher();
    renderRegisteredList();
  } catch (e) {
    console.error('Failed to parse localStorage:', e);
  }
}

function saveDatabase() {
  const serializable = labeledDescriptors.map((ld) => ({
    label: ld.label,
    role: ld.role || '',
    descriptors: ld.descriptors.map((d) => Array.from(d)),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  rebuildMatcher();
  renderRegisteredList();
}

function rebuildMatcher() {
  if (labeledDescriptors.length > 0) {
    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
  } else {
    faceMatcher = null;
  }
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderRegisteredList() {
  faceCount.innerText = labeledDescriptors.length;
  if (labeledDescriptors.length === 0) {
    registeredList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">No biometric profiles enrolled yet.</p>
        <span class="empty-sub">Enroll your face using the form above or import a profile JSON.</span>
      </div>
    `;
    return;
  }

  registeredList.innerHTML = labeledDescriptors
    .map((ld) => {
      const initials = getInitials(ld.label);
      const roleText = ld.role ? `<span style="color:var(--accent-cyan); font-size:11px;">${ld.role} • </span>` : '';
      return `
        <div class="face-item">
          <div class="face-item-left">
            <div class="face-item-avatar">${initials}</div>
            <div class="face-item-info">
              <strong>${ld.label}</strong>
              <span>${roleText}${ld.descriptors.length} descriptor vector(s)</span>
            </div>
          </div>
          <button class="btn-delete-item" onclick="deleteFace('${ld.label}')" title="Delete Profile">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    })
    .join('');
}

window.deleteFace = function (label) {
  if (confirm(`Remove biometric profile for '${label}'?`)) {
    labeledDescriptors = labeledDescriptors.filter((ld) => ld.label !== label);
    saveDatabase();
    showToast(`🗑️ Profile removed: ${label}`);
  }
};

clearAllBtn.addEventListener('click', () => {
  if (labeledDescriptors.length === 0) return;
  if (confirm('Are you sure you want to delete ALL enrolled biometric profiles?')) {
    labeledDescriptors = [];
    saveDatabase();
    showToast('🗑️ All profiles cleared');
  }
});

// JSON DB Export
exportDbBtn.addEventListener('click', () => {
  if (labeledDescriptors.length === 0) {
    showToast('⚠️ No profiles to export');
    return;
  }
  const serializable = labeledDescriptors.map((ld) => ({
    label: ld.label,
    role: ld.role || '',
    descriptors: ld.descriptors.map((d) => Array.from(d)),
  }));
  const blob = new Blob([JSON.stringify(serializable, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `neuralface_biometrics_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Database exported as JSON');
});

// JSON DB Import
importDbBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const list = JSON.parse(event.target.result);
      if (!Array.isArray(list)) throw new Error('Invalid JSON format');
      
      const newItems = list.map((item) => {
        const descriptors = item.descriptors.map((d) => new Float32Array(d));
        const ld = new faceapi.LabeledFaceDescriptors(item.label, descriptors);
        ld.role = item.role || '';
        return ld;
      });

      labeledDescriptors = [...labeledDescriptors, ...newItems];
      saveDatabase();
      showToast(`📥 Successfully imported ${newItems.length} profile(s)`);
    } catch (err) {
      alert('Failed to import JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  importFileInput.value = '';
});

// Sample Profiles Shortcut
loadSamplesBtn.addEventListener('click', () => {
  const sampleNames = [
    { label: 'Tim Cook (Sample)', role: 'Apple CEO' },
    { label: 'Ada Lovelace (Sample)', role: 'Lead Architect' },
  ];

  let added = 0;
  sampleNames.forEach((s) => {
    if (!labeledDescriptors.some((ld) => ld.label === s.label)) {
      // Create synthetic pseudo 128-d vector for demonstration
      const dummyVec = new Float32Array(128).map(() => (Math.random() - 0.5) * 0.1);
      const ld = new faceapi.LabeledFaceDescriptors(s.label, [dummyVec]);
      ld.role = s.role;
      labeledDescriptors.push(ld);
      added++;
    }
  });

  if (added > 0) {
    saveDatabase();
    showToast(`⚡ Added ${added} demo sample profile(s)`);
  } else {
    showToast('ℹ️ Sample profiles already exist');
  }
});

// ==========================================
// 5. Continuous Frame Processing & Canvas HUD
// ==========================================
async function startProcessingLoop() {
  isLoopRunning = true;

  async function step() {
    if (!isLoopRunning) return;

    const tStart = performance.now();

    if (video.readyState === 4 && !video.paused && !isCameraPaused) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        faceapi.matchDimensions(canvas, { width: video.videoWidth, height: video.videoHeight });
      }

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 });
      const detection = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        const resized = faceapi.resizeResults(detection, {
          width: canvas.width,
          height: canvas.height,
        });

        // Calculate Quality Score
        const box = resized.detection.box;
        const faceAreaRatio = (box.width * box.height) / (canvas.width * canvas.height);
        let qualityScore = 40;

        if (faceAreaRatio >= 0.08 && faceAreaRatio <= 0.65) qualityScore += 35;
        const centerX = box.x + box.width / 2;
        if (Math.abs(centerX - canvas.width / 2) < canvas.width * 0.22) qualityScore += 25;

        meterFill.style.width = `${qualityScore}%`;
        qualityText.innerText = `${qualityScore}%`;

        if (qualityScore >= 70) {
          meterFill.style.backgroundColor = 'var(--accent-emerald)';
          detectionPulse.className = 'hud-pulse optimal';
          detectionStatus.innerText = 'Optimal face alignment — ready for ID';
        } else if (qualityScore >= 50) {
          meterFill.style.backgroundColor = 'var(--accent-amber)';
          detectionPulse.className = 'hud-pulse looking';
          detectionStatus.innerText = 'Adjust distance or center face';
        } else {
          meterFill.style.backgroundColor = 'var(--accent-rose)';
          detectionPulse.className = 'hud-pulse low';
          detectionStatus.innerText = 'Face too distant or off-center';
        }

        // Draw HUD Landmarks if enabled
        if (showLandmarks && resized.landmarks) {
          drawFuturisticLandmarks(ctx, resized.landmarks);
        }

        // Recognition Matching
        if (faceMatcher && detection.descriptor) {
          const match = faceMatcher.findBestMatch(detection.descriptor);
          const isMatch = match.label !== 'unknown' && match.distance <= 0.45;
          const conf = Math.round((1 - match.distance) * 100);

          const foundObj = labeledDescriptors.find((ld) => ld.label === match.label);
          const role = foundObj?.role || 'Enrolled User';

          if (isMatch) {
            drawCyberReticle(ctx, box, match.label, `${conf}% Verified`, '#10b981');
            updateMatchUI(true, match.label, role, conf);

            // Play match sound if new subject or cooled down
            const now = Date.now();
            if (lastMatchedLabel !== match.label || now - lastMatchedTime > 6000) {
              audioFX.playMatchChime();
              lastMatchedLabel = match.label;
              lastMatchedTime = now;
            }
          } else {
            drawCyberReticle(ctx, box, 'Unknown Subject', `${conf}% Sim`, '#f43f5e');
            updateMatchUI(false, 'Unknown Subject', 'Unregistered Biometric', conf);
          }
        } else {
          drawCyberReticle(ctx, box, 'Face Detected', `${qualityScore}% Alignment`, '#06b6d4');
          updateMatchUI(null, 'Face Detected', 'Registry empty or unregistered', 0);
        }
      } else {
        // No face in frame
        meterFill.style.width = '0%';
        qualityText.innerText = '0%';
        detectionPulse.className = 'hud-pulse looking';
        detectionStatus.innerText = 'Looking for human face...';
        resetMatchUI();
      }
    }

    // Telemetry Calculation
    const tEnd = performance.now();
    lastLatency = Math.round(tEnd - tStart);
    frameCount++;

    if (tEnd - lastFpsUpdate >= 1000) {
      const fps = Math.round((frameCount * 1000) / (tEnd - lastFpsUpdate));
      hudFps.innerText = `FPS: ${fps}`;
      hudLatency.innerText = `Latency: ${lastLatency} ms`;
      frameCount = 0;
      lastFpsUpdate = tEnd;
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ==========================================
// 6. Futuristic Canvas HUD Drawing
// ==========================================
function drawCyberReticle(ctx, box, title, subText, color) {
  const { x, y, width, height } = box;
  const cornerSize = Math.min(24, width * 0.2);
  const pad = 6;

  const rx = x - pad;
  const ry = y - pad;
  const rw = width + pad * 2;
  const rh = height + pad * 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(rx, ry + cornerSize);
  ctx.lineTo(rx, ry);
  ctx.lineTo(rx + cornerSize, ry);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(rx + rw - cornerSize, ry);
  ctx.lineTo(rx + rw, ry);
  ctx.lineTo(rx + rw, ry + cornerSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(rx, ry + rh - cornerSize);
  ctx.lineTo(rx, ry + rh);
  ctx.lineTo(rx + cornerSize, ry + rh);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(rx + rw - cornerSize, ry + rh);
  ctx.lineTo(rx + rw, ry + rh);
  ctx.lineTo(rx + rw, ry + rh - cornerSize);
  ctx.stroke();

  // Badge Container on Top
  const badgeH = 24;
  const badgeW = Math.max(130, ctx.measureText(`${title} • ${subText}`).width + 20);
  const bx = rx;
  const by = Math.max(10, ry - badgeH - 6);

  ctx.fillStyle = 'rgba(8, 12, 20, 0.85)';
  ctx.fillRect(bx, by, badgeW, badgeH);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, badgeW, badgeH);

  // Text inside badge
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  ctx.shadowBlur = 0;
  ctx.fillText(`${title} `, bx + 8, by + 16);

  const titleWidth = ctx.measureText(`${title} `).width;
  ctx.fillStyle = color;
  ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  ctx.fillText(`(${subText})`, bx + 8 + titleWidth, by + 16);

  ctx.restore();
}

function drawFuturisticLandmarks(ctx, landmarks) {
  const positions = landmarks.positions;
  ctx.save();

  // Draw delicate constellation points
  positions.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.8, 0, 2 * Math.PI);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 4;
    ctx.fill();
  });

  // Jaw outline
  const jaw = landmarks.getJawOutline();
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
  ctx.lineWidth = 1;
  ctx.moveTo(jaw[0].x, jaw[0].y);
  jaw.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Nose contour
  const nose = landmarks.getNose();
  ctx.beginPath();
  ctx.moveTo(nose[0].x, nose[0].y);
  nose.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();

  ctx.restore();
}

// ==========================================
// 7. Match UI Updates
// ==========================================
function updateMatchUI(isVerified, name, role, conf) {
  if (isVerified === true) {
    matchResultCard.className = 'match-result-card matched';
    matchAvatarCircle.className = 'match-avatar-circle verified';
    matchAvatarInitials.innerText = getInitials(name);
    recBadge.className = 'rec-badge status-verified';
    recBadge.innerText = 'Verified';
    recName.innerText = name;
    recRoleTag.innerText = role;
    recConf.innerText = `${conf}%`;
  } else if (isVerified === false) {
    matchResultCard.className = 'match-result-card unrecognized';
    matchAvatarCircle.className = 'match-avatar-circle';
    matchAvatarInitials.innerText = '??';
    recBadge.className = 'rec-badge status-unknown';
    recBadge.innerText = 'Unknown';
    recName.innerText = 'Unregistered Face';
    recRoleTag.innerText = 'Not in vector database';
    recConf.innerText = `${conf}%`;
  } else {
    matchResultCard.className = 'match-result-card';
    matchAvatarCircle.className = 'match-avatar-circle';
    matchAvatarInitials.innerText = '👤';
    recBadge.className = 'rec-badge status-none';
    recBadge.innerText = 'Detected';
    recName.innerText = name;
    recRoleTag.innerText = role;
    recConf.innerText = '--';
  }
}

function resetMatchUI() {
  matchResultCard.className = 'match-result-card';
  matchAvatarCircle.className = 'match-avatar-circle';
  matchAvatarInitials.innerText = '--';
  recBadge.className = 'rec-badge status-none';
  recBadge.innerText = 'Searching';
  recName.innerText = 'Awaiting Subject';
  recRoleTag.innerText = '--';
  recConf.innerText = '0%';
}

// ==========================================
// 8. Face Enrollment Trigger
// ==========================================
captureBtn.addEventListener('click', async () => {
  const name = personNameInput.value.trim();
  const role = personRoleInput.value.trim();

  if (!name) {
    showToast('⚠️ Please enter a Name or ID');
    personNameInput.focus();
    return;
  }

  captureBtn.disabled = true;
  captureBtn.querySelector('.btn-label').innerText = 'Extracting 128-D Vectors...';

  try {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    const detection = await faceapi
      .detectSingleFace(video, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      showToast('❌ Could not detect clear face. Please look at camera.');
      return;
    }

    // Check duplicate similarity
    if (faceMatcher) {
      const match = faceMatcher.findBestMatch(detection.descriptor);
      if (match.label !== 'unknown' && match.distance <= 0.42 && match.label !== name) {
        const proceed = confirm(
          `Notice: This face looks highly similar to already enrolled '${match.label}' (${Math.round((1 - match.distance) * 100)}% match). Add anyway?`
        );
        if (!proceed) return;
      }
    }

    const existing = labeledDescriptors.find((ld) => ld.label === name);
    if (existing) {
      existing.descriptors.push(detection.descriptor);
      if (role) existing.role = role;
      showToast(`✨ Added additional vector angle to '${name}'`);
    } else {
      const ld = new faceapi.LabeledFaceDescriptors(name, [detection.descriptor]);
      ld.role = role || 'Enrolled User';
      labeledDescriptors.push(ld);
      showToast(`🎉 Successfully enrolled '${name}'`);
    }

    audioFX.playEnrollSuccess();
    saveDatabase();
    personNameInput.value = '';
    personRoleInput.value = '';
  } catch (err) {
    showToast('❌ Enrollment error: ' + err.message);
  } finally {
    captureBtn.disabled = false;
    captureBtn.querySelector('.btn-label').innerText = 'Capture & Enroll Face';
  }
});

// ==========================================
// 9. Interactive Controls & Mode Switching
// ==========================================
modeScanBtn.addEventListener('click', () => {
  currentMode = 'scan';
  modeScanBtn.classList.add('active');
  modeScanBtn.setAttribute('aria-selected', 'true');
  modeRegisterBtn.classList.remove('active');
  modeRegisterBtn.setAttribute('aria-selected', 'false');
});

modeRegisterBtn.addEventListener('click', () => {
  currentMode = 'register';
  modeRegisterBtn.classList.add('active');
  modeRegisterBtn.setAttribute('aria-selected', 'true');
  modeScanBtn.classList.remove('active');
  modeScanBtn.setAttribute('aria-selected', 'false');
  personNameInput.focus();
  registerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

toggleLandmarksCb.addEventListener('change', (e) => {
  showLandmarks = e.target.checked;
});

toggleCameraBtn.addEventListener('click', () => {
  isCameraPaused = !isCameraPaused;
  if (isCameraPaused) {
    video.pause();
    toggleCameraBtn.querySelector('.btn-label').innerText = 'Resume Camera';
    toggleCameraBtn.querySelector('.btn-icon').innerText = '▶️';
    showToast('⏸️ Camera stream paused');
  } else {
    video.play();
    toggleCameraBtn.querySelector('.btn-label').innerText = 'Pause Camera';
    toggleCameraBtn.querySelector('.btn-icon').innerText = '📷';
    showToast('▶️ Camera stream resumed');
  }
});

soundToggleBtn.addEventListener('click', () => {
  isSoundEnabled = !isSoundEnabled;
  soundToggleBtn.classList.toggle('active', isSoundEnabled);
  soundOnIcon.style.display = isSoundEnabled ? 'block' : 'none';
  soundOffIcon.style.display = isSoundEnabled ? 'none' : 'block';
  showToast(isSoundEnabled ? '🔊 Audio effects enabled' : '🔇 Audio effects muted');
});

// Launch on start
initEngine();
