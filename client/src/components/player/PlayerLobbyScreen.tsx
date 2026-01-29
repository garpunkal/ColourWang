import { motion } from 'framer-motion';

export function PlayerLobbyScreen() {
    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
            className="text-center glass rounded-[4rem] p-16 border-white/10 shadow-[0_80px_100px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-linear-to-br from-color-blue/15 via-transparent to-color-purple/15 opacity-50" />
            <div className="mb-12 relative inline-block z-10">
                <motion.div
                    animate={{ scale: [1, 1.6, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute inset-0 bg-color-blue/20 blur-[60px] rounded-full"
                />
                <div className="text-9xl relative drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">🎮</div>
            </div>
            <h3 className="text-5xl font-black mb-4 uppercase tracking-tighter italic z-10 relative">STAND BY</h3>
            <p className="text-text-muted font-bold text-lg mb-12 z-10 relative px-4 leading-relaxed opacity-80 italic">You're in, please wait for the game to begin.</p>

        </motion.div>
    );
}
