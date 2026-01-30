import type { Player, GameState } from '../../types/game';
import { motion } from 'framer-motion';
import { RotateCcw, Trophy } from 'lucide-react';
import { getAvatarColor } from '../../constants/avatars';
import { Avatar } from '../GameAvatars';
import { useMemo } from 'react';

interface Props {
    player: Player;
    gameState: GameState;
    setGameState: (state: GameState | null) => void;
}

export function PlayerFinalScreen({ player, gameState, setGameState }: Props) {
    const sortedPlayers = useMemo(() => {
        return [...gameState.players].sort((a, b) => b.score - a.score);
    }, [gameState.players]);

    const rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
    const isWinner = rank === 1;

    const themeColor = isWinner ? 'var(--color-yellow)' : 'var(--color-blue)';

    return (
        <motion.div
            key="final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-start w-full max-w-lg mx-auto overflow-hidden min-h-[80vh] relative py-10 pt-10"
        >
            {/* Background Atmosphere */}
            <div
                className="absolute inset-x-0 top-1/4 h-80 blur-[150px] opacity-20 transition-all duration-1000"
                style={{ backgroundColor: themeColor }}
            />

            <div className="relative z-10 w-full flex flex-col items-center gap-12">
                {/* Ranking Visual - Text Only */}
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-center"
                    >
                        <h3
                            className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none"
                            style={{
                                color: 'white',
                                textShadow: `0 0 40px ${themeColor}`
                            }}
                        >
                            {isWinner ? 'LEGEND STATUS' : `RANK #${rank}`}
                        </h3>
                        <div
                            className="mt-3 inline-block px-6 py-1.5 rounded-full text-sm font-black tracking-[0.4em] uppercase opacity-70 border border-white/10"
                            style={{ backgroundColor: `${themeColor}20`, color: 'white' }}
                        >
                            {isWinner ? 'CHAMPION' : 'PARTICIPANT'}
                        </div>
                    </motion.div>
                </div>

                {/* Scoreboard Section */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full glass-panel p-6 rounded-4xl border-white/5 bg-white/2"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Trophy size={20} className="text-color-yellow" />
                            <span className="text-xs uppercase tracking-[0.4em] text-white/40 font-black italic">Final Standings</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black italic">Your Score</span>
                            <span className="text-xl font-black font-mono text-white">{player.score}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {sortedPlayers.map((p, index) => {
                            const pColor = getAvatarColor(p.avatar);
                            const isMe = p.id === player.id;

                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 + (index * 0.1) }}
                                    className={`flex items-center justify-between p-3 rounded-3xl transition-all ${isMe ? 'bg-white/15 ring-2 ring-white/20 scale-105' : 'bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`text-sm font-black italic w-6 ${index === 0 ? 'text-color-yellow' : 'opacity-40'}`}>
                                            {index + 1}
                                        </span>
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                            <Avatar seed={p.avatar} className="w-full h-full" />
                                        </div>
                                        <span className={`text-base font-black uppercase italic ${isMe ? 'text-white' : 'text-white/60'}`}>
                                            {p.name} {isMe && '(YOU)'}
                                        </span>
                                    </div>
                                    <span
                                        className="text-xl font-black font-mono tracking-tighter"
                                        style={{ color: pColor }}
                                    >
                                        {p.score}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Return Action */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGameState(null)}
                    className="flex items-center gap-3 px-12 py-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black italic tracking-widest uppercase text-xs group mt-4"
                >
                    <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                        start a new game
                </motion.button>
            </div>
        </motion.div>
    );
}
