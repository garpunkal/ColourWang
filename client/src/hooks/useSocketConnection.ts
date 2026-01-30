import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

export function useSocketConnection(socket: Socket) {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // Initial check
        setTimeout(() => setIsConnected(socket.connected), 0);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket]);

    return isConnected;
}
