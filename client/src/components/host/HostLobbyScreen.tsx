import type { Player } from '../../types/game';
import { motion } from 'framer-motion';
import { Avatar } from '../GameAvatars';
import { getAvatarColor } from '../../constants/avatars';

interface Props {
    players: Player[];
    onStartGame: () => void;
}

export function HostLobbyScreen({ players, onStartGame }: Props) {
    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            className="w-full max-w-[95vw] flex flex-col items-center"
        >
            <h2 className="mt-12 md:mt-16 text-[clamp(2.5rem,6vw,6rem)] text-display mb-8 text-center drop-shadow-2xl">
                <span className="block text-xl md:text-3xl mb-1 tracking-[0.4em] md:tracking-[0.6em] text-color-blue opacity-80 uppercase">Awaiting</span>
                <span className="text-display-gradient pr-10">Players</span>
            </h2>

            {players.length === 0 ? (
                <div className="text-4xl text-text-muted animate-pulse font-mono tracking-widest uppercase border-2 border-dashed border-white/10 px-12 py-8 rounded-4xl mt-12">
                    waiting...
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-4 w-full max-w-7xl mb-8 px-8">
                    {players.map((player, i) => {
                        const avatarColor = getAvatarColor(player.avatar);
                        return (
                            <motion.div
                                key={player.id}
                                initial={{ scale: 0, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ type: "spring", delay: i * 0.05, stiffness: 200, damping: 20 }}
                                className="glass p-3 rounded-2xl flex flex-col items-center gap-2 border-white/10 shadow-lg transition-all duration-300 min-w-40"
                                style={{
                                    border: `2px solid ${avatarColor}40`,
                                    background: `linear-gradient(180deg, ${avatarColor}15 0%, transparent 100%)`
                                }}
                            >
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 overflow-hidden shrink-0">
                                    <Avatar seed={player.avatar} className="w-full h-full" />
                                </div>
                                <div className="flex flex-col items-center overflow-hidden w-full">
                                    <span
                                        className="text-xl md:text-2xl font-black truncate text-white tracking-tight uppercase italic w-full text-center"
                                        style={{ textShadow: `0 0 15px ${avatarColor}40` }}
                                    >
                                        {player.name}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {players.length > 0 && (
                <motion.button
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={onStartGame}
                    className="btn btn-primary text-3xl md:text-5xl py-6 md:py-8 px-12 md:px-24 rounded-4xl md:rounded-[3rem] shadow-[0_0_80px_rgba(0,229,255,0.4)] uppercase font-black italic tracking-widest border-t-4 md:border-t-6 border-white/20 animate-pulse-slow mb-8"
                >
                    Start Game
                </motion.button>
            )}
        </motion.div>
    );
}
