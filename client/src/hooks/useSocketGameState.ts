import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';

export function useSocketGameState(socket: Socket, setGameState: Dispatch<SetStateAction<GameState | null>>) {
  useEffect(() => {
    socket.on('game-created', (state: GameState) => setGameState(state));
    socket.on('joined-game', (state: GameState) => setGameState(state));
    socket.on('game-status-changed', (state: GameState) => setGameState(state));
    socket.on('player-joined', (players: GameState['players']) =>
      setGameState((prev: GameState | null) => prev ? { ...prev, players } : null)
    );

    return () => {
      socket.off('game-created');
      socket.off('joined-game');
      socket.off('game-status-changed');
      socket.off('player-joined');
    };
  }, [socket, setGameState]);
}
