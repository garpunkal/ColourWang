import type { Question, GameState } from '../../types/game';
import { motion, AnimatePresence } from 'framer-motion';

import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { Check } from 'lucide-react';
import { getAvatarColor } from '../../constants/avatars';
import { Avatar } from '../GameAvatars';

interface Props {
    socket: Socket;
    gameState: GameState;
    currentQuestion: Question;
    currentQuestionIndex: number;
    timeLeft: number;
}

export function HostQuestionScreen({ socket, gameState, currentQuestion, currentQuestionIndex, timeLeft }: Props) {
    const [playersAnswered, setPlayersAnswered] = useState<{ id: string; hasAnswered: boolean }[]>([]);
    const [stealNotice, setStealNotice] = useState<string | null>(null);


    // Listen for player-answered events
    useEffect(() => {
        const handler = (players: { id: string; hasAnswered: boolean }[]) => {
            setPlayersAnswered(players);
        };
        socket.on('player-answered', handler);
        return () => {
            socket.off('player-answered', handler);
        };
    }, [socket]);

    // Listen for steal events
    useEffect(() => {
        const handler = ({ playerId }: { playerId: string }) => {
            const stealer = gameState.players.find(p => p.id === playerId);
            if (stealer) {
                setStealNotice(stealer.name);
                setTimeout(() => setStealNotice(null), 3000);
            }
        };
        socket.on('steal-card-used', handler);
        return () => {
            socket.off('steal-card-used', handler);
        };
    }, [socket, gameState.players]);


    // Reset when question changes
    useEffect(() => {
        setTimeout(() => setPlayersAnswered([]), 0);
    }, [currentQuestionIndex]);

    return (
        <motion.div
            key="question"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-360 text-center relative"
        >
            <AnimatePresence>
                {stealNotice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-110 flex items-center justify-center pointer-events-none p-10"
                    >
                        {/* High-impact background flash */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.4, 0.6] }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 bg-color-pink/30 mix-blend-color-dodge"
                        />

                        <motion.div
                            initial={{ scale: 5, rotate: -40, opacity: 0, filter: 'blur(20px)' }}
                            animate={{ scale: 1, rotate: -8, opacity: 1, filter: 'blur(0px)' }}
                            transition={{
                                type: "spring",
                                damping: 10,
                                stiffness: 300,
                            }}
                            className="relative"
                        >
                            <div className="bg-color-pink border-15 md:border-24 border-white px-12 md:px-24 py-8 md:py-14 shadow-[0_50px_100px_rgba(248,58,123,0.8),0_0_100px_rgba(255,255,255,0.4)] flex flex-col items-center">
                                <span className="text-7xl md:text-[10rem] font-black text-white leading-none tracking-tighter italic uppercase text-center drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                                    {stealNotice}
                                </span>
                                <span className="text-9xl md:text-[16rem] font-black text-white leading-none tracking-tighter italic uppercase text-center drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)] -mt-4 md:-mt-10">
                                    HAS STOLEN!
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center justify-center gap-6">
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="glass-panel px-8 md:px-16 py-4 md:py-8 rounded-4xl md:rounded-[3rem] flex items-center gap-6 md:gap-12"
                >
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-lg font-black uppercase tracking-[0.5em] text-color-blue/60 mb-1 italic">Question</span>
                        <span className="text-4xl font-black italic tracking-tighter">0{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="w-0.5 h-16 bg-white/10 mx-3" />
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-lg font-black uppercase tracking-[0.5em] text-color-blue mb-1 italic">Remaining</span>
                        <span className={`text-4xl font-black tabular-nums italic tracking-tighter ${timeLeft <= 5 ? 'text-error' : 'text-white'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </motion.div>

                <motion.h3
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="text-[clamp(3rem,8vw,6rem)] text-display text-display-gradient mb-0 drop-shadow-[0_40px_100px_rgba(0,0,0,0.9)] px-8 max-w-[98vw] text-center"
                >
                    {currentQuestion.question}
                </motion.h3>

                {/* Player submission status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 flex flex-col items-center gap-6"
                >
                    {/* Player list */}
                    {playersAnswered.length > 0 && (
                        <div className="flex justify-center gap-3 flex-wrap max-w-4xl">
                            {gameState.players.map((player) => {
                                const playerStatus = playersAnswered.find(p => p.id === player.id);
                                const playerColor = getAvatarColor(player.avatar);
                                const isAnswered = playerStatus?.hasAnswered || false;

                                return (
                                    <motion.div
                                        key={player.id}
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all"
                                        style={{
                                            backgroundColor: isAnswered ? `${playerColor}30` : `${playerColor}10`,
                                            border: `2px solid ${isAnswered ? playerColor : `${playerColor}30`}`,
                                            color: playerColor,
                                            opacity: isAnswered ? 1 : 0.5
                                        }}
                                    >
                                        <div className="w-5 h-5 bg-white/5 rounded-full flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                                            <Avatar seed={player.avatar} className="w-full h-full" />
                                        </div>
                                        <span className="uppercase tracking-wider">{player.name}</span>
                                        {isAnswered && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                            >
                                                <Check size={16} strokeWidth={3} />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
