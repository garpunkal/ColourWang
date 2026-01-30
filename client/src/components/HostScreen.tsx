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

const SPARK_DATA = [...Array(12)].map((_, i) => ({
    angle: (i / 12) * Math.PI * 2,
    velocity: 800 + Math.random() * 400
}));

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
            const timer = setTimeout(() => setShowExplosion(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [gameState?.status]);

    // Shake animation variants
    const shakeVariants = {
        shake: {
            x: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
            y: [0, 8, -8, 8, -8, 4, -4, 2, -2, 0],
            transition: { duration: 0.5 }
        }
    };

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
        <motion.div
            className="flex-1 flex flex-col p-12 overflow-hidden relative w-full min-h-screen"
            animate={showExplosion ? "shake" : ""}
            variants={shakeVariants}
        >
            {/* Massive Shockwave Overlay */}
            <AnimatePresence>
                {showExplosion && (
                    <div
                        className="fixed pointer-events-none flex items-center justify-center overflow-hidden"
                        style={{ top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, willChange: 'transform, opacity' }}
                    >
                        {/* 1. Peak Flash - Blinding additive light */}
                        <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute inset-0 bg-white z-101"
                            style={{ mixBlendMode: 'overlay' }}
                        />

                        {/* 2. Chromatic Ripple Rings */}
                        {[
                            { color: '#ff3366', delay: 0, scale: 8 },
                            { color: '#00e5ff', delay: 0.1, scale: 7 },
                            { color: '#ffffff', delay: 0.2, scale: 6 }
                        ].map((ring, i) => (
                            <motion.div
                                key={`ripple-${i}`}
                                initial={{ scale: 0, opacity: 0.9, borderWidth: "100px" }}
                                animate={{ scale: ring.scale, opacity: 0, borderWidth: "0px" }}
                                transition={{ duration: 1, ease: "easeOut", delay: ring.delay }}
                                className="absolute rounded-full box-border w-[30vh] h-[30vh]"
                                style={{
                                    borderColor: ring.color,
                                    willChange: 'transform, opacity'
                                }}
                            />
                        ))}

                        {/* 3. High Velocity Pressure Wave */}
                        <motion.div
                            initial={{ scaleX: 0, height: "150px", opacity: 1 }}
                            animate={{ scaleX: 4, height: "0px", opacity: 0 }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="absolute w-full bg-white"
                            style={{ mixBlendMode: 'overlay' }}
                        />

                        {/* 4. Particle Ejection (Sparks) */}
                        {SPARK_DATA.map((p, i) => (
                            <motion.div
                                key={`spark-${i}`}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: Math.cos(p.angle) * p.velocity,
                                    y: Math.sin(p.angle) * p.velocity,
                                    scale: 0,
                                    opacity: 0
                                }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="absolute w-3 h-3 rounded-full bg-white"
                                style={{
                                    willChange: 'transform, opacity'
                                }}
                            />
                        ))}
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
        </motion.div>
    );
};

export default HostScreen;
