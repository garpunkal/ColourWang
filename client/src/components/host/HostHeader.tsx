import { useState, useEffect } from 'react';
import { audioManager } from '../../utils/audioManager';
import { QRCodeSVG } from 'qrcode.react';
import { Users } from 'lucide-react';
import type { Socket } from 'socket.io-client';
import { BGM_TRACKS } from '../../config/musicConfig';
import { LogOut } from 'lucide-react';


interface Props {
    code: string;
    playerCount: number;
    compact?: boolean;
    pot?: number;
    musicEnabled?: boolean;
    socket: Socket;
    currentBgm?: string;
    onAbandonGame?: () => void;
}


export function HostHeader({ code, playerCount, compact = false, musicEnabled = true, socket, currentBgm = '', onAbandonGame }: Props) {
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedBGM, setSelectedBGM] = useState(currentBgm);

    useEffect(() => {
        if (currentBgm) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedBGM(currentBgm);
        }
    }, [currentBgm]);
    const joinUrl = `${window.location.origin}?code=${code}`;

    return (
        <>
            <div className={`flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10 w-full transition-all duration-500 ${compact ? 'mb-4 md:mb-6' : ''}`}>

                {/* Join Info */}
                <div className={`
                    flex flex-col sm:flex-row items-center glass-panel rounded-4xl
                    transition-all duration-500 w-full sm:w-fit
                    ${compact
                        ? 'gap-3 sm:gap-4 p-3 pr-6 sm:pr-8 md:rounded-4xl'
                        : 'gap-3 sm:gap-4 md:gap-8 p-3 sm:p-4 md:p-6 pr-4 sm:pr-6 md:pr-10 md:rounded-4xl'
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
                            size={compact ? 60 : 48}
                            className={`rounded ${compact ? 'w-15 h-15' : 'w-12 h-12 md:w-14 md:h-14'}`}
                            level="L"
                            marginSize={0}
                        />
                    </div>

                    {/* Room Code */}
                    <div className="flex flex-col items-center md:items-start gap-0">
                        <div className={`
                            font-mono font-black tracking-widest text-white leading-none drop-shadow-[0_10px_30px_rgba(0,229,255,0.4)] transition-all duration-500
                            ${compact ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-xl sm:text-2xl md:text-3xl'}
                        `}>
                            {code}
                        </div>

                        {/* BGM Selector */}
                        {musicEnabled && (
                            <div className="">
                                <select
                                    id="bgm-select"
                                    value={selectedBGM}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setSelectedBGM(val);
                                        // Emit to server to sync for everyone (and persistence)
                                        socket.emit('update-bgm', { code, track: val });

                                        if (val === 'off') {
                                            audioManager.stopBGM();
                                        } else {
                                            audioManager.playBGM(val);
                                        }
                                    }}
                                    className="rounded pr-2 py-1 text-white/35 text-xs"
                                >
                                    {BGM_TRACKS.map(track => (
                                        <option key={track.value} value={track.value} className="text-black">{track.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            
               
                {/* <div className={`
                        flex items-center gap-3 transition-all duration-500 w-fit lg:justify-self-end
                        ${compact ? '' : 'hidden'}
                    `}>
                    {compact && onAbandonGame && (
                        <button
                            onClick={onAbandonGame}
                            className="px-3 py-2 text-[10px] md:text-xs uppercase font-black tracking-wider rounded-xl border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-300/60 transition-colors"
                            title="Abandon current game and reset"
                        >
                               <LogOut size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                        </button>
                    )}
                    <div className="flex items-center bg-black/30 rounded-full border border-white/10 backdrop-blur-md hover:bg-black/40 transition-all duration-500 px-6 py-2 gap-3">
                        <Users size={20} className="text-color-blue animate-pulse transition-all duration-500" />
                        <div className="flex items-baseline gap-3">
                            <span className="font-black font-mono text-white tabular-nums tracking-tighter text-2xl">
                                {playerCount}
                            </span>
                        </div>
                    </div>
                </div> */}
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
