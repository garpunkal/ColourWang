
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

// Adjust paths based on where script is run (server root assumed)
// If run from j:\git\github.com\garpunkal\ColourWang\server
// src/scripts/migrate_flags.ts -> ../config/questions.json

const questionsPath = join(__dirname, '../config/questions.json');
// Path to client config to keep in sync
const clientQuestionsPath = join(__dirname, '../../../client/src/config/questions.json');

console.log('Reading from:', questionsPath);

try {
    const questions = JSON.parse(readFileSync(questionsPath, 'utf8'));
    let migratedCount = 0;

    questions.forEach((q: any) => {
        // Check for "flag of" pattern
        // Be careful not to match "six flags" or something unrelated if it existed, but "What colours are found on the flag of" is standard.
        if (q.question.toLowerCase().includes('flag of')) {
            // Only migrate if currently geography or undefined
            if (!q.roundId || q.roundId === 'geography') {
                q.roundId = 'flags';
                migratedCount++;
            }
        }
    });

    logger.info(`Migrated ${migratedCount} questions to 'flags' round.`);

    const newData = JSON.stringify(questions, null, 4);
    writeFileSync(questionsPath, newData);

    try {
        writeFileSync(clientQuestionsPath, newData);
        logger.info('Synced to client config.');
    } catch (e) {
        logger.warn('Could not sync to client config (might not exist):', e);
    }

} catch (e) {
    logger.error('Migration failed:', e);
}
