import { Server, Socket } from 'socket.io';
import { games } from '../game/gamesMap';
import { generateCode } from '../utils/generateCode';
import { GameState } from '../models/gameState';
import { Player } from '../models/player';

// Available avatar colors
const AVATAR_IDS = [
  'cyber-blue', 'neon-pink', 'electric-purple', 'solar-orange',
  'matrix-green', 'crimson-red', 'royal-violet', 'golden-yellow',
  'aqua-teal', 'hot-magenta', 'lime-green', 'deep-indigo',
  'coral-red', 'sky-cyan', 'sunset-orange', 'mint-green'
];

function getNextAvailableAvatar(takenAvatars: string[]): string {
  const available = AVATAR_IDS.find(id => !takenAvatars.includes(id));
  return available || AVATAR_IDS[0]; // Fallback to first if all taken
}

function compareAnswers(answers: string[] | null, correct: string[] | undefined): boolean {
  if (!answers || !correct) return false;
  if (answers.length !== correct.length) return false;
  const sortedAnswers = [...answers].map(a => a.toLowerCase().trim()).sort();
  const sortedCorrect = [...correct].map(c => c.toLowerCase().trim()).sort();
  return sortedAnswers.every((val, index) => val === sortedCorrect[index]);
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-game', (payload) => {
      const { questions, timer } = payload;
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
        const takenAvatars = game.players.map(p => p.avatar);
        const assignedAvatar = avatar || getNextAvailableAvatar(takenAvatars);

        const player: Player = {
          id: socket.id,
          name,
          avatar: assignedAvatar,
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
        const currentQuestion = game.questions[game.currentQuestionIndex];
        game.players.forEach(p => {
          const correct = currentQuestion?.correctAnswers || currentQuestion?.correctColors;
          const isCorrect = compareAnswers(p.lastAnswer, correct);
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
          const allAnswered = game.players.every(p => p.lastAnswer !== null);
          if (allAnswered) {
            game.status = 'RESULT';
            const currentQuestion = game.questions[game.currentQuestionIndex];
            game.players.forEach(p => {
              const correct = currentQuestion?.correctAnswers || currentQuestion?.correctColors;
              const isCorrect = compareAnswers(p.lastAnswer, correct);
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

    socket.on('check-room', (code) => {
      const game = games.get(code.toUpperCase());
      if (game) {
        socket.emit('room-checked', {
          exists: true,
          status: game.status,
          takenAvatars: game.players.map(p => p.avatar)
        });
        socket.join(code.toUpperCase());
      } else {
        socket.emit('room-checked', { exists: false });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      games.forEach((game, code) => {
        if (game.status === 'LOBBY') {
          const index = game.players.findIndex(p => p.id === socket.id);
          if (index !== -1) {
            game.players.splice(index, 1);
            io.to(code).emit('player-joined', game.players);
          }
        }
      });
    });
  });
}
