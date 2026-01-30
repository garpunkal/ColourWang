import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { games } from '../game/gamesMap';
import { getShuffledQuestions, removeQuestionByText } from '../utils/questionLoader';

import { generateCode } from '../utils/generateCode';
import { GameState } from '../models/gameState';
import { Player } from '../models/player';

// Available avatar colors
import avatarsData from '../constants/avatars.json';

// Available avatar colors
const AVATAR_IDS = avatarsData.colors.map(c => c.id);

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

    socket.on('remove-question', (payload: { code: string }) => {
      const { code } = payload;
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);

      if (game && game.hostSocketId === socket.id) {
        const currentQuestion = game.questions[game.currentQuestionIndex];
        if (currentQuestion) {
          console.log(`[SERVER] Host requested removal of: "${currentQuestion.question}"`);
          const success = removeQuestionByText(currentQuestion.question);
          if (success) {
            // Logic to skip the question if we are in result or question state
            // Actually, usually they do this on the result screen.
            // We can just emit a "question-removed" event so the host can show a toast or just skip.
            socket.emit('question-removed', { success: true });
          }
        }
      }
    });

    socket.on('create-game', (payload) => {
      const { rounds, timer, resultDuration, jokersEnabled, soundEnabled, musicEnabled, bgmTrack } = payload;
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();

      // Use server-side shuffling for maximum variety
      const finalQuestions = getShuffledQuestions(rounds || 10);

      const game: GameState = {
        code,
        players: [],
        status: 'LOBBY',
        currentQuestionIndex: 0,
        questions: finalQuestions,
        timerDuration: timer,
        resultDuration,
        jokersEnabled,
        soundEnabled,
        musicEnabled,
        bgmTrack,
        hostSocketId: socket.id
      };
      games.set(code, game);
      socket.join(code);
      socket.emit('game-created', game);
      console.log(`Game created: ${code} with ${finalQuestions.length} questions. First question: ${finalQuestions[0]?.question}`);
    });

    socket.on('use-steal-card', (payload: { code: string }) => {
      const { code } = payload;
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game && game.status === 'QUESTION') {
        const player = game.players.find((p: Player) => p.socketId === socket.id);
        if (player && !player.stealCardUsed) {
          // Only set stealCardUsed = true for the player who used it
          player.stealCardUsed = true;
          // Generate random disabled indexes for each other player
          const disabledMap: Record<string, number[]> = {};
          const optionCount = game.questions[game.currentQuestionIndex]?.options?.length || 0;
          game.players.forEach((p: Player) => {
            if (p.id !== player.id) {
              let indexes = Array.from({ length: optionCount }, (_, i) => i);
              for (let i = indexes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
              }
              disabledMap[p.id] = indexes.slice(0, player.stealCardValue);
              p.disabledIndexes = disabledMap[p.id];
            }
          });
          io.to(normalizedCode).emit('steal-card-used', { playerId: player.id, value: player.stealCardValue, disabledMap });
        }
      }
    });

    socket.on('join-game', ({ code, name, avatar, avatarStyle }) => {
      const game = games.get(code.toUpperCase());
      if (game && game.status === 'LOBBY') {
        // Check for maximum players
        if (game.players.length >= 10) {
          socket.emit('error', 'Game is full (maximum 10 players)');
          return;
        }

        const takenAvatars = game.players.map(p => p.avatar);
        const assignedAvatar = avatar || getNextAvailableAvatar(takenAvatars);

        const playerId = randomUUID();
        const player: Player = {
          id: playerId,
          socketId: socket.id,
          name,
          avatar: assignedAvatar,
          avatarStyle: avatarStyle || 'avataaars',
          score: 0,
          lastAnswer: null,
          isCorrect: false,
          stealCardValue: Math.floor(Math.random() * 8) + 1, // 1-8
          stealCardUsed: false,
          disabledIndexes: []
        };
        game.players.push(player);
        socket.join(code.toUpperCase());
        // Patch the players array in the game object itself
        game.players = game.players.map(p => ({
          ...p,
          stealCardValue: typeof p.stealCardValue === 'number' ? p.stealCardValue : Math.floor(Math.random() * 8) + 1,
          stealCardUsed: typeof p.stealCardUsed === 'boolean' ? p.stealCardUsed : false,
          disabledIndexes: Array.isArray(p.disabledIndexes) ? p.disabledIndexes : []
        }));
        // Debug: print all players before emitting joined-game
        console.log('[DEBUG] joined-game emit, players:', JSON.stringify(game.players, null, 2));
        socket.emit('joined-game', { game, playerId });
        // Debug: print all players before emitting player-joined
        console.log('[DEBUG] player-joined emit, players:', JSON.stringify(game.players, null, 2));
        io.to(code.toUpperCase()).emit('player-joined', game.players);
      } else {
        socket.emit('error', 'Game not found or already started');
      }
    });

    socket.on('rejoin-game', ({ code, playerId, isHost }) => {
      const game = games.get(code.toUpperCase());
      if (game) {
        if (isHost) {
          game.hostSocketId = socket.id;
          socket.join(code.toUpperCase());
          socket.emit('joined-game', game);
          console.log(`Host rejoined game ${code}`);
          return;
        }

        const player = game.players.find(p => p.id === playerId);
        if (player) {
          player.socketId = socket.id;
          socket.join(code.toUpperCase());
          // Patch the players array in the game object itself
          game.players = game.players.map(p => ({
            ...p,
            stealCardValue: typeof p.stealCardValue === 'number' ? p.stealCardValue : Math.floor(Math.random() * 8) + 1,
            stealCardUsed: typeof p.stealCardUsed === 'boolean' ? p.stealCardUsed : false,
            disabledIndexes: Array.isArray(p.disabledIndexes) ? p.disabledIndexes : []
          }));
          // Debug: print all players before emitting joined-game
          console.log('[DEBUG] rejoin joined-game emit, players:', JSON.stringify(game.players, null, 2));
          // Send current game state and confirm identity
          socket.emit('joined-game', { game, playerId });
          if (game.status === 'LOBBY') {
            // Debug: print all players before emitting player-joined
            console.log('[DEBUG] rejoin player-joined emit, players:', JSON.stringify(game.players, null, 2));
            io.to(code.toUpperCase()).emit('player-joined', game.players);
          }
          console.log(`Player ${player.name} (${playerId}) rejoined game ${code}`);
        } else {
          socket.emit('error', 'Player session not found');
        }
      } else {
        socket.emit('error', 'Game not found');
      }
    });

    socket.on('start-game', (code) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game) {
        console.log(`Starting game: ${normalizedCode}`);
        // Start with a countdown
        game.status = 'COUNTDOWN';
        io.to(normalizedCode).emit('game-status-changed', game);

        // Transition to QUESTION after 4.8 seconds
        setTimeout(() => {
          const currentGame = games.get(normalizedCode);
          if (currentGame && currentGame.status === 'COUNTDOWN') {
            console.log(`Countdown finished for ${normalizedCode}, transitioning to QUESTION`);
            currentGame.status = 'QUESTION';
            io.to(normalizedCode).emit('game-status-changed', currentGame);
          }
        }, 4800);
      }
    });

    socket.on('time-up', (code) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game && game.status === 'QUESTION') {
        game.status = 'RESULT';
        const currentQuestion = game.questions[game.currentQuestionIndex];
        let anyCorrect = false;
        game.players.forEach(p => {
          const correct = currentQuestion?.correctAnswers || currentQuestion?.correctColors;
          const isCorrect = compareAnswers(p.lastAnswer, correct);
          p.isCorrect = isCorrect;
          if (isCorrect) {
            p.score += 10;
            anyCorrect = true;
          }
        });
        // No pot logic
        io.to(normalizedCode).emit('game-status-changed', game);
      }
    });

    socket.on('submit-answer', ({ code, answers, useStealCard }) => {
      const normalizedCode = code.toUpperCase();
      // Debug: print payload received for submit-answer
      console.log(`[DEBUG] submit-answer received: code=${normalizedCode}, useStealCard=`, useStealCard, 'answers=', answers);
      const game = games.get(normalizedCode);
      if (game && game.status === 'QUESTION') {
        const player = game.players.find(p => p.socketId === socket.id);
        if (player) {
          player.lastAnswer = answers;
          // Handle STEAL card usage
          if (useStealCard && !player.stealCardUsed) {
            player.stealCardUsed = true;
            // Generate random disabled indexes for each other player
            const disabledMap: Record<string, number[]> = {};
            const optionCount = game.questions[game.currentQuestionIndex]?.options?.length || 0;
            game.players.forEach(p => {
              if (p.id !== player.id) {
                let indexes = Array.from({ length: optionCount }, (_, i) => i);
                for (let i = indexes.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
                }
                disabledMap[p.id] = indexes.slice(0, player.stealCardValue);
                p.disabledIndexes = disabledMap[p.id];
              }
            });
            io.to(normalizedCode).emit('steal-card-used', { playerId: player.id, value: player.stealCardValue, disabledMap });
            // Debug: print sockets in the room before emitting
            const room = io.sockets.adapter.rooms.get(normalizedCode);
            const socketsInRoom = room ? Array.from(room) : [];
            console.log(`[DEBUG] Emitting 'steal-card-used' to room: ${normalizedCode}, sockets:`, socketsInRoom);
            io.to(normalizedCode).emit('steal-card-used', { playerId: player.id, value: player.stealCardValue, disabledMap });
          }
          // Emit player-answered event to update UI
          io.to(normalizedCode).emit('player-answered', game.players.map(p => ({ id: p.id, hasAnswered: p.lastAnswer !== null })));
        }
      }
    });

    socket.on('next-question', (code) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game && game.status === 'RESULT') {
        game.currentQuestionIndex++;
        console.log(`Advancing to next question. New index: ${game.currentQuestionIndex} for game ${normalizedCode}`);
        game.players.forEach(p => {
          p.lastAnswer = null;
          p.isCorrect = false;
          p.disabledIndexes = [];
        });

        if (game.currentQuestionIndex >= game.questions.length) {
          game.status = 'FINAL_SCORE';
          io.to(normalizedCode).emit('game-status-changed', game);
        } else {
          console.log(`Transitioning to question ${game.currentQuestionIndex + 1} for ${normalizedCode}`);
          // Transition to COUNTDOWN first
          game.status = 'COUNTDOWN';
          io.to(normalizedCode).emit('game-status-changed', game);

          // Transition to QUESTION after 4.8 seconds
          setTimeout(() => {
            const currentGame = games.get(normalizedCode);
            if (currentGame && currentGame.status === 'COUNTDOWN') {
              console.log(`Countdown finished for ${normalizedCode}, transitioning to QUESTION`);
              currentGame.status = 'QUESTION';
              io.to(normalizedCode).emit('game-status-changed', currentGame);
            }
          }, 4800);
        }
      }
    });

    socket.on('restart-game', ({ code, rounds, timer }) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game) {
        // Reset game state for a new game
        game.status = 'LOBBY';
        game.currentQuestionIndex = 0;
        game.timerDuration = timer;

        // CRITICAL FIX: Get a fresh batch of questions from the FULL pool, 
        // don't just reshuffle the previous small set.
        const freshQuestions = getShuffledQuestions(rounds || game.questions.length);
        game.questions = freshQuestions;

        console.log(`Restarting game ${normalizedCode}. Questions refreshed from pool. First question: ${game.questions[0]?.question}`);
        // Optionally, you may want to reset player scores and answers
        game.players.forEach(p => {
          p.score = 0;
          p.lastAnswer = null;
          p.isCorrect = false;
          p.stealCardUsed = false;
          p.disabledIndexes = [];
          // Optionally randomize stealCardValue again
          p.stealCardValue = Math.floor(Math.random() * 8) + 1;
        });
        // Optionally, you may want to reshuffle or reload questions if needed
        io.to(normalizedCode).emit('game-status-changed', game);
      } else {
        socket.emit('error', 'Game not found');
      }
    });

    socket.on('kill-game', (code) => {
      const game = games.get(code.toUpperCase());
      if (game) {
        console.log(`Explicit kill-game request for ${code}`);
        io.to(code.toUpperCase()).emit('game-ended');
        games.delete(code.toUpperCase());
      }
    });

    socket.on('remove-player', ({ code, playerId }) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game && game.status === 'LOBBY') {
        const playerIndex = game.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
          const removedPlayer = game.players[playerIndex];
          game.players.splice(playerIndex, 1);

          // Notify the room (updates lobby list)
          io.to(normalizedCode).emit('player-joined', game.players);

          // Notify the specific player they were kicked
          if (removedPlayer.socketId) {
            io.to(removedPlayer.socketId).emit('game-ended'); // Forces them back to start
            io.to(removedPlayer.socketId).emit('error', 'You have been removed from the game');
          }
          console.log(`Player ${removedPlayer.name} removed from game ${normalizedCode}`);
        }
      }
    });

    socket.on('get-active-games', () => {
      // Return list of active game codes in LOBBY status
      const activeGames: string[] = [];
      games.forEach((game, code) => {
        if (game.status === 'LOBBY') {
          activeGames.push(code);
        }
      });
      socket.emit('active-games', activeGames);
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

    socket.on('leave-game', ({ code, playerId }) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game) {
        const playerIndex = game.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
          const removedPlayer = game.players[playerIndex];
          game.players.splice(playerIndex, 1);

          console.log(`Player ${removedPlayer.name} (${playerId}) left game ${normalizedCode} voluntarily.`);

          if (game.status !== 'LOBBY' && game.players.length === 0) {
            console.log(`All players left game ${normalizedCode}. Resetting to LOBBY.`);
            game.status = 'LOBBY';
            game.currentQuestionIndex = 0;
            io.to(normalizedCode).emit('game-status-changed', game);
            return;
          }

          // Notify room of updated player list
          if (game.status === 'LOBBY') {
            io.to(normalizedCode).emit('player-joined', game.players);
          } else {
            // If game is in progress, sync state
            io.to(normalizedCode).emit('game-status-changed', game); // Updates host and other players
            // Also emit player-joined to ensure lists are in sync
            io.to(normalizedCode).emit('player-joined', game.players);
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      const gamesToEnd: string[] = [];

      games.forEach((game, code) => {
        if (game.hostSocketId === socket.id) {
          gamesToEnd.push(code);
        } else if (game.status === 'LOBBY') {
          const player = game.players?.find(p => p.socketId === socket.id);
          if (player) {
            console.log(`Player ${player.name} disconnected from lobby ${code}.`);
          }
        }
      });

      gamesToEnd.forEach(code => {
        console.log(`Host disconnected for game ${code}. Ending game immediately.`);
        io.to(code).emit('game-ended');
        games.delete(code);
      });
    });
  });
}
