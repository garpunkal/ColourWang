import { Router } from 'express';
import { Server } from 'socket.io';
import { games } from '../game/gamesMap';
import { logger } from '../utils/logger';

function getGameEntries(): [string, any][] {
  if (!games) return [];
  if (games instanceof Map) {
    return Array.from(games.entries());
  }
  if (typeof games === 'object') {
    return Object.entries(games);
  }
  return [];
}

function getGameByCode(code: string): any | null {
  if (!games) return null;
  if (games instanceof Map) {
    return games.get(code) || null;
  }
  if (typeof games === 'object') {
    return (games as Record<string, any>)[code] || null;
  }
  return null;
}

function deleteGameByCode(code: string): void {
  if (!games) return;
  if (games instanceof Map) {
    games.delete(code);
  } else if (typeof games === 'object') {
    delete (games as Record<string, any>)[code];
  }
}

function clearAllGames(): void {
  if (!games) return;
  if (games instanceof Map) {
    games.clear();
  } else if (typeof games === 'object') {
    for (const key of Object.keys(games)) {
      delete (games as Record<string, any>)[key];
    }
  }
}

export function createAdminRouter(io: Server) {
  const router = Router();

  // GET all active games
  router.get('/games', (_req, res) => {
    try {
      const entries = getGameEntries();
      const activeGames = entries.map(([code, game]) => ({
        code: code || (game as any).code || (game as any).id || 'N/A',
        status: (game as any).status || (game as any).state || 'LOBBY',
        playerCount: (game as any).playerCount ?? ((game as any).players ? ((game as any).players instanceof Map ? (game as any).players.size : Object.keys((game as any).players).length) : 0),
        currentRound: (game as any).currentRound ?? (game as any).round ?? 0,
        totalRounds: (game as any).totalRounds ?? (game as any).maxRounds ?? 10
      }));
      res.json(activeGames);
    } catch (err: any) {
      logger.error('Error fetching admin games list:', err?.stack || err);
      res.status(500).json({ error: 'Failed to fetch games list', details: err.message });
    }
  });

  // POST Kill All Games
  router.post('/games/kill-all', (_req, res) => {
    try {
      logger.info('Admin triggered: Kill All Games');

      if (io && typeof io.emit === 'function') {
        try {
          io.emit('game_terminated', { reason: 'Host terminated all active sessions.' });
        } catch (socketErr) {
          logger.warn('Failed to broadcast game_terminated socket event:', socketErr);
        }
      }

      const entries = getGameEntries();
      for (const [code, game] of entries) {
        try {
          if (game && typeof game.cleanup === 'function') {
            game.cleanup();
          } else if (game && typeof game.destroy === 'function') {
            game.destroy();
          }
        } catch (cleanupErr) {
          logger.warn(`Cleanup warning for game ${code}:`, cleanupErr);
        }
      }

      clearAllGames();

      res.json({ success: true, message: 'All games terminated successfully.' });
    } catch (err: any) {
      logger.error('Failed to kill all games:', err?.stack || err);
      res.status(500).json({ error: 'Internal server error while terminating games', details: err.message });
    }
  });

  // POST Kill Specific Game
  router.post('/games/:code/kill', (req, res) => {
    try {
      const { code } = req.params;
      const game = getGameByCode(code);

      if (!game) {
        deleteGameByCode(code);
        return res.status(200).json({ success: true, message: `Game ${code} was not active or already removed.` });
      }

      if (io && typeof io.to === 'function') {
        try {
          io.to(code).emit('game_terminated', { reason: 'Game terminated by admin.' });
        } catch (socketErr) {
          logger.warn(`Failed socket notify for room ${code}:`, socketErr);
        }
      }

      try {
        if (typeof game.cleanup === 'function') {
          game.cleanup();
        } else if (typeof game.destroy === 'function') {
          game.destroy();
        }
      } catch (cleanupErr) {
        logger.warn(`Cleanup warning for game ${code}:`, cleanupErr);
      }

      deleteGameByCode(code);
      logger.info(`Admin killed game: ${code}`);

      res.json({ success: true, message: `Game ${code} killed.` });
    } catch (err: any) {
      logger.error(`Failed to kill game ${req.params.code}:`, err?.stack || err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  // POST Restart Specific Game
  router.post('/games/:code/restart', (req, res) => {
    try {
      const { code } = req.params;
      const game = getGameByCode(code);

      if (!game) {
        return res.status(404).json({ error: `Game ${code} not found` });
      }

      if (typeof game.reset === 'function') {
        game.reset();
      } else {
        game.status = 'LOBBY';
        (game as any).currentRound = 0;
      }

      if (io && typeof io.to === 'function') {
        try {
          io.to(code).emit('game_restarted', { message: 'Game state reset by admin.' });
        } catch (socketErr) {
          logger.warn(`Failed socket restart notify for room ${code}:`, socketErr);
        }
      }

      logger.info(`Admin restarted game: ${code}`);
      res.json({ success: true, message: `Game ${code} restarted.` });
    } catch (err: any) {
      logger.error(`Failed to restart game ${req.params.code}:`, err?.stack || err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  return router;
}