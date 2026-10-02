
export type ScreenState = 'typing' | 'result';

export type ModeType = 'time' | 'words';

export interface TestConfig {
    modeType: ModeType;
    timeTarget: number; // 15, 30, 60, 120
    wordsTarget: number; // 25, 50, 100
}

export interface WpmPoint {
    time: number; // second offset (e.g., 1, 2, 3, ...)
    wpm: number;
    rawWpm: number;
    errors: number;
}

export interface MistakeDetail {
    expected: string;
    typed: string;
    count: number;
}

export interface SessionResult {
    netWpm: number;
    rawWpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    consistency: number;
    durationSec: number;
    modeLabel: string;
    wpmHistory: WpmPoint[];
    mistakes: MistakeDetail[];
    weakSpots: string[];
    timestamp: Date;
}

export interface UserPerferences {
    fontFamily: 'jetbrains' | 'fira-code' | 'source-code-pro' | 'roboto-mono' | 'inconsolata' | 'cascadia-code';
    caretStyle: 'bar' | 'block' | 'underline';
    sound : 'off' | 'tactile' | 'soft';
}