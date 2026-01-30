import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { games } from '../game/gamesMap';
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

    socket.on('create-game', (payload) => {
      const { questions, timer } = payload;
      const code = generateCode();
      const game: GameState = {
        code,
        players: [],
        status: 'LOBBY',
        currentQuestionIndex: 0,
        questions,
        timerDuration: timer,
        hostSocketId: socket.id
      };
      games.set(code, game);
      socket.join(code);
      socket.emit('game-created', game);
      console.log(`Game created: ${code}`);
    });

    socket.on('use-steal-card', (payload: { code: string }) => {
      const { code } = payload;
      const game = games.get(code);
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
          io.to(code).emit('steal-card-used', { playerId: player.id, value: player.stealCardValue, disabledMap });
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

    socket.on('rejoin-game', ({ code, playerId }) => {
      const game = games.get(code.toUpperCase());
      if (game) {
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
      const game = games.get(code);
      if (game) {
        // Start with a countdown
        game.status = 'COUNTDOWN';
        io.to(code).emit('game-status-changed', game);

        // Transition to QUESTION after 5 seconds
        setTimeout(() => {
          const currentGame = games.get(code);
          if (currentGame && currentGame.status === 'COUNTDOWN') {
            currentGame.status = 'QUESTION';
            io.to(code).emit('game-status-changed', currentGame);
          }
        }, 5000);
      }
    });

    socket.on('time-up', (code) => {
      const game = games.get(code);
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
        io.to(code).emit('game-status-changed', game);
      }
    });

    socket.on('submit-answer', ({ code, answers, useStealCard }) => {
      // Debug: print payload received for submit-answer
      console.log(`[DEBUG] submit-answer received: code=${code}, useStealCard=`, useStealCard, 'answers=', answers);
      const game = games.get(code);
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
            io.to(code).emit('steal-card-used', { playerId: player.id, value: player.stealCardValue, disabledMap });
            // Debug: print sockets in the room before emitting
            const room = io.sockets.adapter.rooms.get(code);
            const socketsInRoom = room ? Array.from(room) : [];
            console.log(`[DEBUG] Emitting 'steal-card-used' to room: ${code}, sockets:`, socketsInRoom);
            io.to(code).emit('steal-card-used', { playerId: player.id, value: player.stealCardValue, disabledMap });
          }
          // Emit player-answered event to update UI
          io.to(code).emit('player-answered', game.players.map(p => ({ id: p.id, hasAnswered: p.lastAnswer !== null })));
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
          p.disabledIndexes = [];
        });

        if (game.currentQuestionIndex >= game.questions.length) {
          game.status = 'FINAL_SCORE';
          io.to(code).emit('game-status-changed', game);
        } else {
          // Transition to COUNTDOWN first
          game.status = 'COUNTDOWN';
          io.to(code).emit('game-status-changed', game);

          // Transition to QUESTION after 5 seconds
          setTimeout(() => {
            const currentGame = games.get(code);
            if (currentGame && currentGame.status === 'COUNTDOWN') {
              currentGame.status = 'QUESTION';
              io.to(code).emit('game-status-changed', currentGame);
            }
          }, 5000);
        }
      }
    });

    socket.on('restart-game', ({ code, rounds, timer }) => {
      const game = games.get(code);
      if (game) {
        // Reset game state for a new game
        game.status = 'LOBBY';
        game.currentQuestionIndex = 0;
        game.timerDuration = timer;
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
        io.to(code).emit('game-status-changed', game);
      } else {
        socket.emit('error', 'Game not found');
      }
    });

    socket.on('remove-player', ({ code, playerId }) => {
      const game = games.get(code);
      if (game && game.status === 'LOBBY') {
        const playerIndex = game.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
          const removedPlayer = game.players[playerIndex];
          game.players.splice(playerIndex, 1);

          // Notify the room (updates lobby list)
          io.to(code).emit('player-joined', game.players);

          // Notify the specific player they were kicked
          if (removedPlayer.socketId) {
            io.to(removedPlayer.socketId).emit('game-ended'); // Forces them back to start
            io.to(removedPlayer.socketId).emit('error', 'You have been removed from the game');
          }
          console.log(`Player ${removedPlayer.name} removed from game ${code}`);
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

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      games.forEach((game, code) => {
        if (game.hostSocketId === socket.id) {
          console.log(`Host disconnected for game ${code}. Ending game.`);
          io.to(code).emit('game-ended');
          games.delete(code);
        } else if (game.status === 'LOBBY') {
          const index = game.players.findIndex(p => p.socketId === socket.id);
          if (index !== -1) {
            // We do NOT remove the player to allow reconnection.
            // If you truly want to remove them, we might need a timeout or explicit 'leave' action.
            console.log(`Player ${game.players[index].name} disconnected but kept in lobby for reconnection.`);
          }
        }
      });
    });
  });
}
