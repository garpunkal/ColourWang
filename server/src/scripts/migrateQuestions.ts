import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface QuestionData {
    question: string;
    answer: string[];
    roundId?: string;
}

const questionsPath = join(__dirname, '../config/questions.json');
const questionsRaw = JSON.parse(readFileSync(questionsPath, 'utf8')) as QuestionData[];

const categories = {
    LOGOS: ['logo', 'brand', 'company', 'sainsbury', 'tesco', 'aldi', 'lidl', 'waitrose', 'asda', 'morrisons', 'co-op', 'iceland', 'marks & spencer', 'john lewis', 'boots', 'superdrug', 'primark', 'next', 'argos', 'greggs', 'costa', 'nando', 'wetherspoons', 'premier inn', 'travelodge', 'british airways', 'virgin atlantic', 'easyjet', 'ryanair', 'national rail', 'bbc', 'itv', 'channel 4', 'sky', 'bt', 'vodafone', 'ee', 'o2', 'three'],
    POP_CULTURE: ['potter', 'disney', 'pixar', 'marvel', 'star wars', 'simpsons', 'family guy', 'futurama', 'shrek', 'toystory', 'nemo', 'lion king', 'frozen', 'mario', 'sonic', 'pokemon', 'zelda', 'minecraft', 'fortnite', 'roblox', 'among us', 'game of thrones', 'stranger things', 'doctor who', 'sherlock', 'bond', 'batman', 'superman', 'spiderman', 'avengers', 'friend', 'office', 'breaking bad', 'crown', 'peppa', 'bluey', 'paw patrol', 'spongebob', 'scooby', 'flintstones', 'jetsons', 'tom and jerry', 'looney tunes', 'mickey', 'minnie', 'donald', 'goofy', 'pluto', 'winnie', 'paddington', 'postman pat', 'bob the builder', 'fireman sam', 'thomas', 'teletubbies', 'tweenies', 'noddy', 'pingu', 'wallace', 'gromit', 'gruffalo'],
    GEOGRAPHY: ['flag', 'country', 'capital', 'union jack', 'london', 'scotland', 'wales', 'england', 'ireland', 'usa', 'france', 'germany', 'italy', 'spain', 'china', 'japan', 'india', 'brazil', 'russia', 'australia', 'canada', 'mexico', 'egypt', 'africa', 'asia', 'europe'],
};

const processedQuestions = questionsRaw.map(q => {
    const text = q.question.toLowerCase();
    let roundId = 'general';

    // Check specific categories first
    if (categories.LOGOS.some(k => text.includes(k.toLowerCase()))) {
        roundId = 'logos';
    } else if (categories.POP_CULTURE.some(k => text.includes(k.toLowerCase()))) {
        roundId = 'pop_culture';
    } else if (categories.GEOGRAPHY.some(k => text.includes(k.toLowerCase()))) {
        roundId = 'geography';
    }

    return {
        ...q,
        roundId
    };
});

writeFileSync(questionsPath, JSON.stringify(processedQuestions, null, 4), 'utf8');
console.log(`Migrated ${processedQuestions.length} questions.`);

// Also update client config if it exists
try {
    const clientPath = join(__dirname, '../../../client/src/config/questions.json');
    writeFileSync(clientPath, JSON.stringify(processedQuestions, null, 4), 'utf8');
    console.log(`Updated client questions.json as well.`);
} catch (e) {
    console.log('Client questions.json not found or not updated.');
}
