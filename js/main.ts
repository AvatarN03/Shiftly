

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Core Engines

    const typingEngine = new TypingEngine();
    const resultRenderer = new ResultRenderer();
    setupSettings();
    setupDevToolbar(typingEngine);

})