import { appState } from "./state.js";
export function setupDevToolbar(engine) {
    const toolbar = document.getElementById("dev-toolbar");
    const toggle = document.getElementById("dev-toolbar-toggle");
    const stateLabel = document.getElementById("dev-current-state-label");
    const btnTyping = document.getElementById("dev-btn-typing");
    const btnResult = document.getElementById("dev-btn-result");
    const presetMid = document.getElementById("dev-preset-mid");
    const presetHigh = document.getElementById("dev-preset-high");
    const presetTurbulent = document.getElementById("dev-preset-turbulent");
    // Toggle toolbar open/closed
    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        toolbar.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
        if (!toolbar.contains(e.target)) {
            toolbar.classList.remove("open");
        }
    });
    // Switch to typing state
    btnTyping.addEventListener("click", () => {
        appState.setScreen("typing");
        engine.resetTest();
    });
    // Switch to result state with default or existing result
    btnResult.addEventListener("click", () => {
        if (!appState.lastResult) {
            loadPresetResult(72, 78.2, 96.4, 83, 30, [
                { expected: "e", typed: "r", count: 3 },
                { expected: "t", typed: "y", count: 2 },
                { expected: "a", typed: "s", count: 2 },
            ]);
        }
        else {
            appState.setScreen("result");
        }
    });
    // Presets
    presetMid.addEventListener("click", () => {
        loadPresetResult(72, 78.2, 96.4, 83, 30, [
            { expected: "e", typed: "r", count: 3 },
            { expected: "t", typed: "y", count: 2 },
            { expected: "a", typed: "s", count: 2 },
        ]);
    });
    presetHigh.addEventListener("click", () => {
        loadPresetResult(108, 112.5, 99.1, 94, 30, [
            { expected: "c", typed: "v", count: 1 },
            { expected: "p", typed: "o", count: 1 },
        ], ["tr", "pl"]);
    });
    presetTurbulent.addEventListener("click", () => {
        loadPresetResult(54, 62.0, 88.0, 68, 30, [
            { expected: "e", typed: "r", count: 6 },
            { expected: "i", typed: "o", count: 5 },
            { expected: "n", typed: "m", count: 4 },
            { expected: "s", typed: "a", count: 3 },
        ], ["er", "in", "on"]);
    });
    function loadPresetResult(netWpm, rawWpm, accuracy, consistency, durationSec, mistakes, weakSpots = ["th", "er", "re"]) {
        const points = [];
        const step = 5;
        for (let t = 0; t <= durationSec; t += step) {
            const variance = Math.sin(t / 4) * (100 - consistency) * 0.15;
            const curNet = Math.round(netWpm + variance);
            const curRaw = Math.round(rawWpm + variance);
            points.push({
                time: t,
                wpm: curNet,
                rawWpm: curRaw,
                errors: t === 15 || t === 25 ? 1 : 0,
            });
        }
        const correctChars = Math.round(netWpm * 5 * (durationSec / 60));
        const totalMistakes = mistakes.reduce((sum, m) => sum + m.count, 0);
        const mockResult = {
            netWpm,
            rawWpm,
            accuracy,
            correctChars,
            incorrectChars: totalMistakes,
            extraChars: 0,
            consistency,
            durationSec,
            modeLabel: `${durationSec}s`,
            wpmHistory: points,
            mistakes,
            weakSpots,
            timestamp: new Date(),
        };
        appState.setLastResult(mockResult);
        appState.setScreen("result");
    }
    // Sync state label and active button
    appState.subscribe(() => {
        const isTyping = appState.screen === "typing";
        stateLabel.textContent = isTyping ? "Typing" : "Result";
        btnTyping.classList.toggle("active", isTyping);
        btnResult.classList.toggle("active", !isTyping);
    });
}
//# sourceMappingURL=dev-toolbar.js.map