import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { Check, X, Send, Hash, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { Avatar } from './GameAvatars';
import { AVATAR_IDS } from '../constants/avatars';

interface Props {
    socket: Socket;
    gameState: GameState | null;
    setGameState: (state: GameState | null) => void;
}

export default function PlayerScreen({ socket, gameState, setGameState }: Props) {
    const [name, setName] = useState(localStorage.getItem('playerName') || '');
    const [avatar, setAvatar] = useState(localStorage.getItem('playerAvatar') || AVATAR_IDS[0]);
    const [code, setCode] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('code')?.toUpperCase() || '';
    });
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [hasAnswered, setHasAnswered] = useState(false);

    useEffect(() => {
        if (name) localStorage.setItem('playerName', name);
        if (avatar) localStorage.setItem('playerAvatar', avatar);
    }, [name, avatar]);

    // Reset local state when a new question starts
    useEffect(() => {
        if (gameState?.status === 'QUESTION') {
            setSelectedColors([]);
            setHasAnswered(false);
        }
    }, [gameState?.questions.length, gameState?.status]);

    const handleJoin = () => {
        if (name && code.length === 4) {
            socket.emit('join-game', { name, avatar, code });
        }
    };

    const toggleColor = (color: string) => {
        if (hasAnswered) return;
        setSelectedColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const submitAnswer = () => {
        if (selectedColors.length > 0 && gameState) {
            setHasAnswered(true);
            socket.emit('submit-answer', {
                code: gameState.code,
                answers: selectedColors
            });
        }
    };

    if (!gameState) {
        return (
            <div className="flex-1 flex flex-col p-8 max-w-md mx-auto w-full overflow-y-auto overflow-x-hidden relative z-10 h-full justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-10 pb-12 w-full"
                >
                    <div className="text-center flex flex-col items-center mb-4">
                        <div className="w-[85vw] max-w-[320px] mb-2">
                            <Logo />
                        </div>
                        <h2 className="text-3xl font-black text-white/90 tracking-tight uppercase italic -mt-6">Challenger Setup</h2>
                        <div className="h-1 w-12 bg-color-blue rounded-full my-4" />
                    </div>

                    <div className="space-y-10 w-full">
                        <div className="space-y-6">
                            <label className="text-sm font-black uppercase tracking-[0.3em] text-color-blue/80 ml-2">Identify Your Avatar</label>
                            <div className="grid grid-cols-4 gap-4 p-6 glass rounded-[2.5rem] border-white/10 shadow-inner bg-black/20">
                                {AVATAR_IDS.map((a, i) => (
                                    <motion.button
                                        key={a}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.05, type: "spring" }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => setAvatar(a)}
                                        className={`relative aspect-square flex items-center justify-center p-2 rounded-2xl transition-all duration-300 ${avatar === a ? 'bg-white/10 ring-4 ring-color-blue ring-offset-4 ring-offset-black scale-110 z-10' : 'opacity-40 grayscale hover:opacity-100'}`}
                                    >
                                        <div className="w-full h-full">
                                            <Avatar seed={a} className="w-full h-full drop-shadow-lg" />
                                        </div>
                                        {avatar === a && <motion.div layoutId="activeAvatar" className="absolute inset-0 rounded-2xl bg-color-blue/10" />}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black uppercase tracking-[0.3em] text-text-muted/60 ml-4">Codename</label>
                                <input
                                    className="input w-full text-3xl font-bold border-white/10 bg-white/5 focus:bg-white/10 focus:border-color-pink/50 rounded-[2rem] py-6 px-8 placeholder:text-white/10 transition-all shadow-xl"
                                    placeholder="ENTER NAME"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black uppercase tracking-[0.3em] text-text-muted/60 ml-4">Access Code</label>
                                <div className="relative group">
                                    <Hash className="absolute left-8 top-1/2 -translate-y-1/2 text-color-blue opacity-50 group-focus-within:opacity-100 transition-opacity" size={32} />
                                    <input
                                        className="input w-full pl-20 text-5xl font-mono font-black tracking-[0.3em] uppercase text-white border-white/10 bg-white/5 focus:bg-white/10 focus:border-color-blue/50 rounded-[2rem] py-8 shadow-xl transition-all"
                                        placeholder="CODE"
                                        maxLength={4}
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleJoin}
                        disabled={!name || code.length !== 4}
                        className="btn btn-primary text-2xl py-8 mt-6 flex items-center justify-center gap-6 disabled:opacity-40 disabled:grayscale transition-all rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(0,229,255,0.4)] border-t border-white/20 uppercase font-black italic tracking-widest w-full"
                    >
                        INITIALIZE LINK <Smartphone size={32} strokeWidth={2.5} />
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    const { status, players, currentQuestionIndex, questions } = gameState;
    const currentQuestion = questions[currentQuestionIndex];
    const me = players.find(p => p.id === socket.id);

    return (
        <div className="flex-1 flex flex-col p-4 overflow-hidden h-full w-full max-w-md mx-auto relative z-10">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex justify-between items-center mb-6 glass p-4 pr-6 rounded-[2rem] border-white/10 shadow-2xl bg-gradient-to-r from-white/5 to-transparent shrink-0"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner border border-white/5 p-1 overflow-hidden">
                        <Avatar seed={avatar} className="w-full h-full" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-2xl tracking-tight leading-none uppercase italic bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{name}</span>
                        <div className="flex items-center gap-2 mt-2">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-success" />
                            <span className="text-[10px] uppercase tracking-[0.3em] text-success font-black">Live Session</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-1 opacity-50 italic">XP Points</span>
                    <span className="text-4xl font-black glow-text leading-none font-mono tracking-tighter text-color-blue">{me?.score || 0}</span>
                </div>
            </motion.div>

            <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {status === 'LOBBY' && (
                        <motion.div
                            key="lobby"
                            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
                            className="text-center glass rounded-[4rem] p-16 border-white/10 shadow-[0_80px_100px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-color-blue/15 via-transparent to-color-purple/15 opacity-50" />
                            <div className="mb-12 relative inline-block z-10">
                                <motion.div
                                    animate={{ scale: [1, 1.6, 1], rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                    className="absolute inset-0 bg-color-blue/20 blur-[60px] rounded-full"
                                />
                                <div className="text-9xl relative drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">🎮</div>
                            </div>
                            <h3 className="text-5xl font-black mb-4 uppercase tracking-tighter italic z-10 relative">STAND BY</h3>
                            <p className="text-text-muted font-bold text-lg mb-12 z-10 relative px-4 leading-relaxed opacity-80 italic">Synchronizing with the Arena. Secure your focus, champion.</p>
                            <div className="relative z-10 inline-flex items-center gap-5 px-10 py-5 rounded-3xl bg-black/40 border border-white/5 text-color-blue uppercase text-[11px] font-black tracking-[0.4em] shadow-2xl">
                                <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-3 h-3 rounded-full bg-color-blue shadow-[0_0_15px_var(--primary-glow)]" />
                                Connection Optimal
                            </div>
                        </motion.div>
                    )}

                    {status === 'QUESTION' && (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                            className="flex-1 flex flex-col gap-8"
                        >
                            <div className="text-center px-4">
                                <div className="inline-block px-6 py-2 rounded-2xl bg-color-blue/10 border border-color-blue/20 text-color-blue font-black uppercase text-[11px] tracking-[0.4em] mb-6 italic shadow-xl">Phase {currentQuestionIndex + 1}</div>
                                <h3 className="text-[5rem] font-black tracking-tighter leading-[0.85] uppercase italic bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">{currentQuestion.question}</h3>
                            </div>

                            {!hasAnswered ? (
                                <div className="flex-1 flex flex-col gap-10">
                                    <div className="grid grid-cols-2 gap-5 flex-1 p-2">
                                        {currentQuestion.options.map((color, i) => (
                                            <motion.button
                                                key={i}
                                                whileTap={{ scale: 0.9, rotate: i % 2 === 0 ? -4 : 4 }}
                                                onClick={() => toggleColor(color)}
                                                className={`group relative rounded-[3rem] border-8 transition-all duration-400 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)] overflow-hidden ${selectedColors.includes(color) ? 'border-white scale-[1.08] z-10 ring-8 ring-color-blue/20' : 'border-black/30'}`}
                                                style={{ backgroundColor: color }}
                                            >
                                                <AnimatePresence>
                                                    {selectedColors.includes(color) && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 1.5 }}
                                                            className="absolute inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center"
                                                        >
                                                            <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-125 border-4 border-black/10">
                                                                <Check size={56} strokeWidth={6} />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.button>
                                        ))}
                                    </div>
                                    <motion.button
                                        whileHover={{ y: -8 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={submitAnswer}
                                        disabled={selectedColors.length === 0}
                                        className="btn btn-primary w-full py-12 text-3xl transition-all shadow-[0_40px_80px_-20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-8 rounded-[3rem] disabled:opacity-20 disabled:grayscale italic border-t-4 border-white/30 uppercase font-black tracking-widest"
                                    >
                                        SEND SELECTION <Send fill="currentColor" size={40} />
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-12 glass m-4 rounded-[5rem] border-white/5 relative overflow-hidden shadow-[0_100px_100px_-50px_rgba(0,0,0,0.8)]">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-color-blue to-transparent opacity-50" />
                                    <motion.div
                                        animate={{
                                            rotate: 360,
                                            scale: [1, 1.2, 1],
                                            filter: ["blur(0px)", "blur(10px)", "blur(0px)"]
                                        }}
                                        transition={{
                                            rotate: { repeat: Infinity, duration: 12, ease: "linear" },
                                            scale: { repeat: Infinity, duration: 4 },
                                            filter: { repeat: Infinity, duration: 4 }
                                        }}
                                        className="text-[12rem] relative z-10"
                                    >
                                        ☄️
                                    </motion.div>
                                    <div className="text-center px-12 relative z-10">
                                        <h3 className="text-5xl font-black uppercase tracking-tighter italic mb-6">TRANSMITTED</h3>
                                        <p className="text-text-muted font-bold text-lg leading-relaxed italic opacity-80">Data packets secured in the Arena.<br />Awaiting Final Confirmation...</p>
                                    </div>
                                    <motion.div
                                        animate={{ height: ['0%', '100%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute right-0 top-0 w-1 bg-gradient-to-b from-transparent via-color-blue to-transparent"
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {status === 'RESULT' && (
                        <motion.div
                            key="result"
                            initial={{ scale: 0.8, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="text-center flex flex-col items-center justify-center gap-16"
                        >
                            {me?.isCorrect ? (
                                <div className="flex flex-col items-center gap-12 w-full">
                                    <div className="relative">
                                        <motion.div
                                            animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-success/50 blur-[80px] rounded-full"
                                        />
                                        <motion.div
                                            initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 10, stiffness: 100 }}
                                            className="bg-success p-16 rounded-[4.5rem] relative z-10 shadow-[0_50px_100px_-20px_rgba(0,255,170,0.5)] border-t-8 border-white/30"
                                        >
                                            <Check size={120} strokeWidth={8} className="text-white drop-shadow-2xl" />
                                        </motion.div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-lg">ELITE WORK!</h3>
                                        <div className="inline-block bg-gradient-to-r from-success/30 to-success/10 px-14 py-6 rounded-[2.5rem] border-2 border-success/40 shadow-2xl backdrop-blur-lg">
                                            <span className="text-3xl font-black text-success tracking-[0.2em] italic">+10 XP GAINED</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-12 w-full">
                                    <div className="bg-error/10 p-16 rounded-[4.5rem] border-4 border-error/20 shadow-inner backdrop-blur-md">
                                        <X size={120} strokeWidth={8} className="text-error/30" />
                                    </div>
                                    <div className="space-y-6 px-10">
                                        <h3 className="text-7xl font-black text-error/60 uppercase tracking-tighter italic leading-none">FAILED</h3>
                                        <p className="text-xl font-bold text-text-muted italic leading-relaxed opacity-60">The palette was elusive this time.<br />Refocus. Recalibrate. Return.</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {status === 'FINAL_SCORE' && (
                        <motion.div
                            key="final"
                            initial={{ y: 100, opacity: 0, filter: "blur(20px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            className="text-center space-y-12"
                        >
                            <div className="relative inline-block">
                                <motion.div
                                    animate={{ scale: [1, 1.4, 1], rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-16 bg-gradient-to-br from-color-orange/30 to-color-pink/30 blur-[100px] rounded-full"
                                />
                                <div className="text-[14rem] relative z-10 drop-shadow-[0_40px_80px_rgba(255,157,0,0.6)]">👑</div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-7xl font-black uppercase tracking-tighter italic leading-none bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">LEGEND STATUS</h3>
                                <p className="text-2xl font-black text-color-purple uppercase tracking-[0.6em] italic opacity-80">Final Data Dump</p>
                            </div>

                            <div className="glass p-16 rounded-[4.5rem] border-white/10 shadow-[0_100px_150px_-30px_rgba(0,0,0,0.8)] relative overflow-hidden group bg-gradient-to-b from-white/5 to-transparent">
                                <div className="absolute inset-0 bg-gradient-to-br from-color-blue/20 to-transparent opacity-50" />
                                <div className="relative z-10">
                                    <p className="text-xs font-black uppercase tracking-[0.6em] text-color-blue mb-6 italic opacity-70">Total XP Accrued</p>
                                    <p className="text-[12rem] font-black text-white glow-text leading-none tracking-tighter font-mono">{me?.score || 0}</p>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -10 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setGameState(null)}
                                className="btn btn-secondary w-full py-12 text-4xl rounded-[3.5rem] border-t-4 border-white/30 bg-white/10 hover:bg-white/15 transition-all font-black group relative overflow-hidden shadow-2xl italic tracking-tighter uppercase"
                            >
                                <span className="relative z-10">RE-INITIALIZE</span>
                                <motion.div
                                    animate={{ x: [-600, 1000] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                                    className="absolute inset-0 bg-white/5 -skew-x-12"
                                />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Visual Decor */}
            <div className="mt-12 flex justify-center gap-2 opacity-10">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ height: [8, 20, 8] }}
                        transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
                        className="w-1.5 bg-white rounded-full"
                    />
                ))}
            </div>
        </div>
    );
}
