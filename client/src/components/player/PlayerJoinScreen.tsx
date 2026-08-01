import React, { useState, useEffect, useRef, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { Socket } from 'socket.io-client';
import { Hash, Lock, ChevronLeft, ChevronRight, AlertTriangle, Camera, Crop, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../GameAvatars';
import { AVATAR_IDS, getAvatarName } from '../../constants/avatars';
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

    const [avatarImage, setAvatarImage] = useState<string | null>(() => {
        return localStorage.getItem('playerAvatarImage') || localStorage.getItem('cw_playerAvatarImage') || null;
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


    // Save name, avatar, and style to localStorage
    useEffect(() => {
        localStorage.setItem('playerName', name);
    }, [name]);

    useEffect(() => {
        if (avatar) localStorage.setItem('playerAvatar', avatar);
    }, [avatar]);

    useEffect(() => {
        if (avatarStyle) localStorage.setItem('playerAvatarStyle', avatarStyle);
    }, [avatarStyle]);

    useEffect(() => {
        if (avatarImage) {
            localStorage.setItem('playerAvatarImage', avatarImage);
            localStorage.setItem('cw_playerAvatarImage', avatarImage);
        } else {
            localStorage.removeItem('playerAvatarImage');
            localStorage.removeItem('cw_playerAvatarImage');
        }
    }, [avatarImage]);

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
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageData, setCropImageData] = useState<{
        dataUrl: string;
        naturalWidth: number;
        naturalHeight: number;
        displayWidth: number;
        displayHeight: number;
        scale: number;
    } | null>(null);
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState<{ x: number; y: number; originX: number; originY: number } | null>(null);
    const uploadInputRef = useRef<HTMLInputElement | null>(null);
    const cameraInputRef = useRef<HTMLInputElement | null>(null);
    const swipeTouchStartX = useRef<number | null>(null);

    const handleAvatarSwipeStart = (e: React.TouchEvent) => {
        swipeTouchStartX.current = e.touches[0].clientX;
    };

    const handleAvatarSwipeEnd = (e: React.TouchEvent) => {
        if (swipeTouchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - swipeTouchStartX.current;
        if (Math.abs(delta) > 40) {
            cycleStyle(delta < 0 ? 'next' : 'prev');
        }
        swipeTouchStartX.current = null;
    };

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('We could not read that image. Please try another file.'));
        image.src = dataUrl;
    });

    const processAvatarImageFile = async (file: File) => {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('We could not read that image. Please try another file.'));
            reader.readAsDataURL(file);
        });

        const image = await loadImageFromDataUrl(dataUrl);
        const maxDimension = 1200;
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('We could not prepare that image. Please try another file.');
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = mimeType === 'image/png' ? undefined : 0.92;
        return canvas.toDataURL(mimeType, quality);
    };

    const openCropEditor = async (file: File) => {
        try {
            const resizedDataUrl = await processAvatarImageFile(file);
            const image = await loadImageFromDataUrl(resizedDataUrl);
            const frameSize = 320;
            const scale = Math.max(frameSize / image.naturalWidth, frameSize / image.naturalHeight);
            const displayWidth = image.naturalWidth * scale;
            const displayHeight = image.naturalHeight * scale;
            const initialOffsetX = (frameSize - displayWidth) / 2;
            const initialOffsetY = (frameSize - displayHeight) / 2;

            setCropImageData({
                dataUrl: resizedDataUrl,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
                displayWidth,
                displayHeight,
                scale,
            });
            setCropOffset({ x: initialOffsetX, y: initialOffsetY });
            setCropModalOpen(true);
            setModalError(null);
        } catch {
            setModalError('We could not read that image. Please try another file.');
        }
    };

    const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        await openCropEditor(file);
        event.target.value = '';
    };

    const handleCropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!cropImageData) return;
        setDragStart({ x: event.clientX, y: event.clientY, originX: cropOffset.x, originY: cropOffset.y });
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleCropPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!cropImageData || !dragStart) return;

        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;
        const maxOffsetX = cropImageData.displayWidth > 320 ? 0 : 0;
        const minOffsetX = cropImageData.displayWidth > 320 ? 320 - cropImageData.displayWidth : 0;
        const maxOffsetY = cropImageData.displayHeight > 320 ? 0 : 0;
        const minOffsetY = cropImageData.displayHeight > 320 ? 320 - cropImageData.displayHeight : 0;

        setCropOffset({
            x: clamp(dragStart.originX + deltaX, minOffsetX, maxOffsetX),
            y: clamp(dragStart.originY + deltaY, minOffsetY, maxOffsetY),
        });
    };

    const handleCropPointerUp = () => {
        setDragStart(null);
    };

    const applyCroppedAvatar = async () => {
        if (!cropImageData) return;

        try {
            const image = await loadImageFromDataUrl(cropImageData.dataUrl);
            const cropSize = 320;
            const sourceX = clamp((0 - cropOffset.x) / cropImageData.scale, 0, Math.max(0, image.naturalWidth - (cropSize / cropImageData.scale)));
            const sourceY = clamp((0 - cropOffset.y) / cropImageData.scale, 0, Math.max(0, image.naturalHeight - (cropSize / cropImageData.scale)));
            const sourceWidth = Math.max(1, cropSize / cropImageData.scale);
            const sourceHeight = Math.max(1, cropSize / cropImageData.scale);

            const canvas = document.createElement('canvas');
            const outputSize = 1024;
            canvas.width = outputSize;
            canvas.height = outputSize;
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('We could not prepare that image.');
            }

            context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputSize, outputSize);
            setAvatarImage(canvas.toDataURL('image/jpeg', 0.92));
            setCropModalOpen(false);
            setCropImageData(null);
            setCropOffset({ x: 0, y: 0 });
            setModalError(null);
        } catch {
            setModalError('We could not crop that image. Please try again.');
        }
    };

    const cancelCropEditor = () => {
        setCropModalOpen(false);
        setCropImageData(null);
        setCropOffset({ x: 0, y: 0 });
        setDragStart(null);
    };

    const clearUploadedAvatar = () => {
        setAvatarImage(null);
    };

    const avatarActionButtonClass = 'avatar-action-btn';
    const avatarActionSecondaryButtonClass = 'avatar-action-btn-secondary';

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
        if (avatarImage) return;
        if (dynamicTakenAvatars.some(taken => taken.avatar === avatar && taken.avatarStyle === avatarStyle)) {
            const available = AVATAR_IDS.find(id => !dynamicTakenAvatars.some(taken => taken.avatar === id && taken.avatarStyle === avatarStyle));
            if (available) {
                setTimeout(() => setAvatar(available), 0);
            }
        }
    }, [dynamicTakenAvatars, avatar, avatarStyle, avatarImage]);

    const handleJoin = () => {
        if (!socket.connected) {
            setModalError("Connection lost. Please wait for reconnection.");
            return;
        }
        if (name && code.length === 4) {
            setIsJoining(true);

            
            // Save player name for potential reconnection
            const upperName = name.toUpperCase();
            localStorage.setItem('cw_playerName', upperName);
            
            socket.emit('join-game', { name: upperName, avatar, avatarStyle, avatarImage: avatarImage || undefined, code: code.toUpperCase() });

            // Timeout to reset loading if no response
            setTimeout(() => setIsJoining(false), 5000);
        }
    };

    const isAvatarTaken = (avatarId: string) => {
        if (avatarImage) return false;
        return dynamicTakenAvatars.some(taken => taken.avatar === avatarId && taken.avatarStyle === avatarStyle);
    };

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
                                className="btn btn-primary text-lg md:text-2xl py-4 md:py-8 flex items-center justify-center gap-4 md:gap-6 
                        transition-all rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(0,229,255,0.4)] 
                        border-t border-white/20 uppercase font-black italic tracking-widest w-full relative z-20"
                            >
                                OK
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {cropModalOpen && cropImageData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-md rounded-4xl border border-white/10 bg-[#1b1534] p-5 shadow-2xl"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-text-muted/60">Crop your photo</p>
                                    <h3 className="text-xl font-black uppercase italic tracking-wide text-white">Frame your avatar</h3>
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/10 p-2 text-color-blue">
                                    <Crop size={20} />
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-white/70">Drag the image to choose the part you want to keep.</p>
                            <div
                                className="relative mt-4 flex aspect-square w-full max-w-[320px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/40 mx-auto cursor-grab active:cursor-grabbing"
                                onPointerDown={handleCropPointerDown}
                                onPointerMove={handleCropPointerMove}
                                onPointerUp={handleCropPointerUp}
                                onPointerLeave={handleCropPointerUp}
                                style={{ touchAction: 'none' }}
                            >
                                <div className="absolute inset-0 rounded-3xl border-[3px] border-white/90 z-10 pointer-events-none" />
                                <img
                                    src={cropImageData.dataUrl}
                                    alt="Crop preview"
                                    className="absolute left-0 top-0"
                                    style={{
                                        width: cropImageData.displayWidth,
                                        height: cropImageData.displayHeight,
                                        transform: `translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                                    }}
                                />
                            </div>
                            <div className="mt-5 flex justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={cancelCropEditor}
                                    className="crop-action-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={applyCroppedAvatar}
                                    className="crop-action-btn"
                                >
                                    Use photo
                                </button>
                            </div>
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
                                onChange={e => setName(e.target.value)}
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
                        <div className="w-full rounded-[1.4rem] border border-white/10 bg-black/20 p-3 md:p-4">
                            <div className="flex flex-wrap flex-col justify-between gap-3 w-full ">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.35em] text-text-muted/60 text-center">
                                        {avatarImage ? 'Your photo' : 'Photo avatar'}
                                    </p>                                 
                                </div>
                                <div className="flex items-center justify-center gap-2 flex-wrap w-full sm:w-auto mx-auto">
                                    <input
                                        ref={uploadInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => uploadInputRef.current?.click()}
                                        className={`${avatarActionButtonClass} h-12 w-12 p-0 shrink-0`}
                                        aria-label="Upload a photo"
                                        title="Upload a photo"
                                    >
                                        <Upload size={18} />
                                    </button>
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => cameraInputRef.current?.click()}
                                        className={`${avatarActionButtonClass} h-12 w-12 p-0 shrink-0`}
                                        aria-label="Take a photo"
                                        title="Take a photo"
                                    >
                                        <Camera size={18} />
                                    </button>
                                    {avatarImage && (
                                        <button
                                            type="button"
                                            onClick={clearUploadedAvatar}
                                            className={`${avatarActionSecondaryButtonClass} h-12 w-12 p-0 shrink-0`}
                                            aria-label="Clear photo"
                                            title="Clear photo"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <label className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/60">Your Wang</label>

                        <div
                            className="flex items-center justify-between w-full max-w-80 px-2"
                            onTouchStart={!avatarImage ? handleAvatarSwipeStart : undefined}
                            onTouchEnd={!avatarImage ? handleAvatarSwipeEnd : undefined}
                        >
                            {!avatarImage && (
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => cycleStyle('prev')}
                                className="p-4 rounded-full glass hover:bg-white/10 transition-colors"
                                aria-label="Previous style"
                            >
                                <ChevronLeft size={42} />
                            </motion.button>
                            )}

                            <motion.div
                                key={`${avatar}-${avatarStyle}-${avatarImage || 'default'}`}
                                className={`relative group ${avatarImage ? 'mx-auto' : ''}`}
                            >
                                <Avatar
                                    seed={avatar}
                                    style={avatarStyle}
                                    imageUrl={avatarImage || undefined}
                                    className="w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                />
                            </motion.div>

                            {!avatarImage && (
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => cycleStyle('next')}
                                className="p-4 rounded-full glass hover:bg-white/10 transition-colors"
                                aria-label="Next style"
                            >
                                <ChevronRight size={42} />
                            </motion.button>
                            )}
                        </div>
                    </div>

                    {!avatarImage && (
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/60 ml-4">{avatarStyle.replace('-', ' ')}</label>
                        <div className="flex flex-wrap gap-2 p-3 glass rounded-4xl border-white/10 shadow-inner bg-black/20 h-80 overflow-y-auto content-start avatar-scrollbar">
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
                                                ? 'bg-white/10 scale-105 z-10'
                                                : taken
                                                    ? 'opacity-20 cursor-not-allowed'
                                                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                                            }
                                            `}
                                        style={{
                                            width: 'calc(33.333% - 6px)'
                                            
                                        }}
                                        title={getAvatarName(a)}
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
                    )}

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
