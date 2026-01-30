import type { Player, GameState } from '../../types/game';
import { motion } from 'framer-motion';
import { sortColors } from '../../config/gameConfig';
import { ColorCard } from '../ColorCard';


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
            className="text-center flex flex-col items-center justify-center gap-6 w-full max-w-lg mx-auto px-2"
        >
            <div className="flex flex-col items-center gap-6 w-full py-2">
                <div className="space-y-2 md:space-y-3">
                    <h3 className={`text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg`}>{player.isCorrect ? 'CORRECT!' : 'INCORRECT!'}</h3>
                    <div className={`inline-block bg-linear-to-r ${player.isCorrect ? 'from-success/30 to-success/10 border-success/40' : 'from-error/30 to-error/10 border-error/40'} px-6 md:px-10 py-2 md:py-3 rounded-3xl md:rounded-[2.5rem] border-2 shadow-2xl backdrop-blur-lg`}>
                        <span className={`text-lg md:text-2xl font-black ${player.isCorrect ? 'text-success' : 'text-error'} tracking-[0.2em] italic`}>{player.isCorrect ? '+10 points' : '0 points'}</span>
                    </div>
                </div>

                <div className="w-full space-y-3">
                    {/* Player Selection */}
                    <div className="glass p-4 md:p-5 rounded-4xl md:rounded-4xl border-white/10 space-y-3 mt-6">
                        <span className="text-xs uppercase tracking-[0.4em] text-color-blue font-black italic opacity-60">Your Selection</span>
                        <div className="flex gap-2 md:gap-3 justify-center flex-wrap mt-2">
                            {lastAnswer.length > 0 ? lastAnswer.map((color, i) => (
                                <ColorCard
                                    key={i}
                                    color={color}
                                    size="mini"
                                    index={i}
                                    disabled={true}
                                />
                            )) : (
                                <span className="text-lg md:text-xl font-bold text-white/20 italic uppercase">Nothing selected</span>
                            )}
                        </div>
                    </div>

                    {/* Correct Answer */}
                    <div className="glass p-4 md:p-5 rounded-4xl md:rounded-4xl border-success/20 space-y-3 bg-success/5">
                        <span className="text-xs uppercase tracking-[0.4em] text-white font-black italic opacity-60">The Answer</span>
                        <div className="flex gap-2 md:gap-3 justify-center flex-wrap mt-2">
                            {correctColors.map((color, i) => (
                                <ColorCard
                                    key={i}
                                    color={color}
                                    size="mini"
                                    index={i}
                                    isCorrect={false}
                                    disabled={true}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
