import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { games } from '../game/gamesMap';
import { logger } from '../utils/logger';

function safeGetEntries(): [string, any][] {
  if (!games) return [];
  if (games instanceof Map) {
    return Array.from(games.entries());
  }
  if (typeof games === 'object') {
    return Object.entries(games);
  }
  return [];
}

function safeGetGame(code: string): any | null {
  if (!games || !code) return null;
  const targetCode = String(code).trim().toUpperCase();

  if (games instanceof Map) {
    for (const [key, val] of games.entries()) {
      if (String(key).trim().toUpperCase() === targetCode) return val;
    }
  } else if (typeof games === 'object') {
    const record = games as Record<string, any>;
    for (const key of Object.keys(record)) {
      if (String(key).trim().toUpperCase() === targetCode) return record[key];
    }
  }
  return null;
}

function safeDeleteGame(code: string): boolean {
  if (!games || !code) return false;
  const targetCode = String(code).trim().toUpperCase();

  if (games instanceof Map) {
    for (const key of games.keys()) {
      if (String(key).trim().toUpperCase() === targetCode) {
        games.delete(key);
        return true;
      }
    }
  } else if (typeof games === 'object') {
    const record = games as Record<string, any>;
    for (const key of Object.keys(record)) {
      if (String(key).trim().toUpperCase() === targetCode) {
        delete record[key];
        return true;
      }
    }
  }
  return false;
}

function emitGameEnded(io: Server | undefined, code?: string) {
  if (!io) return;

  if (!code) {
    io.emit('game-ended');
    return;
  }

  const normalizedCode = String(code).trim().toUpperCase();
  io.to(normalizedCode).emit('game-ended');
  io.to(normalizedCode.toLowerCase()).emit('game-ended');
}

export function createAdminRouter(io?: Server) {
  const router = Router();

  // GET /api/admin/games - Full rich game metrics
  router.get('/games', (_req: Request, res: Response) => {
    try {
      const entries = safeGetEntries();
      const activeGames = entries.map(([key, game]) => {
        const code = key || game?.code || game?.id || 'N/A';
        const status = game?.status || game?.state || 'LOBBY';

        let playerCount = 0;
        if (game?.playerCount !== undefined) {
          playerCount = game.playerCount;
        } else if (game?.players) {
          playerCount = game.players instanceof Map ? game.players.size : Object.keys(game.players).length;
        }

        const rounds = Array.isArray(game?.rounds) ? game.rounds : [];
        const currentRound = game?.currentRoundIndex ?? 0;
        const totalRounds = rounds.length;
        const currentQuestion = game?.currentQuestionIndex ?? 0;
        const questionsPerRound = rounds[currentRound]?.questions?.length ?? game?.questions?.length ?? 0;
        const answerTime = game?.timerDuration ?? 15;
        const categories = rounds.map((r: any) => r?.title).filter(Boolean);

        // No host name is stored on GameState today (only a raw hostSocketId),
        // so this stays a placeholder until that's tracked at join time.
        const hostName = 'Host';
        const isHostConnected = !!(io && game?.hostSocketId && io.sockets.sockets.get(game.hostSocketId)?.connected);

        return {
          code,
          status,
          playerCount,
          currentRound,
          totalRounds,
          currentQuestion,
          questionsPerRound,
          hostName,
          isHostConnected,
          settings: {
            categories,
            answerTime,
            totalRounds,
            questionsPerRound
          }
        };
      });

      return res.status(200).json(activeGames);
    } catch (err: any) {
      logger.error('[ADMIN] Error listing games:', err?.stack || err);
      return res.status(500).json({ error: 'Failed to list active games', details: err?.message || String(err) });
    }
  });

  // POST /api/admin/games/kill-all
  router.post('/games/kill-all', (_req: Request, res: Response) => {
    try {
      logger.info('[ADMIN] Action: Kill All Games');

      if (io) {
        try {
          emitGameEnded(io);
        } catch (sErr) {
          logger.warn('[ADMIN] Socket emit warning during kill-all:', sErr);
        }
      }

      const entries = safeGetEntries();
      for (const [code, game] of entries) {
        if (game) {
          try {
            if (typeof game.cleanup === 'function') game.cleanup();
            else if (typeof game.destroy === 'function') game.destroy();
            else if (typeof game.stop === 'function') game.stop();
          } catch (cErr) {
            logger.warn(`[ADMIN] Cleanup warning for game ${code}:`, cErr);
          }
        }
      }

      if (games instanceof Map) {
        games.clear();
      } else if (typeof games === 'object') {
        for (const k of Object.keys(games)) {
          delete (games as Record<string, any>)[k];
        }
      }

      logger.info('[ADMIN] All games cleared from memory.');
      return res.status(200).json({ success: true, message: 'All active games killed.' });
    } catch (err: any) {
      logger.error('[ADMIN] Error executing kill-all:', err?.stack || err);
      return res.status(500).json({ error: 'Failed to kill all games', details: err?.message || String(err) });
    }
  });

  // POST /api/admin/games/:code/kill
  router.post('/games/:code/kill', (req: Request, res: Response) => {
    const rawCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const code = String(rawCode || '').trim();

    try {
      logger.info(`[ADMIN] Action: Kill Game ${code}`);
      const game = safeGetGame(code);

      if (io) {
        try {
          emitGameEnded(io, code);
        } catch (sErr) {
          logger.warn(`[ADMIN] Socket emit warning for ${code}:`, sErr);
        }
      }

      if (game) {
        try {
          if (typeof game.cleanup === 'function') game.cleanup();
          else if (typeof game.destroy === 'function') game.destroy();
          else if (typeof game.stop === 'function') game.stop();
        } catch (cErr) {
          logger.warn(`[ADMIN] Cleanup warning for ${code}:`, cErr);
        }
      }

      safeDeleteGame(code);

      logger.info(`[ADMIN] Game ${code} killed successfully.`);
      return res.status(200).json({ success: true, message: `Game ${code} killed.` });
    } catch (err: any) {
      logger.error(`[ADMIN] Error killing game ${code}:`, err?.stack || err);
      return res.status(500).json({ error: `Failed to kill game ${code}`, details: err?.message || String(err) });
    }
  });

  // POST /api/admin/games/:code/restart
  router.post('/games/:code/restart', (req: Request, res: Response) => {
    const rawCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const code = String(rawCode || '').trim();

    try {
      logger.info(`[ADMIN] Action: Restart Game ${code}`);
      const game = safeGetGame(code);

      if (!game) {
        return res.status(404).json({ error: `Game ${code} not found` });
      }

      try {
        if (typeof game.reset === 'function') {
          game.reset();
        } else if (typeof game.restart === 'function') {
          game.restart();
        } else {
          game.status = 'LOBBY';
          game.currentRound = 0;
        }
      } catch (rErr) {
        logger.warn(`[ADMIN] Restart method warning on ${code}:`, rErr);
        game.status = 'LOBBY';
      }

      if (io) {
        try {
          emitGameEnded(io, code);
        } catch (sErr) {
          logger.warn(`[ADMIN] Socket emit warning on restart for ${code}:`, sErr);
        }
      }

      logger.info(`[ADMIN] Game ${code} restarted successfully.`);
      return res.status(200).json({ success: true, message: `Game ${code} restarted.` });
    } catch (err: any) {
      logger.error(`[ADMIN] Error restarting game ${code}:`, err?.stack || err);
      return res.status(500).json({ error: `Failed to restart game ${code}`, details: err?.message || String(err) });
    }
  });

  // Method Fallbacks
  router.all('/games/kill-all', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method Not Allowed. Please use HTTP POST.' });
  });

  router.all('/games/:code/kill', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method Not Allowed. Please use HTTP POST.' });
  });

  router.all('/games/:code/restart', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method Not Allowed. Please use HTTP POST.' });
  });

  return router;
}