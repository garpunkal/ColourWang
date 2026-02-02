import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

interface QuestionData {
    question: string;
    answer: string[];
    roundId?: string;
}

const newQuestions: QuestionData[] = [
    // SPORTS
    { question: "What colour is the Ferrari F1 car?", answer: ["red"], roundId: "sports" },
    { question: "What colour is the centre of an archery target?", answer: ["yellow", "gold"], roundId: "sports" },
    { question: "What colour is the snooker ball worth 7 points?", answer: ["black"], roundId: "sports" },
    { question: "What colour is the snooker ball worth 1 point?", answer: ["red"], roundId: "sports" },
    { question: "What colour is the Green jersey in the Tour de France?", answer: ["green"], roundId: "sports" },
    { question: "What colour is the Yellow jersey in the Tour de France?", answer: ["yellow"], roundId: "sports" },
    { question: "What colours are the LA Lakers kit?", answer: ["purple", "yellow", "gold"], roundId: "sports" },
    { question: "What colours are the New York Yankees logo?", answer: ["blue", "white"], roundId: "sports" },
    { question: "What colour is the clay at the French Open tennis?", answer: ["orange", "red"], roundId: "sports" },
    { question: "What colour is a standard basketball?", answer: ["orange"], roundId: "sports" },

    // NATURE
    { question: "What colour is a Robin's breast?", answer: ["red", "orange"], roundId: "nature" },
    { question: "What colour is a Polar Bear's skin?", answer: ["black"], roundId: "nature" },
    { question: "What colour is a Giraffe's tongue?", answer: ["blue", "purple", "black"], roundId: "nature" },
    { question: "What colour is a common Poppy flower?", answer: ["red"], roundId: "nature" },
    { question: "What colour is the gemstone Sapphire?", answer: ["blue"], roundId: "nature" },
    { question: "What colour is the gemstone Emerald?", answer: ["green"], roundId: "nature" },
    { question: "What colour is the gemstone Ruby?", answer: ["red"], roundId: "nature" },
    { question: "What colour is a Flamingo normally?", answer: ["pink"], roundId: "nature" },
    { question: "What colour is the spice Saffron?", answer: ["red", "orange"], roundId: "nature" },
    { question: "What colour is the beak of a Toucan primarily?", answer: ["orange", "yellow", "black"], roundId: "nature" },

    // FOOD
    { question: "What colour is the inside of a Pistachio nut?", answer: ["green"], roundId: "food" },
    { question: "What colour is the liqueur Curacao?", answer: ["blue"], roundId: "food" },
    { question: "What colour is the fruit Lime?", answer: ["green"], roundId: "food" },
    { question: "What colour is the fruit Lemon?", answer: ["yellow"], roundId: "food" },
    { question: "What colour is the vegetable Aubergine (Eggplant)?", answer: ["purple"], roundId: "food" },
    { question: "What colour is the spice Turmeric?", answer: ["yellow", "orange"], roundId: "food" },
    { question: "What colour is traditional Red Leicester cheese?", answer: ["orange", "red"], roundId: "food" },
    { question: "What colour is the drink Guinness?", answer: ["black"], roundId: "food" },
    { question: "What colour is the packaging of Walkers Ready Salted crisps?", answer: ["red"], roundId: "food" },
    { question: "What colour is the packaging of Walkers Salt & Vinegar crisps?", answer: ["green"], roundId: "food" },
    { question: "What colour is the packaging of Walkers Cheese & Onion crisps?", answer: ["blue"], roundId: "food" },
    { question: "What colour is the yolk of an egg?", answer: ["yellow", "orange"], roundId: "food" },

    // ART & LIT
    { question: "What colour is the girl's earring in Vermeer's painting?", answer: ["white", "silver", "pearl"], roundId: "art_lit" },
    { question: "What colour is the girl's headscarf in Vermeer's 'Girl with a Pearl Earring'?", answer: ["blue", "yellow"], roundId: "art_lit" },
    { question: "What colour is Clifford the Big Red Dog?", answer: ["red"], roundId: "art_lit" },
    { question: "What colour is the cover of 'The Little Prince' originally?", answer: ["blue", "yellow"], roundId: "art_lit" },
    { question: "What widely available paint colour is made from Lapis Lazuli?", answer: ["blue"], roundId: "art_lit" },
    { question: "What colour were the slippers in the original Wizard of Oz book (not movie)?", answer: ["silver"], roundId: "art_lit" },
    { question: "What colour is the Great Gatsby's car in the book?", answer: ["yellow", "cream"], roundId: "art_lit" },
    { question: "What colour is Van Gogh's 'Sunflowers' primarily?", answer: ["yellow"], roundId: "art_lit" },

    // SCIENCE
    { question: "What colour is the planet Mars known as?", answer: ["red"], roundId: "science" },
    { question: "What colour is the planet Neptune?", answer: ["blue"], roundId: "science" },
    { question: "What colour is the hottest part of a candle flame?", answer: ["blue"], roundId: "science" },
    { question: "What colour is Litmus paper in acid?", answer: ["red"], roundId: "science" },
    { question: "What colour is Litmus paper in alkali?", answer: ["blue"], roundId: "science" },
    { question: "What colour is the metal Copper?", answer: ["orange", "brown"], roundId: "science" },
    { question: "What colour is Sulphur?", answer: ["yellow"], roundId: "science" },
    { question: "What colour is the blood of a Horseshoe Crab?", answer: ["blue"], roundId: "science" },
    { question: "What colour is the sun (actually)?", answer: ["white"], roundId: "science" },

    // HISTORY
    { question: "What colour were the uniforms of the Confederate army?", answer: ["grey"], roundId: "history" },
    { question: "What colour were the uniforms of the Union army?", answer: ["blue"], roundId: "history" },
    { question: "What colour was the Red Baron's plane?", answer: ["red"], roundId: "history" },
    { question: "What colour rose represented the House of York?", answer: ["white"], roundId: "history" },
    { question: "What colour rose represented the House of Lancaster?", answer: ["red"], roundId: "history" },
    { question: "What colour is the background of the Communist flag?", answer: ["red"], roundId: "history" },
    { question: "What colour was the 'Black Maria' police van?", answer: ["black"], roundId: "history" },
    { question: "What colour were Roman Imperial togas?", answer: ["purple"], roundId: "history" },
];

const questionsPath = join(__dirname, '../config/questions.json');
let questionsRaw: QuestionData[] = [];

try {
    questionsRaw = JSON.parse(readFileSync(questionsPath, 'utf8'));
} catch (e) {
    console.log("Creating new questions file.");
}

// Append new questions, checking for duplicates
let addedCount = 0;
newQuestions.forEach(nq => {
    // Check if exists by exact question text
    const exists = questionsRaw.some(q => q.question === nq.question);
    if (!exists) {
        questionsRaw.push(nq);
        addedCount++;
    } else {
        // Optional: Update roundId if it matches
        const existing = questionsRaw.find(q => q.question === nq.question);
        if (existing && !existing.roundId) {
            existing.roundId = nq.roundId;
        }
    }
});

writeFileSync(questionsPath, JSON.stringify(questionsRaw, null, 4), 'utf8');
console.log(`Added ${addedCount} new questions. Total questions now: ${questionsRaw.length}`);

// Sync to client
try {
    const clientPath = join(__dirname, '../../../client/src/config/questions.json');
    writeFileSync(clientPath, JSON.stringify(questionsRaw, null, 4), 'utf8');
    console.log(`Synced to client.`);
} catch (e) {
    // ignore
}
