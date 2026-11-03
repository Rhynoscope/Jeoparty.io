'use strict';

/**
 * Verifies the live server contracts for modes, rotating judge, bots, and
 * multiplayer scoring. Run with: node scripts/verify-modes-and-judge.js
 */
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const path = require('node:path');
const { BUILTIN_CATEGORIES, HALLOWEEN_CATEGORIES } = require('../server/categoriesData.js');
const { evaluateAnswer, normalizeAnswer } = require('../server/answerMatcher.js');

const PORT = Number(process.env.JEOPARTY_TEST_PORT) || 3417;
const BASE = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const SERVER_PATH = path.resolve(__dirname, '../server/server.js');
const SERVER_SOURCE = require('node:fs').readFileSync(SERVER_PATH, 'utf8');
const HTML_SOURCE = require('node:fs').readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
const APP_SOURCE = require('node:fs').readFileSync(path.resolve(__dirname, '../public/js/app.js'), 'utf8');
const SHOW_SOURCE = require('node:fs').readFileSync(path.resolve(__dirname, '../public/js/gameshow.js'), 'utf8');
const SHOW_CSS = require('node:fs').readFileSync(path.resolve(__dirname, '../public/css/gameshow.css'), 'utf8');
const JUDGE_SOURCE = require('node:fs').readFileSync(path.resolve(__dirname, '../public/js/judge.js'), 'utf8');
const ANSWERS = new Map();
for (const category of [...BUILTIN_CATEGORIES, ...HALLOWEEN_CATEGORIES]) {
  for (const clue of category.clues || []) if (clue?.clue && clue.answer) ANSWERS.set(clue.clue, clue.answer);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pass = (name, detail = '') => console.log(`PASS ${name}${detail ? ` — ${detail}` : ''}`);
const fail = (name, error) => console.error(`FAIL ${name} — ${error.message}`);

function staticChecks() {
  const modes = ['standard', 'survival', 'double_or_nothing', 'hot_potato', 'teams', 'chaos', 'speed', 'streak_race', 'halloween'];
  for (const mode of modes) {
    assert(SERVER_SOURCE.includes(`'${mode}'`), `server is missing mode ${mode}`);
    assert(HTML_SOURCE.includes(`data-mode="${mode}"`), `lobby is missing mode selector ${mode}`);
  }
  for (const id of ['speed_blitz', 'steal', 'chaos_all_play', 'double_trouble', 'treasure_clue', 'risky_business', 'triple_threat', 'category_takeover', 'last_chance', 'mystery_question', 'reverse_jeoparty']) {
    assert(SERVER_SOURCE.includes(`'${id}'`), `special tile ${id} is not registered`);
    assert(HTML_SOURCE.includes(`data-special-round="${id}"`), `special tile ${id} has no host control`);
  }
  assert(HTML_SOURCE.includes('id="game-mode-description"'), 'mode description is missing');
  assert(HTML_SOURCE.includes('value="judge"'), 'rotating judge is not selectable');
  assert(HTML_SOURCE.includes('id="judge-stage"') && HTML_SOURCE.includes('id="judge-accept-btn"') && HTML_SOURCE.includes('id="judge-reject-btn"'), 'judge role or decision UI is missing');
  for (const token of ['pickRotatingJudge', 'handleJudgeDecision', 'resolvePendingJudgment', 'handleJudgeDisconnect', 'JUDGE_DECISION_MS']) {
    assert(SERVER_SOURCE.includes(token), `server is missing ${token}`);
  }
  assert(SERVER_SOURCE.includes("evaluation.status === 'correct'"), 'automatic exact-answer verification is missing');
  assert(SERVER_SOURCE.includes('judge_disconnect_fallback') && SERVER_SOURCE.includes('judge_timeout_fallback'), 'judge fallback paths are missing');
  assert(SERVER_SOURCE.includes('teamScoreLedger') && SERVER_SOURCE.includes('teamNextAnswerer'), 'shared team bank or alternating turns are missing');
  assert(SERVER_SOURCE.includes('startHotPotatoFuse') && SERVER_SOURCE.includes('pass_hot_potato'), 'timed potato pass flow is missing');
  assert(SERVER_SOURCE.includes("ac.riskChoices?.[player.id] === 'double'"), 'Double or Nothing choice is not scored');
  assert(SHOW_SOURCE.includes("const avatarSize = count <= 3 ? 172 : count <= 6 ? 142 : 116"), 'large responsive podium avatar sizes are missing');
  assert(SHOW_SOURCE.includes('judgeIsActive') && SHOW_SOURCE.includes('updateJudgeStage'), 'judge is not temporarily separated from contestant podiums');
  assert(JUDGE_SOURCE.includes('judge-gavel') && JUDGE_SOURCE.includes('judge-raised-hand'), 'judge character animations are missing');
  assert(SHOW_CSS.includes('.contestant-stage[data-density=\'compact\']') && SHOW_CSS.includes('grid-template-columns'), 'large contestant and responsive special settings styles are missing');

  const baseline = execFileSync('git', ['show', 'HEAD:server/server.js'], { encoding: 'utf8' });
  const championBlock = (source) => source.replace(/\r\n/g, '\n').match(/\} else if \(difficulty === 'champion'\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  assert(championBlock(SERVER_SOURCE), 'Champion profile was not found');
  assert.equal(championBlock(SERVER_SOURCE), championBlock(baseline), 'Champion bot profile changed from deployed baseline');
  for (const marker of ['baseAccuracy = 0.52;', 'baseAccuracy = 0.74;', 'baseAccuracy = 0.88;', 'minHesitationMs = 550;', 'maxHesitationMs = 1150;']) {
    assert(SERVER_SOURCE.includes(marker), `expected stronger non-Champion profile marker ${marker}`);
  }
  pass('static gameplay, UI, fairness, and art contracts');
}

class Client {
  constructor(name, color = 0) {
    this.name = name;
    this.avatar = { color, eyes: 1, mouth: 1, hat: 0 };
    this.ws = null;
    this.playerId = null;
    this.room = null;
    this.chats = [];
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);
      const timer = setTimeout(() => reject(new Error(`${this.name} connect timeout`)), 8000);
      this.ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      this.ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error(`${this.name} socket error`)); });
      this.ws.addEventListener('message', (event) => {
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message.type === 'joined') this.playerId = message.playerId;
        if (message.type === 'room_state') this.room = message.room;
        if (message.type === 'chat') this.chats.push(message.message);
      });
    });
  }
  send(data) { this.ws.send(JSON.stringify(data)); }
  async waitFor(predicate, label, timeout = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (predicate(this)) return this.room;
      await sleep(20);
    }
    throw new Error(`${this.name} timed out waiting for ${label}; phase=${this.room?.phase}`);
  }
  close() { try { this.ws?.close(); } catch {} }
}

async function waitReady() {
  for (let i = 0; i < 200; i++) {
    try { if ((await fetch(`${BASE}/api/server-info`)).ok) return; } catch {}
    await sleep(100);
  }
  throw new Error('server did not become ready');
}

function allRooms(clients, predicate) { return clients.every((client) => predicate(client.room)); }
async function createRoom(clients, mode, extras = {}) {
  await Promise.all(clients.map((client) => client.connect()));
  const [host, ...guests] = clients;
  host.send({ type: 'create_private', name: host.name, avatar: host.avatar, gameMode: mode });
  await host.waitFor((client) => client.room?.phase === 'lobby', 'private room');
  for (const guest of guests) guest.send({ type: 'join_room', code: host.room.code, name: guest.name, avatar: guest.avatar });
  await Promise.all(guests.map((guest) => guest.waitFor((client) => client.room?.players?.length === clients.length, 'room join')));
  await configure(host, { gameMode: mode, ...extras });
  return host.room.code;
}

async function configure(host, settings) {
  host.send({ type: 'update_settings', settings: {
    autoScaleMatch: false,
    matchPace: 'custom',
    boardCols: 3,
    cluesPerCat: 3,
    clueTimeSec: 20,
    dailyDoubles: false,
    doubleJeopardy: false,
    finalJeopardy: false,
    specialFrequency: 'low',
    enabledSpecialRounds: [],
    specialSchedule: 'random',
    answerMode: 'buzzer',
    cinematicCamera: 'off',
    ...settings,
  } });
  await host.waitFor((client) => client.room?.phase === 'lobby' && Object.entries(settings).every(([key, value]) => {
    const actual = client.room.settings?.[key];
    return Array.isArray(value) ? JSON.stringify(actual) === JSON.stringify(value) : actual === value;
  }), 'settings sync');
}

async function startGame(host, clients, phase = 'board') {
  host.send({ type: 'start_game' });
  await Promise.all(clients.map((client) => client.waitFor((c) => c.room?.phase === phase, `${phase} start`, 18000)));
}

function locateClient(clients, playerId) { return clients.find((client) => client.playerId === playerId); }
function findAnswer(clue) { return ANSWERS.get(clue); }
function firstUnusedTile(room) {
  for (const category of room.board.categories) {
    for (const tile of category.tiles) if (!tile.used) return { col: tile.col, row: tile.row };
  }
  throw new Error('board had no unused tile');
}

async function selectClue(clients) {
  const room = clients[0].room;
  assert.equal(room.phase, 'board');
  const picker = locateClient(clients, room.pickerId);
  assert(picker, 'picker must be connected for test clue');
  picker.send({ type: 'select_tile', ...firstUnusedTile(room) });
  await Promise.all(clients.map((client) => client.waitFor((c) => c.room?.phase === 'clue_open', 'clue open')));
  return clients[0].room.activeClue;
}

async function answerClue(clients, player, text, riskChoice) {
  player.send({ type: 'buzz', ...(riskChoice ? { riskChoice } : {}) });
  await Promise.all(clients.map((client) => client.waitFor((c) => c.room?.phase === 'clue_buzzed', 'buzz accepted')));
  player.send({ type: 'submit_answer', answer: text });
}

async function waitClueResult(clients) {
  await Promise.all(clients.map((client) => client.waitFor((c) => c.room?.phase === 'clue_result', 'clue result', 9000)));
}

function ambiguousGuess(answer) {
  const base = normalizeAnswer(answer);
  const letterIndexes = [...base].flatMap((char, index) => /[a-z0-9]/.test(char) ? [index] : []);
  for (let a = 0; a < letterIndexes.length; a++) for (let b = a + 1; b < letterIndexes.length; b++) for (let c = b + 1; c < letterIndexes.length; c++) {
    const guess = [...base];
    for (const [idx, replacement] of [[letterIndexes[a], 'q'], [letterIndexes[b], 'x'], [letterIndexes[c], 'z']]) {
      guess[idx] = guess[idx] === replacement ? 'w' : replacement;
    }
    const text = guess.join('');
    if (evaluateAnswer(text, { answer }).status === 'close') return text;
  }
  return null;
}

async function runJudgeScenario() {
  const clients = [new Client('JudgeHost', 2), new Client('JudgeGuestA', 5), new Client('JudgeGuestB', 7)];
  try {
    await createRoom(clients, 'standard', { answerMode: 'judge', wrongPenalty: true, clueTimeSec: 20 });
    await startGame(clients[0], clients);
    const judgeIds = [];

    // Exact answer: judge is visible and excluded; an exact correct answer bypasses judging.
    let clue = await selectClue(clients);
    let judge = locateClient(clients, clue.judgeId);
    assert(judge, 'server must assign an eligible human judge');
    judgeIds.push(clue.judgeId);
    judge.send({ type: 'buzz' });
    await sleep(120);
    assert.equal(clients[0].room.phase, 'clue_open', 'judge must not buzz');
    let answerer = clients.find((candidate) => candidate.playerId !== clue.judgeId);
    let answer = findAnswer(clue.clue);
    assert(answer, `official answer not found for test clue: ${clue.clue}`);
    await answerClue(clients, answerer, answer);
    await waitClueResult(clients);
    const exactScore = clients[0].room.players.find((p) => p.id === answerer.playerId).score;
    assert(exactScore > 0, 'verified correct answer should receive score automatically');
    assert.equal(clients[0].room.judgeLog.length, 0, 'verified correct answers must never be judgeable');
    judge.send({ type: 'judge_decision', ruling: 'reject' });
    await sleep(100);
    assert.equal(clients[0].room.players.find((p) => p.id === answerer.playerId).score, exactScore, 'judge cannot undo a verified correct answer');
    pass('judge exclusion and automatic verified-correct scoring');

    // Find a clue with a real close answer, then let the judge accept it.
    let accepted = false;
    for (let attempt = 0; attempt < 8 && !accepted; attempt++) {
      await clients[0].waitFor((c) => c.room?.phase === 'board', 'board after result', 8000);
      clue = await selectClue(clients);
      judge = locateClient(clients, clue.judgeId);
      answerer = clients.find((candidate) => candidate.playerId !== clue.judgeId);
      answer = findAnswer(clue.clue);
      const closeGuess = answer && ambiguousGuess(answer);
      judgeIds.push(clue.judgeId);
      if (!closeGuess) {
        assert(answer, `official answer missing: ${clue.clue}`);
        await answerClue(clients, answerer, answer);
        await waitClueResult(clients);
        continue;
      }
      await answerClue(clients, answerer, closeGuess);
      await judge.waitFor((client) => client.room?.activeClue?.pendingJudgment?.guess === closeGuess, 'judge sees ambiguous answer');
      const observer = clients.find((client) => client.playerId !== judge.playerId && client.playerId !== answerer.playerId);
      assert.equal(observer.room.activeClue.pendingJudgment.guess, null, 'ambiguous text is private to judge and answerer');
      assert.equal(observer.room.activeClue.judgeId, judge.playerId, 'judge is exposed as a distinct role');
      judge.send({ type: 'judge_decision', ruling: 'accept' });
      await waitClueResult(clients);
      const entry = clients[0].room.judgeLog.at(-1);
      assert.equal(entry.ruling, 'accepted');
      assert.equal(entry.source, 'judge');
      accepted = true;
    }
    assert(accepted, 'expected at least one board clue with an answer that enters ambiguous review');
    pass('ambiguous answer privacy, accept control, and decision audit log');

    // Test both replacement assignment and automatic fallback when the replacement disconnects.
    await clients[0].waitFor((c) => c.room?.phase === 'board', 'board for disconnect test', 8000);
    let pending = false;
    for (let attempt = 0; attempt < 8 && !pending; attempt++) {
      clue = await selectClue(clients);
      judge = locateClient(clients, clue.judgeId);
      answerer = clients.find((candidate) => candidate.playerId !== clue.judgeId);
      answer = findAnswer(clue.clue);
      const closeGuess = answer && ambiguousGuess(answer);
      if (closeGuess) {
        await answerClue(clients, answerer, closeGuess);
        await judge.waitFor((client) => client.room?.activeClue?.pendingJudgment?.guess === closeGuess, 'open judgment');
        pending = true;
        break;
      }
      await answerClue(clients, answerer, answer);
      await waitClueResult(clients);
      await clients[0].waitFor((c) => c.room?.phase === 'board', 'next board', 8000);
    }
    assert(pending, 'expected an ambiguous clue for disconnect fallback test');
    const originalJudgeId = judge.playerId;
    judge.close();
    await answerer.waitFor((client) => client.room?.activeClue?.judgeId && client.room.activeClue.judgeId !== originalJudgeId, 'judge replacement');
    const replacementId = answerer.room.activeClue.judgeId;
    const replacement = locateClient(clients, replacementId);
    assert(replacement, 'replacement judge must be a connected player');
    pass('judge disconnection selects another eligible player');
    replacement.close();
    await answerer.waitFor((client) => client.room?.phase === 'clue_result', 'automatic fallback resolution', 4000);
    assert.equal(answerer.room.judgeLog.at(-1).source, 'judge_disconnect_fallback');
    pass('no-judge fallback resolves the answer and logs the fallback');

    assert(new Set(judgeIds).size >= 2, 'multiple eligible humans should rotate into judging');
    for (let i = 1; i < judgeIds.length; i++) assert.notEqual(judgeIds[i], judgeIds[i - 1], 'the same judge should not be selected on consecutive clues');
    pass('judge rotation avoids repeating the last judge');
  } finally {
    for (const client of clients) client.close();
    await sleep(180);
  }
}

async function runDoubleOrNothingScenario() {
  const clients = [new Client('RiskHost', 1), new Client('RiskGuest', 4)];
  try {
    await createRoom(clients, 'double_or_nothing', { wrongPenalty: false, clueTimeSec: 20 });
    await startGame(clients[0], clients);
    const clue = await selectClue(clients);
    assert.equal(clue.value, clients[0].room.board.categories[clue.col].tiles[clue.row].value, 'mode uses a base clue value and lets each player choose risk');
    const picker = locateClient(clients, clients[0].room.pickerId);
    const first = clients.find((candidate) => candidate !== picker);
    const before = clients[0].room.players.find((p) => p.id === first.playerId).score;
    const value = clue.value;
    await answerClue(clients, first, 'absolutely not the answer', 'double');
    await first.waitFor((client) => client.room?.phase === 'clue_open', 'wrong double wager rebounds');
    const afterMiss = first.room.players.find((p) => p.id === first.playerId).score;
    assert.equal(afterMiss, before - value, 'double choice loses the clue value even when classic penalties are disabled');
    const rightAnswerer = clients.find((candidate) => candidate !== first);
    const official = findAnswer(clue.clue);
    assert(official, 'official answer is needed for reward test');
    const scoreBefore = rightAnswerer.room.players.find((p) => p.id === rightAnswerer.playerId).score;
    await answerClue(clients, rightAnswerer, official, 'double');
    await waitClueResult(clients);
    const scoreAfter = rightAnswerer.room.players.find((p) => p.id === rightAnswerer.playerId).score;
    assert(scoreAfter - scoreBefore >= value * 2, 'double choice must award at least twice the clue value');
    pass('Double or Nothing safe baseline, player wager, loss, and doubled reward');
  } finally {
    clients.forEach((client) => client.close());
    await sleep(180);
  }
}

async function runHotPotatoScenario() {
  const clients = [new Client('PotatoHost', 2), new Client('PotatoGuest', 6)];
  try {
    await createRoom(clients, 'hot_potato', { clueTimeSec: 20 });
    await startGame(clients[0], clients);
    const clue = await selectClue(clients);
    const initialHolderId = clue.hotPotatoHolderId;
    assert(initialHolderId, 'potato must begin with a contestant');
    const initialHolder = locateClient(clients, initialHolderId);
    initialHolder.send({ type: 'pass_hot_potato' });
    await Promise.all(clients.map((client) => client.waitFor((c) => c.room?.activeClue?.hotPotatoHolderId && c.room.activeClue.hotPotatoHolderId !== initialHolderId, 'potato pass')));
    const holderAfterPass = clients[0].room.activeClue.hotPotatoHolderId;
    assert(clients[0].room.activeClue.hotPotatoExpiresAt > Date.now(), 'pass resets the server-owned fuse');
    await sleep(6800);
    assert(clients[0].room.players.find((p) => p.id === holderAfterPass).score <= -100, 'fuse timeout penalizes the holder and passes the potato');
    assert.notEqual(clients[0].room.activeClue.hotPotatoHolderId, holderAfterPass, 'expired fuse passes to another contestant');
    pass('Hot Potato manual pass, visible fuse deadline, timeout penalty, and automatic pass');
  } finally {
    clients.forEach((client) => client.close());
    await sleep(180);
  }
}

async function runTeamScenario() {
  const clients = [new Client('TeamHost', 0), new Client('TeamMate', 3), new Client('BluePlayer', 8)];
  try {
    await createRoom(clients, 'teams', { clueTimeSec: 20 });
    await startGame(clients[0], clients, 'team_select');
    clients[0].send({ type: 'select_team', team: 'red' });
    clients[1].send({ type: 'select_team', team: 'red' });
    clients[2].send({ type: 'select_team', team: 'blue' });
    await Promise.all(clients.map((client) => client.waitFor((c) => c.room?.phase === 'board', 'team selection lock', 18000)));
    const initialRed = clients.filter((client) => client.room.players.find((p) => p.id === client.playerId)?.team === 'red');
    assert.equal(initialRed.length, 2);
    const clue = await selectClue(clients);
    let redUp = initialRed.find((client) => client.room.players.find((p) => p.id === client.playerId).teamAnswererUp);
    const redWaiting = initialRed.find((client) => client !== redUp);
    assert(redUp && redWaiting, 'one teammate should be marked as next answerer');
    redWaiting.send({ type: 'buzz' });
    await sleep(120);
    assert.equal(clients[0].room.phase, 'clue_open', 'server rejects the teammate whose turn is not active');
    const answer = findAnswer(clue.clue);
    assert(answer, 'official answer is needed for team score test');
    await answerClue(clients, redUp, answer);
    await waitClueResult(clients);
    const redScore = clients[0].room.teamScores.red;
    for (const teammate of initialRed) {
      const publicPlayer = teammate.room.players.find((player) => player.id === teammate.playerId);
      assert.equal(publicPlayer.score, redScore, 'teammates see the shared team bank');
    }
    assert(initialRed.find((client) => client.playerId === redWaiting.playerId).room.players.find((p) => p.id === redWaiting.playerId).teamAnswererUp, 'next team turn advances to the other teammate');
    pass('Team Jeopardy shared bank, synchronized teammate scores, and alternating answer order');
  } finally {
    clients.forEach((client) => client.close());
    await sleep(180);
  }
}

async function main() {
  staticChecks();
  const server = spawn(process.execPath, [SERVER_PATH], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), HOST_RECONNECT_GRACE_MS: '1000' },
    stdio: 'ignore',
  });
  try {
    await waitReady();
    await runJudgeScenario();
    await runDoubleOrNothingScenario();
    await runHotPotatoScenario();
    await runTeamScenario();
  } finally {
    server.kill();
    await sleep(150);
  }
  console.log('\nALL MODE AND JUDGE CHECKS PASSED');
}

main().catch((error) => { fail('verification suite', error); process.exitCode = 1; });
