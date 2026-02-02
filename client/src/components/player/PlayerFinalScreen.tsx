import type { Player, GameState } from '../../types/game';
import type { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { LogOut, Trophy } from 'lucide-react';
import { getAvatarColor } from '../../constants/avatars';
import { Avatar } from '../GameAvatars';
import { useMemo } from 'react';

interface Props {
    player: Player;
    gameState: GameState;
    setGameState: (state: GameState | null) => void;
    socket: Socket;
}

export function PlayerFinalScreen({ player, gameState, setGameState, socket }: Props) {
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
            className="flex flex-col items-center justify-start w-full max-w-lg mx-auto overflow-hidden min-h-[80vh] relative py-10 pt-10"
        >
            {/* Background Atmosphere */}
            <div
                className="fixed inset-0 blur-[150px] opacity-20 pointer-events-none -z-10 transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${themeColor}, transparent 70%)`
                }}
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
                            RANK #{rank}
                        </h3>
                        <div
                            className="mt-3 inline-block px-6 py-1.5 rounded-full text-sm font-black tracking-[0.4em] uppercase opacity-70 border border-white/10"
                            style={{ backgroundColor: `${themeColor}20`, color: 'white' }}
                        >
                            {isWinner ? 'WINNER' : 'LOSER'}
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
                            <span className="text-xl font-black font-mono text-white">{player.score} PTS</span>
                        </div>
                    </div>

                    <div className="space-y-3">
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
                                            <Avatar seed={p.avatar} style={p.avatarStyle} className="w-full h-full" />
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
                    </div>
                </motion.div>

                {/* Disconnect Action */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        // Clear stored game data
                        localStorage.removeItem('cw_gameCode');
                        localStorage.removeItem('cw_playerId');
                        // Disconnect from socket
                        socket.disconnect();
                        // Clear game state
                        setGameState(null);
                    }}
                    className="flex items-center gap-3 px-12 py-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black italic tracking-widest uppercase text-xs group mt-4"
                >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                    Leave Game
                </motion.button>
            </div>
        </motion.div>
    );
}
