import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

interface Props {
    isReconnecting: boolean;
    attempt: number;
}

export function ReconnectionBanner({ isReconnecting, attempt }: Props) {
    return (
        <AnimatePresence>
            {isReconnecting && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-200 bg-color-yellow text-black py-3 px-4 shadow-xl"
                >
                    <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <RefreshCw size={20} />
                        </motion.div>
                        <div className="flex flex-col items-center">
                            <span className="font-black uppercase text-sm tracking-wider">
                                Connection Lost - Reconnecting...
                            </span>
                            {attempt > 0 && (
                                <span className="text-xs font-medium opacity-80">
                                    Attempt {attempt} of 5
                                </span>
                            )}
                        </div>
                        <WifiOff size={20} className="opacity-60" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
