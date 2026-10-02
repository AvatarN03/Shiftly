import { appState } from "./state.js";
import { sound } from "./sound.js";
import { getRandomWords, INITIAL_PASSAGE, WEAK_SPOTS_WORDS } from "./words.js";
export class TypingEngine {
    constructor() {
        this.caretEl = null;
        // Active typing state
        this.words = [];
        this.currentWordIdx = 0;
        this.currentCharIdx = 0;
        this.typedWords = [];
        // Metrics tracking
        this.isRunning = false;
        this.startTime = 0;
        this.timerInterval = null;
        this.completionTimeout = null;
        this.completionHandled = false;
        this.secondsRemaining = 30;
        this.totalTypedKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.errorKeystrokes = 0;
        this.mistakesMap = new Map(); // "expected->typed" -> count
        this.wpmHistory = [];
        // Weak spots practice mode flag
        this.isWeakSpotsMode = false;
        this.wordsContainer = document.getElementById("words-container");
        this.hiddenInput = document.getElementById("hidden-typing-input");
        this.typingBox = document.getElementById("typing-box");
        this.liveTimerEl = document.getElementById("live-timer");
        this.liveWpmEl = document.getElementById("live-wpm");
        this.liveAccEl = document.getElementById("live-acc");
        this.completionNotice = document.getElementById("session-complete-notice");
        this.bindEvents();
        this.resetTest();
    }
    bindEvents() {
        // Focus capture
        this.typingBox.addEventListener("click", () => {
            this.focusInput();
        });
        this.hiddenInput.addEventListener("focus", () => {
            this.typingBox.classList.add("is-focused");
            if (this.caretEl)
                this.caretEl.classList.remove("blink");
        });
        this.hiddenInput.addEventListener("blur", () => {
            this.typingBox.classList.remove("is-focused");
            if (this.caretEl)
                this.caretEl.classList.add("blink");
        });
        // Keyboard capture
        window.addEventListener("keydown", (e) => {
            // Global shortcut: Tab + Enter or Ctrl/Cmd + Enter to restart
            if ((e.key === "Enter" && e.ctrlKey) ||
                (e.key === "Enter" && e.shiftKey) ||
                (e.key === "Enter" && e.metaKey)) {
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
            const target = e.target;
            if (target &&
                ((target.tagName === "INPUT" && target !== this.hiddenInput) ||
                    target.tagName === "SELECT")) {
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
                    }
                    else if (e.key === "Backspace" || e.key === " ") {
                        this.focusInput();
                    }
                }
            }
        });
        this.hiddenInput.addEventListener("keydown", (e) => {
            if (appState.screen !== "typing")
                return;
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
    focusInput() {
        this.hiddenInput.value = "";
        this.hiddenInput.focus();
        this.typingBox.classList.add("is-focused");
    }
    resetTest(weakSpotsOnly = false) {
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
        this.isWeakSpotsMode = weakSpotsOnly;
        this.isRunning = false;
        this.completionHandled = false;
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
        // Initialize words
        if (weakSpotsOnly) {
            this.words = [...WEAK_SPOTS_WORDS, ...getRandomWords(30)];
        }
        else if (appState.config.modeType === "words") {
            this.words = getRandomWords(appState.config.wordsTarget + 10);
            this.secondsRemaining = 0;
        }
        else {
            // Default: Initial natural passage + additional random words
            this.words = [...INITIAL_PASSAGE, ...getRandomWords(50)];
            this.secondsRemaining = appState.config.timeTarget;
        }
        this.renderWordsDOM();
        this.updateLiveStats();
        this.hiddenInput.value = "";
        this.focusInput();
    }
    renderWordsDOM() {
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
    handleKey(e) {
        if (e.key === "Process" || e.isComposing)
            return;
        // Check Backspace or Delete FIRST (supports Ctrl+Backspace, Alt+Backspace, and Delete)
        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            const isWordDelete = e.ctrlKey || e.altKey || e.metaKey || e.key === "Delete";
            this.handleBackspace(isWordDelete);
            return;
        }
        // Ignore modifier keys, functional keys, arrows, etc.
        if (e.key === "Shift" ||
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
            e.key === "PageDown") {
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
    startSession() {
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
            }
            else {
                // Words mode - count elapsed seconds
                this.secondsRemaining++;
                this.recordHistoryPoint();
                this.updateLiveStats();
            }
        }, 1000);
    }
    handleCharacter(typedChar) {
        const currentWord = this.words[this.currentWordIdx];
        if (!currentWord)
            return;
        // Strictly start session on the FIRST VALID CHARACTER TYPED
        if (!this.isRunning) {
            this.startSession();
        }
        this.totalTypedKeystrokes++;
        const currentWordEl = this.getWordEl(this.currentWordIdx);
        if (!currentWordEl)
            return;
        if (this.currentCharIdx < currentWord.length) {
            const expectedChar = currentWord[this.currentCharIdx];
            const charEl = currentWordEl.children[this.currentCharIdx];
            if (typedChar === expectedChar) {
                charEl.className = "char correct";
                this.correctKeystrokes++;
                sound.playKeyClick();
            }
            else {
                charEl.className = "char incorrect";
                this.errorKeystrokes++;
                sound.playErrorClick();
                // Record mistake pair
                const pairKey = `${expectedChar}→${typedChar}`;
                this.mistakesMap.set(pairKey, (this.mistakesMap.get(pairKey) || 0) + 1);
            }
            this.currentCharIdx++;
        }
        else {
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
    handleBackspace(deleteWord) {
        const currentWordEl = this.getWordEl(this.currentWordIdx);
        if (!currentWordEl)
            return;
        if (this.currentCharIdx > 0) {
            sound.playKeyClick();
            if (deleteWord) {
                // Clear entire current word back to start of current word
                while (this.currentCharIdx > 0) {
                    this.revertLastChar(currentWordEl);
                }
            }
            else {
                // Single backspace: delete exactly one character
                this.revertLastChar(currentWordEl);
            }
            this.updateCaretPosition();
            this.updateLiveStats();
        }
        else if (deleteWord && this.currentWordIdx > 0) {
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
    revertLastChar(wordEl) {
        this.currentCharIdx--;
        const currentWord = this.words[this.currentWordIdx];
        if (this.currentCharIdx >= currentWord.length) {
            // It was an extra char
            const extraEl = wordEl.children[this.currentCharIdx];
            if (extraEl)
                wordEl.removeChild(extraEl);
            this.errorKeystrokes = Math.max(0, this.errorKeystrokes - 1);
            this.totalTypedKeystrokes = Math.max(0, this.totalTypedKeystrokes - 1);
        }
        else {
            const charEl = wordEl.children[this.currentCharIdx];
            if (charEl) {
                if (charEl.classList.contains("correct")) {
                    this.correctKeystrokes = Math.max(0, this.correctKeystrokes - 1);
                }
                else if (charEl.classList.contains("incorrect")) {
                    this.errorKeystrokes = Math.max(0, this.errorKeystrokes - 1);
                }
                this.totalTypedKeystrokes = Math.max(0, this.totalTypedKeystrokes - 1);
                charEl.className = "char untyped";
            }
        }
    }
    handleSpace() {
        const currentWord = this.words[this.currentWordIdx];
        if (!currentWord)
            return;
        // Only allow space if at least 1 char was typed
        if (this.currentCharIdx === 0)
            return;
        sound.playKeyClick();
        this.totalTypedKeystrokes++;
        // Check if remaining characters in word were skipped (untyped) -> mark as missed
        const currentWordEl = this.getWordEl(this.currentWordIdx);
        if (currentWordEl && this.currentCharIdx < currentWord.length) {
            for (let i = this.currentCharIdx; i < currentWord.length; i++) {
                const missedChar = currentWordEl.children[i];
                if (missedChar) {
                    missedChar.className = "char incorrect";
                    this.errorKeystrokes++;
                }
            }
        }
        this.currentWordIdx++;
        this.currentCharIdx = 0;
        // Check words mode finish condition
        if (appState.config.modeType === "words" &&
            this.currentWordIdx >= appState.config.wordsTarget) {
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
    updateCaretPosition() {
        if (!this.caretEl)
            return;
        const currentWordEl = this.getWordEl(this.currentWordIdx);
        if (!currentWordEl)
            return;
        // Strict 3-line viewing window: calculate line offset and scroll accordingly
        const wordTop = currentWordEl.offsetTop;
        const lineH = 48; // exact line height in px
        const lineIndex = Math.floor(wordTop / lineH);
        if (lineIndex > 1) {
            const scrollY = (lineIndex - 1) * lineH;
            this.wordsContainer.style.transform = `translateY(-${scrollY}px)`;
        }
        else {
            this.wordsContainer.style.transform = "translateY(0px)";
        }
        const containerRect = this.wordsContainer.getBoundingClientRect();
        if (this.currentCharIdx < currentWordEl.children.length) {
            const charEl = currentWordEl.children[this.currentCharIdx];
            const charRect = charEl.getBoundingClientRect();
            const left = charRect.left - containerRect.left;
            const top = charRect.top - containerRect.top;
            this.caretEl.style.left = `${left}px`;
            this.caretEl.style.top = `${top + (charRect.height - 32) / 2}px`;
            this.caretEl.style.height = "32px";
        }
        else {
            // Past the end of current word (e.g. ready for space)
            const lastCharEl = currentWordEl.lastElementChild;
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
    getWordEl(idx) {
        return this.wordsContainer.querySelector(`[data-word-index="${idx}"]`);
    }
    recordHistoryPoint(atElapsedSec) {
        const elapsedSec = atElapsedSec ?? (Date.now() - this.startTime) / 1000;
        if (elapsedSec <= 0)
            return;
        const time = Math.max(1, Math.round(elapsedSec));
        const currentWpm = Math.max(0, Math.round(this.correctKeystrokes / 5 / (elapsedSec / 60)));
        const currentRawWpm = Math.max(0, Math.round(this.totalTypedKeystrokes / 5 / (elapsedSec / 60)));
        const point = {
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
        }
        else {
            this.wpmHistory.push(point);
            this.wpmHistory.sort((a, b) => a.time - b.time);
        }
    }
    updateLiveStats() {
        // Timer display
        if (appState.config.modeType === "time") {
            this.liveTimerEl.textContent = Math.max(0, this.secondsRemaining).toString();
        }
        else {
            this.liveTimerEl.textContent = `${this.currentWordIdx}/${appState.config.wordsTarget}`;
        }
        // WPM & Accuracy calculation
        if (!this.isRunning || this.startTime === 0) {
            this.liveWpmEl.textContent = "0";
            this.liveAccEl.textContent = "100";
            return;
        }
        const elapsedMin = Math.max(0.01, (Date.now() - this.startTime) / 60000);
        const netWpm = Math.max(0, Math.round(this.correctKeystrokes / 5 / elapsedMin));
        const accuracy = this.totalTypedKeystrokes > 0
            ? Math.round((this.correctKeystrokes / this.totalTypedKeystrokes) * 100)
            : 100;
        this.liveWpmEl.textContent = netWpm.toString();
        this.liveAccEl.textContent = Math.min(100, Math.max(0, accuracy)).toString();
    }
    finishSession() {
        // Timer ticks and word completion can race. A session must only produce
        // one result, one history entry, and one completion sound.
        if (this.completionHandled || !this.isRunning || this.startTime === 0) {
            return;
        }
        this.completionHandled = true;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
        const elapsedSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
        const elapsedMin = elapsedSec / 60;
        this.recordHistoryPoint(elapsedSec);
        const netWpm = Math.max(0, Math.round(this.correctKeystrokes / 5 / elapsedMin));
        const rawWpm = Number((this.totalTypedKeystrokes / 5 / elapsedMin).toFixed(1));
        const accuracy = Number((this.totalTypedKeystrokes > 0
            ? (this.correctKeystrokes / this.totalTypedKeystrokes) * 100
            : 100).toFixed(1));
        // Calculate consistency based on standard deviation of WPM
        let consistency = 84;
        if (this.wpmHistory.length > 2) {
            const speeds = this.wpmHistory.map((p) => p.wpm);
            const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
            const variance = speeds.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
                speeds.length;
            const stdDev = Math.sqrt(variance);
            const cv = mean > 0 ? stdDev / mean : 0;
            consistency = Math.max(40, Math.min(99, Math.round(100 - cv * 100)));
        }
        // Top mistakes breakdown
        const mistakes = [];
        this.mistakesMap.forEach((count, key) => {
            const [expected, typed] = key.split("→");
            mistakes.push({ expected, typed, count });
        });
        mistakes.sort((a, b) => b.count - a.count);
        // Weak spots (common character pairings with errors or hesitation)
        const weakSpots = mistakes.length > 0
            ? mistakes.slice(0, 3).map((m) => m.expected + m.typed)
            : ["th", "er", "re"];
        const modeLabel = appState.config.modeType === "time"
            ? `${appState.config.timeTarget}s`
            : `${appState.config.wordsTarget}w`;
        const result = {
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
//# sourceMappingURL=typing-engine.js.map