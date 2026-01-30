import type { Question } from '../../types/game';
import { motion } from 'framer-motion';

interface Props {
    currentQuestion: Question;
    currentQuestionIndex: number;
    timeLeft: number;
}

export function HostQuestionScreen({ currentQuestion, currentQuestionIndex, timeLeft }: Props) {
    return (
        <motion.div
            key="question"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-360 text-center"
        >
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-16">
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="glass-panel px-8 md:px-16 py-4 md:py-8 rounded-4xl md:rounded-[3rem] flex items-center gap-6 md:gap-12"
                >
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-xl font-black uppercase tracking-[0.5em] text-color-blue/60 mb-2 italic">Question</span>
                        <span className="text-6xl font-black italic tracking-tighter">0{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="w-0.5 h-20 bg-white/10 mx-4" />
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-xl font-black uppercase tracking-[0.5em] text-color-blue mb-2 italic">Remaining</span>
                        <span className={`text-6xl font-black tabular-nums italic tracking-tighter ${timeLeft <= 5 ? 'text-error' : 'text-white'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </motion.div>

                <motion.h3
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="text-[clamp(3rem,8vw,8rem)] text-display text-display-gradient mb-0 drop-shadow-[0_40px_100px_rgba(0,0,0,0.9)] px-8 max-w-[98vw] text-center"
                >
                    {currentQuestion.question}
                </motion.h3>
            </div>
        </motion.div>
    );
}
