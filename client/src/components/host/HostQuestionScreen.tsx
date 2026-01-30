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
            className="w-full max-w-360 text-center relative min-h-screen"
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
                                    {stealNotice.name} STOLE  {stealNotice.value}  {stealNotice.value === 1 ? ' CARD' : ' CARDS'}!
                                </span>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col">
                {/* Meta info - fixed at top */}
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="glass-panel px-8 md:px-16 py-4 md:py-8 rounded-4xl md:rounded-[3rem] flex items-center gap-6 md:gap-12 mx-auto mt-4"
                >
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-lg font-black uppercase tracking-[0.5em] text-color-blue/60 mb-1 italic">Question</span>
                        <span className="text-4xl font-black italic tracking-tighter">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="w-0.5 h-16 bg-white/10 mx-3" />
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-lg font-black uppercase tracking-[0.5em] text-color-blue mb-1 italic">Remaining</span>
                        <span className={`text-4xl font-black tabular-nums italic tracking-tighter ${timeLeft <= 5 ? 'text-error' : 'text-white'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </motion.div>

                {/* Question text - centered in remaining space */}
                <div className="flex-1 flex items-center justify-center mt-24 mb-24">
                    <motion.h1
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="text-hero text-display text-display-gradient drop-shadow-[0_40px_100px_rgba(0,0,0,0.9)] px-8 max-w-[98vw] text-center"
                    >
                        {currentQuestion.question}
                    </motion.h1>
                </div>

                {/* Player submission status - at bottom */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className=" pb-4 flex flex-col items-center gap-6"
                >
                    {/* Player list */}
                    {playersAnswered.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 w-full max-w-7xl px-4">
                            {gameState.players.map((player) => {
                                const playerStatus = playersAnswered.find(p => p.id === player.id);
                                const playerColor = getAvatarColor(player.avatar);
                                const isAnswered = playerStatus?.hasAnswered || false;

                                return (
                                    <motion.div
                                        key={player.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{
                                            opacity: isAnswered ? 1 : 0.5,
                                            scale: isAnswered ? 1 : 0.95,
                                            y: 0
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        className="relative flex items-center gap-5 p-5 rounded-3xl border-2 overflow-hidden flex-1 min-w-80 max-w-120 backdrop-blur-xl"
                                        style={{
                                            background: isAnswered
                                                ? `linear-gradient(135deg, ${playerColor}25 0%, ${playerColor}10 50%, transparent 100%)`
                                                : 'rgba(0,0,0,0.3)',
                                            borderColor: isAnswered ? `${playerColor}60` : 'rgba(255,255,255,0.1)',
                                            boxShadow: isAnswered
                                                ? `0 0 40px ${playerColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`
                                                : '0 10px 40px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {/* Animated gradient shine */}
                                        {isAnswered && (
                                            <motion.div
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '200%' }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                            />
                                        )}

                                        {/* Pulsing glow ring for answered */}
                                        {isAnswered && (
                                            <motion.div
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 rounded-3xl"
                                                style={{ boxShadow: `inset 0 0 30px ${playerColor}40` }}
                                            />
                                        )}

                                        {/* Avatar with fancy frame */}
                                        <div className="relative z-10">
                                            <div
                                                className="w-18 h-18 rounded-2xl overflow-hidden shrink-0 border-3"
                                                style={{
                                                    borderColor: isAnswered ? playerColor : 'rgba(255,255,255,0.2)',
                                                    boxShadow: isAnswered ? `0 0 20px ${playerColor}50` : 'inset 0 2px 10px rgba(0,0,0,0.5)'
                                                }}
                                            >
                                                <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full" />
                                            </div>
                                            {isAnswered && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                    className="absolute -bottom-2 -right-2 bg-success text-black rounded-full p-2 shadow-xl"
                                                    style={{ boxShadow: '0 0 15px rgba(0, 255, 170, 0.6)' }}
                                                >
                                                    <Check size={14} strokeWidth={4} />
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Player info */}
                                        <div className="flex flex-col min-w-0 relative z-10 flex-1">
                                            <span
                                                className="text-xl md:text-2xl font-black truncate uppercase italic tracking-wider leading-none mb-2 text-left"
                                                style={{
                                                    color: isAnswered ? 'white' : 'rgba(255,255,255,0.5)',
                                                    textShadow: isAnswered ? `0 0 20px ${playerColor}60` : 'none'
                                                }}
                                            >
                                                {player.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {!isAnswered && (
                                                    <motion.div
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                        className="w-2 h-2 rounded-full bg-white/50"
                                                    />
                                                )}
                                                <span
                                                    className="text-xs md:text-sm font-black uppercase tracking-[0.15em] leading-none"
                                                    style={{ color: isAnswered ? playerColor : 'rgba(255,255,255,0.3)' }}
                                                >
                                                    {isAnswered ? '✓ LOCKED IN' : 'THINKING...'}
                                                </span>
                                            </div>
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
