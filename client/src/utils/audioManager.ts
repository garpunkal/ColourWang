class AudioManager {
    private audioContext: AudioContext | null = null;
    private bgmAudio: HTMLAudioElement | null = null;
    private isMutedSFX: boolean = false;
    private isMutedBGM: boolean = false;
    private proceduralNodes: AudioBufferSourceNode[] = [];

    constructor() {
        // Initialize AudioContext lazily to comply with browser autoplay policies
        window.addEventListener('click', () => this.init(), { once: true });
        window.addEventListener('keydown', () => this.init(), { once: true });
    }

    private init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public setMuteSFX(mute: boolean) {
        this.isMutedSFX = mute;
    }

    public setMuteBGM(mute: boolean) {
        this.isMutedBGM = mute;
        if (this.bgmAudio) {
            this.bgmAudio.muted = this.isMutedBGM;
        }
    }

    /**
     * Preload and "warm up" audio for mobile devices.
     * Fetches common assets and resumes the context.
     */
    public async preload() {
        this.init();
        console.log('[AUDIO] Preloading and warming AudioContext...');

        // Fetch common BGM list to trigger browser connection/caching
        try {
            const response = await fetch('/api/bgm-list');
            if (response.ok) {
                const tracks = await response.json();
                console.log(`[AUDIO] Discovered ${tracks.length} BGM tracks for pre-caching.`);
            }
        } catch {
            console.warn('[AUDIO] Failed to preload BGM list');
        }
    }

    public playTick(remaining?: number) {
        if (this.isMutedSFX) return;
        this.init();
        if (!this.audioContext) return;

        const t = this.audioContext.currentTime;

        const isFinalFive = typeof remaining === 'number' && remaining <= 5;
        const urgency = isFinalFive ? (6 - remaining) / 5 : 0; // 0..1 across 5->1

        // Muted click: filtered noise burst with restrained highs.
        const clickLength = Math.floor(this.audioContext.sampleRate * 0.045);
        const clickBuffer = this.audioContext.createBuffer(1, clickLength, this.audioContext.sampleRate);
        const clickData = clickBuffer.getChannelData(0);
        for (let i = 0; i < clickLength; i++) {
            const env = 1 - (i / clickLength);
            clickData[i] = (Math.random() * 2 - 1) * env;
        }

        const click = this.audioContext.createBufferSource();
        const clickFilter = this.audioContext.createBiquadFilter();
        const clickGain = this.audioContext.createGain();

        click.buffer = clickBuffer;
        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(900 + (250 * urgency), t);
        clickFilter.Q.setValueAtTime(0.9, t);

        clickGain.gain.setValueAtTime(0, t);
        clickGain.gain.linearRampToValueAtTime(0.032 + (0.012 * urgency), t + 0.004);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.audioContext.destination);
        click.start(t);
        click.stop(t + 0.06);

        // Subtle low thump under the click for presence.
        const low = this.audioContext.createOscillator();
        const lowGain = this.audioContext.createGain();
        low.type = 'sine';
        low.frequency.setValueAtTime(82 + (10 * urgency), t);
        low.frequency.exponentialRampToValueAtTime(62, t + 0.08);

        lowGain.gain.setValueAtTime(0, t);
        lowGain.gain.linearRampToValueAtTime(0.018 + (0.01 * urgency), t + 0.007);
        lowGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        low.connect(lowGain);
        lowGain.connect(this.audioContext.destination);
        low.start(t);
        low.stop(t + 0.11);

        // Last 3 seconds: add a very soft after-click for urgency.
        if (typeof remaining === 'number' && remaining <= 3) {
            const afterTime = t + 0.095;
            const after = this.audioContext.createOscillator();
            const afterGain = this.audioContext.createGain();
            after.type = 'sine';
            after.frequency.setValueAtTime(95, afterTime);
            after.frequency.exponentialRampToValueAtTime(72, afterTime + 0.05);
            afterGain.gain.setValueAtTime(0, afterTime);
            afterGain.gain.linearRampToValueAtTime(0.009 + (0.006 * urgency), afterTime + 0.005);
            afterGain.gain.exponentialRampToValueAtTime(0.001, afterTime + 0.055);
            after.connect(afterGain);
            afterGain.connect(this.audioContext.destination);
            after.start(afterTime);
            after.stop(afterTime + 0.06);
        }
    }

    public playSelect() {
        if (this.isMutedSFX) return;
        this.init();
        if (!this.audioContext) return;

        const t = this.audioContext.currentTime;

        // Card flip / Paper slide sound
        const bufferSize = this.audioContext.sampleRate * 0.15; // Short duration
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        const gain = this.audioContext.createGain();

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        // Bandpass to simulate friction texture
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(2500, t + 0.1); // Sweep up simulates the speed

        // Quick burst envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        // Subtle low-end thud for the "snap"
        const click = this.audioContext.createOscillator();
        const clickGain = this.audioContext.createGain();
        click.connect(clickGain);
        clickGain.connect(this.audioContext.destination);

        click.type = 'sine';
        click.frequency.setValueAtTime(150, t);
        click.frequency.exponentialRampToValueAtTime(50, t + 0.05);

        clickGain.gain.setValueAtTime(0.2, t);
        clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        noise.start(t);
        noise.stop(t + 0.15);
        click.start(t);
        click.stop(t + 0.05);
    }

    public playSteal() {
        if (this.isMutedSFX) return;
        this.init();
        if (!this.audioContext) return;

        const t = this.audioContext.currentTime;

        // "Yoink" sound - quick upwards slide followed by a sharp drop and a metallic pluck
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        // Add a "metallic" pluck at the start of the grab
        const pluck = this.audioContext.createOscillator();
        const pluckGain = this.audioContext.createGain();
        pluck.type = 'sawtooth';
        pluck.frequency.setValueAtTime(800, t + 0.1);
        pluck.frequency.exponentialRampToValueAtTime(200, t + 0.2);

        pluckGain.gain.setValueAtTime(0, t + 0.1);
        pluckGain.gain.linearRampToValueAtTime(0.2, t + 0.12);
        pluckGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        pluck.connect(pluckGain);
        pluckGain.connect(this.audioContext.destination);

        osc.start(t);
        osc.stop(t + 0.3);
        pluck.start(t + 0.1);
        pluck.stop(t + 0.2);
    }

    public playSuccess() {
        if (this.isMutedSFX) return;
        this.init();
        if (!this.audioContext) return;

        const t = this.audioContext.currentTime;
        // F Major 7 chord: F4, A4, C5, E5 - soft and uplifting
        const freqs = [349.23, 440.00, 523.25, 659.25];

        freqs.forEach((f, i) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.type = 'sine';
            osc.frequency.value = f;

            osc.connect(gain);
            gain.connect(this.audioContext!.destination);

            const start = t + (i * 0.02);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.08, start + 0.05); // Very soft
            gain.gain.exponentialRampToValueAtTime(0.001, start + 1.0);

            osc.start(start);
            osc.stop(start + 1.0);
        });
    }

    public onTrackEnded: (() => void) | null = null;

    public playBGM(track?: string) {
        if (this.isMutedBGM) return;

        const path = track ? `/bgm/${track}` : '/bgm.mp3';

        // Check if existing audio is playing same track
        if (this.bgmAudio && !this.bgmAudio.paused && this.bgmAudio.src.endsWith(path)) {
            return;
        }

        this.stopBGM();

        this.bgmAudio = new Audio(path);
        this.bgmAudio.loop = false; // We handle sequencing manually
        this.bgmAudio.volume = 0.2;

        this.bgmAudio.addEventListener('ended', () => {
            if (this.onTrackEnded) {
                this.onTrackEnded();
            }
        });

        this.bgmAudio.addEventListener('error', () => {
            console.log("BGM file missing:", path);
            if (!track) {
                // Only fallback to procedural if default failed
                console.log("Playing procedural.");
                this.playProceduralBGM();
            }
        });

        this.bgmAudio.play().catch(() => {
            console.log("Autoplay blocked");
        });
    }

    public playProceduralBGM() {
        if (this.isMutedBGM) return;
        this.init();
        if (!this.audioContext) return;
        if (this.proceduralNodes.length > 0) return; // Already playing

        const t = this.audioContext.currentTime;

        // Ambient Drone: A Major add9 (A2, E3, A3, B3, E4)
        const freqs = [110, 164.81, 220, 246.94, 329.63];

        const masterGain = this.audioContext.createGain();
        masterGain.gain.value = 0.05; // Very subtle
        masterGain.connect(this.audioContext.destination);

        freqs.forEach((f, i) => {
            const osc = this.audioContext!.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.value = f;

            // Volume LFO for "breathing" pad sound
            const lfo = this.audioContext!.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.05 + (Math.random() * 0.1);

            const lfoGain = this.audioContext!.createGain();
            lfoGain.gain.value = 0.3;

            const oscAmp = this.audioContext!.createGain();
            oscAmp.gain.value = 0.6;

            lfo.connect(lfoGain);
            lfoGain.connect(oscAmp.gain);

            osc.connect(oscAmp);
            oscAmp.connect(masterGain);

            osc.start(t);
            lfo.start(t);

            this.proceduralNodes.push(osc);
            this.proceduralNodes.push(lfo);
        });
    }

    public stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
        this.stopProceduralBGM();
    }

    public stopProceduralBGM() {
        this.proceduralNodes.forEach((node: AudioBufferSourceNode) => {
            // Suppress errors — node may already be stopped/disconnected
            // eslint-disable-next-line no-empty
            try { node.stop(); } catch { }
            // eslint-disable-next-line no-empty
            try { node.disconnect(); } catch { }
        });
        this.proceduralNodes = [];
    }

    public playSwoosh() {
        if (this.isMutedSFX) return;
        this.init();
        if (!this.audioContext) return;

        const t = this.audioContext.currentTime;
        // White noise buffer for better swoosh
        const bufferSize = this.audioContext.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        // Filter sweep (Bandpass for "whoosh" air sound) - Lowered frequency for "calmer" feel
        filter.type = 'bandpass';
        filter.Q.value = 0.8;
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(1500, t + 0.2); // Woosh up - less piercing
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.4);

        // Volume Envelope - Toned down peak
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.2); // Peak (was 0.4)
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5); // Tail

        noise.start(t);
        noise.stop(t + 0.5);
    }

    public playChime() {
        if (this.isMutedSFX) return;
        this.init();
        if (!this.audioContext) return;

        const t = this.audioContext.currentTime;
        // C Major 9 chord: C5, E5, G5, B5, D6
        const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66];

        freqs.forEach((f, i) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();

            osc.type = 'sine';
            osc.frequency.value = f;

            osc.connect(gain);
            gain.connect(this.audioContext!.destination);

            // Staggered entry for "strumming/glissando" effect
            const start = t + (i * 0.05);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 3.0); // Long shimmering tail

            osc.start(start);
            osc.stop(start + 3.0);
        });
    }

    public playFinalResults() {
        if (this.isMutedSFX) return;
        this.init();
        if (!this.audioContext) return;

        const t = this.audioContext.currentTime;
        
        // Triumphant fanfare: Build up with drums, then big chord resolution
        
        // 1. Drum roll build-up
        const drumRollLength = 1.2;
        for (let i = 0; i < 20; i++) {
            const drumTime = t + (i * drumRollLength / 20);
            const drumOsc = this.audioContext!.createOscillator();
            const drumGain = this.audioContext!.createGain();
            
            drumOsc.type = 'square';
            drumOsc.frequency.setValueAtTime(80, drumTime);
            drumOsc.frequency.exponentialRampToValueAtTime(40, drumTime + 0.05);
            
            drumGain.gain.setValueAtTime(0, drumTime);
            drumGain.gain.linearRampToValueAtTime(0.3, drumTime + 0.01);
            drumGain.gain.exponentialRampToValueAtTime(0.001, drumTime + 0.08);
            
            drumOsc.connect(drumGain);
            drumGain.connect(this.audioContext!.destination);
            
            drumOsc.start(drumTime);
            drumOsc.stop(drumTime + 0.08);
        }
        
        // 2. Big triumphant chord at the peak (C Major with octaves)
        const chordTime = t + drumRollLength;
        const triumphantFreqs = [131.25, 261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C2, C4, E4, G4, C5, E5, G5
        
        triumphantFreqs.forEach((f, i) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            
            osc.type = i < 2 ? 'triangle' : 'sine'; // Lower notes with more body
            osc.frequency.value = f;
            
            osc.connect(gain);
            gain.connect(this.audioContext!.destination);
            
            // Simultaneous big impact
            gain.gain.setValueAtTime(0, chordTime);
            gain.gain.linearRampToValueAtTime(0.2, chordTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 4.0);
            
            osc.start(chordTime);
            osc.stop(chordTime + 4.0);
        });
        
        // 3. Ascending flourish (victory arpeggio)
        const flourishTime = chordTime + 0.3;
        const flourishFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        
        flourishFreqs.forEach((f, i) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = f;
            
            osc.connect(gain);
            gain.connect(this.audioContext!.destination);
            
            const noteStart = flourishTime + (i * 0.1);
            
            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.5);
            
            osc.start(noteStart);
            osc.stop(noteStart + 1.5);
        });
    }
}

export const audioManager = new AudioManager();
