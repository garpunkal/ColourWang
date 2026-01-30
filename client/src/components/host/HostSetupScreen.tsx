import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { Question } from '../../types/game';
import { motion } from 'framer-motion';
import { Logo } from '../Logo';
import { fetchQuestions } from '../../config/gameConfig';
import { useSocketConnection } from '../../hooks/useSocketConnection';
import { shuffleArray } from '../../utils/shuffleArray';

interface Props {
    socket: Socket;
}

export function HostSetupScreen({ socket }: Props) {
    const [rounds, setRounds] = useState(4);
    const [timer, setTimer] = useState(15);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isConnected = useSocketConnection(socket);

    useEffect(() => {
        setLoadingQuestions(true);
        fetchQuestions()
            .then((data) => {
                setAllQuestions(data);
                setLoadingQuestions(false);
            })
            .catch(() => {
                setError('Failed to load questions');
                setLoadingQuestions(false);
            });
    }, []);

    const createGame = () => {
        if (!allQuestions.length) return;
        // Use Fisher-Yates shuffle for proper randomization
        const shuffled = shuffleArray(allQuestions);
        const selectedQuestions = shuffled.slice(0, rounds);
        console.log('Client creating game with:', { questions: selectedQuestions, timer });
        socket.emit('create-game', { questions: selectedQuestions, timer });
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-12 overflow-y-auto">
            <Logo className="w-auto max-w-75 md:max-w-150 lg:max-w-200 mb-8 md:mb-12" />
            <div className="glass-card p-8 md:p-16 rounded-4xl md:rounded-[4rem] border-white/10 shadow-2xl max-w-4xl w-full mx-auto md:mx-8">
                <h2 className="text-4xl md:text-6xl font-black mb-8 md:mb-12 uppercase tracking-tight italic">Game Settings</h2>
                {loadingQuestions && <div className="text-2xl text-color-blue font-bold mb-8">Loading questions...</div>}
                {error && <div className="text-2xl text-error font-bold mb-8">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10 md:mb-16">
                    <div className="space-y-4 md:space-y-6 text-left">
                        <label className="text-xl md:text-2xl font-black uppercase tracking-widest text-text-muted ml-2">Total Rounds</label>
                        <div className="flex items-center gap-4 md:gap-6 bg-black/20 p-3 md:p-4 rounded-2xl md:rounded-3xl">
                            <input
                                type="range" min="4" max="20"
                                value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                                className="w-full h-3 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-blue"
                            />
                            <span className="text-3xl md:text-5xl font-mono font-black w-12 md:w-24 text-right">{rounds}</span>
                        </div>
                    </div>
                    <div className="space-y-4 md:space-y-6 text-left">
                        <label className="text-xl md:text-2xl font-black uppercase tracking-widest text-text-muted ml-2">Timer (Sec)</label>
                        <div className="flex items-center gap-4 md:gap-6 bg-black/20 p-3 md:p-4 rounded-2xl md:rounded-3xl">
                            <input
                                type="range" min="5" max="60" step="5"
                                value={timer} onChange={e => setTimer(parseInt(e.target.value))}
                                className="w-full h-3 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-pink"
                            />
                            <span className="text-3xl md:text-5xl font-mono font-black w-16 md:w-24 text-right">{timer}s</span>
                        </div>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={createGame}
                    className="btn btn-primary text-2xl md:text-5xl py-6 md:py-12 px-12 md:px-24 w-full rounded-3xl md:rounded-[3rem] shadow-[0_20px_60px_-10px_rgba(0,229,255,0.5)] uppercase font-black italic tracking-widest text-white border-t-4 md:border-t-8 border-white/20"
                    disabled={loadingQuestions || !!error || !allQuestions.length || !isConnected}
                >
                    {isConnected ? 'Initialise Lobby' : 'Connecting...'}
                </motion.button>
            </div>
        </div >
    );
}
