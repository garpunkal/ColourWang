import type { Socket } from 'socket.io-client';
import type { Player } from '../../types/game';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

import { Avatar } from '../GameAvatars';
import { getAvatarColor } from '../../constants/avatars';

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
    const [showImpactFlash, setShowImpactFlash] = useState(true);
    const [revealedCount, setRevealedCount] = useState(0);

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => b.score - a.score).slice(0, 5);
    }, [players]);

    // Dense ranking — ties share the same rank, next rank increments by 1 (not by count)
    const denseRanks = useMemo(() => {
        let rank = 1;
        return sortedPlayers.map((player, i) => {
            if (i === 0) return rank;
            if (sortedPlayers[i - 1].score !== player.score) rank++;
            return rank;
        });
    }, [sortedPlayers]);

    const winner = sortedPlayers[0];
    const winnerColor = winner ? getAvatarColor(winner.avatar) : '#FFD700';

    useEffect(() => {
        const flashTimer = setTimeout(() => setShowImpactFlash(false), 650);
        // Reveal players one at a time, last place first, winner last.
        const timers: ReturnType<typeof setTimeout>[] = [];
        const n = sortedPlayers.length;
        let cumulative = 1800; // starts after countdown finishes

        for (let step = 1; step <= n; step++) {
            const isWinner = step === n;
            cumulative += isWinner ? 2200 : 1400;
            const t = cumulative;
            timers.push(setTimeout(() => setRevealedCount(step), t));          
        }

        return () => {
            clearTimeout(flashTimer);
            timers.forEach(clearTimeout);
        };
    }, [sortedPlayers.length]);

    const itemVariants: Variants = {
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

    return (
        <>
            <motion.div
                key="final"
                initial={{ opacity: 0, scale: 0.94, filter: 'blur(16px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-5xl mx-auto py-8 px-4 md:py-12 md:px-6 relative"
            >
                <AnimatePresence>
                    {showImpactFlash && (
                        <motion.div
                            initial={{ opacity: 0.95, scale: 0.9 }}
                            animate={{ opacity: 0, scale: 1.25 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="fixed inset-0 pointer-events-none z-70"
                            style={{
                                background: `radial-gradient(circle at 50% 45%, ${winnerColor}aa 0%, rgba(255,255,255,0.45) 25%, transparent 68%)`
                            }}
                        />
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
                        initial={{ opacity: 0, y: 80, scale: 0.7, rotateX: -25 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center"
                    >
                        <motion.h1
                            initial={{ letterSpacing: '-0.25em', opacity: 0.2 }}
                            animate={{ letterSpacing: '-0.03em', opacity: 1 }}
                            transition={{ duration: 0.85, delay: 0.1 }}
                            className="text-display-gradient text-4xl md:text-8xl font-black italic uppercase tracking-tighter mb-2 pr-5"
                        >
                            Leaderboard
                        </motion.h1>
                    </motion.div>
                </div>

                {/* Players List */}
                <div className="flex flex-col gap-3 md:gap-4 mb-16">
                    {sortedPlayers.map((player, i) => {
                        const avatarColor = getAvatarColor(player.avatar);
                        const rank = denseRanks[i];
                        const isWinner = rank === 1;
                        // Reveal from last place (i = n-1) up to first (i = 0)
                        const isRevealed = revealedCount >= sortedPlayers.length - i;

                        return (
                            <AnimatePresence key={player.id} mode="wait">
                                {isRevealed ? (
                                    <motion.div
                                        key="revealed"
                                        initial={{ opacity: 0, y: 60, scale: 0.88, rotateZ: i % 2 === 0 ? -2 : 2 }}
                                        animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: isWinner ? 200 : 150,
                                            damping: isWinner ? 17 : 21
                                        }}
                                        className={`relative overflow-hidden group glass rounded-3xl md:rounded-4xl flex items-center gap-3 md:gap-8 border-2 transition-colors ${isWinner
                                            ? 'border-yellow-500/50  p-3 md:p-6'
                                            : 'border-white/5 hover:border-white/10  p-1 md:p-3'
                                            }`}
                                        style={{
                                            boxShadow: isWinner
                                                ? `0 20px 60px -15px ${avatarColor}55, 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 1px 0 rgba(255,255,255,0.1)`
                                                : undefined
                                        }}
                                    >
                                        {/* Rank Indicator */}
                                        <div className={`text-2xl md:text-5xl font-black font-mono italic w-10 md:w-20 text-center ${isWinner ? 'text-yellow-400' : 'text-white/20'
                                            }`}>
                                            #{rank}
                                        </div>

                                        {/* Avatar */}
                                        <div className={`relative shrink-0 rounded-xl md:rounded-2xl overflow-hidden ring-2 md:ring-4 ${isWinner ? 'ring-yellow-500 w-12 h-12 md:w-24 md:h-24' : ' w-6 h-6 md:w-12 md:h-12 ring-white/10'
                                            }`}>
                                            <Avatar seed={player.avatar} style={player.avatarStyle} imageUrl={player.avatarImage} className="w-full h-full" />
                                        </div>

                                        {/* Name & Title */}
                                        <div className="flex-1 min-w-0 py-2">
                                            <h2 className={`font-black uppercase italic tracking-tight leading-none wrap-break-word ${isWinner ? 'text-white text-xl md:text-5xl ' : 'text-white/90 text-xl md:text-3xl '
                                                }`}>
                                                {player.name}
                                            </h2>
                                            {isWinner && (
                                                <p className="text-yellow-500 font-black text-[8px] md:text-xs uppercase tracking-[0.15em] mt-1 md:mt-2">
                                                    {denseRanks.filter(r => r === 1).length > 1 ? 'Joint Wangers' : 'The Wang King'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Score */}
                                        <div className="text-right shrink-0 px-2 md:px-8">
                                            <span className={`font-mono font-black ${isWinner ? 'text-yellow-400 glow-text text-2xl md:text-6xl ' : 'text-white text-xl md:text-3xl '
                                                }`}
                                                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                            >
                                                {player.score}
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
                                ) : (
                                    <motion.div
                                        key="placeholder"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="relative glass rounded-3xl md:rounded-4xl p-1 md:p-3 flex items-center gap-3 md:gap-8 border-2 border-white/5"
                                    >
                                        <div className="text-2xl md:text-5xl font-black font-mono italic w-10 md:w-20 text-center text-white/15">
                                            #{denseRanks[i]}
                                        </div>
                                        <div className=" w-6 h-6 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl bg-white/5 ring-2 md:ring-4 ring-white/5 flex items-center justify-center">
                                            <motion.span
                                                animate={{ opacity: [0.2, 0.6, 0.2] }}
                                                transition={{ duration: 1.4, repeat: Infinity }}
                                                className="text-2xl md:text-4xl font-black text-white/20"
                                            >
                                                ?
                                            </motion.span>
                                        </div>
                                        <div className="flex-1 h-6 md:h-10 rounded-full bg-white/5" />
                                        <div className="w-16 md:w-32 h-6 md:h-10 rounded-full bg-white/5 shrink-0" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                        <span className="relative z-10">Play again</span>
                        <motion.div
                            className="absolute inset-0 bg-linear-to-r from-orange-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                    </button>                
                </motion.div>
            </motion.div>           
        </>
    );
}
