// PERMANENT JEOPARTY HOST — redesigned to match the original MS Paint avatar sprite style.
// Uses the same rounded doodle head, bust silhouette, bold black ink outlines, flat solid colors,
// and 4-frame sprite-sheet animations as the player avatars.

import {
  MiniPixelGrid,
  hexToRgba,
  drawPixelStar,
  BLACK,
  WHITE,
  RED,
  GOLD,
  CYAN,
  LIME,
  PINK,
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
  'waving',
  'celebrating',
  'reacting',
  'winner',
]);

/**
 * Draws one 52x52 pixel-art frame of the Jeoparty Host on the exact same
 * pixel grid as the player avatars (bold black outlines, flat solid colors,
 * rounded head and bust silhouette).
 */
export function drawHostFrame(g, mood = 'idle', isHalloween = false, f = 0) {
  const safeMood = HOST_MOODS.has(mood) ? mood : 'idle';

  // Animation bobs across 4 frames
  let bobY = 0;
  if (safeMood === 'idle') bobY = [0, -1, 0, 0][f];
  else if (safeMood === 'talking') bobY = [0, -1, 0, -1][f];
  else if (safeMood === 'waving') bobY = [0, -1, 0, -1][f];
  else if (safeMood === 'celebrating') bobY = [-1, -2, -1, -2][f];
  else if (safeMood === 'reacting') bobY = [0, 0, -1, 0][f];
  else if (safeMood === 'winner') bobY = [-1, -2, -1, 0][f];

  // Palette: Classic sapphire suit & gold tie, or Halloween gothic purple & pumpkin orange
  const suitFill = hexToRgba(isHalloween ? '#2e104d' : '#1c55c4');
  const suitShade = hexToRgba(isHalloween ? '#1a072e' : '#123987');
  const shirtFill = WHITE;
  const tieFill = hexToRgba(isHalloween ? '#ff7b00' : '#ffd000');
  const tieShade = hexToRgba(isHalloween ? '#cc5500' : '#cca600');
  const skinFill = hexToRgba('#ffd199'); // Peach skin from avatar sheet
  const skinShade = hexToRgba('#cca06e');
  const hairFill = hexToRgba('#24150d'); // Espresso brown
  const micHead = hexToRgba('#b8c2d6');
  const micHandle = BLACK;

  // 1. Bust / Shoulders (matching original avatar bust silhouette)
  const shPts = [
    [8, 50],
    [10, 43 + bobY],
    [16, 39 + bobY],
    [26, 38 + bobY],
    [36, 39 + bobY],
    [42, 43 + bobY],
    [44, 50],
  ];
  g.poly(shPts, 1.5, BLACK, true);
  g.floodFill(26, 46, suitFill, null, suitShade, 48);
  g.poly(shPts, 1.5, BLACK, true);

  // 2. White Collared Shirt V-Neck & Lapels
  const collarPts = [
    [21, 38 + bobY],
    [26, 45 + bobY],
    [31, 38 + bobY],
  ];
  g.poly(collarPts, 1.2, BLACK, true);
  g.floodFill(26, 41 + bobY, shirtFill);
  g.poly(collarPts, 1.2, BLACK, true);

  // Lapel creases
  g.line(17, 39 + bobY, 21, 45 + bobY, 1.3, BLACK);
  g.line(35, 39 + bobY, 31, 45 + bobY, 1.3, BLACK);

  // 3. Game-Show Tie (Classic Gold Long Tie or Halloween Bat Bowtie)
  if (isHalloween) {
    const bowPts = [
      [26, 40 + bobY],
      [20, 38 + bobY],
      [22, 43 + bobY],
      [26, 41 + bobY],
      [30, 43 + bobY],
      [32, 38 + bobY],
    ];
    g.poly(bowPts, 1.3, BLACK, true);
    g.floodFill(24, 40 + bobY, tieFill);
    g.floodFill(28, 40 + bobY, tieFill);
    g.brush(26, 40 + bobY, 1.2, BLACK);
  } else {
    g.poly([[24, 39 + bobY], [28, 39 + bobY], [27, 42 + bobY], [25, 42 + bobY]], 1.1, BLACK, true);
    g.floodFill(26, 40 + bobY, tieFill);
    g.poly([[25, 42 + bobY], [27, 42 + bobY], [28, 49 + bobY], [26, 51 + bobY], [24, 49 + bobY]], 1.1, BLACK, true);
    g.floodFill(26, 45 + bobY, tieFill, null, tieShade, 48);
  }

  // 4. Head (Classic Skribbl rounded doodle head from avatar.js)
  g.oval(26, 25 + bobY, 13.5, 13, 1.5, BLACK, 0.4);
  g.floodFill(26, 25 + bobY, skinFill, null, skinShade, 35 + bobY);
  g.oval(26, 25 + bobY, 13.5, 13, 1.5, BLACK, 0.4);

  // 5. Host Hair (Slicked side-part with neat fringe & sideburns)
  const hairPts = [
    [13, 25 + bobY],
    [13, 17 + bobY],
    [16, 13 + bobY],
    [26, 12 + bobY],
    [36, 13 + bobY],
    [39, 17 + bobY],
    [39, 25 + bobY],
    [36, 21 + bobY],
    [32, 17 + bobY],
    [26, 16 + bobY],
    [20, 18 + bobY],
    [16, 22 + bobY],
  ];
  g.poly(hairPts, 1.4, BLACK, true);
  g.floodFill(26, 14 + bobY, hairFill);
  g.poly(hairPts, 1.4, BLACK, true);
  g.line(20, 14 + bobY, 28, 14 + bobY, 0.9, hexToRgba('#422619'));

  // 6. Eyebrows
  if (safeMood === 'reacting') {
    g.line(17, 19 + bobY, 22, 18 + bobY, 1.3, BLACK);
    g.line(30, 16 + bobY, 35, 19 + bobY, 1.3, BLACK);
  } else {
    g.line(18, 18 + bobY, 22, 17 + bobY, 1.2, BLACK);
    g.line(30, 17 + bobY, 34, 18 + bobY, 1.2, BLACK);
  }

  // 7. Eyes
  const lookX = safeMood === 'winner' ? -1 : f === 2 ? 1 : 0;
  if (safeMood === 'celebrating') {
    g.poly([[17, 23 + bobY], [20, 21 + bobY], [23, 23 + bobY]], 1.3, BLACK);
    g.poly([[29, 23 + bobY], [32, 21 + bobY], [35, 23 + bobY]], 1.3, BLACK);
  } else if (safeMood === 'idle' && f === 1) {
    g.line(18, 23 + bobY, 23, 23 + bobY, 1.2, BLACK);
    g.line(29, 23 + bobY, 34, 23 + bobY, 1.2, BLACK);
  } else if (safeMood === 'waving') {
    g.oval(20, 22 + bobY, 3.2, 3.2, 1.1, BLACK);
    g.floodFill(20, 22 + bobY, WHITE);
    g.brush(20, 22 + bobY, 1.3, BLACK);
    g.line(29, 22 + bobY, 34, 22 + bobY, 1.3, BLACK);
    g.line(33, 21 + bobY, 35, 22 + bobY, 1.1, BLACK);
  } else if (safeMood === 'reacting') {
    g.oval(20, 22 + bobY, 3.8, 3.8, 1.1, BLACK);
    g.floodFill(20, 22 + bobY, WHITE);
    g.oval(31, 22 + bobY, 3.2, 3.2, 1.1, BLACK);
    g.floodFill(31, 22 + bobY, WHITE);
    g.brush(19, 22 + bobY, 1.3, BLACK);
    g.brush(33, 22 + bobY, 1.3, BLACK);
    g.brush(37, 18 + bobY, 1.5, CYAN);
    g.px(37, 16 + bobY, CYAN);
  } else {
    g.oval(20, 22 + bobY, 3.2, 3.2, 1.1, BLACK);
    g.floodFill(20, 22 + bobY, WHITE);
    g.brush(20 + lookX, 22 + bobY, 1.3, BLACK);
    g.oval(31, 22 + bobY, 3.2, 3.2, 1.1, BLACK);
    g.floodFill(31, 22 + bobY, WHITE);
    g.brush(31 + lookX, 22 + bobY, 1.3, BLACK);
  }

  // 8. Host Mustache
  const stachePts = [
    [19, 28 + bobY],
    [23, 26 + bobY],
    [26, 27 + bobY],
    [29, 26 + bobY],
    [33, 28 + bobY],
    [26, 28 + bobY],
  ];
  g.poly(stachePts, 1.1, BLACK, true);
  g.floodFill(26, 27 + bobY, hairFill);
  g.poly(stachePts, 1.1, BLACK, true);

  // 9. Mouth (beneath mustache)
  if (safeMood === 'talking') {
    if (f % 2 === 0) {
      g.oval(26, 31 + bobY, 2.8, 2.2, 1.1, BLACK);
      g.floodFill(26, 31 + bobY, hexToRgba('#80121e'));
      g.line(24, 30 + bobY, 28, 30 + bobY, 0.9, WHITE);
    } else {
      g.oval(26, 30 + bobY, 1.8, 1.6, 1.1, BLACK);
      g.floodFill(26, 30 + bobY, hexToRgba('#80121e'));
    }
  } else if (safeMood === 'celebrating' || safeMood === 'winner') {
    g.poly([[21, 29 + bobY], [31, 29 + bobY], [29, 33 + bobY], [23, 33 + bobY]], 1.1, BLACK, true);
    g.floodFill(26, 31 + bobY, hexToRgba('#80121e'));
    g.line(22, 30 + bobY, 30, 30 + bobY, 1.0, WHITE);
  } else if (safeMood === 'reacting') {
    g.poly([[21, 31 + bobY], [23, 30 + bobY], [26, 32 + bobY], [28, 30 + bobY], [31, 31 + bobY]], 1.2, BLACK);
  } else {
    g.line(22, 30 + bobY, 30, 30 + bobY, 1.1, BLACK);
  }

  // 10. Microphone in Hand (viewer's right)
  const micBob = safeMood === 'talking' ? (f % 2 === 0 ? -1 : 0) : 0;
  g.oval(41, 38 + bobY + micBob, 3.0, 3.0, 1.1, BLACK);
  g.floodFill(41, 38 + bobY + micBob, skinFill);
  g.line(41, 35 + bobY + micBob, 41, 46 + bobY + micBob, 2.2, micHandle);
  g.oval(41, 31 + bobY + micBob, 3.2, 3.6, 1.2, BLACK);
  g.floodFill(41, 31 + bobY + micBob, micHead);
  g.line(40, 31 + bobY + micBob, 42, 31 + bobY + micBob, 0.8, BLACK);

  // 11. Left Hand / Gesture / Mood Effects
  if (safeMood === 'waving') {
    const waveX = f % 2 === 0 ? -2 : 2;
    g.oval(8 + waveX, 26 + bobY, 3.4, 3.4, 1.2, BLACK);
    g.floodFill(8 + waveX, 26 + bobY, skinFill);
    g.line(4 + waveX, 22 + bobY, 6 + waveX, 24 + bobY, 1.0, BLACK);
    g.line(11 + waveX, 21 + bobY, 12 + waveX, 23 + bobY, 1.0, BLACK);
  } else if (safeMood === 'celebrating') {
    g.oval(8, 25 + bobY, 3.2, 3.2, 1.2, BLACK);
    g.floodFill(8, 25 + bobY, skinFill);
    drawPixelStar(g, 6, 12 + (f % 2) * 2, 3, GOLD);
    drawPixelStar(g, 46, 14 - (f % 2) * 2, 3, CYAN);
  } else if (safeMood === 'winner') {
    g.oval(8, 28 + bobY, 3.2, 3.2, 1.2, BLACK);
    g.floodFill(8, 28 + bobY, skinFill);
    drawPixelStar(g, 6, 10, 3, GOLD);
    drawPixelStar(g, 46, 10, 3, GOLD);
    g.rect(10, 5 + ((f * 3) % 7), 2, 2, PINK);
    g.rect(42, 6 + (((f + 2) * 3) % 7), 2, 2, LIME);
  } else {
    g.oval(9, 44 + bobY, 2.8, 2.8, 1.1, BLACK);
    g.floodFill(9, 44 + bobY, skinFill);
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

  // Fallback SVG (drawn with smooth curves / round silhouette, not blocky Minecraft rects)
  const suit = isHalloween ? '#2e104d' : '#1c55c4';
  const tie = isHalloween ? '#ff7b00' : '#ffd000';
  return `<svg class="host-svg host-avatar mood-${safeMood}" viewBox="0 0 52 52" role="img" aria-label="Jeoparty Host" shape-rendering="crispEdges">
    <ellipse cx="26" cy="46" rx="18" ry="8" fill="${suit}" stroke="#000" stroke-width="1.5" />
    <polygon points="21,38 26,45 31,38" fill="#fff" stroke="#000" stroke-width="1.2" />
    <polygon points="25,41 27,41 28,49 26,51 24,49" fill="${tie}" stroke="#000" stroke-width="1" />
    <circle cx="26" cy="25" r="13" fill="#ffd199" stroke="#000" stroke-width="1.5" />
    <path d="M 13,25 C 13,15 39,15 39,25 C 34,17 18,17 13,25 Z" fill="#24150d" stroke="#000" stroke-width="1.4" />
    <circle cx="20" cy="22" r="3" fill="#fff" stroke="#000" stroke-width="1" />
    <circle cx="20" cy="22" r="1.3" fill="#000" />
    <circle cx="31" cy="22" r="3" fill="#fff" stroke="#000" stroke-width="1" />
    <circle cx="31" cy="22" r="1.3" fill="#000" />
    <path d="M 19,28 Q 23,26 26,27 Q 29,26 33,28 Z" fill="#24150d" stroke="#000" stroke-width="1" />
    <line x1="22" y1="30" x2="30" y2="30" stroke="#000" stroke-width="1.1" />
    <circle cx="41" cy="38" r="3" fill="#ffd199" stroke="#000" stroke-width="1.1" />
    <line x1="41" y1="35" x2="41" y2="46" stroke="#000" stroke-width="2.2" />
    <ellipse cx="41" cy="31" rx="3.2" ry="3.6" fill="#b8c2d6" stroke="#000" stroke-width="1.2" />
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

    // Set animated sprite mood matching the line tone
    if (tone === 'excited') {
      this.setMood('celebrating');
    } else if (tone === 'sad') {
      this.setMood('reacting');
    } else if (tone === 'winner') {
      this.setMood('winner');
    } else {
      this.setMood('talking');
    }

    clearTimeout(this.talkingTimer);
    const durationMs = Math.min(5200, 1400 + line.length * 36);
    this.talkingTimer = setTimeout(() => {
      this.setMood('idle');
    }, durationMs);

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
      // Speech synthesis is optional
    }
  }
}

export const hostPresenter = new HostPresenter();
