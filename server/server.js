'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const { attachWebSocketServer } = require('./ws');
const {
  BUILTIN_CATEGORIES,
  FINAL_JEOPARDY_POOL,
  HALLOWEEN_CATEGORIES,
  HALLOWEEN_FINAL_POOL,
} = require('./categoriesData');
const { evaluateAnswer } = require('./answerMatcher');
const { pickHostLine, getPublicHostIdentity } = require('./hostLines');
const {
  buildRevealPlan,
  revealVisibleWords,
  freezeReveal,
  resumeReveal,
  completeReveal,
  serializeReveal,
} = require('./reveal');
const { selectFinalWheel } = require('./finalWheel');

const PORT = Number(process.env.PORT) || 3000;
const HOST_RECONNECT_GRACE_MS = Math.max(
  1000,
  Number(process.env.HOST_RECONNECT_GRACE_MS) || 12000
);
const TOMBSTONE_TTL_MS = 30 * 60 * 1000;
const MAX_ROOM_PLAYERS = 10;
/**
 * Consecutive-correct streak bonus: once a player reaches 3 correct answers in
 * a row, every correct answer from that point on (including the 3rd) earns an
 * extra $100. Calculated exclusively on the server.
 */
const STREAK_BONUS_AMOUNT = 100;
const STREAK_BONUS_THRESHOLD = 3;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/* =========================================================================
   CINEMATIC INTRO (server-owned presentation timeline)
   ========================================================================= */
const INTRO_HOST_LINE =
  "Hello, everyone! I'm your host, and welcome to Jeoparty!";
const INTRO_OUTRO_LINE =
  "Alright, contestants! Let's get this game started!";
const INTRO_TIMINGS = Object.freeze({
  on: {
    leadMs: 550,
    wideMs: 1400,
    hostMs: 2800,
    boardMs: 2100,
    minPlayerMs: 800,
    maxPlayerMs: 1600,
    playerBudgetMs: 12000,
  },
  reduced: {
    leadMs: 300,
    wideMs: 700,
    hostMs: 1500,
    boardMs: 1100,
    minPlayerMs: 550,
    maxPlayerMs: 760,
    playerBudgetMs: 6200,
  },
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

const BOT_PROFILES = [
  { id: 'doodle_dan', name: 'DoodleDan', avatar: { color: 3, eyes: 2, mouth: 1, hat: 1 } },
  { id: 'brain_cell', name: 'BrainCell', avatar: { color: 11, eyes: 11, mouth: 3, hat: 5 } },
  { id: 'chill_bean', name: 'ChillBean', avatar: { color: 7, eyes: 1, mouth: 0, hat: 9 } },
  { id: 'rage_potato', name: 'RagePotato', avatar: { color: 0, eyes: 3, mouth: 6, hat: 3 } },
  { id: 'shy_sprout', name: 'ShySprout', avatar: { color: 9, eyes: 5, mouth: 9, hat: 2 } },
  { id: 'quizzy_lizzy', name: 'QuizzyLizzy', avatar: { color: 4, eyes: 8, mouth: 2, hat: 4 } },
  { id: 'pixel_pete', name: 'PixelPete', avatar: { color: 1, eyes: 7, mouth: 5, hat: 6 } },
  { id: 'snooze_bot', name: 'SnoozeBot', avatar: { color: 6, eyes: 0, mouth: 0, hat: 8 } },
  { id: 'glitch_gremlin', name: 'GlitchGremlin', avatar: { color: 8, eyes: 10, mouth: 7, hat: 7 } },
];

function formatCurrency(amount, room) {
  const num = Number(amount) || 0;
  if (room && room.settings && room.settings.gameMode === 'halloween') {
    return `${num.toLocaleString()} Candy`;
  }
  return `$${num.toLocaleString()}`;
}

const FUNNY_WRONG_ANSWERS = [
  'Shrek 2?',
  'A potato',
  'Abraham Lincoln',
  'Danny DeVito',
  'Mitochondria',
  'Area 51',
  'SpongeBob',
  '42',
  'Lasagna',
  'Florida',
];

/** @type {Map<string, object>} */
const rooms = new Map();

/**
 * Tombstone registry of closed/terminated room codes so stale links, browser
 * history, and old reconnect timers can never resurrect a terminated match.
 * @type {Map<string, { roomId: string, code: string, reason: string, terminatedAt: number }>}
 */
const terminatedRooms = new Map();

function randomId(bytes = 8) {
  return crypto.randomBytes(bytes).toString('hex');
}

function pruneTerminatedRooms() {
  const cutoff = Date.now() - TOMBSTONE_TTL_MS;
  for (const [code, entry] of terminatedRooms.entries()) {
    if (entry.terminatedAt < cutoff) {
      terminatedRooms.delete(code);
    }
  }
}

setInterval(pruneTerminatedRooms, 5 * 60 * 1000).unref();

function generateRoomCode() {
  pruneTerminatedRooms();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 80; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    if (!rooms.has(code) && !terminatedRooms.has(code)) return code;
  }
  return randomId(3).toUpperCase();
}

function getLanUrls(port) {
  const nets = os.networkInterfaces();
  const physical = [];
  const fallback = [];

  for (const name of Object.keys(nets)) {
    const isVirtual = /vethernet|virtual|wsl|docker|hyper-v|vmware|vbox|loopback/i.test(name);
    for (const net of nets[name] || []) {
      // Must be IPv4, non-internal, and not link-local APIPA (169.254.x.x)
      if (
        net.family === 'IPv4' &&
        !net.internal &&
        !net.address.startsWith('127.') &&
        !net.address.startsWith('169.254.')
      ) {
        const url = `http://${net.address}:${port}`;
        if (!isVirtual) {
          physical.push(url);
        } else {
          fallback.push(url);
        }
      }
    }
  }
  return physical.length > 0 ? physical : fallback;
}

function sanitizeName(raw) {
  if (!raw || typeof raw !== 'string') return 'Player';
  const cleaned = raw.replace(/\s+/g, ' ').trim().slice(0, 18);
  return cleaned || 'Player';
}

/**
 * Full cosmetic counts from the client avatar catalogue (including Halloween
 * event skins, eyes, mouths and hats) so customized contestants are never
 * replaced with a sanitized placeholder.
 */
const AVATAR_LIMITS = Object.freeze({
  color: 28, // 20 classic skins + 9 Halloween skins
  eyes: 21, // 16 classic + 6 Halloween eyes
  mouth: 21, // 16 classic + 6 Halloween mouths
  hat: 20, // 11 classic + 10 Halloween hats
});

function sanitizeAvatar(raw) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const clamp = (value, max) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, n));
  };
  return {
    color: clamp(obj.color, AVATAR_LIMITS.color),
    eyes: clamp(obj.eyes, AVATAR_LIMITS.eyes),
    mouth: clamp(obj.mouth, AVATAR_LIMITS.mouth),
    hat: clamp(obj.hat, AVATAR_LIMITS.hat),
  };
}

function getActivePlayerCount(room) {
  if (!room || !Array.isArray(room.players)) return 0;
  return room.players.filter((p) => p && p.connected).length;
}

/**
 * Computes sensible dynamic match-length settings from the active connected
 * player count (humans + bots, up to MAX_ROOM_PLAYERS = 10; disconnected excluded).
 */
function computeScaledMatchConfig(rawPlayerCount) {
  const count = Math.max(1, Math.min(MAX_ROOM_PLAYERS, Number(rawPlayerCount) || 2));
  if (count <= 2) {
    return {
      activePlayerCount: count,
      tierLabel: '2 Players',
      boardCols: 4,
      cluesPerCat: 4,
      totalClues: 16,
      clueTimeSec: 15,
    };
  }
  if (count <= 4) {
    return {
      activePlayerCount: count,
      tierLabel: '3-4 Players',
      boardCols: 5,
      cluesPerCat: 5,
      totalClues: 25,
      clueTimeSec: 18,
    };
  }
  if (count <= 6) {
    return {
      activePlayerCount: count,
      tierLabel: '5-6 Players',
      boardCols: 6,
      cluesPerCat: 5,
      totalClues: 30,
      clueTimeSec: 18,
    };
  }
  if (count <= 8) {
    return {
      activePlayerCount: count,
      tierLabel: '7-8 Players',
      boardCols: 7,
      cluesPerCat: 5,
      totalClues: 35,
      clueTimeSec: 20,
    };
  }
  return {
    activePlayerCount: count,
    tierLabel: '9-10 Players',
    boardCols: 8,
    cluesPerCat: 6,
    totalClues: 48,
    clueTimeSec: 20,
  };
}

function syncAutoScaledSettingsForLobby(room) {
  if (!room || !room.settings || !room.settings.autoScaleMatch) return;
  const activeCount = Math.max(2, getActivePlayerCount(room));
  const scaled = computeScaledMatchConfig(activeCount);
  room.settings.boardCols = scaled.boardCols;
  room.settings.cluesPerCat = scaled.cluesPerCat;
  room.settings.clueTimeSec = scaled.clueTimeSec;
  room.settings.matchPace = 'auto';

  // Ensure enough categories are selected when scaling up to 7-8 columns unless host intentionally cleared
  if (
    Array.isArray(room.settings.includedCategoryIds) &&
    room.settings.includedCategoryIds.length > 0 &&
    room.settings.includedCategoryIds.length < scaled.boardCols
  ) {
    const allCats = getAllCategoriesForRoom(room);
    const curSet = new Set(room.settings.includedCategoryIds);
    for (const c of allCats) {
      if (curSet.size >= scaled.boardCols) break;
      curSet.add(c.id);
    }
    room.settings.includedCategoryIds = Array.from(curSet);
  }
}

const VALID_GAME_MODES = [
  'standard',
  'survival',
  'double_or_nothing',
  'hot_potato',
  'teams',
  'chaos',
  'speed',
  'halloween',
];

function createDefaultSettings(gameMode = 'standard') {
  const safeMode = VALID_GAME_MODES.includes(gameMode) ? gameMode : 'standard';
  const isHalloween = safeMode === 'halloween';
  const pool = isHalloween ? HALLOWEEN_CATEGORIES : BUILTIN_CATEGORIES;
  return {
    gameMode: safeMode,
    autoScaleMatch: true, // Automatically scales board & timers based on active player count!
    matchPace: 'auto', // 'auto' | 'shorter' | 'standard' | 'extended' | 'custom'
    specialFrequency: safeMode === 'chaos' ? 'high' : 'normal', // 'low' | 'normal' | 'high'
    botDifficulty: 'medium', // 'easy' | 'medium' | 'hard' | 'champion'
    answerMode: 'buzzer', // 'buzzer' | 'skribbl'
    cinematicCamera: 'on', // 'on' | 'reduced' | 'off' — game-show intro + camera moves
    boardCols: 4, // 3..8 (auto-updated for active roster when autoScaleMatch is true)
    cluesPerCat: 4, // 3..6 ($200..$1200)
    clueTimeSec: safeMode === 'speed' ? 8 : 15, // 12 | 15 | 18 | 20 | 25 | 30 | 45
    doubleJeopardy: false, // Host can toggle Round 2 Double Jeoparty anytime
    dailyDoubles: true,
    finalJeopardy: true,
    wrongPenalty: safeMode === 'survival' || safeMode === 'double_or_nothing',
    includedCategoryIds: pool.map((c) => c.id),
    customCategories: [],
  };
}

function applySettingsPatch(room, patch) {
  if (!patch || typeof patch !== 'object') return;
  const s = room.settings;

  if (VALID_GAME_MODES.includes(patch.gameMode)) {
    const changedMode = s.gameMode !== patch.gameMode;
    s.gameMode = patch.gameMode;
    room.gameMode = patch.gameMode;
    if (patch.gameMode === 'speed') {
      s.clueTimeSec = 8;
    } else if (patch.gameMode === 'survival' || patch.gameMode === 'double_or_nothing') {
      s.wrongPenalty = true;
    } else if (patch.gameMode === 'chaos') {
      s.specialFrequency = 'high';
    }
    if (changedMode && !Array.isArray(patch.includedCategoryIds)) {
      const defaultPool = s.gameMode === 'halloween' ? HALLOWEEN_CATEGORIES : BUILTIN_CATEGORIES;
      s.includedCategoryIds = defaultPool.map((c) => c.id);
    }
  }

  if (typeof patch.autoScaleMatch === 'boolean') {
    s.autoScaleMatch = patch.autoScaleMatch;
    if (s.autoScaleMatch) {
      s.matchPace = 'auto';
      syncAutoScaledSettingsForLobby(room);
    } else if (s.matchPace === 'auto') {
      s.matchPace = 'custom';
    }
  }

  if (patch.matchPace) {
    const pace = String(patch.matchPace).toLowerCase();
    if (pace === 'auto') {
      s.autoScaleMatch = true;
      s.matchPace = 'auto';
      syncAutoScaledSettingsForLobby(room);
    } else if (pace === 'shorter' || pace === 'quick') {
      s.autoScaleMatch = false;
      s.matchPace = 'shorter';
      s.boardCols = 3;
      s.cluesPerCat = 4;
      s.clueTimeSec = 15;
      s.doubleJeopardy = false;
      s.wrongPenalty = false;
    } else if (pace === 'standard') {
      s.autoScaleMatch = false;
      s.matchPace = 'standard';
      s.boardCols = 5;
      s.cluesPerCat = 5;
      s.clueTimeSec = 18;
      s.doubleJeopardy = false;
      s.wrongPenalty = true;
    } else if (pace === 'extended' || pace === 'epic') {
      s.autoScaleMatch = false;
      s.matchPace = 'extended';
      s.boardCols = 6;
      s.cluesPerCat = 5;
      s.clueTimeSec = 20;
      s.doubleJeopardy = true;
      s.wrongPenalty = true;
    } else if (pace === 'custom') {
      s.autoScaleMatch = false;
      s.matchPace = 'custom';
    }
  }

  if (['low', 'normal', 'high'].includes(patch.specialFrequency)) {
    s.specialFrequency = patch.specialFrequency;
  }

  if (['easy', 'medium', 'hard', 'champion'].includes(patch.botDifficulty)) {
    s.botDifficulty = patch.botDifficulty;
  }

  if (['on', 'reduced', 'off'].includes(patch.cinematicCamera)) {
    s.cinematicCamera = patch.cinematicCamera;
  }

  if (['buzzer', 'skribbl'].includes(patch.answerMode)) {
    s.answerMode = patch.answerMode;
  }

  const manualOverride =
    patch.autoScaleMatch !== true && String(patch.matchPace || '').toLowerCase() !== 'auto';

  if ([3, 4, 5, 6, 7, 8].includes(Number(patch.boardCols))) {
    s.boardCols = Number(patch.boardCols);
    if (manualOverride) {
      s.autoScaleMatch = false;
      if (!patch.matchPace) s.matchPace = 'custom';
    }
  }
  if ([3, 4, 5, 6].includes(Number(patch.cluesPerCat))) {
    s.cluesPerCat = Number(patch.cluesPerCat);
    if (manualOverride) {
      s.autoScaleMatch = false;
      if (!patch.matchPace) s.matchPace = 'custom';
    }
  }
  if ([12, 15, 18, 20, 25, 30, 45].includes(Number(patch.clueTimeSec))) {
    s.clueTimeSec = Number(patch.clueTimeSec);
    if (manualOverride) {
      s.autoScaleMatch = false;
      if (!patch.matchPace) s.matchPace = 'custom';
    }
  }
  if (typeof patch.doubleJeopardy === 'boolean') {
    s.doubleJeopardy = patch.doubleJeopardy;
  }
  if (typeof patch.dailyDoubles === 'boolean') {
    s.dailyDoubles = patch.dailyDoubles;
  }
  if (typeof patch.finalJeopardy === 'boolean') {
    s.finalJeopardy = patch.finalJeopardy;
  }
  if (typeof patch.wrongPenalty === 'boolean') {
    s.wrongPenalty = patch.wrongPenalty;
  }
  if (Array.isArray(patch.includedCategoryIds)) {
    const validIds = new Set(
      getAllCategoriesForRoom(room).map((c) => c.id)
    );
    const filtered = patch.includedCategoryIds.filter((id) => validIds.has(id));
    // When creating a fresh room from saved preferences, ensure at least boardCols valid categories if non-empty preference had stale custom IDs
    if (filtered.length > 0 || patch.allowEmptyCategories !== false) {
      s.includedCategoryIds = filtered;
    }
  }
}

function createRoom({ isPrivate, gameMode = 'standard', preferredSettings = null }) {
  const code = generateRoomCode();
  const actualMode = (gameMode === 'halloween' || preferredSettings?.gameMode === 'halloween')
    ? 'halloween'
    : 'standard';
  const room = {
    roomId: 'room_' + randomId(6),
    code,
    gameId: null,
    terminated: false,
    isPrivate: Boolean(isPrivate),
    createdAt: Date.now(),
    hostId: null,
    players: [],
    gameMode: actualMode,
    settings: createDefaultSettings(actualMode),
    phase: 'lobby', // 'lobby' | 'board' | 'daily_double_wager' | 'daily_double_answer' | 'clue_open' | 'clue_buzzed' | 'clue_skribbl' | 'clue_result' | 'final_wager' | 'final_clue' | 'game_over' | 'terminated'
    round: 1,
    pickerId: null,
    usedCategoryIds: new Set(),
    board: null,
    boardCategoryHistory: [],
    activeClue: null,
    finalState: null,
    lastFeedback: null,
    // Presentation state (host presenter + money animations)
    hostMemory: {},
    lastHostLine: null,
    hostLineSeq: 0,
    recentAwards: [],
    awardSeq: 0,
    lastSelectedTile: null,
    phaseEndsAt: 0,
    mainTimerRemainingMs: 0,
    timers: new Set(),
    hostDisconnectTimer: null,
    hostDisconnectedAt: 0,
    voiceMembers: new Map(),
  };

  if (preferredSettings && typeof preferredSettings === 'object') {
    const sanitizedPref = { ...preferredSettings };
    // Legacy client localStorage preferences predating v3.1 lack `autoScaleMatch`;
    // keep auto-scaling active unless the host explicitly opted out!
    if (typeof sanitizedPref.autoScaleMatch !== 'boolean' || sanitizedPref.autoScaleMatch === true) {
      delete sanitizedPref.boardCols;
      delete sanitizedPref.cluesPerCat;
      delete sanitizedPref.clueTimeSec;
      delete sanitizedPref.matchPace;
      sanitizedPref.autoScaleMatch = true;
    }
    applySettingsPatch(room, {
      ...sanitizedPref,
      gameMode: actualMode,
      allowEmptyCategories: false,
    });
    if (room.settings.includedCategoryIds.length < room.settings.boardCols) {
      const defaultPool = room.gameMode === 'halloween' ? HALLOWEEN_CATEGORIES : BUILTIN_CATEGORIES;
      room.settings.includedCategoryIds = defaultPool.map((c) => c.id);
    }
  }

  rooms.set(code, room);
  return room;
}

function clearRoomTimers(room) {
  if (!room) return;
  for (const t of room.timers) {
    clearTimeout(t);
  }
  room.timers.clear();
}

function clearHostDisconnectTimer(room) {
  if (room && room.hostDisconnectTimer) {
    clearTimeout(room.hostDisconnectTimer);
    room.hostDisconnectTimer = null;
    room.hostDisconnectedAt = 0;
  }
}

/**
 * Schedules a game timer fenced by room lifecycle AND gameId so stale
 * asynchronous callbacks can never mutate a terminated match or a new game.
 */
function scheduleRoomTimer(room, fn, delayMs) {
  if (!room || room.terminated) return null;
  const expectedRoomId = room.roomId;
  const expectedGameId = room.gameId;

  const handle = setTimeout(() => {
    room.timers.delete(handle);
    if (
      room.terminated ||
      rooms.get(room.code) !== room ||
      room.roomId !== expectedRoomId ||
      room.gameId !== expectedGameId
    ) {
      return;
    }
    fn();
  }, Math.max(10, delayMs));
  room.timers.add(handle);
  return handle;
}

/**
 * Permanently closes a room and ends any active match in it.
 * Cancels all timers, records a tombstone so the room cannot be resumed,
 * detaches all players' socket closures from this room, and notifies remaining humans.
 */
function terminateRoom(room, reason, { excludePlayerId = null } = {}) {
  if (!room || room.terminated) return;

  room.terminated = true;
  room.phase = 'terminated';
  clearRoomTimers(room);
  clearHostDisconnectTimer(room);

  const closedGameId = room.gameId;
  room.board = null;
  room.activeClue = null;
  room.finalState = null;
  room.introState = null;
  room.lastFeedback = null;
  room.phaseEndsAt = 0;
  room.mainTimerRemainingMs = 0;

  if (rooms.get(room.code) === room) {
    rooms.delete(room.code);
  }

  terminatedRooms.set(room.code, {
    roomId: room.roomId,
    code: room.code,
    reason: reason || 'The host left the game, so the match has ended.',
    terminatedAt: Date.now(),
  });

  for (const p of room.players) {
    if (p.isBot) continue;
    if (typeof p.clearConnectionRoomRef === 'function') {
      p.clearConnectionRoomRef(room);
    }
    if (p.id !== excludePlayerId && p.connected && p.ws) {
      p.ws.send({ type: 'voice_session_ended' });
      p.ws.send({
        type: 'room_closed',
        roomCode: room.code,
        roomId: room.roomId,
        gameId: closedGameId,
        reason: 'host_left',
        message: reason || 'The host left the game, so the match has ended.',
      });
    }
    p.connected = false;
    p.ws = null;
    p.clearConnectionRoomRef = null;
  }

  if (room.voiceMembers) room.voiceMembers.clear();
  room.players = [];
}

function getAllCategoriesForRoom(room) {
  const base = room && room.settings && room.settings.gameMode === 'halloween' ? HALLOWEEN_CATEGORIES : BUILTIN_CATEGORIES;
  return [...base, ...(room && room.settings && room.settings.customCategories ? room.settings.customCategories : [])];
}

function serializeRoomForPlayer(room, viewerId) {
  const isHost = room.hostId === viewerId;
  const allCats = getAllCategoriesForRoom(room);

  let boardView = null;
  if (room.board) {
    boardView = {
      categories: room.board.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        tiles: cat.tiles.map((t) => ({
          row: t.row,
          col: t.col,
          value: t.value,
          used: t.used,
          modifier: t.modifier || null,
        })),
      })),
    };
  }

  let activeClueView = null;
  if (room.activeClue) {
    const ac = room.activeClue;
    const revealAnswer = room.phase === 'clue_result';

    const hideClueTextYet = room.phase === 'daily_double_wager';

    activeClueView = {
      col: ac.col,
      row: ac.row,
      categoryId: ac.categoryId,
      categoryName: ac.categoryName,
      categoryIcon: ac.categoryIcon,
      value: ac.value,
      wager: ac.wager,
      maxWager: ac.maxWager,
      dailyDouble: ac.dailyDouble,
      modifier: ac.modifier || null,
      clue: hideClueTextYet ? null : ac.clueObj.clue,
      clueText: hideClueTextYet ? null : ac.clueObj.clue,
      hintMask: ac.hintMask || null,
      buzzedPlayerId: ac.buzzedPlayerId || null,
      buzzedGuessText: ac.buzzedGuessText || null,
      attemptedIds: Array.from(ac.attemptedIds || []),
      solvedIds: Array.from(ac.solvedIds || []),
      chaosSolvedIds: ac.chaosSolvedList ? ac.chaosSolvedList.map((s) => s.playerId) : [],
      chaosSubmittedIds: ac.chaosSubmissions ? Object.keys(ac.chaosSubmissions) : [],
      myChaosSubmission: ac.chaosSubmissions?.[viewerId] || null,
      chaosTotalPlayers: room.players.filter((p) => p.connected).length,
      winnerName: ac.winnerName || null,
      winnerDelta: ac.winnerDelta || 0,
      winnerStreak: ac.winnerStreak || 0,
      winnerStreakBonus: ac.winnerStreakBonus || 0,
      lastWrongText: ac.lastWrongText || null,
      reveal: serializeReveal(ac.reveal),
      answer: revealAnswer ? ac.clueObj.answer : null,
      hotPotatoHolderId: ac.hotPotatoHolderId || null,
      hotPotatoExpiresAt: ac.hotPotatoExpiresAt || null,
    };
  }

  let finalView = null;
  if (room.finalState) {
    const fsState = room.finalState;
    const showClue =
      room.phase === 'final_clue' || room.phase === 'game_over';
    const showResults = room.phase === 'game_over';
    const myWager = fsState.wagers[viewerId];
    const myAnswer = fsState.answers[viewerId];

    finalView = {
      category: fsState.clueObj.category,
      categoryName: fsState.clueObj.category,
      categoryIcon: fsState.clueObj.categoryIcon || null,
      clue: showClue ? fsState.clueObj.clue : null,
      clueText: showClue ? fsState.clueObj.clue : null,
      reveal: serializeReveal(fsState.reveal),
      answer: showResults ? fsState.clueObj.answer : null,
      wagerLockedIds: Object.keys(fsState.wagers),
      answerLockedIds: Object.keys(fsState.answers),
      myMaxWager: getFinalMaxWager(room, viewerId),
      myWager: typeof myWager === 'number' ? myWager : null,
      myAnswer: typeof myAnswer === 'string' ? myAnswer : null,
      results: showResults ? fsState.results : null,
      wheel: fsState.wheel || null,
    };
  }

  return {
    roomId: room.roomId,
    code: room.code,
    gameId: room.gameId,
    isPrivate: room.isPrivate,
    hostId: room.hostId,
    hostReconnecting: Boolean(room.hostDisconnectTimer),
    phase: room.phase,
    round: room.round,
    pickerId: room.pickerId,
    phaseEndsAt: room.phaseEndsAt,
    intermissionNextTitle: room.intermissionNextTitle || null,
    serverNow: Date.now(),
    activePlayerCount: getActivePlayerCount(room),
    scaledMatchPreview: computeScaledMatchConfig(Math.max(2, getActivePlayerCount(room))),
    gameMode: room.settings.gameMode || 'standard',
    currency: room.settings.gameMode === 'halloween' ? 'candy' : 'dollar',
    settings: {
      ...room.settings,
      customCategoriesMeta: room.settings.customCategories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        group: 'custom',
        blurb: c.blurb,
      })),
    },
    availableCategoryCount: allCats.filter((c) =>
      room.settings.includedCategoryIds.includes(c.id)
    ).length,
    players: room.players.map((p) => {
      const lives = typeof p.lives === 'number' ? p.lives : 3;
      const isEliminated = Boolean(
        p.isEliminated || (room.settings.gameMode === 'survival' && lives <= 0)
      );
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        connected: p.connected,
        isBot: p.isBot,
        botDifficulty: p.isBot ? (p.botDifficulty || room.settings.botDifficulty || 'medium') : undefined,
        streak: p.stats?.currentStreak || 0,
        onFire: Boolean(p.stats?.currentStreak >= 2),
        streakBonusActive: Boolean(p.stats?.currentStreak >= 3),
        maxStreak: p.stats?.maxStreak || 0,
        lives,
        isEliminated,
        team: p.team || null,
        teamContribution: p.teamContribution || 0,
        inVoice: room.voiceMembers ? room.voiceMembers.has(p.id) : false,
        voiceMuted: room.voiceMembers?.get(p.id)?.muted ?? false,
        voiceSpeaking: room.voiceMembers?.get(p.id)?.speaking ?? false,
      };
    }),
    teamScores: room.teamScores || { red: 0, blue: 0, green: 0, yellow: 0 },
    board: boardView,
    activeClue: activeClueView,
    finalState: finalView,
    intro: room.phase === 'intro' && room.introState ? room.introState : null,
    host: getPublicHostIdentity(room.settings.gameMode === 'halloween'),
    lastHostLine: room.lastHostLine || null,
    awards: Array.isArray(room.recentAwards) ? room.recentAwards.slice(-6) : [],
    awardSeq: room.awardSeq || 0,
    streakBonusValue: STREAK_BONUS_AMOUNT,
    superlatives: room.phase === 'game_over' ? (room.superlatives || []) : [],
  };
}

function broadcastRoomState(room) {
  if (!room || room.terminated) return;
  for (const p of room.players) {
    if (!p.isBot && p.connected && p.ws) {
      p.ws.send({
        type: 'room_state',
        room: serializeRoomForPlayer(room, p.id),
      });
    }
  }
}

function broadcastRoomEvent(room, payload) {
  if (!room || room.terminated) return;
  for (const p of room.players) {
    if (!p.isBot && p.connected && p.ws) {
      p.ws.send(payload);
    }
  }
}

function sendChat(
  room,
  {
    kind = 'system',
    color = 'info',
    text,
    author = null,
    icon = null,
    isBot = false,
    botId = null,
  }
) {
  if (!room || room.terminated) return;
  broadcastRoomEvent(room, {
    type: 'chat',
    message: {
      id: randomId(4),
      kind,
      color,
      author,
      icon,
      isBot: Boolean(isBot),
      botId,
      text,
      ts: Date.now(),
    },
  });
}

/**
 * Emits a scripted, contextual host announcement to every client.
 * Only ever called by the server AFTER an authoritative result exists.
 */
function hostSay(room, event, ctx = {}) {
  if (!room || room.terminated) return;
  const halloween = room.settings?.gameMode === 'halloween';
  const { line, tone } = pickHostLine(
    event,
    { ...ctx, isHalloween: halloween },
    room.hostMemory || (room.hostMemory = {}),
    { halloween }
  );
  if (!line) return;

  room.hostLineSeq = (room.hostLineSeq || 0) + 1;
  room.lastHostLine = {
    id: room.hostLineSeq,
    event,
    line,
    tone,
    ts: Date.now(),
  };
  broadcastRoomEvent(room, {
    type: 'host_line',
    ...room.lastHostLine,
  });
}

/**
 * Records an authoritative score change so podiums can animate money exactly
 * from the final, server-calculated value.
 */
function pushAward(room, award) {
  if (!room || room.terminated) return null;
  room.awardSeq = (room.awardSeq || 0) + 1;
  const entry = {
    id: room.awardSeq,
    ts: Date.now(),
    kind: 'correct',
    delta: 0,
    ...award,
  };
  room.recentAwards = Array.isArray(room.recentAwards) ? room.recentAwards : [];
  room.recentAwards.push(entry);
  if (room.recentAwards.length > 12) {
    room.recentAwards = room.recentAwards.slice(-12);
  }
  return entry;
}

function spawnBotReaction(room, bot, reactionId) {
  if (!room || room.terminated || !bot) return;
  bot.stats = bot.stats || {
    correctCount: 0,
    wrongCount: 0,
    maxStreak: 0,
    currentStreak: 0,
    fastestBuzzMs: 99999,
    reactionsSent: 0,
  };
  bot.stats.reactionsSent++;
  broadcastRoomEvent(room, {
    type: 'reaction_spawn',
    playerId: bot.id,
    playerName: bot.name,
    reaction: reactionId,
    emoji: reactionId,
    avatarConfig: bot.avatar,
  });
}

function maybeSpawnBotReaction(room, eventType, data = {}) {
  if (!room || room.terminated) return;
  const bots = (room.players || []).filter((p) => p.isBot && p.connected);
  if (bots.length === 0) return;

  if (eventType === 'correct_answer' && data.player?.isBot) {
    if (Math.random() < 0.45) {
      spawnBotReaction(room, data.player, Math.random() < 0.5 ? 'celebrate' : 'happy');
    }
  } else if (eventType === 'wrong_answer' && data.player?.isBot) {
    if (Math.random() < 0.35) {
      spawnBotReaction(room, data.player, Math.random() < 0.5 ? 'shocked' : 'sad');
    }
  } else if (eventType === 'streak' && data.player?.isBot) {
    spawnBotReaction(room, data.player, 'fire');
  } else if (eventType === 'match_start') {
    const randomBot = bots[Math.floor(Math.random() * bots.length)];
    spawnBotReaction(room, randomBot, 'celebrate');
  } else if (eventType === 'game_over') {
    const winner = data.winner;
    if (winner?.isBot) {
      spawnBotReaction(room, winner, 'celebrate');
    } else {
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      spawnBotReaction(room, randomBot, 'happy');
    }
  }
}


/* ---------------- Real-Time WebRTC Voice Signaling ---------------- */

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

function getIceServers() {
  const servers = [...DEFAULT_ICE_SERVERS];
  if (process.env.TURN_URL) {
    servers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    });
  }
  return servers;
}

function broadcastToVoiceMembers(room, payload, { excludePlayerId = null } = {}) {
  if (!room || room.terminated || !room.voiceMembers) return;
  for (const peerId of room.voiceMembers.keys()) {
    if (peerId === excludePlayerId) continue;
    const p = room.players.find((pl) => pl.id === peerId);
    if (p && p.connected && p.ws && !p.isBot) {
      p.ws.send(payload);
    }
  }
}

function handleVoiceJoin(room, player, msg) {
  if (!room || !player || room.terminated) return;
  if (!room.voiceMembers) room.voiceMembers = new Map();

  const muted = Boolean(msg.muted);
  room.voiceMembers.set(player.id, {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    muted,
    speaking: false,
    joinedAt: Date.now(),
  });

  const existingPeers = Array.from(room.voiceMembers.values()).filter((m) => m.id !== player.id);
  player.ws.send({
    type: 'voice_session_joined',
    iceServers: getIceServers(),
    peers: existingPeers,
    selfMuted: muted,
  });

  broadcastToVoiceMembers(
    room,
    {
      type: 'voice_peer_joined',
      peer: {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        muted,
        speaking: false,
      },
    },
    { excludePlayerId: player.id }
  );

  broadcastRoomEvent(room, {
    type: 'voice_peer_status',
    peerId: player.id,
    inVoice: true,
    muted,
    speaking: false,
  });
}

function handleVoiceLeave(room, player) {
  if (!room || !player || !room.voiceMembers) return;
  if (!room.voiceMembers.has(player.id)) return;

  room.voiceMembers.delete(player.id);

  broadcastToVoiceMembers(
    room,
    {
      type: 'voice_peer_left',
      peerId: player.id,
    },
    { excludePlayerId: player.id }
  );

  broadcastRoomEvent(room, {
    type: 'voice_peer_status',
    peerId: player.id,
    inVoice: false,
    muted: true,
    speaking: false,
  });
}

function handleVoiceSignal(room, player, msg) {
  if (!room || !player || room.terminated || !room.voiceMembers) return;
  const targetPeerId = msg.targetPeerId;
  if (!targetPeerId || !room.voiceMembers.has(targetPeerId)) return;

  const targetPlayer = room.players.find((p) => p.id === targetPeerId);
  if (targetPlayer && targetPlayer.connected && targetPlayer.ws && !targetPlayer.isBot) {
    targetPlayer.ws.send({
      type: 'voice_signal',
      fromPeerId: player.id,
      signal: msg.signal,
    });
  }
}

function handleVoiceStatus(room, player, msg) {
  if (!room || !player || room.terminated || !room.voiceMembers) return;
  const mem = room.voiceMembers.get(player.id);
  if (!mem) return;

  if (typeof msg.muted === 'boolean') mem.muted = msg.muted;
  if (typeof msg.speaking === 'boolean') mem.speaking = msg.speaking;

  broadcastRoomEvent(room, {
    type: 'voice_peer_status',
    peerId: player.id,
    inVoice: true,
    muted: mem.muted,
    speaking: mem.speaking,
  });
}

function sendPrivateChat(player, { color = 'warn', text, icon = null }) {
  if (player && !player.isBot && player.connected && player.ws) {
    player.ws.send({
      type: 'chat',
      message: {
        id: randomId(4),
        kind: 'system',
        color,
        author: null,
        icon,
        text,
        ts: Date.now(),
      },
    });
  }
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function addBotToRoom(room) {
  if (!room || room.terminated) return null;
  if (room.players.filter((p) => p.connected).length >= MAX_ROOM_PLAYERS) return null;
  const usedNames = new Set(room.players.map((p) => p.name));
  const profile =
    BOT_PROFILES.find((b) => !usedNames.has(b.name)) ||
    {
      id: `bot_${Math.floor(10 + Math.random() * 89)}`,
      name: `Bot_${Math.floor(10 + Math.random() * 89)}`,
      avatar: {
        color: Math.floor(Math.random() * 20),
        eyes: Math.floor(Math.random() * 16),
        mouth: Math.floor(Math.random() * 16),
        hat: Math.floor(Math.random() * 11),
      },
    };

  const bot = {
    id: 'bot_' + randomId(5),
    token: randomId(8),
    name: profile.name,
    avatar: { ...profile.avatar },
    score: 0,
    connected: true,
    isBot: true,
    botDifficulty: room.settings.botDifficulty || 'medium',
    ws: null,
  };
  room.players.push(bot);
  if (room.phase === 'lobby') {
    syncAutoScaledSettingsForLobby(room);
  }
  sendChat(room, {
    color: 'join',
    icon: 'bot',
    text: `${bot.name} [BOT] joined the room.`,
  });
  broadcastRoomState(room);
  return bot;
}

/**
 * Dynamic bot trivia performance model tuned across Easy, Medium, Hard, and Champion.
 * IMPORTANT: Personality and trivia difficulty are strictly independent systems.
 * Human fairness: All bots are constrained by realistic human reading speeds so they
 * NEVER buzz in before a human player could reasonably read and parse the complete clue.
 */
function getBotSkillProfile(bot, room, row = 0, totalRows = 5, clueText = '') {
  const difficulty = (bot?.botDifficulty || room?.settings?.botDifficulty || 'medium').toLowerCase();
  const rowRatio = totalRows > 1 ? Math.max(0, Math.min(1, row / (totalRows - 1))) : 0;

  // Real human reading time modeling:
  // Trivia clues average 10–25 words. Humans read for comprehension at ~220–250 WPM (~240–270ms/word).
  // A minimum comprehension window of 1800ms is strictly enforced so bots NEVER buzz before
  // humans can even perceive and parse the question.
  const clueWords = String(clueText || room?.activeClue?.clueObj?.clue || '').trim().split(/\s+/).filter(Boolean).length;
  const baseReadingMs = Math.max(1800, Math.min(5000, clueWords * 230));

  let baseAccuracy = 0.65;
  let rowPenalty = 0.16;
  let buzzProbability = 0.68;
  let readingMultiplier = 1.0;
  let minHesitationMs = 1400;
  let maxHesitationMs = 2600;
  let answerDelayMinMs = 1500;
  let answerDelayMaxMs = 2600;
  let wagerAggressiveness = 0.50;
  let reboundMinMs = 2000;
  let reboundMaxMs = 3400;

  if (difficulty === 'easy') {
    // Easy: ~50–55% accuracy, slightly hesitant reader (1.12x), knows basic trivia, casual-friendly
    baseAccuracy = 0.52;
    rowPenalty = 0.16;
    buzzProbability = 0.58;
    readingMultiplier = 1.12;
    minHesitationMs = 1800;
    maxHesitationMs = 3600;
    answerDelayMinMs = 1800;
    answerDelayMaxMs = 3000;
    wagerAggressiveness = 0.35;
    reboundMinMs = 2400;
    reboundMaxMs = 4200;
  } else if (difficulty === 'medium') {
    // Medium: noticeably harder, ~72–78% accuracy, brisk reader (0.88x), faster buzzer, fewer random mistakes
    baseAccuracy = 0.74;
    rowPenalty = 0.10;
    buzzProbability = 0.78;
    readingMultiplier = 0.88;
    minHesitationMs = 950;
    maxHesitationMs = 1950;
    answerDelayMinMs = 1200;
    answerDelayMaxMs = 2200;
    wagerAggressiveness = 0.55;
    reboundMinMs = 1500;
    reboundMaxMs = 2600;
  } else if (difficulty === 'hard') {
    // Hard: substantially more competitive, ~86–90% accuracy, sharp reader (0.70x), rapid buzzer, challenges veterans
    baseAccuracy = 0.88;
    rowPenalty = 0.05;
    buzzProbability = 0.90;
    readingMultiplier = 0.70;
    minHesitationMs = 550;
    maxHesitationMs = 1150;
    answerDelayMinMs = 850;
    answerDelayMaxMs = 1600;
    wagerAggressiveness = 0.80;
    reboundMinMs = 900;
    reboundMaxMs = 1650;
  } else if (difficulty === 'champion') {
    // Champion: UNCHANGED - exact current behavior, accuracy (91%), reading multiplier (0.62x) and challenge preserved
    baseAccuracy = 0.91;
    rowPenalty = 0.04;
    buzzProbability = 0.93;
    readingMultiplier = 0.62;
    minHesitationMs = 450;
    maxHesitationMs = 950;
    answerDelayMinMs = 750;
    answerDelayMaxMs = 1400;
    wagerAggressiveness = 0.90;
    reboundMinMs = 750;
    reboundMaxMs = 1400;
  }

  // Fair multi-player participation pacing: prevent one hot bot from monopolizing 4–10 player rooms
  const activeCount = getActivePlayerCount(room);
  const botStreak = bot?.stats?.currentStreak || 0;
  const justWonLast = room?.pickerId === bot?.id && botStreak >= 1;
  let crowdReactionOffsetMs = 0;
  let streakBuzzMod = 0;

  if (activeCount >= 4) {
    if (botStreak >= 2) {
      crowdReactionOffsetMs += Math.min(3, botStreak) * 320;
      streakBuzzMod -= 0.05 * Math.min(3, botStreak - 1);
    } else if (justWonLast) {
      crowdReactionOffsetMs += 260;
    }
    if (activeCount >= 7) {
      crowdReactionOffsetMs += Math.random() * 420;
    }
  }

  const effectiveAccuracy = Math.max(0.18, Math.min(0.95, baseAccuracy - rowRatio * rowPenalty));
  const effectiveBuzz = Math.max(
    0.20,
    Math.min(0.98, buzzProbability - rowRatio * (rowPenalty * 0.5) + streakBuzzMod)
  );

  const reactionMs = Math.round(
    baseReadingMs * readingMultiplier +
    minHesitationMs +
    Math.random() * (maxHesitationMs - minHesitationMs) +
    crowdReactionOffsetMs
  );
  const reboundMs = Math.round(
    reboundMinMs +
    Math.random() * (reboundMaxMs - reboundMinMs) +
    crowdReactionOffsetMs
  );
  const answerDelayMs = Math.round(
    answerDelayMinMs + Math.random() * (answerDelayMaxMs - answerDelayMinMs)
  );

  return {
    difficulty,
    accuracy: effectiveAccuracy,
    buzzProbability: effectiveBuzz,
    reactionMs,
    reboundMs,
    answerDelayMs,
    wagerAggressiveness,
  };
}

/* =========================================================================
   JEOPARDY GAME ENGINE
   ========================================================================= */

/**
 * Dynamic per-question open buzzer/answer timer adjusted by room setting
 * AND clue row difficulty so simple $200 clues stay brisk while $1000-$1200
 * clues give players comfortable thinking time.
 */
function computeDynamicClueDurationMs(room, ac) {
  const baseSec = Number(room?.settings?.clueTimeSec) || 18;
  const row = Number(ac?.row) || 0;
  let deltaSec = 0;
  if (row === 0) deltaSec = -2;
  else if (row === 3) deltaSec = 2;
  else if (row >= 4) deltaSec = 4;
  const effectiveSec = Math.max(10, Math.min(55, baseSec + deltaSec));
  return effectiveSec * 1000;
}

function buildRoundBoard(room, roundNumber, excludedUsedIds = new Set()) {
  const cols = room.settings.boardCols;
  const rows = room.settings.cluesPerCat;
  const multiplier = roundNumber === 2 ? 2 : 1;

  const allCats = getAllCategoriesForRoom(room);
  const included = allCats.filter((c) =>
    room.settings.includedCategoryIds.includes(c.id)
  );

  // Prefer included categories not already used in Round 1
  let pool = shuffle(included.filter((c) => !excludedUsedIds.has(c.id)));
  if (pool.length < cols) {
    const extras = shuffle(
      included.filter((c) => excludedUsedIds.has(c.id))
    );
    pool = [...pool, ...extras];
  }
  // Safety fallback if somehow fewer than cols were included
  if (pool.length < cols) {
    const more = shuffle(
      allCats.filter((c) => !pool.some((p) => p.id === c.id))
    );
    pool = [...pool, ...more];
  }

  room.recentClueKeys = room.recentClueKeys || new Set();
  const usedOnThisBoard = new Set();

  // Backup pool of built-in clues in case a 5-clue custom category is played on a 6-row board
  const fallbackBuiltinClues = shuffle(
    BUILTIN_CATEGORIES.flatMap((bc) => bc.clues || [])
  );

  const chosen = pool.slice(0, cols);
  const categories = chosen.map((cat, colIdx) => {
    const allClues = cat.clues || [];
    let poolForCat = allClues.filter(
      (c) => !room.recentClueKeys.has(c.clue) && !usedOnThisBoard.has(c.clue)
    );
    if (poolForCat.length < rows) {
      poolForCat = allClues.filter((c) => !usedOnThisBoard.has(c.clue));
    }

    const selectedClues = [];
    const usedInCol = new Set();

    for (let r = 0; r < rows; r++) {
      const targetValue = (r + 1) * 200;
      const candidates = poolForCat.filter(
        (c) => !usedInCol.has(c) && !usedOnThisBoard.has(c.clue)
      );
      let best = candidates.find((c) => c.baseValue === targetValue);
      if (!best && candidates.length > 0) {
        best = candidates.slice().sort(
          (a, b) =>
            Math.abs((a.baseValue || 400) - targetValue) -
            Math.abs((b.baseValue || 400) - targetValue)
        )[0];
      }
      if (!best) {
        // Never duplicate a clue on the same board (e.g. 5-clue custom category in 6-row match)
        best = fallbackBuiltinClues.find(
          (fc) => !usedOnThisBoard.has(fc.clue) && !room.recentClueKeys.has(fc.clue)
        ) || fallbackBuiltinClues.find((fc) => !usedOnThisBoard.has(fc.clue));
      }
      if (best) {
        usedInCol.add(best);
        usedOnThisBoard.add(best.clue);
        selectedClues.push(best);
        room.recentClueKeys.add(best.clue);
      }
    }

    if (room.recentClueKeys.size > 400) {
      const excess = Array.from(room.recentClueKeys).slice(0, 100);
      excess.forEach((k) => room.recentClueKeys.delete(k));
    }

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      tiles: selectedClues.map((clueObj, rowIdx) => ({
        row: rowIdx,
        col: colIdx,
        value:
          (rowIdx + 1) *
          200 *
          multiplier *
          (room.settings.gameMode === 'double_or_nothing' ? 2 : 1),
        used: false,
        dailyDouble: false,
        clueObj,
      })),
    };
  });

  const totalTiles = cols * rows;
  const freq = room.settings.specialFrequency || 'normal';

  if (room.settings.dailyDoubles) {
    let baseDD = 1;
    if (totalTiles >= 35) {
      baseDD = roundNumber === 2 ? 3 : 2;
    } else if (totalTiles >= 30) {
      baseDD = 2;
    } else if (roundNumber === 2 && cols >= 4) {
      baseDD = 2;
    }
    const ddCount =
      freq === 'low'
        ? Math.max(1, baseDD - 1)
        : freq === 'high'
        ? Math.min(cols, baseDD + 1)
        : baseDD;

    const candidateCoords = [];
    for (let c = 0; c < categories.length; c++) {
      for (let r = 0; r < categories[c].tiles.length; r++) {
        const weight = r === 0 ? 1 : 2;
        for (let w = 0; w < weight; w++) {
          candidateCoords.push([c, r]);
        }
      }
    }
    const usedCols = new Set();
    let placed = 0;
    for (const [c, r] of shuffle(candidateCoords)) {
      if (placed >= ddCount) break;
      if (usedCols.has(c)) continue;
      usedCols.add(c);
      categories[c].tiles[r].dailyDouble = true;
      placed++;
    }
  }

  // Assign Party Wildcard Modifiers scaled proportionally to match length & specialFrequency
  const nonDDByCol = categories.map((cat) =>
    shuffle(cat.tiles.filter((t) => !t.dailyDouble))
  );
  const totalNonDD = nonDDByCol.reduce((sum, arr) => sum + arr.length, 0);
  const isChaosMode = room.settings.gameMode === 'chaos';
  const ratio = isChaosMode ? 0.45 : freq === 'low' ? 0.09 : freq === 'high' ? 0.28 : 0.18;
  const minMods = isChaosMode ? 4 : freq === 'low' ? 1 : freq === 'high' ? 3 : 2;
  const modCount = Math.min(
    totalNonDD,
    Math.max(minMods, Math.round(totalTiles * ratio))
  );

  const MODIFIERS = [
    'speed_blitz',
    'steal',
    'chaos_all_play',
    'double_trouble',
    'treasure_clue',
    'risky_business',
    'triple_threat',
    'category_takeover',
    'last_chance',
    'mystery_question',
    'reverse_jeoparty',
  ];
  const colOrder = shuffle(Array.from({ length: categories.length }, (_, idx) => idx));
  let modsPlaced = 0;
  let pass = 0;
  while (modsPlaced < modCount && pass < rows + 2) {
    for (const colIdx of colOrder) {
      if (modsPlaced >= modCount) break;
      const bucket = nonDDByCol[colIdx];
      if (bucket && bucket.length > 0) {
        const tile = bucket.pop();
        tile.modifier = MODIFIERS[modsPlaced % MODIFIERS.length];
        modsPlaced++;
      }
    }
    pass++;
  }

  // Register the categories shown on this board for the Final Jeopardy wheel.
  room.boardCategoryHistory = Array.isArray(room.boardCategoryHistory)
    ? room.boardCategoryHistory
    : [];
  const knownHistoryIds = new Set(room.boardCategoryHistory.map((c) => c.id));
  for (const cat of categories) {
    if (!knownHistoryIds.has(cat.id)) {
      knownHistoryIds.add(cat.id);
      room.boardCategoryHistory.push({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
      });
    }
  }

  return { categories };
}

function startNewGame(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);

  // Lock match scaling at match start from the actual connected active roster (excluding disconnected)
  if (room.settings.autoScaleMatch) {
    syncAutoScaledSettingsForLobby(room);
  }

  // Mint a brand-new game session ID and reset every piece of match state
  room.gameId = 'game_' + randomId(6);
  if (room.botMemory) {
    room.botMemory.lastLeaderId = null;
    room.botMemory.endgameAnnouncedRound = 0;
  }
  let pIdx = 0;
  for (const p of room.players) {
    p.score = 0;
    p.lives = 3;
    p.isEliminated = false;
    p.team = pIdx % 2 === 0 ? 'red' : 'blue';
    pIdx++;
    p.stats = {
      correctCount: 0,
      wrongCount: 0,
      maxStreak: 0,
      currentStreak: 0,
      fastestBuzzMs: 99999,
      reactionsSent: 0,
    };
  }
  room.teamScores = { red: 0, blue: 0, green: 0, yellow: 0 };
  room.round = 1;
  room.usedCategoryIds = new Set();
  room.boardCategoryHistory = [];
  room.board = buildRoundBoard(room, 1, room.usedCategoryIds);
  for (const c of room.board.categories) {
    room.usedCategoryIds.add(c.id);
  }

  // Reset the show presentation for a fresh match.
  room.hostMemory = {};
  room.lastHostLine = null;
  room.hostLineSeq = 0;
  room.recentAwards = [];
  room.awardSeq = 0;
  room.lastSelectedTile = null;

  const activePlayers = room.players.filter((p) => p.connected);
  room.pickerId = (activePlayers[0] || room.players[0])?.id || room.hostId;
  room.activeClue = null;
  room.finalState = null;
  room.lastFeedback = null;
  room.phaseEndsAt = 0;
  room.mainTimerRemainingMs = 0;
  room.introState = null;

  const totalClues = room.settings.boardCols * room.settings.cluesPerCat;
  sendChat(room, {
    color: 'success',
    text: `New match started! (${activePlayers.length} Players • ${room.settings.boardCols}x${room.settings.cluesPerCat} = ${totalClues} Clues) — Round 1!`,
  });
  if (room.settings.gameMode === 'teams') {
    enterTeamSelectPhase(room);
    return;
  }

  // Cinematic Camera: on/reduced opens with the televised intro; off goes
  // straight to the interactive board.
  const cameraMode = room.settings.cinematicCamera || 'on';
  if (cameraMode === 'off') {
    broadcastRoomEvent(room, { type: 'sfx', sound: 'round_start' });
    hostSay(room, 'round_start');
    maybeSpawnBotReaction(room, 'match_start');
    enterBoardPhase(room);
  } else {
    // No bot reaction particles over the cinematic stage; the intro is the show.
    enterIntroPhase(room);
  }
}

function enterTeamSelectPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.phase = 'team_select';
  const durationMs = 15000;
  room.phaseEndsAt = Date.now() + durationMs;
  room.teamScores = { red: 0, blue: 0, green: 0, yellow: 0 };

  sendChat(room, {
    color: 'gold',
    text: '⚔️ TEAM JEOPARDY! Choose your team (Red, Blue, Green, or Yellow) in the next 15 seconds!',
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'daily_double' });
  broadcastRoomState(room);

  scheduleRoomTimer(room, () => {
    finishTeamSelect(room);
  }, durationMs);
}

function finishTeamSelect(room) {
  if (!room || room.phase !== 'team_select') return;
  clearRoomTimers(room);

  const teams = ['red', 'blue', 'green', 'yellow'];
  const teamCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const p of room.players) {
    if (p.team && teams.includes(p.team)) {
      teamCounts[p.team]++;
    }
  }

  for (const p of room.players) {
    if (!p.team || !teams.includes(p.team)) {
      const leastTeam = teams.slice().sort((a, b) => teamCounts[a] - teamCounts[b])[0];
      p.team = leastTeam;
      teamCounts[leastTeam]++;
    }
    p.teamContribution = 0;
  }

  sendChat(room, {
    color: 'success',
    text: `Teams locked! 🚩 Red: ${teamCounts.red} | 🛡️ Blue: ${teamCounts.blue} | ⚔️ Green: ${teamCounts.green} | ⚡ Yellow: ${teamCounts.yellow}`,
  });

  const cameraMode = room.settings.cinematicCamera || 'on';
  if (cameraMode === 'off') {
    broadcastRoomEvent(room, { type: 'sfx', sound: 'round_start' });
    hostSay(room, 'round_start');
    maybeSpawnBotReaction(room, 'match_start');
    enterBoardPhase(room);
  } else {
    enterIntroPhase(room);
  }
}

function countRemainingTiles(room) {
  if (!room.board) return 0;
  let count = 0;
  for (const cat of room.board.categories) {
    for (const tile of cat.tiles) {
      if (!tile.used) count++;
    }
  }
  return count;
}

/* =========================================================================
   CINEMATIC MATCH INTRO
   The server owns the order and timing so every client watches the same show.
   ========================================================================= */

/**
 * Builds the intro storyboard: wide stage shot -> host -> each contestant ->
 * board reveal. All timings are relative to `startedAt` (server clock).
 */
function buildIntroState(room) {
  const mode = room.settings.cinematicCamera === 'reduced' ? 'reduced' : 'on';
  const cfg = INTRO_TIMINGS[mode] || INTRO_TIMINGS.on;
  const hostName = getPublicHostIdentity(false).name;

  const activePlayers = room.players.filter((p) => p.connected);
  const playerCount = activePlayers.length;
  const perPlayerMs = Math.max(
    cfg.minPlayerMs,
    Math.min(
      cfg.maxPlayerMs,
      Math.floor(cfg.playerBudgetMs / Math.max(1, playerCount))
    )
  );

  const steps = [];
  let cursor = cfg.leadMs;

  steps.push({
    kind: 'wide',
    startMs: cursor,
    durationMs: cfg.wideMs,
    speaker: null,
    line: null,
    tone: 'dramatic',
  });
  cursor += cfg.wideMs;

  steps.push({
    kind: 'host',
    startMs: cursor,
    durationMs: cfg.hostMs,
    speaker: hostName,
    line: INTRO_HOST_LINE,
    tone: 'excited',
  });
  cursor += cfg.hostMs;

  activePlayers.forEach((p, idx) => {
    const line = p.isBot
      ? `I'm ${p.name}, and I'm ready to play!`
      : `Hello, I'm ${p.name}!`;
    steps.push({
      kind: 'player',
      startMs: cursor,
      durationMs: perPlayerMs,
      playerId: p.id,
      name: p.name,
      isBot: Boolean(p.isBot),
      avatar: p.avatar,
      speaker: p.name,
      line,
      tone: 'neutral',
      index: idx + 1,
      total: playerCount,
    });
    cursor += perPlayerMs;
  });

  steps.push({
    kind: 'board',
    startMs: cursor,
    durationMs: cfg.boardMs,
    speaker: hostName,
    line: INTRO_OUTRO_LINE,
    tone: 'excited',
  });
  cursor += cfg.boardMs;

  return {
    id: 'intro_' + randomId(4),
    mode,
    startedAt: Date.now(),
    durationMs: cursor,
    playerCount,
    hostName,
    steps,
  };
}

function enterIntroPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.activeClue = null;
  room.phase = 'intro';
  room.introState = buildIntroState(room);
  const settleMs = room.introState.durationMs + 350;
  room.phaseEndsAt = room.introState.startedAt + settleMs;

  sendChat(room, {
    color: 'info',
    icon: 'celebrate',
    text: 'Lights, camera... welcome to Jeoparty!',
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'intro_start' });
  broadcastRoomState(room);

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'intro') return;
    finishIntro(room);
  }, settleMs);
}

function finishIntro(room) {
  if (!room || room.terminated) return;
  if (room.phase !== 'intro') return;
  room.introState = null;
  hostSay(room, 'intro_outro');
  broadcastRoomEvent(room, { type: 'sfx', sound: 'board_reveal' });
  enterBoardPhase(room);
}

function enterBoardPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.activeClue = null;

  // Ensure pickerId is still a valid connected player
  let picker = room.players.find((p) => p.id === room.pickerId && p.connected);
  if (!picker) {
    picker = room.players.find((p) => p.connected) || room.players[0];
    room.pickerId = picker ? picker.id : null;
  }

  if (countRemainingTiles(room) === 0) {
    advanceAfterRoundComplete(room);
    return;
  }

  room.phase = 'board';
  const pickDurationMs = 35000;
  room.phaseEndsAt = Date.now() + pickDurationMs;
  broadcastRoomState(room);

  // The host occasionally nudges the player on the clock (never every clue,
  // so the presentation stays lively instead of repetitive).
  if (picker && !picker.isBot && Math.random() < 0.4) {
    hostSay(room, 'pick_tile', { name: picker.name });
  }

  if (picker && picker.isBot) {
    scheduleRoomTimer(
      room,
      () => {
        if (room.phase !== 'board') return;
        const openTiles = [];
        for (const cat of room.board.categories) {
          for (const t of cat.tiles) {
            if (!t.used) openTiles.push(t);
          }
        }
        if (openTiles.length > 0) {
          const choice =
            openTiles[Math.floor(Math.random() * openTiles.length)];
          handleSelectTile(room, picker, choice.col, choice.row);
        }
      },
      1700 + Math.random() * 1100
    );
  } else {
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'board') return;
      const openTiles = [];
      for (const cat of room.board.categories) {
        for (const t of cat.tiles) {
          if (!t.used) openTiles.push(t);
        }
      }
      if (openTiles.length > 0 && picker) {
        const choice = openTiles[Math.floor(Math.random() * openTiles.length)];
        handleSelectTile(room, picker, choice.col, choice.row);
      }
    }, pickDurationMs);
  }
}

function advanceAfterRoundComplete(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);

  // If Round 1 is done and doubleJeopardy is enabled -> Intermission break before Round 2!
  if (room.round === 1 && room.settings.doubleJeopardy) {
    enterIntermissionPhase(room, () => {
      room.round = 2;
      room.board = buildRoundBoard(room, 2, room.usedCategoryIds);
      for (const c of room.board.categories) {
        room.usedCategoryIds.add(c.id);
      }
      const connected = room.players.filter((p) => p.connected);
      if (connected.length > 0) {
        connected.sort((a, b) => a.score - b.score);
        room.pickerId = connected[0].id;
      }
      const topR2 = (room.settings.cluesPerCat || 5) * 400;
      sendChat(room, {
        color: 'gold',
        icon: 'blitz',
        text: `DOUBLE JEOPARTY! Point values are doubled ($400 - $${topR2.toLocaleString()})!`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'round_start' });
      enterBoardPhase(room);
    }, 'Double Jeoparty (Round 2)');
    return;
  }

  // Before Final Jeopardy -> Intermission break!
  if (room.settings.finalJeopardy) {
    enterIntermissionPhase(room, () => {
      enterFinalWheelPhase(room);
    }, 'Final Jeoparty!');
    return;
  }

  enterGameOverPhase(room);
}

function enterIntermissionPhase(room, nextPhaseCallback, nextTitle) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.phase = 'round_intermission';
  const durationMs = 12000;
  room.phaseEndsAt = Date.now() + durationMs;
  room.intermissionNextTitle = nextTitle;
  room.intermissionCallback = nextPhaseCallback;

  sendChat(room, {
    color: 'info',
    icon: 'coffee',
    text: `Intermission! Catch your breath — ${nextTitle} starting in 12s...`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'hint' });
  hostSay(room, 'intermission');
  broadcastRoomState(room);

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'round_intermission') return;
    if (typeof room.intermissionCallback === 'function') {
      const cb = room.intermissionCallback;
      room.intermissionCallback = null;
      cb();
    }
  }, durationMs);
}

function handleSelectTile(room, player, col, row) {
  if (!room || room.terminated) return;
  if (room.phase !== 'board') return;
  if (!player || player.id !== room.pickerId) return;

  const cat = room.board?.categories?.[col];
  const tile = cat?.tiles?.[row];
  if (!cat || !tile || tile.used) return;

  clearRoomTimers(room);
  tile.used = true;

  const maxBoardVal = (room.settings.cluesPerCat || 5) * 200 * (room.round === 2 ? 2 : 1);
  const maxWager = Math.max(player.score, maxBoardVal);

  const modifier = tile.modifier || null;
  room.activeClue = {
    col,
    row,
    categoryId: cat.id,
    categoryName: cat.name,
    categoryIcon: cat.icon,
    value: tile.value,
    wager: tile.value,
    maxWager,
    dailyDouble: tile.dailyDouble,
    modifier,
    clueObj: tile.clueObj,
    buzzedPlayerId: null,
    buzzedGuessText: null,
    attemptedIds: new Set(),
    solvedIds: new Set(),
    hintMask: null,
    revealedLetterIndices: new Set(),
    winnerName: null,
    winnerDelta: 0,
    lastWrongText: null,
    clueStartedAt: Date.now(),
    reveal: null,
  };

  // Host introduces the newly selected clue (authoritative selection already made).
  hostSay(room, 'tile_selected', {
    name: player.name,
    category: cat.name,
    amount: formatCurrency(tile.value, room),
  });

  if (tile.dailyDouble) {
    enterDailyDoubleWagerPhase(room, player);
    return;
  }

  const clueDurationMs = computeDynamicClueDurationMs(room, room.activeClue);
  const isHalloween = room.settings?.gameMode === 'halloween';

  // Handle Party Wildcard Modifiers
  if (modifier === 'speed_blitz') {
    room.activeClue.value = Math.round(tile.value * 1.5);
    const label = isHalloween ? 'PUMPKIN BLITZ' : 'SPEED BLITZ';
    const bonusUnit = isHalloween ? 'bonus candy' : 'bonus points';
    sendChat(room, {
      color: 'gold',
      icon: isHalloween ? 'pumpkin' : 'blitz',
      text: `${label}! 9s rapid buzzer with +50% ${bonusUnit} (${formatCurrency(room.activeClue.value, room)})!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: isHalloween ? 'blitz' : 'blitz' });
    enterBuzzerClueOpenPhase(room, 9000, true);
    return;
  }

  if (modifier === 'steal') {
    const label = isHalloween ? 'GHOST STEAL' : 'STEAL TILE';
    sendChat(room, {
      color: 'gold',
      icon: isHalloween ? 'ghost' : 'steal',
      text: `${label}! Correct buzz earns ${formatCurrency(room.activeClue.value, room)} AND steals ${formatCurrency(200, room)} from the leader!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: isHalloween ? 'steal' : 'steal' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'double_trouble') {
    room.activeClue.value = tile.value * 2;
    const label = isHalloween ? 'CURSED CANDY' : 'DOUBLE TROUBLE';
    const penaltyUnit = isHalloween ? 'candy' : 'points';
    sendChat(room, {
      color: 'gold',
      icon: isHalloween ? 'candy' : 'double',
      text: `${label}! 2X ${penaltyUnit} (${formatCurrency(room.activeClue.value, room)}), but 2X penalty for incorrect guesses!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'daily_double' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'treasure_clue') {
    room.activeClue.value = Math.round(tile.value * 1.5);
    sendChat(room, {
      color: 'gold',
      icon: 'treasure',
      text: `TREASURE CLUE! Secret hidden reward: +50% bonus (${formatCurrency(room.activeClue.value, room)})!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'blitz' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'triple_threat') {
    room.activeClue.value = tile.value * 3;
    sendChat(room, {
      color: 'gold',
      icon: 'star',
      text: `TRIPLE THREAT! This question is worth 3X points (${formatCurrency(room.activeClue.value, room)})!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'daily_double' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'risky_business') {
    room.activeClue.value = tile.value * 2;
    sendChat(room, {
      color: 'gold',
      icon: 'dice',
      text: `RISKY BUSINESS! High stakes: 2X points (${formatCurrency(room.activeClue.value, room)}), but double penalty on incorrect guess!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'daily_double' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'last_chance') {
    sendChat(room, {
      color: 'gold',
      icon: 'rocket',
      text: `LAST CHANCE! Contenders trailing or with negative scores earn 2X recovery points with zero wrong penalty!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'blitz' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'category_takeover') {
    sendChat(room, {
      color: 'gold',
      icon: 'crown',
      text: `CATEGORY TAKEOVER! Answering gives you category control and an extra +$300 domination reward!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'blitz' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'mystery_question') {
    sendChat(room, {
      color: 'gold',
      icon: 'help',
      text: `MYSTERY QUESTION! Unveiled from the shadows!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'tile_selected' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'reverse_jeoparty') {
    sendChat(room, {
      color: 'gold',
      icon: 'help',
      text: `REVERSE JEOPARTY! The answer is given — identify the subject!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'tile_selected' });
    enterBuzzerClueOpenPhase(room, clueDurationMs, true);
    return;
  }

  if (modifier === 'chaos_all_play') {
    enterChaosAllPlayPhase(room);
    return;
  }

  if (room.settings.gameMode === 'double_or_nothing') {
    // Value already doubled from board definition ($400, $800, etc.)
  }

  if (room.settings.answerMode === 'skribbl') {
    enterSkribblCluePhase(room);
  } else {
    const finalDuration = room.settings.gameMode === 'speed' ? 8000 : clueDurationMs;
    enterBuzzerClueOpenPhase(room, finalDuration, true);
  }
}

/* ---------------- Daily Double ---------------- */

function enterDailyDoubleWagerPhase(room, picker) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.phase = 'daily_double_wager';
  const durationMs = 18000;
  room.phaseEndsAt = Date.now() + durationMs;

  const isHalloween = room.settings?.gameMode === 'halloween';
  const ddTitle = isHalloween ? 'JACK-O\'-LANTERN TREASURE' : 'DAILY DOUBLE';
  sendChat(room, {
    color: 'gold',
    icon: isHalloween ? 'pumpkin' : 'daily_double',
    text: `${ddTitle}! ${picker.name} can wager up to ${formatCurrency(room.activeClue.maxWager, room)}!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: isHalloween ? 'halloween_daily_double' : 'daily_double' });
  // Let the tile announcement breathe before the dramatic Daily Double reveal.
  scheduleRoomTimer(room, () => {
    if (room.activeClue && room.activeClue.dailyDouble) {
      hostSay(room, 'daily_double');
    }
  }, 1100);
  broadcastRoomState(room);

  if (picker.isBot) {
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'daily_double_wager') return;
      const botProf = getBotSkillProfile(picker, room, room.activeClue.row, room.settings.cluesPerCat || 5);
      const smartWager = Math.min(
        room.activeClue.maxWager,
        Math.max(200, Math.round((room.activeClue.maxWager * botProf.wagerAggressiveness) / 100) * 100)
      );
      handleSubmitDailyDoubleWager(room, picker, smartWager);
    }, 2000);
  } else {
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'daily_double_wager') return;
      const fallback = Math.min(room.activeClue.value, room.activeClue.maxWager);
      handleSubmitDailyDoubleWager(room, picker, Math.max(5, fallback));
    }, durationMs);
  }
}

function handleSubmitDailyDoubleWager(room, player, rawWager) {
  if (!room || room.terminated) return;
  if (room.phase !== 'daily_double_wager') return;
  if (player.id !== room.pickerId) return;

  clearRoomTimers(room);
  const ac = room.activeClue;
  const clamped = Math.max(
    5,
    Math.min(ac.maxWager, Math.floor(Number(rawWager) || ac.value))
  );
  ac.wager = clamped;
  ac.value = clamped;
  ac.buzzedPlayerId = player.id;

  room.phase = 'daily_double_answer';
  const answerMs = computeDynamicClueDurationMs(room, ac) + 2000;
  room.phaseEndsAt = Date.now() + answerMs;
  // The Daily Double clue also types out word-by-word, server-scheduled.
  ac.reveal = buildRevealPlan(ac.clueObj.clue, answerMs);

  sendChat(room, {
    color: 'gold',
    text: `${player.name} wagered $${clamped.toLocaleString()}!`,
  });
  hostSay(room, 'dd_wager', {
    name: player.name,
    amount: formatCurrency(clamped, room),
  });
  broadcastRoomState(room);

  if (player.isBot) {
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'daily_double_answer') return;
      const botProf = getBotSkillProfile(player, room, ac.row, room.settings.cluesPerCat || 5);
      const knows = Math.random() < botProf.accuracy;
      const guess = knows
        ? ac.clueObj.answer
        : FUNNY_WRONG_ANSWERS[Math.floor(Math.random() * FUNNY_WRONG_ANSWERS.length)];
      handleSubmitDailyDoubleAnswer(room, player, guess);
    }, 2200 + Math.random() * 2000);
  } else {
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'daily_double_answer') return;
      const before = player.score;
      player.score -= ac.wager;
      recordWrongAnswer(player);
      completeReveal(ac.reveal);
      ac.lastWrongText = `${player.name} ran out of time (-${formatCurrency(ac.wager, room)})`;
      pushAward(room, {
        playerId: player.id,
        kind: 'timeout',
        delta: player.score - before,
        wager: ac.wager,
      });
      sendChat(room, {
        color: 'danger',
        text: `Time's up for ${player.name}! (-${formatCurrency(ac.wager, room)})`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'wrong' });
      hostSay(room, 'answer_timeout');
      maybeSpawnBotReaction(room, 'wrong_answer', { player });
      enterClueResultPhase(room);
    }, answerMs);
  }
}

function handleSubmitDailyDoubleAnswer(room, player, text) {
  if (!room || room.terminated) return;
  if (room.phase !== 'daily_double_answer') return;
  if (player.id !== room.pickerId) return;

  const ac = room.activeClue;
  const result = evaluateAnswer(text, ac.clueObj);

  if (result.status === 'close' && !player.isBot) {
    sendPrivateChat(player, {
      color: 'warn',
      text: `"${text}" is close! Refine your answer before time runs out!`,
    });
    return;
  }

  clearRoomTimers(room);
  const before = player.score;
  if (result.status === 'correct') {
    player.score += ac.wager;
    const streakResult = recordCorrectAnswer(room, player, ac.wager);
    ac.winnerName = player.name;
    ac.winnerDelta = player.score - before;
    ac.winnerStreak = streakResult.streak;
    ac.winnerStreakBonus = streakResult.streakBonus;
    completeReveal(ac.reveal);
    pushAward(room, {
      playerId: player.id,
      kind: 'correct',
      delta: player.score - before,
      base: ac.wager,
      streak: streakResult.streak,
      streakBonus: streakResult.streakBonus,
    });
    const ddName = room.settings?.gameMode === 'halloween' ? 'Jack-o\'-Lantern Treasure' : 'Daily Double';
    sendChat(room, {
      color: 'success',
      text: `${player.name} nailed the ${ddName}! (+${formatCurrency(ac.wager, room)})`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'correct' });
    if (streakResult.streakBonus > 0) {
      hostSay(room, 'streak', {
        name: player.name,
        streak: streakResult.streak,
        amount: formatCurrency(streakResult.streakBonus, room),
      });
    } else {
      hostSay(room, 'correct', { name: player.name });
    }
    maybeSpawnBotReaction(room, (player.stats?.currentStreak >= 3) ? 'streak' : 'correct_answer', { player });
  } else {
    player.score -= ac.wager;
    recordWrongAnswer(player);
    completeReveal(ac.reveal);
    ac.lastWrongText = `${player.name}: "${text}" (-${formatCurrency(ac.wager, room)})`;
    pushAward(room, {
      playerId: player.id,
      kind: 'wrong',
      delta: player.score - before,
      wager: ac.wager,
    });
    sendChat(room, {
      color: 'danger',
      text: `"${text}" — Incorrect! ${player.name} loses ${formatCurrency(ac.wager, room)}.`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'wrong' });
    hostSay(room, 'money_loss', { name: player.name, amount: formatCurrency(ac.wager, room) });
    maybeSpawnBotReaction(room, 'wrong_answer', { player });
  }
  enterClueResultPhase(room);
}

/* ---------------- Classic Buzzer Clue Phase ---------------- */

function enterBuzzerClueOpenPhase(room, durationMs, isFirstOpen) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  if (!ac) return;
  ac.buzzedPlayerId = null;
  ac.buzzedGuessText = null;

  const eligible = room.players.filter(
    (p) => p.connected && !ac.attemptedIds.has(p.id)
  );
  if (eligible.length === 0) {
    completeReveal(ac.reveal);
    hostSay(room, 'timeout');
    enterClueResultPhase(room);
    return;
  }

  room.phase = 'clue_open';
  room.mainTimerRemainingMs = durationMs;
  room.phaseEndsAt = Date.now() + durationMs;

  if (isFirstOpen) {
    if (room.settings.gameMode === 'hot_potato') {
      const activeCandidates = room.players.filter((p) => p.connected);
      const startingHolder = room.players.find((p) => p.id === room.pickerId) || activeCandidates[0];
      if (startingHolder) {
        ac.hotPotatoHolderId = startingHolder.id;
        sendChat(room, {
          color: 'warn',
          text: `🥔 HOT POTATO! ${startingHolder.name} is holding the potato! Buzz in before it explodes!`,
        });
      }
    }
    broadcastRoomEvent(room, { type: 'sfx', sound: 'clue_reveal' });
    if (!ac.revealedLetterIndices) ac.revealedLetterIndices = new Set();
    if (!ac.hintMask) {
      ac.hintMask = renderMaskFromRevealed(ac.clueObj.answer, ac.revealedLetterIndices);
    }
    // Full question appears immediately: no word-by-word typing plans
    ac.reveal = null;
    scheduleRoomTimer(
      room,
      () => {
        if (room.phase === 'clue_open' && room.activeClue === ac) {
          hostSay(room, 'clue_open');
        }
      },
      Math.min(2600, Math.max(900, durationMs * 0.4))
    );
  }
  broadcastRoomState(room);

  // Progressive letter hint at 50% time remaining
  if (durationMs > 4500) {
    scheduleRoomTimer(room, () => {
      if (room.phase === 'clue_open' && room.activeClue === ac) {
        if (revealOneLetterHint(ac)) {
          broadcastRoomEvent(room, { type: 'sfx', sound: 'hint' });
          broadcastRoomState(room);
        }
      }
    }, durationMs * 0.5);
  }

  // Fair bot buzzer scheduling:
  // - First open: bots must wait for realistic human reading time + difficulty hesitation
  // - Rebound after wrong answer: bots wait for realistic rebound hesitation
  for (const bot of eligible.filter((p) => p.isBot)) {
    const botProf = getBotSkillProfile(
      bot,
      room,
      ac.row,
      room.settings.cluesPerCat || 5,
      ac.clueObj.clue
    );
    const willBuzz = Math.random() < botProf.buzzProbability;
    if (willBuzz) {
      const waitMs = isFirstOpen ? botProf.reactionMs : botProf.reboundMs;
      const reactionMs = Math.max(isFirstOpen ? 800 : 500, Math.min(durationMs - 400, waitMs));
      scheduleRoomTimer(room, () => {
        if (room.phase === 'clue_open' && !ac.attemptedIds.has(bot.id)) {
          handlePlayerBuzz(room, bot);
        }
      }, reactionMs);
    }
  }

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'clue_open') return;
    if (room.settings.gameMode === 'hot_potato' && ac.hotPotatoHolderId) {
      const holder = room.players.find((p) => p.id === ac.hotPotatoHolderId);
      if (holder) {
        const boomPenalty = ac.value || 200;
        holder.score -= boomPenalty;
        sendChat(room, {
          color: 'danger',
          text: `💥 HOT POTATO EXPLODED! ${holder.name} was caught holding it (-${formatCurrency(boomPenalty, room)})!`,
        });
        broadcastRoomEvent(room, { type: 'sfx', sound: 'wrong' });
      }
    }
    sendChat(room, {
      color: 'warn',
      text: `Time's up! The answer was: ${ac.clueObj.answer}`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'timeout' });
    hostSay(room, 'timeout');
    enterClueResultPhase(room);
  }, durationMs);
}

function handlePlayerBuzz(room, player) {
  if (!room || room.terminated) return;
  if (room.phase !== 'clue_open') return;
  const ac = room.activeClue;
  if (!ac || ac.attemptedIds.has(player.id)) return;
  if (room.settings.gameMode === 'survival' && (player.lives ?? 3) <= 0) return;

  const remainingMain = Math.max(6000, room.phaseEndsAt - Date.now());
  clearRoomTimers(room);
  room.mainTimerRemainingMs = remainingMain;

  // Track buzz reaction latency
  const buzzElapsed = Date.now() - (ac.clueStartedAt || (room.phaseEndsAt - room.settings.clueTimeSec * 1000));
  player.stats = player.stats || {
    correctCount: 0,
    wrongCount: 0,
    maxStreak: 0,
    currentStreak: 0,
    fastestBuzzMs: 99999,
    reactionsSent: 0,
  };
  if (buzzElapsed > 200 && buzzElapsed < player.stats.fastestBuzzMs) {
    player.stats.fastestBuzzMs = buzzElapsed;
  }
  player.stats.buzzCount = (player.stats.buzzCount || 0) + 1;

  ac.buzzedPlayerId = player.id;
  ac.buzzedGuessText = null;
  room.phase = 'clue_buzzed';
  const buzzAnswerMs = 11000;
  room.phaseEndsAt = Date.now() + buzzAnswerMs;

  ac.frozenWordCount = null;

  sendChat(room, {
    color: 'info',
    text: `${player.name} buzzed in!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'buzz' });
  hostSay(room, 'buzz', { name: player.name });
  broadcastRoomState(room);

  if (player.isBot) {
    const botProf = getBotSkillProfile(player, room, ac.row, room.settings.cluesPerCat || 5);
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'clue_buzzed' || ac.buzzedPlayerId !== player.id) return;
      const knows = Math.random() < botProf.accuracy;
      const guess = knows
        ? ac.clueObj.answer
        : FUNNY_WRONG_ANSWERS[Math.floor(Math.random() * FUNNY_WRONG_ANSWERS.length)];
      handleBuzzedAnswerSubmit(room, player, guess);
    }, botProf.answerDelayMs);
  } else {
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'clue_buzzed' || ac.buzzedPlayerId !== player.id) return;
      applyWrongBuzz(room, player, '(ran out of time)', { hostEvent: 'answer_timeout' });
    }, buzzAnswerMs);
  }
}

function applyCorrectBuzz(room, player) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  const scoreBefore = player.score;

  // Check Underdog Comeback Boost
  const otherPlayers = room.players.filter((p) => p.connected && p.id !== player.id);
  const topScore = otherPlayers.length > 0 ? Math.max(...otherPlayers.map((p) => p.score)) : 0;
  const isUnderdog = otherPlayers.length > 0 && (topScore - player.score >= 1000 || player.score <= 0);
  let underdogBonus = 0;
  if (isUnderdog) {
    underdogBonus = 200;
    sendChat(room, {
      color: 'gold',
      icon: 'rocket',
      text: `UNDERDOG BOOST! ${player.name} earned a +$200 Comeback Bonus!`,
    });
  }

  let totalPoints = ac.value + underdogBonus;

  // Game Mode Hooks
  if (room.settings.gameMode === 'survival') {
    if ((player.lives ?? 3) < 3) {
      player.lives = Math.min(3, (player.lives ?? 3) + 1);
      sendChat(room, {
        color: 'success',
        text: `❤️ ${player.name} restored a life! (${player.lives}/3 lives)`,
      });
    }
  }

  if (room.settings.gameMode === 'teams' && player.team) {
    room.teamScores[player.team] = (room.teamScores[player.team] || 0) + totalPoints;
    player.teamContribution = (player.teamContribution || 0) + totalPoints;
  }

  if (room.settings.gameMode === 'hot_potato') {
    const candidates = room.players.filter(
      (p) => p.connected && p.id !== player.id && !p.isEliminated
    );
    if (candidates.length > 0) {
      const nextP = candidates[Math.floor(Math.random() * candidates.length)];
      ac.hotPotatoHolderId = nextP.id;
      sendChat(room, {
        color: 'warn',
        text: `🥔 ${player.name} passed the Hot Potato to ${nextP.name}!`,
      });
    }
  }

  if (room.settings.gameMode === 'speed') {
    const elapsed = Date.now() - (ac.clueStartedAt || Date.now());
    if (elapsed < 3500) {
      const speedBonus = Math.round(ac.value * 0.5);
      totalPoints += speedBonus;
      sendChat(room, {
        color: 'gold',
        text: `⚡ SPEED BLITZ BONUS! ${player.name} answered in under 3.5s (+${formatCurrency(speedBonus, room)})!`,
      });
    }
  }

  if (ac.modifier === 'category_takeover') {
    const takeoverBonus = 300;
    totalPoints += takeoverBonus;
    sendChat(room, {
      color: 'gold',
      icon: 'crown',
      text: `👑 CATEGORY TAKEOVER! ${player.name} dominated the category (+${formatCurrency(takeoverBonus, room)})!`,
    });
  }

  player.score += totalPoints;
  room.pickerId = player.id;
  ac.winnerName = player.name;
  ac.lastWrongText = null;
  completeReveal(ac.reveal);

  // Handle Steal tile modifier
  let stolenVictim = null;
  if (ac.modifier === 'steal') {
    const leader = room.players
      .filter((p) => p.id !== player.id && p.connected && p.score > 0)
      .sort((a, b) => b.score - a.score)[0];
    if (leader) {
      const stolen = Math.min(200, leader.score);
      leader.score -= stolen;
      player.score += stolen;
      stolenVictim = leader;
      const isHalloween = room.settings?.gameMode === 'halloween';
      sendChat(room, {
        color: 'gold',
        icon: isHalloween ? 'ghost' : 'steal',
        text: `STEAL! ${player.name} stole ${formatCurrency(stolen, room)} from ${leader.name}!`,
      });
    }
  }

  const streakResult = recordCorrectAnswer(room, player, totalPoints);
  const delta = player.score - scoreBefore;
  ac.winnerDelta = delta;
  ac.winnerStreak = streakResult.streak;
  ac.winnerStreakBonus = streakResult.streakBonus;
  pushAward(room, {
    playerId: player.id,
    kind: 'correct',
    delta,
    base: totalPoints,
    streak: streakResult.streak,
    streakBonus: streakResult.streakBonus,
    stole: stolenVictim ? 200 : 0,
    underdog: underdogBonus,
  });
  maybeSpawnBotReaction(room, (player.stats?.currentStreak || 0) >= 3 ? 'streak' : 'correct_answer', { player });

  sendChat(room, {
    color: 'success',
    text: `${player.name} got it right! (+${formatCurrency(totalPoints, room)})${underdogBonus > 0 ? ' [Underdog Boost!]' : ''}`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'correct' });
  if (streakResult.streakBonus > 0) {
    hostSay(room, 'streak', {
      name: player.name,
      streak: streakResult.streak,
      amount: formatCurrency(streakResult.streakBonus, room),
    });
  } else {
    hostSay(room, 'correct', { name: player.name });
  }
  enterClueResultPhase(room);
}

function applyWrongBuzz(room, player, displayGuess, { hostEvent = 'wrong' } = {}) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  const scoreBefore = player.score;
  ac.attemptedIds.add(player.id);
  const isNoPenaltyModifier = ac.modifier === 'last_chance';
  const penalty = (room.settings.wrongPenalty && !isNoPenaltyModifier) ? ac.value : 0;
  player.score -= penalty;

  // Game Mode: Survival lives
  if (room.settings.gameMode === 'survival') {
    player.lives = Math.max(0, (player.lives ?? 3) - 1);
    if (player.lives <= 0) {
      player.isEliminated = true;
      sendChat(room, {
        color: 'danger',
        text: `💀 ${player.name} has lost all 3 lives and is ELIMINATED!`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'wrong' });
      const survivors = room.players.filter(
        (p) => p.connected && !p.isEliminated && (p.lives ?? 3) > 0
      );
      if (survivors.length <= 1 && room.players.filter((p) => p.connected).length > 1) {
        const lastSurvivor = survivors[0];
        sendChat(room, {
          color: 'gold',
          icon: 'crown',
          text: `👑 SOLE SURVIVOR! ${lastSurvivor ? lastSurvivor.name : 'Nobody'} is the last contestant standing!`,
        });
        scheduleRoomTimer(room, () => {
          enterGameOverPhase(room);
        }, 3000);
        return;
      }
    } else {
      sendChat(room, {
        color: 'warn',
        text: `❤️ ${player.name} lost a life! (${player.lives}/3 remaining)`,
      });
    }
  }

  if (room.settings.gameMode === 'teams' && player.team && penalty > 0) {
    room.teamScores[player.team] = (room.teamScores[player.team] || 0) - penalty;
    player.teamContribution = (player.teamContribution || 0) - penalty;
  }

  if (room.settings.gameMode === 'hot_potato') {
    const nextCandidates = room.players.filter(
      (p) => p.connected && p.id !== player.id && !ac.attemptedIds.has(p.id)
    );
    if (nextCandidates.length > 0) {
      const nextPlayer = nextCandidates[Math.floor(Math.random() * nextCandidates.length)];
      ac.hotPotatoHolderId = nextPlayer.id;
      sendChat(room, {
        color: 'warn',
        text: `🥔 The Hot Potato was tossed to ${nextPlayer.name}! Buzz or it blows!`,
      });
    }
  }

  recordWrongAnswer(player);
  maybeSpawnBotReaction(room, 'wrong_answer', { player });

  // Progressive letter hint: reveal another letter!
  revealOneLetterHint(ac);

  const penaltyText = penalty > 0 ? ` (-${formatCurrency(penalty, room)})` : '';
  ac.lastWrongText = `${player.name}: "${displayGuess}"${penaltyText}`;
  pushAward(room, {
    playerId: player.id,
    kind: hostEvent === 'answer_timeout' ? 'timeout' : 'wrong',
    delta: player.score - scoreBefore,
  });
  sendChat(room, {
    color: 'danger',
    text: `${player.name}: "${displayGuess}" — Incorrect!${penaltyText}`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'wrong' });
  hostSay(room, hostEvent, { name: player.name });

  enterBuzzerClueOpenPhase(room, room.mainTimerRemainingMs || 7000, false);
}

function handleBuzzedAnswerSubmit(room, player, rawGuess) {
  if (!room || room.terminated) return;
  if (room.phase !== 'clue_buzzed') return;
  const ac = room.activeClue;
  if (!ac || ac.buzzedPlayerId !== player.id) return;

  const guess = String(rawGuess || '').trim().slice(0, 100);
  if (!guess) return;

  // 1. Authoritative Server Check First
  const evaluation = evaluateAnswer(guess, ac.clueObj);

  // 2. Clearly Correct: Award Immediately!
  if (evaluation.status === 'correct') {
    applyCorrectBuzz(room, player);
    return;
  }

  if (evaluation.status === 'close' && !player.isBot) {
    sendPrivateChat(player, {
      color: 'warn',
      text: `"${guess}" is super close! Keep typing before your timer ends!`,
    });
  } else {
    applyWrongBuzz(room, player, guess);
  }
}

/* ---------------- Skribbl Speed-Guessing Mode ---------------- */

function getAnswerLetterIndices(answer) {
  const indices = [];
  for (let i = 0; i < answer.length; i++) {
    if (/[a-zA-Z0-9]/.test(answer[i])) indices.push(i);
  }
  return indices;
}

function renderMaskFromRevealed(answer, revealedIndices) {
  return answer
    .split('')
    .map((ch, idx) => {
      if (ch === ' ') return '   ';
      if (!/[a-zA-Z0-9]/.test(ch)) return ch;
      return revealedIndices.has(idx) ? ch : '_';
    })
    .join(' ');
}

function revealOneLetterHint(ac) {
  if (!ac || !ac.clueObj?.answer) return false;
  if (!ac.revealedLetterIndices) ac.revealedLetterIndices = new Set();
  const allIndices = getAnswerLetterIndices(ac.clueObj.answer);
  const unrevealed = allIndices.filter((i) => !ac.revealedLetterIndices.has(i));
  if (unrevealed.length > 1) {
    const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    ac.revealedLetterIndices.add(pick);
    ac.hintMask = renderMaskFromRevealed(ac.clueObj.answer, ac.revealedLetterIndices);
    return true;
  }
  return false;
}

function buildLetterMask(answer, revealRatio = 0) {
  const chars = answer.split('');
  const letterIndices = getAnswerLetterIndices(answer);
  const revealCount = Math.floor(letterIndices.length * revealRatio);
  const revealedSet = new Set(shuffle(letterIndices).slice(0, revealCount));

  return chars
    .map((ch, idx) => {
      if (ch === ' ') return '   ';
      if (!/[a-zA-Z0-9]/.test(ch)) return ch;
      return revealedSet.has(idx) ? ch : '_';
    })
    .join(' ');
}

function recordCorrectAnswer(room, player, basePoints) {
  player.stats = player.stats || {
    correctCount: 0,
    wrongCount: 0,
    maxStreak: 0,
    currentStreak: 0,
    fastestBuzzMs: 99999,
    reactionsSent: 0,
  };
  player.stats.correctCount++;
  player.stats.currentStreak++;
  if (player.stats.currentStreak > player.stats.maxStreak) {
    player.stats.maxStreak = player.stats.currentStreak;
  }

  const streak = player.stats.currentStreak;
  let bountyTotal = 0;

  // Check if someone else had a streak to claim a bounty!
  for (const other of room.players) {
    if (other.id !== player.id && other.stats && other.stats.currentStreak >= 2) {
      const bounty = other.stats.currentStreak * 150;
      player.score += bounty;
      bountyTotal += bounty;
      sendChat(room, {
        color: 'gold',
        icon: 'target',
        text: `BOUNTY CLAIMED! ${player.name} broke ${other.name}'s streak and claimed a +$${bounty} bounty!`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'victory' });
      other.stats.currentStreak = 0;
    }
  }

  // Consecutive-correct streak bonus: 3rd and every following correct answer.
  let streakBonus = 0;
  if (streak >= STREAK_BONUS_THRESHOLD) {
    streakBonus = STREAK_BONUS_AMOUNT;
    player.score += streakBonus;
    sendChat(room, {
      color: 'gold',
      icon: 'fire',
      text: `ON FIRE! ${player.name} earned a +$${streakBonus} streak bonus! (${streak} correct in a row!)`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'streak' });
  } else if (streak === 2) {
    sendChat(room, {
      color: 'gold',
      icon: 'fire',
      text: `${player.name} is heating up! (2 in a row — one more unlocks the +$${STREAK_BONUS_AMOUNT} streak bonus!)`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'streak' });
  }

  return { streak, streakBonus, bountyTotal };
}

function recordWrongAnswer(player) {
  player.stats = player.stats || {
    correctCount: 0,
    wrongCount: 0,
    maxStreak: 0,
    currentStreak: 0,
    fastestBuzzMs: 99999,
    reactionsSent: 0,
  };
  player.stats.wrongCount++;
  player.stats.currentStreak = 0;
}

const ALLOWED_REACTION_IDS = [
  'laugh',
  'rofl',
  'happy',
  'shocked',
  'confused',
  'sad',
  'celebrate',
  'facepalm',
  'angry',
  'thinking',
  'fire',
];

const LEGACY_REACTION_MAP = {
  '\u{1F602}': 'rofl',
  '\u{1F525}': 'fire',
  '\u{1F480}': 'facepalm',
  '\u{1F389}': 'celebrate',
  '\u{1F631}': 'shocked',
  '\u{1F914}': 'thinking',
  '\u{1F4A9}': 'sad',
};

function normalizeReactionId(raw) {
  const val = String(raw || '').trim().slice(0, 24);
  if (ALLOWED_REACTION_IDS.includes(val)) return val;
  if (LEGACY_REACTION_MAP[val]) return LEGACY_REACTION_MAP[val];
  return null;
}

function computeSuperlatives(room) {
  const superlatives = [];
  const players = room.players || [];
  if (players.length === 0) return superlatives;
  const isHalloween = room.settings?.gameMode === 'halloween';

  // 1. Fastest buzz
  const speedDemons = players
    .filter((p) => p.stats?.fastestBuzzMs && p.stats.fastestBuzzMs < 10000)
    .sort((a, b) => a.stats.fastestBuzzMs - b.stats.fastestBuzzMs);
  if (speedDemons.length > 0) {
    const p = speedDemons[0];
    const sec = (p.stats.fastestBuzzMs / 1000).toFixed(2);
    superlatives.push({
      badge: isHalloween ? 'ghost' : 'blitz',
      title: isHalloween ? 'Ghost Hunter' : 'Speed Demon',
      playerName: p.name,
      avatarConfig: p.avatar,
      detail: `Fastest buzz in ${sec}s!`,
    });
  }

  // 2. Highest streak
  const streakKings = players
    .filter((p) => p.stats?.maxStreak && p.stats.maxStreak >= 2)
    .sort((a, b) => b.stats.maxStreak - a.stats.maxStreak);
  if (streakKings.length > 0) {
    const p = streakKings[0];
    superlatives.push({
      badge: isHalloween ? 'pumpkin' : 'fire',
      title: isHalloween ? 'Spooky Speedster' : 'Streak King',
      playerName: p.name,
      avatarConfig: p.avatar,
      detail: `${p.stats.maxStreak} correct in a row!`,
    });
  }

  // 3. Accuracy / Brains
  const shooters = players
    .filter((p) => (p.stats?.correctCount || 0) + (p.stats?.wrongCount || 0) >= 2)
    .map((p) => {
      const total = p.stats.correctCount + p.stats.wrongCount;
      const acc = Math.round((p.stats.correctCount / total) * 100);
      return { p, acc, total };
    })
    .sort((a, b) => b.acc - a.acc);
  if (shooters.length > 0 && shooters[0].acc >= 50) {
    const s = shooters[0];
    superlatives.push({
      badge: isHalloween ? 'cauldron' : 'target',
      title: isHalloween ? 'Monster Brain' : 'Sharpshooter',
      playerName: s.p.name,
      avatarConfig: s.p.avatar,
      detail: `${s.acc}% accuracy (${s.p.stats.correctCount}/${s.total})`,
    });
  }

  // 4. Reactions / Spooky Spirit
  const partiers = players
    .filter((p) => p.stats?.reactionsSent && p.stats.reactionsSent >= 3)
    .sort((a, b) => b.stats.reactionsSent - a.stats.reactionsSent);
  if (partiers.length > 0) {
    const p = partiers[0];
    superlatives.push({
      badge: isHalloween ? 'bat' : 'celebrate',
      title: isHalloween ? 'Spooky Spirit' : 'Party Animal',
      playerName: p.name,
      avatarConfig: p.avatar,
      detail: `${p.stats.reactionsSent} reactions sent!`,
    });
  }

  // 5. Candy Collector (Halloween exclusive)
  if (isHalloween) {
    const topScorer = [...players].sort((a, b) => b.score - a.score)[0];
    if (topScorer && topScorer.score > 0) {
      superlatives.push({
        badge: 'candy',
        title: 'Candy Collector',
        playerName: topScorer.name,
        avatarConfig: topScorer.avatar,
        detail: `Hoarded ${topScorer.score.toLocaleString()} candy!`,
      });
    }
  }

  return superlatives;
}

function enterChaosAllPlayPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  room.phase = 'clue_chaos';
  const durationSec = Math.max(
    14,
    Math.min(
      22,
      Math.round((room.settings.clueTimeSec || 18) * 0.85) + (ac.row >= 4 ? 2 : 0)
    )
  );
  const durationMs = durationSec * 1000;
  room.phaseEndsAt = Date.now() + durationMs;
  ac.chaosSolvedList = [];
  ac.chaosSubmissions = {};
  ac.attemptedIds = new Set();
  ac.revealedLetterIndices = new Set();
  ac.hintMask = renderMaskFromRevealed(ac.clueObj.answer, ac.revealedLetterIndices);
  ac.reveal = buildRevealPlan(ac.clueObj.clue, durationMs);

  sendChat(room, {
    color: 'danger',
    icon: 'chaos',
    text: `CHAOS ALL-PLAY! No buzzer — EVERYONE answers simultaneously for ${durationSec} seconds!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'chaos' });
  hostSay(room, 'chaos');
  broadcastRoomState(room);

  // Progressive letter hint at 50% time
  scheduleRoomTimer(room, () => {
    if (room.phase !== 'clue_chaos') return;
    if (revealOneLetterHint(ac)) {
      broadcastRoomEvent(room, { type: 'sfx', sound: 'hint' });
      broadcastRoomState(room);
    }
  }, durationMs * 0.5);

  // Bots in chaos all-play submit independently
  for (const bot of room.players.filter((p) => p.isBot && p.connected)) {
    const botProf = getBotSkillProfile(bot, room, ac.row, room.settings.cluesPerCat || 5);
    const knows = Math.random() < botProf.accuracy;
    const delay = Math.max(1200, Math.min(durationMs - 800, botProf.reactionMs + botProf.answerDelayMs * 0.6));
    scheduleRoomTimer(room, () => {
      if (room.phase === 'clue_chaos') {
        const botAnswer = knows
          ? ac.clueObj.answer
          : FUNNY_WRONG_ANSWERS[Math.floor(Math.random() * FUNNY_WRONG_ANSWERS.length)];
        handleChaosAnswer(room, bot, botAnswer);
      }
    }, delay);
  }

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'clue_chaos') return;
    resolveChaosRound(room);
  }, durationMs);
}

function handleChaosAnswer(room, player, text) {
  if (!room || room.terminated || room.phase !== 'clue_chaos') return;
  const ac = room.activeClue;
  if (!ac) return;
  ac.chaosSubmissions = ac.chaosSubmissions || {};
  if (ac.chaosSubmissions[player.id]) return; // Player already locked in their answer!

  const answerText = String(text || '').trim();
  if (!answerText) return;

  const result = evaluateAnswer(answerText, ac.clueObj);
  if (result.status === 'correct') {
    const scoreBefore = player.score;
    const order = ac.chaosSolvedList.length;
    // 1st solver gets full value; subsequent solvers get 50%
    const basePts = order === 0 ? ac.value : Math.round(ac.value * 0.5);

    // Underdog boost check
    const others = room.players.filter((p) => p.connected && p.id !== player.id);
    const topScore = others.length > 0 ? Math.max(...others.map((p) => p.score)) : 0;
    const isUnderdog = others.length > 0 && (topScore - player.score >= 1000 || player.score <= 0);
    const bonus = isUnderdog ? 200 : 0;
    const points = basePts + bonus;

    player.score += points;
    ac.chaosSolvedList.push({ playerId: player.id, name: player.name, points, order });
    ac.chaosSubmissions[player.id] = { text: answerText, correct: true, points, order };

    if (order === 0) {
      ac.winnerName = player.name;
      ac.winnerDelta = points;
      room.pickerId = player.id;
    }
    const streakResult = recordCorrectAnswer(room, player, points);
    if (order === 0) {
      ac.winnerDelta = player.score - scoreBefore;
      ac.winnerStreak = streakResult.streak;
      ac.winnerStreakBonus = streakResult.streakBonus;
    }
    pushAward(room, {
      playerId: player.id,
      kind: 'correct',
      delta: player.score - scoreBefore,
      base: points,
      streak: streakResult.streak,
      streakBonus: streakResult.streakBonus,
    });
    if (order === 0) {
      maybeSpawnBotReaction(room, (player.stats?.currentStreak || 0) >= 3 ? 'streak' : 'correct_answer', { player });
    }

    const rankSuffix = order === 0 ? '1st' : order === 1 ? '2nd' : `${order + 1}th`;
    sendPrivateChat(player, {
      color: 'success',
      icon: 'correct',
      text: `Correct! Locked in "${answerText}" (+${formatCurrency(points, room)})!`,
    });
    sendChat(room, {
      color: 'success',
      icon: room.settings?.gameMode === 'halloween' ? 'cauldron' : 'chaos',
      text: `${player.name} solved it! [${rankSuffix}] (+${formatCurrency(points, room)})${bonus > 0 ? ' (Underdog Boost!)' : ''}`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'correct' });
  } else {
    ac.chaosSubmissions[player.id] = { text: answerText, correct: false, points: 0 };
    recordWrongAnswer(player);
    pushAward(room, { playerId: player.id, kind: 'wrong', delta: 0 });
    sendPrivateChat(player, {
      color: 'danger',
      icon: 'wrong',
      text: `"${answerText}" is incorrect. Answer locked in!`,
    });
    // Send feedback SFX only to the guessing player
    if (player.ws && player.ws.readyState === 1) {
      try {
        player.ws.send(JSON.stringify({ type: 'sfx', sound: 'wrong' }));
      } catch (_) {}
    }
  }

  // Check if all connected players have submitted
  const connectedCount = room.players.filter((p) => p.connected).length;
  const submittedCount = Object.keys(ac.chaosSubmissions).length;
  if (submittedCount >= connectedCount) {
    clearRoomTimers(room);
    resolveChaosRound(room);
  } else {
    broadcastRoomState(room);
  }
}

function resolveChaosRound(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  if (!ac) return;
  completeReveal(ac.reveal);

  if (!ac.chaosSolvedList || ac.chaosSolvedList.length === 0) {
    sendChat(room, {
      color: 'warn',
      icon: 'chaos',
      text: `Time's up! Nobody solved it. The answer was: ${ac.clueObj.answer}`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'timeout' });
    hostSay(room, 'timeout');
  } else {
    const winners = ac.chaosSolvedList.map((s) => `${s.name} (+$${s.points.toLocaleString()})`).join(', ');
    sendChat(room, {
      color: 'gold',
      icon: 'chaos',
      text: `CHAOS ALL-PLAY OVER! Solvers: ${winners}`,
    });
    const topSolver = ac.chaosSolvedList[0];
    const topPlayer = room.players.find((p) => p.id === topSolver.playerId);
    if (topPlayer && (topPlayer.stats?.currentStreak || 0) >= 3) {
      hostSay(room, 'streak', {
        name: topPlayer.name,
        streak: topPlayer.stats.currentStreak,
        amount: formatCurrency(STREAK_BONUS_AMOUNT, room),
      });
    } else {
      hostSay(room, 'correct', { name: topSolver.name });
    }
  }

  enterClueResultPhase(room);
}

function enterSkribblCluePhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  room.phase = 'clue_skribbl';
  const durationMs = computeDynamicClueDurationMs(room, ac);
  room.phaseEndsAt = Date.now() + durationMs;
  ac.hintMask = buildLetterMask(ac.clueObj.answer, 0);
  ac.reveal = buildRevealPlan(ac.clueObj.clue, durationMs);

  broadcastRoomEvent(room, { type: 'sfx', sound: 'clue_reveal' });
  scheduleRoomTimer(
    room,
    () => {
      if (room.phase === 'clue_skribbl' && room.activeClue === ac) {
        hostSay(room, 'clue_open');
      }
    },
    Math.min(2600, Math.max(900, durationMs * 0.4))
  );
  broadcastRoomState(room);

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'clue_skribbl') return;
    ac.hintMask = buildLetterMask(ac.clueObj.answer, 0.28);
    broadcastRoomState(room);
  }, durationMs * 0.5);

  for (const bot of room.players.filter((p) => p.isBot && p.connected)) {
    const botProf = getBotSkillProfile(bot, room, ac.row, room.settings.cluesPerCat || 5);
    const knows = Math.random() < botProf.accuracy;
    if (knows) {
      const delay = Math.max(1600, Math.min(durationMs * 0.8, botProf.reactionMs * 2 + 1000));
      scheduleRoomTimer(room, () => {
        if (room.phase === 'clue_skribbl') {
          handleSkribblGuessOrChat(room, bot, ac.clueObj.answer);
        }
      }, delay);
    }
  }

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'clue_skribbl') return;
    completeReveal(ac.reveal);
    if (ac.solvedIds.size === 0) {
      sendChat(room, {
        color: 'warn',
        text: `Time's up! The answer was: ${ac.clueObj.answer}`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'timeout' });
      hostSay(room, 'timeout');
    }
    enterClueResultPhase(room);
  }, durationMs);
}

function handleSkribblGuessOrChat(room, player, text) {
  if (!room || room.terminated) return false;
  const ac = room.activeClue;
  if (!ac || room.phase !== 'clue_skribbl') return false;

  if (ac.solvedIds.has(player.id)) {
    sendPrivateChat(player, {
      color: 'success',
      text: `You already solved this clue! (Chat hidden from unsolved players)`,
    });
    return true;
  }

  const evaluation = evaluateAnswer(text, ac.clueObj);
  if (evaluation.status === 'correct') {
    const scoreBefore = player.score;
    const order = ac.solvedIds.size;
    const scale = order === 0 ? 1.0 : order === 1 ? 0.75 : order === 2 ? 0.6 : 0.5;
    const points = Math.round((ac.value * scale) / 50) * 50;
    ac.solvedIds.add(player.id);
    player.score += points;

    let streakResult = { streak: player.stats?.currentStreak || 0, streakBonus: 0 };
    if (order === 0) {
      room.pickerId = player.id;
      ac.winnerName = player.name;
      streakResult = recordCorrectAnswer(room, player, points);
      ac.winnerDelta = player.score - scoreBefore;
      ac.winnerStreak = streakResult.streak;
      ac.winnerStreakBonus = streakResult.streakBonus;
      maybeSpawnBotReaction(room, (player.stats?.currentStreak || 0) >= 3 ? 'streak' : 'correct_answer', { player });
      if (streakResult.streakBonus > 0) {
        hostSay(room, 'streak', {
          name: player.name,
          streak: streakResult.streak,
          amount: formatCurrency(streakResult.streakBonus, room),
        });
      } else {
        hostSay(room, 'correct', { name: player.name });
      }
    }
    pushAward(room, {
      playerId: player.id,
      kind: 'correct',
      delta: player.score - scoreBefore,
      base: points,
      streak: player.stats?.currentStreak || 0,
      streakBonus: order === 0 ? streakResult.streakBonus : 0,
    });

    sendChat(room, {
      color: 'success',
      text: `${player.name} guessed the answer! (+${formatCurrency(points, room)})`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'correct' });
    broadcastRoomState(room);

    const activePlayers = room.players.filter((p) => p.connected);
    if (ac.solvedIds.size >= activePlayers.length) {
      enterClueResultPhase(room);
    }
    return true;
  }

  if (evaluation.status === 'close' && !player.isBot) {
    sendPrivateChat(player, {
      color: 'warn',
      text: `"${text}" is close!`,
    });
    return true;
  }

  return false;
}

/* ---------------- Clue Result Transition ---------------- */

function enterClueResultPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.phase = 'clue_result';
  if (room.activeClue) completeReveal(room.activeClue.reveal);
  const resultMs = 3800;
  room.phaseEndsAt = Date.now() + resultMs;
  broadcastRoomState(room);

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'clue_result') return;
    enterBoardPhase(room);
  }, resultMs);
}

/* ---------------- Final Jeopardy & Game Over ---------------- */

function getFinalMaxWager(room, playerId) {
  const p = room.players.find((x) => x.id === playerId);
  if (!p) return 500;
  return Math.max(p.score, 500);
}

function pickFallbackFinalClue(room) {
  room.recentFinalKeys = room.recentFinalKeys || new Set();
  const pool = room.settings?.gameMode === 'halloween' ? HALLOWEEN_FINAL_POOL : FINAL_JEOPARDY_POOL;
  let availableFinal = pool.filter((f) => !room.recentFinalKeys.has(f.clue));
  if (availableFinal.length === 0) {
    room.recentFinalKeys.clear();
    availableFinal = pool;
  }
  return availableFinal[Math.floor(Math.random() * availableFinal.length)] || pool[0];
}

/**
 * FINAL JEOPARDY WHEEL — the server picks the category from the categories the
 * room actually played, then builds everything the clients need to spin the
 * identical wheel in sync.
 */
function enterFinalWheelPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.recentFinalKeys = room.recentFinalKeys || new Set();

  const allCats = getAllCategoriesForRoom(room);
  const fallbackPool =
    room.settings?.gameMode === 'halloween' ? HALLOWEEN_FINAL_POOL : FINAL_JEOPARDY_POOL;
  const wheelResult = selectFinalWheel(room, allCats, fallbackPool);
  const wheel = wheelResult.wheel;

  room.finalState = {
    clueObj: wheelResult.clueObj,
    wagers: {},
    answers: {},
    results: null,
    wheel,
    reveal: null,
  };
  if (wheelResult.clueObj.clue) room.recentFinalKeys.add(wheelResult.clueObj.clue);
  room.activeClue = null;
  room.phase = 'final_wheel';
  const endAt = wheel.revealedAt + 1800;
  room.phaseEndsAt = endAt;

  const isHalloween = room.settings?.gameMode === 'halloween';
  const finalTitle = isHalloween ? 'FINAL HALLOWEEN MAYHEM' : 'FINAL JEOPARTY';
  sendChat(room, {
    color: 'gold',
    icon: isHalloween ? 'pumpkin' : 'daily_double',
    text: `${finalTitle}! The category wheel is spinning...`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: isHalloween ? 'halloween_final' : 'daily_double' });
  hostSay(room, 'final_intro');
  broadcastRoomState(room);

  // Mid-spin narration (not a result — just showmanship).
  scheduleRoomTimer(room, () => {
    if (room.phase !== 'final_wheel') return;
    hostSay(room, 'final_spin');
  }, 1500);

  // Wheel lands — server announces the category it already chose.
  scheduleRoomTimer(room, () => {
    if (room.phase !== 'final_wheel') return;
    broadcastRoomEvent(room, { type: 'sfx', sound: 'wheel_stop' });
    hostSay(room, 'final_category', { category: wheel.wheelCategory });
    broadcastRoomState(room);
  }, Math.max(200, wheel.revealedAt - Date.now() + 80));

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'final_wheel') return;
    enterFinalWagerPhase(room);
  }, Math.max(600, endAt - Date.now()));
}

function enterFinalWagerPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.recentFinalKeys = room.recentFinalKeys || new Set();

  let finalClue = room.finalState?.clueObj || null;
  if (!finalClue) {
    finalClue = pickFallbackFinalClue(room);
    room.finalState = {
      clueObj: finalClue,
      wagers: {},
      answers: {},
      results: null,
      wheel: room.finalState?.wheel || null,
      reveal: null,
    };
  } else {
    room.finalState.wagers = {};
    room.finalState.answers = {};
    room.finalState.results = null;
    room.finalState.reveal = null;
  }
  if (finalClue.clue) room.recentFinalKeys.add(finalClue.clue);

  room.activeClue = null;
  room.phase = 'final_wager';
  const wagerMs = 22000;
  room.phaseEndsAt = Date.now() + wagerMs;

  const isHalloween = room.settings?.gameMode === 'halloween';
  const finalTitle = isHalloween ? 'FINAL HALLOWEEN MAYHEM' : 'FINAL JEOPARTY';
  const wagerUnit = isHalloween ? 'candy wagers' : 'wagers';
  sendChat(room, {
    color: 'gold',
    icon: isHalloween ? 'pumpkin' : 'daily_double',
    text: `${finalTitle}! Category: "${finalClue.category}" — Lock in your secret ${wagerUnit}!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: isHalloween ? 'halloween_final' : 'daily_double' });
  hostSay(room, 'final_wager');
  broadcastRoomState(room);

  for (const bot of room.players.filter((p) => p.isBot)) {
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'final_wager') return;
      const botProf = getBotSkillProfile(bot, room, 4, 5);
      const maxW = getFinalMaxWager(room, bot.id);
      room.finalState.wagers[bot.id] = Math.max(
        0,
        Math.min(maxW, Math.round((maxW * (botProf.wagerAggressiveness * (0.8 + Math.random() * 0.4))) / 50) * 50)
      );
      checkAllFinalWagersLocked(room);
    }, 1200 + Math.random() * 2000);
  }

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'final_wager') return;
    for (const p of room.players) {
      if (typeof room.finalState.wagers[p.id] !== 'number') {
        room.finalState.wagers[p.id] = 0;
      }
    }
    enterFinalCluePhase(room);
  }, wagerMs);
}

function checkAllFinalWagersLocked(room) {
  if (!room || room.terminated) return;
  if (room.phase !== 'final_wager') return;
  const connected = room.players.filter((p) => p.connected);
  if (connected.length === 0) return;
  const allLocked = connected.every(
    (p) => typeof room.finalState.wagers[p.id] === 'number'
  );
  broadcastRoomState(room);
  if (allLocked) {
    enterFinalCluePhase(room);
  }
}

function enterFinalCluePhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.phase = 'final_clue';
  const clueMs = 30000;
  room.phaseEndsAt = Date.now() + clueMs;
  if (room.finalState) {
    room.finalState.reveal = buildRevealPlan(room.finalState.clueObj.clue, clueMs);
  }

  sendChat(room, {
    color: 'gold',
    text: `Final Clue revealed! You have 30 seconds to lock in your final answer!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'final_think' });
  hostSay(room, 'final_clue');
  broadcastRoomState(room);

  for (const bot of room.players.filter((p) => p.isBot)) {
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'final_clue') return;
      const botProf = getBotSkillProfile(bot, room, 4, 5);
      const knows = Math.random() < botProf.accuracy;
      room.finalState.answers[bot.id] = knows
        ? room.finalState.clueObj.answer
        : FUNNY_WRONG_ANSWERS[Math.floor(Math.random() * FUNNY_WRONG_ANSWERS.length)];
      checkAllFinalAnswersLocked(room);
    }, 2800 + Math.random() * 4500);
  }

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'final_clue') return;
    finalizeFinalJeopardyAndEnd(room);
  }, clueMs);
}

function checkAllFinalAnswersLocked(room) {
  if (!room || room.terminated) return;
  if (room.phase !== 'final_clue') return;
  const connected = room.players.filter((p) => p.connected);
  if (connected.length === 0) return;
  const allLocked = connected.every(
    (p) => typeof room.finalState.answers[p.id] === 'string'
  );
  broadcastRoomState(room);
  if (allLocked) {
    finalizeFinalJeopardyAndEnd(room);
  }
}

function finalizeFinalJeopardyAndEnd(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const fsState = room.finalState;
  const results = [];
  completeReveal(fsState.reveal);

  for (const p of room.players) {
    const wager = Number(fsState.wagers[p.id]) || 0;
    const ans = String(fsState.answers[p.id] || '').trim();
    const evalRes = evaluateAnswer(ans, fsState.clueObj);
    const correct = evalRes.status === 'correct';
    const delta = correct ? wager : -wager;
    p.score += delta;

    results.push({
      playerId: p.id,
      name: p.name,
      answer: ans || '(no answer)',
      wager,
      correct,
      delta,
      finalScore: p.score,
      avatar: p.avatar,
    });
    pushAward(room, {
      playerId: p.id,
      kind: 'final',
      delta,
      correct,
      wager,
    });
  }

  fsState.results = results;
  hostSay(room, 'final_reveal');
  enterGameOverPhase(room);
}

function enterGameOverPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.phase = 'game_over';
  room.phaseEndsAt = 0;
  room.superlatives = computeSuperlatives(room);

  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const isHalloween = room.settings?.gameMode === 'halloween';
  const winner = sorted[0];
  const isTie = sorted.length > 1 && sorted[0] && sorted[1] && sorted[0].score === sorted[1].score;
  if (winner) {
    sendChat(room, {
      color: 'gold',
      icon: isHalloween ? 'pumpkin' : 'celebrate',
      text: `GAME OVER! ${winner.name} wins with ${formatCurrency(winner.score, room)}!`,
    });
  }
  if (room.settings.gameMode === 'teams') {
    const teams = ['red', 'blue', 'green', 'yellow'];
    const sortedTeams = teams
      .map((t) => ({ team: t, score: room.teamScores[t] || 0 }))
      .sort((a, b) => b.score - a.score);
    const topTeam = sortedTeams[0];
    const topMember = room.players
      .filter((p) => p.team === topTeam.team)
      .sort((a, b) => (b.teamContribution || b.score) - (a.teamContribution || a.score))[0];
    sendChat(room, {
      color: 'gold',
      icon: 'trophy',
      text: `🏆 ${topTeam.team.toUpperCase()} TEAM WINS WITH ${formatCurrency(topTeam.score, room)}! Team MVP: ${topMember?.name || 'Everyone'}!`,
    });
  }
  broadcastRoomEvent(room, { type: 'sfx', sound: isHalloween ? 'halloween_victory' : 'victory' });
  broadcastRoomState(room);
  maybeSpawnBotReaction(room, 'game_over', { winner });

  // Let the final-reveal line land before the champion announcement.
  const announceWinner = () => {
    if (isTie) {
      hostSay(room, 'tie');
    } else if (winner) {
      hostSay(room, 'winner', {
        name: winner.name,
        amount: formatCurrency(winner.score, room),
      });
    }
  };
  if (Array.isArray(room.finalState?.results) && room.finalState.results.length > 0) {
    scheduleRoomTimer(room, announceWinner, 2600);
  } else {
    announceWinner();
  }
}

function getAvailablePublicRooms() {
  const result = [];
  for (const r of rooms.values()) {
    if (r.isPrivate || r.terminated || r.phase !== 'lobby') continue;
    const connected = r.players.filter((p) => p.connected);
    if (connected.length >= MAX_ROOM_PLAYERS) continue;
    const host = r.players.find((p) => p.id === r.hostId);
    result.push({
      code: r.code,
      roomId: r.roomId,
      hostName: host ? host.name : 'Host',
      playerCount: connected.length,
      humanCount: r.players.filter((p) => !p.isBot && p.connected).length,
      maxPlayers: MAX_ROOM_PLAYERS,
      phase: r.phase,
      gameMode: r.settings.gameMode || 'standard',
      status: 'Waiting in Lobby',
      categoryCount: r.settings.includedCategoryIds ? r.settings.includedCategoryIds.length : 5,
      createdAt: r.createdAt || Date.now(),
    });
  }
  return result;
}

/* =========================================================================
   HTTP SERVER & WEBSOCKET HANDLERS
   ========================================================================= */

const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/ice-servers' && req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ iceServers: getIceServers() }));
    return;
  }

  if (pathname === '/api/categories' && req.method === 'GET') {
    const meta = BUILTIN_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.id,
      group: c.group,
      blurb: c.blurb,
      sampleClue: c.clues[0]?.clue || '',
    }));
    const halloweenMeta = HALLOWEEN_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.id,
      group: c.group,
      blurb: c.blurb,
      sampleClue: c.clues[0]?.clue || '',
    }));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ categories: meta, halloweenCategories: halloweenMeta }));
    return;
  }

  if (pathname === '/api/public-rooms' && req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ rooms: getAvailablePublicRooms() }));
    return;
  }

  if (pathname === '/api/server-info' && req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        port: PORT,
        lanUrls: getLanUrls(PORT),
        publicUrl: process.env.PUBLIC_URL || null,
        environment: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production',
        activeRooms: rooms.size,
        terminatedRooms: terminatedRooms.size,
        hostReconnectGraceMs: HOST_RECONNECT_GRACE_MS,
      })
    );
    return;
  }

  let relPath = pathname === '/' ? '/index.html' : pathname;
  relPath = decodeURIComponent(relPath);
  const safePath = path.normalize(path.join(PUBLIC_DIR, relPath));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(safePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, indexBuf) => {
          if (e2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexBuf);
        });
        return;
      }
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  });
});

attachWebSocketServer(server, (ws) => {
  let currentRoom = null;
  let currentPlayer = null;

  function clearConnectionRoomRef(expectedRoom) {
    if (!expectedRoom || currentRoom === expectedRoom) {
      currentRoom = null;
      currentPlayer = null;
    }
  }

  function advanceGameIfBlockedByDepartedNonHost(room, departedId) {
    if (!room || room.terminated) return;
    if (room.phase === 'board' && room.pickerId === departedId) {
      const nextPicker =
        room.players.find((p) => p.connected) || room.players[0];
      room.pickerId = nextPicker ? nextPicker.id : room.hostId;
    } else if (
      room.phase === 'clue_buzzed' &&
      room.activeClue?.buzzedPlayerId === departedId
    ) {
      room.activeClue.attemptedIds.add(departedId);
      enterBuzzerClueOpenPhase(
        room,
        room.mainTimerRemainingMs || 7000,
        false
      );
      return;
    } else if (
      (room.phase === 'daily_double_wager' ||
        room.phase === 'daily_double_answer') &&
      room.pickerId === departedId
    ) {
      enterClueResultPhase(room);
      return;
    } else if (room.phase === 'final_wager') {
      checkAllFinalWagersLocked(room);
      return;
    } else if (room.phase === 'final_clue') {
      checkAllFinalAnswersLocked(room);
      return;
    }
    broadcastRoomState(room);
  }

  /**
   * Intentional departure (clicking Leave, returning to Main Menu, or creating/joining a new room).
   * - If the departing player is the room host, the room and active match terminate immediately for everyone.
   * - If the departing player is a non-host guest, only that guest leaves cleanly.
   */
  function leaveCurrentRoomIntentionally() {
    if (!currentRoom || !currentPlayer) return null;
    const room = currentRoom;
    const player = currentPlayer;
    currentRoom = null;
    currentPlayer = null;

    player.connected = false;
    player.ws = null;
    player.clearConnectionRoomRef = null;
    handleVoiceLeave(room, player);

    if (room.terminated) {
      return { code: room.code, roomId: room.roomId };
    }

    if (room.hostId === player.id) {
      const nextHuman = room.players.find(
        (p) => !p.isBot && p.connected && p.id !== player.id
      );
      if (nextHuman) {
        room.players = room.players.filter((p) => p.id !== player.id);
        room.hostId = nextHuman.id;
        clearHostDisconnectTimer(room);
        sendChat(room, {
          color: 'leave',
          text: `${player.name} (Host) left the room. Host privileges transferred to ${nextHuman.name}!`,
        });
        if (room.phase === 'lobby') {
          syncAutoScaledSettingsForLobby(room);
        }
        advanceGameIfBlockedByDepartedNonHost(room, player.id);
        broadcastRoomEvent(room, {
          type: 'host_transferred',
          previousHostId: player.id,
          newHostId: nextHuman.id,
          newHostName: nextHuman.name,
        });
        broadcastRoomState(room);
        return { code: room.code, roomId: room.roomId, terminated: false };
      }
      const reason =
        room.phase === 'lobby'
          ? 'The host closed the room.'
          : 'The host left the game, so this match has ended.';
      terminateRoom(room, reason, { excludePlayerId: player.id });
      return { code: room.code, roomId: room.roomId, terminated: true };
    }

    // Non-host intentional leave: remove player and invalidate their old room token
    room.players = room.players.filter((p) => p.id !== player.id);
    if (room.phase === 'lobby') {
      syncAutoScaledSettingsForLobby(room);
    }
    sendChat(room, {
      color: 'leave',
      text: `${player.name} left the room.`,
    });
    advanceGameIfBlockedByDepartedNonHost(room, player.id);
    return { code: room.code, roomId: room.roomId, terminated: false };
  }

  /**
   * Unexpected socket disconnect (network drop, tab close, browser crash).
   * - Preserves temporary reconnection for both host and guests.
   * - If the host disconnects unexpectedly, starts a configurable grace timer
   *   (HOST_RECONNECT_GRACE_MS); if the host does not reconnect in time, the
   *   match terminates cleanly and remaining players are notified.
   */
  function handleUnexpectedDisconnect() {
    if (!currentRoom || !currentPlayer) return;
    const room = currentRoom;
    const player = currentPlayer;
    handleVoiceLeave(room, player);
    currentRoom = null;
    currentPlayer = null;

    player.connected = false;
    player.ws = null;
    player.clearConnectionRoomRef = null;

    if (room.terminated || !rooms.has(room.code)) return;

    if (room.hostId === player.id) {
      clearHostDisconnectTimer(room);
      room.hostDisconnectedAt = Date.now();
      const graceSecs = Math.max(1, Math.round(HOST_RECONNECT_GRACE_MS / 1000));
      const expectedRoomId = room.roomId;
      room.hostDisconnectTimer = setTimeout(() => {
        room.hostDisconnectTimer = null;
        if (
          room.terminated ||
          rooms.get(room.code) !== room ||
          room.roomId !== expectedRoomId
        ) {
          return;
        }
        const hostPlayer = room.players.find((p) => p.id === room.hostId);
        if (!hostPlayer || !hostPlayer.connected) {
          const nextHuman = room.players.find(
            (p) => !p.isBot && p.connected && p.id !== room.hostId
          );
          if (nextHuman) {
            room.hostId = nextHuman.id;
            clearHostDisconnectTimer(room);
            sendChat(room, {
              color: 'gold',
              icon: 'crown',
              text: `Host did not reconnect. Host privileges automatically transferred to ${nextHuman.name}!`,
            });
            broadcastRoomEvent(room, {
              type: 'host_transferred',
              previousHostId: hostPlayer ? hostPlayer.id : null,
              newHostId: nextHuman.id,
              newHostName: nextHuman.name,
            });
            if (room.phase === 'lobby') {
              syncAutoScaledSettingsForLobby(room);
            }
            broadcastRoomState(room);
          } else {
            terminateRoom(
              room,
              'The host disconnected and did not return, so this match has ended.'
            );
          }
        }
      }, HOST_RECONNECT_GRACE_MS);

      sendChat(room, {
        color: 'warn',
        text: `Host ${player.name} disconnected — waiting ${graceSecs}s to reconnect...`,
      });
      if (room.phase === 'lobby') {
        syncAutoScaledSettingsForLobby(room);
      }
      broadcastRoomState(room);
      return;
    }

    // Non-host temporary disconnect: keep player record & token for reconnect
    if (room.phase === 'lobby') {
      syncAutoScaledSettingsForLobby(room);
    }
    sendChat(room, {
      color: 'warn',
      text: `${player.name} disconnected.`,
    });
    if (room.phase === 'final_wager') {
      checkAllFinalWagersLocked(room);
    } else if (room.phase === 'final_clue') {
      checkAllFinalAnswersLocked(room);
    } else {
      broadcastRoomState(room);
    }
  }

  /**
   * If a client explicitly reports an abandoned host room token when starting a
   * brand-new session (e.g. after a page reload during host grace period), close
   * that abandoned room immediately so remaining players aren't kept waiting.
   */
  function terminateAbandonedHostRoomIfOwned(abandonedCode, abandonedToken) {
    if (!abandonedCode || !abandonedToken) return;
    const code = String(abandonedCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const oldRoom = rooms.get(code);
    if (!oldRoom || oldRoom.terminated) return;
    const hostPlayer = oldRoom.players.find((p) => p.id === oldRoom.hostId);
    if (hostPlayer && !hostPlayer.isBot && hostPlayer.token === abandonedToken) {
      terminateRoom(
        oldRoom,
        'The host started a new session, so this match has ended.',
        { excludePlayerId: hostPlayer.id }
      );
    }
  }

  function joinRoomInstance(room, msg, { autoAddBots = false, allowTokenReconnect = true } = {}) {
    if (currentRoom) {
      leaveCurrentRoomIntentionally();
    }

    if (!room || room.terminated) {
      ws.send({
        type: 'room_terminated',
        roomCode: room ? room.code : '',
        message: 'That room is no longer active. Please create or join a new room.',
      });
      return;
    }

    const name = sanitizeName(msg.name);
    const avatar = sanitizeAvatar(msg.avatar);
    const incomingToken =
      allowTokenReconnect && typeof msg.token === 'string' && msg.token
        ? msg.token
        : '';

    let existing = incomingToken
      ? room.players.find((p) => !p.isBot && p.token === incomingToken)
      : null;

    let isReconnect = false;
    if (existing) {
      isReconnect = true;
      if (existing.ws && existing.ws !== ws && typeof existing.clearConnectionRoomRef === 'function') {
        existing.clearConnectionRoomRef(room);
      }
      existing.name = name;
      existing.avatar = avatar;
      existing.connected = true;
      existing.ws = ws;
      existing.clearConnectionRoomRef = clearConnectionRoomRef;
      currentPlayer = existing;

      if (room.hostId === existing.id) {
        clearHostDisconnectTimer(room);
      }
    } else {
      if (room.phase !== 'lobby') {
        ws.send({
          type: 'error',
          message: 'This match has already started and is in progress! You can browse other public rooms or create your own.',
        });
        return;
      }
      if (room.players.filter((p) => p.connected).length >= MAX_ROOM_PLAYERS) {
        ws.send({
          type: 'error',
          message: `That room is currently full (${MAX_ROOM_PLAYERS} players max)!`,
        });
        return;
      }
      const freshToken = randomId(12);
      currentPlayer = {
        id: 'p_' + randomId(6),
        token: freshToken,
        name,
        avatar,
        score: 0,
        connected: true,
        isBot: false,
        ws,
        clearConnectionRoomRef,
      };
      room.players.push(currentPlayer);
    }

    currentRoom = room;
    if (!room.hostId) {
      room.hostId = currentPlayer.id;
    }

    ws.send({
      type: 'joined',
      playerId: currentPlayer.id,
      token: currentPlayer.token,
      roomCode: room.code,
      roomId: room.roomId,
      gameId: room.gameId,
      reconnected: isReconnect,
    });

    sendChat(room, {
      color: 'join',
      text: isReconnect
        ? `${currentPlayer.name} reconnected!`
        : `${currentPlayer.name} joined the room!`,
    });

    if (autoAddBots && room.players.length === 1) {
      addBotToRoom(room);
      addBotToRoom(room);
    }

    if (room.phase === 'lobby') {
      syncAutoScaledSettingsForLobby(room);
    }
    broadcastRoomState(room);
  }

  ws.on('message', (msg) => {
    if (!msg || typeof msg.type !== 'string') return;

    switch (msg.type) {
      case 'get_public_rooms': {
        ws.send({
          type: 'public_rooms_list',
          rooms: getAvailablePublicRooms(),
        });
        break;
      }

      case 'quick_play': {
        terminateAbandonedHostRoomIfOwned(msg.abandonedRoomCode, msg.abandonedToken);
        if (currentRoom) leaveCurrentRoomIntentionally();

        const requestedGameMode =
          msg.gameMode === 'halloween' || msg.preferredSettings?.gameMode === 'halloween'
            ? 'halloween'
            : 'standard';

        let targetRoom = null;
        if (msg.matchExisting === true) {
          targetRoom = Array.from(rooms.values()).find(
            (r) =>
              !r.isPrivate &&
              !r.terminated &&
              r.phase === 'lobby' &&
              r.gameMode === requestedGameMode &&
              r.players.filter((p) => p.connected).length < MAX_ROOM_PLAYERS
          );
        }

        if (targetRoom) {
          joinRoomInstance(targetRoom, msg, {
            autoAddBots: false,
            allowTokenReconnect: false,
          });
        } else {
          // Always create a brand-new room & session (never rejoin a stale or mid-game room)
          const room = createRoom({
            isPrivate: false,
            gameMode: requestedGameMode,
            preferredSettings: msg.preferredSettings || null,
          });
          joinRoomInstance(room, msg, {
            autoAddBots: true,
            allowTokenReconnect: false,
          });
        }
        break;
      }

      case 'create_public': {
        terminateAbandonedHostRoomIfOwned(msg.abandonedRoomCode, msg.abandonedToken);
        if (currentRoom) leaveCurrentRoomIntentionally();
        const requestedGameMode =
          msg.gameMode === 'halloween' || msg.preferredSettings?.gameMode === 'halloween'
            ? 'halloween'
            : 'standard';
        const room = createRoom({
          isPrivate: false,
          gameMode: requestedGameMode,
          preferredSettings: msg.preferredSettings || null,
        });
        joinRoomInstance(room, msg, {
          autoAddBots: true,
          allowTokenReconnect: false,
        });
        break;
      }

      case 'create_private': {
        terminateAbandonedHostRoomIfOwned(msg.abandonedRoomCode, msg.abandonedToken);
        if (currentRoom) leaveCurrentRoomIntentionally();
        const requestedGameMode =
          msg.gameMode === 'halloween' || msg.preferredSettings?.gameMode === 'halloween'
            ? 'halloween'
            : 'standard';
        const room = createRoom({
          isPrivate: true,
          gameMode: requestedGameMode,
          preferredSettings: msg.preferredSettings || null,
        });
        joinRoomInstance(room, msg, {
          autoAddBots: false,
          allowTokenReconnect: false,
        });
        break;
      }

      case 'join_room': {
        const code = String(msg.code || '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');

        if (terminatedRooms.has(code)) {
          const tombstone = terminatedRooms.get(code);
          ws.send({
            type: 'room_terminated',
            roomCode: code,
            roomId: tombstone.roomId,
            message:
              tombstone.reason ||
              `Room "${code}" has ended because the host left. Create a new room to play!`,
          });
          return;
        }

        const room = rooms.get(code);
        if (!room || room.terminated) {
          ws.send({
            type: 'room_not_found',
            roomCode: code,
            message: `Room "${code || '?'}" wasn't found or has already closed.`,
          });
          return;
        }

        joinRoomInstance(room, msg, {
          autoAddBots: false,
          allowTokenReconnect: true,
        });
        break;
      }

      case 'leave_room': {
        const left = leaveCurrentRoomIntentionally();
        ws.send({
          type: 'left_room',
          roomCode: left ? left.code : null,
          roomId: left ? left.roomId : null,
        });
        break;
      }

      case 'update_settings': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.hostId !== currentPlayer.id) {
          ws.send({
            type: 'error',
            message: 'Only the room host can change game settings.',
          });
          return;
        }
        if (currentRoom.phase !== 'lobby') {
          ws.send({
            type: 'error',
            message: 'Settings cannot be changed while a match is in progress.',
          });
          return;
        }

        applySettingsPatch(currentRoom, msg.settings || {});
        broadcastRoomState(currentRoom);
        break;
      }

      case 'add_custom_category': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.hostId !== currentPlayer.id) return;
        if (currentRoom.phase !== 'lobby') return;

        const catRaw = msg.category || {};
        const catName = String(catRaw.name || '')
          .trim()
          .toUpperCase()
          .slice(0, 32);
        const cluesRaw = Array.isArray(catRaw.clues) ? catRaw.clues : [];
        if (!catName || cluesRaw.length < 5) {
          ws.send({
            type: 'error',
            message: 'Custom category needs a title and all 5 clues ($200–$1000)!',
          });
          return;
        }

        const formattedClues = cluesRaw
          .slice(0, 6)
          .filter((c, idx) => idx < 5 || (String(c?.clue || '').trim() && String(c?.answer || '').trim()))
          .map((c, idx) => ({
            baseValue: (idx + 1) * 200,
            clue: String(c.clue || '').trim().slice(0, 260) || 'Bonus Mystery Clue!',
            answer: String(c.answer || '').trim().slice(0, 80) || 'Mystery',
            accept: [],
          }));

        const customCat = {
          id: 'custom_' + randomId(4),
          name: catName,
          icon: 'custom',
          group: 'custom',
          blurb: `Custom category by ${currentPlayer.name}`,
          clues: formattedClues,
        };

        currentRoom.settings.customCategories.push(customCat);
        currentRoom.settings.includedCategoryIds.push(customCat.id);

        sendChat(currentRoom, {
          color: 'gold',
          text: `${currentPlayer.name} added custom category: "${catName}"!`,
        });
        broadcastRoomState(currentRoom);
        break;
      }

      case 'add_bot': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.hostId !== currentPlayer.id) return;
        addBotToRoom(currentRoom);
        break;
      }

      case 'set_bot_difficulty': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.hostId !== currentPlayer.id) {
          ws.send({
            type: 'error',
            message: 'Only the room host can change bot settings.',
          });
          return;
        }
        const validDiffs = ['easy', 'medium', 'hard', 'champion'];
        const difficulty = String(msg.difficulty || '').toLowerCase();
        if (!validDiffs.includes(difficulty)) {
          ws.send({
            type: 'error',
            message: 'Invalid difficulty. Choose Easy, Medium, Hard, or Champion.',
          });
          return;
        }
        const bot = currentRoom.players.find((p) => p.id === msg.botId && p.isBot);
        if (!bot) {
          ws.send({
            type: 'error',
            message: 'Bot player not found in this room.',
          });
          return;
        }
        bot.botDifficulty = difficulty;
        sendChat(currentRoom, {
          color: 'system',
          icon: 'gear',
          text: `Host configured ${bot.name}'s difficulty to ${difficulty.toUpperCase()}.`,
        });
        broadcastRoomState(currentRoom);
        break;
      }

      case 'remove_player': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.hostId !== currentPlayer.id) return;
        const targetId = msg.playerId;
        if (targetId === currentPlayer.id) return;

        const target = currentRoom.players.find((p) => p.id === targetId);
        if (!target) return;

        currentRoom.players = currentRoom.players.filter((p) => p.id !== targetId);
        if (!target.isBot) {
          if (typeof target.clearConnectionRoomRef === 'function') {
            target.clearConnectionRoomRef(currentRoom);
          }
          if (target.ws) {
            target.ws.send({
              type: 'kicked',
              roomCode: currentRoom.code,
              message: 'You were removed from the room by the host.',
            });
          }
          target.connected = false;
          target.ws = null;
          target.clearConnectionRoomRef = null;
        }
        if (currentRoom.phase === 'lobby') {
          syncAutoScaledSettingsForLobby(currentRoom);
        }
        sendChat(currentRoom, {
          color: 'leave',
          text: `${target.name} was removed from the room.`,
        });
        advanceGameIfBlockedByDepartedNonHost(currentRoom, target.id);
        break;
      }

      case 'transfer_host': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.hostId !== currentPlayer.id) {
          ws.send({
            type: 'error',
            message: 'Only the current host can transfer host privileges.',
          });
          return;
        }

        const targetId = msg.targetPlayerId;
        if (!targetId || targetId === currentPlayer.id) {
          ws.send({
            type: 'error',
            message: 'Please choose another connected player to become host.',
          });
          return;
        }

        const target = currentRoom.players.find((p) => p.id === targetId);
        if (!target || target.isBot) {
          ws.send({
            type: 'error',
            message: 'Host privileges can only be transferred to a real human player, not a bot.',
          });
          return;
        }

        if (!target.connected) {
          ws.send({
            type: 'error',
            message: `${target.name} has disconnected and cannot become host.`,
          });
          return;
        }

        // Perform atomic host transfer
        const prevHostName = currentPlayer.name;
        currentRoom.hostId = target.id;
        clearHostDisconnectTimer(currentRoom);

        sendChat(currentRoom, {
          color: 'gold',
          icon: 'crown',
          text: `Host privileges transferred from ${prevHostName} to ${target.name}!`,
        });
        broadcastRoomEvent(currentRoom, {
          type: 'host_transferred',
          previousHostId: currentPlayer.id,
          newHostId: target.id,
          newHostName: target.name,
        });
        broadcastRoomState(currentRoom);
        break;
      }

      case 'start_game': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.hostId !== currentPlayer.id) return;
        if (currentRoom.phase !== 'lobby' && currentRoom.phase !== 'game_over') {
          return;
        }

        const includedCount = currentRoom.settings.includedCategoryIds.length;
        if (includedCount < currentRoom.settings.boardCols) {
          ws.send({
            type: 'error',
            message: `Please select at least ${currentRoom.settings.boardCols} categories (${includedCount} selected)!`,
          });
          return;
        }
        startNewGame(currentRoom);
        break;
      }

      case 'skip_intro': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.phase !== 'intro') return;
        // Only the host can advance the whole room past the cinematic intro.
        if (currentRoom.hostId !== currentPlayer.id) {
          ws.send({
            type: 'error',
            message: 'Only the room host can skip the introduction.',
          });
          return;
        }
        finishIntro(currentRoom);
        break;
      }

      case 'back_to_lobby': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.hostId !== currentPlayer.id) return;
        clearRoomTimers(currentRoom);
        currentRoom.gameId = null;
        currentRoom.phase = 'lobby';
        currentRoom.round = 1;
        currentRoom.board = null;
        currentRoom.activeClue = null;
        currentRoom.finalState = null;
        currentRoom.introState = null;
        currentRoom.lastFeedback = null;
        currentRoom.phaseEndsAt = 0;
        currentRoom.recentAwards = [];
        currentRoom.awardSeq = 0;
        currentRoom.hostMemory = {};
        currentRoom.lastHostLine = null;
        currentRoom.hostLineSeq = 0;
        currentRoom.boardCategoryHistory = [];
        for (const p of currentRoom.players) {
          p.score = 0;
        }
        syncAutoScaledSettingsForLobby(currentRoom);
        broadcastRoomState(currentRoom);
        break;
      }

      case 'select_team': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        const validTeams = ['red', 'blue', 'green', 'yellow'];
        if (validTeams.includes(msg.team)) {
          currentPlayer.team = msg.team;
          sendChat(currentRoom, {
            color: 'info',
            text: `${currentPlayer.name} joined the ${msg.team.toUpperCase()} team!`,
          });
          broadcastRoomState(currentRoom);
        }
        break;
      }

      case 'select_tile': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handleSelectTile(
          currentRoom,
          currentPlayer,
          Number(msg.col),
          Number(msg.row)
        );
        break;
      }

      case 'submit_dd_wager': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handleSubmitDailyDoubleWager(currentRoom, currentPlayer, msg.wager);
        break;
      }

      case 'submit_dd_answer': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handleSubmitDailyDoubleAnswer(currentRoom, currentPlayer, msg.answer);
        break;
      }

      case 'buzz': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handlePlayerBuzz(currentRoom, currentPlayer);
        break;
      }

      case 'submit_answer': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.phase === 'clue_buzzed') {
          handleBuzzedAnswerSubmit(currentRoom, currentPlayer, msg.answer);
        } else if (currentRoom.phase === 'daily_double_answer') {
          handleSubmitDailyDoubleAnswer(currentRoom, currentPlayer, msg.answer);
        } else if (currentRoom.phase === 'clue_chaos') {
          handleChaosAnswer(currentRoom, currentPlayer, msg.answer);
        } else if (currentRoom.phase === 'clue_skribbl') {
          const consumed = handleSkribblGuessOrChat(
            currentRoom,
            currentPlayer,
            msg.answer
          );
          if (!consumed) {
            const chatText = String(msg.answer || '').trim().slice(0, 140);
            if (chatText) {
              sendChat(currentRoom, {
                kind: 'chat',
                color: 'chat',
                author: currentPlayer.name,
                text: chatText,
              });
            }
          }
        }
        break;
      }

      case 'submit_chaos_answer': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handleChaosAnswer(currentRoom, currentPlayer, msg.answer);
        break;
      }

      case 'reaction': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        const reactionId = normalizeReactionId(msg.reaction || msg.emoji);
        if (!reactionId) return;

        const now = Date.now();
        if (currentPlayer.lastReactionAt && now - currentPlayer.lastReactionAt < 250) {
          return;
        }
        currentPlayer.lastReactionAt = now;
        currentPlayer.stats = currentPlayer.stats || {
          correctCount: 0,
          wrongCount: 0,
          maxStreak: 0,
          currentStreak: 0,
          fastestBuzzMs: 99999,
          reactionsSent: 0,
        };
        currentPlayer.stats.reactionsSent++;

        broadcastRoomEvent(currentRoom, {
          type: 'reaction_spawn',
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          reaction: reactionId,
          emoji: reactionId,
          avatarConfig: currentPlayer.avatar,
        });
        break;
      }

      case 'next_clue': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (
          currentRoom.phase === 'clue_result' &&
          (currentPlayer.id === currentRoom.hostId ||
            currentPlayer.id === currentRoom.pickerId)
        ) {
          enterBoardPhase(currentRoom);
        }
        break;
      }

      case 'continue_intermission': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (
          currentRoom.phase === 'round_intermission' &&
          currentPlayer.id === currentRoom.hostId &&
          typeof currentRoom.intermissionCallback === 'function'
        ) {
          clearRoomTimers(currentRoom);
          const cb = currentRoom.intermissionCallback;
          currentRoom.intermissionCallback = null;
          cb();
        }
        break;
      }

      case 'submit_final_wager': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.phase !== 'final_wager' || !currentRoom.finalState) return;
        // Wagers lock permanently once submitted (no re-betting before the reveal).
        if (
          Object.prototype.hasOwnProperty.call(
            currentRoom.finalState.wagers,
            currentPlayer.id
          )
        ) {
          sendPrivateChat(currentPlayer, {
            color: 'warn',
            text: 'Your Final Jeoparty wager is already locked in!',
          });
          return;
        }
        const maxW = getFinalMaxWager(currentRoom, currentPlayer.id);
        const w = Math.max(0, Math.min(maxW, Math.floor(Number(msg.wager) || 0)));
        currentRoom.finalState.wagers[currentPlayer.id] = w;
        sendPrivateChat(currentPlayer, {
          color: 'success',
          text: `Final wager locked: $${w.toLocaleString()}!`,
        });
        checkAllFinalWagersLocked(currentRoom);
        break;
      }

      case 'submit_final_answer': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.phase !== 'final_clue' || !currentRoom.finalState) return;
        // Final answers also lock permanently.
        if (
          Object.prototype.hasOwnProperty.call(
            currentRoom.finalState.answers,
            currentPlayer.id
          )
        ) {
          sendPrivateChat(currentPlayer, {
            color: 'warn',
            text: 'Your final answer is already locked in!',
          });
          return;
        }
        const ans = String(msg.answer || '').trim().slice(0, 100);
        currentRoom.finalState.answers[currentPlayer.id] = ans;
        sendPrivateChat(currentPlayer, {
          color: 'success',
          text: `Final answer locked! Waiting for everyone else...`,
        });
        checkAllFinalAnswersLocked(currentRoom);
        break;
      }

      case 'chat': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        const text = String(msg.text || '').trim().slice(0, 160);
        if (!text) return;

        if (currentRoom.phase === 'clue_chaos') {
          handleChaosAnswer(currentRoom, currentPlayer, text);
          return;
        }

        if (currentRoom.phase === 'clue_skribbl') {
          const consumed = handleSkribblGuessOrChat(
            currentRoom,
            currentPlayer,
            text
          );
          if (consumed) return;
        }

        if (
          currentRoom.activeClue &&
          ['clue_open', 'clue_buzzed', 'daily_double_answer'].includes(
            currentRoom.phase
          )
        ) {
          if (
            currentRoom.phase === 'clue_buzzed' &&
            currentRoom.activeClue.buzzedPlayerId === currentPlayer.id
          ) {
            handleBuzzedAnswerSubmit(currentRoom, currentPlayer, text);
            return;
          }
          const spoilerCheck = evaluateAnswer(
            text,
            currentRoom.activeClue.clueObj
          );
          if (spoilerCheck.status === 'correct' || spoilerCheck.status === 'close') {
            sendPrivateChat(currentPlayer, {
              color: 'warn',
              text: `Don't spoil the answer in chat! Hit BUZZ first to claim the points!`,
            });
            return;
          }
        }

        if (
          currentRoom.phase === 'final_clue' &&
          currentRoom.finalState
        ) {
          const spoilerCheck = evaluateAnswer(
            text,
            currentRoom.finalState.clueObj
          );
          if (spoilerCheck.status === 'correct' || spoilerCheck.status === 'close') {
            sendPrivateChat(currentPlayer, {
              color: 'warn',
              text: `Submit your answer in the Final Jeoparty box instead of public chat!`,
            });
            return;
          }
        }

        sendChat(currentRoom, {
          kind: 'chat',
          color: 'chat',
          author: currentPlayer.name,
          text,
        });
        break;
      }

      case 'voice_join': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handleVoiceJoin(currentRoom, currentPlayer, msg);
        break;
      }

      case 'voice_leave': {
        if (!currentRoom || !currentPlayer) return;
        handleVoiceLeave(currentRoom, currentPlayer);
        break;
      }

      case 'voice_signal': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handleVoiceSignal(currentRoom, currentPlayer, msg);
        break;
      }

      case 'voice_status': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handleVoiceStatus(currentRoom, currentPlayer, msg);
        break;
      }

    }
  });

  ws.on('close', () => {
    handleUnexpectedDisconnect();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const lan = getLanUrls(PORT);
  console.log(`\n==================================================`);
  console.log(`  JEOPARTY.IO (MS Paint Pixel Multiplayer Jeopardy)`);
  console.log(`  PC Local:  http://localhost:${PORT}`);
  for (const url of lan) {
    console.log(`  Phone/LAN: ${url}  (open on your phone!)`);
  }
  console.log(`--------------------------------------------------`);
  console.log(`  [PHONE] TO PLAY ON YOUR PHONE:`);
  console.log(`  1. Make sure your phone is connected to the same Wi-Fi.`);
  if (lan.length > 0) {
    console.log(`  2. In your phone's browser, open: ${lan[0]}`);
  } else {
    console.log(`  2. In your phone's browser, open: http://<YOUR_PC_IP>:${PORT}`);
  }
  console.log(`  (Note: Do NOT type 'localhost' on your phone!)`);
  console.log(`==================================================\n`);
});
