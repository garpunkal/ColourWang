import questionsRaw from './questions.json';
import paletteRaw from './palette.json';
import type { Question } from '../types/game';

interface QuestionData {
  id?: string;
  question: string;
  options?: string[];
  answer?: string[]; // Renamed from correct
  correct?: string[]; // Legacy support
  correctColors?: string[];
}

export const PALETTE = paletteRaw.palette;

const nameMap = new Map<string, string>(); // hex -> name
const hexMap = new Map<string, string>(); // name -> hex

PALETTE.forEach(p => {
  nameMap.set(p.hex.toLowerCase(), p.name.toLowerCase());
  hexMap.set(p.name.toLowerCase(), p.hex);
});

export function getColorName(hex: string): string {
  return nameMap.get(hex.toLowerCase()) || hex;
}

export function sortColors(colors: string[]): string[] {
  return [...colors].sort((a, b) => {
    const nameA = nameMap.get(a.toLowerCase()) || a.toLowerCase();
    const nameB = nameMap.get(b.toLowerCase()) || b.toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

// Fetch questions at runtime from questions.json
export async function fetchQuestions(): Promise<Question[]> {
  // Simulate async for consistency, but data is already loaded
  return new Promise((resolve) => {
    setTimeout(() => {
      const questionsData = questionsRaw as QuestionData[];
      console.log('Loaded questions raw count:', questionsData.length);
      const paletteData = paletteRaw.palette;

      // Use palette for options universally
      const paletteOptions = paletteData.map(p => p.hex);
      const questions: Question[] = questionsData.map((q: QuestionData, index: number) => {
        // Prioritize 'answer', fallback to 'correct' or 'correctColors'
        const rawAnswers = q.answer || q.correct || q.correctColors || [];
        const correctColors = rawAnswers.map((colorName: string) => hexMap.get(colorName.toLowerCase()) || colorName);
        return {
          id: q.id || `q-${index}`,
          question: q.question,
          options: sortColors(paletteOptions),
          correctColors: sortColors(correctColors),

        };
      });

      resolve(questions);
    }, 0);
  });
}

export const GAME_CONFIG = {
  rounds: 6,
  timerSeconds: 30,
};
