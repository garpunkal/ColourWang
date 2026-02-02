import { Player } from './player';

export interface GameState {
    code: string;
    players: Player[];
    status: 'LOBBY' | 'COUNTDOWN' | 'QUESTION' | 'RESULT' | 'FINAL_SCORE' | 'ROUND_INTRO';
    currentQuestionIndex: number;
    questions: any[];
    timerDuration?: number;
    resultDuration?: number;
    lobbyDuration?: number;
    jokersEnabled?: boolean;
    soundEnabled?: boolean;
    musicEnabled?: boolean;
    bgmTrack?: string;
    hostSocketId?: string;
    streaksEnabled?: boolean;
    fastestFingerEnabled?: boolean;
    accessibleLabels?: boolean;
    currentRoundIndex: number;
    rounds: {
        title: string;
        description?: string;
        questions: any[];
    }[];
}
