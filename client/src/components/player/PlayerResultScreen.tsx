import type { Player, GameState, Question } from '../../types/game';
import { motion } from 'framer-motion';
import { sortColors } from '../../config/gameConfig';
import { ColorCard } from '../ColorCard';
import { ChevronDown } from 'lucide-react';

interface Props {
    player: Player;
    gameState: GameState;
    currentQuestion?: Question;
}

export function PlayerResultScreen({ player, gameState, currentQuestion }: Props) {
    const question = currentQuestion || gameState.questions[gameState.currentQuestionIndex];

    // Debug render
    if (typeof window !== 'undefined') {
        console.log('[DEBUG] PlayerResultScreen mounting', { playerId: player.id, isCorrect: player.isCorrect, questionId: question?.id });
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

    const themeColor = player.isCorrect ? 'var(--color-success)' : 'var(--color-error)';

    return (
        <motion.div
            key="result"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-start w-full max-w-lg mx-auto overflow-hidden relative pt-4 md:pt-8 gap-8"
        >
            {/* Background Glow */}
            <div
                className="absolute inset-x-0 top-1/4 h-64 blur-[120px] opacity-20 transition-all duration-1000"
                style={{ backgroundColor: themeColor }}
            />

            <div className="relative z-10 w-full flex flex-col items-center gap-10">
                {/* Status Header */}
                <div className="flex flex-col items-center gap-3">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-center"
                    >
                        <h3
                            className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none"
                            style={{
                                color: 'white',
                                textShadow: `0 0 30px ${themeColor}`
                            }}
                        >
                            {player.isCorrect ? 'CORRECT' : 'WRONG'}
                        </h3>
                        <div
                            className="mt-2 inline-block px-4 py-1 rounded-full text-xs font-black tracking-[0.4em] uppercase opacity-60"
                            style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                        >
                            {player.isCorrect ? '+10 POINTS' : '0 POINTS'}
                        </div>
                    </motion.div>
                </div>

                {/* Comparison Section */}
                <div className="w-full space-y-6">
                    {/* Player Selection */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="glass-panel p-6 rounded-4xl border-white/10 relative overflow-hidden"
                    >                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: themeColor }} />
                        <span className="text-[14px] uppercase tracking-[0.4em] text-white/40 font-black italic block mb-4">Your answer</span>
                        <div className="flex gap-2 justify-center flex-wrap">
                            {lastAnswer.length > 0 ? lastAnswer.map((color, i) => (
                                <ColorCard
                                    key={`me-${i}`}
                                    color={color}
                                    size="mini"
                                    index={i}
                                    disabled={true}
                                />
                            )) : (
                                <span className="text-[14px] font-black text-white/20 uppercase tracking-widest italic my-4">No answer given</span>
                            )}
                        </div>
                    </motion.div>

                    {/* Transition Arrow - subtle */}
                    <div className="flex justify-center -my-2 relative z-20">
                        <div className="bg-background border border-white/10 p-2 rounded-full shadow-xl">
                            <ChevronDown size={20} className="text-white/40" />
                        </div>
                    </div>

                    {/* Correct Answer */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="glass-panel p-6 rounded-4xl border-success/20 bg-success/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-1 h-full bg-success" />
                        <span className="text-[14px] uppercase tracking-[0.4em] text-success font-black italic block mb-4 text-right">The answer</span>
                        <div className="flex gap-2 justify-center flex-wrap">
                            {correctColors.map((color, i) => (
                                <ColorCard
                                    key={`correct-${i}`}
                                    color={color}
                                    size="mini"
                                    index={i}
                                    disabled={true}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 1.2 }}
                    className="text-[10px] font-bold uppercase tracking-[0.5em] italic pb-10"
                >
                    Awaiting next round...
                </motion.p>
            </div>
        </motion.div>
    );
}
