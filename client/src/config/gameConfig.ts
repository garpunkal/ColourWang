import paletteRaw from '../../../config/palette.json';
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

// Fetch questions at runtime from questions directory
export async function fetchQuestions(): Promise<Question[]> {
  // In a browser environment, we need to load question files individually
  // For now, we'll load from a combined endpoint or individual imports
  return new Promise(async (resolve) => {
    try {
      // Import all individual topic files
      const [
        animalsData,
        disneyData,
        fashionData,
        foodData,
        historyData,
        netflixData,
        scienceData,
        superheroesData,
        toysData,
        videoGamesData
      ] = await Promise.all([
        import('../../../config/questions/trivia_animals.json'),
        import('../../../config/questions/trivia_disney.json'),
        import('../../../config/questions/trivia_fashion.json'),
        import('../../../config/questions/trivia_food.json'),
        import('../../../config/questions/trivia_history.json'),
        import('../../../config/questions/trivia_netflix.json'),
        import('../../../config/questions/trivia_science.json'),
        import('../../../config/questions/trivia_superheroes.json'),
        import('../../../config/questions/trivia_toys.json'),
        import('../../../config/questions/trivia_video_games.json')
      ]);

      // Combine all question data
      const allQuestionsData: QuestionData[] = [
        ...animalsData.default,
        ...disneyData.default,
        ...fashionData.default,
        ...foodData.default,
        ...historyData.default,
        ...netflixData.default,
        ...scienceData.default,
        ...superheroesData.default,
        ...toysData.default,
        ...videoGamesData.default
      ];

      console.log('Loaded questions from topic files count:', allQuestionsData.length);
      const paletteData = paletteRaw.palette;

      // Use palette for options universally
      const paletteOptions = paletteData.map(p => p.hex);
      const questions: Question[] = allQuestionsData.map((q: QuestionData, index: number) => {
        // Prioritize 'answer', fallback to 'correct' or 'correctColors'
        const rawAnswers = q.answer || q.correct || q.correctColors || [];
        const correctColors = rawAnswers.map((colorName: string) => hexMap.get(colorName.toLowerCase()) || colorName);

        const randomToken = Math.random().toString(36).substring(7);
        return {
          id: q.id || `q-${randomToken}-${index}`,
          question: q.question,
          options: paletteOptions,
          correctColors: correctColors,
          correctAnswers: correctColors // Alias for compatibility
        };
      });

      console.log('Processed questions:', questions.length);
      resolve(questions);
    } catch (error) {
      console.error('Error loading questions:', error);
      resolve([]);
    }
  });
}
