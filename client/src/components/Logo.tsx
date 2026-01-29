import { motion } from 'framer-motion';

export const Logo = ({ className = "w-full h-auto" }: { className?: string }) => (
    <motion.div
        className={`logo-container ${className} flex items-start justify-start select-none`}
        animate={{
            y: [0, -10, 0],
            filter: [
                'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.6))',
                'drop-shadow(0 20px 40px rgba(0, 229, 255, 0.4))',
                'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.6))'
            ]
        }}
        transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }}
    >
        <img
            src="/logo.png"
            alt="ColourWang Logo"
            className="h-auto object-contain"
            style={{
                width: 'min(320px, 80vw)',
                filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.3))'
            }}
        />
    </motion.div>
);
