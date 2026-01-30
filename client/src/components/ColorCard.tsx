import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getColorName } from '../config/gameConfig';
import { memo } from 'react';

interface ColorCardProps {
    color: string;
    isSelected?: boolean;
    isCorrect?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    size?: 'mini' | 'small' | 'medium' | 'large' | 'responsive';
    index?: number;
    isStealCard?: boolean;
    stealValue?: number;
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
    stealValue
}: ColorCardProps) {
    const sizeStyles = {
        mini: { width: '3.5rem', height: '4.5rem' },
        small: { width: 'clamp(5rem, 25vw, 8rem)', height: 'clamp(7.5rem, 38vw, 12rem)' },
        medium: { width: 'clamp(7rem, 40vw, 10rem)', height: 'clamp(10.5rem, 60vw, 15rem)' },
        large: { width: 'clamp(9rem, 45vw, 12rem)', height: 'clamp(13.5rem, 68vw, 18rem)' },
        responsive: { width: '100%', aspectRatio: '3/4', maxWidth: '110px', minWidth: '70px' }
    };

    const cardStyle = sizeStyles[size] || sizeStyles.medium;

    // Responsive font size for color name
    const getFontSize = () => {
        if (size === 'mini') return '0.5rem';
        if (size === 'responsive') return 'clamp(0.7rem, 1vw, 0.85rem)'; // smaller max for large screens
        if (size === 'small') return '0.85rem';
        if (size === 'large') return '1.3rem';
        return '1rem';
    };

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
                transition: { duration: 0.2 }
            } : {}}
            whileTap={!disabled ? {
                scale: 0.95,
                rotateZ: index % 2 === 0 ? -5 : 5
            } : {}}
            transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 120,
                damping: 20
            }}
            onClick={!disabled ? onClick : undefined}
            className={`
                relative cursor-pointer
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
            style={{ ...cardStyle, perspective: '1000px' }}
        >
            {/* Card container */}
            <div className="relative w-full h-full">

                {/* Card shadow - simplified for mobile */}
                <div
                    className="absolute inset-0 rounded-2xl opacity-40"
                    style={
                        isStealCard
                            ? {
                                background: 'black',
                                transform: 'translateZ(-10px) scale(0.95)',
                                filter: 'blur(10px)'
                            }
                            : {
                                backgroundColor: color,
                                transform: 'translateZ(-10px) scale(0.95)',
                                filter: 'blur(10px)'
                            }
                    }
                />

                {/* Main card */}
                <div
                    className={`
                        absolute inset-0 rounded-2xl overflow-hidden
                        border transition-all duration-300
                        ${isSelected
                            ? 'border-white ring-4 shadow-[0_0_30px_rgba(0,229,255,0.5)]'
                            : 'border-white/20 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.3)]'
                        }
                        ${isCorrect ? '' : ''}
                    `}
                    style={
                        isStealCard
                            ? {
                                background: 'black',
                                transform: 'translateZ(0)'
                            }
                            : {
                                backgroundColor: color,
                                transform: 'translateZ(0)'
                            }
                    }
                >
                    {/* Card shine effect */}
                    <div className="absolute inset-0 bg-linear-to-br from-white/30 via-transparent to-transparent opacity-50" />

                    {/* Bottom-aligned color name or STEAL card overlay */}
                    {isStealCard ? (


                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center p-2 h-full">
                            <span
                                className="font-mono uppercase tracking-widest text-center drop-shadow-md mb-2"
                                style={{
                                    color: 'white',
                                    fontSize: getFontSize(),
                                    lineHeight: 1.1,
                                    wordBreak: 'break-word',
                                    maxWidth: '90%',
                                    whiteSpace: 'normal',
                                }}
                            >
                                <span className="font-bold text-3xl">{typeof stealValue === 'number' ? stealValue : '?'}</span> STEAL
                            </span>
                        </div>


                    ) : (
                        <div className={`absolute inset-x-0 bottom-0 flex items-end justify-center p-2 h-full ${size === 'mini' ? 'opacity-0' : ''}`}>
                            <span
                                className="font-mono uppercase tracking-widest text-center drop-shadow-md mb-2"
                                style={{
                                    color: ['blue', 'red', 'orange', 'green', 'white', 'yellow', 'cyan', 'lime'].includes(getColorName(color).toLowerCase()) ? 'black' : 'white',
                                    fontSize: getFontSize(),
                                    lineHeight: 1.1,
                                    wordBreak: 'break-word',
                                    maxWidth: '90%',
                                    whiteSpace: 'normal',
                                }}
                            >
                                {getColorName(color)}
                            </span>
                        </div>
                    )}



                    {/* Selection indicator */}
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center"
                        >
                            <div className={`rounded-full bg-white text-black flex items-center justify-center shadow-2xl border-4 border-black/10 ${size === 'mini' ? 'w-8 h-8' : 'w-20 h-20'}`}>
                                <Check size={size === 'mini' ? 20 : 48} strokeWidth={6} />
                            </div>
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

                    {/* Card edge highlight */}
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                </div>
            </div>
        </motion.div>
    );
});
