export interface Player {
    id: string;
    name: string;
    avatar: string;
    score: number;
    lastAnswer: string[] | null;
    socketId?: string;
    isCorrect: boolean;
    stealCardValue: number; // Value of the STEAL card (1-8)
    stealCardUsed: boolean; // Has the STEAL card been used?
    disabledIndexes?: number[]; // Indexes of options currently disabled for this player
    avatarStyle?: string;
    streak: number;
    answeredAt: number | null;
    isFastestFinger?: boolean;
    roundScore: number;
    streakPoints: number;
    fastestFingerPoints: number;
}
