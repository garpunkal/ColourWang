import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import paletteRaw from '../../../config/palette.json';

interface QuestionData {
    question: string;
    answer: string[];
    roundId?: string;
}

interface Question {
    id: string;
    question: string;
    correctColors: string[];
    options: string[];
}

interface RoundDefinition {
    id: string;
    title: string;
    description: string;
    sortOrder: number;
}

const PALETTE = paletteRaw.palette;
const hexMap = new Map<string, string>();

PALETTE.forEach(p => {
    hexMap.set(p.name.toLowerCase(), p.hex);
});

const paletteOptions = PALETTE.map(p => p.hex);

export interface Round {
    title: string;
    description: string;
    questions: Question[];
}

function mapQuestion(q: QuestionData, index: number): Question {
    const correctColors = q.answer.map(name => hexMap.get(name.toLowerCase()) || name);
    const randomToken = Math.random().toString(36).substring(7);
    return {
        id: `q-${randomToken}-${index}`,
        question: q.question,
        correctColors: correctColors,
        options: paletteOptions
    };
}

export function generateGameRounds(numRounds: number = 4, questionsPerRound: number = 10): Round[] {
    try {
        const questionsPath = join(__dirname, '../../../config/questions.json');
        const roundsPath = join(__dirname, '../../../config/rounds.json');

        const questionsRaw = JSON.parse(readFileSync(questionsPath, 'utf8')) as QuestionData[];
        const roundsDefinitions = JSON.parse(readFileSync(roundsPath, 'utf8')) as RoundDefinition[];

        // Helper to shuffle array
        const shuffle = <T>(array: T[]): T[] => {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        const usedQuestionIndices = new Set<number>();

        const getQuestionsForRoundId = (roundId: string, count: number): QuestionData[] => {
            // Filter candidates: must match roundId AND not be used
            // We use case-insensitive matching for robustness
            const targetRoundId = roundId.toLowerCase();

            const candidates = questionsRaw.filter((q, idx) => {
                if (usedQuestionIndices.has(idx)) return false;
                const qRoundId = (q.roundId || 'general').toLowerCase();
                return qRoundId === targetRoundId;
            });

            const shuffled = shuffle(candidates);
            const selected = shuffled.slice(0, count);

            // Mark as used
            selected.forEach(s => {
                const originalIndex = questionsRaw.indexOf(s);
                if (originalIndex !== -1) usedQuestionIndices.add(originalIndex);
            });

            return selected;
        };

        const rounds: Round[] = [];

        // Strategy: Shuffle ALL available categories (including General) to ensure truly random selection.
        // We ensure a category is not used again until we have cycled through all available valid categories.
        let candidates = shuffle([...roundsDefinitions]);
        let consecutiveFailures = 0;
        let roundsGenerated = 0;

        console.log(`[GameGen] Generating ${numRounds} rounds from pool of ${candidates.length} topics...`);

        while (roundsGenerated < numRounds) {
            // Refill candidates if we exhausted the unique list but need more rounds
            if (candidates.length === 0) {
                console.log('[GameGen] Exhausted unique topics, recycling pool...');
                candidates = shuffle([...roundsDefinitions]);
            }

            // Safety break to prevent infinite loops if no rounds are valid (e.g. no questions at all)
            if (consecutiveFailures >= roundsDefinitions.length * 2) {
                console.warn(`[GameGen] Could not generate full ${numRounds} rounds request. Generated ${roundsGenerated}.`);
                break;
            }

            const roundDef = candidates.shift()!;
            const questions = getQuestionsForRoundId(roundDef.id, questionsPerRound);

            // If we don't have enough questions (at least 50% of requested), skip this topic
            if (questions.length < questionsPerRound * 0.5) {
                // Silently skip to find a better one
                consecutiveFailures++;
                continue;
            }

            consecutiveFailures = 0; // Reset failure counter on success

            console.log(`[GameGen] Added Round ${roundsGenerated + 1}: ${roundDef.title}`);
            rounds.push({
                title: roundDef.title,
                description: roundDef.description,
                questions: questions.map(mapQuestion)
            });
            roundsGenerated++;
        }

        return rounds;

    } catch (error) {
        console.error('[SERVER] CRITICAL: Failed to generate rounds!', error);
        return [];
    }
}

export function getShuffledQuestions(count: number): Question[] {
    // Legacy support or fallback
    const rounds = generateGameRounds(1, count);
    return rounds.length > 0 ? rounds[0].questions : [];
}

export function removeQuestionByText(questionText: string): boolean {
    try {
        const questionsPath = join(__dirname, '../config/questions.json');
        const questionsRaw = JSON.parse(readFileSync(questionsPath, 'utf8')) as QuestionData[];

        const originalCount = questionsRaw.length;
        const filtered = questionsRaw.filter(q => q.question !== questionText);

        if (filtered.length === originalCount) {
            console.warn(`[SERVER] No matches found for removal: "${questionText}"`);
            return false;
        }

        writeFileSync(questionsPath, JSON.stringify(filtered, null, 4), 'utf8');
        console.log(`[SERVER] Permanently removed question. Pool size reduced from ${originalCount} to ${filtered.length}.`);

        // Also try to sync to client for dev consistency
        try {
            const clientQuestionsPath = join(__dirname, '../../../config/questions.json');
            writeFileSync(clientQuestionsPath, JSON.stringify(filtered, null, 4), 'utf8');
        } catch (e) {
            // Ignore if client path doesn't exist
        }

        return true;
    } catch (error) {
        console.error('[SERVER] Failed to remove question from disk!', error);
        return false;
    }
}
