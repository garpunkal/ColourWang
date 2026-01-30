import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import paletteRaw from '../config/palette.json';

interface QuestionData {
    question: string;
    answer: string[];
}

interface Question {
    id: string;
    question: string;
    correctColors: string[];
    options: string[];
}

const PALETTE = paletteRaw.palette;
const hexMap = new Map<string, string>();

PALETTE.forEach(p => {
    hexMap.set(p.name.toLowerCase(), p.hex);
});

const paletteOptions = PALETTE.map(p => p.hex);

export function getShuffledQuestions(count: number): Question[] {
    try {
        const questionsPath = join(__dirname, '../config/questions.json');
        const questionsRaw = JSON.parse(readFileSync(questionsPath, 'utf8')) as QuestionData[];

        console.log(`[SERVER] Shuffling pool of ${questionsRaw.length} questions. Requesting ${count}.`);

        // Fisher-Yates shuffle on the FULL pool
        const shuffled = [...questionsRaw];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selected = shuffled.slice(0, count);
        console.log(`[SERVER] Selected first 3: ${selected.slice(0, 3).map(q => q.question).join(' | ')}`);

        // Take the requested amount and map to the game format
        return selected.map((q, index) => {
            const correctColors = q.answer.map(name => hexMap.get(name.toLowerCase()) || name);
            const randomToken = Math.random().toString(36).substring(7);
            return {
                id: `q-${randomToken}-${index}`,
                question: q.question,
                correctColors: correctColors,
                options: paletteOptions
            };
        });
    } catch (error) {
        console.error('[SERVER] CRITICAL: Failed to load questions from disk!', error);
        return [];
    }
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
            const clientQuestionsPath = join(__dirname, '../../../client/src/config/questions.json');
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
