import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';

export function useSocketGameState(socket: Socket, setGameState: Dispatch<SetStateAction<GameState | null>>) {
  useEffect(() => {
    socket.on('game-created', (state: GameState) => {
      setGameState(state);
    });

    socket.on('joined-game', (data: GameState | { game: GameState, playerId: string }) => {
      if ('game' in data && 'playerId' in data) {
        setGameState(data.game);
        localStorage.setItem('cw_playerId', data.playerId);
        localStorage.setItem('cw_gameCode', data.game.code);
      } else {
        setGameState(data as GameState);
      }
    });

    socket.on('game-status-changed', (state: GameState) => setGameState(state));

    socket.on('player-joined', (players: GameState['players']) =>
      setGameState((prev: GameState | null) => prev ? { ...prev, players } : null)
    );

    socket.on('game-ended', () => {
      setGameState(null);
      localStorage.removeItem('cw_playerId');
      localStorage.removeItem('cw_gameCode');
    });

    const handleRejoin = () => {
      const savedId = localStorage.getItem('cw_playerId');
      const savedCode = localStorage.getItem('cw_gameCode');
      if (savedId && savedCode) {
        console.log('Attempting to rejoin session...', { savedCode, savedId });
        socket.emit('rejoin-game', { code: savedCode, playerId: savedId });
      }
    };

    socket.on('connect', handleRejoin);
    // Also try immediately if already connected (e.g. hot reload)
    if (socket.connected) {
      handleRejoin();
    }

    socket.on('error', (msg: string) => {
      // If we get an error related to session (game not found), clear storage so we don't keep trying to rejoin bad sessions
      if (msg === 'Game not found' || msg === 'Player session not found') {
        const hasId = localStorage.getItem('cw_playerId');
        if (hasId) {
          console.log('Clearing stale session data due to error:', msg);
          localStorage.removeItem('cw_playerId');
          localStorage.removeItem('cw_gameCode');
          setGameState(null);
        }
      }
    });

    return () => {
      socket.off('game-created');
      socket.off('joined-game');
      socket.off('game-status-changed');
      socket.off('player-joined');
      socket.off('game-ended');
      socket.off('error');
      socket.off('connect', handleRejoin);
    };
  }, [socket, setGameState]);
}
