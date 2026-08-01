import { motion } from 'framer-motion';
import { Avatar } from '../GameAvatars';

interface Props {
    name: string;
    avatar: string;
    avatarStyle?: string;
    avatarImage?: string;
    score: number;
    rank?: number;
}

export function PlayerHeader({ name, avatar, avatarStyle, avatarImage, score, rank }: Props) {

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-between items-center mb-2 md:mb-6 glass p-2.5 md:p-4 pr-4 md:pr-6 rounded-4xl border-white/10 shadow-2xl bg-linear-to-r from-white/5 to-transparent shrink-0"
        >
            <div className="flex items-center gap-2 md:gap-4">
                <Avatar seed={avatar} style={avatarStyle} imageUrl={avatarImage} className="w-10! h-10! md:w-14! md:h-14!" />
                <div className="flex flex-col min-w-0">
                    <span className="font-black text-lg md:text-2xl tracking-tight leading-none uppercase italic bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent truncate max-w-45 pr-4">{name}</span>
                </div>
            </div>

            <div className="flex flex-row items-end">               
                <span className="text-2xl md:text-4xl font-black glow-text leading-none font-mono tracking-tighter text-white">
                    {rank ? `` : (score || 0)} 
                </span>
               
            </div>
        </motion.div >
    );
}
