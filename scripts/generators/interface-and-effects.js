'use strict';

const path = require('node:path');
const { PixelCanvas, buildHorizontalStrip } = require('../pixel-canvas');

const B = '#000000';
const W = '#ffffff';
const Y = '#ffd900';
const O = '#ff8c1a';
const R = '#ff3b3b';
const RD = '#b81d1d';
const G = '#53e237';
const GD = '#239e14';
const C = '#33d9ff';
const BL = '#2c99e6';
const P = '#a259ff';
const PK = '#ff7eb9';
const GR = '#b5bcc9';
const GR_D = '#555d70';
const BR = '#9c5a25';
const BR_L = '#d4945a';

/* =========================================================================
   1. 3-FRAME BOILING HAND-DRAWN MS PAINT LOGO (340 x 204 -> 3 frames of 340x68)
   ========================================================================= */

function drawLogoFrame(c, frameIdx) {
  const letters = [
    { ch: 'J', color: '#ff3b3b', x: 8, w: 23 },
    { ch: 'e', color: '#ff9500', x: 34, w: 23 },
    { ch: 'o', color: '#ffd900', x: 60, w: 24 },
    { ch: 'p', color: '#56e33b', x: 87, w: 24 },
    { ch: 'a', color: '#29d9ff', x: 114, w: 24 },
    { ch: 'r', color: '#4d79ff', x: 141, w: 21 },
    { ch: 't', color: '#a259ff', x: 165, w: 21 },
    { ch: 'y', color: '#ff59c7', x: 189, w: 24 },
    { ch: '.', color: '#ffffff', x: 217, w: 10 },
    { ch: 'i', color: '#56e33b', x: 231, w: 13 },
    { ch: 'o', color: '#ffd900', x: 248, w: 24 },
  ];

  const j = (idx, axis) => {
    const v = Math.sin((idx + 1) * 2.7 + frameIdx * 2.1 + axis * 1.4);
    return v > 0.45 ? 1 : v < -0.45 ? -1 : 0;
  };

  letters.forEach((L, idx) => {
    const ox = L.x + j(idx, 0);
    const oy = 12 + j(idx, 1);

    const strokeLetter = (radius, col) => {
      switch (L.ch) {
        case 'J':
          c.line(ox + 6, oy + 2, ox + 19, oy + 2, radius, col);
          c.line(ox + 14, oy + 2, ox + 14, oy + 29, radius, col);
          c.quadCurve(ox + 14, oy + 29, ox + 13, oy + 38, ox + 4, oy + 34, radius, col);
          break;
        case 'e':
          c.line(ox + 4, oy + 23, ox + 19, oy + 22, radius, col);
          c.quadCurve(ox + 19, oy + 22, ox + 19, oy + 12, ox + 11, oy + 13, radius, col);
          c.quadCurve(ox + 11, oy + 13, ox + 3, oy + 14, ox + 4, oy + 25, radius, col);
          c.quadCurve(ox + 4, oy + 25, ox + 5, oy + 36, ox + 18, oy + 34, radius, col);
          break;
        case 'o':
          c.ovalOutline(ox + 12, oy + 24, 8.5, 10.5, radius, col, 0.7, idx + frameIdx * 1.9);
          break;
        case 'p':
          c.line(ox + 5, oy + 14, ox + 5, oy + 46, radius, col);
          c.ovalOutline(ox + 13, oy + 24, 7.8, 9.8, radius, col, 0.6, idx + frameIdx);
          break;
        case 'a':
          c.ovalOutline(ox + 11, oy + 25, 7.5, 9.5, radius, col, 0.6, idx + frameIdx * 1.3);
          c.line(ox + 18, oy + 15, ox + 19, oy + 35, radius, col);
          break;
        case 'r':
          c.line(ox + 5, oy + 14, ox + 5, oy + 35, radius, col);
          c.quadCurve(ox + 5, oy + 21, ox + 9, oy + 12, ox + 18, oy + 15, radius, col);
          break;
        case 't':
          c.line(ox + 10, oy + 5, ox + 10, oy + 33, radius, col);
          c.quadCurve(ox + 10, oy + 33, ox + 11, oy + 36, ox + 17, oy + 35, radius, col);
          c.line(ox + 3, oy + 15, ox + 17, oy + 15, radius, col);
          break;
        case 'y':
          c.line(ox + 4, oy + 15, ox + 12, oy + 32, radius, col);
          c.line(ox + 20, oy + 15, ox + 7, oy + 46, radius, col);
          break;
        case '.':
          c.brush(ox + 5, oy + 33, radius + 0.6, col);
          break;
        case 'i':
          c.line(ox + 6, oy + 15, ox + 6, oy + 35, radius, col);
          c.brush(ox + 6, oy + 6, radius + 0.4, col);
          break;
      }
    };

    strokeLetter(4.8, B);
    strokeLetter(2.5, L.color);
  });

  // Hand-drawn tilted MS Paint Yellow Pencil + Twinkling Sparkle on right
  const px = 285 + (frameIdx === 1 ? 1 : 0);
  const py = 13 + (frameIdx === 2 ? -1 : 0);

  c.fillPolygon([[px + 24, py + 2], [px + 34, py + 11], [px + 28, py + 17], [px + 18, py + 8]], '#ff7eb9', B, 1.3);
  c.fillPolygon([[px + 18, py + 8], [px + 28, py + 17], [px + 25, py + 20], [px + 15, py + 11]], '#c7d0d9', B, 1.2);
  c.fillPolygon([[px + 15, py + 11], [px + 25, py + 20], [px + 11, py + 35], [px + 1, py + 26]], '#ffd900', B, 1.3);
  c.line(px + 18, py + 14, px + 5, py + 28, 0.8, B);
  c.fillPolygon([[px + 1, py + 26], [px + 11, py + 35], [px - 3, py + 40]], '#f3c68f', B, 1.2);
  c.brush(px - 2, py + 39, 2.2, B);

  // Twinkling pixel star near pencil tip
  c.sparkle(329, 44 + (frameIdx === 1 ? -2 : 0), frameIdx === 1 ? 4 : 3, Y, B);
}

function generateLogoSheet(interfaceDir, legacyDir) {
  const frameW = 340;
  const frameH = 68;
  const sheet = new PixelCanvas(frameW, frameH * 3);
  for (let f = 0; f < 3; f++) {
    const cell = new PixelCanvas(frameW, frameH);
    drawLogoFrame(cell, f);
    sheet.blitFrom(cell, 0, f * frameH);
  }
  sheet.save(path.join(interfaceDir, 'logo-sheet.png'));
  if (legacyDir) sheet.save(path.join(legacyDir, 'logo-sheet.png'));
}

/* =========================================================================
   2. SEAMLESS MS PAINT PIXEL DOODLE BACKGROUND (180 x 180)
   ========================================================================= */

function generateDoodleBg(interfaceDir, legacyDir) {
  const c = new PixelCanvas(180, 180);
  c.clear('#3529a8');
  const ink = '#281d8c';

  // Question mark doodle
  c.polyline([[22, 22], [27, 17], [34, 18], [35, 25], [29, 30], [29, 35]], 1.4, ink);
  c.brush(29, 41, 1.6, ink);

  // Pixel crown doodle
  c.polyline([[95, 36], [93, 22], [103, 29], [111, 19], [119, 29], [129, 22], [127, 36]], 1.3, ink, true);

  // Lightning bolt doodle
  c.polyline([[156, 74], [146, 90], [155, 90], [145, 108]], 1.4, ink);

  // Trophy cup doodle
  c.fillRect(36, 118, 20, 3, ink);
  c.polyline([[38, 120], [40, 134], [52, 134], [54, 120]], 1.3, ink);
  c.line(46, 134, 46, 143, 1.4, ink);
  c.line(39, 143, 53, 143, 1.4, ink);

  // Lightbulb doodle
  c.ovalOutline(110, 128, 9, 9, 1.3, ink, 0.4, 2);
  c.fillRect(106, 138, 9, 5, ink);

  // Gamepad doodle
  c.outlinedRect(74, 72, 22, 13, '#3529a8', ink);
  c.line(80, 76, 80, 80, 1.0, ink);
  c.line(78, 78, 82, 78, 1.0, ink);
  c.brush(90, 78, 1.2, ink);

  // Pixel stars
  for (const [sx, sy] of [[68, 52], [152, 28], [22, 86], [156, 154], [82, 162]]) {
    c.line(sx - 4, sy, sx + 4, sy, 1.1, ink);
    c.line(sx, sy - 4, sx, sy + 4, 1.1, ink);
  }

  c.save(path.join(interfaceDir, 'doodle-bg.png'));
  if (legacyDir) c.save(path.join(legacyDir, 'doodle-bg.png'));
}

/* =========================================================================
   3. INTERFACE SPRITE STRIPS (public/assets/sprites/interface/)
   ========================================================================= */

function generateInterfaceSprites(interfaceDir, legacyDir) {
  // 4-frame Tumbling Dice (28x28 x 4)
  const diceStrip = buildHorizontalStrip(28, 28, 4, (c, f) => {
    const dy = [0, -2, 0, -1][f];
    c.outlinedRect(3, 4 + dy, 22, 21, W, B);
    c.line(4, 23 + dy, 23, 23 + dy, 0.8, '#cfd6e6');
    const pipSets = [
      [[9, 9], [19, 9], [14, 14], [9, 19], [19, 19]], // 5
      [[9, 9], [19, 19], [14, 14]], // 3
      [[9, 9], [19, 9], [9, 14], [19, 14], [9, 19], [19, 19]], // 6
      [[9, 9], [19, 9], [9, 19], [19, 19]], // 4
    ];
    for (const [px, py] of pipSets[f]) {
      c.brush(px, py + dy, 1.8, B);
    }
  });
  diceStrip.save(path.join(interfaceDir, 'dice-strip.png'));

  const singleDice = new PixelCanvas(28, 28);
  singleDice.outlinedRect(3, 3, 22, 22, W, B);
  for (const [px, py] of [[9, 9], [19, 9], [14, 14], [9, 19], [19, 19]]) {
    singleDice.brush(px, py, 1.9, B);
  }
  singleDice.save(path.join(interfaceDir, 'dice.png'));
  if (legacyDir) singleDice.save(path.join(legacyDir, 'dice.png'));

  // 4-frame Ticking Alarm Clock (20x20 x 4)
  const clockStrip = buildHorizontalStrip(20, 20, 4, (c, f) => {
    const shake = f === 1 ? -1 : f === 3 ? 1 : 0;
    c.outlinedCircle(5 + shake, 4, 2.0, Y);
    c.outlinedCircle(15 + shake, 4, 2.0, Y);
    c.filledOval(10, 11, 7, 7, W, B, 1.0, 0.1);
    const hands = [
      [10, 6],
      [14, 11],
      [10, 15],
      [6, 11],
    ];
    c.line(10, 11, 10, 8, 0.8, B);
    c.line(10, 11, hands[f][0], hands[f][1], 0.8, R);
  });
  clockStrip.save(path.join(interfaceDir, 'clock-strip.png'));

  // 4-frame Rotating MS Paint Gear (16x16 x 4)
  buildHorizontalStrip(16, 16, 4, (c, f) => {
    const angleOff = (f * Math.PI) / 8;
    for (let i = 0; i < 8; i++) {
      const a = angleOff + (i * Math.PI) / 4;
      const tx = 8 + Math.cos(a) * 5.8;
      const ty = 8 + Math.sin(a) * 5.8;
      c.outlinedCircle(tx, ty, 1.3, GR);
    }
    c.filledOval(8, 8, 5, 5, GR, B, 0.9, 0);
    c.outlinedCircle(8, 8, 1.8, GR_D);
  }).save(path.join(interfaceDir, 'gear-strip.png'));

  // 3-frame Sound On Speaker (16x16 x 3)
  buildHorizontalStrip(16, 16, 3, (c, f) => {
    c.fillPolygon([[2, 6], [5, 6], [9, 3], [9, 13], [5, 10], [2, 10]], Y, B, 0.8);
    if (f >= 0) c.line(11, 6, 11, 10, 0.8, C);
    if (f >= 1) c.polyline([[13, 4], [14, 8], [13, 12]], 0.8, G);
    if (f === 2) c.setPixel(15, 8, W);
  }).save(path.join(interfaceDir, 'sound-on-strip.png'));

  // 2-frame Sound Off Speaker (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    c.fillPolygon([[2, 6], [5, 6], [9, 3], [9, 13], [5, 10], [2, 10]], GR, B, 0.8);
    const s = f === 1 ? 0 : 0;
    c.line(11, 5 + s, 15, 11 + s, 1.1, B);
    c.line(15, 5 + s, 11, 11 + s, 1.1, B);
    c.line(11, 5 + s, 15, 11 + s, 0.6, R);
    c.line(15, 5 + s, 11, 11 + s, 0.6, R);
  }).save(path.join(interfaceDir, 'sound-off-strip.png'));

  // 4-frame Twinkling Star for Animations Toggle (16x16 x 4)
  buildHorizontalStrip(16, 16, 4, (c, f) => {
    const r = [5, 6, 5, 4][f];
    c.sparkle(8, 8, r, Y, B);
    if (f % 2 === 1) {
      c.setPixel(3, 3, C);
      c.setPixel(13, 12, PK);
    }
  }).save(path.join(interfaceDir, 'anim-star-strip.png'));

  // 2-frame Help Question Badge (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    const dy = f === 1 ? -1 : 0;
    c.outlinedRect(2, 2 + dy, 12, 12, Y, B);
    c.polyline([[6, 5 + dy], [10, 5 + dy], [10, 8 + dy], [8, 9 + dy], [8, 10 + dy]], 0.9, B);
    c.setPixel(8, 12 + dy, B);
  }).save(path.join(interfaceDir, 'help-q-strip.png'));

  // 2-frame Smartphone Icon (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    c.outlinedRect(4, 1, 8, 14, '#2c3e50', B);
    c.outlinedRect(5, 3, 6, 9, f === 0 ? C : G, B);
    c.setPixel(8, 13, W);
  }).save(path.join(interfaceDir, 'phone-strip.png'));

  // 2-frame Globe Icon for Public Rooms (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    c.filledOval(8, 8, 6.2, 6.2, BL, B, 0.9, 0.1);
    c.brush(6 + f, 6, 1.8, G);
    c.brush(10 - f, 10, 2.0, G);
    c.ovalOutline(8, 8, 6.2, 6.2, 0.9, B, 0.1);
  }).save(path.join(interfaceDir, 'globe-strip.png'));

  // 2-frame Padlock Icon for Private Room (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    const dy = f === 1 ? -1 : 0;
    c.polyline([[5, 7 + dy], [5, 3 + dy], [11, 3 + dy], [11, 7 + dy]], 1.2, B);
    c.outlinedRect(3, 7, 10, 8, Y, B);
    c.brush(8, 11, 1.0, B);
  }).save(path.join(interfaceDir, 'lock-strip.png'));

  // 2-frame Key Icon for Join Code (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    const dy = f === 1 ? -1 : 0;
    c.filledOval(5, 8 + dy, 3.5, 3.5, Y, B, 0.9, 0);
    c.setPixel(5, 8 + dy, B);
    c.outlinedRect(8, 7 + dy, 7, 3, Y, B);
    c.outlinedRect(12, 10 + dy, 2, 3, Y, B);
  }).save(path.join(interfaceDir, 'key-code-strip.png'));

  // 2-frame Pixel Checkmark (14x14 x 2)
  buildHorizontalStrip(14, 14, 2, (c, f) => {
    const dy = f === 1 ? -1 : 0;
    c.polyline([[2, 7 + dy], [5, 11 + dy], [12, 3 + dy]], 1.9, B);
    c.polyline([[2, 7 + dy], [5, 11 + dy], [12, 3 + dy]], 1.0, G);
  }).save(path.join(interfaceDir, 'check-strip.png'));

  // 2-frame Pixel Close X (14x14 x 2)
  buildHorizontalStrip(14, 14, 2, (c, f) => {
    const col = f === 0 ? W : Y;
    c.line(3, 3, 11, 11, 1.9, B);
    c.line(11, 3, 3, 11, 1.9, B);
    c.line(3, 3, 11, 11, 0.9, col);
    c.line(11, 3, 3, 11, 0.9, col);
  }).save(path.join(interfaceDir, 'close-x-strip.png'));

  // 2-frame Left & Right MS Paint Arrows (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    const dx = f === 1 ? -1 : 0;
    c.fillPolygon([[3 + dx, 8], [11 + dx, 3], [11 + dx, 13]], B, B, 0.8);
    c.fillPolygon([[5 + dx, 8], [10 + dx, 5], [10 + dx, 11]], Y, null);
  }).save(path.join(interfaceDir, 'arrow-left-strip.png'));

  buildHorizontalStrip(16, 16, 2, (c, f) => {
    const dx = f === 1 ? 1 : 0;
    c.fillPolygon([[13 + dx, 8], [5 + dx, 3], [5 + dx, 13]], B, B, 0.8);
    c.fillPolygon([[11 + dx, 8], [6 + dx, 5], [6 + dx, 11]], Y, null);
  }).save(path.join(interfaceDir, 'arrow-right-strip.png'));

  // 2-frame Copy Clipboard (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    c.outlinedRect(2, 2, 9, 10, GR, B);
    c.outlinedRect(5, 5 - f, 9, 10, W, B);
    c.line(7, 8 - f, 12, 8 - f, 0.6, B);
    c.line(7, 11 - f, 11, 11 - f, 0.6, B);
  }).save(path.join(interfaceDir, 'copy-strip.png'));

  // 4-frame Refresh Arrows (16x16 x 4)
  buildHorizontalStrip(16, 16, 4, (c, f) => {
    c.ovalOutline(8, 8, 5.2, 5.2, 1.3, B, 0);
    c.ovalOutline(8, 8, 5.2, 5.2, 0.6, C, 0);
    const pts = [
      [13, 6],
      [10, 13],
      [3, 10],
      [6, 3],
    ];
    c.outlinedCircle(pts[f][0], pts[f][1], 1.6, Y);
  }).save(path.join(interfaceDir, 'refresh-strip.png'));

  // 2-frame Plus Icon (14x14 x 2)
  buildHorizontalStrip(14, 14, 2, (c, f) => {
    const col = f === 0 ? W : Y;
    c.line(7, 2, 7, 12, 2.0, B);
    c.line(2, 7, 12, 7, 2.0, B);
    c.line(7, 3, 7, 11, 1.0, col);
    c.line(3, 7, 11, 7, 1.0, col);
  }).save(path.join(interfaceDir, 'plus-strip.png'));

  // 4-frame Bouncing Pixel Dots Loading Strip (48x24 x 4)
  const loadingStrip = buildHorizontalStrip(48, 24, 4, (c, f) => {
    const cols = ['#ff3b3b', '#ffd900', '#53e237'];
    [11, 24, 37].forEach((x, idx) => {
      const bounce = f === idx ? -5 : 0;
      c.outlinedCircle(x, 14 + bounce, 3.8, cols[idx]);
    });
  });
  loadingStrip.save(path.join(interfaceDir, 'loading-strip.png'));
  if (legacyDir) loadingStrip.save(path.join(legacyDir, 'loading-strip.png'));
}

/* =========================================================================
   4. ICONS SPRITE STRIPS (public/assets/sprites/icons/)
   ========================================================================= */

function generateIconSprites(iconsDir, legacyDir) {
  // 3-frame Mic On (16x16 x 3)
  buildHorizontalStrip(16, 16, 3, (c, f) => {
    c.outlinedRect(5, 2, 6, 8, f === 1 ? '#e8fff0' : GR, B);
    c.line(6, 5, 10, 5, 0.5, B);
    c.polyline([[3, 8], [4, 12], [12, 12], [13, 8]], 0.9, B);
    c.line(8, 12, 8, 15, 1.0, B);
    c.line(5, 15, 11, 15, 1.0, B);
    c.setPixel(8, 4, G);
  }).save(path.join(iconsDir, 'mic-on-strip.png'));

  // 4-frame Mic Speaking with Animated Green Soundwave Equalizer! (18x18 x 4)
  buildHorizontalStrip(18, 18, 4, (c, f) => {
    const dy = f % 2 === 1 ? -1 : 0;
    c.outlinedRect(3, 3 + dy, 6, 8, G, B);
    c.polyline([[2, 9 + dy], [3, 13 + dy], [9, 13 + dy], [10, 9 + dy]], 0.9, B);
    c.line(6, 13 + dy, 6, 16, 1.0, B);
    c.line(3, 16, 9, 16, 1.0, B);
    // Animated bouncing green soundwave bars on right!
    const h1 = [4, 8, 5, 9][f];
    const h2 = [8, 4, 10, 6][f];
    c.outlinedRect(12, 9 - Math.floor(h1 / 2), 2, h1, G, B);
    c.outlinedRect(15, 9 - Math.floor(h2 / 2), 2, h2, Y, B);
  }).save(path.join(iconsDir, 'mic-speaking-strip.png'));

  // 2-frame Mic Muted (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    c.outlinedRect(5, 2, 6, 8, GR_D, B);
    c.polyline([[3, 8], [4, 12], [12, 12], [13, 8]], 0.9, B);
    c.line(8, 12, 8, 15, 1.0, B);
    c.line(5, 15, 11, 15, 1.0, B);
    c.line(2, 2, 14, 14, 1.8, B);
    c.line(2, 2, 14, 14, 0.9, f === 0 ? R : '#ff7b7b');
  }).save(path.join(iconsDir, 'mic-muted-strip.png'));

  // 2-frame Headset On (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    const dy = f === 1 ? -1 : 0;
    c.polyline([[3, 10 + dy], [3, 5 + dy], [6, 2 + dy], [10, 2 + dy], [13, 5 + dy], [13, 10 + dy]], 1.2, B);
    c.outlinedRect(1, 8 + dy, 4, 6, C, B);
    c.outlinedRect(11, 8 + dy, 4, 6, C, B);
  }).save(path.join(iconsDir, 'headset-on-strip.png'));

  // 2-frame Headset Deafened (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    c.polyline([[3, 10], [3, 5], [6, 2], [10, 2], [13, 5], [13, 10]], 1.2, B);
    c.outlinedRect(1, 8, 4, 6, GR_D, B);
    c.outlinedRect(11, 8, 4, 6, GR_D, B);
    c.line(2, 2, 14, 14, 1.8, B);
    c.line(2, 2, 14, 14, 0.9, f === 0 ? R : O);
  }).save(path.join(iconsDir, 'headset-deaf-strip.png'));

  // 2-frame Peer Speaker On / Off (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    c.fillPolygon([[2, 6], [5, 6], [9, 3], [9, 13], [5, 10], [2, 10]], G, B, 0.8);
    c.line(12, 5 - f, 12, 11 + f, 0.9, G);
  }).save(path.join(iconsDir, 'speaker-peer-on-strip.png'));

  buildHorizontalStrip(16, 16, 2, (c) => {
    c.fillPolygon([[2, 6], [5, 6], [9, 3], [9, 13], [5, 10], [2, 10]], GR_D, B, 0.8);
    c.line(11, 5, 14, 11, 1.0, R);
    c.line(14, 5, 11, 11, 1.0, R);
  }).save(path.join(iconsDir, 'speaker-peer-off-strip.png'));

  // 4-frame Sparkling Host Crown (22x22 x 4)
  const crownStrip = buildHorizontalStrip(22, 22, 4, (c, f) => {
    const dy = f % 2 === 1 ? -1 : 0;
    const pts = [
      [3, 18 + dy],
      [2, 6 + dy],
      [7, 12 + dy],
      [11, 4 + dy],
      [15, 12 + dy],
      [20, 6 + dy],
      [19, 18 + dy],
    ];
    c.fillPolygon(pts, Y, B, 1.0);
    const gems = [R, C, G, PK];
    c.outlinedCircle(11, 14 + dy, 1.4, gems[f]);
    c.setPixel(6, 15 + dy, gems[(f + 1) % 4]);
    c.setPixel(16, 15 + dy, gems[(f + 2) % 4]);
    if (f === 1 || f === 3) c.sparkle(11, 2, 2, W, B);
  });
  crownStrip.save(path.join(iconsDir, 'crown-strip.png'));
  if (legacyDir) crownStrip.save(path.join(legacyDir, 'crown-strip.png'));

  // 4-frame Blinking Pixel Robot Head (18x18 x 4)
  buildHorizontalStrip(18, 18, 4, (c, f) => {
    const dy = f % 2 === 1 ? -1 : 0;
    c.line(9, 1 + dy, 9, 5 + dy, 1.0, B);
    c.outlinedCircle(9, 2 + dy, 1.4, f % 2 === 0 ? R : Y);
    c.outlinedRect(3, 5 + dy, 12, 11, '#99a8c2', B);
    c.outlinedRect(1, 8 + dy, 2, 4, O, B);
    c.outlinedRect(15, 8 + dy, 2, 4, O, B);
    if (f === 3) {
      c.line(5, 9 + dy, 7, 9 + dy, 0.8, B);
      c.line(11, 9 + dy, 13, 9 + dy, 0.8, B);
    } else {
      c.outlinedCircle(6, 9 + dy, 1.3, C);
      c.outlinedCircle(12, 9 + dy, 1.3, C);
    }
    c.outlinedRect(6, 13 + dy, 6, 2, W, B);
  }).save(path.join(iconsDir, 'bot-head-strip.png'));

  // 2-frame Users Duo Icon (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    c.outlinedCircle(11, 5, 2.2, C);
    c.outlinedRect(8, 9, 6, 5, C, B);
    const dy = f === 1 ? -1 : 0;
    c.outlinedCircle(6, 5 + dy, 2.5, Y);
    c.outlinedRect(2, 9 + dy, 8, 6, Y, B);
  }).save(path.join(iconsDir, 'users-strip.png'));

  // 2-frame Stacked Trivia Books (16x16 x 2)
  buildHorizontalStrip(16, 16, 2, (c, f) => {
    const dy = f === 1 ? -1 : 0;
    c.outlinedRect(2, 11, 12, 4, R, B);
    c.outlinedRect(3, 7, 12, 4, G, B);
    c.outlinedRect(2, 3 + dy, 12, 4, BL, B);
  }).save(path.join(iconsDir, 'books-strip.png'));

  // 3-frame Bullseye Target with Arrow (20x20 x 3)
  buildHorizontalStrip(20, 20, 3, (c, f) => {
    c.filledOval(10, 10, 8, 8, R, B, 0.9, 0.1);
    c.filledOval(10, 10, 5.2, 5.2, W, B, 0.8, 0.1);
    c.filledOval(10, 10, 2.4, 2.4, R, B, 0.8, 0);
    if (f >= 1) {
      c.line(10, 10, 17, 3, 1.2, B);
      c.line(10, 10, 17, 3, 0.6, Y);
    }
    if (f === 2) c.sparkle(10, 10, 2, Y, B);
  }).save(path.join(iconsDir, 'target-strip.png'));

  // 4-frame Gleaming Trophy Cup (44x44 x 4)
  const trophyStrip = buildHorizontalStrip(44, 44, 4, (c, f) => {
    const dy = [0, -2, -1, 0][f];
    c.outlinedRect(13, 35 + dy, 18, 6, '#8a531b', B);
    c.outlinedRect(18, 26 + dy, 8, 9, Y, B);
    c.ovalOutline(9, 16 + dy, 5, 6, 1.8, B);
    c.ovalOutline(9, 16 + dy, 5, 6, 0.9, Y);
    c.ovalOutline(35, 16 + dy, 5, 6, 1.8, B);
    c.ovalOutline(35, 16 + dy, 5, 6, 0.9, Y);
    c.fillPolygon(
      [[10, 8 + dy], [34, 8 + dy], [30, 26 + dy], [14, 26 + dy]],
      Y,
      B,
      1.3
    );
    // Animated shine streak sweeping across cup
    const sx = 15 + f * 4;
    c.line(sx, 11 + dy, sx - 1, 21 + dy, 1.1, W);
    // Twinkling stars
    c.sparkle(6, 7 + (f % 2) * 2, f % 2 === 0 ? 3 : 2, Y, B);
    c.sparkle(38, 6 + ((f + 1) % 2) * 2, f % 2 === 1 ? 3 : 2, C, B);
  });
  trophyStrip.save(path.join(iconsDir, 'trophy-strip.png'));
  if (legacyDir) trophyStrip.save(path.join(legacyDir, 'trophy-strip.png'));

  // 4-frame Award Ribbon Medal (24x24 x 4)
  buildHorizontalStrip(24, 24, 4, (c, f) => {
    const swing = [0, -1, 0, 1][f];
    c.fillPolygon([[7, 2], [11, 2], [13 + swing, 10], [9 + swing, 10]], R, B, 0.8);
    c.fillPolygon([[17, 2], [13, 2], [11 + swing, 10], [15 + swing, 10]], BL, B, 0.8);
    c.filledOval(12 + swing, 15, 6.5, 6.5, Y, B, 1.0, 0.1);
    c.sparkle(12 + swing, 15, f % 2 === 0 ? 3 : 4, W, B);
  }).save(path.join(iconsDir, 'medal-strip.png'));

  // Category Preset Chip Icons (18x18 x 3)
  // Funny preset: Goofy laughing face
  buildHorizontalStrip(18, 18, 3, (c, f) => {
    const dy = f === 1 ? -1 : 0;
    c.filledOval(9, 9 + dy, 7, 7, Y, B, 0.9, 0.2);
    c.line(5, 7 + dy, 7, 7 + dy, 0.8, B);
    c.line(11, 7 + dy, 13, 7 + dy, 0.8, B);
    c.outlinedRect(6, 10 + dy, 6, 4, R, B);
  }).save(path.join(iconsDir, 'preset-funny-strip.png'));

  // Science preset: Bubbling flask
  buildHorizontalStrip(18, 18, 3, (c, f) => {
    c.fillPolygon([[7, 3], [11, 3], [11, 7], [15, 15], [3, 15], [7, 7]], W, B, 0.8);
    c.fillPolygon([[4, 11], [14, 11], [15, 15], [3, 15]], G, B, 0.7);
    c.setPixel(9, 9 - f * 2, G);
  }).save(path.join(iconsDir, 'preset-science-strip.png'));

  // History preset: Classical stone temple pillars
  buildHorizontalStrip(18, 18, 2, (c, f) => {
    c.fillPolygon([[2, 7], [9, 2], [16, 7]], '#e8d7b0', B, 0.8);
    c.outlinedRect(4, 7, 2, 7, W, B);
    c.outlinedRect(8, 7, 2, 7, W, B);
    c.outlinedRect(12, 7, 2, 7, W, B);
    c.outlinedRect(2, 14, 14, 3, '#d4c094', B);
    if (f === 1) c.setPixel(9, 4, Y);
  }).save(path.join(iconsDir, 'preset-history-strip.png'));

  // Pop & Games preset: Retro gamepad
  buildHorizontalStrip(18, 18, 3, (c, f) => {
    c.outlinedRect(2, 5, 14, 9, GR, B);
    c.line(6, 8, 6, 11, 0.8, B);
    c.line(4, 9, 8, 9, 0.8, B);
    c.setPixel(12, 10, f === 0 ? R : Y);
    c.setPixel(14, 8, f === 1 ? R : G);
  }).save(path.join(iconsDir, 'preset-pop-strip.png'));

  // Everyday preset & Intermission: Steaming coffee mug
  buildHorizontalStrip(18, 18, 3, (c, f) => {
    c.ovalOutline(14, 11, 2.2, 2.5, 0.9, B);
    c.outlinedRect(3, 7, 10, 9, W, B);
    c.fillRect(5, 9, 6, 5, BR);
    const sx = f === 1 ? 1 : 0;
    c.line(6 + sx, 2, 6, 5, 0.6, W);
    c.line(10 - sx, 2, 10, 5, 0.6, W);
  }).save(path.join(iconsDir, 'preset-everyday-strip.png'));

  // Rocket icon for Underdog Boost (18x18 x 3)
  buildHorizontalStrip(18, 18, 3, (c, f) => {
    const dy = f === 1 ? -1 : 0;
    c.fillPolygon([[9, 2 + dy], [13, 8 + dy], [13, 13 + dy], [5, 13 + dy], [5, 8 + dy]], W, B, 0.8);
    c.fillPolygon([[9, 2 + dy], [12, 6 + dy], [6, 6 + dy]], R, B, 0.7);
    c.outlinedCircle(9, 9 + dy, 1.3, C);
    c.outlinedCircle(9, 15 + (f % 2), 1.8, f % 2 === 0 ? O : Y);
  }).save(path.join(iconsDir, 'rocket-strip.png'));
}

/* =========================================================================
   5. GAME EVENTS & SPECIAL MODIFIER EFFECTS (public/assets/sprites/effects/)
   ========================================================================= */

function generateEffectSprites(effectsDir, legacyDir) {
  // 4-frame Buzzer Dome Pressing + Sparks (36x36 x 4)
  const buzzerStrip = buildHorizontalStrip(36, 36, 4, (c, f) => {
    const press = [0, 3, 2, 0][f];
    c.outlinedRect(4, 24, 28, 9, '#6e7687', B);
    c.filledOval(18, 22 + press, 11, 8 - press * 0.5, R, B, 1.2, 0.1);
    c.line(12, 18 + press, 16, 17 + press, 1.0, '#ffaaaa');
    if (f === 1 || f === 2) {
      c.line(4, 9, 9, 13, 1.2, Y);
      c.line(32, 9, 27, 13, 1.2, Y);
      c.line(18, 3, 18, 8, 1.2, Y);
    }
  });
  buzzerStrip.save(path.join(effectsDir, 'buzzer-strip.png'));
  if (legacyDir) buzzerStrip.save(path.join(legacyDir, 'buzzer-strip.png'));

  // 4-frame Correct Celebration Check + Sparkles (36x36 x 4)
  const correctStrip = buildHorizontalStrip(36, 36, 4, (c, f) => {
    const bob = [0, -2, -1, 0][f];
    c.filledOval(18, 18 + bob, 14, 14, G, B, 1.3, 0.35, f);
    c.polyline([[10, 18 + bob], [16, 24 + bob], [27, 12 + bob]], 3.0, B);
    c.polyline([[10, 18 + bob], [16, 24 + bob], [27, 12 + bob]], 1.6, W);
    if (f % 2 === 1) {
      c.sparkle(4, 6, 3, Y, B);
      c.sparkle(32, 29, 3, C, B);
    } else {
      c.sparkle(31, 6, 2, Y, B);
    }
  });
  correctStrip.save(path.join(effectsDir, 'correct-strip.png'));
  if (legacyDir) correctStrip.save(path.join(legacyDir, 'correct-strip.png'));

  // 4-frame Incorrect Shaking X Stamp (36x36 x 4)
  const wrongStrip = buildHorizontalStrip(36, 36, 4, (c, f) => {
    const sx = [0, -2, 2, -1][f];
    c.filledOval(18 + sx, 18, 14, 14, R, B, 1.3, 0.35, f);
    c.line(11 + sx, 11, 25 + sx, 25, 3.0, B);
    c.line(25 + sx, 11, 11 + sx, 25, 3.0, B);
    c.line(11 + sx, 11, 25 + sx, 25, 1.5, W);
    c.line(25 + sx, 11, 11 + sx, 25, 1.5, W);
  });
  wrongStrip.save(path.join(effectsDir, 'wrong-strip.png'));
  if (legacyDir) wrongStrip.save(path.join(legacyDir, 'wrong-strip.png'));

  // 4-frame Daily Double Golden Star (40x40 x 4)
  const ddStarStrip = buildHorizontalStrip(40, 40, 4, (c, f) => {
    const scale = [1.0, 1.08, 1.0, 0.94][f];
    const rot = (f * 0.12) - 0.12;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 === 0 ? 16 : 7.5) * scale;
      const a = -Math.PI / 2 + rot + (i * Math.PI) / 5;
      pts.push([20 + Math.cos(a) * r, 20 + Math.sin(a) * r]);
    }
    c.fillPolygon(pts, f % 2 === 0 ? Y : '#ffe95c', B, 1.3);
    c.sparkle(6, 7 + (f % 2) * 3, 2, C, B);
    c.sparkle(34, 31 - (f % 2) * 3, 2, PK, B);
  });
  ddStarStrip.save(path.join(effectsDir, 'dd-star-strip.png'));
  if (legacyDir) ddStarStrip.save(path.join(legacyDir, 'dd-star-strip.png'));

  // 4-frame Speed Blitz Lightning Bolt (20x20 x 4)
  buildHorizontalStrip(20, 20, 4, (c, f) => {
    const dy = f % 2 === 1 ? -1 : 0;
    const pts = [
      [12, 1 + dy],
      [4, 11 + dy],
      [10, 11 + dy],
      [7, 19 + dy],
      [16, 8 + dy],
      [10, 8 + dy],
    ];
    c.fillPolygon(pts, f % 2 === 0 ? Y : '#ffffff', B, 0.9);
    if (f === 1 || f === 3) {
      c.setPixel(3, 4, Y);
      c.setPixel(17, 15, C);
    }
  }).save(path.join(effectsDir, 'mod-blitz-strip.png'));

  // 4-frame Steal Tile Bandit Mask (20x20 x 4)
  buildHorizontalStrip(20, 20, 4, (c, f) => {
    const dy = f % 2 === 1 ? -1 : 0;
    // Sneaky domino mask with glinting eyes + gold coin sparkle
    c.fillPolygon(
      [[2, 7 + dy], [8, 6 + dy], [10, 8 + dy], [12, 6 + dy], [18, 7 + dy], [17, 14 + dy], [11, 13 + dy], [10, 11 + dy], [9, 13 + dy], [3, 14 + dy]],
      '#1e1e2f',
      B,
      0.9
    );
    const look = f === 2 ? 1 : 0;
    c.outlinedRect(4 + look, 9 + dy, 4, 2, Y, B);
    c.outlinedRect(12 + look, 9 + dy, 4, 2, Y, B);
    if (f % 2 === 1) c.sparkle(16, 3, 2, Y, B);
  }).save(path.join(effectsDir, 'mod-steal-strip.png'));

  // 4-frame Chaos All-Play Comic Explosion Starburst (20x20 x 4)
  buildHorizontalStrip(20, 20, 4, (c, f) => {
    const outerR = [8.5, 9.5, 8.8, 9.2][f];
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const r = i % 2 === 0 ? outerR : 4.2;
      const a = (i * Math.PI) / 6 + f * 0.2;
      pts.push([10 + Math.cos(a) * r, 10 + Math.sin(a) * r]);
    }
    c.fillPolygon(pts, f % 2 === 0 ? O : R, B, 0.9);
    c.outlinedCircle(10, 10, f % 2 === 0 ? 2.5 : 3.2, Y);
  }).save(path.join(effectsDir, 'mod-chaos-strip.png'));

  // 4-frame Double Trouble 4-Leaf Clover + Sparkle (20x20 x 4)
  buildHorizontalStrip(20, 20, 4, (c, f) => {
    const dy = f % 2 === 1 ? -1 : 0;
    c.line(10, 10 + dy, 12, 18, 1.1, B);
    for (const [lx, ly] of [[7, 6], [13, 6], [7, 12], [13, 12]]) {
      c.outlinedCircle(lx, ly + dy, 3.0, f % 2 === 0 ? G : '#7dff6b');
    }
    c.outlinedCircle(10, 9 + dy, 1.5, Y);
  }).save(path.join(effectsDir, 'mod-double-strip.png'));

  // 4-frame Roaring Streak Flame (20x20 x 4)
  buildHorizontalStrip(20, 20, 4, (c, f) => {
    const t1 = [2, 4, 1, 3][f];
    const t2 = [5, 2, 4, 3][f];
    c.fillPolygon(
      [[5, 18], [3, 11], [6, 4 + t1], [10, 8], [11, 1 + t2], [15, 8], [17, 11], [15, 18]],
      R,
      B,
      0.9
    );
    c.fillPolygon([[7, 18], [6, 12], [10, 6 + (f % 2)], [14, 12], [13, 18]], O, null);
    c.outlinedCircle(10, 15, 2.0, Y);
  }).save(path.join(effectsDir, 'fire-streak-strip.png'));

  // 4-frame Falling MS Paint Confetti (112x30 x 4)
  const confettiStrip = buildHorizontalStrip(112, 30, 4, (c, f) => {
    const pieces = [
      { x: 10, y: 5, col: '#ff3b3b' },
      { x: 26, y: 15, col: '#ffd900' },
      { x: 42, y: 7, col: '#53e237' },
      { x: 58, y: 18, col: '#33d9ff' },
      { x: 74, y: 6, col: '#ff59c7' },
      { x: 90, y: 14, col: '#a259ff' },
      { x: 102, y: 8, col: '#ff9500' },
    ];
    pieces.forEach((p, idx) => {
      const py = ((p.y + f * 6 + idx * 2) % 24) + 2;
      const px = p.x + ((f + idx) % 2 === 0 ? -1 : 1);
      c.outlinedRect(px, py, 6, 4, p.col, B);
    });
  });
  confettiStrip.save(path.join(effectsDir, 'confetti-strip.png'));
  if (legacyDir) confettiStrip.save(path.join(legacyDir, 'confetti-strip.png'));

  // 4-frame Sparkle Decoration (20x20 x 4)
  buildHorizontalStrip(20, 20, 4, (c, f) => {
    c.sparkle(10, 10, [4, 7, 5, 3][f], Y, B);
    c.sparkle(4, 5, f % 2 === 0 ? 2 : 1, C, B);
    c.sparkle(16, 15, f % 2 === 1 ? 2 : 1, PK, B);
  }).save(path.join(effectsDir, 'sparkle-strip.png'));
}

/* =========================================================================
   6. TANGIBLE MULTI-STATE AVATAR SPRITE SHEETS (public/assets/sprites/avatars/)
   ========================================================================= */

function generateAvatarSpriteSheets(avatarsDir) {
  const states = [
    { name: 'avatar-idle-strip.png', fill: '#3a9efc', mood: 'idle' },
    { name: 'avatar-happy-strip.png', fill: '#53e237', mood: 'happy' },
    { name: 'avatar-sad-strip.png', fill: '#ffe119', mood: 'sad' },
    { name: 'avatar-excited-strip.png', fill: '#ff8717', mood: 'excited' },
    { name: 'avatar-victory-strip.png', fill: '#a259ff', mood: 'victory' },
    { name: 'avatar-defeat-strip.png', fill: '#ff3b3b', mood: 'defeat' },
    { name: 'avatar-bot-strip.png', fill: '#99a8c2', mood: 'bot' },
  ];

  for (const st of states) {
    const strip = buildHorizontalStrip(52, 52, 4, (c, f) => {
      const bob =
        st.mood === 'victory'
          ? [-3, -1, -2, 0][f]
          : st.mood === 'happy' || st.mood === 'excited'
          ? [0, -2, 0, -1][f]
          : st.mood === 'sad' || st.mood === 'defeat'
          ? [1, 2, 1, 2][f]
          : [0, -1, 0, 0][f];

      // Shoulders
      c.fillPolygon(
        [[8, 50], [10, 42 + bob], [16, 38 + bob], [36, 38 + bob], [42, 42 + bob], [44, 50]],
        st.fill,
        B,
        1.2
      );
      // Head
      if (st.mood === 'bot') {
        c.line(26, 5 + bob, 26, 12 + bob, 1.3, B);
        c.outlinedCircle(26, 5 + bob, 2.2, f % 2 === 0 ? R : Y);
        c.outlinedRect(13, 13 + bob, 26, 23, st.fill, B);
      } else {
        c.filledOval(26, 25 + bob, 13.5, 12.5, st.fill, B, 1.3, 0.45, f);
      }

      // Eyes & Mouth by mood
      const ey = 22 + bob;
      const my = 30 + bob;
      if (st.mood === 'idle' && f === 3) {
        c.line(17, ey, 23, ey, 1.1, B);
        c.line(29, ey, 35, ey, 1.1, B);
      } else if (st.mood === 'happy' || st.mood === 'victory') {
        c.polyline([[17, ey + 1], [20, ey - 2], [23, ey + 1]], 1.2, B);
        c.polyline([[29, ey + 1], [32, ey - 2], [35, ey + 1]], 1.2, B);
        c.sparkle(7, 11 + (f % 2) * 2, 3, Y, B);
        c.sparkle(45, 12 - (f % 2) * 2, 3, C, B);
      } else if (st.mood === 'defeat') {
        c.line(17, ey - 2, 23, ey + 2, 1.1, B);
        c.line(23, ey - 2, 17, ey + 2, 1.1, B);
        c.line(29, ey - 2, 35, ey + 2, 1.1, B);
        c.line(35, ey - 2, 29, ey + 2, 1.1, B);
      } else {
        c.filledOval(20, ey, 3.4, 3.4, W, B, 0.9, 0);
        c.filledOval(32, ey, 3.4, 3.4, W, B, 0.9, 0);
        c.brush(20, ey, 1.3, B);
        c.brush(32, ey, 1.3, B);
      }

      if (st.mood === 'sad' || st.mood === 'defeat') {
        c.polyline([[20, my + 3], [24, my], [28, my], [32, my + 3]], 1.2, B);
        c.outlinedCircle(36, 25 + bob + f * 2, 1.6, C);
      } else {
        c.outlinedRect(19, my - 1, 14, 5 + (f % 2), W, B);
      }

      if (st.mood === 'victory') {
        c.fillPolygon(
          [[17, 13 + bob], [16, 4 + bob], [22, 9 + bob], [26, 2 + bob], [30, 9 + bob], [36, 4 + bob], [35, 13 + bob]],
          Y,
          B,
          1.1
        );
      }
    });
    strip.save(path.join(avatarsDir, st.name));
  }
}

module.exports = {
  generateLogoSheet,
  generateDoodleBg,
  generateInterfaceSprites,
  generateIconSprites,
  generateEffectSprites,
  generateAvatarSpriteSheets,
};
