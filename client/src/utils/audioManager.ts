class AudioManager {
    private audioContext: AudioContext | null = null;
    private bgmAudio: HTMLAudioElement | null = null;
    private isMuted: boolean = false;
    private proceduralNodes: any[] = [];

    constructor() {
        // Initialize AudioContext lazily to comply with browser autoplay policies
        window.addEventListener('click', () => this.init(), { once: true });
        window.addEventListener('keydown', () => this.init(), { once: true });
    }

    private init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public setMute(mute: boolean) {
        this.isMuted = mute;
        if (this.bgmAudio) {
            this.bgmAudio.muted = this.isMuted;
        }
    }

    public toggleMute() {
        this.setMute(!this.isMuted);
    }

    public playTick(remaining?: number) {
        if (this.isMuted) return;
        this.init();
        if (!this.audioContext) return;

        const t = this.audioContext.currentTime;

        // Soft melodic ping instead of sharp snap
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        // Gentle frequency (330Hz = E4), slightly shifts up as time runs out (last 5s)
        const freq = 330 + (remaining && remaining <= 5 ? (5 - remaining) * 20 : 0);
        osc.frequency.setValueAtTime(freq, t);

        // Quick but soft envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.01); // Toned down volume
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2); // Smooth decay

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(t);
        osc.stop(t + 0.2);
    }

    public playSelect() {
        if (this.isMuted) return;
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
        if (this.isMuted) return;
        this.init();
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        // Whoosh / Swipe sound (noise-like if possible, but using rapid frequency sweep for now)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    public playSuccess() {
        if (this.isMuted) return;
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

    public playBGM(track?: string) {
        if (this.isMuted) return;

        const path = track ? `/bgm/${track}` : '/bgm.mp3';

        // Check if existing audio is playing same track
        if (this.bgmAudio && !this.bgmAudio.paused && this.bgmAudio.src.endsWith(path)) {
            return;
        }

        this.stopBGM();

        this.bgmAudio = new Audio(path);
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.2;

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
        if (this.isMuted) return;
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
        this.proceduralNodes.forEach((node: any) => {
            try { node.stop(); } catch (e) { }
            try { node.disconnect(); } catch (e) { }
        });
        this.proceduralNodes = [];
    }

    public playSwoosh() {
        if (this.isMuted) return;
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
        if (this.isMuted) return;
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
}

export const audioManager = new AudioManager();
