import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import confetti from 'canvas-confetti';
import { AnimatePresence } from 'framer-motion';
import { HostSetupScreen } from './host/HostSetupScreen';
import { HostHeader } from './host/HostHeader';
import { HostLobbyScreen } from './host/HostLobbyScreen';
import { HostQuestionScreen } from './host/HostQuestionScreen';
import { HostResultScreen } from './host/HostResultScreen';
import { HostFinalScreen } from './host/HostFinalScreen';
// import { FullScreenCountdown } from './FullScreenCountdown';

interface Props {
    socket: Socket;
    gameState: GameState | null;
}


const HostScreen = ({ socket, gameState }: Props) => {
    const [timeLeft, setTimeLeft] = useState(15);
    // const [showCountdown, setShowCountdown] = useState(false);

    useEffect(() => {
        if (gameState?.status === 'RESULT') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#00e5ff', '#9d50bb', '#f83a7b', '#ff9d00']
            });
        }
    }, [gameState?.status]);

    useEffect(() => {
        if (gameState?.status === 'QUESTION' && gameState.timerDuration) {
            let current = gameState.timerDuration;
            queueMicrotask(() => setTimeLeft(current));

            const interval = setInterval(() => {
                current -= 1;
                if (current <= 0) {
                    clearInterval(interval);
                    setTimeLeft(0);
                    socket.emit('time-up', gameState.code);
                } else {
                    setTimeLeft(current);
                }
            }, 1000);

            // Speed up if all players answered
            const answerHandler = (players: { id: string; hasAnswered: boolean }[]) => {
                if (players.length > 0 && players.every(p => p.hasAnswered)) {
                    clearInterval(interval);
                    setTimeLeft(0);
                    socket.emit('time-up', gameState.code);
                }
            };
            socket.on('player-answered', answerHandler);

            return () => {
                clearInterval(interval);
                socket.off('player-answered', answerHandler);
            };
        }
    }, [gameState?.status, gameState?.currentQuestionIndex, gameState?.timerDuration, gameState?.code, socket]);


    const startGame = () => {
        if (gameState) {
            socket.emit('start-game', gameState.code);
        }
    };

    const nextQuestion = () => {
        if (gameState) {
            socket.emit('next-question', gameState.code);
        }
    };

    // If no game state, show setup screen
    if (!gameState) {
        return <HostSetupScreen socket={socket} />;
    }

    const { code, players, status, currentQuestionIndex, questions } = gameState;

    // Safety check for questions
    if ((status === 'QUESTION' || status === 'RESULT') && (!questions || !questions[currentQuestionIndex])) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Synchronizing Neural Network...</h2>
                <p className="text-xl text-white/60">Phase Data: {currentQuestionIndex + 1}/{questions?.length || 0}</p>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex-1 flex flex-col p-12 overflow-hidden relative w-full h-full">
            {status === 'LOBBY' && (
                <HostHeader
                    code={code}
                    playerCount={players.length}
                    compact={true}
                />
            )}

            <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full">
                <AnimatePresence mode="wait">
                    {status === 'LOBBY' && (
                        <HostLobbyScreen
                            players={players}
                            onStartGame={startGame}
                        />
                    )}

                    {status === 'QUESTION' && (
                        <HostQuestionScreen
                            key={currentQuestionIndex}
                            socket={socket}
                            gameState={gameState}
                            currentQuestion={currentQuestion}
                            currentQuestionIndex={currentQuestionIndex}
                            timeLeft={timeLeft}
                        />
                    )}

                    {status === 'RESULT' && (
                        <HostResultScreen
                            gameState={gameState}
                            currentQuestion={currentQuestion}
                            currentQuestionIndex={currentQuestionIndex}
                            totalQuestions={questions.length}
                            onNextQuestion={nextQuestion}
                        />
                    )}

                    {status === 'FINAL_SCORE' && (
                        <HostFinalScreen
                            socket={socket}
                            players={players}
                            rounds={questions.length}
                            timer={gameState.timerDuration || 15}
                            code={code}
                        />
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default HostScreen;
