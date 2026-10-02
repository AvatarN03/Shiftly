import { TypingEngine } from "./typing-engine.js";
import { ResultRenderer } from "./result-renderer.js";
import { setupSettings } from "./settings.js";
import { appState } from "./state.js";
import { SessionResult } from "./types.js";
import { loadWordList } from "./words.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Core Engines

  // Load the expanded vocabulary before the first passage is generated.
  // This keeps the initial page visit dynamic instead of showing the same
  // hard-coded paragraph every time.
  await loadWordList();
  const typingEngine = new TypingEngine();
  const resultRenderer = new ResultRenderer();
  setupSettings();

  //Screen state containers
  const typingStateEl = document.getElementById("typing-state")!;
  const resultStateEl = document.getElementById("result-state")!;

  // Mode configuration elements
  const modeTypeGroup = document.getElementById("mode-type-group")!;
  const timeOptionGroup = document.getElementById("time-options-group")!;
  const wordsOptionGroup = document.getElementById("words-options-group")!;
  const sessionMetaMode = document.getElementById("session-meta-mode")!;

  // Action buttons
  const restartBtn = document.getElementById("restart-btn")!;
  const resultRestartBtn = document.getElementById("result-restart-btn")!;
  const practiceMistakesBtn = document.getElementById("practice-mistakes-btn")!;
  const practiceWeakBtn = document.getElementById("practice-weak-btn")!;
  const brandHome = document.getElementById("brand-home")!;

  // Initialize with initial mock result so result screen is fully ready if previewd immediately

  const initialDefaultResult: SessionResult = {
    netWpm: 72,
    rawWpm: 78.2,
    accuracy: 96.4,
    correctChars: 218,
    incorrectChars: 8,
    extraChars: 0,
    consistency: 83,
    durationSec: 30,
    modeLabel: "30s",
    wpmHistory: [
      { time: 0, wpm: 65, rawWpm: 70, errors: 0 },
      { time: 5, wpm: 74, rawWpm: 79, errors: 0 },
      { time: 10, wpm: 71, rawWpm: 77, errors: 1 },
      { time: 15, wpm: 76, rawWpm: 81, errors: 0 },
      { time: 20, wpm: 73, rawWpm: 78, errors: 1 },
      { time: 25, wpm: 70, rawWpm: 76, errors: 0 },
      { time: 30, wpm: 72, rawWpm: 78, errors: 0 },
    ],
    mistakes: [
      { expected: "e", typed: "r", count: 3 },
      { expected: "t", typed: "y", count: 2 },
      { expected: "a", typed: "s", count: 2 },
    ],
    weakSpots: ["th", "er", "re"],
    timestamp: new Date(),
  };
  appState.lastResult = initialDefaultResult;

  // React to screen state changes

  function updateScreenVisibility() {
    if (appState.screen === "typing") {
      resultStateEl.style.display = "none";
      resultStateEl.classList.remove("active");

      typingStateEl.style.display = "block";
      requestAnimationFrame(() => {
        typingStateEl.classList.add("active");
        typingEngine.focusInput();
      });
    } else {
      typingStateEl.style.display = "none";
      typingStateEl.classList.remove("active");
      if (appState.lastResult) {
        resultRenderer.render(appState.lastResult);
      }
      resultStateEl.style.display = "block";
      requestAnimationFrame(() => {
        resultStateEl.classList.add("active");
      });
    }
  }

  appState.subscribe(() => {
    updateScreenVisibility();
  });

  // Mode type toggle (Time vs Words)

  modeTypeGroup.querySelectorAll(".config-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      modeTypeGroup.querySelectorAll(".config-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });

      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      const modeType = btn.getAttribute("data-type") as "time" | "words";
      appState.setModeType(modeType);

      if (modeType === "time") {
        timeOptionGroup.style.display = "flex";
        wordsOptionGroup.style.display = "none";
        sessionMetaMode.textContent = `${appState.config.timeTarget} seconds`;
      } else {
        timeOptionGroup.style.display = "none";
        wordsOptionGroup.style.display = "flex";
        sessionMetaMode.textContent = `${appState.config.wordsTarget} words`;
      }

      appState.setScreen("typing");
      typingEngine.resetTest();
    });
  });

  // Time options (15s, 30s, 60s, 120s)
  timeOptionGroup.querySelectorAll(".config-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      timeOptionGroup.querySelectorAll(".config-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      const timeVal = parseInt(btn.getAttribute("data-time") || "30", 10);
      appState.setTimeTarget(timeVal);
      sessionMetaMode.textContent = `${appState.config.timeTarget} seconds`;

      appState.setScreen("typing");
      // Reset metrics and timer, but keep the current wording.
      typingEngine.resetTest(null, false);
    });
  });

  // Words options (10, 25, 50, 100)
  wordsOptionGroup.querySelectorAll(".config-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      wordsOptionGroup.querySelectorAll(".config-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      const wordsVal = parseInt(btn.getAttribute("data-words") || "50", 10);
      appState.setWordsTarget(wordsVal);
      sessionMetaMode.textContent = `${appState.config.wordsTarget} words`;

      appState.setScreen("typing");
      typingEngine.resetTest();
    });
  });

  // Restart Actions
  restartBtn.addEventListener("click", () => {
    typingEngine.resetTest();
  });

  resultRestartBtn.addEventListener("click", () => {
    appState.setScreen("typing");
    typingEngine.resetTest();
  });

  practiceMistakesBtn.addEventListener("click", () => {
    appState.setScreen("typing");
    typingEngine.resetTest("mistakes");
  });

  practiceWeakBtn.addEventListener("click", () => {
    appState.setScreen("typing");
    typingEngine.resetTest("weak");
  });

  brandHome.addEventListener("click", (e) => {
    e.preventDefault();
    appState.setScreen("typing");
    typingEngine.resetTest();
  });

   // Global Tab key handling on Result screen
  window.addEventListener('keydown', (e) => {
    if (appState.screen === 'result') {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        appState.setScreen('typing');
        typingEngine.resetTest();
      }
    }
  });

  // Initial render
  updateScreenVisibility();
});
