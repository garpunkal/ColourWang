import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { PlayerJoinScreen } from './player/PlayerJoinScreen';
import { PlayerHeader } from './player/PlayerHeader';
import { PlayerLobbyScreen } from './player/PlayerLobbyScreen';
import { PlayerQuestionScreen } from './player/PlayerQuestionScreen';
import { PlayerResultScreen } from './player/PlayerResultScreen';
import { PlayerFinalScreen } from './player/PlayerFinalScreen';
import { PlayerFooter } from './player/PlayerFooter';
import { ConfirmModal } from './shared/ConfirmModal';

interface Props {
    socket: Socket;
    gameState: GameState | null;
    setGameState: (state: GameState | null) => void;
}

export default function PlayerScreen({ socket, gameState, setGameState }: Props) {
    const [name] = useState(localStorage.getItem('playerName') || '');
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    // Get list of taken avatars from current players
    const takenAvatars = gameState?.players.map(p => ({ 
        avatar: p.avatar, 
        avatarStyle: p.avatarStyle || 'avataaars' 
    })) || [];

    // If not in a game, show join screen
    if (!gameState) {
        return <PlayerJoinScreen socket={socket} takenAvatars={takenAvatars} />;
    }

    const { status, players, currentQuestionIndex, questions } = gameState;
    const currentQuestion = questions[currentQuestionIndex];
    const me = players.find(p => p.socketId === socket.id || p.id === localStorage.getItem('cw_playerId'));
    const isResultView = status === 'RESULT' && !!me;

    // If player is not in the game (e.g. server restarted or kicked), show join screen
    if (!me) {
        return <PlayerJoinScreen socket={socket} takenAvatars={takenAvatars} />;
    }

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myRank = me ? sortedPlayers.findIndex(p => p.id === me.id) + 1 : undefined;

    const leaveGame = () => {
        setShowLeaveModal(true);
    };

    const handleLeaveConfirm = () => {
        if (gameState) {
            const pid = me?.id || localStorage.getItem('cw_playerId');
            socket.emit('leave-game', { code: gameState.code, playerId: pid });
        }
        localStorage.removeItem('cw_playerId');
        localStorage.removeItem('cw_gameCode');
        setGameState(null);
        setShowLeaveModal(false);
    };

    return (
        <div className={isResultView ? 'min-h-screen w-full relative z-10' : 'flex flex-col p-2 md:p-4 min-h-screen w-full max-w-2xl mx-auto relative z-10'}>
            {!isResultView && (
                <PlayerHeader
                    name={me?.name || name}
                    avatar={me?.avatar || 'cyber-blue'}
                    avatarStyle={me?.avatarStyle || 'avataaars'}
                    score={me?.score || 0}
                    rank={status === 'FINAL_SCORE' ? myRank : undefined}
                />
            )}

            <div className={isResultView ? 'min-h-screen w-full' : 'flex-1 flex flex-col justify-start'}>
                {(status === 'LOBBY' || status === 'COUNTDOWN' || status === 'ROUND_INTRO') && <PlayerLobbyScreen gameState={gameState} />}


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

                {status === 'RESULT' && (
                    <PlayerResultScreen
                        key={`result-${currentQuestionIndex}`}
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

            {!isResultView && <PlayerFooter onLeave={leaveGame} />}

            {/* Leave Game Confirmation Modal */}
            <ConfirmModal
                isOpen={showLeaveModal}
                title="Leave Game"
                message="Are you sure you want to leave the game completely?"
                confirmText="Leave Game"
                variant="danger"
                onConfirm={handleLeaveConfirm}
                onCancel={() => setShowLeaveModal(false)}
            />
        </div>
    );
}
