import type { Player, GameState } from '../../types/game';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

interface Props {
    player: Player;
    gameState: GameState;
    setGameState: (state: GameState | null) => void;
}

export function PlayerFinalScreen({ player, gameState, setGameState }: Props) {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
    const isWinner = rank === 1;

    const themeColor = isWinner ? 'var(--color-gold)' : 'var(--color-blue)';

    return (
        <motion.div
            key="final"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center w-full max-w-lg mx-auto overflow-hidden min-h-[80vh] relative py-10"
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

                {/* Score Panel */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="w-full glass-panel p-10 rounded-[3rem] border-white/10 relative overflow-hidden text-center group"
                >
                    <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent opacity-50" />
                    <span className="relative z-10 text-[10px] uppercase tracking-[0.6em] text-white/40 font-black italic block mb-6">Aggregate XP Signal</span>

                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-[10rem] md:text-[14rem] font-black text-white leading-none tracking-tighter font-mono drop-shadow-2xl">
                            {player.score || 0}
                        </span>
                        <div className="h-1 w-24 bg-white/10 rounded-full mt-4 overflow-hidden">
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="h-full w-full bg-linear-to-r from-transparent via-white/40 to-transparent"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Return Action */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGameState(null)}
                    className="flex items-center gap-3 px-12 py-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black italic tracking-widest uppercase text-sm group"
                >
                    <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    Initialize Reset
                </motion.button>
            </div>
        </motion.div>
    );
}
