import { useState } from 'react';
import { audioManager } from '../../utils/audioManager';
import { QRCodeSVG } from 'qrcode.react';
import { Users } from 'lucide-react';

interface Props {
    code: string;
    playerCount: number;
    compact?: boolean;
    pot?: number;
}

const BGM_TRACKS = [
    { label: 'Casino Royal', value: 'Casino Royal.mp3' },
    { label: 'Las Vegas', value: 'Las Vegas.mp3' },
    { label: 'Move and Shake', value: 'Move and Shake.mp3' },
    { label: 'Poker Player', value: 'Poker Player.mp3' },
    { label: 'Robbery of the Century', value: 'Robbery of the Century.mp3' },
];


export function HostHeader({ code, playerCount, compact = false }: Props) {
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedBGM, setSelectedBGM] = useState('');
    const joinUrl = `${window.location.origin}?code=${code}`;

    return (
        <>
            <div className={`flex flex-col md:grid grid-cols-3 items-center md:items-center relative z-10 gap-8 w-full transition-all duration-500 ${compact ? 'mb-8' : 'mb-8'}`}> 

                {/* Join Info */}
                <div className={`
                    flex flex-col md:flex-row items-center glass-panel rounded-4xl
                    transition-all duration-500 w-fit
                    ${compact
                        ? 'gap-4 p-3 pr-8 md:rounded-4xl'
                        : 'gap-6 md:gap-10 p-6 md:p-8 pr-6 md:pr-16 md:rounded-4xl'
                    }
                `}>
                    {/* QR Code */}
                    <div
                        className={`bg-white rounded-2xl shadow-2xl shrink-0 ${compact ? 'p-2' : 'p-3 md:p-4 md:rounded-4xl'} cursor-pointer`}
                        onClick={() => setShowQrModal(true)}
                        title="Click to enlarge QR code"
                    >
                        <QRCodeSVG
                            value={joinUrl}
                            size={compact ? 60 : 120}
                            className={`rounded ${compact ? 'w-15 h-15' : 'w-30 h-30 md:w-40 md:h-40'}`}
                            level="L"
                            marginSize={0}
                        />
                    </div>

                    {/* Room Code */}
                    <div className="flex flex-col items-center md:items-start gap-0">
                        <div className={`
                            font-mono font-black tracking-widest text-white leading-none drop-shadow-[0_10px_30px_rgba(0,229,255,0.4)] transition-all duration-500
                            ${compact ? 'text-4xl md:text-5xl' : 'text-[4rem] md:text-[7rem] lg:text-[10rem]'}
                        `}>
                            {code}
                        </div>
                       
                        {/* BGM Selector */}
                        <div className="">
                            
                            <select
                                id="bgm-select"
                                value={selectedBGM}
                                onChange={e => {
                                    setSelectedBGM(e.target.value);
                                    audioManager.playBGM(e.target.value);
                                }}
                                className="rounded pr-2 py-1 text-white/35 text-xs"
                            >
                                {BGM_TRACKS.map(track => (
                                    <option key={track.value} value={track.value} className="text-black">{track.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={`flex flex-col items-center gap-6 transition-all duration-500 ${compact ? 'gap-2' : 'gap-6'}`}>
                    {/* Logo Removed */}
                </div>

                {/* Count  */}
                <div className={`
                        flex items-center bg-black/30 rounded-full border border-white/10 backdrop-blur-md hover:bg-black/40 transition-all duration-500 w-fit md:justify-self-end
                        ${compact ? 'gap-3 px-6 py-2' : 'hidden'}
                    `}>
                    <Users size={compact ? 20 : 32} className="text-color-blue animate-pulse transition-all duration-500" />
                    <div className="flex items-baseline gap-3">
                        <span className={`font-black font-mono text-white tabular-nums tracking-tighter transition-all duration-500 ${compact ? 'text-2xl' : 'text-5xl'}`}>
                            {playerCount}
                        </span>

                    </div>
                </div>
            </div>

            {/* QR Modal */}
            {showQrModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowQrModal(false)}
                    style={{ cursor: 'pointer' }}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <QRCodeSVG
                            value={joinUrl}
                            size={320}
                            className="rounded w-80 h-80"
                            level="L"
                            marginSize={2}
                        />                     
                        
                    </div>
                </div>
            )}
        </>
    );
}
