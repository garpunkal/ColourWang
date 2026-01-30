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
                                    {stealNotice.name} STOLE {stealNotice.value} {stealNotice.value === 1 ? 'CARD' : 'CARDS'}!
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl px-4">
                            {gameState.players.map((player) => {
                                const playerStatus = playersAnswered.find(p => p.id === player.id);
                                const playerColor = getAvatarColor(player.avatar);
                                const isAnswered = playerStatus?.hasAnswered || false;

                                return (
                                    <motion.div
                                        key={player.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{
                                            opacity: isAnswered ? 1 : 0.6,
                                            scale: isAnswered ? 1.05 : 1,
                                            backgroundColor: isAnswered ? `${playerColor}15` : 'rgba(255,255,255,0.03)',
                                            borderColor: isAnswered ? `${playerColor}50` : 'rgba(255,255,255,0.05)'
                                        }}
                                        className="relative flex items-center gap-4 p-3 rounded-2xl border-2 transition-all overflow-hidden"
                                    >
                                        {/* Background pulse for answered */}
                                        {isAnswered && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: [0, 0.2, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 bg-white"
                                            />
                                        )}

                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-black/20 rounded-xl overflow-hidden shrink-0 shadow-inner">
                                                <Avatar seed={player.avatar} className="w-full h-full" />
                                            </div>
                                            {isAnswered && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -bottom-2 -right-2 bg-success text-black rounded-full p-1 border-2 border-black"
                                                >
                                                    <Check size={12} strokeWidth={4} />
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex flex-col min-w-0 relative z-10">
                                            <span className="text-sm md:text-lg font-black truncate text-white uppercase italic tracking-wider leading-none mb-1">
                                                {player.name}
                                            </span>
                                            <span
                                                className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] leading-none transition-colors"
                                                style={{ color: isAnswered ? playerColor : 'rgba(255,255,255,0.3)' }}
                                            >
                                                {isAnswered ? 'READY' : 'THINKING...'}
                                            </span>
                                        </div>
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
