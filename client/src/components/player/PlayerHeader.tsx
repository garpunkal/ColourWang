import { motion } from 'framer-motion';
import { Avatar } from '../GameAvatars';
import { LogOut } from 'lucide-react';

interface Props {
    name: string;
    avatar: string;
    avatarStyle?: string;
    score: number;
    rank?: number;
    onLeave?: () => void;
}

export function PlayerHeader({ name, avatar, avatarStyle, score, rank, onLeave }: Props) {
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-between items-center mb-6 glass p-4 pr-6 rounded-4xl border-white/10 shadow-2xl bg-linear-to-r from-white/5 to-transparent shrink-0"
        >
            <div className="flex items-center gap-4">
                <Avatar seed={avatar} style={avatarStyle} className="w-14! h-14!" />
                <div className="flex flex-col min-w-0">
                    <span className="font-black text-2xl tracking-tight leading-none uppercase italic bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent truncate max-w-45 pr-4">{name}</span>

                </div>
            </div>
            <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-1 opacity-50 italic">
                    {rank ? 'Ranking' : 'Points'}
                </span>
                <span
                    className="text-4xl font-black glow-text leading-none font-mono tracking-tighter text-white"

                >
                    {rank ? `#${rank}` : (score || 0)}
                </span>
            </div>

            {onLeave && (
                <motion.button
                    whileHover={{ scale: 1.1, color: '#ff3366' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onLeave}
                    className="p-3 text-white/30 hover:text-error transition-colors ml-2"
                >
                    <LogOut size={24} />
                </motion.button>
            )}
        </motion.div >
    );
}
