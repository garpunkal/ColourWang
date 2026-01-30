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

    public playTick() {
        if (this.isMuted) return;
        this.init();
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        // Deeper "woodblock" / Percussive tick
        osc.type = 'sine';
        // Lower starting frequency for deeper tone
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    public playSelect() {
        if (this.isMuted) return;
        this.init();
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        // Soft pleasing pop sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
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
}

export const audioManager = new AudioManager();
