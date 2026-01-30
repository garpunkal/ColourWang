import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Socket } from 'socket.io-client';
import type { Question, GameState } from '../../types/game';
import { Send, Check } from 'lucide-react';

import { ColorCard } from '../ColorCard';
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
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [useStealCard, setUseStealCard] = useState(false);
    const [playersAnswered, setPlayersAnswered] = useState<{ id: string; hasAnswered: boolean }[]>([]);
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
    const [disabledIndexes, setDisabledIndexes] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(gameState.timerDuration || 15);

    // Reset answer state when question changes
    useEffect(() => {
        // Reset steal card for new question
        setStealCardActiveThisQuestion(true);
        // No localStealCardUsed to reset
        // Use setTimeout to avoid cascading renders
        const timer = setTimeout(() => {
            setSelectedColors([]);
            setHasAnswered(false);
            setTimeLeft(gameState.timerDuration || 15);
            setPlayersAnswered([]);
        }, 0);
        return () => clearTimeout(timer);
    }, [currentQuestionIndex, gameState.timerDuration]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
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
        setSelectedColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };
    // Listen for steal-card-used event to randomly disable cards for this round
    useEffect(() => {
        const handler = ({ playerId, disabledMap }: { playerId: string, value: number, disabledMap: Record<string, number[]> }) => {
            const myId = localStorage.getItem('cw_playerId');
            console.log('[DEBUG] steal-card-used handler fired', { playerId, myId, disabledMap });

            // Disable STEAL card UI for all players as soon as one is used (for this question only)
            setUseStealCard(false);
            setStealCardActiveThisQuestion(false);

            if (myId && playerId !== myId && disabledMap && disabledMap[myId]) {
                console.log('[DEBUG] Disabling indexes for me:', disabledMap[myId]);
                setDisabledIndexes(disabledMap[myId]);
            }

            // Show flyover STEAL text for all affected players (except the stealer)
            // (removed: setStolenFromIds, since stolenFromIds state is not used)
            if (stealTimeoutRef.current) clearTimeout(stealTimeoutRef.current);
        };
        socket.on('steal-card-used', handler);
        return () => {
            socket.off('steal-card-used', handler);
            const timeout = stealTimeoutRef.current;
            if (timeout) clearTimeout(timeout);
        };
    }, [socket, gameState.currentQuestionIndex]);

    // Reset disabledIndexes when question changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDisabledIndexes([]);
        }, 0);
        return () => clearTimeout(timer);
    }, [currentQuestionIndex]);

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
                        answers: []
                    });
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, hasAnswered, selectedColors, submitAnswer, gameState.code, socket]);

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



    return (
        <motion.div
            key="question"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col gap-8"
        >
            <div className="text-center px-4">
                <div
                    className="inline-block px-6 py-2 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] mb-6 italic shadow-xl"
                    style={{
                        backgroundColor: `${avatarColor}20`,
                        border: `1px solid ${avatarColor}40`,
                        color: avatarColor
                    }}
                >
                    Question {currentQuestionIndex + 1}
                </div>
                <h3 className="text-3xl md:text-5xl text-display text-display-gradient px-4">{currentQuestion.question}</h3>

                {/* Player submission status */}
                {playersAnswered.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center gap-2 mt-4 flex-wrap px-2"
                    >
                        {gameState.players.map((player) => {
                            const playerStatus = playersAnswered.find(p => p.id === player.id);
                            const playerColor = getAvatarColor(player.avatar);
                            const isAnswered = playerStatus?.hasAnswered || false;

                            return (
                                <motion.div
                                    key={player.id}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                                    style={{
                                        backgroundColor: isAnswered ? `${playerColor}30` : `${playerColor}10`,
                                        border: `1px solid ${isAnswered ? playerColor : `${playerColor}30`}`,
                                        color: playerColor,
                                        opacity: isAnswered ? 1 : 0.5
                                    }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: playerColor }}
                                    />
                                    <span className="uppercase tracking-wider">{player.name}</span>
                                    {isAnswered && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                        >
                                            <Check size={12} strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {!hasAnswered ? (
                <div className="flex-1 flex flex-col gap-6 justify-center items-center min-h-0">
                    <div
                        className="flex-1 w-full flex justify-center items-center min-h-0"
                        style={{ minHeight: '30vh' }}
                    >
                        <div
                            className="grid mx-auto"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
                                gap: '3vw',
                                width: '100%',
                                maxWidth: '420px',
                                alignItems: 'center',
                                justifyItems: 'center',
                                margin: '0 auto',
                            }}
                        >
                            {currentQuestion.options.map((color, i) =>
                                disabledIndexes.includes(i)
                                    ? (
                                        <div
                                            key={i}
                                            style={{ width: '100%', aspectRatio: '3/4', maxWidth: '110px', minWidth: '70px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        />
                                    )
                                    : (
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
                            {/* STEAL card at the end */}
                            {me && !me.stealCardUsed && stealCardActiveThisQuestion && (
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
                            className="btn btn-primary w-full py-6 md:py-12 text-2xl md:text-3xl transition-all flex items-center justify-center gap-6 md:gap-8 rounded-3xl md:rounded-[3rem] disabled:opacity-20 disabled:grayscale italic border-t-4 border-white/30 uppercase font-black tracking-widest"
                            style={{
                                boxShadow: `0 40px 80px -20px ${avatarColor}60`,
                                borderColor: `${avatarColor}80`
                            }}
                        >
                            Submit <Send fill="currentColor" size={32} />
                        </motion.button>
                    </div>
                </div>
            ) : (
                <motion.div
                    key="selection"
                    initial={{ scale: 0.8, opacity: 0, y: 100 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="text-center flex flex-col items-center justify-center gap-6 w-full max-w-lg mx-auto px-2"
                >
                    <div className="w-full space-y-3">
                        <div className="glass p-4 md:p-5 rounded-4xl md:rounded-4xl border-white/10 space-y-3 mt-6">
                            <span className="text-xs uppercase tracking-[0.4em] text-color-blue font-black italic opacity-60">Your Selection</span>
                            <div className="flex gap-2 md:gap-3 justify-center flex-wrap mt-2">
                                {selectedColors.length > 0 ? sortColors(selectedColors).map((color, i) => (
                                    <ColorCard
                                        key={i}
                                        color={color}
                                        size="small"
                                        index={i}
                                        disabled={true}
                                    />
                                )) : (
                                    <span className="text-lg md:text-xl font-bold text-white/20 italic uppercase">Nothing selected</span>
                                )}
                            </div>
                        </div>
                        <p className="text-text-muted font-bold text-lg leading-relaxed italic opacity-80">Awaiting results...</p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
