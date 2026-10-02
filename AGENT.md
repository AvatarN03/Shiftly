# Shifty engineering notes

This file is the implementation guide for agents working on Shifty, a minimalist keyboard-first typing speed test.

## Product direction

- Keep the interface calm, technical, compact, and keyboard-first.
- Preserve the dark canvas, warm amber accent, monospace typing area, and clean unboxed information hierarchy.
- The main application has two screen states: typing and result.
- Do not reintroduce prototype-only state switchers, mock-result controls, or developer toolbar UI into the production page.

## Runtime and build

- The source language is TypeScript with native ES modules.
- `index.html` loads compiled browser modules from `dist/main.js`.
- Source files live in `js/`; generated browser files live in `dist/`.
- Local imports in TypeScript use `.js` extensions so emitted modules resolve in browsers.
- Build with `npm run build` and type-check with `npm run check`.
- Serve through HTTP during development. Direct `file://` loading is not a reliable way to run module imports and JSON fetches.

## File responsibilities

- `js/main.ts`: creates engines, wires configuration controls, and switches typing/result visibility.
- `js/typing-engine.ts`: owns the hidden input, word DOM, caret, timer, keystroke counters, scoring, and session completion.
- `js/result-renderer.ts`: fills result metrics, mistake/weak-spot lists, history, and the SVG speed-stability chart.
- `js/words.ts`: owns the starter passage, fallback list, asynchronous JSON loading, validation, and local random-word generation.
- `js/settings.ts`: owns preferences, font selection, caret styles, sound toggles, and mobile handling.
- `js/sound.ts`: owns browser-native Web Audio key, error, and session-completion sounds.
- `js/state.ts`: owns screen state, test configuration, preferences, session result, and recent history.
- `js/types.ts`: shared type definitions.
- `data/words-common.json`: expandable common-word data source. Keep values lowercase and alphabetic.
- `css/`: modular visual styles. `css/index.css` is the import entry point.
- `assets/shifty-lockup.svg`: transparent header logo.

## Session behavior

The timer must not start on page load, focus, or modifier/navigation keys. It starts on the first valid printable character. Time mode decrements once per second; words mode completes after the configured word count.

When a session ends:

1. Stop and clear the timer.
2. Stop accepting typing input.
3. Build and store the session result.
4. Play the completion cue when sound is enabled.
5. Show `#session-complete-notice` with an assertive live-region status.
6. Transition to the result state after the short notification delay.

Do not make the transition immediate again unless the completion cue remains accessible.

## Word loading rules

The app must remain usable before or without the JSON request. `COMMON_WORDS` is the fallback. `loadWordList()` fetches `data/words-common.json`, validates strings with lowercase alphabetic characters, removes duplicates, and merges the result into the generation pool. Words are generated locally during a test; do not make a per-word API request.

## Result chart rules

- The chart is an SVG with a `680 x 280` viewBox.
- The outer chart container is intentionally tall enough for readable levels and labels.
- Net WPM uses the solid amber line.
- Raw WPM uses a subtle dashed line.
- Error samples use red markers.
- Horizontal WPM grid levels and numeric labels should remain legible when chart dimensions change.

## Branding and accessibility

- The product name is Shifty, never Shiftly.
- Use `assets/shifty-lockup.svg` rather than recreating the logo in text.
- Keep meaningful `alt`, `aria-label`, `role`, and live-region attributes when editing controls.
- Avoid removing keyboard focus behavior or the visible completion notification.

## Verification checklist

After changes:

1. Run `npm run check`.
2. Run `npm run build`.
3. Serve the root directory over HTTP.
4. Verify the typing screen loads words and the settings controls work.
5. Verify the timer ends with a visual/audio cue and then shows results.
6. Verify the result chart, history, and actions render without console errors.
