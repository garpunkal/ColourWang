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
    status: 'LOBBY' | 'QUESTION' | 'RESULT' | 'FINAL_SCORE';
    currentQuestionIndex: number;
    questions: Question[];
    timerDuration?: number;
}
