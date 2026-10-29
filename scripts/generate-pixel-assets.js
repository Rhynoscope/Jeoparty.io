'use strict';

/**
 * Authentic MS Paint Pixel-Art Asset Generator (Zero external dependencies)
 * Generates crisp, un-antialiased PNG sprite sheets & tiles in public/assets/
 * using hard integer pixel brushes and flood-fill bucket coloring.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const OUT_DIR = path.join(__dirname, '..', 'public', 'assets');

/* =========================================================================
   MINIMAL ZERO-DEPENDENCY RGBA PNG ENCODER
   ========================================================================= */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const crcInput = Buffer.concat([typeBuf, dataBuf]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4);
  }

  fillAll(rgba) {
    for (let i = 0; i < this.width * this.height; i++) {
      const o = i * 4;
      this.data[o] = rgba[0];
      this.data[o + 1] = rgba[1];
      this.data[o + 2] = rgba[2];
      this.data[o + 3] = rgba[3];
    }
  }

  setPixel(x, y, rgba) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
    const o = (iy * this.width + ix) * 4;
    this.data[o] = rgba[0];
    this.data[o + 1] = rgba[1];
    this.data[o + 2] = rgba[2];
    this.data[o + 3] = rgba[3];
  }

  getPixel(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) {
      return [0, 0, 0, 0];
    }
    const o = (iy * this.width + ix) * 4;
    return [this.data[o], this.data[o + 1], this.data[o + 2], this.data[o + 3]];
  }

  // Hard circular MS Paint brush (no anti-aliasing!)
  brush(cx, cy, radius, rgba) {
    const ix = Math.round(cx);
    const iy = Math.round(cy);
    const r = Math.max(0, radius);
    const rCeil = Math.ceil(r);
    const rSq = r * r + 0.25;
    for (let dy = -rCeil; dy <= rCeil; dy++) {
      for (let dx = -rCeil; dx <= rCeil; dx++) {
        if (dx * dx + dy * dy <= rSq) {
          this.setPixel(ix + dx, iy + dy, rgba);
        }
      }
    }
  }

  // Bresenham / stepped hard MS Paint line
  line(x0, y0, x1, y1, radius, rgba) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.brush(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, rgba);
    }
  }

  polyline(pts, radius, rgba, closed = false) {
    for (let i = 0; i < pts.length - 1; i++) {
      this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], radius, rgba);
    }
    if (closed && pts.length > 2) {
      const last = pts[pts.length - 1];
      this.line(last[0], last[1], pts[0][0], pts[0][1], radius, rgba);
    }
  }

  quadCurve(x0, y0, cx, cy, x1, y1, radius, rgba) {
    const steps = 40;
    let px = x0;
    let py = y0;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const nx = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
      const ny = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
      this.line(px, py, nx, ny, radius, rgba);
      px = nx;
      py = ny;
    }
  }

  ovalOutline(cx, cy, rx, ry, radius, rgba, wobbleSeed = 0) {
    const steps = 48;
    let prev = null;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wob =
        wobbleSeed !== 0
          ? Math.sin(a * 3 + wobbleSeed) * 0.55
          : 0;
      const x = cx + Math.cos(a) * (rx + wob);
      const y = cy + Math.sin(a) * (ry - wob * 0.5);
      if (prev) this.line(prev[0], prev[1], x, y, radius, rgba);
      prev = [x, y];
    }
  }

  fillRect(x, y, w, h, rgba) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, rgba);
      }
    }
  }

  // Classic MS Paint Paint-Bucket Flood Fill
  floodFill(sx, sy, fillRgba) {
    const startX = Math.round(sx);
    const startY = Math.round(sy);
    if (startX < 0 || startY < 0 || startX >= this.width || startY >= this.height) return;
    const target = this.getPixel(startX, startY);
    if (
      target[0] === fillRgba[0] &&
      target[1] === fillRgba[1] &&
      target[2] === fillRgba[2] &&
      target[3] === fillRgba[3]
    ) {
      return;
    }

    const match = (ix, iy) => {
      const o = (iy * this.width + ix) * 4;
      return (
        this.data[o] === target[0] &&
        this.data[o + 1] === target[1] &&
        this.data[o + 2] === target[2] &&
        this.data[o + 3] === target[3]
      );
    };

    const stack = [[startX, startY]];
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
      if (!match(x, y)) continue;
      this.setPixel(x, y, fillRgba);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  blitFrom(src, dstX, dstY) {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const p = src.getPixel(x, y);
        if (p[3] > 0) {
          this.setPixel(dstX + x, dstY + y, p);
        }
      }
    }
  }

  toPNG() {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const stride = this.width * 4 + 1;
    const raw = Buffer.alloc(stride * this.height);
    for (let y = 0; y < this.height; y++) {
      const rowStart = y * stride;
      raw[rowStart] = 0; // Filter type 0 (None)
      const srcStart = y * this.width * 4;
      Buffer.from(this.data.buffer, srcStart, this.width * 4).copy(
        raw,
        rowStart + 1
      );
    }

    const compressed = zlib.deflateSync(raw, { level: 9 });
    return Buffer.concat([
      signature,
      makeChunk('IHDR', ihdr),
      makeChunk('IDAT', compressed),
      makeChunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

function hex(h, a = 255) {
  const s = h.replace('#', '');
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
    a,
  ];
}

const BLACK = [0, 0, 0, 255];
const WHITE = [255, 255, 255, 255];

/* =========================================================================
   1. ANIMATED 3-FRAME MS PAINT LOGO: jeoparty.io!
   Drawn with thick black outer brush + colored inner stroke (just like
   skribbl.io's hand-drawn pixel brush lettering!) across 3 boil frames!
   ========================================================================= */

function drawDoubleStrokeGlyph(canvas, drawFn, colorRgba, outerR = 4.2, innerR = 2.0) {
  drawFn(BLACK, outerR);
  drawFn(colorRgba, innerR);
}

function renderLogoFrame(frameIdx) {
  const W = 340;
  const H = 68;
  const c = new PixelCanvas(W, H);

  // Subtle per-frame deterministic pixel wobble (-1, 0, +1) so logo feels alive like an MS Paint GIF!
  const wob = (letterIndex) => {
    const table = [
      [0, 1, -1],
      [-1, 0, 1],
      [1, -1, 0],
      [0, -1, 1],
    ];
    return table[letterIndex % table.length][frameIdx % 3];
  };

  // Helper to stroke a letter path twice (chunky black outline + bright MS Paint fill core)
  // Using slightly imperfect coordinates so every letter feels genuinely hand-drawn in MS Paint!

  // 1. 'j' (Red #ff2626)
  {
    const dy = wob(0);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.line(20, 26 + dy, 21, 49 + dy, r, col);
      c.quadCurve(21, 49 + dy, 20, 59 + dy, 10, 55 + dy, r, col);
      c.brush(20, 15 + dy, r + 0.6, col);
    }, hex('#ff2626'));
  }

  // 2. 'e' (Orange #ff8400)
  {
    const dy = wob(1);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.line(33, 39 + dy, 52, 38 + dy, r, col);
      c.quadCurve(52, 38 + dy, 52, 25 + dy, 41, 26 + dy, r, col);
      c.quadCurve(41, 26 + dy, 31, 27 + dy, 32, 41 + dy, r, col);
      c.quadCurve(32, 41 + dy, 33, 52 + dy, 50, 49 + dy, r, col);
    }, hex('#ff8400'));
  }

  // 3. 'o' (Yellow #fff200)
  {
    const dy = wob(2);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.ovalOutline(71, 39 + dy, 10.5, 12, r, col, 1.2 + frameIdx * 0.7);
    }, hex('#fff200'));
  }

  // 4. 'p' (Lime #44e619)
  {
    const dy = wob(3);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.line(92, 26 + dy, 92, 60 + dy, r, col);
      c.quadCurve(92, 30 + dy, 112, 23 + dy, 112, 39 + dy, r, col);
      c.quadCurve(112, 39 + dy, 111, 52 + dy, 92, 47 + dy, r, col);
    }, hex('#44e619'));
  }

  // 5. 'a' (Cyan #00eeff)
  {
    const dy = wob(4);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.ovalOutline(131, 39 + dy, 9.5, 11.5, r, col, 2.4 + frameIdx * 0.6);
      c.line(141, 27 + dy, 142, 50 + dy, r, col);
    }, hex('#00eeff'));
  }

  // 6. 'r' (Royal Blue #2e5bff)
  {
    const dy = wob(5);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.line(156, 26 + dy, 156, 50 + dy, r, col);
      c.quadCurve(156, 35 + dy, 162, 24 + dy, 172, 28 + dy, r, col);
    }, hex('#2e5bff'));
  }

  // 7. 't' (Purple #a329ff)
  {
    const dy = wob(6);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.line(186, 15 + dy, 186, 48 + dy, r, col);
      c.quadCurve(186, 48 + dy, 187, 52 + dy, 194, 50 + dy, r, col);
      c.line(178, 28 + dy, 195, 27 + dy, r, col);
    }, hex('#a329ff'));
  }

  // 8. 'y' (Pink #ff66e5)
  {
    const dy = wob(7);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.line(204, 27 + dy, 213, 46 + dy, r, col);
      c.line(223, 27 + dy, 210, 60 + dy, r, col);
    }, hex('#ff66e5'));
  }

  // 9. '.' (Hot Pink dot #ff70c8)
  {
    const dy = wob(1);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.brush(235, 48 + dy, r + 0.8, col);
    }, hex('#ff70c8'));
  }

  // 10. 'i' (White #ffffff)
  {
    const dy = wob(2);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.line(249, 27 + dy, 249, 50 + dy, r, col);
      c.brush(249, 15 + dy, r + 0.7, col);
    }, WHITE);
  }

  // 11. 'o' (White #ffffff, just like skribbl.io's white '.io'!)
  {
    const dy = wob(0);
    drawDoubleStrokeGlyph(c, (col, r) => {
      c.ovalOutline(272, 39 + dy, 10.5, 11.5, r, col, 0.9 + frameIdx);
    }, WHITE);
  }

  // 12. Hand-drawn tilted MS Paint Pencil / Exclamation Doodle on the right (homage to skribbl.io pencil!)
  {
    const tiltShift = frameIdx === 1 ? 1 : frameIdx === 2 ? -1 : 0;
    const tipX = 296;
    const tipY = 52;
    const topX = 313 + tiltShift;
    const topY = 10;

    // Thick black pencil silhouette
    const pLeftTop = [topX - 7, topY + 2];
    const pRightTop = [topX + 7, topY + 7];
    const pLeftBody = [tipX - 5, tipY - 12];
    const pRightBody = [tipX + 9, tipY - 7];
    const pTip = [tipX - 2, tipY + 2];

    // Fill body polygons by drawing thick interior strokes first, then crisp black 2px pixel outlines
    // Orange pencil wood body
    for (let t = 0.18; t <= 0.95; t += 0.06) {
      const lx = pLeftTop[0] + (pLeftBody[0] - pLeftTop[0]) * t;
      const ly = pLeftTop[1] + (pLeftBody[1] - pLeftTop[1]) * t;
      const rx = pRightTop[0] + (pRightBody[0] - pRightTop[0]) * t;
      const ry = pRightTop[1] + (pRightBody[1] - pRightTop[1]) * t;
      c.line(lx, ly, rx, ry, 1.5, hex('#ff8c1a'));
    }
    // Pink eraser cap at top
    for (let t = 0; t < 0.22; t += 0.05) {
      const lx = pLeftTop[0] + (pLeftBody[0] - pLeftTop[0]) * t;
      const ly = pLeftTop[1] + (pLeftBody[1] - pLeftTop[1]) * t;
      const rx = pRightTop[0] + (pRightBody[0] - pRightTop[0]) * t;
      const ry = pRightTop[1] + (pRightBody[1] - pRightTop[1]) * t;
      c.line(lx, ly, rx, ry, 1.5, hex('#ff75d8'));
    }
    // Tan wood cone tip
    for (let t = 0; t <= 1; t += 0.08) {
      const bx = pLeftBody[0] + (pRightBody[0] - pLeftBody[0]) * t;
      const by = pLeftBody[1] + (pRightBody[1] - pLeftBody[1]) * t;
      c.line(bx, by, pTip[0], pTip[1], 1.1, hex('#ffd39b'));
    }

    // Center wood ridge line & eraser seam
    const eL = [
      pLeftTop[0] + (pLeftBody[0] - pLeftTop[0]) * 0.22,
      pLeftTop[1] + (pLeftBody[1] - pLeftTop[1]) * 0.22,
    ];
    const eR = [
      pRightTop[0] + (pRightBody[0] - pRightTop[0]) * 0.22,
      pRightTop[1] + (pRightBody[1] - pRightTop[1]) * 0.22,
    ];
    const midTop = [(eL[0] + eR[0]) / 2, (eL[1] + eR[1]) / 2];
    const midBot = [(pLeftBody[0] + pRightBody[0]) / 2, (pLeftBody[1] + pRightBody[1]) / 2];

    c.line(midTop[0], midTop[1], midBot[0], midBot[1], 1.1, BLACK);
    c.line(eL[0], eL[1], eR[0], eR[1], 1.3, BLACK);
    c.line(pLeftBody[0], pLeftBody[1], pRightBody[0], pRightBody[1], 1.3, BLACK);

    // Outer pencil black outline + graphite point
    c.polyline([pLeftTop, pRightTop, pRightBody, pTip, pLeftBody], 1.6, BLACK, true);
    c.brush(pTip[0], pTip[1] - 1, 2.2, BLACK);

    // Subtle twinkling pixel sparkle beside pencil on frames 1 & 2!
    const sparkX = 327;
    const sparkY = 25;
    if (frameIdx === 0) {
      c.setPixel(sparkX, sparkY, hex('#fff200'));
      c.setPixel(sparkX + 1, sparkY, hex('#fff200'));
      c.setPixel(sparkX, sparkY + 1, hex('#fff200'));
    } else if (frameIdx === 1) {
      c.line(sparkX - 4, sparkY, sparkX + 4, sparkY, 0.8, hex('#fff200'));
      c.line(sparkX, sparkY - 4, sparkX, sparkY + 4, 0.8, hex('#fff200'));
      c.setPixel(sparkX, sparkY, WHITE);
    } else {
      c.line(sparkX - 2, sparkY - 2, sparkX + 2, sparkY + 2, 0.7, hex('#00eeff'));
      c.line(sparkX + 2, sparkY - 2, sparkX - 2, sparkY + 2, 0.7, hex('#00eeff'));
    }
  }

  return c;
}

function buildLogoSheet() {
  const f0 = renderLogoFrame(0);
  const f1 = renderLogoFrame(1);
  const f2 = renderLogoFrame(2);
  const sheet = new PixelCanvas(f0.width, f0.height * 3);
  sheet.blitFrom(f0, 0, 0);
  sheet.blitFrom(f1, 0, f0.height);
  sheet.blitFrom(f2, 0, f0.height * 2);
  return sheet;
}

/* =========================================================================
   2. SEAMLESS MS PAINT PIXEL DOODLE WALLPAPER TILE (180x180)
   ========================================================================= */

function buildDoodleWallpaper() {
  const S = 180;
  const c = new PixelCanvas(S, S);
  c.fillAll(hex('#3529a8'));
  const INK = hex('#261b87');

  // Trophy cup (top-left)
  c.polyline([[14, 14], [34, 14], [32, 28], [24, 33], [16, 28]], 1.0, INK, true);
  c.line(24, 33, 24, 41, 1.0, INK);
  c.line(18, 41, 30, 41, 1.0, INK);
  c.line(14, 18, 9, 21, 0.9, INK);
  c.line(9, 21, 15, 25, 0.9, INK);
  c.line(34, 18, 39, 21, 0.9, INK);
  c.line(39, 21, 33, 25, 0.9, INK);

  // Smiling Sun (top-mid)
  c.ovalOutline(82, 26, 9, 9, 1.0, INK, 1);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    c.line(
      82 + Math.cos(ang) * 12,
      26 + Math.sin(ang) * 12,
      82 + Math.cos(ang) * 16,
      26 + Math.sin(ang) * 16,
      0.9,
      INK
    );
  }
  c.setPixel(79, 24, INK);
  c.setPixel(85, 24, INK);
  c.line(79, 29, 85, 29, 0.8, INK);

  // Little House (top-right)
  c.polyline([[132, 28], [146, 15], [160, 28]], 1.0, INK, false);
  c.polyline([[136, 26], [136, 42], [156, 42], [156, 26]], 1.0, INK, false);
  c.polyline([[144, 42], [144, 34], [149, 34], [149, 42]], 0.8, INK, false);

  // Stick figure cheering (mid-left)
  c.ovalOutline(26, 78, 6, 6, 1.0, INK);
  c.line(26, 84, 26, 101, 1.0, INK);
  c.line(26, 90, 16, 82, 1.0, INK);
  c.line(26, 90, 36, 82, 1.0, INK);
  c.line(26, 101, 19, 113, 1.0, INK);
  c.line(26, 101, 33, 113, 1.0, INK);

  // Pixel Crown (center)
  c.polyline(
    [[68, 96], [66, 80], [76, 88], [84, 77], [92, 88], [102, 80], [100, 96]],
    1.0,
    INK,
    true
  );

  // Game-show Buzzer / Car doodle (mid-right)
  c.ovalOutline(146, 94, 16, 5, 1.0, INK);
  c.quadCurve(134, 93, 146, 76, 158, 93, 1.0, INK);
  c.line(140, 74, 137, 68, 0.9, INK);
  c.line(152, 74, 155, 68, 0.9, INK);

  // Birthday Cake / Podium (bottom-left)
  c.polyline([[14, 148], [42, 148], [42, 164], [14, 164]], 1.0, INK, true);
  c.line(22, 148, 22, 140, 0.9, INK);
  c.line(28, 148, 28, 140, 0.9, INK);
  c.line(34, 148, 34, 140, 0.9, INK);

  // Heart (bottom-center)
  c.polyline(
    [[84, 164], [73, 153], [74, 144], [80, 143], [84, 148], [88, 143], [94, 144], [95, 153]],
    1.0,
    INK,
    true
  );

  // Big '$' and '?' Trivia doodles (bottom-right & gaps)
  c.polyline([[132, 142], [124, 142], [124, 150], [133, 151], [133, 159], [123, 159]], 1.0, INK, false);
  c.line(128, 138, 128, 163, 0.9, INK);

  c.polyline([[154, 142], [162, 141], [164, 147], [158, 152], [158, 156]], 1.0, INK, false);
  c.brush(158, 161, 1.1, INK);

  // Star (upper-left gap)
  c.line(54, 52, 54, 62, 0.9, INK);
  c.line(49, 57, 59, 57, 0.9, INK);
  c.line(51, 54, 57, 60, 0.8, INK);
  c.line(57, 54, 51, 60, 0.8, INK);

  // Pencil (lower-mid gap)
  c.polyline([[106, 124], [118, 112], [123, 117], [111, 129], [105, 130]], 0.9, INK, true);

  return c;
}

/* =========================================================================
   3. 2-FRAME ANIMATED PIXEL BADGES: CROWN, TROPHY, CORRECT, WRONG, DD STAR
   ========================================================================= */

function buildCrownStrip() {
  const sheet = new PixelCanvas(64, 32);
  for (let f = 0; f < 2; f++) {
    const c = new PixelCanvas(32, 32);
    const dy = f === 1 ? -1 : 0;
    const pts = [
      [5, 24 + dy],
      [3, 10 + dy],
      [11, 17 + dy],
      [16, 6 + dy],
      [21, 17 + dy],
      [29, 10 + dy],
      [27, 24 + dy],
    ];
    c.polyline(pts, 1.5, BLACK, true);
    c.floodFill(16, 20 + dy, hex('#ffd900'));
    c.polyline(pts, 1.3, BLACK, true);
    // Red & cyan pixel jewels
    c.brush(16, 19 + dy, 1.5, f === 0 ? hex('#ff2a2a') : hex('#00eeff'));
    c.setPixel(10, 20 + dy, WHITE);
    if (f === 1) {
      c.line(16, 1, 16, 3, 0.6, WHITE);
      c.line(28, 4, 30, 4, 0.6, hex('#fff200'));
    }
    sheet.blitFrom(c, f * 32, 0);
  }
  return sheet;
}

function buildTrophyStrip() {
  const sheet = new PixelCanvas(96, 48);
  for (let f = 0; f < 2; f++) {
    const c = new PixelCanvas(48, 48);
    const dy = f === 1 ? -1 : 0;
    // Cup handles
    c.ovalOutline(11, 17 + dy, 5, 6, 1.4, BLACK);
    c.ovalOutline(37, 17 + dy, 5, 6, 1.4, BLACK);
    // Cup bowl
    const bowl = [
      [12, 8 + dy],
      [36, 8 + dy],
      [34, 24 + dy],
      [28, 30 + dy],
      [20, 30 + dy],
      [14, 24 + dy],
    ];
    c.polyline(bowl, 1.5, BLACK, true);
    c.floodFill(24, 18 + dy, hex('#ffd400'));
    c.polyline(bowl, 1.4, BLACK, true);
    // Stem & pedestal
    c.fillRect(21, 30 + dy, 6, 8, hex('#e6a800'));
    c.polyline([[21, 30 + dy], [27, 30 + dy], [27, 38 + dy], [21, 38 + dy]], 1.2, BLACK, true);
    c.fillRect(14, 38 + dy, 20, 6, hex('#8c5319'));
    c.polyline([[14, 38 + dy], [34, 38 + dy], [34, 44 + dy], [14, 44 + dy]], 1.4, BLACK, true);
    // '#1' pixel mark & shine
    c.line(24, 14 + dy, 24, 23 + dy, 1.1, BLACK);
    c.line(17, 12 + dy, 17, 20 + dy, 0.9, WHITE);
    // Twinkling pixel star
    const sx = f === 0 ? 7 : 40;
    const sy = f === 0 ? 7 : 8;
    c.line(sx - 3, sy, sx + 3, sy, 0.8, hex('#fff200'));
    c.line(sx, sy - 3, sx, sy + 3, 0.8, hex('#fff200'));
    sheet.blitFrom(c, f * 48, 0);
  }
  return sheet;
}

function buildCorrectStrip() {
  const sheet = new PixelCanvas(80, 40);
  for (let f = 0; f < 2; f++) {
    const c = new PixelCanvas(40, 40);
    const scaleShift = f === 1 ? -1 : 0;
    c.ovalOutline(20, 20 + scaleShift, 15, 15, 1.6, BLACK, f + 1);
    c.floodFill(20, 20 + scaleShift, hex('#4be62e'));
    c.ovalOutline(20, 20 + scaleShift, 15, 15, 1.6, BLACK, f + 1);
    // Chunky pixel checkmark
    c.line(12, 20 + scaleShift, 18, 26 + scaleShift, 3.0, BLACK);
    c.line(18, 26 + scaleShift, 29, 13 + scaleShift, 3.0, BLACK);
    c.line(12, 20 + scaleShift, 18, 26 + scaleShift, 1.6, WHITE);
    c.line(18, 26 + scaleShift, 29, 13 + scaleShift, 1.6, WHITE);
    if (f === 1) {
      c.setPixel(4, 8, hex('#fff200'));
      c.setPixel(35, 7, hex('#fff200'));
      c.setPixel(36, 31, hex('#00eeff'));
    }
    sheet.blitFrom(c, f * 40, 0);
  }
  return sheet;
}

function buildWrongStrip() {
  const sheet = new PixelCanvas(80, 40);
  for (let f = 0; f < 2; f++) {
    const c = new PixelCanvas(40, 40);
    const dx = f === 1 ? 1 : -1;
    c.ovalOutline(20 + dx, 20, 15, 15, 1.6, BLACK, f + 2);
    c.floodFill(20 + dx, 20, hex('#ff3333'));
    c.ovalOutline(20 + dx, 20, 15, 15, 1.6, BLACK, f + 2);
    // Chunky pixel X
    c.line(13 + dx, 13, 27 + dx, 27, 3.0, BLACK);
    c.line(27 + dx, 13, 13 + dx, 27, 3.0, BLACK);
    c.line(13 + dx, 13, 27 + dx, 27, 1.5, WHITE);
    c.line(27 + dx, 13, 13 + dx, 27, 1.5, WHITE);
    sheet.blitFrom(c, f * 40, 0);
  }
  return sheet;
}

function buildDailyDoubleStarStrip() {
  const sheet = new PixelCanvas(96, 48);
  for (let f = 0; f < 2; f++) {
    const c = new PixelCanvas(48, 48);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + (f === 1 ? 0.08 : -0.04);
      const rad = i % 2 === 0 ? 20 : 9;
      pts.push([24 + Math.cos(a) * rad, 24 + Math.sin(a) * rad]);
    }
    c.polyline(pts, 1.5, BLACK, true);
    c.floodFill(24, 24, f === 0 ? hex('#ffd900') : hex('#ffae00'));
    c.polyline(pts, 1.5, BLACK, true);
    // Cute MS Paint smiley eyes inside the Daily Double star!
    c.brush(20, 22, 1.4, BLACK);
    c.brush(28, 22, 1.4, BLACK);
    c.line(21, 27, 27, 27, 1.1, BLACK);
    sheet.blitFrom(c, f * 48, 0);
  }
  return sheet;
}

function buildDiceIcon() {
  const c = new PixelCanvas(28, 28);
  const box = [[4, 4], [24, 3], [25, 24], [3, 25]];
  c.polyline(box, 1.5, BLACK, true);
  c.floodFill(14, 14, hex('#f4f6ff'));
  c.polyline(box, 1.5, BLACK, true);
  for (const [px, py] of [[9, 9], [19, 9], [14, 14], [9, 19], [19, 19]]) {
    c.brush(px, py, 1.6, BLACK);
  }
  return c;
}

function buildClockIcon() {
  const c = new PixelCanvas(28, 28);
  c.ovalOutline(14, 15, 10, 10, 1.5, BLACK, 1);
  c.floodFill(14, 15, WHITE);
  c.ovalOutline(14, 15, 10, 10, 1.5, BLACK, 1);
  c.line(14, 9, 14, 15, 1.2, BLACK);
  c.line(14, 15, 19, 17, 1.2, BLACK);
  c.line(4, 6, 8, 3, 1.4, BLACK);
  c.line(24, 6, 20, 3, 1.4, BLACK);
  return c;
}

function buildBuzzerStrip() {
  const sheet = new PixelCanvas(80, 40);
  for (let f = 0; f < 2; f++) {
    const c = new PixelCanvas(40, 40);
    const press = f === 1 ? 2 : 0;
    // Grey base plate
    const base = [[5, 30], [35, 30], [37, 36], [3, 36]];
    c.polyline(base, 1.4, BLACK, true);
    c.floodFill(20, 33, hex('#b0b7cc'));
    c.polyline(base, 1.4, BLACK, true);
    // Big red dome button
    const dome = [
      [8, 30],
      [9, 18 + press],
      [15, 13 + press],
      [25, 13 + press],
      [31, 18 + press],
      [32, 30],
    ];
    c.polyline(dome, 1.5, BLACK, true);
    c.floodFill(20, 23, f === 0 ? hex('#ff3030') : hex('#ff5959'));
    c.polyline(dome, 1.5, BLACK, true);
    c.line(14, 17 + press, 18, 16 + press, 1.1, WHITE);
    if (f === 1) {
      c.line(7, 9, 4, 5, 1.1, hex('#fff200'));
      c.line(20, 8, 20, 3, 1.1, hex('#fff200'));
      c.line(33, 9, 36, 5, 1.1, hex('#fff200'));
    }
    sheet.blitFrom(c, f * 40, 0);
  }
  return sheet;
}

function buildConfettiStrip() {
  const sheet = new PixelCanvas(240, 32);
  const colors = [
    hex('#ff2a2a'),
    hex('#ff8c00'),
    hex('#fff200'),
    hex('#47e62e'),
    hex('#00eeff'),
    hex('#ff66e5'),
  ];
  const pieces = [
    [10, 10], [28, 20], [46, 8], [64, 22], [82, 12], [100, 18], [112, 9],
  ];
  for (let f = 0; f < 2; f++) {
    const c = new PixelCanvas(120, 32);
    pieces.forEach(([x, y], idx) => {
      const col = colors[idx % colors.length];
      const py = y + (f === 1 ? (idx % 2 === 0 ? 3 : -3) : 0);
      const px = x + (f === 1 ? (idx % 2 === 0 ? 2 : -2) : 0);
      if (idx % 2 === 0) {
        c.fillRect(px - 2, py - 2, 5, 5, BLACK);
        c.fillRect(px - 1, py - 1, 3, 3, col);
      } else {
        c.line(px - 3, py - 2, px + 3, py + 2, 1.5, BLACK);
        c.line(px - 2, py - 1, px + 2, py + 1, 0.9, col);
      }
    });
    sheet.blitFrom(c, f * 120, 0);
  }
  return sheet;
}

function buildLoadingStrip() {
  const sheet = new PixelCanvas(144, 24);
  const dotColors = [hex('#ff3b3b'), hex('#fff200'), hex('#47e62e')];
  for (let f = 0; f < 3; f++) {
    const c = new PixelCanvas(48, 24);
    for (let d = 0; d < 3; d++) {
      const cx = 11 + d * 13;
      const cy = 14 - (f === d ? 5 : 0);
      c.brush(cx, cy, 4.2, BLACK);
      c.brush(cx, cy, 2.5, dotColors[d]);
    }
    sheet.blitFrom(c, f * 48, 0);
  }
  return sheet;
}

// 25 hand-drawn 24x24 MS Paint category icons (indices 0..23 builtin + 24 custom)
const CATEGORY_ICON_ORDER = [
  'internet-memes',
  'video-games',
  'blockbuster-movies',
  'weird-food',
  'freaky-animals',
  'pop-music',
  'binge-tv',
  'space-reality',
  'chaotic-history',
  'where-is-that',
  'everyday-science',
  'slang-translator',
  'superheroes',
  'cartoons-anime',
  'riddles-wordplay',
  'tech-gadgets',
  'sports-records',
  'famous-books',
  'spooky-myths',
  'board-games-toys',
  'dumb-laws',
  'before-and-after',
  'brands-logos',
  'nostalgia-90s-00s',
  'custom',
];

function drawCatIcon(c, key) {
  const box = (x0, y0, x1, y1, fill) => {
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    c.polyline(pts, 1.2, BLACK, true);
    c.floodFill(Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2), fill);
    c.polyline(pts, 1.2, BLACK, true);
  };

  switch (key) {
    case 'internet-memes': // Pixel Globe
      c.ovalOutline(12, 12, 8, 8, 1.3, BLACK);
      c.floodFill(12, 12, hex('#3dc8ff'));
      c.ovalOutline(12, 12, 8, 8, 1.3, BLACK);
      c.line(4, 12, 20, 12, 0.9, BLACK);
      c.line(12, 4, 12, 20, 0.9, BLACK);
      break;
    case 'video-games': // Gamepad
      box(4, 8, 20, 17, hex('#d8dee9'));
      c.line(8, 11, 8, 15, 1.0, BLACK);
      c.line(6, 13, 10, 13, 1.0, BLACK);
      c.brush(15, 12, 1.2, hex('#ff2a2a'));
      c.brush(17, 14, 1.2, hex('#2962ff'));
      break;
    case 'blockbuster-movies': // Popcorn tub
      c.brush(9, 7, 2.6, BLACK);
      c.brush(12, 6, 2.8, BLACK);
      c.brush(15, 7, 2.6, BLACK);
      c.brush(9, 7, 1.5, hex('#fff275'));
      c.brush(12, 6, 1.6, hex('#fff275'));
      c.brush(15, 7, 1.5, hex('#fff275'));
      box(7, 9, 17, 20, hex('#ff3b3b'));
      c.line(10, 10, 10, 19, 0.9, WHITE);
      c.line(14, 10, 14, 19, 0.9, WHITE);
      break;
    case 'weird-food': // Pizza slice
      c.polyline([[5, 6], [19, 8], [11, 20]], 1.4, BLACK, true);
      c.floodFill(12, 11, hex('#ffd000'));
      c.polyline([[5, 6], [19, 8], [11, 20]], 1.3, BLACK, true);
      c.line(5, 6, 19, 8, 2.0, hex('#d47a2a'));
      c.polyline([[5, 6], [19, 8]], 1.1, BLACK);
      c.brush(11, 11, 1.3, hex('#e61919'));
      c.brush(14, 13, 1.2, hex('#e61919'));
      break;
    case 'freaky-animals': // Paw print
      c.ovalOutline(12, 15, 5, 4, 1.3, BLACK);
      c.floodFill(12, 15, hex('#ff8c42'));
      c.ovalOutline(12, 15, 5, 4, 1.2, BLACK);
      for (const [tx, ty] of [[6, 9], [10, 6], [14, 6], [18, 9]]) {
        c.brush(tx, ty, 2.2, BLACK);
        c.brush(tx, ty, 1.1, hex('#ff8c42'));
      }
      break;
    case 'pop-music': // Music note
      c.line(10, 6, 10, 17, 1.5, BLACK);
      c.line(18, 4, 18, 15, 1.5, BLACK);
      c.line(10, 6, 18, 4, 2.2, BLACK);
      c.line(10, 6, 18, 4, 1.0, hex('#ff66e5'));
      c.brush(8, 17, 2.8, BLACK);
      c.brush(16, 15, 2.8, BLACK);
      c.brush(8, 17, 1.5, hex('#ff66e5'));
      c.brush(16, 15, 1.5, hex('#ff66e5'));
      break;
    case 'binge-tv': // Retro TV
      c.line(9, 4, 12, 8, 1.1, BLACK);
      c.line(16, 4, 12, 8, 1.1, BLACK);
      box(4, 8, 20, 19, hex('#8d5bff'));
      box(6, 10, 16, 17, hex('#70f2ff'));
      break;
    case 'space-reality': // Rocket / Planet
      c.ovalOutline(12, 12, 5, 5, 1.3, BLACK);
      c.floodFill(12, 12, hex('#ff9f1c'));
      c.ovalOutline(12, 12, 5, 5, 1.2, BLACK);
      c.line(3, 16, 21, 8, 1.6, BLACK);
      c.line(3, 16, 21, 8, 0.8, hex('#00eeff'));
      break;
    case 'chaotic-history': // Column / Helmet
      box(5, 5, 19, 8, hex('#e6e1d3'));
      box(7, 8, 17, 17, hex('#cfc8b4'));
      box(4, 17, 20, 20, hex('#e6e1d3'));
      c.line(10, 9, 10, 16, 0.9, BLACK);
      c.line(14, 9, 14, 16, 0.9, BLACK);
      break;
    case 'where-is-that': // Map pin
      c.ovalOutline(12, 9, 5, 5, 1.4, BLACK);
      c.polyline([[7, 10], [12, 20], [17, 10]], 1.4, BLACK, true);
      c.floodFill(12, 9, hex('#ff3b3b'));
      c.brush(12, 9, 1.6, WHITE);
      break;
    case 'everyday-science': // Bubbling potion flask
      c.polyline([[9, 4], [15, 4], [14, 9], [19, 19], [5, 19], [10, 9]], 1.3, BLACK, true);
      c.floodFill(12, 15, hex('#47e62e'));
      c.polyline([[9, 4], [15, 4], [14, 9], [19, 19], [5, 19], [10, 9]], 1.3, BLACK, true);
      c.setPixel(11, 14, WHITE);
      c.setPixel(14, 16, WHITE);
      break;
    case 'slang-translator': // Speech bubble
      c.polyline([[4, 5], [20, 5], [20, 15], [12, 15], [7, 20], [8, 15], [4, 15]], 1.3, BLACK, true);
      c.floodFill(12, 10, hex('#fff200'));
      c.polyline([[4, 5], [20, 5], [20, 15], [12, 15], [7, 20], [8, 15], [4, 15]], 1.3, BLACK, true);
      c.brush(8, 10, 1.0, BLACK);
      c.brush(12, 10, 1.0, BLACK);
      c.brush(16, 10, 1.0, BLACK);
      break;
    case 'superheroes': // Lightning shield
      c.polyline([[5, 5], [19, 5], [18, 14], [12, 20], [6, 14]], 1.3, BLACK, true);
      c.floodFill(12, 11, hex('#2962ff'));
      c.polyline([[5, 5], [19, 5], [18, 14], [12, 20], [6, 14]], 1.3, BLACK, true);
      c.polyline([[13, 7], [10, 12], [14, 12], [11, 17]], 1.2, hex('#fff200'), false);
      break;
    case 'cartoons-anime': // Capture ball / star
      c.ovalOutline(12, 12, 8, 8, 1.3, BLACK);
      c.floodFill(12, 8, hex('#ff2a2a'));
      c.line(4, 12, 20, 12, 1.4, BLACK);
      c.floodFill(12, 16, WHITE);
      c.ovalOutline(12, 12, 8, 8, 1.3, BLACK);
      c.brush(12, 12, 2.4, BLACK);
      c.brush(12, 12, 1.2, WHITE);
      break;
    case 'riddles-wordplay': // Lightbulb
      c.ovalOutline(12, 10, 6, 6, 1.3, BLACK);
      c.floodFill(12, 10, hex('#fff200'));
      c.ovalOutline(12, 10, 6, 6, 1.3, BLACK);
      box(9, 16, 15, 20, hex('#b0b7cc'));
      break;
    case 'tech-gadgets': // Monitor
      box(4, 5, 20, 16, hex('#2e3440'));
      box(6, 7, 18, 14, hex('#00eeff'));
      c.line(12, 16, 12, 19, 1.4, BLACK);
      c.line(8, 19, 16, 19, 1.4, BLACK);
      break;
    case 'sports-records': // Gold Medal
      c.line(8, 4, 11, 10, 1.8, hex('#2962ff'));
      c.line(16, 4, 13, 10, 1.8, hex('#ff2a2a'));
      c.ovalOutline(12, 15, 5, 5, 1.4, BLACK);
      c.floodFill(12, 15, hex('#ffd400'));
      c.ovalOutline(12, 15, 5, 5, 1.3, BLACK);
      break;
    case 'famous-books': // Open Book
      box(4, 6, 12, 18, WHITE);
      box(12, 6, 20, 18, hex('#eef2ff'));
      c.line(6, 10, 10, 10, 0.8, BLACK);
      c.line(6, 13, 10, 13, 0.8, BLACK);
      c.line(14, 10, 18, 10, 0.8, BLACK);
      c.line(14, 13, 18, 13, 0.8, BLACK);
      break;
    case 'spooky-myths': // Cute Pixel Ghost
      c.polyline([[6, 19], [6, 9], [10, 5], [14, 5], [18, 9], [18, 19], [15, 17], [12, 19], [9, 17]], 1.3, BLACK, true);
      c.floodFill(12, 12, WHITE);
      c.polyline([[6, 19], [6, 9], [10, 5], [14, 5], [18, 9], [18, 19], [15, 17], [12, 19], [9, 17]], 1.3, BLACK, true);
      c.brush(10, 10, 1.2, BLACK);
      c.brush(14, 10, 1.2, BLACK);
      break;
    case 'board-games-toys': // Red Die
      box(5, 5, 19, 19, hex('#ff4757'));
      for (const [px, py] of [[9, 9], [15, 9], [12, 12], [9, 15], [15, 15]]) {
        c.brush(px, py, 1.2, WHITE);
      }
      break;
    case 'dumb-laws': // Gavel
      box(6, 5, 15, 11, hex('#a6633c'));
      c.line(11, 11, 18, 18, 1.8, BLACK);
      c.line(11, 11, 18, 18, 0.9, hex('#d49a6a'));
      c.line(4, 19, 13, 19, 1.5, BLACK);
      break;
    case 'before-and-after': // Two linked blocks
      box(4, 7, 13, 16, hex('#00eeff'));
      box(11, 9, 20, 18, hex('#ff66e5'));
      break;
    case 'brands-logos': // Dollar tag
      box(5, 6, 19, 18, hex('#53e237'));
      c.polyline([[14, 9], [10, 9], [10, 12], [14, 12], [14, 15], [10, 15]], 1.0, BLACK, false);
      c.line(12, 8, 12, 16, 0.9, BLACK);
      break;
    case 'nostalgia-90s-00s': // VHS / Cassette
      box(3, 7, 21, 18, hex('#ffa502'));
      c.brush(8, 12, 2.0, BLACK);
      c.brush(16, 12, 2.0, BLACK);
      c.brush(8, 12, 0.9, WHITE);
      c.brush(16, 12, 0.9, WHITE);
      break;
    case 'custom': // Sparkling star pencil
    default:
      c.polyline([[12, 4], [14, 9], [20, 10], [15, 14], [17, 19], [12, 16], [7, 19], [9, 14], [4, 10], [10, 9]], 1.2, BLACK, true);
      c.floodFill(12, 12, hex('#ffd900'));
      c.polyline([[12, 4], [14, 9], [20, 10], [15, 14], [17, 19], [12, 16], [7, 19], [9, 14], [4, 10], [10, 9]], 1.2, BLACK, true);
      break;
  }
}

function buildCategoryIconsSheet() {
  const sheet = new PixelCanvas(CATEGORY_ICON_ORDER.length * 24, 24);
  CATEGORY_ICON_ORDER.forEach((key, idx) => {
    const icon = new PixelCanvas(24, 24);
    drawCatIcon(icon, key);
    sheet.blitFrom(icon, idx * 24, 0);
  });
  return sheet;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const assets = [
    ['logo-sheet.png', buildLogoSheet()],
    ['doodle-bg.png', buildDoodleWallpaper()],
    ['crown-strip.png', buildCrownStrip()],
    ['trophy-strip.png', buildTrophyStrip()],
    ['correct-strip.png', buildCorrectStrip()],
    ['wrong-strip.png', buildWrongStrip()],
    ['dd-star-strip.png', buildDailyDoubleStarStrip()],
    ['dice.png', buildDiceIcon()],
    ['clock.png', buildClockIcon()],
    ['buzzer-strip.png', buildBuzzerStrip()],
    ['confetti-strip.png', buildConfettiStrip()],
    ['loading-strip.png', buildLoadingStrip()],
    ['cat-icons-sheet.png', buildCategoryIconsSheet()],
  ];

  for (const [filename, canvas] of assets) {
    const outPath = path.join(OUT_DIR, filename);
    const pngBuf = canvas.toPNG();
    fs.writeFileSync(outPath, pngBuf);
    console.log(`Generated ${filename} (${canvas.width}x${canvas.height}, ${pngBuf.length} bytes)`);
  }
}

main();
