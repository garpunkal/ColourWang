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
    const [blockedPlayerIds, setBlockedPlayerIds] = useState<string[]>(
        gameState.players.filter(p => p.isBlockedThisQuestion).map(p => p.id)
    );

    const [stealNotice, setStealNotice] = useState<{ name: string; value: number } | null>(null);
    const [blockNotice, setBlockNotice] = useState<{ blockerName: string; targetName: string } | null>(null);

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

        const blockHandler = ({ playerId, targetPlayerId }: { playerId: string; targetPlayerId: string }) => {
            const blocker = gameState.players.find(p => p.id === playerId);
            const target = gameState.players.find(p => p.id === targetPlayerId);
            if (blocker && target) {
                setBlockedPlayerIds(prev => (prev.includes(targetPlayerId) ? prev : [...prev, targetPlayerId]));
                setBlockNotice({ blockerName: blocker.name, targetName: target.name });
                setTimeout(() => setBlockNotice(null), 12000);
            }
        };


        socket.on('player-answered', answerHandler);
        socket.on('steal-card-used', stealHandler);
        socket.on('block-card-used', blockHandler);

        return () => {
            socket.off('player-answered', answerHandler);
            socket.off('steal-card-used', stealHandler);
            socket.off('block-card-used', blockHandler);
        };
    }, [socket, gameState.players]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlayersAnswered([]);
        setBlockedPlayerIds(gameState.players.filter(p => p.isBlockedThisQuestion).map(p => p.id));
    }, [currentQuestionIndex, gameState.players]);

    return (
        <motion.div
            key="question"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl text-center relative min-h-[100dvh] overflow-x-hidden px-3 sm:px-4 lg:px-6 pb-6"
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
                        <div className="h-2 w-full bg-gradient-to-r from-color-yellow via-white to-color-yellow animate-pulse" />
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

            <AnimatePresence mode="wait">
                {blockNotice && (
                    <motion.div
                        key="block-notice"
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-black md:h-64 flex flex-col overflow-hidden border-t-8 border-error shadow-2xl"
                    >
                        <div className="h-2 w-full bg-gradient-to-r from-error via-white to-error animate-pulse" />
                        <div className="flex-1 flex items-center">
                            <div className="bg-error px-8 md:px-16 flex flex-col items-center justify-center shrink-0 border-r-4 border-black h-full">
                                <span className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">BREAKING</span>
                                <span className="text-xl md:text-2xl font-black text-white/80 uppercase tracking-widest">BLOCK ALERT</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <motion.div
                                    animate={{ x: ['100%', '-100%'] }}
                                    transition={{ duration: 10, ease: "linear", repeat: Infinity }}
                                    className="whitespace-nowrap flex items-center gap-48 py-8"
                                >
                                    {[...Array(4)].map((_, i) => (
                                        <span key={i} className="text-5xl md:text-7xl font-black italic uppercase text-white">
                                            {blockNotice.blockerName} blocked {blockNotice.targetName}!
                                        </span>
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col pt-4 sm:pt-6 lg:pt-8">
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-panel px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 rounded-3xl flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 mx-auto w-full max-w-4xl"
                >
                    <div className="flex flex-col items-center sm:items-start leading-none">
                        <span className="text-xs md:text-sm font-black uppercase tracking-widest text-color-blue/60 mb-1">Round</span>
                        <span className="text-2xl md:text-4xl font-black italic text-white/90">{gameState.currentRoundIndex + 1}</span>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-white/10" />
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-xs md:text-sm font-black uppercase tracking-widest text-color-blue/60 mb-1">Question</span>
                        <span className="text-2xl md:text-4xl font-black italic">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-white/10" />
                    <div className="flex flex-col items-center sm:items-end leading-none">
                        <span className="text-xs md:text-sm font-black uppercase tracking-widest text-color-blue mb-1">Time</span>
                        <span className={`text-2xl md:text-4xl font-black tabular-nums italic ${timeLeft <= 5 ? 'text-error animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                    </div>
                </motion.div>

                <div className="flex-1 flex flex-col items-center justify-center my-6 sm:my-8 lg:my-10 gap-4 sm:gap-6 px-2 sm:px-4">
                    <motion.h1 
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-display text-display-gradient px-2 sm:px-4 md:px-8 max-w-6xl text-center wrap-break-word w-full"
                        style={{ 
                            lineHeight: '1.1',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                        }}
                        role="heading"
                        aria-level={1}
                        aria-live="polite"
                    >
                        {currentQuestion.question}
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 0.4, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="px-4 py-2 rounded-full glass-panel opacity-60"
                    >
                        <span className="text-sm md:text-base font-medium uppercase tracking-wide italic">
                            {(currentQuestion.correctColours || currentQuestion.correctAnswers || []).length === 1 ? (
                                <span className="text-white/50">💡 Single Colour Answer</span>
                            ) : (
                                <span className="text-white/50">💡 {(currentQuestion.correctColours || currentQuestion.correctAnswers || []).length} Colours Required</span>
                            )}
                        </span>
                    </motion.div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 w-full max-w-7xl px-1 sm:px-2 mx-auto pb-6">
                    {gameState.players.map((player) => {
                        const playerStatus = playersAnswered.find(p => p.id === player.id);
                        const playerColor = getAvatarColor(player.avatar);
                        const isAnswered = playerStatus?.hasAnswered || false;

                        return (
                            <motion.div
                                key={player.id}
                                className={`relative flex items-center gap-3 py-3 sm:py-4 px-3 sm:px-4 rounded-2xl border-2 transition-all duration-300 flex-1 min-w-[14rem] sm:min-w-[16rem] max-w-[20rem] ${isAnswered ? 'bg-white/5 opacity-100' : 'bg-black/20 opacity-50'}`}
                                style={{ borderColor: isAnswered ? playerColor : 'rgba(255,255,255,0.1)' }}
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0" style={{ borderColor: isAnswered ? playerColor : 'transparent' }}>
                                    <Avatar seed={player.avatar} style={player.avatarStyle} imageUrl={player.avatarImage} className="w-full h-full" />
                                </div>
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className="text-xl font-black uppercase italic truncate w-full text-left" style={{ color: isAnswered ? playerColor : 'white' }}>{player.name}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60 text-left">{blockedPlayerIds.includes(player.id) ? 'Blocked' : isAnswered ? '✓ Locked In' : 'Thinking...'}</span>
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
