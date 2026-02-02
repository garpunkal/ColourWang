import { useState, useEffect, useCallback } from 'react';
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
    const me = gameState.players.find(p => p.socketId === socket.id || p.id === localStorage.getItem('cw_playerId'));
    const [stealCardActiveThisQuestion, setStealCardActiveThisQuestion] = useState(true);
    const [selectedColors, setSelectedColors] = useState<string[]>(me?.lastAnswer || []);
    const [hasAnswered, setHasAnswered] = useState(me?.lastAnswer !== null);
    const [playersAnswered, setPlayersAnswered] = useState<{ id: string; hasAnswered: boolean }[]>(
        gameState.players.map(p => ({ id: p.id, hasAnswered: p.lastAnswer !== null }))
    );

    const [stealNotice, setStealNotice] = useState<{ name: string; value: number } | null>(null);
    const [disabledIndexes, setDisabledIndexes] = useState<number[]>(me?.disabledIndexes || []);
    const [timeLeft, setTimeLeft] = useState(gameState.timerDuration || 30);

    const submitAnswer = useCallback(() => {
        if (gameState && selectedColors.length > 0) {
            setHasAnswered(true);
            socket.emit('submit-answer', {
                code: gameState.code,
                answers: selectedColors,
                useStealCard: false
            });
        }
    }, [gameState, selectedColors, socket]);

    const toggleColour = (colour: string) => {
        if (hasAnswered) return;
        audioManager.playSelect();
        setSelectedColors(prev =>
            prev.includes(colour)
                ? prev.filter(c => c !== colour)
                : [...prev, colour]
        );
    };

    // Listen for events
    useEffect(() => {
        const answerHandler = (players: { id: string; hasAnswered: boolean }[]) => {
            setPlayersAnswered(players);
        };

        const stealHandler = ({ playerId, value, disabledMap }: { playerId: string, value: number, disabledMap: Record<string, number[]> }) => {
            const myId = localStorage.getItem('cw_playerId');
            const stealer = gameState.players.find(p => p.id === playerId);

            if (!hasAnswered) {
                if (stealer && playerId !== myId) {
                    audioManager.playSteal();
                    setStealNotice({ name: stealer.name, value });
                    setTimeout(() => setStealNotice(null), 3500);
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


        socket.on('player-answered', answerHandler);
        socket.on('steal-card-used', stealHandler);

        return () => {
            socket.off('player-answered', answerHandler);
            socket.off('steal-card-used', stealHandler);
        };
    }, [socket, gameState.players, hasAnswered]);

    // Timer and Reset Logic
    useEffect(() => {
        const anyoneStole = gameState.players.some(p => p.disabledIndexes && p.disabledIndexes.length > 0);
        setStealCardActiveThisQuestion(!anyoneStole);
        setSelectedColors([]);
        setHasAnswered(false);
        setTimeLeft(gameState.timerDuration || 30);
        setDisabledIndexes(me?.disabledIndexes || []);
    }, [currentQuestionIndex]);

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
    }, [timeLeft, hasAnswered]);

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
                            animate={{ opacity: [0, 1, 0.4, 0.6] }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 bg-color-pink/40 mix-blend-color-dodge backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 3, rotate: -30, opacity: 0, filter: 'blur(20px)' }}
                            animate={{ scale: 0.6, rotate: -10, opacity: 1, filter: 'blur(0px)' }}
                            transition={{ type: "spring", damping: 14, stiffness: 200 }}
                            className="relative"
                        >
                            <div className="bg-color-pink border-8 md:border-12 border-white px-8 md:px-12 py-6 md:py-8 flex flex-col items-center rounded-lg shadow-2xl">
                                <span className="text-3xl md:text-[5rem] font-black text-white leading-none tracking-tighter italic uppercase text-center drop-shadow-lg">
                                    {stealNotice.name}
                                </span>
                                <span className="text-4xl md:text-[8rem] font-black text-white leading-none tracking-tighter italic uppercase text-center drop-shadow-xl -mt-4">
                                    STOLE {stealNotice.value} {stealNotice.value === 1 ? 'CARD' : 'CARDS'}!
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center px-4 shrink-0 py-2">
                <div className="flex items-center justify-center gap-2 mb-4 md:mb-8 glass-panel px-4 py-1 rounded-2xl mx-auto w-fit">
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
                </div>
                <h3 className="text-xl md:text-5xl text-display text-display-gradient px-4 md:px-8 leading-tight py-2">{currentQuestion.question}</h3>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 0.4, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-2 md:mt-4 px-3 py-1 md:py-2 rounded-full glass-panel mx-auto w-fit opacity-60"
                >
                    <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider italic">
                        {(currentQuestion.correctColours || currentQuestion.correctAnswers || []).length === 1 ? (
                            <span className="text-white/50">💡 Select 1 colour</span>
                        ) : (
                            <span className="text-white/50">💡 Select {(currentQuestion.correctColours || currentQuestion.correctAnswers || []).length} colours</span>
                        )}
                    </span>
                </motion.div>
            </div>

            {!hasAnswered ? (
                <div className="flex-1 flex flex-col gap-2 md:gap-6 items-center min-h-0 w-full overflow-hidden">
                    <div className="flex-1 w-full overflow-y-auto min-h-0 py-1 md:py-8 px-1">
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 lg:gap-5 w-full max-w-7xl px-2 md:px-6 mx-auto items-center justify-items-center">
                            {sortColors(currentQuestion.options).map((color, i) =>
                                disabledIndexes.includes(currentQuestion.options.indexOf(color)) ? null : (
                                    <ColorCard
                                        key={i}
                                        color={color}
                                        isSelected={selectedColors.includes(color)}
                                        onClick={() => toggleColour(color)}
                                        disabled={hasAnswered || timeLeft === 0}
                                        size="responsive"
                                        index={i}
                                        showLabel={gameState.accessibleLabels}
                                    />
                                )
                            )}
                            {gameState.jokersEnabled !== false && me && !me.stealCardUsed && stealCardActiveThisQuestion && (playersAnswered.filter(p => !p.hasAnswered).length >= 2) && (
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
                    </div>
                    <div className="flex gap-2 w-full shrink-0 p-2 pt-0">
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => submitAnswer()}
                            disabled={selectedColors.length === 0 || timeLeft === 0}
                            className="w-full btn btn-primary py-3 md:py-8 text-xl md:text-3xl transition-all flex items-center justify-center gap-2 md:gap-8 rounded-[3rem] disabled:opacity-20 disabled:grayscale italic uppercase font-black tracking-widest shrink-0 shadow-lg"
                            style={{ boxShadow: `0 20px 40px -10px ${avatarColor}60` }}
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
                        <div className="glass p-4 md:p-5 rounded-4xl border-white/10 space-y-3 mt-6">
                            <span className="text-xs uppercase tracking-[0.4em] text-color-blue font-black italic opacity-60">Your Selection</span>
                            <div className="flex gap-2 md:gap-3 justify-center flex-wrap mt-2">
                                {selectedColors.length > 0 ? sortColors(selectedColors).map((color, i) => (
                                    <ColorCard key={i} color={color} size="mini" index={i} disabled={true} showLabel={gameState.accessibleLabels} />
                                )) : (
                                    <span className="text-lg md:text-xl font-bold text-white/20 italic uppercase">Nothing selected</span>
                                )}
                            </div>
                        </div>
                        <div className="w-full mt-4 border-t border-white/5 pt-6">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">Room Status</span>
                                <span className="text-[10px] font-black font-mono text-white/50">{playersAnswered.filter(p => p.hasAnswered).length} / {gameState.players.length}</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {gameState.players.map(player => {
                                    const status = playersAnswered.find(p => p.id === player.id);
                                    const isAnswered = status?.hasAnswered || false;
                                    const playerColor = getAvatarColor(player.avatar);
                                    return (
                                        <div key={player.id} className={`relative w-8 h-8 rounded-lg overflow-hidden transition-all duration-500 ${isAnswered ? 'opacity-100 scale-100' : 'opacity-30 grayscale scale-90'}`} style={{ boxShadow: isAnswered ? `0 0 10px ${playerColor}40` : 'none' }}>
                                            <Avatar seed={player.avatar} style={player.avatarStyle} className="w-full h-full" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
