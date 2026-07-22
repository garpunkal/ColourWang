import type { Socket } from 'socket.io-client';
import type { Question, GameState } from '../../types/game';
import { Play, Trash2, Users, Hash, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import { ColorCard } from '../ColorCard';
import { sortColors } from '../../config/gameConfig';
import { Avatar } from '../GameAvatars';
import { ConfirmModal } from '../shared/ConfirmModal';

interface Props {
    socket: Socket;
    gameState: GameState;
    currentQuestion: Question;
    currentQuestionIndex: number;
    totalQuestions: number;
    onNextQuestion: () => void;
}

export function HostResultScreen({ socket, gameState, currentQuestion, currentQuestionIndex, totalQuestions, onNextQuestion }: Props) {
    const correctColours = sortColors(currentQuestion.correctAnswers || currentQuestion.correctColours);
    const [timeLeft, setTimeLeft] = useState(gameState.resultDuration || 30);
    const [isRemoving, setIsRemoving] = useState(false);
    const [showDeletedToast, setShowDeletedToast] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        message: string;
        confirmText: string;
        variant: 'default' | 'danger' | 'warning';
        onConfirm: () => void;
    } | null>(null);
    const isLastQuestionInRound = currentQuestionIndex === totalQuestions - 1;
    const isFinalRound = gameState.currentRoundIndex === gameState.rounds.length - 1;
    const isGameFinalQuestion = isFinalRound && isLastQuestionInRound;

    const nextButtonLabel = isGameFinalQuestion
        ? 'Show Results'
        : isLastQuestionInRound
            ? 'Next Round'
            : 'Next Question';

    const nextButtonSublabel = isGameFinalQuestion
        ? 'Final standings'
        : isLastQuestionInRound
            ? `Round ${(gameState.currentRoundIndex ?? 0) + 2}`
            : `Question ${currentQuestionIndex + 2} of ${totalQuestions}`;

    const sortedPlayers = useMemo(() => {
        return [...gameState.players].sort((a, b) => b.score - a.score);
    }, [gameState.players]);

    const leadPlayer = sortedPlayers[0];
    const leadPlayerName = leadPlayer?.name || 'No leader yet';
    const leadPlayerScore = leadPlayer?.score || 0;

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onNextQuestion();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentQuestionIndex, gameState.resultDuration, onNextQuestion]);

    const handleRemoveQuestion = () => {
        setModalConfig({
            title: 'Remove Question',
            message: 'Are you sure you want to PERMANENTLY delete this question from the game pool?',
            confirmText: 'Delete Forever',
            variant: 'danger',
            onConfirm: () => {
                setIsRemoving(true);
                if (gameState.code) {
                    socket.emit('remove-question', { code: gameState.code });
                }
                setShowConfirmModal(false);
                setShowDeletedToast(true);

                setTimeout(() => {
                    setShowDeletedToast(false);
                    onNextQuestion();
                    setIsRemoving(false);
                }, 2000);
            }
        });
        setShowConfirmModal(true);
    };

    return (
        <>
        <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative min-h-screen w-full overflow-hidden"
        >
            <motion.div
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.88 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="fixed inset-0 z-0"
                style={{
                    background: 'radial-gradient(circle at 50% 22%, rgba(59,130,246,0.35) 0%, rgba(10,12,16,0.98) 58%)'
                }}
            />
            <motion.div
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 1.65, opacity: 0 }}
                transition={{ duration: 1.1, ease: [0.2, 0.65, 0.2, 1] }}
                className="pointer-events-none fixed left-1/2 top-[21%] h-72 w-72 -translate-x-1/2 rounded-full border border-blue-300/60 z-0"
            />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-4 pb-28 pt-8 md:px-8 md:pt-10">
                <div className="mb-5 flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md md:mb-7 md:px-4">
                    <div className="flex items-center gap-2">
                        <Hash size={14} className="text-blue-300" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/75">Code {gameState.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-cyan-300" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/75">{gameState.players.length} Players</span>
                    </div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Lead {leadPlayerName} · {leadPlayerScore}</div>
                </div>

                <div className="w-full text-center">
                    <motion.h1
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.06 }}
                        className="mx-auto mb-3 max-w-5xl text-3xl font-black leading-tight text-white drop-shadow-[0_14px_40px_rgba(0,0,0,0.65)] md:mb-4 md:text-5xl"
                    >
                        {currentQuestion.question}
                    </motion.h1>

                    <motion.div
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.14 }}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/40 bg-blue-500/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-blue-200 md:mb-6"
                    >
                        Correct Answer
                    </motion.div>

                    <div className="mb-7 flex flex-wrap justify-center gap-5 md:mb-8">
                        {correctColours.map((color, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.18 + (i * 0.08) }}
                            >
                                <ColorCard
                                    color={color}
                                    isCorrect={true}
                                    size="medium"
                                    index={i}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="w-full flex-1 overflow-hidden">
                    <div className="mb-4 flex items-center justify-center gap-4 md:mb-5">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30 md:w-20" />
                        <span className="text-xs font-black uppercase tracking-[0.35em] text-white/60 md:text-sm">Player Intel</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30 md:w-20" />
                    </div>

                    <div className="mx-auto grid max-h-[42vh] w-full max-w-6xl grid-cols-1 gap-3 overflow-y-auto px-1 pb-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {sortedPlayers.map((player, index) => {
                            const playerAnswer = sortColors(player.lastAnswer || []);

                            return (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, y: 26 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.28 + (index * 0.04) }}
                                    className="group relative flex min-h-44 flex-col overflow-hidden rounded-2xl border p-3 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
                                    style={{
                                        background: player.isCorrect
                                            ? 'linear-gradient(180deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.05) 100%)'
                                            : 'linear-gradient(180deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.05) 100%)',
                                        borderColor: player.isCorrect
                                            ? (player.streak >= 3 ? 'rgba(249,115,22,0.65)' : 'rgba(34,197,94,0.35)')
                                            : 'rgba(239,68,68,0.35)',
                                        borderWidth: player.streak >= 3 ? '2px' : '1px',
                                        boxShadow: player.streak >= 3 ? '0 0 30px rgba(249,115,22,0.2)' : 'none'
                                    }}
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg">
                                            <div className="absolute inset-0 bg-black/15" />
                                            <Avatar seed={player.avatar} style={player.avatarStyle} className="relative z-10 h-full w-full" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block w-full truncate pr-8 text-sm font-black uppercase tracking-wide text-white md:text-base">
                                                {player.name}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-sm font-black tracking-widest ${player.isCorrect ? 'text-success' : 'text-error'}`}>
                                                    {player.isCorrect ? `+${player.roundScore || 0} PTS` : '+0 PTS'}
                                                </span>
                                                {player.streak >= 3 && <span className="text-sm">🔥</span>}
                                                {player.isFastestFinger && <span className="text-sm">⚡</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-black/25 p-2">
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            {playerAnswer.length > 0 ? playerAnswer.map((color, i) => (
                                                <ColorCard
                                                    key={i}
                                                    color={color}
                                                    size="mini"
                                                    index={i}
                                                    disabled={true}
                                                />
                                            )) : (
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">No Answer</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`pointer-events-none absolute right-0 top-0 h-16 w-16 opacity-30 blur-2xl ${player.isCorrect ? 'bg-success' : 'bg-error'}`} />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="absolute inset-x-0 bottom-6 z-20 px-4">
                    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onNextQuestion}
                            className="btn btn-primary group relative w-full overflow-hidden rounded-2xl px-6 py-3 shadow-xl md:px-8 md:py-4"
                        >
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                            <div className="relative z-10 flex items-center justify-between gap-5 md:gap-6">
                                <div className="min-w-0 flex-1 flex flex-col items-start leading-none">
                                    <span className="mb-0.5 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{nextButtonSublabel}</span>
                                    <span className="text-base font-black uppercase tracking-wide md:text-lg">
                                        {nextButtonLabel}
                                    </span>
                                </div>
                                <div className="shrink-0 flex items-center gap-3 md:gap-4 pl-3 md:pl-4 border-l border-white/20">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-2xl font-black tabular-nums">{timeLeft}</span>
                                        <span className="text-[10px] font-black uppercase opacity-40">S</span>
                                    </div>
                                    <Play fill="currentColor" size={20} className="transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.52 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.02, opacity: 1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRemoveQuestion}
                            disabled={isRemoving}
                            className="group flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-[10px] font-medium uppercase tracking-wide transition-all hover:border-red-500/25 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <Trash2 size={14} className={`text-white/40 transition-colors group-hover:text-red-400 ${isRemoving ? 'animate-bounce' : ''}`} />
                            <span className="text-white/40 group-hover:text-red-400">Remove Question</span>
                        </motion.button>
                    </div>
                </div>
            </div>

        </motion.div>

        {modalConfig && (
            <ConfirmModal
                isOpen={showConfirmModal}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                variant={modalConfig.variant}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setShowConfirmModal(false)}
            />
        )}

        <AnimatePresence>
            {showDeletedToast && (
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    className="fixed bottom-8 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-green-500/30 bg-black/80 px-5 py-3 shadow-2xl backdrop-blur-md"
                >
                    <CheckCircle size={18} className="shrink-0 text-green-400" />
                    <span className="text-sm font-black uppercase tracking-wide text-white">Question deleted</span>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}
