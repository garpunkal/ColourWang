import { useState, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { Question, GameState } from '../../types/game';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { ColorCard } from '../ColorCard';
import { getAvatarColor } from '../../constants/avatars';

interface Props {
    socket: Socket;
    gameState: GameState;
    currentQuestion: Question;
    currentQuestionIndex: number;
}

export function PlayerQuestionScreen({ socket, gameState, currentQuestion, currentQuestionIndex }: Props) {
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(gameState.timerDuration || 15);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState.timerDuration, currentQuestionIndex]);

    const me = gameState.players.find(p => p.socketId === socket.id || p.id === localStorage.getItem('cw_playerId'));
    const avatarColor = getAvatarColor(me?.avatar || 'cyber-blue');


    const toggleColor = (color: string) => {
        if (hasAnswered) return;
        setSelectedColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const submitAnswer = useCallback(() => {
        if (selectedColors.length > 0 && gameState) {
            setHasAnswered(true);
            socket.emit('submit-answer', {
                code: gameState.code,
                answers: selectedColors
            });
        }
    }, [selectedColors, gameState, socket]);

    useEffect(() => {
        if (timeLeft === 0 && !hasAnswered && selectedColors.length > 0) {
            // Use setTimeout to avoid synchronous state update in effect
            const timer = setTimeout(() => {
                submitAnswer();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, hasAnswered, selectedColors, submitAnswer]);

    return (
        <motion.div
            key="question"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col gap-8"
        >
            <div className="text-center px-4">
                <div
                    className="inline-block px-6 py-2 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] mb-6 italic shadow-xl"
                    style={{
                        backgroundColor: `${avatarColor}20`,
                        border: `1px solid ${avatarColor}40`,
                        color: avatarColor
                    }}
                >
                    Phase {currentQuestionIndex + 1}
                </div>
                <h3 className="text-3xl md:text-5xl text-display text-display-gradient">{currentQuestion.question}</h3>
            </div>

            {!hasAnswered ? (
                <div className="flex-1 flex flex-col gap-10">
                    <div className="grid grid-cols-2 gap-6 flex-1 p-2 place-items-center">
                        {currentQuestion.options.map((color, i) => (
                            <ColorCard
                                key={i}
                                color={color}
                                isSelected={selectedColors.includes(color)}
                                onClick={() => toggleColor(color)}
                                disabled={hasAnswered || timeLeft === 0}
                                size="medium"
                                index={i}
                            />
                        ))}
                    </div>
                    <motion.button
                        whileHover={{ y: -8 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={submitAnswer}
                        disabled={selectedColors.length === 0 || timeLeft === 0}
                        className="btn btn-primary w-full py-6 md:py-12 text-2xl md:text-3xl transition-all flex items-center justify-center gap-6 md:gap-8 rounded-[1.5rem] md:rounded-[3rem] disabled:opacity-20 disabled:grayscale italic border-t-4 border-white/30 uppercase font-black tracking-widest"
                        style={{
                            boxShadow: `0 40px 80px -20px ${avatarColor}60`,
                            borderColor: `${avatarColor}80`
                        }}
                    >
                        SEND SELECTION <Send fill="currentColor" size={32} />
                    </motion.button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-12 glass m-4 rounded-[5rem] border-white/5 relative overflow-hidden shadow-[0_100px_100px_-50px_rgba(0,0,0,0.8)]">
                    <div
                        className="absolute top-0 left-0 w-full h-2 opacity-50"
                        style={{ background: `linear-gradient(to right, transparent, ${avatarColor}, transparent)` }}
                    />
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.2, 1],
                            filter: ["blur(0px)", "blur(10px)", "blur(0px)"]
                        }}
                        transition={{
                            rotate: { repeat: Infinity, duration: 12, ease: "linear" },
                            scale: { repeat: Infinity, duration: 4 },
                            filter: { repeat: Infinity, duration: 4 }
                        }}
                        className="text-6xl md:text-[12rem] relative z-10"
                    >
                        ☄️
                    </motion.div>
                    <div className="text-center px-6 md:px-12 relative z-10">
                        <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mb-4 md:mb-6">TRANSMITTED</h3>
                        <p className="text-text-muted font-bold text-lg leading-relaxed italic opacity-80">Data packets secured in the Arena.<br />Awaiting Final Confirmation...</p>
                    </div>
                    <motion.div
                        animate={{ height: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute right-0 top-0 w-1"
                        style={{ background: `linear-gradient(to b, transparent, ${avatarColor}, transparent)` }}
                    />
                </div>
            )}
        </motion.div>
    );
}
