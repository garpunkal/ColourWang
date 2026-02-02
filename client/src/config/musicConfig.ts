import musicData from './music.json';

export interface BgmTrack {
    label: string;
    value: string;
}

export const BGM_TRACKS: BgmTrack[] = musicData;

export const getNextTrack = (currentTrackValue: string): string => {
    // Filter out "off" from cycling if possible, or just cycle through all valid ones
    const activeTracks = BGM_TRACKS.filter(t => t.value !== 'off');
    const currentIndex = activeTracks.findIndex(t => t.value === currentTrackValue);

    if (currentIndex === -1) return activeTracks[0].value;

    const nextIndex = (currentIndex + 1) % activeTracks.length;
    return activeTracks[nextIndex].value;
};
