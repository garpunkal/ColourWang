export interface BgmTrack {
    label: string;
    value: string;
}

export const BGM_TRACKS: BgmTrack[] = [
    { label: 'Casino Royal', value: 'Casino Royal.mp3' },
    { label: 'Las Vegas', value: 'Las Vegas.mp3' },
    { label: 'Move and Shake', value: 'Move and Shake.mp3' },
    { label: 'Poker Player', value: 'Poker Player.mp3' },
    { label: 'Robbery of the Century', value: 'Robbery of the Century.mp3' },
    { label: 'Music Off', value: 'off' },
];

export const getNextTrack = (currentTrackValue: string): string => {
    // Filter out "off" from cycling if possible, or just cycle through all valid ones
    const activeTracks = BGM_TRACKS.filter(t => t.value !== 'off');
    const currentIndex = activeTracks.findIndex(t => t.value === currentTrackValue);

    if (currentIndex === -1) return activeTracks[0].value;

    const nextIndex = (currentIndex + 1) % activeTracks.length;
    return activeTracks[nextIndex].value;
};
