<p align="center">
  <img src="assets/shifty-lockup.svg" alt="Shifty" width="360" />
</p>

<p align="center">A focused, keyboard-first typing speed test for measuring speed, accuracy, and consistency.</p>

<p align="center">
  <img src="assets/shifty-preview.png" alt="Shifty typing screen preview" />
</p>

## What is Shifty?

Shifty is a lightweight typing practice application built with semantic HTML, modular CSS, and vanilla TypeScript. It provides a distraction-free typing canvas where users can measure their typing performance without a framework or runtime service dependency.

The application is designed around two simple states:

- **Typing state**: live words, timer, WPM, accuracy, caret, sound feedback, and restart controls.
- **Result state**: net WPM, raw WPM, accuracy, consistency, timing, mistake analysis, weak spots, history, and a performance graph.

## Main features

- Time sessions of 15, 30, 60, or 120 seconds.
- Words-based sessions with configurable targets.
- Timer starts only after the first valid printable character.
- Live WPM and accuracy calculations.
- Dynamic vocabulary loaded from `data/words-common.json`.
- Small in-code fallback vocabulary for offline or failed-load scenarios.
- Local word generation during a session, avoiding per-word network requests.
- Completion sound and visible notification when typing stops.
- SVG speed-stability chart with net-WPM and raw-WPM lines, error markers, and readable levels.
- Font choices including JetBrains Mono, Fira Code, Source Code Pro, Roboto Mono, Inconsolata, Space Mono, Cascadia Code, and system monospace.
- Caret styles, sound preferences, mistake practice, weak-spot practice, and recent session history.
- Transparent Shifty branding from `assets/shifty-lockup.svg`.

## How a typing session works

1. Shifty renders a starter passage immediately so the interface is usable without waiting.
2. `js/words.ts` loads and validates additional words from `data/words-common.json`.
3. The timer begins on the first printable character, not when the page loads or receives focus.
4. Words are rendered in the browser and more words are generated locally as the user approaches the end of the list.
5. When the timer reaches zero, the input stops, the completion cue appears, and the result screen opens.
6. The result renderer calculates and displays performance details from the completed session.

## Project structure

```text
Shifty/
├── index.html                 Application shell and accessible UI
├── css/
│   ├── index.css              CSS entry point
│   ├── variables.css          Design tokens
│   ├── base.css               Reset and shared styles
│   ├── shell.css              Header and layout
│   ├── typing.css             Typing screen
│   ├── result.css             Results and chart
│   └── settings.css            Preferences and mobile notice
├── js/                        TypeScript source
│   ├── main.ts                Application bootstrap and state transitions
│   ├── typing-engine.ts       Input, timer, scoring, caret, and words
│   ├── result-renderer.ts     Result metrics and SVG graph
│   ├── words.ts               Vocabulary loading and fallback generation
│   ├── settings.ts            Preferences and responsive behavior
│   ├── sound.ts               Browser-native Web Audio feedback
│   ├── state.ts               Shared reactive application state
│   └── types.ts               Shared TypeScript definitions
├── data/
│   └── words-common.json      Expandable common-word list
├── assets/
│   ├── shifty-lockup.svg      Transparent application logo
│   ├── shifty-icon.png        Favicon
│   └── shifty-preview.png     README screenshot
├── dist/                      Compiled browser JavaScript
├── package.json               Build and type-check scripts
├── tsconfig.json              TypeScript compiler configuration
└── AGENT.md                   Engineering guide for future changes
```

## Run locally

Install the development dependency and compile the TypeScript source:

```bash
npm install
npm run build
```

Start a local HTTP server from the project root:

```bash
python -m http.server 4173
```

Open [http://localhost:4173](http://localhost:4173) in a browser.

The HTTP server matters because Shifty uses native ES modules and fetches the JSON vocabulary file. Opening `index.html` directly with `file://` can prevent those browser features from working correctly.

To check types without emitting files:

```bash
npm run check
```

## Extending the vocabulary

Add lowercase alphabetic words to `data/words-common.json`. The loader filters invalid entries and removes duplicates when it merges the external list with the fallback words in `js/words.ts`.

For larger or themed vocabularies, create additional JSON files such as `words-technical.json` or `words-advanced.json`. Load the selected file once per session or mode; avoid requesting a remote word for every keystroke because network latency would affect the typing experience.

## Customization

- Update colors, spacing, typography, and radii in `css/variables.css`.
- Add or remove timer and word-count buttons in `index.html` and wire their values in `js/main.ts`.
- Add font choices in the settings select, the font stack map in `js/settings.ts`, and the font import in `index.html` when needed.
- Adjust graph dimensions in `index.html`, `js/result-renderer.ts`, and `css/result.css` together so the SVG viewBox and rendered container remain aligned.
- Keep the transparent logo at `assets/shifty-lockup.svg` for the header brand.

## Technology

- HTML5
- CSS3 with custom properties, Flexbox, and Grid
- TypeScript compiled to native ES modules
- Browser Web Audio API for sound feedback
- No frontend framework and no backend required

## License

MIT
