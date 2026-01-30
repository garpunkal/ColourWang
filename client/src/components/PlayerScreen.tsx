import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { PlayerJoinScreen } from './player/PlayerJoinScreen';
import { PlayerHeader } from './player/PlayerHeader';
import { PlayerLobbyScreen } from './player/PlayerLobbyScreen';
import { PlayerQuestionScreen } from './player/PlayerQuestionScreen';
import { PlayerResultScreen } from './player/PlayerResultScreen';
import { PlayerFinalScreen } from './player/PlayerFinalScreen';
import { CountdownScreen } from './shared/CountdownScreen';

interface Props {
    socket: Socket;
    gameState: GameState | null;
    setGameState: (state: GameState | null) => void;
}

export default function PlayerScreen({ socket, gameState, setGameState }: Props) {
    const [name] = useState(localStorage.getItem('playerName') || '');

    // Debug logging for blank screen issue
    useEffect(() => {
        if (!gameState) return;

        const me = gameState.players.find(p => p.socketId === socket.id || p.id === localStorage.getItem('cw_playerId'));

        console.log('[DEBUG] PlayerScreen Render:', {
            status: gameState.status,
            hasMe: !!me,
            myId: me?.id,
            socketId: socket.id,
            storedId: localStorage.getItem('cw_playerId'),
            playerCount: gameState.players.length
        });

        if (gameState.status === 'RESULT' && !me) {
            console.error('[CRITICAL] PlayerScreen: Status is RESULT but player not found in gameState!', {
                socketId: socket.id,
                players: gameState.players.map(p => ({ id: p.id, socketId: p.socketId, name: p.name }))
            });
        }
    }, [gameState, socket.id]);

    // Get list of taken avatars from current players
    const takenAvatars = gameState?.players.map(p => p.avatar) || [];

    // If not in a game, show join screen
    if (!gameState) {
        return <PlayerJoinScreen socket={socket} takenAvatars={takenAvatars} />;
    }

    const { status, players, currentQuestionIndex, questions } = gameState;
    const currentQuestion = questions[currentQuestionIndex];
    const me = players.find(p => p.socketId === socket.id || p.id === localStorage.getItem('cw_playerId'));

    // If player is not in the game (e.g. server restarted or kicked), show join screen
    if (!me) {
        return <PlayerJoinScreen socket={socket} takenAvatars={takenAvatars} />;
    }

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myRank = me ? sortedPlayers.findIndex(p => p.id === me.id) + 1 : undefined;

    const handleLeaveGame = () => {
        localStorage.removeItem('cw_playerId');
        localStorage.removeItem('cw_gameCode');
        socket.disconnect();
        setGameState(null);
    };

    return (
        <div className="flex flex-col p-4 h-full w-full max-w-2xl mx-auto relative z-10">
            <PlayerHeader
                name={me?.name || name}
                avatar={me?.avatar || 'cyber-blue'}
                avatarStyle={me?.avatarStyle || 'avataaars'}
                score={me?.score || 0}
                rank={status === 'FINAL_SCORE' ? myRank : undefined}
                onLeave={handleLeaveGame}
            />

            <div className="flex-1 flex flex-col justify-start">
                {status === 'LOBBY' && <PlayerLobbyScreen gameState={gameState} />}

                {status === 'COUNTDOWN' && <CountdownScreen />}

                {status === 'QUESTION' && (!currentQuestion ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                        <h2 className="text-2xl font-bold text-white mb-2">Synchronizing...</h2>
                        <p className="text-white/60">Waiting for question data ({currentQuestionIndex + 1})</p>
                    </div>
                ) : (
                    <PlayerQuestionScreen
                        key={currentQuestionIndex + (me?.id || '')} // Add player ID to key to force remount if player changes
                        socket={socket}
                        gameState={gameState}
                        currentQuestion={currentQuestion}
                        currentQuestionIndex={currentQuestionIndex}
                    />
                ))}

                {status === 'RESULT' && !me && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                        <h2 className="text-2xl font-bold text-white mb-2">Syncing Results...</h2>
                        <p className="text-white/60">Please wait...</p>
                    </div>
                )}

                {status === 'RESULT' && me && (
                    <PlayerResultScreen
                        key="result"
                        player={me}
                        gameState={gameState}
                        currentQuestion={currentQuestion || questions[currentQuestionIndex]}
                    />
                )}

                {status === 'FINAL_SCORE' && me && (
                    <PlayerFinalScreen
                        player={me}
                        gameState={gameState}
                        setGameState={setGameState}
                        socket={socket}
                    />
                )}
            </div>


        </div>
    );
}
