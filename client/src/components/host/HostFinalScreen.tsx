import type { Socket } from 'socket.io-client';
import type { Player } from '../../types/game';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { Avatar } from '../GameAvatars';
import { getAvatarColor } from '../../constants/avatars';


interface Props {
    socket: Socket;
    players: Player[];
    rounds: number;
    timer: number;
    code: string;
}

export function HostFinalScreen({ socket, players, rounds, timer, code }: Props) {
    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => b.score - a.score).slice(0, 5);
    }, [players]);

    return (
        <motion.div
            key="final"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-7xl"
        >
            <div className="text-center mb-10 md:mb-20">
                <h1 className="mt-24 text-hero text-display mb-8 md:mb-16 text-center drop-shadow-2xl">
                    <span className="block text-xl md:text-4xl mb-2 md:mb-4 tracking-[0.4em] md:tracking-[0.6em] text-color-blue opacity-80">the</span>
                    <span className="text-display-gradient pr-10">Results</span>
                </h1>
            </div>

            <div className="flex flex-col gap-6">
                {sortedPlayers.map((player, i) => {
                    const avatarColor = getAvatarColor(player.avatar);
                    return (
                        <motion.div
                            key={player.id}
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className={`glass p-4 md:p-8 rounded-3xl md:rounded-[3rem] flex items-center justify-between border-white/10 flex-col md:flex-row gap-4 md:gap-0 ${i === 0 ? 'scale-105 z-10' : ''}`}
                            style={{
                                border: `2px solid ${avatarColor}${i === 0 ? '60' : '30'}`,
                                background: i === 0 ? `linear-gradient(to right, ${avatarColor}30, transparent)` : undefined,
                                boxShadow: i === 0 ? `0 0 60px -10px ${avatarColor}50` : undefined
                            }}
                        >
                            <div className="flex items-center gap-4 md:gap-10 pl-0 md:pl-8 w-full md:w-auto">
                                <span
                                    className="text-3xl md:text-6xl font-black font-mono w-12 md:w-24"
                                    style={{ color: i === 0 ? avatarColor : 'rgba(160,160,192,1)' }} // text-muted equivalent
                                >
                                    #{i + 1}
                                </span>
                                <div
                                    className="w-16 h-16 md:w-28 md:h-28 rounded-2xl md:rounded-4xl flex items-center justify-center border-2 md:border-4 border-white/10 shadow-lg overflow-hidden shrink-0"
                                    style={{
                                        borderColor: `${avatarColor}40`,
                                        backgroundColor: i === 0 ? `${avatarColor}40` : 'rgba(255,255,255,0.05)',
                                        boxShadow: i === 0 ? `0 0 30px ${avatarColor}40` : undefined
                                    }}
                                >
                                    <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full" />
                                </div>
                                <span className={`text-2xl md:text-6xl font-black uppercase italic tracking-tight truncate pr-10 ${i === 0 ? 'text-white' : 'text-white/80'}`}>{player.name}</span>
                            </div>
                            <div className="pr-0 md:pr-12">
                                <span
                                    className={`text-4xl md:text-7xl font-mono font-black ${i === 0 ? 'glow-text' : ''}`}
                                    style={{ color: i === 0 ? avatarColor : 'rgba(255,255,255,0.6)' }}
                                >
                                    {player.score}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="text-center mt-10 md:mt-20">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => socket.emit('restart-game', { code, rounds, timer })}
                    className="btn btn-secondary justify-self-center text-2xl md:text-4xl py-6 md:py-8 px-12 md:px-20 rounded-[3rem] opacity-80 hover:opacity-100"
                >
                    Restart Game
                </motion.button>
            </div>
        </motion.div>
    );
}
