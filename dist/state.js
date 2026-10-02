class AppState {
    constructor() {
        this.screen = "typing";
        this.config = {
            modeType: "time",
            timeTarget: 30,
            wordsTarget: 50,
        };
        this.preferences = {
            fontFamily: "jetbrains",
            caretStyle: "bar",
            sound: "tactile",
        };
        this.history = [];
        this.lastResult = null;
        this.listeners = [];
    }
    subscribe(fn) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== fn);
        };
    }
    notify() {
        this.listeners.forEach((fn) => fn());
    }
    setScreen(screen) {
        this.screen = screen;
        this.notify();
    }
    setModeType(mode) {
        this.config.modeType = mode;
        this.notify();
    }
    setTimeTarget(sec) {
        this.config.timeTarget = sec;
        this.notify();
    }
    setWordsTarget(count) {
        this.config.wordsTarget = count;
        this.notify();
    }
    setLastResult(result) {
        this.lastResult = result;
        // Add to history
        this.history.unshift({
            id: Date.now().toString(),
            mode: result.modeLabel,
            wpm: result.netWpm,
            accuracy: Math.round(result.accuracy),
            dateStr: "Just now",
        });
        if (this.history.length > 5) {
            this.history.pop();
        }
        this.notify();
    }
}
export const appState = new AppState();
//# sourceMappingURL=state.js.map