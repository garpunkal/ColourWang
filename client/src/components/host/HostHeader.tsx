import { QRCodeSVG } from 'qrcode.react';
import { Users } from 'lucide-react';
import { Logo } from '../Logo';

interface Props {
    code: string;
    playerCount: number;
}

export function HostHeader({ code, playerCount }: Props) {
    const joinUrl = `${window.location.origin}?code=${code}`;

    return (
        <div className="flex justify-between items-start mb-8 relative z-10  gap-8 ">

            <div className="flex items-center gap-6 md:gap-10 bg-black/40 backdrop-blur-md p-4 md:p-8 pr-8 md:pr-16 rounded-[2rem] md:rounded-[4rem] border border-white/20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
                <div className="bg-white p-3 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl">
                    <QRCodeSVG value={joinUrl} size={120} className="md:w-[200px] md:h-[200px] w-[120px] h-[120px]" level="H" />
                </div>
                <div className="flex flex-col gap-0">
                    <div className="text-xl md:text-8xl font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-color-blue/80 mb-1 md:mb-2 italic">{code}</div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <Logo className="w-auto mb-2" />
                <div className="flex items-center gap-6 px-8 py-4 bg-black/30 rounded-full border border-white/5 backdrop-blur-sm">
                    <Users size={40} className="text-color-blue" />
                    <span className="text-5xl font-black font-mono">{playerCount}</span>
                    <span className="text-xl font-bold uppercase tracking-widest text-text-muted">Connected</span>
                </div>
            </div>
        </div>
    );
}
