'use strict';

/**
 * Verifies the live server contracts for game modes, bots, and multiplayer scoring.
 * Run with: node scripts/verify-modes.js
 */
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const path = require('node:path');
const { BUILTIN_CATEGORIES, HALLOWEEN_CATEGORIES } = require('../server/categoriesData.js');

const PORT = Number(process.env.JEOPARTY_TEST_PORT) || 3417;
const BASE = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}`;
const SERVER_PATH = path.resolve(__dirname, '../server/server.js');
const SERVER_SOURCE = require('node:fs').readFileSync(SERVER_PATH, 'utf8');
const HTML_SOURCE = require('node:fs').readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
const APP_SOURCE = require('node:fs').readFileSync(path.resolve(__dirname, '../public/js/app.js'), 'utf8');
const SHOW_SOURCE = require('node:fs').readFileSync(path.resolve(__dirname, '../public/js/gameshow.js'), 'utf8');
const SHOW_CSS = require('node:fs').readFileSync(path.resolve(__dirname, '../public/css/gameshow.css'), 'utf8');
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
  assert(SERVER_SOURCE.includes('teamScoreLedger') && SERVER_SOURCE.includes('teamNextAnswerer'), 'shared team bank or alternating turns are missing');
  assert(SERVER_SOURCE.includes('startHotPotatoFuse') && SERVER_SOURCE.includes('pass_hot_potato'), 'timed potato pass flow is missing');
  assert(SERVER_SOURCE.includes('hotPotatoFuseSec') && SERVER_SOURCE.includes('hotPotatoPenalty'), 'Hot Potato room settings are missing');
  assert(HTML_SOURCE.includes('id="set-hot-potato-fuse"') && HTML_SOURCE.includes('id="set-hot-potato-penalty"'), 'host Hot Potato controls are missing');
  assert(SERVER_SOURCE.includes("ac.riskChoices?.[player.id] === 'double'"), 'Double or Nothing choice is not scored');
  assert(SHOW_SOURCE.includes("const avatarSize = count <= 3 ? 172 : count <= 6 ? 142 : 116"), 'large responsive podium avatar sizes are missing');
  assert(SHOW_CSS.includes('.contestant-stage[data-density=\'compact\']') && SHOW_CSS.includes('grid-template-columns'), 'large contestant and responsive special settings styles are missing');

  const baseline = execFileSync('git', ['show', 'HEAD:server/server.js'], { encoding: 'utf8' });
  const championBlock = (source) => source.replace(/\r\n/g, '\n').match(/\} else if \(difficulty === 'champion'\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  assert(championBlock(SERVER_SOURCE), 'Champion profile was not found');
  assert.equal(championBlock(SERVER_SOURCE), championBlock(baseline), 'Champion bot profile changed from deployed baseline');
  for (const marker of ['baseAccuracy = 0.52;', 'baseAccuracy = 0.74;', 'baseAccuracy = 0.88;', 'minHesitationMs = 550;', 'maxHesitationMs = 1150;']) {
    assert(SERVER_SOURCE.includes(marker), `expected stronger non-Champion profile marker ${marker}`);
  }
  assert(!HTML_SOURCE.toLowerCase().includes('judge-stage') && !APP_SOURCE.toLowerCase().includes('judge_decision'), 'removed judge UI still has a client reference');
  pass('static gameplay, UI, and art contracts');
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
    await createRoom(clients, 'hot_potato', { clueTimeSec: 20, hotPotatoFuseSec: 4, hotPotatoPenalty: 500 });
    await startGame(clients[0], clients);
    const clue = await selectClue(clients);
    const initialHolderId = clue.hotPotatoHolderId;
    assert(initialHolderId, 'potato must begin with a randomly selected contestant');
    assert.equal(clients[0].room.settings.hotPotatoFuseSec, 4, 'host fuse selection reaches every player');
    assert.equal(clients[0].room.settings.hotPotatoPenalty, 500, 'host penalty selection reaches every player');
    const initialHolder = locateClient(clients, initialHolderId);
    initialHolder.send({ type: 'pass_hot_potato' });
    await Promise.all(clients.map((client) => client.waitFor((c) => c.room?.activeClue?.hotPotatoHolderId && c.room.activeClue.hotPotatoHolderId !== initialHolderId, 'potato pass')));
    const holderAfterPass = clients[0].room.activeClue.hotPotatoHolderId;
    assert(clients[0].room.activeClue.hotPotatoExpiresAt > Date.now(), 'pass resets the server-owned fuse');
    await sleep(4300);
    assert(clients[0].room.players.find((p) => p.id === holderAfterPass).score <= -500, 'configured fuse penalty is applied to the holder');
    const afterExplosionHolderId = clients[0].room.activeClue.hotPotatoHolderId;
    assert.notEqual(afterExplosionHolderId, holderAfterPass, 'expired fuse passes to another contestant');
    const correctPlayer = locateClient(clients, afterExplosionHolderId);
    const answer = findAnswer(clue.clue);
    assert(answer && correctPlayer, 'a live contestant and official answer are available');
    await answerClue(clients, correctPlayer, answer);
    await waitClueResult(clients);
    await clients[0].waitFor((client) => client.room?.phase === 'board', 'next board after correct potato answer');
    const nextClue = await selectClue(clients);
    assert.equal(nextClue.hotPotatoHolderId, correctPlayer.playerId, 'correct answer carries the potato into the next clue');
    pass('Hot Potato randomized start, configurable timer and penalty, synchronized pass/explosion, and correct-answer carry');
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
    await runDoubleOrNothingScenario();
    await runHotPotatoScenario();
    await runTeamScenario();
  } finally {
    server.kill();
    await sleep(150);
  }
  console.log('\nALL MODE CHECKS PASSED');
}

main().catch((error) => { fail('verification suite', error); process.exitCode = 1; });
