/**
 * Interactive site script for Neo-Brutalist Showcase
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Tab Switching for Integration Hub
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePanel = document.getElementById(targetTab);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });

  // 2. Clipboard Copy Functionality
  const copyButtons = document.querySelectorAll('.btn-copy, .btn-copy-mini');
  const toast = document.getElementById('toast-notice');

  function showToast(text = 'Copied to clipboard!') {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  copyButtons.forEach(btn => {
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
        navigator.clipboard.writeText(textToCopy.trim()).then(() => {
          const originalLabel = btn.innerText;
          btn.innerText = '✓ Copied!';
          showToast('📋 Copied: ' + (textToCopy.length > 30 ? textToCopy.slice(0, 30) + '...' : textToCopy));
          setTimeout(() => {
            btn.innerText = originalLabel;
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy', err);
        });
      }
    });
  });

  // 3. Interactive Translate Trigger Simulator
  const liveDemoTrigger = document.getElementById('trigger-live-modal');
  if (liveDemoTrigger) {
    liveDemoTrigger.addEventListener('click', () => {
      const widgetBtn = document.querySelector('.gt-trigger-btn');
      if (widgetBtn) {
        widgetBtn.click();
      }
    });
  }
});
