import type { Player, GameState } from '../../types/game';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
    player: Player;
    gameState: GameState;
}

export function PlayerFinalScreen({ player, gameState }: Props) {
    const sortedPlayers = useMemo(() => {
        return [...gameState.players].sort((a, b) => b.score - a.score);
    }, [gameState.players]);

    // Calculate ranks properly handling ties
    const ranks = useMemo(() => {
        return sortedPlayers.map((p, _, array) => {
            // Calculate rank by finding the first index (1-based) with the same score
            // Since the array is sorted by score descending, the first person with this score determines the rank for all ties
            const rank = array.findIndex(prev => prev.score === p.score) + 1;
            return { ...p, rank };
        });
    }, [sortedPlayers]);

    const myRankData = ranks.find(p => p.id === player.id);
    const rank = myRankData?.rank || 999;
    const isWinner = rank === 1;

    const themeColor = isWinner ? 'var(--color-yellow)' : 'var(--color-blue)';

    return (
        <motion.div
            key="final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-start w-full max-w-lg mx-auto overflow-hidden relative py-4 md:py-6"
        >
            {/* Background Atmosphere */}
            <div
                className="fixed inset-0 blur-[150px] opacity-20 pointer-events-none -z-10 transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${themeColor}, transparent 70%)`
                }}
            />

            <div className="relative z-10 w-full flex flex-col items-center gap-6 md:gap-8">
                {/* Ranking Visual - Text Only */}
                <div className="flex flex-col items-center gap-2">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-center"
                    >
                        <h3
                            className="text-9xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.9]"
                            style={{
                                color: 'white',
                                textShadow: `0 0 40px ${themeColor}`
                            }}
                        >
                            <span className="font-black">{rank}<sup className="ml-2 text-4xl">{rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'}</sup></span>
                        </h3>

                    </motion.div>
                </div>

                {/* Scoreboard Section */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full glass-panel p-4 md:p-5 rounded-3xl md:rounded-4xl border-white/5 bg-white/2"
                >                    <div className="flex items-center justify-center">
                       
                        <div className="flex flex-col items-end">
                            <span className="text-2xl md:text-4xl font-black text-white">{player.score}</span>
                        </div>
                    </div>

                    {/* <div className="space-y-3">
                        {ranks.map((p, index) => {
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
                                        <span className={`text-sm font-black italic w-6 ${p.rank === 1 ? 'text-color-yellow' : 'opacity-40'}`}>
                                            {p.rank}
                                        </span>
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                            <Avatar seed={p.avatar} style={p.avatarStyle} imageUrl={p.avatarImage} className="w-full h-full" />
                                        </div>
                                        <span className={`text-base font-black uppercase italic ${isMe ? 'text-white' : 'text-white/90'}`}>
                                            {p.name}
                                        </span>
                                    </div>
                                    <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
                                        <span
                                            className="text-xl font-black font-mono tracking-tighter"
                                            style={{
                                                color: pColor,
                                                textShadow: `0 0 15px ${pColor}40`
                                            }}
                                        >
                                            {p.score} <span className="text-[10px] opacity-40 ml-0.5">PTS</span>
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div> */}
                </motion.div>


            </div>
        </motion.div>
    );
}
