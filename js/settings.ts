import { appState } from './state.js';
import { sound } from './sound.js';

export function setupSettings() {
  const popover = document.getElementById('settings-popover')!;
  const toggleBtn = document.getElementById('settings-toggle-btn')!;
  const closeBtn = document.getElementById('settings-close-btn')!;
  const soundToggleBtn = document.getElementById('sound-toggle-btn')!;
  const fontSelect = document.getElementById('pref-font-select') as HTMLSelectElement;
  const caretGroup = document.getElementById('pref-caret-group')!;
  const soundGroup = document.getElementById('pref-sound-group')!;
  const wordsContainer = document.getElementById('words-container')!;
  const typingBox = document.getElementById('typing-box')!;

  // Toggle settings popover
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = popover.style.display === 'none' || popover.style.display === '';
    popover.style.display = isHidden ? 'flex' : 'none';
    toggleBtn.classList.toggle('active', isHidden);
  });

  closeBtn.addEventListener('click', () => {
    popover.style.display = 'none';
    toggleBtn.classList.remove('active');
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target as Node) && e.target !== toggleBtn) {
      popover.style.display = 'none';
      toggleBtn.classList.remove('active');
    }
  });

  // Sound toggle button in header
  soundToggleBtn.addEventListener('click', () => {
    const isCurrentlyOff = appState.preferences.sound === 'off';
    const newSound = isCurrentlyOff ? 'tactile' : 'off';
    setSoundState(newSound);
  });

  // Font family selector
  fontSelect.addEventListener('change', () => {
    const font = fontSelect.value;
    if (font === 'system') {
      wordsContainer.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    } else {
      wordsContainer.style.fontFamily = "var(--font-mono)";
    }
  });

  // Caret style segmented control
  caretGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      caretGroup.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const style = btn.getAttribute('data-caret');
      typingBox.classList.remove('caret-style-block', 'caret-style-underline');
      if (style === 'block') typingBox.classList.add('caret-style-block');
      if (style === 'underline') typingBox.classList.add('caret-style-underline');
    });
  });

  // Sound feedback segmented control
  soundGroup.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const soundVal = btn.getAttribute('data-sound') as 'off' | 'tactile' | 'soft';
      setSoundState(soundVal);
    });
  });

  function setSoundState(soundVal: 'off' | 'tactile' | 'soft') {
    appState.preferences.sound = soundVal;
    sound.setSound(soundVal);

    // Update UI states
    soundGroup.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-sound') === soundVal);
    });

    const isSoundActive = soundVal !== 'off';
    soundToggleBtn.classList.toggle('active', isSoundActive);
    const soundWave = soundToggleBtn.querySelector('.sound-wave') as HTMLElement;
    const muteLines = soundToggleBtn.querySelectorAll('.sound-mute-line');

    if (soundWave) soundWave.style.display = isSoundActive ? 'block' : 'none';
    muteLines.forEach(l => (l as HTMLElement).style.display = isSoundActive ? 'none' : 'block');
  }

  // Initialize sound state to tactile by default
  setSoundState(appState.preferences.sound);

  // Mobile viewport detection
  const mobileNotice = document.getElementById('mobile-notice')!;
  const mobileDismissBtn = document.getElementById('mobile-dismiss-btn')!;

  const checkMobile = () => {
    if (window.innerWidth < 640 && !sessionStorage.getItem('dismiss_mobile_notice')) {
      mobileNotice.style.display = 'flex';
    } else {
      mobileNotice.style.display = 'none';
    }
  };

  mobileDismissBtn.addEventListener('click', () => {
    mobileNotice.style.display = 'none';
    sessionStorage.setItem('dismiss_mobile_notice', 'true');
  });

  checkMobile();
  window.addEventListener('resize', checkMobile);
}
