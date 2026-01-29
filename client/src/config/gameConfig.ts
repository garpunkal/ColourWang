import type { Question } from '../types/game';

export const QUESTIONS: Question[] = [
    {
        id: '1',
        question: 'What colours are on the flag of England?',
        image: 'https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg',
        correctColors: ['#FFFFFF', '#CE1124'],
        options: ['#FFFFFF', '#CE1124', '#00247D', '#000000', '#FFD700', '#00843D']
    },
    {
        id: '2',
        question: 'What colours are in the Google logo?',
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        correctColors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
        options: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#000000', '#808080']
    },
    {
        id: '3',
        question: 'What colours are on a standard Rubik\'s Cube?',
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Rubik%27s_cube.svg',
        correctColors: ['#FFFFFF', '#FFFF00', '#0000FF', '#00FF00', '#FF0000', '#FFA500'],
        options: ['#FFFFFF', '#FFFF00', '#0000FF', '#00FF00', '#FF0000', '#FFA500', '#000000', '#800080']
    },
    {
        id: '4',
        question: 'What colours are on the Starbucks logo?',
        image: 'https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg',
        correctColors: ['#00704A', '#FFFFFF'],
        options: ['#00704A', '#FFFFFF', '#000000', '#CE1124']
    }
];

export const GAME_CONFIG = {
    rounds: 4,
    timerSeconds: 15,
};
