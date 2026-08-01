import { useEffect, useMemo, useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { AnimatePresence, motion, animate } from 'framer-motion';
import { HostSetupScreen } from './host/HostSetupScreen';
import { HostHeader } from './host/HostHeader';
import { HostLobbyScreen } from './host/HostLobbyScreen';
import { HostQuestionScreen } from './host/HostQuestionScreen';
import { HostResultScreen } from './host/HostResultScreen';
import { HostFinalScreen } from './host/HostFinalScreen';
import { CountdownScreen } from './shared/CountdownScreen';
import { RoundIntroScreen } from './RoundIntroScreen';
import { audioManager } from '../utils/audioManager';
import { useReducedMotion } from '../hooks/useReducedMotion';
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
    const [timeLeft, setTimeLeft] = useState(30);
    // const [showCountdown, setShowCountdown] = useState(false);

    const [showExplosion, setShowExplosion] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const lastResultKey = useRef<string | null>(null);
    const shakeRef = useRef<HTMLDivElement>(null);

    const isLowPerformanceMode = useMemo(() => {
        if (prefersReducedMotion) return true;
        if (typeof navigator === 'undefined') return false;

        const nav = navigator as Navigator & {
            connection?: { saveData?: boolean };
            deviceMemory?: number;
        };

        const lowCpuThreads = (navigator.hardwareConcurrency ?? 8) <= 4;
        const lowMemory = (nav.deviceMemory ?? 8) <= 4;
        const saveData = nav.connection?.saveData === true;

        return lowCpuThreads || lowMemory || saveData;
    }, [prefersReducedMotion]);

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
                // Skip expensive shake animation on low-powered devices.
                if (!isLowPerformanceMode && shakeRef.current) {
                    animate(
                        shakeRef.current,
                        { x: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0], y: [0, 8, -8, 8, -8, 4, -4, 2, -2, 0] },
                        { duration: 0.5 }
                    ).then(() => {
                        if (shakeRef.current) shakeRef.current.style.transform = '';
                    });
                }
                // Hide explosion after its sequence
                setTimeout(() => setShowExplosion(false), isLowPerformanceMode ? 1200 : 2200);
            }, 100);

            return () => clearTimeout(timer);
        } else if (!isExplosionState) {
            // Reset when leaving RESULT state so it can trigger again
            lastResultKey.current = null;
        }
    }, [gameState?.status, gameState?.currentQuestionIndex, isLowPerformanceMode]);

    // BGM Control
    useEffect(() => {
        if (gameState?.musicEnabled && gameState.bgmTrack !== 'off') {
            audioManager.playBGM(gameState.bgmTrack);
        } else {
            audioManager.stopBGM();
        }
    }, [gameState?.musicEnabled, gameState?.bgmTrack]);

    useEffect(() => {
        return () => audioManager.stopBGM();
    }, []);


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

    const abandonGame = () => {
        if (!gameState?.code) return;
        socket.emit('kill-game', gameState.code);
        localStorage.removeItem('cw_hostCode');
        window.location.reload();
    };

    // If no game state, show setup screen
    if (!gameState) {
        console.log('[HOST] No gameState - showing HostSetupScreen');
        return (
            <div className="flex-1 flex flex-col p-12 overflow-hidden relative w-full min-h-screen">
                <HostSetupScreen socket={socket} />
            </div>
        );
    }

    const { code, players, status, currentQuestionIndex, questions } = gameState;
    const currentQuestion = questions ? questions[currentQuestionIndex] : null;
    const isSyncing = (status === 'QUESTION' || status === 'RESULT') && (!questions || !currentQuestion);
    const isResultView = status === 'RESULT' && !!currentQuestion;

    if (status === 'QUESTION' || status === 'RESULT') {
        console.log(`[HOST DEBUG] State: ${status}, Index: ${currentQuestionIndex}, Question: ${currentQuestion?.question}`);
    }

    return (
        <div className="flex-1 flex flex-col relative w-full min-h-dvh">
            {/* Massive Shockwave Overlay – outside shake wrapper so fixed positioning isn't trapped */}
            <AnimatePresence>
                {showExplosion && (
                    <div
                        className="fixed pointer-events-none flex items-center justify-center overflow-hidden"
                        style={{ top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, willChange: 'transform, opacity' }}
                    >
                        {/* Keep low-power mode transform/opacity-only to avoid expensive paints. */}
                        {isLowPerformanceMode ? (
                            <>
                                <motion.div
                                    initial={{ opacity: 0.9 }}
                                    animate={{ opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className="absolute inset-0 bg-white"
                                />

                                <motion.div
                                    initial={{ opacity: 0.6, scale: 0.9 }}
                                    animate={{ opacity: 0, scale: 1.4 }}
                                    transition={{ duration: 0.75, ease: 'easeOut', delay: 0.05 }}
                                    className="absolute rounded-full"
                                    style={{
                                        width: '40vh',
                                        height: '40vh',
                                        background: 'radial-gradient(circle, rgba(255,215,0,0.55) 0%, rgba(255,51,102,0.35) 55%, transparent 80%)',
                                        willChange: 'transform, opacity'
                                    }}
                                />

                                {[
                                    { color: '#FFD700', delay: 0, scale: 6, duration: 0.8 },
                                    { color: '#ff3366', delay: 0.08, scale: 4.5, duration: 0.7 }
                                ].map((ring, i) => (
                                    <motion.div
                                        key={`ring-lite-${i}`}
                                        initial={{ scale: 0.2, opacity: 0.85 }}
                                        animate={{ scale: ring.scale, opacity: 0 }}
                                        transition={{ duration: ring.duration, ease: 'easeOut', delay: ring.delay }}
                                        className="absolute rounded-full"
                                        style={{
                                            width: '16vh',
                                            height: '16vh',
                                            border: `14px solid ${ring.color}`,
                                            willChange: 'transform, opacity'
                                        }}
                                    />
                                ))}

                                {SPARK_DATA.slice(0, 4).map((p, i) => (
                                    <motion.div
                                        key={`spark-lite-${i}`}
                                        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                        animate={{
                                            x: Math.cos(p.angle) * 260,
                                            y: Math.sin(p.angle) * 260,
                                            scale: 0.25,
                                            opacity: 0
                                        }}
                                        transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
                                        className="absolute w-3 h-3 rounded-full"
                                        style={{
                                            background: i % 2 === 0 ? '#FFD700' : '#ff3366',
                                            willChange: 'transform, opacity'
                                        }}
                                    />
                                ))}
                            </>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="absolute inset-0 bg-white"
                                />

                                <motion.div
                                    initial={{ opacity: 0.8 }}
                                    animate={{ opacity: 0 }}
                                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                                    className="absolute inset-0"
                                    style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,51,102,0.4) 50%, transparent 70%)' }}
                                />

                                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                                    <motion.div
                                        key={`beam-${i}`}
                                        initial={{ opacity: 0.8, scaleY: 0 }}
                                        animate={{ opacity: 0, scaleY: 1 }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: i * 0.03 }}
                                        className="absolute h-[180vh] w-6"
                                        style={{
                                            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.7), transparent)',
                                            transform: `rotate(${angle}deg)`,
                                            transformOrigin: 'center center',
                                            willChange: 'transform, opacity'
                                        }}
                                    />
                                ))}

                                <motion.div
                                    initial={{ scale: 0, rotate: 0, opacity: 1 }}
                                    animate={{ scale: 12, rotate: 140, opacity: 0 }}
                                    transition={{ duration: 1.3, ease: [0.2, 0, 0, 1] }}
                                    className="absolute"
                                    style={{
                                        width: '92px',
                                        height: '92px',
                                        background: 'conic-gradient(from 0deg, transparent, white 10%, transparent 20%, transparent, white 30%, transparent 40%, transparent, white 50%, transparent 60%, transparent, white 70%, transparent 80%, transparent, white 90%, transparent)',
                                        willChange: 'transform, opacity'
                                    }}
                                />

                                {[
                                    { color: '#FFD700', delay: 0, scale: 11, duration: 1.1 },
                                    { color: '#ff3366', delay: 0.1, scale: 9, duration: 1 },
                                    { color: '#00e5ff', delay: 0.18, scale: 7.5, duration: 0.9 }
                                ].map((ring, i) => (
                                    <motion.div
                                        key={`ring-${i}`}
                                        initial={{ scale: 0.25, opacity: 0.95 }}
                                        animate={{ scale: ring.scale, opacity: 0 }}
                                        transition={{ duration: ring.duration, ease: 'easeOut', delay: ring.delay }}
                                        className="absolute rounded-full"
                                        style={{
                                            width: '20vh',
                                            height: '20vh',
                                            border: `18px solid ${ring.color}`,
                                            willChange: 'transform, opacity'
                                        }}
                                    />
                                ))}

                                <motion.div
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{ scale: 2.6, opacity: 0 }}
                                    transition={{ duration: 0.75, ease: 'easeOut' }}
                                    className="absolute w-28 h-28 rounded-full"
                                    style={{
                                        background: 'radial-gradient(circle, white 0%, rgba(255,215,0,0.8) 30%, rgba(255,51,102,0.6) 60%, transparent 70%)',
                                        willChange: 'transform, opacity'
                                    }}
                                />

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
                                        transition={{ duration: 0.72, ease: 'easeOut', delay: 0.08 }}
                                        className="absolute w-3 h-3 rounded-full"
                                        style={{
                                            background: i % 2 === 0 ? '#FFD700' : '#ff3366',
                                            willChange: 'transform, opacity'
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}
            </AnimatePresence>

            <div ref={shakeRef} className={isResultView ? 'flex-1 flex flex-col relative w-full min-h-dvh overflow-y-auto' : 'flex-1 flex flex-col p-3 sm:p-6 lg:p-8 xl:p-10 relative w-full min-h-dvh overflow-y-auto'}>
            {(status === 'LOBBY' || status === 'COUNTDOWN' || status === 'QUESTION') && (
                <HostHeader
                    code={code}
                    playerCount={players.length}
                    compact={status !== 'LOBBY'}
                    musicEnabled={gameState.musicEnabled}
                    socket={socket}
                    currentBgm={gameState.bgmTrack}
                    onAbandonGame={abandonGame}
                />
            )}

            {/* Round Intro Overlay - Full Screen excluding header if we wanted, but user asked for full screen.
                RoundIntroScreen component has h-screen w-full.
                To make it truly full screen and cover padding, we render it outside the padded container. */}
            <AnimatePresence>
                {status === 'ROUND_INTRO' && gameState.rounds && gameState.rounds[gameState.currentRoundIndex] && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-gray-900"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <RoundIntroScreen
                            roundNumber={gameState.currentRoundIndex + 1}
                            title={gameState.rounds[gameState.currentRoundIndex].title}
                            description={gameState.rounds[gameState.currentRoundIndex].description}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={isResultView ? 'min-h-dvh w-full relative z-10 overflow-y-auto' : 'flex-1 flex flex-col justify-start items-center relative z-10 w-full overflow-y-auto pb-6'}>
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
                            lobbyDuration={gameState.lobbyDuration}
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
                            timer={gameState.timerDuration || 30}
                            code={code}
                        />
                    ) : null}
                </AnimatePresence>
            </div>
            </div>
        </div>
    );
};

export default HostScreen;
