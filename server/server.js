'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const { attachWebSocketServer } = require('./ws');
const { BUILTIN_CATEGORIES, FINAL_JEOPARDY_POOL } = require('./categoriesData');
const { evaluateAnswer } = require('./answerMatcher');

const PORT = Number(process.env.PORT) || 3000;
const HOST_RECONNECT_GRACE_MS = Math.max(
  1000,
  Number(process.env.HOST_RECONNECT_GRACE_MS) || 12000
);
const TOMBSTONE_TTL_MS = 30 * 60 * 1000;
const MAX_ROOM_PLAYERS = 10;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

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
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

const BOT_PROFILES = [
  { name: 'DoodleDan', avatar: { color: 3, eyes: 2, mouth: 1, hat: 1 }, skill: 0.72 },
  { name: 'QuizzyLizzy', avatar: { color: 16, eyes: 6, mouth: 12, hat: 5 }, skill: 0.78 },
  { name: 'BuzzerBob', avatar: { color: 0, eyes: 3, mouth: 5, hat: 3 }, skill: 0.64 },
  { name: 'PixelPenny', avatar: { color: 18, eyes: 11, mouth: 2, hat: 2 }, skill: 0.70 },
  { name: 'SketchySam', avatar: { color: 6, eyes: 8, mouth: 7, hat: 4 }, skill: 0.60 },
  { name: 'SleepyGus', avatar: { color: 2, eyes: 5, mouth: 9, hat: 9 }, skill: 0.55 },
];

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

function sanitizeAvatar(raw) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  return {
    color: Math.max(0, Math.min(19, Number(obj.color) || 0)),
    eyes: Math.max(0, Math.min(15, Number(obj.eyes) || 0)),
    mouth: Math.max(0, Math.min(15, Number(obj.mouth) || 0)),
    hat: Math.max(0, Math.min(10, Number(obj.hat) || 0)),
  };
}

function createDefaultSettings() {
  return {
    matchPace: 'quick', // 'quick' (5-8m, 3x3) | 'standard' (10-15m, 4x4) | 'epic' (20-25m, 5x5) | 'custom'
    botDifficulty: 'medium', // 'easy' | 'medium' | 'hard' | 'champion'
    answerMode: 'buzzer', // 'buzzer' | 'skribbl' | 'host'
    boardCols: 3, // 3 | 4 | 5 | 6 (Default 3 for fast, casual, mobile-friendly fun!)
    cluesPerCat: 3, // 3 | 4 | 5 (9 clues total in round 1)
    clueTimeSec: 15, // 12 | 15 | 20 | 30 | 45
    doubleJeopardy: false, // 1 quick round + Final Jeopardy
    dailyDoubles: true,
    finalJeopardy: true,
    wrongPenalty: false, // friendly party default: no negative score dread!
    includedCategoryIds: BUILTIN_CATEGORIES.map((c) => c.id),
    customCategories: [],
  };
}

function applySettingsPatch(room, patch) {
  if (!patch || typeof patch !== 'object') return;
  const s = room.settings;

  if (patch.matchPace) {
    s.matchPace = patch.matchPace;
    if (patch.matchPace === 'quick') {
      s.boardCols = 3;
      s.cluesPerCat = 3;
      s.clueTimeSec = 15;
      s.doubleJeopardy = false;
      s.wrongPenalty = false;
    } else if (patch.matchPace === 'standard') {
      s.boardCols = 4;
      s.cluesPerCat = 4;
      s.clueTimeSec = 20;
      s.doubleJeopardy = false;
      s.wrongPenalty = true;
    } else if (patch.matchPace === 'epic') {
      s.boardCols = 5;
      s.cluesPerCat = 5;
      s.clueTimeSec = 20;
      s.doubleJeopardy = true;
      s.wrongPenalty = true;
    }
  }

  if (['easy', 'medium', 'hard', 'champion'].includes(patch.botDifficulty)) {
    s.botDifficulty = patch.botDifficulty;
    // Room default for newly added bots — existing bots maintain their individual difficulties
  }

  if (['buzzer', 'skribbl', 'host'].includes(patch.answerMode)) {
    s.answerMode = patch.answerMode;
  }
  if ([3, 4, 5, 6].includes(Number(patch.boardCols))) {
    s.boardCols = Number(patch.boardCols);
  }
  if ([3, 4, 5].includes(Number(patch.cluesPerCat))) {
    s.cluesPerCat = Number(patch.cluesPerCat);
  }
  if ([12, 15, 20, 30, 45].includes(Number(patch.clueTimeSec))) {
    s.clueTimeSec = Number(patch.clueTimeSec);
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

function createRoom({ isPrivate, preferredSettings = null }) {
  const code = generateRoomCode();
  const room = {
    roomId: 'room_' + randomId(6),
    code,
    gameId: null,
    terminated: false,
    isPrivate: Boolean(isPrivate),
    createdAt: Date.now(),
    hostId: null,
    players: [],
    settings: createDefaultSettings(),
    phase: 'lobby', // 'lobby' | 'board' | 'daily_double_wager' | 'daily_double_answer' | 'clue_open' | 'clue_buzzed' | 'clue_skribbl' | 'clue_result' | 'final_wager' | 'final_clue' | 'game_over' | 'terminated'
    round: 1,
    pickerId: null,
    usedCategoryIds: new Set(),
    board: null,
    activeClue: null,
    finalState: null,
    lastFeedback: null,
    phaseEndsAt: 0,
    mainTimerRemainingMs: 0,
    timers: new Set(),
    hostDisconnectTimer: null,
    hostDisconnectedAt: 0,
    voiceMembers: new Map(),
  };

  if (preferredSettings && typeof preferredSettings === 'object') {
    applySettingsPatch(room, {
      ...preferredSettings,
      allowEmptyCategories: false,
    });
    if (room.settings.includedCategoryIds.length < room.settings.boardCols) {
      room.settings.includedCategoryIds = BUILTIN_CATEGORIES.map((c) => c.id);
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
  return [...BUILTIN_CATEGORIES, ...room.settings.customCategories];
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
    const revealAnswer =
      room.phase === 'clue_result' ||
      (room.settings.answerMode === 'host' &&
        room.phase === 'clue_buzzed' &&
        isHost &&
        ac.buzzedPlayerId !== viewerId);

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
      lastWrongText: ac.lastWrongText || null,
      answer: revealAnswer ? ac.clueObj.answer : null,
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
      clue: showClue ? fsState.clueObj.clue : null,
      clueText: showClue ? fsState.clueObj.clue : null,
      answer: showResults ? fsState.clueObj.answer : null,
      wagerLockedIds: Object.keys(fsState.wagers),
      answerLockedIds: Object.keys(fsState.answers),
      myMaxWager: getFinalMaxWager(room, viewerId),
      myWager: typeof myWager === 'number' ? myWager : null,
      myAnswer: typeof myAnswer === 'string' ? myAnswer : null,
      results: showResults ? fsState.results : null,
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
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      connected: p.connected,
      isBot: p.isBot,
      botDifficulty: p.isBot ? (p.botDifficulty || room.settings.botDifficulty || 'medium') : undefined,
      streak: p.stats?.currentStreak || 0,
      onFire: Boolean(p.stats?.currentStreak >= 2),
      inVoice: room.voiceMembers ? room.voiceMembers.has(p.id) : false,
      voiceMuted: room.voiceMembers?.get(p.id)?.muted ?? false,
      voiceSpeaking: room.voiceMembers?.get(p.id)?.speaking ?? false,
    })),
    board: boardView,
    activeClue: activeClueView,
    finalState: finalView,
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

function sendChat(room, { kind = 'system', color = 'info', text, author = null }) {
  if (!room || room.terminated) return;
  broadcastRoomEvent(room, {
    type: 'chat',
    message: {
      id: randomId(4),
      kind,
      color,
      author,
      text,
      ts: Date.now(),
    },
  });
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

function sendPrivateChat(player, { color = 'warn', text }) {
  if (player && !player.isBot && player.connected && player.ws) {
    player.ws.send({
      type: 'chat',
      message: {
        id: randomId(4),
        kind: 'system',
        color,
        author: null,
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
  if (room.players.length >= 10) return null;
  const usedNames = new Set(room.players.map((p) => p.name));
  const profile =
    BOT_PROFILES.find((b) => !usedNames.has(b.name)) ||
    {
      name: `Bot_${Math.floor(10 + Math.random() * 89)}`,
      avatar: {
        color: Math.floor(Math.random() * 20),
        eyes: Math.floor(Math.random() * 16),
        mouth: Math.floor(Math.random() * 16),
        hat: Math.floor(Math.random() * 11),
      },
      skill: 0.65,
    };

  const bot = {
    id: 'bot_' + randomId(5),
    token: randomId(8),
    name: profile.name,
    avatar: { ...profile.avatar },
    score: 0,
    connected: true,
    isBot: true,
    botSkill: profile.skill,
    botDifficulty: room.settings.botDifficulty || 'medium',
    ws: null,
  };
  room.players.push(bot);
  sendChat(room, {
    color: 'join',
    text: `${bot.name} (Bot) joined the room.`,
  });
  broadcastRoomState(room);
  return bot;
}

/**
 * Dynamic bot performance model tuned across Easy, Medium, Hard, and Champion.
 * Accounts for room difficulty, individual bot persona, clue row/difficulty ($200 to $1000),
 * realistic human-like reaction time windows, buzzer hesitation, and wager strategies.
 */
function getBotSkillProfile(bot, room, row = 0, totalRows = 5) {
  const difficulty = (bot?.botDifficulty || room?.settings?.botDifficulty || 'medium').toLowerCase();
  const rowRatio = totalRows > 1 ? Math.max(0, Math.min(1, row / (totalRows - 1))) : 0;

  let baseAccuracy = 0.65;
  let rowPenalty = 0.16;
  let buzzProbability = 0.68;
  let minReactionMs = 1200;
  let maxReactionMs = 3000;
  let answerDelayMinMs = 1500;
  let answerDelayMaxMs = 2800;
  let wagerAggressiveness = 0.50;

  if (difficulty === 'easy') {
    // Easy: ~35–50% accuracy, relaxed/hesitant buzzer, conservative wagers, struggles on higher value rows
    baseAccuracy = 0.44;
    rowPenalty = 0.22;
    buzzProbability = 0.46;
    minReactionMs = 1800;
    maxReactionMs = 4000;
    answerDelayMinMs = 2000;
    answerDelayMaxMs = 3800;
    wagerAggressiveness = 0.30;
  } else if (difficulty === 'medium') {
    // Medium: ~55–70% accuracy, balanced buzzer and wagers
    baseAccuracy = 0.65;
    rowPenalty = 0.16;
    buzzProbability = 0.68;
    minReactionMs = 1200;
    maxReactionMs = 3000;
    answerDelayMinMs = 1500;
    answerDelayMaxMs = 2800;
    wagerAggressiveness = 0.50;
  } else if (difficulty === 'hard') {
    // Hard: ~75–85% accuracy, fast & decisive buzzer, smart wagers
    baseAccuracy = 0.82;
    rowPenalty = 0.10;
    buzzProbability = 0.84;
    minReactionMs = 800;
    maxReactionMs = 2200;
    answerDelayMinMs = 1000;
    answerDelayMaxMs = 2200;
    wagerAggressiveness = 0.75;
  } else if (difficulty === 'champion') {
    // Champion: ~85–93% accuracy, expert timing 0.6–1.8s, aggressive wagers, sharp but beatable
    baseAccuracy = 0.92;
    rowPenalty = 0.05;
    buzzProbability = 0.94;
    minReactionMs = 600;
    maxReactionMs = 1800;
    answerDelayMinMs = 700;
    answerDelayMaxMs = 1700;
    wagerAggressiveness = 0.90;
  }

  // Individual persona variance (+/- 0.03 based on bot profile)
  const botFlavor = bot?.botSkill ? (bot.botSkill - 0.68) * 0.3 : 0;
  const effectiveAccuracy = Math.max(0.18, Math.min(0.95, baseAccuracy - (rowRatio * rowPenalty) + botFlavor));
  const effectiveBuzz = Math.max(0.20, Math.min(0.98, buzzProbability - (rowRatio * (rowPenalty * 0.5)) + botFlavor));

  const reactionMs = minReactionMs + Math.random() * (maxReactionMs - minReactionMs);
  const answerDelayMs = answerDelayMinMs + Math.random() * (answerDelayMaxMs - answerDelayMinMs);

  return {
    difficulty,
    accuracy: effectiveAccuracy,
    buzzProbability: effectiveBuzz,
    reactionMs: Math.round(reactionMs),
    answerDelayMs: Math.round(answerDelayMs),
    wagerAggressiveness,
  };
}

/* =========================================================================
   JEOPARDY GAME ENGINE
   ========================================================================= */

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

  const chosen = pool.slice(0, cols);
  room.usedClues = room.usedClues || new Set();

  const categories = chosen.map((cat, colIdx) => {
    const pickedClues = [];
    const usedInCat = new Set();
    const catClues = Array.isArray(cat.clues) ? cat.clues : [];

    for (let r = 0; r < rows; r++) {
      const targetBaseValue = (r + 1) * 200;

      // Tier 1: exact baseValue matching + NOT used recently in room
      let candidates = catClues.filter(
        (clue) =>
          clue.baseValue === targetBaseValue &&
          !room.usedClues.has(clue.clue) &&
          !usedInCat.has(clue.clue)
      );

      // Tier 2: any baseValue + NOT used recently in room
      if (candidates.length === 0) {
        candidates = catClues.filter(
          (clue) => !room.usedClues.has(clue.clue) && !usedInCat.has(clue.clue)
        );
      }

      // Tier 3: exact baseValue matching + not used in this category yet
      if (candidates.length === 0) {
        candidates = catClues.filter(
          (clue) => clue.baseValue === targetBaseValue && !usedInCat.has(clue.clue)
        );
      }

      // Tier 4: any clue from category not used in this board column yet
      if (candidates.length === 0) {
        candidates = catClues.filter((clue) => !usedInCat.has(clue.clue));
      }

      // Fallback: any clue from category
      if (candidates.length === 0) {
        candidates = catClues;
      }

      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      if (picked) {
        pickedClues.push(picked);
        usedInCat.add(picked.clue);
        room.usedClues.add(picked.clue);
      }
    }

    // Prune rolling history if it exceeds 300 clues
    if (room.usedClues.size > 300) {
      const arr = Array.from(room.usedClues);
      room.usedClues = new Set(arr.slice(arr.length - 150));
    }

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      tiles: pickedClues.map((clueObj, rowIdx) => ({
        row: rowIdx,
        col: colIdx,
        value: (rowIdx + 1) * 200 * multiplier,
        used: false,
        dailyDouble: false,
        clueObj,
      })),
    };
  });

  if (room.settings.dailyDoubles) {
    const ddCount = roundNumber === 2 && cols >= 4 ? 2 : 1;
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

  // Assign Party Wildcard Modifiers to 2-3 non-Daily-Double tiles
  const nonDDTiles = [];
  for (let c = 0; c < categories.length; c++) {
    for (let r = 0; r < categories[c].tiles.length; r++) {
      if (!categories[c].tiles[r].dailyDouble) {
        nonDDTiles.push(categories[c].tiles[r]);
      }
    }
  }
  const MODIFIERS = ['speed_blitz', 'steal', 'chaos_all_play', 'double_trouble'];
  const shuffledNonDD = shuffle(nonDDTiles);
  const modCount = Math.min(3, Math.max(2, Math.floor(nonDDTiles.length / 4)));
  for (let i = 0; i < modCount; i++) {
    shuffledNonDD[i].modifier = MODIFIERS[i % MODIFIERS.length];
  }

  return { categories };
}

function startNewGame(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);

  // Mint a brand-new game session ID and reset every piece of match state
  room.gameId = 'game_' + randomId(6);
  for (const p of room.players) {
    p.score = 0;
    p.stats = {
      correctCount: 0,
      wrongCount: 0,
      maxStreak: 0,
      currentStreak: 0,
      fastestBuzzMs: 99999,
      reactionsSent: 0,
    };
  }
  room.round = 1;
  room.usedCategoryIds = new Set();
  room.board = buildRoundBoard(room, 1, room.usedCategoryIds);
  for (const c of room.board.categories) {
    room.usedCategoryIds.add(c.id);
  }

  const activePlayers = room.players.filter((p) => p.connected);
  room.pickerId = (activePlayers[0] || room.players[0])?.id || room.hostId;
  room.activeClue = null;
  room.finalState = null;
  room.lastFeedback = null;
  room.phaseEndsAt = 0;
  room.mainTimerRemainingMs = 0;

  sendChat(room, {
    color: 'success',
    text: `New match started! Round 1 — Single Jeoparty!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'round_start' });
  enterBoardPhase(room);
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
      sendChat(room, {
        color: 'gold',
        text: `⚡ DOUBLE JEOPARTY! Point values are doubled ($400 - $2000)!`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'round_start' });
      enterBoardPhase(room);
    }, 'Double Jeoparty (Round 2)');
    return;
  }

  // Before Final Jeopardy -> Intermission break!
  if (room.settings.finalJeopardy) {
    enterIntermissionPhase(room, () => {
      enterFinalWagerPhase(room);
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
    text: `☕ Intermission! Catch your breath — ${nextTitle} starting in 12s...`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'hint' });
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

  const maxBoardVal = room.round === 2 ? 2000 : 1000;
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
  };

  if (tile.dailyDouble) {
    enterDailyDoubleWagerPhase(room, player);
    return;
  }

  // Handle Party Wildcard Modifiers
  if (modifier === 'speed_blitz') {
    room.activeClue.value = Math.round(tile.value * 1.5);
    sendChat(room, {
      color: 'gold',
      text: `⚡ SPEED BLITZ! 8s rapid buzzer with +50% bonus points ($${room.activeClue.value})!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'blitz' });
    enterBuzzerClueOpenPhase(room, 8000, true);
    return;
  }

  if (modifier === 'steal') {
    sendChat(room, {
      color: 'gold',
      text: `🦹 STEAL TILE! Correct buzz earns $${room.activeClue.value} AND steals $200 from the leader!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'steal' });
    enterBuzzerClueOpenPhase(room, room.settings.clueTimeSec * 1000, true);
    return;
  }

  if (modifier === 'double_trouble') {
    room.activeClue.value = tile.value * 2;
    sendChat(room, {
      color: 'gold',
      text: `🍀 DOUBLE TROUBLE! 2X points ($${room.activeClue.value}), but 2X penalty for incorrect guesses!`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'daily_double' });
    enterBuzzerClueOpenPhase(room, room.settings.clueTimeSec * 1000, true);
    return;
  }

  if (modifier === 'chaos_all_play') {
    enterChaosAllPlayPhase(room);
    return;
  }

  if (room.settings.answerMode === 'skribbl') {
    enterSkribblCluePhase(room);
  } else {
    enterBuzzerClueOpenPhase(room, room.settings.clueTimeSec * 1000, true);
  }
}

/* ---------------- Daily Double ---------------- */

function enterDailyDoubleWagerPhase(room, picker) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.phase = 'daily_double_wager';
  const durationMs = 18000;
  room.phaseEndsAt = Date.now() + durationMs;

  sendChat(room, {
    color: 'gold',
    text: `DAILY DOUBLE! ${picker.name} can wager up to $${room.activeClue.maxWager.toLocaleString()}!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'daily_double' });
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
  const answerMs = room.settings.clueTimeSec * 1000;
  room.phaseEndsAt = Date.now() + answerMs;

  sendChat(room, {
    color: 'gold',
    text: `${player.name} wagered $${clamped.toLocaleString()}!`,
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
      player.score -= ac.wager;
      ac.lastWrongText = `${player.name} ran out of time (-$${ac.wager.toLocaleString()})`;
      sendChat(room, {
        color: 'danger',
        text: `Time's up for ${player.name}! (-$${ac.wager.toLocaleString()})`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'wrong' });
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
  if (result.status === 'correct') {
    player.score += ac.wager;
    ac.winnerName = player.name;
    ac.winnerDelta = ac.wager;
    sendChat(room, {
      color: 'success',
      text: `${player.name} nailed the Daily Double! (+$${ac.wager.toLocaleString()})`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'correct' });
  } else {
    player.score -= ac.wager;
    ac.lastWrongText = `${player.name}: "${text}" (-$${ac.wager.toLocaleString()})`;
    sendChat(room, {
      color: 'danger',
      text: `"${text}" — Incorrect! ${player.name} loses $${ac.wager.toLocaleString()}.`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'wrong' });
  }
  enterClueResultPhase(room);
}

/* ---------------- Classic Buzzer & Host-Judge Modes ---------------- */

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
    enterClueResultPhase(room);
    return;
  }

  room.phase = 'clue_open';
  room.mainTimerRemainingMs = durationMs;
  room.phaseEndsAt = Date.now() + durationMs;

  if (isFirstOpen) {
    broadcastRoomEvent(room, { type: 'sfx', sound: 'clue_reveal' });
    if (!ac.revealedLetterIndices) ac.revealedLetterIndices = new Set();
    if (!ac.hintMask) {
      ac.hintMask = renderMaskFromRevealed(ac.clueObj.answer, ac.revealedLetterIndices);
    }
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

  for (const bot of eligible.filter((p) => p.isBot)) {
    const botProf = getBotSkillProfile(bot, room, ac.row, room.settings.cluesPerCat || 5);
    const willBuzz = Math.random() < botProf.buzzProbability;
    if (willBuzz) {
      const reactionMs = Math.max(500, Math.min(durationMs - 400, botProf.reactionMs));
      scheduleRoomTimer(room, () => {
        if (room.phase === 'clue_open') {
          handlePlayerBuzz(room, bot);
        }
      }, reactionMs);
    }
  }

  scheduleRoomTimer(room, () => {
    if (room.phase !== 'clue_open') return;
    sendChat(room, {
      color: 'warn',
      text: `Time's up! The answer was: ${ac.clueObj.answer}`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'timeout' });
    enterClueResultPhase(room);
  }, durationMs);
}

function handlePlayerBuzz(room, player) {
  if (!room || room.terminated) return;
  if (room.phase !== 'clue_open') return;
  const ac = room.activeClue;
  if (!ac || ac.attemptedIds.has(player.id)) return;

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

  triggerBotBanter(room, player, 'buzz');

  sendChat(room, {
    color: 'info',
    text: `${player.name} buzzed in!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'buzz' });
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
      if (room.settings.answerMode === 'host' && ac.buzzedGuessText) {
        return;
      }
      applyWrongBuzz(room, player, '(ran out of time)');
    }, buzzAnswerMs);
  }
}

function applyCorrectBuzz(room, player) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;

  // Check Underdog Comeback Boost
  const otherPlayers = room.players.filter((p) => p.connected && p.id !== player.id);
  const topScore = otherPlayers.length > 0 ? Math.max(...otherPlayers.map((p) => p.score)) : 0;
  const isUnderdog = otherPlayers.length > 0 && (topScore - player.score >= 1000 || player.score <= 0);
  let underdogBonus = 0;
  if (isUnderdog) {
    underdogBonus = 200;
    sendChat(room, {
      color: 'gold',
      text: `🚀 UNDERDOG BOOST! ${player.name} earned a +$200 Comeback Bonus!`,
    });
  }

  const totalPoints = ac.value + underdogBonus;
  player.score += totalPoints;
  room.pickerId = player.id;
  ac.winnerName = player.name;
  ac.winnerDelta = totalPoints;
  ac.lastWrongText = null;

  // Handle Steal tile modifier
  if (ac.modifier === 'steal') {
    const leader = room.players
      .filter((p) => p.id !== player.id && p.connected && p.score > 0)
      .sort((a, b) => b.score - a.score)[0];
    if (leader) {
      const stolen = Math.min(200, leader.score);
      leader.score -= stolen;
      player.score += stolen;
      sendChat(room, {
        color: 'gold',
        text: `🦹 STEAL! ${player.name} stole $${stolen.toLocaleString()} from ${leader.name}!`,
      });
    }
  }

  recordCorrectAnswer(room, player, totalPoints);
  if (player.isBot) {
    triggerBotBanter(room, player, 'correct');
  } else {
    const randomBot = room.players.find((p) => p.isBot && p.connected);
    if (randomBot && Math.random() < 0.25) {
      triggerBotBanter(room, randomBot, 'praise_human');
    }
  }

  sendChat(room, {
    color: 'success',
    text: `${player.name} got it right! (+$${totalPoints.toLocaleString()})${underdogBonus > 0 ? ' [Underdog Boost!]' : ''}`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'correct' });
  enterClueResultPhase(room);
}

function applyWrongBuzz(room, player, displayGuess) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  ac.attemptedIds.add(player.id);
  const penalty = room.settings.wrongPenalty ? ac.value : 0;
  player.score -= penalty;

  recordWrongAnswer(player);
  triggerBotBanter(room, player, 'wrong');

  // Progressive letter hint: reveal another letter!
  revealOneLetterHint(ac);

  const penaltyText = penalty > 0 ? ` (-$${penalty.toLocaleString()})` : '';
  ac.lastWrongText = `${player.name}: "${displayGuess}"${penaltyText}`;
  sendChat(room, {
    color: 'danger',
    text: `${player.name}: "${displayGuess}" — Incorrect!${penaltyText}`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'wrong' });

  enterBuzzerClueOpenPhase(room, room.mainTimerRemainingMs || 7000, false);
}

function handleBuzzedAnswerSubmit(room, player, rawGuess) {
  if (!room || room.terminated) return;
  if (room.phase !== 'clue_buzzed') return;
  const ac = room.activeClue;
  if (!ac || ac.buzzedPlayerId !== player.id) return;

  const guess = String(rawGuess || '').trim().slice(0, 100);
  if (!guess) return;

  if (room.settings.answerMode === 'host' && player.id !== room.hostId) {
    ac.buzzedGuessText = guess;
    clearRoomTimers(room);
    room.phaseEndsAt = Date.now() + 20000;
    sendChat(room, {
      color: 'info',
      text: `${player.name} answered: "${guess}" — waiting for Host ruling!`,
    });
    broadcastRoomState(room);
    scheduleRoomTimer(room, () => {
      if (room.phase !== 'clue_buzzed' || ac.buzzedPlayerId !== player.id) return;
      const auto = evaluateAnswer(guess, ac.clueObj);
      if (auto.status === 'correct') applyCorrectBuzz(room, player);
      else applyWrongBuzz(room, player, guess);
    }, 20000);
    return;
  }

  const evaluation = evaluateAnswer(guess, ac.clueObj);
  if (evaluation.status === 'correct') {
    applyCorrectBuzz(room, player);
  } else if (evaluation.status === 'close' && !player.isBot) {
    sendPrivateChat(player, {
      color: 'warn',
      text: `"${guess}" is super close! Keep typing before your timer ends!`,
    });
  } else {
    applyWrongBuzz(room, player, guess);
  }
}

function handleHostJudge(room, hostPlayer, ruling) {
  if (!room || room.terminated) return;
  if (room.phase !== 'clue_buzzed') return;
  if (hostPlayer.id !== room.hostId) return;
  const ac = room.activeClue;
  const buzzed = room.players.find((p) => p.id === ac?.buzzedPlayerId);
  if (!buzzed) return;

  if (ruling === 'correct') {
    applyCorrectBuzz(room, buzzed);
  } else {
    applyWrongBuzz(room, buzzed, ac.buzzedGuessText || '(host ruled incorrect)');
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

  // Check if someone else had a streak to claim a bounty!
  for (const other of room.players) {
    if (other.id !== player.id && other.stats && other.stats.currentStreak >= 2) {
      const bounty = other.stats.currentStreak * 150;
      player.score += bounty;
      sendChat(room, {
        color: 'gold',
        text: `🎯 BOUNTY CLAIMED! ${player.name} broke ${other.name}'s streak and claimed a +$${bounty} bounty!`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'victory' });
      other.stats.currentStreak = 0;
    }
  }

  // Check if this player is now on fire!
  if (player.stats.currentStreak === 2) {
    sendChat(room, {
      color: 'gold',
      text: `🔥 ${player.name} is ON FIRE! (2 in a row!)`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'streak' });
  } else if (player.stats.currentStreak >= 3) {
    const comboBonus = Math.round(basePoints * 0.25);
    player.score += comboBonus;
    sendChat(room, {
      color: 'gold',
      text: `🔥 MEGA COMBO! ${player.name} gets +$${comboBonus} streak bonus! (${player.stats.currentStreak} in a row!)`,
    });
  }
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

const BOT_REACTIONS = ['😂', '🔥', '💀', '🎉', '😱', '🤔', '💩'];

const BOT_BANTER = {
  buzz: [
    "Hold my coffee, I know this! ☕",
    "Beep boop, calculating answer... 🤖",
    "I was programmed for this moment! ⚡",
    "Too slow, humans! 💨",
    "Let a real intelligence handle this. 🧠",
    "I think I saw this on TV once! 📺",
    "Pressing buzzers is my favorite hobby!",
    "Data retrieval indexed in 0.4s! ⚡",
  ],
  correct: [
    "100% calculation accuracy! 🎯",
    "Neural networks never lie. ✨",
    "Easy points for the bot squad!",
    "That was practically in my BIOS. 💻",
    "Beginner's luck strikes again! 🥳",
    "Calculated with 99.8% confidence. 🎯",
    "Statistically expected result. ✨",
  ],
  wrong: [
    "Does not compute! 💥",
    "Who programmed that clue?! 💢",
    "I blame high network latency! 📡",
    "Error 404: Brain not found.",
    "My database was bribed! 🫠",
    "I was confident and wrong! 🙃",
    "Anomalous dataset. Recalibrating. 🤖",
    "Was that a trick question?! 🤔",
  ],
  streak: [
    "I am unstoppable! 🔥",
    "Bow down to your new pixel overlord! 👑",
    "Try to break my streak if you dare! 🏆",
  ],
  praise_human: [
    "Lightning fast buzzer speed! ⚡",
    "Respectable trivia reflexes! 👏",
    "Nice solve, didn't see that coming! ✨",
    "Good buzz, human! 🧠",
  ],
  reaction: ['😂', '🔥', '💀', '🎉', '😱', '🤔', '💩'],
};

function triggerBotBanter(room, bot, category) {
  if (!bot || !bot.isBot) return;
  if (Math.random() > 0.38) return;
  const list = BOT_BANTER[category];
  if (!list || list.length === 0) return;
  const quote = list[Math.floor(Math.random() * list.length)];
  setTimeout(() => {
    if (room && !room.terminated) {
      sendChat(room, {
        color: 'bot',
        text: `[${bot.name}]: ${quote}`,
      });
      if (Math.random() < 0.45) {
        const emoji = BOT_BANTER.reaction[Math.floor(Math.random() * BOT_BANTER.reaction.length)];
        broadcastRoomEvent(room, {
          type: 'reaction_spawn',
          playerId: bot.id,
          playerName: bot.name,
          emoji,
          avatarConfig: bot.avatar,
        });
      }
    }
  }, 400 + Math.random() * 800);
}

function computeSuperlatives(room) {
  const superlatives = [];
  const players = room.players || [];
  if (players.length === 0) return superlatives;

  // 1. Speed Demon (fastest buzz)
  const speedDemons = players
    .filter((p) => p.stats?.fastestBuzzMs && p.stats.fastestBuzzMs < 10000)
    .sort((a, b) => a.stats.fastestBuzzMs - b.stats.fastestBuzzMs);
  if (speedDemons.length > 0) {
    const p = speedDemons[0];
    const sec = (p.stats.fastestBuzzMs / 1000).toFixed(2);
    superlatives.push({
      badge: '⚡',
      title: 'Speed Demon',
      playerName: p.name,
      avatarConfig: p.avatar,
      detail: `Fastest buzz in ${sec}s!`,
    });
  }

  // 2. Hot Streak (highest streak)
  const streakKings = players
    .filter((p) => p.stats?.maxStreak && p.stats.maxStreak >= 2)
    .sort((a, b) => b.stats.maxStreak - a.stats.maxStreak);
  if (streakKings.length > 0) {
    const p = streakKings[0];
    superlatives.push({
      badge: '🔥',
      title: 'Streak King',
      playerName: p.name,
      avatarConfig: p.avatar,
      detail: `${p.stats.maxStreak} correct in a row!`,
    });
  }

  // 3. Sharpshooter (highest accuracy)
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
      badge: '🎯',
      title: 'Sharpshooter',
      playerName: s.p.name,
      avatarConfig: s.p.avatar,
      detail: `${s.acc}% accuracy (${s.p.stats.correctCount}/${s.total})`,
    });
  }

  // 4. Party Animal (most reactions)
  const partiers = players
    .filter((p) => p.stats?.reactionsSent && p.stats.reactionsSent >= 3)
    .sort((a, b) => b.stats.reactionsSent - a.stats.reactionsSent);
  if (partiers.length > 0) {
    const p = partiers[0];
    superlatives.push({
      badge: '🎉',
      title: 'Party Animal',
      playerName: p.name,
      avatarConfig: p.avatar,
      detail: `${p.stats.reactionsSent} reactions sent!`,
    });
  }

  return superlatives;
}

function enterChaosAllPlayPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  room.phase = 'clue_chaos';
  const durationMs = 14000;
  room.phaseEndsAt = Date.now() + durationMs;
  ac.chaosSolvedList = [];
  ac.chaosSubmissions = {};
  ac.attemptedIds = new Set();
  ac.revealedLetterIndices = new Set();
  ac.hintMask = renderMaskFromRevealed(ac.clueObj.answer, ac.revealedLetterIndices);

  sendChat(room, {
    color: 'danger',
    text: `💥 CHAOS ALL-PLAY! No buzzer — EVERYONE answers simultaneously for 14 seconds!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'chaos' });
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
    recordCorrectAnswer(room, player, points);

    const rankSuffix = order === 0 ? '1st' : order === 1 ? '2nd' : `${order + 1}th`;
    sendPrivateChat(player, {
      color: 'success',
      text: `✅ Correct! Locked in "${answerText}" (+$${points.toLocaleString()})!`,
    });
    sendChat(room, {
      color: 'success',
      text: `💥 ${player.name} solved it! [${rankSuffix}] (+$${points.toLocaleString()})${bonus > 0 ? ' (Underdog Boost!)' : ''}`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'correct' });
  } else {
    ac.chaosSubmissions[player.id] = { text: answerText, correct: false, points: 0 };
    recordWrongAnswer(player);
    sendPrivateChat(player, {
      color: 'danger',
      text: `❌ "${answerText}" is incorrect. Answer locked in!`,
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

  if (!ac.chaosSolvedList || ac.chaosSolvedList.length === 0) {
    sendChat(room, {
      color: 'warn',
      text: `💥 Time's up! Nobody solved it. The answer was: ${ac.clueObj.answer}`,
    });
    broadcastRoomEvent(room, { type: 'sfx', sound: 'timeout' });
  } else {
    const winners = ac.chaosSolvedList.map((s) => `${s.name} (+$${s.points.toLocaleString()})`).join(', ');
    sendChat(room, {
      color: 'gold',
      text: `💥 CHAOS ALL-PLAY OVER! Solvers: ${winners}`,
    });
  }

  enterClueResultPhase(room);
}

function enterSkribblCluePhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  const ac = room.activeClue;
  room.phase = 'clue_skribbl';
  const durationMs = room.settings.clueTimeSec * 1000;
  room.phaseEndsAt = Date.now() + durationMs;
  ac.hintMask = buildLetterMask(ac.clueObj.answer, 0);

  broadcastRoomEvent(room, { type: 'sfx', sound: 'clue_reveal' });
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
    if (ac.solvedIds.size === 0) {
      sendChat(room, {
        color: 'warn',
        text: `Time's up! The answer was: ${ac.clueObj.answer}`,
      });
      broadcastRoomEvent(room, { type: 'sfx', sound: 'timeout' });
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
    const order = ac.solvedIds.size;
    const scale = order === 0 ? 1.0 : order === 1 ? 0.75 : order === 2 ? 0.6 : 0.5;
    const points = Math.round((ac.value * scale) / 50) * 50;
    ac.solvedIds.add(player.id);
    player.score += points;

    if (order === 0) {
      room.pickerId = player.id;
      ac.winnerName = player.name;
      ac.winnerDelta = points;
    }

    sendChat(room, {
      color: 'success',
      text: `${player.name} guessed the answer! (+$${points.toLocaleString()})`,
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

function enterFinalWagerPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);

  room.usedFinalClues = room.usedFinalClues || new Set();
  const unusedFinals = FINAL_JEOPARDY_POOL.filter(
    (f) => !room.usedFinalClues.has(f.clue)
  );
  const pool = unusedFinals.length > 0 ? unusedFinals : FINAL_JEOPARDY_POOL;
  const finalClue = pool[Math.floor(Math.random() * pool.length)];
  room.usedFinalClues.add(finalClue.clue);
  if (room.usedFinalClues.size > 25) {
    room.usedFinalClues.clear();
  }

  room.finalState = {
    clueObj: finalClue,
    wagers: {},
    answers: {},
    results: null,
  };
  room.activeClue = null;
  room.phase = 'final_wager';
  const wagerMs = 22000;
  room.phaseEndsAt = Date.now() + wagerMs;

  sendChat(room, {
    color: 'gold',
    text: `FINAL JEOPARTY! Category: "${finalClue.category}" — Lock in your secret wagers!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'daily_double' });
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

  sendChat(room, {
    color: 'gold',
    text: `Final Clue revealed! You have 30 seconds to lock in your final answer!`,
  });
  broadcastRoomEvent(room, { type: 'sfx', sound: 'final_think' });
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
    });
  }

  fsState.results = results;
  enterGameOverPhase(room);
}

function enterGameOverPhase(room) {
  if (!room || room.terminated) return;
  clearRoomTimers(room);
  room.phase = 'game_over';
  room.phaseEndsAt = 0;
  room.superlatives = computeSuperlatives(room);

  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  if (winner) {
    sendChat(room, {
      color: 'gold',
      text: `GAME OVER! ${winner.name} wins with $${winner.score.toLocaleString()}!`,
    });
  }
  broadcastRoomEvent(room, { type: 'sfx', sound: 'victory' });
  broadcastRoomState(room);
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
      icon: c.icon,
      group: c.group,
      blurb: c.blurb,
      sampleClue: c.clues[0]?.clue || '',
    }));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ categories: meta }));
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
              text: `👑 Host did not reconnect. Host privileges automatically transferred to ${nextHuman.name}!`,
            });
            broadcastRoomEvent(room, {
              type: 'host_transferred',
              previousHostId: hostPlayer ? hostPlayer.id : null,
              newHostId: nextHuman.id,
              newHostName: nextHuman.name,
            });
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
      broadcastRoomState(room);
      return;
    }

    // Non-host temporary disconnect: keep player record & token for reconnect
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

        let targetRoom = null;
        if (msg.matchExisting === true) {
          targetRoom = Array.from(rooms.values()).find(
            (r) =>
              !r.isPrivate &&
              !r.terminated &&
              r.phase === 'lobby' &&
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
        const room = createRoom({
          isPrivate: false,
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
        const room = createRoom({
          isPrivate: true,
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

        const formattedClues = cluesRaw.slice(0, 5).map((c, idx) => ({
          baseValue: (idx + 1) * 200,
          clue: String(c.clue || '').trim().slice(0, 260) || 'Bonus Mystery Clue!',
          answer: String(c.answer || '').trim().slice(0, 80) || 'Mystery',
          accept: [],
        }));

        const customCat = {
          id: 'custom_' + randomId(4),
          name: catName,
          icon: '✨',
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
            message: 'Only the room host can configure bot difficulty.',
          });
          return;
        }

        const validDiffs = ['easy', 'medium', 'hard', 'champion'];
        const targetDiff = (msg.difficulty || '').toLowerCase();
        if (!validDiffs.includes(targetDiff)) {
          ws.send({
            type: 'error',
            message: 'Invalid difficulty. Choose Easy, Medium, Hard, or Champion.',
          });
          return;
        }

        const targetBot = currentRoom.players.find(
          (p) => p.id === msg.botId && p.isBot
        );
        if (!targetBot) {
          ws.send({
            type: 'error',
            message: 'Bot not found in the room.',
          });
          return;
        }

        targetBot.botDifficulty = targetDiff;
        sendChat(currentRoom, {
          color: 'gold',
          text: `⚙️ ${targetBot.name}'s difficulty changed to ${targetDiff.toUpperCase()}.`,
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
          text: `👑 Host privileges transferred from ${prevHostName} to ${target.name}!`,
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
        currentRoom.lastFeedback = null;
        currentRoom.phaseEndsAt = 0;
        for (const p of currentRoom.players) {
          p.score = 0;
        }
        broadcastRoomState(currentRoom);
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
            sendChat(currentRoom, {
              kind: 'chat',
              color: 'chat',
              author: currentPlayer.name,
              text: String(msg.answer || '').trim().slice(0, 140),
            });
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
        const emoji = String(msg.emoji || '').slice(0, 10);
        const ALLOWED_REACTIONS = ['😂', '🔥', '💀', '🎉', '😱', '🤔', '💩'];
        if (!ALLOWED_REACTIONS.includes(emoji)) return;

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
          emoji,
          avatarConfig: currentPlayer.avatar,
        });
        break;
      }

      case 'host_judge': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        handleHostJudge(currentRoom, currentPlayer, msg.ruling);
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

      case 'submit_final_wager': {
        if (!currentRoom || !currentPlayer || currentRoom.terminated) return;
        if (currentRoom.phase !== 'final_wager' || !currentRoom.finalState) return;
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
  console.log(`  📱 TO PLAY ON YOUR PHONE:`);
  console.log(`  1. Make sure your phone is connected to the same Wi-Fi.`);
  if (lan.length > 0) {
    console.log(`  2. In your phone's browser, open: ${lan[0]}`);
  } else {
    console.log(`  2. In your phone's browser, open: http://<YOUR_PC_IP>:${PORT}`);
  }
  console.log(`  (Note: Do NOT type 'localhost' on your phone!)`);
  console.log(`==================================================\n`);
});
