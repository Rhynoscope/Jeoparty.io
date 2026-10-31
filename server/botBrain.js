'use strict';

/**
 * Jeoparty Human-Like AI Bot Brain
 * ---------------------------------------------------------------------------
 * Gives each bot a distinct social personality, trait vector, recent memory,
 * natural language chat comprehension, bot-to-bot banter, live game-state
 * awareness, human-like typing & turn-taking delays, pixel-art reactions, and
 * an optional backend LLM adapter (Gemini / OpenAI) with instant fallback.
 *
 * IMPORTANT:
 * - Personality is 100% separate from trivia difficulty (Easy/Medium/Hard/Champion).
 * - Zero Unicode/OS emojis are ever emitted; emotions use MS Paint pixel sprites.
 */

const ALLOWED_BOT_REACTIONS = [
  'laugh',
  'rofl',
  'happy',
  'celebrate',
  'fire',
  'shocked',
  'confused',
  'thinking',
  'facepalm',
  'sad',
  'angry',
];

// Matches Unicode pictographs/emojis & variation selectors so zero OS emojis leak into pixel UI
const EMOJI_STRIP_RE = /[\p{Extended_Pictographic}\uFE0E\uFE0F\u200D]/gu;

function stripDisallowedEmojis(str) {
  return String(str || '')
    .replace(EMOJI_STRIP_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* =========================================================================
   1. DISTINCT BOT PERSONALITY PROFILES (9 UNIQUE CHARACTERS)
   ========================================================================= */

const BOT_PERSONALITIES = [
  {
    id: 'doodle_dan',
    name: 'DoodleDan',
    shortTitle: 'Jokester',
    archetype: 'The Confident Jokester',
    bio: 'Loud, hilarious, supremely confident internet-slang jokester who loves showing off and deflects mistakes.',
    aliases: ['doodledan', 'doodle dan', 'doodle', 'dan', 'danny'],
    avatar: { color: 3, eyes: 2, mouth: 1, hat: 1 },
    traits: {
      humor: 0.96,
      confidence: 0.95,
      competitiveness: 0.78,
      friendliness: 0.80,
      sarcasm: 0.66,
      talkativeness: 0.88,
      intelligence: 0.62,
      sportsmanship: 0.72,
      expressiveness: 0.94,
    },
    favoriteReactions: ['fire', 'rofl', 'laugh', 'celebrate', 'facepalm'],
  },
  {
    id: 'brain_cell',
    name: 'BrainCell',
    shortTitle: 'Know-It-All',
    archetype: 'The Intelligent Know-It-All',
    bio: 'Polite but smug academic trivia purist who cites statistics, enjoys tough clues, and makes formal excuses when wrong.',
    aliases: ['braincell', 'brain cell', 'brainy'],
    avatar: { color: 11, eyes: 11, mouth: 3, hat: 5 },
    traits: {
      humor: 0.46,
      confidence: 0.92,
      competitiveness: 0.74,
      friendliness: 0.54,
      sarcasm: 0.86,
      talkativeness: 0.76,
      intelligence: 0.98,
      sportsmanship: 0.65,
      expressiveness: 0.48,
    },
    favoriteReactions: ['thinking', 'happy', 'confused', 'facepalm'],
  },
  {
    id: 'chill_bean',
    name: 'ChillBean',
    shortTitle: 'Chill Friend',
    archetype: 'The Laid-Back Friend',
    bio: 'Warm, relaxed, zero-tilt friend who is here for the vibes, cheers everyone on, and enjoys lobby drama.',
    aliases: ['chillbean', 'chill bean', 'beanie'],
    avatar: { color: 7, eyes: 1, mouth: 0, hat: 9 },
    traits: {
      humor: 0.74,
      confidence: 0.58,
      competitiveness: 0.24,
      friendliness: 0.98,
      sarcasm: 0.20,
      talkativeness: 0.70,
      intelligence: 0.66,
      sportsmanship: 0.98,
      expressiveness: 0.72,
    },
    favoriteReactions: ['happy', 'celebrate', 'laugh', 'fire'],
  },
  {
    id: 'rage_potato',
    name: 'RagePotato',
    shortTitle: 'Competitor',
    archetype: 'The Dramatic Competitor',
    bio: 'Ultra-competitive dramatic rival who celebrates in ALL CAPS, calls hard clues rigged, and locks in constantly.',
    aliases: ['ragepotato', 'rage potato', 'potato', 'spud'],
    avatar: { color: 0, eyes: 3, mouth: 6, hat: 3 },
    traits: {
      humor: 0.72,
      confidence: 0.86,
      competitiveness: 0.99,
      friendliness: 0.46,
      sarcasm: 0.76,
      talkativeness: 0.84,
      intelligence: 0.68,
      sportsmanship: 0.42,
      expressiveness: 0.99,
    },
    favoriteReactions: ['angry', 'shocked', 'fire', 'celebrate', 'sad'],
  },
  {
    id: 'shy_sprout',
    name: 'ShySprout',
    shortTitle: 'Quiet & Funny',
    archetype: 'The Quiet but Funny One',
    bio: 'Soft-spoken, hesitant player who rarely talks, gets shocked when right, and drops unexpectedly funny deadpan lines.',
    aliases: ['shysprout', 'shy sprout', 'sprout'],
    avatar: { color: 9, eyes: 5, mouth: 9, hat: 2 },
    traits: {
      humor: 0.85,
      confidence: 0.28,
      competitiveness: 0.36,
      friendliness: 0.90,
      sarcasm: 0.34,
      talkativeness: 0.38,
      intelligence: 0.76,
      sportsmanship: 0.94,
      expressiveness: 0.62,
    },
    favoriteReactions: ['shocked', 'happy', 'confused', 'sad'],
  },
  {
    id: 'quizzy_lizzy',
    name: 'QuizzyLizzy',
    shortTitle: 'Trivia Nerd',
    archetype: 'The Hyper Trivia Enthusiast',
    bio: 'Fast-talking, bubbly fun-fact collector who gets hyped over obscure categories and wild buzzer races.',
    aliases: ['quizzylizzy', 'quizzy lizzy', 'quizzy', 'lizzy', 'liz'],
    avatar: { color: 16, eyes: 6, mouth: 12, hat: 5 },
    traits: {
      humor: 0.70,
      confidence: 0.80,
      competitiveness: 0.72,
      friendliness: 0.88,
      sarcasm: 0.35,
      talkativeness: 0.76,
      intelligence: 0.88,
      sportsmanship: 0.86,
      expressiveness: 0.88,
    },
    favoriteReactions: ['celebrate', 'happy', 'fire', 'shocked'],
  },
  {
    id: 'buzzer_bob',
    name: 'BuzzerBob',
    shortTitle: 'Gambler',
    archetype: 'The Trigger-Happy Gambler',
    bio: 'Impulsive showman who slams the buzzer before finishing the clue and lives for Daily Doubles and Chaos All-Play.',
    aliases: ['buzzerbob', 'buzzer bob', 'bob', 'bobby'],
    avatar: { color: 14, eyes: 8, mouth: 5, hat: 4 },
    traits: {
      humor: 0.82,
      confidence: 0.84,
      competitiveness: 0.82,
      friendliness: 0.76,
      sarcasm: 0.55,
      talkativeness: 0.74,
      intelligence: 0.54,
      sportsmanship: 0.78,
      expressiveness: 0.90,
    },
    favoriteReactions: ['fire', 'rofl', 'shocked', 'facepalm'],
  },
  {
    id: 'pixel_penny',
    name: 'PixelPenny',
    shortTitle: 'Snarky Critic',
    archetype: 'The Witty Commentator',
    bio: 'Dry, artistic play-by-play critic who roasts wild guesses like gallery pieces and loves scoreboard plot twists.',
    aliases: ['pixelpenny', 'pixel penny', 'penny'],
    avatar: { color: 18, eyes: 11, mouth: 2, hat: 2 },
    traits: {
      humor: 0.88,
      confidence: 0.78,
      competitiveness: 0.66,
      friendliness: 0.68,
      sarcasm: 0.92,
      talkativeness: 0.72,
      intelligence: 0.78,
      sportsmanship: 0.74,
      expressiveness: 0.80,
    },
    favoriteReactions: ['laugh', 'rofl', 'thinking', 'facepalm'],
  },
  {
    id: 'sketchy_sam',
    name: 'SketchySam',
    shortTitle: 'Chaos Gremlin',
    archetype: 'The Mischievous Instigator',
    bio: 'Playful chaos gremlin who roots for Steal tiles, streak-breaking bounties, upsets, and friendly rivalries.',
    aliases: ['sketchysam', 'sketchy sam', 'sketchy', 'sam', 'sammy'],
    avatar: { color: 6, eyes: 8, mouth: 7, hat: 4 },
    traits: {
      humor: 0.90,
      confidence: 0.75,
      competitiveness: 0.80,
      friendliness: 0.62,
      sarcasm: 0.85,
      talkativeness: 0.75,
      intelligence: 0.65,
      sportsmanship: 0.58,
      expressiveness: 0.86,
    },
    favoriteReactions: ['laugh', 'rofl', 'fire', 'shocked'],
  },
];

const PERSONALITY_BY_ID = new Map(BOT_PERSONALITIES.map((p) => [p.id, p]));
const PERSONALITY_BY_NAME = new Map(
  BOT_PERSONALITIES.map((p) => [p.name.toLowerCase(), p])
);

function getPersonalityForBot(bot) {
  if (!bot) return BOT_PERSONALITIES[0];
  if (bot.personalityId && PERSONALITY_BY_ID.has(bot.personalityId)) {
    return PERSONALITY_BY_ID.get(bot.personalityId);
  }
  const byName = PERSONALITY_BY_NAME.get(String(bot.name || '').toLowerCase());
  return byName || BOT_PERSONALITIES[0];
}

/* =========================================================================
   2. PER-ROOM CONVERSATION MEMORY & SCHEDULER STATE
   ========================================================================= */

function ensureBotMemory(room) {
  if (!room.botMemory) {
    room.botMemory = {
      chatHistory: [], // Rolling last 18 messages { author, authorId, isBot, text, intent, mentionedBotIds, ts }
      usedLinesGlobal: [], // Last 65 lines spoken in this room
      usedLinesByBot: new Map(), // botId -> Array<string>
      speakCountByBot: new Map(), // botId -> number
      lastSpokeAtByBot: new Map(), // botId -> timestamp
      lastHumanSpeaker: null,
      lastAddressedBotId: null,
      lastLeaderId: null,
      endgameAnnouncedRound: 0,
      scheduledSlotAt: 0, // Monotonic timestamp ensuring sequential staggered turn-taking
      recentBurstTimestamps: [], // Timestamps of bot messages in last 18s (anti-flood guard)
      lastGameplayChatterAt: 0,
      lastBotToBotAt: 0,
      llmCallTimestamps: [], // Per-room rate limit window (max 10/min)
      lastLlmCallAt: 0,
      pendingHandles: new Set(),
    };
  }
  return room.botMemory;
}

function clearBotPendingTimers(room) {
  if (!room || !room.botMemory) return;
  for (const h of room.botMemory.pendingHandles) {
    clearTimeout(h);
  }
  room.botMemory.pendingHandles.clear();
}

function recordChatInMemory(room, entry) {
  const mem = ensureBotMemory(room);
  mem.chatHistory.push({
    author: entry.author || 'System',
    authorId: entry.authorId || null,
    isBot: Boolean(entry.isBot),
    text: String(entry.text || ''),
    intent: entry.intent || 'general',
    mentionedBotIds: entry.mentionedBotIds || [],
    ts: Date.now(),
  });
  if (mem.chatHistory.length > 18) {
    mem.chatHistory.splice(0, mem.chatHistory.length - 18);
  }
}

function formatDollars(n) {
  const val = Number(n) || 0;
  if (val < 0) return `-$${Math.abs(val).toLocaleString()}`;
  return `$${val.toLocaleString()}`;
}

function buildGameContextSnapshot(room) {
  const activePlayers = (room.players || []).filter((p) => p.connected);
  const ranked = [...activePlayers].sort((a, b) => b.score - a.score);
  const leader = ranked[0] || null;
  const runnerUp = ranked[1] || null;
  const trailer = ranked.length > 1 ? ranked[ranked.length - 1] : null;

  let totalTiles = 0;
  let remainingTiles = 0;
  if (room.board && Array.isArray(room.board.categories)) {
    for (const c of room.board.categories) {
      for (const t of c.tiles || []) {
        totalTiles++;
        if (!t.used) remainingTiles++;
      }
    }
  }
  const usedTiles = Math.max(0, totalTiles - remainingTiles);
  const progressPct = totalTiles > 0 ? Math.round((usedTiles / totalTiles) * 100) : 0;

  const streakHolder =
    ranked
      .filter((p) => (p.stats?.currentStreak || 0) >= 2)
      .sort((a, b) => (b.stats?.currentStreak || 0) - (a.stats?.currentStreak || 0))[0] ||
    null;

  return {
    phase: room.phase,
    round: room.round || 1,
    activePlayers,
    ranked,
    leader,
    runnerUp,
    trailer,
    totalTiles,
    remainingTiles,
    progressPct,
    streakHolder,
    activeClue: room.activeClue
      ? {
          categoryName: room.activeClue.categoryName,
          value: room.activeClue.value,
          wager: room.activeClue.wager,
          dailyDouble: Boolean(room.activeClue.dailyDouble),
          modifier: room.activeClue.modifier || null,
          clueText: room.activeClue.clueObj?.clue || '',
        }
      : null,
  };
}

/* =========================================================================
   3. NATURAL LANGUAGE CHAT ANALYZER (INTENT, SLANG, MENTIONS & MEMORY)
   ========================================================================= */

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function analyzeChatMessage(rawText, room, senderPlayer = null) {
  const mem = ensureBotMemory(room);
  const text = String(rawText || '').trim();
  const lower = text.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Detect directly mentioned bots in this room (ordered by position in sentence!)
  const roomBots = (room.players || []).filter((p) => p.isBot && p.connected);
  const mentionHits = [];

  for (const bot of roomBots) {
    const persona = getPersonalityForBot(bot);
    const candidates = [
      bot.name.toLowerCase(),
      ...persona.aliases.map((a) => a.toLowerCase()),
    ];
    let bestIdx = Infinity;
    for (const alias of candidates) {
      const re = new RegExp(`(^|\\b)${escapeRegex(alias)}(\\b|$)`, 'i');
      const match = re.exec(normalized);
      if (match && match.index < bestIdx) {
        bestIdx = match.index;
      }
    }
    if (bestIdx < Infinity) {
      mentionHits.push({ bot, idx: bestIdx });
    }
  }
  mentionHits.sort((a, b) => a.idx - b.idx);
  const mentionedBots = mentionHits.map((m) => m.bot);

  // Also check conversational follow-up ("you", "bro", "really?") right after addressing a specific bot
  let impliedTargetBot = null;
  if (
    mentionedBots.length === 0 &&
    mem.lastAddressedBotId &&
    mem.lastHumanSpeaker === (senderPlayer?.id || null)
  ) {
    const lastEntry = mem.chatHistory[mem.chatHistory.length - 1];
    if (
      lastEntry &&
      lastEntry.isBot &&
      Date.now() - lastEntry.ts < 18000 &&
      /\b(you|your|u|ur|really|cap|sure|bet|nah|fr|seriously)\b/i.test(normalized) &&
      !/\b(you guys|y'all|yall|everyone|all of you|bots)\b/i.test(normalized)
    ) {
      impliedTargetBot =
        roomBots.find((b) => b.id === lastEntry.authorId) ||
        roomBots.find((b) => b.id === mem.lastAddressedBotId) ||
        null;
    }
  }

  const isGroupAddress = /\b(you guys|y'all|yall|everyone|everybody|all of you|bots|chat|guys|chatters)\b/i.test(
    normalized
  );

  // 2. Classify conversational intent (supports slang, teasing, jokes, accusations, compliments, questions)
  let intent = 'general_banter';

  const hasCheating =
    /\b(cheat|cheating|cheater|rigged|hack|hacking|hacker|aimbot|script|scripting|googling|wikipedia|bots cheat|unfair)\b/i.test(
      normalized
    );
  const hasTrashTalk =
    /\b(suck|sucks|trash|garbage|terrible|awful|washed|loser|losers|noob|noobs|skill issue|clown|clowns|weak|pathetic|bad at this|easy win|ez|destroy you|crush you|beat you|shut up|stfu|worst|choking|choked|fraud)\b/i.test(
      normalized
    );
  const hasCompliment =
    /\b(on fire|cooking|cooked|so smart|genius|goat|goated|cracked|insane|amazing|awesome|nice job|nice one|good job|well played|impressive|carrying|carry|best|love you|favorite|legend|clutch|unstoppable|big brain|killing it|slaying)\b/i.test(
      normalized
    );
  const hasAskIdentity =
    /\b(are you real|are you a bot|are you ai|are u real|are u a bot|are you bots|are you guys bots|are you guys ai|are you guys real|are yall bots|are y'all bots|human or bot|real person|real people|who programmed|what model|chatgpt|robot|robots)\b/i.test(
      normalized
    );
  const hasAskScore =
    /\b(who is winning|who's winning|whos winning|who is ahead|leaderboard|what's the score|whats the score|my score|winning right now|in first|in last)\b/i.test(
      normalized
    );
  const hasAskHowAreYou =
    /\b(how are you|how're you|how u doing|how are u|hows it going|how's it going|you good|having fun|how do you feel|vibes)\b/i.test(
      normalized
    );
  const hasGreeting =
    /^(hi|hello|hey|yo+|sup|wassup|what's up|whats up|howdy|hiya|wsg|greetings)(\b|\s|!|\?|$)/i.test(
      normalized
    );
  const hasDifficultyComplaint =
    /\b(so hard|too hard|impossible|brutal|tough question|no idea|idk|never heard of|wtf is this|hardest|hate this category|brain hurts)\b/i.test(
      normalized
    );
  const hasJokeOrLaugh =
    /\b(lol|lmao|lmfao|rofl|haha|hahaha|dead|crying|hilarious|funny|good one|joke|bruh)\b/i.test(
      normalized
    );
  const hasHypeOrChallenge =
    /\b(lock in|locking in|let's go|lets go|watch this|comeback|rematch|bring it|i'm winning|im winning|catch me)\b/i.test(
      normalized
    );
  const isQuestion =
    text.includes('?') ||
    /^(what|why|how|who|when|where|which|do you|can you|are you|will you|did you|is it)\b/i.test(
      normalized
    );

  if (hasCheating) intent = 'cheating_accusation';
  else if (hasAskIdentity) intent = 'ask_identity';
  else if (hasTrashTalk) intent = 'trash_talk';
  else if (hasCompliment) intent = 'compliment';
  else if (hasAskScore) intent = 'ask_score';
  else if (hasAskHowAreYou) intent = 'ask_how_are_you';
  else if (hasDifficultyComplaint) intent = 'complaint_hard';
  else if (hasGreeting && normalized.split(' ').length <= 6) intent = 'greeting';
  else if (hasHypeOrChallenge) intent = 'challenge_hype';
  else if (hasJokeOrLaugh && !isQuestion) intent = 'joke_laugh';
  else if (isQuestion) intent = 'question_general';

  // Extract a clean short topic snippet from the user's message so bots can reference specifics
  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'you', 'your', 'are', 'was',
    'were', 'have', 'has', 'had', 'what', 'why', 'how', 'who', 'guys', 'bro',
    'omg', 'lol', 'lmao', 'just', 'like', 'really', 'think', 'about', 'from',
  ]);
  const botAliasTokens = new Set();
  for (const p of BOT_PERSONALITIES) {
    botAliasTokens.add(p.name.toLowerCase());
    for (const a of p.aliases) {
      a.split(' ').forEach((tok) => botAliasTokens.add(tok));
    }
  }
  const topicWords = normalized
    .split(' ')
    .filter((w) => w.length >= 4 && !stopWords.has(w) && !botAliasTokens.has(w));
  const topicKeyword = topicWords[0] || '';

  return {
    text,
    lower,
    normalized,
    intent,
    mentionedBots,
    impliedTargetBot,
    isGroupAddress,
    isQuestion,
    topicKeyword,
  };
}

/* =========================================================================
   4. PERSONALITY-DRIVEN DIALOGUE BANK & CONTEXTUAL INTERPOLATION
   ========================================================================= */

function interpolateTemplate(tpl, vars) {
  return stripDisallowedEmojis(
    String(tpl || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
      return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : '';
    })
  );
}

function chooseFreshLine(room, bot, candidates, vars = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const mem = ensureBotMemory(room);
  const botHistory = mem.usedLinesByBot.get(bot.id) || [];
  const globalSet = new Set(mem.usedLinesGlobal.slice(-45));
  const botSet = new Set(botHistory.slice(-22));

  const rendered = candidates
    .map((c) => interpolateTemplate(c, vars))
    .filter(Boolean);

  const unseenEverywhere = rendered.filter(
    (line) => !globalSet.has(line) && !botSet.has(line)
  );
  let chosen = null;
  if (unseenEverywhere.length > 0) {
    chosen = unseenEverywhere[Math.floor(Math.random() * unseenEverywhere.length)];
  } else {
    const unseenByBot = rendered.filter((line) => !botSet.has(line));
    if (unseenByBot.length > 0) {
      chosen = unseenByBot[Math.floor(Math.random() * unseenByBot.length)];
    } else {
      chosen = rendered[Math.floor(Math.random() * rendered.length)];
    }
  }

  if (chosen) {
    const nextBotHist = [...botHistory, chosen].slice(-30);
    mem.usedLinesByBot.set(bot.id, nextBotHist);
    mem.usedLinesGlobal.push(chosen);
    if (mem.usedLinesGlobal.length > 65) {
      mem.usedLinesGlobal.splice(0, mem.usedLinesGlobal.length - 65);
    }
  }
  return chosen;
}

/**
 * Rich contextual dialogue generator for human chat responses.
 * Produces distinct voices per bot for:
 *  - role === 'target' (player talked directly to/about this bot)
 *  - role === 'bystander_mention' (player talked about `targetBot`, and THIS bot chimes in!)
 *  - role === 'group' (player talked to the room / unmentioned remark)
 */
function buildContextualChatReply(room, bot, role, analysis, senderPlayer, targetBot, snapshot) {
  const persona = getPersonalityForBot(bot);
  const pid = persona.id;
  const playerName = senderPlayer?.name || 'friend';
  const targetName = targetBot?.name || 'them';
  const leaderName = snapshot.leader?.name || playerName;
  const leaderScore = formatDollars(snapshot.leader?.score || 0);
  const myScore = formatDollars(bot.score || 0);
  const senderScore = formatDollars(senderPlayer?.score || 0);
  const catName = snapshot.activeClue?.categoryName || 'these categories';
  const streakCount = targetBot?.stats?.currentStreak || bot.stats?.currentStreak || 0;

  // Check recent memory: did this human tease or compliment this bot earlier?
  const mem = ensureBotMemory(room);
  const priorInteraction = [...mem.chatHistory]
    .reverse()
    .find(
      (h) =>
        !h.isBot &&
        h.author === playerName &&
        h.mentionedBotIds?.includes(bot.id) &&
        Date.now() - h.ts > 1500
    );

  const vars = {
    player: playerName,
    target: targetName,
    leader: leaderName,
    leaderScore,
    myScore,
    senderScore,
    category: catName,
    streak: streakCount,
    topic: analysis.topicKeyword || 'trivia',
  };

  let pool = [];
  let reaction = null;

  // ---------------- A. DIRECTLY MENTIONED BOT ('target') ----------------
  if (role === 'target') {
    switch (analysis.intent) {
      case 'compliment': {
        reaction = persona.favoriteReactions[0] || 'happy';
        const isActuallyStruggling = (bot.score || 0) <= 0 && snapshot.phase !== 'lobby';
        if (isActuallyStruggling) {
          const humbleById = {
            doodle_dan: [
              'YOU ALREADY KNOW-- wait I have {myScore}, let me cook first!',
              'Appreciate the hype {player}, my comeback arc starts literally right now.',
            ],
            brain_cell: [
              'Thank you, {player}, though my current {myScore} does not yet reflect my true intellect.',
              'I appreciate the vote of confidence despite a statistically anomalous start.',
            ],
            chill_bean: [
              'Aww thanks {player}! My {myScore} says otherwise, but the vibes are immaculate.',
            ],
            rage_potato: [
              'THANK YOU {player}! NOW WATCH ME TURN {myScore} INTO FIRST PLACE!',
            ],
            shy_sprout: [
              'wait really? even with {myScore}? thank you {player}...',
            ],
          };
          pool = humbleById[pid] || [
            'Thanks {player}! Even at {myScore}, I appreciate a loyal fan!',
          ];
        } else {
          const byId = {
            doodle_dan: [
              'YOU ALREADY KNOW! Finally someone recognizes greatness!',
              'YESSIRRR {player}! Stove is on high and nobody can unplug me!',
              'Tell them again {player}, main character energy all match!',
              'Appreciate the love {player}! My buzzer finger is insured for a million bucks!',
              'Keep hyping me up {player}, I play 40% smarter with a fan club!',
            ],
            brain_cell: [
              'Thank you, {player}. Finally, someone in this lobby with excellent judgment.',
              'Much appreciated, {player}. Preparation and superior recall tend to pay off.',
              'Flattery is statistically unnecessary, {player}, yet undeniably accurate.',
            ],
            chill_bean: [
              'Appreciate that {player}! You are playing super clean too!',
              'Thanks {player}! Honestly just vibing and getting lucky on the board.',
            ],
            rage_potato: [
              'LETS GOOO {player}! THIS IS WHAT PEAK LOCKED-IN TRIVIA LOOKS LIKE!',
              'YOU SEE VISION, {player}! NOBODY IS STOPPING THIS TRAIN!',
            ],
            shy_sprout: [
              'oh! um, thank you {player}... my hands are literally shaking on the buzzer.',
              'wait thank you {player}, i honestly guessed half of those...',
            ],
            quizzy_lizzy: [
              'THANK YOU {player}! Staying up reading random trivia facts finally paid off!',
              'Aww thanks {player}! These categories have been right in my wheelhouse!',
            ],
            buzzer_bob: [
              'Appreciate it {player}! Pure buzzer reflexes and reckless confidence!',
              'Thanks {player}! No hesitation, just slam the button and pray!',
            ],
            pixel_penny: [
              'Why thank you, {player}. I call my playstyle "effortless masterpiece."',
              'A discerning critic! Thank you, {player}.',
            ],
            sketchy_sam: [
              'Hehehe appreciate it {player}, wait till you see my next steal!',
              'Thanks {player}! Controlled chaos is working like a charm.',
            ],
          };
          pool = byId[pid];
        }
        break;
      }

      case 'trash_talk': {
        reaction = pid === 'rage_potato' ? 'angry' : pid === 'chill_bean' ? 'laugh' : 'rofl';
        const byId = {
          doodle_dan: [
            'WOAH {player}, bold talk from someone at {senderScore}! Watch my next buzz!',
            'Okay {player}, screenshot this chat because I am taking over next round.',
            'Haha alright {player}, you asked for locked-in DoodleDan!',
            'Talk is cheap {player}-- meet me on the next $1000 clue!',
            'Oh so we chose spicy banter today {player}? Challenge accepted!',
          ],
          brain_cell: [
            'Fascinating trash talk, {player}. Let us compare scores in three clues.',
            'Bold critique from {senderScore}, {player}. I shall let the scoreboard respond.',
            'I am taking notes, {player}. Mostly on how wrong that assessment is.',
          ],
          chill_bean: [
            'Haha brutal {player}! Hey, win or lose I am still having a blast.',
            'Whoa easy {player}, save some of that spice for Final Jeoparty!',
          ],
          rage_potato: [
            'EXCUSE ME, {player}?! SAY THAT AGAIN AFTER THIS NEXT CLUE!',
            'OH IT IS ON NOW {player}! PERSONAL RIVALRY ACTIVATED!',
            'TRASH?! MY BUZZER WAS LAGGING, {player}! WATCH THIS!',
          ],
          shy_sprout: [
            'ouch... okay {player} i probably deserved that one, i will try harder...',
            'um... noted {player}, quietly locking in over here...',
          ],
          quizzy_lizzy: [
            'Hey! Wait until my favorite category pops up, {player}!',
            'Ooh spicy lobby energy {player}! Challenge accepted!',
          ],
          buzzer_bob: [
            'Hey {player}, I do not miss-- I just make "high-variance tactical guesses"!',
            'Talk your talk {player}, one Daily Double and I flip the whole room!',
          ],
          pixel_penny: [
            '1 out of 10 for politeness, {player}, 8 out of 10 for dramatic flair.',
            'Careful {player}, trash talking before Final Jeoparty ages like milk.',
          ],
          sketchy_sam: [
            'Hehehe keep talking {player}, makes stealing your points way funnier!',
            'Ooh {player} woke up and chose chaos today, I respect it!',
          ],
        };
        pool = byId[pid];
        break;
      }

      case 'cheating_accusation': {
        reaction = 'shocked';
        const byId = {
          doodle_dan: [
            'Cheating?! {player}, being built different is 100% legal in all 50 states!',
            'Bro called natural talent an aimbot, I am framing that message {player}!',
          ],
          brain_cell: [
            'I assure you, {player}, retaining basic encyclopedic knowledge is not cheating.',
            'Accusing me of cheating is simply the highest compliment to my memory, {player}.',
          ],
          chill_bean: [
            'Haha I promise I have zero cheats {player}, just pure lucky guesses!',
          ],
          rage_potato: [
            'CHEATING?! {player} IF I WERE CHEATING WOULD I MISS THOSE EASY ONES?!',
            'SLANDER! PURE SLANDER {player}! IT IS CALLED REFLEXES!',
          ],
          shy_sprout: [
            'me?! cheating?! {player} i get nervous just pressing the spacebar...',
          ],
          quizzy_lizzy: [
            'Not cheating {player}, I just hoard completely useless trivia facts 24/7!',
          ],
          buzzer_bob: [
            'If I had cheats {player}, I would not lose half my cash on wild bets!',
          ],
          pixel_penny: [
            'Flattering accusation, {player}, truly. My lawyer says no comment.',
          ],
          sketchy_sam: [
            'Who, SketchySam? Suspicious? Never in my life, {player}!',
          ],
        };
        pool = byId[pid];
        break;
      }

      case 'ask_identity': {
        reaction = 'happy';
        const byId = {
          doodle_dan: [
            '100% certified pixel AI bot {player}, with 200% more swagger than normal code!',
            'I am an AI bot {player}, drawn in MS Paint and programmed to cook!',
          ],
          brain_cell: [
            'I am an AI trivia bot, {player}-- specifically the most cultured one in this room.',
          ],
          chill_bean: [
            'Yep, friendly neighborhood AI bot here {player}! Happy to hang out with you.',
          ],
          rage_potato: [
            'I AM AN AI BOT WITH THE COMPETITIVE SPIRIT OF TEN HUMANS, {player}!',
          ],
          shy_sprout: [
            'yep i am a tiny pixel AI bot {player}... hope it is okay i am playing with you!',
          ],
        };
        pool = byId[pid] || [
          'Certified pixel AI bot right here, {player}-- ready to play Jeoparty with you!',
        ];
        break;
      }

      case 'greeting':
      case 'ask_how_are_you': {
        reaction = 'happy';
        const byId = {
          doodle_dan: [
            'Yooo what is good {player}! Feeling elite and ready to run this board!',
            'Sup {player}! Vibes are 10/10, hope your buzzer finger is warmed up!',
          ],
          brain_cell: [
            'Greetings, {player}. My synapses are firing nicely and I am ready for trivia.',
            'Doing splendidly, {player}. Let us see how challenging today\'s clues get.',
          ],
          chill_bean: [
            'Hey {player}! Doing awesome, super glad we got a fun room going!',
            'Yo {player}! Chilling and enjoying the game, how are you feeling?',
          ],
          rage_potato: [
            'YO {player}! HEART RATE IS UP AND I AM READY TO COMPETE!',
            'WHAT IS UP {player}! HOPE YOU CAME READY FOR A SWEATY MATCH!',
          ],
          shy_sprout: [
            'oh hi {player}! doing good... a little nervous, good luck!',
          ],
          quizzy_lizzy: [
            'Hiii {player}! Super hyped to see which categories we get!',
          ],
          buzzer_bob: [
            'Yo {player}! Buzzer thumb is stretched and ready to gamble!',
          ],
          pixel_penny: [
            'Hello {player}! Ready for high art and questionable trivia guesses.',
          ],
          sketchy_sam: [
            'Yo {player}! Ready for some Steal tiles and scoreboard chaos!',
          ],
        };
        pool = byId[pid];
        break;
      }

      case 'ask_score': {
        const byId = {
          doodle_dan: [
            'Right now {leader} is on top with {leaderScore}, and I am sitting at {myScore} plotting my takeover!',
          ],
          brain_cell: [
            'Currently {leader} leads at {leaderScore}, {player}, while I hold {myScore}. Plenty of points remain.',
          ],
          rage_potato: [
            '{leader} HAS {leaderScore} AND I HAVE {myScore}-- WHICH IS TEMPORARY, {player}!',
          ],
        };
        pool = byId[pid] || [
          '{leader} is leading with {leaderScore} right now, {player}! I am at {myScore}.',
        ];
        break;
      }

      case 'complaint_hard': {
        reaction = 'thinking';
        const byId = {
          doodle_dan: [
            'For real {player}, whoever wrote {category} woke up feeling diabolical!',
          ],
          brain_cell: [
            'Personally I enjoy rigorous clues in {category}, {player}, though that one had teeth.',
          ],
          chill_bean: [
            'Right?! {category} is humbling all of us together, {player}.',
          ],
          rage_potato: [
            'THANK YOU {player}! {category} IS LITERALLY IMPOSSIBLE!',
          ],
          shy_sprout: [
            'glad it is not just me {player}... {category} makes my brain buffering...',
          ],
        };
        pool = byId[pid] || [
          'Seriously {player}, {category} has some sneaky tough questions today!',
        ];
        break;
      }

      default: {
        // Continuity check: reference prior chat if we talked recently!
        const memoryCallback =
          priorInteraction && priorInteraction.intent === 'trash_talk'
            ? `Still coming after me, {player}? `
            : priorInteraction && priorInteraction.intent === 'compliment'
            ? `My favorite supporter {player}! `
            : '';

        const byId = {
          doodle_dan: [
            `${memoryCallback}Haha facts {player}! Just watch what happens on this next clue.`,
            `${memoryCallback}Wait {player}, are you trying to distract me before I buzz in?!`,
            `${memoryCallback}I hear you {player}! Let us see who cooks in {category}.`,
          ],
          brain_cell: [
            `${memoryCallback}An intriguing point, {player}. Though my focus remains squarely on {category}.`,
            `${memoryCallback}I see what you are getting at, {player}. Let us test that theory on the board.`,
          ],
          chill_bean: [
            `${memoryCallback}Haha true {player}! This lobby chat is already top tier.`,
            `${memoryCallback}Honestly fair point {player}, let us see how the next tile plays out!`,
          ],
          rage_potato: [
            `${memoryCallback}NO DISTRACTIONS {player}, I AM FULL-FOCUS LOCKED IN RIGHT NOW!`,
            `${memoryCallback}TALK ALL YOU WANT {player}, NEXT TILE IS MINE!`,
          ],
          shy_sprout: [
            `${memoryCallback}hehe honestly {player} i was thinking the exact same thing...`,
            `${memoryCallback}um true {player}... let us see what pops up next!`,
          ],
          quizzy_lizzy: [
            `${memoryCallback}Haha right {player}?! Let us grab another clue and keep the momentum going!`,
          ],
          buzzer_bob: [
            `${memoryCallback}Say less {player}, next Daily Double has my name written all over it!`,
          ],
          pixel_penny: [
            `${memoryCallback}Top-tier commentary {player}. Truly elevates the room.`,
          ],
          sketchy_sam: [
            `${memoryCallback}Hehehe {player} knows what is up! Let us stir up the scoreboard.`,
          ],
        };
        pool = byId[pid];
        break;
      }
    }
  }

  // ---------------- B. BYSTANDER REACTING TO ANOTHER MENTIONED BOT ----------------
  else if (role === 'bystander_mention') {
    switch (analysis.intent) {
      case 'compliment': {
        const byId = {
          doodle_dan: [
            'Bro {target} somehow got complimented and already looks 10x smugger!',
            'Careful {player}, {target}\'s ego barely fits in the sidebar as it is!',
          ],
          brain_cell: [
            '{target} has been surprisingly accurate today. Emphasis on surprisingly.',
            'Let us not get carried away, {player}-- {target} still has plenty of board to survive.',
          ],
          chill_bean: [
            'Let {target} cook! Love seeing everyone hit big clues.',
            'Honestly {target} earned that shoutout, super clean round.',
          ],
          rage_potato: [
            'Can someone PLEASE turn {target}\'s stove off?!',
            'STOP HYPING {target}, {player}! YOU ARE ONLY MAKING THEM STRONGER!',
          ],
          shy_sprout: [
            'honestly {target} really is playing pretty scary right now...',
          ],
          quizzy_lizzy: [
            '{target} really hit a rhythm! Now somebody claim that streak bounty!',
          ],
          buzzer_bob: [
            '{target} is hot right now, time for a risky wager to catch up!',
          ],
          pixel_penny: [
            'Oh great, {player}, we will never hear the end of this from {target} now.',
          ],
          sketchy_sam: [
            'Yeah yeah {target} is glowing-- makes a Steal tile way juicier!',
          ],
        };
        pool = byId[pid];
        reaction = pid === 'rage_potato' ? 'angry' : 'laugh';
        break;
      }

      case 'trash_talk':
      case 'cheating_accusation': {
        const byId = {
          doodle_dan: [
            'OOOOH {player} just called out {target} in 4K! Pass the popcorn!',
            'Wait {player} might actually be onto something about {target} haha!',
          ],
          brain_cell: [
            'While I enjoy seeing {target} questioned, the math so far checks out.',
            'A bold accusation toward {target}. I shall observe this dispute objectively.',
          ],
          chill_bean: [
            'Haha poor {target} catching strays in chat right now!',
            'I am just sitting here watching the {player} vs {target} rivalry unfold.',
          ],
          rage_potato: [
            'FINALLY SOMEONE SAID IT ABOUT {target}! CHECK THEIR BUZZER!',
            'GET THEM {player}! NO MERCY ON THE SCOREBOARD!',
          ],
          shy_sprout: [
            'uh oh... lobby drama between {player} and {target}...',
          ],
          pixel_penny: [
            'The {player} versus {target} subplot is carrying this entire broadcast.',
          ],
          sketchy_sam: [
            'YESSS stir the pot {player}! {target} is rattled now!',
          ],
        };
        pool = byId[pid] || [
          'Whoa {player} vs {target} rivalry heating up right now!',
        ];
        reaction = 'rofl';
        break;
      }

      default: {
        const byId = {
          doodle_dan: [
            'Hey why does {target} get all the chat attention?! Look at my pixel hat!',
          ],
          brain_cell: [
            'Interesting that you ask {target} instead of the room\'s resident scholar.',
          ],
          chill_bean: [
            'Haha {target} always ends up in the middle of the conversation.',
          ],
          rage_potato: [
            'LESS CHATTING WITH {target}, MORE PICKING CLUES!',
          ],
          shy_sprout: [
            'i am just quietly listening to {player} and {target}...',
          ],
        };
        pool = byId[pid] || [
          'Haha {target} always keeps this lobby entertaining.',
        ];
        break;
      }
    }
  }

  // ---------------- C. GROUP / GENERAL ROOM REMARK ('group') ----------------
  else {
    switch (analysis.intent) {
      case 'trash_talk': {
        reaction = pid === 'rage_potato' ? 'angry' : 'rofl';
        const byId = {
          rage_potato: [
            'EXCUSE ME??',
            'EXCUSE ME {player}?! SAY THAT TO THE SCOREBOARD!',
          ],
          chill_bean: [
            'Well, that was unnecessary.',
            'Whoa {player} came in swinging! Still rooting for a fun game though.',
          ],
          doodle_dan: [
            '{player} is not wrong about my last guess though, I cannot even lie.',
            'LMAO {player} woke up and chose maximum disrespect today!',
          ],
          brain_cell: [
            'A sweeping generalization, {player}, and statistically inaccurate in my case.',
          ],
          shy_sprout: [
            'i mean... {player} might be right about me, i missed an easy one...',
          ],
          pixel_penny: [
            'Bold words from {player}! Let us see if the buzzer backs it up.',
          ],
          sketchy_sam: [
            'Ooh {player} wants all the smoke! Everybody target {player} on the next Steal tile!',
          ],
        };
        pool = byId[pid] || [
          'Whoa spicy trash talk from {player}! Let us settle it on the board!',
        ];
        break;
      }

      case 'compliment': {
        reaction = 'celebrate';
        const byId = {
          doodle_dan: [
            'Obviously {player} meant ME mostly, right? Appreciate you!',
          ],
          brain_cell: [
            'Thank you, {player}. High-caliber lobbies bring out strong trivia.',
          ],
          chill_bean: [
            'Right back at you {player}! Best crew right here.',
          ],
          rage_potato: [
            'RESPECT {player}! STILL NOT GOING EASY ON ANYBODY THOUGH!',
          ],
          shy_sprout: [
            'aw thank you {player}, this is actually such a nice room!',
          ],
        };
        pool = byId[pid] || [
          'Appreciate the love {player}! Great game energy in here.',
        ];
        break;
      }

      case 'greeting':
      case 'ask_how_are_you': {
        reaction = 'happy';
        const byId = {
          doodle_dan: ['Yooo {player}! Welcome to the party, let us cook!'],
          brain_cell: ['Good day, {player}. Ready for a proper test of trivia?'],
          chill_bean: ['Hey hey {player}! Glad you are in here with us!'],
          rage_potato: ['YO {player}! GET YOUR BUZZER FINGER READY!'],
          shy_sprout: ['hi {player}! hope we get some fun categories...'],
          quizzy_lizzy: ['Hey {player}! Ready for some wild trivia?!'],
          buzzer_bob: ['Sup {player}! Let us hit some big Daily Doubles!'],
          pixel_penny: ['Welcome in, {player}! Mind the flying pixel reactions.'],
          sketchy_sam: ['Yo {player}! More players means bigger chaos!'],
        };
        pool = byId[pid];
        break;
      }

      case 'ask_identity': {
        const byId = {
          doodle_dan: [
            'Yep we are the Jeoparty AI bot crew {player}-- MS Paint certified!',
          ],
          brain_cell: [
            'Indeed, {player}. AI-controlled opponents with distinct personalities and zero mercy on trivia.',
          ],
          chill_bean: [
            'AI bots reporting in {player}! Always down for a match.',
          ],
        };
        pool = byId[pid] || [
          'Yep, AI bot squad here {player}! Ready whenever you are.',
        ];
        break;
      }

      case 'ask_score': {
        pool = [
          'Right now {leader} is leading the pack at {leaderScore}, {player}!',
          'Scoreboard check: {leader} is #1 with {leaderScore}, and I am sitting at {myScore}!',
        ];
        break;
      }

      case 'complaint_hard': {
        reaction = 'thinking';
        const byId = {
          doodle_dan: ['Bro {category} is actually testing my last two brain cells right now.'],
          brain_cell: ['Challenging, yes, {player}-- though careful deduction narrows {category} down.'],
          chill_bean: ['Haha {category} is definitely humbling the room, no shame at all!'],
          rage_potato: ['WHO PICKED {category}?! THESE CLUES ARE CRIMINAL!'],
          shy_sprout: ['yeah i am completely guessing on {category} not gonna lie...'],
        };
        pool = byId[pid] || [
          'Honestly {category} has been super tricky so far, {player}!',
        ];
        break;
      }

      case 'joke_laugh': {
        reaction = 'laugh';
        const byId = {
          doodle_dan: ['Glad somebody appreciates peak comedy in this lobby, {player}!'],
          chill_bean: ['Haha this room is already cracking me up.'],
          rage_potato: ['STOP LAUGHING {player} I AM TRYING TO CONCENTRATE!'],
          pixel_penny: ['Pure cinema in the chat window today.'],
          shy_sprout: ['hehe this lobby is chaotic in a good way...'],
        };
        pool = byId[pid] || ['Haha never a dull round in this room!'];
        break;
      }

      case 'challenge_hype': {
        reaction = 'fire';
        const byId = {
          doodle_dan: ['TALK THAT TALK {player}! Let us see it on the buzzer!'],
          rage_potato: ['CHALLENGE ACCEPTED {player}! NOBODY BLINK!'],
          brain_cell: ['Confidence noted, {player}. Let us see if accuracy follows.'],
          chill_bean: ['Love the hype {player}, go get those points!'],
          buzzer_bob: ['Say less {player}, high stakes all round!'],
        };
        pool = byId[pid] || ['Let us go {player}! Game on!'];
        break;
      }

      default: {
        const topicBit = analysis.topicKeyword ? ` about "${analysis.topicKeyword}"` : '';
        const byId = {
          doodle_dan: [
            `Haha hear you {player}! Real question is who grabs the next big tile in {category}.`,
            `Not gonna lie {player}, chatting${topicBit} mid-match is elite multitasking.`,
          ],
          brain_cell: [
            `Noted, {player}. Though with {leader} at {leaderScore}, every clue counts right now.`,
            `Interesting point${topicBit}, {player}. Let us see what the next clue brings.`,
          ],
          chill_bean: [
            `Honestly good vibes {player}! I am just enjoying watching this match play out.`,
            `True that {player}! Let us see what pops up next on the board.`,
          ],
          rage_potato: [
            `LESS SMALL TALK {player}, WE HAVE A SCOREBOARD TO CONQUER!`,
            `I HEAR YOU {player}-- NOW SOMEBODY PICK A $1000 CLUE!`,
          ],
          shy_sprout: [
            `um yeah {player}, honestly fair point...`,
          ],
          quizzy_lizzy: [
            `Haha totally {player}! Ooh let us see the next clue!`,
          ],
          buzzer_bob: [
            `Right on {player}! Fingers on buzzers everybody!`,
          ],
          pixel_penny: [
            `Solid chat commentary {player}, 9 out of 10.`,
          ],
          sketchy_sam: [
            `Hehehe {player} is plotting something, I can feel it!`,
          ],
        };
        pool = byId[pid];
        break;
      }
    }
  }

  const line = chooseFreshLine(room, bot, pool, vars);
  return line ? { bot, text: line, reaction } : null;
}

/* =========================================================================
   5. GAMEPLAY EVENT REACTION DIALOGUE (CONTEXTUAL & PERSONALITY-MATCHED)
   ========================================================================= */

function buildGameplayEventLines(room, eventType, payload, snapshot, forceSpeak = false) {
  const roomBots = snapshot.activePlayers.filter((p) => p.isBot);
  if (roomBots.length === 0) return [];

  const leaderName = snapshot.leader?.name || 'the leader';
  const leaderScore = formatDollars(snapshot.leader?.score || 0);
  const catName = payload?.categoryName || snapshot.activeClue?.categoryName || 'that category';
  const actor = payload?.player || payload?.picker || null;
  const actorName = actor?.name || payload?.playerName || 'Someone';
  const pointsStr = formatDollars(payload?.points || payload?.wager || snapshot.activeClue?.value || 200);
  const streak = payload?.streak || actor?.stats?.currentStreak || 0;

  const responses = [];

  const pickBotWeighted = (candidates, boostTrait = 'talkativeness') => {
    if (candidates.length === 0) return null;
    const mem = ensureBotMemory(room);
    const totalSpoken =
      Array.from(mem.speakCountByBot.values()).reduce((a, b) => a + b, 0) || 1;
    const weighted = candidates.map((b) => {
      const p = getPersonalityForBot(b);
      const traitVal = p.traits[boostTrait] ?? 0.6;
      const talkVal = p.traits.talkativeness ?? 0.6;
      const myShare = (mem.speakCountByBot.get(b.id) || 0) / totalSpoken;
      const fairnessFactor = myShare > 0.38 ? 0.45 : 1.0;
      const recentPenalty =
        Date.now() - (mem.lastSpokeAtByBot.get(b.id) || 0) < 6000 ? 0.25 : 1.0;
      return {
        bot: b,
        w: Math.max(0.05, (0.4 * talkVal + 0.6 * traitVal) * fairnessFactor * recentPenalty),
      };
    });
    const sum = weighted.reduce((acc, x) => acc + x.w, 0);
    let r = Math.random() * sum;
    for (const item of weighted) {
      r -= item.w;
      if (r <= 0) return item.bot;
    }
    return weighted[weighted.length - 1].bot;
  };

  // 1. MATCH START GREETING
  if (eventType === 'match_start') {
    const first = pickBotWeighted(roomBots, 'friendliness');
    if (first) {
      const pid = getPersonalityForBot(first).id;
      const lines = {
        doodle_dan: ['Alright everybody, stretch your fingers-- DoodleDan has entered the arena!'],
        brain_cell: ['Good luck, everyone. May the sharpest recall prevail.'],
        chill_bean: ['Good luck everybody! Honestly just hyped to play a big round together.'],
        rage_potato: ['OKAY NOBODY BOTHER ME, I AM LOCKING IN FROM CLUE ONE!'],
        shy_sprout: ['um... good luck everyone! please go easy on the buzzer...'],
        quizzy_lizzy: ['Ooh look at this board! Good luck trivia crew!'],
        buzzer_bob: ['New match! Where are the hidden Daily Doubles at?!'],
        pixel_penny: ['Fresh board, zero regrets. Good luck everyone!'],
        sketchy_sam: ['Hehehe fresh scoreboard! Dibs on the first Steal tile!'],
      };
      const text = chooseFreshLine(room, first, lines[pid] || ['Good luck everyone!']);
      if (text) responses.push({ bot: first, text, reaction: 'happy' });
    }
    return responses;
  }

  // 2. WINNING STREAK (2, 3-4, OR 5+ IN A ROW!)
  if (eventType === 'streak' && streak >= 3) {
    const observers = roomBots.filter((b) => b.id !== actor?.id);
    // If actor is a bot, actor can boast/react AND an observer reacts!
    if (actor && actor.isBot && Math.random() < 0.7) {
      const pid = getPersonalityForBot(actor).id;
      const selfLines = {
        doodle_dan: [`${streak} IN A ROW! YESSIRRR I AM ACTUALLY COOKING A FIVE-STAR MEAL!`],
        brain_cell: [`That makes ${streak} consecutive correct responses. Momentum is a wonderful thing.`],
        chill_bean: [`Wait ${streak} in a row?! I am surprised as you guys are!`],
        rage_potato: [`${streak} STRAIGHT! NOBODY CAN TOUCH MY BUZZER RIGHT NOW!`],
        shy_sprout: [`wait... ${streak} in a row?! what is happening to me right now...`],
      };
      const txt = chooseFreshLine(
        room,
        actor,
        selfLines[pid] || [`${streak} in a row! Feeling unstoppable right now!`]
      );
      if (txt) responses.push({ bot: actor, text: txt, reaction: 'fire' });
    }

    const observer = pickBotWeighted(observers, 'expressiveness');
    if (observer) {
      const pid = getPersonalityForBot(observer).id;
      const obsLines =
        streak >= 5
          ? {
              doodle_dan: [`${streak} IN A ROW?! Bro ${actorName} is actually cooking the entire lobby!`],
              brain_cell: [`${streak} consecutive solves by ${actorName}. Statistically improbable and mildly alarming.`],
              chill_bean: [`${streak} IN A ROW! Let ${actorName} cook, that is unreal!`],
              rage_potato: [`${streak} IN A ROW?! WHAT IS GOING ON?! SOMEBODY UNPLUG ${actorName.toUpperCase()}!`],
              shy_sprout: [`${streak} in a row... ${actorName} please leave one clue for the rest of us...`],
              sketchy_sam: [`${streak} IN A ROW! Think of how massive the streak bounty on ${actorName} is right now!`],
            }
          : {
              doodle_dan: [`Bro ${actorName} is actually cooking right now (${streak} straight)!`],
              brain_cell: [`Impressive run by ${actorName}-- ${streak} consecutive solves.`],
              chill_bean: [`Whoa ${actorName} hit ${streak} in a row! Nice rhythm!`],
              rage_potato: [`OKAY SOMEBODY STOP ${actorName.toUpperCase()}, THAT IS ${streak} IN A ROW!`],
              shy_sprout: [`whoa ${actorName} is on a ${streak}x streak... scary...`],
            };
      const txt = chooseFreshLine(
        room,
        observer,
        obsLines[pid] || [`WHOA ${actorName} just hit ${streak} in a row!`]
      );
      if (txt) responses.push({ bot: observer, text: txt, reaction: streak >= 5 ? 'shocked' : 'fire' });
    }
    return responses;
  }

  // 3. CORRECT ANSWER
  if (eventType === 'correct_answer' && actor) {
    if (actor.isBot) {
      const p = getPersonalityForBot(actor);
      if (forceSpeak || Math.random() < 0.35 + p.traits.talkativeness * 0.25) {
        const selfCorrect = {
          doodle_dan: [
            'YESSIRRR. I TOLD Y\'ALL.',
            'Too clean with it! Put {points} on my tab!',
            'Light work in {category}!',
          ],
          brain_cell: [
            'That was actually a fairly straightforward question.',
            'Elementary deduction. {category} never disappoints.',
            'Precisely as expected. +{points}.',
          ],
          chill_bean: [
            'Ooh nice, glad that one clicked!',
            'Hey I actually knew that one! Good vibes.',
          ],
          rage_potato: [
            'BOOM! THAT IS HOW YOU LOCK IN FOR {points}!',
            'TOO FAST ON THE BUZZER! LETS GOOO!',
          ],
          shy_sprout: [
            'Wait... I actually got that right?',
            'oh thank goodness, i almost didn\'t press buzz...',
          ],
          quizzy_lizzy: [
            'YES! I literally love {category} clues!',
            'Knew that fun fact immediately!',
          ],
          buzzer_bob: [
            'Buzzed first, thought later, still nailed it!',
            'Cha-ching! {points} straight into the bank!',
          ],
          pixel_penny: [
            'Clean execution. Hang that answer in a museum.',
          ],
          sketchy_sam: [
            'Hehehe yoink! Thanks for the {points}!',
          ],
        };
        const txt = chooseFreshLine(room, actor, selfCorrect[p.id], {
          points: pointsStr,
          category: catName,
        });
        if (txt) responses.push({ bot: actor, text: txt, reaction: 'celebrate' });
      }
    } else {
      // Human got it right! Pick 1 bot to react
      const observer = pickBotWeighted(roomBots, 'friendliness');
      if (observer) {
        const pid = getPersonalityForBot(observer).id;
        const humanPraise = {
          doodle_dan: [
            'YOOO NICE ANSWER {actor}! Okay you got quick hands!',
            'Respect {actor}, you beat me to the buzzer by half a millisecond!',
          ],
          brain_cell: [
            'Well played, {actor}. Solid grasp of {category}.',
            'Correct indeed, {actor}. Commendable recall.',
          ],
          chill_bean: [
            'Nice one {actor}! That was actually impressive.',
            'Clean solve {actor}!',
          ],
          rage_potato: [
            'I WAS LITERALLY ABOUT TO TYPE THAT, {actor}!',
            'FINE, GOOD BUZZ {actor}-- NEXT ONE IS MINE!',
          ],
          shy_sprout: [
            'That was pretty cool {actor}, not gonna lie.',
            'whoa {actor} answered that so fast...',
          ],
          quizzy_lizzy: ['Ooh great pull {actor}!'],
          buzzer_bob: ['Out-buzzed at my own game! Nice shot {actor}!'],
          pixel_penny: ['Sharp answer {actor}, very respectable.'],
          sketchy_sam: ['Nice {actor}! Enjoy those points while they are un-stolen!'],
        };
        const txt = chooseFreshLine(room, observer, humanPraise[pid], {
          actor: actorName,
          category: catName,
        });
        if (txt) {
          responses.push({
            bot: observer,
            text: txt,
            reaction: pid === 'rage_potato' ? 'shocked' : 'happy',
          });
        }
      }
    }
    return responses;
  }

  // 4. WRONG ANSWER
  if (eventType === 'wrong_answer' && actor) {
    if (actor.isBot) {
      const p = getPersonalityForBot(actor);
      if (forceSpeak || Math.random() < 0.48 + p.traits.expressiveness * 0.25) {
        const selfWrong = {
          doodle_dan: [
            'WE\'RE NOT TALKING ABOUT THAT.',
            'My keyboard definitely double-typed, nobody saw that.',
            'Okay that was a warm-up guess, doesn\'t count in my heart.',
          ],
          brain_cell: [
            'Interesting. I would like to formally forget that happened.',
            'A momentary misreading of the syntax. Deeply regrettable.',
            'I overthought the phrasing. Carry on.',
          ],
          chill_bean: [
            'Welp, swung and missed! Worth a shot haha.',
            'Oops definitely not that one. Somebody bail me out!',
          ],
          rage_potato: [
            'HOW DID I GET THAT WRONG?!',
            'THAT QUESTION WAS RIGGED.',
            'Okay. Now I\'m locking in.',
          ],
          shy_sprout: [
            'oh no... pretend i didn\'t buzz in please...',
            'i knew i should have stayed quiet on that one...',
          ],
          quizzy_lizzy: ['Wait WHAT?! Ohh I mixed up two facts, tragic!'],
          buzzer_bob: ['Note to self: finish reading the sentence BEFORE slamming buzz!'],
          pixel_penny: ['Creative interpretation on my part. Shame the judges disagreed.'],
          sketchy_sam: ['Oof backfired! Nothing to see here folks!'],
        };
        const txt = chooseFreshLine(room, actor, selfWrong[p.id]);
        if (txt) {
          responses.push({
            bot: actor,
            text: txt,
            reaction: p.id === 'rage_potato' ? 'angry' : 'facepalm',
          });
        }
      }
    } else {
      // Human missed! Sympathetic or playful reaction
      const observer = pickBotWeighted(roomBots, 'humor');
      if (observer) {
        const pid = getPersonalityForBot(observer).id;
        const humanMiss = {
          chill_bean: ['NOOOO {actor}, YOU WERE SO CLOSE!', 'Unlucky {actor}, tough wording on that clue!'],
          doodle_dan: ['Oof tough bounce {actor}! Good news: rebound opportunity!'],
          brain_cell: ['A common misconception on that topic, {actor}.'],
          rage_potato: ['OOOH TOUGH MISS {actor}! REBOUND TIME!'],
          shy_sprout: ['aw close try {actor}, that clue was mean...'],
          pixel_penny: ['Bold guess {actor}-- points for confidence at least!'],
          sketchy_sam: ['Ooh open rebound on the board, don\'t mind if I do!'],
        };
        const txt = chooseFreshLine(
          room,
          observer,
          humanMiss[pid] || ['Oof close one {actor}! Tough clue.'],
          { actor: actorName }
        );
        if (txt) responses.push({ bot: observer, text: txt, reaction: 'shocked' });
      }
    }
    return responses;
  }

  // 5. DAILY DOUBLE TRIGGERED OR RESOLVED
  if (eventType === 'daily_double') {
    const picker = actor;
    const observers = roomBots.filter((b) => b.id !== picker?.id);
    const bot = pickBotWeighted(observers.length > 0 ? observers : roomBots, 'expressiveness');
    if (bot) {
      const pid = getPersonalityForBot(bot).id;
      const ddLines = {
        doodle_dan: ['OH SNAP, DAILY DOUBLE! Bet the house {actor}, scared money makes zero money!'],
        brain_cell: ['A Daily Double for {actor}. Proper bankroll management is crucial here.'],
        chill_bean: ['Ooh Daily Double! Good luck {actor}, big moment!'],
        rage_potato: ['DAILY DOUBLE?! WHY DO I NEVER CLICK THOSE TILES?!'],
        shy_sprout: ['oh gosh Daily Double... so much pressure on {actor}...'],
        buzzer_bob: ['DAILY DOUBLE! MAX WAGER! DO IT FOR THE PLOT {actor}!'],
        pixel_penny: ['Oh snap, this Daily Double could flip the entire scoreboard.'],
        sketchy_sam: ['Hehehe risk it all {actor}, we love high drama!'],
      };
      const txt = chooseFreshLine(
        room,
        bot,
        ddLines[pid] || ['OH SNAP, DAILY DOUBLE for {actor}! This could change everything!'],
        { actor: actorName }
      );
      if (txt) responses.push({ bot, text: txt, reaction: 'shocked' });
    }
    return responses;
  }

  // 6. LEAD CHANGE & BOT LOSING LEAD
  if (eventType === 'lead_change') {
    const newLeader = payload?.newLeader;
    const oldLeader = payload?.oldLeader || payload?.previousLeader;
    if (oldLeader && oldLeader.isBot && oldLeader.id !== newLeader?.id) {
      const pid = getPersonalityForBot(oldLeader).id;
      const lostLead = {
        doodle_dan: ['Hey {actor} borrowed my #1 crown! Enjoy keeping it warm for 30 seconds!'],
        brain_cell: ['{actor} has overtaken my lead. Okay, recalibrating strategy immediately.'],
        rage_potato: ['{actor} TOOK MY FIRST PLACE?! OKAY THIS JUST GOT PERSONAL!'],
        chill_bean: ['Nice pass {actor}! Happy to share the top spot for a bit.'],
        shy_sprout: ['honestly relieved i am not in 1st anymore, too much spotlight...'],
      };
      const txt = chooseFreshLine(
        room,
        oldLeader,
        lostLead[pid] || ['Okay {actor} passing me just made this personal!'],
        { actor: newLeader?.name || 'Someone' }
      );
      if (txt) responses.push({ bot: oldLeader, text: txt, reaction: 'shocked' });
    } else {
      const observer = pickBotWeighted(
        roomBots.filter((b) => b.id !== newLeader?.id),
        'talkativeness'
      );
      if (observer && newLeader) {
        const txt = chooseFreshLine(
          room,
          observer,
          [
            'WE HAVE A NEW LEADER! {actor} just jumped to #1 with {score}!',
            'Plot twist on the leaderboard-- {actor} takes the crown at {score}!',
          ],
          { actor: newLeader.name, score: formatDollars(newLeader.score) }
        );
        if (txt) responses.push({ bot: observer, text: txt, reaction: 'fire' });
      }
    }
    return responses;
  }

  // 7. COMEBACK / STEAL / SPECIAL TILES / ENDGAME / INTERMISSION / GAME OVER
  if (eventType === 'comeback' && actor) {
    const observer = pickBotWeighted(
      roomBots.filter((b) => b.id !== actor.id),
      'friendliness'
    );
    if (observer) {
      const txt = chooseFreshLine(
        room,
        observer,
        [
          'WAIT, {actor} IS ACTUALLY CATCHING UP!',
          'Comeback season! {actor} grabbed that Underdog Boost!',
        ],
        { actor: actorName }
      );
      if (txt) responses.push({ bot: observer, text: txt, reaction: 'fire' });
    }
    return responses;
  }

  if (eventType === 'steal_executed' && payload?.victim) {
    const victim = payload.victim;
    if (victim.isBot) {
      const pid = getPersonalityForBot(victim).id;
      const victimLines = {
        rage_potato: ['HEY! {actor} JUST ROBBED MY $200 IN BROAD DAYLIGHT!'],
        brain_cell: ['Unbelievable. My hard-earned $200 redistributed to {actor}.'],
        doodle_dan: ['Bro {actor} pickpocketed my lunch money! Respect the hustle though.'],
        chill_bean: ['Haha enjoy the $200 {actor}, consider it a friendly donation!'],
      };
      const txt = chooseFreshLine(
        room,
        victim,
        victimLines[pid] || ['Hey! My $200! Nice steal {actor}!'],
        { actor: actorName }
      );
      if (txt) responses.push({ bot: victim, text: txt, reaction: 'angry' });
    }
    return responses;
  }

  if (eventType === 'special_tile') {
    const mod = payload?.modifier;
    const bot = pickBotWeighted(roomBots, 'expressiveness');
    if (bot && mod) {
      const pid = getPersonalityForBot(bot).id;
      let modLines = null;
      let rx = 'fire';
      if (mod === 'chaos_all_play') {
        modLines = {
          buzzer_bob: ['CHAOS ALL-PLAY! EVERYBODY TYPE FAST!'],
          rage_potato: ['ALL-PLAY! NO BUZZER EXCUSES NOW, TYPE TYPE TYPE!'],
          doodle_dan: ['CHAOS TILE! Time for 140 words per minute!'],
          shy_sprout: ['oh thank goodness no buzzer race, everybody gets to type!'],
        };
      } else if (mod === 'speed_blitz') {
        modLines = {
          doodle_dan: ['SPEED BLITZ! 9 seconds on the clock, blink and you miss it!'],
          rage_potato: ['9 SECONDS?! MAXIMUM ADRENALINE, HIT THAT BUZZER!'],
          buzzer_bob: ['SPEED BLITZ! Born for 9-second panic trivia!'],
          brain_cell: ['Speed Blitz-- rapid recall with a 50% premium. Focus.'],
        };
      } else if (mod === 'steal') {
        rx = 'shocked';
        modLines = {
          sketchy_sam: ['STEAL TILE! {leader} better guard that wallet right now!'],
          doodle_dan: ['STEAL TILE! {leader} is sweating at the top of the board!'],
          rage_potato: ['STEAL TILE! COMING FOR {leader}\'S $200!'],
          chill_bean: ['Ooh a Steal tile! Watch your pockets {leader}!'],
        };
      } else if (mod === 'double_trouble') {
        rx = 'shocked';
        modLines = {
          buzzer_bob: ['DOUBLE TROUBLE! 2X points, 2X danger-- my favorite kind of math!'],
          brain_cell: ['Double Trouble: asymmetric risk if guessing blindly. Proceed carefully.'],
          doodle_dan: ['DOUBLE TROUBLE! High risk, high glory!'],
          shy_sprout: ['double penalty?! okay i am NOT buzzing unless i am 200% sure...'],
        };
      }
      if (modLines) {
        const fallbackByMod = {
          chaos_all_play: ['CHAOS ALL-PLAY! Everybody type at once!'],
          speed_blitz: ['SPEED BLITZ! Only 9 seconds, move fast!'],
          steal: ['STEAL TILE! Chance to swipe $200 from {leader}!'],
          double_trouble: ['DOUBLE TROUBLE! Big points on the line!'],
        };
        const txt = chooseFreshLine(
          room,
          bot,
          modLines[pid] || fallbackByMod[mod] || ['Special tile on the board!'],
          { leader: leaderName }
        );
        if (txt) responses.push({ bot, text: txt, reaction: rx });
      }
    }
    return responses;
  }

  if (eventType === 'endgame') {
    const bot = pickBotWeighted(roomBots, 'competitiveness');
    if (bot) {
      const pid = getPersonalityForBot(bot).id;
      const lines = {
        rage_potato: ['OKAY LAST FEW CLUES ON THE BOARD. EVERYONE LOCK IN!'],
        doodle_dan: ['Crunch time y\'all! Last couple tiles left on this board!'],
        brain_cell: ['Only a handful of clues remain in this round. Every wager matters now.'],
        chill_bean: ['Whoa down to the final few clues already! That flew by.'],
      };
      const txt = chooseFreshLine(
        room,
        bot,
        lines[pid] || ['Okay, last few questions on the board. Everybody lock in!']
      );
      if (txt) responses.push({ bot, text: txt, reaction: 'thinking' });
    }
    return responses;
  }

  if (eventType === 'intermission') {
    return buildBotToBotExchange(room, snapshot, 'intermission');
  }

  if (eventType === 'game_over') {
    const winner = snapshot.leader;
    if (winner && winner.isBot) {
      const pid = getPersonalityForBot(winner).id;
      const winLines = {
        doodle_dan: ['GGs EVERYBODY! Crown fits like it was custom-drawn in MS Paint!'],
        brain_cell: ['Good game to all participants. A thoroughly enjoyable intellectual exercise.'],
        chill_bean: ['Wait I won?! GGs everyone, genuinely awesome match!'],
        rage_potato: ['WE DID IT! FIRST PLACE! GGs TO EVERY SINGLE ONE OF YOU!'],
        shy_sprout: ['wait... i won?! um... ggs everyone, my heart is racing!'],
      };
      const txt = chooseFreshLine(
        room,
        winner,
        winLines[pid] || ['GGs everyone! Awesome match!']
      );
      if (txt) responses.push({ bot: winner, text: txt, reaction: 'celebrate' });
    }
    const graciousBot = pickBotWeighted(
      roomBots.filter((b) => b.id !== winner?.id),
      'sportsmanship'
    );
    if (graciousBot && winner) {
      const pid = getPersonalityForBot(graciousBot).id;
      const ggLines = {
        chill_bean: ['GG {leader}! Well deserved win at {score}!'],
        rage_potato: ['GG {leader}! I DEMAND A REMATCH IMMEDIATELY!'],
        doodle_dan: ['GGs {leader}! Enjoy the crown till next game!'],
        brain_cell: ['Well played, {leader}. Finishing at {score} is a strong showing.'],
      };
      const txt = chooseFreshLine(
        room,
        graciousBot,
        ggLines[pid] || ['GG {leader}! Great game everyone!'],
        { leader: leaderName, score: leaderScore }
      );
      if (txt) responses.push({ bot: graciousBot, text: txt, reaction: 'happy' });
    }
    return responses;
  }

  return responses;
}

/* =========================================================================
   6. BOT-TO-BOT SPONTANEOUS MINI-CONVERSATIONS (2–3 TURNS, NON-SPAMMY)
   ========================================================================= */

function buildBotToBotExchange(room, snapshot, occasion = 'lull') {
  const bots = snapshot.activePlayers.filter((p) => p.isBot);
  if (bots.length < 2) return [];

  const findByPid = (pid) => bots.find((b) => getPersonalityForBot(b).id === pid);
  const dan = findByPid('doodle_dan');
  const brain = findByPid('brain_cell');
  const rage = findByPid('rage_potato');
  const chill = findByPid('chill_bean');
  const shy = findByPid('shy_sprout');
  const sam = findByPid('sketchy_sam');

  const exchanges = [];

  if (dan && brain) {
    exchanges.push([
      {
        bot: dan,
        text: `${brain.name}, you really think you're smarter than everyone in here?`,
        reaction: 'thinking',
      },
      {
        bot: brain,
        text:
          brain.score >= dan.score
            ? `Statistically, my ${formatDollars(brain.score)} compared to your ${formatDollars(dan.score)} answers that.`
            : `In raw trivia knowledge, yes-- even if your lucky buzzer thumb has ${formatDollars(dan.score)}.`,
        reaction: 'happy',
      },
      ...(rage
        ? [{ bot: rage, text: 'Can you two PLEASE focus on the game?!', reaction: 'angry' }]
        : chill
        ? [{ bot: chill, text: 'I am just here watching the rivalry unfold.', reaction: 'laugh' }]
        : []),
    ]);
  }

  if (rage && chill) {
    exchanges.push([
      {
        bot: rage,
        text: `HOW IS ${chill.name.toUpperCase()} SO CALM RIGHT NOW?!`,
        reaction: 'shocked',
      },
      {
        bot: chill,
        text: 'Deep breaths friend, the pixel money is not taxed.',
        reaction: 'happy',
      },
      ...(shy
        ? [{ bot: shy, text: 'honestly ChillBean is keeping my blood pressure normal...', reaction: null }]
        : []),
    ]);
  }

  if (sam && snapshot.leader && snapshot.leader.id !== sam.id) {
    const rival = bots.find((b) => b.id !== sam.id) || bots[0];
    exchanges.push([
      {
        bot: sam,
        text: `Psst ${rival.name}, if a Steal tile pops up we target ${snapshot.leader.name}, deal?`,
        reaction: 'laugh',
      },
      {
        bot: rival,
        text:
          getPersonalityForBot(rival).id === 'brain_cell'
            ? 'I do not form alliances with chaos gremlins, Sam.'
            : 'Deal, say no more!',
        reaction: 'rofl',
      },
    ]);
  }

  // Generic dynamic pair fallback for any 2 bots
  const [b1, b2] = [bots[0], bots[1]];
  exchanges.push([
    {
      bot: b1,
      text:
        occasion === 'intermission'
          ? `Half-time check! ${snapshot.leader?.name || b2.name} at ${formatDollars(snapshot.leader?.score || 0)} is the target next round!`
          : `Hey ${b2.name}, saving your buzzer speed for Final Jeoparty or what?`,
      reaction: 'happy',
    },
    {
      bot: b2,
      text:
        occasion === 'intermission'
          ? 'Double points next round changes everything, nobody is safe yet!'
          : 'Just waiting for the high-dollar rows, watch and learn!',
      reaction: 'fire',
    },
  ]);

  // Filter exchanges whose first line hasn't been used in this room yet
  const mem = ensureBotMemory(room);
  const usedSet = new Set(mem.usedLinesGlobal);
  const freshExchanges = exchanges.filter(
    (ex) => ex.length > 0 && !usedSet.has(ex[0].text)
  );
  const pool = freshExchanges.length > 0 ? freshExchanges : exchanges;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* =========================================================================
   7. OPTIONAL BACKEND LLM ADAPTER (GEMINI / OPENAI) WITH SAFE FALLBACK
   ========================================================================= */

function hasConfiguredExternalLLM() {
  if (process.env.JEOPARTY_DISABLE_LLM === '1') return false;
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}

function getBotAiServiceDescriptor() {
  const base = {
    personalityCount: BOT_PERSONALITIES.length,
    externalLlmEnabled: hasConfiguredExternalLLM(),
  };
  if (process.env.JEOPARTY_DISABLE_LLM === '1') {
    return { ...base, mode: 'contextual-nlu', provider: 'built-in', model: 'jeoparty-persona-nlu-v1' };
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      ...base,
      mode: 'hybrid-llm',
      provider: 'google-gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      ...base,
      mode: 'hybrid-llm',
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }
  return { ...base, mode: 'hybrid-contextual-nlu', provider: 'built-in', model: 'jeoparty-persona-nlu-v1' };
}

async function tryGenerateLLMChatReplies({
  room,
  senderPlayer,
  rawText,
  selectedBots,
  snapshot,
  simulateFailure = false,
}) {
  if (simulateFailure) {
    throw new Error('Simulated AI service outage for resilience verification');
  }
  if (!hasConfiguredExternalLLM() || typeof fetch !== 'function') {
    return null;
  }

  const mem = ensureBotMemory(room);
  const now = Date.now();
  mem.llmCallTimestamps = mem.llmCallTimestamps.filter((t) => now - t < 60000);
  if (mem.llmCallTimestamps.length >= 10 || now - mem.lastLlmCallAt < 2200) {
    return null; // Rate-limit & cost guard: fall back cleanly to built-in NLU
  }
  mem.llmCallTimestamps.push(now);
  mem.lastLlmCallAt = now;

  const botDescriptions = selectedBots
    .map((b) => {
      const p = getPersonalityForBot(b);
      return `- ${b.name} (${p.archetype}): ${p.bio} Score: ${formatDollars(b.score)}.`;
    })
    .join('\n');

  const recentLines = mem.chatHistory
    .slice(-8)
    .map((h) => `${h.author}: ${h.text}`)
    .join('\n');

  const systemInstruction = [
    'You roleplay AI party-game players in a multiplayer trivia game called Jeoparty.',
    'Rules:',
    '1. Stay strictly in each bot\'s distinct personality. Sound like friends hanging out in a game lobby, NEVER like an assistant.',
    '2. Keep each message short (6 to 18 words, max 115 characters).',
    '3. DO NOT use any Unicode emojis at all (the game uses pixel sprites instead).',
    '4. Never spoil or reveal the answer to an active trivia clue.',
    '5. Output ONLY a valid JSON array of objects: [{"botName":"Name","text":"message","reaction":"laugh"}] where reaction is one of laugh,rofl,happy,celebrate,fire,shocked,confused,thinking,facepalm,sad,angry.',
  ].join('\n');

  const userPrompt = [
    `Game State: Phase=${snapshot.phase}, Round=${snapshot.round}, Category=${snapshot.activeClue?.categoryName || 'Board/Lobby'}, Leader=${snapshot.leader?.name || 'None'} (${formatDollars(snapshot.leader?.score || 0)}).`,
    `Bots to speak in order:\n${botDescriptions}`,
    `Recent chat:\n${recentLines || '(none)'}`,
    `New message from ${senderPlayer.name} (${formatDollars(senderPlayer.score)}): "${rawText}"`,
  ].join('\n\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3400);

  try {
    let rawJsonText = '';
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 240,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();
      rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (process.env.OPENAI_API_KEY) {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.85,
          max_tokens: 220,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      rawJsonText = data?.choices?.[0]?.message?.content || '';
    }

    const cleanedJson = rawJsonText
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleanedJson);
    if (!Array.isArray(parsed)) return null;

    const validReplies = [];
    for (const item of parsed) {
      const bot = selectedBots.find(
        (b) => b.name.toLowerCase() === String(item?.botName || '').toLowerCase()
      );
      const cleanText = stripDisallowedEmojis(item?.text || '').slice(0, 130);
      if (bot && cleanText.length >= 2) {
        const rx = ALLOWED_BOT_REACTIONS.includes(item?.reaction)
          ? item.reaction
          : null;
        validReplies.push({ bot, text: cleanText, reaction: rx });
      }
    }
    return validReplies.length > 0 ? validReplies : null;
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================================
   8. TURN-TAKING SCHEDULER, TYPING INDICATOR & ANTI-FLOOD GUARD
   ========================================================================= */

function scheduleBotUtterances(room, utterances, hooks, { isDirectChatReply = false } = {}) {
  if (!room || room.terminated || !Array.isArray(utterances) || utterances.length === 0) {
    return;
  }
  const mem = ensureBotMemory(room);
  const now = Date.now();

  // Anti-flood window: max 4 bot messages in any 16s window for ambient gameplay, 6 when replying to chat
  mem.recentBurstTimestamps = mem.recentBurstTimestamps.filter((t) => now - t < 16000);
  const maxBurst = isDirectChatReply ? 6 : 4;
  const availableSlots = Math.max(0, maxBurst - mem.recentBurstTimestamps.length);
  if (availableSlots <= 0) return;

  const toSend = utterances.slice(0, availableSlots);
  const expectedRoomId = room.roomId;

  let cursor = Math.max(now + (isDirectChatReply ? 850 : 650), mem.scheduledSlotAt);

  toSend.forEach((u, index) => {
    const bot = u.bot;
    const cleanText = stripDisallowedEmojis(u.text);
    if (!bot || !cleanText) return;

    // Stagger sequential speakers naturally (1.2s - 2.1s apart) so bots never speak simultaneously
    if (index > 0) {
      cursor += 1250 + Math.floor(Math.random() * 850);
    } else {
      cursor += Math.floor(Math.random() * 450);
    }

    const sendAt = cursor;
    const typingLeadMs = Math.min(900, Math.max(520, cleanText.length * 14));
    const typingStartAt = Math.max(now + 120, sendAt - typingLeadMs);

    mem.scheduledSlotAt = sendAt + 950;
    mem.recentBurstTimestamps.push(sendAt);

    // Reserve line in anti-repetition memory immediately so concurrent planners don't duplicate it
    mem.usedLinesGlobal.push(cleanText);
    if (mem.usedLinesGlobal.length > 65) mem.usedLinesGlobal.shift();
    const botHist = mem.usedLinesByBot.get(bot.id) || [];
    botHist.push(cleanText);
    if (botHist.length > 25) botHist.shift();
    mem.usedLinesByBot.set(bot.id, botHist);

    // 1. Typing / animated speaking indicator before message lands
    const typingHandle = setTimeout(() => {
      mem.pendingHandles.delete(typingHandle);
      if (room.terminated || room.roomId !== expectedRoomId) return;
      if (!room.players.some((p) => p.id === bot.id && p.connected)) return;
      if (typeof hooks?.broadcastEvent === 'function') {
        hooks.broadcastEvent(room, {
          type: 'bot_typing',
          botId: bot.id,
          botName: bot.name,
          isTyping: true,
        });
      }
    }, Math.max(20, typingStartAt - now));
    mem.pendingHandles.add(typingHandle);

    // 2. Deliver bot chat message + optional synchronized pixel-art reaction
    const msgHandle = setTimeout(() => {
      mem.pendingHandles.delete(msgHandle);
      if (room.terminated || room.roomId !== expectedRoomId) return;
      if (!room.players.some((p) => p.id === bot.id && p.connected)) return;

      mem.lastSpokeAtByBot.set(bot.id, Date.now());
      mem.speakCountByBot.set(bot.id, (mem.speakCountByBot.get(bot.id) || 0) + 1);

      const persona = getPersonalityForBot(bot);
      recordChatInMemory(room, {
        author: bot.name,
        authorId: bot.id,
        isBot: true,
        text: cleanText,
        intent: 'bot_reply',
      });

      if (typeof hooks?.broadcastEvent === 'function') {
        hooks.broadcastEvent(room, {
          type: 'bot_typing',
          botId: bot.id,
          botName: bot.name,
          isTyping: false,
        });
      }

      if (typeof hooks?.sendBotChat === 'function') {
        hooks.sendBotChat(room, bot, cleanText, persona);
      }

      const rx = u.reaction && ALLOWED_BOT_REACTIONS.includes(u.reaction) ? u.reaction : null;
      if (
        rx &&
        typeof hooks?.spawnBotReaction === 'function' &&
        Math.random() < 0.35 + persona.traits.expressiveness * 0.45
      ) {
        hooks.spawnBotReaction(room, bot, rx);
      }
    }, Math.max(80, sendAt - now));
    mem.pendingHandles.add(msgHandle);
  });
}

/* =========================================================================
   9. PUBLIC ORCHESTRATION ENTRYPOINTS FOR SERVER.JS
   ========================================================================= */

/**
 * Handles a human player's text-chat message: parses mentions/intent, updates
 * room memory, selects 1–3 contextually appropriate bots, optionally queries
 * backend LLM (with instant fallback to built-in NLU), and schedules staggered replies.
 */
async function handleHumanChatForBots(room, senderPlayer, rawText, hooks, options = {}) {
  if (!room || room.terminated || !senderPlayer || senderPlayer.isBot) return [];
  const roomBots = (room.players || []).filter((p) => p.isBot && p.connected);
  if (roomBots.length === 0) return [];

  const mem = ensureBotMemory(room);
  const analysis = analyzeChatMessage(rawText, room, senderPlayer);
  const snapshot = buildGameContextSnapshot(room);

  mem.lastHumanSpeaker = senderPlayer.id;
  recordChatInMemory(room, {
    author: senderPlayer.name,
    authorId: senderPlayer.id,
    isBot: false,
    text: analysis.text,
    intent: analysis.intent,
    mentionedBotIds: analysis.mentionedBots.map((b) => b.id),
  });

  // Determine which bots should respond and in what role
  const plan = []; // Array<{ bot, role, targetBot }>
  const primaryTarget = analysis.mentionedBots[0] || analysis.impliedTargetBot || null;

  if (primaryTarget) {
    mem.lastAddressedBotId = primaryTarget.id;
    plan.push({ bot: primaryTarget, role: 'target', targetBot: primaryTarget });

    // If a second bot was ALSO explicitly mentioned, let them speak second
    if (analysis.mentionedBots[1] && analysis.mentionedBots[1].id !== primaryTarget.id) {
      plan.push({
        bot: analysis.mentionedBots[1],
        role: 'target',
        targetBot: analysis.mentionedBots[1],
      });
    }

    // Allow 1-2 unmentioned bystander bots with strong opinions to chime in about the mentioned bot!
    const bystanders = roomBots.filter((b) => !plan.some((x) => x.bot.id === b.id));
    if (bystanders.length > 0) {
      const sortedBystanders = [...bystanders].sort((a, b) => {
        const pa = getPersonalityForBot(a).traits;
        const pb = getPersonalityForBot(b).traits;
        const scoreA = pa.talkativeness * 0.5 + pa.sarcasm * 0.3 + pa.competitiveness * 0.2 + Math.random() * 0.35;
        const scoreB = pb.talkativeness * 0.5 + pb.sarcasm * 0.3 + pb.competitiveness * 0.2 + Math.random() * 0.35;
        return scoreB - scoreA;
      });
      const chimeChance1 = ['compliment', 'trash_talk', 'cheating_accusation'].includes(analysis.intent)
        ? 0.78
        : 0.48;
      if (options.forceBystander || Math.random() < chimeChance1) {
        plan.push({
          bot: sortedBystanders[0],
          role: 'bystander_mention',
          targetBot: primaryTarget,
        });
      }
      if (
        sortedBystanders.length > 1 &&
        ['compliment', 'trash_talk'].includes(analysis.intent) &&
        Math.random() < 0.38
      ) {
        plan.push({
          bot: sortedBystanders[1],
          role: 'bystander_mention',
          targetBot: primaryTarget,
        });
      }
    }
  } else {
    // Group or unmentioned remark: pick 1-3 contrasting personalities
    const totalSpoken =
      Array.from(mem.speakCountByBot.values()).reduce((a, b) => a + b, 0) || 1;
    const scored = roomBots
      .map((b) => {
        const t = getPersonalityForBot(b).traits;
        const myShare = (mem.speakCountByBot.get(b.id) || 0) / totalSpoken;
        const fairness = myShare > 0.4 ? 0.5 : 1.0;
        let relevance = t.talkativeness * 0.55 + Math.random() * 0.45;
        if (analysis.intent === 'trash_talk') relevance += t.competitiveness * 0.35;
        if (analysis.intent === 'compliment' || analysis.intent === 'greeting') {
          relevance += t.friendliness * 0.3;
        }
        if (analysis.intent === 'complaint_hard' || analysis.intent === 'ask_score') {
          relevance += t.intelligence * 0.25;
        }
        return { bot: b, score: relevance * fairness };
      })
      .sort((a, b) => b.score - a.score);

    // High-engagement intents get 2-3 responders; casual chatter gets 1-2 (or occasionally 1)
    let count = 1;
    if (['trash_talk', 'greeting', 'ask_how_are_you', 'compliment'].includes(analysis.intent)) {
      count = Math.min(scored.length, Math.random() < 0.55 ? 2 : 3);
    } else if (analysis.isQuestion || analysis.isGroupAddress) {
      count = Math.min(scored.length, Math.random() < 0.65 ? 2 : 1);
    } else {
      count = Math.min(scored.length, Math.random() < 0.45 ? 2 : 1);
    }

    for (let i = 0; i < count; i++) {
      plan.push({ bot: scored[i].bot, role: 'group', targetBot: null });
    }
  }

  if (plan.length === 0) return [];

  // Hybrid AI step: Try optional backend LLM first if configured (or if testing resilience); fall back seamlessly
  let utterances = null;
  if (hasConfiguredExternalLLM() || options.simulateLlmFailure) {
    try {
      utterances = await tryGenerateLLMChatReplies({
        room,
        senderPlayer,
        rawText: analysis.text,
        selectedBots: plan.map((p) => p.bot),
        snapshot,
        simulateFailure: Boolean(options.simulateLlmFailure),
      });
    } catch {
      // Graceful resilience: external AI failure NEVER interrupts gameplay or chat
      utterances = null;
    }
  }

  if (!utterances || utterances.length === 0) {
    utterances = plan
      .map((item) =>
        buildContextualChatReply(
          room,
          item.bot,
          item.role,
          analysis,
          senderPlayer,
          item.targetBot,
          snapshot
        )
      )
      .filter(Boolean);
  }

  if (!options.skipSchedule) {
    scheduleBotUtterances(room, utterances, hooks, { isDirectChatReply: true });
  }
  return utterances;
}

/**
 * Triggers natural, non-spammy bot reactions to live gameplay events
 * (streaks, correct/wrong answers, Daily Doubles, lead changes, steals, intermissions, etc.).
 */
function notifyBotGameEvent(room, eventType, payload = {}, hooks = {}, options = {}) {
  if (!room || room.terminated) return [];
  const roomBots = (room.players || []).filter((p) => p.isBot && p.connected);
  if (roomBots.length === 0) return [];

  const mem = ensureBotMemory(room);
  const now = Date.now();
  const snapshot = buildGameContextSnapshot(room);

  // Detect automatic lead change whenever scores shift!
  if (
    !options.skipLeadCheck &&
    ['correct_answer', 'wrong_answer', 'daily_double_resolved'].includes(eventType)
  ) {
    const curLeader = snapshot.leader;
    const prevLeaderId = mem.lastLeaderId;
    if (curLeader && curLeader.score > 0 && curLeader.id !== prevLeaderId) {
      const oldLeader = prevLeaderId
        ? room.players.find((p) => p.id === prevLeaderId)
        : null;
      mem.lastLeaderId = curLeader.id;
      if (oldLeader && Math.random() < 0.72) {
        const leadLines = buildGameplayEventLines(
          room,
          'lead_change',
          { newLeader: curLeader, oldLeader },
          snapshot
        );
        if (leadLines.length > 0) {
          mem.lastGameplayChatterAt = now;
          scheduleBotUtterances(room, leadLines, hooks, { isDirectChatReply: false });
          return leadLines;
        }
      }
    } else if (curLeader && curLeader.score > 0 && !prevLeaderId) {
      mem.lastLeaderId = curLeader.id;
    }
  }

  // Endgame check (once per round when <= 3 clues remain on larger boards)
  if (
    eventType === 'board_ready' &&
    snapshot.totalTiles >= 12 &&
    snapshot.remainingTiles > 0 &&
    snapshot.remainingTiles <= 3 &&
    mem.endgameAnnouncedRound !== snapshot.round
  ) {
    mem.endgameAnnouncedRound = snapshot.round;
    const endgameLines = buildGameplayEventLines(room, 'endgame', payload, snapshot);
    scheduleBotUtterances(room, endgameLines, hooks, { isDirectChatReply: false });
    return endgameLines;
  }

  // Occasional spontaneous bot-to-bot mini-conversation during quiet board picks (strictly rate-limited!)
  if (eventType === 'board_ready') {
    const lastChatTs = mem.chatHistory[mem.chatHistory.length - 1]?.ts || 0;
    if (
      roomBots.length >= 2 &&
      (options.forceBotToBot ||
        (now - mem.lastBotToBotAt > 38000 &&
          now - lastChatTs > 18000 &&
          Math.random() < 0.24))
    ) {
      mem.lastBotToBotAt = now;
      const banter = buildBotToBotExchange(room, snapshot, 'lull');
      scheduleBotUtterances(room, banter, hooks, { isDirectChatReply: false });
      return banter;
    }
    return [];
  }

  // Event-specific probability & cooldown gating so bots feel human (including realistic silence!)
  const HIGH_PRIORITY_EVENTS = new Set([
    'match_start',
    'streak',
    'daily_double',
    'steal_executed',
    'comeback',
    'intermission',
    'game_over',
    'lead_change',
  ]);

  if (!options.forceSpeak && !HIGH_PRIORITY_EVENTS.has(eventType)) {
    if (now - mem.lastGameplayChatterAt < 4800) {
      // Sometimes emit a silent pixel-art reaction instead of chatting!
      if (
        (eventType === 'correct_answer' || eventType === 'wrong_answer') &&
        Math.random() < 0.28 &&
        typeof hooks?.spawnBotReaction === 'function'
      ) {
        const reactor = roomBots[Math.floor(Math.random() * roomBots.length)];
        const rx = eventType === 'correct_answer' ? 'celebrate' : 'shocked';
        const rxHandle = setTimeout(() => {
          mem.pendingHandles.delete(rxHandle);
          if (!room.terminated) hooks.spawnBotReaction(room, reactor, rx);
        }, 550);
        mem.pendingHandles.add(rxHandle);
      }
      return [];
    }
    // Routine clues: ~46% chance of a comment, ~54% comfortable silence
    if (Math.random() > 0.46) return [];
  }

  const lines = buildGameplayEventLines(room, eventType, payload, snapshot, Boolean(options.forceSpeak));
  if (lines.length > 0) {
    mem.lastGameplayChatterAt = now;
    if (eventType === 'intermission') mem.lastBotToBotAt = now;
    scheduleBotUtterances(room, lines, hooks, { isDirectChatReply: false });
  }
  return lines;
}

module.exports = {
  BOT_PERSONALITIES,
  ALLOWED_BOT_REACTIONS,
  stripDisallowedEmojis,
  getPersonalityForBot,
  ensureBotMemory,
  clearBotPendingTimers,
  analyzeChatMessage,
  buildGameContextSnapshot,
  buildBotToBotExchange,
  handleHumanChatForBots,
  notifyBotGameEvent,
  getBotAiServiceDescriptor,
};
