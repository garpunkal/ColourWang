export interface Player {
    id: string;
    name: string;
    avatar: string;
    score: number;
    lastAnswer: string[] | null;
    socketId?: string;
    isCorrect: boolean;
    stealCardValue: number;
    stealCardUsed: boolean;
    disabledIndexes?: number[];
    avatarStyle?: string;
    streak: number;
    answeredAt: number | null;
    isFastestFinger?: boolean;
    roundScore: number;
    streakPoints: number;
    fastestFingerPoints: number;
}

export interface Question {
    id: string;
    question: string;

    correctColors: string[];
    // Alias for frontend convenience or if backend sends it this way
    correctAnswers?: string[];
    options: string[];
}

export interface GameState {
    code: string;
    players: Player[];
    status: 'LOBBY' | 'COUNTDOWN' | 'QUESTION' | 'RESULT' | 'FINAL_SCORE';
    currentQuestionIndex: number;
    questions: Question[];
    timerDuration?: number;
    // Game Settings
    jokersEnabled?: boolean;
    resultDuration?: number;
    lobbyDuration?: number;
    soundEnabled?: boolean;
    musicEnabled?: boolean;
    bgmTrack?: string;
    streaksEnabled: boolean;
    fastestFingerEnabled: boolean;
    accessibleLabels?: boolean;
}
