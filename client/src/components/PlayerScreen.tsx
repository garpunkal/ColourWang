import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { AnimatePresence } from 'framer-motion';
import { PlayerJoinScreen } from './player/PlayerJoinScreen';
import { PlayerHeader } from './player/PlayerHeader';
import { PlayerLobbyScreen } from './player/PlayerLobbyScreen';
import { PlayerQuestionScreen } from './player/PlayerQuestionScreen';
import { PlayerResultScreen } from './player/PlayerResultScreen';
import { PlayerFinalScreen } from './player/PlayerFinalScreen';

interface Props {
    socket: Socket;
    gameState: GameState | null;
    setGameState: (state: GameState | null) => void;
}

export default function PlayerScreen({ socket, gameState, setGameState }: Props) {
    const [name] = useState(localStorage.getItem('playerName') || '');

    // Get list of taken avatars from current players
    const takenAvatars = gameState?.players.map(p => p.avatar) || [];

    // If not in a game, show join screen
    if (!gameState) {
        return <PlayerJoinScreen socket={socket} takenAvatars={takenAvatars} />;
    }

    const { status, players, currentQuestionIndex, questions } = gameState;
    const currentQuestion = questions[currentQuestionIndex];
    const me = players.find(p => p.socketId === socket.id || p.id === localStorage.getItem('cw_playerId'));

    return (
        <div className="flex flex-col p-4 h-full w-full max-w-2xl mx-auto relative z-10">
            <PlayerHeader
                name={me?.name || name}
                avatar={me?.avatar || 'cyber-blue'}
                score={me?.score || 0}
            />

            <div className="flex flex-col justify-center ">
                <AnimatePresence mode="wait">
                    {status === 'LOBBY' && <PlayerLobbyScreen />}

                    {status === 'QUESTION' && (
                        <PlayerQuestionScreen
                            key={currentQuestionIndex}
                            socket={socket}
                            gameState={gameState}
                            currentQuestion={currentQuestion}
                            currentQuestionIndex={currentQuestionIndex}
                        />
                    )}

                    {status === 'RESULT' && me && (
                        <PlayerResultScreen player={me} gameState={gameState} />
                    )}

                    {status === 'FINAL_SCORE' && me && (
                        <PlayerFinalScreen
                            player={me}
                            gameState={gameState}
                            setGameState={setGameState}
                        />
                    )}
                </AnimatePresence>
            </div>

          
        </div>
    );
}
