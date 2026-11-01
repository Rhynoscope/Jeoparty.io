// PERMANENT JEOPARTY HOST — fixed pixel-art character + scripted announcement captions.
// The host is never player-customizable and never changes identity between matches.
//
// NOTE: This module intentionally has no randomness in the character's look.
// Visuals are drawn as crisp SVG rects on a tiny pixel grid (MS Paint style).

import { sfx } from './audio.js';

export const HOST_IDENTITY = Object.freeze({
  id: 'jeoparty_host',
  name: 'Jeoparty Host',
  title: 'Your Host',
});

const HOST_VOICE_KEY = 'jeoparty_host_voice';

/**
 * Hand-drawn 32x36 pixel-art host on a crisp rect grid.
 * Outfit: slick hair, big mustache, blue suit, white shirt, gold tie, gold mic.
 * Colours are CSS custom properties so the Halloween mode can re-skin the same
 * permanent character without ever changing who the host is.
 */
export function buildHostSVG() {
  const R = (x, y, w, h, fill, cls = '') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${cls ? ` class="${cls}"` : ''} />`;

  return `<svg class="host-svg" viewBox="0 0 32 36" role="img" aria-label="Jeoparty Host" shape-rendering="crispEdges" preserveAspectRatio="xMidYMax meet">
    <!-- body / suit -->
    ${R(5, 18, 9, 18, 'var(--host-suit, #1f6fd6)')}
    ${R(18, 18, 9, 18, 'var(--host-suit, #1f6fd6)')}
    ${R(5, 18, 2, 18, 'var(--host-suit-shade, #124a96)')}
    ${R(25, 18, 2, 18, 'var(--host-suit-shade, #124a96)')}
    ${R(12, 18, 8, 6, 'var(--host-shirt, #f7fbff)')}
    ${R(12, 24, 8, 12, 'var(--host-shirt, #f7fbff)')}
    ${R(13, 18, 6, 3, 'var(--host-shirt, #f7fbff)')}
    <!-- lapels -->
    ${R(12, 18, 3, 9, 'var(--host-suit-shade, #124a96)')}
    ${R(17, 18, 3, 9, 'var(--host-suit-shade, #124a96)')}
    ${R(13, 18, 1, 4, 'var(--host-suit, #1f6fd6)')}
    ${R(18, 18, 1, 4, 'var(--host-suit, #1f6fd6)')}
    <!-- tie -->
    ${R(15, 18, 2, 2, 'var(--host-tie, #ffd900)')}
    ${R(15, 20, 2, 7, 'var(--host-tie, #ffd900)')}
    ${R(15, 27, 2, 2, 'var(--host-tie-shade, #c7a500)')}
    <!-- pocket square + button -->
    ${R(20, 24, 3, 2, 'var(--host-tie, #ffd900)')}
    ${R(16, 29, 1, 1, 'var(--host-tie, #ffd900)')}
    <!-- arms -->
    ${R(2, 20, 3, 11, 'var(--host-suit, #1f6fd6)')}
    ${R(2, 20, 1, 11, 'var(--host-suit-shade, #124a96)')}
    ${R(2, 31, 3, 3, 'var(--host-skin, #f2c89b)')}
    ${R(27, 20, 3, 7, 'var(--host-suit, #1f6fd6)')}
    ${R(29, 20, 1, 7, 'var(--host-suit-shade, #124a96)')}
    ${R(27, 27, 3, 3, 'var(--host-skin, #f2c89b)')}
    <!-- gold microphone -->
    ${R(26, 16, 5, 5, 'var(--host-mic-dark, #7c8598)')}
    ${R(27, 17, 3, 3, 'var(--host-mic, #cfd5e6)')}
    ${R(28, 18, 1, 1, 'var(--host-mic-dark, #7c8598)')}
    ${R(27, 21, 2, 6, 'var(--host-mic-dark, #7c8598)')}
    <!-- neck + ears -->
    ${R(14, 16, 4, 3, 'var(--host-skin-shade, #c79e73)')}
    ${R(7, 9, 2, 4, 'var(--host-skin, #f2c89b)')}
    ${R(23, 9, 2, 4, 'var(--host-skin, #f2c89b)')}
    <!-- head -->
    ${R(8, 5, 16, 14, 'var(--host-outline, #000000)')}
    ${R(9, 6, 14, 12, 'var(--host-skin, #f2c89b)')}
    <!-- hair: slick sides + fringe -->
    ${R(7, 3, 18, 4, 'var(--host-hair, #2b1a10)')}
    ${R(8, 6, 2, 4, 'var(--host-hair, #2b1a10)')}
    ${R(22, 6, 2, 4, 'var(--host-hair, #2b1a10)')}
    ${R(11, 4, 6, 1, 'var(--host-hair-light, #4a3020)')}
    ${R(9, 7, 14, 1, 'var(--host-hair, #2b1a10)')}
    <!-- brows -->
    ${R(11, 8, 3, 1, 'var(--host-hair, #2b1a10)')}
    ${R(18, 8, 3, 1, 'var(--host-hair, #2b1a10)')}
    <!-- eyes -->
    ${R(11, 9, 3, 3, 'var(--host-eye-white, #ffffff)', 'host-eye host-eye-l')}
    ${R(18, 9, 3, 3, 'var(--host-eye-white, #ffffff)', 'host-eye host-eye-r')}
    ${R(12, 10, 1, 2, 'var(--host-eye, #101018)', 'host-pupil')}
    ${R(19, 10, 1, 2, 'var(--host-eye, #101018)', 'host-pupil')}
    <!-- nose + mustache -->
    ${R(15, 12, 2, 2, 'var(--host-skin-shade, #c79e73)')}
    ${R(11, 14, 10, 2, 'var(--host-hair, #2b1a10)')}
    ${R(10, 15, 2, 1, 'var(--host-hair, #2b1a10)')}
    ${R(20, 15, 2, 1, 'var(--host-hair, #2b1a10)')}
    <!-- mouth (animated while talking) -->
    ${R(14, 16, 4, 2, 'var(--host-mouth, #7a1f2b)', 'host-mouth')}
  </svg>`;
}

class HostPresenter {
  constructor() {
    this.voiceEnabled = localStorage.getItem(HOST_VOICE_KEY) === '1';
    this.figureEl = null;
    this.captionEl = null;
    this.nameEl = null;
    this.voiceBtnEl = null;
    this.talkingTimer = null;
    this.lastLineId = null;
    this.voice = null;
    this.voicesLoaded = false;
  }

  init({ figureEl, captionEl, nameEl, voiceBtnEl }) {
    this.figureEl = figureEl || null;
    this.captionEl = captionEl || null;
    this.nameEl = nameEl || null;
    this.voiceBtnEl = voiceBtnEl || null;

    if (this.figureEl && !this.figureEl.querySelector('.host-svg')) {
      this.figureEl.innerHTML = buildHostSVG();
    }
    if (this.nameEl) this.nameEl.textContent = HOST_IDENTITY.name;
    if (this.voiceBtnEl) {
      this.voiceBtnEl.addEventListener('click', () => {
        this.setVoiceEnabled(!this.voiceEnabled);
        if (this.voiceEnabled) {
          this.speak('Welcome to Jeoparty!');
        }
      });
      this.syncVoiceButton();
    }
    this.loadVoices();
  }

  loadVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length === 0) return;
      this.voicesLoaded = true;
      const english = voices.filter((v) => /^en/i.test(v.lang || ''));
      const preferred =
        english.find((v) => /google uk english male|daniel|alex|fred|arthur/i.test(v.name)) ||
        english.find((v) => /male/i.test(v.name)) ||
        english[0] ||
        null;
      this.voice = preferred;
    };
    pick();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', pick);
    }
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = Boolean(enabled);
    localStorage.setItem(HOST_VOICE_KEY, this.voiceEnabled ? '1' : '0');
    if (!this.voiceEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.syncVoiceButton();
  }

  syncVoiceButton() {
    if (!this.voiceBtnEl) return;
    this.voiceBtnEl.setAttribute('aria-pressed', this.voiceEnabled ? 'true' : 'false');
    this.voiceBtnEl.classList.toggle('is-on', this.voiceEnabled);
    this.voiceBtnEl.title = this.voiceEnabled
      ? 'Host voice: ON (click to mute)'
      : 'Host voice: OFF (click to enable)';
    const label = this.voiceBtnEl.querySelector('.host-voice-label');
    if (label) label.textContent = this.voiceEnabled ? 'Voice On' : 'Voice Off';
  }

  /** New match: host line ids restart at 1, so clear the dedupe memory. */
  resetLineMemory() {
    this.lastLineId = null;
  }

  /** Displays a scripted host caption. Never called with client-invented results. */
  showLine(line, tone = 'neutral', id = null) {
    if (!line) return;
    if (id !== null && id !== undefined && id === this.lastLineId) return;
    if (id !== null && id !== undefined) this.lastLineId = id;

    if (this.captionEl) {
      this.captionEl.textContent = line;
      this.captionEl.classList.remove('is-swap');
      // Force a restart of the caption pop animation.
      void this.captionEl.offsetWidth;
      this.captionEl.classList.add('is-swap');
    }
    const hostStage = this.figureEl ? this.figureEl.closest('.host-stage') : null;
    if (hostStage) {
      hostStage.dataset.tone = tone;
      hostStage.classList.remove('tone-neutral', 'tone-excited', 'tone-sad', 'tone-dramatic');
      hostStage.classList.add(`tone-${tone || 'neutral'}`);
      hostStage.classList.add('is-talking');
      clearTimeout(this.talkingTimer);
      this.talkingTimer = setTimeout(() => {
        hostStage.classList.remove('is-talking');
      }, Math.min(5200, 1200 + line.length * 38));
    }
    this.speak(line);
  }

  speak(text) {
    if (!this.voiceEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (sfx.muted) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text).slice(0, 220));
      if (this.voice) utter.voice = this.voice;
      utter.rate = 1.06;
      utter.pitch = 0.82;
      utter.volume = 0.95;
      window.speechSynthesis.speak(utter);
    } catch {
      // TTS is optional — captions always carry the announcement.
    }
  }
}

export const hostPresenter = new HostPresenter();
