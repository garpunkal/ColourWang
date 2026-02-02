import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { games } from '../game/gamesMap';
import { getShuffledQuestions, removeQuestionByText, generateGameRounds } from '../utils/questionLoader';
import { generateCode } from '../utils/generateCode';
import { logger } from '../utils/logger';
import serverConfig from '../../../config/server.json';
interface GameState {
  code: string;
  players: Player[];
  status: 'LOBBY' | 'COUNTDOWN' | 'QUESTION' | 'RESULT' | 'FINAL_SCORE' | 'ROUND_INTRO';
  currentQuestionIndex: number;
  questions: any[];
  timerDuration?: number;
  resultDuration?: number;
  lobbyDuration?: number;
  jokersEnabled?: boolean;
  soundEnabled?: boolean;
  musicEnabled?: boolean;
  bgmTrack?: string;
  hostSocketId?: string;
  streaksEnabled?: boolean;
  fastestFingerEnabled?: boolean;
  accessibleLabels?: boolean;
  currentRoundIndex: number;
  rounds: {
    title: string;
    description?: string;
    questions: any[];
  }[];
}
import { Player } from '../models/player';

// Available avatar colours
import avatarsData from '../../../config/avatars.json';

// Available avatar colours
const AVATAR_IDS = avatarsData.colors.map(c => c.id);

function getNextAvailableAvatar(takenCombinations: { avatar: string; avatarStyle: string; }[], preferredStyle: string = 'avataaars'): string {
  const available = AVATAR_IDS.find(id => !takenCombinations.some(taken => taken.avatar === id && taken.avatarStyle === preferredStyle));
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
    logger.info('User connected:', socket.id);

    socket.on('remove-question', (payload: { code: string }) => {
      const { code } = payload;
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);

      if (game && game.hostSocketId === socket.id) {
        const currentQuestion = game.questions[game.currentQuestionIndex];
        if (currentQuestion) {
          logger.info(`[SERVER] Host requested removal of: "${currentQuestion.question}"`);
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

    socket.on('override-answer', (payload: { code: string; newAnswer: string[] }) => {
      const { code, newAnswer } = payload;
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);

      if (game && game.hostSocketId === socket.id && game.status === 'RESULT') {
        const currentQuestion = game.questions[game.currentQuestionIndex];
        if (currentQuestion) {
          logger.info(`[SERVER] Host overriding answer for: "${currentQuestion.question}"`);
          logger.info(`[SERVER] Original answer: ${JSON.stringify(currentQuestion.correctAnswers || currentQuestion.correctColours)}`);
          logger.info(`[SERVER] New answer: ${JSON.stringify(newAnswer)}`);

          // Update the question's correct answer
          if (currentQuestion.correctAnswers) {
            currentQuestion.correctAnswers = newAnswer;
          } else {
            currentQuestion.correctColours = newAnswer;
          }

          // Clear per-round scoring before recalculation
          game.players.forEach(p => {
            p.roundScore = 0;
            p.streakPoints = 0;
            p.fastestFingerPoints = 0;
          });

          // Recalculate scores for all players based on the new answer
          let anyCorrect = false;
          game.players.forEach(p => {
            const correct = currentQuestion.correctAnswers || currentQuestion.correctColours;
            const wasCorrectBefore = p.isCorrect;
            const isCorrectNow = compareAnswers(p.lastAnswer, correct);
            p.isCorrect = isCorrectNow;

            // Adjust player's total score
            if (wasCorrectBefore && !isCorrectNow) {
              // Player was correct before, now wrong - subtract points
              const pointsToSubtract = 10 + (p.streak >= 3 ? 5 : 0) + (p.isFastestFinger ? 5 : 0);
              p.score = Math.max(0, p.score - pointsToSubtract);
              p.streak = 0; // Reset streak
            } else if (!wasCorrectBefore && isCorrectNow) {
              // Player was wrong before, now correct - add points
              let points = 10;
              if (game.streaksEnabled !== false) {
                // We need to recalculate streak properly, but for simplicity, don't add streak bonus on overrides
                p.streak = 1; // Start fresh
              }
              p.roundScore = points;
              p.score += points;
              anyCorrect = true;
            }

            // Reset fastest finger status
            p.isFastestFinger = false;
          });

          // Recalculate Fastest Finger Bonus
          if (game.fastestFingerEnabled !== false && anyCorrect) {
            const correctPlayers = game.players.filter(p => p.isCorrect && p.answeredAt !== null);
            if (correctPlayers.length > 0) {
              const fastest = correctPlayers.reduce((prev, curr) =>
                (prev.answeredAt! < curr.answeredAt!) ? prev : curr
              );
              fastest.fastestFingerPoints = 5;
              fastest.roundScore += 5;
              fastest.score += 5;
              fastest.isFastestFinger = true;
              logger.info(`[OVERRIDE BONUS] ${fastest.name} got the Fastest Finger Bonus! (+5)`);
            }
          }

          // Emit the updated game state
          io.to(normalizedCode).emit('answer-overridden', { 
            newAnswer,
            originalAnswer: currentQuestion.correctAnswers || currentQuestion.correctColours 
          });
          io.to(normalizedCode).emit('game-status-changed', game);
        }
      }
    });

    socket.on('create-game', (payload) => {
      const { rounds: numRounds, questionsPerRound, timer, resultDuration, jokersEnabled, soundEnabled, musicEnabled, bgmTrack, streaksEnabled, shieldsEnabled, fastestFingerEnabled, accessibleLabels, selectedTopics } = payload;
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();

      // Generate Rounds with selected topics
      const gameRounds = generateGameRounds(numRounds || 4, questionsPerRound || 10, selectedTopics);

      const game: GameState = {
        code,
        players: [],
        status: 'LOBBY',
        currentQuestionIndex: 0,
        questions: gameRounds[0].questions,
        timerDuration: timer,
        resultDuration,
        jokersEnabled,
        soundEnabled: soundEnabled ?? true,
        musicEnabled: musicEnabled ?? true,
        bgmTrack: bgmTrack || 'Casino Royal.mp3',
        streaksEnabled: streaksEnabled ?? true,
        fastestFingerEnabled: fastestFingerEnabled ?? true,
        accessibleLabels: accessibleLabels ?? false,
        currentRoundIndex: 0,
        rounds: gameRounds
      };
      games.set(code, game);
      socket.join(code);
      socket.emit('game-created', game);
      logger.info(`Game created: ${code} with ${gameRounds.length} rounds. Round 1: ${gameRounds[0].title}`);
    });

    socket.on('update-bgm', ({ code, track }) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game) {
        game.bgmTrack = track;
        io.to(normalizedCode).emit('game-status-changed', game);
        logger.info(`[BGM] Game ${normalizedCode} BGM updated to: ${track}`);
      }
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
      if (game && game.status !== 'FINAL_SCORE') {
        // Check for maximum players
        if (game.players.length >= 10) {
          socket.emit('error', 'Game is full (maximum 10 players)');
          return;
        }

        // Check if the specific avatar+style combination is taken
        const isAvatarStyleTaken = game.players.some(p => p.avatar === avatar && p.avatarStyle === avatarStyle);
        if (isAvatarStyleTaken) {
          socket.emit('error', 'This avatar and style combination is already taken');
          return;
        }

        const takenCombinations = game.players.map(p => ({ 
          avatar: p.avatar, 
          avatarStyle: p.avatarStyle || 'avataaars' 
        }));
        const assignedAvatar = avatar || getNextAvailableAvatar(takenCombinations, avatarStyle || 'avataaars');

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
          disabledIndexes: [],
          streak: 0,
          answeredAt: null,
          isFastestFinger: false,
          roundScore: 0,
          streakPoints: 0,
          fastestFingerPoints: 0
        };
        game.players.push(player);
        socket.join(code.toUpperCase());
        // Patch the players array in the game object itself
        game.players = game.players.map(p => ({
          ...p,
          stealCardValue: typeof p.stealCardValue === 'number' ? p.stealCardValue : Math.floor(Math.random() * 8) + 1,
          stealCardUsed: typeof p.stealCardUsed === 'boolean' ? p.stealCardUsed : false,
          disabledIndexes: Array.isArray(p.disabledIndexes) ? p.disabledIndexes : [],
          streak: typeof p.streak === 'number' ? p.streak : 0
        }));
        // Debug: print all players before emitting joined-game
        logger.debug('[DEBUG] joined-game emit, players:', JSON.stringify(game.players, null, 2));
        socket.emit('joined-game', { game, playerId });
        // Debug: print all players before emitting player-joined
        logger.debug('[DEBUG] player-joined emit, players:', JSON.stringify(game.players, null, 2));
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
          logger.info(`Host rejoined game ${code}`);
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
            disabledIndexes: Array.isArray(p.disabledIndexes) ? p.disabledIndexes : [],
            streak: typeof p.streak === 'number' ? p.streak : 0,
            answeredAt: typeof p.answeredAt === 'number' ? p.answeredAt : null,
            roundScore: 0,
            streakPoints: 0,
            fastestFingerPoints: 0
          }));
          // Debug: print all players before emitting joined-game
          logger.debug('[DEBUG] rejoin joined-game emit, players:', JSON.stringify(game.players, null, 2));
          // Send current game state and confirm identity
          socket.emit('joined-game', { game, playerId });
          if (game.status === 'LOBBY') {
            // Debug: print all players before emitting player-joined
            logger.debug('[DEBUG] rejoin player-joined emit, players:', JSON.stringify(game.players, null, 2));
            io.to(code.toUpperCase()).emit('player-joined', game.players);
          }
          logger.info(`Player ${player.name} (${playerId}) rejoined game ${code}`);
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
        logger.info(`Starting game: ${normalizedCode}`);
        // Start with ROUND_INTRO
        game.status = 'ROUND_INTRO';
        io.to(normalizedCode).emit('game-status-changed', game);

        // Transition to COUNTDOWN after configured delay
        setTimeout(() => {
          const currentGame = games.get(normalizedCode);
          if (currentGame && currentGame.status === 'ROUND_INTRO') {
            currentGame.status = 'COUNTDOWN';
            io.to(normalizedCode).emit('game-status-changed', currentGame);

            // Transition to QUESTION after countdown delay
            setTimeout(() => {
              const nextGame = games.get(normalizedCode);
              if (nextGame && nextGame.status === 'COUNTDOWN') {
                logger.debug(`Countdown finished for ${normalizedCode}, transitioning to QUESTION`);
                nextGame.status = 'QUESTION';
                io.to(normalizedCode).emit('game-status-changed', nextGame);
              }
            }, serverConfig.timings.countdownDelay);
          }
        }, serverConfig.timings.roundIntroDelay);

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
          // Reset per-round points
          p.roundScore = 0;
          p.streakPoints = 0;
          p.fastestFingerPoints = 0;

          const correct = currentQuestion?.correctAnswers || currentQuestion?.correctColours;
          const isCorrect = compareAnswers(p.lastAnswer, correct);
          p.isCorrect = isCorrect;

          if (isCorrect) {
            let points = 10;
            if (game.streaksEnabled !== false) {
              p.streak = (p.streak || 0) + 1;
              if (p.streak >= 3) {
                p.streakPoints = 5; // Fixed 1.5x of 10 is 5 bonus points
                points += p.streakPoints;
              }
            } else {
              p.streak = 0;
            }
            p.roundScore = points;
            p.score += points;
            anyCorrect = true;
          } else {
            p.streak = 0;
          }
          p.isFastestFinger = false;
        });

        // Award Fastest Finger Bonus
        if (game.fastestFingerEnabled !== false && anyCorrect) {
          const correctPlayers = game.players.filter(p => p.isCorrect && p.answeredAt !== null);
          if (correctPlayers.length > 0) {
            const fastest = correctPlayers.reduce((prev, curr) =>
              (prev.answeredAt! < curr.answeredAt!) ? prev : curr
            );
            fastest.fastestFingerPoints = 5;
            fastest.roundScore += 5;
            fastest.score += 5;
            fastest.isFastestFinger = true;
            logger.info(`[BONUS] ${fastest.name} got the Fastest Finger Bonus! (+5)`);
          }
        }

        io.to(normalizedCode).emit('game-status-changed', game);
      }
    });

    socket.on('submit-answer', ({ code, answers, useStealCard }) => {
      const normalizedCode = code.toUpperCase();
      // Debug: print payload received for submit-answer
      logger.debug(`[DEBUG] submit-answer received: code=${normalizedCode}, useStealCard=`, useStealCard, 'answers=', answers);
      const game = games.get(normalizedCode);
      if (game && game.status === 'QUESTION') {
        const player = game.players.find(p => p.socketId === socket.id);
        if (player) {
          player.lastAnswer = answers;
          player.answeredAt = answers.length > 0 ? Date.now() : null;
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
        logger.info(`Advancing to next question. New index: ${game.currentQuestionIndex} for game ${normalizedCode}`);

        // Check if we need to change rounds
        if (game.currentQuestionIndex >= game.questions.length) {
          if (game.currentRoundIndex < game.rounds.length - 1) {
            // Next Round
            game.currentRoundIndex++;
            game.currentQuestionIndex = 0;
            game.questions = game.rounds[game.currentRoundIndex].questions;
            game.status = 'ROUND_INTRO';
            logger.info(`Starting Round ${game.currentRoundIndex + 1}: ${game.rounds[game.currentRoundIndex].title}`);
            io.to(normalizedCode).emit('game-status-changed', game);

            // Auto-progress from ROUND_INTRO -> COUNTDOWN with configured delay
            setTimeout(() => {
              const currentGame = games.get(normalizedCode);
              if (currentGame && currentGame.status === 'ROUND_INTRO') {
                currentGame.status = 'COUNTDOWN';
                io.to(normalizedCode).emit('game-status-changed', currentGame);

                setTimeout(() => {
                  const nextGame = games.get(normalizedCode);
                  if (nextGame && nextGame.status === 'COUNTDOWN') {
                    nextGame.status = 'QUESTION';
                    io.to(normalizedCode).emit('game-status-changed', nextGame);
                  }
                }, serverConfig.timings.countdownDelay);
              }
            }, serverConfig.timings.roundIntroDelay);

            // Reset player state for new round
            game.players.forEach(p => {
              p.lastAnswer = null;
              p.isCorrect = false;
              p.disabledIndexes = [];
              p.answeredAt = null;
              p.isFastestFinger = false;
            });

            return;
          } else {
            // Game Over
            game.status = 'FINAL_SCORE';
            io.to(normalizedCode).emit('game-status-changed', game);
            return;
          }
        }

        // Normal next question logic (same round)
        game.players.forEach(p => {
          p.lastAnswer = null;
          p.isCorrect = false;
          p.disabledIndexes = [];
          p.answeredAt = null;
          p.isFastestFinger = false;
        });

        logger.debug(`Transitioning to question ${game.currentQuestionIndex + 1} for ${normalizedCode}`);
        // Transition to COUNTDOWN first
        game.status = 'COUNTDOWN';
        io.to(normalizedCode).emit('game-status-changed', game);

        // Transition to QUESTION after 4.8 seconds
        setTimeout(() => {
          const currentGame = games.get(normalizedCode);
          if (currentGame && currentGame.status === 'COUNTDOWN') {
            logger.debug(`Countdown finished for ${normalizedCode}, transitioning to QUESTION`);
            currentGame.status = 'QUESTION';
            io.to(normalizedCode).emit('game-status-changed', currentGame);
          }
        }, 4800);

      }
    });

    socket.on('restart-game', ({ code, rounds, questionsPerRound, timer, selectedTopics }) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game) {

        // Regenerate rounds with selected topics
        const gameRounds = generateGameRounds(rounds || 4, questionsPerRound || 10, selectedTopics);

        // Reset game state for a new game
        game.status = 'LOBBY';
        game.currentQuestionIndex = 0;
        game.timerDuration = timer;
        game.rounds = gameRounds;
        game.currentRoundIndex = 0;
        game.questions = gameRounds[0].questions;


        logger.info(`Restarting game ${normalizedCode}. Rounds refreshed.`);
        // Optionally, you may want to reset player scores and answers
        game.players.forEach(p => {
          p.score = 0;
          p.lastAnswer = null;
          p.isCorrect = false;
          p.stealCardUsed = false;
          p.disabledIndexes = [];
          p.streak = 0;
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
        logger.info(`Explicit kill-game request for ${code}`);
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
          logger.info(`Player ${removedPlayer.name} removed from game ${normalizedCode}`);
        }
      }
    });

    socket.on('get-active-games', () => {
      // Return list of active game codes in LOBBY status
      const activeGames: string[] = [];
      games.forEach((game, code) => {
        if (game.status !== 'FINAL_SCORE') {
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
          takenAvatars: game.players.map(p => ({ avatar: p.avatar, avatarStyle: p.avatarStyle }))
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

          logger.info(`Player ${removedPlayer.name} (${playerId}) left game ${normalizedCode} voluntarily.`);

          if (game.status !== 'LOBBY' && game.players.length === 0) {
            logger.info(`All players left game ${normalizedCode}. Resetting to LOBBY.`);
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
      logger.info('User disconnected:', socket.id);

      const gamesToEnd: string[] = [];

      games.forEach((game, code) => {
        if (game.hostSocketId === socket.id) {
          gamesToEnd.push(code);
        } else if (game.status === 'LOBBY') {
          const player = game.players?.find(p => p.socketId === socket.id);
          if (player) {
            logger.debug(`Player ${player.name} disconnected from lobby ${code}.`);
          }
        }
      });

      gamesToEnd.forEach(code => {
        logger.info(`Host disconnected for game ${code}. Ending game immediately.`);
        io.to(code).emit('game-ended');
        games.delete(code);
      });
    });
  });
}
