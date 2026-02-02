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

    useEffect(() => {
        const answerHandler = (players: { id: string; hasAnswered: boolean }[]) => {
            setPlayersAnswered(players);
        };

        const stealHandler = ({ playerId, value }: { playerId: string, value: number }) => {
            const stealer = gameState.players.find(p => p.id === playerId);
            if (stealer) {
                setStealNotice({ name: stealer.name, value });
                setTimeout(() => setStealNotice(null), 12000);
            }
        };


        socket.on('player-answered', answerHandler);
        socket.on('steal-card-used', stealHandler);

        return () => {
            socket.off('player-answered', answerHandler);
            socket.off('steal-card-used', stealHandler);
        };
    }, [socket, gameState.players]);

    useEffect(() => {
        setPlayersAnswered([]);
    }, [currentQuestionIndex]);

    return (
        <motion.div
            key="question"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-360 text-center relative min-h-screen"
        >
            <AnimatePresence mode="wait">
                {stealNotice && (
                    <motion.div
                        key="steal-notice"
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-black md:h-64 flex flex-col overflow-hidden border-t-8 border-color-yellow shadow-2xl"
                    >
                        <div className="h-2 w-full bg-linear-to-r from-color-yellow via-white to-color-yellow animate-pulse" />
                        <div className="flex-1 flex items-center">
                            <div className="bg-color-yellow px-8 md:px-16 flex flex-col items-center justify-center shrink-0 border-r-4 border-black h-full">
                                <span className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">BREAKING</span>
                                <span className="text-xl md:text-2xl font-black text-white/80 uppercase tracking-widest">STEAL ALERT</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <motion.div
                                    animate={{ x: ['100%', '-100%'] }}
                                    transition={{ duration: 10, ease: "linear", repeat: Infinity }}
                                    className="whitespace-nowrap flex items-center gap-48 py-8"
                                >
                                    {[...Array(4)].map((_, i) => (
                                        <span key={i} className="text-5xl md:text-7xl font-black italic uppercase text-white">
                                            {stealNotice.name} stole {stealNotice.value} cards!
                                        </span>
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col pt-8">
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-panel px-8 py-4 rounded-3xl flex items-center gap-8 mx-auto"
                >
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-sm font-black uppercase tracking-widest text-color-blue/60 mb-1">Question</span>
                        <span className="text-4xl font-black italic">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-sm font-black uppercase tracking-widest text-color-blue mb-1">Remaining</span>
                        <span className={`text-4xl font-black tabular-nums italic ${timeLeft <= 5 ? 'text-error animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                    </div>
                </motion.div>

                <div className="flex-1 flex items-center justify-center my-16">
                    <motion.h1 className="text-5xl md:text-7xl font-black text-display text-display-gradient px-8 max-w-5xl">
                        {currentQuestion.question}
                    </motion.h1>
                </div>

                <div className="flex flex-wrap justify-center gap-6 w-full max-w-7xl px-4 mx-auto pb-12">
                    {gameState.players.map((player) => {
                        const playerStatus = playersAnswered.find(p => p.id === player.id);
                        const playerColor = getAvatarColor(player.avatar);
                        const isAnswered = playerStatus?.hasAnswered || false;

                        return (
                            <motion.div
                                key={player.id}
                                className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 flex-1 min-w-[240px] max-w-[320px] ${isAnswered ? 'bg-white/5 opacity-100' : 'bg-black/20 opacity-50'}`}
                                style={{ borderColor: isAnswered ? playerColor : 'rgba(255,255,255,0.1)' }}
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: isAnswered ? playerColor : 'transparent' }}>
                                    <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xl font-black uppercase italic truncate w-full" style={{ color: isAnswered ? playerColor : 'white' }}>{player.name}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">{isAnswered ? '✓ Locked In' : 'Thinking...'}</span>
                                </div>
                                {isAnswered && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-success text-black rounded-full p-1">
                                        <Check size={16} strokeWidth={4} />
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
