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

// Telemetry & Toggles
const hudFps = document.getElementById('hud-fps');
const hudLatency = document.getElementById('hud-latency');
const toggleLandmarksCb = document.getElementById('toggle-landmarks-cb');
const toggleCameraBtn = document.getElementById('toggle-camera-btn');

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
let isCameraStopped = false;
let showLandmarks = true;
const STORAGE_KEY = 'FACE_REC_STANDALONE_DB';

// Telemetry tracking
let frameCount = 0;
let lastFpsUpdate = performance.now();
let lastLatency = 0;

// ==========================================
// 1. Toast Notifications
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
// 2. Neural Network & Camera Initialization
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
    showToast('Neural Engine loaded successfully');
  } catch (err) {
    console.error('Initialization failed:', err);
    systemBadge.className = 'system-status-pill error';
    systemBadge.querySelector('.status-text').innerText = 'Model Load Error';
    detectionStatus.innerText = 'Error loading models: ' + err.message;
    showToast('Failed to load neural network weights');
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
    await video.play();
    isCameraStopped = false;
  } catch (err) {
    detectionStatus.innerText = 'Camera access denied: ' + err.message;
    showToast('Camera permission denied or not found');
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  video.pause();
  video.srcObject = null;
  isCameraStopped = true;

  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  meterFill.style.width = '0%';
  qualityText.innerText = '0%';
  detectionStatus.innerText = 'Camera is stopped.';
  detectionPulse.className = 'hud-pulse looking';
  resetMatchUI();
}

// ==========================================
// 3. Database Persistence & Management
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
  if (!name) return '--';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderRegisteredList() {
  faceCount.innerText = labeledDescriptors.length;
  if (labeledDescriptors.length === 0) {
    registeredList.innerHTML = `
      <div class="empty-state">
        <p class="empty-text">No biometric profiles enrolled yet.</p>
        <span class="empty-sub">Enroll your face using the form above or load demo profiles.</span>
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
    showToast(`Profile removed: ${label}`);
  }
};

clearAllBtn.addEventListener('click', () => {
  if (labeledDescriptors.length === 0) return;
  if (confirm('Are you sure you want to delete ALL enrolled biometric profiles?')) {
    labeledDescriptors = [];
    saveDatabase();
    showToast('All profiles cleared');
  }
});

// JSON DB Export
exportDbBtn.addEventListener('click', () => {
  if (labeledDescriptors.length === 0) {
    showToast('No profiles to export');
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
  showToast('Database exported as JSON');
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
      showToast(`Successfully imported ${newItems.length} profile(s)`);
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
    { label: 'Alex Morgan', role: 'System Admin' },
    { label: 'Elena Rostova', role: 'Security Lead' },
  ];

  let added = 0;
  sampleNames.forEach((s) => {
    if (!labeledDescriptors.some((ld) => ld.label === s.label)) {
      const dummyVec = new Float32Array(128).map(() => (Math.random() - 0.5) * 0.1);
      const ld = new faceapi.LabeledFaceDescriptors(s.label, [dummyVec]);
      ld.role = s.role;
      labeledDescriptors.push(ld);
      added++;
    }
  });

  if (added > 0) {
    saveDatabase();
    showToast(`Added ${added} demo sample profile(s)`);
  } else {
    showToast('Sample profiles already exist');
  }
});

// ==========================================
// 4. Continuous Frame Processing & Canvas HUD
// ==========================================
async function startProcessingLoop() {
  isLoopRunning = true;

  async function step() {
    if (!isLoopRunning) return;

    const tStart = performance.now();

    if (!isCameraStopped && video.readyState === 4 && !video.paused) {
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
          detectionStatus.innerText = 'Optimal face alignment';
        } else if (qualityScore >= 50) {
          meterFill.style.backgroundColor = 'var(--accent-amber)';
          detectionPulse.className = 'hud-pulse looking';
          detectionStatus.innerText = 'Adjust distance or center face';
        } else {
          meterFill.style.backgroundColor = 'var(--accent-rose)';
          detectionPulse.className = 'hud-pulse low';
          detectionStatus.innerText = 'Face off-center';
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
            drawCyberReticle(ctx, box, match.label, `${conf}% Match`, '#10b981');
            updateMatchUI(true, match.label, role);
          } else {
            drawCyberReticle(ctx, box, 'Unknown Face', '', '#f43f5e');
            updateMatchUI(false, 'Unknown Face', 'Not in vector database');
          }
        } else {
          drawCyberReticle(ctx, box, 'Face Detected', `${qualityScore}% Alignment`, '#06b6d4');
          updateMatchUI(null, 'Face Detected', 'Registry empty or unregistered');
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
// 5. Un-Mirrored Readable Canvas HUD Drawing
// ==========================================
function drawCyberReticle(ctx, box, title, subText, color) {
  const { x, y, width, height } = box;
  const cornerSize = Math.min(22, width * 0.2);
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

  // Corner brackets
  ctx.beginPath();
  ctx.moveTo(rx, ry + cornerSize); ctx.lineTo(rx, ry); ctx.lineTo(rx + cornerSize, ry);
  ctx.moveTo(rx + rw - cornerSize, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + cornerSize);
  ctx.moveTo(rx, ry + rh - cornerSize); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + cornerSize, ry + rh);
  ctx.moveTo(rx + rw - cornerSize, ry + rh); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw, ry + rh - cornerSize);
  ctx.stroke();

  // Measure text width for badge background
  const fullLabel = subText ? `${title} (${subText})` : title;
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  const textWidth = ctx.measureText(fullLabel).width;
  const badgeH = 24;
  const badgeW = textWidth + 18;
  const bx = rx;
  const by = Math.max(8, ry - badgeH - 6);

  ctx.fillStyle = 'rgba(8, 12, 20, 0.9)';
  ctx.fillRect(bx, by, badgeW, badgeH);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, badgeW, badgeH);

  // UN-MIRROR the text: since canvas has CSS scaleX(-1), flip horizontally around badge center
  ctx.save();
  ctx.translate(bx + badgeW / 2, by + badgeH / 2);
  ctx.scale(-1, 1);
  ctx.translate(-(bx + badgeW / 2), -(by + badgeH / 2));

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  ctx.shadowBlur = 0;
  ctx.fillText(title, bx + 9, by + 16);

  if (subText) {
    const titleW = ctx.measureText(`${title} `).width;
    ctx.fillStyle = color;
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText(`(${subText})`, bx + 9 + titleW, by + 16);
  }
  ctx.restore();

  ctx.restore();
}

function drawFuturisticLandmarks(ctx, landmarks) {
  const positions = landmarks.positions;
  ctx.save();

  // Draw constellation points
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
// 6. Match UI Updates
// ==========================================
function updateMatchUI(isVerified, name, role) {
  if (isVerified === true) {
    matchResultCard.className = 'match-result-card matched';
    matchAvatarCircle.className = 'match-avatar-circle verified';
    matchAvatarInitials.innerText = getInitials(name);
    recBadge.className = 'rec-badge status-verified';
    recBadge.innerText = 'Verified';
    recName.innerText = name;
    recRoleTag.innerText = role;
  } else if (isVerified === false) {
    matchResultCard.className = 'match-result-card unrecognized';
    matchAvatarCircle.className = 'match-avatar-circle';
    matchAvatarInitials.innerText = '--';
    recBadge.className = 'rec-badge status-unknown';
    recBadge.innerText = 'Unknown';
    recName.innerText = 'Unregistered Face';
    recRoleTag.innerText = 'Not in vector database';
  } else {
    matchResultCard.className = 'match-result-card';
    matchAvatarCircle.className = 'match-avatar-circle';
    matchAvatarInitials.innerText = '--';
    recBadge.className = 'rec-badge status-none';
    recBadge.innerText = 'Detected';
    recName.innerText = name;
    recRoleTag.innerText = role;
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
}

// ==========================================
// 7. Face Enrollment Trigger
// ==========================================
captureBtn.addEventListener('click', async () => {
  const name = personNameInput.value.trim();
  const role = personRoleInput.value.trim();

  if (!name) {
    showToast('Please enter a Name or ID');
    personNameInput.focus();
    return;
  }

  if (isCameraStopped) {
    showToast('Start camera before capturing face');
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
      showToast('Could not detect clear face. Look at camera.');
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
      showToast(`Added additional vector angle to '${name}'`);
    } else {
      const ld = new faceapi.LabeledFaceDescriptors(name, [detection.descriptor]);
      ld.role = role || 'Enrolled User';
      labeledDescriptors.push(ld);
      showToast(`Successfully enrolled '${name}'`);
    }

    saveDatabase();
    personNameInput.value = '';
    personRoleInput.value = '';
  } catch (err) {
    showToast('Enrollment error: ' + err.message);
  } finally {
    captureBtn.disabled = false;
    captureBtn.querySelector('.btn-label').innerText = 'Capture & Enroll Face';
  }
});

// ==========================================
// 8. Interactive Controls & Mode Switching
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

toggleCameraBtn.addEventListener('click', async () => {
  if (!isCameraStopped) {
    stopCamera();
    toggleCameraBtn.querySelector('.btn-label').innerText = 'Start Camera';
    showToast('Camera stopped');
  } else {
    toggleCameraBtn.querySelector('.btn-label').innerText = 'Starting...';
    await startCamera();
    toggleCameraBtn.querySelector('.btn-label').innerText = 'Stop Camera';
    detectionStatus.innerText = 'Looking for human face...';
    showToast('Camera started');
  }
});

// Launch on start
initEngine();
