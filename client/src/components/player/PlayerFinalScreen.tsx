import type { Player, GameState } from '../../types/game';
import { motion } from 'framer-motion';

interface Props {
    player: Player;
    gameState: GameState;
    setGameState: (state: GameState | null) => void;
}

export function PlayerFinalScreen({ player, gameState, setGameState }: Props) {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const rank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
    const isWinner = rank === 1;

    return (
        <motion.div
            key="final"
            initial={{ y: 100, opacity: 0, filter: "blur(20px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            className="text-center space-y-12"
        >
            <div className="relative inline-block">
                {isWinner && (
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-16 bg-gradient-to-br from-color-orange/30 to-color-pink/30 blur-[100px] rounded-full"
                    />
                )}
                <div className="text-[14rem] relative z-10 drop-shadow-[0_40px_80px_rgba(255,157,0,0.6)]">
                    {isWinner ? '👑' : '🔥'}
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="text-7xl font-black uppercase tracking-tighter italic leading-none bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                    {isWinner ? 'LEGEND STATUS' : `RANK #${rank}`}
                </h3>
                <p className="text-2xl font-black text-color-purple uppercase tracking-[0.6em] italic opacity-80">
                    {isWinner ? 'Field Dominance Confirmed' : 'Neural Sync Complete'}
                </p>
            </div>

            <div className="glass p-16 rounded-[4.5rem] border-white/10 shadow-[0_100px_150px_-30px_rgba(0,0,0,0.8)] relative overflow-hidden group bg-gradient-to-b from-white/5 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-br from-color-blue/20 to-transparent opacity-50" />
                <div className="relative z-10">
                    <p className="text-xs font-black uppercase tracking-[0.6em] text-color-blue mb-6 italic opacity-70">Total XP Accrued</p>
                    <p className="text-[12rem] font-black text-white glow-text leading-none tracking-tighter font-mono">{player.score || 0}</p>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setGameState(null)}
                className="btn btn-secondary w-full py-12 text-4xl rounded-[3.5rem] border-t-4 border-white/30 bg-white/10 hover:bg-white/15 transition-all font-black group relative overflow-hidden shadow-2xl italic tracking-tighter uppercase"
            >
                <span className="relative z-10">RE-INITIALIZE</span>
                <motion.div
                    animate={{ x: [-600, 1000] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                    className="absolute inset-0 bg-white/5 -skew-x-12"
                />
            </motion.button>
        </motion.div>
    );
}
