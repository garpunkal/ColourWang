import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { audioManager } from '../../utils/audioManager';

export function CountdownScreen() {
    const [count, setCount] = useState(5);

    useEffect(() => {
        // Play tick immediately on mount/start
        if (count > 0) audioManager.playTick();

        const timer = setInterval(() => {
            setCount(prev => {
                const next = prev - 1;
                if (next > 0) audioManager.playTick();
                return next > 0 ? next : 0;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
            <motion.div
                key={count}
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-[20vw] font-black text-transparent bg-clip-text bg-linear-to-br from-color-blue via-white to-color-pink drop-shadow-[0_0_100px_rgba(255,255,255,0.5)] leading-none"
            >
                {count}
            </motion.div>
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-5xl font-black text-white/60 mt-8 uppercase tracking-[0.5em] animate-pulse"
            >
                Get Ready
            </motion.h2>
        </div>
    );
}
