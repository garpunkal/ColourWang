import { motion } from 'framer-motion';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface Props {
    onLeave?: () => void;
}

export function PlayerFooter({ onLeave }: Props) {
    const { colorblindMode, setColorblindMode } = useSettings();

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-auto pt-12 pb-6 flex items-center justify-center gap-6 z-50 pointer-events-auto"
        >
            <button
                onClick={() => setColorblindMode(!colorblindMode)}
                className={`
                    w-10 h-10 flex items-center justify-center rounded-full transition-all border
                    ${colorblindMode
                        ? 'bg-white/80 text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        : 'bg-white/5 text-white/10 border-white/5 hover:text-white/40 hover:bg-white/10 hover:border-white/10'}
                `}
                title={colorblindMode ? "Disable Colorblind Mode" : "Enable Colorblind Mode"}
            >
                {colorblindMode ? <Eye size={18} strokeWidth={2} /> : <EyeOff size={18} strokeWidth={2} />}
            </button>

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
