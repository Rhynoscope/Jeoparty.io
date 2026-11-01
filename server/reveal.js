'use strict';

/**
 * SERVER-AUTHORITATIVE WORD-BY-WORD CLUE REVEAL
 *
 * The server owns the reveal timeline: it builds a deterministic word schedule
 * for each clue, so every client renders the exact same number of words at the
 * same server timestamp. A buzzer press freezes the reveal server-side and the
 * frozen word position is broadcast to every player. When a wrong answer keeps
 * the clue open, the server resumes the reveal from that same word.
 *
 * The client never decides how much of a question it has "earned" to see: it
 * only interpolates the plan the server handed it, using the server clock.
 */

const MIN_TYPING_MS = 1500;
const MAX_TYPING_MS = 12000;

/** Splits text into words while remembering the character offset after each. */
function tokenizeWords(text) {
  const source = String(text || '');
  const tokens = [];
  const re = /\S+/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    tokens.push({
      word: match[0],
      endIndex: re.lastIndex,
    });
  }
  return tokens;
}

function clampInt(value, min, max) {
  const n = Math.round(Number(value) || 0);
  return Math.max(min, Math.min(max, n));
}

/**
 * Builds a fresh reveal segment covering `words` (from `baseWords` to total).
 * Gaps between words shrink over time, so the reveal visibly accelerates as the
 * question timer runs down.
 */
function buildDelaysForCount(count, windowMs) {
  if (count <= 0) return [];
  const typingMs = clampInt(windowMs, MIN_TYPING_MS, MAX_TYPING_MS);
  if (count === 1) return [typingMs];

  const weights = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    // 1.00 -> 0.32 across the segment: slow start, brisk finish.
    const w = 1 - 0.68 * (i / (count - 1));
    weights.push(w);
    sum += w;
  }
  let acc = 0;
  return weights.map((w) => {
    acc += typingMs * (w / sum);
    return Math.round(acc);
  });
}

/**
 * @param {string} text clue text
 * @param {number} windowMs the phase duration the typing should fit inside
 * @param {number} now epoch ms
 */
function buildRevealPlan(text, windowMs, now = Date.now()) {
  const tokens = tokenizeWords(text);
  const totalWords = tokens.length;
  if (totalWords === 0) {
    return {
      totalWords: 0,
      baseWords: 0,
      wordOffsets: [],
      wordDelays: [],
      startedAt: now,
      frozenWords: null,
      complete: true,
    };
  }

  // Finish typing comfortably before the buzzer closes, and scale the reveal
  // to the length of the clue so short questions never drag.
  const wordBudget = tokens.length * 380;
  const typingWindow = Math.max(
    1100,
    Math.min(
      Math.floor(windowMs * 0.6),
      Math.floor(windowMs - 2500),
      wordBudget
    )
  );
  return {
    totalWords,
    baseWords: 0,
    wordOffsets: tokens.map((t) => t.endIndex),
    wordDelays: buildDelaysForCount(totalWords, typingWindow),
    startedAt: now,
    frozenWords: null,
    complete: false,
  };
}

/** How many words are visible at `now` (server clock). */
function revealVisibleWords(reveal, now = Date.now()) {
  if (!reveal || !reveal.totalWords) return 0;
  if (reveal.frozenWords !== null && reveal.frozenWords !== undefined) {
    return Math.max(0, Math.min(reveal.totalWords, reveal.frozenWords));
  }
  if (reveal.complete) return reveal.totalWords;

  const elapsed = Number(now) - Number(reveal.startedAt || 0);
  if (elapsed <= 0) return reveal.baseWords || 0;

  let revealed = 0;
  const delays = reveal.wordDelays || [];
  while (revealed < delays.length && delays[revealed] <= elapsed) revealed++;
  return Math.min(
    reveal.totalWords,
    (reveal.baseWords || 0) + revealed
  );
}

/**
 * Freezes the reveal exactly where the server says it is right now.
 * Always shows at least one word so the question is never blank on a fast buzz.
 */
function freezeReveal(reveal, now = Date.now()) {
  if (!reveal) return 0;
  if (reveal.frozenWords !== null && reveal.frozenWords !== undefined) {
    return reveal.frozenWords;
  }
  const visible = Math.max(1, Math.min(reveal.totalWords, revealVisibleWords(reveal, now)));
  reveal.frozenWords = visible;
  return visible;
}

/**
 * Resumes a frozen reveal from the exact frozen word, with a fresh (faster)
 * schedule for the remaining words.
 */
function resumeReveal(reveal, remainingMs, now = Date.now()) {
  if (!reveal || !reveal.totalWords) return reveal;
  const baseWords =
    reveal.frozenWords !== null && reveal.frozenWords !== undefined
      ? Math.max(0, Math.min(reveal.totalWords, reveal.frozenWords))
      : revealVisibleWords(reveal, now);

  applyResumeSegment(reveal, baseWords, remainingMs, now);
  return reveal;
}

function applyResumeSegment(reveal, baseWords, remainingMs, now) {
  const remainingWords = reveal.totalWords - baseWords;
  const windowMs = Math.max(1100, Math.min(7000, Math.floor((Number(remainingMs) || 4000) * 0.55)));
  reveal.baseWords = baseWords;
  reveal.wordDelays = buildDelaysForCount(remainingWords, windowMs);
  reveal.startedAt = now;
  reveal.frozenWords = null;
  reveal.complete = remainingWords <= 0;
}

/** Reveals the whole question (correct answer, nobody answered, result screen). */
function completeReveal(reveal) {
  if (!reveal) return;
  reveal.frozenWords = null;
  reveal.complete = true;
}

/** Serializable snapshot sent to clients inside room state. */
function serializeReveal(reveal) {
  if (!reveal) return null;
  return {
    totalWords: reveal.totalWords,
    baseWords: reveal.baseWords,
    wordOffsets: reveal.wordOffsets,
    wordDelays: reveal.wordDelays,
    startedAt: reveal.startedAt,
    frozenWords:
      reveal.frozenWords === null || reveal.frozenWords === undefined
        ? null
        : reveal.frozenWords,
    complete: Boolean(reveal.complete),
  };
}

module.exports = {
  tokenizeWords,
  buildRevealPlan,
  revealVisibleWords,
  freezeReveal,
  resumeReveal,
  completeReveal,
  serializeReveal,
};
