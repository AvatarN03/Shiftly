import {
  ScreenState,
  TestConfig,
  UserPerferences,
  SessionResult,
} from "./types.js";

export interface HistoryItem {
  id: string;
  mode: string;
  wpm: number;
  accuracy: number;
  dateStr: string;
}

class AppState {
  public screen: ScreenState = "typing";
  public config: TestConfig = {
    modeType: "time",
    timeTarget: 30,
    wordsTarget: 50,
  };

  public preferences: UserPerferences = {
    fontFamily: "jetbrains",
    caretStyle: "bar",
    sound: "tactile",
  };

  public history: HistoryItem[] = [];

  public lastResult: SessionResult | null = null;

  private listeners: Array<() => void> = [];

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public notify() {
    this.listeners.forEach((fn) => fn());
  }

  public setScreen(screen: ScreenState) {
    this.screen = screen;
    this.notify();
  }

  public setModeType(mode: "time" | "words") {
    this.config.modeType = mode;
    this.notify();
  }

  public setTimeTarget(sec: number) {
    this.config.timeTarget = sec;
    this.notify();
  }

  public setWordsTarget(count: number) {
    this.config.wordsTarget = count;
    this.notify();
  }

  public setLastResult(result: SessionResult) {
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
