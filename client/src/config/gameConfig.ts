import paletteRaw from '../../../config/palette.json';
import type { Question } from '../types/game';

interface QuestionData {
  id?: string;
  question: string;
  options?: string[];
  answer?: string[]; // Renamed from correct
  correct?: string[]; // Legacy support
  correctColours?: string[];
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
  try {
    // Import all individual topic files
    const [
      animalsData,
      carsData,
      celebritiesData,
      disneyData,
      fashionData,
      flagsData,
      foodData,
      generalData,
      geographyData,
      historyData,
      householdData,
      logosData,
      moviesTvData,
      musicData,
      natureData,
      netflixData,
      popCultureData,
      scienceData,
      sportsData,
      superheroesData,
      toysData,
      videoGamesData
    ] = await Promise.all([
      import('../../../config/questions/trivia_animals.json'),
      import('../../../config/questions/trivia_cars.json'),
      import('../../../config/questions/trivia_celebrities.json'),
      import('../../../config/questions/trivia_disney.json'),
      import('../../../config/questions/trivia_fashion.json'),
      import('../../../config/questions/trivia_flags.json'),
      import('../../../config/questions/trivia_food.json'),
      import('../../../config/questions/trivia_general.json'),
      import('../../../config/questions/trivia_geography.json'),
      import('../../../config/questions/trivia_history.json'),
      import('../../../config/questions/trivia_household.json'),
      import('../../../config/questions/trivia_logos.json'),
      import('../../../config/questions/trivia_movies_tv.json'),
      import('../../../config/questions/trivia_music.json'),
      import('../../../config/questions/trivia_nature.json'),
      import('../../../config/questions/trivia_netflix.json'),
      import('../../../config/questions/trivia_pop_culture.json'),
      import('../../../config/questions/trivia_science.json'),
      import('../../../config/questions/trivia_sports.json'),
      import('../../../config/questions/trivia_superheroes.json'),
      import('../../../config/questions/trivia_toys.json'),
      import('../../../config/questions/trivia_video_games.json')
    ]);

    // Combine all question data
    const allQuestionsData: QuestionData[] = [
      ...animalsData.default,
      ...carsData.default,
      ...celebritiesData.default,
      ...disneyData.default,
      ...fashionData.default,
      ...flagsData.default,
      ...foodData.default,
      ...generalData.default,
      ...geographyData.default,
      ...historyData.default,
      ...householdData.default,
      ...logosData.default,
      ...moviesTvData.default,
      ...musicData.default,
      ...natureData.default,
      ...netflixData.default,
      ...popCultureData.default,
      ...scienceData.default,
      ...sportsData.default,
      ...superheroesData.default,
      ...toysData.default,
      ...videoGamesData.default
    ];

    console.log('Loaded questions from topic files count:', allQuestionsData.length);
    const paletteData = paletteRaw.palette;

    // Use palette for options universally
    const paletteOptions = paletteData.map(p => p.hex);
    const questions: Question[] = allQuestionsData.map((q: QuestionData, index: number) => {
      // Prioritize 'answer', fallback to 'correct' or 'correctColours'
      const rawAnswers = q.answer || q.correct || q.correctColours || [];
      const correctColours = rawAnswers.map((colourName: string) => hexMap.get(colourName.toLowerCase()) || colourName);

      const randomToken = Math.random().toString(36).substring(7);
      return {
        id: q.id || `q-${randomToken}-${index}`,
        question: q.question,
        options: paletteOptions,
        correctColours: correctColours,
        correctAnswers: correctColours // Alias for compatibility
      };
    });

    console.log('Processed questions:', questions.length);
    return questions;
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
}
