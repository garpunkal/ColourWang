import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getColorName } from '../config/gameConfig';

interface ColorCardProps {
    color: string;
    isSelected?: boolean;
    isCorrect?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large' | 'responsive';
    index?: number;
    isStealCard?: boolean;
    stealValue?: number;
}

export function ColorCard({
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
        small: { width: 'clamp(5rem, 25vw, 8rem)', height: 'clamp(7.5rem, 38vw, 12rem)' },
        medium: { width: 'clamp(7rem, 40vw, 10rem)', height: 'clamp(10.5rem, 60vw, 15rem)' },
        large: { width: 'clamp(9rem, 45vw, 12rem)', height: 'clamp(13.5rem, 68vw, 18rem)' },
        responsive: { width: '100%', aspectRatio: '3/4', maxWidth: '110px', minWidth: '70px' }
    };

    const cardStyle = sizeStyles[size] || sizeStyles.medium;

    // Responsive font size for color name
    const getFontSize = () => {
        if (size === 'responsive') return 'clamp(0.7rem, 1vw, 0.85rem)'; // smaller max for large screens
        if (size === 'small') return '0.85rem';
        if (size === 'large') return '1.3rem';
        return '1rem';
    };

    return (
        <motion.div
            initial={{ y: 50, opacity: 0, rotateY: -15 }}
            animate={{
                y: 0,
                opacity: 1,
                rotateY: 0,
                scale: isSelected ? 1.05 : 1,
                rotateZ: isSelected ? (index % 2 === 0 ? -2 : 2) : 0
            }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            whileHover={!disabled ? {
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
                stiffness: 300,
                damping: 20
            }}
            onClick={!disabled ? onClick : undefined}
            className={`
                relative cursor-pointer
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
            style={{ ...cardStyle, perspective: '1000px' }}
        >
            {/* Card container with 3D effect */}
            <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>

                {/* Card shadow */}
                <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                    style={
                        isStealCard
                            ? {
                                background: 'black',
                                transform: 'translateZ(-10px) scale(0.95)',
                                filter: 'blur(20px)'
                            }
                            : {
                                backgroundColor: color,
                                transform: 'translateZ(-10px) scale(0.95)',
                                filter: 'blur(20px)'
                            }
                    }
                />

                {/* Main card */}
                <div
                    className={`
                        absolute inset-0 rounded-2xl overflow-hidden
                        border transition-all duration-300
                        ${isSelected
                            ? 'border-white ring-4 shadow-[0_0_40px_rgba(0,229,255,0.6)]'
                            : 'border-white/20 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]'
                        }
                        ${isCorrect ? 'ring-4 border-white' : ''}
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-bold text-4xl text-white">{typeof stealValue === 'number' ? stealValue : '?'}</span>
                            <span className="font-bold text-mg text-white tracking-widest">STEAL</span>
                        </div>
                    ) : (
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center p-2 h-full">
                            <span
                                className="font-mono uppercase tracking-widest text-center drop-shadow-md mb-2"
                                style={{
                                    color: ['blue','red','orange','green','white', 'yellow', 'cyan', 'lime'].includes(getColorName(color).toLowerCase()) ? 'black' : 'white',
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

                    {/* ...existing code... */}

                    {/* Locked overlay for steal card - always on top if disabled */}
                    {isStealCard && disabled && (
                        <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(30,30,30,0.7)',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
                            borderRadius: '1rem',
                            zIndex: 50,
                            textAlign: 'center',
                            wordBreak: 'break-word',
                            padding: '0 0.5em',
                            lineHeight: 1.1,
                            maxWidth: '90%',
                            pointerEvents: 'none',
                        }}>
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginBottom: '0.2em', minWidth: '28px'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17v1m-6 0a2 2 0 002 2h8a2 2 0 002-2v-5a2 2 0 00-2-2H8a2 2 0 00-2 2v5zm10-7V7a4 4 0 10-8 0v4" /></svg>
                            <span style={{display:'block',width:'100%'}}>LOCKED</span>
                        </span>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center"
                        >
                            <div className="w-20 h-20 rounded-full bg- text-black flex items-center justify-center shadow-2xl border-4 border-black/10">
                                <Check size={48} strokeWidth={6} />
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
}
