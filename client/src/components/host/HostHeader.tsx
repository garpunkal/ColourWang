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
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 relative z-10 gap-8 w-full">
            {/* Left Section: Join Info */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 bg-black/40 backdrop-blur-md p-6 md:p-8 pr-6 md:pr-16 rounded-[2rem] md:rounded-[4rem] border border-white/20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
                {/* QR Code */}
                <div className="bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-4xl shadow-2xl shrink-0 transform transition-transform hover:scale-105 duration-500">
                    <QRCodeSVG
                        value={joinUrl}
                        size={120}
                        className="w-[120px] h-[120px] md:w-40 md:h-40"
                        level="H"
                        includeMargin={false}
                    />
                </div>

                {/* Room Code */}
                <div className="flex flex-col items-center md:items-start gap-0">
                    <div className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-blue/80 mb-1 md:mb-2 italic">
                        Join Code
                    </div>
                    <div className="text-[4rem] md:text-[7rem] lg:text-[10rem] font-mono font-black tracking-widest text-white leading-none drop-shadow-[0_10px_30px_rgba(0,0,255,0.4)]">
                        {code}
                    </div>
                </div>
            </div>

            {/* Right Section: Logo & Count */}
            <div className="flex flex-col items-center md:items-end gap-6">
                <Logo className="w-64 md:w-80 h-auto drop-shadow-2xl" />

                <div className="flex items-center gap-6 px-8 py-4 bg-black/30 rounded-full border border-white/10 backdrop-blur-md hover:bg-black/40 transition-colors duration-300">
                    <Users size={32} className="text-blue animate-pulse" />
                    <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-black font-mono text-white tabular-nums tracking-tighter">
                            {playerCount}
                        </span>
                        <span className="text-lg font-bold uppercase tracking-widest text-text-muted">
                            Connected
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
