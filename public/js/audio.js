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
      this.stopHalloweenMusic();
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
      case 'money_up':
        // Bright pixel coin cascade for a winning podium
        this._tone(880, 0, 0.05, 'square', 0.1, 1320);
        this._tone(1174.66, 0.05, 0.05, 'square', 0.1, 1568);
        this._tone(1567.98, 0.1, 0.1, 'triangle', 0.11);
        break;
      case 'money_down':
        // Sad descending buzzer for a losing podium
        this._tone(392, 0, 0.09, 'sawtooth', 0.1, 262);
        this._tone(261.63, 0.09, 0.16, 'triangle', 0.11, 174);
        break;
      case 'intro_start':
        // Big pixel fanfare for the cinematic stage intro.
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this._tone(f, i * 0.11, i === 4 ? 0.45 : 0.2, 'triangle', 0.15);
        });
        this._tone(196, 0, 0.7, 'sawtooth', 0.06);
        break;
      case 'board_reveal':
        // Camera whoosh into the board plus a bright reveal chime.
        this._tone(180, 0, 0.32, 'triangle', 0.08, 620);
        this._tone(880, 0.22, 0.12, 'triangle', 0.13);
        this._tone(1174.66, 0.3, 0.22, 'triangle', 0.14);
        break;
      case 'cine_shot':
        // Short mechanical camera tick used for each cinematic cut.
        this._tone(1500, 0, 0.025, 'square', 0.035, 700);
        this._tone(700, 0.02, 0.06, 'triangle', 0.045, 320);
        break;
      case 'wheel_spin':
        // Rising airy whoosh while the category wheel spins up
        this._tone(180, 0, 0.5, 'triangle', 0.07, 520);
        this._tone(240, 0.12, 0.6, 'sine', 0.06, 700);
        break;
      case 'wheel_tick':
        this._tone(1200, 0, 0.025, 'square', 0.045, 900);
        break;
      case 'wheel_stop':
        // Chunky landing fanfare with a little sparkle
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this._tone(f, i * 0.055, i === 3 ? 0.32 : 0.1, 'triangle', 0.15);
        });
        this._tone(2093, 0.24, 0.16, 'sine', 0.08);
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
      case 'candy_collect':
      case 'candy':
        // Sweet magical candy pickup chime
        [1046.5, 1318.5, 1568, 2093].forEach((f, i) => {
          this._tone(f, i * 0.05, 0.12, 'sine', 0.14);
        });
        break;
      case 'ghost_boo':
      case 'ghost':
        // Eerie spectral whoosh
        this._tone(587, 0, 0.28, 'sine', 0.12, 196);
        this._tone(293, 0.08, 0.35, 'triangle', 0.08, 98);
        break;
      case 'witch_cackle':
      case 'cauldron':
        // Bubbling potion / witch cackle
        [220, 260, 310, 370, 310, 260].forEach((f, i) => {
          this._tone(f, i * 0.04, 0.06, 'sawtooth', 0.09, f * 1.3);
        });
        break;
      case 'spooky_wrong':
        // Dissonant minor gothic chime
        [155.6, 164.8, 220].forEach((f) => {
          this._tone(f, 0, 0.35, 'sawtooth', 0.11, f * 0.95);
        });
        break;
      case 'halloween_daily_double':
        // Dramatic gothic organ flourish
        [220, 277.2, 329.6, 440, 554.4, 659.3, 880].forEach((f, i) => {
          this._tone(f, i * 0.07, 0.22, 'sawtooth', 0.12);
        });
        break;
      case 'pumpkin_blitz':
        // Rapid spooky chromatic fanfare
        [440, 466.2, 493.9, 523.3, 554.4, 587.3, 622.3, 659.3].forEach((f, i) => {
          this._tone(f, i * 0.04, 0.08, 'sawtooth', 0.1);
        });
        break;
      case 'halloween_victory':
        // Joyful macabre waltz fanfare
        [392, 493.88, 587.33, 783.99, 659.25, 783.99, 987.77].forEach((f, i) => {
          this._tone(f, i * 0.09, 0.25, 'triangle', 0.15);
        });
        break;
    }
  }

  // Multi-state Procedural Halloween Music Synthesizer
  startHalloweenMusic(trackKey = 'lobby') {
    if (this.muted) return;
    if (this.halloweenMusicPlaying && this.currentHalloweenTrack === trackKey) return;
    this.stopHalloweenMusic();
    this.stopWaitingMusic();

    const ctx = this._ensureCtx();
    if (!ctx) return;

    this.halloweenMusicPlaying = true;
    this.currentHalloweenTrack = trackKey;

    const TRACK_PATTERNS = {
      lobby: {
        tempoMs: 240,
        notes: [
          293.66, 349.23, 440.0, 587.33, 554.37, 440.0, 349.23, 392.0,
          466.16, 587.33, 440.0, 349.23, 329.63, 277.18, 293.66, 0
        ],
        type: 'triangle',
        decay: 0.22,
        gain: 0.12,
      },
      board: {
        tempoMs: 280,
        notes: [
          146.83, 220.0, 293.66, 349.23, 329.63, 277.18, 293.66, 233.08,
          146.83, 220.0, 293.66, 370.0, 349.23, 293.66, 277.18, 0
        ],
        type: 'sine',
        decay: 0.25,
        gain: 0.11,
      },
      clue: {
        tempoMs: 210,
        notes: [
          220.0, 293.66, 349.23, 415.3, 440.0, 392.0, 349.23, 329.63,
          293.66, 277.18, 246.94, 220.0, 277.18, 329.63, 440.0, 0
        ],
        type: 'sawtooth',
        decay: 0.18,
        gain: 0.09,
      },
      daily_double: {
        tempoMs: 260,
        notes: [
          220.0, 277.18, 329.63, 440.0, 554.37, 659.25, 880.0, 659.25,
          554.37, 440.0, 329.63, 277.18, 220.0, 164.81, 220.0, 0
        ],
        type: 'sawtooth',
        decay: 0.3,
        gain: 0.12,
      },
      final: {
        tempoMs: 195,
        notes: [
          440.0, 392.0, 440.0, 293.66, 329.63, 349.23, 392.0, 349.23,
          329.63, 293.66, 277.18, 293.66, 220.0, 293.66, 440.0, 0
        ],
        type: 'sawtooth',
        decay: 0.28,
        gain: 0.12,
      },
      victory: {
        tempoMs: 200,
        notes: [
          392.0, 493.88, 587.33, 783.99, 659.25, 783.99, 987.77, 783.99,
          587.33, 659.25, 783.99, 587.33, 493.88, 392.0, 587.33, 0
        ],
        type: 'triangle',
        decay: 0.22,
        gain: 0.13,
      },
    };

    const pat = TRACK_PATTERNS[trackKey] || TRACK_PATTERNS.lobby;
    let step = 0;

    const playStep = () => {
      if (!this.halloweenMusicPlaying || this.muted) return;
      const freq = pat.notes[step % pat.notes.length];
      if (freq > 0) {
        this._tone(freq, 0, pat.decay, pat.type, pat.gain);
      }
      step++;
    };

    playStep();
    this.halloweenMusicTimer = setInterval(playStep, pat.tempoMs);
  }

  stopHalloweenMusic() {
    if (this.halloweenMusicTimer) {
      clearInterval(this.halloweenMusicTimer);
      this.halloweenMusicTimer = null;
    }
    this.halloweenMusicPlaying = false;
    this.currentHalloweenTrack = null;
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
    this.stopHalloweenMusic();
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
