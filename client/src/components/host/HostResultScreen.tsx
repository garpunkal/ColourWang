
import type { Socket } from 'socket.io-client';
import type { Question, GameState } from '../../types/game';
import { Play, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

import { ColorCard } from '../ColorCard';
import { sortColors } from '../../config/gameConfig';
import { Avatar } from '../GameAvatars';
import { audioManager } from '../../utils/audioManager';

interface Props {
    socket: Socket;
    gameState: GameState;
    currentQuestion: Question;
    currentQuestionIndex: number;
    totalQuestions: number;
    onNextQuestion: () => void;
}

export function HostResultScreen({ socket, gameState, currentQuestion, currentQuestionIndex, totalQuestions, onNextQuestion }: Props) {
    const correctColors = sortColors(currentQuestion.correctAnswers || currentQuestion.correctColors);
    const [timeLeft, setTimeLeft] = useState(gameState.resultDuration || 30);
    const [autoProceed, setAutoProceed] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    const sortedPlayers = useMemo(() => {
        return [...gameState.players].sort((a, b) => b.score - a.score);
    }, [gameState.players]);

    useEffect(() => {
        audioManager.playSwoosh();

        setTimeout(() => {
            setTimeLeft(gameState.resultDuration || 30);
            setAutoProceed(false);
        }, 0);
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setAutoProceed(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [currentQuestion, gameState.resultDuration]);

    useEffect(() => {
        if (autoProceed) {
            onNextQuestion();
        }
    }, [autoProceed, onNextQuestion]);

    const handleRemoveQuestion = () => {
        if (window.confirm('Are you sure you want to PERMANENTLY delete this question from the game pool?')) {
            setIsRemoving(true);
            if (gameState.code) {
                socket.emit('remove-question', { code: gameState.code });
            }

            // Give visual feedback and then proceed to next question
            setTimeout(() => {
                onNextQuestion();
                setIsRemoving(false);
            }, 1000);
        }
    };

    return (
        <motion.div
            key="result"
            initial={{ scale: 1.05, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            className="w-full max-w-7xl relative"
        >
            {/* Background Atmosphere */}
            <div
                className="fixed inset-0 blur-[160px] opacity-15 -z-10 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 50% 40%, var(--color-blue), transparent 70%)`
                }}
            />

            <div className="flex flex-col items-center text-center">
                {/* Question Section */}
                <div className="mb-12 max-w-5xl relative group/question">
                    {/* Remove Question Option */}
                    <div className="absolute -top-6 -right-6 md:right-0 z-50">
                        <motion.button
                            whileHover={{ scale: 1.1, color: '#ff3366' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleRemoveQuestion}
                            disabled={isRemoving}
                            className="p-3 text-white/10 hover:text-error transition-all duration-300 cursor-pointer bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md border border-white/5 hover:border-error/30"
                            title="Permanently remove this question"
                        >
                            <Trash2 size={24} className={isRemoving ? 'animate-bounce' : ''} />
                            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/question:opacity-40 transition-opacity pointer-events-none">Remove Forever</span>
                        </motion.button>
                    </div>

                    <h1 className="text-hero text-display mb-8 text-display-gradient drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] leading-[1.1]">
                        {currentQuestion.question}
                    </h1>
                    <div className="flex flex-col items-center gap-10">
                        <div className="flex flex-col items-center">
                            <span className="text-sm md:text-lg font-black text-color-blue tracking-[0.6em] uppercase italic mb-6 opacity-80">Correct Answer</span>
                            <div className="flex justify-center gap-8 flex-wrap">
                                {correctColors.map((color, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                    >
                                        <ColorCard
                                            color={color}
                                            isCorrect={true}
                                            size="medium"
                                            index={i}
                                            showLabel={gameState.accessibleLabels}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Players Results Grid */}
                <div className="w-full mb-16 px-4">
                    <div className="flex items-center justify-center gap-6 mb-10">
                        <div className="h-px w-20 bg-linear-to-r from-transparent to-white/20" />
                        <span className="text-base md:text-xl font-black text-white/50 tracking-[0.4em] uppercase italic">Player Intel</span>
                        <div className="h-px w-20 bg-linear-to-l from-transparent to-white/20" />
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 md:gap-6 px-4 w-full">
                        {sortedPlayers.map((player, index) => {
                            const playerAnswer = sortColors(player.lastAnswer || []);

                            return (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + (index * 0.05) }}
                                    className="glass group relative flex flex-col flex-1 min-w-50 max-w-sm p-4 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                                    style={{
                                        background: player.isCorrect
                                            ? `linear-gradient(180deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)`
                                            : `linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)`,
                                        borderColor: player.isCorrect
                                            ? (player.streak >= 3 ? 'rgba(249, 115, 22, 0.6)' : 'rgba(34, 197, 94, 0.3)')
                                            : 'rgba(239, 68, 68, 0.3)',
                                        borderWidth: player.streak >= 3 ? '2px' : '1px',
                                        borderStyle: 'solid',
                                        boxShadow: player.streak >= 3 ? '0 0 30px rgba(249, 115, 22, 0.2)' : 'none'
                                    }}
                                >
                                    {/* Player Info */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5 shadow-lg relative">
                                            <div className="absolute inset-0 bg-black/20" />
                                            <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full relative z-10" />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="font-black text-lg uppercase italic tracking-wider truncate w-full text-white drop-shadow-md pr-10">
                                                {player.name}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[16px] font-black italic tracking-widest ${player.isCorrect ? 'text-success' : 'text-error'}`}>
                                                    {player.isCorrect ? `+${(player.streak >= 3 ? Math.round(10 * 1.5) : 10) + (player.isFastestFinger ? 5 : 0)} PTS` : '+0 PTS'}
                                                </span>
                                                {player.streak >= 3 && (
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1], rotate: [-10, 10, -10] }}
                                                        transition={{ duration: 0.5, repeat: Infinity }}
                                                        className="ml-2 bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                                                    >
                                                        <span className="text-xs">🔥</span>
                                                    </motion.div>
                                                )}
                                                {player.isFastestFinger && (
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1], y: [0, -5, 0] }}
                                                        transition={{ duration: 0.4, repeat: Infinity }}
                                                        className={`${player.streak >= 3 ? 'ml-1' : 'ml-2'} bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center shadow-[0_0_15px_rgba(255,223,0,0.6)]`}
                                                    >
                                                        <span className="text-xs">⚡</span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Answer Display */}
                                    <div className="flex-1 flex items-center justify-center min-h-20 py-2 bg-black/20 rounded-xl border border-white/5">
                                        <div className="flex gap-1.5 justify-center flex-wrap">
                                            {playerAnswer.length > 0 ? playerAnswer.map((color, i) => (
                                                <ColorCard
                                                    key={i}
                                                    color={color}
                                                    size="mini"
                                                    index={i}
                                                    disabled={true}
                                                    showLabel={gameState.accessibleLabels}
                                                />
                                            )) : (
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">No Answer</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Corner Accents */}
                                    <div className={`absolute top-0 right-0 w-20 h-20 opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity ${player.isCorrect ? 'bg-success' : 'bg-error'} blur-2xl`} />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation Button */}
                <div className="flex flex-col items-center gap-6 pb-20">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onNextQuestion}
                        className="btn btn-primary relative group py-3 px-8 md:py-4 md:px-10 rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <div className="flex items-center gap-4 md:gap-6 relative z-10">
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-0.5">Coming up</span>
                                <span className="text-lg md:text-xl font-black italic uppercase tracking-wider">
                                    {isLastQuestion ? 'The Results' : 'Next Round'}
                                </span>
                            </div>
                            <div className="w-px h-6 bg-white/20" />
                            <div className="flex items-center gap-2">
                                <span className="text-xl md:text-2xl font-black font-mono tracking-tighter tabular-nums">{timeLeft}</span>
                                <span className="text-[10px] font-black uppercase opacity-40">S</span>
                            </div>
                            <Play fill="currentColor" size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
