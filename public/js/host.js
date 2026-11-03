// PERMANENT JEOPARTY HOST — hand-drawn on the game's pixel grid to match the supplied host sheet.
// The large swept brown hair, square eyes, moustache, blue suit, yellow tie, and microphone are
// part of every animation pose so the host stays recognizable while he speaks or gestures.

import {
  MiniPixelGrid,
  hexToRgba,
  drawPixelStar,
  BLACK,
  WHITE,
  GOLD,
  CYAN,
} from './avatar.js';
import { sfx } from './audio.js';

export const HOST_IDENTITY = Object.freeze({
  id: 'jeoparty_host',
  name: 'Jeoparty Host',
  title: 'Your Host',
});

const HOST_VOICE_KEY = 'jeoparty_host_voice';
const FRAME_W = 52;
const FRAME_H = 52;
const FRAME_COUNT = 4;
const hostSpriteCache = new Map();

export const HOST_MOODS = new Set([
  'idle',
  'talking',
  'smiling',
  'blinking',
  'celebrating',
  'introducing',
  'reacting',
  'winner',
  'waving',
]);

/** Draw one bold, blocky host frame based on the supplied blue-suit sprite. */
export function drawHostFrame(g, mood = 'idle', isHalloween = false, f = 0) {
  const safeMood = HOST_MOODS.has(mood) ? mood : 'idle';
  const frame = f % FRAME_COUNT;
  const bobY = safeMood === 'celebrating' || safeMood === 'winner'
    ? (frame % 2 ? -2 : -1)
    : safeMood === 'blinking' || safeMood === 'reacting'
    ? 0
    : (frame === 1 || (safeMood === 'talking' && frame === 3) ? -1 : 0);

  const suit = hexToRgba(isHalloween ? '#382062' : '#1264d7');
  const suitShade = hexToRgba(isHalloween ? '#21103e' : '#0c3f96');
  const suitLight = hexToRgba(isHalloween ? '#7040a3' : '#2c82f5');
  const shirt = hexToRgba(isHalloween ? '#f5efff' : '#fffdf3');
  const tie = hexToRgba(isHalloween ? '#ff8426' : '#ffdf00');
  const tieShade = hexToRgba(isHalloween ? '#c95411' : '#cf9f00');
  const skin = hexToRgba('#f4c58f');
  const skinLight = hexToRgba('#ffe0ae');
  const skinShade = hexToRgba('#d99c62');
  const hair = hexToRgba('#4a2b1b');
  const hairDark = hexToRgba('#28170f');
  const hairLight = hexToRgba('#704528');
  const moustache = hexToRgba('#24160f');
  const moustacheLight = hexToRgba('#50301d');
  const mic = hexToRgba('#aeb8c8');
  const micLight = hexToRgba('#e0e5ed');
  const mouth = hexToRgba('#781827');

  // Wide jacket and white shirt fill the lower half, like the reference bust.
  const jacket = [
    [4, 52], [5, 46 + bobY], [9, 42 + bobY], [16, 38 + bobY],
    [22, 36 + bobY], [31, 36 + bobY], [38, 38 + bobY],
    [45, 42 + bobY], [49, 47 + bobY], [49, 52],
  ];
  g.poly(jacket, 2, BLACK, true);
  g.floodFill(26, 46 + bobY, suit, null, suitShade, 49 + bobY);
  g.poly(jacket, 2, BLACK, true);
  g.rect(8, 44 + bobY, 4, 7, suitShade);
  g.rect(41, 44 + bobY, 4, 7, suitShade);
  g.rect(12, 41 + bobY, 4, 2, suitLight);
  g.rect(37, 41 + bobY, 4, 2, suitLight);

  // Square white shirt, strong lapels, long yellow tie and bright pocket square.
  const shirtShape = [[20, 37 + bobY], [32, 37 + bobY], [36, 52], [16, 52]];
  g.poly(shirtShape, 1.6, BLACK, true);
  g.floodFill(26, 43 + bobY, shirt);
  g.poly(shirtShape, 1.6, BLACK, true);
  g.poly([[18, 39 + bobY], [24, 42 + bobY], [22, 47 + bobY]], 1.2, BLACK, true);
  g.floodFill(21, 43 + bobY, suitLight);
  g.poly([[34, 39 + bobY], [28, 42 + bobY], [30, 47 + bobY]], 1.2, BLACK, true);
  g.floodFill(31, 43 + bobY, suitLight);
  g.poly([[24, 38 + bobY], [28, 38 + bobY], [27, 41 + bobY], [25, 41 + bobY]], 1.3, BLACK, true);
  g.floodFill(26, 39 + bobY, tie);
  g.poly([[25, 41 + bobY], [27, 41 + bobY], [29, 49], [26, 52], [23, 49]], 1.3, BLACK, true);
  g.floodFill(26, 45 + bobY, tie, null, tieShade, 47);
  g.rect(36, 40 + bobY, 7, 4, BLACK);
  g.rect(37, 40 + bobY, 5, 2, tie);
  g.px(41, 39 + bobY, tie);

  // Big stepped hair silhouette and sideburns; the face is deliberately square.
  const hairShape = [
    [8, 29 + bobY], [8, 17 + bobY], [11, 11 + bobY], [16, 7 + bobY],
    [23, 4 + bobY], [34, 4 + bobY], [42, 8 + bobY], [47, 14 + bobY],
    [49, 22 + bobY], [47, 29 + bobY], [43, 28 + bobY], [42, 21 + bobY],
    [38, 16 + bobY], [33, 13 + bobY], [27, 12 + bobY], [21, 14 + bobY],
    [16, 19 + bobY], [13, 29 + bobY],
  ];
  g.poly(hairShape, 2, BLACK, true);
  g.floodFill(27, 8 + bobY, hair, null, hairDark, 13 + bobY);
  g.poly(hairShape, 2, BLACK, true);
  g.rect(20, 7 + bobY, 13, 2, hairLight);
  g.rect(16, 10 + bobY, 5, 2, hairDark);
  g.rect(34, 10 + bobY, 6, 2, hairLight);

  // Ears and face. The oversized white eyes and moustache are the host's signature.
  g.rect(10, 23 + bobY, 5, 8, BLACK);
  g.rect(11, 24 + bobY, 3, 6, skin);
  g.rect(39, 23 + bobY, 5, 8, BLACK);
  g.rect(40, 24 + bobY, 3, 6, skin);
  const faceShape = [
    [15, 15 + bobY], [20, 12 + bobY], [37, 12 + bobY],
    [42, 17 + bobY], [42, 34 + bobY], [38, 39 + bobY],
    [18, 39 + bobY], [13, 35 + bobY], [13, 21 + bobY],
  ];
  g.poly(faceShape, 1.8, BLACK, true);
  g.floodFill(27, 25 + bobY, skin, null, skinShade, 34 + bobY);
  g.poly(faceShape, 1.8, BLACK, true);
  g.rect(17, 15 + bobY, 18, 3, hair);
  g.rect(15, 18 + bobY, 4, 5, hairDark);
  g.rect(35, 16 + bobY, 4, 4, hairLight);
  g.rect(21, 16 + bobY, 13, 1, hairLight);

  // Brows and square, symmetrical eyes. Blink is a deliberate one-frame pose.
  const isBlink = safeMood === 'blinking' || (safeMood === 'idle' && frame === 2);
  const eyeY = 22 + bobY;
  if (isBlink) {
    g.rect(17, eyeY + 3, 7, 2, BLACK);
    g.rect(29, eyeY + 3, 7, 2, BLACK);
  } else {
    g.rect(16, eyeY - 2, 9, 2, hairDark);
    g.rect(28, eyeY - 2, 9, 2, hairDark);
    g.rect(16, eyeY, 9, 9, BLACK);
    g.rect(17, eyeY + 1, 7, 7, WHITE);
    g.rect(29, eyeY, 9, 9, BLACK);
    g.rect(30, eyeY + 1, 7, 7, WHITE);
    const gaze = safeMood === 'winner' ? -1 : safeMood === 'introducing' ? 1 : 0;
    g.rect(19 + gaze, eyeY + 3, 3, 4, BLACK);
    g.rect(32 + gaze, eyeY + 3, 3, 4, BLACK);
    g.px(18 + gaze, eyeY + 2, WHITE);
    g.px(31 + gaze, eyeY + 2, WHITE);
  }
  if (safeMood === 'reacting') {
    g.rect(17, eyeY - 4, 7, 2, BLACK);
    g.rect(29, eyeY - 4, 7, 2, BLACK);
  }

  // Small block nose above a thick, unmistakable dark-brown moustache.
  g.rect(25, 29 + bobY, 3, 3, skinShade);
  g.px(27, 30 + bobY, skinLight);
  g.rect(13, 31 + bobY, 27, 7, BLACK);
  g.rect(14, 32 + bobY, 25, 4, moustache);
  g.rect(17, 36 + bobY, 8, 2, moustache);
  g.rect(28, 36 + bobY, 8, 2, moustache);
  g.rect(19, 32 + bobY, 6, 1, moustacheLight);
  g.rect(29, 32 + bobY, 6, 1, moustacheLight);

  // Four small mouth poses beneath the moustache make the speaking sprite readable.
  if (safeMood === 'talking') {
    const mouthHeight = [3, 2, 4, 2][frame];
    g.rect(23, 38 + bobY, 8, mouthHeight, BLACK);
    g.rect(24, 39 + bobY, 6, Math.max(1, mouthHeight - 1), mouth);
    if (frame === 0 || frame === 2) g.rect(25, 39 + bobY, 4, 1, WHITE);
  } else if (safeMood === 'reacting') {
    g.rect(24, 38 + bobY, 6, 2, BLACK);
    g.rect(25, 39 + bobY, 4, 1, mouth);
  } else {
    g.rect(23, 38 + bobY, 8, 2, BLACK);
    g.rect(24, 38 + bobY, 6, 1, WHITE);
    g.rect(25, 39 + bobY, 4, 1, mouth);
  }

  // Hand-held microphone on the viewer's left, matching the pose in the reference.
  const micBob = safeMood === 'talking' && frame % 2 === 1 ? -1 : 0;
  g.rect(13, 39 + bobY + micBob, 7, 8, BLACK);
  g.rect(14, 40 + bobY + micBob, 5, 6, mic);
  g.rect(15, 40 + bobY + micBob, 3, 2, micLight);
  g.line(16, 46 + bobY + micBob, 20, 50 + bobY + micBob, 1.7, BLACK);
  g.rect(17, 44 + bobY, 5, 5, BLACK);
  g.rect(18, 45 + bobY, 3, 3, skinLight);
  g.rect(20, 46 + bobY, 2, 2, skin);

  // Small event poses only affect the free arm and keep the host recognizable.
  if (safeMood === 'waving' || safeMood === 'introducing') {
    const handY = 31 + bobY + (frame % 2 ? -2 : 0);
    g.poly([[39, 43 + bobY], [44, 39 + bobY], [47, handY + 5], [45, handY], [49, handY - 2], [51, handY + 1], [47, 48 + bobY]], 1.5, BLACK, true);
    g.floodFill(47, handY + 3, skinLight);
    g.rect(48, handY - 3, 2, 5, skinLight);
  } else if (safeMood === 'celebrating' || safeMood === 'winner') {
    g.poly([[40, 43 + bobY], [44, 38 + bobY], [47, 31 + bobY], [50, 32 + bobY], [48, 43 + bobY], [45, 48 + bobY]], 1.5, BLACK, true);
    g.floodFill(46, 40 + bobY, skinLight);
    drawPixelStar(g, 7, 12 + (frame % 2) * 2, 3, GOLD);
    drawPixelStar(g, 46, 12 - (frame % 2) * 2, 3, CYAN);
  }
}

/**
 * Generates and caches the 4-frame animated sprite sheet PNG data URL for the Host.
 */
export function getHostSpriteStripUrl(mood = 'idle', isHalloween = false) {
  const safeMood = HOST_MOODS.has(mood) ? mood : 'idle';
  const key = `${safeMood}:${isHalloween ? 1 : 0}`;
  if (hostSpriteCache.has(key)) return hostSpriteCache.get(key);

  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * FRAME_COUNT;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  for (let f = 0; f < FRAME_COUNT; f++) {
    const grid = new MiniPixelGrid(FRAME_W, FRAME_H);
    drawHostFrame(grid, safeMood, isHalloween, f);
    const imgData = new ImageData(grid.buf, FRAME_W, FRAME_H);
    ctx.putImageData(imgData, f * FRAME_W, 0);
  }

  const url = canvas.toDataURL('image/png');
  hostSpriteCache.set(key, url);
  return url;
}

/**
 * Returns HTML element string for the animated MS Paint Host.
 */
export function buildHostHTML(mood = 'idle', isHalloween = false, options = {}) {
  const safeMood = HOST_MOODS.has(mood) ? mood : 'idle';
  const size = Number(options.size) || 84;
  const url = getHostSpriteStripUrl(safeMood, isHalloween);

  // If running in browser with canvas support:
  if (url) {
    return `<span class="pixel-avatar host-avatar host-svg mood-${safeMood}${isHalloween ? ' is-halloween' : ''}" data-mood="${safeMood}" style="--av-size:${size}px; background-image:url('${url}');" role="img" aria-label="Jeoparty Host"></span>`;
  }

  // Crisp-edged SVG fallback mirrors the same reference look if canvas is unavailable.
  const suit = isHalloween ? '#2e104d' : '#1c55c4';
  const tie = isHalloween ? '#ff7b00' : '#ffd000';
  return `<svg class="host-svg host-avatar mood-${safeMood}" viewBox="0 0 52 52" role="img" aria-label="Jeoparty Host" shape-rendering="crispEdges">
    <path d="M4 52v-6l5-5 8-4h18l8 4 7 7v4z" fill="${suit}" stroke="#000" stroke-width="2" />
    <path d="M20 38h12l4 14H16z" fill="#fffdf3" stroke="#000" stroke-width="1.5" />
    <path d="M24 38h4l1 3 2 9-5 3-4-3 2-9z" fill="${tie}" stroke="#000" stroke-width="1.2" />
    <path d="M36 40h7v4h-7z" fill="${tie}" stroke="#000" stroke-width="1.5" />
    <path d="M8 29V17l3-6 5-4 7-3h11l8 4 5 7 2 8-2 7-4-1-2-8-4-5-5-3-6-1-6 2-5 5-3 10z" fill="#4a2b1b" stroke="#000" stroke-width="2" />
    <path d="M15 15l5-3h17l5 5v17l-4 5H18l-5-4V21z" fill="#f4c58f" stroke="#000" stroke-width="1.8" />
    <path d="M17 15h18v3H17zm-2 3h4v5h-4zm20-2h4v4h-4z" fill="#4a2b1b" />
    <path d="M16 20h9v9h-9zm12 0h9v9h-9z" fill="#fff" stroke="#000" stroke-width="1.5" />
    <path d="M19 23h3v5h-3zm12 0h3v5h-3z" fill="#000" />
    <path d="M25 29h3v3h-3z" fill="#d99c62" />
    <path d="M14 32l5-1 6 2 2 2 3-2 6-2 4 2-2 4-6 1-5-2-5 2-6-2z" fill="#24160f" stroke="#000" stroke-width="1.6" />
    <path d="M23 38h8v2h-8z" fill="#781827" />
    <path d="M13 39l2-2 4 2v7l-3 2-3-3z" fill="#aeb8c8" stroke="#000" stroke-width="1.4" />
    <path d="M16 46l4 4" stroke="#000" stroke-width="2.2" />
    <path d="M21 44h6v5h-6z" fill="#ffe0ae" stroke="#000" stroke-width="1.2" />
  </svg>`;
}

// Keep buildHostSVG as an alias to buildHostHTML
export const buildHostSVG = buildHostHTML;

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
    this.mood = 'idle';
    this.isHalloween = false;
  }

  init({ figureEl, captionEl, nameEl, voiceBtnEl }) {
    this.figureEl = figureEl || null;
    this.captionEl = captionEl || null;
    this.nameEl = nameEl || null;
    this.voiceBtnEl = voiceBtnEl || null;

    this.checkHalloween();
    this.renderFigure();

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

  checkHalloween() {
    if (typeof document !== 'undefined') {
      this.isHalloween = document.body?.classList.contains('theme-halloween') || false;
    }
  }

  setMood(mood) {
    if (this.mood === mood) return;
    this.mood = HOST_MOODS.has(mood) ? mood : 'idle';
    this.renderFigure();
  }

  renderFigure() {
    if (!this.figureEl) return;
    this.checkHalloween();
    this.figureEl.innerHTML = buildHostHTML(this.mood, this.isHalloween);
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
      clearTimeout(this.talkingTimer);
      this.setMood('idle');
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

  resetLineMemory() {
    this.lastLineId = null;
    this.setMood('idle');
  }

  showLine(line, tone = 'neutral', id = null) {
    if (!line) return;
    if (id !== null && id !== undefined && id === this.lastLineId) return;
    if (id !== null && id !== undefined) this.lastLineId = id;

    if (this.captionEl) {
      this.captionEl.textContent = line;
      this.captionEl.classList.remove('is-swap');
      void this.captionEl.offsetWidth;
      this.captionEl.classList.add('is-swap');
    }

    const hostStage = this.figureEl ? this.figureEl.closest('.host-stage') : null;
    if (hostStage) {
      hostStage.dataset.tone = tone;
      hostStage.classList.remove('tone-neutral', 'tone-excited', 'tone-sad', 'tone-dramatic');
      hostStage.classList.add(`tone-${tone || 'neutral'}`);
    }

    clearTimeout(this.talkingTimer);
    const activeMood =
      tone === 'excited'
        ? 'celebrating'
        : tone === 'sad'
        ? 'reacting'
        : tone === 'winner'
        ? 'winner'
        : 'talking';

    this.setMood(activeMood);

    // Speak with direct speech-synthesis start/end synchronization
    const speechStarted = this.speak(line, activeMood);

    // Let the speech end event control mouth motion; this longer cap only recovers
    // from browsers whose speech engine never emits an end/error event.
    const durationMs = Math.min(4500, Math.max(1200, line.length * 28));
    this.talkingTimer = setTimeout(() => {
      this.setMood('idle');
    }, speechStarted ? 22000 : durationMs);
  }

  speak(text, activeMood = 'talking') {
    if (!this.voiceEnabled) return false;
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    if (sfx.muted) return false;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text).slice(0, 220));
      if (this.voice) utter.voice = this.voice;
      utter.rate = 1.15; // Natural game-show broadcast cadence
      utter.pitch = 0.95;
      utter.volume = 0.95;

      utter.onstart = () => {
        this.setMood(activeMood);
      };

      utter.onend = () => {
        clearTimeout(this.talkingTimer);
        this.setMood('idle');
      };

      utter.onerror = () => {
        clearTimeout(this.talkingTimer);
        this.setMood('idle');
      };

      window.speechSynthesis.speak(utter);
      return true;
    } catch {
      return false;
    }
  }
}

export const hostPresenter = new HostPresenter();
