import { useState, useEffect } from 'react';
import { audioManager } from '../../utils/audioManager';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface Props {
    code: string;
    playerCount: number;
    compact?: boolean;
    pot?: number;
    musicEnabled?: boolean;
    socket: any;
    currentBgm?: string;
}

import { BGM_TRACKS } from '../../config/musicConfig';


export function HostHeader({ code, playerCount, compact = false, musicEnabled = true, socket, currentBgm = '' }: Props) {
    const { colorblindMode, setColorblindMode } = useSettings();
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedBGM, setSelectedBGM] = useState(currentBgm);

    useEffect(() => {
        if (currentBgm) {
            setSelectedBGM(currentBgm);
        }
    }, [currentBgm]);
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
                        : 'gap-4 md:gap-8 p-4 md:p-6 pr-6 md:pr-10 md:rounded-4xl'
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
                            size={compact ? 60 : 80}
                            className={`rounded ${compact ? 'w-15 h-15' : 'w-20 h-20 md:w-24 md:h-24'}`}
                            level="L"
                            marginSize={0}
                        />
                    </div>

                    {/* Room Code */}
                    <div className="flex flex-col items-center md:items-start gap-0">
                        <div className={`
                            font-mono font-black tracking-widest text-white leading-none drop-shadow-[0_10px_30px_rgba(0,229,255,0.4)] transition-all duration-500
                            ${compact ? 'text-4xl md:text-5xl' : 'text-4xl md:text-5xl'}
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

                <div className={`flex flex-col items-center gap-6 transition-all duration-500 ${compact ? 'gap-2' : 'gap-6'}`}>
                    {/* Logo Removed */}
                </div>

                {/* Colorblind and Count  */}
                <div className={`
                        flex items-center gap-4 transition-all duration-500 w-fit md:justify-self-end
                        ${compact ? '' : 'hidden'}
                    `}>
                    <button
                        onClick={() => setColorblindMode(!colorblindMode)}
                        className={`
                            px-4 py-2 flex items-center gap-2 rounded-full transition-all border
                            ${colorblindMode
                                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-105'
                                : 'bg-black/30 text-white/40 border-white/10 hover:text-white hover:border-white/30 backdrop-blur-md'}
                        `}
                        title={colorblindMode ? "Disable Colorblind Mode" : "Enable Colorblind Mode"}
                    >
                        {colorblindMode ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">CB Mode</span>
                    </button>

                    <div className="flex items-center bg-black/30 rounded-full border border-white/10 backdrop-blur-md hover:bg-black/40 transition-all duration-500 px-6 py-2 gap-3">
                        <Users size={20} className="text-color-blue animate-pulse transition-all duration-500" />
                        <div className="flex items-baseline gap-3">
                            <span className="font-black font-mono text-white tabular-nums tracking-tighter text-2xl">
                                {playerCount}
                            </span>
                        </div>
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
