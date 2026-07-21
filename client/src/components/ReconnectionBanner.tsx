import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, RefreshCw } from 'lucide-react';

interface Props {
    isReconnecting: boolean;
    attempt: number;
}

export function ReconnectionBanner({ isReconnecting, attempt }: Props) {
    const isColdStartWake = attempt <= 2;
    const title = isColdStartWake ? 'Warming up the game room...' : 'Keeping your spot warm...';

    return (
        <AnimatePresence>
            {isReconnecting && (
                <motion.div
                    initial={{ y: -20, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.98 }}
                    className="fixed top-3 left-1/2 -translate-x-1/2 z-200 w-[calc(100%-1.5rem)] max-w-2xl"
                >
                    <div className="glass-card rounded-2xl border border-white/15 shadow-2xl px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                                    className="w-8 h-8 rounded-full bg-color-blue/20 text-color-blue flex items-center justify-center"
                                >
                                    <RefreshCw size={15} />
                                </motion.div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-black uppercase text-xs md:text-sm tracking-[0.14em] text-white truncate">
                                        {title}
                                    </span>
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                                        Reconnecting quietly {attempt > 0 ? `• try ${attempt}` : ''}
                                    </span>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 text-white/50">
                                {[0, 1, 2].map((dot) => (
                                    <motion.div
                                        key={dot}
                                        animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: dot * 0.18 }}
                                        className="w-1.5 h-1.5 rounded-full bg-color-blue"
                                    />
                                ))}
                                <Wifi size={16} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
