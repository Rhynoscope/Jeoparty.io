'use strict';

const crypto = require('node:crypto');

/**
 * FINAL JEOPARTY CATEGORY WHEEL
 *
 * The wheel is built from the categories that actually appeared on this room's
 * board during the match. The server alone chooses the winning sector (crypto
 * random) and derives the Final Jeopardy clue from that same category in the
 * existing question database, so every player sees an identical result and the
 * wheel can never be manipulated by a client.
 */

function normalizeName(name) {
  return String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

/** Distinct board categories in the order they first appeared. */
function buildWheelSectors(room, categories = []) {
  // Prefer the board that is actually on screen when the final round begins
  // (Double Jeoparty would otherwise mix in the previous round's categories).
  const currentBoardCats = Array.isArray(room.board?.categories)
    ? room.board.categories
    : [];
  const history = Array.isArray(room.boardCategoryHistory) ? room.boardCategoryHistory : [];
  const byId = new Map(categories.map((c) => [c.id, c]));
  const seen = new Set();
  const sectors = [];

  const addSector = (entry) => {
    if (!entry || !entry.id || seen.has(entry.id)) return;
    const cat = byId.get(entry.id) || entry;
    const name = String(cat.name || entry.name || '').trim();
    if (!name) return;
    seen.add(entry.id);
    sectors.push({ id: entry.id, name, icon: cat.icon || entry.icon || 'custom' });
  };

  if (currentBoardCats.length >= 3) {
    for (const cat of currentBoardCats) addSector(cat);
  }

  if (sectors.length < 3) {
    for (const entry of history) addSector(entry);
  }

  // Always give the wheel a usable number of slices, even on tiny boards.
  if (sectors.length < 3) {
    const includedIds = Array.isArray(room.settings?.includedCategoryIds)
      ? room.settings.includedCategoryIds
      : [];
    for (const cat of categories) {
      if (sectors.length >= 4) break;
      if (!cat || !cat.id || seen.has(cat.id)) continue;
      if (includedIds.length > 0 && !includedIds.includes(cat.id)) continue;
      if (!Array.isArray(cat.clues) || cat.clues.length === 0) continue;
      seen.add(cat.id);
      sectors.push({ id: cat.id, name: cat.name, icon: cat.icon || 'custom' });
    }
  }

  return sectors.slice(0, 8);
}

/**
 * Chooses a hard, unused clue from the winning category (existing database).
 * Returns null when the category has no usable clues.
 */
function pickClueFromCategory(room, category, recentKeys) {
  const clues = (category.clues || []).filter(
    (c) => c && typeof c.clue === 'string' && c.clue.trim() && typeof c.answer === 'string'
  );
  if (clues.length === 0) return null;

  const recent = recentKeys instanceof Set ? recentKeys : new Set();
  const unused = clues.filter((c) => !recent.has(c.clue));
  const pool = unused.length > 0 ? unused : clues;

  // Prefer the hardest third of the category for a Final Jeopardy moment.
  const sorted = [...pool].sort((a, b) => (Number(b.baseValue) || 0) - (Number(a.baseValue) || 0));
  const topCount = Math.max(1, Math.min(sorted.length, Math.ceil(sorted.length * 0.45)));
  const chosen = sorted[Math.floor(Math.random() * topCount)];

  return {
    category: String(category.name || '').toUpperCase(),
    clue: chosen.clue,
    answer: chosen.answer,
    accept: Array.isArray(chosen.accept) ? chosen.accept : [],
    baseValue: Number(chosen.baseValue) || 0,
    categoryId: category.id,
    categoryIcon: category.icon || 'custom',
  };
}

function pickFromFinalPool(pool, recentSet) {
  const list = Array.isArray(pool) ? pool.filter((f) => f && f.clue && f.answer) : [];
  if (list.length === 0) return null;
  const unused = list.filter((f) => !recentSet.has(f.clue));
  const source = unused.length > 0 ? unused : list;
  const chosen = source[Math.floor(Math.random() * source.length)];
  return {
    category: chosen.category,
    clue: chosen.clue,
    answer: chosen.answer,
    accept: Array.isArray(chosen.accept) ? chosen.accept : [],
    baseValue: 0,
    categoryId: null,
    categoryIcon: 'custom',
  };
}

/**
 * Picks the wheel result + Final Jeopardy clue.
 * @param {object} room
 * @param {Array} categories every category available to the room
 * @param {Array} finalPool fallback pool of dedicated final clues
 */
function selectFinalWheel(room, categories = [], finalPool = []) {
  const sectors = buildWheelSectors(room, categories);
  // Prefer a Final clue that was NOT already played on this board (or recently).
  const recentKeys = new Set([
    ...(room.recentFinalKeys instanceof Set ? room.recentFinalKeys : []),
    ...(room.recentClueKeys instanceof Set ? room.recentClueKeys : []),
  ]);
  let targetIndex = sectors.length > 0 ? crypto.randomInt(sectors.length) : 0;
  let clueObj = null;

  if (sectors.length > 0) {
    const firstChoice = categories.find((c) => c.id === sectors[targetIndex].id);
    if (firstChoice) clueObj = pickClueFromCategory(room, firstChoice, recentKeys);

    // If that slice has no clues (unusual), find a slice that does — the wheel
    // still shows a genuine board category and the server still decides.
    if (!clueObj) {
      const order = sectors
        .map((_, idx) => idx)
        .filter((idx) => idx !== targetIndex)
        .sort(() => Math.random() - 0.5);
      for (const idx of order) {
        const cat = categories.find((c) => c.id === sectors[idx].id);
        if (!cat) continue;
        const candidate = pickClueFromCategory(room, cat, recentKeys);
        if (candidate) {
          targetIndex = idx;
          clueObj = candidate;
          break;
        }
      }
    }
  }

  if (!clueObj) {
    clueObj = pickFromFinalPool(finalPool, recentKeys);
    if (clueObj && sectors.length > 0) {
      // Keep the wheel and the clue on the same category label.
      const matching = sectors.findIndex(
        (s) => normalizeName(s.name) === normalizeName(clueObj.category)
      );
      if (matching >= 0) targetIndex = matching;
    }
  }

  if (!clueObj) {
    // Last-resort guard so a match can never stall in the final round.
    clueObj = {
      category: 'JEOPARTY',
      clue: 'This is the name of the game you are playing right now.',
      answer: 'Jeoparty',
      accept: ['jeopardy'],
      baseValue: 0,
      categoryId: null,
      categoryIcon: 'custom',
    };
  }

  const sectorCount = Math.max(1, sectors.length);
  const spinDurationMs = 5200;
  const leadInMs = 650;
  const startedAt = Date.now() + leadInMs;

  return {
    sectors,
    targetIndex: Math.max(0, Math.min(sectorCount - 1, targetIndex)),
    clueObj,
    wheel: {
      id: 'spin_' + crypto.randomBytes(4).toString('hex'),
      sectors,
      targetIndex: Math.max(0, Math.min(sectorCount - 1, targetIndex)),
      sectorCount,
      startedAt,
      durationMs: spinDurationMs,
      spins: 5 + crypto.randomInt(0, 2),
      revealedAt: startedAt + spinDurationMs,
      wheelCategory: clueObj.category,
    },
  };
}

module.exports = {
  buildWheelSectors,
  pickClueFromCategory,
  selectFinalWheel,
};
