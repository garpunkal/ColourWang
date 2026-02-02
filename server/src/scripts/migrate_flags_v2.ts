
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Adjust paths based on where script is run (server root assumed)
// Read from CLIENT as source of truth
const clientQuestionsPath = join(__dirname, '../../../client/src/config/questions.json');
const serverQuestionsPath = join(__dirname, '../config/questions.json');

console.log('Reading from Client (Source of Truth):', clientQuestionsPath);

try {
    const questions = JSON.parse(readFileSync(clientQuestionsPath, 'utf8'));
    let migratedCount = 0;

    questions.forEach((q: any) => {
        const text = q.question.toLowerCase();
        // Check for "flag" anywhere in the question
        if (text.includes('flag')) {
            // Only migrate if currently geography, general, or undefined
            // We avoid overriding if it's already properly categorized or some other specific category we don't want to touch (though 'flags' is very specific).
            if (!q.roundId || q.roundId === 'geography' || q.roundId === 'general') {
                q.roundId = 'flags';
                migratedCount++;
            }
        }
    });

    console.log(`Migrated ${migratedCount} questions to 'flags' round.`);

    const newData = JSON.stringify(questions, null, 4);

    // Save back to client
    writeFileSync(clientQuestionsPath, newData);
    console.log('Updated Client config.');

    // Save to server
    writeFileSync(serverQuestionsPath, newData);
    console.log('Synced to Server config.');

} catch (e) {
    console.error('Migration failed:', e);
}
