import type { Player, GameState, Question } from '../../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { sortColors } from '../../config/gameConfig';
import { ColorCard } from '../ColorCard';
import { Check, X, Timer, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { audioManager } from '../../utils/audioManager';

interface Props {
    player: Player;
    gameState: GameState;
    currentQuestion?: Question;
}

export function PlayerResultScreen({ player, gameState, currentQuestion }: Props) {
    const question = currentQuestion || gameState.questions[gameState.currentQuestionIndex];
    const [timeLeft, setTimeLeft] = useState(gameState.resultDuration || 30);

    const isCorrect = player.isCorrect;
    const themeColorHex = isCorrect ? '#22c55e' : '#ef4444';

    useEffect(() => {
        // Play success sound if correct
        if (isCorrect) {
            audioManager.playSuccess();
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [isCorrect]);

    // Debug render
    if (typeof window !== 'undefined') {
        console.log('[DEBUG] PlayerResultScreen mounting', { playerId: player.id, isCorrect, questionId: question?.id });
    }

    if (!question) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <h2 className="text-2xl font-bold text-white mb-2">Loading results...</h2>
                <p className="text-white/60">Waiting for data...</p>
            </div>
        );
    }

    const rawCorrectColors = question.correctAnswers || question.correctColors || [];
    const correctColors = sortColors(rawCorrectColors);
    const lastAnswerRaw = player.lastAnswer || [];
    const lastAnswer = sortColors(lastAnswerRaw);

    return (
        <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-start w-full max-w-lg mx-auto overflow-hidden relative pt-4 md:pt-6 gap-3 px-4"
        >
            {/* Dynamic Background */}
            <div
                className="fixed inset-0 blur-[150px] opacity-30 pointer-events-none -z-10 transition-colors duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${themeColorHex}, transparent 70%)`
                }}
            />

            {/* Status Header */}
            <div className="w-full flex flex-col items-center z-10 shrink-0">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-2">
                        <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-md ${isCorrect ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500'}`}
                        >
                            {isCorrect ? (
                                <Check size={32} className="text-green-400 stroke-3" />
                            ) : (
                                <X size={32} className="text-red-400 stroke-3" />
                            )}
                        </div>
                    </div>

                    <h3
                        className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-2"
                        style={{
                            color: 'white',
                            textShadow: `0 0 30px ${themeColorHex}`
                        }}
                    >
                        {isCorrect ? 'Correct!' : 'Wrong!'}
                    </h3>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-sm ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                    >
                        <span className={`text-xs font-black tracking-widest uppercase ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? `+${player.roundScore} Points` : '0 Points'}
                        </span>
                    </motion.div>
                </motion.div>

                {/* Bonus Pills */}
                <AnimatePresence>
                    {(player.streakPoints > 0 || player.fastestFingerPoints > 0) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="flex flex-wrap gap-2 justify-center mt-3"
                        >
                            {player.streakPoints > 0 && (
                                <div className="flex items-center gap-1.5 bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">🔥 Streak +{player.streakPoints}</span>
                                </div>
                            )}
                            {player.fastestFingerPoints > 0 && (
                                <div className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-0.5 rounded-lg border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wider">⚡ Speed +{player.fastestFingerPoints}</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Answer Comparison */}
            <div className="w-full flex-1 flex flex-col justify-start gap-2 py-2 max-w-sm min-h-0 overflow-y-auto">
                {/* Your Answer */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-3 rounded-2xl border-white/5 bg-black/20 shrink-0"
                >
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-2 pl-1">Your Answer</span>
                    <div className="flex gap-1.5 flex-wrap items-center">
                        {lastAnswer.length > 0 ? lastAnswer.map((color, i) => (
                            <ColorCard
                                key={`me-${i}`}
                                color={color}
                                size="mini"
                                index={i}
                                disabled={true}
                                showLabel={gameState.accessibleLabels}
                            />
                        )) : (
                            <span className="text-xs font-bold text-white/20 italic">No Answer</span>
                        )}
                    </div>
                </motion.div>

                {/* Connector */}
                <div className="flex justify-center -my-1 opacity-20 shrink-0">
                    <ArrowDown size={16} className="text-white" />
                </div>

                {/* Correct Answer */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-panel p-3 rounded-2xl border-green-500/20 bg-green-500/5 relative overflow-hidden shrink-0"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-xl rounded-full -translate-y-1/2 translate-x-1/2" />
                    <span className="text-[10px] font-black text-green-500/60 uppercase tracking-[0.2em] block mb-2 pl-1">Correct Answer</span>
                    <div className="flex gap-1.5 flex-wrap items-center">
                        {correctColors.map((color, i) => (
                            <ColorCard
                                key={`correct-${i}`}
                                color={color}
                                size="mini"
                                index={i}
                                disabled={true}
                                showLabel={gameState.accessibleLabels}
                                isCorrect={true}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Timer Footer */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full mb-6"
            >
                <div className="mx-auto max-w-xs bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${timeLeft <= 5 ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}>
                            <Timer size={18} />
                        </div>
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Next Round</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono tabular-nums text-white">
                            {timeLeft}
                        </span>
                        <span className="text-[10px] font-bold text-white/30">s</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
