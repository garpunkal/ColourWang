import type { Socket } from 'socket.io-client';
import type { Player } from '../../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect, useRef } from 'react';

import { Avatar } from '../GameAvatars';
import { getAvatarColor } from '../../constants/avatars';
import { useSparkle } from '../../hooks/useSparkle';

// Optimized celebratory elements
const GOLDEN_PARTICLES = [...Array(10)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 4 + Math.random() * 2,
    size: 4 + Math.random() * 6
}));

interface Props {
    socket: Socket;
    players: Player[];
    rounds: number;
    timer: number;
    code: string;
}

export function HostFinalScreen({ socket, players, rounds, timer, code }: Props) {
    const [showSupernova, setShowSupernova] = useState(false);

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => b.score - a.score).slice(0, 5);
    }, [players]);

    const winner = sortedPlayers[0];
    const winnerColor = winner ? getAvatarColor(winner.avatar) : '#FFD700';

    useEffect(() => {
        // Trigger supernova after a small delay for the winner reveal
        const timer = setTimeout(() => setShowSupernova(true), 800);
        return () => clearTimeout(timer);
    }, []);

    // Container variants for clean staggered entrance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 20,
                mass: 0.8
            }
        }
    };

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { spawnConfetti } = useSparkle(canvasRef);

    useEffect(() => {
        if (showSupernova) {
            spawnConfetti(window.innerWidth / 2, window.innerHeight * 0.3);
            // Keep spawning for a bit
            const interval = setInterval(() => {
                spawnConfetti(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.5);
            }, 300);
            return () => clearInterval(interval);
        }
    }, [showSupernova, spawnConfetti]);

    return (
        <motion.div
            key="final"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-5xl mx-auto py-8 px-4 md:py-12 md:px-6 relative"
        >
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

            {/* High-Performance Supernova Effect */}
            <AnimatePresence>
                {showSupernova && (
                    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0, opacity: 0.8 }}
                            animate={{ scale: 60, opacity: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute w-10 h-10 rounded-full"
                            style={{ background: `radial-gradient(circle, #fff 0%, ${winnerColor} 60%, transparent 100%)` }}
                        />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.4, 0] }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-white"
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Background Decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                {GOLDEN_PARTICLES.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ y: '110vh', opacity: 0 }}
                        animate={{ y: '-10vh', opacity: [0, 0.5, 0.5, 0] }}
                        transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
                        className="absolute rounded-full bg-linear-to-b from-yellow-300 to-yellow-600"
                        style={{
                            left: `${p.x}%`,
                            width: p.size,
                            height: p.size,
                            boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)',
                        }}
                    />
                ))}
            </div>

            {/* Title Section */}
            <div className="text-center mb-12 relative px-4">
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-center"
                >
                    <h1 className="text-display-gradient text-4xl md:text-8xl font-black italic uppercase tracking-tighter mb-2 pr-5">
                        Results
                    </h1>
                    <p className="text-color-blue text-lg md:text-2xl font-black uppercase tracking-[0.3em] opacity-80">
                        Final Standings
                    </p>
                </motion.div>
            </div>

            {/* Players List */}
            <div className="flex flex-col gap-3 md:gap-4 mb-16">
                {sortedPlayers.map((player, i) => {
                    const avatarColor = getAvatarColor(player.avatar);
                    const isWinner = i === 0;

                    return (
                        <motion.div
                            key={player.id}
                            variants={itemVariants}
                            className={`relative overflow-hidden group glass rounded-3xl md:rounded-4xl p-3 md:p-6 flex items-center gap-3 md:gap-8 border-2 transition-colors ${isWinner
                                ? 'bg-linear-to-r from-white/10 to-transparent border-yellow-500/50'
                                : 'border-white/5 hover:border-white/10'
                                }`}
                            style={{
                                boxShadow: isWinner ? `0 20px 60px -15px ${avatarColor}30` : 'none'
                            }}
                        >
                            {/* Rank Indicator */}
                            <div className={`text-2xl md:text-5xl font-black font-mono italic w-10 md:w-20 text-center ${isWinner ? 'text-yellow-400' : 'text-white/20'
                                }`}>
                                #{i + 1}
                            </div>

                            {/* Avatar */}
                            <div className={`relative w-12 h-12 md:w-24 md:h-24 shrink-0 rounded-xl md:rounded-2xl overflow-hidden border-2 md:border-4 ${isWinner ? 'border-yellow-500' : 'border-white/10'
                                }`}>
                                <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full" />
                            </div>

                            {/* Name & Title */}
                            <div className="flex-1 min-w-0 py-2">
                                <h2 className={`text-xl md:text-5xl font-black uppercase italic tracking-tight leading-none wrap-break-word ${isWinner ? 'text-white' : 'text-white/90'
                                    }`}>
                                    {player.name}
                                </h2>
                                {isWinner && (
                                    <p className="text-yellow-500 font-black text-[8px] md:text-xs uppercase tracking-[0.15em] mt-1 md:mt-2">
                                        The Undisputed Legend
                                    </p>
                                )}
                            </div>

                            {/* Score */}
                            <div className="text-right shrink-0 px-2 md:px-8">
                                <span className={`text-2xl md:text-6xl font-mono font-black ${isWinner ? 'text-yellow-400 glow-text' : 'text-white/60'
                                    }`}>
                                    {player.score}
                                    <span className="text-[10px] md:text-xl ml-1 md:ml-2 opacity-40 font-sans tracking-widest uppercase">pts</span>
                                </span>
                            </div>

                            {/* Decorative Shine for Winner */}
                            {isWinner && (
                                <motion.div
                                    animate={{ left: ['-100%', '200%'] }}
                                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] pointer-events-none"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer / Restart */}
            <motion.div
                variants={itemVariants}
                className="flex flex-col items-center gap-6"
            >
                <button
                    onClick={() => socket.emit('restart-game', { code, rounds, timer })}
                    className="btn btn-primary text-xl md:text-4xl py-6 md:py-8 px-12 md:px-20 rounded-full group shadow-2xl scale-90 md:scale-100"
                >
                    <span className="relative z-10">Start New Battle</span>
                    <motion.div
                        className="absolute inset-0 bg-linear-to-r from-orange-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </button>
                <p className="text-white/10 font-black uppercase tracking-widest text-xs">
                    Room Code: {code}
                </p>
            </motion.div>
        </motion.div>
    );
}
