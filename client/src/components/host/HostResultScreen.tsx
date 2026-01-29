import type { Question } from '../../types/game';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { ColorCard } from '../ColorCard';
import { sortColors } from '../../config/gameConfig';

interface Props {
    currentQuestion: Question;
    onNextQuestion: () => void;
}

export function HostResultScreen({ currentQuestion, onNextQuestion }: Props) {
    const correctColors = sortColors(currentQuestion.correctAnswers || currentQuestion.correctColors);

    return (
        <motion.div
            key="result"
            initial={{ scale: 1.1, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            className="w-full max-w-7xl text-center"
        >
            <div className="mb-8 md:mb-20">
                <h3 className="text-[clamp(3rem,8vw,8rem)] font-black uppercase italic tracking-tighter mb-4 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    Phase Complete
                </h3>
                <div className="text-2xl md:text-5xl font-black bg-white/10 inline-block px-8 md:px-12 py-2 md:py-4 rounded-[1.5rem] md:rounded-[2rem] text-color-blue tracking-widest border border-white/10">
                    CORRECT ANSWER
                </div>
            </div>

            <div className="flex flex-col items-center gap-12 mb-20">
                {currentQuestion.image && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="relative group h-[200px] md:h-[300px] lg:h-[400px]"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-color-blue to-color-pink blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                        <img
                            src={currentQuestion.image}
                            alt="Reference"
                            className="relative h-full object-contain rounded-[1.5rem] md:rounded-[2rem] border-2 md:border-4 border-white/20 shadow-2xl bg-black/20 p-2 md:p-4"
                        />
                    </motion.div>
                )}

                <div className="flex justify-center gap-12 flex-wrap flex-row">
                    {correctColors.map((color, i) => (
                        <ColorCard
                            key={i}
                            color={color}
                            isCorrect={true}
                            size="large"
                            index={i}
                        />
                    ))}
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={onNextQuestion}
                className="btn btn-primary text-2xl md:text-5xl py-6 md:py-10 px-12 md:px-32 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl uppercase font-black italic tracking-widest border-t-4 md:border-t-8 border-white/20"
            >
                Next Phase <Play fill="currentColor" className="inline-block ml-4 md:ml-6 w-8 h-8 md:w-12 md:h-12" />
            </motion.button>
        </motion.div>
    );
}
