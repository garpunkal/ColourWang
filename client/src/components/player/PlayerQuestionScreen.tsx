import { useState, useEffect, useCallback } from 'react';
import { audioManager } from '../../utils/audioManager';
import { hapticFeedback } from '../../utils/hapticFeedback';
import { motion, AnimatePresence } from 'framer-motion';

import type { Socket } from 'socket.io-client';
import type { Question, GameState } from '../../types/game';
import { ColorCard } from '../ColorCard';
import { Avatar } from '../GameAvatars';
import { getAvatarColor } from '../../constants/avatars';
import { sortColors } from '../../config/gameConfig';

interface Props {
    socket: Socket;
    gameState: GameState;
    currentQuestion: Question;
    currentQuestionIndex: number;
}

export function PlayerQuestionScreen({ socket, gameState, currentQuestion, currentQuestionIndex }: Props) {
    const me = gameState.players.find(p => p.socketId === socket.id || p.id === localStorage.getItem('cw_playerId'));
    const myId = localStorage.getItem('cw_playerId');
    const [stealCardActiveThisQuestion, setStealCardActiveThisQuestion] = useState(true);
    const [selectedColors, setSelectedColors] = useState<string[]>(me?.lastAnswer || []);
    const [hasAnswered, setHasAnswered] = useState(me?.lastAnswer != null);
    const [isBlockedThisQuestion, setIsBlockedThisQuestion] = useState(Boolean(me?.isBlockedThisQuestion));
    const [hasUsedBlockCard, setHasUsedBlockCard] = useState(Boolean(me?.blockCardUsed));
    const [blockCardPending, setBlockCardPending] = useState(false);
    const [isBlockTargetPickerOpen, setIsBlockTargetPickerOpen] = useState(false);
    const [blockedPlayerIds, setBlockedPlayerIds] = useState<string[]>(
        gameState.players.filter(p => p.isBlockedThisQuestion).map(p => p.id)
    );
    const [playersAnswered, setPlayersAnswered] = useState<{ id: string; hasAnswered: boolean }[]>(
        gameState.players.map(p => ({ id: p.id, hasAnswered: p.lastAnswer !== null }))
    );

    const [stealNotice, setStealNotice] = useState<{ name: string; value: number } | null>(null);
    const [blockNotice, setBlockNotice] = useState<{ blockerName: string } | null>(null);
    const [disabledIndexes, setDisabledIndexes] = useState<number[]>(me?.disabledIndexes || []);
    const [timeLeft, setTimeLeft] = useState(gameState.timerDuration || 30);

    const targetablePlayers = gameState.players.filter(p => {
        if (!myId || p.id === myId) return false;
        const alreadyBlocked = blockedPlayerIds.includes(p.id);
        return !alreadyBlocked;
    });

    const submitAnswer = useCallback(() => {
        if (isBlockedThisQuestion) {
            return;
        }

        if (gameState && selectedColors.length > 0) {
            setHasAnswered(true);
            hapticFeedback.medium();
            socket.emit('submit-answer', {
                code: gameState.code,
                answers: selectedColors,
                useStealCard: false
            });
        }
    }, [gameState, selectedColors, socket, isBlockedThisQuestion]);

    const toggleColour = useCallback((colour: string) => {
        if (hasAnswered || isBlockedThisQuestion) return;
        audioManager.playSelect();
        hapticFeedback.light();
        setSelectedColors(prev =>
            prev.includes(colour)
                ? prev.filter(c => c !== colour)
                : [...prev, colour]
        );
    }, [hasAnswered, isBlockedThisQuestion]);

    // Listen for events
    useEffect(() => {
        const answerHandler = (players: { id: string; hasAnswered: boolean }[]) => {
            setPlayersAnswered(players);
        };

        const stealHandler = ({ playerId, value, disabledMap }: { playerId: string, value: number, disabledMap: Record<string, number[]> }) => {
            const stealer = gameState.players.find(p => p.id === playerId);

            if (!hasAnswered) {
                if (stealer && playerId !== myId) {
                    audioManager.playSteal();
                    setStealNotice({ name: stealer.name, value });
                    setTimeout(() => setStealNotice(null), 1500);
                }
                if (myId && playerId !== myId && disabledMap && disabledMap[myId]) {
                    const newDisabledIndexes = disabledMap[myId];
                    setDisabledIndexes(newDisabledIndexes);
                    
                    // Remove any selected colors that are now disabled
                    setSelectedColors(prev => {
                        return prev.filter(color => {
                            const colorIndex = currentQuestion.options.indexOf(color);
                            return !newDisabledIndexes.includes(colorIndex);
                        });
                    });
                }
            }
            setStealCardActiveThisQuestion(false);
        };

        const blockHandler = ({ playerId, targetPlayerId }: { playerId: string, targetPlayerId: string }) => {
            const blocker = gameState.players.find(p => p.id === playerId);

            setBlockedPlayerIds(prev => (prev.includes(targetPlayerId) ? prev : [...prev, targetPlayerId]));

            if (targetPlayerId === myId) {
                setIsBlockedThisQuestion(true);
                setSelectedColors([]);
                if (blocker && playerId !== myId) {
                    audioManager.playSteal();
                    setBlockNotice({ blockerName: blocker.name });
                    setTimeout(() => setBlockNotice(null), 3500);
                }
            }

            if (playerId === myId) {
                setHasUsedBlockCard(true);
                setBlockCardPending(false);
                setIsBlockTargetPickerOpen(false);
            }
        };


        socket.on('player-answered', answerHandler);
        socket.on('steal-card-used', stealHandler);
        socket.on('block-card-used', blockHandler);

        return () => {
            socket.off('player-answered', answerHandler);
            socket.off('steal-card-used', stealHandler);
            socket.off('block-card-used', blockHandler);
        };
    }, [socket, gameState.players, hasAnswered, myId, currentQuestion.options]);

    // Timer and Reset Logic
    useEffect(() => {
        const anyoneStole = gameState.players.some(p => p.disabledIndexes && p.disabledIndexes.length > 0);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStealCardActiveThisQuestion(!anyoneStole);
        const submittedAnswer = me?.lastAnswer ?? null;
        setSelectedColors(submittedAnswer || []);
        setHasAnswered(submittedAnswer != null);
        setIsBlockedThisQuestion(Boolean(me?.isBlockedThisQuestion));
        setBlockCardPending(false);
        setIsBlockTargetPickerOpen(false);
        setBlockedPlayerIds(gameState.players.filter(p => p.isBlockedThisQuestion).map(p => p.id));
        setBlockNotice(null);
        setTimeLeft(gameState.timerDuration || 30);
        setDisabledIndexes(me?.disabledIndexes || []);
    }, [currentQuestionIndex, gameState.players, gameState.timerDuration, me?.disabledIndexes, me?.isBlockedThisQuestion]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                const next = prev - 1;
                if (next <= 5 && next > 0) audioManager.playTick(next);
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [currentQuestionIndex]);

    useEffect(() => {
        if (timeLeft === 0 && !hasAnswered) {
            if (selectedColors.length > 0) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                submitAnswer();
            } else {
                setHasAnswered(true);
                socket.emit('submit-answer', {
                    code: gameState.code,
                    answers: [],
                    useStealCard: false
                });
            }
        }
    }, [timeLeft, hasAnswered, selectedColors.length, socket, gameState.code, submitAnswer]);

    // Keyboard navigation support
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (hasAnswered || timeLeft === 0 || isBlockedThisQuestion) return;

            const sortedOptions = sortColors(currentQuestion.options);
            
            // Number keys 1-9 to select colors
            if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                if (index < sortedOptions.length && !disabledIndexes.includes(sortedOptions.indexOf(sortedOptions[index]))) {
                    toggleColour(sortedOptions[index]);
                }
            }
            
            // Enter to submit answer
            if (e.key === 'Enter' && selectedColors.length > 0) {
                submitAnswer();
            }
            
            // Escape to clear selection
            if (e.key === 'Escape' && selectedColors.length > 0) {
                audioManager.playSelect();
                setSelectedColors([]);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [hasAnswered, timeLeft, disabledIndexes, selectedColors, currentQuestion.options, submitAnswer, toggleColour, isBlockedThisQuestion]);

    const avatarColor = getAvatarColor(me?.avatar || 'cyber-blue');

    return (
        <motion.div
            key="question"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col gap-2 md:gap-8 relative overflow-hidden"
        >
            <AnimatePresence>
                {stealNotice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-110 flex items-center justify-center pointer-events-none p-6"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 3, rotate: -30, opacity: 0, filter: 'blur(20px)' }}
                            animate={{ scale: 0.6, rotate: -10, opacity: 1, filter: 'blur(0px)' }}
                            transition={{ type: "spring", damping: 14, stiffness: 200 }}
                            className="relative"
                        >
                            <div className="bg-color-pink border-8 md:border-12 border-white px-8 md:px-12 py-6 md:py-8 flex flex-col items-center rounded-lg shadow-2xl">
                                <span className="text-3xl md:text-[5rem] font-black text-white leading-tight tracking-tighter italic uppercase text-center drop-shadow-lg">
                                    {stealNotice.name}
                                </span>
                                <span className="text-4xl md:text-[8rem] font-black text-white leading-tight tracking-tighter italic uppercase text-center drop-shadow-xl -mt-4">
                                    STOLE {stealNotice.value} {stealNotice.value === 1 ? 'CARD' : 'CARDS'}!
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {blockNotice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-110 flex items-center justify-center pointer-events-none p-6"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.4, 0.6] }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 bg-error/40 mix-blend-color-dodge backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 3, rotate: -30, opacity: 0, filter: 'blur(20px)' }}
                            animate={{ scale: 0.6, rotate: -10, opacity: 1, filter: 'blur(0px)' }}
                            transition={{ type: "spring", damping: 14, stiffness: 200 }}
                            className="relative"
                        >
                            <div className="bg-error border-8 md:border-12 border-white px-8 md:px-12 py-6 md:py-8 flex flex-col items-center rounded-lg shadow-2xl">
                                <span className="text-3xl md:text-[5rem] font-black text-white leading-tight tracking-tighter italic uppercase text-center drop-shadow-lg">
                                    {blockNotice.blockerName}
                                </span>
                                <span className="text-4xl md:text-[8rem] font-black text-white leading-tight tracking-tighter italic uppercase text-center drop-shadow-xl -mt-4">
                                    BLOCKED YOU!
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center px-2 md:px-4 shrink-0 py-0.5 md:py-2">
                <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1 md:mb-8 glass-panel px-2 md:px-4 py-1 rounded-2xl mx-auto w-fit">
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Round</span>
                        <span className="text-lg font-black italic tracking-tighter text-white">{gameState.currentRoundIndex + 1}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Question</span>
                        <span className="text-lg font-black italic tracking-tighter text-white">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Time Left</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-lg font-black font-mono tabular-nums italic tracking-tighter transition-colors ${timeLeft <= 5 ? 'text-error animate-pulse' : 'text-color-blue'}`}>{timeLeft}</span>
                            <span className={`text-[8px] font-black opacity-40 ${timeLeft <= 5 ? 'text-error' : ''}`}>S</span>
                        </div>
                    </div>
                    {gameState.streaksEnabled && me && me.streak > 0 && (
                        <>
                            <div className="w-px h-6 bg-white/10" />
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex flex-col items-center leading-none"
                            >
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Streak</span>
                                <motion.div 
                                    className="flex items-center gap-1"
                                    animate={me.streak >= 3 ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                    <span className={`text-lg font-black italic tracking-tighter ${me.streak >= 3 ? 'text-color-yellow' : 'text-color-orange'}`}>
                                        {me.streak >= 3 ? '🔥' : '⚡'} {me.streak}
                                    </span>
                                    {me.streak >= 3 && (
                                        <span className="text-[8px] font-black text-color-yellow opacity-80">×1.5</span>
                                    )}
                                </motion.div>
                            </motion.div>
                        </>
                    )}
                </div>
                <h3 
                    className="text-lg md:text-4xl lg:text-5xl text-display text-display-gradient px-2 md:px-8 py-0.5 md:py-2 text-center max-w-4xl mx-auto"
                    style={{ 
                        lineHeight: '1.1',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                    }}
                    role="heading"
                    aria-level={1}
                    aria-live="polite"
                >
                    {currentQuestion.question}
                </h3>
                {isBlockedThisQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 md:mt-4 px-4 py-2 rounded-full bg-error/20 border border-error/50 mx-auto w-fit"
                    >
                        <span className="text-xs md:text-sm font-black uppercase tracking-widest text-white">Blocked this round. You cannot answer this question.</span>
                    </motion.div>
                )}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 0.4, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-1 md:mt-4 px-3 md:px-4 py-1 md:py-2 rounded-full glass-panel mx-auto w-fit border border-white/20"
                >
                    <span className="text-xs md:text-sm font-bold uppercase tracking-wider italic text-white drop-shadow-sm">
                        {(currentQuestion.correctColours || currentQuestion.correctAnswers || []).length === 1 ? (
                            <>💡 Select 1 colour</>
                        ) : (
                            <>💡 Select {(currentQuestion.correctColours || currentQuestion.correctAnswers || []).length} colours</>
                        )}
                    </span>
                </motion.div>
            </div>

            {!hasAnswered ? (
                <div className="flex flex-col gap-1 md:gap-6 items-center w-full">
                    <div className="w-full py-1 md:py-4 px-1 md:px-2">
                        <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-5 w-full max-w-4xl px-2 md:px-6 mx-auto items-center justify-items-center">
                            {sortColors(currentQuestion.options).map((color, i) =>
                                disabledIndexes.includes(currentQuestion.options.indexOf(color)) ? null : (
                                    <ColorCard
                                        key={i}
                                        color={color}
                                        isSelected={selectedColors.includes(color)}
                                        onClick={() => toggleColour(color)}
                                        disabled={hasAnswered || timeLeft === 0 || isBlockedThisQuestion}
                                        size="responsive"
                                        index={i}
                                    />
                                )
                            )}
                            {gameState.jokersEnabled !== false && me && !me.stealCardUsed && stealCardActiveThisQuestion && !isBlockedThisQuestion && (playersAnswered.filter(p => !p.hasAnswered).length >= 2) && (
                                <ColorCard
                                    key="steal"
                                    color="#FFD700"
                                    isSelected={false}
                                    onClick={() => {
                                        setStealCardActiveThisQuestion(false);
                                        socket.emit('use-steal-card', { code: gameState.code });
                                    }}
                                    disabled={hasAnswered || timeLeft === 0}
                                    size="responsive"
                                    index={currentQuestion.options.length}
                                    isStealCard={true}
                                    stealValue={me.stealCardValue}
                                />
                            )}
                        </div>
                        {gameState.blocksEnabled !== false && me && !hasUsedBlockCard && !blockCardPending && !isBlockedThisQuestion && targetablePlayers.length > 0 && (
                            <div className="w-full max-w-4xl px-2 md:px-6 mx-auto mt-3 md:mt-5">
                                <motion.button
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (targetablePlayers.length === 1) {
                                            setBlockCardPending(true);
                                            socket.emit('use-block-card', { code: gameState.code, targetPlayerId: targetablePlayers[0].id });
                                        } else {
                                            setIsBlockTargetPickerOpen(true);
                                        }
                                    }}
                                    disabled={hasAnswered || timeLeft === 0}
                                    className="group relative w-full overflow-hidden rounded-2xl border border-red-400/30 bg-red-900/20 transition-all hover:bg-red-900/30 disabled:opacity-30 disabled:grayscale"
                                    aria-label="Choose a player to block"
                                >
                                    <div className="relative flex items-center justify-center px-5 py-3 md:px-7 md:py-4">
                                        <span className="text-base md:text-xl font-bold uppercase tracking-wider text-red-200/70 group-hover:text-red-100 transition-colors">Block</span>
                                    </div>
                                </motion.button>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 w-full shrink-0 p-1.5 md:p-2 pt-0">
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => submitAnswer()}
                            disabled={selectedColors.length === 0 || timeLeft === 0 || isBlockedThisQuestion}
                            className="w-full btn btn-primary py-2.5 md:py-8 text-lg md:text-3xl transition-all flex items-center justify-center gap-2 md:gap-8 rounded-[3rem] disabled:opacity-20 disabled:grayscale italic uppercase font-black tracking-widest shrink-0 shadow-lg"
                            style={{ boxShadow: `0 20px 40px -10px ${avatarColor}60` }}
                            aria-label={`Submit answer - ${selectedColors.length} color${selectedColors.length !== 1 ? 's' : ''} selected`}
                        >
                            Submit
                        </motion.button>
                        <div className="hidden md:flex items-center justify-center gap-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">
                            <span>⌨️ Press 1-9 to select</span>
                            <span>•</span>
                            <span>Enter to submit</span>
                            <span>•</span>
                            <span>Esc to clear</span>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div
                    key="selection"
                    initial={{ scale: 0.8, opacity: 0, y: 100 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="text-center flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-3xl mx-auto px-4"
                >
                    <div className="w-full space-y-3">
                        <div className="glass p-4 md:p-5 rounded-4xl border-white/10 space-y-3 mt-6">
                            <span className="text-xs uppercase tracking-[0.4em] text-color-blue font-black italic opacity-60">Your Selection</span>
                            <div className="flex gap-2 md:gap-3 justify-center flex-wrap mt-2">
                                {selectedColors.length > 0 ? sortColors(selectedColors).map((color, i) => (
                                    <ColorCard key={i} color={color} size="mini" index={i} disabled={true} />
                                )) : (
                                    <span className="text-lg md:text-xl font-bold text-white/20 italic uppercase">Nothing selected</span>
                                )}
                            </div>
                        </div>
                         <div className="w-full mt-4 border-t border-white/5 pt-6">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">Room Status</span>
                                <span className="text-[10px] font-black font-mono text-white/50">{playersAnswered.filter(p => p.hasAnswered).length} / {gameState.players.length}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1">
                                {gameState.players.map(player => {
                                    const status = playersAnswered.find(p => p.id === player.id);
                                    const isAnswered = status?.hasAnswered || false;
                                    const playerColor = getAvatarColor(player.avatar);
                                    return (
                                        <div key={player.id} className="relative shrink-0">
                                            <div
                                                className={`w-12 h-12 rounded-full overflow-hidden border-[1.5px] transition-all duration-500 ${isAnswered ? 'opacity-100 scale-100' : 'opacity-35 grayscale scale-90'}`}
                                                style={{
                                                    borderColor: isAnswered ? playerColor : 'rgba(255,255,255,0.2)',
                                                    boxShadow: isAnswered ? `0 0 8px ${playerColor}40` : 'none'
                                                }}
                                            >
                                                <Avatar seed={player.avatar} style={player.avatarStyle} imageUrl={player.avatarImage} className="w-full h-full" />
                                            </div>
                                            <span
                                                className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black/20 ${isAnswered ? 'bg-emerald-400' : 'bg-white/30'}`}
                                                aria-hidden="true"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <AnimatePresence>
                {isBlockTargetPickerOpen && timeLeft > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-120 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl glass-panel rounded-3xl border border-white/20 p-5 md:p-8"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h4 className="text-xl md:text-3xl font-black italic uppercase tracking-tight text-white">Choose Who To Block</h4>
                                <button
                                    onClick={() => setIsBlockTargetPickerOpen(false)}
                                    className="px-3 py-1.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider text-white/70 bg-white/10 hover:bg-white/20"
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {targetablePlayers.map((player) => (
                                    <button
                                        key={player.id}
                                        onClick={() => {
                                            if (timeLeft === 0) return;
                                            setBlockCardPending(true);
                                            socket.emit('use-block-card', { code: gameState.code, targetPlayerId: player.id });
                                        }}
                                        disabled={timeLeft === 0}
                                        className="flex items-center gap-3 p-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shrink-0">
                                            <Avatar seed={player.avatar} style={player.avatarStyle} imageUrl={player.avatarImage} className="w-full h-full" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="block text-base md:text-lg font-black uppercase italic truncate">{player.name}</span>
                                            <span className="block text-[10px] font-black uppercase tracking-wider text-white/50">Tap To Block</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {targetablePlayers.length === 0 && (
                                <p className="text-sm font-bold uppercase tracking-wider text-white/50 text-center py-6">No available players to block.</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
