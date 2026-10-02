import { MistakeDetail, SessionResult, WpmPoint } from "./types.js";

import { appState } from "./state.js";

import { sound } from "./sound.js";

import {
  getDynamicPassage,
  getMistakePracticeWords,
  getRandomWords,
  WEAK_SPOTS_WORDS,
} from "./words.js";

type PracticeMode = "mistakes" | "weak" | null;

export class TypingEngine {
  private wordsContainer: HTMLElement;
  private hiddenInput: HTMLInputElement;
  private typingBox: HTMLElement;
  private liveTimerEl: HTMLElement;
  private liveWpmEl: HTMLElement;
  private liveAccEl: HTMLElement;
  private caretEl: HTMLElement | null = null;

  // Active typing state
  private words: string[] = [];
  private currentWordIdx: number = 0;
  private currentCharIdx: number = 0;
  private typedWords: string[] = [];

  // Metrics tracking
  private isRunning: boolean = false;
  private startTime: number = 0;
  private timerInterval: number | null = null;
  private completionTimeout: number | null = null;
  private completionHandled: boolean = false;
  private isCompleting: boolean = false;
  private completionNotice: HTMLElement;
  private secondsRemaining: number = 30;
  private totalTypedKeystrokes: number = 0;
  private correctKeystrokes: number = 0;
  private errorKeystrokes: number = 0;
  private mistakesMap: Map<string, number> = new Map(); // "expected->typed" -> count
  private wpmHistory: WpmPoint[] = [];

  constructor() {
    this.wordsContainer = document.getElementById("words-container")!;
    this.hiddenInput = document.getElementById(
      "hidden-typing-input",
    ) as HTMLInputElement;
    this.typingBox = document.getElementById("typing-box")!;
    this.liveTimerEl = document.getElementById("live-timer")!;
    this.liveWpmEl = document.getElementById("live-wpm")!;
    this.liveAccEl = document.getElementById("live-acc")!;
    this.completionNotice = document.getElementById("session-complete-notice")!;

    this.bindEvents();
    this.resetTest();
  }

  private bindEvents() {
    // Focus capture
    this.typingBox.addEventListener("click", () => {
      this.focusInput();
    });

    this.hiddenInput.addEventListener("focus", () => {
      this.typingBox.classList.add("is-focused");
      if (this.caretEl) this.caretEl.classList.remove("blink");
    });

    this.hiddenInput.addEventListener("blur", () => {
      this.typingBox.classList.remove("is-focused");
      if (this.caretEl) this.caretEl.classList.add("blink");
    });

    // Keyboard capture
    window.addEventListener("keydown", (e) => {
      // Global shortcut: Tab + Enter or Ctrl/Cmd + Enter to restart
      if (
        (e.key === "Enter" && e.ctrlKey) ||
        (e.key === "Enter" && e.shiftKey) ||
        (e.key === "Enter" && e.metaKey)
      ) {
        e.preventDefault();
        this.resetTest();
        return;
      }

      // If user pressed Esc, blur
      if (e.key === "Escape") {
        this.hiddenInput.blur();
        return;
      }

      // If user is typing in settings or dev toolbar inputs, skip
      const target = e.target as HTMLElement;
      if (
        target &&
        ((target.tagName === "INPUT" && target !== this.hiddenInput) ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      // If in typing screen and hidden input is not focused
      if (appState.screen === "typing") {
        if (e.key === "Tab") {
          e.preventDefault();
          this.resetTest();
          return;
        }

        if (document.activeElement !== this.hiddenInput) {
          // If printable character typed, focus and process it immediately
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            this.focusInput();
            this.handleCharacter(e.key);
          } else if (e.key === "Backspace" || e.key === " ") {
            this.focusInput();
          }
        }
      }
    });

    this.hiddenInput.addEventListener("keydown", (e) => {
      if (appState.screen !== "typing") return;

      if (e.key === "Tab") {
        e.preventDefault();
        this.resetTest();
        return;
      }

      this.handleKey(e);
    });

    // Keep hidden input value cleared
    this.hiddenInput.addEventListener("input", () => {
      this.hiddenInput.value = "";
    });

    // Window resize -> reposition caret accurately
    window.addEventListener("resize", () => {
      this.updateCaretPosition();
    });
  }

  public focusInput() {
    if (this.isCompleting) return;
    this.hiddenInput.value = "";
    this.hiddenInput.focus();
    this.typingBox.classList.add("is-focused");
  }

  public resetTest(
    practiceMode: PracticeMode = null,
    regenerateWords = true,
  ) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.completionTimeout) {
      clearTimeout(this.completionTimeout);
      this.completionTimeout = null;
    }
    this.completionNotice.classList.remove("visible");
    this.completionNotice.setAttribute("aria-hidden", "true");

    this.isRunning = false;
    this.completionHandled = false;
    this.isCompleting = false;
    this.startTime = 0;
    this.currentWordIdx = 0;
    this.currentCharIdx = 0;
    this.typedWords = [""];
    this.totalTypedKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorKeystrokes = 0;
    this.mistakesMap.clear();
    this.wpmHistory = [];

    // Reset container scroll position
    this.wordsContainer.style.transform = "translateY(0px)";

    this.secondsRemaining =
      appState.config.modeType === "time" ? appState.config.timeTarget : 0;

    // Timer changes reset the test state but intentionally retain the current
    // wording. A normal restart or page load creates a new passage.
    if (regenerateWords) {
      if (practiceMode === "weak") {
        this.words = [...WEAK_SPOTS_WORDS, ...getDynamicPassage(60)];
      } else if (practiceMode === "mistakes") {
        const mistakePairs = appState.lastResult?.mistakes.map(
          (mistake) => `${mistake.expected}${mistake.typed}`,
        ) ?? [];
        this.words = getMistakePracticeWords(mistakePairs);
      } else if (appState.config.modeType === "words") {
        this.words = getRandomWords(appState.config.wordsTarget + 10);
      } else {
        // Generate a fresh passage for every test. The vocabulary is loaded
        // before TypingEngine is constructed, so the first visit is dynamic too.
        this.words = getDynamicPassage(100);
      }
    }

    this.renderWordsDOM();
    this.updateLiveStats();
    this.hiddenInput.value = "";
    this.focusInput();
  }

  private renderWordsDOM() {
    this.wordsContainer.innerHTML = "";

    this.words.forEach((word, wIdx) => {
      const wordEl = document.createElement("div");
      wordEl.className = "word";
      wordEl.dataset.wordIndex = wIdx.toString();

      for (let cIdx = 0; cIdx < word.length; cIdx++) {
        const charEl = document.createElement("span");
        charEl.className = "char untyped";
        charEl.textContent = word[cIdx];
        charEl.dataset.charIndex = cIdx.toString();
        wordEl.appendChild(charEl);
      }

      this.wordsContainer.appendChild(wordEl);
    });

    // Create Caret
    this.caretEl = document.createElement("div");
    this.caretEl.className = "caret blink";
    this.wordsContainer.appendChild(this.caretEl);

    // Initial positioning
    requestAnimationFrame(() => {
      this.updateCaretPosition();
    });
  }

  private handleKey(e: KeyboardEvent) {
    if (e.key === "Process" || e.isComposing) return;

    // Check Backspace or Delete FIRST (supports Ctrl+Backspace, Alt+Backspace, and Delete)
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const isWordDelete =
        e.ctrlKey || e.altKey || e.metaKey || e.key === "Delete";
      this.handleBackspace(isWordDelete);
      return;
    }

    // Ignore modifier keys, functional keys, arrows, etc.
    if (
      e.key === "Shift" ||
      e.key === "Control" ||
      e.key === "Alt" ||
      e.key === "Meta" ||
      e.key === "CapsLock" ||
      e.key === "Escape" ||
      e.key.startsWith("Arrow") ||
      e.key.startsWith("F") ||
      e.key === "Insert" ||
      e.key === "Home" ||
      e.key === "End" ||
      e.key === "PageUp" ||
      e.key === "PageDown"
    ) {
      return;
    }

    // Do not trigger typing on browser shortcuts
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      this.handleSpace();
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      this.handleCharacter(e.key);
      return;
    }
  }

  private startSession() {
    this.isRunning = true;
    this.startTime = Date.now();

    this.timerInterval = window.setInterval(() => {
      if (appState.config.modeType === "time") {
        this.secondsRemaining--;
        this.recordHistoryPoint();
        this.updateLiveStats();

        if (this.secondsRemaining <= 0) {
          this.finishSession();
        }
      } else {
        // Words mode - count elapsed seconds
        this.secondsRemaining++;
        this.recordHistoryPoint();
        this.updateLiveStats();
      }
    }, 1000);
  }

  private handleCharacter(typedChar: string) {
    if (this.isCompleting) return;
    const currentWord = this.words[this.currentWordIdx];
    if (!currentWord) return;

    // Strictly start session on the FIRST VALID CHARACTER TYPED
    if (!this.isRunning) {
      this.startSession();
    }

    this.totalTypedKeystrokes++;
    const currentWordEl = this.getWordEl(this.currentWordIdx);
    if (!currentWordEl) return;

    if (this.currentCharIdx < currentWord.length) {
      const expectedChar = currentWord[this.currentCharIdx];
      const charEl = currentWordEl.children[this.currentCharIdx] as HTMLElement;
      if (typedChar === expectedChar) {
        charEl.className = "char correct";
        this.correctKeystrokes++;
        sound.playKeyClick();
      } else {
        charEl.className = "char incorrect";
        this.errorKeystrokes++;
        sound.playErrorClick();
        // Record mistake pair
        const pairKey = `${expectedChar}→${typedChar}`;
        this.mistakesMap.set(pairKey, (this.mistakesMap.get(pairKey) || 0) + 1);
      }

      this.currentCharIdx++;
    } else {
      // Extra characters beyond word length
      const extraCharEl = document.createElement("span");
      extraCharEl.className = "char extra";
      extraCharEl.textContent = typedChar;
      currentWordEl.appendChild(extraCharEl);

      this.errorKeystrokes++;
      sound.playErrorClick();
      this.currentCharIdx++;
    }

    this.updateCaretPosition();
    this.updateLiveStats();
  }

  private handleBackspace(deleteWord: boolean) {
    if (this.isCompleting) return;
    const currentWordEl = this.getWordEl(this.currentWordIdx);
    if (!currentWordEl) return;

    if (this.currentCharIdx > 0) {
      sound.playKeyClick();
      if (deleteWord) {
        // Clear entire current word back to start of current word
        while (this.currentCharIdx > 0) {
          this.revertLastChar(currentWordEl);
        }
      } else {
        // Single backspace: delete exactly one character
        this.revertLastChar(currentWordEl);
      }
      this.updateCaretPosition();
      this.updateLiveStats();
    } else if (deleteWord && this.currentWordIdx > 0) {
      // ONLY when user explicitly triggers word delete (Ctrl+Backspace / Del / Alt+Backspace)
      // and they are at the beginning of the word: go back to previous word and clear it
      sound.playKeyClick();
      this.currentWordIdx--;
      const prevWordEl = this.getWordEl(this.currentWordIdx);
      if (prevWordEl) {
        this.currentCharIdx = prevWordEl.children.length;
        while (this.currentCharIdx > 0) {
          this.revertLastChar(prevWordEl);
        }
      }
      this.updateCaretPosition();
      this.updateLiveStats();
    }
  }

  private revertLastChar(wordEl: HTMLElement) {
    this.currentCharIdx--;
    const currentWord = this.words[this.currentWordIdx];

    if (this.currentCharIdx >= currentWord.length) {
      // It was an extra char
      const extraEl = wordEl.children[this.currentCharIdx];
      if (extraEl) wordEl.removeChild(extraEl);
      this.errorKeystrokes = Math.max(0, this.errorKeystrokes - 1);
      this.totalTypedKeystrokes = Math.max(0, this.totalTypedKeystrokes - 1);
    } else {
      const charEl = wordEl.children[this.currentCharIdx] as HTMLElement;
      if (charEl) {
        if (charEl.classList.contains("correct")) {
          this.correctKeystrokes = Math.max(0, this.correctKeystrokes - 1);
        } else if (charEl.classList.contains("incorrect")) {
          this.errorKeystrokes = Math.max(0, this.errorKeystrokes - 1);
        }
        this.totalTypedKeystrokes = Math.max(0, this.totalTypedKeystrokes - 1);
        charEl.className = "char untyped";
      }
    }
  }

  private handleSpace() {
    if (this.isCompleting) return;
    const currentWord = this.words[this.currentWordIdx];
    if (!currentWord) return;

    // Only allow space if at least 1 char was typed
    if (this.currentCharIdx === 0) return;

    sound.playKeyClick();
    this.totalTypedKeystrokes++;

    // Check if remaining characters in word were skipped (untyped) -> mark as missed
    const currentWordEl = this.getWordEl(this.currentWordIdx);
    if (currentWordEl && this.currentCharIdx < currentWord.length) {
      for (let i = this.currentCharIdx; i < currentWord.length; i++) {
        const missedChar = currentWordEl.children[i] as HTMLElement;
        if (missedChar) {
          missedChar.className = "char incorrect";
          this.errorKeystrokes++;
        }
      }
    }

    this.currentWordIdx++;
    this.currentCharIdx = 0;

    // Check words mode finish condition
    if (
      appState.config.modeType === "words" &&
      this.currentWordIdx >= appState.config.wordsTarget
    ) {
      this.finishSession();
      return;
    }

    // Append more words dynamically if approaching end
    if (this.currentWordIdx >= this.words.length - 8) {
      const more = getRandomWords(25);
      this.words.push(...more);
      more.forEach((word, wOffset) => {
        const wIdx = this.words.length - more.length + wOffset;
        const wordEl = document.createElement("div");
        wordEl.className = "word";
        wordEl.dataset.wordIndex = wIdx.toString();
        for (let c = 0; c < word.length; c++) {
          const charEl = document.createElement("span");
          charEl.className = "char untyped";
          charEl.textContent = word[c];
          wordEl.appendChild(charEl);
        }
        this.wordsContainer.appendChild(wordEl);
      });
    }

    this.updateCaretPosition();
    this.updateLiveStats();
  }

  private updateCaretPosition() {
    if (!this.caretEl) return;

    const currentWordEl = this.getWordEl(this.currentWordIdx);
    if (!currentWordEl) return;

    // Strict 3-line viewing window: calculate line offset and scroll accordingly
    const wordTop = currentWordEl.offsetTop;
    const lineH = 48; // exact line height in px
    const lineIndex = Math.floor(wordTop / lineH);

    if (lineIndex > 1) {
      const scrollY = (lineIndex - 1) * lineH;
      this.wordsContainer.style.transform = `translateY(-${scrollY}px)`;
    } else {
      this.wordsContainer.style.transform = "translateY(0px)";
    }

    const containerRect = this.wordsContainer.getBoundingClientRect();

    if (this.currentCharIdx < currentWordEl.children.length) {
      const charEl = currentWordEl.children[this.currentCharIdx] as HTMLElement;
      const charRect = charEl.getBoundingClientRect();
      const left = charRect.left - containerRect.left;
      const top = charRect.top - containerRect.top;

      this.caretEl.style.left = `${left}px`;
      this.caretEl.style.top = `${top + (charRect.height - 32) / 2}px`;
      this.caretEl.style.height = "32px";
    } else {
      // Past the end of current word (e.g. ready for space)
      const lastCharEl = currentWordEl.lastElementChild as HTMLElement;
      if (lastCharEl) {
        const lastRect = lastCharEl.getBoundingClientRect();
        const left = lastRect.right - containerRect.left;
        const top = lastRect.top - containerRect.top;

        this.caretEl.style.left = `${left}px`;
        this.caretEl.style.top = `${top + (lastRect.height - 32) / 2}px`;
        this.caretEl.style.height = "32px";
      }
    }
  }

  private getWordEl(idx: number): HTMLElement | null {
    return this.wordsContainer.querySelector(`[data-word-index="${idx}"]`);
  }

  private recordHistoryPoint(atElapsedSec?: number) {
    const elapsedSec = atElapsedSec ?? (Date.now() - this.startTime) / 1000;
    if (elapsedSec <= 0) return;

    const time = Math.max(1, Math.round(elapsedSec));

    const currentWpm = Math.max(
      0,
      Math.round(this.correctKeystrokes / 5 / (elapsedSec / 60)),
    );
    const currentRawWpm = Math.max(
      0,
      Math.round(this.totalTypedKeystrokes / 5 / (elapsedSec / 60)),
    );

    const point: WpmPoint = {
      time,
      wpm: currentWpm,
      rawWpm: currentRawWpm,
      errors: this.errorKeystrokes,
    };

    // Replace a point recorded for the same second instead of creating
    // duplicate x-coordinates in the result graph.
    const existingIndex = this.wpmHistory.findIndex((item) => item.time === time);
    if (existingIndex >= 0) {
      this.wpmHistory[existingIndex] = point;
    } else {
      this.wpmHistory.push(point);
      this.wpmHistory.sort((a, b) => a.time - b.time);
    }
  }

  private updateLiveStats() {
    // Timer display
    if (appState.config.modeType === "time") {
      this.liveTimerEl.textContent = Math.max(
        0,
        this.secondsRemaining,
      ).toString();
    } else {
      this.liveTimerEl.textContent = `${this.currentWordIdx}/${appState.config.wordsTarget}`;
    }

    // WPM & Accuracy calculation
    if (!this.isRunning || this.startTime === 0) {
      this.liveWpmEl.textContent = "0";
      this.liveAccEl.textContent = "100";
      return;
    }

    const elapsedMin = Math.max(0.01, (Date.now() - this.startTime) / 60000);
    const netWpm = Math.max(
      0,
      Math.round(this.correctKeystrokes / 5 / elapsedMin),
    );
    const accuracy =
      this.totalTypedKeystrokes > 0
        ? Math.round((this.correctKeystrokes / this.totalTypedKeystrokes) * 100)
        : 100;

    this.liveWpmEl.textContent = netWpm.toString();
    this.liveAccEl.textContent = Math.min(
      100,
      Math.max(0, accuracy),
    ).toString();
  }

  public finishSession() {
    // Timer ticks and word completion can race. A session must only produce
    // one result, one history entry, and one completion sound.
    if (this.completionHandled || !this.isRunning || this.startTime === 0) {
      return;
    }
    this.completionHandled = true;
    this.isCompleting = true;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;

    const elapsedSec = Math.max(
      1,
      Math.round((Date.now() - this.startTime) / 1000),
    );
    const elapsedMin = elapsedSec / 60;

    this.recordHistoryPoint(elapsedSec);

    const netWpm = Math.max(
      0,
      Math.round(this.correctKeystrokes / 5 / elapsedMin),
    );
    const rawWpm = Number(
      (this.totalTypedKeystrokes / 5 / elapsedMin).toFixed(1),
    );
    const accuracy = Number(
      (this.totalTypedKeystrokes > 0
        ? (this.correctKeystrokes / this.totalTypedKeystrokes) * 100
        : 100
      ).toFixed(1),
    );

    // Calculate consistency based on standard deviation of WPM
    let consistency = 84;
    if (this.wpmHistory.length > 2) {
      const speeds = this.wpmHistory.map((p) => p.wpm);
      const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const variance =
        speeds.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        speeds.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 0;
      consistency = Math.max(40, Math.min(99, Math.round(100 - cv * 100)));
    }

    // Top mistakes breakdown
    const mistakes: MistakeDetail[] = [];
    this.mistakesMap.forEach((count, key) => {
      const [expected, typed] = key.split("→");
      mistakes.push({ expected, typed, count });
    });
    mistakes.sort((a, b) => b.count - a.count);

    // Weak spots (common character pairings with errors or hesitation)
    const weakSpots =
      mistakes.length > 0
        ? mistakes.slice(0, 3).map((m) => m.expected + m.typed)
        : ["th", "er", "re"];

    const modeLabel =
      appState.config.modeType === "time"
        ? `${appState.config.timeTarget}s`
        : `${appState.config.wordsTarget}w`;

    const result: SessionResult = {
      netWpm,
      rawWpm,
      accuracy,
      correctChars: this.correctKeystrokes,
      incorrectChars: this.errorKeystrokes,
      extraChars: 0,
      consistency,
      durationSec: elapsedSec,
      modeLabel,
      wpmHistory: this.wpmHistory,
      mistakes: mistakes.slice(0, 4),
      weakSpots,
      timestamp: new Date(),
    };

    appState.setLastResult(result);
    sound.playSessionComplete();
    this.completionNotice.classList.add("visible");
    this.completionNotice.setAttribute("aria-hidden", "false");
    this.completionTimeout = window.setTimeout(() => {
      this.completionNotice.classList.remove("visible");
      this.completionNotice.setAttribute("aria-hidden", "true");
      appState.setScreen("result");
      this.completionTimeout = null;
    }, 650);
  }

}
