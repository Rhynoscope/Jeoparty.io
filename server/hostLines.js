'use strict';

/**
 * JEOPARTY HOST — permanent, scripted game-show presenter.
 *
 * The host is NOT a player, does NOT use avatar customization, and never changes
 * identity between matches. All lines are short, contextual, and only emitted by
 * the server AFTER an authoritative result has been decided (so the host can
 * never announce a wrong result).
 */

const HOST_IDENTITY = Object.freeze({
  id: 'jeoparty_host',
  name: 'Jeoparty Host',
  title: 'Your Host',
  tagline: 'The one and only.',
  // Permanent palette shared by the client's pixel-art renderer.
  palette: Object.freeze({
    hair: '#2b1a10',
    skin: '#f2c89b',
    skinShade: '#c79e73',
    suit: '#1f6fd6',
    suitShade: '#124a96',
    shirt: '#f7fbff',
    tie: '#ffd900',
    tieShade: '#c7a500',
    mic: '#cfd5e6',
    micDark: '#7c8598',
    outline: '#000000',
    eyeWhite: '#ffffff',
    eye: '#101018',
    mouth: '#7a1f2b',
  }),
  /** Never randomly re-rolled: fixed look, fixed outfit, fixed colors. */
  look: Object.freeze({
    hairStyle: 'slick',
    mustache: 'classic',
    outfit: 'blue-suit-gold-tie',
    accessory: 'gold-microphone',
    halloweenVariant: 'stitched-suit', // palette swap only, same character
  }),
});

const HALLOWEEN_EXCLUDE = new Set(['final_category']);

/**
 * Contextual dialogue pools. `{placeholders}` are filled by the server.
 * Tones drive the host's on-screen colour and TTS delivery.
 */
const HOST_LINES = {
  round_start: {
    tone: 'excited',
    lines: [
      "Welcome back to Jeoparty! Let's play!",
      "Ladies and gentlemen, it's time to play Jeoparty!",
      'The board is fresh, the podiums are ready — here we go!',
      "Let's get this show on the road!",
    ],
  },
  intro_outro: {
    tone: 'excited',
    lines: ["Alright, contestants! Let's get this game started!"],
  },
  pick_tile: {
    tone: 'neutral',
    lines: [
      "The board is yours, {name} — make it count!",
      'What will it be, {name}?',
      "Pick a category and let's see how brave you are!",
      "Take your time, {name}... but not too much time.",
    ],
  },
  tile_selected: {
    tone: 'excited',
    lines: [
      "Alright, let's see what we've got!",
      "{category} for {amount} — I hope you studied!",
      '{category}! Here comes your clue, {amount}.',
      "Let's open the board — {category}, {amount}!",
      "Ooh, {category}. Bold choice, {name}!",
    ],
  },
  clue_open: {
    tone: 'neutral',
    lines: [
      'Read it carefully...',
      "Eyes on the clue. Buzzers ready!",
      'Take a look at this one.',
      "Let's see who knows it!",
    ],
  },
  buzz: {
    tone: 'excited',
    lines: [
      'We have a contestant!',
      '{name} buzzes in first!',
      'A hand shoots up — it\'s {name}!',
      "{name} on the buzzer! Let's hear it!",
    ],
  },
  correct: {
    tone: 'excited',
    lines: [
      "That's correct! Well done!",
      'Correct! Beautifully played.',
      "That's right on the money!",
      'Correct answer — the crowd goes wild!',
      'Nailed it!',
    ],
  },
  wrong: {
    tone: 'sad',
    lines: [
      "Unfortunately, that's incorrect!",
      "Ooh, that's not it.",
      "Not quite — but the question isn't over yet!",
      "That's incorrect. Somebody else can still jump in!",
      'Ouch. Wrong answer.',
    ],
  },
  answer_timeout: {
    tone: 'sad',
    lines: [
      "Time's up on that answer!",
      'The clock beat you to it!',
      'No answer in time — let’s keep the clue open!',
    ],
  },
  streak: {
    tone: 'excited',
    lines: [
      '{streak} correct answers in a row! You are on fire, {name}!',
      'That is {streak} in a row for {name} — and the streak bonus is rolling!',
      '{name} is heating up! {streak} straight, plus a bonus!',
      'Somebody stop {name}! {streak} consecutive answers!',
    ],
  },
  timeout: {
    tone: 'sad',
    lines: [
      "Time's up! Nobody got that one!",
      'The clock runs out — no takers.',
      "Time's up, and the clue goes unanswered.",
      'Nobody buzzed in time. On to the next one!',
    ],
  },
  money_loss: {
    tone: 'sad',
    lines: [
      "Ooh, that's going to hurt!",
      'That is going to leave a mark on the wallet.',
      'A painful deduction!',
      'That one costs real money!',
    ],
  },
  daily_double: {
    tone: 'dramatic',
    lines: [
      "IT'S THE DAILY DOUBLE!",
      'Wait a second... that is a DAILY DOUBLE!',
      'DAILY DOUBLE! The stakes just went up!',
      "It's the Daily Double — how much are you willing to risk?",
    ],
  },
  dd_wager: {
    tone: 'dramatic',
    lines: [
      '{name} wagers {amount}! A big bet!',
      '{amount} on the line for {name}!',
      'Brave wager: {amount}!',
    ],
  },
  chaos: {
    tone: 'excited',
    lines: [
      'Chaos All-Play! Everyone answers at once — go go go!',
      'No buzzer this time! Everybody answers together!',
      'It is absolute chaos! All of you, at the same time!',
    ],
  },
  intermission: {
    tone: 'neutral',
    lines: [
      'We are taking a quick break — stand by!',
      'Scores are in. Let’s take a breather.',
      'Quick intermission: stretch those buzzer fingers!',
    ],
  },
  final_intro: {
    tone: 'dramatic',
    lines: [
      "It's time for Final Jeopardy!",
      "This is it — it's time for Final Jeopardy!",
      'Our final round! Let’s spin the category wheel!',
      'Everything comes down to this. Final Jeopardy!',
    ],
  },
  final_spin: {
    tone: 'dramatic',
    lines: [
      'Round and round she goes...',
      'Spinning the wheel of knowledge!',
      'Let’s see where the wheel lands!',
      'Fingers crossed...',
    ],
  },
  final_category: {
    tone: 'excited',
    lines: [
      'The category is... {category}!',
      'And it lands on {category}!',
      '{category}! That is our Final Jeopardy category!',
      'The wheel says {category}!',
    ],
  },
  final_wager: {
    tone: 'neutral',
    lines: [
      'Now lock in those secret wagers.',
      'How much will you risk? Wagers, please!',
      'Secret wagers only — no peeking!',
      'Choose carefully. Big risk, big reward!',
    ],
  },
  final_clue: {
    tone: 'dramatic',
    lines: [
      'Here is your Final Jeopardy clue!',
      'The final clue is on the board. Good luck!',
      'This is the question that decides it all!',
    ],
  },
  final_reveal: {
    tone: 'dramatic',
    lines: [
      'Let’s reveal those final answers!',
      'The answers are in — let’s see how you did!',
      'Time to reveal the Final Jeopardy results!',
    ],
  },
  winner: {
    tone: 'excited',
    lines: [
      'We have our champion! {name} wins with {amount}!',
      '{name} takes the crown with {amount}!',
      'Your Jeoparty champion is {name}, finishing with {amount}!',
      'What a match! {name} wins it all!',
    ],
  },
  tie: {
    tone: 'dramatic',
    lines: [
      'A tie! We have co-champions!',
      'Unbelievable — this match ends in a tie!',
    ],
  },
};

/** Halloween-flavoured re-skins (same host, spooky delivery). */
const HALLOWEEN_LINES = {
  round_start: [
    'Welcome to Jeoparty Mayhem! Let’s get spooky!',
    'The crypt is open and the board is haunted — let’s play!',
  ],
  tile_selected: [
    'A haunted {category} for {amount}!',
    "{category}, {amount} — I'd be careful with that one...",
    "Ooh, a spooky {category}. Let's see what's in the crypt!",
  ],
  buzz: [
    'A brave soul buzzes in — {name}!',
    '{name} dares to answer!',
    '{name} rises from the pack!',
  ],
  correct: [
    'Correct! The spirits approve!',
    "That's correct — no tricks, all treat!",
    'Correct! Wonderfully eerie.',
  ],
  wrong: [
    'Incorrect! The cauldron bubbles with shame.',
    "That's a curse, not an answer!",
    'Not quite — the crypt stays locked!',
  ],
  streak: [
    '{streak} in a row for {name}! The cauldron is boiling!',
    '{name} is cursed with knowledge! {streak} straight answers!',
  ],
  timeout: [
    "Time's up! The ghosts got that one.",
    'Nobody answers — the crypt falls silent!',
  ],
  daily_double: [
    "IT'S THE JACK-O'-LANTERN TREASURE!",
    'A haunted treasure appears — it’s a Daily Double!',
  ],
  final_intro: [
    "It's time for FINAL HALLOWEEN MAYHEM!",
    'The final ritual begins... spin the wheel of fate!',
  ],
  final_category: [
    'The wheel speaks... {category}!',
    'The spirits have chosen {category}!',
  ],
  winner: [
    'We have our champion! {name} rules the crypt with {amount}!',
    '{name} takes the haunted crown with {amount}!',
  ],
};

function fillTemplate(text, ctx) {
  return String(text).replace(/\{(\w+)\}/g, (match, key) => {
    const value = ctx && ctx[key];
    return value === undefined || value === null || value === '' ? match : String(value);
  });
}

/**
 * Picks a non-repeating line for the given event.
 * @param {string} event
 * @param {object} ctx template values (name, amount, category, streak, ...)
 * @param {object} memory room-scoped memory to avoid back-to-back repeats
 * @param {{ halloween?: boolean }} options
 */
function pickHostLine(event, ctx = {}, memory = {}, options = {}) {
  const pool = HOST_LINES[event];
  const halloweenPool =
    options.halloween && HALLOWEEN_LINES[event] && !HALLOWEEN_EXCLUDE.has(event)
      ? HALLOWEEN_LINES[event]
      : null;

  let source = pool;
  if (halloweenPool && Math.random() < 0.7) {
    source = { tone: (pool && pool.tone) || 'neutral', lines: halloweenPool };
  }
  if (!source || !Array.isArray(source.lines) || source.lines.length === 0) {
    return { line: '', tone: 'neutral' };
  }

  const lines = source.lines;
  let index = Math.floor(Math.random() * lines.length);
  const previous = memory[event];
  if (lines.length > 1 && index === previous) {
    index = (index + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length;
  }
  memory[event] = index;

  return {
    line: fillTemplate(lines[index], ctx),
    tone: source.tone || 'neutral',
  };
}

/** Public (serializable) host identity for the client stage. */
function getPublicHostIdentity(isHalloween = false) {
  return {
    id: HOST_IDENTITY.id,
    name: HOST_IDENTITY.name,
    title: HOST_IDENTITY.title,
    tagline: HOST_IDENTITY.tagline,
    palette: HOST_IDENTITY.palette,
    variant: isHalloween ? HOST_IDENTITY.look.halloweenVariant : 'classic',
    permanent: true,
  };
}

module.exports = {
  HOST_IDENTITY,
  HOST_LINES,
  HALLOWEEN_LINES,
  pickHostLine,
  getPublicHostIdentity,
};
