'use strict';

/**
 * End-to-end verification harness for the Jeoparty game-show overhaul.
 * Drives the real server over WebSockets (no browser needed) and asserts the
 * multiplayer, bot, typing-freeze, streak-bonus and Final Jeopardy wheel rules.
 *
 * Usage: node scripts/verify-gameshow.js [port]
 */

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const {
  BUILTIN_CATEGORIES,
  HALLOWEEN_CATEGORIES,
  FINAL_JEOPARDY_POOL,
  HALLOWEEN_FINAL_POOL,
} = require('../server/categoriesData.js');

const PORT = Number(process.argv[2]) || 3399;
const TARGET_URL = (process.env.JEOPARTY_URL || '').trim().replace(/\/+$/, '');
const IS_REMOTE = Boolean(TARGET_URL);
const BASE = IS_REMOTE ? TARGET_URL : `http://127.0.0.1:${PORT}`;
const WS_URL = IS_REMOTE
  ? BASE.replace(/^http/i, 'ws')
  : `ws://127.0.0.1:${PORT}`;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildAnswerMap() {
  const map = new Map();
  const add = (cat) => {
    for (const clue of cat.clues || []) {
      if (clue && clue.clue && clue.answer) map.set(clue.clue, clue.answer);
    }
  };
  for (const cat of [...BUILTIN_CATEGORIES, ...HALLOWEEN_CATEGORIES]) add(cat);
  for (const f of [...FINAL_JEOPARDY_POOL, ...HALLOWEEN_FINAL_POOL]) {
    if (f && f.clue && f.answer) map.set(f.clue, f.answer);
  }
  return map;
}
const ANSWER_MAP = buildAnswerMap();

class Client {
  constructor(name, avatar) {
    this.name = name;
    this.avatar = avatar;
    this.ws = null;
    this.playerId = null;
    this.token = null;
    this.room = null;
    this.hostLines = [];
    this.sfx = [];
    this.chats = [];
    this.states = [];
    this.errors = [];
    this.closed = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      this.ws = ws;
      const timer = setTimeout(() => reject(new Error(`${this.name}: WS connect timeout`)), 8000);
      ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      ws.addEventListener('error', (e) => {
        clearTimeout(timer);
        reject(new Error(`${this.name}: WS error ${e.message || ''}`));
      });
      ws.addEventListener('message', (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.type === 'joined') {
          this.playerId = msg.playerId;
          this.token = msg.token;
        } else if (msg.type === 'room_state') {
          this.room = msg.room;
          this.states.push(msg.room);
          if (this.states.length > 200) this.states.shift();
        } else if (msg.type === 'host_line') {
          this.hostLines.push(msg);
        } else if (msg.type === 'sfx') {
          this.sfx.push(msg.sound);
        } else if (msg.type === 'chat') {
          this.chats.push(msg.message);
        } else if (msg.type === 'error') {
          this.errors.push(msg.message);
        } else if (msg.type === 'room_closed') {
          this.closed = true;
        }
      });
    });
  }

  send(payload) {
    this.ws.send(JSON.stringify(payload));
  }

  profile(extra = {}) {
    return { name: this.name, avatar: this.avatar, ...extra };
  }

  async waitFor(predicate, label, timeout = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (predicate(this)) return true;
      await sleep(25);
    }
    throw new Error(`${this.name}: timeout waiting for ${label}`);
  }

  async waitPhase(phase, timeout) {
    return this.waitFor((c) => c.room && c.room.phase === phase, `phase ${phase}`, timeout);
  }

  privateChatContaining(text) {
    return this.chats.some((m) => String(m.text || '').includes(text));
  }
}

async function waitServerReady() {
  const attempts = IS_REMOTE ? 600 : 150;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${BASE}/api/server-info`);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await sleep(100);
  }
  throw new Error('Server did not start');
}

function players(room) {
  return room?.players || [];
}
function playerByName(room, name) {
  return players(room).find((p) => p.name === name);
}
function clueKey(room) {
  const ac = room?.activeClue;
  return ac ? `${ac.col}:${ac.row}` : '';
}

async function leaveAll(clients) {
  for (const c of clients) {
    try {
      c.send({ type: 'leave_room' });
    } catch {
      // ignore
    }
  }
  await sleep(120);
  for (const c of clients) {
    try {
      c.ws.close();
    } catch {
      // ignore
    }
  }
  await sleep(200);
}

async function configureRoom(host, overrides = {}) {
  host.send({
    type: 'update_settings',
    settings: {
      autoScaleMatch: false,
      matchPace: 'custom',
      boardCols: 3,
      cluesPerCat: 3,
      clueTimeSec: 15,
      dailyDoubles: false,
      doubleJeopardy: false,
      finalJeopardy: true,
      wrongPenalty: true,
      specialFrequency: 'low',
      answerMode: 'buzzer',
      cinematicCamera: 'off',
      ...overrides,
    },
  });
  await sleep(300);
}

/** Selects the first unused tile, if this client is the picker. */
function maybePickTile(client) {
  const room = client.room;
  if (!room || room.phase !== 'board' || room.pickerId !== client.playerId) return false;
  for (let c = 0; c < room.board.categories.length; c++) {
    const tiles = room.board.categories[c].tiles;
    for (let r = 0; r < tiles.length; r++) {
      if (!tiles[r].used) {
        client.send({ type: 'select_tile', col: c, row: r });
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Full match: 2 humans + 1 bot, typing freeze/resume, streak bonus, final wheel
// ---------------------------------------------------------------------------
async function runMainMatch() {
  console.log('\n=== MAIN MATCH (buzzer, typing freeze, streak bonus, final wheel) ===');
  const alice = new Client('Alice', { color: 2, eyes: 1, mouth: 1, hat: 6 });
  const bob = new Client('Bob', { color: 5, eyes: 7, mouth: 5, hat: 8 });
  await alice.connect();
  await bob.connect();

  alice.send({ type: 'create_private', ...alice.profile(), gameMode: 'standard' });
  await alice.waitPhase('lobby');
  const roomCode = alice.room.code;
  await configureRoom(alice);
  alice.send({ type: 'add_bot' });
  await sleep(200);

  bob.send({ type: 'join_room', code: roomCode, ...bob.profile() });
  await bob.waitFor((c) => c.room && c.room.code === roomCode, 'bob joined');
  await alice.waitFor((c) => c.room && c.room.players.length === 3, 'bot added');

  check('room has 2 humans + 1 bot', players(alice.room).length === 3);
  check(
    'host settings preserved (auto-scale off, 3x3 board)',
    alice.room.settings.autoScaleMatch === false &&
      alice.room.settings.boardCols === 3 &&
      alice.room.settings.cluesPerCat === 3,
    `pace=${alice.room.settings.matchPace}`
  );

  alice.send({ type: 'start_game' });
  await alice.waitPhase('board');
  await bob.waitPhase('board');

  check(
    'board exposes real categories + money values',
    alice.room.board.categories.length === 3 &&
      alice.room.board.categories.every((c) => c.tiles.length === 3) &&
      alice.room.board.categories[0].tiles[0].value === 200 &&
      alice.room.board.categories[0].tiles[2].value === 600
  );
  check(
    'all contestants expose their customized avatars',
    players(alice.room).every((p) => p.avatar && typeof p.avatar.hat === 'number')
  );

  const boardCategoryNames = new Set(alice.room.board.categories.map((c) => c.name));

  const seen = {
    revealPlans: new Set(),
    freeze: new Set(),
    resumes: new Set(),
    correctAwards: [],
  };
  const buzzed = new Set();
  const submitted = new Set();
  const resumedChecks = new Set();
  const planChecks = new Set();

  let aliceCorrectAnswers = 0;
  let sentWrongOnce = false;
  let finalWheelChecked = false;
  let wagerPrivacyChecked = false;
  let finalClueChecked = false;
  let sawGameOver = false;
  let wheelSnapshot = null;
  let finalCorrectAnswer = null;
  let finalClueText = null;
  const playedClueTexts = new Set();

  const deadline = Date.now() + (IS_REMOTE ? 240000 : 200000);
  while (Date.now() < deadline) {
    const room = alice.room;
    if (!room) {
      await sleep(30);
      continue;
    }
    const key = clueKey(room);
    if (room.activeClue?.clueText) playedClueTexts.add(room.activeClue.clueText);

    if (room.phase === 'board') {
      maybePickTile(alice);
      await sleep(50);
      continue;
    }

    if (room.phase === 'clue_open') {
      const ac = room.activeClue;
      if (!ac) {
        await sleep(50);
        continue;
      }
      const alreadyTried = ac.attemptedIds?.includes(alice.playerId);
      if (buzzed.has(key) && alreadyTried && ac.reveal && !resumedChecks.has(key)) {
        resumedChecks.add(key);
        if (
          ac.reveal.frozenWords === null &&
          ac.reveal.baseWords >= 1 &&
          ac.reveal.wordDelays.length === ac.reveal.totalWords - ac.reveal.baseWords
        ) {
          seen.resumes.add(key);
          check(
            'incorrect answer resumes typing from the frozen word',
            true,
            `base=${ac.reveal.baseWords} remaining=${ac.reveal.wordDelays.length}`
          );
        } else {
          check(
            'incorrect answer resumes typing from the frozen word',
            false,
            JSON.stringify(ac.reveal)
          );
        }
      }
      if (!buzzed.has(key) && !alreadyTried) {
        if (ac.reveal && !planChecks.has(key) && ac.reveal.baseWords === 0) {
          planChecks.add(key);
          const n = ac.reveal.totalWords;
          const delays = ac.reveal.wordDelays;
          check(
            'server plans word-by-word clue typing',
            n > 0 && delays.length === n && delays.every((d, i) => i === 0 || d > delays[i - 1]),
            `${n} words, last word at ${delays[n - 1]}ms`
          );
          if (n >= 3) {
            const firstGap = delays[0];
            const lastGap = delays[n - 1] - delays[n - 2];
            check('typing accelerates as the timer runs down', lastGap < firstGap, `${firstGap}ms -> ${lastGap}ms`);
          }
        }
        buzzed.add(key);
        alice.send({ type: 'buzz' });
      }
      await sleep(40);
      continue;
    }

    if (room.phase === 'clue_buzzed' && room.activeClue?.buzzedPlayerId === alice.playerId) {
      const ac = room.activeClue;
      if (ac.reveal && Number.isInteger(ac.reveal.frozenWords) && !seen.freeze.has(key)) {
        seen.freeze.add(key);
        const bobFrozen =
          bob.room?.activeClue?.reveal?.frozenWords ?? null;
        check(
          'buzzer freezes the question reveal for everyone',
          ac.reveal.frozenWords >= 1 &&
            ac.reveal.frozenWords <= ac.reveal.totalWords &&
            bobFrozen === ac.reveal.frozenWords,
          `frozen at ${ac.reveal.frozenWords}/${ac.reveal.totalWords} words (both clients)`
        );
      }
      if (!submitted.has(key)) {
        submitted.add(key);
        const answer = ANSWER_MAP.get(ac.clueText) || '';
        if (!answer) {
          check('answer lookup for displayed clue', false, ac.clueText);
          alice.send({ type: 'submit_answer', answer: 'no idea' });
        } else if (!sentWrongOnce && aliceCorrectAnswers >= 4) {
          sentWrongOnce = true;
          alice.send({ type: 'submit_answer', answer: 'definitely the wrong answer' });
        } else {
          aliceCorrectAnswers++;
          alice.send({ type: 'submit_answer', answer });
        }
      }
      await sleep(40);
      continue;
    }

    if (room.phase === 'clue_chaos') {
      const ac = room.activeClue;
      if (ac && !ac.myChaosSubmission && !submitted.has(`chaos:${key}`)) {
        submitted.add(`chaos:${key}`);
        const answer = ANSWER_MAP.get(ac.clueText) || 'no idea';
        alice.send({ type: 'submit_chaos_answer', answer });
      }
      await sleep(80);
      continue;
    }

    if (room.phase === 'daily_double_wager' && room.pickerId === alice.playerId) {
      alice.send({ type: 'submit_dd_wager', wager: 200 });
      await sleep(60);
      continue;
    }

    if (room.phase === 'daily_double_answer' && room.pickerId === alice.playerId) {
      if (!submitted.has(`dd:${key}`)) {
        submitted.add(`dd:${key}`);
        const answer = ANSWER_MAP.get(room.activeClue.clueText) || 'no idea';
        alice.send({ type: 'submit_dd_answer', answer });
      }
      await sleep(60);
      continue;
    }

    if (room.phase === 'round_intermission') {
      alice.send({ type: 'continue_intermission' });
      await sleep(150);
      continue;
    }

    if (room.phase === 'final_wheel') {
      if (!finalWheelChecked) {
        finalWheelChecked = true;
        const wheelA = room.finalState.wheel;
        const wheelB = bob.room?.finalState?.wheel;
        wheelSnapshot = wheelA;
        check('Final Jeopardy wheel starts', Boolean(wheelA && wheelB), wheelA?.id);
        check(
          'wheel slices are the actual board categories',
          wheelA.sectors.length >= 3 &&
            wheelA.sectors.every((s) => boardCategoryNames.has(s.name)),
          wheelA.sectors.map((s) => s.name).join(' | ')
        );
        check(
          'both clients receive the exact same server-selected spin',
          wheelB &&
            wheelA.id === wheelB.id &&
            wheelA.targetIndex === wheelB.targetIndex &&
            JSON.stringify(wheelA.sectors) === JSON.stringify(wheelB.sectors) &&
            wheelA.revealedAt === wheelB.revealedAt,
          `target=${wheelA.targetIndex}/${wheelA.sectorCount}`
        );
        check(
          'wheel result is one of the played categories',
          boardCategoryNames.has(wheelA.wheelCategory) &&
            room.finalState.category === wheelA.wheelCategory,
          wheelA.wheelCategory
        );
        check(
          'final category is not displayed before the spin lands',
          room.phase === 'final_wheel' && room.finalState.clue === null
        );
      }
      await sleep(120);
      continue;
    }

    if (room.phase === 'final_wager') {
      if (!global.__preFinalScores) {
        global.__preFinalScores = players(room).map((p) => ({ name: p.name, score: p.score }));
        console.log('  pre-final scores:', JSON.stringify(global.__preFinalScores));
      }
      const fs = room.finalState;
      if (!fs.wagerLockedIds.includes(alice.playerId) && !wagerPrivacyChecked) {
        alice.send({ type: 'submit_final_wager', wager: 250 });
      }
      if (!bob.room.finalState.wagerLockedIds.includes(bob.playerId)) {
        bob.send({ type: 'submit_final_wager', wager: 400 });
      }
      if (
        !wagerPrivacyChecked &&
        fs.wagerLockedIds.includes(alice.playerId) &&
        (bob.room?.finalState?.wagerLockedIds || []).includes(bob.playerId)
      ) {
        wagerPrivacyChecked = true;
        // Attempt to change a locked wager — must be rejected.
        alice.send({ type: 'submit_final_wager', wager: 99999 });
        await sleep(400);
        const fs2 = alice.room.finalState;
        check(
          'final wagers are private until the reveal',
          fs2.myWager === 250 && fs2.results === null,
          `myWager=${fs2.myWager}`
        );
        check(
          'locked wagers cannot be changed',
          fs2.myWager === 250 && alice.privateChatContaining('already locked'),
          `myWager=${fs2.myWager}`
        );
      }
      await sleep(120);
      continue;
    }

    if (room.phase === 'final_clue') {
      const fs = room.finalState;
      if (!finalClueChecked) {
        finalClueChecked = true;
        finalClueText = fs.clue;
        finalCorrectAnswer = ANSWER_MAP.get(fs.clue) || null;
        check(
          'final clue types word-by-word too',
          Boolean(fs.reveal && fs.reveal.totalWords > 0 && fs.reveal.wordDelays.length === fs.reveal.totalWords),
          `${fs.reveal?.totalWords} words`
        );
        check(
          'final clue is hidden until after the wheel + wagers',
          Boolean(fs.clue) && fs.answer === null
        );
      }
      if (!fs.answerLockedIds.includes(alice.playerId)) {
        alice.send({ type: 'submit_final_answer', answer: 'wrong final answer' });
      }
      if (!fs.answerLockedIds.includes(bob.playerId)) {
        bob.send({ type: 'submit_final_answer', answer: finalCorrectAnswer || 'unknown' });
      }
      await sleep(150);
      continue;
    }

    if (room.phase === 'game_over') {
      sawGameOver = true;
      break;
    }

    await sleep(60);
  }

  const room = alice.room;
  check('match reaches game over', sawGameOver && room.phase === 'game_over', room.phase);
  // The champion announcement is intentionally delayed until after the reveal.
  await sleep(3400);
  check('typing froze on buzzed questions', seen.freeze.size >= 4, `${seen.freeze.size} freezes`);
  check('typing resumed after incorrect answers', seen.resumes.size >= 1, `${seen.resumes.size} resumes`);

  // Streak bonus (server calculated, appears in the awards stream)
  const aliceAwards = (room.awards || []).filter((a) => a.playerId === alice.playerId);
  check(
    '3rd consecutive correct answer adds a +$100 streak bonus',
    aliceAwards.some((a) => Number(a.streak) >= 3 && Number(a.streakBonus) === 100),
    JSON.stringify(aliceAwards.map((a) => ({ streak: a.streak, bonus: a.streakBonus, delta: a.delta })))
  );

  const finalResults = room.finalState?.results || [];
  console.log('  final results:', JSON.stringify(finalResults));
  check(
    'Final Jeopardy results include everyone',
    finalResults.length === 3 && finalResults.every((r) => typeof r.delta === 'number' && 'correct' in r)
  );
  const bobResult = finalResults.find((r) => r.name === 'Bob');
  check('correct final answer applies the locked wager', Boolean(bobResult && bobResult.correct && bobResult.wager === 400),
    JSON.stringify(bobResult));
  check(
    'final scores match the authoritative player scores',
    finalResults.every((r) => {
      const p = playerByName(room, r.name);
      return p && p.score === r.finalScore;
    }),
    JSON.stringify(finalResults.map((r) => [r.name, r.finalScore]))
  );
  check(
    'both clients agree on final scores',
    JSON.stringify(players(room).map((p) => p.score).sort()) ===
      JSON.stringify(players(bob.room).map((p) => p.score).sort())
  );
  check(
    'final clue is fresh (not a board clue already played)',
    Boolean(finalClueText) && !playedClueTexts.has(finalClueText),
    `${playedClueTexts.size} board clues played`
  );
  check(
    'final money awards recorded for podium animations',
    (room.awards || []).some((a) => a.kind === 'final')
  );

  // Host presenter
  const hostEvents = new Set(alice.hostLines.map((h) => h.event));
  for (const expected of ['round_start', 'tile_selected', 'buzz', 'final_intro', 'final_category', 'final_reveal', 'winner']) {
    check(`host announces "${expected}"`, hostEvents.has(expected), Array.from(hostEvents).join(','));
  }
  check(
    'host uses varied dialogue variants',
    new Set(alice.hostLines.map((h) => h.line)).size >= Math.min(5, alice.hostLines.length)
  );
  check(
    'host is permanent, named, and not a player',
    room.host.name === 'Jeoparty Host' &&
      room.host.permanent === true &&
      !players(room).some((p) => p.id === room.host.id)
  );
  check(
    'host never announces a correct answer as incorrect',
    !alice.hostLines.some((h) => h.event === 'correct' && /incorrect/i.test(h.line))
  );
  check(
    'host announces money loss contextually',
    hostEvents.has('wrong') || hostEvents.has('answer_timeout')
  );
  check('no client-side errors propagated', alice.errors.length === 0 && bob.errors.length === 0,
    [...alice.errors, ...bob.errors].join(' | '));
  check('wheel stop sound broadcast to clients', alice.sfx.includes('wheel_stop'));

  await leaveAll([alice, bob]);
}

// ---------------------------------------------------------------------------
// Halloween Mayhem compatibility
// ---------------------------------------------------------------------------
async function runHalloweenMatch() {
  console.log('\n=== HALLOWEEN MAYHEM COMPATIBILITY ===');
  const h = new Client('Witchy', { color: 26, eyes: 17, mouth: 18, hat: 11 });
  await h.connect();
  h.send({ type: 'create_private', ...h.profile(), gameMode: 'halloween' });
  await h.waitPhase('lobby');
  await configureRoom(h, { boardCols: 3, cluesPerCat: 3, dailyDoubles: true, clueTimeSec: 15 });
  h.send({ type: 'add_bot' });
  await sleep(300);
  h.send({ type: 'start_game' });
  await h.waitPhase('board');

  check('Halloween mode preserved', h.room.gameMode === 'halloween');
  check('Halloween currency preserved', h.room.currency === 'candy');
  check(
    'Halloween cosmetics preserved on the podium',
    playerByName(h.room, 'Witchy')?.avatar.hat === 11 &&
      playerByName(h.room, 'Witchy')?.avatar.color === 26
  );
  check('Halloween host stays the same host', h.room.host.name === 'Jeoparty Host');
  check(
    'Halloween board built from halloween category pool',
    h.room.board.categories.every((c) =>
      HALLOWEEN_CATEGORIES.some((hc) => hc.name === c.name)
    ),
    h.room.board.categories.map((c) => c.name).join(' | ')
  );

  maybePickTile(h);
  await sleep(600);
  const phase = h.room.phase;
  const ac = h.room.activeClue;
  check(
    'Halloween clue presentation (typing plan) works',
    ['clue_open', 'daily_double_wager', 'clue_chaos', 'clue_result'].includes(phase) &&
      (phase === 'daily_double_wager' || phase === 'clue_result' || !ac || Boolean(ac.reveal)),
    phase
  );

  h.send({ type: 'back_to_lobby' });
  await h.waitPhase('lobby');
  check('back to lobby resets match presentation state',
    h.room.board === null && h.room.finalState === null && h.room.awards.length === 0);
  await leaveAll([h]);
}

// ---------------------------------------------------------------------------
// Public rooms + 10-podium capacity
// ---------------------------------------------------------------------------
async function runCapacityAndPublicRooms() {
  console.log('\n=== PUBLIC ROOMS + 10 PLAYER CAPACITY ===');
  const host = new Client('FullHouse', { color: 3, eyes: 3, mouth: 3, hat: 3 });
  await host.connect();
  host.send({ type: 'create_public', ...host.profile(), gameMode: 'standard' });
  await host.waitPhase('lobby');
  const code = host.room.code;

  const publicJson = await (await fetch(`${BASE}/api/public-rooms`)).json();
  check('public room is discoverable', publicJson.rooms.some((r) => r.code === code), code);

  for (let i = 0; i < 12; i++) {
    host.send({ type: 'add_bot' });
    await sleep(55);
  }
  await sleep(400);
  check('room never exceeds 10 total players', players(host.room).length === 10, `${players(host.room).length}`);
  check(
    'bots keep their assigned distinct avatars',
    new Set(players(host.room).map((p) => `${p.avatar.color}:${p.avatar.eyes}:${p.avatar.mouth}:${p.avatar.hat}`)).size >= 8
  );
  check(
    'per-bot difficulty preserved',
    players(host.room).filter((p) => p.isBot).every((p) => ['easy', 'medium', 'hard', 'champion'].includes(p.botDifficulty))
  );

  await configureRoom(host, { boardCols: 3, cluesPerCat: 3 });
  host.send({ type: 'start_game' });
  await host.waitPhase('board');
  maybePickTile(host);
  await sleep(600);
  check(
    '10-player match starts and opens a clue',
    ['clue_open', 'clue_chaos', 'clue_result'].includes(host.room.phase),
    host.room.phase
  );
  check('10 contestants serialized for podiums', players(host.room).length === 10);
  await leaveAll([host]);
}

// ---------------------------------------------------------------------------
// Cinematic intro (server storyboard, sync, skip, setting modes, 10 players)
// ---------------------------------------------------------------------------
const INTRO_HOST_LINE = "Hello, everyone! I'm your host, and welcome to Jeoparty!";
const INTRO_OUTRO_LINE = "Alright, contestants! Let's get this game started!";

async function runCinematicIntroTests() {
  console.log('\n=== CINEMATIC INTRO + CAMERA SETTING ===');
  const host = new Client('IntroHost', { color: 1, eyes: 2, mouth: 3, hat: 4 });
  let guest = new Client('IntroGuest', { color: 8, eyes: 6, mouth: 2, hat: 9 });
  await host.connect();
  await guest.connect();

  host.send({ type: 'create_private', ...host.profile(), gameMode: 'standard' });
  await host.waitPhase('lobby');
  const roomCode = host.room.code;
  await configureRoom(host, { cinematicCamera: 'on' });
  host.send({ type: 'add_bot' });
  await sleep(180);
  host.send({ type: 'add_bot' });
  await sleep(250);
  guest.send({ type: 'join_room', code: roomCode, ...guest.profile() });
  await guest.waitFor((c) => c.room && c.room.code === roomCode, 'guest joined');
  await host.waitFor((c) => c.room && c.room.players.length === 4, '4 players');

  check('cinematic camera setting persists (on)', host.room.settings.cinematicCamera === 'on');
  host.send({ type: 'start_game' });
  await host.waitPhase('intro', 15000);
  await guest.waitPhase('intro', 15000);

  const intro = host.room.intro;
  check('match opens with a cinematic intro phase', Boolean(intro && intro.steps?.length >= 5));
  check(
    'intro storyboard is wide -> host -> players -> board',
    intro.steps[0].kind === 'wide' &&
      intro.steps[1].kind === 'host' &&
      intro.steps[intro.steps.length - 1].kind === 'board' &&
      intro.steps.slice(2, -1).every((s) => s.kind === 'player')
  );
  check(
    'host welcome line is exact',
    intro.steps[1].line === INTRO_HOST_LINE,
    intro.steps[1].line
  );
  check(
    'host board-reveal line is exact',
    intro.steps[intro.steps.length - 1].line === INTRO_OUTRO_LINE,
    intro.steps[intro.steps.length - 1].line
  );

  const playerSteps = intro.steps.filter((s) => s.kind === 'player');
  const connected = host.room.players.filter((p) => p.connected);
  check(
    'every connected player is introduced exactly once',
    playerSteps.length === connected.length &&
      playerSteps.every((s, idx) => s.playerId === connected[idx].id)
  );
  check(
    'introductions use real usernames and avatars (no invented identities)',
    playerSteps.every((s) => {
      const p = connected.find((x) => x.id === s.playerId);
      return (
        p &&
        s.name === p.name &&
        JSON.stringify(s.avatar) === JSON.stringify(p.avatar)
      );
    }),
    playerSteps.map((s) => s.name).join(', ')
  );
  check(
    'human contestants speak their real username',
    playerSteps
      .filter((s) => !s.isBot)
      .every((s) => s.line === `Hello, I'm ${s.name}!`)
  );
  check(
    'bots use a short scripted intro line (no AI personality)',
    playerSteps
      .filter((s) => s.isBot)
      .every((s) => s.line === `I'm ${s.name}, and I'm ready to play!`)
  );
  check(
    'all clients share the same intro order and timing',
    guest.room.intro &&
      guest.room.intro.startedAt === intro.startedAt &&
      guest.room.intro.durationMs === intro.durationMs &&
      JSON.stringify(guest.room.intro.steps) === JSON.stringify(intro.steps)
  );
  check(
    'intro duration is reasonable for the roster',
    intro.durationMs >= 4000 && intro.durationMs <= 20000,
    `${intro.durationMs}ms for ${playerSteps.length} players`
  );

  // A brand-new joiner must not break the live broadcast.
  const late = new Client('LateJoin', { color: 3, eyes: 3, mouth: 3, hat: 3 });
  await late.connect();
  late.send({ type: 'join_room', code: roomCode, ...late.profile() });
  await sleep(500);
  check(
    'late joiners cannot disrupt the live intro',
    late.errors.some((e) => /already started/i.test(e)) &&
      host.room.phase === 'intro' &&
      host.room.players.length === 4,
    late.errors.join(' | ')
  );
  try {
    late.ws.close();
  } catch {
    // ignore
  }

  // Reconnecting with the saved token must return to the live intro state.
  const guestToken = guest.token;
  const guestAvatar = guest.avatar;
  guest.ws.close();
  await sleep(300);
  const guest2 = new Client('IntroGuest', guestAvatar);
  await guest2.connect();
  guest2.send({
    type: 'join_room',
    code: roomCode,
    ...guest2.profile(),
    token: guestToken,
  });
  await guest2.waitFor(
    (c) => c.room && c.room.phase === 'intro',
    'reconnected into live intro',
    12000
  );
  check(
    'reconnecting player returns to the same intro position',
    Boolean(guest2.room.intro) &&
      guest2.room.intro.startedAt === intro.startedAt &&
      guest2.room.intro.durationMs === intro.durationMs
  );
  guest = guest2;

  // Only the host may advance the room past the intro.
  guest.send({ type: 'skip_intro' });
  await sleep(350);
  check('non-host cannot skip the intro for everyone', host.room.phase === 'intro');
  check(
    'non-host skip request is rejected',
    guest.errors.some((e) => /only the room host/i.test(e)),
    guest.errors.join(' | ')
  );

  host.send({ type: 'skip_intro' });
  await host.waitPhase('board', 12000);
  await guest.waitPhase('board', 12000);
  check('host skip advances every client to the interactive board', host.room.phase === 'board');
  check(
    'host announces the exact board-reveal line after the intro',
    host.hostLines.some(
      (h) => h.event === 'intro_outro' && h.line === INTRO_OUTRO_LINE
    )
  );

  // Reduced motion mode: shorter storyboard, same order.
  await host.send({ type: 'back_to_lobby' });
  await host.waitPhase('lobby');
  await guest.waitPhase('lobby');
  await configureRoom(host, { cinematicCamera: 'reduced' });
  host.send({ type: 'start_game' });
  await host.waitPhase('intro', 15000);
  const reducedIntro = host.room.intro;
  check('reduced motion still presents the contestant storyboard',
    reducedIntro.steps.filter((s) => s.kind === 'player').length === 4);
  check(
    'reduced motion shortens the intro compared with enabled',
    reducedIntro.durationMs < intro.durationMs,
    `${reducedIntro.durationMs}ms < ${intro.durationMs}ms`
  );
  host.send({ type: 'skip_intro' });
  await host.waitPhase('board', 12000);

  // Disabled mode: no intro at all.
  await host.send({ type: 'back_to_lobby' });
  await host.waitPhase('lobby');
  await guest.waitPhase('lobby');
  await configureRoom(host, { cinematicCamera: 'off' });
  host.states = [];
  host.send({ type: 'start_game' });
  await host.waitPhase('board', 12000);
  check(
    'disabled camera skips the intro and starts on the board',
    host.room.phase === 'board' && host.room.intro === null
  );
  check(
    'disabled camera never sends an intro phase',
    !host.states.some((s) => s.phase === 'intro')
  );

  // 10-player introduction.
  await host.send({ type: 'back_to_lobby' });
  await host.waitPhase('lobby');
  await guest.waitPhase('lobby');
  await configureRoom(host, { cinematicCamera: 'on' });
  const currentBots = host.room.players.filter((p) => p.isBot).length;
  for (let i = currentBots; i < 8; i++) {
    host.send({ type: 'add_bot' });
    await sleep(70);
  }
  await host.waitFor((c) => c.room && c.room.players.length === 10, '10 players');
  host.send({ type: 'start_game' });
  await host.waitPhase('intro', 15000);
  const bigIntro = host.room.intro;
  const bigPlayers = bigIntro.steps.filter((s) => s.kind === 'player');
  check('10-contestant intro includes every podium', bigPlayers.length === 10);
  check(
    '10-contestant intro stays under 21 seconds',
    bigIntro.durationMs <= 21000,
    `${bigIntro.durationMs}ms`
  );
  check(
    'all 10 introduced names match the lobby roster',
    bigPlayers.every((s, idx) => s.name === host.room.players[idx].name)
  );
  host.send({ type: 'skip_intro' });
  await host.waitPhase('board', 12000);
  check('10-player match begins after the intro', host.room.phase === 'board');

  await leaveAll([host, guest]);
}

// ---------------------------------------------------------------------------
// Static asset check
// ---------------------------------------------------------------------------
async function runStaticChecks() {
  console.log('\n=== STATIC ASSETS ===');
  for (const file of [
    '/',
    '/css/styles.css?v=4.1.0',
    '/css/gameshow.css?v=4.1.0',
    '/css/cinematic.css?v=4.1.0',
    '/js/app.js?v=4.1.0',
    '/js/gameshow.js',
    '/js/host.js',
    '/js/cinematic.js',
  ]) {
    const res = await fetch(`${BASE}${file}`);
    const body = await res.text();
    check(`serves ${file}`, res.status === 200 && body.length > 100, `${res.status} ${body.length}b`);
  }
  const html = await (await fetch(`${BASE}/`)).text();
  check('index includes host stage', html.includes('id="host-stage"'));
  check('index includes contestant podiums', html.includes('id="contestant-stage"'));
  check('index includes final wheel', html.includes('id="final-wheel"'));
  check('index includes cinematic layer', html.includes('id="cinematic-layer"'));
  check('index includes cinematic stylesheet', html.includes('/css/cinematic.css'));
  check(
    'index includes the Cinematic Camera setting',
    html.includes('data-camera="on"') &&
      html.includes('data-camera="reduced"') &&
      html.includes('data-camera="off"')
  );
  check('index includes gameshow stylesheet', html.includes('/css/gameshow.css'));
}

async function main() {
  const serverPath = path.join(__dirname, '..', 'server', 'server.js');
  const artifactDir = path.join(__dirname, 'artifacts');
  fs.mkdirSync(artifactDir, { recursive: true });
  const logPath = path.join(artifactDir, 'verify-server.log');
  const out = IS_REMOTE ? null : fs.openSync(logPath, 'w');
  const child = IS_REMOTE
    ? null
    : spawn(process.execPath, [serverPath], {
        env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
        stdio: ['ignore', out, out],
      });
  let exitCode = 0;
  console.log(
    IS_REMOTE ? `\nTarget: DEPLOYED ${BASE}` : `\nTarget: LOCAL ${BASE}`
  );
  try {
    await waitServerReady();
    await runStaticChecks();
    await runMainMatch();
    await runCinematicIntroTests();
    await runHalloweenMatch();
    await runCapacityAndPublicRooms();
  } catch (err) {
    console.error('\nFATAL:', err && err.stack ? err.stack : err);
    exitCode = 1;
  } finally {
    if (child) {
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore
      }
    }
    if (out) fs.closeSync(out);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== SUMMARY: ${results.length - failed.length}/${results.length} checks passed ===`);
  if (failed.length > 0) {
    console.log('FAILED CHECKS:');
    for (const f of failed) console.log(` - ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
    exitCode = 1;
  }
  if (!IS_REMOTE) {
    const log = fs.readFileSync(logPath, 'utf8');
    if (/Error|Unhandled|TypeError|ReferenceError/.test(log)) {
      console.log('\n--- SERVER LOG (errors detected) ---\n' + log.slice(-5000));
      exitCode = 1;
    }
  }
  process.exit(exitCode);
}

main();
