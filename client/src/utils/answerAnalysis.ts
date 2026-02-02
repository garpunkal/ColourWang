import type { Player } from '../types/game';

export interface AnswerAnalysis {
  answer: string[];
  count: number;
  percentage: number;
  players: Player[];
}

/**
 * Analyzes player answers and groups them by frequency
 * @param players Array of players with their answers
 * @returns Array of answer analyses sorted by frequency (most common first)
 */
export function analyzePlayerAnswers(players: Player[]): AnswerAnalysis[] {
  // Filter out players who didn't answer
  const answeredPlayers = players.filter(p => p.lastAnswer && p.lastAnswer.length > 0);
  
  if (answeredPlayers.length === 0) {
    return [];
  }

  // Group players by their answers
  const answerGroups = new Map<string, Player[]>();

  answeredPlayers.forEach(player => {
    if (!player.lastAnswer) return;
    
    // Sort and normalize the answer for consistent grouping
    const normalizedAnswer = [...player.lastAnswer]
      .map(a => a.toLowerCase().trim())
      .sort()
      .join(',');

    if (!answerGroups.has(normalizedAnswer)) {
      answerGroups.set(normalizedAnswer, []);
    }
    answerGroups.get(normalizedAnswer)!.push(player);
  });

  // Convert to analysis objects and sort by frequency
  const analyses: AnswerAnalysis[] = Array.from(answerGroups.entries()).map(([, groupPlayers]) => {
    // Reconstruct the original answer format from the first player in the group
    const originalAnswer = groupPlayers[0].lastAnswer || [];
    
    return {
      answer: originalAnswer,
      count: groupPlayers.length,
      percentage: Math.round((groupPlayers.length / answeredPlayers.length) * 100),
      players: groupPlayers
    };
  });

  // Sort by count (most common first)
  return analyses.sort((a, b) => b.count - a.count);
}

/**
 * Gets the most common player answer
 * @param players Array of players with their answers
 * @returns The most common answer analysis, or null if no answers
 */
export function getMostCommonAnswer(players: Player[]): AnswerAnalysis | null {
  const analyses = analyzePlayerAnswers(players);
  return analyses.length > 0 ? analyses[0] : null;
}

/**
 * Compares two answers to see if they match (case-insensitive, order-independent)
 * @param answer1 First answer array
 * @param answer2 Second answer array  
 * @returns True if answers match
 */
export function answersMatch(answer1: string[], answer2: string[]): boolean {
  if (answer1.length !== answer2.length) return false;
  
  const sorted1 = [...answer1].map(a => a.toLowerCase().trim()).sort();
  const sorted2 = [...answer2].map(a => a.toLowerCase().trim()).sort();
  
  return sorted1.every((val, index) => val === sorted2[index]);
}

/**
 * Checks if the most common player answer differs from the official answer
 * @param players Array of players with their answers
 * @param officialAnswer The official correct answer
 * @returns Object with analysis information
 */
export function shouldSuggestOverride(players: Player[], officialAnswer: string[]): {
  shouldSuggest: boolean;
  mostCommonAnswer: AnswerAnalysis | null;
  correctCount: number;
  totalAnswered: number;
} {
  const mostCommon = getMostCommonAnswer(players);
  const answeredPlayers = players.filter(p => p.lastAnswer && p.lastAnswer.length > 0);
  const correctCount = players.filter(p => p.isCorrect).length;
  
  if (!mostCommon || answeredPlayers.length === 0) {
    return {
      shouldSuggest: false,
      mostCommonAnswer: null,
      correctCount,
      totalAnswered: answeredPlayers.length
    };
  }

  // Suggest override if:
  // 1. Most common answer is different from official answer
  // 2. Most common answer has more responses than the correct answer
  // 3. At least 2 people gave the most common answer
  const isDifferent = !answersMatch(mostCommon.answer, officialAnswer);
  const hasMoreThanCorrect = mostCommon.count > correctCount;
  const hasMinimumResponses = mostCommon.count >= 2;
  
  return {
    shouldSuggest: isDifferent && hasMoreThanCorrect && hasMinimumResponses,
    mostCommonAnswer: mostCommon,
    correctCount,
    totalAnswered: answeredPlayers.length
  };
}