# AGENT.MD — Shiftly 2.0 Engineering Specification & Blueprint

This document is the authoritative engineering specification and implementation blueprint for **Shiftly 2.0**, a minimalist, developer-oriented typing speed application.

When building or refactoring this application with an LLM coding assistant, follow every rule, algorithm, formula, and visual contract detailed in this document to achieve the exact outcome.

---

## 1. Core Product Direction & Identity

* **Philosophy**: Minimalist, technical, calm, keyboard-first, distraction-free.
* **Domain Aesthetic**: Developer tool / high-precision instrument.
* **Anti-Slop Strict Rules**:
  * **NO** AI-style purple gradients, glassmorphism, floating cards-within-cards, or arbitrary scoreboards.
  * **NO** pill-badge sandwiches on metadata; metadata uses clean inline typographic separators (`·`).
  * **NO** traditional multi-page website structures; single-screen viewport with instantaneous transition between **Typing State** and **Result State**.
  * The typing text **sits directly on the background canvas** (no bounding cards, no borders around the text area).

---

## 2. Technology Stack & Zero-Dependency Rule

* **Markup**: Semantic HTML5.
* **Styling**: Pure CSS3 with CSS Custom Properties (Variables), Flexbox, CSS Grid. Zero component libraries, zero Tailwind.
* **Scripting**: Pure Vanilla JavaScript (ES2022+ native ES Modules) or TypeScript without runtime dependencies.
* **Audio**: Browser-native Web Audio API synthesizer (no external audio assets or network requests).
* **Fonts**:
  * Interface: Clean modern sans-serif (`'Plus Jakarta Sans'`, `-apple-system`, `sans-serif`).
  * Typing Text & Metrics: Monospace with tabular numerals (`'JetBrains Mono'`, `'IBM Plex Mono'`, `monospace`).

---

## 3. Recommended Folder & File Structure

```text
shiftly-2.0/
├── index.html                  # Semantic application shell & state containers
├── css/
│   ├── variables.css           # Color tokens, typography, radii, transitions
│   ├── base.css                # Box-sizing, reset, tabular numerals, kbd styling
│   ├── shell.css               # Header branding, minimal config bar, viewport layout
│   ├── typing.css              # Live stats, 3-line word box, caret, focus overlay
│   ├── result.css              # Hero WPM, metrics row, SVG speed graph, mistakes, history
│   ├── settings.css            # Preferences popover, mobile notice modal
│   └── dev-toolbar.css         # Developer prototype switcher & preset loader
└── js/
  ├── types.ts                # Data models & interfaces
  ├── words.ts                # Vocabulary pools, initial passage, weak-spot words
  ├── sound.ts                # Web Audio API mechanical switch synthesizer
  ├── state.ts                # Reactive store (screen state, test config, history)
  ├── typing-engine.ts        # Keystroke engine, 3-line scroll, live stats, timer
  ├── result-renderer.ts      # Result view population & SVG technical chart
  ├── settings.ts             # Preferences popover & mobile viewport handler
  ├── dev-toolbar.ts          # Developer state toggle & preset simulation
  └── main.ts                 # Application bootstrap & event delegation
```

---

## 4. Visual Tokens & Color Palette

```css
:root {
  /* Canvas & Structural Surfaces */
  --bg-primary: #121212;
  --bg-secondary: #171717;
  --bg-hover: #222222;
  --bg-card: #1a1a1a;

  /* Typography */
  --text-primary: #f5f5f5;      /* Correct typed characters & hero metrics */
  --text-secondary: #9e9e9e;    /* Labels, inactive buttons, stats units */
  --text-tertiary: #757575;     /* Footers, kickers, timestamps */
  --text-dim: #484848;

  /* Accent: Warm Amber / Shiftly Identity */
  --accent: #f59e0b;
  --accent-hover: #fbbf24;
  --accent-muted: rgba(245, 158, 11, 0.14);
  --accent-glow: rgba(245, 158, 11, 0.3);

  /* Status Signaling */
  --color-correct: #ffffff;
  --color-incorrect: #f87171;
  --color-incorrect-bg: rgba(248, 113, 113, 0.2);
  --color-untyped: #7c7c7c;     /* High contrast readability on dark canvas */

  /* Hairlines */
  --border-subtle: rgba(255, 255, 255, 0.12);
  --border-focus: rgba(245, 158, 11, 0.5);

  /* Dimensions */
  --container-max-w: 960px;
  --typing-line-height: 48px;
  --radius-sm: 4px;
  --radius-md: 6px;
}
```

---

## 5. Screen State Machine

Shiftly has exactly **two primary visual states** contained within `<main class="app-viewport">`:

```
               [ User presses key / Types first letter ]
 [ TYPING STATE ] ──────────────────────────────────────> [ ACTIVE TEST ]
        ▲                                                        │
        │ [ Tab + Enter / Restart ]                              │ [ Time reaches 0s / Words completed ]
        │                                                        ▼
        └────────────────────────────────────────────── [ RESULT STATE ]
```

### State 1: Typing Screen (`#typing-state`)
1. **Live Stats Bar**:
   * Timer countdown (`38px` bold amber with text shadow glow).
   * Live WPM (`24px` medium white).
   * Live Accuracy % (`24px` medium white).
2. **Typing Container (`.typing-box`)**:
   * **Strict 3-Line Window**: `height: 146px; max-height: 146px; overflow: hidden; position: relative;`
   * **Words Wrapper (`.words-wrapper`)**: Flex wrap, `gap: 0 16px; font-size: 26px; line-height: 48px;`
   * **Active Caret (`.caret`)**: `3px` width, `32px` height, `#f59e0b`, smooth blinking when idle.
   * **Focus Hint**: Floating pill ("Click or start typing to focus") visible only when input is blurred. No blur filter applied to the words.
3. **Restart Row**:
   * Minimal button `↻ Restart` with keyboard subhint: `Press Tab + Enter to restart anytime`.
4. **Metadata Footer**:
   * Quiet unboxed inline text: `30 seconds · English · No punctuation`.

### State 2: Result Screen (`#result-state`)
1. **Header Kicker**: `SESSION COMPLETE`.
2. **Primary Result Cluster**:
   * Prominent Net WPM (`76px` bold amber).
   * Accuracy percentage line (`19px`, e.g. `96.4% accuracy`).
3. **Analytical Metrics Row (Tabular Numerals)**:
   * `Raw WPM` | `Characters (Correct / Incorrect)` | `Consistency %` | `Time (s)`.
   * Unboxed or single clean border container; no separate cards per metric.
4. **Technical SVG Speed Stability Graph**:
   * `680x150` SVG coordinate space.
   * Solid amber line for Net WPM over time.
   * Subtle dashed line (`rgba(255,255,255,0.3)`) for Raw WPM.
   * Error dots (`#f87171`) pinned to seconds where errors occurred.
   * Horizontal dashed gridlines at 30 WPM intervals with numerical Y-axis labels.
   * X-axis timestamps (`0s`, `10s`, `20s`, `30s`).
5. **Detailed Breakdown**:
   * **Mistakes List**: Specific character replacement mappings (e.g. `e → r (3 mistakes)`).
   * **Character Stats**: Counts of Correct, Incorrect, and Extra characters.
   * **Weak Spots**: 2-character transition clusters (e.g. `th`, `er`, `re`) with a `[ Practice weak spots ]` action.
6. **Recent Sessions History**:
   * Compact table listing the last 3-5 sessions (`Mode · WPM · Acc · Time`).
7. **Action Triggers**:
   * Primary: `Type Again` (`Tab + Enter`).
   * Secondary: `Practice Mistakes Only`.

---

## 6. Exact Behavioral Algorithms & Formulas

### 6.1 Timer Trigger Rule (Critical)
* The countdown timer **MUST NOT** start when:
  * The page loads.
  * The input receives focus.
  * The user presses `Shift`, `Ctrl`, `Alt`, `Meta`, `CapsLock`, `Tab`, `Escape`, arrow keys, or functional keys.
* The timer **STRICTLY STARTS** on the **first valid printable character** received:
  ```javascript
  if (!this.isRunning && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    this.startSession();
  }
  ```

### 6.2 Strict 3-Line Viewport Scrolling
* To ensure only 3 lines are visible at any time:
  ```javascript
  const wordTop = currentWordEl.offsetTop;
  const lineH = 48; // exact line height in pixels
  const lineIndex = Math.floor(wordTop / lineH);

  if (lineIndex > 1) {
    const scrollY = (lineIndex - 1) * lineH;
    this.wordsContainer.style.transform = `translateY(-${scrollY}px)`;
  } else {
    this.wordsContainer.style.transform = 'translateY(0px)';
  }
  ```
* Caret coordinates relative to container:
  ```javascript
  const containerRect = this.wordsContainer.getBoundingClientRect();
  const charRect = charEl.getBoundingClientRect();
  const left = charRect.left - containerRect.left;
  const top = charRect.top - containerRect.top;

  this.caretEl.style.left = `${left}px`;
  this.caretEl.style.top = `${top + (charRect.height - 32) / 2}px`;
  this.caretEl.style.height = '32px';
  ```

### 6.3 Backspace & Word Deletion Specification
* **Single Backspace (`deleteWord: false`)**:
  * If `currentCharIdx > 0`: reverts the last typed character in the active word.
  * If `currentCharIdx === 0`: **STAYS at the start of current word**. Never automatically jumps back to previous word.
* **Word Deletion (`Ctrl + Backspace` / `Alt + Backspace` / `Delete`)**:
  * If `currentCharIdx > 0`: clears all characters in the current word back to index 0.
  * If `currentCharIdx === 0` and `currentWordIdx > 0`: moves back to the previous word and clears it completely for retyping.
* **Keystroke Counters Maintenance**:
  * When `revertLastChar()` is executed, decrement `totalTypedKeystrokes` and whichever counter (`correctKeystrokes` or `errorKeystrokes`) applied to that character.

### 6.4 Metrics Formulas
```javascript
// Net WPM (standard 5 characters = 1 word)
const elapsedMin = elapsedSeconds / 60;
const netWpm = Math.max(0, Math.round((correctKeystrokes / 5) / elapsedMin));

// Raw WPM (including errors)
const rawWpm = Number(((totalTypedKeystrokes / 5) / elapsedMin).toFixed(1));

// Accuracy
const accuracy = totalTypedKeystrokes > 0
  ? Number(((correctKeystrokes / totalTypedKeystrokes) * 100).toFixed(1))
  : 100;

// Consistency (% coefficient of variation of 1-second WPM samples)
const speeds = wpmHistory.map(p => p.wpm);
const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
const variance = speeds.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / speeds.length;
const cv = mean > 0 ? (Math.sqrt(variance) / mean) : 0;
const consistency = Math.max(40, Math.min(99, Math.round(100 - (cv * 100))));
```

---

## 7. Web Audio Synthesizer Implementation

Implement realistic tactile mechanical key feedback without external audio files:

```javascript
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isEnabled = true; // Enabled by default
    this.soundType = 'tactile';
    this.setupUnlock();
  }

  setupUnlock() {
    const unlock = () => {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playKeyClick() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. High-frequency tactile snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1500 + Math.random() * 200, t);
    snapOsc.frequency.exponentialRampToValueAtTime(320, t + 0.02);

    snapGain.gain.setValueAtTime(0.18, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(t);
    snapOsc.stop(t + 0.025);

    // 2. Mechanical bottom-out thud
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(140, t + 0.005);
    bodyOsc.frequency.exponentialRampToValueAtTime(60, t + 0.04);

    bodyGain.gain.setValueAtTime(0.14, t + 0.005);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);
    bodyOsc.start(t + 0.005);
    bodyOsc.stop(t + 0.05);
  }

  playErrorClick() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.setValueAtTime(180, t + 0.05);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.065);
  }
}
```

---

## 8. Keyboard Shortcuts Map

* **`Tab` + `Enter`**: Instant test restart / reset from any screen state.
* **`Tab`**: Quick focus / restart.
* **`Ctrl` + `Backspace` / `Alt` + `Backspace` / `Delete`**: Delete full active word; if at start of word, jump to previous word and clear it.
* **Single `Backspace`**: Delete single character; stay within active word.
* **`Escape`**: Pause typing / blur input.

---

## 9. Developer Testing Tooling

For testing and visual inspection before typing a full test:
* Provide a discreet fixed floating toolbar in the bottom-right corner.
* Provides immediate buttons to switch between `State: Typing` and `State: Result`.
* Provides mock result presets (`72 WPM / 96%`, `108 WPM / 99%`, `54 WPM / 88%`) so the result chart, mistake analysis, and weak spots can be reviewed instantly.
