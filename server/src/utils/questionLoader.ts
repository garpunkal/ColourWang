import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';
import paletteRaw from '../../../config/palette.json';

interface QuestionData {
    question: string;
    answer: string[];
    roundId?: string;
}

interface Question {
    id: string;
    question: string;
    correctColours: string[];
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
    const correctColours = q.answer.map(name => hexMap.get(name.toLowerCase()) || name);
    const randomToken = Math.random().toString(36).substring(7);
    return {
        id: `q-${randomToken}-${index}`,
        question: q.question,
        correctColours: correctColours,
        options: paletteOptions
    };
}

export function generateGameRounds(numRounds: number = 4, questionsPerRound: number = 10, selectedTopics?: string[]): Round[] {
    try {
        const questionsDir = join(__dirname, '../../../config/questions');
        const roundsPath = join(__dirname, '../../../config/rounds.json');

        // Load all question files from the questions directory
        const questionFiles = readdirSync(questionsDir).filter(file => file.endsWith('.json'));
        let questionsRaw: QuestionData[] = [];
        
        // Combine all question files into one array
        for (const file of questionFiles) {
            const filePath = join(questionsDir, file);
            const fileQuestions = JSON.parse(readFileSync(filePath, 'utf8')) as QuestionData[];
            questionsRaw.push(...fileQuestions);
        }

        const roundsDefinitions = JSON.parse(readFileSync(roundsPath, 'utf8')) as RoundDefinition[];
        
        // Filter rounds definitions to only include selected topics if provided
        const availableRounds = selectedTopics && selectedTopics.length > 0 
            ? roundsDefinitions.filter(rd => selectedTopics.includes(rd.id))
            : roundsDefinitions;

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

        // Strategy: Shuffle available categories to ensure truly random selection.
        // We ensure a category is not used again until we have cycled through all available valid categories.
        let candidates = shuffle([...availableRounds]);
        let consecutiveFailures = 0;
        let roundsGenerated = 0;

        const topicsInfo = selectedTopics && selectedTopics.length > 0 
            ? `${selectedTopics.length} selected topics: [${selectedTopics.join(', ')}]`
            : `${candidates.length} available topics (all)`;
        logger.info(`[GameGen] Generating ${numRounds} rounds from pool of ${topicsInfo}...`);

        while (roundsGenerated < numRounds) {
            // Refill candidates if we exhausted the unique list but need more rounds
            if (candidates.length === 0) {
                logger.debug('[GameGen] Exhausted unique topics, recycling pool...');
                candidates = shuffle([...availableRounds]);
            }

            // Safety break to prevent infinite loops if no rounds are valid (e.g. no questions at all)
            if (consecutiveFailures >= availableRounds.length * 2) {
                logger.warn(`[GameGen] Could not generate full ${numRounds} rounds request. Generated ${roundsGenerated}.`);
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

            logger.info(`[GameGen] Added Round ${roundsGenerated + 1}: ${roundDef.title}`);
            rounds.push({
                title: roundDef.title,
                description: roundDef.description,
                questions: questions.map(mapQuestion)
            });
            roundsGenerated++;
        }

        return rounds;

    } catch (error) {
        logger.error('[SERVER] CRITICAL: Failed to generate rounds!', error);
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
        const questionsDir = join(__dirname, '../../../config/questions');
        const questionFiles = readdirSync(questionsDir).filter(file => file.endsWith('.json'));
        
        let questionFound = false;
        let totalOriginalCount = 0;
        let totalNewCount = 0;

        // Search through all topic files
        for (const file of questionFiles) {
            const filePath = join(questionsDir, file);
            const questionsInFile = JSON.parse(readFileSync(filePath, 'utf8')) as QuestionData[];
            totalOriginalCount += questionsInFile.length;
            
            const filtered = questionsInFile.filter(q => q.question !== questionText);
            totalNewCount += filtered.length;
            
            // If this file had the question, update it
            if (filtered.length < questionsInFile.length) {
                writeFileSync(filePath, JSON.stringify(filtered, null, 4), 'utf8');
                logger.info(`[SERVER] Removed question from ${file}. File reduced from ${questionsInFile.length} to ${filtered.length} questions.`);
                questionFound = true;
            } else {
                totalNewCount += questionsInFile.length;
            }
        }

        if (!questionFound) {
            logger.warn(`[SERVER] No matches found for removal: "${questionText}"`);
            return false;
        }

        logger.info(`[SERVER] Question permanently removed. Total pool size reduced from ${totalOriginalCount} to ${totalNewCount}.`);
        return true;
    } catch (error) {
        logger.error('[SERVER] Failed to remove question from disk!', error);
        return false;
    }
}
