import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownProps {
  start: boolean;
  onComplete?: () => void;
}

export const FullScreenCountdown = ({ start, onComplete }: CountdownProps) => {
  const [count, setCount] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null;
    if (start) {
      const timer1 = setTimeout(() => {
        setCount(5);
        setRunning(true);
      }, 0);
      let current = 5;
      interval = setInterval(() => {
        current -= 1;
        setCount(current);
        if (current === 0) {
          setRunning(false);
          clearInterval(interval!);
          setTimeout(() => setCount(null), 200); // allow exit animation
          if (onComplete) onComplete();
        }
      }, 1000);
      return () => {
        clearTimeout(timer1);
        if (interval) clearInterval(interval);
      };
    } else {
      const timer2 = setTimeout(() => {
        setRunning(false);
        setCount(null);
      }, 0);
      return () => clearTimeout(timer2);
    }
  }, [start, onComplete]);

  if (!running && count === null) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 1 }} />
      <AnimatePresence mode="wait" initial={false}>
        {count !== null && (
          <motion.span
            key={count}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3, ease: "easeOut" } }}
            className="relative z-10 text-white text-[clamp(7rem,18vw,18rem)] font-black drop-shadow-[0_0_40px_rgba(0,0,0,0.9)] select-none"
            style={{ textShadow: '0 0 40px #000, 0 0 20px #00e5ff' }}
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
