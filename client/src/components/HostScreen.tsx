import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { Users, Play, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Logo } from './Logo';
import { Avatar } from './GameAvatars';

import { QUESTIONS } from '../config/gameConfig';

interface Props {
    socket: Socket;
    gameState: GameState | null;
}

export default function HostScreen({ socket, gameState }: Props) {
    const [rounds, setRounds] = useState(4);
    const [timer, setTimer] = useState(15);
    const [timeLeft, setTimeLeft] = useState(15);

    const createGame = () => {
        // Shuffle and slice questions
        const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, rounds);
        console.log('Client creating game with:', { questions: selectedQuestions, timer });
        socket.emit('create-game', { questions: selectedQuestions, timer });
    };

    const startGame = () => {
        if (gameState) {
            socket.emit('start-game', gameState.code);
        }
    };

    const nextQuestion = () => {
        if (gameState) {
            socket.emit('next-question', gameState.code);
        }
    };

    useEffect(() => {
        if (gameState?.status === 'RESULT') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#00e5ff', '#9d50bb', '#f83a7b', '#ff9d00']
            });
        }
    }, [gameState?.status]);

    useEffect(() => {
        if (gameState?.status === 'QUESTION' && gameState.timerDuration) {
            setTimeLeft(gameState.timerDuration);
            const interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (gameState) {
                            socket.emit('time-up', gameState.code);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [gameState?.status, gameState?.currentQuestionIndex]);

    if (!gameState) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 overflow-hidden bg-background">
                <Logo className="w-[800px] mb-12" />
                <div className="glass p-16 rounded-[4rem] border-white/10 shadow-2xl max-w-4xl w-full mx-8">
                    <h2 className="text-6xl font-black mb-12 uppercase tracking-tight italic">Mission Control</h2>
                    <div className="grid grid-cols-2 gap-12 mb-16">
                        <div className="space-y-6 text-left">
                            <label className="text-2xl font-black uppercase tracking-widest text-text-muted ml-2">Total Rounds</label>
                            <div className="flex items-center gap-6 bg-black/20 p-4 rounded-3xl">
                                <input
                                    type="range" min="1" max="10"
                                    value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                                    className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-blue"
                                />
                                <span className="text-5xl font-mono font-black w-24 text-right">{rounds}</span>
                            </div>
                        </div>
                        <div className="space-y-6 text-left">
                            <label className="text-2xl font-black uppercase tracking-widest text-text-muted ml-2">Timer (Sec)</label>
                            <div className="flex items-center gap-6 bg-black/20 p-4 rounded-3xl">
                                <input
                                    type="range" min="5" max="60" step="5"
                                    value={timer} onChange={e => setTimer(parseInt(e.target.value))}
                                    className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-pink"
                                />
                                <span className="text-5xl font-mono font-black w-24 text-right">{timer}s</span>
                            </div>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={createGame}
                        className="btn btn-primary text-5xl py-12 px-24 w-full rounded-[3rem] shadow-[0_20px_60px_-10px_rgba(0,229,255,0.5)] uppercase font-black italic tracking-widest text-white border-t-8 border-white/20"
                    >
                        Initialize Lobby
                    </motion.button>
                </div>
            </div>
        );
    }

    const { code, players, status, currentQuestionIndex, questions } = gameState;

    // Safety check for questions
    if ((status === 'QUESTION' || status === 'RESULT') && (!questions || !questions[currentQuestionIndex])) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Synchronizing Neural Network...</h2>
                <p className="text-xl text-white/60">Phase Data: {currentQuestionIndex + 1}/{questions?.length || 0}</p>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const joinUrl = `${window.location.origin}?code=${code}`;

    return (
        <div className="flex-1 flex flex-col p-12 overflow-hidden relative w-full h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-8 bg-black/30 backdrop-blur-md p-6 pr-12 rounded-[3rem] border border-white/10 shadow-2xl">
                    <div className="bg-white p-4 rounded-3xl">
                        <QRCodeSVG value={joinUrl} size={140} level="H" includeMargin={false} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="text-2xl font-black uppercase tracking-[0.4em] text-text-muted">Join Code</div>
                        <div className="!text-[56px] font-mono font-black tracking-[0.2em] text-white leading-none glow-text">{code}</div>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <Logo className="w-96 mb-2" />
                    <div className="flex items-center gap-6 px-8 py-4 bg-black/30 rounded-full border border-white/5 backdrop-blur-sm">
                        <Users size={40} className="text-color-blue" />
                        <span className="text-5xl font-black font-mono">{players.length}</span>
                        <span className="text-xl font-bold uppercase tracking-widest text-text-muted">Connected</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full">
                <AnimatePresence mode="wait">
                    {status === 'LOBBY' && (
                        <motion.div
                            key="lobby"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                            className="w-full max-w-[90vw] flex flex-col items-center"
                        >
                            <h2 className="text-[8rem] font-black mb-16 tracking-tighter leading-[0.85] text-center drop-shadow-2xl">
                                <span className="block text-4xl mb-4 italic uppercase tracking-[0.6em] text-color-blue font-bold opacity-80">Awaiting Challengers</span>
                                <span className="bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">PREPARE FOR<br /></span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-color-blue via-color-purple to-color-pink pulse-glow italic">CARNAGE</span>
                            </h2>

                            {players.length === 0 ? (
                                <div className="text-4xl text-text-muted animate-pulse font-mono tracking-widest uppercase border-2 border-dashed border-white/10 px-12 py-8 rounded-[2rem]">
                                    Scanning Frequency...
                                </div>
                            ) : (
                                <div className="grid grid-cols-5 gap-8 w-full mb-16 px-12 place-items-center">
                                    {players.map((player, i) => (
                                        <motion.div
                                            key={player.id}
                                            initial={{ scale: 0, y: 50 }}
                                            animate={{ scale: 1, y: 0 }}
                                            transition={{ type: "spring", delay: i * 0.1 }}
                                            className="glass p-6 rounded-[2.5rem] flex flex-col items-center gap-4 border-white/10 bg-white/5 shadow-xl w-full"
                                        >
                                            <div className="w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-2xl flex items-center justify-center shadow-inner border border-white/10 overflow-hidden">
                                                <Avatar seed={player.avatar} className="w-full h-full" />
                                            </div>
                                            <span className="text-3xl font-black truncate text-white tracking-tight text-center w-full">{player.name}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {players.length > 0 && (
                                <motion.button
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={startGame}
                                    className="btn btn-primary text-6xl py-10 px-32 rounded-[3.5rem] shadow-[0_0_80px_rgba(0,229,255,0.4)] uppercase font-black italic tracking-widest border-t-8 border-white/20 animate-pulse-slow"
                                >
                                    Initiate Sequence
                                </motion.button>
                            )}
                        </motion.div>
                    )}

                    {status === 'QUESTION' && (
                        <motion.div
                            key="question"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            className="w-full max-w-[90rem] text-center"
                        >
                            <div className="flex justify-center mb-16">
                                <div className="bg-black/40 backdrop-blur-xl px-12 py-6 rounded-full border border-white/10 flex items-center gap-8 shadow-2xl">
                                    <span className="text-3xl font-black uppercase tracking-[0.4em] text-color-blue">Phase {currentQuestionIndex + 1}</span>
                                    <div className="w-[1px] h-12 bg-white/10" />
                                    <span className={`text-6xl font-mono font-black ${timeLeft <= 5 ? 'text-error animate-ping' : 'text-white'}`}>
                                        00:{timeLeft.toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-[7rem] font-black leading-[0.9] mb-24 uppercase italic tracking-tighter drop-shadow-2xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent px-8">
                                {currentQuestion.question}
                            </h3>

                            <div className="grid grid-cols-2 gap-12 px-12">
                                {currentQuestion.options.map((color, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="h-48 rounded-[3rem] border-8 border-white/10 shadow-2xl relative overflow-hidden group"
                                        style={{ backgroundColor: color }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {status === 'RESULT' && (
                        <motion.div
                            key="result"
                            initial={{ scale: 1.1, opacity: 0, filter: "blur(20px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            className="w-full max-w-7xl text-center"
                        >
                            <div className="mb-20">
                                <h3 className="text-[8rem] font-black uppercase italic tracking-tighter mb-4 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                                    Phase Complete
                                </h3>
                                <div className="text-5xl font-black bg-white/10 inline-block px-12 py-4 rounded-[2rem] text-color-blue tracking-widest border border-white/10">
                                    CORRECT ANSWER
                                </div>
                            </div>

                            <div className="flex justify-center gap-12 mb-20">
                                {(currentQuestion.correctAnswers || currentQuestion.correctColors).map((color, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", bounce: 0.5, delay: 0.2 + (i * 0.1) }}
                                        className="w-80 h-80 rounded-[4rem] border-[12px] border-white/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative flex items-center justify-center ring-4 ring-white/10"
                                        style={{ backgroundColor: color }}
                                    >
                                        <div className="absolute inset-0 bg-grad-to-br from-white/30 to-transparent rounded-[3rem]" />
                                        <Check size={120} strokeWidth={8} className="text-white drop-shadow-lg relative z-10" />
                                    </motion.div>
                                ))}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={nextQuestion}
                                className="btn btn-primary text-5xl py-10 px-32 rounded-[3.5rem] shadow-2xl uppercase font-black italic tracking-widest border-t-8 border-white/20"
                            >
                                Next Phase <Play fill="currentColor" className="inline-block ml-6 w-12 h-12" />
                            </motion.button>
                        </motion.div>
                    )}

                    {status === 'FINAL_SCORE' && (
                        <motion.div
                            key="final"
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-full max-w-7xl"
                        >
                            <div className="text-center mb-20">
                                <Logo className="w-[500px] mx-auto mb-10" />
                                <h3 className="text-[10rem] font-black uppercase italic tracking-tighter leading-none bg-gradient-to-b from-color-gold via-color-orange to-color-pink bg-clip-text text-transparent drop-shadow-2xl">
                                    CHAMPIONS
                                </h3>
                            </div>

                            <div className="flex flex-col gap-6">
                                {players.sort((a, b) => b.score - a.score).slice(0, 5).map((player, i) => (
                                    <motion.div
                                        key={player.id}
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`glass p-8 rounded-[3rem] flex items-center justify-between border-white/10 ${i === 0 ? 'bg-gradient-to-r from-color-gold/20 to-transparent border-color-gold/30 scale-105 shadow-[0_0_60px_rgba(255,215,0,0.2)]' : ''}`}
                                    >
                                        <div className="flex items-center gap-10 pl-8">
                                            <span className={`text-6xl font-black font-mono w-24 ${i === 0 ? 'text-color-gold' : 'text-text-muted'}`}>#{i + 1}</span>
                                            <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center border-4 border-white/10 shadow-lg ${i === 0 ? 'bg-color-gold text-black' : 'bg-white/5'} overflow-hidden`}>
                                                <Avatar seed={player.avatar} className="w-full h-full" />
                                            </div>
                                            <span className={`text-6xl font-black uppercase italic tracking-tight ${i === 0 ? 'text-white' : 'text-white/80'}`}>{player.name}</span>
                                        </div>
                                        <div className="pr-12">
                                            <span className={`text-7xl font-mono font-black ${i === 0 ? 'text-color-gold glow-text' : 'text-white/60'}`}>{player.score}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="text-center mt-20">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => socket.emit('create-game', { rounds, timer })}
                                    className="btn btn-secondary text-4xl py-8 px-20 rounded-[2.5rem] opacity-80 hover:opacity-100"
                                >
                                    Re-Initialize System
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Add custom color for gold if not present
const style = document.createElement('style');
style.textContent = `
    .text-color-gold { color: #ffd700; }
    .border-color-gold\/30 { border-color: rgba(255, 215, 0, 0.3); }
    .from-color-gold { --tw-gradient-from: #ffd700; }
    .from-color-gold\/20 { --tw-gradient-from: rgba(255, 215, 0, 0.2); }
`;
document.head.appendChild(style);
