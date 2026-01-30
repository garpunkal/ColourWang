import { useEffect, useState, useRef } from 'react';
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

// Reduced spark count for performance
const SPARK_DATA = [...Array(8)].map((_, i) => ({
    angle: (i / 8) * Math.PI * 2,
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
    const lastResultKey = useRef<string | null>(null);

    useEffect(() => {
        const handleUnload = () => {
            if (gameState?.code) {
                // Synchronously signal to workers/server we are leaving
                socket.emit('kill-game', gameState.code);
            }
            // Clear host session so it doesn't auto-rejoin if they just wanted to quit
            localStorage.removeItem('cw_hostCode');
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [gameState?.code, socket]);

    useEffect(() => {
        // Create a unique key for this result state
        const resultKey = `${gameState?.status}-${gameState?.currentQuestionIndex}`;

        // Trigger explosion ONLY when entering RESULT state
        const isExplosionState = gameState?.status === 'RESULT';

        if (isExplosionState && lastResultKey.current !== resultKey) {
            lastResultKey.current = resultKey;

            // Trigger explosion after a tiny delay to ensure the reset happens correctly
            const timer = setTimeout(() => {
                setShowExplosion(true);
                // Hide explosion after its sequence
                setTimeout(() => setShowExplosion(false), 2500);
            }, 100);

            return () => clearTimeout(timer);
        } else if (!isExplosionState) {
            // Reset when leaving RESULT state so it can trigger again
            lastResultKey.current = null;
        }
    }, [gameState?.status, gameState?.currentQuestionIndex]);

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
    const currentQuestion = questions ? questions[currentQuestionIndex] : null;
    const isSyncing = (status === 'QUESTION' || status === 'RESULT') && (!questions || !currentQuestion);

    if (status === 'QUESTION' || status === 'RESULT') {
        console.log(`[HOST DEBUG] State: ${status}, Index: ${currentQuestionIndex}, Question: ${currentQuestion?.question}`);
    }

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
                        {/* 1. Initial Blinding Flash */}
                        <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute inset-0 bg-white"
                        />

                        {/* 2. Golden/Pink Gradient Wash */}
                        <motion.div
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                            className="absolute inset-0"
                            style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,51,102,0.4) 50%, transparent 70%)' }}
                        />

                        {/* 3. Rotating Light Beams */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                            <motion.div
                                key={`beam-${i}`}
                                initial={{ opacity: 0.8, scaleY: 0 }}
                                animate={{ opacity: 0, scaleY: 1 }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.03 }}
                                className="absolute h-[200vh] w-8"
                                style={{
                                    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.8), transparent)',
                                    transform: `rotate(${angle}deg)`,
                                    transformOrigin: 'center center'
                                }}
                            />
                        ))}

                        {/* 4. Expanding Starburst */}
                        <motion.div
                            initial={{ scale: 0, rotate: 0, opacity: 1 }}
                            animate={{ scale: 15, rotate: 180, opacity: 0 }}
                            transition={{ duration: 1.8, ease: [0.2, 0, 0, 1] }}
                            className="absolute"
                            style={{
                                width: '100px',
                                height: '100px',
                                background: 'conic-gradient(from 0deg, transparent, white 10%, transparent 20%, transparent, white 30%, transparent 40%,transparent, white 50%, transparent 60%, transparent, white 70%, transparent 80%, transparent, white 90%, transparent)',
                                willChange: 'transform, opacity'
                            }}
                        />

                        {/* 5. Multiple Expanding Rings */}
                        {[
                            { color: '#FFD700', delay: 0, scale: 12, duration: 1.2 },
                            { color: '#ff3366', delay: 0.1, scale: 10, duration: 1.1 },
                            { color: '#00e5ff', delay: 0.2, scale: 8, duration: 1 },
                            { color: '#ffffff', delay: 0.3, scale: 6, duration: 0.9 }
                        ].map((ring, i) => (
                            <motion.div
                                key={`ring-${i}`}
                                initial={{ scale: 0, opacity: 1, borderWidth: "80px" }}
                                animate={{ scale: ring.scale, opacity: 0, borderWidth: "0px" }}
                                transition={{ duration: ring.duration, ease: "easeOut", delay: ring.delay }}
                                className="absolute rounded-full box-border"
                                style={{
                                    width: '20vh',
                                    height: '20vh',
                                    borderColor: ring.color,
                                    borderStyle: 'solid',
                                    willChange: 'transform, opacity'
                                }}
                            />
                        ))}

                        {/* 6. Central Glowing Orb */}
                        <motion.div
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 3, opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute w-32 h-32 rounded-full"
                            style={{
                                background: 'radial-gradient(circle, white 0%, rgba(255,215,0,0.8) 30%, rgba(255,51,102,0.6) 60%, transparent 70%)',
                                boxShadow: '0 0 100px 50px rgba(255,215,0,0.5)',
                                willChange: 'transform, opacity'
                            }}
                        />

                        {/* 7. Outward Energy Sparks - more dramatic */}
                        {SPARK_DATA.map((p, i) => (
                            <motion.div
                                key={`spark-${i}`}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: Math.cos(p.angle) * p.velocity * 1.5,
                                    y: Math.sin(p.angle) * p.velocity * 1.5,
                                    scale: 0,
                                    opacity: 0
                                }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                className="absolute w-4 h-4 rounded-full"
                                style={{
                                    background: i % 2 === 0 ? '#FFD700' : '#ff3366',
                                    boxShadow: `0 0 20px ${i % 2 === 0 ? '#FFD700' : '#ff3366'}`,
                                    willChange: 'transform, opacity'
                                }}
                            />
                        ))}

                        {/* 8. Screen Edge Glow Pulse */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.6, 0] }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                            className="absolute inset-0"
                            style={{
                                boxShadow: 'inset 0 0 200px 100px rgba(255,215,0,0.3)',
                                willChange: 'opacity'
                            }}
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
                <AnimatePresence>
                    {isSyncing ? (
                        <div key="syncing" className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <h2 className="text-4xl font-bold text-white mb-4">Synchronizing Wang Network...</h2>
                            <p className="text-xl text-white/60">Phase Data: {currentQuestionIndex + 1}/{questions?.length || 0}</p>
                        </div>
                    ) : status === 'LOBBY' ? (
                        <HostLobbyScreen
                            key="lobby"
                            players={players}
                            onStartGame={startGame}
                            onRemovePlayer={removePlayer}
                        />
                    ) : status === 'COUNTDOWN' ? (
                        <CountdownScreen key="countdown" />
                    ) : status === 'QUESTION' && currentQuestion ? (
                        <HostQuestionScreen
                            key={`question-${currentQuestionIndex}`}
                            socket={socket}
                            gameState={gameState}
                            currentQuestion={currentQuestion}
                            currentQuestionIndex={currentQuestionIndex}
                            timeLeft={timeLeft}
                        />
                    ) : status === 'RESULT' && currentQuestion ? (
                        <HostResultScreen
                            key={`result-${currentQuestionIndex}`}
                            socket={socket}
                            gameState={gameState}
                            currentQuestion={currentQuestion}
                            currentQuestionIndex={currentQuestionIndex}
                            totalQuestions={questions.length}
                            onNextQuestion={nextQuestion}
                        />
                    ) : status === 'FINAL_SCORE' ? (
                        <HostFinalScreen
                            key="final"
                            socket={socket}
                            players={players}
                            rounds={questions.length}
                            timer={gameState.timerDuration || 15}
                            code={code}
                        />
                    ) : null}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default HostScreen;
