'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

/* =========================================================================
   ZERO-DEPENDENCY PNG ENCODER & MS PAINT PIXEL CANVAS
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

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function parseHex(hex) {
  if (!hex || hex === 'transparent') return [0, 0, 0, 0];
  if (Array.isArray(hex)) return hex;
  const h = hex.replace('#', '');
  if (h.length === 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      255,
    ];
  }
  if (h.length === 8) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      parseInt(h.slice(6, 8), 16),
    ];
  }
  return [0, 0, 0, 255];
}

class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4);
  }

  clear(color = 'transparent') {
    const [r, g, b, a] = parseHex(color);
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }

  setPixel(x, y, rgba) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
    const c = parseHex(rgba);
    if (c[3] === 0) return;
    const idx = (iy * this.width + ix) * 4;
    this.data[idx] = c[0];
    this.data[idx + 1] = c[1];
    this.data[idx + 2] = c[2];
    this.data[idx + 3] = c[3];
  }

  erasePixel(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
    const idx = (iy * this.width + ix) * 4;
    this.data[idx] = 0;
    this.data[idx + 1] = 0;
    this.data[idx + 2] = 0;
    this.data[idx + 3] = 0;
  }

  getPixel(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) {
      return [0, 0, 0, 0];
    }
    const idx = (iy * this.width + ix) * 4;
    return [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
  }

  // Hard-edged MS Paint circular brush (zero anti-aliasing!)
  brush(cx, cy, radius, color) {
    const rgba = parseHex(color);
    const r = Math.max(0, radius);
    const rSq = r * r + 0.25;
    const minX = Math.floor(cx - r);
    const maxX = Math.ceil(cx + r);
    const minY = Math.floor(cy - r);
    const maxY = Math.ceil(cy + r);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rSq) {
          this.setPixel(x, y, rgba);
        }
      }
    }
  }

  // Outlined circular dot (fill + 1px black outline)
  outlinedCircle(cx, cy, r, fillColor, outlineColor = '#000000') {
    this.brush(cx, cy, r + 1, outlineColor);
    this.brush(cx, cy, r, fillColor);
  }

  // Stepped MS Paint line with hard circular brush
  line(x0, y0, x1, y1, radius, color) {
    const rgba = parseHex(color);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1) * 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.brush(x0 + dx * t, y0 + dy * t, radius, rgba);
    }
  }

  polyline(pts, radius, color, closed = false) {
    for (let i = 0; i < pts.length - 1; i++) {
      this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], radius, color);
    }
    if (closed && pts.length > 2) {
      const last = pts[pts.length - 1];
      this.line(last[0], last[1], pts[0][0], pts[0][1], radius, color);
    }
  }

  // Filled polygon via scanline + crisp outline
  fillPolygon(pts, fillColor, outlineColor = '#000000', outlineRadius = 0.8) {
    if (pts.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) {
      if (y < minY) minY = Math.floor(y);
      if (y > maxY) maxY = Math.ceil(y);
    }
    const fill = parseHex(fillColor);
    for (let y = minY; y <= maxY; y++) {
      const nodes = [];
      let j = pts.length - 1;
      for (let i = 0; i < pts.length; i++) {
        const yi = pts[i][1];
        const yj = pts[j][1];
        const xi = pts[i][0];
        const xj = pts[j][0];
        if ((yi < y + 0.5 && yj >= y + 0.5) || (yj < y + 0.5 && yi >= y + 0.5)) {
          nodes.push(xi + ((y + 0.5 - yi) / (yj - yi)) * (xj - xi));
        }
        j = i;
      }
      nodes.sort((a, b) => a - b);
      for (let i = 0; i < nodes.length - 1; i += 2) {
        const xStart = Math.round(nodes[i]);
        const xEnd = Math.round(nodes[i + 1]);
        for (let x = xStart; x <= xEnd; x++) {
          this.setPixel(x, y, fill);
        }
      }
    }
    if (outlineColor) {
      this.polyline(pts, outlineRadius, outlineColor, true);
    }
  }

  quadCurve(x0, y0, cx, cy, x1, y1, radius, color) {
    const rgba = parseHex(color);
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

  ovalOutline(cx, cy, rx, ry, radius, color, wobbleAmt = 0, wobbleSeed = 0) {
    const steps = Math.max(28, Math.round((rx + ry) * 3));
    const pts = [];
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wob =
        wobbleAmt > 0
          ? Math.sin(a * 3 + wobbleSeed) * wobbleAmt +
            Math.cos(a * 5 - wobbleSeed * 1.7) * (wobbleAmt * 0.5)
          : 0;
      pts.push([cx + Math.cos(a) * (rx + wob), cy + Math.sin(a) * (ry + wob * 0.8)]);
    }
    this.polyline(pts, radius, color, true);
  }

  filledOval(cx, cy, rx, ry, fillColor, outlineColor = '#000000', outlineRadius = 0.9, wobbleAmt = 0.35, wobbleSeed = 1.0) {
    const fill = parseHex(fillColor);
    const minX = Math.floor(cx - rx - 2);
    const maxX = Math.ceil(cx + rx + 2);
    const minY = Math.floor(cy - ry - 2);
    const maxY = Math.ceil(cy + ry + 2);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const a = Math.atan2(dy, dx);
        const wob =
          wobbleAmt > 0
            ? Math.sin(a * 3 + wobbleSeed) * wobbleAmt +
              Math.cos(a * 5 - wobbleSeed * 1.7) * (wobbleAmt * 0.5)
            : 0;
        const erx = Math.max(1, rx + wob);
        const ery = Math.max(1, ry + wob * 0.8);
        if ((dx * dx) / (erx * erx) + (dy * dy) / (ery * ery) <= 1.0) {
          this.setPixel(x, y, fill);
        }
      }
    }
    if (outlineColor) {
      this.ovalOutline(cx, cy, rx, ry, outlineRadius, outlineColor, wobbleAmt, wobbleSeed);
    }
  }

  fillRect(x, y, w, h, color) {
    const rgba = parseHex(color);
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.round(x + w);
    const y1 = Math.round(y + h);
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.setPixel(px, py, rgba);
      }
    }
  }

  outlinedRect(x, y, w, h, fillColor, outlineColor = '#000000') {
    this.fillRect(x, y, w, h, outlineColor);
    if (w > 2 && h > 2) {
      this.fillRect(x + 1, y + 1, w - 2, h - 2, fillColor);
    }
  }

  // Pixel sparkle / 4-point star
  sparkle(cx, cy, arm, fillColor = '#ffd900', outlineColor = '#000000') {
    if (arm <= 1) {
      this.setPixel(cx, cy, fillColor);
      return;
    }
    if (outlineColor) {
      this.line(cx - arm, cy, cx + arm, cy, 0.9, outlineColor);
      this.line(cx, cy - arm, cx, cy + arm, 0.9, outlineColor);
    }
    this.line(cx - arm + 1, cy, cx + arm - 1, cy, 0.4, fillColor);
    this.line(cx, cy - arm + 1, cx, cy + arm - 1, 0.4, fillColor);
    this.setPixel(cx, cy, '#ffffff');
  }

  // Exact MS Paint Paint-Bucket Flood Fill
  floodFill(startX, startY, fillColor) {
    const sx = Math.round(startX);
    const sy = Math.round(startY);
    if (sx < 0 || sy < 0 || sx >= this.width || sy >= this.height) return;

    const target = this.getPixel(sx, sy);
    const replacement = parseHex(fillColor);
    if (
      target[0] === replacement[0] &&
      target[1] === replacement[1] &&
      target[2] === replacement[2] &&
      target[3] === replacement[3]
    ) {
      return;
    }

    const w = this.width;
    const h = this.height;
    const visited = new Uint8Array(w * h);
    const stack = [sx, sy];

    while (stack.length > 0) {
      const y = stack.pop();
      const x = stack.pop();
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const pIdx = y * w + x;
      if (visited[pIdx]) continue;

      const dIdx = pIdx * 4;
      if (
        this.data[dIdx] !== target[0] ||
        this.data[dIdx + 1] !== target[1] ||
        this.data[dIdx + 2] !== target[2] ||
        this.data[dIdx + 3] !== target[3]
      ) {
        continue;
      }

      visited[pIdx] = 1;
      this.data[dIdx] = replacement[0];
      this.data[dIdx + 1] = replacement[1];
      this.data[dIdx + 2] = replacement[2];
      this.data[dIdx + 3] = replacement[3];

      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
  }

  blitFrom(src, dstX, dstY) {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const rgba = src.getPixel(x, y);
        if (rgba[3] > 0) {
          this.setPixel(dstX + x, dstY + y, rgba);
        }
      }
    }
  }

  toPNG() {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8; // 8-bit depth
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

  save(filepath) {
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    const buf = this.toPNG();
    fs.writeFileSync(filepath, buf);
    return buf.length;
  }
}

/**
 * Helper to build a horizontal N-frame sprite strip PNG (`frameW * frames` x `frameH`)
 */
function buildHorizontalStrip(frameW, frameH, frameCount, drawFrameFn) {
  const sheet = new PixelCanvas(frameW * frameCount, frameH);
  for (let f = 0; f < frameCount; f++) {
    const cell = new PixelCanvas(frameW, frameH);
    drawFrameFn(cell, f);
    sheet.blitFrom(cell, f * frameW, 0);
  }
  return sheet;
}

module.exports = {
  PixelCanvas,
  parseHex,
  buildHorizontalStrip,
};
