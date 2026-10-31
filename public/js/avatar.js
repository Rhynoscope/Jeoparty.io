// Authentic MS Paint Pixel-Art Animated Avatar System
// Renders crisp un-antialiased 4-frame 52x52 pixel-art sprite strips into cached PNG data URLs.

export const AVATAR_COLORS = [
  { name: 'Red', fill: '#ff2b2b', shade: '#c91818', stripe: null },
  { name: 'Orange', fill: '#ff8800', shade: '#cc6600', stripe: null },
  { name: 'Yellow', fill: '#fff200', shade: '#ccb800', stripe: null },
  { name: 'Lime', fill: '#4ce619', shade: '#2fb30b', stripe: null },
  { name: 'Cyan', fill: '#00eeff', shade: '#00b5cc', stripe: null },
  { name: 'Blue', fill: '#335cff', shade: '#1d3bb8', stripe: null },
  { name: 'Purple', fill: '#9d1aff', shade: '#6f0db8', stripe: null },
  { name: 'Pink', fill: '#ff6be8', shade: '#cc47b6', stripe: null },
  { name: 'Mint', fill: '#19e699', shade: '#0fb375', stripe: null },
  { name: 'Salmon', fill: '#ff7b7b', shade: '#cc5656', stripe: null },
  { name: 'Grey', fill: '#8a8f9e', shade: '#636875', stripe: null },
  { name: 'Charcoal', fill: '#454954', shade: '#2b2e36', stripe: null },
  { name: 'Brown', fill: '#8f5738', shade: '#693d24', stripe: null },
  { name: 'Peach', fill: '#f2c89b', shade: '#c79e73', stripe: null },
  { name: 'White', fill: '#ffffff', shade: '#cfd5e6', stripe: null },
  // Fun Skribbl-style diagonal striped MS Paint skins (inspired by reference sheet!)
  { name: 'Candy Red Stripe', fill: '#e61919', shade: '#9e0b0b', stripe: '#ff5959' },
  { name: 'Gold Stripe', fill: '#ffd000', shade: '#bd9200', stripe: '#fff566' },
  { name: 'Lime Stripe', fill: '#42cc14', shade: '#298f08', stripe: '#7aff4d' },
  { name: 'Cyber Cyan Stripe', fill: '#00c8ff', shade: '#008eb8', stripe: '#75ebff' },
  { name: 'Grape Stripe', fill: '#a633ff', shade: '#7319bd', stripe: '#ce85ff' },
];

export const EYE_COUNT = 16;
export const MOUTH_COUNT = 16;
export const HAT_COUNT = 11;

const FRAME_W = 52;
const FRAME_H = 52;
const FRAME_COUNT = 4;

const spriteUrlCache = new Map();

function hexToRgba(h) {
  const s = h.replace('#', '');
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
    255,
  ];
}

const BLACK = [0, 0, 0, 255];
const WHITE = [255, 255, 255, 255];
const RED = [255, 42, 42, 255];
const PINK = [255, 105, 180, 255];
const GOLD = [255, 217, 0, 255];
const CYAN = [0, 238, 255, 255];
const LIME = [71, 230, 46, 255];

class MiniPixelGrid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.buf = new Uint8ClampedArray(w * h * 4);
  }

  px(x, y, rgba) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return;
    const o = (iy * this.w + ix) * 4;
    this.buf[o] = rgba[0];
    this.buf[o + 1] = rgba[1];
    this.buf[o + 2] = rgba[2];
    this.buf[o + 3] = rgba[3];
  }

  get(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return [0, 0, 0, 0];
    const o = (iy * this.w + ix) * 4;
    return [this.buf[o], this.buf[o + 1], this.buf[o + 2], this.buf[o + 3]];
  }

  brush(cx, cy, r, rgba) {
    const ix = Math.round(cx);
    const iy = Math.round(cy);
    const rc = Math.ceil(r);
    const rSq = r * r + 0.22;
    for (let dy = -rc; dy <= rc; dy++) {
      for (let dx = -rc; dx <= rc; dx++) {
        if (dx * dx + dy * dy <= rSq) {
          this.px(ix + dx, iy + dy, rgba);
        }
      }
    }
  }

  line(x0, y0, x1, y1, r, rgba) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.brush(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, rgba);
    }
  }

  poly(pts, r, rgba, closed = false) {
    for (let i = 0; i < pts.length - 1; i++) {
      this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r, rgba);
    }
    if (closed && pts.length > 2) {
      const last = pts[pts.length - 1];
      this.line(last[0], last[1], pts[0][0], pts[0][1], r, rgba);
    }
  }

  oval(cx, cy, rx, ry, r, rgba, wobble = 0) {
    const steps = 40;
    let prev = null;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const w = wobble ? Math.sin(a * 3 + wobble) * 0.45 : 0;
      const x = cx + Math.cos(a) * (rx + w);
      const y = cy + Math.sin(a) * (ry - w * 0.4);
      if (prev) this.line(prev[0], prev[1], x, y, r, rgba);
      prev = [x, y];
    }
  }

  rect(x, y, w, h, rgba) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.px(px, py, rgba);
      }
    }
  }

  floodFill(sx, sy, fillRgba, stripeRgba = null, shadeRgba = null, shadeY = 999) {
    const startX = Math.round(sx);
    const startY = Math.round(sy);
    if (startX < 0 || startY < 0 || startX >= this.w || startY >= this.h) return;
    const target = this.get(startX, startY);
    // Never overwrite black ink outlines via floodFill!
    if (target[3] === 255 && target[0] === 0 && target[1] === 0 && target[2] === 0) {
      return;
    }
    if (
      target[0] === fillRgba[0] &&
      target[1] === fillRgba[1] &&
      target[2] === fillRgba[2] &&
      target[3] === fillRgba[3]
    ) {
      return;
    }

    const visited = new Uint8Array(this.w * this.h);
    const stack = [[startX, startY]];
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
      const idx = y * this.w + x;
      if (visited[idx]) continue;
      const o = idx * 4;
      if (
        this.buf[o] !== target[0] ||
        this.buf[o + 1] !== target[1] ||
        this.buf[o + 2] !== target[2] ||
        this.buf[o + 3] !== target[3]
      ) {
        continue;
      }
      visited[idx] = 1;

      let chosen = fillRgba;
      if (shadeRgba && y >= shadeY) {
        chosen = shadeRgba;
      } else if (stripeRgba && ((x + y) % 7 < 3)) {
        chosen = stripeRgba;
      }
      this.px(x, y, chosen);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }
}

/* =========================================================================
   DISTINCT BODY SHAPES, EYES, MOUTHS & HATS (MS PAINT PIXEL BRUSH)
   ========================================================================= */

function drawBodyAndHead(g, palette, shapeVariant, bobY, boilSeed) {
  const fill = hexToRgba(palette.fill);
  const shade = hexToRgba(palette.shade);
  const stripe = palette.stripe ? hexToRgba(palette.stripe) : null;

  // Shoulders bust (exact Skribbl dome shoulders!)
  const shPts = [
    [8, 50],
    [10, 43 + bobY],
    [16, 39 + bobY],
    [26, 38 + bobY],
    [36, 39 + bobY],
    [42, 43 + bobY],
    [44, 50],
  ];
  g.poly(shPts, 1.4, BLACK, true);
  g.floodFill(26, 46, fill, stripe, shade, 48);
  g.poly(shPts, 1.4, BLACK, true);

  // Distinct head shapes so avatars have unique silhouettes, not just recolors!
  const v = shapeVariant % 5;
  if (v === 1) {
    // Chonky square-ish doodle blockhead
    const headPts = [
      [14, 15 + bobY],
      [38, 14 + bobY],
      [40, 26 + bobY],
      [38, 37 + bobY],
      [14, 37 + bobY],
      [12, 26 + bobY],
    ];
    g.poly(headPts, 1.5, BLACK, true);
    g.floodFill(26, 26 + bobY, fill, stripe, shade, 35 + bobY);
    g.poly(headPts, 1.5, BLACK, true);
  } else if (v === 2) {
    // Chubby wide pear cheeks
    g.oval(26, 26 + bobY, 15, 12.5, 1.5, BLACK, 1.1 + boilSeed);
    g.floodFill(26, 26 + bobY, fill, stripe, shade, 35 + bobY);
    g.oval(26, 26 + bobY, 15, 12.5, 1.5, BLACK, 1.1 + boilSeed);
  } else if (v === 3) {
    // Tall trivia-egghead
    g.oval(26, 25 + bobY, 12.5, 14, 1.5, BLACK, 2.2 + boilSeed);
    g.floodFill(26, 25 + bobY, fill, stripe, shade, 36 + bobY);
    g.oval(26, 25 + bobY, 12.5, 14, 1.5, BLACK, 2.2 + boilSeed);
  } else if (v === 4) {
    // Cute bean with little side tuft/ears outline wobble
    g.oval(26, 26 + bobY, 13.8, 13, 1.5, BLACK, 3.4 + boilSeed);
    g.floodFill(26, 26 + bobY, fill, stripe, shade, 36 + bobY);
    g.oval(26, 26 + bobY, 13.8, 13, 1.5, BLACK, 3.4 + boilSeed);
  } else {
    // Classic Skribbl round doodle head
    g.oval(26, 26 + bobY, 13.5, 13, 1.5, BLACK, 0.5 + boilSeed);
    g.floodFill(26, 26 + bobY, fill, stripe, shade, 36 + bobY);
    g.oval(26, 26 + bobY, 13.5, 13, 1.5, BLACK, 0.5 + boilSeed);
  }
}

function drawEyes(g, eyesIdx, bobY, isBlinkFrame, frameIdx) {
  const idx = ((eyesIdx % EYE_COUNT) + EYE_COUNT) % EYE_COUNT;
  const ey = 23 + bobY;

  // Blink frame for open-eye styles (sunglasses & $-eyes glint instead!)
  if (isBlinkFrame && idx !== 7 && idx !== 9) {
    g.line(17, ey, 23, ey, 1.1, BLACK);
    g.line(29, ey, 35, ey, 1.1, BLACK);
    return;
  }

  switch (idx) {
    case 0: // Classic MS Paint chunky dot eyes
      g.brush(20, ey, 2.1, BLACK);
      g.brush(32, ey, 2.1, BLACK);
      break;
    case 1: // Wide white eyes looking sideways (shift pupil slightly on frame 2!)
      {
        const lookX = frameIdx === 2 ? 0 : 1;
        g.oval(20, ey, 3.8, 3.8, 1.1, BLACK);
        g.floodFill(20, ey, WHITE);
        g.oval(32, ey, 3.8, 3.8, 1.1, BLACK);
        g.floodFill(32, ey, WHITE);
        g.brush(20 + lookX, ey, 1.4, BLACK);
        g.brush(32 + lookX, ey, 1.4, BLACK);
      }
      break;
    case 2: // Confused / Goofy uneven derp eyes (one big, one small, opposite pupils!)
      g.oval(19, ey, 4.3, 4.3, 1.1, BLACK);
      g.floodFill(19, ey, WHITE);
      g.oval(32, ey, 3.0, 3.0, 1.1, BLACK);
      g.floodFill(32, ey, WHITE);
      g.brush(18, ey - 1, 1.3, BLACK);
      g.brush(33, ey + 1, 1.2, BLACK);
      break;
    case 3: // Angry fierce V-brows!
      g.oval(20, ey + 1, 3.4, 3.2, 1.1, BLACK);
      g.floodFill(20, ey + 1, WHITE);
      g.oval(32, ey + 1, 3.4, 3.2, 1.1, BLACK);
      g.floodFill(32, ey + 1, WHITE);
      g.brush(21, ey + 1, 1.3, BLACK);
      g.brush(31, ey + 1, 1.3, BLACK);
      g.line(15, ey - 4, 24, ey - 1, 1.4, BLACK);
      g.line(37, ey - 4, 28, ey - 1, 1.4, BLACK);
      break;
    case 4: // Sleepy half-lidded droopy eyes (+ tiny floating pixel Z!)
      g.line(16, ey, 24, ey, 1.3, BLACK);
      g.line(28, ey, 36, ey, 1.3, BLACK);
      g.brush(20, ey + 2, 1.3, BLACK);
      g.brush(32, ey + 2, 1.3, BLACK);
      if (frameIdx === 1 || frameIdx === 2) {
        const zy = frameIdx === 2 ? ey - 9 : ey - 7;
        g.line(38, zy, 41, zy, 0.6, BLACK);
        g.line(41, zy, 38, zy + 3, 0.6, BLACK);
        g.line(38, zy + 3, 41, zy + 3, 0.6, BLACK);
      }
      break;
    case 5: // Cheerful ^ ^ happy squints
      g.line(17, ey + 1, 20, ey - 2, 1.3, BLACK);
      g.line(20, ey - 2, 23, ey + 1, 1.3, BLACK);
      g.line(29, ey + 1, 32, ey - 2, 1.3, BLACK);
      g.line(32, ey - 2, 35, ey + 1, 1.3, BLACK);
      break;
    case 6: // Shocked huge white O-eyes with tiny pinpoint pupils
      g.oval(20, ey, 4.4, 4.4, 1.1, BLACK);
      g.floodFill(20, ey, WHITE);
      g.oval(32, ey, 4.4, 4.4, 1.1, BLACK);
      g.floodFill(32, ey, WHITE);
      g.px(20, ey, BLACK);
      g.px(32, ey, BLACK);
      break;
    case 7: // Cool MS Paint Pixel Sunglasses (glint shifts on blink frame!)
      g.line(13, ey - 2, 39, ey - 2, 1.3, BLACK);
      g.rect(15, ey - 2, 9, 6, BLACK);
      g.rect(28, ey - 2, 9, 6, BLACK);
      {
        const gx = isBlinkFrame ? 2 : 0;
        g.line(17 + gx, ey, 19 + gx, ey, 0.8, WHITE);
        g.line(30 + gx, ey, 32 + gx, ey, 0.8, WHITE);
      }
      break;
    case 8: // Dizzy X X cartoon eyes
      g.line(17, ey - 3, 23, ey + 3, 1.2, BLACK);
      g.line(23, ey - 3, 17, ey + 3, 1.2, BLACK);
      g.line(29, ey - 3, 35, ey + 3, 1.2, BLACK);
      g.line(35, ey - 3, 29, ey + 3, 1.2, BLACK);
      break;
    case 9: // Jeopardy $ $ Money Eyes!
      {
        const col = isBlinkFrame ? GOLD : LIME;
        for (const cx of [20, 32]) {
          g.oval(cx, ey, 4.2, 4.2, 1.1, BLACK);
          g.floodFill(cx, ey, WHITE);
          g.line(cx, ey - 3, cx, ey + 3, 0.7, BLACK);
          g.px(cx - 1, ey - 1, col);
          g.px(cx, ey, col);
          g.px(cx + 1, ey + 1, col);
        }
      }
      break;
    case 10: // Sad / Puppy pleading eyes with tilted worried brows
      g.brush(20, ey + 1, 2.5, BLACK);
      g.brush(32, ey + 1, 2.5, BLACK);
      g.px(19, ey, WHITE);
      g.px(31, ey, WHITE);
      g.line(16, ey - 2, 22, ey - 4, 1.1, BLACK);
      g.line(36, ey - 2, 30, ey - 4, 1.1, BLACK);
      break;
    case 11: // Posh Monocle Scholar
      g.brush(20, ey, 1.9, BLACK);
      g.oval(32, ey, 4.6, 4.6, 1.2, BLACK);
      g.floodFill(32, ey, CYAN);
      g.oval(32, ey, 4.6, 4.6, 1.1, BLACK);
      g.brush(32, ey, 1.4, BLACK);
      g.line(37, ey + 2, 37, ey + 11, 0.8, BLACK);
      break;
    case 12: // Pirate Eyepatch!
      g.line(14, ey - 4, 38, ey - 1, 1.1, BLACK);
      g.brush(20, ey, 2.0, BLACK);
      g.brush(32, ey, 3.6, BLACK);
      break;
    case 13: // Heart-struck pixel eyes!
      for (const cx of [20, 32]) {
        g.brush(cx - 1.5, ey - 1, 1.8, BLACK);
        g.brush(cx + 1.5, ey - 1, 1.8, BLACK);
        g.brush(cx, ey + 1, 2.0, BLACK);
        g.brush(cx - 1, ey - 1, 1.0, RED);
        g.brush(cx + 1, ey - 1, 1.0, RED);
        g.px(cx, ey + 1, RED);
      }
      break;
    case 14: // Cheeky Wink ;)
      g.brush(20, ey, 2.1, BLACK);
      g.line(29, ey - 2, 34, ey, 1.2, BLACK);
      g.line(34, ey, 29, ey + 2, 1.2, BLACK);
      break;
    case 15: // Suspicious flat squint `-  -`
    default:
      g.rect(16, ey - 1, 7, 3, BLACK);
      g.rect(29, ey - 1, 7, 3, BLACK);
      break;
  }
}

function drawMouth(g, mouthIdx, bobY, frameIdx) {
  const idx = ((mouthIdx % MOUTH_COUNT) + MOUTH_COUNT) % MOUTH_COUNT;
  const my = 31 + bobY;
  const chatter = frameIdx === 1 ? 1 : 0;

  switch (idx) {
    case 0: // Classic Skribbl boxy white buck-teeth grin
      g.rect(19, my - 2, 14, 6 + chatter, BLACK);
      g.rect(21, my, 10, 2 + chatter, WHITE);
      g.line(26, my - 1, 26, my + 2 + chatter, 0.8, BLACK);
      break;
    case 1: // Big cheerful open D-smile with red pixel tongue
      g.poly([[18, my - 1], [34, my - 1], [32, my + 5 + chatter], [20, my + 5 + chatter]], 1.2, BLACK, true);
      g.floodFill(26, my + 2, BLACK);
      g.rect(23, my + 2 + chatter, 6, 2, RED);
      break;
    case 2: // Confused wobbly squiggle `~`
      g.poly([[18, my + 1], [22, my - 1 + chatter], [26, my + 2], [30, my - 1], [34, my + 1 - chatter]], 1.2, BLACK);
      break;
    case 3: // Grumpy frown
      g.poly([[19, my + 3], [23, my], [29, my], [33, my + 3]], 1.3, BLACK);
      break;
    case 4: // Cute Cat `:3` mouth
      g.poly([[19, my], [23, my + 3], [26, my], [29, my + 3], [33, my]], 1.2, BLACK);
      break;
    case 5: // Surprised little `o` mouth (pulses slightly!)
      g.brush(26, my + 1, 2.8 + chatter * 0.6, BLACK);
      g.brush(26, my + 1, 1.1 + chatter * 0.4, RED);
      break;
    case 6: // Silly sticking-out tongue `:P`
      g.line(19, my, 33, my, 1.3, BLACK);
      g.rect(25, my + 1, 6, 5 + chatter, BLACK);
      g.rect(26, my + 1, 4, 3 + chatter, PINK);
      break;
    case 7: // Zigzag shark / gremlin grin
      g.rect(18, my - 2, 16, 6, BLACK);
      g.poly([[19, my + 1], [22, my - 1], [25, my + 2], [28, my - 1], [31, my + 2], [33, my]], 0.9, WHITE);
      break;
    case 8: // Deadpan straight line
      g.line(20, my + 1, 32, my + 1, 1.3, BLACK);
      break;
    case 9: // Dapper Game-Show Host Mustache!
      g.poly([[16, my + 2 - chatter], [21, my - 1], [26, my + 1], [31, my - 1], [36, my + 2 - chatter]], 1.9, BLACK);
      break;
    case 10: // Goofy twin nerd buck teeth
      g.line(19, my, 33, my, 1.3, BLACK);
      g.rect(22, my + 1, 8, 5, BLACK);
      g.rect(23, my + 1, 2, 3, WHITE);
      g.rect(27, my + 1, 2, 3, WHITE);
      break;
    case 11: // Cheeky side smirk
      g.poly([[20, my + 2], [28, my + 2], [33, my - 2 - chatter]], 1.3, BLACK);
      break;
    case 12: // Wide shocked rectangle scream
      g.rect(20, my - 2, 12, 7 + chatter, BLACK);
      g.rect(22, my - 1, 8, 2, WHITE);
      break;
    case 13: // Whiskered cat grin (inspired by bottom-right of mouths sheet!)
      g.poly([[23, my + 2], [26, my - 1], [29, my + 2]], 1.2, BLACK);
      g.line(13, my - 1, 19, my, 0.9, BLACK);
      g.line(13, my + 3, 19, my + 2, 0.9, BLACK);
      g.line(39, my - 1, 33, my, 0.9, BLACK);
      g.line(39, my + 3, 33, my + 2, 0.9, BLACK);
      break;
    case 14: // Stitched Halloween doodle mouth
      g.line(19, my + 1, 33, my + 1, 1.1, BLACK);
      for (const sx of [21, 25, 29, 31]) {
        g.line(sx, my - 1, sx, my + 3, 0.8, BLACK);
      }
      break;
    case 15: // Simple happy U-smile
    default:
      g.poly([[19, my - 1], [23, my + 3 + chatter], [29, my + 3 + chatter], [33, my - 1]], 1.3, BLACK);
      break;
  }
}

function drawHatOrCrown(g, hatIdx, showCrown, bobY, frameIdx) {
  // Winner / Host gold crown takes pride of place!
  if (showCrown) {
    const cy = 4 + bobY;
    const pts = [
      [18, cy + 10],
      [16, cy + 2],
      [22, cy + 7],
      [27, cy],
      [32, cy + 7],
      [38, cy + 2],
      [35, cy + 11],
    ];
    g.poly(pts, 1.3, BLACK, true);
    g.floodFill(27, cy + 7, GOLD);
    g.poly(pts, 1.2, BLACK, true);
    g.brush(27, cy + 7, 1.2, frameIdx % 2 === 0 ? RED : CYAN);
    return;
  }

  const idx = ((hatIdx % HAT_COUNT) + HAT_COUNT) % HAT_COUNT;
  if (idx === 0) return; // No hat

  const hy = 5 + bobY;
  switch (idx) {
    case 1: // Party Cone Hat
      g.poly([[20, hy + 10], [26, hy], [32, hy + 10]], 1.3, BLACK, true);
      g.floodFill(26, hy + 7, CYAN);
      g.poly([[20, hy + 10], [26, hy], [32, hy + 10]], 1.2, BLACK, true);
      g.brush(26, hy, 1.8, GOLD);
      break;
    case 2: // Pizza Slice Hat! (Directly from Skribbl hat sheet!)
      g.poly([[19, hy + 3], [33, hy + 5], [25, hy + 13]], 1.3, BLACK, true);
      g.floodFill(26, hy + 7, GOLD);
      g.poly([[19, hy + 3], [33, hy + 5], [25, hy + 13]], 1.2, BLACK, true);
      g.px(25, hy + 7, RED);
      g.px(28, hy + 8, RED);
      break;
    case 3: // Little Devil Horns
      g.poly([[13, hy + 11], [11, hy + 2], [20, hy + 8]], 1.2, BLACK, true);
      g.floodFill(15, hy + 7, RED);
      g.poly([[13, hy + 11], [11, hy + 2], [20, hy + 8]], 1.2, BLACK, true);
      g.poly([[39, hy + 11], [41, hy + 2], [32, hy + 8]], 1.2, BLACK, true);
      g.floodFill(37, hy + 7, RED);
      g.poly([[39, hy + 11], [41, hy + 2], [32, hy + 8]], 1.2, BLACK, true);
      break;
    case 4: // Floating Golden Angel Halo
      {
        const floatY = frameIdx === 1 ? -1 : 0;
        g.oval(26, hy + 2 + floatY, 8, 2.6, 1.7, BLACK);
        g.oval(26, hy + 2 + floatY, 8, 2.6, 0.9, GOLD);
      }
      break;
    case 5: // Cat Ears
      g.poly([[14, hy + 11], [15, hy + 2], [22, hy + 8]], 1.3, BLACK, true);
      g.floodFill(17, hy + 7, PINK);
      g.poly([[14, hy + 11], [15, hy + 2], [22, hy + 8]], 1.2, BLACK, true);
      g.poly([[38, hy + 11], [37, hy + 2], [30, hy + 8]], 1.3, BLACK, true);
      g.floodFill(35, hy + 7, PINK);
      g.poly([[38, hy + 11], [37, hy + 2], [30, hy + 8]], 1.2, BLACK, true);
      break;
    case 6: // Purple Wizard Hat
      g.poly([[19, hy + 9], [27, hy - 1], [33, hy + 9]], 1.3, BLACK, true);
      g.floodFill(26, hy + 6, hexToRgba('#7d2ae8'));
      g.poly([[19, hy + 9], [27, hy - 1], [33, hy + 9]], 1.3, BLACK, true);
      g.line(13, hy + 10, 39, hy + 10, 1.8, BLACK);
      break;
    case 7: // Spiky Cyan Anime/Scientist Hair
      g.poly(
        [[14, hy + 10], [11, hy + 2], [19, hy + 6], [26, hy - 1], [33, hy + 6], [41, hy + 2], [38, hy + 10]],
        1.3,
        BLACK,
        true
      );
      g.floodFill(26, hy + 6, CYAN);
      g.poly(
        [[14, hy + 10], [11, hy + 2], [19, hy + 6], [26, hy - 1], [33, hy + 6], [41, hy + 2], [38, hy + 10]],
        1.2,
        BLACK,
        true
      );
      break;
    case 8: // Pirate Hat
      g.poly([[12, hy + 10], [18, hy + 2], [34, hy + 2], [40, hy + 10]], 1.3, BLACK, true);
      g.floodFill(26, hy + 6, hexToRgba('#2b2d42'));
      g.poly([[12, hy + 10], [18, hy + 2], [34, hy + 2], [40, hy + 10]], 1.3, BLACK, true);
      g.brush(26, hy + 6, 1.3, WHITE);
      break;
    case 9: // Leafy Green Sprout!
      g.line(26, hy + 9, 26, hy + 3, 1.2, BLACK);
      g.oval(22, hy + 3, 3.5, 2, 1.1, BLACK);
      g.floodFill(22, hy + 3, LIME);
      g.oval(30, hy + 3, 3.5, 2, 1.1, BLACK);
      g.floodFill(30, hy + 3, LIME);
      break;
    case 10: // Rainbow Headband
    default:
      g.oval(26, hy + 9, 10, 5, 2.2, BLACK);
      g.oval(26, hy + 9, 10, 5, 1.1, RED);
      g.oval(26, hy + 10, 9, 4, 0.9, GOLD);
      break;
  }
}

function drawPixelStar(g, cx, cy, arm, fillCol) {
  g.line(cx - arm, cy, cx + arm, cy, 1.1, BLACK);
  g.line(cx, cy - arm, cx, cy + arm, 1.1, BLACK);
  g.line(cx - arm + 1, cy, cx + arm - 1, cy, 0.7, fillCol);
  g.line(cx, cy - arm + 1, cx, cy + arm - 1, 0.7, fillCol);
  g.px(cx, cy, WHITE);
}

function drawMoodEffects(g, palette, mood, bobY, f) {
  const fill = hexToRgba(palette.fill);
  if (mood === 'happy') {
    // Rosy pixel cheeks + twinkling stars
    g.brush(15, 27 + bobY, 1.4, PINK);
    g.brush(37, 27 + bobY, 1.4, PINK);
    const s1y = f % 2 === 0 ? 11 : 9;
    const s2y = f % 2 === 0 ? 14 : 16;
    drawPixelStar(g, 7, s1y, f % 2 === 0 ? 3 : 2, GOLD);
    drawPixelStar(g, 45, s2y, f % 2 === 1 ? 3 : 2, LIME);
  } else if (mood === 'excited') {
    // Comic MS Paint excitement action lines flashing around head
    const off = f % 2 === 0 ? 0 : 2;
    g.line(4, 15 + off, 9, 18 + off, 1.3, BLACK);
    g.line(4, 15 + off, 8, 17 + off, 0.8, GOLD);
    g.line(48, 15 + (2 - off), 43, 18 + (2 - off), 1.3, BLACK);
    g.line(48, 15 + (2 - off), 44, 17 + (2 - off), 0.8, GOLD);
    if (f === 1 || f === 3) {
      g.line(5, 27, 9, 27, 1.2, BLACK);
      g.line(5, 27, 8, 27, 0.8, CYAN);
      g.line(47, 27, 43, 27, 1.2, BLACK);
      g.line(47, 27, 44, 27, 0.8, CYAN);
    }
  } else if (mood === 'sad') {
    // Animated falling blue pixel teardrop down cheek across 4 frames
    const dropY = 25 + bobY + f * 3;
    g.brush(36, dropY, 2.0, BLACK);
    g.px(36, dropY - 2, BLACK);
    g.brush(36, dropY, 1.1, CYAN);
  } else if (mood === 'victory') {
    // Cheering little MS Paint hands waving + confetti stars
    const handWaveL = f % 2 === 0 ? -3 : 0;
    const handWaveR = f % 2 === 1 ? -3 : 0;
    g.oval(7, 36 + bobY + handWaveL, 3.2, 3.2, 1.2, BLACK);
    g.floodFill(7, 36 + bobY + handWaveL, fill);
    g.oval(45, 36 + bobY + handWaveR, 3.2, 3.2, 1.2, BLACK);
    g.floodFill(45, 36 + bobY + handWaveR, fill);
    drawPixelStar(g, 7, 10 + (f % 2) * 2, 3, GOLD);
    drawPixelStar(g, 45, 12 - (f % 2) * 2, 3, CYAN);
    g.rect(11, 5 + ((f * 3) % 7), 2, 2, PINK);
    g.rect(41, 6 + (((f + 2) * 3) % 7), 2, 2, LIME);
  } else if (mood === 'defeat') {
    // Orbiting dizzy stars + sweat drop
    const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    const a1 = angles[f];
    const a2 = angles[(f + 2) % 4];
    const sx1 = Math.round(26 + Math.cos(a1) * 14);
    const sy1 = Math.round(9 + Math.sin(a1) * 3);
    const sx2 = Math.round(26 + Math.cos(a2) * 14);
    const sy2 = Math.round(9 + Math.sin(a2) * 3);
    drawPixelStar(g, sx1, sy1, 2, GOLD);
    drawPixelStar(g, sx2, sy2, 2, CYAN);
  } else if (mood === 'speaking') {
    // Animated MS Paint green voice waves beside mouth
    g.line(42, 26 + bobY, 42, 30 + bobY, 1.3, BLACK);
    g.line(42, 26 + bobY, 42, 30 + bobY, 0.8, LIME);
    if (f >= 1) {
      g.poly([[45, 23 + bobY], [46, 28 + bobY], [45, 33 + bobY]], 1.3, BLACK);
      g.poly([[45, 23 + bobY], [46, 28 + bobY], [45, 33 + bobY]], 0.8, LIME);
    }
    if (f === 2 || f === 3) {
      g.poly([[48, 20 + bobY], [50, 28 + bobY], [48, 36 + bobY]], 1.3, BLACK);
      g.poly([[48, 20 + bobY], [50, 28 + bobY], [48, 36 + bobY]], 0.8, LIME);
    }
  }
}

const VALID_MOODS = new Set([
  'idle',
  'happy',
  'sad',
  'excited',
  'victory',
  'defeat',
  'speaking',
]);

export function getSpriteStripUrl(avatar = {}, showCrown = false, mood = 'idle') {
  const safeMood = VALID_MOODS.has(mood) ? mood : 'idle';
  const effectiveCrown = Boolean(showCrown || safeMood === 'victory');
  const cIdx =
    (((Number(avatar.color) || 0) % AVATAR_COLORS.length) + AVATAR_COLORS.length) %
    AVATAR_COLORS.length;
  const eIdx = (((Number(avatar.eyes) || 0) % EYE_COUNT) + EYE_COUNT) % EYE_COUNT;
  const mIdx = (((Number(avatar.mouth) || 0) % MOUTH_COUNT) + MOUTH_COUNT) % MOUTH_COUNT;
  const hIdx = (((Number(avatar.hat) || 0) % HAT_COUNT) + HAT_COUNT) % HAT_COUNT;
  const key = `${cIdx}:${eIdx}:${mIdx}:${hIdx}:${effectiveCrown ? 1 : 0}:${safeMood}`;

  if (spriteUrlCache.has(key)) {
    return spriteUrlCache.get(key);
  }

  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * FRAME_COUNT;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const palette = AVATAR_COLORS[cIdx];
  const shapeVariant = (cIdx + eIdx * 2 + hIdx) % 5;

  const BOB_BY_MOOD = {
    idle: [0, -1, 0, 0],
    happy: [0, -2, 0, -1],
    excited: [0, -2, -1, -3],
    sad: [1, 1, 2, 1],
    victory: [-3, -1, -2, 0],
    defeat: [1, 2, 1, 2],
    speaking: [0, -1, 0, -1],
  };

  for (let f = 0; f < FRAME_COUNT; f++) {
    const grid = new MiniPixelGrid(FRAME_W, FRAME_H);
    const bobY = (BOB_BY_MOOD[safeMood] || BOB_BY_MOOD.idle)[f];
    const boilSeed = f * 0.85;
    const isBlink = safeMood === 'idle' && f === 3;

    // Expressive mood face overrides while keeping sunglasses/special traits recognizable
    let frameEyes = eIdx;
    let frameMouth = mIdx;
    if (safeMood === 'happy' || safeMood === 'victory') {
      if (eIdx !== 7 && eIdx !== 9 && eIdx !== 13) frameEyes = f % 2 === 0 ? 5 : eIdx;
      frameMouth = 1;
    } else if (safeMood === 'excited') {
      if (eIdx !== 7) frameEyes = 6;
      frameMouth = f % 2 === 0 ? 1 : 12;
    } else if (safeMood === 'sad') {
      if (eIdx !== 7) frameEyes = 10;
      frameMouth = 3;
    } else if (safeMood === 'defeat') {
      frameEyes = 8;
      frameMouth = 2;
    } else if (safeMood === 'speaking') {
      frameMouth = f % 2 === 0 ? 1 : 5;
    }

    drawBodyAndHead(grid, palette, shapeVariant, bobY, boilSeed);
    drawEyes(grid, frameEyes, bobY, isBlink, f);
    drawMouth(grid, frameMouth, bobY, f);
    drawHatOrCrown(grid, hIdx, effectiveCrown, bobY, f);
    drawMoodEffects(grid, palette, safeMood, bobY, f);

    const imgData = new ImageData(grid.buf, FRAME_W, FRAME_H);
    ctx.putImageData(imgData, f * FRAME_W, 0);
  }

  const url = canvas.toDataURL('image/png');
  // Cap cache size safely
  if (spriteUrlCache.size > 600) {
    const firstKey = spriteUrlCache.keys().next().value;
    spriteUrlCache.delete(firstKey);
  }
  spriteUrlCache.set(key, url);
  return url;
}

/**
 * Returns HTML string for an animated MS Paint pixel-art avatar element.
 */
export function buildAvatarHTML(avatar = {}, options = {}) {
  const size = Number(options.size) || 88;
  const showCrown = Boolean(options.crown);
  const mood = VALID_MOODS.has(options.mood) ? options.mood : 'idle';
  const delaySec =
    typeof options.delaySec === 'number'
      ? options.delaySec
      : mood === 'idle'
      ? (((Number(avatar.color) || 0) * 0.37 + (Number(avatar.eyes) || 0) * 0.23) % 2.4)
      : 0;

  const url = getSpriteStripUrl(avatar, showCrown, mood);
  return `<span class="pixel-avatar mood-${mood}" data-mood="${mood}" style="--av-size:${size}px; --av-delay:-${delaySec.toFixed(2)}s; background-image:url('${url}');" aria-hidden="true"></span>`;
}

// Keep buildAvatarSVG alias pointing to buildAvatarHTML so any existing callers stay seamless
export const buildAvatarSVG = buildAvatarHTML;

export function randomAvatar() {
  return {
    color: Math.floor(Math.random() * AVATAR_COLORS.length),
    eyes: Math.floor(Math.random() * EYE_COUNT),
    mouth: Math.floor(Math.random() * MOUTH_COUNT),
    hat: Math.random() < 0.35 ? 0 : Math.floor(Math.random() * HAT_COUNT),
  };
}
