// Zero-dependency Web Audio API Cartoon & Game-Show Synthesizer

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('jeoparty_muted') === '1';
  }

  _ensureCtx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('jeoparty_muted', this.muted ? '1' : '0');
    if (!this.muted) this.play('pop');
    return this.muted;
  }

  _tone(freq, startOffset, duration, type = 'sine', gainVal = 0.14, slideTo = null) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  play(name) {
    if (this.muted) return;
    switch (name) {
      case 'pop':
        this._tone(420, 0, 0.08, 'sine', 0.12, 680);
        break;
      case 'click':
        this._tone(540, 0, 0.06, 'triangle', 0.1, 360);
        break;
      case 'clue_reveal':
        this._tone(440, 0, 0.09, 'triangle', 0.12);
        this._tone(660, 0.07, 0.14, 'triangle', 0.13);
        break;
      case 'buzz':
        this._tone(587.33, 0, 0.08, 'square', 0.1);
        this._tone(880, 0.06, 0.16, 'square', 0.11);
        break;
      case 'correct':
        this._tone(523.25, 0, 0.1, 'triangle', 0.15);
        this._tone(659.25, 0.08, 0.1, 'triangle', 0.15);
        this._tone(783.99, 0.16, 0.12, 'triangle', 0.15);
        this._tone(1046.5, 0.25, 0.26, 'triangle', 0.17);
        break;
      case 'wrong':
        this._tone(190, 0, 0.18, 'sawtooth', 0.12, 150);
        this._tone(155, 0.17, 0.28, 'sawtooth', 0.13, 120);
        break;
      case 'timeout':
        this._tone(240, 0, 0.11, 'sawtooth', 0.11);
        this._tone(240, 0.13, 0.11, 'sawtooth', 0.11);
        this._tone(180, 0.26, 0.25, 'sawtooth', 0.12);
        break;
      case 'daily_double':
        // Energetic game-show laser arpeggio!
        [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => {
          this._tone(f, i * 0.07, 0.11, 'square', 0.09);
        });
        break;
      case 'round_start':
        [392, 523.25, 659.25, 783.99].forEach((f, i) => {
          this._tone(f, i * 0.09, 0.18, 'triangle', 0.14);
        });
        break;
      case 'final_think':
        // Playful opening 4-note motif nod
        this._tone(523.25, 0, 0.22, 'triangle', 0.12);
        this._tone(698.46, 0.26, 0.22, 'triangle', 0.12);
        this._tone(523.25, 0.52, 0.22, 'triangle', 0.12);
        this._tone(349.23, 0.78, 0.3, 'triangle', 0.12);
        break;
      case 'victory':
        [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => {
          const d = i === 5 ? 0.45 : 0.12;
          this._tone(f, i * 0.11, d, 'triangle', 0.16);
        });
        break;
      case 'tick':
        this._tone(800, 0, 0.035, 'sine', 0.05);
        break;
    }
  }
}

export const sfx = new SoundEngine();
