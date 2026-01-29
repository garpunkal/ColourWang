
import type { Question } from '../../types/game';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ColorCard } from '../ColorCard';
import { sortColors } from '../../config/gameConfig';


interface Props {
    currentQuestion: Question;
    currentQuestionIndex: number;
    totalQuestions: number;
    onNextQuestion: () => void;
}

export function HostResultScreen({ currentQuestion, currentQuestionIndex, totalQuestions, onNextQuestion }: Props) {
    const correctColors = sortColors(currentQuestion.correctAnswers || currentQuestion.correctColors);
    const [timeLeft, setTimeLeft] = useState(10);
    const [autoProceed, setAutoProceed] = useState(false);
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

    useEffect(() => {
        setTimeLeft(10);
        setAutoProceed(false);
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
            <div className="mb-8 md:mb-20">
                <h3 className="text-[clamp(3rem,8vw,8rem)] text-display mb-4 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    {currentQuestion.question}
                </h3>
                <div className="text-2xl md:text-5xl font-black bg-white/10 inline-block px-8 md:px-12 py-2 md:py-4 rounded-3xl md:rounded-4xl text-color-blue tracking-widest border border-white/10">
                    CORRECT ANSWER
                </div>
            </div>

            <div className="flex flex-col items-center gap-12 mb-6">
                <div className="flex justify-center gap-12 flex-wrap flex-row">
                    {correctColors.map((color, i) => (
                        <ColorCard
                            key={i}
                            color={color}
                            isCorrect={true}
                            size="medium"
                            index={i}
                        />
                    ))}
                </div>

                {currentQuestion.image && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-4 bg-linear-to-r from-color-blue to-color-pink blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                        <img
                            src={currentQuestion.image}
                            alt="Reference"
                            className="relative object-contain p-2 md:p-4 w-75"
                        />
                    </motion.div>
                )}
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
