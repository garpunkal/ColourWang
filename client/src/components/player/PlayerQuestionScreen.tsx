import { useState, useEffect, useRef, useCallback } from 'react';
import { audioManager } from '../../utils/audioManager';
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
    // Track if steal card is available for this question (disappears for all when used)
    const [stealCardActiveThisQuestion, setStealCardActiveThisQuestion] = useState(true);
    const me = gameState.players.find(p => p.socketId === socket.id || p.id === localStorage.getItem('cw_playerId'));
    // (stolenFromIds state removed; not used)
    const stealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [selectedColors, setSelectedColors] = useState<string[]>(me?.lastAnswer || []);
    const [hasAnswered, setHasAnswered] = useState(me?.lastAnswer !== null);
    const [useStealCard, setUseStealCard] = useState(false);
    const [playersAnswered, setPlayersAnswered] = useState<{ id: string; hasAnswered: boolean }[]>(
        gameState.players.map(p => ({ id: p.id, hasAnswered: p.lastAnswer !== null }))
    );

    const [stealNotice, setStealNotice] = useState<{ name: string; value: number } | null>(null);



    // Remove stealCardClicked and confirmStealPending state
    // Submit answer logic (fixed)
    const submitAnswer = useCallback((forceStealCardOrEvent?: boolean | React.MouseEvent<HTMLButtonElement>) => {
        let forceStealCard: boolean | undefined = undefined;
        if (typeof forceStealCardOrEvent === 'boolean') {
            forceStealCard = forceStealCardOrEvent;
        }
        // use 'me' from outer scope
        const isSteal = typeof forceStealCard === 'boolean' ? forceStealCard : useStealCard;
        if (isSteal && !me?.stealCardUsed) {
            // Only emit steal event, do not submit answer
            setHasAnswered(false);
            socket.emit('use-steal-card', {
                code: gameState.code
            });
            setUseStealCard(false);
            return;
        }
        if (gameState && selectedColors.length > 0) {
            setHasAnswered(true);
            socket.emit('submit-answer', {
                code: gameState.code,
                answers: selectedColors,
                useStealCard: false
            });
            setUseStealCard(false);
        }
    }, [gameState, selectedColors, socket, useStealCard, me]);
    const [disabledIndexes, setDisabledIndexes] = useState<number[]>(me?.disabledIndexes || []);
    const [timeLeft, setTimeLeft] = useState(gameState.timerDuration || 30);


    // Listen for player-answered events
    useEffect(() => {
        const handler = (players: { id: string; hasAnswered: boolean }[]) => {
            setPlayersAnswered(players);
        };
        socket.on('player-answered', handler);
        return () => {
            socket.off('player-answered', handler);
        };
    }, [socket]);

    // Reset answer state when question changes
    useEffect(() => {
        // Reset steal card for new question
        const anyoneStole = gameState.players.some(p => p.disabledIndexes && p.disabledIndexes.length > 0);
        setTimeout(() => setStealCardActiveThisQuestion(!anyoneStole), 0);
        // No localStealCardUsed to reset
        // Use setTimeout to avoid cascading renders
        const timer = setTimeout(() => {
            setSelectedColors([]);
            setHasAnswered(false);
            setTimeLeft(gameState.timerDuration || 30);
            setDisabledIndexes(me?.disabledIndexes || []);
        }, 0);
        return () => clearTimeout(timer);
    }, [currentQuestionIndex]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                const next = prev - 1;
                // Play tick sound for last 5 seconds (5, 4, 3, 2, 1)
                if (next <= 5 && next > 0) audioManager.playTick(next);
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState.timerDuration, currentQuestionIndex]);

    // const me = ... (removed duplicate declaration)
    if (typeof window !== 'undefined') {
        // Debug log for player object and stealCardValue
        // console.log('[DEBUG] PlayerQuestionScreen: me', me, 'stealCardValue', me?.stealCardValue);
        // if (gameState.players.some(p => typeof p.stealCardValue !== 'number')) {
        //     console.warn('[DEBUG] Some players missing stealCardValue:', gameState.players);
        // }
    }
    const avatarColor = getAvatarColor(me?.avatar || 'cyber-blue');


    const toggleColor = (color: string) => {
        if (hasAnswered) return;

        // Play select sound
        audioManager.playSelect();

        setSelectedColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };
    useEffect(() => {
        const handler = ({ playerId, value, disabledMap }: { playerId: string, value: number, disabledMap: Record<string, number[]> }) => {
            const myId = localStorage.getItem('cw_playerId');
            const stealer = gameState.players.find(p => p.id === playerId);

            // Only show notice and apply disabled cards if I haven't answered yet
            if (!hasAnswered) {
                if (stealer && playerId !== myId) {
                    audioManager.playSteal();
                    setStealNotice({ name: stealer.name, value });
                    setTimeout(() => setStealNotice(null), 3500); // Clear after 3.5s
                }

                if (myId && playerId !== myId && disabledMap && disabledMap[myId]) {
                    setDisabledIndexes(disabledMap[myId]);
                }
            }

            // Disable STEAL card UI for all players as soon as one is used (for this question only)
            setUseStealCard(false);
            setStealCardActiveThisQuestion(false);

            if (stealTimeoutRef.current) clearTimeout(stealTimeoutRef.current);
        };
        const currentTimeout = stealTimeoutRef.current;
        socket.on('steal-card-used', handler);
        return () => {
            socket.off('steal-card-used', handler);
            if (currentTimeout) clearTimeout(currentTimeout);
        };
    }, [socket, gameState.currentQuestionIndex, gameState.players, hasAnswered]);


    // Reset disabledIndexes when question changes (already handled in the effect above, but keeping for safety if question changes but gameState doesn't update immediately)
    useEffect(() => {
        if (!me?.disabledIndexes || me.disabledIndexes.length === 0) {
            const timer = setTimeout(() => {
                setDisabledIndexes([]);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [currentQuestionIndex, me?.disabledIndexes]);

    // Unselect any colors that are now disabled (cards that disappear)
    useEffect(() => {
        if (disabledIndexes.length > 0) {
            const timer = setTimeout(() => {
                setSelectedColors(prev => prev.filter((color) => !disabledIndexes.includes(currentQuestion.options.indexOf(color))));
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [disabledIndexes, currentQuestion.options]);

    useEffect(() => {
        if (timeLeft === 0 && !hasAnswered) {
            // Use setTimeout to avoid synchronous state update in effect
            const timer = setTimeout(() => {
                if (selectedColors.length > 0) {
                    submitAnswer();
                } else {
                    setHasAnswered(true);
                    socket.emit('submit-answer', {
                        code: gameState.code,
                        answers: [],
                        useStealCard: false
                    });
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, hasAnswered, selectedColors, submitAnswer, gameState.code, socket]);



    return (
        <motion.div
            key="question"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col gap-4 md:gap-8 relative"
        >
            <AnimatePresence>
                {stealNotice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-110 flex items-center justify-center pointer-events-none p-6"
                    >
                        {/* High-impact background flash & heavy blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.4, 0.6] }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 bg-color-pink/40 mix-blend-color-dodge backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ scale: 3, rotate: -30, opacity: 0, filter: 'blur(20px)' }}
                            animate={{ scale: 0.6, rotate: -10, opacity: 1, filter: 'blur(0px)' }}
                            transition={{
                                type: "spring",
                                damping: 14,
                                stiffness: 200,
                            }}
                            className="relative"
                        >
                            <div
                                className="bg-color-pink border-8 md:border-12 border-white px-8 md:px-12 py-6 md:py-8 flex flex-col items-center rounded-lg"
                                style={{
                                    boxShadow: '0 25px 50px rgba(248,58,123,0.8), 0 0 40px rgba(255,255,255,0.3), inset 0 0 0 4px rgba(0,0,0,0.2)',
                                    background: 'linear-gradient(135deg, #f83a7b 0%, #d42d6a 100%)'
                                }}
                            >
                                <span className="text-3xl md:text-[5rem] font-black text-white leading-none tracking-tighter italic uppercase text-center drop-shadow-[0_8px_15px_rgba(0,0,0,0.7)]">
                                    {stealNotice.name}
                                </span>
                                <span className="text-4xl md:text-[8rem] font-black text-white leading-none tracking-tighter italic uppercase text-center drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] -mt-1 md:-mt-4">
                                    STOLE {stealNotice.value} {stealNotice.value === 1 ? 'CARD' : 'CARDS'}!
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center px-4 shrink-0">
                <div className="flex items-center justify-center gap-4 mb-4 md:mb-8 glass-panel px-6 py-3 rounded-2xl mx-auto w-fit">
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Question</span>
                        <span className="text-2xl font-black italic tracking-tighter text-white">
                            {currentQuestionIndex + 1}
                        </span>
                    </div>

                    <div className="w-px h-8 bg-white/10" />

                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Time Left</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black font-mono tabular-nums italic tracking-tighter transition-colors ${timeLeft <= 5 ? 'text-error animate-pulse' : 'text-color-blue'}`}>
                                {timeLeft}
                            </span>
                            <span className={`text-[10px] font-black opacity-40 transition-colors ${timeLeft <= 5 ? 'text-error animate-pulse' : ''}`}>S</span>
                        </div>
                    </div>
                </div>
                <h3 className="text-2xl md:text-5xl text-display text-display-gradient px-2">{currentQuestion.question}</h3>
            </div>

            {!hasAnswered ? (
                <div className="flex-1 flex flex-col gap-4 md:gap-6 justify-center items-center min-h-0">
                    <div
                        className="flex-1 w-full flex justify-center items-center min-h-0 py-2"
                        style={{ minHeight: '25vh' }}
                    >
                        <div
                            className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 lg:gap-5 w-full max-w-7xl px-2 md:px-6 mx-auto items-center justify-items-center"
                        >
                            {currentQuestion.options.map((color, i) =>
                                disabledIndexes.includes(i) ? null : (
                                    <ColorCard
                                        key={i}
                                        color={color}
                                        isSelected={selectedColors.includes(color)}
                                        onClick={() => toggleColor(color)}
                                        disabled={hasAnswered || timeLeft === 0}
                                        size="responsive"
                                        index={i}
                                    />
                                )
                            )}
                            {gameState.jokersEnabled !== false && me && !me.stealCardUsed && stealCardActiveThisQuestion && (playersAnswered.filter(p => !p.hasAnswered).length >= 2) && (
                                <ColorCard
                                    key="steal"
                                    color="#FFD700" // Gold color for STEAL card
                                    isSelected={false}
                                    onClick={() => {
                                        setUseStealCard(true);
                                        setStealCardActiveThisQuestion(false); // Instantly hide for this player
                                        socket.emit('use-steal-card', {
                                            code: gameState.code
                                        });
                                    }}
                                    disabled={hasAnswered || timeLeft === 0}
                                    size="responsive"
                                    index={currentQuestion.options.length}
                                    isStealCard={true}
                                    stealValue={me.stealCardValue}
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                        {/* Normal submit button */}
                        <motion.button
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={e => submitAnswer(e)}
                            disabled={selectedColors.length === 0 || timeLeft === 0}
                            className="btn btn-primary w-full py-4 md:py-12 text-xl md:text-3xl transition-all flex items-center justify-center gap-4 md:gap-8 rounded-[3rem] disabled:opacity-20 disabled:grayscale italic border-t-2 md:border-t-4 border-white/30 uppercase font-black tracking-widest shrink-0"
                            style={{
                                boxShadow: `0 20px 40px -10px ${avatarColor}60`,
                                borderColor: `${avatarColor}80`
                            }}
                        >
                            Submit
                        </motion.button>
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
                        <div className="glass p-4 md:p-5 rounded-4xl md:rounded-4xl border-white/10 space-y-3 mt-6">
                            <span className="text-xs uppercase tracking-[0.4em] text-color-blue font-black italic opacity-60">Your Selection</span>
                            <div className="flex gap-2 md:gap-3 justify-center flex-wrap mt-2">
                                {selectedColors.length > 0 ? sortColors(selectedColors).map((color, i) => (
                                    <ColorCard
                                        key={i}
                                        color={color}
                                        size="mini"
                                        index={i}
                                        disabled={true}
                                    />
                                )) : (
                                    <span className="text-lg md:text-xl font-bold text-white/20 italic uppercase">Nothing selected</span>
                                )}
                            </div>
                        </div>

                        {/* Player Submission Status */}
                        <div className="w-full mt-4 border-t border-white/5 pt-6">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">
                                    Room Status
                                </span>
                                <span className="text-[10px] font-black font-mono text-white/50">
                                    {playersAnswered.filter(p => p.hasAnswered).length} / {gameState.players.length}
                                </span>
                            </div>

                            <div className="flex flex-wrap justify-center gap-2">
                                {gameState.players.map(player => {
                                    const status = playersAnswered.find(p => p.id === player.id);
                                    const isAnswered = status?.hasAnswered || false;
                                    const playerColor = getAvatarColor(player.avatar);

                                    return (
                                        <div
                                            key={player.id}
                                            className={`relative w-8 h-8 rounded-lg overflow-hidden transition-all duration-500 ${isAnswered ? 'opacity-100 scale-100' : 'opacity-30 grayscale scale-90'}`}
                                            style={{

                                                boxShadow: isAnswered ? `0 0 10px ${playerColor}40` : 'none'
                                            }}
                                        >
                                            <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </motion.div>
            )
            }
        </motion.div >
    );
}
