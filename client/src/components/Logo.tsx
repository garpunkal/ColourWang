import { motion } from 'framer-motion';

const cardColors = [
    '#000000',
    '#c4bbb1',
    '#ffffff',
    '#ee1420',
    '#ff9d00',
    '#fcfe00',
    '#8ccc00',
    '#4ac3db',
    '#83359a',
    '#fc93c8',
    '#b0562c'
];

export const Logo = ({ className = "" }: { className?: string }) => {
    return (
        <div className={`relative flex flex-col items-center justify-center ${className} select-none`}>
            {/* The Fan - Iconic Mark */}
            <motion.div
                className="relative h-16 w-full flex justify-center items-end mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                {cardColors.map((color, index) => {
                    const total = cardColors.length;
                    // Perfect semi-circle fan
                    const spreadRange = 120;
                    const startRotation = -(spreadRange / 2);
                    const step = spreadRange / (total - 1);
                    const rotation = startRotation + (index * step);

                    // Simple arch calculation for Y positioning
                    // x^2 + y^2 = r^2

                    return (
                        <div
                            key={index}
                            className="absolute origin-bottom rounded-sm shadow-md border-[1px] border-white/30"
                            style={{
                                backgroundColor: color,
                                width: '16px',
                                height: '40px',
                                transform: `rotate(${rotation}deg) translateY(-5px)`,
                                zIndex: index,
                                left: `calc(50% - 8px)`, // Center perfectly
                                bottom: 0,
                            }}
                        >
                            {/* Glass Shine */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/30 opacity-50" />
                        </div>
                    );
                })}
            </motion.div>

            {/* The Wordmark */}
            <div className="relative z-10">
                <h1 className="font-['Outfit'] font-black tracking-[-0.05em] text-white text-4xl md:text-6xl leading-none drop-shadow-2xl">
                    ColourWang
                </h1>
                {/* Subtle reflection below */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mt-2 rounded-full blur-[1px]" />
            </div>
        </div>
    );
};
