import { useState, useEffect } from 'react';
import type { Player } from '../../types/game';
import { motion } from 'framer-motion';
import { Avatar } from '../GameAvatars';
import { getAvatarColor, getAvatarTextColor } from '../../constants/avatars';
import { X } from 'lucide-react';

interface Props {
    players: Player[];
    onStartGame: () => void;
    onRemovePlayer: (playerId: string) => void;
}

export function HostLobbyScreen({ players, onStartGame, onRemovePlayer }: Props) {
    const [autoStartTimer, setAutoStartTimer] = useState<number | null>(null);

    // Initialize or reset timer based on player count
    useEffect(() => {
        const timerId = setTimeout(() => {
            if (players.length >= 2) {
                // Only start if not already running
                if (autoStartTimer === null) {
                    setAutoStartTimer(30);
                }
            } else {
                // Reset if drops below 2
                if (autoStartTimer !== null) {
                    setAutoStartTimer(null);
                }
            }
        }, 0);
        return () => clearTimeout(timerId);
    }, [players.length, autoStartTimer]);

    // Handle ticking
    useEffect(() => {
        if (autoStartTimer === null) return;

        if (autoStartTimer === 0) {
            onStartGame();
            return;
        }

        const interval = setInterval(() => {
            setAutoStartTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [autoStartTimer, onStartGame]);

    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            className="w-full max-w-[95vw] flex flex-col items-center"
        >
            <h1 className="mt-12 md:mt-16 text-hero text-display mb-8 text-center drop-shadow-2xl">
                <span className="block text-xl md:text-3xl mb-1 tracking-[0.4em] md:tracking-[0.6em] text-color-blue opacity-80 uppercase">Player</span>
                <span className="text-display-gradient pr-10">Lobby</span>
            </h1>

            <div className="flex flex-wrap justify-center gap-4 w-full max-w-7xl mb-8 px-8">
                {players.map((player, i) => {
                    const avatarColor = getAvatarColor(player.avatar);
                    const textColor = getAvatarTextColor(player.avatar);
                    return (
                        <motion.div
                            key={player.id}
                            initial={{ scale: 0, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: "spring", delay: i * 0.05, stiffness: 200, damping: 20 }}
                            className="glass group relative p-3 rounded-2xl flex flex-col items-center gap-2 border-white/10 shadow-lg transition-all duration-300 min-w-52"
                            style={{
                                border: `2px solid ${avatarColor}40`,
                                background: `linear-gradient(180deg, ${avatarColor}15 0%, transparent 100%)`
                            }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemovePlayer(player.id);
                                }}
                                className="absolute -top-2 -right-2 bg-error text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 hover:bg-white! hover:text-error! z-20 cursor-pointer border-2 border-white/20"
                                title="Kick Player"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>

                            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 overflow-hidden shrink-0">
                                <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full" />
                            </div>
                            <div className="flex flex-col items-center overflow-hidden w-full">
                                <span
                                    className="text-xl md:text-2xl font-black truncate tracking-tight uppercase italic w-full text-center"
                                    style={{
                                        color: 'white',
                                        textShadow: textColor === 'white' ? `0 0 15px ${avatarColor}40` : 'none'
                                    }}
                                >
                                    {player.name}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Scanning Placeholder Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-3 rounded-2xl flex flex-col items-center gap-2 border-white/10 shadow-lg min-w-40 border-dashed border-2 bg-white/5"
                >
                    <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center relative bg-black/20 rounded-2xl overflow-hidden">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-2 border-[3px] border-white/10 rounded-xl"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 border-[3px] border-white/10 rounded-lg"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 bg-white/50 rounded-full"
                        />
                    </div>
                    <div className="flex flex-col items-center w-full py-1">
                        <span className="text-sm font-bold uppercase tracking-widest text-white/30 animate-pulse">
                            waiting...
                        </span>
                    </div>
                </motion.div>
            </div>

            {players.length > 0 && (
                <div className="flex flex-col items-center justify-center w-full">
                    {/* Countdown Timer Display */}
                    {autoStartTimer !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 flex flex-col items-center"
                        >
                            <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 mb-1">Auto-start in</span>
                            <span className="text-6xl font-black font-mono tracking-tighter text-color-blue tabular-nums drop-shadow-[0_0_20px_rgba(0,229,255,0.6)]">
                                {autoStartTimer}
                            </span>
                        </motion.div>
                    )}

                    <motion.button
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={onStartGame}
                        className="btn btn-primary text-2xl md:text-4xl py-6 md:py-8 px-12 md:px-24 rounded-[3rem] shadow-[0_0_80px_rgba(0,229,255,0.4)] uppercase font-black italic tracking-widest border-t-4 md:border-t-6 border-white/20 animate-pulse-slow mb-8"
                    >
                        {autoStartTimer !== null ? 'Start Now' : 'Start Game'}
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
}
