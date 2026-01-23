/**
 * Enhanced Audio Manager
 * Rich sound effects using Web Audio API
 */
export class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.enabled = true;
        this.masterVolume = 0.5;
        this.musicVolume = 0.3;

        // Color to frequency mapping for ball sounds
        this.colorFrequencies = {
            '#7ee8fa': 523.25, // C5
            '#eec0c6': 587.33, // D5
            '#a0e7a0': 659.25, // E5
            '#ffd89b': 698.46, // F5
            '#c9b1ff': 783.99, // G5
            '#ff9b9b': 880.00, // A5
            '#ff6b6b': 466.16, // Bb4 (splitter)
            '#b8b8ff': 415.30, // Ab4 (ghost)
            '#ffa500': 554.37, // Db5 (bomber)
            '#00ffff': 622.25  // Eb5 (chain)
        };

        // Reverb impulse response
        this.reverbNode = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.createReverb();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    async createReverb() {
        if (!this.audioCtx) return;

        // Create a simple reverb using convolver
        const convolver = this.audioCtx.createConvolver();
        const sampleRate = this.audioCtx.sampleRate;
        const length = sampleRate * 1.5; // 1.5 second reverb
        const impulse = this.audioCtx.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }

        convolver.buffer = impulse;
        this.reverbNode = convolver;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    // Create oscillator with envelope
    createOscillator(frequency, type, duration, volume, useReverb = false) {
        if (!this.enabled || !this.audioCtx) return null;

        try {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            oscillator.connect(gainNode);

            if (useReverb && this.reverbNode) {
                const dryGain = this.audioCtx.createGain();
                const wetGain = this.audioCtx.createGain();

                gainNode.connect(dryGain);
                gainNode.connect(this.reverbNode);
                this.reverbNode.connect(wetGain);

                dryGain.connect(this.audioCtx.destination);
                wetGain.connect(this.audioCtx.destination);

                dryGain.gain.value = 0.7;
                wetGain.gain.value = 0.3;
            } else {
                gainNode.connect(this.audioCtx.destination);
            }

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            const adjustedVolume = volume * this.masterVolume;
            gainNode.gain.setValueAtTime(adjustedVolume, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

            return { oscillator, gainNode };
        } catch (e) {
            console.warn('Audio creation failed:', e);
            return null;
        }
    }

    playTone(frequency, type = 'sine', duration = 0.15, volume = 0.3, useReverb = false) {
        const sound = this.createOscillator(frequency, type, duration, volume, useReverb);
        if (sound) {
            sound.oscillator.start(this.audioCtx.currentTime);
            sound.oscillator.stop(this.audioCtx.currentTime + duration);
        }
    }

    // Play note with ADSR envelope
    playNote(frequency, type = 'sine', attack = 0.01, decay = 0.1, sustain = 0.3, release = 0.2, volume = 0.3) {
        if (!this.enabled || !this.audioCtx) return;

        try {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            const now = this.audioCtx.currentTime;
            const adjustedVolume = volume * this.masterVolume;

            // ADSR envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(adjustedVolume, now + attack);
            gainNode.gain.linearRampToValueAtTime(adjustedVolume * sustain, now + attack + decay);
            gainNode.gain.linearRampToValueAtTime(0.01, now + attack + decay + release);

            oscillator.start(now);
            oscillator.stop(now + attack + decay + release + 0.01);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }

    // Ball explosion with color-based pitch
    playExplosion(wave = 0, color = null) {
        const baseFreq = color && this.colorFrequencies[color]
            ? this.colorFrequencies[color]
            : 200 + wave * 50;

        // Main explosion tone
        this.playTone(baseFreq, 'sine', 0.2, 0.2, true);

        // Harmonic
        setTimeout(() => this.playTone(baseFreq * 1.5, 'triangle', 0.1, 0.1), 30);

        // Sub bass
        this.playTone(baseFreq / 2, 'sine', 0.15, 0.15);
    }

    // Splitter ball explosion
    playSplitterExplosion() {
        this.playTone(466, 'sawtooth', 0.1, 0.2);
        setTimeout(() => {
            this.playTone(523, 'sine', 0.08, 0.15);
            this.playTone(587, 'sine', 0.08, 0.15);
            this.playTone(659, 'sine', 0.08, 0.15);
        }, 50);
    }

    // Ghost ball explosion
    playGhostExplosion() {
        this.playTone(415, 'sine', 0.3, 0.15, true);
        setTimeout(() => this.playTone(466, 'sine', 0.25, 0.1, true), 100);
    }

    // Bomber ball explosion
    playBomberExplosion() {
        this.playTone(110, 'sawtooth', 0.3, 0.25);
        this.playTone(220, 'square', 0.2, 0.15);
    }

    // Chain ball lightning
    playChainLightning() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(800 + Math.random() * 400, 'sawtooth', 0.03, 0.1);
            }, i * 20);
        }
    }

    // Combo sound with increasing pitch
    playCombo(combo) {
        const baseFreq = 400 + combo * 80;

        // Arpeggio based on combo
        for (let i = 0; i < Math.min(combo, 5); i++) {
            setTimeout(() => {
                this.playNote(baseFreq * Math.pow(1.2, i), 'square', 0.01, 0.05, 0.5, 0.1, 0.12);
            }, i * 40);
        }
    }

    // Power-up collection
    playPowerUp(type) {
        switch (type) {
            case 'mega':
                this.playTone(523, 'sine', 0.1, 0.2);
                this.playTone(659, 'sine', 0.1, 0.2);
                setTimeout(() => this.playTone(784, 'sine', 0.2, 0.25), 100);
                break;
            case 'slowmo':
                this.playTone(400, 'sine', 0.4, 0.2);
                this.playTone(300, 'sine', 0.5, 0.15);
                break;
            case 'multiplier':
                [523, 659, 784, 1047].forEach((f, i) => {
                    setTimeout(() => this.playTone(f, 'sine', 0.1, 0.15), i * 50);
                });
                break;
            case 'magnet':
                this.playTone(200, 'sawtooth', 0.2, 0.15);
                this.playTone(250, 'sawtooth', 0.2, 0.15);
                break;
            case 'extraClick':
                this.playTone(880, 'sine', 0.1, 0.2);
                setTimeout(() => this.playTone(1047, 'sine', 0.15, 0.2), 80);
                break;
            case 'freeze':
                this.playTone(1200, 'sine', 0.3, 0.15);
                this.playTone(1400, 'triangle', 0.25, 0.1);
                break;
            default:
                this.playTone(600, 'sine', 0.1, 0.2);
        }
    }

    // Success jingle
    playSuccess() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 'sine', 0.02, 0.1, 0.4, 0.3, 0.2), i * 120);
        });
    }

    // Failure sound
    playFail() {
        this.playTone(200, 'sawtooth', 0.4, 0.15);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.5, 0.12), 150);
    }

    // Level up fanfare
    playLevelUp() {
        const notes = [392, 523, 659, 784]; // G4, C5, E5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playNote(freq, 'sine', 0.02, 0.08, 0.5, 0.2, 0.2);
                this.playNote(freq * 1.5, 'triangle', 0.02, 0.08, 0.3, 0.2, 0.1);
            }, i * 100);
        });
    }

    // Achievement unlock
    playAchievement() {
        const notes = [523, 659, 784, 880, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playNote(freq, 'sine', 0.01, 0.05, 0.6, 0.15, 0.2);
            }, i * 60);
        });
    }

    // Click/tap sound
    playClick() {
        this.playTone(600, 'sine', 0.05, 0.1);
    }

    // Timer warning (time attack mode)
    playTimerWarning() {
        this.playTone(440, 'square', 0.1, 0.15);
    }

    // Game over
    playGameOver() {
        const notes = [392, 349, 330, 294]; // G4, F4, E4, D4
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playNote(freq, 'sine', 0.05, 0.2, 0.3, 0.4, 0.15);
            }, i * 200);
        });
    }

    // Black hole ambient
    playBlackHoleAmbient() {
        this.playTone(60, 'sine', 0.5, 0.05);
        this.playTone(90, 'sine', 0.4, 0.03);
    }

    // Reflector bounce
    playReflectorBounce() {
        this.playTone(1000, 'triangle', 0.1, 0.15);
        setTimeout(() => this.playTone(1200, 'sine', 0.08, 0.1), 30);
    }

    // Wall bounce
    playWallBounce() {
        this.playTone(300, 'square', 0.05, 0.1);
    }

    // Face ball sounds - synthesized voice-like sounds
    playFaceSound(faceId) {
        if (!this.enabled || !this.audioCtx) return;

        try {
            switch (faceId) {
                case 'papa':
                    // "Oppiiii" - deep male voice, descending then rising
                    this.playVoiceSound([180, 160, 140, 150, 170, 190], 0.12, 'sawtooth', 0.25);
                    break;
                case 'mama':
                    // "Babsiii" - higher female voice, bouncy
                    this.playVoiceSound([350, 300, 380, 420, 450, 480], 0.1, 'sine', 0.2);
                    break;
                case 'kind':
                    // "Nicooo" - highest baby voice, playful rising
                    this.playVoiceSound([500, 550, 480, 520, 600, 650, 700], 0.08, 'triangle', 0.18);
                    break;
            }
        } catch (e) {
            console.warn('Face sound failed:', e);
        }
    }

    // Create voice-like sound with frequency sequence
    playVoiceSound(frequencies, noteDuration, waveType, volume) {
        if (!this.audioCtx) return;

        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const filter = this.audioCtx.createBiquadFilter();

                // Voice-like filter
                filter.type = 'lowpass';
                filter.frequency.value = freq * 3;
                filter.Q.value = 1;

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.type = waveType;
                osc.frequency.value = freq;

                // Add vibrato for more natural sound
                const vibrato = this.audioCtx.createOscillator();
                const vibratoGain = this.audioCtx.createGain();
                vibrato.frequency.value = 5;
                vibratoGain.gain.value = freq * 0.02;
                vibrato.connect(vibratoGain);
                vibratoGain.connect(osc.frequency);
                vibrato.start();

                const now = this.audioCtx.currentTime;
                const adjustedVolume = volume * this.masterVolume;

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(adjustedVolume, now + 0.02);
                gain.gain.linearRampToValueAtTime(adjustedVolume * 0.7, now + noteDuration * 0.5);
                gain.gain.linearRampToValueAtTime(0.01, now + noteDuration);

                osc.start(now);
                osc.stop(now + noteDuration + 0.05);
                vibrato.stop(now + noteDuration + 0.05);
            }, i * noteDuration * 1000 * 0.8);
        });
    }
}
