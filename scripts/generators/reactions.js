'use strict';

const path = require('node:path');
const { buildHorizontalStrip } = require('../pixel-canvas');

const BLACK = '#000000';
const WHITE = '#ffffff';
const YELLOW = '#ffd900';
const YELLOW_SHADE = '#e6b400';
const RED = '#ff3b3b';
const RED_DARK = '#c91c1c';
const PINK = '#ff7eb9';
const CYAN = '#33d9ff';
const BLUE = '#2c99e6';
const GREEN = '#53e237';
const ORANGE = '#ff8c1a';
const PURPLE = '#a259ff';
const SKIN_PEACH = '#ffd199';

function drawBaseDoodleHead(c, cx, cy, rx, ry, fill, shade, f) {
  c.filledOval(cx, cy, rx, ry, fill, BLACK, 1.0, 0.45, 1.2 + f * 0.9);
  // Subtle MS Paint bottom crescent pixel shading inside the outline
  for (let x = cx - rx + 3; x <= cx + rx - 3; x++) {
    const p = c.getPixel(x, cy + ry - 2);
    if (p[3] > 0 && !(p[0] === 0 && p[1] === 0 && p[2] === 0)) {
      c.setPixel(x, cy + ry - 2, shade);
    }
  }
  c.ovalOutline(cx, cy, rx, ry, 1.0, BLACK, 0.45, 1.2 + f * 0.9);
}

const REACTION_DRAWERS = {
  // 1. Laughing: Bouncing yellow doodle face, > < squint eyes, chattering huge grin!
  laugh(c, f) {
    const bob = [0, -2, 0, -1][f];
    const cy = 17 + bob;
    drawBaseDoodleHead(c, 16, cy, 12, 11, YELLOW, YELLOW_SHADE, f);

    // > < squinting eyes
    c.polyline([[9, cy - 5], [13, cy - 3], [9, cy - 1]], 0.9, BLACK);
    c.polyline([[23, cy - 5], [19, cy - 3], [23, cy - 1]], 0.9, BLACK);

    // Chattering wide MS Paint grin
    const mouthH = f % 2 === 0 ? 6 : 8;
    c.fillPolygon(
      [[9, cy + 1], [23, cy + 1], [21, cy + 1 + mouthH], [11, cy + 1 + mouthH]],
      RED_DARK,
      BLACK,
      0.9
    );
    // White top teeth strip
    c.fillRect(11, cy + 2, 10, 2, WHITE);
    // Red tongue bounce
    c.fillRect(13, cy + mouthH - 1, 6, 2, PINK);

    // Little laugh action ticks at top corners
    if (f % 2 === 1) {
      c.line(3, 5, 6, 7, 0.8, BLACK);
      c.line(29, 5, 26, 7, 0.8, BLACK);
    }
  },

  // 2. Crying from laughter (ROFL): Tilted face, X D eyes, splashing cyan tears!
  rofl(c, f) {
    const bob = f % 2 === 0 ? 0 : -1;
    const tilt = [0, 1, 0, -1][f];
    const cx = 16 + tilt;
    const cy = 17 + bob;
    drawBaseDoodleHead(c, cx, cy, 11.5, 11, YELLOW, YELLOW_SHADE, f);

    // Tight > < laughing eyes
    c.polyline([[cx - 6, cy - 5], [cx - 2, cy - 2], [cx - 6, cy]], 0.9, BLACK);
    c.polyline([[cx + 6, cy - 5], [cx + 2, cy - 2], [cx + 6, cy]], 0.9, BLACK);

    // Giant laughing D-mouth
    const open = f % 2 === 0 ? 6 : 7;
    c.fillPolygon(
      [[cx - 7, cy + 1], [cx + 7, cy + 1], [cx + 5, cy + 1 + open], [cx - 5, cy + 1 + open]],
      BLACK,
      BLACK,
      0.9
    );
    c.fillRect(cx - 5, cy + 2, 10, 2, WHITE);
    c.fillRect(cx - 3, cy + open - 1, 6, 2, RED);

    // Animated splashing pixel tears flying outward on both sides!
    const spread = f * 1.5;
    c.outlinedCircle(cx - 9 - Math.round(spread * 0.7), cy - 1 + Math.round(spread), 2.1, CYAN);
    c.outlinedCircle(cx + 9 + Math.round(spread * 0.7), cy - 1 + Math.round(spread), 2.1, CYAN);
    if (f >= 2) {
      c.setPixel(2, cy + 4, CYAN);
      c.setPixel(29, cy + 4, CYAN);
    }
  },

  // 3. Happy: Beaming ^ ^ eyes, rosy pink cheeks, warm smile + floating pixel heart!
  happy(c, f) {
    const bob = [0, -1, -2, -1][f];
    const cy = 18 + bob;
    drawBaseDoodleHead(c, 15, cy, 11.5, 10.5, YELLOW, YELLOW_SHADE, f);

    // Cheerful arched ^ ^ eyes
    c.polyline([[9, cy - 2], [11, cy - 5], [13, cy - 2]], 0.9, BLACK);
    c.polyline([[17, cy - 2], [19, cy - 5], [21, cy - 2]], 0.9, BLACK);

    // Rosy MS Paint cheeks
    c.brush(8, cy + 1, 1.8, PINK);
    c.brush(22, cy + 1, 1.8, PINK);

    // Big U-smile
    c.polyline([[10, cy + 2], [13, cy + 5], [17, cy + 5], [20, cy + 2]], 1.0, BLACK);

    // Floating animated pixel heart rising at top-right!
    const hy = 8 - f;
    c.brush(25, hy, 2.2, BLACK);
    c.brush(28, hy, 2.2, BLACK);
    c.brush(26.5, hy + 2, 2.2, BLACK);
    c.brush(25, hy, 1.3, RED);
    c.brush(28, hy, 1.3, RED);
    c.brush(26.5, hy + 2, 1.2, RED);
  },

  // 4. Shocked / Surprised: Bulging eyes, dropped jaw O, radiating shock lines!
  shocked(c, f) {
    const shakeX = [0, -1, 1, 0][f];
    const cx = 16 + shakeX;
    const cy = 17;
    drawBaseDoodleHead(c, cx, cy, 11, 12, '#ffe066', YELLOW_SHADE, f);

    // Huge popping white eyes with tiny pinpoint pupils
    const eyeR = f % 2 === 0 ? 3.8 : 4.4;
    c.filledOval(cx - 5, cy - 3, eyeR, eyeR + 0.5, WHITE, BLACK, 0.9, 0.1);
    c.filledOval(cx + 5, cy - 3, eyeR, eyeR + 0.5, WHITE, BLACK, 0.9, 0.1);
    c.brush(cx - 5, cy - 3, 1.0, BLACK);
    c.brush(cx + 5, cy - 3, 1.0, BLACK);

    // High arched eyebrows
    c.line(cx - 8, cy - 9, cx - 3, cy - 10, 0.8, BLACK);
    c.line(cx + 8, cy - 9, cx + 3, cy - 10, 0.8, BLACK);

    // Dropped jaw oval O
    const jawR = f % 2 === 0 ? 3.2 : 4.2;
    c.filledOval(cx, cy + 6, 3.2, jawR, BLACK, BLACK, 0.8, 0.1);
    c.filledOval(cx, cy + 7, 1.8, 1.4, RED, null);

    // Radiating MS Paint shock spikes
    if (f % 2 === 1) {
      c.line(2, 6, 5, 9, 0.8, RED);
      c.line(30, 6, 27, 9, 0.8, RED);
      c.line(16, 1, 16, 4, 0.8, RED);
    }
  },

  // 5. Confused: Uneven derp eyes, raised eyebrow, squiggly mouth, wobbling `?` mark!
  confused(c, f) {
    const cy = 18;
    drawBaseDoodleHead(c, 14, cy, 11, 10.5, YELLOW, YELLOW_SHADE, f);

    // Left big eye, right small eye
    c.filledOval(10, cy - 2, 3.6, 3.6, WHITE, BLACK, 0.9, 0.1);
    c.filledOval(19, cy - 2, 2.4, 2.4, WHITE, BLACK, 0.9, 0.1);
    const look = f >= 2 ? 1 : 0;
    c.brush(10 - look, cy - 3, 1.1, BLACK);
    c.brush(19 + look, cy - 1, 1.0, BLACK);

    // One flat brow, one high arched brow
    c.line(7, cy - 7, 13, cy - 7, 0.9, BLACK);
    c.polyline([[16, cy - 7], [19, cy - 9], [22, cy - 6]], 0.9, BLACK);

    // Wobbly confused squiggle mouth
    const wob = f % 2 === 0 ? 1 : -1;
    c.polyline([[9, cy + 5], [12, cy + 4 + wob], [16, cy + 6 - wob], [20, cy + 4]], 0.9, BLACK);

    // Animated wobbling MS Paint `?` at top right!
    const qx = 27 + (f % 2 === 0 ? 0 : 1);
    const qy = 5 + (f === 2 ? -1 : 0);
    c.polyline([[qx - 2, qy], [qx + 2, qy], [qx + 2, qy + 3], [qx, qy + 5], [qx, qy + 7]], 1.3, BLACK);
    c.polyline([[qx - 2, qy], [qx + 2, qy], [qx + 2, qy + 3], [qx, qy + 5], [qx, qy + 7]], 0.6, ORANGE);
    c.outlinedCircle(qx, qy + 10, 1.0, ORANGE);
  },

  // 6. Sad / Crying: Watery puppy eyes, trembling frown, waterfall of cyan tears!
  sad(c, f) {
    const slump = f % 2 === 0 ? 0 : 1;
    const cy = 17 + slump;
    drawBaseDoodleHead(c, 16, cy, 11.5, 11, '#ffd54f', YELLOW_SHADE, f);

    // Worried tilted eyebrows
    c.line(8, cy - 6, 13, cy - 8, 0.9, BLACK);
    c.line(24, cy - 6, 19, cy - 8, 0.9, BLACK);

    // Big shiny dark puppy eyes
    c.brush(11, cy - 2, 2.5, BLACK);
    c.brush(21, cy - 2, 2.5, BLACK);
    c.setPixel(10, cy - 3, WHITE);
    c.setPixel(20, cy - 3, WHITE);

    // Waterfall of animated pixel tears streaming down!
    for (const tx of [11, 21]) {
      c.fillRect(tx - 1, cy + 1, 3, 9, CYAN);
      c.line(tx - 2, cy + 1, tx - 2, cy + 9, 0.4, BLACK);
      c.line(tx + 2, cy + 1, tx + 2, cy + 9, 0.4, BLACK);
      // Animated splash droplets at bottom
      const dropOff = (f * 2) % 5;
      c.outlinedCircle(tx + (tx < 16 ? -2 : 2), cy + 7 + dropOff, 1.2, CYAN);
    }

    // Trembling frown
    c.polyline([[12, cy + 6], [15, cy + 3], [17, cy + 3], [20, cy + 6]], 1.0, BLACK);
  },

  // 7. Celebrating: Striped party cone hat, extending party blower + confetti!
  celebrate(c, f) {
    const bob = [0, -2, -1, 0][f];
    const cy = 19 + bob;
    drawBaseDoodleHead(c, 14, cy, 10.5, 9.8, YELLOW, YELLOW_SHADE, f);

    // Striped MS Paint Party Cone Hat!
    c.fillPolygon([[8, cy - 8], [14, 2 + bob], [20, cy - 8]], PURPLE, BLACK, 0.9);
    c.line(10, cy - 5, 18, cy - 5, 0.8, CYAN);
    c.outlinedCircle(14, 2 + bob, 1.6, GREEN);

    // Happy ^ ^ eyes
    c.polyline([[9, cy - 2], [11, cy - 4], [13, cy - 2]], 0.9, BLACK);
    c.polyline([[15, cy - 2], [17, cy - 4], [19, cy - 2]], 0.9, BLACK);

    // Animated extending red party horn blower!
    const hornLen = [4, 9, 11, 6][f];
    c.outlinedRect(18, cy + 2, hornLen, 4, RED, BLACK);
    if (hornLen >= 8) {
      c.sparkle(29, cy + 1, 2, GREEN, BLACK);
    } else {
      c.outlinedCircle(18 + hornLen, cy + 4, 1.8, ORANGE);
    }

    // Confetti pixels dancing around
    const confY = f * 2;
    c.fillRect(3, (4 + confY) % 26, 2, 2, CYAN);
    c.fillRect(26, (7 + confY) % 26, 2, 2, PINK);
    c.fillRect(5, (16 + confY) % 28, 2, 2, GREEN);
  },

  // 8. Facepalm: Cartoon hand slapping forehead + exasperated squint + blue sweatdrop!
  facepalm(c, f) {
    const shake = f === 1 ? -1 : 0;
    const cx = 16 + shake;
    const cy = 17;
    drawBaseDoodleHead(c, cx, cy, 11.5, 11, YELLOW, YELLOW_SHADE, f);

    // Closed exasperated right eye peeking out
    c.line(cx + 3, cy - 2, cx + 8, cy - 2, 1.0, BLACK);
    // Flat grumpy mouth
    c.line(cx - 3, cy + 6, cx + 5, cy + 5, 1.0, BLACK);

    // Cartoon MS Paint palm slapping across forehead/left eye!
    const slapX = f === 0 ? -2 : 0;
    c.fillPolygon(
      [
        [cx - 10 + slapX, cy + 4],
        [cx - 8 + slapX, cy - 5],
        [cx + 3 + slapX, cy - 6],
        [cx + 5 + slapX, cy - 1],
        [cx + 1 + slapX, cy + 4],
      ],
      SKIN_PEACH,
      BLACK,
      1.0
    );
    // Finger divider lines
    c.line(cx - 2 + slapX, cy - 5, cx + 2 + slapX, cy - 4, 0.6, BLACK);
    c.line(cx - 2 + slapX, cy - 2, cx + 3 + slapX, cy - 1, 0.6, BLACK);

    // Impact stars on slap frame 1, sweatdrop sliding down on frames 2-3!
    if (f === 1) {
      c.line(3, 6, 6, 8, 0.9, RED);
      c.line(5, 4, 7, 7, 0.9, RED);
    } else {
      const dropY = 8 + f * 2;
      c.outlinedCircle(27, dropY, 1.8, CYAN);
      c.setPixel(27, dropY - 2, BLACK);
    }
  },

  // 9. Angry: Crimson red face, fierce V-brows, gritted teeth, puffing steam clouds!
  angry(c, f) {
    const shakeX = [0, -1, 1, -1][f];
    const cx = 16 + shakeX;
    const cy = 18;
    drawBaseDoodleHead(c, cx, cy, 11, 10.5, '#ff4d4d', RED_DARK, f);

    // Fierce deep V eyebrows
    c.line(cx - 8, cy - 6, cx - 2, cy - 2, 1.3, BLACK);
    c.line(cx + 8, cy - 6, cx + 2, cy - 2, 1.3, BLACK);

    // Glaring white eyes
    c.filledOval(cx - 5, cy - 1, 2.8, 2.2, WHITE, BLACK, 0.8, 0);
    c.filledOval(cx + 5, cy - 1, 2.8, 2.2, WHITE, BLACK, 0.8, 0);
    c.setPixel(cx - 4, cy - 1, BLACK);
    c.setPixel(cx + 4, cy - 1, BLACK);

    // Gritted boxy teeth snarl
    c.outlinedRect(cx - 6, cy + 3, 12, 5, WHITE, BLACK);
    c.line(cx - 5, cy + 5, cx + 5, cy + 5, 0.6, BLACK);
    c.line(cx - 2, cy + 4, cx - 2, cy + 7, 0.6, BLACK);
    c.line(cx + 2, cy + 4, cx + 2, cy + 7, 0.6, BLACK);

    // Animated white pixel steam puffs shooting out from sides/top!
    const puffOff = f;
    c.outlinedCircle(4 - Math.floor(puffOff / 2), 10 - puffOff, 2.2 + (f % 2) * 0.5, WHITE);
    c.outlinedCircle(28 + Math.floor(puffOff / 2), 10 - puffOff, 2.2 + ((f + 1) % 2) * 0.5, WHITE);
  },

  // 10. Thinking: Eyes looking up, hand on chin, animated thought bubbles!
  thinking(c, f) {
    const cy = 18;
    drawBaseDoodleHead(c, 15, cy, 11, 10.5, YELLOW, YELLOW_SHADE, f);

    // One flat brow, one raised curious brow
    c.line(8, cy - 6, 13, cy - 6, 0.9, BLACK);
    c.line(17, cy - 8, 22, cy - 7, 0.9, BLACK);

    // Eyes looking up-right toward thought bubbles
    c.filledOval(11, cy - 2, 3.0, 3.0, WHITE, BLACK, 0.8, 0);
    c.filledOval(19, cy - 2, 3.0, 3.0, WHITE, BLACK, 0.8, 0);
    c.brush(12, cy - 3, 1.1, BLACK);
    c.brush(20, cy - 3, 1.1, BLACK);

    // Pursed side mouth
    c.line(12, cy + 3, 18, cy + 2, 1.0, BLACK);

    // Hand stroking chin (shifts slightly on frames 1,3)
    const hx = 14 + (f % 2);
    c.outlinedRect(hx - 3, cy + 6, 8, 5, YELLOW, BLACK);
    c.line(hx + 4, cy + 5, hx + 7, cy + 3, 1.2, BLACK);
    c.line(hx + 4, cy + 5, hx + 7, cy + 3, 0.6, YELLOW);

    // Animated sequential thought bubbles popping in at top-right!
    c.outlinedCircle(24, 10, 1.2, WHITE);
    if (f >= 1) c.outlinedCircle(27, 6, 1.8, WHITE);
    if (f >= 2) {
      c.outlinedCircle(28, 3, 2.3, f === 3 ? '#fff3a1' : WHITE);
    }
  },

  // 11. On Fire / Hype: Cool sunglasses character surrounded by roaring pixel flames!
  fire(c, f) {
    // Roaring outer MS Paint flame silhouette behind face
    const tip1 = [2, 4, 1, 3][f];
    const tip2 = [5, 2, 4, 1][f];
    const tip3 = [3, 5, 2, 4][f];
    c.fillPolygon(
      [
        [5, 28],
        [3, 17],
        [8, 7 + tip1],
        [12, 12],
        [16, 1 + tip2],
        [20, 11],
        [25, 6 + tip3],
        [29, 17],
        [27, 28],
      ],
      RED,
      BLACK,
      1.0
    );
    // Inner orange flame
    c.fillPolygon(
      [
        [7, 28],
        [6, 19],
        [10, 11 + (f % 2)],
        [16, 6 + ((f + 1) % 2)],
        [22, 11 + (f % 2)],
        [26, 19],
        [25, 28],
      ],
      ORANGE,
      null
    );

    // Cool yellow hype buddy inside the flames
    const cy = 20 - (f % 2);
    drawBaseDoodleHead(c, 16, cy, 9, 8.5, YELLOW, YELLOW_SHADE, f);

    // Cool pixel sunglasses with animated white glint!
    c.line(8, cy - 2, 24, cy - 2, 1.0, BLACK);
    c.fillRect(9, cy - 2, 6, 4, BLACK);
    c.fillRect(17, cy - 2, 6, 4, BLACK);
    const gx = f % 2 === 0 ? 0 : 2;
    c.line(10 + gx, cy - 1, 11 + gx, cy - 1, 0.6, WHITE);
    c.line(18 + gx, cy - 1, 19 + gx, cy - 1, 0.6, WHITE);

    // Confident hype grin
    c.polyline([[12, cy + 3], [15, cy + 5], [18, cy + 5], [21, cy + 2]], 0.9, BLACK);
  },
};

function generateAllReactionSprites(outDir) {
  const results = [];
  for (const [id, drawFn] of Object.entries(REACTION_DRAWERS)) {
    const strip = buildHorizontalStrip(32, 32, 4, drawFn);
    const file = path.join(outDir, `reaction-${id}.png`);
    const bytes = strip.save(file);
    results.push({ id, file, bytes });
  }
  return results;
}

module.exports = {
  REACTION_IDS: Object.keys(REACTION_DRAWERS),
  generateAllReactionSprites,
};
