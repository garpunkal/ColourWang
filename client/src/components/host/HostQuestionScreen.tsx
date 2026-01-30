import type { Question, GameState } from '../../types/game';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { Check } from 'lucide-react';
import { getAvatarColor } from '../../constants/avatars';

interface Props {
    socket: Socket;
    gameState: GameState;
    currentQuestion: Question;
    currentQuestionIndex: number;
    timeLeft: number;
}

export function HostQuestionScreen({ socket, gameState, currentQuestion, currentQuestionIndex, timeLeft }: Props) {
    const [playersAnswered, setPlayersAnswered] = useState<{ id: string; hasAnswered: boolean }[]>([]);

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

    // Reset when question changes
    useEffect(() => {
        setPlayersAnswered([]);
    }, [currentQuestionIndex]);

    const answeredCount = playersAnswered.filter(p => p.hasAnswered).length;
    const totalPlayers = gameState.players.length;
    return (
        <motion.div
            key="question"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-360 text-center"
        >
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
                    className="text-[clamp(3rem,8vw,8rem)] text-display text-display-gradient mb-0 drop-shadow-[0_40px_100px_rgba(0,0,0,0.9)] px-8 max-w-[98vw] text-center"
                >
                    {currentQuestion.question}
                </motion.h3>

                {/* Player submission status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 flex flex-col items-center gap-6"
                >
                    {/* Progress indicator */}
                    <div className="glass-panel px-6 py-2 rounded-2xl">
                        <span className="text-xl font-black uppercase tracking-widest text-color-blue">
                            {answeredCount} / {totalPlayers} Submitted
                        </span>
                    </div>

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
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: playerColor }}
                                        />
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
