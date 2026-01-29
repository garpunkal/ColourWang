import { motion } from 'framer-motion';
import { Avatar } from '../GameAvatars';
import { getAvatarColor } from '../../constants/avatars';

interface Props {
    name: string;
    avatar: string;
    score: number;
}

export function PlayerHeader({ name, avatar, score }: Props) {
    const color = getAvatarColor(avatar);

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-between items-center mb-6 glass p-4 pr-6 rounded-[2rem] border-white/10 shadow-2xl bg-gradient-to-r from-white/5 to-transparent shrink-0"
        >
            <div className="flex items-center gap-4">
                <div className="!w-14 !h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner border border-white/5 p-1 overflow-hidden">
                    <Avatar seed={avatar} className="w-full h-full" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-black text-2xl tracking-tight leading-none uppercase italic bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent truncate max-w-[180px]">{name}</span>
                    <div className="flex items-center gap-2 mt-2">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-success font-black">Live Session</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-1 opacity-50 italic">XP Points</span>
                <span
                    className="text-4xl font-black glow-text leading-none font-mono tracking-tighter"
                    style={{ color }}
                >
                    {score || 0}
                </span>
            </div>
        </motion.div>
    );
}
