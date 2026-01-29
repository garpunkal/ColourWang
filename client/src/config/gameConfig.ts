import questionsData from './questions.generated.json';
import type { Question } from '../types/game';

interface QuestionData {
  id?: string;
  question: string;
  options: string[];
  correct: string[];
  correctColors?: string[];
  image?: string;
}

interface QuestionsJSON {
  palette: { name: string; hex: string }[];
  questions: QuestionData[];
}

export const PALETTE = (questionsData as QuestionsJSON).palette;

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
      const data = questionsData as QuestionsJSON;

      if (!data.questions || !data.palette) {
        throw new Error('Invalid questions format');
      }

      // Map JSON format to our internal Question interface
      const questions: Question[] = data.questions.map((q: QuestionData, index: number) => {
        const options = (q.options || []).map((colorName: string) => hexMap.get(colorName.toLowerCase()) || colorName);
        const correctColors = (q.correct || q.correctColors || []).map((colorName: string) => hexMap.get(colorName.toLowerCase()) || colorName);

        return {
          id: q.id || `q-${index}`,
          question: q.question,
          options: sortColors(options),
          correctColors: sortColors(correctColors),
          image: q.image
        };
      });

      resolve(questions);
    }, 0);
  });
}

export const GAME_CONFIG = {
  rounds: 4,
  timerSeconds: 15,
};
