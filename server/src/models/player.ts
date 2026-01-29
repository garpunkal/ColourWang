export interface Player {
    id: string;
    name: string;
    avatar: string;
    score: number;
    lastAnswer: string[] | null;
    isCorrect: boolean;
}
