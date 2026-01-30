import type { Socket } from 'socket.io-client';
import type { Player } from '../../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

import { Avatar } from '../GameAvatars';
import { getAvatarColor } from '../../constants/avatars';

// Generate firework particles
const FIREWORK_BURSTS = [...Array(5)].map((_, burstIndex) => ({
    x: (burstIndex - 2) * 25, // Spread across screen
    delay: burstIndex * 0.3,
    particles: [...Array(12)].map((_, i) => ({
        angle: (i / 12) * Math.PI * 2,
        velocity: 150 + Math.random() * 100,
        color: ['#FFD700', '#ff3366', '#00e5ff', '#ffffff', '#ff9900'][Math.floor(Math.random() * 5)]
    }))
}));

// Floating golden particles
const GOLDEN_PARTICLES = [...Array(30)].map(() => ({
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    size: 4 + Math.random() * 8
}));

interface Props {
    socket: Socket;
    players: Player[];
    rounds: number;
    timer: number;
    code: string;
}

export function HostFinalScreen({ socket, players, rounds, timer, code }: Props) {
    const [showCelebration, setShowCelebration] = useState(true);
    const [revealedPlayers, setRevealedPlayers] = useState(0);

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => b.score - a.score).slice(0, 5);
    }, [players]);

    const winner = sortedPlayers[0];
    const winnerColor = winner ? getAvatarColor(winner.avatar) : '#FFD700';

    // Staggered reveal effect
    useEffect(() => {
        const revealInterval = setInterval(() => {
            setRevealedPlayers(prev => {
                if (prev >= sortedPlayers.length) {
                    clearInterval(revealInterval);
                    return prev;
                }
                return prev + 1;
            });
        }, 400);

        // Hide celebration after initial burst
        const celebrationTimer = setTimeout(() => setShowCelebration(false), 4000);

        return () => {
            clearInterval(revealInterval);
            clearTimeout(celebrationTimer);
        };
    }, [sortedPlayers.length]);

    return (
        <motion.div
            key="final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-7xl relative"
        >
            {/* Epic Celebration Overlay */}
            <AnimatePresence>
                {showCelebration && (
                    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 100 }}>
                        {/* Initial flash */}
                        <motion.div
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0"
                            style={{ background: `radial-gradient(circle, ${winnerColor}60 0%, transparent 70%)` }}
                        />

                        {/* Spotlight beams on winner */}
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={`spotlight-${i}`}
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: [0, 0.6, 0.3], scaleY: 1 }}
                                transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                                className="absolute top-0 left-1/2 h-full w-32"
                                style={{
                                    background: `linear-gradient(to bottom, ${winnerColor}40, transparent 80%)`,
                                    transform: `translateX(-50%) rotate(${(i - 1) * 15}deg)`,
                                    transformOrigin: 'top center',
                                    filter: 'blur(20px)'
                                }}
                            />
                        ))}

                        {/* Firework bursts */}
                        {FIREWORK_BURSTS.map((burst, burstIndex) => (
                            <div
                                key={`burst-${burstIndex}`}
                                className="absolute top-1/4 left-1/2"
                                style={{ transform: `translateX(${burst.x}%)` }}
                            >
                                {burst.particles.map((p, i) => (
                                    <motion.div
                                        key={`particle-${burstIndex}-${i}`}
                                        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                        animate={{
                                            x: Math.cos(p.angle) * p.velocity,
                                            y: Math.sin(p.angle) * p.velocity,
                                            scale: 0,
                                            opacity: 0
                                        }}
                                        transition={{ duration: 1, delay: burst.delay, ease: "easeOut" }}
                                        className="absolute w-3 h-3 rounded-full"
                                        style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* Floating golden particles */}
                        {GOLDEN_PARTICLES.map((p, i) => (
                            <motion.div
                                key={`gold-${i}`}
                                initial={{ y: '100vh', opacity: 0 }}
                                animate={{ y: '-20vh', opacity: [0, 1, 1, 0] }}
                                transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
                                className="absolute rounded-full"
                                style={{
                                    left: `${p.x}%`,
                                    width: p.size,
                                    height: p.size,
                                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                    boxShadow: '0 0 10px #FFD700'
                                }}
                            />
                        ))}

                        {/* Pulsing glow around edges */}
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0"
                            style={{ boxShadow: `inset 0 0 150px 50px ${winnerColor}30` }}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Title with sparkles */}
            <div className="text-center mb-10 md:mb-20 relative">
                <h1 className="mt-24 text-hero text-display mb-8 md:mb-16 text-center drop-shadow-2xl">
                    <motion.span
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 0.8, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="block text-xl md:text-4xl mb-2 md:mb-4 tracking-[0.4em] md:tracking-[0.6em] text-color-blue"
                    >
                        the
                    </motion.span>
                    <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.7, stiffness: 150 }}
                        className="text-display-gradient pr-10 relative inline-block"
                    >
                        {/* Sparkles around Results text */}
                        <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                            className="absolute -top-6 -left-4 md:-top-10 md:-left-8"
                        >
                            <Sparkles className="w-6 h-6 md:w-10 md:h-10 text-yellow-400" style={{ filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.8))' }} />
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                            className="absolute -top-4 -right-2 md:-top-8 md:-right-4"
                        >
                            <Sparkles className="w-5 h-5 md:w-8 md:h-8 text-yellow-300" style={{ filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.8))' }} />
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, 15, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1.6 }}
                            className="absolute -bottom-2 left-1/4 md:-bottom-4"
                        >
                            <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-yellow-200" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.6))' }} />
                        </motion.span>
                        Results
                    </motion.span>
                </h1>
            </div>

            <div className="flex flex-col gap-6">
                {sortedPlayers.map((player, i) => {
                    const avatarColor = getAvatarColor(player.avatar);
                    const isWinner = i === 0;
                    const isRevealed = i < revealedPlayers;

                    return (
                        <motion.div
                            key={player.id}
                            initial={{ x: -100, opacity: 0, scale: 0.8 }}
                            animate={isRevealed ? {
                                x: 0,
                                opacity: 1,
                                scale: isWinner ? 1.05 : 1
                            } : {}}
                            transition={{
                                type: "spring",
                                stiffness: 100,
                                damping: 15
                            }}
                            className={`glass p-4 md:p-8 rounded-3xl md:rounded-[3rem] flex items-center justify-between border-white/10 flex-col md:flex-row gap-4 md:gap-0 relative overflow-hidden ${isWinner ? 'z-10' : ''}`}
                            style={{
                                border: `2px solid ${avatarColor}${isWinner ? '60' : '30'}`,
                                background: isWinner ? `linear-gradient(to right, ${avatarColor}30, transparent)` : undefined,
                                boxShadow: isWinner ? `0 0 60px -10px ${avatarColor}50` : undefined
                            }}
                        >


                            {/* Winner shine effect */}
                            {isWinner && isRevealed && (
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '200%' }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                />
                            )}

                            <div className="flex items-center gap-4 md:gap-10 pl-0 md:pl-8 w-full md:w-auto relative z-10">
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={isRevealed ? { scale: 1 } : {}}
                                    transition={{ type: "spring", delay: 0.2 }}
                                    className="text-3xl md:text-6xl font-black font-mono w-12 md:w-24"
                                    style={{ color: isWinner ? avatarColor : 'rgba(160,160,192,1)' }}
                                >
                                    #{i + 1}
                                </motion.span>
                                <div
                                    className="w-16 h-16 md:w-28 md:h-28 rounded-2xl md:rounded-4xl flex items-center justify-center border-2 md:border-4 border-white/10 shadow-lg overflow-hidden shrink-0"
                                    style={{
                                        borderColor: `${avatarColor}40`,
                                        backgroundColor: isWinner ? `${avatarColor}40` : 'rgba(255,255,255,0.05)',
                                        boxShadow: isWinner ? `0 0 30px ${avatarColor}40` : undefined
                                    }}
                                >
                                    <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full" />
                                </div>
                                <span className={`text-2xl md:text-6xl font-black uppercase italic tracking-tight truncate pr-10 ${isWinner ? 'text-white' : 'text-white/80'}`}>
                                    {player.name}
                                </span>
                            </div>
                            <div className="pr-0 md:pr-12 relative z-10">
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={isRevealed ? { scale: 1 } : {}}
                                    transition={{ type: "spring", delay: 0.3 }}
                                    className={`text-4xl md:text-7xl font-mono font-black block ${isWinner ? 'glow-text' : ''}`}
                                    style={{ color: isWinner ? avatarColor : 'rgba(255,255,255,0.6)' }}
                                >
                                    {player.score}
                                </motion.span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="text-center mt-10 md:mt-20">
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sortedPlayers.length * 0.4 + 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => socket.emit('restart-game', { code, rounds, timer })}
                    className="btn btn-secondary justify-self-center text-2xl md:text-4xl py-6 md:py-8 px-12 md:px-20 rounded-[3rem] opacity-80 hover:opacity-100"
                >
                    Restart Game
                </motion.button>
            </div>
        </motion.div>
    );
}
