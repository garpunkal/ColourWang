import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { Question } from '../../types/game';
import { motion } from 'framer-motion';
import { fetchQuestions } from '../../config/gameConfig';
import { useSocketConnection } from '../../hooks/useSocketConnection';
import { audioManager } from '../../utils/audioManager';

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
    const [musicEnabled, setMusicEnabled] = useState(true);
    const [streaksEnabled, setStreaksEnabled] = useState(true);
    const [fastestFingerEnabled, setFastestFingerEnabled] = useState(true);
    const [accessibleLabels, setAccessibleLabels] = useState(false);
    const selectedBgm = 'Casino Royal.mp3';
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [error] = useState<string | null>(null);
    const isConnected = useSocketConnection(socket);


    useEffect(() => {
        setTimeout(() => setLoadingQuestions(true), 0);
        fetchQuestions()
            .then((data) => {
                setAllQuestions(data);
                setLoadingQuestions(false);
            })
            .catch(() => {
                setLoadingQuestions(false);
            });
    }, []);

    useEffect(() => {
        // Preview BGM when selected in setup
        if (musicEnabled && selectedBgm) {
            // We use the manager to play it immediately
            // Since it checks for existing track, it won't restart if already playing identical
            // But here we might want to force it if it switched? 
            // audioManager.playBGM handles track switch logic.
            // However, we should ensure we don't start it if not desired? 
            // User implies "I can't hear the music" -> suggesting they EXPECT to hear it.
            // So we play it.
            audioManager.playBGM(selectedBgm);
        } else {
            audioManager.stopBGM();
        }

        // Cleanup on unmount (e.g. going to game keeps it playing? No, HostScreen re-calls playBGM. 
        // If track is same, it continues. If we stop here, it stops then restarts.
        // Better to NOT stop on unmount if we act as persistent host audio?
        // But if we go back to menu?
        // Let's stop on unmount for safety, HostScreen will restart it.
        return () => {
            // We don't want to stop if we are transitioning to GAME.
            // But we can't easily know.
            // If we stop, HostScreen will start it 100ms later. It's okay.
            // Actually, if we stop, `bgmAudio` is paused.
            // HostScreen calls `playBGM`. It sees paused = plays.
            // Fine.
            audioManager.stopBGM();
        };
    }, [selectedBgm, musicEnabled]);

    const createGame = () => {
        // We now let the server handle the question picking for better variety and consistency
        console.log('Initialising lobby with:', { rounds, timer, resultTimer, lobbyDuration, jokers, playSounds });
        socket.emit('create-game', {
            rounds,
            timer,
            resultDuration: resultTimer,
            lobbyDuration,
            jokersEnabled: jokers,
            soundEnabled: playSounds,
            musicEnabled,
            bgmTrack: selectedBgm,
            streaksEnabled,
            fastestFingerEnabled,
            accessibleLabels
        });
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-2 w-full h-full min-h-0 overflow-hidden">
            <div className="glass-card p-4 md:p-8 rounded-4xl md:rounded-[3rem] border-white/10 shadow-2xl w-full max-w-4xl mx-auto flex flex-col max-h-full">
                <h2 className="text-2xl md:text-5xl font-black mb-4 md:mb-8 uppercase tracking-tight italic shrink-0">Game Settings</h2>
                {loadingQuestions && <div className="text-lg text-color-blue font-bold mb-4">Loading questions...</div>}
                {error && <div className="text-lg text-error font-bold mb-4">{error}</div>}

                <div className="grid grid-cols-2 gap-2 md:gap-6 mb-4 md:mb-10 w-full overflow-y-auto md:overflow-visible min-h-0">
                    {/* Rounds Slider */}
                    <div className="space-y-1 md:space-y-4 text-left col-span-1">
                        <div className="flex justify-between items-end ml-1 md:ml-2">
                            <label className="text-xs md:text-xl font-black uppercase tracking-widest text-white/60">Rounds</label>
                            <span className="text-xl md:text-5xl font-mono font-black text-color-blue drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">{rounds}</span>
                        </div>
                        <div className="flex items-center bg-black/20 p-2 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/5 h-10 md:h-16">
                            <input
                                type="range" min="4" max="24"
                                value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                                className="w-full h-2 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-blue hover:bg-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Question Timer Slider */}
                    <div className="space-y-1 md:space-y-4 text-left col-span-1">
                        <div className="flex justify-between items-end ml-1 md:ml-2">
                            <label className="text-xs md:text-xl font-black uppercase tracking-widest text-white/60">Timer</label>
                            <span className="text-xl md:text-5xl font-mono font-black text-color-pink drop-shadow-[0_0_10px_rgba(248,58,123,0.5)]">
                                {timer}<span className="text-xs md:text-2xl opacity-50 ml-0.5">s</span>
                            </span>
                        </div>
                        <div className="flex items-center bg-black/20 p-2 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/5 h-10 md:h-16">
                            <input
                                type="range" min="15" max="60" step="5"
                                value={timer} onChange={e => setTimer(parseInt(e.target.value))}
                                className="w-full h-2 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-pink hover:bg-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Lobby Timer Slider */}
                    <div className="space-y-1 md:space-y-4 text-left col-span-1">
                        <div className="flex justify-between items-end ml-1 md:ml-2">
                            <label className="text-xs md:text-xl font-black uppercase tracking-widest text-white/60">Lobby</label>
                            <span className="text-xl md:text-5xl font-mono font-black text-color-purple drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]">
                                {lobbyDuration}<span className="text-xs md:text-2xl opacity-50 ml-0.5">s</span>
                            </span>
                        </div>
                        <div className="flex items-center bg-black/20 p-2 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/5 h-10 md:h-16">
                            <input
                                type="range" min="10" max="120" step="5"
                                value={lobbyDuration} onChange={e => setLobbyDuration(parseInt(e.target.value))}
                                className="w-full h-2 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-purple hover:bg-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Result Timer Slider */}
                    <div className="space-y-1 md:space-y-4 text-left col-span-1">
                        <div className="flex justify-between items-end ml-1 md:ml-2">
                            <label className="text-xs md:text-xl font-black uppercase tracking-widest text-white/60">Reveal</label>
                            <span className="text-xl md:text-5xl font-mono font-black text-color-yellow drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                                {resultTimer}<span className="text-xs md:text-2xl opacity-50 ml-0.5">s</span>
                            </span>
                        </div>
                        <div className="flex items-center bg-black/20 p-2 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm border border-white/5 h-10 md:h-16">
                            <input
                                type="range" min="10" max="60" step="5"
                                value={resultTimer} onChange={e => setResultTimer(parseInt(e.target.value))}
                                className="w-full h-2 md:h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-color-yellow hover:bg-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Toggles Container */}
                    <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">

                        {/* Sound FX */}
                        <div className="bg-black/20 p-2 md:p-5 rounded-xl md:rounded-3xl border border-white/5 flex flex-col items-center justify-between hover:bg-white/5 transition-all cursor-pointer group active:scale-95 h-full min-h-[70px] md:min-h-[140px]"
                            onClick={() => setPlaySounds(!playSounds)}>
                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full h-full">
                                <div className="flex flex-col gap-0.5 md:gap-1 text-left">
                                    <label className="text-sm md:text-xl font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors cursor-pointer text-left">Sound FX</label>
                                    <span className="text-[9px] md:text-xs font-bold opacity-30 tracking-wider hidden md:block">
                                        {playSounds ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                <div className={`w-10 h-6 md:w-14 md:h-8 rounded-full p-1 transition-colors duration-300 ${playSounds ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}>
                                    <motion.div
                                        animate={{ x: playSounds ? '100%' : '0%' }}
                                        className="w-4 h-4 md:w-6 md:h-6 bg-white rounded-full shadow-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Music */}
                        <div className="bg-black/20 p-2 md:p-5 rounded-xl md:rounded-3xl border border-white/5 flex flex-col justify-between hover:bg-white/5 transition-all cursor-pointer group active:scale-95 h-full relative min-h-[70px] md:min-h-[140px]"
                            onClick={() => setMusicEnabled(!musicEnabled)}>
                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full h-full">
                                <div className="flex flex-col gap-0.5 md:gap-1 text-left w-full">
                                    <label className="text-sm md:text-xl font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors cursor-pointer text-left">Music</label>
                                    <span className="text-[9px] md:text-xs font-bold opacity-30 tracking-wider hidden md:block mb-2">
                                        {musicEnabled ? 'ON' : 'OFF'}
                                    </span>

                                </div>
                                <div className={`w-10 h-6 md:w-14 md:h-8 rounded-full p-1 transition-colors duration-300 ${musicEnabled ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10'} shrink-0 ml-2 md:ml-0`}>
                                    <motion.div
                                        animate={{ x: musicEnabled ? '100%' : '0%' }}
                                        className="w-4 h-4 md:w-6 md:h-6 bg-white rounded-full shadow-md"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Accessible Labels */}
                        <div className="bg-black/20 p-2 md:p-5 rounded-xl md:rounded-3xl border border-white/5 flex flex-col items-center justify-between hover:bg-white/5 transition-all cursor-pointer group active:scale-95 h-full min-h-[70px] md:min-h-[140px]"
                            onClick={() => setAccessibleLabels(!accessibleLabels)}>
                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full h-full">
                                <div className="flex flex-col gap-0.5 md:gap-1 text-left">
                                    <label className="text-xs md:text-xl font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors cursor-pointer text-left">Colorblind</label>
                                    <span className="text-[9px] md:text-xs font-bold opacity-30 tracking-wider hidden md:block">
                                        {accessibleLabels ? 'FOR ALL' : 'OPTIONAL'}
                                    </span>
                                </div>
                                <div className={`w-10 h-6 md:w-14 md:h-8 rounded-full p-1 transition-colors duration-300 ${accessibleLabels ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}>
                                    <motion.div
                                        animate={{ x: accessibleLabels ? '100%' : '0%' }}
                                        className="w-4 h-4 md:w-6 md:h-6 bg-white rounded-full shadow-md"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Steals */}
                        <div className="bg-black/20 p-2 md:p-5 rounded-xl md:rounded-3xl border border-white/5 flex flex-col items-center justify-between hover:bg-white/5 transition-all cursor-pointer group active:scale-95 h-full min-h-[70px] md:min-h-[140px]"
                            onClick={() => setJokers(!jokers)}>
                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full h-full">
                                <div className="flex flex-col gap-0.5 md:gap-1 text-left">
                                    <label className="text-sm md:text-xl font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors cursor-pointer text-left">Steals</label>
                                    <span className="text-[9px] md:text-xs font-bold opacity-30 tracking-wider hidden md:block">
                                        {jokers ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </div>
                                <div className={`w-10 h-6 md:w-14 md:h-8 rounded-full p-1 transition-colors duration-300 ${jokers ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}>
                                    <motion.div
                                        animate={{ x: jokers ? '100%' : '0%' }}
                                        className="w-4 h-4 md:w-6 md:h-6 bg-white rounded-full shadow-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Streaks */}
                        <div className="bg-black/20 p-2 md:p-5 rounded-xl md:rounded-3xl border border-white/5 flex flex-col items-center justify-between hover:bg-white/5 transition-all cursor-pointer group active:scale-95 h-full min-h-[70px] md:min-h-[140px]"
                            onClick={() => setStreaksEnabled(!streaksEnabled)}>
                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full h-full">
                                <div className="flex flex-col gap-0.5 md:gap-1 text-left">
                                    <label className="text-sm md:text-xl font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors cursor-pointer text-left">Streaks</label>
                                    <span className="text-[9px] md:text-xs font-bold opacity-30 tracking-wider hidden md:block">
                                        {streaksEnabled ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                <div className={`w-10 h-6 md:w-14 md:h-8 rounded-full p-1 transition-colors duration-300 ${streaksEnabled ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}>
                                    <motion.div
                                        animate={{ x: streaksEnabled ? '100%' : '0%' }}
                                        className="w-4 h-4 md:w-6 md:h-6 bg-white rounded-full shadow-md"
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Fastest Finger */}
                        <div className="bg-black/20 p-2 md:p-5 rounded-xl md:rounded-3xl border border-white/5 flex flex-col items-center justify-between hover:bg-white/5 transition-all cursor-pointer group active:scale-95 h-full min-h-[70px] md:min-h-[140px]"
                            onClick={() => setFastestFingerEnabled(!fastestFingerEnabled)}>
                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full h-full">
                                <div className="flex flex-col gap-0.5 md:gap-1 text-left">
                                    <label className="text-xs md:text-xl font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors cursor-pointer text-left">Fastest Finger</label>
                                    <span className="text-[9px] md:text-xs font-bold opacity-30 tracking-wider hidden md:block">
                                        {fastestFingerEnabled ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                <div className={`w-10 h-6 md:w-14 md:h-8 rounded-full p-1 transition-colors duration-300 ${fastestFingerEnabled ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}>
                                    <motion.div
                                        animate={{ x: fastestFingerEnabled ? '100%' : '0%' }}
                                        className="w-4 h-4 md:w-6 md:h-6 bg-white rounded-full shadow-md"
                                    />
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={createGame}
                    className="btn btn-primary text-xl md:text-5xl py-4 md:py-12 px-6 md:px-24 w-full rounded-2xl md:rounded-[3rem] shadow-[0_20px_60px_-10px_rgba(0,229,255,0.5)] uppercase font-black italic tracking-widest text-white border-t-4 md:border-t-8 border-white/20 shrink-0"
                    disabled={loadingQuestions || !!error || !allQuestions.length || !isConnected}
                >
                    {isConnected ? 'Initialise Lobby' : 'Connecting...'}
                </motion.button>
            </div>
        </div >
    );
}
