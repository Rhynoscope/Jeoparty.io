// JEOPARTY GAME-SHOW STAGE
// Renders the televised presentation layer on top of the existing game:
//   * contestant podiums with real customized avatars behind them
//   * podium money count-up / floating +$ / -$ awards + streak flames
//   * server-authoritative word-by-word clue typing (freeze + resume)
//   * Final Jeopardy category wheel (server-selected result, synced spin)
//
// This module NEVER decides results. It only visualizes server state.

import { buildAvatarHTML } from './avatar.js';
import { sfx } from './audio.js';
import { hostPresenter } from './host.js';
import { judgePresenter } from './judge.js';
import { cinematic } from './cinematic.js';

const CLUE_PHASES = new Set([
  'clue_open',
  'clue_buzzed',
  'clue_chaos',
  'clue_skribbl',
  'daily_double_answer',
  'clue_result',
]);

const PODIUM_VISIBLE_PHASES = new Set([
  'board',
  'clue_open',
  'clue_buzzed',
  'clue_chaos',
  'clue_skribbl',
  'clue_result',
  'daily_double_wager',
  'daily_double_answer',
  'final_wheel',
  'final_wager',
  'final_clue',
]);

const WHEEL_COLORS = ['#1228a6', '#3b1d8f', '#0b3d91', '#4b2a9c', '#1b2a8a', '#2a1266'];
const WHEEL_COLORS_HALLOWEEN = ['#3b1157', '#6a1b1b', '#2a0b3d', '#7a3d0a'];
const MONEY_ANIM_MS = 600;

function formatMoney(amount, halloween) {
  const n = Number(amount) || 0;
  if (halloween) {
    return n < 0 ? `-${Math.abs(n).toLocaleString()} Candy` : `${n.toLocaleString()} Candy`;
  }
  return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
}

function moodForPlayer(room, p, index, topScore) {
  if (room.phase === 'game_over') {
    if (index === 0 && topScore > 0) return 'victory';
    return p.score < 0 ? 'defeat' : 'happy';
  }
  const ac = room.activeClue;
  if (ac) {
    if (ac.buzzedPlayerId === p.id) return 'excited';
    if (ac.solvedIds?.includes(p.id) || ac.chaosSolvedIds?.includes(p.id)) return 'happy';
    if (room.phase === 'clue_result' && ac.winnerName === p.name) return 'victory';
    if (ac.attemptedIds?.includes(p.id)) return 'sad';
  }
  if (room.phase === 'final_clue') return 'idle';
  if (room.phase === 'final_wager') return 'idle';
  if ((p.streak || 0) >= 3) return 'excited';
  if (room.phase === 'board' && room.pickerId === p.id) return 'happy';
  return 'idle';
}

class GameShow {
  constructor() {
    this.elements = {};
    this.room = null;
    this.ctx = {
      playerId: null,
      isHalloween: false,
      clockOffset: 0,
      reduceMotion: false,
      phase: 'lobby',
    };

    this.podiumKey = '';
    this.podiums = new Map();
    this.money = new Map();
    this.lastAwardSeq = 0;
    this.lastRoomKey = '';
    this.lastHostLineId = null;
    this.lastMoneySfxAt = 0;

    this.typing = {
      key: null,
      el: null,
      full: '',
      lastText: null,
    };

    this.wheel = {
      key: null,
      rotation: 0,
      landed: false,
      el: null,
      sectorsEl: null,
      resultEl: null,
      spin: null,
      lastTickAt: 0,
    };

    this.rafStarted = false;
    this.lastFrame = 0;
  }

  init(elements = {}) {
    this.elements = {
      hostStage: elements.hostStage || document.getElementById('host-stage'),
      hostFigure: elements.hostFigure || document.getElementById('host-figure'),
      hostCaption: elements.hostCaption || document.getElementById('host-speech-text'),
      hostName: elements.hostName || document.getElementById('host-name-text'),
      hostVoiceBtn: elements.hostVoiceBtn || document.getElementById('host-voice-btn'),
      judgeStage: elements.judgeStage || document.getElementById('judge-stage'),
      judgeFigure: elements.judgeFigure || document.getElementById('judge-figure'),
      judgeName: elements.judgeName || document.getElementById('judge-name-text'),
      judgeStatus: elements.judgeStatus || document.getElementById('judge-speech-text'),
      judgeControls: elements.judgeControls || document.getElementById('judge-action-controls'),
      judgeTimer: elements.judgeTimer || document.getElementById('judge-timer-fill'),
      contestantStage: elements.contestantStage || document.getElementById('contestant-stage'),
      wheelBox: elements.wheelBox || document.getElementById('final-wheel-box'),
      wheelEl: elements.wheelEl || document.getElementById('final-wheel'),
      wheelSectors: elements.wheelSectors || document.getElementById('final-wheel-sectors'),
      wheelResult: elements.wheelResult || document.getElementById('final-wheel-result'),
      wheelLegend: elements.wheelLegend || document.getElementById('final-wheel-legend'),
    };

    hostPresenter.init({
      figureEl: this.elements.hostFigure,
      captionEl: this.elements.hostCaption,
      nameEl: this.elements.hostName,
      voiceBtnEl: this.elements.hostVoiceBtn,
    });

    judgePresenter.init({
      stageEl: this.elements.judgeStage,
      figureEl: this.elements.judgeFigure,
      nameEl: this.elements.judgeName,
      statusEl: this.elements.judgeStatus,
      controlsEl: this.elements.judgeControls,
      timerEl: this.elements.judgeTimer,
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (this.elements.wheelBox && !this.elements.wheelBox.hidden) {
          this.layoutWheelLabels();
        }
      });
    }

    this.startLoop();
  }

  startLoop() {
    if (this.rafStarted) return;
    this.rafStarted = true;
    const frame = (ts) => {
      this.lastFrame = ts;
      try {
        this.renderFrame();
      } catch (err) {
        // Presentation errors must never break gameplay.
        console.warn('[GameShow] render error', err);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  serverNow() {
    return Date.now() + (Number(this.ctx.clockOffset) || 0);
  }

  /** Called on every authoritative room_state. */
  update(room, ctx = {}) {
    if (!room) return;
    this.room = room;
    this.ctx = {
      playerId: ctx.playerId ?? this.ctx.playerId,
      isHalloween: Boolean(ctx.isHalloween),
      clockOffset: Number(ctx.clockOffset) || 0,
      reduceMotion: Boolean(ctx.reduceMotion),
      phase: room.phase,
    };

    const roomKey = `${room.roomId || ''}:${room.gameId || ''}`;
    if (roomKey !== this.lastRoomKey) {
      this.lastRoomKey = roomKey;
      this.lastAwardSeq = room.awardSeq || 0;
      this.lastHostLineId = null;
      hostPresenter.resetLineMemory();
      this.money.clear();
      this.typing.key = null;
      this.typing.lastText = null;
      this.wheel.key = null;
      this.wheel.landed = false;
      this.wheel.rotation = 0;
    }

    this.updateHostStage(room);
    this.updateJudgeStage(room);
    this.updateContestantStage(room);
    this.consumeAwards(room);
    this.updateWheelVisibility(room);

    if (room.lastHostLine && room.lastHostLine.id !== this.lastHostLineId) {
      this.onHostLine(room.lastHostLine);
    }
  }

  onHostLine(msg) {
    if (!msg || !msg.line) return;
    if (msg.id !== undefined && msg.id === this.lastHostLineId) return;
    if (msg.id !== undefined) this.lastHostLineId = msg.id;
    hostPresenter.showLine(msg.line, msg.tone, msg.id ?? null);
  }

  /* ------------------------------ HOST BAR ------------------------------ */

  updateHostStage(room) {
    const stage = this.elements.hostStage;
    if (!stage) return;
    const visible = room.phase !== 'lobby' && room.phase !== 'terminated' && room.phase !== 'intro';
    stage.hidden = !visible;
    if (!visible) return;
    stage.dataset.mode = this.ctx.isHalloween ? 'halloween' : 'classic';
    stage.dataset.phase = room.phase;
  }

  updateJudgeStage(room) {
    const stage = this.elements.judgeStage;
    if (!stage) return;
    const isHostJudgeMode = room.settings?.answerMode === 'host';
    const ac = room.activeClue;
    const isClueBuzzed = room.phase === 'clue_buzzed';
    if (!isHostJudgeMode || !ac || !isClueBuzzed) {
      judgePresenter.hideJudgeStage();
      return;
    }

    if (ac.isAmbiguous && ac.judgePlayerId) {
      const isViewerJudge = ac.judgePlayerId === this.ctx.playerId;
      const judgePlayer = room.players?.find((p) => p.id === ac.judgePlayerId);
      const judgeName = judgePlayer ? judgePlayer.name : 'Contestant';
      judgePresenter.showRulingPrompt(
        ac.judgeGuessText || ac.buzzedGuessText || '',
        ac.judgeOfficialAnswer || ac.answer || '',
        isViewerJudge
      );
      if (this.elements.judgeName) {
        this.elements.judgeName.textContent = `ROUND JUDGE: ${judgeName.toUpperCase()}`;
      }
      const officialEl = document.getElementById('judge-official-answer-text');
      if (officialEl) {
        officialEl.textContent = ac.judgeOfficialAnswer || ac.answer || '(verifying...)';
      }
    } else {
      judgePresenter.showJudgeStage();
    }
  }

  /* ----------------------------- PODIUMS ------------------------------- */

  updateContestantStage(room) {
    const stage = this.elements.contestantStage;
    if (!stage) return;
    const visible = PODIUM_VISIBLE_PHASES.has(room.phase) && Array.isArray(room.players);
    stage.hidden = !visible;
    if (!visible) return;

    const players = room.players.slice(0, 10);
    const signature = players
      .map(
        (p) =>
          `${p.id}:${p.name}:${p.avatar?.color}:${p.avatar?.eyes}:${p.avatar?.mouth}:${p.avatar?.hat}`
      )
      .join('|');
    const key = `${signature}|${this.ctx.isHalloween ? 'h' : 'c'}|${players.length}`;

    if (key !== this.podiumKey) {
      this.rebuildPodiums(players, key);
    }

    const ranked = [...players].sort((a, b) => b.score - a.score);
    const topScore = ranked[0]?.score ?? 0;
    const leaderId = topScore > 0 ? ranked[0].id : null;
    const winnerId =
      room.phase === 'game_over' && ranked.length > 0 && topScore > 0 ? ranked[0].id : null;

    players.forEach((p, idx) => {
      const pod = this.podiums.get(p.id);
      if (!pod) return;
      const isMe = p.id === this.ctx.playerId;
      const isBuzzed = room.activeClue?.buzzedPlayerId === p.id;
      const isSolved = Boolean(
        room.activeClue?.solvedIds?.includes(p.id) ||
          room.activeClue?.chaosSolvedIds?.includes(p.id)
      );
      const isPicking = room.phase === 'board' && room.pickerId === p.id;
      const isWrong = Boolean(room.activeClue?.attemptedIds?.includes(p.id)) && !isSolved;
      const streak = Number(p.streak) || 0;
      const onFire = streak >= 3;

      pod.root.classList.toggle('is-me', isMe);
      pod.root.classList.toggle('is-offline', !p.connected);
      pod.root.classList.toggle('is-buzzed', isBuzzed);
      pod.root.classList.toggle('is-solved', isSolved);
      pod.root.classList.toggle('is-wrong', isWrong);
      pod.root.classList.toggle('is-picking', isPicking);
      pod.root.classList.toggle('on-fire', onFire);
      pod.root.classList.toggle('has-streak', streak >= 2);
      pod.root.classList.toggle('is-leader', leaderId === p.id);
      pod.root.classList.toggle('is-winner', winnerId === p.id);
      pod.root.classList.toggle('is-bot', Boolean(p.isBot));

      const isJudging = Boolean(p.isJudging || (room.activeClue?.judgePlayerId === p.id));
      pod.root.classList.toggle('is-judging', isJudging);

      const isEliminated = Boolean(p.isEliminated || (room.settings?.gameMode === 'survival' && p.lives <= 0));
      pod.root.classList.toggle('is-eliminated', isEliminated);

      if (room.settings?.gameMode === 'survival') {
        pod.livesEl.hidden = false;
        const lives = Math.max(0, p.lives ?? 3);
        pod.livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
      } else {
        pod.livesEl.hidden = true;
      }

      if (room.settings?.gameMode === 'teams') {
        pod.teamEl.hidden = false;
        pod.teamEl.className = `podium-team-badge team-${p.team || 'red'}`;
        pod.teamEl.textContent = p.team === 'red' ? '🔴 RED' : '🔵 BLUE';
      } else {
        pod.teamEl.hidden = true;
      }

      pod.nameEl.textContent = p.name;
      pod.numberEl.textContent = String(idx + 1).padStart(2, '0');
      pod.botTag.hidden = !p.isBot;
      pod.crownEl.hidden = !(winnerId === p.id || (leaderId === p.id && topScore > 0));

      if (streak >= 2) {
        pod.streakChip.hidden = false;
        pod.streakChip.classList.toggle('is-bonus', streak >= 3);
        pod.streakValue.textContent = `x${streak}`;
        pod.streakBonus.textContent = streak >= 3 ? '+$100' : '1 more!';
      } else {
        pod.streakChip.hidden = true;
      }

      const mood = moodForPlayer(room, p, idx, topScore);
      const avatarKey = `${mood}|${leaderId === p.id ? 1 : 0}|${winnerId === p.id ? 1 : 0}`;
      if (avatarKey !== pod.avatarKey) {
        pod.avatarKey = avatarKey;
        pod.avatarEl.innerHTML = buildAvatarHTML(p.avatar, {
          size: pod.avatarSize,
          mood,
          crown: winnerId === p.id || (leaderId === p.id && topScore > 0),
          delaySec: (idx % 4) * 0.16,
        });
      }

      this.setMoneyTarget(p.id, Number(p.score) || 0);
    });
  }

  rebuildPodiums(players, key) {
    const stage = this.elements.contestantStage;
    if (!stage) return;
    this.podiumKey = key;
    this.podiums.clear();
    stage.innerHTML = '';

    const count = players.length;
    const avatarSize = count <= 3 ? 136 : count <= 6 ? 108 : 88;
    stage.dataset.count = String(count);

    players.forEach((p, idx) => {
      const root = document.createElement('div');
      root.className = 'podium';
      root.dataset.playerId = p.id;
      root.style.setProperty('--podium-index', String(idx));
      root.style.setProperty('--podium-av', `${avatarSize}px`);

      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'podium-avatar-wrap';

      const flames = document.createElement('div');
      flames.className = 'podium-flames';
      flames.setAttribute('aria-hidden', 'true');
      flames.innerHTML = '<i></i><i></i><i></i>';

      const crownEl = document.createElement('span');
      crownEl.className = 'podium-crown pixel-sprite sprite-crown';
      crownEl.setAttribute('aria-hidden', 'true');
      crownEl.hidden = true;

      const avatarEl = document.createElement('div');
      avatarEl.className = 'podium-avatar';
      avatarEl.innerHTML = buildAvatarHTML(p.avatar, {
        size: avatarSize,
        mood: 'idle',
        crown: false,
        delaySec: (idx % 4) * 0.16,
      });

      avatarWrap.append(flames, crownEl, avatarEl);

      const body = document.createElement('div');
      body.className = 'podium-body';

      const numberEl = document.createElement('span');
      numberEl.className = 'podium-number';
      numberEl.textContent = String(idx + 1).padStart(2, '0');

      const teamEl = document.createElement('span');
      teamEl.className = 'podium-team-badge';
      teamEl.hidden = true;

      const nameEl = document.createElement('span');
      nameEl.className = 'podium-name-plate';
      nameEl.textContent = p.name;

      const botTag = document.createElement('span');
      botTag.className = 'podium-bot-tag';
      botTag.textContent = 'BOT';
      botTag.hidden = !p.isBot;

      const moneyEl = document.createElement('span');
      moneyEl.className = 'podium-money';
      moneyEl.textContent = formatMoney(p.score, this.ctx.isHalloween);

      const streakChip = document.createElement('span');
      streakChip.className = 'podium-streak-chip';
      streakChip.hidden = true;
      const streakIcon = document.createElement('span');
      streakIcon.className = 'pixel-sprite sprite-fire podium-streak-icon';
      streakIcon.setAttribute('aria-hidden', 'true');
      const streakValue = document.createElement('span');
      streakValue.className = 'podium-streak-value';
      streakValue.textContent = 'x2';
      const streakBonus = document.createElement('span');
      streakBonus.className = 'podium-streak-bonus';
      streakBonus.textContent = '1 more!';
      streakChip.append(streakIcon, streakValue, streakBonus);

      const livesEl = document.createElement('div');
      livesEl.className = 'podium-lives';
      livesEl.hidden = true;

      const awardLayer = document.createElement('div');
      awardLayer.className = 'podium-award-layer';
      awardLayer.setAttribute('aria-hidden', 'true');

      body.append(numberEl, teamEl, nameEl, botTag, moneyEl, streakChip, livesEl);
      root.append(avatarWrap, body, awardLayer);
      stage.appendChild(root);

      this.podiums.set(p.id, {
        root,
        avatarEl,
        avatarSize,
        avatarKey: '',
        crownEl,
        teamEl,
        nameEl,
        numberEl,
        botTag,
        moneyEl,
        streakChip,
        streakValue,
        streakBonus,
        livesEl,
        awardLayer,
        shownText: moneyEl.textContent,
      });

      this.money.set(p.id, {
        shown: Number(p.score) || 0,
        target: Number(p.score) || 0,
        from: Number(p.score) || 0,
        startedAt: 0,
      });
    });
  }

  setMoneyTarget(playerId, target) {
    let m = this.money.get(playerId);
    if (!m) {
      m = { shown: target, target, from: target, startedAt: 0 };
      this.money.set(playerId, m);
    }
    if (m.target !== target) {
      m.from = m.shown;
      m.target = target;
      m.startedAt = performance.now();
      const pod = this.podiums.get(playerId);
      if (pod) {
        pod.root.classList.toggle('money-gain', target > m.from);
        pod.root.classList.toggle('money-loss', target < m.from);
        clearTimeout(pod.moneyClassTimer);
        pod.moneyClassTimer = setTimeout(() => {
          pod.root.classList.remove('money-gain', 'money-loss');
        }, MONEY_ANIM_MS + 250);
      }
    }
  }

  renderMoney(nowPerf) {
    const halloween = this.ctx.isHalloween;
    for (const [id, m] of this.money) {
      const pod = this.podiums.get(id);
      if (!pod) continue;
      let display = m.target;
      if (m.shown !== m.target) {
        const elapsed = nowPerf - m.startedAt;
        const t = Math.max(0, Math.min(1, elapsed / MONEY_ANIM_MS));
        const eased = 1 - Math.pow(1 - t, 3);
        display = Math.round(m.from + (m.target - m.from) * eased);
        if (t >= 1) display = m.target;
        m.shown = display;
      }
      const text = formatMoney(display, halloween);
      if (text !== pod.shownText) {
        pod.shownText = text;
        pod.moneyEl.textContent = text;
      }
      pod.moneyEl.classList.toggle('is-negative', display < 0);
    }
  }

  consumeAwards(room) {
    const awards = Array.isArray(room.awards) ? room.awards : [];
    for (const award of awards) {
      if (!award || typeof award.id !== 'number') continue;
      if (award.id <= this.lastAwardSeq) continue;
      this.lastAwardSeq = award.id;
      this.spawnAward(award);
      cinematic.onAward(award);
    }
  }

  spawnAward(award) {
    const pod = this.podiums.get(award.playerId);
    if (!pod) return;
    const halloween = this.ctx.isHalloween;
    const delta = Number(award.delta) || 0;

    let label = '';
    let tone = 'gain';
    if (award.kind === 'timeout') {
      label = 'TIME!';
      tone = 'loss';
    } else if (delta > 0) {
      label = `+${formatMoney(delta, halloween)}`;
      tone = 'gain';
    } else if (delta < 0) {
      label = `-${formatMoney(Math.abs(delta), halloween)}`;
      tone = 'loss';
    } else if (award.kind === 'wrong') {
      label = 'NO POINTS';
      tone = 'loss';
    } else if (award.kind === 'final') {
      label = award.correct ? `+${formatMoney(award.wager, halloween)}` : `-${formatMoney(award.wager, halloween)}`;
      tone = award.correct ? 'gain' : 'loss';
    } else {
      return;
    }

    const float = document.createElement('span');
    float.className = `podium-float is-${tone}`;
    float.textContent = label;
    pod.awardLayer.appendChild(float);
    setTimeout(() => float.remove(), 2000);

    pod.root.classList.remove('award-gain', 'award-loss', 'award-streak');
    void pod.root.offsetWidth;
    pod.root.classList.add(tone === 'gain' ? 'award-gain' : 'award-loss');
    clearTimeout(pod.awardTimer);
    pod.awardTimer = setTimeout(() => {
      pod.root.classList.remove('award-gain', 'award-loss', 'award-streak');
    }, 1100);

    if (Number(award.streakBonus) > 0) {
      pod.root.classList.add('award-streak');
      const bonusFloat = document.createElement('span');
      bonusFloat.className = 'podium-float is-streak';
      bonusFloat.textContent = `+${formatMoney(award.streakBonus, halloween)} STREAK`;
      bonusFloat.style.animationDelay = '260ms';
      pod.awardLayer.appendChild(bonusFloat);
      setTimeout(() => bonusFloat.remove(), 2300);
      clearTimeout(pod.streakTimer);
      pod.streakChip.classList.add('is-flashing');
      pod.streakTimer = setTimeout(() => pod.streakChip.classList.remove('is-flashing'), 2200);
    }

    const now = Date.now();
    if (now - this.lastMoneySfxAt > 220) {
      this.lastMoneySfxAt = now;
      sfx.play(tone === 'gain' ? 'money_up' : 'money_down');
    }
  }

  /* --------------------------- CLUE DISPLAY (FULL TEXT IMMEDIATELY) ----------------------------- */

  renderTyping() {
    // Progressive typing removed: full questions appear immediately upon selection.
    const room = this.room;
    if (!room) return;
    const ac = room.activeClue;
    const clueEl = document.getElementById('clue-prompt-text');
    if (clueEl) {
      clueEl.dataset.typing = '0';
      clueEl.classList.remove('is-frozen');
      clueEl.classList.add('is-complete');
      if (ac && room.phase !== 'daily_double_wager' && !clueEl.textContent) {
        clueEl.textContent = ac.clueText || ac.clue || '';
      }
    }
    const finalEl = document.getElementById('final-clue-text');
    if (finalEl) {
      finalEl.dataset.typing = '0';
      finalEl.classList.remove('is-frozen');
      finalEl.classList.add('is-complete');
      if (room.finalState && room.phase === 'final_clue' && !finalEl.textContent) {
        finalEl.textContent = room.finalState.clue || room.finalState.clueText || '';
      }
    }
  }

  /* ---------------------------- FINAL WHEEL ---------------------------- */

  updateWheelVisibility(room) {
    const box = this.elements.wheelBox;
    if (!box) return;
    const wheel = room.finalState?.wheel;
    const visible = room.phase === 'final_wheel' && Boolean(wheel);
    box.hidden = !visible;
    if (visible) this.syncWheel(wheel);
  }

  syncWheel(wheel) {
    const box = this.elements.wheelBox;
    const wheelEl = this.elements.wheelEl;
    const sectorsEl = this.elements.wheelSectors;
    const resultEl = this.elements.wheelResult;
    const legendEl = this.elements.wheelLegend;
    if (!box || !wheelEl || !sectorsEl) return;

    if (wheel.id === this.wheel.key) {
      this.wheel.spin = wheel;
      return;
    }

    this.wheel.key = wheel.id;
    this.wheel.spin = wheel;
    this.wheel.landed = false;
    this.wheel.rotation = 0;
    this.wheel.lastTickAt = 0;

    const sectors = Array.isArray(wheel.sectors) && wheel.sectors.length > 0 ? wheel.sectors : [];
    const count = Math.max(1, sectors.length);
    const angle = 360 / count;
    const palette = this.ctx.isHalloween ? WHEEL_COLORS_HALLOWEEN : WHEEL_COLORS;

    const stops = [];
    for (let i = 0; i < count; i++) {
      const color = palette[i % palette.length];
      stops.push(`${color} ${(i * angle).toFixed(2)}deg ${((i + 1) * angle).toFixed(2)}deg`);
    }
    wheelEl.style.background = `conic-gradient(${stops.join(', ')})`;
    wheelEl.style.transform = 'rotate(0deg)';
    wheelEl.classList.remove('is-landed');
    wheelEl.classList.add('is-spinning');

    sectorsEl.innerHTML = '';
    this.wheel.labelEls = [];
    const labelCharLimit = count >= 7 ? 15 : count >= 5 ? 18 : 22;
    box.style.setProperty(
      '--wheel-label-size',
      count >= 7 ? '0.4rem' : count >= 5 ? '0.47rem' : '0.56rem'
    );
    sectors.forEach((sector, i) => {
      const label = document.createElement('span');
      label.className = 'wheel-sector-label';
      label.dataset.index = String(i);
      const inner = document.createElement('span');
      inner.className = 'wheel-sector-text';
      inner.textContent =
        sector.name.length > labelCharLimit
          ? `${sector.name.slice(0, labelCharLimit - 1).trimEnd()}…`
          : sector.name;
      label.appendChild(inner);
      sectorsEl.appendChild(label);
      this.wheel.labelEls.push(label);
    });
    this.layoutWheelLabels();

    if (legendEl) {
      legendEl.innerHTML = '';
      sectors.forEach((sector, i) => {
        const chip = document.createElement('span');
        chip.className = 'wheel-legend-chip';
        chip.dataset.index = String(i);
        chip.textContent = sector.name;
        legendEl.appendChild(chip);
      });
    }

    if (resultEl) {
      resultEl.textContent = 'SPINNING...';
      resultEl.classList.remove('is-revealed');
    }
    box.classList.add('is-spinning');

    sfx.play('wheel_spin');
  }

  /** Recomputes radial label positions from the wheel's live size. */
  layoutWheelLabels() {
    const wheelEl = this.elements.wheelEl;
    const labels = this.wheel.labelEls || [];
    const spin = this.wheel.spin;
    if (!wheelEl || labels.length === 0 || !spin) return;
    const size = wheelEl.clientWidth || 260;
    const radius = Math.round(size * 0.345);
    const count = Math.max(1, labels.length);
    const angle = 360 / count;
    labels.forEach((label, i) => {
      const center = i * angle + angle / 2;
      // Keep labels on the lower half upright instead of upside-down.
      const flip = center > 90 && center < 270 ? -90 : 90;
      label.style.transform = `translate(-50%, -50%) rotate(${center.toFixed(2)}deg) translateY(-${radius}px) rotate(${flip}deg)`;
    });
  }

  renderWheel(nowServer) {
    const box = this.elements.wheelBox;
    const wheelEl = this.elements.wheelEl;
    const spin = this.wheel.spin;
    if (!box || box.hidden || !wheelEl || !spin) return;

    const count = Math.max(1, Number(spin.sectorCount) || (spin.sectors?.length ?? 1));
    const angle = 360 / count;
    const targetCenter = (Number(spin.targetIndex) || 0) * angle + angle / 2;
    const turns = Math.max(4, Number(spin.spins) || 5);
    const totalRotation = turns * 360 - targetCenter;

    const startedAt = Number(spin.startedAt) || 0;
    const duration = Math.max(800, Number(spin.durationMs) || 5200);
    const progress = this.ctx.reduceMotion
      ? 1
      : Math.max(0, Math.min(1, (nowServer - startedAt) / duration));
    const eased = 1 - Math.pow(1 - progress, 3.2);
    const rotation = totalRotation * eased;

    if (Math.abs(rotation - this.wheel.rotation) > 0.01) {
      this.wheel.rotation = rotation;
      wheelEl.style.transform = `rotate(${rotation.toFixed(2)}deg)`;
    }

    // Mechanical tick sound while the wheel is moving quickly.
    if (progress > 0 && progress < 1 && this.lastFrame - this.wheel.lastTickAt > 90) {
      this.wheel.lastTickAt = this.lastFrame;
      const speed = 1 - progress;
      if (speed > 0.18) sfx.play('wheel_tick');
    }

    if (progress >= 1 && !this.wheel.landed) {
      this.wheel.landed = true;
      wheelEl.classList.remove('is-spinning');
      wheelEl.classList.add('is-landed');
      box.classList.remove('is-spinning');
      box.classList.add('is-landed');
      const labels = box.querySelectorAll('.wheel-sector-label');
      labels.forEach((label) => {
        const isWin = Number(label.dataset.index) === Number(spin.targetIndex);
        label.classList.toggle('is-winner', isWin);
      });
      const chips = box.querySelectorAll('.wheel-legend-chip');
      chips.forEach((chip) => {
        const isWin = Number(chip.dataset.index) === Number(spin.targetIndex);
        chip.classList.toggle('is-winner', isWin);
      });
      const resultEl = this.elements.wheelResult;
      if (resultEl) {
        resultEl.textContent = `THE CATEGORY IS: ${spin.wheelCategory}`;
        resultEl.classList.add('is-revealed');
      }
    }
  }

  /* ------------------------------ FRAME -------------------------------- */

  reset() {
    this.room = null;
    this.podiumKey = '';
    this.podiums.clear();
    this.money.clear();
    this.lastAwardSeq = 0;
    this.lastRoomKey = '';
    this.lastHostLineId = null;
    hostPresenter.resetLineMemory();
    this.typing = { key: null, el: null, full: '', lastText: null };
    this.wheel.key = null;
    this.wheel.spin = null;
    this.wheel.landed = false;
    this.wheel.rotation = 0;
    if (this.elements.contestantStage) this.elements.contestantStage.innerHTML = '';
    if (this.elements.hostStage) this.elements.hostStage.hidden = true;
    if (this.elements.wheelBox) this.elements.wheelBox.hidden = true;
  }

  renderFrame() {
    const nowPerf = performance.now();
    if (document.hidden) return;
    this.renderMoney(nowPerf);
    this.renderTyping(this.serverNow());
    this.renderWheel(this.serverNow());
  }
}

export const gameShow = new GameShow();
