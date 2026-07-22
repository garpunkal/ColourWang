import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { games } from '../game/gamesMap';
import { logger } from '../utils/logger';

// Safe helper to iterate game entries regardless of whether games is a Map or JS Object
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

// Safe helper to find a game instance by code (case-insensitive)
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

// Safe helper to delete a game key
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

export function createAdminRouter(io?: Server) {
  const router = Router();

  // GET /api/admin/games - List all active games with full settings
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

        const rawSettings = game?.settings || game?.config || {};
        const categories = rawSettings.categories || game?.categories || [];
        const answerTime = rawSettings.answerTime ?? rawSettings.questionTime ?? game?.answerTime ?? 15;
        const totalRounds = rawSettings.totalRounds ?? rawSettings.rounds ?? game?.totalRounds ?? game?.maxRounds ?? 10;

        return {
          code,
          status,
          playerCount,
          currentRound: game?.currentRound ?? game?.round ?? 0,
          totalRounds,
          settings: {
            categories: Array.isArray(categories) ? categories : [String(categories)],
            answerTime,
            totalRounds
          }
        };
      });

      return res.status(200).json(activeGames);
    } catch (err: any) {
      logger.error('[ADMIN] Error listing games:', err?.stack || err);
      return res.status(500).json({ error: 'Failed to list active games', details: err?.message || String(err) });
    }
  });

  // POST /api/admin/games/kill-all - Kill all active games
  router.post('/games/kill-all', (_req: Request, res: Response) => {
    try {
      logger.info('[ADMIN] Action: Kill All Games');

      // 1. Broadcast sockets
      if (io) {
        try {
          io.emit('game_terminated', { reason: 'Host terminated all active sessions.' });
        } catch (sErr) {
          logger.warn('[ADMIN] Socket emit warning during kill-all:', sErr);
        }
      }

      // 2. Safe cleanup per instance
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

      // 3. Clear storage
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

  // POST /api/admin/games/:code/kill - Kill a single game
  router.post('/games/:code/kill', (req: Request, res: Response) => {
    const rawCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const code = String(rawCode || '').trim();

    try {
      logger.info(`[ADMIN] Action: Kill Game ${code}`);
      const game = safeGetGame(code);

      // 1. Notify sockets
      if (io) {
        try {
          io.to(code).emit('game_terminated', { reason: 'Game terminated by host.' });
          io.to(code.toLowerCase()).emit('game_terminated', { reason: 'Game terminated by host.' });
        } catch (sErr) {
          logger.warn(`[ADMIN] Socket emit warning for ${code}:`, sErr);
        }
      }

      // 2. Cleanup instance
      if (game) {
        try {
          if (typeof game.cleanup === 'function') game.cleanup();
          else if (typeof game.destroy === 'function') game.destroy();
          else if (typeof game.stop === 'function') game.stop();
        } catch (cErr) {
          logger.warn(`[ADMIN] Cleanup warning for ${code}:`, cErr);
        }
      }

      // 3. Delete from map
      safeDeleteGame(code);

      logger.info(`[ADMIN] Game ${code} killed successfully.`);
      return res.status(200).json({ success: true, message: `Game ${code} killed.` });
    } catch (err: any) {
      logger.error(`[ADMIN] Error killing game ${code}:`, err?.stack || err);
      return res.status(500).json({ error: `Failed to kill game ${code}`, details: err?.message || String(err) });
    }
  });

  // POST /api/admin/games/:code/restart - Restart a single game
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
          io.to(code).emit('game_restarted', { message: 'Game state reset by host.' });
          io.to(code.toLowerCase()).emit('game_restarted', { message: 'Game state reset by host.' });
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

  return router;
}