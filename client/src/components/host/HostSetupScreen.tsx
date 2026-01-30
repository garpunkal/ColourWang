import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { Question } from '../../types/game';
import { motion } from 'framer-motion';
import { fetchQuestions } from '../../config/gameConfig';
import { useSocketConnection } from '../../hooks/useSocketConnection';

interface Props {
    socket: Socket;
}

export function HostSetupScreen({ socket }: Props) {
    const [rounds, setRounds] = useState(6);
    const [timer, setTimer] = useState(30);
    const [resultTimer, setResultTimer] = useState(30);
    const [lobbyDuration, setLobbyDuration] = useState(30);
    const [jokers, setJokers] = useState(true);
    const [playSounds, setPlaySounds] = useState(true);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isConnected = useSocketConnection(socket);

    useEffect(() => {
        setTimeout(() => setLoadingQuestions(true), 0);
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
        // We now let the server handle the question picking for better variety and consistency
        console.log('Initialising lobby with:', { rounds, timer, resultTimer, lobbyDuration, jokers, playSounds });
        socket.emit('create-game', {
            rounds,
            timer,
            resultDuration: resultTimer,
            lobbyDuration,
            jokersEnabled: jokers,
            soundEnabled: playSounds
        });
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-8 overflow-y-auto">
            {/* Logo Removed */}
            <div className="glass-card p-6 md:p-10 rounded-4xl md:rounded-[3rem] border-white/10 shadow-2xl max-w-4xl w-full mx-auto md:mx-8">
                <h2 className="text-3xl md:text-5xl font-black mb-6 md:mb-8 uppercase tracking-tight italic">Game Settings</h2>
                {loadingQuestions && <div className="text-xl text-color-blue font-bold mb-6">Loading questions...</div>}
                {error && <div className="text-xl text-error font-bold mb-6">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12 w-full">
                    {/* Rounds Slider */}
                    <div className="space-y-3 md:space-y-4 text-left col-span-1">
                        <div className="flex justify-between items-end ml-2">
                            <label className="text-lg md:text-xl font-black uppercase tracking-widest text-white/60">Total Rounds</label>
                            <span className="text-3xl md:text-5xl font-mono font-black text-color-blue drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">{rounds}</span>
                        </div>
                        <div className="flex items-center bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-white/5 h-14 md:h-16">
                            <input
                                type="range" min="4" max="24"
                                value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                                className="w-full h-3 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-blue hover:bg-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Question Timer Slider */}
                    <div className="space-y-3 md:space-y-4 text-left col-span-1">
                        <div className="flex justify-between items-end ml-2">
                            <label className="text-lg md:text-xl font-black uppercase tracking-widest text-white/60">Question Time</label>
                            <span className="text-3xl md:text-5xl font-mono font-black text-color-pink drop-shadow-[0_0_10px_rgba(248,58,123,0.5)]">
                                {timer}<span className="text-lg md:text-2xl opacity-50 ml-1">s</span>
                            </span>
                        </div>
                        <div className="flex items-center bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-white/5 h-14 md:h-16">
                            <input
                                type="range" min="15" max="60" step="5"
                                value={timer} onChange={e => setTimer(parseInt(e.target.value))}
                                className="w-full h-3 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-pink hover:bg-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Lobby Timer Slider */}
                    <div className="space-y-3 md:space-y-4 text-left col-span-1">
                        <div className="flex justify-between items-end ml-2">
                            <label className="text-lg md:text-xl font-black uppercase tracking-widest text-white/60">Lobby Wait Time</label>
                            <span className="text-3xl md:text-5xl font-mono font-black text-color-purple drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]">
                                {lobbyDuration}<span className="text-lg md:text-2xl opacity-50 ml-1">s</span>
                            </span>
                        </div>
                        <div className="flex items-center bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-white/5 h-14 md:h-16">
                            <input
                                type="range" min="10" max="120" step="5"
                                value={lobbyDuration} onChange={e => setLobbyDuration(parseInt(e.target.value))}
                                className="w-full h-3 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-purple hover:bg-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Result Timer Slider */}
                    <div className="space-y-3 md:space-y-4 text-left col-span-1">
                        <div className="flex justify-between items-end ml-2">
                            <label className="text-lg md:text-xl font-black uppercase tracking-widest text-white/60">Result Reveal Time</label>
                            <span className="text-3xl md:text-5xl font-mono font-black text-color-yellow drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                                {resultTimer}<span className="text-lg md:text-2xl opacity-50 ml-1">s</span>
                            </span>
                        </div>
                        <div className="flex items-center bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-white/5 h-14 md:h-16">
                            <input
                                type="range" min="10" max="60" step="5"
                                value={resultTimer} onChange={e => setResultTimer(parseInt(e.target.value))}
                                className="w-full h-3 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-yellow hover:bg-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-2">
                        {/* Jokers Toggle */}
                        <div
                            className="bg-black/20 p-3 md:p-5 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group active:scale-95"
                            onClick={() => setJokers(!jokers)}
                        >
                            <div className="flex flex-col gap-1">
                                <label className="text-lg md:text-xl font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors cursor-pointer text-left">STEALS</label>
                                <span className="text-[10px] md:text-xs font-bold opacity-30 tracking-wider">
                                    {jokers ? 'STEAL CARDS ENABLED' : 'STANDARD PLAY ONLY'}
                                </span>
                            </div>
                            <div className={`w-14 h-8 md:w-16 md:h-9 rounded-full p-1 transition-colors duration-300  text-left ${jokers ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}>
                                <motion.div
                                    animate={{ x: jokers ? '100%' : '0%' }}
                                    className="w-6 h-6 md:w-7 md:h-7 bg-white rounded-full shadow-md"
                                />
                            </div>
                        </div>

                        {/* Sounds Toggle */}
                        <div
                            className="bg-black/20 p-3 md:p-5 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group active:scale-95"
                            onClick={() => setPlaySounds(!playSounds)}
                        >
                            <div className="flex flex-col gap-1">
                                <label className="text-lg md:text-xl font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors cursor-pointer  text-left">Sound FX</label>
                                <span className="text-[10px] md:text-xs font-bold opacity-30 tracking-wider text-left">
                                    {playSounds ? 'AUDIO ENABLED' : 'SILENT MODE'}
                                </span>
                            </div>
                            <div className={`w-14 h-8 md:w-16 md:h-9 rounded-full p-1 transition-colors duration-300  ${playSounds ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}>
                                <motion.div
                                    animate={{ x: playSounds ? '100%' : '0%' }}
                                    className="w-6 h-6 md:w-7 md:h-7 bg-white rounded-full shadow-md"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={createGame}
                    className="btn btn-primary text-xl md:text-4xl py-5 md:py-10 px-10 md:px-20 w-full rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,229,255,0.5)] uppercase font-black italic tracking-widest text-white border-t-4 md:border-t-8 border-white/20"
                    disabled={loadingQuestions || !!error || !allQuestions.length || !isConnected}
                >
                    {isConnected ? 'Initialise Lobby' : 'Connecting...'}
                </motion.button>
            </div>
        </div >
    );
}
