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
            className="w-full max-w-[90vw] flex flex-col items-center"
        >
            <h2 className="mt-24 text-[clamp(3rem,8vw,8rem)] text-display mb-8 md:mb-16 text-center drop-shadow-2xl">
                <span className="block text-xl md:text-4xl mb-2 md:mb-4 tracking-[0.4em] md:tracking-[0.6em] text-color-blue opacity-80">Awaiting</span>
                <span className="text-display-gradient pr-10">Players</span>
            </h2>

            {players.length === 0 ? (
                <div className="text-4xl text-text-muted animate-pulse font-mono tracking-widest uppercase border-2 border-dashed border-white/10 px-12 py-8 rounded-4xl">
                    waiting...
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-6 md:gap-10 w-full mb-8 md:mb-16 px-4 md:px-12">
                    {players.map((player, i) => {
                        const avatarColor = getAvatarColor(player.avatar);
                        return (
                            <motion.div
                                key={player.id}
                                initial={{ scale: 0, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ type: "spring", delay: i * 0.1 }}
                                className="glass p-8 rounded-[3rem] flex flex-col items-center gap-6 border-white/10 shadow-xl min-w-70 hover:scale-110 transition-transform duration-300"
                                style={{
                                    border: `3px solid ${avatarColor}40`,
                                    boxShadow: `0 30px 60px -15px ${avatarColor}30`
                                }}
                            >
                                <div className="w-32 h-32 bg-white/5 rounded-4xl flex items-center justify-center shadow-inner border border-white/10 overflow-hidden">
                                    <Avatar seed={player.avatar} className="w-full h-full" />
                                </div>
                                <span className="text-4xl font-black truncate text-white tracking-tight text-center w-full uppercase italic">{player.name}</span>
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
                    className="btn btn-primary text-3xl md:text-6xl py-6 md:py-10 px-12 md:px-32 rounded-4xl md:rounded-[3.5rem] shadow-[0_0_80px_rgba(0,229,255,0.4)] uppercase font-black italic tracking-widest border-t-4 md:border-t-8 border-white/20 animate-pulse-slow"
                >
                    Start Game
                </motion.button>
            )}
        </motion.div>
    );
}
