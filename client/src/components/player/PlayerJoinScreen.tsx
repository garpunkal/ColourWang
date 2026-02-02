import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { Hash, Lock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../GameAvatars';
import { AVATAR_IDS, getAvatarName, getAvatarColor } from '../../constants/avatars';
import { avatarConfig } from '../../config/avatarConfig';

interface Props {
    socket: Socket;
    takenAvatars?: { avatar: string; avatarStyle: string; }[];
}

export function PlayerJoinScreen({ socket, takenAvatars = [] }: Props) {
    // Persist name and avatar
    const [name, setName] = useState(localStorage.getItem('playerName') || '');

    const [avatarStyle, setAvatarStyle] = useState(() => {
        return localStorage.getItem('playerAvatarStyle') || avatarConfig.defaultStyle;
    });

    // Try to restore avatar from localStorage if available and not taken
    const [avatar, setAvatar] = useState(() => {
        const storedAvatar = localStorage.getItem('playerAvatar');
        const storedAvatarStyle = localStorage.getItem('playerAvatarStyle') || avatarConfig.defaultStyle;
        if (storedAvatar && AVATAR_IDS.includes(storedAvatar) && 
            !takenAvatars.some(taken => taken.avatar === storedAvatar && taken.avatarStyle === storedAvatarStyle)) {
            return storedAvatar;
        }
        return AVATAR_IDS.find(id => !takenAvatars.some(taken => taken.avatar === id && taken.avatarStyle === storedAvatarStyle)) || AVATAR_IDS[0];
    });

    const [code, setCode] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('code')?.toUpperCase() || '';
    });

    // Fetch active games on mount and prepopulate if only 1 game is available
    useEffect(() => {
        // Only request if no code is already set
        if (!code) {
            socket.emit('get-active-games');
            const handleActiveGames = (games: string[]) => {
                if (games.length === 1) {
                    setCode(games[0]);
                }
            };
            socket.on('active-games', handleActiveGames);
            return () => {
                socket.off('active-games', handleActiveGames);
            };
        }
    }, [socket, code]);

    // Save name, avatar, and style to localStorage
    useEffect(() => {
        if (name) localStorage.setItem('playerName', name);
    }, [name]);

    useEffect(() => {
        if (avatar) localStorage.setItem('playerAvatar', avatar);
    }, [avatar]);

    useEffect(() => {
        if (avatarStyle) localStorage.setItem('playerAvatarStyle', avatarStyle);
    }, [avatarStyle]);

    const cycleStyle = (direction: 'next' | 'prev') => {
        const styles = avatarConfig.availableStyles;
        const currentIndex = styles.indexOf(avatarStyle);
        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % styles.length;
        } else {
            nextIndex = (currentIndex - 1 + styles.length) % styles.length;
        }
        setAvatarStyle(styles[nextIndex]);
    };

    const [dynamicTakenAvatars, setDynamicTakenAvatars] = useState<{ avatar: string; avatarStyle: string; }[]>(takenAvatars);
    const [isJoining, setIsJoining] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    // Listen for room updates to get taken avatars before joining
    useEffect(() => {
        const handleRoomChecked = (data: { exists: boolean, takenAvatars?: { avatar: string; avatarStyle: string; }[] }) => {
            if (data.exists && data.takenAvatars) {
                setDynamicTakenAvatars(data.takenAvatars);
            }
        };

        const handlePlayerJoined = (players: { avatar: string; avatarStyle: string; }[]) => {
            setDynamicTakenAvatars(players.map(p => ({ avatar: p.avatar, avatarStyle: p.avatarStyle })));
        };

        const handleError = (msg: string) => {
            console.error('Socket error received:', msg);
            setModalError(msg);
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
            setTimeout(() => setDynamicTakenAvatars([]), 0);
        }
    }, [code, socket]);

    // Update avatar if current one becomes taken (cascading render is fine here as it's a correction)
    useEffect(() => {
        if (dynamicTakenAvatars.some(taken => taken.avatar === avatar && taken.avatarStyle === avatarStyle)) {
            const available = AVATAR_IDS.find(id => !dynamicTakenAvatars.some(taken => taken.avatar === id && taken.avatarStyle === avatarStyle));
            if (available) {
                setTimeout(() => setAvatar(available), 0);
            }
        }
    }, [dynamicTakenAvatars, avatar, avatarStyle]);

    const handleJoin = () => {
        if (!socket.connected) {
            setModalError("Connection lost. Please wait for reconnection.");
            return;
        }
        if (name && code.length === 4) {
            setIsJoining(true);
            console.log('Emitting join-game:', { name, avatar, avatarStyle, code: code.toUpperCase() });
            socket.emit('join-game', { name, avatar, avatarStyle, code: code.toUpperCase() });

            // Timeout to reset loading if no response
            setTimeout(() => setIsJoining(false), 5000);
        }
    };

    const isAvatarTaken = (avatarId: string) => dynamicTakenAvatars.some(taken => taken.avatar === avatarId && taken.avatarStyle === avatarStyle);

    return (
        <div className="flex flex-col max-w-md mx-auto w-full overflow-y-auto overflow-x-hidden relative z-10 min-h-dvh p-4 justify-start">
            <AnimatePresence>
                {modalError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setModalError(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-4xl p-6 text-center max-w-sm w-full shadow-2xl space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <AlertTriangle size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black uppercase text-black italic tracking-wide">Oops!</h3>
                            <p className="text-black/60 font-bold text-lg leading-tight">{modalError}</p>
                            <button
                                onClick={() => setModalError(null)}
                                className="w-full btn bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-xl font-black uppercase tracking-widest mt-4 shadow-xl"
                            >
                                OK
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 md:gap-6 pb-4 w-full"
            >
                <div className="glass-card p-4 md:p-6 rounded-3xl shadow-xl space-y-6 md:space-y-6 m-2 md:m-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/60 ml-4">Name</label>
                            <input
                                className="input w-full text-xl md:text-3xl font-bold border-white/10 bg-white/5 focus:bg-white/10 focus:border-color-pink/50 rounded-[1.2rem] md:rounded-4xl py-3 md:py-6 px-4 md:px-8 placeholder:text-white/10 transition-all shadow-xl uppercase"
                                placeholder="ENTER NAME"
                                maxLength={10}
                                value={name}
                                onChange={e => name.length < 10 ? setName(e.target.value.toUpperCase()) : null}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/60 ml-4">Code</label>
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

                    {/* Avatar Style & Preview */}
                    <div className="flex flex-col items-center space-y-4 pt-2">
                        <label className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/60">Style Your Wang</label>

                        <div className="flex items-center justify-between w-full max-w-70 px-4">
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => cycleStyle('prev')}
                                className="p-3 rounded-full glass hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </motion.button>

                            <motion.div
                                key={`${avatar}-${avatarStyle}`}
                                className="relative group"
                            >
                                <Avatar
                                    seed={avatar}
                                    style={avatarStyle}
                                    className="w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {avatarStyle.replace('-', ' ')}
                                </div>
                            </motion.div>

                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => cycleStyle('next')}
                                className="p-3 rounded-full glass hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight size={24} />
                            </motion.button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/60 ml-4">Colour Choice</label>
                        <div className="grid grid-cols-4 gap-2 md:gap-3 p-3 md:p-4 glass rounded-4xl border-white/10 shadow-inner bg-black/20">
                            {AVATAR_IDS.map((a) => {
                                const taken = isAvatarTaken(a);
                                const isSelected = avatar === a;
                                return (
                                    <motion.button
                                        key={a}
                                        whileTap={!taken ? { scale: 0.8 } : {}}
                                        onClick={() => !taken && setAvatar(a)}
                                        disabled={taken}
                                        className={`
                                                relative aspect-square flex items-center justify-center p-1.5 rounded-xl transition-all duration-300
                                                ${isSelected
                                                ? 'bg-white/10 ring-2 ring-offset-2 ring-offset-black scale-105 z-10'
                                                : taken
                                                    ? 'opacity-20 cursor-not-allowed'
                                                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                                            }
                                            `}
                                        style={isSelected ? { '--tw-ring-color': getAvatarColor(a) } as React.CSSProperties : {}}
                                        title={taken ? `${getAvatarName(a)} - Taken` : getAvatarName(a)}
                                    >
                                        <div className="w-full h-full relative">
                                            <Avatar seed={a} style={avatarStyle} className="w-full h-full drop-shadow-md" />
                                            {taken && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                                                    <Lock size={16} className="text-white/80" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (isJoining) return;
                            if (!name) {
                                setModalError("Please enter a codename!");
                                return;
                            }
                            if (code.length !== 4) {
                                setModalError("Please enter a valid 4-character room code!");
                                return;
                            }
                            handleJoin();
                        }}
                        disabled={isJoining}
                        className={`
                        btn btn-primary text-lg md:text-2xl py-4 md:py-8 flex items-center justify-center gap-4 md:gap-6 
                        transition-all rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(0,229,255,0.4)] 
                        border-t border-white/20 uppercase font-black italic tracking-widest w-full relative z-20
                        ${(!name || code.length !== 4 || isJoining) ? 'opacity-80 grayscale-[0.5]' : ''}
                    `}
                    >
                        {isJoining ? 'CONNECTING...' : 'JOIN'}
                    </motion.button>
                </div>
            </motion.div >
        </div >
    );
}

