class AudioManager {
    private audioContext: AudioContext | null = null;
    private bgmAudio: HTMLAudioElement | null = null;
    private isMuted: boolean = false;

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
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        // Larger tonal difference: 50Hz per step (Distinct pitch change)
        // 5->300Hz, 4->250Hz, 3->200Hz, 2->150Hz, 1->100Hz
        const steps = remaining || 5;
        const startFreq = 50 + (steps * 50);

        // Impact synth: Sine sweep (Kick drum style)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.15); // Fast drop to sub-bass

        // Filter to add "thump" body and cut harshness
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(startFreq * 1.5, t); // Filter follows pitch
        filter.frequency.exponentialRampToValueAtTime(50, t + 0.1);

        // Snappy envelope for IMPACT
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(1.5, t + 0.01); // Hard attack
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.start(t);
        osc.stop(t + 0.3);
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

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        osc.frequency.setValueAtTime(554.37, this.audioContext.currentTime + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.2); // E5

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.6);
    }

    public playBGM() {
        // Just a placeholder for file-based BGM
        // Users can place a 'bgm.mp3' in the public folder
        if (!this.bgmAudio) {
            this.bgmAudio = new Audio('/bgm.mp3');
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.3;
        }

        // Only play if not already playing
        if (this.bgmAudio.paused) {
            this.bgmAudio.play().catch(e => {
                console.log("Autoplay blocked, waiting for interaction");
            });
        }
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

        // Filter sweep (Bandpass for "whoosh" air sound)
        filter.type = 'bandpass';
        filter.Q.value = 1;
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(3000, t + 0.2); // Woosh up
        filter.frequency.exponentialRampToValueAtTime(600, t + 0.4);

        // Volume Envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.2); // Peak
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
