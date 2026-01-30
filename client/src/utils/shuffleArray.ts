/**
 * Fisher-Yates (Knuth) shuffle algorithm
 * Guarantees uniform distribution of all permutations
 * 
 * @param array - Array to shuffle
 * @returns A new shuffled array (does not mutate original)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
