import type { Player, GameState } from '../../types/game';
import { motion } from 'framer-motion';
import { sortColors } from '../../config/gameConfig';
import { ColorCard } from '../ColorCard';
import { Check, X } from 'lucide-react';
import { getAvatarColor } from '../../constants/avatars';

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
                                    size="small"
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
                                    size="small"
                                    index={i}
                                    isCorrect={false}
                                    disabled={true}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* All Players Results */}
                <div className="glass p-4 md:p-5 rounded-4xl md:rounded-4xl border-white/10 space-y-3 mt-4 w-full">
                    <span className="text-xs uppercase tracking-[0.4em] text-white font-black italic opacity-60">All Players</span>
                    <div className="flex flex-col gap-2 mt-2">
                        {gameState.players
                            .sort((a, b) => b.score - a.score)
                            .map((p) => {
                                const playerColor = getAvatarColor(p.avatar);
                                return (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between px-3 py-2 rounded-2xl transition-all"
                                        style={{
                                            backgroundColor: p.isCorrect ? `rgba(34, 197, 94, 0.1)` : `rgba(239, 68, 68, 0.1)`,
                                            border: `1px solid ${p.isCorrect ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: playerColor }}
                                            />
                                            <span className="font-bold text-sm" style={{ color: playerColor }}>
                                                {p.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black ${p.isCorrect ? 'text-success' : 'text-error'}`}>
                                                {p.isCorrect ? '+10' : '+0'}
                                            </span>
                                            {p.isCorrect ? (
                                                <Check size={16} className="text-success" strokeWidth={3} />
                                            ) : (
                                                <X size={16} className="text-error" strokeWidth={3} />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
