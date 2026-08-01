import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getColorName } from '../config/gameConfig';
import { memo } from 'react';
import { hapticFeedback } from '../utils/hapticFeedback';

interface ColorCardProps {
    color: string;
    isSelected?: boolean;
    isCorrect?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    size?: 'micro' | 'mini' | 'small' | 'medium' | 'large' | 'responsive';
    index?: number;
    isStealCard?: boolean;
    stealValue?: number;
    isActionCard?: boolean;
    actionLabel?: string;
    actionValue?: number | string;
}

export const ColorCard = memo(function ColorCard({
    color,
    isSelected = false,
    isCorrect = false,
    onClick,
    disabled = false,
    size = 'medium',
    index = 0,
    isStealCard = false,
    stealValue,
    isActionCard = false,
    actionLabel,
    actionValue
}: ColorCardProps) {

    const showActionCard = isStealCard || isActionCard;
    const resolvedActionLabel = (actionLabel || (isStealCard ? 'STEAL' : 'ACTION')).toUpperCase();
    const resolvedActionValue = actionValue ?? (isStealCard ? stealValue : undefined);

    const sizeStyles = {
        micro: { width: '2.6rem', height: '3.4rem' },
        mini: { width: '3.5rem', height: '4.5rem' },
        small: { width: 'clamp(5rem, 25vw, 8rem)', height: 'clamp(7.5rem, 38vw, 12rem)' },
        medium: { width: 'clamp(7rem, 40vw, 10rem)', height: 'clamp(10.5rem, 60vw, 15rem)' },
        large: { width: 'clamp(9rem, 45vw, 12rem)', height: 'clamp(13.5rem, 68vw, 18rem)' },
        responsive: { width: '100%', aspectRatio: '3/4', maxWidth: 'clamp(52px, 17vw, 200px)', minWidth: '40px' }
    };

    const cardStyle = sizeStyles[size] || sizeStyles.medium;

    // Detect touch devices to disable hover animations
    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window);

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{
                y: 0,
                opacity: 1,
                scale: isSelected ? 1.05 : 1,
                rotateZ: isSelected ? (index % 2 === 0 ? -2 : 2) : 0
            }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            whileHover={!disabled && !isTouchDevice ? {
                y: -10,
                rotateZ: index % 2 === 0 ? -3 : 3,
                transition: { duration: 0.15 }
            } : {}}
            whileTap={!disabled ? {
                scale: 0.95,
                rotateZ: index % 2 === 0 ? -5 : 5
            } : {}}
            transition={{
                delay: index * 0.08,
                type: "spring",
                stiffness: 200,
                damping: 25
            }}
            onClick={!disabled ? onClick : undefined}
            className={`
                relative cursor-pointer
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
            style={{ ...cardStyle, perspective: '1000px', willChange: 'transform, opacity' }}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={showActionCard
                ? `${resolvedActionLabel} card${resolvedActionValue !== undefined ? ` with value ${resolvedActionValue}` : ''}`
                : `${getColorName(color)} color card${isSelected ? ', selected' : ''}${isCorrect ? ', correct answer' : ''}`
            }
            aria-pressed={isSelected}
            aria-disabled={disabled}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    hapticFeedback.light();
                    onClick?.();
                }
            }}
            onTouchStart={() => {
                if (!disabled) {
                    hapticFeedback.light();
                }
            }}
        >
            {/* Card container */}
            <div className="relative w-full h-full">

                {/* Card shadow - enhanced glow */}
                <div
                    className="absolute inset-0 rounded-2xl"
                    style={
                        showActionCard
                            ? {
                                background: 'black',
                                transform: 'translateY(8px) scale(0.92)',
                                filter: 'blur(15px)',
                                opacity: 0.6
                            }
                            : {
                                backgroundColor: color,
                                transform: 'translateY(8px) scale(0.92)',
                                filter: 'blur(15px)',
                                opacity: isSelected ? 0.8 : 0.4
                            }
                    }
                />

                {/* Main card */}
                <div
                    className={`
                        absolute inset-0 rounded-2xl overflow-hidden
                        border-2 transition-all duration-300
                        ${isSelected
                            ? 'border-white ring-4 ring-white/30 shadow-[0_0_40px_rgba(255,255,255,0.4)]'
                            : 'border-white/30 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]'
                        }
                    `}
                    style={
                        showActionCard
                            ? {
                                background: 'linear-gradient(145deg, #1a1a2e 0%, #0d0d1a 100%)',
                                transform: 'translateZ(0)'
                            }
                            : {
                                background: `linear-gradient(145deg, ${color} 0%, ${color}dd 50%, ${color}bb 100%)`,
                                transform: 'translateZ(0)'
                            }
                    }
                >
                    {/* Top shine gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/20" />

                    {/* Diagonal shine */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

                    {showActionCard && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                            {/* Generic action card design (STEAL / BLOCK / etc.) */}
                            <div className="text-center">
                                <motion.span
                                    className="block text-4xl md:text-5xl font-black text-white drop-shadow-lg"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {resolvedActionValue !== undefined ? resolvedActionValue : '?'}
                                </motion.span>
                                <span
                                    className="block text-xs md:text-sm font-black uppercase tracking-[0.3em] text-white/80 mt-1"
                                >
                                    {resolvedActionLabel}
                                </span>
                            </div>
                            {/* Decorative lines */}
                            <div className="absolute top-3 left-3 right-3 h-0.5 bg-linear-to-r from-transparent via-white/30 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 h-0.5 bg-linear-to-r from-transparent via-white/30 to-transparent" />
                        </div>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
                        >
                            <motion.div
                                className={`rounded-full bg-white text-black flex items-center justify-center shadow-2xl ${size === 'mini' || size === 'micro' ? 'w-8 h-8' : 'w-16 h-16 md:w-20 md:h-20'}`}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ boxShadow: '0 0 30px rgba(255,255,255,0.6)' }}
                            >
                                <Check size={size === 'mini' || size === 'micro' ? 20 : 40} strokeWidth={5} />
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Correct answer indicator */}
                    {isCorrect && (
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                        </motion.div>
                    )}

                    {/* Card edge highlight - metallic effect */}
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />

                    {/* Bottom edge shadow for depth */}
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent rounded-b-2xl" />
                </div>
            </div>
        </motion.div>
    );
});
