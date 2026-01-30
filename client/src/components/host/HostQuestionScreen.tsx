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
    const [playersAnswered, setPlayersAnswered] = useState<{ id: string; hasAnswered: boolean }[]>(
        gameState.players.map(p => ({ id: p.id, hasAnswered: p.lastAnswer !== null }))
    );

    const [stealNotice, setStealNotice] = useState<{ name: string; value: number } | null>(null);


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
        const handler = ({ playerId, value }: { playerId: string, value: number }) => {
            const stealer = gameState.players.find(p => p.id === playerId);
            if (stealer) {
                setStealNotice({ name: stealer.name, value });
                setTimeout(() => setStealNotice(null), 5000); // Host marquee stays longer
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
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-color-pink py-4 overflow-hidden border-t-4 border-white shadow-[0_-20px_50px_rgba(248,58,123,0.5)]"
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: '-100%' }}
                            transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                            className="whitespace-nowrap flex items-center gap-12"
                        >
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mr-4">
                                    {stealNotice.name} STOLE {stealNotice.value} CARDS!
                                </span>
                            ))}
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
                        <div className="flex justify-center gap-5 flex-wrap max-w-5xl">
                            {gameState.players.map((player) => {
                                const playerStatus = playersAnswered.find(p => p.id === player.id);
                                const playerColor = getAvatarColor(player.avatar);
                                const isAnswered = playerStatus?.hasAnswered || false;

                                return (
                                    <motion.div
                                        key={player.id}
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: isAnswered ? 1.1 : 1 }}
                                        className="flex items-center gap-4 px-6 py-3 rounded-3xl text-xl font-black transition-all shadow-xl"
                                        style={{
                                            backgroundColor: isAnswered ? `${playerColor}30` : `${playerColor}05`,
                                            border: `3px solid ${isAnswered ? playerColor : `${playerColor}20`}`,
                                            color: playerColor,
                                            boxShadow: isAnswered ? `0 10px 30px -5px ${playerColor}40` : 'none',
                                            opacity: isAnswered ? 1 : 0.4
                                        }}
                                    >
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border-2 border-white/10 overflow-hidden shrink-0 shadow-lg">
                                            <Avatar seed={player.avatar} className="w-full h-full" />
                                        </div>
                                        <span className="uppercase tracking-tight italic">{player.name}</span>
                                        {isAnswered && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -45 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                                className="bg-success rounded-full p-1 shadow-lg"
                                            >
                                                <Check size={20} strokeWidth={5} className="text-white" />
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
