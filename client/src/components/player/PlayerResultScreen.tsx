import type { Player, GameState, Question } from '../../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { sortColors } from '../../config/gameConfig';
import { ColorCard } from '../ColorCard';
import { Check, X, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';

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

    // Timer logic
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState.currentQuestionIndex]);

    if (!question) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <h2 className="text-2xl font-bold text-white mb-2">Loading results...</h2>
                <p className="text-white/60">Waiting for data...</p>
            </div>
        );
    }

    const rawCorrectColours = question.correctAnswers || question.correctColours || [];
    const correctColours = sortColors(rawCorrectColours);
    const lastAnswerRaw = player.lastAnswer || [];
    const lastAnswer = sortColors(lastAnswerRaw);

    return (
        <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative min-h-screen w-full overflow-hidden"
        >
            <motion.div
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.85 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 50% 35%, ${themeColorHex}88 0%, rgba(10,12,16,0.98) 62%)`
                }}
            />
            <motion.div
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.1, ease: [0.2, 0.65, 0.2, 1] }}
                className="pointer-events-none absolute left-1/2 top-[34%] h-56 w-56 -translate-x-1/2 rounded-full border"
                style={{ borderColor: `${themeColorHex}aa` }}
            />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 pb-28 pt-10 md:px-8 md:pt-14">
                <div className="w-full max-w-2xl text-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: -30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-[0_0_50px_rgba(0,0,0,0.45)] backdrop-blur-md md:h-24 md:w-24"
                        style={{
                            borderColor: themeColorHex,
                            background: `${themeColorHex}33`
                        }}
                    >
                        {isCorrect ? (
                            <Check size={44} className="text-green-300 stroke-3 md:h-12 md:w-12" />
                        ) : (
                            <X size={44} className="text-red-300 stroke-3 md:h-12 md:w-12" />
                        )}
                    </motion.div>

                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mb-3 text-5xl font-black uppercase italic leading-none tracking-tight text-white md:text-7xl"
                        style={{ textShadow: `0 0 40px ${themeColorHex}` }}
                    >
                        {isCorrect ? 'Correct!' : 'Wrong!'}
                    </motion.h2>

                    <motion.div
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.16 }}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm"
                        style={{ borderColor: `${themeColorHex}66`, background: `${themeColorHex}22` }}
                    >
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90 md:text-sm">
                            {isCorrect ? `+${player.roundScore || 0} Points` : '0 Points'}
                        </span>
                    </motion.div>

                    <AnimatePresence>
                        {(player.streakPoints > 0 || player.fastestFingerPoints > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 flex flex-wrap justify-center gap-2"
                            >
                                {player.streakPoints > 0 && (
                                    <div className="rounded-lg border border-orange-400/40 bg-orange-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-200">
                                        Streak +{player.streakPoints}
                                    </div>
                                )}
                                {player.fastestFingerPoints > 0 && (
                                    <div className="rounded-lg border border-yellow-300/40 bg-yellow-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-100">
                                        Speed +{player.fastestFingerPoints}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 }}
                    className="grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
                >
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
                        <span className="mb-2 block pl-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Your Answer</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {lastAnswer.length > 0 ? lastAnswer.map((color, i) => (
                                <ColorCard
                                    key={`me-${i}`}
                                    color={color}
                                    size="mini"
                                    index={i}
                                    disabled={true}
                                />
                            )) : (
                                <span className="text-xs font-bold italic text-white/30">No Answer</span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
                        <span className="mb-2 block pl-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Correct Answer</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {correctColours.map((color, i) => (
                                <ColorCard
                                    key={`correct-${i}`}
                                    color={color}
                                    size="mini"
                                    index={i}
                                    disabled={true}
                                    isCorrect={true}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="absolute inset-x-0 bottom-6 z-20 px-4"
            >
                <div className="mx-auto flex w-full max-w-sm items-center justify-between rounded-2xl border border-white/15 bg-black/40 p-3 backdrop-blur-lg">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${timeLeft <= 5 ? 'bg-red-500/25 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            <Timer size={18} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">
                            {gameState.currentQuestionIndex === gameState.questions.length - 1 ? 'Final Results' : 'Next Round'}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="font-mono text-2xl font-black tabular-nums text-white">{timeLeft}</span>
                        <span className="text-[10px] font-bold text-white/35">s</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
