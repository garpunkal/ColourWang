import type { Player, GameState } from '../../types/game';
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

                    <div className="space-y-4 md:space-y-6">
                        <h3 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg">CORRECT!</h3>
                        <div className="inline-block bg-linear-to-r from-success/30 to-success/10 px-8 md:px-14 py-4 md:py-6 rounded-3xl md:rounded-[2.5rem] border-2 border-success/40 shadow-2xl backdrop-blur-lg">
                            <span className="text-xl md:text-3xl font-black text-success tracking-[0.2em] italic">+10 points</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-10 w-full py-4">
                    <div className="space-y-4 md:space-y-6">
                        <h3 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg">INCORRECT!</h3>
                        <div className="inline-block bg-linear-to-r from-error/30 to-error/10 px-8 md:px-14 py-4 md:py-6 rounded-3xl md:rounded-[2.5rem] border-2 border-error/40 shadow-2xl backdrop-blur-lg">
                            <span className="text-xl md:text-3xl font-black text-error tracking-[0.2em] italic">0 points</span>
                        </div>
                    </div>

                    <div className="w-full space-y-6">

                        {/* Player Selection */}
                        <div className="glass p-6 md:p-8 rounded-4xl md:rounded-[3rem] border-white/10 space-y-6 mt-14">
                            <span className="text-xs uppercase tracking-[0.4em] text-color-blue font-black italic opacity-60">Your Selection</span>
                            <div className="flex gap-3 md:gap-4 justify-center flex-wrap mt-4">
                                {lastAnswer.length > 0 ? lastAnswer.map((color, i) => (
                                    <div
                                        key={i}
                                        className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl border-2 border-white/40 shadow-lg"
                                        style={{ backgroundColor: color }}
                                    />
                                )) : (
                                    <span className="text-xl md:text-2xl font-bold text-white/20 italic uppercase">Nothing selected</span>
                                )}
                            </div>
                        </div>

                        {/* Correct Answer */}
                        <div className="glass p-6 md:p-8 rounded-4xl md:rounded-[3rem] border-success/20 space-y-6 bg-success/5">
                            <span className="text-xs uppercase tracking-[0.4em] text-white font-black italic opacity-60">The Answer</span>
                            <div className="flex gap-3 md:gap-4 justify-center flex-wrap mt-4">
                                {correctColors.map((color, i) => (
                                    <div
                                        key={i}
                                        className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl border-2 border-success/40 shadow-lg"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </motion.div>
    );
}
