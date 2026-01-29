import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getColorName } from '../config/gameConfig';

interface ColorCardProps {
    color: string;
    isSelected?: boolean;
    isCorrect?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    index?: number;
}

export function ColorCard({
    color,
    isSelected = false,
    isCorrect = false,
    onClick,
    disabled = false,
    size = 'medium',
    index = 0
}: ColorCardProps) {
    const sizeStyles = {
        small: { width: 'clamp(5rem, 25vw, 8rem)', height: 'clamp(7.5rem, 38vw, 12rem)' },
        medium: { width: 'clamp(7rem, 40vw, 10rem)', height: 'clamp(10.5rem, 60vw, 15rem)' },
        large: { width: 'clamp(9rem, 45vw, 12rem)', height: 'clamp(13.5rem, 68vw, 18rem)' }
    };

    const cardStyle = sizeStyles[size];

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
                    style={{
                        backgroundColor: color,
                        transform: 'translateZ(-10px) scale(0.95)',
                        filter: 'blur(20px)'
                    }}
                />

                {/* Main card */}
                <div
                    className={`
                        absolute inset-0 rounded-2xl overflow-hidden
                        border-8 transition-all duration-300
                        ${isSelected
                            ? 'border-white ring-4 ring-color-blue/50 shadow-[0_0_40px_rgba(0,229,255,0.6)]'
                            : 'border-white/20 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]'
                        }
                        ${isCorrect ? 'ring-4 ring-success/70 border-white' : ''}
                    `}
                    style={{
                        backgroundColor: color,
                        transform: 'translateZ(0)'
                    }}
                >
                    {/* Card shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50" />

                    {/* Center color name */}
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                        <span
                            className="block md:hidden font-black text-sm uppercase tracking-widest text-center  drop-shadow-md"
                            style={{
                                color: ['white', 'yellow', 'cyan', 'lime'].includes(color.toLowerCase()) ? 'black' : 'white',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                        >
                            {getColorName(color)}
                        </span>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl border-4 border-black/10">
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
                            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 border-success">
                                <Check size={64} strokeWidth={8} className="text-success" />
                            </div>
                        </motion.div>
                    )}

                    {/* Card edge highlight */}
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                </div>
            </div>
        </motion.div>
    );
}
