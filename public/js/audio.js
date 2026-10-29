// Centralized Web Audio API Sound Engine with Authentic Jeopardy Audio Assets

const SUPPLIED_ASSETS = {
  correct: '/assets/audio/jeopardy-correct.mp3',
  wrong: '/assets/audio/jeopardy-wrong.mp3',
  daily_double: '/assets/audio/jeopardy-daily-double.mp3',
  think: '/assets/audio/jeopardy-think.mp3',
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.muted = localStorage.getItem('jeoparty_muted') === '1';
    this.sfxVolume = parseFloat(localStorage.getItem('jeoparty_sfx_vol') ?? '0.85');
    this.musicVolume = parseFloat(localStorage.getItem('jeoparty_music_vol') ?? '0.70');
    this.voiceVolume = parseFloat(localStorage.getItem('jeoparty_voice_vol') ?? '1.0');

    this.buffers = new Map();
    this.loadPromises = new Map();
    this.waitingMusicSource = null;
    this.waitingMusicPlaying = false;
    this.currentWaitingKey = null;

    // Start background preload on interaction or construct
    this._preloadAssets();
  }

  _ensureCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  async _preloadAssets() {
    if (typeof window === 'undefined') return;
    for (const [name, url] of Object.entries(SUPPLIED_ASSETS)) {
      this._loadAudioBuffer(name, url).catch(() => {});
    }
  }

  async _loadAudioBuffer(name, url) {
    if (this.buffers.has(name)) return this.buffers.get(name);
    if (this.loadPromises.has(name)) return this.loadPromises.get(name);

    const promise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const arrayBuf = await res.arrayBuffer();
        const ctx = this._ensureCtx();
        if (!ctx) return null;
        const decoded = await ctx.decodeAudioData(arrayBuf);
        this.buffers.set(name, decoded);
        return decoded;
      } catch (err) {
        console.warn(`[Audio] Failed loading asset "${name}":`, err.message);
        return null;
      }
    })();

    this.loadPromises.set(name, promise);
    return promise;
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    localStorage.setItem('jeoparty_sfx_vol', String(this.sfxVolume));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    localStorage.setItem('jeoparty_music_vol', String(this.musicVolume));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  setVoiceVolume(val) {
    this.voiceVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    localStorage.setItem('jeoparty_voice_vol', String(this.voiceVolume));
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted) this.play('pop');
    return this.muted;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    localStorage.setItem('jeoparty_muted', this.muted ? '1' : '0');
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
    }
    if (this.muted) {
      this.stopWaitingMusic();
    }
    return this.muted;
  }

  _playBuffer(buffer, gainNode, { offset = 0, duration = null } = {}) {
    const ctx = this._ensureCtx();
    if (!ctx || this.muted) return;
    try {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gainNode || this.sfxGain || this.masterGain);
      if (duration) {
        src.start(0, offset, duration);
      } else {
        src.start(0, offset);
      }
    } catch (err) {
      console.warn('[Audio] Failed playing buffer:', err);
    }
  }

  _tone(freq, startOffset, duration, type = 'sine', gainVal = 0.14, slideTo = null) {
    const ctx = this._ensureCtx();
    if (!ctx || this.muted) return;
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
    gain.connect(this.sfxGain || ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Play one-shot game sound effect
  play(name) {
    if (this.muted) return;
    this._ensureCtx();

    // 1. Authentic Supplied Jeopardy Correct Chime
    if (name === 'correct') {
      if (this.buffers.has('correct')) {
        this._playBuffer(this.buffers.get('correct'), this.sfxGain);
        return;
      }
      this._loadAudioBuffer('correct', SUPPLIED_ASSETS.correct).then((buf) => {
        if (buf) this._playBuffer(buf, this.sfxGain);
      });
      // Fallback tone while loading
      this._tone(523.25, 0, 0.1, 'triangle', 0.15);
      this._tone(659.25, 0.08, 0.1, 'triangle', 0.15);
      this._tone(783.99, 0.16, 0.12, 'triangle', 0.15);
      this._tone(1046.5, 0.25, 0.26, 'triangle', 0.17);
      return;
    }

    // 2. Authentic Supplied Jeopardy Wrong Answer Buzzer
    if (name === 'wrong' || name === 'timeout') {
      if (this.buffers.has('wrong')) {
        this._playBuffer(this.buffers.get('wrong'), this.sfxGain);
        return;
      }
      this._loadAudioBuffer('wrong', SUPPLIED_ASSETS.wrong).then((buf) => {
        if (buf) this._playBuffer(buf, this.sfxGain);
      });
      // Fallback tone while loading
      this._tone(190, 0, 0.18, 'sawtooth', 0.12, 150);
      this._tone(155, 0.17, 0.28, 'sawtooth', 0.13, 120);
      return;
    }

    // 3. Authentic Supplied Jeopardy Daily Double Laser
    if (name === 'daily_double') {
      if (this.buffers.has('daily_double')) {
        this._playBuffer(this.buffers.get('daily_double'), this.sfxGain);
        return;
      }
      this._loadAudioBuffer('daily_double', SUPPLIED_ASSETS.daily_double).then((buf) => {
        if (buf) this._playBuffer(buf, this.sfxGain);
      });
      // Fallback
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => {
        this._tone(f, i * 0.07, 0.11, 'square', 0.09);
      });
      return;
    }

    // 4. Other Game Sounds
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
      case 'round_start':
        [392, 523.25, 659.25, 783.99].forEach((f, i) => {
          this._tone(f, i * 0.09, 0.18, 'triangle', 0.14);
        });
        break;
      case 'final_think':
        // Start think music
        this.startWaitingMusic('final_clue');
        break;
      case 'victory':
        [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => {
          const d = i === 5 ? 0.45 : 0.12;
          this._tone(f, i * 0.11, d, 'triangle', 0.16);
        });
        break;
      case 'blitz':
        this._tone(880, 0, 0.06, 'sawtooth', 0.12, 1400);
        this._tone(1174, 0.05, 0.1, 'sawtooth', 0.14, 1760);
        break;
      case 'steal':
        this._tone(600, 0, 0.08, 'triangle', 0.12, 450);
        this._tone(450, 0.07, 0.08, 'triangle', 0.12, 700);
        this._tone(800, 0.14, 0.16, 'triangle', 0.14);
        break;
      case 'streak':
        this._tone(440, 0, 0.08, 'triangle', 0.12);
        this._tone(554.37, 0.07, 0.08, 'triangle', 0.13);
        this._tone(659.25, 0.14, 0.08, 'triangle', 0.14);
        this._tone(880, 0.21, 0.22, 'triangle', 0.16);
        break;
      case 'reaction':
        this._tone(620, 0, 0.07, 'sine', 0.1, 950);
        break;
      case 'hint':
        this._tone(784, 0, 0.06, 'sine', 0.08);
        this._tone(1046.5, 0.05, 0.1, 'sine', 0.09);
        break;
      case 'chaos':
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          this._tone(f, i * 0.05, 0.08, 'triangle', 0.12);
        });
        break;
      case 'tick':
        this._tone(800, 0, 0.035, 'sine', 0.05);
        break;
    }
  }

  // 3. Authentic Supplied Jeopardy Waiting / Think Music (Continuous Loop)
  startWaitingMusic(stateKey = 'waiting') {
    if (this.muted) return;
    if (this.waitingMusicPlaying && this.currentWaitingKey === stateKey) {
      return; // Already playing for this state
    }

    const ctx = this._ensureCtx();
    if (!ctx) return;

    // If already playing for another state, stop first
    if (this.waitingMusicPlaying) {
      this.stopWaitingMusic();
    }

    const startWithBuffer = (buf) => {
      if (!buf || this.muted) return;
      try {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(this.musicGain || this.masterGain);
        src.start(0);
        this.waitingMusicSource = src;
        this.waitingMusicPlaying = true;
        this.currentWaitingKey = stateKey;
      } catch (err) {
        console.warn('[Audio] Failed starting waiting music:', err);
      }
    };

    if (this.buffers.has('think')) {
      startWithBuffer(this.buffers.get('think'));
    } else {
      this._loadAudioBuffer('think', SUPPLIED_ASSETS.think).then((buf) => {
        if (buf && !this.waitingMusicPlaying) {
          startWithBuffer(buf);
        }
      });
    }
  }

  stopWaitingMusic() {
    if (this.waitingMusicSource) {
      try {
        this.waitingMusicSource.stop();
        this.waitingMusicSource.disconnect();
      } catch (e) {}
      this.waitingMusicSource = null;
    }
    this.waitingMusicPlaying = false;
    this.currentWaitingKey = null;
  }
}

export const sfx = new SoundEngine();
