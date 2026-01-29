import { QRCodeSVG } from 'qrcode.react';
import { Users } from 'lucide-react';
import { Logo } from '../Logo';

interface Props {
    code: string;
    playerCount: number;
    compact?: boolean;
}

export function HostHeader({ code, playerCount, compact = false }: Props) {
    const joinUrl = `${window.location.origin}?code=${code}`;

    return (
        <div className={`flex flex-col md:grid grid-cols-3 items-center md:items-center relative z-10 gap-8 w-full transition-all duration-500 ${compact ? 'mb-8' : 'mb-8'}`}>
            {/* Left Section: Join Info */}
            <div className={`
                flex flex-col md:flex-row items-center glass-panel rounded-4xl
                transition-all duration-500 w-fit
                ${compact
                    ? 'gap-4 p-3 pr-8 md:rounded-4xl'
                    : 'gap-6 md:gap-10 p-6 md:p-8 pr-6 md:pr-16 md:rounded-4xl'
                }
            `}>
                {/* QR Code */}
                <div className={`
                    bg-white rounded-[1rem] shadow-2xl shrink-0 transform transition-transform hover:scale-105 duration-500
                    ${compact ? 'p-2' : 'p-3 md:p-4 md:rounded-4xl'}
                `}>
                    <QRCodeSVG
                        value={joinUrl}
                        size={compact ? 60 : 120}
                        className={`
                            transition-all duration-500
                            ${compact ? 'w-[60px] h-[60px]' : 'w-[120px] h-[120px] md:w-40 md:h-40'}
                        `}
                        level="H"
                        includeMargin={false}
                    />
                </div>

                {/* Room Code */}
                <div className="flex flex-col items-center md:items-start gap-0">
                    <div className={`
                        font-mono font-black tracking-widest text-white leading-none drop-shadow-[0_10px_30px_rgba(0,0,255,0.4)] transition-all duration-500
                        ${compact ? 'text-4xl md:text-5xl' : 'text-[4rem] md:text-[7rem] lg:text-[10rem]'}
                    `}>
                        {code}
                    </div>
                </div>
            </div>

            {/* Logo  */}
            <div className={`flex flex-col items-center gap-6 transition-all duration-500 ${compact ? 'gap-2' : 'gap-6'}`}>
                <div className={`transition-all duration-500 origin-right ${compact ? 'scale-75' : 'scale-100'}`}>
                    <Logo className={`drop-shadow-2xl transition-all duration-500 ${compact ? 'w-40' : 'w-64 md:w-80'} h-auto`} />
                </div>
            </div>

            {/* Count  */}
            <div className={`
                    flex items-center bg-black/30 rounded-full border border-white/10 backdrop-blur-md hover:bg-black/40 transition-all duration-500 w-fit md:justify-self-end
                    ${compact ? 'gap-3 px-6 py-2' : 'gap-6 px-8 py-4'}
                `}>
                <Users size={compact ? 20 : 32} className="text-color-blue animate-pulse transition-all duration-500" />
                <div className="flex items-baseline gap-3">
                    <span className={`font-black font-mono text-white tabular-nums tracking-tighter transition-all duration-500 ${compact ? 'text-2xl' : 'text-5xl'}`}>
                        {playerCount}
                    </span>
                    <span className={`font-bold uppercase tracking-widest text-text-muted transition-all duration-500 ${compact ? 'text-xs' : 'text-lg'}`}>
                        Connected
                    </span>
                </div>
            </div>



        </div>
    );
}
