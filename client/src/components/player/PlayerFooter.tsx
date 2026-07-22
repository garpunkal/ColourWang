import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface Props {
    onLeave?: () => void;
}

export function PlayerFooter({ onLeave }: Props) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-auto pt-4 md:pt-12 pb-2 md:pb-6 flex items-center justify-center gap-6 z-50 pointer-events-auto"
        >
            {onLeave && (
                <button
                    onClick={onLeave}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/10 border border-white/5 rounded-full hover:bg-white/10 hover:text-white/40 hover:border-white/10 transition-all active:scale-95 group"
                    title="Leave Game"
                >
                    <LogOut size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                </button>
            )}
        </motion.div>
    );
}
