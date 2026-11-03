// JEOPARTY JUDGE — redesigned in the authentic MS Paint avatar pixel-art style.
// Features a distinguished cartoon judge with hair, mustache, judicial robe/suit,
// collared shirt, tie, wooden gavel, and 4-frame animated sprite states.

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

export const JUDGE_IDENTITY = Object.freeze({
  id: 'jeoparty_judge',
  name: 'Judge',
  title: 'Round Judge',
});

const FRAME_W = 52;
const FRAME_H = 52;
const FRAME_COUNT = 4;
const judgeSpriteCache = new Map();

export const JUDGE_MOODS = new Set([
  'idle',
  'thinking',
  'accepting',
  'rejecting',
  'announcing',
]);

/**
 * Draws one 52x52 pixel-art frame of the Jeoparty Judge on the exact same
 * pixel grid as the player avatars and Host (bold black outlines, flat solid colors,
 * rounded head and bust silhouette).
 */
export function drawJudgeFrame(g, mood = 'idle', isHalloween = false, f = 0) {
  const safeMood = JUDGE_MOODS.has(mood) ? mood : 'idle';

  // Animation bobs across 4 frames
  let bobY = 0;
  if (safeMood === 'idle') bobY = [0, -1, 0, 0][f];
  else if (safeMood === 'thinking') bobY = [0, 0, -1, 0][f];
  else if (safeMood === 'accepting') bobY = [-1, 1, 0, -1][f];
  else if (safeMood === 'rejecting') bobY = [-1, 2, 0, -1][f];
  else if (safeMood === 'announcing') bobY = [0, -1, 0, -1][f];

  // Palette: Formal Judicial Charcoal Robe / Suit, White Shirt, Crimson Tie (or Spooky Purple/Orange)
  const robeFill = hexToRgba(isHalloween ? '#200b33' : '#1e222a');
  const robeShade = hexToRgba(isHalloween ? '#12041f' : '#11141a');
  const shirtFill = WHITE;
  const tieFill = hexToRgba(isHalloween ? '#ff7b00' : '#b81424');
  const skinFill = hexToRgba('#ffd199'); // Peach avatar skin
  const skinShade = hexToRgba('#cca06e');
  const hairFill = hexToRgba(isHalloween ? '#5a3d75' : '#8892a0'); // Silver-grey distinguished hair
  const hairHighlight = hexToRgba(isHalloween ? '#8059a4' : '#b0b8c4');
  const woodFill = hexToRgba('#8a4c1c'); // Wooden gavel
  const woodShade = hexToRgba('#572c0c');

  // 1. Shoulders / Robe Bust (consistent with player avatars)
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
  g.floodFill(26, 46, robeFill, null, robeShade, 48);
  g.poly(shPts, 1.5, BLACK, true);

  // 2. White Judicial Collar & Crimson Tie
  const collarPts = [
    [21, 38 + bobY],
    [26, 45 + bobY],
    [31, 38 + bobY],
  ];
  g.poly(collarPts, 1.2, BLACK, true);
  g.floodFill(26, 41 + bobY, shirtFill);
  g.poly(collarPts, 1.2, BLACK, true);

  // Judicial tie / bands
  const tiePts = [
    [25, 41 + bobY],
    [27, 41 + bobY],
    [28, 49 + bobY],
    [26, 51 + bobY],
    [24, 49 + bobY],
  ];
  g.poly(tiePts, 1, BLACK, true);
  g.floodFill(26, 45 + bobY, tieFill);

  // 3. Rounded Doodle Head (Avatar proportions)
  const headPts = [
    [16, 17 + bobY],
    [21, 13 + bobY],
    [31, 13 + bobY],
    [36, 17 + bobY],
    [38, 25 + bobY],
    [35, 33 + bobY],
    [26, 36 + bobY],
    [17, 33 + bobY],
    [14, 25 + bobY],
  ];
  g.poly(headPts, 1.8, BLACK, true);
  g.floodFill(26, 25 + bobY, skinFill, null, skinShade, 33 + bobY);
  g.poly(headPts, 1.8, BLACK, true);

  // 4. Distinguished Judge Hair (Wavy with volume & sideburns)
  const hairPts = [
    [14, 25 + bobY],
    [13, 19 + bobY],
    [17, 13 + bobY],
    [23, 11 + bobY],
    [29, 11 + bobY],
    [35, 13 + bobY],
    [39, 19 + bobY],
    [38, 25 + bobY],
    [35, 23 + bobY],
    [31, 17 + bobY],
    [26, 18 + bobY],
    [20, 17 + bobY],
    [17, 23 + bobY],
  ];
  g.poly(hairPts, 1.4, BLACK, true);
  g.floodFill(26, 14 + bobY, hairFill);
  // Hair highlight streak
  g.line(22, 13 + bobY, 30, 13 + bobY, 1.2, hairHighlight);

  // 5. Expressive Judge Eyes & Eyebrows
  const blink = safeMood === 'idle' && f === 2;
  const thinkingNarrow = safeMood === 'thinking';

  if (blink) {
    // Closed blinking slit
    g.line(18, 23 + bobY, 22, 23 + bobY, 1.5, BLACK);
    g.line(30, 23 + bobY, 34, 23 + bobY, 1.5, BLACK);
  } else if (thinkingNarrow) {
    // Critical thinking gaze (left eye squinting, right eye wide)
    g.line(18, 23 + bobY, 22, 23 + bobY, 1.6, BLACK);
    g.rect(30, 22 + bobY, 3, 3, BLACK);
    g.brush(31, 23 + bobY, 1, WHITE);
  } else {
    // Open round doodle eyes with white highlight
    g.rect(19, 22 + bobY, 3, 3, BLACK);
    g.brush(20, 22 + bobY, 1, WHITE);
    g.rect(30, 22 + bobY, 3, 3, BLACK);
    g.brush(31, 22 + bobY, 1, WHITE);
  }

  // Thick dignified Judge Eyebrows
  if (safeMood === 'thinking') {
    // Inquisitive arched eyebrow
    g.line(17, 20 + bobY, 22, 21 + bobY, 1.8, hairFill);
    g.line(29, 19 + bobY, 35, 18 + bobY, 1.8, hairFill);
  } else if (safeMood === 'rejecting') {
    // Stern furrowed eyebrows
    g.line(18, 19 + bobY, 23, 21 + bobY, 2, hairFill);
    g.line(29, 21 + bobY, 34, 19 + bobY, 2, hairFill);
  } else {
    // Calm authoritative brows
    g.line(18, 20 + bobY, 23, 20 + bobY, 1.8, hairFill);
    g.line(29, 20 + bobY, 34, 20 + bobY, 1.8, hairFill);
  }

  // 6. Majestic Judge Mustache (from avatar mouth sheet row 2, col 5)
  const stacheY = 27 + bobY;
  const stachePts = [
    [19, stacheY + 1],
    [23, stacheY - 1],
    [26, stacheY + 1],
    [29, stacheY - 1],
    [33, stacheY + 1],
    [31, stacheY + 3],
    [26, stacheY + 2],
    [21, stacheY + 3],
  ];
  g.poly(stachePts, 1.2, BLACK, true);
  g.floodFill(26, stacheY, hairFill);

  // Mouth beneath mustache
  if (safeMood === 'accepting') {
    // Warm satisfied smile
    g.line(23, stacheY + 4, 29, stacheY + 4, 1.5, BLACK);
    g.brush(22, stacheY + 3, 1.2, BLACK);
    g.brush(30, stacheY + 3, 1.2, BLACK);
  } else if (safeMood === 'rejecting') {
    // Stern frown
    g.line(23, stacheY + 4, 29, stacheY + 4, 1.5, BLACK);
    g.brush(22, stacheY + 5, 1.2, BLACK);
    g.brush(30, stacheY + 5, 1.2, BLACK);
  } else {
    // Neutral firm mouth
    g.line(24, stacheY + 4, 28, stacheY + 4, 1.3, BLACK);
  }

  // 7. Judge Gavel & Hand (Animated based on ruling)
  let gavelAngleY = 0;
  if (safeMood === 'accepting') {
    // Gavel tapped down with sparkle
    gavelAngleY = [4, 6, 4, 3][f];
    drawPixelStar(g, 42, 28 + bobY, 3, LIME);
  } else if (safeMood === 'rejecting') {
    // Gavel slammed down with impact
    gavelAngleY = [6, 8, 5, 4][f];
    // Red strike lines
    g.line(40, 46 + bobY, 44, 46 + bobY, 1.5, RED);
    g.line(38, 48 + bobY, 46, 48 + bobY, 1.2, RED);
  } else if (safeMood === 'thinking') {
    // Gavel tilted back
    gavelAngleY = -2;
  } else {
    gavelAngleY = [0, -1, 0, 0][f];
  }

  // Wooden sound block on bench
  g.rect(36, 47, 12, 4, woodFill, true);
  g.poly([[36, 47], [48, 47], [48, 51], [36, 51]], 1.2, BLACK);

  // Gavel head & handle
  const gavelHeadY = 36 + bobY + gavelAngleY;
  // Handle
  g.line(42, gavelHeadY + 2, 42, gavelHeadY + 10, 2.2, woodShade);
  g.line(42, gavelHeadY + 2, 42, gavelHeadY + 10, 1.4, woodFill);
  // Hammer Head
  g.rect(38, gavelHeadY - 2, 8, 4, woodFill, true);
  g.poly([[38, gavelHeadY - 2], [46, gavelHeadY - 2], [46, gavelHeadY + 2], [38, gavelHeadY + 2]], 1.2, BLACK);

  // Judge Hand (Peach fist gripping gavel)
  g.rect(40, gavelHeadY + 5, 4, 4, skinFill, true);
  g.poly([[40, gavelHeadY + 5], [44, gavelHeadY + 5], [44, gavelHeadY + 9], [40, gavelHeadY + 9]], 1.1, BLACK);
}

/**
 * Generates a 4-frame 208x52 horizontal sprite strip for the Judge and returns data URL.
 */
export function getJudgeSpriteStripUrl(mood = 'idle', isHalloween = false) {
  const safeMood = JUDGE_MOODS.has(mood) ? mood : 'idle';
  const key = `${safeMood}:${isHalloween ? 'hw' : 'classic'}`;
  if (judgeSpriteCache.has(key)) return judgeSpriteCache.get(key);
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * FRAME_COUNT;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  for (let f = 0; f < FRAME_COUNT; f++) {
    const grid = new MiniPixelGrid(FRAME_W, FRAME_H);
    drawJudgeFrame(grid, safeMood, isHalloween, f);
    const imgData = new ImageData(grid.buf, FRAME_W, FRAME_H);
    ctx.putImageData(imgData, f * FRAME_W, 0);
  }

  const url = canvas.toDataURL('image/png');
  judgeSpriteCache.set(key, url);
  return url;
}

/**
 * Returns HTML element string for the animated MS Paint Judge.
 */
export function buildJudgeHTML(mood = 'idle', isHalloween = false, options = {}) {
  const safeMood = JUDGE_MOODS.has(mood) ? mood : 'idle';
  const size = Number(options.size) || 120;
  const url = getJudgeSpriteStripUrl(safeMood, isHalloween);

  if (url) {
    return `<span class="pixel-avatar judge-avatar judge-svg mood-${safeMood}${isHalloween ? ' is-halloween' : ''}" data-mood="${safeMood}" style="--av-size:${size}px; background-image:url('${url}');" role="img" aria-label="Jeoparty Judge"></span>`;
  }

  // Fallback crisp SVG
  const robe = isHalloween ? '#200b33' : '#1e222a';
  const tie = isHalloween ? '#ff7b00' : '#b81424';
  return `<svg class="judge-svg judge-avatar mood-${safeMood}" viewBox="0 0 52 52" role="img" aria-label="Jeoparty Judge" shape-rendering="crispEdges">
    <ellipse cx="26" cy="46" rx="18" ry="8" fill="${robe}" stroke="#000" stroke-width="1.5" />
    <polygon points="21,38 26,45 31,38" fill="#fff" stroke="#000" stroke-width="1.2" />
    <polygon points="25,41 27,41 28,49 26,51 24,49" fill="${tie}" stroke="#000" stroke-width="1" />
    <circle cx="26" cy="25" r="13" fill="#ffd199" stroke="#000" stroke-width="1.5" />
    <path d="M 14,25 C 13,15 39,15 38,25 C 33,18 19,18 14,25 Z" fill="#8892a0" stroke="#000" stroke-width="1.4" />
    <circle cx="20" cy="22" r="3" fill="#000" />
    <circle cx="20" cy="22" r="1.3" fill="#fff" />
    <circle cx="31" cy="22" r="3" fill="#000" />
    <circle cx="31" cy="22" r="1.3" fill="#fff" />
    <path d="M 19,28 Q 23,26 26,27 Q 29,26 33,28 Z" fill="#8892a0" stroke="#000" stroke-width="1.2" />
    <line x1="23" y1="31" x2="29" y2="31" stroke="#000" stroke-width="1.2" />
    <rect x="38" y="34" width="8" height="4" fill="#8a4c1c" stroke="#000" stroke-width="1.2" />
    <line x1="42" y1="38" x2="42" y2="46" stroke="#572c0c" stroke-width="2.2" />
  </svg>`;
}

export class JudgePresenter {
  constructor() {
    this.stageEl = null;
    this.figureEl = null;
    this.nameEl = null;
    this.statusEl = null;
    this.controlsEl = null;
    this.timerEl = null;
    this.mood = 'idle';
    this.isHalloween = false;
  }

  init({ stageEl, figureEl, nameEl, statusEl, controlsEl, timerEl }) {
    this.stageEl = stageEl || document.getElementById('judge-stage');
    this.figureEl = figureEl || document.getElementById('judge-figure');
    this.nameEl = nameEl || document.getElementById('judge-name-text');
    this.statusEl = statusEl || document.getElementById('judge-status-text');
    this.controlsEl = controlsEl || document.getElementById('judge-controls');
    this.timerEl = timerEl || document.getElementById('judge-timer-bar');

    this.checkHalloween();
    this.renderFigure();
  }

  checkHalloween() {
    if (typeof document !== 'undefined') {
      this.isHalloween = document.body?.classList.contains('theme-halloween') || false;
    }
  }

  setMood(mood) {
    if (this.mood === mood) return;
    this.mood = JUDGE_MOODS.has(mood) ? mood : 'idle';
    this.renderFigure();
  }

  renderFigure() {
    if (!this.figureEl) return;
    this.checkHalloween();
    this.figureEl.innerHTML = buildJudgeHTML(this.mood, this.isHalloween, { size: 136 });
  }

  showJudgeStage(activeJudgeName = 'Judge') {
    if (!this.stageEl) return;
    this.stageEl.hidden = false;
    if (this.nameEl) this.nameEl.textContent = `ROUND JUDGE: ${activeJudgeName}`;
    this.setMood('idle');
  }

  hideJudgeStage() {
    if (!this.stageEl) return;
    this.stageEl.hidden = true;
  }

  showRulingPrompt(guess, officialAnswer, isViewerJudge, alternatives = []) {
    if (!this.stageEl) return;
    this.stageEl.hidden = false;
    this.setMood('thinking');
    if (this.statusEl) {
      if (isViewerJudge) {
        let altHtml = '';
        if (Array.isArray(alternatives) && alternatives.length > 0) {
          altHtml = `<div class="judge-alt-row"><span class="judge-alt-tag">Accepted variations:</span> <em>${alternatives.join(', ')}</em></div>`;
        }
        this.statusEl.innerHTML = `
          <div class="judge-ruling-head"><strong>⚖️ RULING REQUIRED:</strong> Does the contestant's answer match?</div>
          <div class="judge-compare-grid">
            <div class="judge-compare-card guess-card">
              <span class="compare-tag">CONTESTANT SUBMITTED:</span>
              <strong class="compare-text">"${guess}"</strong>
            </div>
            <div class="judge-compare-card official-card">
              <span class="compare-tag">OFFICIAL ANSWER:</span>
              <strong class="compare-text">${officialAnswer}</strong>
            </div>
          </div>
          ${altHtml}
        `;
      } else {
        this.statusEl.innerHTML = `Round Judge is evaluating contestant answer <em>"${guess}"</em> against official answer...`;
      }
    }
    if (this.controlsEl) {
      this.controlsEl.hidden = !isViewerJudge;
    }
    this.startCountdown(12000);
  }

  startCountdown(durationMs = 12000) {
    if (!this.timerEl) return;
    const fill = this.timerEl.querySelector('.judge-timer-fill') || this.timerEl;
    fill.style.transition = 'none';
    fill.style.width = '100%';
    void fill.offsetWidth;
    fill.style.transition = `width ${durationMs}ms linear`;
    fill.style.width = '0%';
  }

  announceDecision(ruling, judgeName, guess) {
    const isAccept = ruling === 'accept' || ruling === 'correct';
    this.setMood(isAccept ? 'accepting' : 'rejecting');
    if (this.statusEl) {
      this.statusEl.innerHTML = isAccept
        ? `<span class="judge-decision-accepted">✔ ACCEPTED "${guess}"</span>`
        : `<span class="judge-decision-rejected">✖ REJECTED "${guess}"</span>`;
    }
    if (this.controlsEl) this.controlsEl.hidden = true;
    setTimeout(() => {
      this.setMood('idle');
    }, 2800);
  }
}

export const judgePresenter = new JudgePresenter();
