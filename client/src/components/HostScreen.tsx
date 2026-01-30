import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { AnimatePresence, motion } from 'framer-motion';
import { HostSetupScreen } from './host/HostSetupScreen';
import { HostHeader } from './host/HostHeader';
import { HostLobbyScreen } from './host/HostLobbyScreen';
import { HostQuestionScreen } from './host/HostQuestionScreen';
import { HostResultScreen } from './host/HostResultScreen';
import { HostFinalScreen } from './host/HostFinalScreen';
import { CountdownScreen } from './shared/CountdownScreen';
// import { FullScreenCountdown } from './FullScreenCountdown';

interface Props {
    socket: Socket;
    gameState: GameState | null;
}


const HostScreen = ({ socket, gameState }: Props) => {
    const [timeLeft, setTimeLeft] = useState(15);
    // const [showCountdown, setShowCountdown] = useState(false);

    const [showExplosion, setShowExplosion] = useState(false);

    useEffect(() => {
        if (gameState?.status === 'RESULT') {
            setTimeout(() => setShowExplosion(true), 0);
            const timer = setTimeout(() => setShowExplosion(false), 2000);
            return () => clearTimeout(timer);
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

    const removePlayer = (playerId: string) => {
        if (gameState) {
            socket.emit('remove-player', { code: gameState.code, playerId });
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
                <h2 className="text-4xl font-bold text-white mb-4">Synchronizing Wang Network...</h2>
                <p className="text-xl text-white/60">Phase Data: {currentQuestionIndex + 1}/{questions?.length || 0}</p>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex-1 flex flex-col p-12 overflow-hidden relative w-full h-full">
            {/* Massive Shockwave Overlay */}
            <AnimatePresence>
                {showExplosion && (
                    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
                        {/* 1. The Blind Flash */}
                        <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute inset-0 bg-white mix-blend-overlay"
                        />

                        {/* 2. Expanding Core Blast */}
                        <motion.div
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 4, opacity: 0 }}
                            transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
                            className="w-[50vw] h-[50vw] rounded-full bg-radial-gradient from-white via-transparent to-transparent mix-blend-screen"
                        />

                        {/* 3. High Velocity Shock Rings */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={`ring-${i}`}
                                initial={{ scale: 0.1, opacity: 0, borderWidth: "50px" }}
                                animate={{ scale: 2 + i, opacity: [0, 1, 0], borderWidth: "0px" }}
                                transition={{
                                    duration: 1.5,
                                    ease: "circOut",
                                    delay: i * 0.1
                                }}
                                className="absolute rounded-full border-color-blue mix-blend-screen box-border w-[60vh] h-[60vh]"
                                style={{ borderColor: i === 1 ? 'var(--color-pink)' : 'var(--color-blue)' }}
                            />
                        ))}

                        {/* 4. Horizontal energy slice */}
                        <motion.div
                            initial={{ scaleX: 0, height: "20px", opacity: 1 }}
                            animate={{ scaleX: 3, height: "0px", opacity: 0 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                            className="absolute w-full bg-white mix-blend-overlay"
                        />
                    </div>
                )}
            </AnimatePresence>
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
                            onRemovePlayer={removePlayer}
                        />
                    )}

                    {status === 'COUNTDOWN' && (
                        <CountdownScreen />
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
