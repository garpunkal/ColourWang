import { useState, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

interface ConnectionState {
    isConnected: boolean;
    isReconnecting: boolean;
    reconnectAttempt: number;
}

export function useSocketConnection(socket: Socket) {
    const [state, setState] = useState<ConnectionState>({
        isConnected: socket.connected,
        isReconnecting: false,
        reconnectAttempt: 0
    });

    const saveGameState = useCallback(() => {
        const savedData = {
            playerId: localStorage.getItem('cw_playerId'),
            playerName: localStorage.getItem('cw_playerName'),
            gameCode: localStorage.getItem('cw_gameCode'),
            lastSeen: Date.now()
        };
        localStorage.setItem('cw_reconnectData', JSON.stringify(savedData));
    }, []);

    const attemptReconnect = useCallback(() => {
        const reconnectData = localStorage.getItem('cw_reconnectData');
        if (reconnectData) {
            try {
                const data = JSON.parse(reconnectData);
                // Only reconnect if session is less than 5 minutes old
                if (Date.now() - data.lastSeen < 5 * 60 * 1000) {
                    if (data.gameCode && data.playerId) {
                        console.log('[Reconnect] Attempting to rejoin game:', data.gameCode);
                        socket.emit('rejoin-game', {
                            code: data.gameCode,
                            playerId: data.playerId,
                            name: data.playerName
                        });
                    }
                } else {
                    // Session too old, clear it
                    localStorage.removeItem('cw_reconnectData');
                }
            } catch (err) {
                console.error('[Reconnect] Failed to parse reconnect data:', err);
            }
        }
    }, [socket]);

    useEffect(() => {
        const handleConnect = () => {
            console.log('[Socket] Connected');
            setState(prev => ({
                ...prev,
                isConnected: true,
                isReconnecting: false,
                reconnectAttempt: 0
            }));
            
            // Try to reconnect to previous game
            attemptReconnect();
        };

        const handleDisconnect = (reason: string) => {
            console.log('[Socket] Disconnected:', reason);
            setState(prev => ({
                ...prev,
                isConnected: false,
                isReconnecting: reason !== 'io client disconnect' // Don't reconnect if intentional
            }));
            
            // Save current state for potential reconnection
            saveGameState();
        };

        const handleReconnectAttempt = (attempt: number) => {
            console.log('[Socket] Reconnect attempt:', attempt);
            setState(prev => ({
                ...prev,
                reconnectAttempt: attempt
            }));
        };

        const handleReconnectError = (error: Error) => {
            console.error('[Socket] Reconnect error:', error);
        };

        const handleReconnectFailed = () => {
            console.error('[Socket] Reconnection failed');
            setState(prev => ({
                ...prev,
                isReconnecting: false
            }));
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.io.on('reconnect_attempt', handleReconnectAttempt);
        socket.io.on('reconnect_error', handleReconnectError);
        socket.io.on('reconnect_failed', handleReconnectFailed);

        // Initial check
        setTimeout(() => setState(prev => ({ ...prev, isConnected: socket.connected })), 0);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.io.off('reconnect_attempt', handleReconnectAttempt);
            socket.io.off('reconnect_error', handleReconnectError);
            socket.io.off('reconnect_failed', handleReconnectFailed);
        };
    }, [socket, saveGameState, attemptReconnect]);

    // Save game state periodically
    useEffect(() => {
        if (state.isConnected) {
            const interval = setInterval(saveGameState, 10000); // Every 10 seconds
            return () => clearInterval(interval);
        }
    }, [state.isConnected, saveGameState]);

    return state.isConnected;
}

export function useReconnectionStatus(socket: Socket) {
    const [status, setStatus] = useState({
        isReconnecting: false,
        attempt: 0
    });

    useEffect(() => {
        const handleDisconnect = () => {
            setStatus({ isReconnecting: true, attempt: 0 });
        };

        const handleConnect = () => {
            setStatus({ isReconnecting: false, attempt: 0 });
        };

        const handleReconnectAttempt = (attempt: number) => {
            setStatus({ isReconnecting: true, attempt });
        };

        socket.on('disconnect', handleDisconnect);
        socket.on('connect', handleConnect);
        socket.io.on('reconnect_attempt', handleReconnectAttempt);

        return () => {
            socket.off('disconnect', handleDisconnect);
            socket.off('connect', handleConnect);
            socket.io.off('reconnect_attempt', handleReconnectAttempt);
        };
    }, [socket]);

    return status;
}
