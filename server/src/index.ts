import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

interface Player {
    id: string;
    name: string;
    avatar: string;
    score: number;
    lastAnswer: string[] | null;
    isCorrect: boolean;
}

interface GameState {
    code: string;
    players: Player[];
    status: 'LOBBY' | 'QUESTION' | 'RESULT' | 'FINAL_SCORE';
    currentQuestionIndex: number;
    questions: any[];
    timerDuration?: number;
}

const games = new Map<string, GameState>();

function generateCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-game', (payload) => {
        console.log('Received create-game payload:', JSON.stringify(payload, null, 2));
        const { questions, timer } = payload;
        console.log('Extracted questions length:', questions?.length);
        console.log('Extracted timer:', timer);
        const code = generateCode();
        const game: GameState = {
            code,
            players: [],
            status: 'LOBBY',
            currentQuestionIndex: 0,
            questions,
            timerDuration: timer
        };
        games.set(code, game);
        socket.join(code);
        socket.emit('game-created', game);
        console.log(`Game created: ${code}`);
    });

    socket.on('join-game', ({ code, name, avatar }) => {
        const game = games.get(code.toUpperCase());
        if (game && game.status === 'LOBBY') {
            const player: Player = {
                id: socket.id,
                name,
                avatar,
                score: 0,
                lastAnswer: null,
                isCorrect: false
            };
            game.players.push(player);
            socket.join(code.toUpperCase());
            socket.emit('joined-game', game);
            io.to(code.toUpperCase()).emit('player-joined', game.players);
        } else {
            socket.emit('error', 'Game not found or already started');
        }
    });

    socket.on('start-game', (code) => {
        const game = games.get(code);
        if (game) {
            game.status = 'QUESTION';
            io.to(code).emit('game-status-changed', game);
        }
    });

    socket.on('time-up', (code) => {
        const game = games.get(code);
        if (game && game.status === 'QUESTION') {
            game.status = 'RESULT';

            // Calculate scores for any players who haven't answered or auto-submit
            const currentQuestion = game.questions[game.currentQuestionIndex];
            game.players.forEach(p => {
                if (!p.lastAnswer) {
                    p.lastAnswer = []; // Treat no answer as incorrect
                }
                const isCorrect = JSON.stringify(p.lastAnswer?.sort()) === JSON.stringify(currentQuestion.correctColors.sort());
                p.isCorrect = isCorrect;
                if (isCorrect) {
                    p.score += 10;
                }
            });

            io.to(code).emit('game-status-changed', game);
        }
    });

    socket.on('submit-answer', ({ code, answers }) => {
        const game = games.get(code);
        if (game && game.status === 'QUESTION') {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                player.lastAnswer = answers;

                // Check if all players answered
                const allAnswered = game.players.every(p => p.lastAnswer !== null);
                if (allAnswered) {
                    game.status = 'RESULT';

                    // Calculate scores
                    const currentQuestion = game.questions[game.currentQuestionIndex];
                    game.players.forEach(p => {
                        const isCorrect = JSON.stringify(p.lastAnswer?.sort()) === JSON.stringify(currentQuestion.correctColors.sort());
                        p.isCorrect = isCorrect;
                        if (isCorrect) {
                            p.score += 10;
                        }
                    });

                    io.to(code).emit('game-status-changed', game);
                } else {
                    io.to(code).emit('player-answered', game.players.map(p => ({ id: p.id, hasAnswered: p.lastAnswer !== null })));
                }
            }
        }
    });

    socket.on('next-question', (code) => {
        const game = games.get(code);
        if (game && game.status === 'RESULT') {
            game.currentQuestionIndex++;
            game.players.forEach(p => {
                p.lastAnswer = null;
                p.isCorrect = false;
            });

            if (game.currentQuestionIndex >= game.questions.length) {
                game.status = 'FINAL_SCORE';
            } else {
                game.status = 'QUESTION';
            }
            io.to(code).emit('game-status-changed', game);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle player removal if needed
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
