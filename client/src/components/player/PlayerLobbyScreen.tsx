import { motion } from 'framer-motion';
import type { GameState } from '../../types/game';
import { getAvatarColor } from '../../constants/avatars';
import { Avatar } from '../GameAvatars';

interface Props {
    gameState: GameState;
}

export function PlayerLobbyScreen({ gameState }: Props) {
    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
            className="text-center glass rounded-[4rem] p-8 md:p-8 border-white/10 shadow-[0_80px_100px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-linear-to-br from-color-blue/15 via-transparent to-color-purple/15 opacity-50" />
            <div className="mb-6 relative inline-block z-10">
                <motion.div
                    animate={{ scale: [1, 1.6, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute inset-0 bg-color-blue/20 blur-[60px] rounded-full"
                />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 uppercase tracking-tighter italic z-10 relative">STAND BY</h1>
            <p className="text-text-muted font-bold text-base md:text-lg mb-2 z-10 relative px-4 leading-relaxed opacity-80 italic mt-8">You're in the game!</p>

            {/* Players List */}
            <div className="relative z-10">
                <div className="text-xs md:text-sm uppercase tracking-widest text-color-blue/60 font-black mb-4 italic">
                    Players ({gameState.players.length})
                </div>
                <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                    {gameState.players.map((player, index) => {
                        const playerColor = getAvatarColor(player.avatar);
                        return (
                            <motion.div
                                key={player.id}
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                                className="flex items-center gap-3 px-4 py-2 rounded-2xl glass-panel w-full"
                                style={{
                                    borderColor: `${playerColor}50`,
                                    backgroundColor: `${playerColor}10`
                                }}
                            >
                                <Avatar
                                    seed={player.avatar}
                                    className="w-12 h-12"
                                />
                                <span
                                    className="font-black text-base md:text-lg uppercase tracking-wider flex-1 text-left"
                                    style={{ color: 'white' }}
                                >
                                    {player.name}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

        </motion.div>
    );
}
