'use strict';

const path = require('node:path');
const { PixelCanvas, buildHorizontalStrip } = require('../pixel-canvas');
const { BUILTIN_CATEGORIES } = require('../../server/categoriesData');

const B = '#000000';
const W = '#ffffff';
const Y = '#ffd900';
const O = '#ff8c1a';
const R = '#ff3b3b';
const G = '#53e237';
const GD = '#239e14';
const C = '#33d9ff';
const BL = '#2c99e6';
const P = '#a259ff';
const PK = '#ff7eb9';
const BR = '#9c5a25';
const BR_L = '#d4945a';
const GR = '#b5bcc9';
const GR_D = '#5e6678';

const CATEGORY_DRAWERS = {
  // 01. INTERNET LORE & MEMES — Cool pixel meme smiley with sunglasses glint
  'internet-memes'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.filledOval(12, 12 + dy, 9, 9, Y, B, 0.9, 0.3, f);
    c.line(4, 9 + dy, 20, 9 + dy, 0.9, B);
    c.fillRect(5, 9 + dy, 6, 4, B);
    c.fillRect(13, 9 + dy, 6, 4, B);
    c.line(6 + f, 10 + dy, 7 + f, 10 + dy, 0.5, W);
    c.line(14 + f, 10 + dy, 15 + f, 10 + dy, 0.5, W);
    c.polyline([[8, 15 + dy], [11, 17 + dy], [14, 17 + dy], [17, 14 + dy]], 0.8, B);
  },

  // 02. BLOCKBUSTER MOVIES — Classic movie clapperboard snapping shut!
  'blockbuster-movies'(c, f) {
    c.outlinedRect(3, 9, 18, 12, '#2b3040', B);
    c.line(6, 13, 18, 13, 0.6, W);
    c.line(6, 17, 15, 17, 0.6, Y);
    // Clapper top bar (tilted open on f=0, snapped flat on f=1!)
    if (f === 0) {
      c.fillPolygon([[3, 9], [19, 3], [20, 6], [4, 11]], W, B, 0.8);
      c.line(7, 8, 9, 6, 1.0, B);
      c.line(13, 6, 15, 4, 1.0, B);
    } else {
      c.outlinedRect(3, 6, 18, 4, W, B);
      for (const sx of [6, 11, 16]) c.line(sx, 7, sx + 2, 9, 0.9, B);
    }
  },

  // 03. POP & THROWBACK BANGERS — Beamed eighth notes bouncing
  'pop-music'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.line(8, 6 + dy, 8, 17 + dy, 1.0, B);
    c.line(18, 4 + dy, 18, 15 + dy, 1.0, B);
    c.line(8, 6 + dy, 18, 4 + dy, 1.5, B);
    c.line(8, 6 + dy, 18, 4 + dy, 0.7, PK);
    c.filledOval(6, 18 + dy, 3.2, 2.4, PK, B, 0.8, 0);
    c.filledOval(16, 16 + dy, 3.2, 2.4, C, B, 0.8, 0);
    if (f === 1) c.sparkle(20, 19, 2, Y, B);
  },

  // 04. BINGE-WORTHY TV — Retro bunny-ear CRT TV with flickering color bars
  'binge-tv'(c, f) {
    c.line(12, 7, 7, 2, 0.9, B);
    c.line(12, 7, 17, 2, 0.9, B);
    c.outlinedRect(3, 7, 18, 14, P, B);
    c.outlinedRect(5, 9, 11, 10, f === 0 ? C : '#70ff8f', B);
    c.fillRect(6, 10, 3, 8, f === 0 ? Y : PK);
    c.outlinedCircle(18, 11, 1.0, Y);
    c.outlinedCircle(18, 15, 1.0, R);
  },

  // 05. SLANG TRANSLATOR — Bright yellow comic speech bubble with animated dots
  'slang-translator'(c, f) {
    c.fillPolygon(
      [[3, 5], [21, 5], [21, 16], [12, 16], [7, 21], [8, 16], [3, 16]],
      Y,
      B,
      0.9
    );
    c.brush(8, 10 - (f === 0 ? 1 : 0), 1.2, B);
    c.brush(12, 10 - (f === 1 ? 1 : 0), 1.2, B);
    c.brush(16, 10 - (f === 0 ? 1 : 0), 1.2, B);
  },

  // 06. SUPERHEROES & VILLAINS — Hero diamond shield + lightning crest
  'superheroes'(c, f) {
    c.fillPolygon([[12, 2], [21, 6], [18, 17], [12, 22], [6, 17], [3, 6]], R, B, 0.9);
    c.polyline([[13, 6], [9, 12], [13, 12], [10, 18]], 1.4, B);
    c.polyline([[13, 6], [9, 12], [13, 12], [10, 18]], 0.7, f === 0 ? Y : W);
  },

  // 07. CARTOONS & ANIME — Spiky golden anime hair + starry eyes
  'cartoons-anime'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.filledOval(12, 14 + dy, 7, 6.5, '#ffd199', B, 0.8, 0.2);
    c.fillPolygon(
      [[4, 12 + dy], [3, 4 + dy], [9, 7 + dy], [12, 2 + dy], [15, 7 + dy], [21, 4 + dy], [20, 12 + dy]],
      Y,
      B,
      0.9
    );
    c.brush(9, 14 + dy, 1.4, B);
    c.brush(15, 14 + dy, 1.4, B);
    c.setPixel(9, 13 + dy, f === 0 ? W : C);
    c.setPixel(15, 13 + dy, f === 0 ? W : C);
    c.line(10, 18 + dy, 14, 18 + dy, 0.7, R);
  },

  // 08. 90s & 2000s NOSTALGIA — Retro cassette tape with spinning reels
  'nostalgia-90s-00s'(c, f) {
    c.outlinedRect(2, 5, 20, 14, C, B);
    c.outlinedRect(4, 7, 16, 7, PK, B);
    c.outlinedCircle(8, 10, 2.0, W);
    c.outlinedCircle(16, 10, 2.0, W);
    c.setPixel(8 + (f === 0 ? -1 : 1), 10, B);
    c.setPixel(16 + (f === 0 ? 1 : -1), 10, B);
    c.fillPolygon([[6, 18], [8, 15], [16, 15], [18, 18]], GR_D, B, 0.7);
  },

  // 09. IDENTIFY THE SONG — Stage vocal mic + floating note
  'identify-the-song'(c, f) {
    c.line(6, 19, 13, 12, 2.0, B);
    c.line(6, 19, 13, 12, 1.0, GR_D);
    c.filledOval(15, 9, 4.2, 4.2, GR, B, 0.9, 0.1);
    c.line(12, 7, 17, 12, 0.6, B);
    if (f === 1) {
      c.sparkle(6, 6, 2, Y, B);
    } else {
      c.outlinedCircle(6, 8, 1.4, PK);
      c.line(7, 8, 7, 4, 0.7, B);
    }
  },

  // 10. VIDEO GAME WORLDS — Classic D-pad controller with blinking A/B buttons
  'video-games'(c, f) {
    c.outlinedRect(2, 6, 20, 12, GR, B);
    c.line(7, 10, 7, 14, 1.0, B);
    c.line(5, 12, 9, 12, 1.0, B);
    c.outlinedCircle(15, 13, 1.3, f === 0 ? R : Y);
    c.outlinedCircle(18, 10, 1.3, f === 1 ? R : G);
  },

  // 11. TECH & GADGETS — Desktop pixel PC monitor + scrolling green code
  'tech-gadgets'(c, f) {
    c.outlinedRect(3, 3, 18, 13, GR, B);
    c.outlinedRect(5, 5, 14, 9, '#102542', B);
    c.line(7, 7 + f, 13, 7 + f, 0.6, G);
    c.line(7, 10 + f, 16, 10 + f, 0.6, C);
    c.outlinedRect(9, 16, 6, 3, GR_D, B);
    c.outlinedRect(6, 19, 12, 3, GR, B);
  },

  // 12. MINECRAFT & ROBLOX LORE — Isometric grassy dirt cube + sparkle
  'minecraft-roblox'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.outlinedRect(4, 5 + dy, 16, 15, BR, B);
    c.outlinedRect(4, 5 + dy, 16, 6, G, B);
    // Jagged grass drips
    c.fillRect(6, 11 + dy, 2, 2, G);
    c.fillRect(11, 11 + dy, 3, 3, G);
    c.fillRect(16, 11 + dy, 2, 2, G);
    // Dirt pixels
    c.setPixel(8, 15 + dy, BR_L);
    c.setPixel(14, 16 + dy, BR_L);
  },

  // 13. NINTENDO & MARIO MULTIVERSE — Red-and-white spotted super mushroom!
  'nintendo-classics'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.outlinedRect(7, 13 + dy, 10, 8, '#ffe0b2', B);
    c.brush(10, 16 + dy, 0.8, B);
    c.brush(14, 16 + dy, 0.8, B);
    c.filledOval(12, 9 + dy, 9, 6.5, R, B, 0.9, 0.2);
    c.outlinedCircle(12, 8 + dy, 2.2, W);
    c.outlinedCircle(6, 10 + dy, 1.5, W);
    c.outlinedCircle(18, 10 + dy, 1.5, W);
  },

  // 14. HORROR GAMES & CREEPYPASTAS — Glowing red animatronic eyes in dark hood
  'horror-games'(c, f) {
    c.filledOval(12, 12, 9.5, 9.5, '#1b1429', B, 1.0, 0.3);
    const glow = f === 0 ? R : Y;
    c.outlinedCircle(8, 11, 2.0, glow);
    c.outlinedCircle(16, 11, 2.0, glow);
    c.setPixel(8, 11, W);
    c.setPixel(16, 11, W);
    // Creepy jagged pixel teeth
    c.polyline([[7, 17], [9, 15], [12, 17], [15, 15], [17, 17]], 0.8, W);
  },

  // 15. SPACE & COSMIC FACTS — Ringed planet Saturn + twinkling star
  'space-reality'(c, f) {
    c.filledOval(12, 12, 6.2, 6.2, O, B, 0.9, 0.2);
    c.line(2, 17, 22, 7, 1.8, B);
    c.line(3, 16.5, 21, 7.5, 0.8, Y);
    c.sparkle(5, 5, f === 0 ? 2 : 1, Y, B);
    c.sparkle(19, 18, f === 1 ? 2 : 1, C, B);
  },

  // 16. EVERYDAY SCIENCE — Bubbling green Erlenmeyer lab flask!
  'everyday-science'(c, f) {
    c.fillPolygon([[9, 4], [15, 4], [15, 9], [20, 20], [4, 20], [9, 9]], W, B, 0.9);
    c.fillPolygon([[6, 15], [18, 15], [19, 19], [5, 19]], G, B, 0.7);
    c.line(8, 4, 16, 4, 1.1, B);
    c.outlinedCircle(11, 12 - f * 2, 1.3, G);
    c.outlinedCircle(14, 9 - f * 2, 1.0, C);
  },

  // 17. FREAKY ANIMAL FACTS — Cute bright green frog/octopus with big eyes!
  'freaky-animals'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.filledOval(12, 14 + dy, 8.5, 6.5, G, B, 0.9, 0.2);
    c.filledOval(8, 7 + dy, 3.2, 3.2, W, B, 0.8, 0);
    c.filledOval(16, 7 + dy, 3.2, 3.2, W, B, 0.8, 0);
    c.brush(8, 7 + dy, f === 1 ? 0.8 : 1.3, B);
    c.brush(16, 7 + dy, f === 1 ? 0.8 : 1.3, B);
    c.polyline([[8, 15 + dy], [12, 17 + dy], [16, 15 + dy]], 0.9, B);
  },

  // 18. DINOSAURS & PREHISTORIC LIFE — Green T-Rex head chomping!
  'dinosaurs-prehistoric'(c, f) {
    const jaw = f === 1 ? 2 : 0;
    // Upper snout & head
    c.fillPolygon([[4, 19], [4, 7], [9, 4], [20, 4], [20, 11], [11, 11], [11, 19]], G, B, 0.9);
    // Lower jaw
    c.fillPolygon([[11, 14 + jaw], [19, 14 + jaw], [19, 18 + jaw], [11, 18 + jaw]], GD, B, 0.8);
    // White teeth
    c.setPixel(13, 12, W);
    c.setPixel(16, 12, W);
    c.setPixel(18, 12, W);
    // Eye
    c.outlinedCircle(9, 7, 1.2, Y);
    c.setPixel(9, 7, B);
  },

  // 19. MYSTERIES OF THE DEEP OCEAN — Deep-sea anglerfish with glowing lantern!
  'ocean-deep'(c, f) {
    c.filledOval(11, 14, 7.5, 6, '#1e5aa8', B, 0.9, 0.2);
    c.fillPolygon([[3, 14], [1, 10], [1, 18]], BL, B, 0.8);
    // Antenna + glowing lure
    c.polyline([[13, 8], [17, 4], [20, 7]], 0.8, B);
    c.outlinedCircle(20, 8, f === 0 ? 1.8 : 2.4, Y);
    c.outlinedCircle(15, 12, 1.4, W);
    c.setPixel(15, 12, B);
    c.polyline([[13, 17], [15, 15], [17, 17]], 0.7, W);
  },

  // 20. HUMAN BODY & MEDICAL MARVELS — Beating red heart + EKG pulse!
  'human-biology'(c, f) {
    const r = f === 0 ? 4.5 : 5.2;
    c.brush(8.5, 9, r + 1, B);
    c.brush(15.5, 9, r + 1, B);
    c.fillPolygon([[4, 11], [20, 11], [12, 21]], R, B, 0.9);
    c.brush(8.5, 9, r, R);
    c.brush(15.5, 9, r, R);
    // Green EKG pulse line across heart
    c.polyline([[4, 13], [9, 13], [11, 9], [13, 16], [15, 13], [20, 13]], 0.8, G);
  },

  // 21. WILD WEATHER & EXTREME NATURE — Dark storm cloud + yellow lightning bolt!
  'weather-disasters'(c, f) {
    c.outlinedCircle(8, 9, 3.8, GR);
    c.outlinedCircle(13, 7, 4.5, GR);
    c.outlinedCircle(17, 9, 3.5, GR);
    c.fillRect(7, 7, 11, 5, GR);
    const shift = f === 1 ? 1 : 0;
    c.polyline([[13, 12], [9 + shift, 17], [13 + shift, 17], [10, 22]], 1.4, B);
    c.polyline([[13, 12], [9 + shift, 17], [13 + shift, 17], [10, 22]], 0.7, Y);
  },

  // 22. CHAOTIC HISTORY — Parchment scroll with red wax seal
  'chaotic-history'(c, f) {
    c.outlinedRect(5, 4, 14, 16, '#f7e1a0', B);
    c.outlinedRect(3, 3, 18, 3, '#e3be68', B);
    c.outlinedRect(3, 18, 18, 3, '#e3be68', B);
    c.line(8, 9, 16, 9, 0.7, B);
    c.line(8, 13, 14, 13, 0.7, B);
    c.outlinedCircle(15, 14 + (f === 1 ? -1 : 0), 1.8, R);
  },

  // 23. WAIT, WHERE IS THAT? — Blue & green pixel Earth globe
  'where-is-that'(c, f) {
    c.filledOval(12, 12, 9, 9, BL, B, 0.9, 0.2);
    const dx = f === 1 ? 1 : 0;
    c.brush(9 + dx, 9, 2.8, G);
    c.brush(14 + dx, 14, 3.0, G);
    c.brush(8 + dx, 16, 1.8, G);
    c.ovalOutline(12, 12, 9, 9, 1.0, B, 0.2);
  },

  // 24. MYTHS & URBAN LEGENDS — Floating white ghost waving tail
  'spooky-myths'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.fillPolygon(
      [[5, 20 + dy], [5, 9 + dy], [9, 4 + dy], [15, 4 + dy], [19, 9 + dy], [19, 20 + dy], [15, 17 + dy], [12, 20 + dy], [9, 17 + dy]],
      W,
      B,
      0.9
    );
    c.brush(9, 10 + dy, 1.3, B);
    c.brush(15, 10 + dy, 1.3, B);
    c.brush(12, 14 + dy, f === 0 ? 1.2 : 1.7, B);
  },

  // 25. ANCIENT CIVILIZATIONS & EMPIRES — Golden Egyptian pyramid + sun
  'ancient-civilizations'(c, f) {
    c.outlinedCircle(18, 6, f === 0 ? 2.2 : 2.8, Y);
    c.fillPolygon([[2, 20], [12, 5], [22, 20]], '#e8b931', B, 0.9);
    c.line(12, 5, 15, 20, 0.8, B);
    c.line(7, 13, 17, 13, 0.6, BR);
    c.line(5, 17, 19, 17, 0.6, BR);
  },

  // 26. WORLD WARS & TURNING POINTS — Vintage military star helmet / compass badge
  'world-wars-conflicts'(c, f) {
    c.filledOval(12, 12, 9, 9, '#4b6b3c', B, 0.9, 0.1);
    c.sparkle(12, 12, f === 0 ? 5 : 6, Y, B);
    c.outlinedCircle(12, 12, 2.0, R);
  },

  // 27. WORLD CAPITALS & GEOGRAPHY — Red map location pin bouncing over green map!
  'world-capitals'(c, f) {
    const dy = f === 1 ? -2 : 0;
    c.outlinedRect(3, 16, 18, 5, G, B);
    c.fillPolygon([[8, 10 + dy], [16, 10 + dy], [12, 18 + dy]], R, B, 0.9);
    c.filledOval(12, 8 + dy, 4.8, 4.8, R, B, 0.9, 0.1);
    c.outlinedCircle(12, 8 + dy, 1.6, W);
  },

  // 28. FLAGS, BORDERS & LANDMARKS — Waving colorful tricolor flag on pole!
  'flags-of-world'(c, f) {
    const wave = f === 1 ? 1 : -1;
    c.line(5, 3, 5, 21, 1.1, B);
    c.outlinedRect(6, 4, 7, 10, R, B);
    c.outlinedRect(13, 4 + wave, 7, 10, BL, B);
    c.outlinedRect(10, 4, 4, 10, Y, B);
  },

  // 29. GODS, HEROES & MYTHOLOGY — Golden Greek trident gleaming!
  'mythology-folklore'(c, f) {
    c.line(12, 4, 12, 21, 1.2, B);
    c.line(12, 5, 12, 20, 0.6, Y);
    c.polyline([[6, 5], [6, 11], [18, 11], [18, 5]], 1.2, B);
    c.polyline([[6, 5], [6, 11], [18, 11], [18, 5]], 0.6, Y);
    if (f === 1) c.sparkle(12, 4, 2, W, B);
  },

  // 30. WEIRD LAWS & RULES — Wooden judge's gavel tapping block!
  'dumb-laws'(c, f) {
    const tap = f === 1 ? 2 : 0;
    c.outlinedRect(3, 18, 11, 3, BR, B);
    c.line(11, 10 + tap, 20, 18, 1.6, B);
    c.line(11, 10 + tap, 20, 18, 0.8, BR_L);
    c.outlinedRect(5, 5 + tap, 10, 6, BR, B);
  },

  // 31. WHAT IS WRONG WITH NATURE? — Chomping Venus flytrap plant!
  'nature-is-broken'(c, f) {
    c.line(12, 21, 12, 13, 1.3, B);
    c.line(12, 21, 12, 13, 0.7, GD);
    const open = f === 0 ? 3 : 1;
    c.filledOval(12, 8 - open, 6.5, 3.2, G, B, 0.9, 0.1);
    c.filledOval(12, 10 + open, 6.5, 3.2, G, B, 0.9, 0.1);
    c.fillRect(8, 8, 8, 3, R);
    c.setPixel(9, 8, W);
    c.setPixel(12, 8, W);
    c.setPixel(15, 8, W);
  },

  // 32. INTERNET BRAINROT & MEME LORE — Melting pink pixel brain with goofy eyes!
  'internet-brainrot'(c, f) {
    c.filledOval(12, 10, 8, 6.5, PK, B, 0.9, 0.4, f);
    // Melting drips
    c.outlinedRect(6, 15, 3, 4 + f, PK, B);
    c.outlinedRect(15, 15, 3, 5 - f, PK, B);
    c.outlinedCircle(9, 10, 1.8, W);
    c.outlinedCircle(15, 10, 1.8, W);
    c.setPixel(8, 9, B);
    c.setPixel(16, 11, B);
  },

  // 33. WHY DOES THIS EXIST? — Wobbling orange mystery `?` crate with eyes!
  'why-does-this-exist'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.outlinedRect(4, 4 + dy, 16, 16, O, B);
    c.polyline([[10, 8 + dy], [14, 8 + dy], [14, 11 + dy], [12, 12 + dy], [12, 14 + dy]], 1.2, B);
    c.polyline([[10, 8 + dy], [14, 8 + dy], [14, 11 + dy], [12, 12 + dy], [12, 14 + dy]], 0.6, W);
    c.setPixel(12, 17 + dy, W);
  },

  // 34. ANIMALS ARE WEIRD — Goofy duck/platypus face with big orange bill!
  'animals-are-weird'(c, f) {
    c.filledOval(12, 11, 8, 7.5, C, B, 0.9, 0.2);
    c.filledOval(9, 9, 2.5, 2.5, W, B, 0.8, 0);
    c.filledOval(15, 9, 2.5, 2.5, W, B, 0.8, 0);
    c.setPixel(9 + f, 9, B);
    c.setPixel(15 - f, 9, B);
    c.filledOval(12, 16, 6.5, 3.2, O, B, 0.9, 0.1);
  },

  // 35. CURSED FOOD COMBINATIONS — Bubbling radioactive green pizza slice!
  'cursed-food'(c, f) {
    c.fillPolygon([[4, 5], [20, 5], [12, 21]], G, B, 0.9);
    c.outlinedRect(3, 3, 18, 4, BR_L, B);
    c.outlinedCircle(10, 10, 1.4, P);
    c.outlinedCircle(14, 13, 1.4, R);
    c.outlinedCircle(12, 3 - f, 1.1, G);
  },

  // 36. ABSOLUTELY USELESS KNOWLEDGE — Paperclip + glowing trivia spark
  'useless-knowledge'(c, f) {
    c.polyline([[8, 17], [8, 6], [16, 6], [16, 19], [11, 19], [11, 9], [14, 9]], 1.4, B);
    c.polyline([[8, 17], [8, 6], [16, 6], [16, 19], [11, 19], [11, 9], [14, 9]], 0.7, C);
    c.sparkle(19, 5, f === 0 ? 2 : 3, Y, B);
  },

  // 37. TERRIBLE SUPERPOWERS — Slippery yellow banana peel!
  'terrible-superpowers'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.fillPolygon([[10, 4 + dy], [14, 4 + dy], [16, 13 + dy], [21, 18 + dy], [14, 17 + dy], [12, 14 + dy], [9, 18 + dy], [3, 18 + dy], [8, 13 + dy]], Y, B, 0.9);
    c.fillRect(11, 3 + dy, 2, 2, BR);
  },

  // 38. GAME LOGIC MAKES NO SENSE — Half-filled glitching pixel heart + `!`
  'game-logic-broken'(c, f) {
    const dx = f === 1 ? 1 : 0;
    c.outlinedRect(4 + dx, 6, 7, 11, R, B);
    c.outlinedRect(12 - dx, 8, 8, 11, P, B);
    c.line(18, 3, 18, 8, 1.2, Y);
    c.setPixel(18, 10, Y);
  },

  // 39. MOVIES ARE WEIRD & WILD — Retro red & cyan 3D cinema glasses!
  'movies-are-weird'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.outlinedRect(2, 8 + dy, 20, 8, W, B);
    c.outlinedRect(4, 10 + dy, 6, 4, R, B);
    c.outlinedRect(14, 10 + dy, 6, 4, C, B);
  },

  // 40. COMMON SENSE & TRICK TRIVIA — Bright orange traffic cone!
  'common-sense-test'(c, f) {
    const tilt = f === 1 ? 1 : 0;
    c.fillPolygon([[5, 20], [10 + tilt, 4], [14 + tilt, 4], [19, 20]], O, B, 0.9);
    c.outlinedRect(7, 11, 10, 3, W, B);
    c.outlinedRect(3, 19, 18, 3, O, B);
  },

  // 41. NAME THAT NONSENSE — Red & white `"HI!"` name tag sticker!
  'name-that-nonsense'(c, f) {
    c.outlinedRect(2, 5, 20, 14, W, B);
    c.outlinedRect(2, 5, 20, 5, R, B);
    c.line(6, 13, 13, 13, 0.9, B);
    c.line(17, 11, 17, 14, 1.0, f === 0 ? B : R);
    c.setPixel(17, 16, R);
  },

  // 42. YOU LEARNED THAT IN SCHOOL? — Red teacher's apple with green leaf!
  'school-lies'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.filledOval(12, 14 + dy, 7.2, 6.5, R, B, 0.9, 0.2);
    c.line(12, 7 + dy, 12, 3 + dy, 1.0, BR);
    c.filledOval(15, 5 + dy, 2.8, 1.6, G, B, 0.7, 0);
    c.line(8, 11 + dy, 8, 14 + dy, 0.7, W);
  },

  // 43. ABSURD ANIMAL COMPARISONS — Tilting golden balance scale!
  'absurd-comparisons'(c, f) {
    const tilt = f === 0 ? -2 : 2;
    c.line(12, 4, 12, 20, 1.1, B);
    c.outlinedRect(7, 19, 10, 3, Y, B);
    c.line(4, 9 + tilt, 20, 9 - tilt, 1.1, B);
    c.outlinedCircle(5, 13 + tilt, 2.4, C);
    c.outlinedCircle(19, 13 - tilt, 2.4, O);
  },

  // 44. THE INTERNET IS A STRANGE PLACE — Classic pixel mouse arrow clicking!
  'internet-strange'(c, f) {
    const d = f === 1 ? 1 : 0;
    c.fillPolygon(
      [[6 + d, 3 + d], [6 + d, 18 + d], [10 + d, 15 + d], [13 + d, 21 + d], [16 + d, 19 + d], [13 + d, 13 + d], [18 + d, 13 + d]],
      W,
      B,
      0.9
    );
    if (f === 1) c.sparkle(6, 3, 2, Y, B);
  },

  // 45. WEIRD & WONDERFUL FOOD — Juicy MS Paint cheeseburger!
  'weird-food'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.filledOval(12, 8 + dy, 8, 4.5, BR_L, B, 0.9, 0.1);
    c.outlinedRect(3, 10 + dy, 18, 3, G, B);
    c.outlinedRect(4, 12 + dy, 16, 3, Y, B);
    c.outlinedRect(4, 14 + dy, 16, 3, BR, B);
    c.outlinedRect(5, 17 + dy, 14, 3, BR_L, B);
    c.setPixel(9, 6 + dy, W);
    c.setPixel(14, 6 + dy, W);
  },

  // 46. RIDDLES & BRAIN TEASERS — Glowing yellow idea lightbulb!
  'riddles-wordplay'(c, f) {
    c.filledOval(12, 9, 6.5, 6.5, f === 0 ? Y : '#fff59d', B, 0.9, 0.1);
    c.outlinedRect(9, 15, 6, 5, GR, B);
    if (f === 1) {
      c.line(2, 9, 4, 9, 0.8, Y);
      c.line(20, 9, 22, 9, 0.8, Y);
      c.line(12, 1, 12, 2, 0.8, Y);
    }
  },

  // 47. SPORTS & WILD RECORDS — Bouncing orange basketball with seams
  'sports-records'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.filledOval(12, 12 + dy, 8.8, 8.8, O, B, 0.9, 0.1);
    c.line(4, 12 + dy, 20, 12 + dy, 0.7, B);
    c.line(12, 4 + dy, 12, 20 + dy, 0.7, B);
  },

  // 48. BOOKS & PLOT TWISTS — Open hardcover book with fluttering pages
  'famous-books'(c, f) {
    c.outlinedRect(2, 6, 10, 13, W, B);
    c.outlinedRect(12, 6, 10, 13, W, B);
    c.line(12, 5, 12, 19, 1.1, R);
    c.line(5, 10, 9, 10, 0.6, B);
    c.line(5, 13, 9, 13, 0.6, B);
    c.line(15, 10 + f, 19, 10 + f, 0.6, BL);
    c.line(15, 13 + f, 19, 13 + f, 0.6, B);
  },

  // 49. BOARD GAMES & TOYS — Red MS Paint 5-pip die tumbling slightly
  'board-games-toys'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.outlinedRect(4, 4 + dy, 16, 16, R, B);
    for (const [px, py] of [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]]) {
      c.brush(px, py + dy, 1.1, W);
    }
  },

  // 50. BEFORE & AFTER MASHUPS — Interlocking cyan & yellow puzzle pieces
  'before-and-after'(c, f) {
    const gap = f === 0 ? 1 : 0;
    c.outlinedRect(2, 6, 10, 12, C, B);
    c.outlinedRect(12 + gap, 6, 10, 12, Y, B);
    c.outlinedCircle(12, 12, 2.3, C);
  },

  // 51. SECRET LOGOS & BRANDS — Golden price tag with red loop
  'brands-logos'(c, f) {
    const dy = f === 1 ? -1 : 0;
    c.fillPolygon([[4, 5 + dy], [14, 5 + dy], [20, 11 + dy], [12, 19 + dy], [4, 13 + dy]], Y, B, 0.9);
    c.outlinedCircle(8, 9 + dy, 1.5, W);
    c.line(2, 3 + dy, 7, 8 + dy, 0.8, R);
  },

  // 52. CARS, SPEED & TRANSPORTATION — Red pixel sports car zooming!
  'cars-transport'(c, f) {
    const dx = f === 1 ? 1 : 0;
    c.fillPolygon([[3 + dx, 16], [5 + dx, 11], [9 + dx, 7], [16 + dx, 7], [21 + dx, 12], [21 + dx, 16]], R, B, 0.9);
    c.outlinedRect(10 + dx, 8, 6, 4, C, B);
    c.outlinedCircle(7 + dx, 17, 2.4, GR_D);
    c.outlinedCircle(17 + dx, 17, 2.4, GR_D);
    if (f === 1) c.outlinedCircle(2, 15, 1.3, W);
  },

  // 53. MASTERPIECES & ART MOVEMENTS — Wooden artist palette with paint dabs!
  'famous-paintings-art'(c, f) {
    c.filledOval(12, 12, 9, 7.5, BR_L, B, 0.9, 0.2);
    c.outlinedCircle(8, 10, 1.5, R);
    c.outlinedCircle(12, 8, 1.5, BL);
    c.outlinedCircle(16, 10, 1.5, G);
    c.outlinedCircle(15, 15, 1.5, f === 0 ? Y : PK);
    c.outlinedCircle(8, 15, 1.6, W);
  },

  // 54. CUSTOM CATEGORY — Artist paintbrush + twinkling golden star!
  custom(c, f) {
    c.line(5, 19, 17, 7, 1.7, B);
    c.line(5, 19, 17, 7, 0.8, O);
    c.outlinedCircle(18, 6, 2.4, PK);
    c.sparkle(7, 7, f === 0 ? 2 : 3, Y, B);
  },
};

function generateAllCategorySprites(categoriesDir, legacyAssetsDir) {
  // Verify 100% of BUILTIN_CATEGORIES have a dedicated pixel drawer!
  const missing = BUILTIN_CATEGORIES.filter((cat) => !CATEGORY_DRAWERS[cat.id]).map((c) => c.id);
  if (missing.length > 0) {
    throw new Error(`Missing category pixel art drawers for: ${missing.join(', ')}`);
  }

  const orderedIds = [...BUILTIN_CATEGORIES.map((c) => c.id), 'custom'];
  const masterSheet = new PixelCanvas(orderedIds.length * 24, 48); // 54 cols x 2 rows (24x24)
  const savedFiles = [];

  orderedIds.forEach((id, idx) => {
    const drawFn = CATEGORY_DRAWERS[id];
    const strip = buildHorizontalStrip(24, 24, 2, drawFn);
    const outPath = path.join(categoriesDir, `${id}.png`);
    const bytes = strip.save(outPath);
    savedFiles.push({ id, outPath, bytes });

    // Also blit frame 0 into row 0 and frame 1 into row 1 of masterSheet
    for (let f = 0; f < 2; f++) {
      const cell = new PixelCanvas(24, 24);
      drawFn(cell, f);
      masterSheet.blitFrom(cell, idx * 24, f * 24);
    }
  });

  masterSheet.save(path.join(categoriesDir, 'categories-sheet.png'));
  if (legacyAssetsDir) {
    masterSheet.save(path.join(legacyAssetsDir, 'cat-icons-sheet.png'));
  }

  return { count: orderedIds.length, orderedIds, savedFiles };
}

module.exports = {
  CATEGORY_DRAWERS,
  generateAllCategorySprites,
};
