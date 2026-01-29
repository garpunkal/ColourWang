import type { Player, GameState } from '../../types/game';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { sortColors } from '../../config/gameConfig';

interface Props {
    player: Player;
    gameState: GameState;
}

export function PlayerResultScreen({ player, gameState }: Props) {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const rawCorrectColors = currentQuestion.correctAnswers || currentQuestion.correctColors;
    const correctColors = sortColors(rawCorrectColors);
    const lastAnswer = sortColors(player.lastAnswer || []);

    return (
        <motion.div
            key="result"
            initial={{ scale: 0.8, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="text-center flex flex-col items-center justify-center gap-12 w-full max-w-lg mx-auto"
        >
            {player.isCorrect ? (
                <div className="flex flex-col items-center gap-12 w-full">
                    <div className="relative">
                        <motion.div
                            animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-success/50 blur-[60px] md:blur-[80px] rounded-full"
                        />
                        <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 10, stiffness: 100 }}
                            className="bg-success p-10 md:p-16 rounded-[2.5rem] md:rounded-[4.5rem] relative z-10 shadow-[0_50px_100px_-20px_rgba(0,255,170,0.5)] border-t-4 md:border-t-8 border-white/30"
                        >
                            <Check size={80} md-size={120} className="w-20 h-20 md:w-32 md:h-32 text-white drop-shadow-2xl" strokeWidth={8} />
                        </motion.div>
                    </div>
                    <div className="space-y-4 md:space-y-6">
                        <h3 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg">ELITE WORK!</h3>
                        <div className="inline-block bg-gradient-to-r from-success/30 to-success/10 px-8 md:px-14 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-success/40 shadow-2xl backdrop-blur-lg">
                            <span className="text-xl md:text-3xl font-black text-success tracking-[0.2em] italic">+10 XP GAINED</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-10 w-full py-8">
                    <div className="bg-error/10 p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] border-4 border-error/20 shadow-inner backdrop-blur-md relative">
                        <X size={64} md-size={100} className="w-16 h-16 md:w-24 md:h-24 text-error/40" strokeWidth={8} />
                        <h3 className="absolute -bottom-4 md:-bottom-6 left-1/2 -translate-x-1/2 text-3xl md:text-5xl font-black text-error uppercase tracking-tighter italic leading-none drop-shadow-xl w-full">FAILED</h3>
                    </div>

                    <div className="w-full space-y-10">
                        {/* Player Selection */}
                        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-white/10 space-y-4">
                            <span className="text-xs uppercase tracking-[0.4em] text-color-blue font-black italic opacity-60">Your Selection</span>
                            <div className="flex gap-3 md:gap-4 justify-center flex-wrap">
                                {lastAnswer.length > 0 ? lastAnswer.map((color, i) => (
                                    <div
                                        key={i}
                                        className="w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.5rem] border-2 border-white/40 shadow-lg"
                                        style={{ backgroundColor: color }}
                                    />
                                )) : (
                                    <span className="text-xl md:text-2xl font-bold text-white/20 italic uppercase">Neural Silence</span>
                                )}
                            </div>
                        </div>

                        {/* Correct Answer */}
                        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-success/20 space-y-4 bg-success/5">
                            <span className="text-xs uppercase tracking-[0.4em] text-success font-black italic opacity-60">Correct Pattern</span>
                            <div className="flex gap-3 md:gap-4 justify-center flex-wrap">
                                {correctColors.map((color, i) => (
                                    <div
                                        key={i}
                                        className="w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.5rem] border-2 border-success/40 shadow-lg"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-xl font-bold text-text-muted italic leading-relaxed opacity-40">The pattern remains elusive...</p>
                </div>
            )}
        </motion.div>
    );
}
