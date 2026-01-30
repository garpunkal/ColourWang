import { motion } from 'framer-motion';
import type { GameState } from '../../types/game';
import { getAvatarColor } from '../../constants/avatars';
import { Avatar } from '../GameAvatars';
import { useState, useEffect, useRef } from 'react';
import { audioManager } from '../../utils/audioManager';

interface Props {
    gameState: GameState;
}

export function PlayerLobbyScreen({ gameState }: Props) {
    const [autoStartTimer, setAutoStartTimer] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(5);
    const players = gameState.players;
    const isCountdownState = gameState.status === 'COUNTDOWN';
    const countdownInitRef = useRef(false);

    useEffect(() => {
        if (isCountdownState) {
            if (!countdownInitRef.current) {
                setCountdown(5);
                setAutoStartTimer(null);
                countdownInitRef.current = true;
            }
        } else {
            countdownInitRef.current = false;
        }
    }, [isCountdownState]);

    // Tick logic for Auto-Start Timer
    useEffect(() => {
        if (isCountdownState || autoStartTimer === null) return;

        const interval = setInterval(() => {
            setAutoStartTimer(prev => {
                if (prev === null || prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isCountdownState, autoStartTimer !== null]);

    // Start/Stop Auto-Start Timer based on player count
    useEffect(() => {
        if (isCountdownState) return;

        if (players.length >= 2) {
            if (autoStartTimer === null) {
                // We are intentionally causing a side-effect here to start the timer
                // We'll wrap in setTimeout to avoid 'synchronous' warning if problematic
                const timeout = setTimeout(() => setAutoStartTimer(30), 0);
                return () => clearTimeout(timeout);
            }
        } else {
            if (autoStartTimer !== null) {
                const timeout = setTimeout(() => setAutoStartTimer(null), 0);
                return () => clearTimeout(timeout);
            }
        }
    }, [players.length, isCountdownState, autoStartTimer === null]);

    // Internal 5s countdown logic
    useEffect(() => {
        if (!isCountdownState) return;

        // Play initial tick
        audioManager.playTick();

        const interval = setInterval(() => {
            setCountdown(prev => {
                const next = prev > 0 ? prev - 1 : 0;
                if (next > 0) audioManager.playTick();
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isCountdownState]);

    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
            className={`text-center glass rounded-[4rem] p-8 md:p-8 border-white/10 shadow-[0_80px_100px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all duration-500 ${isCountdownState ? 'ring-4 ring-color-blue/40 shadow-[0_0_100px_rgba(0,229,255,0.2)]' : ''}`}
        >
            <div className={`absolute inset-0 bg-linear-to-br opacity-50 transition-colors duration-1000 ${isCountdownState ? 'from-color-blue/30 via-color-purple/10 to-color-pink/30' : 'from-color-blue/15 via-transparent to-color-purple/15'}`} />

            <div className="mb-6 relative inline-block z-10 w-full">
                <motion.div
                    animate={isCountdownState ? { scale: [1, 1.3, 1], rotate: [0, 5, -5, 0] } : { scale: [1, 1.6, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: isCountdownState ? 2 : 5, repeat: Infinity }}
                    className={`absolute inset-0 blur-[60px] rounded-full transition-colors ${isCountdownState ? 'bg-color-pink/30' : 'bg-color-blue/20'}`}
                />

                {isCountdownState ? (
                    <motion.div
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-20 flex flex-col items-center"
                    >
                        <span className="text-8xl md:text-9xl font-black italic tracking-tighter text-display-gradient drop-shadow-2xl pr-5">
                            {countdown}
                        </span>
                        <span className="text-xl font-black uppercase tracking-[0.5em] text-white/60 -mt-2 animate-pulse">
                            Get Ready!
                        </span>
                    </motion.div>
                ) : (
                    <div className="relative z-20">
                        <h1 className="text-4xl md:text-5xl font-black mb-1 uppercase tracking-tighter italic">STAND BY</h1>
                        <p className="text-text-muted font-bold text-sm md:text-base opacity-60 uppercase tracking-widest italic">You're in the game!</p>
                    </div>
                )}
            </div>

            {/* Players List - Scale down during countdown */}
            <motion.div
                animate={{ opacity: isCountdownState ? 0.4 : 1, scale: isCountdownState ? 0.95 : 1 }}
                className="relative z-10"
            >
                <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                    {gameState.players.map((player, index) => {
                        const playerColor = getAvatarColor(player.avatar);
                        return (
                            <motion.div
                                key={player.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                                className="flex items-center gap-3 px-4 py-2 rounded-2xl glass-panel w-full border"
                                style={{
                                    borderColor: `${playerColor}30`,
                                    backgroundColor: `${playerColor}05`
                                }}
                            >
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                    <Avatar
                                        seed={player.avatar}
                                        style={player.avatarStyle}
                                        className="w-full h-full"
                                    />
                                </div>
                                <span
                                    className="font-black text-sm md:text-base uppercase tracking-wider flex-1 text-left truncate"
                                    style={{ color: 'white' }}
                                >
                                    {player.name}
                                </span>
                                <span
                                    className="font-black text-sm md:text-base font-mono tabular-nums tracking-tighter"
                                    style={{ color: playerColor }}
                                >
                                    {player.score} PTS
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Auto-start timer footer */}
            {!isCountdownState && autoStartTimer !== null && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-8 pt-6 border-t border-white/5 relative z-10 flex flex-col items-center"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Auto-starting in</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black font-mono tracking-tighter text-color-blue tabular-nums">
                            {autoStartTimer}
                        </span>
                        <span className="text-xs font-black text-white/20">SEC</span>
                    </div>
                </motion.div>
            )}

            {/* Create Lobby Option */}
            <div className="mt-8 relative z-50 pt-4 border-t border-white/5 w-full">
                <button
                    onClick={() => {
                        if (confirm("Create a new lobby? This will leave the current game completely.")) {
                            localStorage.removeItem('cw_playerId');
                            localStorage.removeItem('cw_gameCode');
                            window.location.href = '/';
                        }
                    }}
                    className="text-[10px] uppercase font-bold tracking-widest text-white/30 hover:text-white transition-colors cursor-pointer group flex items-center justify-center gap-2 w-full"
                >
                    <span className="border-b border-white/20 group-hover:border-white pb-0.5 transition-all">Create New Lobby</span>
                </button>
            </div>

        </motion.div>
    );
}
