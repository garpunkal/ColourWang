import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { games } from '../game/gamesMap';
import { logger } from '../utils/logger';

// Utility to get all entries as [code, game] tuples safely
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

// Utility to lookup a game safely
function safeGetGame(code: string): any | null {
  if (!games || !code) return null;
  const targetCode = String(code).trim().toUpperCase();
  
  if (games instanceof Map) {
    if (games.has(targetCode)) return games.get(targetCode);
    // Case-insensitive search fallback
    for (const [key, val] of games.entries()) {
      if (String(key).toUpperCase() === targetCode) return val;
    }
  } else if (typeof games === 'object') {
    const record = games as Record<string, any>;
    if (record[targetCode]) return record[targetCode];
    for (const key of Object.keys(record)) {
      if (String(key).toUpperCase() === targetCode) return record[key];
    }
  }
  return null;
}

// Utility to delete a game safely
function safeDeleteGame(code: string): boolean {
  if (!games || !code) return false;
  const targetCode = String(code).trim().toUpperCase();

  if (games instanceof Map) {
    if (games.has(targetCode)) return games.delete(targetCode);
    for (const key of games.keys()) {
      if (String(key).toUpperCase() === targetCode) return games.delete(key);
    }
  } else if (typeof games === 'object') {
    const record = games as Record<string, any>;
    if (record[targetCode]) {
      delete record[targetCode];
      return true;
    }
    for (const key of Object.keys(record)) {
      if (String(key).toUpperCase() === targetCode) {
        delete record[key];
        return true;
      }
    }
  }
  return false;
}

export function createAdminRouter(io: Server) {
  const router = Router();

  // GET /api/admin/games - List active games
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

        return {
          code,
          status,
          playerCount,
          currentRound: game?.currentRound ?? game?.round ?? 0,
          totalRounds: game?.totalRounds ?? game?.maxRounds ?? 10
        };
      });

      res.json(activeGames);
    } catch (err: any) {
      logger.error('Failed to list games:', err?.stack || err);
      res.status(500).json({ error: 'Failed to list active games', details: err?.message });
    }
  });

  // POST /api/admin/games/kill-all - Kill all games
  router.post('/games/kill-all', (_req: Request, res: Response) => {
    try {
      logger.info('[ADMIN] Triggered: Kill All Games');

      if (io && typeof io.emit === 'function') {
        try {
          io.emit('game_terminated', { reason: 'Host terminated all active sessions.' });
        } catch (sErr) {
          logger.warn('[ADMIN] Socket broadcast failed during kill-all:', sErr);
        }
      }

      const entries = safeGetEntries();
      for (const [code, game] of entries) {
        try {
          if (game) {
            if (typeof game.cleanup === 'function') game.cleanup();
            else if (typeof game.destroy === 'function') game.destroy();
            else if (typeof game.stop === 'function') game.stop();
          }
        } catch (cErr) {
          logger.warn(`[ADMIN] Cleanup warning for ${code}:`, cErr);
        }
      }

      if (games instanceof Map) {
        games.clear();
      } else if (typeof games === 'object') {
        for (const k of Object.keys(games)) delete (games as any)[k];
      }

      logger.info('[ADMIN] All games successfully terminated.');
      res.json({ success: true, message: 'All games killed.' });
    } catch (err: any) {
      logger.error('[ADMIN] Fatal error in kill-all:', err?.stack || err);
      res.status(500).json({ error: 'Failed to kill all games', details: err?.message });
    }
  });

  // POST /api/admin/games/:code/kill - Kill a single game
  router.post('/games/:code/kill', (req: Request, res: Response) => {
    try {
      const code = Array.isArray(req.params.code) ? req.params.code[0] : String(req.params.code);
      logger.info(`[ADMIN] Triggered: Kill Game ${code}`);

      const game = safeGetGame(code);

      if (io && typeof io.to === 'function') {
        try {
          io.to(code).emit('game_terminated', { reason: 'Game terminated by host.' });
        } catch (sErr) {
          logger.warn(`[ADMIN] Socket room emit failed for ${code}:`, sErr);
        }
      }

      if (game) {
        try {
          if (typeof game.cleanup === 'function') game.cleanup();
          else if (typeof game.destroy === 'function') game.destroy();
          else if (typeof game.stop === 'function') game.stop();
        } catch (cErr) {
          logger.warn(`[ADMIN] Cleanup failed for ${code}:`, cErr);
        }
      }

      safeDeleteGame(code);

      logger.info(`[ADMIN] Successfully killed game ${code}`);
      res.json({ success: true, message: `Game ${code} killed.` });
    } catch (err: any) {
      const paramCode = String(req.params.code);
      logger.error(`[ADMIN] Fatal error killing game ${paramCode}:`, err?.stack || err);
      res.status(500).json({ error: `Failed to kill game ${paramCode}`, details: err?.message });
    }
  });

  // POST /api/admin/games/:code/restart - Restart a single game
  router.post('/games/:code/restart', (req: Request, res: Response) => {
    try {
      const code = Array.isArray(req.params.code) ? req.params.code[0] : String(req.params.code);
      logger.info(`[ADMIN] Triggered: Restart Game ${code}`);

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

      if (io && typeof io.to === 'function') {
        try {
          io.to(code).emit('game_restarted', { message: 'Game state reset by host.' });
        } catch (sErr) {
          logger.warn(`[ADMIN] Socket room restart emit failed for ${code}:`, sErr);
        }
      }

      logger.info(`[ADMIN] Successfully restarted game ${code}`);
      res.json({ success: true, message: `Game ${code} restarted.` });
    } catch (err: any) {
      const paramCode = String(req.params.code);
      logger.error(`[ADMIN] Fatal error restarting game ${paramCode}:`, err?.stack || err);
      res.status(500).json({ error: `Failed to restart game ${paramCode}`, details: err?.message });
    }
  });

  return router;
}