import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { games } from '../game/gamesMap';
import { getShuffledQuestions, removeQuestionByText, generateGameRounds } from '../utils/questionLoader';
import { generateCode } from '../utils/generateCode';
import { logger } from '../utils/logger';
const serverConfig: typeof import('../../../config/server.json') = require('../../../config/server.json');
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
  blocksEnabled?: boolean;
  soundEnabled?: boolean;
  musicEnabled?: boolean;
  bgmTrack?: string;
  hostSocketId?: string;
  streaksEnabled?: boolean;
  fastestFingerEnabled?: boolean;
  currentRoundIndex: number;
  rounds: {
    title: string;
    description?: string;
    questions: any[];
  }[];
}
import { Player } from '../models/player';

// Available avatar colours
const avatarsData: typeof import('../../../config/avatars.json') = require('../../../config/avatars.json');

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

    socket.on('create-game', (payload) => {
      try {
        logger.info('[CREATE-GAME] Received create-game event with payload:', payload);
        const { rounds: numRounds, questionsPerRound, timer, resultDuration, lobbyDuration, jokersEnabled, blocksEnabled, soundEnabled, musicEnabled, bgmTrack, streaksEnabled, shieldsEnabled, fastestFingerEnabled, selectedTopics } = payload;
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();

        // Generate Rounds with selected topics
        logger.info('[CREATE-GAME] Generating game rounds...', { numRounds, questionsPerRound, selectedTopics });
        const gameRounds = generateGameRounds(numRounds || 4, questionsPerRound || 10, selectedTopics);
        logger.info('[CREATE-GAME] Game rounds generated:', gameRounds.length);

        if (!gameRounds.length || !gameRounds[0]?.questions?.length) {
          logger.error('[CREATE-GAME] Failed to generate rounds/questions', {
            requestedRounds: numRounds || 4,
            requestedQuestionsPerRound: questionsPerRound || 10,
            selectedTopics
          });
          socket.emit('error', 'Failed to create game: no questions available');
          return;
        }

        const game: GameState = {
          code,
          players: [],
          status: 'LOBBY',
          currentQuestionIndex: 0,
          questions: gameRounds[0].questions,
          timerDuration: timer,
          resultDuration,
          lobbyDuration,
          jokersEnabled,
          blocksEnabled: blocksEnabled ?? true,
          soundEnabled: soundEnabled ?? true,
          musicEnabled: musicEnabled ?? true,
          bgmTrack: bgmTrack || 'Retro Arcade.mp3',
          streaksEnabled: streaksEnabled ?? true,
          fastestFingerEnabled: fastestFingerEnabled ?? true,
          currentRoundIndex: 0,
          rounds: gameRounds
        };
        games.set(code, game);
        socket.join(code);
        logger.info(`[CREATE-GAME] Game created: ${code} with ${gameRounds.length} rounds. Round 1: ${gameRounds[0].title}`);
        socket.emit('game-created', game);
        logger.info(`[CREATE-GAME] game-created event emitted to socket ${socket.id}`);
      } catch (error) {
        logger.error('[CREATE-GAME] Error creating game:', error);
        socket.emit('error', 'Failed to create game');
      }
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
          const currentOptions = game.questions[game.currentQuestionIndex]?.options || [];
          game.players.forEach((p: Player) => {
            if (p.id !== player.id) {
              let indexes = Array.from({ length: optionCount }, (_, i) => i);
              for (let i = indexes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
              }
              disabledMap[p.id] = indexes.slice(0, player.stealCardValue);
              p.disabledIndexes = disabledMap[p.id];
              
              // If player has already answered, filter out stolen cards from their answer
              if (p.lastAnswer && p.lastAnswer.length > 0) {
                const originalLength = p.lastAnswer.length;
                p.lastAnswer = p.lastAnswer.filter(color => {
                  const colorIndex = currentOptions.indexOf(color);
                  return !disabledMap[p.id].includes(colorIndex);
                });
                if (p.lastAnswer.length !== originalLength) {
                  logger.info(`[STEAL FILTER] Removed ${originalLength - p.lastAnswer.length} stolen cards from ${p.name}'s already-submitted answer.`);
                }
                // Update answeredAt if they now have no valid answers
                if (p.lastAnswer.length === 0) {
                  p.answeredAt = null;
                }
              }
            }
          });
          io.to(normalizedCode).emit('steal-card-used', { playerId: player.id, value: player.stealCardValue, disabledMap });
        }
      }
    });

    socket.on('use-block-card', (payload: { code: string; targetPlayerId: string }) => {
      const { code, targetPlayerId } = payload;
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      if (game && game.status === 'QUESTION') {
        if (game.blocksEnabled === false) return;

        const blocker = game.players.find((p: Player) => p.socketId === socket.id);
        const target = game.players.find((p: Player) => p.id === targetPlayerId);

        if (!blocker || !target) return;
        if (blocker.id === target.id) return;
        if (blocker.blockCardUsed) return;
        if (target.isBlockedThisQuestion) return;

        blocker.blockCardUsed = true;
        target.isBlockedThisQuestion = true;
        target.blockedByPlayerId = blocker.id;
        target.lastAnswer = null;
        target.answeredAt = null;

        logger.info(`[BLOCK] ${blocker.name} blocked ${target.name} from answering this question.`);

        io.to(normalizedCode).emit('block-card-used', {
          playerId: blocker.id,
          targetPlayerId: target.id
        });

        io.to(normalizedCode).emit('player-answered', game.players.map(p => ({ id: p.id, hasAnswered: p.lastAnswer !== null })));
      }
    });

    socket.on('join-game', ({ code, name, avatar, avatarStyle, avatarImage }) => {
      const game = games.get(code.toUpperCase());
      if (game && game.status !== 'FINAL_SCORE') {
        // Check for maximum players
        if (game.players.length >= 10) {
          socket.emit('error', 'Game is full (maximum 10 players)');
          return;
        }

        // Check if the specific avatar+style combination is taken for non-photo avatars
        const isAvatarStyleTaken = !avatarImage && game.players.some(p => p.avatar === avatar && p.avatarStyle === avatarStyle);
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
          avatarImage: avatarImage || undefined,
          score: 0,
          lastAnswer: null,
          isCorrect: false,
          stealCardValue: Math.floor(Math.random() * 8) + 1, // 1-8
          stealCardUsed: false,
          blockCardUsed: false,
          disabledIndexes: [],
          isBlockedThisQuestion: false,
          blockedByPlayerId: null,
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
          blockCardUsed: typeof p.blockCardUsed === 'boolean' ? p.blockCardUsed : false,
          disabledIndexes: Array.isArray(p.disabledIndexes) ? p.disabledIndexes : [],
          isBlockedThisQuestion: typeof p.isBlockedThisQuestion === 'boolean' ? p.isBlockedThisQuestion : false,
          blockedByPlayerId: typeof p.blockedByPlayerId === 'string' ? p.blockedByPlayerId : null,
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

    socket.on('rejoin-game', ({ code, playerId, name, isHost, avatarImage }) => {
      const normalizedCode = code.toUpperCase();
      const game = games.get(normalizedCode);
      
      if (!game) {
        socket.emit('error', 'Game not found');
        logger.warn(`Rejoin failed: Game ${normalizedCode} not found`);
        return;
      }

      if (isHost) {
        game.hostSocketId = socket.id;
        socket.join(normalizedCode);
        socket.emit('joined-game', game);
        logger.info(`Host rejoined game ${normalizedCode}`);
        return;
      }

      // Try to find existing player by ID
      let player = game.players.find(p => p.id === playerId);
      
      if (player) {
        // Update socket ID for reconnecting player
        player.socketId = socket.id;
        socket.join(normalizedCode);
        
        // Patch the players array to ensure all fields exist
        game.players = game.players.map(p => ({
          ...p,
          socketId: p.id === playerId ? socket.id : p.socketId,
          avatarImage: p.id === playerId && avatarImage ? avatarImage : p.avatarImage,
          stealCardValue: typeof p.stealCardValue === 'number' ? p.stealCardValue : Math.floor(Math.random() * 8) + 1,
          stealCardUsed: typeof p.stealCardUsed === 'boolean' ? p.stealCardUsed : false,
          blockCardUsed: typeof p.blockCardUsed === 'boolean' ? p.blockCardUsed : false,
          disabledIndexes: Array.isArray(p.disabledIndexes) ? p.disabledIndexes : [],
          isBlockedThisQuestion: typeof p.isBlockedThisQuestion === 'boolean' ? p.isBlockedThisQuestion : false,
          blockedByPlayerId: typeof p.blockedByPlayerId === 'string' ? p.blockedByPlayerId : null,
          streak: typeof p.streak === 'number' ? p.streak : 0,
          answeredAt: typeof p.answeredAt === 'number' ? p.answeredAt : null,
          roundScore: 0,
          streakPoints: 0,
          fastestFingerPoints: 0
        }));
        
        logger.info(`Player ${player.name} (${playerId}) rejoined game ${normalizedCode}`);
        socket.emit('joined-game', { game, playerId });
        
        if (game.status === 'LOBBY') {
          io.to(normalizedCode).emit('player-joined', game.players);
        }
      } else {
        // Player not found - possibly session expired or game was reset
        // Try to add them as a new player if game is still in lobby
        if (game.status === 'LOBBY' && name) {
          const takenCombinations = game.players
            .filter(p => p.avatarStyle !== undefined)
            .map(p => ({ avatar: p.avatar, avatarStyle: p.avatarStyle as string }));
          const newAvatar = getNextAvailableAvatar(takenCombinations, 'avataaars');
          
          const newPlayer: Player = {
            id: playerId || randomUUID(),
            name: name,
            score: 0,
            avatar: newAvatar,
            avatarStyle: 'avataaars',
            avatarImage: avatarImage || undefined,
            socketId: socket.id,
            lastAnswer: null,
            isCorrect: false,
            answeredAt: null,
            stealCardValue: Math.floor(Math.random() * 8) + 1,
            stealCardUsed: false,
            blockCardUsed: false,
            disabledIndexes: [],
            isBlockedThisQuestion: false,
            blockedByPlayerId: null,
            streak: 0,
            roundScore: 0,
            streakPoints: 0,
            fastestFingerPoints: 0
          };
          
          game.players.push(newPlayer);
          socket.join(normalizedCode);
          socket.emit('joined-game', { game, playerId: newPlayer.id });
          io.to(normalizedCode).emit('player-joined', game.players);
          logger.info(`New player ${name} joined via rejoin (game ${normalizedCode})`);
        } else {
          socket.emit('error', 'Player session not found and game has already started');
          logger.warn(`Rejoin failed: Player ${playerId} not found in ${normalizedCode}`);
        }
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
          if (player.isBlockedThisQuestion) {
            logger.info(`[BLOCK] Ignored answer from blocked player ${player.name}.`);
            return;
          }

          // Filter out any colors that are at disabled indexes for this player
          let filteredAnswers = answers;
          if (player.disabledIndexes && player.disabledIndexes.length > 0) {
            const currentOptions = game.questions[game.currentQuestionIndex]?.options || [];
            filteredAnswers = answers.filter((color: string) => {
              const colorIndex = currentOptions.indexOf(color);
              return !player.disabledIndexes!.includes(colorIndex);
            });
            if (filteredAnswers.length !== answers.length) {
              logger.info(`[STEAL FILTER] Player ${player.name} tried to submit disabled cards. Filtered from ${answers.length} to ${filteredAnswers.length} cards.`);
            }
          }
          
          player.lastAnswer = filteredAnswers;
          player.answeredAt = filteredAnswers.length > 0 ? Date.now() : null;
          // Handle STEAL card usage
          if (useStealCard && !player.stealCardUsed) {
            player.stealCardUsed = true;
            // Generate random disabled indexes for each other player
            const disabledMap: Record<string, number[]> = {};
            const optionCount = game.questions[game.currentQuestionIndex]?.options?.length || 0;
            const currentOptions = game.questions[game.currentQuestionIndex]?.options || [];
            game.players.forEach(p => {
              if (p.id !== player.id) {
                let indexes = Array.from({ length: optionCount }, (_, i) => i);
                for (let i = indexes.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
                }
                disabledMap[p.id] = indexes.slice(0, player.stealCardValue);
                p.disabledIndexes = disabledMap[p.id];
                
                // If player has already answered, filter out stolen cards from their answer
                if (p.lastAnswer && p.lastAnswer.length > 0) {
                  const originalLength = p.lastAnswer.length;
                  p.lastAnswer = p.lastAnswer.filter(color => {
                    const colorIndex = currentOptions.indexOf(color);
                    return !disabledMap[p.id].includes(colorIndex);
                  });
                  if (p.lastAnswer.length !== originalLength) {
                    logger.info(`[STEAL FILTER] Removed ${originalLength - p.lastAnswer.length} stolen cards from ${p.name}'s already-submitted answer.`);
                  }
                  // Update answeredAt if they now have no valid answers
                  if (p.lastAnswer.length === 0) {
                    p.answeredAt = null;
                  }
                }
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
              p.isBlockedThisQuestion = false;
              p.blockedByPlayerId = null;
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
          p.isBlockedThisQuestion = false;
          p.blockedByPlayerId = null;
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
          p.blockCardUsed = false;
          p.disabledIndexes = [];
          p.isBlockedThisQuestion = false;
          p.blockedByPlayerId = null;
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

    socket.on('kill-all-games', () => {
      logger.info(`kill-all-games requested — terminating ${games.size} game(s)`);
      games.forEach((_, code) => {
        io.to(code).emit('game-ended');
      });
      games.clear();
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
