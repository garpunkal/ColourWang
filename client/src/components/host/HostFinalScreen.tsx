import type { Socket } from 'socket.io-client';
import type { Player } from '../../types/game';
import { motion } from 'framer-motion';
import { Logo } from '../Logo';
import { Avatar } from '../GameAvatars';

interface Props {
    socket: Socket;
    players: Player[];
    rounds: number;
    timer: number;
}

export function HostFinalScreen({ socket, players, rounds, timer }: Props) {
    return (
        <motion.div
            key="final"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-7xl"
        >
            <div className="text-center mb-10 md:mb-20">
                <Logo className="w-auto max-w-[300px] md:max-w-[500px] mx-auto mb-6 md:mb-10" />
                <h3 className="text-[clamp(3.5rem,10vw,10rem)] text-display leading-none bg-gradient-to-b from-color-gold via-color-orange to-color-pink bg-clip-text text-transparent drop-shadow-2xl">
                    CHAMPIONS
                </h3>
            </div>

            <div className="flex flex-col gap-6">
                {players.sort((a, b) => b.score - a.score).slice(0, 5).map((player, i) => (
                    <motion.div
                        key={player.id}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] flex items-center justify-between border-white/10 flex-col md:flex-row gap-4 md:gap-0 ${i === 0 ? 'bg-gradient-to-r from-color-gold/20 to-transparent border-color-gold/30 scale-105 shadow-[0_0_60px_rgba(255,215,0,0.2)]' : ''}`}
                    >
                        <div className="flex items-center gap-4 md:gap-10 pl-0 md:pl-8 w-full md:w-auto">
                            <span className={`text-3xl md:text-6xl font-black font-mono w-12 md:w-24 ${i === 0 ? 'text-color-gold' : 'text-text-muted'}`}>#{i + 1}</span>
                            <div className={`w-16 h-16 md:w-28 md:h-28 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center border-2 md:border-4 border-white/10 shadow-lg ${i === 0 ? 'bg-color-gold text-black' : 'bg-white/5'} overflow-hidden flex-shrink-0`}>
                                <Avatar seed={player.avatar} className="w-full h-full" />
                            </div>
                            <span className={`text-2xl md:text-6xl font-black uppercase italic tracking-tight truncate ${i === 0 ? 'text-white' : 'text-white/80'}`}>{player.name}</span>
                        </div>
                        <div className="pr-0 md:pr-12">
                            <span className={`text-4xl md:text-7xl font-mono font-black ${i === 0 ? 'text-color-gold glow-text' : 'text-white/60'}`}>{player.score}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-10 md:mt-20">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => socket.emit('create-game', { rounds, timer })}
                    className="btn btn-secondary text-2xl md:text-4xl py-6 md:py-8 px-12 md:px-20 rounded-[1.5rem] md:rounded-[2.5rem] opacity-80 hover:opacity-100"
                >
                    Re-Initialize System
                </motion.button>
            </div>
        </motion.div>
    );
}
