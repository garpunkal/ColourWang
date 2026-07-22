import { Router } from 'express';
import { Server } from 'socket.io';
import { games } from '../game/gamesMap';
import { logger } from '../utils/logger';
import { generateGameRounds } from '../utils/questionLoader';

export function createAdminRouter(io: Server): Router {
    const router = Router();

    // GET /api/admin/games — list all active games
    router.get('/games', (_req, res) => {
        const list = Array.from(games.entries()).map(([code, game]) => ({
            code,
            status: game.status,
            playerCount: game.players.length,
            players: game.players.map(p => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                score: p.score,
                streak: p.streak,
                connected: !!p.socketId,
            })),
            currentRoundIndex: game.currentRoundIndex,
            totalRounds: game.rounds.length,
            currentQuestionIndex: game.currentQuestionIndex,
            questionsInRound: game.questions.length,
            roundTitle: game.rounds[game.currentRoundIndex]?.title ?? null,
            settings: {
                timerDuration: game.timerDuration,
                resultDuration: game.resultDuration,
                lobbyDuration: game.lobbyDuration,
                jokersEnabled: game.jokersEnabled,
                blocksEnabled: game.blocksEnabled,
                streaksEnabled: game.streaksEnabled,
                fastestFingerEnabled: game.fastestFingerEnabled,
                soundEnabled: game.soundEnabled,
                musicEnabled: game.musicEnabled,
                bgmTrack: game.bgmTrack,
            },
        }));
        res.json(list);
    });

    // DELETE /api/admin/games/:code — kill a game
    router.delete('/games/:code', (req, res) => {
        const code = String(req.params.code).toUpperCase();
        const game = games.get(code);
        if (!game) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        io.to(code).emit('game-ended');
        games.delete(code);
        logger.info(`[ADMIN] Game ${code} killed by admin`);
        res.json({ success: true, code });
    });

    // DELETE /api/admin/games — kill ALL games
    router.delete('/games', (_req, res) => {
        const codes = Array.from(games.keys());
        codes.forEach(code => {
            io.to(code).emit('game-ended');
            games.delete(code);
        });
        logger.info(`[ADMIN] All ${codes.length} game(s) killed by admin`);
        res.json({ success: true, killed: codes });
    });

    // POST /api/admin/games/kill-all — kill ALL games (POST alternative, must be above /:code routes)
    router.post('/games/kill-all', (_req, res) => {
        const codes = Array.from(games.keys());
        codes.forEach(code => {
            io.to(code).emit('game-ended');
            games.delete(code);
        });
        logger.info(`[ADMIN] All ${codes.length} game(s) killed by admin (via POST)`);
        res.json({ success: true, killed: codes });
    });

    // POST /api/admin/games/:code/kill — kill a game (POST alternative)
    router.post('/games/:code/kill', (req, res) => {
        const code = String(req.params.code).toUpperCase();
        const game = games.get(code);
        if (!game) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        io.to(code).emit('game-ended');
        games.delete(code);
        logger.info(`[ADMIN] Game ${code} killed by admin (via POST)`);
        res.json({ success: true, code });
    });

    // POST /api/admin/games/:code/reset — reset game back to LOBBY
    router.post('/games/:code/reset', (req, res) => {
        const code = String(req.params.code).toUpperCase();
        const game = games.get(code);
        if (!game) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        const gameRounds = generateGameRounds(game.rounds.length, game.rounds[0]?.questions?.length || 10, undefined);
        game.status = 'LOBBY';
        game.currentQuestionIndex = 0;
        game.currentRoundIndex = 0;
        game.rounds = gameRounds;
        game.questions = gameRounds[0].questions;
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
            p.roundScore = 0;
            p.streakPoints = 0;
            p.fastestFingerPoints = 0;
            p.answeredAt = null;
            p.isFastestFinger = false;
        });
        io.to(code).emit('game-status-changed', game);
        logger.info(`[ADMIN] Game ${code} reset to LOBBY by admin`);
        res.json({ success: true, code });
    });

    return router;
}
