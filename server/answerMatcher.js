'use strict';

const NUMBER_WORDS = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
  thirteen: '13',
  fourteen: '14',
  fifteen: '15',
  sixteen: '16',
  seventeen: '17',
  eighteen: '18',
  nineteen: '19',
  twenty: '20',
  thirty: '30',
  forty: '40',
  fifty: '50',
  eightyeight: '88',
  hundred: '100',
};

function normalizeAnswer(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // Strip optional Jeopardy question prefixes ("what is", "who are", etc.)
  s = s.replace(
    /^(?:what|who|where|when|why|how)\s+(?:is|are|was|were|do|does|did)\s+/,
    ''
  );

  s = s
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading articles
  s = s.replace(/^(?:the|a|an)\s+/, '').trim();

  // Normalize standalone number words -> digits so "three" matches "3"
  const tokens = s.split(' ').map((tok) => NUMBER_WORDS[tok] ?? tok);
  s = tokens.join(' ').trim();

  return s;
}

function stripPlural(s) {
  if (s.length > 4 && s.endsWith('ies')) {
    return s.slice(0, -3) + 'y';
  }
  if (s.length > 4 && s.endsWith('es')) {
    return s.slice(0, -2);
  }
  if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) {
    return s.slice(0, -1);
  }
  return s;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Evaluates a player's submitted answer against a clue.
 * Returns { status: 'correct' | 'close' | 'wrong' }
 */
function evaluateAnswer(guessRaw, clueObj) {
  const guess = normalizeAnswer(guessRaw);
  if (!guess) return { status: 'wrong' };

  const candidatesRaw = [
    clueObj.answer,
    ...(Array.isArray(clueObj.accept) ? clueObj.accept : []),
  ];

  const candidates = candidatesRaw
    .map((c) => normalizeAnswer(c))
    .filter(Boolean);

  const guessSingular = stripPlural(guess);
  const guessNoSpaces = guess.replace(/\s+/g, '');

  for (const target of candidates) {
    if (guess === target) return { status: 'correct' };

    const targetSingular = stripPlural(target);
    if (guessSingular === targetSingular) return { status: 'correct' };

    const targetNoSpaces = target.replace(/\s+/g, '');
    if (guessNoSpaces.length >= 4 && guessNoSpaces === targetNoSpaces) {
      return { status: 'correct' };
    }

    // Only apply typo forgiveness on alphabetic targets (never pure numbers)
    const isNumericOnly = /^\d+$/.test(targetNoSpaces);
    if (!isNumericOnly) {
      const dist = levenshtein(guess, target);
      if (target.length >= 5 && target.length <= 7 && dist <= 1) {
        return { status: 'correct' };
      }
      if (target.length >= 8 && dist <= 2) {
        return { status: 'correct' };
      }
    }
  }

  // Check if guess is "close!" (like skribbl.io's famous yellow hint!)
  for (const target of candidates) {
    const isNumericOnly = /^\d+$/.test(target.replace(/\s+/g, ''));
    if (isNumericOnly) continue;

    const dist = levenshtein(guess, target);
    if (target.length >= 5 && dist <= 3) {
      return { status: 'close' };
    }

    // Partial multi-word match (e.g. "walter" for "walter white")
    const targetWords = target.split(' ').filter((w) => w.length >= 4);
    if (targetWords.length >= 2 && guess.length >= 4) {
      if (targetWords.some((w) => w === guess || stripPlural(w) === guessSingular)) {
        return { status: 'close' };
      }
    }
  }

  return { status: 'wrong' };
}

module.exports = {
  normalizeAnswer,
  evaluateAnswer,
};
