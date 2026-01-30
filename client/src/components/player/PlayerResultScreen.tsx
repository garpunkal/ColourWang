import type { Player, GameState } from '../../types/game';
import { motion } from 'framer-motion';
import { sortColors } from '../../config/gameConfig';
import { ColorCard } from '../ColorCard';
import { ChevronDown } from 'lucide-react';

interface Props {
    player: Player;
    gameState: GameState;
}

export function PlayerResultScreen({ player, gameState }: Props) {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const rawCorrectColors = currentQuestion.correctAnswers || currentQuestion.correctColors;
    const correctColors = sortColors(rawCorrectColors);
    const lastAnswer = sortColors(player.lastAnswer || []);

    const themeColor = player.isCorrect ? 'var(--color-success)' : 'var(--color-error)';

    return (
        <motion.div
            key="result"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center w-full max-w-lg mx-auto overflow-hidden min-h-[70vh] relative"
        >
            {/* Background Glow */}
            <div
                className="absolute inset-x-0 top-1/4 h-64 blur-[120px] opacity-20 transition-all duration-1000"
                style={{ backgroundColor: themeColor }}
            />

            <div className="relative z-10 w-full flex flex-col items-center gap-8">
                {/* Comparison Section */}
                <div className="w-full space-y-4">
                    {/* Player Selection */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-4 rounded-3xl border-white/10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: themeColor }} />
                        <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-black italic block mb-3">Your Data</span>
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
                                <span className="text-sm font-black text-white/20 uppercase tracking-widest italic my-2">No signal detected</span>
                            )}
                        </div>
                    </motion.div>

                    {/* Transition Arrow - subtle */}
                    <div className="flex justify-center -my-1 relative z-20">
                        <ChevronDown size={16} className="text-white/20" />
                    </div>

                    {/* Correct Answer */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-4 rounded-3xl border-success/20 bg-success/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-1 h-full bg-success" />
                        <span className="text-[10px] uppercase tracking-[0.4em] text-success font-black italic block mb-3 text-right">The Target</span>
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

                {/* Status Header */}
                <div className="flex flex-col items-center gap-2">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center"
                    >
                        <h3
                            className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none"
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

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 1.2 }}
                    className="text-[10px] font-bold uppercase tracking-[0.5em] italic"
                >
                    Awaiting next round signal...
                </motion.p>
            </div>
        </motion.div>
    );
}
