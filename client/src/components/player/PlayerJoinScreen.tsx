import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { Hash, Smartphone, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '../Logo';
import { Avatar } from '../GameAvatars';
import { AVATAR_IDS, getAvatarName } from '../../constants/avatars';

interface Props {
    socket: Socket;
    takenAvatars?: string[];
}

export function PlayerJoinScreen({ socket, takenAvatars = [] }: Props) {
    // Only persist name, not avatar (each connection should get unique color)
    const [name, setName] = useState(localStorage.getItem('playerName') || '');

    // Auto-select first available avatar (not from localStorage)
    const [avatar, setAvatar] = useState(() => {
        return AVATAR_IDS.find(id => !takenAvatars.includes(id)) || AVATAR_IDS[0];
    });

    const [code, setCode] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('code')?.toUpperCase() || '';
    });

    // Only save name to localStorage, not avatar
    useEffect(() => {
        if (name) localStorage.setItem('playerName', name);
    }, [name]);

    const [dynamicTakenAvatars, setDynamicTakenAvatars] = useState<string[]>(takenAvatars);
    const [isJoining, setIsJoining] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Clear error when user types
    useEffect(() => {
        if (error) setError(null);
    }, [name, code]);

    // Listen for room updates to get taken avatars before joining
    useEffect(() => {
        const handleRoomChecked = (data: { exists: boolean, takenAvatars?: string[] }) => {
            if (data.exists && data.takenAvatars) {
                setDynamicTakenAvatars(data.takenAvatars);
            }
        };

        const handlePlayerJoined = (players: { avatar: string }[]) => {
            setDynamicTakenAvatars(players.map(p => p.avatar));
        };

        const handleError = (msg: string) => {
            console.error('Socket error received:', msg);
            setError(msg);
            alert(msg);
        };

        socket.on('room-checked', handleRoomChecked);
        socket.on('player-joined', handlePlayerJoined);
        socket.on('error', handleError);

        // Initial check if code is already set
        if (code.length === 4) {
            socket.emit('check-room', code);
        }

        return () => {
            socket.off('room-checked', handleRoomChecked);
            socket.off('player-joined', handlePlayerJoined);
            socket.off('error', handleError);
        };
    }, [socket, code]);

    // Check room as code changes
    useEffect(() => {
        if (code.length === 4) {
            socket.emit('check-room', code);
        } else {
            setDynamicTakenAvatars([]);
        }
    }, [code, socket]);

    // Update avatar if current one becomes taken (cascading render is fine here as it's a correction)
    useEffect(() => {
        if (dynamicTakenAvatars.includes(avatar)) {
            const available = AVATAR_IDS.find(id => !dynamicTakenAvatars.includes(id));
            if (available) setAvatar(available);
        }
    }, [dynamicTakenAvatars, avatar]);

    const handleJoin = () => {
        if (!socket.connected) {
            alert("Connection lost. Please wait for reconnection.");
            return;
        }
        if (name && code.length === 4) {
            setIsJoining(true);
            console.log('Emitting join-game:', { name, avatar, code: code.toUpperCase() });
            socket.emit('join-game', { name, avatar, code: code.toUpperCase() });

            // Timeout to reset loading if no response
            setTimeout(() => setIsJoining(false), 5000);
        }
    };

    const isAvatarTaken = (avatarId: string) => dynamicTakenAvatars.includes(avatarId);

    return (
        <div className="flex flex-col max-w-md mx-auto w-full overflow-y-auto overflow-x-hidden relative z-10 min-h-dvh p-4 justify-start">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 md:gap-10 pb-8 md:pb-12 w-full my-auto"
            >
                <div className="text-center flex flex-col items-center justify-start mb-2">
                    <div className="w-[85vw] max-w-70 mb-2 scale-90 md:scale-100 origin-top">
                        <Logo />
                    </div>
                </div>

                <div className="glass-card p-4 md:p-6 rounded-3xl shadow-xl space-y-6 md:space-y-10 m-2 md:m-4">


                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/60 ml-4">Codename</label>
                            <input
                                className="input w-full text-xl md:text-3xl font-bold border-white/10 bg-white/5 focus:bg-white/10 focus:border-color-pink/50 rounded-[1.2rem] md:rounded-4xl py-3 md:py-6 px-4 md:px-8 placeholder:text-white/10 transition-all shadow-xl"
                                placeholder="ENTER NAME"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/60 ml-4">Access Code</label>
                            <div className="relative group">
                                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-color-blue opacity-50 group-focus-within:opacity-100 transition-opacity" size={24} />
                                <input
                                    className="input w-full pl-14! md:pl-20 text-2xl md:text-5xl font-mono font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-white border-white/10 bg-white/5 focus:bg-white/10 focus:border-color-blue/50 rounded-[1.2rem] md:rounded-4xl py-4 md:py-8 shadow-xl transition-all"
                                    placeholder="CODE"
                                    maxLength={4}
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-[0.3em] text-color-blue/80 mb-2">Your Color</label>
                    </div>
                    <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 glass rounded-[2.5rem] border-white/10 shadow-inner bg-black/20">
                        {AVATAR_IDS.map((a, i) => {
                            const taken = isAvatarTaken(a);
                            const isSelected = avatar === a;
                            return (
                                <motion.button
                                    key={a}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.05, type: "spring" }}
                                    whileTap={!taken ? { scale: 0.8 } : {}}
                                    onClick={() => !taken && setAvatar(a)}
                                    disabled={taken}
                                    className={`
                                            relative aspect-square flex items-center justify-center p-2 rounded-2xl transition-all duration-300
                                            ${isSelected
                                            ? 'bg-white/10 ring-4 ring-color-blue ring-offset-4 ring-offset-black scale-110 z-10'
                                            : taken
                                                ? 'opacity-20 cursor-not-allowed'
                                                : 'opacity-60 hover:opacity-100 hover:scale-105'
                                        }
                                        `}
                                    title={taken ? `${getAvatarName(a)} - Taken` : getAvatarName(a)}
                                >
                                    <div className="w-full h-full relative">
                                        <Avatar seed={a} className="w-full h-full drop-shadow-lg" />
                                        {taken && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                                                <Lock size={20} className="text-white/80" />
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && <motion.div layoutId="activeAvatar" className="absolute inset-0 rounded-2xl bg-color-blue/10" />}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {
                    error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-4 mb-2 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-100 text-center font-bold"
                        >
                            {error}
                        </motion.div>
                    )
                }

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (isJoining) return;
                        if (!name) {
                            setError("Please enter a codename!");
                            return;
                        }
                        if (code.length !== 4) {
                            setError("Please enter a valid 4-character room code!");
                            return;
                        }
                        handleJoin();
                    }}
                    disabled={isJoining}
                    className={`
                        btn btn-primary text-lg md:text-2xl py-4 md:py-8 mt-2 md:mt-6 flex items-center justify-center gap-4 md:gap-6 
                        transition-all rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(0,229,255,0.4)] 
                        border-t border-white/20 uppercase font-black italic tracking-widest w-full relative z-20
                        ${(!name || code.length !== 4 || isJoining) ? 'opacity-80 grayscale-[0.5]' : ''}
                    `}
                >
                    {isJoining ? 'CONNECTING...' : 'JOIN GAME'} <Smartphone size={24} strokeWidth={2.5} className={isJoining ? 'animate-pulse' : ''} />
                </motion.button>
            </motion.div >
        </div >
    );
}

