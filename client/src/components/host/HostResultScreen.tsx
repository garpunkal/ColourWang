
import type { Question, GameState } from '../../types/game';
import { Play, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

import { ColorCard } from '../ColorCard';
import { sortColors } from '../../config/gameConfig';
import { getAvatarColor } from '../../constants/avatars';
import { Avatar } from '../GameAvatars';


interface Props {
    gameState: GameState;
    currentQuestion: Question;
    currentQuestionIndex: number;
    totalQuestions: number;
    onNextQuestion: () => void;
}

export function HostResultScreen({ gameState, currentQuestion, currentQuestionIndex, totalQuestions, onNextQuestion }: Props) {
    const correctColors = sortColors(currentQuestion.correctAnswers || currentQuestion.correctColors);
    const [timeLeft, setTimeLeft] = useState(10);
    const [autoProceed, setAutoProceed] = useState(false);
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    const sortedPlayers = useMemo(() => {
        return [...gameState.players].sort((a, b) => b.score - a.score);
    }, [gameState.players]);

    useEffect(() => {
        setTimeout(() => {
            setTimeLeft(10);
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
    }, [currentQuestion]);

    useEffect(() => {
        if (autoProceed) {
            onNextQuestion();
        }
    }, [autoProceed, onNextQuestion]);

    return (
        <motion.div
            key="result"
            initial={{ scale: 1.1, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            className="w-full max-w-7xl text-center"
        >
            <div className="mb-4">
                <h3 className="text-[clamp(2rem,5vw,4rem)] text-display mb-2 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    {currentQuestion.question}
                </h3>
                <div className="text-lg md:text-2xl font-black bg-white/10 inline-block px-4 md:px-6 py-1 md:py-2 rounded-2xl text-color-blue tracking-widest border border-white/10">
                    CORRECT ANSWER
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 mb-4">
                <div className="flex justify-center gap-6 flex-wrap flex-row">
                    {correctColors.map((color, i) => (
                        <ColorCard
                            key={i}
                            color={color}
                            isCorrect={true}
                            size="small"
                            index={i}
                        />
                    ))}
                </div>


            </div>

            {/* All Players Results */}
            <div className="mb-4">
                <div className="text-base md:text-xl font-black bg-white/10 inline-block px-4 md:px-6 py-1 md:py-2 rounded-xl md:rounded-2xl text-white tracking-wider border border-white/10 mb-3">
                    PLAYER RESULTS
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-w-6xl mx-auto">
                    {sortedPlayers.map((player) => {
                        const playerColor = getAvatarColor(player.avatar);
                        const playerAnswer = sortColors(player.lastAnswer || []);

                        return (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass p-2 rounded-2xl space-y-2"
                                style={{
                                    borderColor: player.isCorrect ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                                    backgroundColor: player.isCorrect ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                                }}
                            >
                                {/* Player header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                                            <Avatar seed={player.avatar} className="w-full h-full" />
                                        </div>
                                        <span className="font-black text-sm" style={{ color: playerColor }}>
                                            {player.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-black ${player.isCorrect ? 'text-success' : 'text-error'}`}>
                                            {player.isCorrect ? '+10' : '+0'}
                                        </span>
                                        {player.isCorrect ? (
                                            <Check size={14} className="text-success" strokeWidth={3} />
                                        ) : (
                                            <X size={14} className="text-error" strokeWidth={3} />
                                        )}
                                    </div>
                                </div>

                                {/* Player's answer */}
                                <div className="flex gap-1 justify-center flex-wrap">
                                    {playerAnswer.length > 0 ? playerAnswer.map((color, i) => (
                                        <ColorCard
                                            key={i}
                                            color={color}
                                            size="mini"
                                            index={i}
                                            disabled={true}
                                        />
                                    )) : (
                                        <span className="text-xs text-white/30 italic">No answer</span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 mt-8">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={onNextQuestion}
                    className="btn btn-primary mt-2 justify-self-center text-2xl md:text-5xl py-6 md:py-10 px-12 md:px-32 rounded-4xl md:rounded-[3.5rem] shadow-2xl uppercase font-black italic tracking-widest border-t-4 md:border-t-8 border-white/20 flex items-center gap-6"
                >
                    {isLastQuestion ? 'Show Results' : 'Next Question'}
                    <span className="ml-4 text-color-blue font-black tabular-nums text-3xl md:text-5xl">{timeLeft}s</span>
                    <Play fill="currentColor" className="inline-block ml-4 md:ml-6 w-8 h-8 md:w-12 md:h-12" />
                </motion.button>
            </div>
        </motion.div>
    );
}
