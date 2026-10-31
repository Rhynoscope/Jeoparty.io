import {
  AVATAR_COLORS,
  EYE_COUNT,
  MOUTH_COUNT,
  HAT_COUNT,
  buildAvatarHTML,
  randomAvatar,
} from './avatar.js';
import { sfx } from './audio.js';
import { voiceChat } from './voice.js';

/* =========================================================================
   MODERN WEB GUIDANCE POLYFILLS / FALLBACKS
   ========================================================================= */

// Fallback for <dialog closedby="any"> light-dismiss (modern-web-guidance `dialog`)
function installDialogLightDismissFallback() {
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e, dialog)) dialog.close();
      });
    }
  }

  // Always reset dialog.returnValue on close so Esc doesn't leak stale values
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
    });
  }
}

const supportsCssHas =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('selector(:has(*))');

function syncHasFallbackClass(containerEl, inputEl) {
  if (!supportsCssHas && containerEl && inputEl) {
    containerEl.classList.toggle('is-active', Boolean(inputEl.checked));
  }
}

/* =========================================================================
   54-CATEGORY ANIMATED MS PAINT SPRITES & UI SPRITE HELPERS
   ========================================================================= */

const KNOWN_CATEGORY_IDS = new Set([
  'internet-memes',
  'blockbuster-movies',
  'pop-music',
  'binge-tv',
  'slang-translator',
  'superheroes',
  'cartoons-anime',
  'nostalgia-90s-00s',
  'identify-the-song',
  'video-games',
  'tech-gadgets',
  'minecraft-roblox',
  'nintendo-classics',
  'horror-games',
  'space-reality',
  'everyday-science',
  'freaky-animals',
  'dinosaurs-prehistoric',
  'ocean-deep',
  'human-biology',
  'weather-disasters',
  'chaotic-history',
  'where-is-that',
  'spooky-myths',
  'ancient-civilizations',
  'world-wars-conflicts',
  'world-capitals',
  'flags-of-world',
  'mythology-folklore',
  'dumb-laws',
  'nature-is-broken',
  'internet-brainrot',
  'why-does-this-exist',
  'animals-are-weird',
  'cursed-food',
  'useless-knowledge',
  'terrible-superpowers',
  'game-logic-broken',
  'movies-are-weird',
  'common-sense-test',
  'name-that-nonsense',
  'school-lies',
  'absurd-comparisons',
  'internet-strange',
  'weird-food',
  'riddles-wordplay',
  'sports-records',
  'famous-books',
  'board-games-toys',
  'before-and-after',
  'brands-logos',
  'cars-transport',
  'famous-paintings-art',
  'custom',
]);

function normalizeCategorySpriteId(categoryId) {
  const id = String(categoryId || '').trim();
  if (!id || id.startsWith('custom_')) return 'custom';
  return KNOWN_CATEGORY_IDS.has(id) ? id : 'custom';
}

function getCategorySpriteUrl(categoryId) {
  return `/assets/sprites/categories/${normalizeCategorySpriteId(categoryId)}.png`;
}

function createCategoryPixelIcon(categoryId, sizePx = 22) {
  const span = document.createElement('span');
  span.className = 'cat-pixel-icon';
  span.setAttribute('aria-hidden', 'true');
  span.style.setProperty('--icon-size', `${sizePx}px`);
  span.style.setProperty('--cat-url', `url('${getCategorySpriteUrl(categoryId)}')`);
  return span;
}

function createPixelSprite(spriteClass, extraClass = '') {
  const span = document.createElement('span');
  span.className = `pixel-sprite ${spriteClass}${extraClass ? ` ${extraClass}` : ''}`;
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function setButtonSpriteAndText(btn, spriteClass, labelText) {
  if (!btn) return;
  btn.textContent = '';
  btn.appendChild(createPixelSprite(spriteClass));
  if (labelText) {
    const txt = document.createElement('span');
    txt.textContent = labelText;
    btn.appendChild(txt);
  }
}

/* =========================================================================
   ROOM-SCOPED RECONNECT TOKEN STORAGE (Prevents Stale Match Resumption)
   ========================================================================= */

const ROOM_TOKENS_KEY = 'jeoparty_room_tokens_v2';
// Remove legacy global token key if present from older versions
sessionStorage.removeItem('jeoparty_token');
localStorage.removeItem('jeoparty_token');

function readRoomTokensMap() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(ROOM_TOKENS_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function getRoomToken(roomCode) {
  if (!roomCode) return '';
  const map = readRoomTokensMap();
  return typeof map[roomCode] === 'string' ? map[roomCode] : '';
}

function setRoomToken(roomCode, token) {
  if (!roomCode || !token) return;
  const map = readRoomTokensMap();
  map[roomCode] = token;
  sessionStorage.setItem(ROOM_TOKENS_KEY, JSON.stringify(map));
}

function clearRoomToken(roomCode) {
  if (!roomCode) return;
  const map = readRoomTokensMap();
  if (roomCode in map) {
    delete map[roomCode];
    sessionStorage.setItem(ROOM_TOKENS_KEY, JSON.stringify(map));
  }
}

function popAnySavedRoomToken() {
  const map = readRoomTokensMap();
  const entries = Object.entries(map);
  sessionStorage.removeItem(ROOM_TOKENS_KEY);
  if (entries.length === 0) return null;
  const [roomCode, token] = entries[entries.length - 1];
  return { roomCode, token };
}

/* =========================================================================
   PREFERRED SETTINGS PERSISTENCE (Reused Only as Settings on Fresh Rooms)
   ========================================================================= */

const PREFERRED_SETTINGS_KEY = 'jeoparty_preferred_settings';

function loadPreferredSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERRED_SETTINGS_KEY) || 'null');
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // ignore
  }
  return null;
}

function savePreferredSettingsFromRoom(room) {
  if (!room || !room.settings) return;
  const s = room.settings;
  const cleanBuiltinIds = Array.isArray(s.includedCategoryIds)
    ? s.includedCategoryIds.filter((id) => !String(id).startsWith('custom_'))
    : undefined;

  const pref = {
    answerMode: s.answerMode,
    boardCols: s.boardCols,
    cluesPerCat: s.cluesPerCat,
    clueTimeSec: s.clueTimeSec,
    doubleJeopardy: s.doubleJeopardy,
    dailyDoubles: s.dailyDoubles,
    finalJeopardy: s.finalJeopardy,
    wrongPenalty: s.wrongPenalty,
    includedCategoryIds: cleanBuiltinIds,
  };
  state.preferredSettings = pref;
  localStorage.setItem(PREFERRED_SETTINGS_KEY, JSON.stringify(pref));
}

/* =========================================================================
   APPLICATION STATE
   ========================================================================= */

const state = {
  ws: null,
  connected: false,
  playerId: null,
  pendingAction: null,
  invitedRoomCode: null,
  intentionalLeave: false,
  reconnectTimer: null,

  // Local player profile
  name: localStorage.getItem('jeoparty_name') || '',
  avatar: (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jeoparty_avatar') || 'null');
      if (saved && typeof saved.color === 'number') {
        return {
          color: Math.max(0, Math.min(AVATAR_COLORS.length - 1, Number(saved.color) || 0)),
          eyes: Math.max(0, Math.min(EYE_COUNT - 1, Number(saved.eyes) || 0)),
          mouth: Math.max(0, Math.min(MOUTH_COUNT - 1, Number(saved.mouth) || 0)),
          hat: Math.max(0, Math.min(HAT_COUNT - 1, Number(saved.hat) || 0)),
        };
      }
    } catch {
      // ignore
    }
    return { color: 2, eyes: 0, mouth: 0, hat: 0 };
  })(),

  reduceMotion: localStorage.getItem('jeoparty_reduce_motion') === '1',

  preferredSettings: loadPreferredSettings(),
  builtinCategories: [],
  lanUrls: [],
  publicUrl: null,
  room: null,
  clockOffsetMs: 0,
  categorySearchQuery: '',
  pendingTransferPlayerId: null,
  editingBotId: null,
  editingBotName: '',
  selectedBotDiff: 'medium',
  lastRenderedPhase: null,
  lastTickSecond: -1,
};

/* =========================================================================
   DOM REFERENCES
   ========================================================================= */

const el = {
  toastContainer: document.getElementById('toast-container'),
  homeScreen: document.getElementById('home-screen'),
  gameScreen: document.getElementById('game-screen'),

  // Home utilities & hero
  homeSoundBtn: document.getElementById('home-sound-btn'),
  homeMotionBtn: document.getElementById('home-motion-btn'),
  openHowtoBtn: document.getElementById('open-howto-btn'),
  mascotRow: document.getElementById('home-mascot-row'),
  inviteBanner: document.getElementById('invite-room-banner'),
  inviteCodeLabel: document.getElementById('invite-room-code-label'),
  cancelInviteBtn: document.getElementById('cancel-invite-btn'),
  nameInput: document.getElementById('player-name-input'),
  avatarPreview: document.getElementById('home-avatar-preview'),
  avatarPartHint: document.getElementById('avatar-part-hint'),
  avatarRandomBtn: document.getElementById('avatar-random-btn'),
  playBtn: document.getElementById('play-btn'),
  createPrivateBtn: document.getElementById('create-private-btn'),
  openPublicBrowserBtn: document.getElementById('open-public-browser-btn'),
  openJoinDialogBtn: document.getElementById('open-join-dialog-btn'),
  homeLanBanner: document.getElementById('home-lan-banner'),
  homeLanUrlText: document.getElementById('home-lan-url-text'),
  homeLanCopyBtn: document.getElementById('home-lan-copy-btn'),

  // Topbar
  roomCodePill: document.getElementById('room-code-pill'),
  topbarRoomCode: document.getElementById('topbar-room-code'),
  topbarRoundBadge: document.getElementById('topbar-round-badge'),
  timerBadge: document.getElementById('timer-badge'),
  timerSeconds: document.getElementById('timer-seconds'),
  topbarStatusText: document.getElementById('topbar-status-text'),
  soundToggleBtn: document.getElementById('sound-toggle-btn'),
  motionToggleBtn: document.getElementById('motion-toggle-btn'),
  leaveRoomBtn: document.getElementById('leave-room-btn'),

  // Players sidebar
  playersList: document.getElementById('players-list'),
  hostBotControls: document.getElementById('host-bot-controls'),
  addBotBtn: document.getElementById('add-bot-btn'),

  // Voice Chat Dock
  voiceChatDock: document.getElementById('voice-chat-dock'),
  voiceDockIcon: document.getElementById('voice-dock-icon'),
  voiceDockLabel: document.getElementById('voice-dock-label'),
  voiceDockCount: document.getElementById('voice-dock-count'),
  voiceJoinBtn: document.getElementById('voice-join-btn'),
  voiceMuteBtn: document.getElementById('voice-mute-btn'),
  voiceDeafenBtn: document.getElementById('voice-deafen-btn'),
  voicePttBtn: document.getElementById('voice-ptt-btn'),
  voiceLeaveBtn: document.getElementById('voice-leave-btn'),

  // Audio & Voice Settings Dialog
  audioSettingsBtn: document.getElementById('audio-settings-btn'),
  audioSettingsDialog: document.getElementById('audio-settings-dialog'),
  closeAudioSettingsBtn: document.getElementById('close-audio-settings-btn'),
  settingMasterMute: document.getElementById('setting-master-mute'),
  settingSfxVolume: document.getElementById('setting-sfx-volume'),
  settingSfxVal: document.getElementById('setting-sfx-val'),
  settingMusicVolume: document.getElementById('setting-music-volume'),
  settingMusicVal: document.getElementById('setting-music-val'),
  settingVoiceVolume: document.getElementById('setting-voice-volume'),
  settingVoiceVal: document.getElementById('setting-voice-val'),
  settingVoicePtt: document.getElementById('setting-voice-ptt'),
  settingVoiceAutoMute: document.getElementById('setting-voice-automute'),

  // Mic Permission Dialog
  micHelpDialog: document.getElementById('mic-help-dialog'),
  micHelpMessage: document.getElementById('mic-help-message'),
  micHelpRetryBtn: document.getElementById('mic-help-retry-btn'),
  micHelpCloseBtn: document.getElementById('mic-help-close-btn'),

  // Public matchmaking header button
  createPublicFromHeaderBtn: document.getElementById('create-public-from-header-btn'),

  // Stages
  stageLobby: document.getElementById('stage-lobby'),
  stageBoard: document.getElementById('stage-board'),
  stageClue: document.getElementById('stage-clue'),
  stageIntermission: document.getElementById('stage-intermission'),
  stageFinal: document.getElementById('stage-final'),
  stageGameover: document.getElementById('stage-gameover'),
  intermissionStandings: document.getElementById('intermission-standings'),
  intermissionNextTitle: document.getElementById('intermission-next-title'),
  continueIntermissionBtn: document.getElementById('continue-intermission-btn'),

  // Lobby controls
  lobbyRoomCodeDisplay: document.getElementById('lobby-room-code-display'),
  lobbyRoleBadge: document.getElementById('lobby-role-badge'),
  activeDifficultyIndicator: document.getElementById('active-difficulty-indicator'),
  setAnswerMode: document.getElementById('set-answer-mode'),
  setBoardCols: document.getElementById('set-board-cols'),
  setCluesPerCat: document.getElementById('set-clues-per-cat'),
  setClueTime: document.getElementById('set-clue-time'),
  setDoubleJeopardy: document.getElementById('set-double-jeopardy'),
  setDailyDoubles: document.getElementById('set-daily-doubles'),
  setFinalJeopardy: document.getElementById('set-final-jeopardy'),
  setWrongPenalty: document.getElementById('set-wrong-penalty'),
  includedCounterBadge: document.getElementById('included-counter-badge'),
  openCustomCatBtn: document.getElementById('open-custom-cat-btn'),
  catFilterInput: document.getElementById('cat-filter-input'),
  lobbyCategoriesGrid: document.getElementById('lobby-categories-grid'),
  copyInviteMainBtn: document.getElementById('copy-invite-main-btn'),
  lanHintText: document.getElementById('lan-hint-text'),
  lobbyLeaveBtn: document.getElementById('lobby-leave-btn'),
  guestWaitingDots: document.getElementById('guest-waiting-dots'),
  startGameBtn: document.getElementById('start-game-btn'),

  // Board
  boardTurnBanner: document.getElementById('board-turn-banner'),
  boardGrid: document.getElementById('jeopardy-board-grid'),

  // Clue View
  clueCatIcon: document.getElementById('clue-cat-icon'),
  clueCatName: document.getElementById('clue-cat-name'),
  clueModifierBadge: document.getElementById('clue-modifier-badge'),
  clueValuePill: document.getElementById('clue-value-pill'),
  clueTimerFill: document.getElementById('clue-timer-fill'),
  ddWagerBox: document.getElementById('dd-wager-box'),
  ddStatusMsg: document.getElementById('dd-status-msg'),
  ddControls: document.getElementById('dd-controls'),
  ddWagerRange: document.getElementById('dd-wager-range'),
  ddWagerNumber: document.getElementById('dd-wager-number'),
  ddLockWagerBtn: document.getElementById('dd-lock-wager-btn'),
  clueTextArea: document.getElementById('clue-text-area'),
  cluePromptText: document.getElementById('clue-prompt-text'),
  skribblHintMask: document.getElementById('skribbl-hint-mask'),
  clueInlineFeedback: document.getElementById('clue-inline-feedback'),
  clueFeedbackSprite: document.getElementById('clue-feedback-sprite'),
  clueFeedbackText: document.getElementById('clue-feedback-text'),
  buzzerWrap: document.getElementById('buzzer-wrap'),
  buzzBtn: document.getElementById('buzz-btn'),
  buzzEligibilityNote: document.getElementById('buzz-eligibility-note'),
  buzzedSpectatorBanner: document.getElementById('buzzed-spectator-banner'),
  clueAnswerForm: document.getElementById('clue-answer-form'),
  clueAnswerInput: document.getElementById('clue-answer-input'),
  chaosAnswerForm: document.getElementById('chaos-answer-form'),
  chaosAnswerInput: document.getElementById('chaos-answer-input'),
  chaosStatusMsg: document.getElementById('chaos-status-msg'),
  hostJudgeBox: document.getElementById('host-judge-box'),
  hostRefAnswerText: document.getElementById('host-ref-answer-text'),
  hostRuleCorrectBtn: document.getElementById('host-rule-correct-btn'),
  hostRuleWrongBtn: document.getElementById('host-rule-wrong-btn'),
  clueResultBox: document.getElementById('clue-result-box'),
  resultBadgeSprite: document.getElementById('result-badge-sprite'),
  officialAnswerText: document.getElementById('official-answer-text'),
  clueWinnerLine: document.getElementById('clue-winner-line'),
  nextClueBtn: document.getElementById('next-clue-btn'),

  // Final Jeopardy
  finalCategoryName: document.getElementById('final-category-name'),
  finalWagerStep: document.getElementById('final-wager-step'),
  finalWagerFormWrap: document.getElementById('final-wager-form-wrap'),
  finalWagerRange: document.getElementById('final-wager-range'),
  finalWagerNumber: document.getElementById('final-wager-number'),
  finalLockWagerBtn: document.getElementById('final-lock-wager-btn'),
  finalWagerLockedMsg: document.getElementById('final-wager-locked-msg'),
  finalClueStep: document.getElementById('final-clue-step'),
  finalClueText: document.getElementById('final-clue-text'),
  finalAnswerForm: document.getElementById('final-answer-form'),
  finalAnswerInput: document.getElementById('final-answer-input'),
  finalAnswerLockedMsg: document.getElementById('final-answer-locked-msg'),
  finalPlayersLockStatus: document.getElementById('final-players-lock-status'),

  // Game Over / Podium
  podiumStage: document.getElementById('podium-stage'),
  finalBreakdownWrap: document.getElementById('final-breakdown-wrap'),
  finalRevealAnswer: document.getElementById('final-reveal-answer'),
  finalBreakdownList: document.getElementById('final-breakdown-list'),
  superlativesSection: document.getElementById('superlatives-section'),
  superlativesGrid: document.getElementById('superlatives-grid'),
  reactionParticlesContainer: document.getElementById('reaction-particles-container'),
  playAgainBtn: document.getElementById('play-again-btn'),
  backToLobbyBtn: document.getElementById('back-to-lobby-btn'),
  gameoverLeaveBtn: document.getElementById('gameover-leave-btn'),

  // Chat
  chatMessages: document.getElementById('chat-messages'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),

  // Native Dialogs
  joinCodeDialog: document.getElementById('join-code-dialog'),
  joinCodeForm: document.getElementById('join-code-form'),
  joinCodeInput: document.getElementById('join-code-input'),
  closeJoinDialogBtn: document.getElementById('close-join-dialog-btn'),
  howtoDialog: document.getElementById('howto-dialog'),
  roomEndedDialog: document.getElementById('room-ended-dialog'),
  roomEndedMessage: document.getElementById('room-ended-message'),
  transferHostDialog: document.getElementById('transfer-host-dialog'),
  transferTargetName: document.getElementById('transfer-target-name'),
  confirmTransferBtn: document.getElementById('confirm-transfer-btn'),
  cancelTransferBtn: document.getElementById('cancel-transfer-btn'),
  closeTransferDialogX: document.getElementById('close-transfer-dialog-x'),
  customCatDialog: document.getElementById('custom-cat-dialog'),
  customCatForm: document.getElementById('custom-cat-form'),
  customCatTitle: document.getElementById('custom-cat-title'),
  cancelCustomCatBtn: document.getElementById('cancel-custom-cat-btn'),
  publicRoomsDialog: document.getElementById('public-rooms-dialog'),
  refreshPublicRoomsBtn: document.getElementById('refresh-public-rooms-btn'),
  closePublicRoomsBtn: document.getElementById('close-public-rooms-btn'),
  createPublicFromDialogBtn: document.getElementById('create-public-from-dialog-btn'),
  publicRoomsContainer: document.getElementById('public-rooms-container'),
  publicRoomsEmpty: document.getElementById('public-rooms-empty'),
  publicRoomsList: document.getElementById('public-rooms-list'),

  // Individual Bot Settings Dialog
  botSettingsDialog: document.getElementById('bot-settings-dialog'),
  botSettingsName: document.getElementById('bot-settings-name'),
  closeBotSettingsX: document.getElementById('close-bot-settings-x'),
  cancelBotSettingsBtn: document.getElementById('cancel-bot-settings-btn'),
  applyBotSettingsBtn: document.getElementById('apply-bot-settings-btn'),
  botModalDiffBtns: document.querySelectorAll('.bot-modal-diff-btn'),
};

/* =========================================================================
   UTILITIES & ACCESSIBILITY CONTROLS
   ========================================================================= */

function showToast(text, variant = 'info', spriteClass = '') {
  const item = document.createElement('div');
  item.className = `toast-item ${
    variant === 'error' ? 'is-error' : variant === 'success' ? 'is-success' : ''
  }`;
  if (spriteClass) {
    item.appendChild(createPixelSprite(spriteClass, 'chat-inline-sprite'));
  }
  const span = document.createElement('span');
  span.textContent = text;
  item.appendChild(span);
  el.toastContainer.appendChild(item);
  setTimeout(() => {
    item.remove();
  }, 3400);
}

function showRoomEndedModal(message) {
  el.roomEndedMessage.textContent =
    message || 'The host left the game, so this match has ended.';
  if (!el.roomEndedDialog.open) {
    el.roomEndedDialog.showModal();
  }
}

function formatCash(amount) {
  const n = Number(amount) || 0;
  if (n < 0) return `-$${Math.abs(n).toLocaleString()}`;
  return `$${n.toLocaleString()}`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function saveProfile() {
  state.name = el.nameInput.value.trim();
  localStorage.setItem('jeoparty_name', state.name);
  localStorage.setItem('jeoparty_avatar', JSON.stringify(state.avatar));
}

function syncSoundButtons() {
  const muted = sfx.muted;
  const sprite = muted ? 'sprite-sound-off' : 'sprite-sound-on';
  const label = muted ? 'Sound: Off' : 'Sound: On';
  setButtonSpriteAndText(el.homeSoundBtn, sprite, label);
  setButtonSpriteAndText(el.soundToggleBtn, sprite, label);
}

function applyMotionPreference() {
  document.body.classList.toggle('reduce-motion', state.reduceMotion);
  document.body.classList.toggle('allow-motion', !state.reduceMotion);
  setButtonSpriteAndText(
    el.homeMotionBtn,
    'sprite-anim-star',
    state.reduceMotion ? 'Animations: Off' : 'Animations: On'
  );
  setButtonSpriteAndText(
    el.motionToggleBtn,
    'sprite-anim-star',
    state.reduceMotion ? 'Anim: Off' : 'Anim: On'
  );
}

function toggleMotionPreference() {
  state.reduceMotion = !state.reduceMotion;
  localStorage.setItem('jeoparty_reduce_motion', state.reduceMotion ? '1' : '0');
  applyMotionPreference();
}

function getInviteUrl(code) {
  let baseUrl = window.location.origin;
  // If accessing via localhost on PC, prioritize PUBLIC_URL if configured,
  // or fall back to PC's Wi-Fi LAN IP so friends on phones/remote can join!
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    if (state.publicUrl && typeof state.publicUrl === 'string') {
      baseUrl = state.publicUrl;
    } else if (state.lanUrls && state.lanUrls.length > 0) {
      baseUrl = state.lanUrls[0];
    }
  }
  const url = new URL(baseUrl);
  url.pathname = '/';
  url.search = `?room=${encodeURIComponent(code)}`;
  return url.toString();
}

// Expose helper on window for test verification
window.getInviteUrl = getInviteUrl;

function syncHomeLanBanner() {
  if (!el.homeLanBanner || !el.homeLanUrlText) return;
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocal) {
    if (state.publicUrl) {
      el.homeLanBanner.hidden = false;
      el.homeLanUrlText.textContent = state.publicUrl;
      const sub = el.homeLanBanner.querySelector('.home-lan-sub');
      if (sub) sub.textContent = 'Worldwide Online link:';
      const badge = el.homeLanBanner.querySelector('.home-lan-badge');
      if (badge) setButtonSpriteAndText(badge, 'sprite-globe', 'PUBLIC');
    } else if (state.lanUrls && state.lanUrls.length > 0) {
      el.homeLanBanner.hidden = false;
      el.homeLanUrlText.textContent = state.lanUrls[0];
      const sub = el.homeLanBanner.querySelector('.home-lan-sub');
      if (sub) sub.textContent = 'Connect phone on same Wi-Fi:';
      const badge = el.homeLanBanner.querySelector('.home-lan-badge');
      if (badge) setButtonSpriteAndText(badge, 'sprite-phone', 'PHONE');
    } else {
      el.homeLanBanner.hidden = true;
    }
  } else {
    // Loaded over public website/domain directly
    el.homeLanBanner.hidden = true;
  }
}

async function copyText(str, label = 'Invite link') {
  try {
    await navigator.clipboard.writeText(str);
    sfx.play('pop');
    showToast(`${label} copied to clipboard!`, 'success');
  } catch {
    window.prompt(`Copy ${label}:`, str);
  }
}

/* =========================================================================
   HOME SCREEN INITIALIZATION
   ========================================================================= */

function renderHomeMascots() {
  // 8 distinct MS Paint cartoon personalities with live multi-state moods!
  const lineup = [
    { color: 0, eyes: 3, mouth: 6, hat: 3, crown: false, mood: 'excited' },
    { color: 1, eyes: 1, mouth: 0, hat: 0, crown: false, mood: 'happy' },
    { color: 2, eyes: 8, mouth: 4, hat: 1, crown: false, mood: 'idle' },
    { color: 3, eyes: 4, mouth: 14, hat: 0, crown: false, mood: 'happy' },
    { color: 4, eyes: 5, mouth: 9, hat: 9, crown: false, mood: 'idle' },
    { color: 18, eyes: 6, mouth: 12, hat: 0, crown: false, mood: 'excited' },
    { color: 6, eyes: 11, mouth: 11, hat: 5, crown: false, mood: 'happy' },
    { color: 7, eyes: 1, mouth: 2, hat: 0, crown: true, mood: 'victory' },
  ];
  el.mascotRow.innerHTML = lineup
    .map(
      (m, idx) =>
        `<div class="home-mascot-item">${buildAvatarHTML(m, {
          crown: m.crown,
          size: 44,
          mood: m.mood,
          delaySec: idx * 0.24,
        })}</div>`
    )
    .join('');
}

function renderHomeAvatarPreview(hintText = '') {
  el.avatarPreview.innerHTML = buildAvatarHTML(state.avatar, {
    size: 104,
    crown: false,
    delaySec: 0,
  });
  if (hintText) {
    el.avatarPartHint.textContent = hintText;
  } else {
    const colorName = AVATAR_COLORS[state.avatar.color]?.name || 'Buddy';
    el.avatarPartHint.textContent = colorName;
  }
}

function checkUrlInviteParam() {
  const params = new URLSearchParams(window.location.search);
  let code = (params.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code && window.location.pathname.startsWith('/room/')) {
    code = window.location.pathname.replace('/room/', '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  if (code && !state.room) {
    state.invitedRoomCode = code;
    el.inviteBanner.hidden = false;
    el.inviteCodeLabel.textContent = `#${code}`;
    el.playBtn.textContent = `Join Room #${code}`;
  } else {
    state.invitedRoomCode = null;
    el.inviteBanner.hidden = true;
    el.playBtn.textContent = 'Play!';
  }
}

async function loadInitialServerMetadata() {
  try {
    const [catRes, infoRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/server-info'),
    ]);
    if (catRes.ok) {
      const data = await catRes.json();
      state.builtinCategories = data.categories || [];
    }
    if (infoRes.ok) {
      const info = await infoRes.json();
      state.lanUrls = info.lanUrls || [];
      state.publicUrl = info.publicUrl || null;
      syncHomeLanBanner();
    }
  } catch {
    // Server connecting
  }
}

function renderPublicRooms(roomList) {
  if (!el.publicRoomsList || !el.publicRoomsEmpty) return;
  if (!Array.isArray(roomList) || roomList.length === 0) {
    el.publicRoomsEmpty.hidden = false;
    el.publicRoomsList.hidden = true;
    el.publicRoomsList.innerHTML = '';
    return;
  }
  el.publicRoomsEmpty.hidden = true;
  el.publicRoomsList.hidden = false;
  el.publicRoomsList.innerHTML = '';

  for (const r of roomList) {
    const card = document.createElement('div');
    card.className = 'public-room-card';

    const info = document.createElement('div');
    info.className = 'public-room-info';

    const titleRow = document.createElement('div');
    titleRow.className = 'public-room-title';

    const codeTag = document.createElement('span');
    codeTag.className = 'room-code-tag';
    codeTag.textContent = r.code;

    const hostTag = document.createElement('span');
    hostTag.className = 'host-tag';
    hostTag.textContent = `Host: ${r.hostName || 'Host'}`;

    titleRow.appendChild(codeTag);
    titleRow.appendChild(hostTag);

    const metaRow = document.createElement('div');
    metaRow.className = 'public-room-meta';

    const countSpan = document.createElement('span');
    setButtonSpriteAndText(
      countSpan,
      'sprite-users',
      `${r.playerCount} / ${r.maxPlayers || 10} Players`
    );

    const statusSpan = document.createElement('span');
    setButtonSpriteAndText(
      statusSpan,
      'sprite-mod-blitz',
      r.status || 'Waiting in Lobby'
    );

    const catSpan = document.createElement('span');
    setButtonSpriteAndText(
      catSpan,
      'sprite-books',
      `${r.categoryCount || 5} Categories`
    );

    metaRow.appendChild(countSpan);
    metaRow.appendChild(statusSpan);
    metaRow.appendChild(catSpan);

    info.appendChild(titleRow);
    info.appendChild(metaRow);

    const joinBtn = document.createElement('button');
    joinBtn.type = 'button';
    joinBtn.className = 'btn-skribbl btn-green btn-sm';
    joinBtn.textContent = 'Join Game';
    joinBtn.onclick = () => {
      sfx.play('click');
      if (el.publicRoomsDialog && typeof el.publicRoomsDialog.close === 'function') {
        el.publicRoomsDialog.close();
      }
      sendActionWithProfile({
        type: 'join_room',
        code: r.code,
      });
    };

    card.appendChild(info);
    card.appendChild(joinBtn);
    el.publicRoomsList.appendChild(card);
  }
}

async function fetchAndRenderPublicRooms() {
  try {
    const res = await fetch('/api/public-rooms', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch rooms');
    const data = await res.json();
    renderPublicRooms(data.rooms || []);
  } catch (err) {
    console.error('Error fetching public rooms:', err);
  }
}

/* =========================================================================
   WEBSOCKET CONNECTION & ROOM LIFECYCLE
   ========================================================================= */

function ensureSocketConnected() {
  if (state.ws && state.connected && state.ws.readyState === WebSocket.OPEN) return;
  if (state.ws && state.ws.readyState === WebSocket.CONNECTING) return;

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${window.location.host}`);
  state.ws = ws;

  ws.addEventListener('open', () => {
    if (state.ws !== ws) return;
    state.connected = true;
    if (state.pendingAction) {
      const act = state.pendingAction;
      state.pendingAction = null;
      sendWs(act);
    }
  });

  ws.addEventListener('message', (ev) => {
    if (state.ws !== ws) return;
    try {
      const msg = JSON.parse(ev.data);
      handleServerMessage(msg);
    } catch {
      // ignore malformed frames
    }
  });

  ws.addEventListener('close', () => {
    if (state.ws !== ws) return;
    state.connected = false;

    // Only attempt temporary reconnect if we were unexpectedly disconnected mid-room
    if (!state.intentionalLeave && !el.gameScreen.hidden && state.room) {
      const activeCode = state.room.code;
      const roomToken = getRoomToken(activeCode);
      if (!activeCode || !roomToken) return;

      showToast('Connection interrupted — reconnecting...', 'error');
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = setTimeout(() => {
        if (!state.intentionalLeave && !el.gameScreen.hidden && state.room?.code === activeCode) {
          sendActionWithProfile(
            {
              type: 'join_room',
              code: activeCode,
            },
            { roomCodeForToken: activeCode }
          );
        }
      }, 1400);
    }
  });
}

function sendWs(payload) {
  if (state.ws && state.connected && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(payload));
  } else {
    state.pendingAction = payload;
    ensureSocketConnected();
  }
}

function sendActionWithProfile(actionObj, { roomCodeForToken = null } = {}) {
  saveProfile();
  const chosenName =
    state.name || `Player${Math.floor(100 + Math.random() * 899)}`;

  const payload = {
    ...actionObj,
    name: chosenName,
    avatar: state.avatar,
  };

  if (roomCodeForToken) {
    const savedTok = getRoomToken(roomCodeForToken);
    if (savedTok) payload.token = savedTok;
  }

  sendWs(payload);
}

/**
 * Starts a brand-new room session (Quick Play or Private Room).
 * Clears any previous room tokens, closes any abandoned room if applicable,
 * and forwards only preferred settings (never old scores, boards, or tokens).
 */
function startFreshRoomSession(actionType, extraPayload = {}) {
  clearTimeout(state.reconnectTimer);
  state.intentionalLeave = false;
  state.room = null;
  state.lastRenderedPhase = null;

  const abandoned = popAnySavedRoomToken();
  const cleanUrl = new URL(window.location.href);
  cleanUrl.search = '';
  window.history.replaceState({}, '', cleanUrl);
  state.invitedRoomCode = null;

  sendActionWithProfile({
    type: actionType, // 'quick_play' | 'create_private'
    preferredSettings: state.preferredSettings || null,
    abandonedRoomCode: abandoned ? abandoned.roomCode : null,
    abandonedToken: abandoned ? abandoned.token : null,
    ...extraPayload,
  });
}

/**
 * Intentionally leaves the active room or lobby and returns to the Main Menu.
 * If this player is the host, the server terminates the match for all players.
 */
function leaveActiveRoomToMenu() {
  clearTimeout(state.reconnectTimer);
  state.intentionalLeave = true;
  if (state.room?.code) {
    clearRoomToken(state.room.code);
  }
  popAnySavedRoomToken();

  if (state.ws && state.connected && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify({ type: 'leave_room' }));
  }
  returnToHomeScreen({ clearInvite: true });
}

function handleServerMessage(msg) {
  if (msg.type && msg.type.startsWith('voice_')) {
    voiceChat.handleVoiceMessage(msg);
    if (state.room) {
      renderPlayersSidebar(state.room, isMeHost(state.room));
    }
    return;
  }

  switch (msg.type) {
    case 'joined': {
      clearTimeout(state.reconnectTimer);
      state.intentionalLeave = false;
      state.playerId = msg.playerId;
      setRoomToken(msg.roomCode, msg.token);

      if (el.customCatDialog.open) el.customCatDialog.close();
      if (el.joinCodeDialog.open) el.joinCodeDialog.close();
      if (el.publicRoomsDialog && el.publicRoomsDialog.open) el.publicRoomsDialog.close();

      el.homeScreen.hidden = true;
      el.gameScreen.hidden = false;
      if (!msg.reconnected) {
        el.chatMessages.innerHTML = '';
      }

      const nextUrl = new URL(window.location.href);
      nextUrl.search = `?room=${encodeURIComponent(msg.roomCode)}`;
      window.history.replaceState({ roomCode: msg.roomCode }, '', nextUrl);
      break;
    }

    case 'left_room': {
      if (msg.roomCode) clearRoomToken(msg.roomCode);
      returnToHomeScreen({ clearInvite: true });
      break;
    }

    case 'public_rooms_list': {
      renderPublicRooms(msg.rooms || []);
      break;
    }

    case 'room_closed': {
      voiceChat.leaveVoice(false);
      sfx.play('timeout');
      if (msg.roomCode) clearRoomToken(msg.roomCode);
      popAnySavedRoomToken();
      state.intentionalLeave = true;
      returnToHomeScreen({ clearInvite: true });
      showRoomEndedModal(
        msg.message || 'The host left the game, so this match has ended.'
      );
      break;
    }

    case 'room_terminated': {
      voiceChat.leaveVoice(false);
      sfx.play('wrong');
      if (msg.roomCode) clearRoomToken(msg.roomCode);
      state.intentionalLeave = true;
      returnToHomeScreen({ clearInvite: true });
      showRoomEndedModal(
        msg.message || 'That match has already ended. Create a new room to play!'
      );
      break;
    }

    case 'room_not_found': {
      sfx.play('wrong');
      if (msg.roomCode) clearRoomToken(msg.roomCode);
      state.intentionalLeave = true;
      returnToHomeScreen({ clearInvite: true });
      showToast(
        msg.message || 'That room was not found or has already closed.',
        'error'
      );
      break;
    }

    case 'kicked': {
      if (msg.roomCode) clearRoomToken(msg.roomCode);
      state.intentionalLeave = true;
      showToast(msg.message || 'Removed from room', 'error');
      returnToHomeScreen({ clearInvite: true });
      break;
    }

    case 'error': {
      sfx.play('wrong');
      showToast(msg.message || 'Something went wrong', 'error');
      break;
    }

    case 'host_transferred': {
      sfx.play('daily_double');
      if (msg.newHostId === state.playerId) {
        showToast('You are now the Room Host!', 'gold', 'sprite-crown');
      } else {
        showToast(
          `${msg.newHostName || 'Another player'} is now the Room Host!`,
          'info',
          'sprite-crown'
        );
      }
      break;
    }

    case 'sfx': {
      sfx.play(msg.sound);
      break;
    }

    case 'reaction_spawn': {
      sfx.play('reaction');
      if (msg.playerId !== state.playerId) {
        spawnReactionParticle(msg.reaction || msg.emoji, msg.playerName);
      }
      break;
    }

    case 'chat': {
      appendChatMessage(msg.message);
      break;
    }

    case 'room_state': {
      // Ignore stale state packets if we intentionally left or room mismatches
      if (state.intentionalLeave) return;
      state.room = msg.room;
      if (typeof msg.room.serverNow === 'number') {
        state.clockOffsetMs = msg.room.serverNow - Date.now();
      }
      if (isMeHost(msg.room) && msg.room.phase === 'lobby') {
        savePreferredSettingsFromRoom(msg.room);
      }
      renderRoomState();
      break;
    }
  }
}

function returnToHomeScreen({ clearInvite = true } = {}) {
  clearTimeout(state.reconnectTimer);
  voiceChat.leaveVoice(false);
  sfx.stopWaitingMusic();
  state.room = null;
  state.lastRenderedPhase = null;
  el.timerBadge.hidden = true;
  if (el.customCatDialog.open) el.customCatDialog.close();

  el.gameScreen.hidden = true;
  el.homeScreen.hidden = false;

  if (clearInvite) {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.search = '';
    window.history.replaceState({}, '', cleanUrl);
  }
  checkUrlInviteParam();
}

/* =========================================================================
   CHAT FEED RENDERING
   ========================================================================= */

const CHAT_ICON_SPRITES = {
  blitz: 'sprite-mod-blitz',
  steal: 'sprite-mod-steal',
  chaos: 'sprite-mod-chaos',
  double: 'sprite-mod-double',
  fire: 'sprite-fire',
  crown: 'sprite-crown',
  gear: 'sprite-gear',
  trophy: 'sprite-medal',
  target: 'sprite-target',
  correct: 'sprite-check',
  wrong: 'sprite-close-x',
  bot: 'sprite-bot',
  coffee: 'sprite-preset-everyday',
  rocket: 'sprite-rocket',
};

function appendChatMessage(m) {
  if (!m) return;
  const div = document.createElement('div');
  div.className = `chat-line c-${m.color || 'chat'}${m.color === 'bot' ? ' chat-msg-bot' : ''}`;

  if (m.icon && CHAT_ICON_SPRITES[m.icon]) {
    div.appendChild(createPixelSprite(CHAT_ICON_SPRITES[m.icon], 'chat-inline-sprite'));
  }

  if (m.kind === 'chat' && m.author) {
    const authorSpan = document.createElement('span');
    authorSpan.className = 'chat-author';
    authorSpan.textContent = `${m.author}: `;
    const textSpan = document.createElement('span');
    textSpan.textContent = m.text;
    div.append(authorSpan, textSpan);
  } else {
    const textSpan = document.createElement('span');
    textSpan.textContent = m.text;
    div.appendChild(textSpan);
  }

  el.chatMessages.appendChild(div);
  el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
}

/* =========================================================================
   ROOM & ARENA RENDERING
   ========================================================================= */

function isMeHost(room) {
  return Boolean(room && room.hostId === state.playerId);
}
window.state = state;
window.isMeHost = isMeHost;

function findPlayer(room, id) {
  return room?.players?.find((p) => p.id === id) || null;
}

function renderRoomState() {
  const room = state.room;
  if (!room) return;

  const amHost = isMeHost(room);
  const phaseChanged = state.lastRenderedPhase !== room.phase;
  state.lastRenderedPhase = room.phase;

  // 1. Clean Topbar
  el.topbarRoomCode.textContent = room.code;
  if (room.hostReconnecting) {
    el.topbarStatusText.textContent = 'Host disconnected — waiting to reconnect...';
  } else if (room.phase === 'lobby') {
    el.topbarRoundBadge.textContent = room.isPrivate ? 'Private Lobby' : 'Lobby';
    el.topbarStatusText.textContent = amHost
      ? 'Select categories & press Start Game'
      : 'Waiting for host to start...';
  } else if (room.phase === 'game_over') {
    el.topbarRoundBadge.textContent = 'Results';
    el.topbarStatusText.textContent = 'Final Standings';
  } else if (room.phase.startsWith('final_')) {
    el.topbarRoundBadge.textContent = 'Final Jeoparty';
    el.topbarStatusText.textContent =
      room.phase === 'final_wager'
        ? 'Lock in your secret wager'
        : 'Type your final answer';
  } else {
    el.topbarRoundBadge.textContent =
      room.round === 2 ? 'Round 2 (2x)' : 'Round 1';
    if (room.phase === 'board') {
      const picker = findPlayer(room, room.pickerId);
      el.topbarStatusText.textContent =
        room.pickerId === state.playerId
          ? 'Your turn to pick a clue!'
          : `${picker ? picker.name : 'Player'} is picking a clue...`;
    } else if (room.activeClue) {
      el.topbarStatusText.textContent = `${room.activeClue.categoryName} • ${formatCash(
        room.activeClue.value
      )}`;
    }
  }

  // 2. Left Players Scoreboard
  renderPlayersSidebar(room, amHost);

  // 3. Center Stage Panel Visibility
  const showLobby = room.phase === 'lobby';
  const showBoard = room.phase === 'board';
  const showClue = [
    'daily_double_wager',
    'daily_double_answer',
    'clue_open',
    'clue_buzzed',
    'clue_chaos',
    'clue_skribbl',
    'clue_result',
  ].includes(room.phase);
  const showIntermission = room.phase === 'round_intermission';
  const showFinal = room.phase === 'final_wager' || room.phase === 'final_clue';
  const showGameover = room.phase === 'game_over';

  el.stageLobby.hidden = !showLobby;
  el.stageBoard.hidden = !showBoard;
  el.stageClue.hidden = !showClue;
  if (el.stageIntermission) el.stageIntermission.hidden = !showIntermission;
  el.stageFinal.hidden = !showFinal;
  el.stageGameover.hidden = !showGameover;

  if (showLobby) renderLobbyStage(room, amHost);
  if (showBoard) renderBoardStage(room);
  if (showClue) renderClueStage(room, amHost, phaseChanged);
  if (showIntermission) renderIntermissionStage(room);
  if (showFinal) renderFinalStage(room, phaseChanged);
  if (showGameover) renderGameoverStage(room, amHost);

  // Synchronize Voice Chat Dock Visibility
  if (el.voiceChatDock) {
    el.voiceChatDock.hidden = room.phase === 'terminated';
  }

  // Synchronize Authentic Jeopardy Waiting / Think Music
  const WAITING_MUSIC_PHASES = ['clue_reading', 'clue_open', 'clue_chaos', 'clue_skribbl', 'daily_double_answer', 'final_clue'];
  if (WAITING_MUSIC_PHASES.includes(room.phase)) {
    if (room.phase === 'clue_buzzed') {
      sfx.stopWaitingMusic();
    } else if (room.activeClue) {
      const clueKey = `${room.phase}_${room.activeClue.col}_${room.activeClue.row}`;
      sfx.startWaitingMusic(clueKey);
    } else if (room.phase === 'final_clue') {
      sfx.startWaitingMusic('final_clue');
    }
  } else {
    sfx.stopWaitingMusic();
  }


  el.chatInput.placeholder =
    room.phase === 'clue_skribbl'
      ? 'Type your answer guess here...'
      : 'Type to chat...';
}

function renderPlayersSidebar(room, amHost) {
  const ranked =
    room.phase === 'lobby'
      ? [...room.players]
      : [...room.players].sort((a, b) => b.score - a.score);

  const topScore = ranked[0]?.score ?? 0;

  el.playersList.innerHTML = '';
  ranked.forEach((p, idx) => {
    const row = document.createElement('div');
    const isBuzzed = room.activeClue?.buzzedPlayerId === p.id;
    const isSolved =
      room.activeClue?.solvedIds?.includes(p.id) ||
      room.activeClue?.chaosSolvedIds?.includes(p.id);
    const isOnFire = p.onFire || p.streak >= 2;
    row.className = [
      'player-row',
      p.id === state.playerId ? 'is-me' : '',
      isBuzzed ? 'is-buzzed' : '',
      isSolved ? 'is-solved' : '',
      isOnFire ? 'is-on-fire' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const rankEl = document.createElement('div');
    rankEl.className = 'player-rank';
    rankEl.textContent = `#${idx + 1}`;

    const infoEl = document.createElement('div');
    infoEl.className = 'player-info';

    const nameLine = document.createElement('div');
    nameLine.className = `player-name-line ${
      p.id === state.playerId ? 'is-me-name' : ''
    }`;

    if (p.id === room.hostId) {
      const crownIcon = document.createElement('span');
      crownIcon.className = 'pixel-sprite sprite-crown';
      crownIcon.setAttribute('aria-hidden', 'true');
      nameLine.appendChild(crownIcon);
    }

    const nameText = document.createElement('span');
    nameText.className = 'player-name-text';
    nameText.textContent = p.name;
    nameLine.appendChild(nameText);

    if (p.id === state.playerId) {
      const youTag = document.createElement('span');
      youTag.className = 'player-self-tag';
      youTag.textContent = '(You)';
      nameLine.appendChild(youTag);
    }

    if (p.isBot) {
      const diff = (p.botDifficulty || room.settings?.botDifficulty || 'medium').toLowerCase();
      const botCluster = document.createElement('span');
      botCluster.className = 'player-bot-cluster';

      const diffTag = document.createElement('span');
      diffTag.className = `bot-diff-tag diff-${diff}`;
      diffTag.textContent = diff.toUpperCase();
      diffTag.title = `Bot difficulty: ${diff.toUpperCase()}`;
      botCluster.appendChild(diffTag);

      if (amHost) {
        const gearBtn = document.createElement('button');
        gearBtn.type = 'button';
        gearBtn.className = 'bot-gear-btn';
        gearBtn.title = `Configure ${p.name}'s difficulty`;
        gearBtn.setAttribute('aria-label', `Configure ${p.name}'s difficulty`);
        gearBtn.appendChild(createPixelSprite('sprite-gear'));
        gearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openBotSettingsModal(p);
        });
        botCluster.appendChild(gearBtn);
      }
      nameLine.appendChild(botCluster);
    }

    if (isOnFire) {
      const streakBadge = document.createElement('span');
      streakBadge.className = 'player-streak-badge';
      streakBadge.appendChild(createPixelSprite('sprite-fire'));
      const streakTxt = document.createElement('span');
      streakTxt.textContent = `x${p.streak || 2}`;
      streakBadge.appendChild(streakTxt);
      nameLine.appendChild(streakBadge);
    }

    // Real-Time Voice Chat Status Indicator & Individual Peer Controls
    if (p.inVoice) {
      const voiceBadge = document.createElement('span');
      const isSpeaking = p.voiceSpeaking || (p.id === state.playerId && voiceChat.isSpeaking);
      voiceBadge.className = `player-voice-badge ${isSpeaking ? 'is-speaking' : ''}`;
      voiceBadge.title = isSpeaking
        ? `${p.name} is speaking`
        : (p.voiceMuted ? `${p.name} is muted` : `${p.name} is in voice chat`);
      voiceBadge.appendChild(
        createPixelSprite(
          isSpeaking ? 'sprite-mic-speaking' : (p.voiceMuted ? 'sprite-mic-muted' : 'sprite-mic-on')
        )
      );
      nameLine.appendChild(voiceBadge);

      if (p.id !== state.playerId && !p.isBot) {
        const peerMuteBtn = document.createElement('button');
        peerMuteBtn.type = 'button';
        peerMuteBtn.className = 'player-peer-mute-btn';
        const isMutedByMe = voiceChat.peerMutes.get(p.id) || false;
        peerMuteBtn.title = isMutedByMe ? `Unmute ${p.name}` : `Mute ${p.name}`;
        peerMuteBtn.setAttribute('aria-label', peerMuteBtn.title);
        peerMuteBtn.appendChild(
          createPixelSprite(isMutedByMe ? 'sprite-speaker-off' : 'sprite-speaker-on')
        );
        peerMuteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const mutedNow = voiceChat.togglePeerMute(p.id);
          peerMuteBtn.textContent = '';
          peerMuteBtn.appendChild(
            createPixelSprite(mutedNow ? 'sprite-speaker-off' : 'sprite-speaker-on')
          );
          peerMuteBtn.title = mutedNow ? `Unmute ${p.name}` : `Mute ${p.name}`;
          peerMuteBtn.setAttribute('aria-label', peerMuteBtn.title);
        });
        nameLine.appendChild(peerMuteBtn);
      }
    }


    const scoreEl = document.createElement('div');
    scoreEl.className = `player-score ${p.score < 0 ? 'is-negative' : ''}`;
    scoreEl.textContent = formatCash(p.score);

    const statusEl = document.createElement('div');
    statusEl.className = 'player-status-chip';
    if (!p.connected) {
      statusEl.textContent = 'Offline';
    } else if (isBuzzed) {
      statusEl.textContent = 'Buzzed!';
    } else if (isSolved) {
      statusEl.textContent = 'Correct!';
    } else if (room.phase === 'board' && room.pickerId === p.id) {
      statusEl.textContent = 'Picking';
    } else if (p.isBot) {
      statusEl.textContent = 'Bot';
    }

    const metaRow = document.createElement('div');
    metaRow.className = 'player-meta-row';
    metaRow.appendChild(scoreEl);
    if (statusEl.textContent) metaRow.appendChild(statusEl);

    if (amHost && p.id !== state.playerId && !p.isBot && p.connected) {
      const transferBtn = document.createElement('button');
      transferBtn.type = 'button';
      transferBtn.className = 'transfer-host-btn';
      transferBtn.title = `Transfer room host privileges to ${p.name}`;
      transferBtn.setAttribute('aria-label', `Transfer host to ${p.name}`);
      setButtonSpriteAndText(transferBtn, 'sprite-crown', 'Host');
      transferBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.pendingTransferPlayerId = p.id;
        if (el.transferTargetName) {
          el.transferTargetName.textContent = p.name;
        }
        if (el.transferHostDialog) {
          if (typeof el.transferHostDialog.showModal === 'function') {
            el.transferHostDialog.showModal();
          } else {
            el.transferHostDialog.setAttribute('open', '');
          }
        }
      });
      metaRow.appendChild(transferBtn);
    }

    infoEl.append(nameLine, metaRow);

    const avatarCell = document.createElement('div');
    avatarCell.className = 'player-avatar-cell';
    const wearsLeaderCrown =
      (room.phase !== 'lobby' && idx === 0 && topScore > 0) ||
      (room.phase === 'lobby' && p.id === room.hostId);
    const isSpeakingAvatar = p.voiceSpeaking || (p.id === state.playerId && voiceChat.isSpeaking);
    const missedCurrentClue =
      Boolean(room.activeClue?.attemptedIds?.includes(p.id)) && !isSolved;
    const avatarMood = isSpeakingAvatar
      ? 'speaking'
      : isSolved
      ? 'happy'
      : isBuzzed
      ? 'excited'
      : missedCurrentClue
      ? 'sad'
      : room.phase === 'game_over' && idx === 0 && topScore > 0
      ? 'victory'
      : isOnFire
      ? 'happy'
      : 'idle';
    avatarCell.innerHTML = buildAvatarHTML(p.avatar, {
      size: 44,
      crown: wearsLeaderCrown,
      mood: avatarMood,
      delaySec: (idx % 4) * 0.18,
    });
    if (isSpeakingAvatar) {
      avatarCell.classList.add('is-speaking');
      row.classList.add('is-speaking');
    }

    if (amHost && p.id !== state.playerId) {
      const kickBtn = document.createElement('button');
      kickBtn.type = 'button';
      kickBtn.className = 'kick-player-btn';
      kickBtn.setAttribute('aria-label', `Remove ${p.name}`);
      kickBtn.title = `Remove ${p.name}`;
      kickBtn.appendChild(createPixelSprite('sprite-close-x'));
      kickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sendWs({ type: 'remove_player', playerId: p.id });
      });
      avatarCell.appendChild(kickBtn);
    }

    row.append(rankEl, infoEl, avatarCell);
    el.playersList.appendChild(row);
  });

  el.hostBotControls.hidden = !amHost || room.phase !== 'lobby';
}

function syncBotModalDiffButtons(selectedDiff) {
  state.selectedBotDiff = (selectedDiff || 'medium').toLowerCase();
  if (el.botModalDiffBtns) {
    el.botModalDiffBtns.forEach((btn) => {
      const btnDiff = (btn.getAttribute('data-diff') || '').toLowerCase();
      const isActive = btnDiff === state.selectedBotDiff;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', String(isActive));
    });
  }
}

function openBotSettingsModal(bot) {
  if (!bot || !bot.isBot) return;
  state.editingBotId = bot.id;
  state.editingBotName = bot.name;
  const curDiff = (bot.botDifficulty || state.room?.settings?.botDifficulty || 'medium').toLowerCase();
  syncBotModalDiffButtons(curDiff);
  if (el.botSettingsName) {
    el.botSettingsName.textContent = bot.name;
  }
  if (el.botSettingsDialog) {
    if (typeof el.botSettingsDialog.showModal === 'function') {
      el.botSettingsDialog.showModal();
    } else {
      el.botSettingsDialog.setAttribute('open', '');
    }
  }
}

/* =========================================================================
   SIMPLIFIED LOBBY & CATEGORY CUSTOMIZER RENDERING
   ========================================================================= */

function getAllKnownCategories(room) {
  const custom = room?.settings?.customCategoriesMeta || [];
  return [...custom, ...state.builtinCategories];
}

function renderLobbyStage(room, amHost) {
  const s = room.settings;

  el.lobbyRoomCodeDisplay.textContent = room.code;
  el.lobbyRoleBadge.textContent = amHost ? 'Host' : 'Guest';

  if (
    state.lanUrls.length > 0 &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    const phoneUrl = `${state.lanUrls[0]}/?room=${room.code}`;
    el.lanHintText.innerHTML = `Phone link (same Wi-Fi): <button type="button" class="lan-inline-link-btn">${state.lanUrls[0]}</button> &bull; Code: <strong>${room.code}</strong>`;
    const inlineBtn = el.lanHintText.querySelector('.lan-inline-link-btn');
    if (inlineBtn) {
      inlineBtn.onclick = () => copyText(phoneUrl, 'Phone invite link');
    }
  } else {
    el.lanHintText.textContent = 'Share this code or invite link so friends can join.';
  }

  // Sync settings controls
  el.setAnswerMode.value = s.answerMode;
  el.setBoardCols.value = String(s.boardCols);
  el.setCluesPerCat.value = String(s.cluesPerCat);
  el.setClueTime.value = String(s.clueTimeSec);
  el.setDoubleJeopardy.checked = Boolean(s.doubleJeopardy);
  el.setDailyDoubles.checked = Boolean(s.dailyDoubles);
  el.setFinalJeopardy.checked = Boolean(s.finalJeopardy);
  el.setWrongPenalty.checked = Boolean(s.wrongPenalty);

  // Sync Pace buttons active class
  document.querySelectorAll('.pace-btn').forEach((btn) => {
    const pace = btn.getAttribute('data-pace');
    const isActive =
      (pace === 'quick' && s.boardCols === 3 && s.cluesPerCat === 3) ||
      (pace === 'standard' && s.boardCols === 4 && s.cluesPerCat === 4) ||
      (pace === 'epic' && s.boardCols === 5 && s.cluesPerCat === 5 && s.doubleJeopardy);
    btn.classList.toggle('active', Boolean(isActive));
    btn.setAttribute('aria-checked', Boolean(isActive) ? 'true' : 'false');
    btn.disabled = !amHost;
  });

  // Sync Bot Difficulty buttons
  const curDiff = s.botDifficulty || 'medium';
  document.querySelectorAll('.diff-btn').forEach((btn) => {
    const diff = btn.getAttribute('data-diff');
    const isActive = diff === curDiff;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    btn.disabled = !amHost;
  });
  if (el.activeDifficultyIndicator) {
    el.activeDifficultyIndicator.textContent = curDiff.toUpperCase();
  }

  const controls = [
    el.setAnswerMode,
    el.setBoardCols,
    el.setCluesPerCat,
    el.setClueTime,
    el.setDoubleJeopardy,
    el.setDailyDoubles,
    el.setFinalJeopardy,
    el.setWrongPenalty,
    el.openCustomCatBtn,
    el.startGameBtn,
    ...document.querySelectorAll('.preset-chip[data-preset]'),
  ];
  for (const ctrl of controls) {
    ctrl.disabled = !amHost;
  }

  for (const chk of [
    el.setDoubleJeopardy,
    el.setDailyDoubles,
    el.setFinalJeopardy,
    el.setWrongPenalty,
  ]) {
    syncHasFallbackClass(chk.closest('.rule-toggle-pill'), chk);
  }

  const allCats = getAllKnownCategories(room);
  const includedSet = new Set(s.includedCategoryIds || []);
  const includedCount = allCats.filter((c) => includedSet.has(c.id)).length;
  const needed = s.boardCols;
  el.includedCounterBadge.textContent = `${includedCount} / ${allCats.length} Selected`;
  el.includedCounterBadge.classList.toggle('is-low', includedCount < needed);

  el.guestWaitingDots.hidden = amHost;
  el.startGameBtn.textContent = amHost ? 'Start Game' : 'Waiting for Host...';

  // Render Clean Single-Row MS Paint Pixel Category Tiles
  const query = state.categorySearchQuery.trim().toLowerCase();
  el.lobbyCategoriesGrid.innerHTML = '';

  for (const cat of allCats) {
    if (
      query &&
      !cat.name.toLowerCase().includes(query) &&
      !(cat.group || '').toLowerCase().includes(query)
    ) {
      continue;
    }

    const isChecked = includedSet.has(cat.id);
    const label = document.createElement('label');
    label.className = `cat-card ${isChecked ? 'selected' : ''}`;
    label.setAttribute('role', 'checkbox');
    label.setAttribute('aria-checked', isChecked ? 'true' : 'false');

    const leftCluster = document.createElement('span');
    leftCluster.className = 'cat-card-label';

    const iconEl = createCategoryPixelIcon(cat.id, 22);
    const nameEl = document.createElement('span');
    nameEl.className = 'cat-card-name';
    nameEl.textContent = cat.name;
    leftCluster.append(iconEl, nameEl);

    const rightCluster = document.createElement('span');
    rightCluster.className = 'cat-card-right';

    const checkBadge = document.createElement('span');
    checkBadge.className = 'cat-check-badge';
    checkBadge.appendChild(createPixelSprite('sprite-check'));

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'cat-checkbox';
    checkbox.checked = isChecked;
    checkbox.disabled = !amHost;

    checkbox.addEventListener('change', () => {
      if (!isMeHost(state.room)) return;
      sfx.play('click');
      const nextSet = new Set(state.room.settings.includedCategoryIds);
      if (checkbox.checked) nextSet.add(cat.id);
      else nextSet.delete(cat.id);
      label.classList.toggle('selected', checkbox.checked);
      label.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');
      syncHasFallbackClass(label, checkbox);
      pushSettingsPatch({ includedCategoryIds: Array.from(nextSet) });
    });

    rightCluster.append(checkBadge, checkbox);
    label.append(leftCluster, rightCluster);
    syncHasFallbackClass(label, checkbox);
    el.lobbyCategoriesGrid.appendChild(label);
  }
}

function pushSettingsPatch(patch) {
  if (!state.room) return;
  if (!isMeHost(state.room)) {
    showToast('Only the room host can change game settings!', 'error');
    return;
  }
  if (state.room.phase !== 'lobby') {
    showToast('Settings cannot be changed while a match is in progress.', 'error');
    return;
  }
  sendWs({
    type: 'update_settings',
    settings: patch,
  });
}

/* =========================================================================
   CLEAN JEOPARDY BOARD RENDERING
   ========================================================================= */

function renderBoardStage(room) {
  const board = room.board;
  if (!board) return;

  const cols = board.categories.length;
  const rows = board.categories[0]?.tiles?.length || 5;
  const myTurn = room.pickerId === state.playerId;
  const picker = findPlayer(room, room.pickerId);

  el.boardTurnBanner.classList.toggle('is-my-turn', myTurn);
  el.boardTurnBanner.textContent = myTurn
    ? 'Your turn! Click any dollar value on the board.'
    : `${picker ? picker.name : 'Player'} is choosing the next clue...`;

  el.boardGrid.style.setProperty('--board-cols', String(cols));
  el.boardGrid.style.setProperty('--board-rows', String(rows));
  el.boardGrid.innerHTML = '';

  // Row 0: Category Headers with 2-Frame Animated MS Paint Pixel Icons
  for (const cat of board.categories) {
    const header = document.createElement('div');
    header.className = 'j-cat-header';

    const iconEl = createCategoryPixelIcon(cat.id, 24);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = cat.name;

    header.append(iconEl, nameSpan);
    el.boardGrid.appendChild(header);
  }

  // Rows 1..N: Dollar Tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = board.categories[c].tiles[r];
      if (tile.used) {
        const empty = document.createElement('div');
        empty.className = 'j-tile-used';
        el.boardGrid.appendChild(empty);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `j-tile-btn ${myTurn ? 'can-pick' : 'not-my-turn'}`;

        const valSpan = document.createElement('span');
        valSpan.className = 'j-tile-value';
        valSpan.textContent = `$${tile.value}`;
        btn.appendChild(valSpan);

        if (tile.modifier) {
          const MOD_INFO = {
            speed_blitz: {
              sprite: 'sprite-mod-blitz',
              shortLabel: 'BLITZ',
              title: 'Speed Blitz: +50% Bonus Points!',
              cls: 'mod-blitz',
              tileCls: 'mod-tile-blitz',
            },
            steal: {
              sprite: 'sprite-mod-steal',
              shortLabel: 'STEAL',
              title: 'Steal Tile: Docks $200 from leader on correct solve!',
              cls: 'mod-steal',
              tileCls: 'mod-tile-steal',
            },
            chaos_all_play: {
              sprite: 'sprite-mod-chaos',
              shortLabel: 'CHAOS',
              title: 'Chaos All-Play: Everyone answers simultaneously!',
              cls: 'mod-chaos',
              tileCls: 'mod-tile-chaos',
            },
            double_trouble: {
              sprite: 'sprite-mod-double',
              shortLabel: '2X',
              title: 'Double Trouble: 2x points on correct solve!',
              cls: 'mod-double',
              tileCls: 'mod-tile-double',
            },
          };
          const info = MOD_INFO[tile.modifier] || {
            sprite: 'sprite-sparkle',
            shortLabel: 'PERK',
            title: 'Party Modifier Tile',
            cls: 'mod-blitz',
            tileCls: 'mod-tile-blitz',
          };

          btn.classList.add('tile-with-modifier', info.tileCls);
          btn.title = `$${tile.value} • ${info.title}`;

          const modTag = document.createElement('span');
          modTag.className = `tile-modifier-tag ${info.cls}`;
          modTag.setAttribute('aria-label', info.title);
          modTag.appendChild(createPixelSprite(info.sprite));

          const textEl = document.createElement('span');
          textEl.className = 'tile-mod-text';
          textEl.textContent = info.shortLabel;
          modTag.appendChild(textEl);

          btn.appendChild(modTag);
        }
        btn.addEventListener('click', () => {
          if (state.room?.pickerId !== state.playerId) {
            const curPicker = findPlayer(state.room, state.room?.pickerId);
            showToast(
              `Wait for ${curPicker ? curPicker.name : 'the active player'} to pick a clue!`
            );
            return;
          }
          sfx.play('click');
          sendWs({ type: 'select_tile', col: c, row: r });
        });
        el.boardGrid.appendChild(btn);
      }
    }
  }
}

/* =========================================================================
   FOCUSED QUESTION / BUZZER / DAILY DOUBLE / FEEDBACK RENDERING
   ========================================================================= */

function renderClueStage(room, amHost, phaseChanged) {
  const ac = room.activeClue;
  if (!ac) return;

  el.clueCatIcon.style.setProperty('--icon-size', '22px');
  el.clueCatIcon.style.setProperty(
    '--cat-url',
    `url('${getCategorySpriteUrl(ac.categoryId)}')`
  );
  el.clueCatName.textContent = ac.categoryName;
  el.clueValuePill.textContent = ac.dailyDouble
    ? `Wager: ${formatCash(ac.wager)}`
    : formatCash(ac.value);

  const isDDWager = room.phase === 'daily_double_wager';
  const isDDAnswer = room.phase === 'daily_double_answer';
  const isClueOpen = room.phase === 'clue_open';
  const isClueBuzzed = room.phase === 'clue_buzzed';
  const isChaosMode = room.phase === 'clue_chaos';
  const isSkribblMode = room.phase === 'clue_skribbl';
  const isResult = room.phase === 'clue_result';

  // 0. Modifier Badge on Clue Card Top
  if (ac.modifier) {
    el.clueModifierBadge.hidden = false;
    const MOD_INFO = {
      speed_blitz: { sprite: 'sprite-mod-blitz', label: 'SPEED BLITZ (+50% Pts)', cls: 'mod-blitz' },
      steal: { sprite: 'sprite-mod-steal', label: 'STEAL TILE (-$200 Leader)', cls: 'mod-steal' },
      chaos_all_play: { sprite: 'sprite-mod-chaos', label: 'CHAOS ALL-PLAY', cls: 'mod-chaos' },
      double_trouble: { sprite: 'sprite-mod-double', label: 'DOUBLE TROUBLE (2X)', cls: 'mod-double' },
    };
    const m = MOD_INFO[ac.modifier] || { sprite: 'sprite-sparkle', label: 'PERK', cls: 'mod-blitz' };
    el.clueModifierBadge.className = `clue-modifier-badge ${m.cls}`;
    setButtonSpriteAndText(el.clueModifierBadge, m.sprite, m.label);
  } else {
    el.clueModifierBadge.hidden = true;
  }

  // 1. Daily Double Wager Box
  el.ddWagerBox.hidden = !isDDWager;
  if (isDDWager) {
    const picker = findPlayer(room, room.pickerId);
    const iAmPicker = room.pickerId === state.playerId;
    el.ddStatusMsg.textContent = iAmPicker
      ? `Choose your wager (up to ${formatCash(ac.maxWager)}):`
      : `${picker ? picker.name : 'Player'} is choosing a Daily Double wager...`;
    el.ddControls.hidden = !iAmPicker;
    if (iAmPicker && phaseChanged) {
      el.ddWagerRange.min = '5';
      el.ddWagerRange.max = String(ac.maxWager);
      el.ddWagerNumber.min = '5';
      el.ddWagerNumber.max = String(ac.maxWager);
      const def = Math.min(ac.value, ac.maxWager);
      el.ddWagerRange.value = String(def);
      el.ddWagerNumber.value = String(def);
    }
  }

  // 2. Clue Text & Progressive Letter Mask
  el.clueTextArea.hidden = isDDWager;
  el.cluePromptText.textContent = ac.clue || '';
  if (ac.hintMask) {
    el.skribblHintMask.hidden = false;
    el.skribblHintMask.textContent = ac.hintMask;
  } else {
    el.skribblHintMask.hidden = true;
  }

  // 3. Compact Inline Wrong-Attempt Feedback (Never Covers the Clue!)
  if (isClueOpen && ac.lastWrongText) {
    el.clueInlineFeedback.hidden = false;
    el.clueFeedbackSprite.className = 'pixel-sprite sprite-wrong';
    el.clueFeedbackText.textContent = `Incorrect — ${ac.lastWrongText}`;
  } else {
    el.clueInlineFeedback.hidden = true;
  }

  // 4. Tactile MS Paint Buzzer (in clue_open)
  el.buzzerWrap.hidden = !isClueOpen;
  if (isClueOpen) {
    const alreadyTried = ac.attemptedIds?.includes(state.playerId);
    el.buzzBtn.disabled = alreadyTried;
    el.buzzEligibilityNote.textContent = alreadyTried
      ? 'You already buzzed on this clue — waiting for other players.'
      : 'First to buzz gets 11 seconds to answer!';
  }

  // 5. Spectator Banner
  const buzzedPlayer = findPlayer(room, ac.buzzedPlayerId);
  const iAmAnswering =
    (isClueBuzzed && ac.buzzedPlayerId === state.playerId) ||
    (isDDAnswer && room.pickerId === state.playerId) ||
    (isSkribblMode && !ac.solvedIds?.includes(state.playerId));

  if ((isClueBuzzed || isDDAnswer) && !iAmAnswering) {
    el.buzzedSpectatorBanner.hidden = false;
    const guessNote = ac.buzzedGuessText
      ? ` answered "${ac.buzzedGuessText}"!`
      : ' is answering...';
    el.buzzedSpectatorBanner.textContent = `${
      buzzedPlayer ? buzzedPlayer.name : 'Player'
    }${guessNote}`;
  } else if (isSkribblMode && ac.solvedIds?.includes(state.playerId)) {
    el.buzzedSpectatorBanner.hidden = false;
    el.buzzedSpectatorBanner.textContent =
      'Correct! Waiting for remaining players...';
  } else {
    el.buzzedSpectatorBanner.hidden = true;
  }

  // 6. Answer Input Form
  const waitingForHostOnMe =
    isClueBuzzed &&
    room.settings.answerMode === 'host' &&
    Boolean(ac.buzzedGuessText);
  el.clueAnswerForm.hidden = !iAmAnswering || waitingForHostOnMe;
  if (iAmAnswering && phaseChanged) {
    el.clueAnswerInput.value = '';
    setTimeout(() => el.clueAnswerInput.focus(), 30);
  }

  // 6b. Chaos All-Play Mode UI
  el.chaosAnswerForm.hidden = !isChaosMode;
  if (isChaosMode) {
    const mySub = ac.myChaosSubmission;
    const alreadySubmitted = Boolean(mySub);
    el.chaosAnswerInput.disabled = alreadySubmitted;
    const submitBtn = el.chaosAnswerForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = alreadySubmitted;

    const submittedCount = ac.chaosSubmittedIds?.length || 0;
    const totalCount = ac.chaosTotalPlayers || room.players.filter((p) => p.connected).length || 1;

    if (alreadySubmitted) {
      if (mySub.correct) {
        el.chaosStatusMsg.innerHTML = `<span class="pixel-sprite sprite-check chat-inline-sprite" aria-hidden="true"></span><span style="color:#70f558; font-weight:700;">Correct! Locked in "${escapeHtml(mySub.text)}" (+${formatCash(mySub.points)})</span> <span style="opacity:0.8;">(Waiting for ${Math.max(0, totalCount - submittedCount)} player${totalCount - submittedCount === 1 ? '' : 's'}...)</span>`;
      } else {
        el.chaosStatusMsg.innerHTML = `<span class="pixel-sprite sprite-close-x chat-inline-sprite" aria-hidden="true"></span><span style="color:#ffb3b3; font-weight:700;">Locked in "${escapeHtml(mySub.text)}" (Incorrect)</span> <span style="opacity:0.8;">(Waiting for round to finish...)</span>`;
      }
    } else {
      el.chaosStatusMsg.innerHTML = `<span class="pixel-sprite sprite-mod-chaos chat-inline-sprite" aria-hidden="true"></span><strong>EVERYONE ANSWERS SIMULTANEOUSLY!</strong> Type and submit: <span class="chaos-pill">(${submittedCount}/${totalCount} answered)</span>`;
      if (phaseChanged && !alreadySubmitted) {
        el.chaosAnswerInput.value = '';
        setTimeout(() => el.chaosAnswerInput.focus(), 40);
      }
    }
  }

  // 7. Host Judge Controls
  const showHostJudge =
    isClueBuzzed &&
    room.settings.answerMode === 'host' &&
    amHost &&
    ac.buzzedPlayerId !== state.playerId;
  el.hostJudgeBox.hidden = !showHostJudge;
  if (showHostJudge) {
    el.hostRefAnswerText.textContent = ac.answer || '(hidden)';
  }

  // 8. Post-Clue Result Reveal with Animated Pixel Check / Cross
  el.clueResultBox.hidden = !isResult;
  if (isResult) {
    const someoneWon = Boolean(ac.winnerName);
    el.resultBadgeSprite.className = `pixel-sprite ${
      someoneWon ? 'sprite-correct' : 'sprite-wrong'
    }`;
    el.officialAnswerText.textContent = ac.answer || '';
    el.clueWinnerLine.textContent = someoneWon
      ? `${ac.winnerName} earned +${formatCash(ac.winnerDelta)}!`
      : ac.lastWrongText
      ? `No points awarded (${ac.lastWrongText})`
      : 'Nobody got this clue!';
    el.clueWinnerLine.style.color = someoneWon ? '#70f558' : '#ffb3b3';
    el.nextClueBtn.hidden = !(amHost || room.pickerId === state.playerId);
  }
}

/* =========================================================================
   INTERMISSION STAGE RENDERING
   ========================================================================= */

function renderIntermissionStage(room) {
  if (!el.stageIntermission) return;
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  if (el.intermissionNextTitle) {
    el.intermissionNextTitle.textContent = room.intermissionNextTitle || 'Next Round';
  }

  if (el.intermissionStandings) {
    el.intermissionStandings.innerHTML = '';
    sorted.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'fb-row';

      const left = document.createElement('div');
      left.className = 'fb-left';
      const rankBadge =
        idx === 0
          ? '<span class="pixel-sprite sprite-crown" aria-hidden="true"></span>'
          : `#${idx + 1}`;
      left.innerHTML = `<span class="intermission-rank">${rankBadge}</span> <strong>${escapeHtml(p.name)}</strong>`;

      const right = document.createElement('strong');
      right.style.color = p.score >= 0 ? '#ffea00' : '#ff6b6b';
      right.textContent = formatCash(p.score);

      row.append(left, right);
      el.intermissionStandings.appendChild(row);
    });
  }
}

/* =========================================================================
   FINAL JEOPARDY & WINNER PODIUM RENDERING
   ========================================================================= */

function renderFinalStage(room, phaseChanged) {
  const fsState = room.finalState;
  if (!fsState) return;

  el.finalCategoryName.textContent = fsState.category;

  const isWager = room.phase === 'final_wager';
  const isClue = room.phase === 'final_clue';

  el.finalWagerStep.hidden = !isWager;
  el.finalClueStep.hidden = !isClue;

  if (isWager) {
    const locked = fsState.wagerLockedIds.includes(state.playerId);
    el.finalWagerFormWrap.hidden = locked;
    el.finalWagerLockedMsg.hidden = !locked;
    if (!locked && phaseChanged) {
      const maxW = fsState.myMaxWager || 500;
      el.finalWagerRange.max = String(maxW);
      el.finalWagerNumber.max = String(maxW);
      const half = Math.round((maxW * 0.5) / 50) * 50;
      el.finalWagerRange.value = String(half);
      el.finalWagerNumber.value = String(half);
    }
  }

  if (isClue) {
    el.finalClueText.textContent = fsState.clue || '';
    const locked = fsState.answerLockedIds.includes(state.playerId);
    el.finalAnswerForm.hidden = locked;
    el.finalAnswerLockedMsg.hidden = !locked;
    if (!locked && phaseChanged) {
      el.finalAnswerInput.value = '';
      setTimeout(() => el.finalAnswerInput.focus(), 40);
    }
  }

  const lockedSet = new Set(
    isWager ? fsState.wagerLockedIds : fsState.answerLockedIds
  );
  el.finalPlayersLockStatus.innerHTML = '';
  for (const p of room.players) {
    const pill = document.createElement('span');
    const done = lockedSet.has(p.id);
    pill.className = `lock-pill ${done ? 'is-done' : ''}`;
    pill.textContent = `${done ? 'Locked:' : 'Thinking:'} ${p.name}`;
    el.finalPlayersLockStatus.appendChild(pill);
  }
}

function renderGameoverStage(room, amHost) {
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const podiumOrder = [
    { player: sorted[1], place: 2 },
    { player: sorted[0], place: 1 },
    { player: sorted[2], place: 3 },
  ].filter((x) => Boolean(x.player));

  el.podiumStage.innerHTML = '';
  for (const slot of podiumOrder) {
    const p = slot.player;
    const spot = document.createElement('div');
    spot.className = 'podium-spot';

    const avWrap = document.createElement('div');
    const podiumMood =
      slot.place === 1 ? 'victory' : p.score < 0 ? 'defeat' : 'happy';
    avWrap.innerHTML = buildAvatarHTML(p.avatar, {
      size: slot.place === 1 ? 92 : 72,
      crown: slot.place === 1,
      mood: podiumMood,
    });

    const nameEl = document.createElement('div');
    nameEl.className = 'podium-name';
    nameEl.textContent = p.name;

    const cashEl = document.createElement('div');
    cashEl.className = p.score < 0 ? 'podium-cash is-negative' : 'podium-cash';
    cashEl.textContent = formatCash(p.score);

    const ped = document.createElement('div');
    ped.className = `podium-pedestal pedestal-${slot.place}`;
    ped.textContent = `#${slot.place}`;

    spot.append(avWrap, nameEl, cashEl, ped);
    el.podiumStage.appendChild(spot);
  }

  if (room.finalState && Array.isArray(room.finalState.results)) {
    el.finalBreakdownWrap.hidden = false;
    el.finalRevealAnswer.textContent = room.finalState.answer || '';
    el.finalBreakdownList.innerHTML = '';

    for (const r of room.finalState.results) {
      const row = document.createElement('div');
      row.className = 'fb-row';

      const left = document.createElement('div');
      left.className = 'fb-left';

      const badge = document.createElement('span');
      badge.className = `pixel-sprite ${
        r.correct ? 'sprite-correct' : 'sprite-wrong'
      } fb-badge-mini`;
      badge.setAttribute('aria-hidden', 'true');

      const txt = document.createElement('span');
      txt.textContent = `${r.name}: "${r.answer}"`;
      left.append(badge, txt);

      const right = document.createElement('strong');
      right.style.color = r.correct ? '#53e237' : '#ff6b6b';
      const deltaSpan = document.createElement('span');
      deltaSpan.textContent = `${r.correct ? '+' : '-'}$${Math.abs(
        r.wager
      ).toLocaleString()} `;
      const arrowSprite = createPixelSprite('sprite-arrow-right', 'chat-inline-sprite');
      const finalSpan = document.createElement('span');
      finalSpan.textContent = formatCash(r.finalScore);
      right.append(deltaSpan, arrowSprite, finalSpan);

      row.append(left, right);
      el.finalBreakdownList.appendChild(row);
    }
  } else {
    el.finalBreakdownWrap.hidden = true;
  }

  // Render Match Superlatives & Awards with Animated MS Paint Pixel Sprites
  const SUPERLATIVE_SPRITES = {
    blitz: { type: 'pixel', cls: 'sprite-mod-blitz' },
    fire: { type: 'pixel', cls: 'sprite-fire' },
    target: { type: 'pixel', cls: 'sprite-target' },
    celebrate: { type: 'reaction', cls: 'reaction-celebrate' },
  };

  if (Array.isArray(room.superlatives) && room.superlatives.length > 0) {
    el.superlativesSection.hidden = false;
    el.superlativesGrid.innerHTML = '';
    for (const sup of room.superlatives) {
      const card = document.createElement('div');
      card.className = 'superlative-card';

      const icon = document.createElement('span');
      icon.className = 'superlative-badge-icon';
      const spec = SUPERLATIVE_SPRITES[sup.badge] || { type: 'pixel', cls: 'sprite-medal' };
      if (spec.type === 'reaction') {
        const reactSpan = document.createElement('span');
        reactSpan.className = `reaction-sprite ${spec.cls}`;
        reactSpan.setAttribute('aria-hidden', 'true');
        icon.appendChild(reactSpan);
      } else {
        icon.appendChild(createPixelSprite(spec.cls));
      }

      const name = document.createElement('span');
      name.className = 'superlative-name';
      name.textContent = sup.title;

      const player = document.createElement('span');
      player.className = 'superlative-player';
      player.textContent = sup.playerName;

      const detail = document.createElement('span');
      detail.className = 'superlative-detail';
      detail.textContent = sup.detail;

      card.append(icon, name, player, detail);
      el.superlativesGrid.appendChild(card);
    }
  } else {
    el.superlativesSection.hidden = true;
  }

  el.playAgainBtn.disabled = !amHost;
  el.backToLobbyBtn.disabled = !amHost;
}

/* =========================================================================
   LIVE COUNTDOWN CLOCK LOOP
   ========================================================================= */

function startTimerLoop() {
  let trackedTotalDurationMs = 20000;
  let trackedEndsAt = 0;

  setInterval(() => {
    const room = state.room;
    if (
      !room ||
      !room.phaseEndsAt ||
      room.phase === 'lobby' ||
      room.phase === 'game_over'
    ) {
      el.timerBadge.hidden = true;
      return;
    }

    if (room.phaseEndsAt !== trackedEndsAt) {
      trackedEndsAt = room.phaseEndsAt;
      const approxNow = Date.now() + state.clockOffsetMs;
      trackedTotalDurationMs = Math.max(1000, room.phaseEndsAt - approxNow);
    }

    const serverNowEstimate = Date.now() + state.clockOffsetMs;
    const remainingMs = Math.max(0, room.phaseEndsAt - serverNowEstimate);
    const secs = Math.ceil(remainingMs / 1000);

    el.timerBadge.hidden = false;
    el.timerSeconds.textContent = String(secs);
    el.timerBadge.classList.toggle(
      'is-urgent',
      secs <= 5 && room.phase !== 'clue_result'
    );

    const pct = Math.max(
      0,
      Math.min(100, (remainingMs / trackedTotalDurationMs) * 100)
    );
    el.clueTimerFill.style.width = `${pct}%`;

    if (
      secs > 0 &&
      secs <= 4 &&
      secs !== state.lastTickSecond &&
      [
        'clue_open',
        'clue_buzzed',
        'clue_skribbl',
        'daily_double_answer',
        'final_clue',
      ].includes(room.phase)
    ) {
      state.lastTickSecond = secs;
      sfx.play('tick');
    }
  }, 120);
}

/* =========================================================================
   EVENT LISTENERS
   ========================================================================= */

function bindEvents() {
  // Home Avatar Customizer Arrows (Hat, Eyes, Mouth, Color)
  document.querySelectorAll('.arrow-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.play('pop');
      const part = btn.dataset.part;
      const dir = Number(btn.dataset.dir) || 1;
      let hint = '';

      if (part === 'hat') {
        state.avatar.hat =
          ((Number(state.avatar.hat) || 0) + dir + HAT_COUNT) % HAT_COUNT;
        hint = state.avatar.hat === 0 ? 'No Hat' : `Hat ${state.avatar.hat}/${HAT_COUNT - 1}`;
      } else if (part === 'eyes') {
        state.avatar.eyes = (state.avatar.eyes + dir + EYE_COUNT) % EYE_COUNT;
        hint = `Eyes ${state.avatar.eyes + 1}/${EYE_COUNT}`;
      } else if (part === 'mouth') {
        state.avatar.mouth =
          (state.avatar.mouth + dir + MOUTH_COUNT) % MOUTH_COUNT;
        hint = `Mouth ${state.avatar.mouth + 1}/${MOUTH_COUNT}`;
      } else if (part === 'color') {
        state.avatar.color =
          (state.avatar.color + dir + AVATAR_COLORS.length) %
          AVATAR_COLORS.length;
        hint = AVATAR_COLORS[state.avatar.color]?.name || 'Color';
      }
      saveProfile();
      renderHomeAvatarPreview(hint);
    });
  });

  el.avatarRandomBtn.addEventListener('click', () => {
    sfx.play('pop');
    state.avatar = randomAvatar();
    saveProfile();
    renderHomeAvatarPreview('Randomized!');
  });

  el.cancelInviteBtn.addEventListener('click', () => {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.search = '';
    window.history.replaceState({}, '', cleanUrl);
    checkUrlInviteParam();
  });

  // Home Utility Controls (Sound, Animations, How to Play)
  const handleToggleSound = () => {
    sfx.toggleMute();
    syncSoundButtons();
  };
  el.homeSoundBtn.addEventListener('click', handleToggleSound);
  el.soundToggleBtn.addEventListener('click', handleToggleSound);

  el.homeMotionBtn.addEventListener('click', () => {
    sfx.play('click');
    toggleMotionPreference();
  });
  el.motionToggleBtn.addEventListener('click', () => {
    sfx.play('click');
    toggleMotionPreference();
  });

  el.openHowtoBtn.addEventListener('click', () => {
    sfx.play('click');
    el.howtoDialog.showModal();
  });

  // Home Primary Actions: 1. PLAY (Opens Public Matchmaking Browser)
  el.playBtn.addEventListener('click', () => {
    sfx.play('click');
    if (state.invitedRoomCode) {
      state.intentionalLeave = false;
      sendActionWithProfile(
        {
          type: 'join_room',
          code: state.invitedRoomCode,
        },
        { roomCodeForToken: state.invitedRoomCode }
      );
    } else {
      if (el.publicRoomsDialog && typeof el.publicRoomsDialog.showModal === 'function') {
        el.publicRoomsDialog.showModal();
        fetchAndRenderPublicRooms();
      } else {
        startFreshRoomSession('quick_play', { matchExisting: true });
      }
    }
  });

  el.createPrivateBtn.addEventListener('click', () => {
    sfx.play('click');
    startFreshRoomSession('create_private');
  });

  if (el.openPublicBrowserBtn && el.publicRoomsDialog) {
    el.openPublicBrowserBtn.addEventListener('click', () => {
      sfx.play('click');
      el.publicRoomsDialog.showModal();
      fetchAndRenderPublicRooms();
    });
  }

  if (el.refreshPublicRoomsBtn) {
    el.refreshPublicRoomsBtn.addEventListener('click', () => {
      sfx.play('click');
      fetchAndRenderPublicRooms();
    });
  }

  if (el.closePublicRoomsBtn && el.publicRoomsDialog) {
    el.closePublicRoomsBtn.addEventListener('click', () => {
      sfx.play('click');
      el.publicRoomsDialog.close();
    });
  }

  // Public Matchmaking Header "Create Public Room" Button
  if (el.createPublicFromHeaderBtn) {
    el.createPublicFromHeaderBtn.addEventListener('click', () => {
      sfx.play('click');
      if (el.publicRoomsDialog && typeof el.publicRoomsDialog.close === 'function') {
        el.publicRoomsDialog.close();
      }
      startFreshRoomSession('create_public');
    });
  }

  // Voice Chat Manager Initialization
  voiceChat.init({
    sendWs: (payload) => sendWs(payload),
    onStatusChange: (status) => updateVoiceDockUI(status),
    onPermissionError: (msg) => {
      if (el.micHelpMessage) el.micHelpMessage.textContent = msg;
      if (el.micHelpDialog && typeof el.micHelpDialog.showModal === 'function') {
        el.micHelpDialog.showModal();
      } else {
        showToast(msg, 'warn');
      }
    },
  });

  // Voice Dock Controls
  if (el.voiceJoinBtn) {
    el.voiceJoinBtn.addEventListener('click', async () => {
      sfx.play('click');
      await voiceChat.joinVoice();
    });
  }

  if (el.voiceMuteBtn) {
    el.voiceMuteBtn.addEventListener('click', () => {
      sfx.play('click');
      voiceChat.toggleMute();
    });
  }

  if (el.voiceDeafenBtn) {
    el.voiceDeafenBtn.addEventListener('click', () => {
      sfx.play('click');
      voiceChat.toggleDeafen();
    });
  }

  if (el.voiceLeaveBtn) {
    el.voiceLeaveBtn.addEventListener('click', () => {
      sfx.play('click');
      voiceChat.leaveVoice(true);
    });
  }

  // Push-to-Talk Mobile Button
  if (el.voicePttBtn) {
    const startPtt = (e) => {
      e.preventDefault();
      voiceChat.setPttPressed(true);
      el.voicePttBtn.classList.add('is-active');
    };
    const endPtt = (e) => {
      e.preventDefault();
      voiceChat.setPttPressed(false);
      el.voicePttBtn.classList.remove('is-active');
    };
    el.voicePttBtn.addEventListener('mousedown', startPtt);
    el.voicePttBtn.addEventListener('mouseup', endPtt);
    el.voicePttBtn.addEventListener('mouseleave', endPtt);
    el.voicePttBtn.addEventListener('touchstart', startPtt, { passive: false });
    el.voicePttBtn.addEventListener('touchend', endPtt, { passive: false });
  }

  // Audio & Voice Settings Modal
  if (el.audioSettingsBtn && el.audioSettingsDialog) {
    el.audioSettingsBtn.addEventListener('click', () => {
      sfx.play('click');
      if (el.settingMasterMute) el.settingMasterMute.checked = sfx.muted;
      if (el.settingSfxVolume) {
        el.settingSfxVolume.value = Math.round(sfx.sfxVolume * 100);
        if (el.settingSfxVal) el.settingSfxVal.textContent = `${el.settingSfxVolume.value}%`;
      }
      if (el.settingMusicVolume) {
        el.settingMusicVolume.value = Math.round(sfx.musicVolume * 100);
        if (el.settingMusicVal) el.settingMusicVal.textContent = `${el.settingMusicVolume.value}%`;
      }
      if (el.settingVoiceVolume) {
        el.settingVoiceVolume.value = Math.round(voiceChat.masterVoiceVolume * 100);
        if (el.settingVoiceVal) el.settingVoiceVal.textContent = `${el.settingVoiceVolume.value}%`;
      }
      if (el.settingVoicePtt) el.settingVoicePtt.checked = voiceChat.usePushToTalk;
      if (el.settingVoiceAutoMute) el.settingVoiceAutoMute.checked = voiceChat.autoMuteOnJoin;
      el.audioSettingsDialog.showModal();
    });
  }

  if (el.closeAudioSettingsBtn && el.audioSettingsDialog) {
    el.closeAudioSettingsBtn.addEventListener('click', () => {
      sfx.play('click');
      el.audioSettingsDialog.close();
    });
  }

  if (el.settingMasterMute) {
    el.settingMasterMute.addEventListener('change', () => {
      sfx.setMuted(el.settingMasterMute.checked);
      syncSoundButtons();
    });
  }

  if (el.settingSfxVolume) {
    el.settingSfxVolume.addEventListener('input', () => {
      const pct = el.settingSfxVolume.value;
      if (el.settingSfxVal) el.settingSfxVal.textContent = `${pct}%`;
      sfx.setSfxVolume(pct / 100);
    });
  }

  if (el.settingMusicVolume) {
    el.settingMusicVolume.addEventListener('input', () => {
      const pct = el.settingMusicVolume.value;
      if (el.settingMusicVal) el.settingMusicVal.textContent = `${pct}%`;
      sfx.setMusicVolume(pct / 100);
    });
  }

  if (el.settingVoiceVolume) {
    el.settingVoiceVolume.addEventListener('input', () => {
      const pct = el.settingVoiceVolume.value;
      if (el.settingVoiceVal) el.settingVoiceVal.textContent = `${pct}%`;
      voiceChat.setMasterVoiceVolume(pct / 100);
    });
  }

  if (el.settingVoicePtt) {
    el.settingVoicePtt.addEventListener('change', () => {
      voiceChat.setPushToTalk(el.settingVoicePtt.checked);
    });
  }

  if (el.settingVoiceAutoMute) {
    el.settingVoiceAutoMute.addEventListener('change', () => {
      voiceChat.setAutoMuteOnJoin(el.settingVoiceAutoMute.checked);
    });
  }

  if (el.micHelpRetryBtn && el.micHelpDialog) {
    el.micHelpRetryBtn.addEventListener('click', async () => {
      sfx.play('click');
      el.micHelpDialog.close();
      await voiceChat.joinVoice();
    });
  }

  if (el.micHelpCloseBtn && el.micHelpDialog) {
    el.micHelpCloseBtn.addEventListener('click', () => {
      sfx.play('click');
      el.micHelpDialog.close();
    });
  }


  if (el.createPublicFromDialogBtn) {
    el.createPublicFromDialogBtn.addEventListener('click', () => {
      sfx.play('click');
      if (el.publicRoomsDialog && typeof el.publicRoomsDialog.close === 'function') {
        el.publicRoomsDialog.close();
      }
      startFreshRoomSession('quick_play', { matchExisting: false, createOnly: true });
    });
  }

  if (el.homeLanCopyBtn) {
    el.homeLanCopyBtn.addEventListener('click', () => {
      if (state.lanUrls.length > 0) {
        copyText(state.lanUrls[0], 'Phone address');
      }
    });
  }

  el.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      el.playBtn.click();
    }
  });

  // Join Room Code Native <dialog>
  el.openJoinDialogBtn.addEventListener('click', () => {
    sfx.play('click');
    el.joinCodeInput.value = '';
    el.joinCodeDialog.showModal();
  });

  el.closeJoinDialogBtn.addEventListener('click', () => {
    el.joinCodeDialog.close();
  });

  el.joinCodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = el.joinCodeInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) return;
    el.joinCodeDialog.close();
    state.intentionalLeave = false;
    sendActionWithProfile(
      { type: 'join_room', code },
      { roomCodeForToken: code }
    );
  });

  // Room Code & Invite Copy
  el.roomCodePill.addEventListener('click', () => {
    if (state.room) copyText(state.room.code, 'Room Code');
  });

  el.copyInviteMainBtn.addEventListener('click', () => {
    if (state.room) copyText(getInviteUrl(state.room.code), 'Invite Link');
  });

  // All Leave Buttons -> Intentional Leave (Terminates Match if Host!)
  el.leaveRoomBtn.addEventListener('click', () => {
    sfx.play('click');
    leaveActiveRoomToMenu();
  });
  el.lobbyLeaveBtn.addEventListener('click', () => {
    sfx.play('click');
    leaveActiveRoomToMenu();
  });
  el.gameoverLeaveBtn.addEventListener('click', () => {
    sfx.play('click');
    leaveActiveRoomToMenu();
  });

  // Browser History Back/Forward Guard
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = (params.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (state.room && state.room.code !== urlCode) {
      leaveActiveRoomToMenu();
    } else {
      checkUrlInviteParam();
    }
  });

  el.addBotBtn.addEventListener('click', () => {
    sfx.play('pop');
    sendWs({ type: 'add_bot' });
  });

  // Lobby Settings Changes
  el.setAnswerMode.addEventListener('change', () =>
    pushSettingsPatch({ answerMode: el.setAnswerMode.value })
  );
  el.setBoardCols.addEventListener('change', () =>
    pushSettingsPatch({ boardCols: Number(el.setBoardCols.value) })
  );
  el.setCluesPerCat.addEventListener('change', () =>
    pushSettingsPatch({ cluesPerCat: Number(el.setCluesPerCat.value) })
  );
  el.setClueTime.addEventListener('change', () =>
    pushSettingsPatch({ clueTimeSec: Number(el.setClueTime.value) })
  );
  el.setDoubleJeopardy.addEventListener('change', () =>
    pushSettingsPatch({ doubleJeopardy: el.setDoubleJeopardy.checked })
  );
  el.setDailyDoubles.addEventListener('change', () =>
    pushSettingsPatch({ dailyDoubles: el.setDailyDoubles.checked })
  );
  el.setFinalJeopardy.addEventListener('change', () =>
    pushSettingsPatch({ finalJeopardy: el.setFinalJeopardy.checked })
  );
  el.setWrongPenalty.addEventListener('change', () =>
    pushSettingsPatch({ wrongPenalty: el.setWrongPenalty.checked })
  );

  // Category Presets & Search
  el.catFilterInput.addEventListener('input', () => {
    state.categorySearchQuery = el.catFilterInput.value;
    if (state.room && state.room.phase === 'lobby') {
      renderLobbyStage(state.room, isMeHost(state.room));
    }
  });

  document.querySelectorAll('.preset-chip[data-preset]').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (!state.room || !isMeHost(state.room)) return;
      sfx.play('pop');
      const preset = chip.dataset.preset;
      const allCats = getAllKnownCategories(state.room);
      let nextIds = [];

      if (preset === 'all') {
        nextIds = allCats.map((c) => c.id);
      } else if (preset === 'none') {
        nextIds = [];
      } else if (preset === 'random6') {
        const shuffled = [...allCats].sort(() => Math.random() - 0.5);
        const count = Math.max(6, state.room.settings.boardCols);
        nextIds = shuffled.slice(0, count).map((c) => c.id);
      } else {
        const matchesGroup = (c) => {
          if (preset === 'pop') return c.group === 'pop' || c.group === 'nerdy';
          return c.group === preset;
        };
        nextIds = allCats
          .filter((c) => matchesGroup(c) || c.group === 'custom')
          .map((c) => c.id);
      }

      pushSettingsPatch({ includedCategoryIds: nextIds });
    });
  });

  // Custom Category Native <dialog>
  el.openCustomCatBtn.addEventListener('click', () => {
    sfx.play('click');
    el.customCatForm.reset();
    el.customCatDialog.showModal();
  });

  el.cancelCustomCatBtn.addEventListener('click', () => {
    el.customCatDialog.close();
  });

  el.customCatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = el.customCatTitle.value.trim();
    const clueInputs = Array.from(el.customCatForm.querySelectorAll('.cc-clue'));
    const ansInputs = Array.from(el.customCatForm.querySelectorAll('.cc-ans'));
    const clues = clueInputs.map((inp, idx) => ({
      clue: inp.value.trim(),
      answer: ansInputs[idx]?.value.trim() || '',
    }));

    el.customCatDialog.close();
    sendWs({
      type: 'add_custom_category',
      category: { name: title, clues },
    });
  });

  el.startGameBtn.addEventListener('click', () => {
    sfx.play('click');
    sendWs({ type: 'start_game' });
  });

  // Daily Double Wager Controls
  el.ddWagerRange.addEventListener('input', () => {
    el.ddWagerNumber.value = el.ddWagerRange.value;
  });
  el.ddWagerNumber.addEventListener('input', () => {
    el.ddWagerRange.value = el.ddWagerNumber.value;
  });
  document.querySelectorAll('[data-dd-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const maxW = Number(el.ddWagerRange.max) || 1000;
      const mode = btn.dataset.ddQuick;
      const val =
        mode === 'max'
          ? maxW
          : mode === 'half'
          ? Math.max(5, Math.round((maxW * 0.5) / 50) * 50)
          : Math.min(100, maxW);
      el.ddWagerRange.value = String(val);
      el.ddWagerNumber.value = String(val);
    });
  });
  el.ddLockWagerBtn.addEventListener('click', () => {
    sfx.play('click');
    sendWs({ type: 'submit_dd_wager', wager: Number(el.ddWagerNumber.value) });
  });

  // Buzzer + Spacebar Shortcut
  el.buzzBtn.addEventListener('click', () => {
    sendWs({ type: 'buzz' });
  });

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    if (!state.room || state.room.phase !== 'clue_open') return;
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return;
    e.preventDefault();
    if (!el.buzzBtn.disabled) {
      sendWs({ type: 'buzz' });
    }
  });

  // Active Clue Answer Form
  el.clueAnswerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = el.clueAnswerInput.value.trim();
    if (!val) return;
    sendWs({ type: 'submit_answer', answer: val });
    el.clueAnswerInput.value = '';
  });

  // Host Ruling Buttons
  el.hostRuleCorrectBtn.addEventListener('click', () => {
    sendWs({ type: 'host_judge', ruling: 'correct' });
  });
  el.hostRuleWrongBtn.addEventListener('click', () => {
    sendWs({ type: 'host_judge', ruling: 'wrong' });
  });

  el.nextClueBtn.addEventListener('click', () => {
    sendWs({ type: 'next_clue' });
  });

  // Final Jeopardy Controls
  el.finalWagerRange.addEventListener('input', () => {
    el.finalWagerNumber.value = el.finalWagerRange.value;
  });
  el.finalWagerNumber.addEventListener('input', () => {
    el.finalWagerRange.value = el.finalWagerNumber.value;
  });
  el.finalLockWagerBtn.addEventListener('click', () => {
    sfx.play('click');
    sendWs({
      type: 'submit_final_wager',
      wager: Number(el.finalWagerNumber.value),
    });
  });

  el.finalAnswerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ans = el.finalAnswerInput.value.trim();
    sendWs({ type: 'submit_final_answer', answer: ans });
  });

  // Game Over Buttons
  el.playAgainBtn.addEventListener('click', () => {
    sfx.play('click');
    sendWs({ type: 'start_game' });
  });
  el.backToLobbyBtn.addEventListener('click', () => {
    sfx.play('click');
    sendWs({ type: 'back_to_lobby' });
  });

  // Chat Form
  el.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = el.chatInput.value.trim();
    if (!txt) return;
    sendWs({ type: 'chat', text: txt });
    el.chatInput.value = '';
  });

  // Chaos All-Play Form
  el.chaosAnswerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = el.chaosAnswerInput.value.trim();
    if (!val) return;
    sfx.play('click');
    sendWs({ type: 'submit_chaos_answer', answer: val });
  });

  // Intermission Continue Button
  el.continueIntermissionBtn?.addEventListener('click', () => {
    sfx.play('click');
    sendWs({ type: 'continue_intermission' });
  });

  // Lobby Match Pace Quick Presets
  document.querySelectorAll('.pace-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isMeHost(state.room)) {
        showToast('Only the room host can change match pacing!', 'error');
        return;
      }
      if (state.room?.phase !== 'lobby') {
        showToast('Settings cannot be changed while a match is in progress.', 'error');
        return;
      }
      const pace = btn.getAttribute('data-pace');
      if (!pace) return;
      sfx.play('click');
      // Immediate visual feedback
      document.querySelectorAll('.pace-btn').forEach((b) => {
        const isSelected = b === btn;
        b.classList.toggle('active', isSelected);
        b.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      });
      pushSettingsPatch({ matchPace: pace });
    });
  });

  // Lobby Bot Difficulty Selector
  document.querySelectorAll('.diff-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isMeHost(state.room)) {
        showToast('Only the room host can change bot difficulty!', 'error');
        return;
      }
      if (state.room?.phase !== 'lobby') {
        showToast('Bot difficulty cannot be changed while a match is in progress.', 'error');
        return;
      }
      const diff = btn.getAttribute('data-diff');
      if (!diff) return;
      sfx.play('click');
      // Immediate visual feedback
      document.querySelectorAll('.diff-btn').forEach((b) => {
        const isSelected = b === btn;
        b.classList.toggle('active', isSelected);
        b.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      });
      if (el.activeDifficultyIndicator) {
        el.activeDifficultyIndicator.textContent = diff.toUpperCase();
      }
      pushSettingsPatch({ botDifficulty: diff });
    });
  });

  // Transfer Host Confirmation Dialog Handlers
  if (el.cancelTransferBtn) {
    el.cancelTransferBtn.addEventListener('click', () => {
      sfx.play('click');
      if (el.transferHostDialog) el.transferHostDialog.close();
      state.pendingTransferPlayerId = null;
    });
  }
  if (el.closeTransferDialogX) {
    el.closeTransferDialogX.addEventListener('click', () => {
      sfx.play('click');
      if (el.transferHostDialog) el.transferHostDialog.close();
      state.pendingTransferPlayerId = null;
    });
  }
  if (el.confirmTransferBtn) {
    el.confirmTransferBtn.addEventListener('click', () => {
      const targetId = state.pendingTransferPlayerId;
      if (!targetId) return;
      sfx.play('click');
      sendWs({ type: 'transfer_host', targetPlayerId: targetId });
      if (el.transferHostDialog) el.transferHostDialog.close();
      state.pendingTransferPlayerId = null;
    });
  }

  // Individual Bot Difficulty Dialog Handlers
  if (el.botModalDiffBtns) {
    el.botModalDiffBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        sfx.play('click');
        const diff = btn.getAttribute('data-diff');
        syncBotModalDiffButtons(diff);
      });
    });
  }
  if (el.cancelBotSettingsBtn) {
    el.cancelBotSettingsBtn.addEventListener('click', () => {
      sfx.play('click');
      if (el.botSettingsDialog) el.botSettingsDialog.close();
      state.editingBotId = null;
    });
  }
  if (el.closeBotSettingsX) {
    el.closeBotSettingsX.addEventListener('click', () => {
      sfx.play('click');
      if (el.botSettingsDialog) el.botSettingsDialog.close();
      state.editingBotId = null;
    });
  }
  if (el.applyBotSettingsBtn) {
    el.applyBotSettingsBtn.addEventListener('click', () => {
      if (!state.editingBotId) return;
      if (!isMeHost(state.room)) {
        showToast('Only the host can modify bot settings!', 'error');
        return;
      }
      sfx.play('click');
      sendWs({
        type: 'set_bot_difficulty',
        botId: state.editingBotId,
        difficulty: state.selectedBotDiff,
      });
      showToast(`Updated ${state.editingBotName || 'Bot'} difficulty to ${state.selectedBotDiff.toUpperCase()}!`, 'success');
      if (el.botSettingsDialog) el.botSettingsDialog.close();
      state.editingBotId = null;
    });
  }

  // Floating Animated MS Paint Pixel Reaction Buttons
  document.querySelectorAll('.reaction-trigger-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const reactionId = normalizeClientReactionId(
        btn.getAttribute('data-reaction') || btn.getAttribute('data-emoji')
      );
      if (!reactionId) return;
      sfx.play('reaction');
      sendWs({ type: 'reaction', reaction: reactionId, emoji: reactionId });
      spawnReactionParticle(reactionId, state.name || 'You');
    });
  });
}

const CLIENT_REACTION_IDS = new Set([
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
]);

const CLIENT_LEGACY_REACTION_MAP = {
  '\u{1F602}': 'rofl',
  '\u{1F525}': 'fire',
  '\u{1F480}': 'facepalm',
  '\u{1F389}': 'celebrate',
  '\u{1F631}': 'shocked',
  '\u{1F914}': 'thinking',
  '\u{1F4A9}': 'sad',
};

function normalizeClientReactionId(raw) {
  const val = String(raw || '').trim();
  if (CLIENT_REACTION_IDS.has(val)) return val;
  if (CLIENT_LEGACY_REACTION_MAP[val]) return CLIENT_LEGACY_REACTION_MAP[val];
  return 'laugh';
}

function spawnReactionParticle(reactionOrEmoji, playerName) {
  if (!el.reactionParticlesContainer) return;
  const reactionId = normalizeClientReactionId(reactionOrEmoji);
  const particle = document.createElement('div');
  particle.className = 'floating-particle';

  const startX = 15 + Math.random() * 65;
  particle.style.left = `${startX}%`;

  const rot = (Math.random() * 14 - 7).toFixed(1);
  particle.style.setProperty('--rot', `${rot}deg`);

  const spriteSpan = document.createElement('span');
  spriteSpan.className = `reaction-sprite reaction-${reactionId}`;
  spriteSpan.setAttribute('aria-hidden', 'true');

  const authorSpan = document.createElement('span');
  authorSpan.className = 'particle-author';
  authorSpan.textContent = playerName || '';

  particle.append(spriteSpan, authorSpan);
  el.reactionParticlesContainer.appendChild(particle);

  particle.addEventListener('animationend', () => {
    particle.remove();
  });
}

/* =========================================================================
   BOOTSTRAP
   ========================================================================= */

function init() {
  installDialogLightDismissFallback();
  el.nameInput.value = state.name;
  syncSoundButtons();
  applyMotionPreference();
  renderHomeMascots();
  renderHomeAvatarPreview();
  checkUrlInviteParam();
  bindEvents();
  loadInitialServerMetadata();
  ensureSocketConnected();
  startTimerLoop();
}

init();


function updateVoiceDockUI(status) {
  if (!el.voiceChatDock) return;
  const inRoom = Boolean(state.room && state.room.phase !== 'terminated');
  el.voiceChatDock.hidden = !inRoom;
  if (!inRoom) return;

  if (el.voiceDockCount) {
    el.voiceDockCount.textContent = `${status.membersCount} in Voice`;
  }

  if (!status.inVoice) {
    if (el.voiceJoinBtn) el.voiceJoinBtn.hidden = false;
    if (el.voiceMuteBtn) el.voiceMuteBtn.hidden = true;
    if (el.voiceDeafenBtn) el.voiceDeafenBtn.hidden = true;
    if (el.voicePttBtn) el.voicePttBtn.hidden = true;
    if (el.voiceLeaveBtn) el.voiceLeaveBtn.hidden = true;
    if (el.voiceDockLabel) el.voiceDockLabel.textContent = 'Voice Chat';
    if (el.voiceDockIcon) {
      el.voiceDockIcon.textContent = '';
      el.voiceDockIcon.className = 'voice-dock-icon pixel-sprite sprite-mic-on';
    }
  } else {
    if (el.voiceJoinBtn) el.voiceJoinBtn.hidden = true;
    if (el.voiceMuteBtn) {
      el.voiceMuteBtn.hidden = false;
      setButtonSpriteAndText(
        el.voiceMuteBtn,
        status.isMuted ? 'sprite-mic-muted' : 'sprite-mic-on',
        status.isMuted ? 'Muted' : 'Mic'
      );
      el.voiceMuteBtn.classList.toggle('is-muted', status.isMuted);
    }
    if (el.voiceDeafenBtn) {
      el.voiceDeafenBtn.hidden = false;
      setButtonSpriteAndText(
        el.voiceDeafenBtn,
        status.isDeafened ? 'sprite-headset-deaf' : 'sprite-headset-on',
        status.isDeafened ? 'Deafened' : 'Deafen'
      );
      el.voiceDeafenBtn.classList.toggle('is-deafened', status.isDeafened);
    }
    if (el.voicePttBtn) {
      el.voicePttBtn.hidden = !status.usePushToTalk;
    }
    if (el.voiceLeaveBtn) el.voiceLeaveBtn.hidden = false;

    if (el.voiceDockLabel) {
      el.voiceDockLabel.textContent = status.isSpeaking
        ? 'Speaking...'
        : (status.isMuted ? 'Mic Muted' : 'Voice Active');
    }
    if (el.voiceDockIcon) {
      el.voiceDockIcon.textContent = '';
      const dockSprite = status.isSpeaking
        ? 'sprite-mic-speaking'
        : (status.isMuted ? 'sprite-mic-muted' : 'sprite-mic-on');
      el.voiceDockIcon.className = `voice-dock-icon pixel-sprite ${dockSprite}`;
    }
  }

  // Update speaking indicators in players list if room is active
  if (state.room) {
    renderPlayersSidebar(state.room, isMeHost(state.room));
  }
}
