/**
 * Free-Resource Showcase Portal - Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Apple-Style Tab Switching between Components
  const tabButtons = document.querySelectorAll('.apple-tab-btn');
  const showcasePanels = document.querySelectorAll('.showcase-panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach((b) => b.classList.remove('active'));
      showcasePanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // 2. Code Snippet Explorer Framework Tabs
  const codePills = document.querySelectorAll('.code-lang-pill');
  codePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const container = pill.closest('.code-preview-box');
      const targetLang = pill.getAttribute('data-snippet');

      if (!container) return;

      container.querySelectorAll('.code-lang-pill').forEach((p) => p.classList.remove('active'));
      container.querySelectorAll('.snippet-block').forEach((s) => (s.style.display = 'none'));

      pill.classList.add('active');
      const targetSnippet = container.querySelector(`.snippet-${targetLang}`);
      if (targetSnippet) {
        targetSnippet.style.display = 'block';
      }
    });
  });

  // 3. Clipboard Copy Functionality
  const copyButtons = document.querySelectorAll('.btn-copy-code, .btn-copy-general');
  const toast = document.getElementById('showcase-toast');

  function showToast(text = 'Copied to clipboard!') {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  copyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const directText = btn.getAttribute('data-copy-text');

      let textToCopy = '';
      if (directText) {
        textToCopy = directText;
      } else if (targetId) {
        const targetElem = document.getElementById(targetId);
        if (targetElem) {
          textToCopy = targetElem.innerText || targetElem.textContent;
        }
      }

      if (textToCopy) {
        navigator.clipboard
          .writeText(textToCopy.trim())
          .then(() => {
            const originalLabel = btn.innerHTML;
            btn.innerHTML = '<span>Copied</span>';
            showToast('Code copied to clipboard');
            setTimeout(() => {
              btn.innerHTML = originalLabel;
            }, 2000);
          })
          .catch((err) => {
            console.error('Failed to copy', err);
          });
      }
    });
  });

  // 4. Mini Face Scanner Demo on Showcase Page
  const miniVideo = document.getElementById('mini-video');
  const miniCanvas = document.getElementById('mini-canvas');
  const startMiniCamBtn = document.getElementById('start-mini-cam-btn');
  const miniCamStatus = document.getElementById('mini-cam-status');

  let miniCamStream = null;
  let isMiniScanning = false;
  let isModelsLoaded = false;

  if (startMiniCamBtn && miniVideo && miniCanvas) {
    startMiniCamBtn.addEventListener('click', async () => {
      if (!isMiniScanning) {
        // Start Scanner
        startMiniCamBtn.disabled = true;
        miniCamStatus.innerText = 'Loading neural models...';

        try {
          if (!isModelsLoaded && window.faceapi) {
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
              faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
              faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
            ]);
            isModelsLoaded = true;
          }

          miniCamStatus.innerText = 'Requesting camera...';
          miniCamStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
            audio: false,
          });

          miniVideo.srcObject = miniCamStream;
          await new Promise((resolve) => (miniVideo.onloadedmetadata = resolve));
          miniVideo.play();

          isMiniScanning = true;
          startMiniCamBtn.disabled = false;
          startMiniCamBtn.innerHTML = '<span>Stop Mini Scanner</span>';
          startMiniCamBtn.classList.remove('primary');
          miniCamStatus.innerText = 'Scanning live camera feed...';

          runMiniScanLoop();
        } catch (err) {
          console.error(err);
          startMiniCamBtn.disabled = false;
          miniCamStatus.innerText = 'Error: ' + err.message;
          showToast('Could not initialize camera/models');
        }
      } else {
        // Stop Scanner
        isMiniScanning = false;
        if (miniCamStream) {
          miniCamStream.getTracks().forEach((t) => t.stop());
          miniCamStream = null;
        }
        miniVideo.pause();
        miniVideo.srcObject = null;

        const ctx = miniCanvas.getContext('2d');
        ctx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);

        startMiniCamBtn.innerHTML = '<span>Launch Mini Scanner</span>';
        startMiniCamBtn.classList.add('primary');
        miniCamStatus.innerText = 'Camera paused.';
      }
    });

    async function runMiniScanLoop() {
      if (!isMiniScanning) return;

      if (miniVideo.readyState === 4 && !miniVideo.paused) {
        if (miniCanvas.width !== miniVideo.videoWidth || miniCanvas.height !== miniVideo.videoHeight) {
          faceapi.matchDimensions(miniCanvas, {
            width: miniVideo.videoWidth,
            height: miniVideo.videoHeight,
          });
        }

        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
        const detection = await faceapi.detectSingleFace(miniVideo, options).withFaceLandmarks();

        const ctx = miniCanvas.getContext('2d');
        ctx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);

        if (detection) {
          const resized = faceapi.resizeResults(detection, {
            width: miniCanvas.width,
            height: miniCanvas.height,
          });

          const box = resized.detection.box;

          // Draw corner reticle
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw Landmark points
          resized.landmarks.positions.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
          });

          miniCamStatus.innerText = `Face detected (Score: ${Math.round(resized.detection.score * 100)}%)`;
        } else {
          miniCamStatus.innerText = 'Looking for face...';
        }
      }

      requestAnimationFrame(runMiniScanLoop);
    }
  }

  // 5. Interactive Language Test Simulator
  const testTriggerBtn = document.getElementById('test-language-modal-btn');
  if (testTriggerBtn) {
    testTriggerBtn.addEventListener('click', () => {
      const widgetBtn = document.querySelector('.gt-trigger-btn');
      if (widgetBtn) {
        widgetBtn.click();
      }
    });
  }
});
