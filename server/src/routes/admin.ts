import { Router } from 'express';
import { Server } from 'socket.io';
import { games } from '../game/gamesMap';
import { logger } from '../utils/logger';

export function createAdminRouter(io: Server) {
  const router = Router();

  // GET all active games
  router.get('/games', (_req, res) => {
    try {
      const activeGames = [...games.values()].map(game => ({
        code: game.code || (game as any).id || 'N/A',
        status: game.status || (game as any).state || 'LOBBY',
        playerCount: (game as any).playerCount ?? (game.players ? Object.keys(game.players).length : 0),
        currentRound: game.currentRound ?? (game as any).round ?? 0,
        totalRounds: (game as any).totalRounds ?? (game as any).maxRounds ?? 10
      }));
      res.json(activeGames);
    } catch (err: any) {
      logger.error('Error fetching admin games list:', err);
      res.status(500).json({ error: 'Failed to fetch games list', details: err.message });
    }
  });

  // POST Kill All Games
  router.post('/games/kill-all', (_req, res) => {
    try {
      logger.info('Admin triggered: Kill All Games');

      if (io) {
        io.emit('game_terminated', { reason: 'Host terminated all active sessions.' });
      }

      for (const [code, game] of games.entries()) {
        try {
          if (typeof (game as any).cleanup === 'function') {
            (game as any).cleanup();
          } else if (typeof (game as any).destroy === 'function') {
            (game as any).destroy();
          }
        } catch (cleanupErr) {
          logger.warn(`Failed individual cleanup for game ${code}:`, cleanupErr);
        }
      }

      games.clear();

      res.json({ success: true, message: 'All games terminated successfully.' });
    } catch (err: any) {
      logger.error('Failed to kill all games:', err);
      res.status(500).json({ error: 'Internal server error while terminating games', details: err.message });
    }
  });

  // POST Kill Specific Game
  router.post('/games/:code/kill', (req, res) => {
    try {
      const { code } = req.params;
      const game = games.get(code);

      if (!game) {
        return res.status(404).json({ error: `Game ${code} not found` });
      }

      if (io) {
        io.to(code).emit('game_terminated', { reason: 'Game terminated by admin.' });
      }

      try {
        if (typeof (game as any).cleanup === 'function') {
          (game as any).cleanup();
        } else if (typeof (game as any).destroy === 'function') {
          (game as any).destroy();
        }
      } catch (cleanupErr) {
        logger.warn(`Failed cleanup for game ${code}:`, cleanupErr);
      }

      games.delete(code);
      logger.info(`Admin killed game: ${code}`);

      res.json({ success: true, message: `Game ${code} killed.` });
    } catch (err: any) {
      logger.error(`Failed to kill game ${req.params.code}:`, err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  // POST Restart Specific Game
  router.post('/games/:code/restart', (req, res) => {
    try {
      const { code } = req.params;
      const game = games.get(code);

      if (!game) {
        return res.status(404).json({ error: `Game ${code} not found` });
      }

      if (typeof (game as any).reset === 'function') {
        (game as any).reset();
      } else {
        game.status = 'LOBBY';
        game.currentRound = 0;
      }

      if (io) {
        io.to(code).emit('game_restarted', { message: 'Game state reset by admin.' });
      }

      logger.info(`Admin restarted game: ${code}`);
      res.json({ success: true, message: `Game ${code} restarted.` });
    } catch (err: any) {
      logger.error(`Failed to restart game ${req.params.code}:`, err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  return router;
}