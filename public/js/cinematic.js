// CINEMATIC 2.5D CAMERA — game-show intro, host/contestant close-ups and
// broadcast cutaways, built on layered MS Paint pixel-art.
//
// The server owns the intro storyboard (order + timings) and every gameplay
// result. This module only moves a virtual camera and renders the stage.

import { buildAvatarHTML } from './avatar.js';
import { buildHostSVG, hostPresenter } from './host.js';
import { sfx } from './audio.js';

const STAGE_W = 1600;
const STAGE_H = 900;
const MAX_PODIUMS = 10;

const WIDE = { x: 800, y: 470, zoom: 1, rotY: 0, rotX: 0 };
const HOST_TARGET = { x: 220, y: 610, zoom: 1.8, rotY: 0, rotX: 0 };
const BOARD_TARGET = { x: 1120, y: 330, zoom: 1.55, rotY: 0, rotX: 0 };

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function esc(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(amount, halloween) {
  const n = Number(amount) || 0;
  if (halloween) {
    return n < 0 ? `-${Math.abs(n).toLocaleString()} Candy` : `${n.toLocaleString()} Candy`;
  }
  return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
}

class CinematicCamera {
  constructor() {
    this.active = false;
    this.screen = 'none';
    this.room = null;
    this.ctx = {};
    this.mode = 'on';
    this.reduceMotion = false;
    this.isMobile = false;
    this.halloween = false;
    this.initialized = false;

    this.layer = null;
    this.viewport = null;
    this.world = null;
    this.els = {};
    this.positions = null;
    this.introId = null;
    this.stepKey = null;
    this.boardPulledBack = false;
    this.lastPhase = null;
    this.cam = { ...WIDE };
    this.tween = null;
    this.focusEndsAt = 0;
    this.focusStartedAt = 0;
    this.focusPlayerId = null;
    this.focusMoney = null;
    this.endTimer = null;
    this.lastAwardAt = 0;
    this.championShownFor = null;
    this.rafStarted = false;
    this.lastFrame = 0;
    this.onSkipIntro = null;
    this.lastSubtitleKey = null;
    this.ttsStepKey = null;
  }

  init({ onSkipIntro } = {}) {
    if (this.initialized) return;
    this.layer = document.getElementById('cinematic-layer');
    if (!this.layer) return;
    this.onSkipIntro = onSkipIntro || null;
    this.initialized = true;

    this.layer.innerHTML = `
      <div class="cine-viewport">
        <div class="cine-world" aria-hidden="true"></div>
        <div class="cine-vignette" aria-hidden="true"></div>
      </div>
      <div class="cine-hud">
        <span class="cine-live"><span class="cine-live-dot" aria-hidden="true"></span><span class="cine-live-text">ON AIR</span></span>
        <span class="cine-step-label"></span>
        <button type="button" class="cine-skip-btn" hidden>SKIP INTRO <span aria-hidden="true">&#9197;</span></button>
      </div>
      <div class="cine-lower-third" aria-live="polite">
        <div class="cine-lt-avatar" aria-hidden="true"></div>
        <div class="cine-lt-text">
          <span class="cine-lt-name"></span>
          <p class="cine-lt-line"></p>
        </div>
        <span class="cine-lt-tag"></span>
      </div>
      <div class="cine-flash" aria-hidden="true"></div>
    `;

    this.viewport = this.layer.querySelector('.cine-viewport');
    this.world = this.layer.querySelector('.cine-world');
    this.els = {
      hud: this.layer.querySelector('.cine-hud'),
      live: this.layer.querySelector('.cine-live-text'),
      step: this.layer.querySelector('.cine-step-label'),
      skip: this.layer.querySelector('.cine-skip-btn'),
      lt: this.layer.querySelector('.cine-lower-third'),
      ltAvatar: this.layer.querySelector('.cine-lt-avatar'),
      ltName: this.layer.querySelector('.cine-lt-name'),
      ltLine: this.layer.querySelector('.cine-lt-line'),
      ltTag: this.layer.querySelector('.cine-lt-tag'),
      flash: this.layer.querySelector('.cine-flash'),
    };

    this.els.skip.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.onSkipIntro) this.onSkipIntro();
    });

    if (!this.rafStarted) {
      this.rafStarted = true;
      requestAnimationFrame((ts) => this.tick(ts));
    }
  }

  /* ============================ PUBLIC API ============================ */

  update(room, ctx = {}) {
    if (!this.initialized || !this.layer) return;
    this.room = room;
    this.ctx = ctx;
    this.mode = room.settings?.cinematicCamera || 'on';
    this.reduceMotion = Boolean(ctx.reduceMotion);
    this.halloween = Boolean(ctx.isHalloween);

    const phase = room.phase;
    const prev = this.lastPhase;
    this.lastPhase = phase;

    if (phase === 'intro' && room.intro) {
      if (this.screen !== 'intro' || this.introId !== room.intro.id) {
        this.startIntro(room);
      }
      this.updateIntroFrame();
    } else if (this.screen === 'intro') {
      this.endScreen(240);
    }

    if (prev !== phase) {
      if (phase === 'final_wheel' && this.allowMotion()) {
        this.showBumper(room);
      }
      if (phase === 'lobby' || phase === 'terminated') {
        this.reset();
      }
    }

    if (this.screen === 'intro') {
      const host = Boolean(ctx.isHost);
      this.els.skip.hidden = !host;
    } else {
      this.els.skip.hidden = true;
    }
  }

  onHostLine(msg) {
    if (!msg || !this.room) return;
    if (msg.event === 'winner' && this.room.phase === 'game_over') {
      const winnerId = this.room.players
        ?.slice()
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.id;
      if (winnerId && this.championShownFor !== `${this.room.gameId}:${winnerId}`) {
        this.championShownFor = `${this.room.gameId}:${winnerId}`;
        this.showChampion(this.room, winnerId, msg);
      }
    }
  }

  onAward(award) {
    if (!award || !this.room || this.screen === 'intro') return;
    if (!this.allowMotion()) return;
    if (award.kind === 'final') return; // champion close-up handles the finale
    const now = performance.now();
    if (now - this.lastAwardAt < 180) return;
    this.lastAwardAt = now;

    if (!this.allowCutaways()) {
      this.nudgePlayer(award.playerId, award.delta < 0 ? 'loss' : 'gain');
      return;
    }

    const phase = this.room.phase;
    const activeQuestion = [
      'clue_open',
      'clue_buzzed',
      'clue_chaos',
      'clue_skribbl',
      'daily_double_answer',
      'final_clue',
    ].includes(phase);

    if (activeQuestion) {
      // Never cover the buzzer / answer box while a clue is live.
      this.nudgePlayer(award.playerId, award.delta < 0 ? 'loss' : 'gain');
      return;
    }

    if (phase === 'clue_result' || phase === 'game_over' || phase.startsWith('final_')) {
      const streak = Number(award.streakBonus) > 0;
      this.focusPlayer(award.playerId, {
        tone: award.delta < 0 ? 'loss' : 'gain',
        streak,
        duration: streak ? 2400 : award.delta < 0 ? 1500 : 1800,
        award,
      });
    } else {
      this.nudgePlayer(award.playerId, award.delta < 0 ? 'loss' : 'gain');
    }
  }

  reset() {
    clearTimeout(this.endTimer);
    this.screen = 'none';
    this.introId = null;
    this.stepKey = null;
    this.tween = null;
    this.focusEndsAt = 0;
    this.championShownFor = null;
    this.boardPulledBack = false;
    document.body.classList.remove('cine-active');
    this.clearCutawayFrame();
    if (this.layer) {
      this.layer.hidden = true;
      this.layer.className = 'cinematic-layer';
      this.world.innerHTML = '';
    }
    if (this.els.skip) this.els.skip.hidden = true;
  }

  allowMotion() {
    if (!this.room) return false;
    return this.mode !== 'off';
  }

  allowCutaways() {
    return this.mode === 'on' && !this.reduceMotion;
  }

  isIntro() {
    return this.screen === 'intro';
  }

  /* ============================ INTRO ============================ */

  startIntro(room) {
    if (!room.intro) return;
    document.body.classList.add('cine-active');
    this.clearCutawayFrame();
    this.screen = 'intro';
    this.introId = room.intro.id;
    this.stepKey = null;
    this.boardPulledBack = false;
    this.boardZoomed = false;
    this.lastSubtitleKey = null;
    this.ttsStepKey = null;
    this.layer.hidden = false;
    this.layer.className = `cinematic-layer is-intro${this.halloween ? ' is-halloween' : ''}`;
    this.buildStage(room, { mode: 'intro' });
    this.measurePositions();
    this.cam = { ...WIDE, zoom: this.isMobile ? 1.22 : 0.96 };
    this.applyCamera();
    this.els.live.textContent = 'ON AIR';
    this.els.step.textContent = '';
    this.els.skip.hidden = !this.ctx.isHost;
    this.els.lt.classList.remove('is-hidden');
    this.updateIntroFrame();
  }

  updateIntroFrame() {
    const room = this.room;
    const intro = room?.intro;
    if (!intro || this.screen !== 'intro') return;
    const now = Date.now() + (this.ctx.clockOffset || 0);
    const elapsed = now - intro.startedAt;

    if (elapsed >= intro.durationMs - 220) {
      if (!this.layer.classList.contains('is-leaving')) {
        this.layer.classList.add('is-leaving');
      }
      // The server transitions to the board shortly after this; the layer is
      // hidden when the authoritative board state arrives (no UI flash).
      return;
    }
    if (elapsed < 0) return;

    const steps = Array.isArray(intro.steps) ? intro.steps : [];
    let step = steps[0];
    for (const candidate of steps) {
      if (elapsed >= candidate.startMs && elapsed < candidate.startMs + candidate.durationMs) {
        step = candidate;
        break;
      }
      if (elapsed >= candidate.startMs) step = candidate;
    }
    if (!step) return;

    const stepKey = `${intro.id}:${step.startMs}`;
    if (stepKey !== this.stepKey) {
      this.stepKey = stepKey;
      this.enterIntroStep(step, intro);
    }

    // Board reveal: first pull back to reveal the stage, then push in on the
    // board, then settle back to the wide gameplay framing.
    if (step.kind === 'board') {
      if (!this.boardZoomed && elapsed >= step.startMs + step.durationMs * 0.38) {
        this.boardZoomed = true;
        this.startTween(this.shotForStep(step), this.reducedShotDuration(650));
      }
      if (!this.boardPulledBack && elapsed >= step.startMs + step.durationMs * 0.8) {
        this.boardPulledBack = true;
        this.startTween(
          {
            ...WIDE,
            x: this.isMobile ? 650 : WIDE.x,
            zoom: this.isMobile ? 1.18 : 1,
            rotY: 0,
            rotX: this.mode === 'reduced' || this.reduceMotion ? 0 : WIDE.rotX,
          },
          this.reducedShotDuration(520)
        );
      }
    }
  }

  enterIntroStep(step, intro) {
    const positions = this.positions || { podiums: new Map() };
    const target = this.shotForStep(step);
    const stepDuration = Math.min(1000, Math.max(420, step.durationMs * 0.5));
    if (step.kind === 'board') {
      // Start with the wide reveal, then the timed board push-in follows.
      this.boardZoomed = false;
      this.boardPulledBack = false;
      this.startTween(
        {
          ...WIDE,
          x: this.isMobile ? 650 : WIDE.x,
          zoom: this.isMobile ? 1.18 : 1,
          rotY: 0,
          rotX: this.mode === 'reduced' || this.reduceMotion ? 0 : WIDE.rotX,
        },
        this.reducedShotDuration(600)
      );
    } else {
      this.startTween(target, this.reducedShotDuration(stepDuration));
    }

    this.clearPodFocus();
    this.world.querySelector('.cine-host')?.classList.remove('is-talking');
    const cinePrevHostFig = this.world.querySelector('.cine-host-figure');
    if (cinePrevHostFig) {
      cinePrevHostFig.innerHTML = buildHostSVG('idle', !!intro.halloween, { size: 140 });
    }
    this.world.querySelector('.cine-board')?.classList.remove('is-active');
    this.els.lt.classList.remove('is-hidden');
    sfx.play('cine_shot');

    if (step.kind === 'wide') {
      this.els.live.textContent = 'LIVE';
      this.els.step.textContent = `${intro.playerCount} CONTESTANTS`;
      this.showLowerThird({
        name: 'JEOPARTY',
        line: 'Live from the pixel stage!',
        avatar: `<span class="cine-lt-logomark">J!</span>`,
        tag: 'THE SHOW',
        title: true,
      });
    } else if (step.kind === 'host') {
      this.els.live.textContent = 'ON AIR';
      this.els.step.textContent = 'YOUR HOST';
      this.world.querySelector('.cine-host')?.classList.add('is-talking');
      const cineHostFig = this.world.querySelector('.cine-host-figure');
      if (cineHostFig) {
        cineHostFig.innerHTML = buildHostSVG('talking', !!intro.halloween, { size: 140 });
      }
      this.showLowerThird({
        name: intro.hostName || 'Jeoparty Host',
        line: step.line || '',
        avatar: buildHostSVG('talking', !!intro.halloween, { size: 56 }),
        tag: 'YOUR HOST',
      });
      this.speakHost(step);
    } else if (step.kind === 'player') {
      this.els.live.textContent = 'ON AIR';
      this.els.step.textContent = `CONTESTANT ${step.index || 1} OF ${step.total || intro.playerCount}`;
      const pod = this.setPodFocus(step.playerId, 'speaking');
      this.showLowerThird({
        name: step.name || 'Contestant',
        line: step.line || '',
        avatar: buildAvatarHTML(step.avatar || {}, { size: 56, mood: 'speaking' }),
        tag: step.isBot ? 'BOT CONTESTANT' : 'CONTESTANT',
      });
      if (pod) {
        pod.classList.add('is-speaking');
      }
    } else if (step.kind === 'board') {
      this.els.live.textContent = 'ON AIR';
      this.els.step.textContent = 'THE BOARD';
      this.world.querySelector('.cine-board')?.classList.add('is-active');
      this.showLowerThird({
        name: intro.hostName || 'Jeoparty Host',
        line: step.line || '',
        avatar: buildHostSVG('waving', !!intro.halloween, { size: 56 }),
        tag: 'THE BOARD',
      });
      // The server announces this exact line when the intro hands over to the
      // board, so the host voice speaks it once (not again from the overlay).
      this.ttsStepKey = `${this.introId}:${step.startMs}`;
    }

    this.els.lt.classList.remove('is-swap');
    void this.els.lt.offsetWidth;
    this.els.lt.classList.add('is-swap');
  }

  speakHost(step) {
    const key = `${this.introId}:${step.startMs}`;
    if (this.ttsStepKey === key) return;
    this.ttsStepKey = key;
    if (step.line) hostPresenter.speak(step.line);
  }

  shotForStep(step) {
    const positions = this.positions || { podiums: new Map(), host: HOST_TARGET, board: BOARD_TARGET };
    const reduced = this.mode === 'reduced' || this.reduceMotion;
    const mobile = this.isMobile;
    const mobileBoost = mobile ? 1.5 : 1;
    const yShift = mobile ? 90 : 24;

    if (step.kind === 'host') {
      const base = positions.host || HOST_TARGET;
      return {
        x: base.x,
        y: base.y - 55 + yShift,
        zoom: reduced ? 1.24 : 1.6 * mobileBoost,
        rotY: 0,
        rotX: 0,
      };
    }
    if (step.kind === 'player') {
      const base = positions.podiums.get(step.playerId);
      if (!base) return { ...WIDE, zoom: mobile ? 1.2 : 1 };
      return {
        x: base.x,
        y: base.y - 150 + yShift,
        zoom: reduced ? 1.28 : 1.68 * mobileBoost,
        rotY: 0,
        rotX: 0,
      };
    }
    if (step.kind === 'board') {
      const base = positions.board || BOARD_TARGET;
      return {
        x: base.x,
        y: base.y + yShift * 0.4,
        zoom: reduced ? 1.22 : 1.55 * (mobile ? 1.25 : 1),
        rotY: 0,
        rotX: 0,
      };
    }
    return {
      ...WIDE,
      x: mobile ? 650 : WIDE.x,
      zoom: mobile ? 1.18 : 1,
      rotX: 0,
      rotY: 0,
    };
  }

  reducedShotDuration(ms) {
    if (this.mode === 'reduced' || this.reduceMotion) return 120;
    return ms;
  }

  /* ============================ EVENT CUTAWAYS ============================ */

  focusPlayer(playerId, opts = {}) {
    const room = this.room;
    if (!room || !this.allowCutaways() || this.isIntro()) return;
    const player = (room.players || []).find((p) => p.id === playerId);
    if (!player) return;
    document.body.classList.add('cine-active');
    const tone = opts.tone === 'loss' ? 'loss' : 'gain';
    const streak = Boolean(opts.streak);
    const duration = Math.max(900, Number(opts.duration) || 1700);

    this.screen = 'focus';
    this.layer.hidden = false;
    this.prepareCutawayFrame();
    this.layer.className = `cinematic-layer is-cutaway is-${tone}${streak ? ' is-streak' : ''}${
      this.halloween ? ' is-halloween' : ''
    }`;
    this.buildStage(room, { mode: 'focus' });
    this.measurePositions();
    this.clearPodFocus();

    const focusPod = this.world.querySelector(
      `.cine-pod[data-player-id="${this.cssEscape(playerId)}"]`
    );
    if (!focusPod) {
      this.endScreen(0);
      return;
    }
    this.world.querySelectorAll('.cine-pod').forEach((pod) => {
      if (pod !== focusPod) pod.classList.add('is-dim');
    });
    focusPod.classList.add('is-active', tone === 'loss' ? 'is-loss' : 'is-gain');
    if (streak) focusPod.classList.add('is-streak');
    const mood = streak ? 'excited' : tone === 'loss' ? 'defeat' : 'happy';
    this.setPodAvatar(focusPod, player.avatar, mood);

    const base = this.positions.podiums.get(playerId) || HOST_TARGET;
    const yShift = this.isMobile ? 80 : 24;
    const zoom = this.isMobile ? 3.5 : 2.95;
    this.cam = { x: base.x, y: base.y + yShift + 60, zoom: zoom * 0.68, rotY: 0, rotX: 0 };
    this.applyCamera();
    this.startTween(
      { x: base.x, y: base.y + yShift, zoom, rotY: 0, rotX: 0 },
      420
    );

    const hostLine =
      room.lastHostLine?.line ||
      (tone === 'loss' ? "Oh no, that's incorrect!" : 'That is correct!');
    this.els.live.textContent = streak ? 'ON FIRE' : 'ON AIR';
    this.els.step.textContent = streak
      ? `STREAK x${player.streak || 3}`
      : tone === 'loss'
      ? 'MISSED'
      : 'CORRECT';
    this.showLowerThird({
      name: `${player.name}${player.isBot ? ' [BOT]' : ''}`,
      line: hostLine,
      avatar: buildAvatarHTML(player.avatar, { size: 56, mood }),
      tag: streak ? 'STREAK BONUS' : tone === 'loss' ? 'INCORRECT' : 'CORRECT',
    });

    // Animate the authoritative money on the focused podium.
    const moneyEl = focusPod.querySelector('.cine-pod-money');
    if (moneyEl) {
      const delta = Number(opts.award?.delta) || 0;
      const target = Number(player.score) || 0;
      const from = target - delta;
      this.animateFocusMoney(moneyEl, from, target, tone === 'loss');
    }
    if (opts.award && Number(opts.award.delta) !== 0) {
      const float = document.createElement('span');
      float.className = `cine-focus-float is-${tone}`;
      float.textContent = `${opts.award.delta > 0 ? '+' : '-'}${formatMoney(
        Math.abs(opts.award.delta),
        this.halloween
      )}`;
      focusPod.appendChild(float);
      setTimeout(() => float.remove(), 2200);
    }
    if (streak && Number(opts.award?.streakBonus) > 0) {
      const bonus = document.createElement('span');
      bonus.className = 'cine-focus-float is-streak';
      bonus.textContent = `+${formatMoney(opts.award.streakBonus, this.halloween)} STREAK`;
      focusPod.appendChild(bonus);
      setTimeout(() => bonus.remove(), 2600);
    }

    this.focusEndsAt = performance.now() + duration;
    this.focusStartedAt = performance.now();
    this.focusPlayerId = playerId;
    this.flash();
  }

  showChampion(room, winnerId, hostLine) {
    if (!room || !this.allowCutaways() || this.isIntro()) return;
    const player = (room.players || []).find((p) => p.id === winnerId);
    if (!player) return;
    document.body.classList.add('cine-active');
    this.screen = 'focus';
    this.layer.hidden = false;
    this.prepareCutawayFrame();
    this.layer.className = `cinematic-layer is-cutaway is-champion${this.halloween ? ' is-halloween' : ''}`;
    this.buildStage(room, { mode: 'champion' });
    this.measurePositions();
    this.clearPodFocus();
    const focusPod = this.world.querySelector(
      `.cine-pod[data-player-id="${this.cssEscape(winnerId)}"]`
    );
    if (!focusPod) {
      this.endScreen(0);
      return;
    }
    this.world.querySelectorAll('.cine-pod').forEach((pod) => {
      if (pod !== focusPod) pod.classList.add('is-dim');
    });
    focusPod.classList.add('is-active', 'is-champion');
    this.setPodAvatar(focusPod, player.avatar, 'victory');
    const base = this.positions.podiums.get(winnerId) || HOST_TARGET;
    const zoom = this.isMobile ? 3.4 : 2.9;
    this.cam = { x: STAGE_W / 2, y: STAGE_H / 2, zoom: this.isMobile ? 1.3 : 1.1, rotY: 0, rotX: 0 };
    this.applyCamera();
    this.startTween(
      { x: base.x, y: base.y + (this.isMobile ? 60 : 12), zoom, rotY: 0, rotX: 0 },
      900
    );
    this.els.live.textContent = 'CHAMPION';
    this.els.step.textContent = 'FINAL RESULTS';
    this.showLowerThird({
      name: player.name,
      line: hostLine?.line || `We have our champion! ${player.name} wins!`,
      avatar: buildAvatarHTML(player.avatar, { size: 56, mood: 'victory', crown: true }),
      tag: `CHAMPION • ${formatMoney(player.score, this.halloween)}`,
    });
    focusPod.appendChild(this.buildConfetti());
    this.focusEndsAt = performance.now() + 3000;
    this.focusStartedAt = performance.now();
    this.focusPlayerId = winnerId;
    this.flash();
  }

  showBumper(room) {
    if (!room || this.isIntro()) return;
    document.body.classList.add('cine-active');
    const duration = this.mode === 'reduced' || this.reduceMotion ? 900 : 1600;
    this.screen = 'bumper';
    this.layer.hidden = false;
    this.prepareCutawayFrame();
    this.layer.className = `cinematic-layer is-bumper${this.halloween ? ' is-halloween' : ''}`;
    this.buildStage(room, { mode: 'bumper' });
    this.measurePositions();
    this.clearPodFocus();
    this.cam = { x: STAGE_W / 2, y: STAGE_H / 2 + 40, zoom: this.isMobile ? 1.45 : 1.15, rotY: 0, rotX: -1 };
    this.applyCamera();
    this.startTween(
      { x: STAGE_W / 2, y: STAGE_H / 2, zoom: this.isMobile ? 1.25 : 1, rotY: 0, rotX: -1.2 },
      700
    );
    this.els.live.textContent = 'FINAL JEOPARDY';
    this.els.step.textContent = 'THE FINAL ROUND';
    this.showLowerThird({
      name: 'FINAL JEOPARDY',
      line: room.lastHostLine?.line || "It's time for Final Jeopardy!",
      avatar: `<span class="cine-lt-logomark">J!</span>`,
      tag: 'THE BIG FINALE',
      title: true,
    });
    this.focusEndsAt = performance.now() + duration;
    this.flash();
  }

  /* ============================ NUDGE (live clue) ============================ */

  nudgePlayer(playerId, tone) {
    if (this.mode === 'off' || this.reduceMotion) return;
    const stage = document.getElementById('contestant-stage');
    if (!stage) return;
    const pod = stage.querySelector(
      `.podium[data-player-id="${this.cssEscape(playerId)}"]`
    );
    if (!pod) return;
    stage.classList.add('is-camera-focusing');
    pod.classList.add('is-camera-target', tone === 'loss' ? 'is-camera-loss' : 'is-camera-gain');
    clearTimeout(this.nudgeTimer);
    this.nudgeTimer = setTimeout(() => {
      stage.classList.remove('is-camera-focusing');
      pod.classList.remove('is-camera-target', 'is-camera-loss', 'is-camera-gain');
    }, 1500);
  }

  /* ============================ STAGE RENDERING ============================ */

  /**
   * Cutaways are absolutely positioned over the center stage. On tall panels
   * (e.g. the final results) only the visible part of the stage should be used,
   * so captions and the lower-third stay inside the broadcast frame.
   */
  prepareCutawayFrame() {
    if (!this.layer) return;
    const stage = document.querySelector('.center-stage');
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visible = Math.max(300, Math.min(rect.height, vh - Math.max(8, rect.top) - 8));
    this.layer.style.bottom = 'auto';
    this.layer.style.height = `${Math.round(visible)}px`;
  }

  clearCutawayFrame() {
    if (!this.layer) return;
    this.layer.style.bottom = '';
    this.layer.style.height = '';
  }

  buildStage(room, { mode = 'intro' } = {}) {
    const players = (room.players || []).filter((p) => p.connected).slice(0, MAX_PODIUMS);
    const halloween = this.halloween;
    this.halloween = halloween;
    this.world.innerHTML = '';

    const layer = (cls, html = '') => {
      const el = document.createElement('div');
      el.className = `cine-layer ${cls}`;
      if (html) el.innerHTML = html;
      this.world.appendChild(el);
      return el;
    };

    layer('cine-sky');
    layer('cine-sky-glow');
    layer('cine-studio-pillar cine-curtain cine-curtain-l');
    layer('cine-studio-pillar cine-curtain cine-curtain-r');
    layer('cine-studio-truss cine-valance', '<span class="cine-valance-lights cine-studio-lights"></span>');
    layer('cine-rig', '<span class="cine-rig-bar"></span><span class="cine-rig-lamp cine-lamp-l"></span><span class="cine-rig-lamp cine-lamp-r"></span>');
    layer(
      'cine-sign',
      `<span class="cine-logo pixel-logo" aria-hidden="true"></span><span class="cine-sign-sub">LIVE FROM THE PIXEL STAGE</span>`
    );
    layer('cine-floor', '<span class="cine-floor-grid"></span><span class="cine-floor-reflection" aria-hidden="true"></span>');

    const actors = layer('cine-actors');

    // Host (Enlarged to 180px with authentic modern Jeopardy host lectern)
    const host = document.createElement('div');
    host.className = 'cine-host';
    host.innerHTML = `
      <span class="cine-host-spot" aria-hidden="true"></span>
      <div class="cine-host-figure">${buildHostSVG('idle', !!room.halloween, { size: 180 })}</div>
      <div class="cine-host-plate">JEOPARTY HOST</div>
    `;
    actors.appendChild(host);

    // Board
    const board = document.createElement('div');
    board.className = 'cine-board';
    const cats = Array.isArray(room.board?.categories) ? room.board.categories : [];
    const boardCols = Math.max(1, Math.min(8, cats.length || 5));
    board.style.setProperty('--cine-board-cols', String(boardCols));
    let boardHtml = `<div class="cine-board-top"><span class="cine-board-top-star">&#9733;</span> JEOPARTY <span class="cine-board-top-star">&#9733;</span></div><div class="cine-board-cats">`;
    for (const cat of cats) {
      boardHtml += `<div class="cine-board-col"><div class="cine-board-cat">${esc(cat.name)}</div><div class="cine-board-vals">`;
      for (const tile of cat.tiles || []) {
        const value = halloween ? `${tile.value}` : `$${tile.value}`;
        boardHtml += `<span class="cine-board-tile${tile.used ? ' is-used' : ''}">${value}</span>`;
      }
      boardHtml += `</div></div>`;
    }
    boardHtml += `</div>`;
    board.innerHTML = boardHtml;
    actors.appendChild(board);

    // Contestant podiums (Prominent enlarged avatars: 88px - 124px)
    const podRow = document.createElement('div');
    podRow.className = 'cine-podiums';
    podRow.style.setProperty('--cine-pod-count', String(Math.max(1, players.length)));
    const avatarSize = players.length > 7 ? 88 : players.length > 4 ? 108 : 124;
    players.forEach((p, idx) => {
      const pod = document.createElement('div');
      pod.className = 'cine-pod';
      pod.dataset.playerId = p.id;
      pod.dataset.avatar = JSON.stringify(p.avatar || {});
      pod.dataset.avatarSize = String(avatarSize);
      pod.innerHTML = `
        <span class="cine-pod-spot" aria-hidden="true"></span>
        <div class="cine-pod-avatar">${buildAvatarHTML(p.avatar, {
          size: avatarSize,
          mood: 'idle',
          delaySec: (idx % 4) * 0.14,
        })}</div>
        <div class="cine-pod-body">
          <span class="cine-pod-num">${String(idx + 1).padStart(2, '0')}</span>
          <span class="cine-pod-name">${esc(p.name)}</span>
          <span class="cine-pod-money">${formatMoney(p.score, halloween)}</span>
        </div>
      `;
      podRow.appendChild(pod);
    });
    actors.appendChild(podRow);

    layer('cine-fg', '<span class="cine-beam cine-beam-l"></span><span class="cine-beam cine-beam-r"></span>');
  }

  measurePositions() {
    if (!this.world) return;
    this.isMobile = this.viewport
      ? this.viewport.getBoundingClientRect().width < 680
      : false;
    const prevTransform = this.world.style.transform;
    const prevOrigin = this.world.style.transformOrigin;
    this.world.style.transform = 'none';
    this.world.style.transformOrigin = '0 0';
    const worldRect = this.world.getBoundingClientRect();
    const centerOf = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return null;
      return {
        x: rect.left - worldRect.left + rect.width / 2,
        y: rect.top - worldRect.top + rect.height / 2,
      };
    };
    this.positions = {
      host: centerOf(this.world.querySelector('.cine-host-figure')) || { ...HOST_TARGET },
      board: centerOf(this.world.querySelector('.cine-board')) || { ...BOARD_TARGET },
      podiums: new Map(),
    };
    this.world.querySelectorAll('.cine-pod').forEach((el) => {
      const point = centerOf(el);
      if (point) this.positions.podiums.set(el.dataset.playerId, point);
    });
    this.world.style.transform = prevTransform || '';
    this.world.style.transformOrigin = prevOrigin || '';
  }

  clearPodFocus() {
    if (!this.world) return;
    this.world.querySelectorAll('.cine-pod').forEach((pod) => {
      pod.classList.remove('is-active', 'is-dim', 'is-gain', 'is-loss', 'is-streak', 'is-champion', 'is-speaking');
      this.setPodAvatar(pod, null, 'idle');
    });
  }

  setPodFocus(playerId, mood) {
    const pod = this.world?.querySelector(
      `.cine-pod[data-player-id="${this.cssEscape(playerId)}"]`
    );
    if (!pod) return null;
    pod.classList.add('is-active');
    this.setPodAvatar(pod, null, mood);
    return pod;
  }

  setPodAvatar(pod, avatarConfig, mood) {
    if (!pod) return;
    const wrap = pod.querySelector('.cine-pod-avatar');
    if (!wrap) return;
    const size = Number(pod.dataset.avatarSize) || 84;
    if (avatarConfig) {
      pod.dataset.avatar = JSON.stringify(avatarConfig);
      wrap.innerHTML = buildAvatarHTML(avatarConfig, { size, mood });
      return;
    }
    const existing = wrap.querySelector('.pixel-avatar');
    if (existing && existing.dataset.mood === mood) return;
    const source = pod.dataset.avatar;
    if (!source) return;
    try {
      wrap.innerHTML = buildAvatarHTML(JSON.parse(source), { size, mood });
    } catch {
      // ignore malformed stored avatar
    }
  }

  /* ============================ CAMERA ============================ */

  startTween(to, durationMs) {
    const from = { ...this.cam };
    const dur = Math.max(0, Number(durationMs) || 0);
    if (dur <= 0) {
      this.cam = { ...to };
      this.tween = null;
      this.applyCamera();
      return;
    }
    this.tween = { from, to, start: performance.now(), dur };
  }

  applyCamera() {
    if (!this.viewport || !this.world) return;
    const rect = this.viewport.getBoundingClientRect();
    const vw = rect.width;
    const vh = rect.height;
    if (vw < 20 || vh < 20) return;
    this.isMobile = vw < 680;
    const fit =
      Math.min(vw / STAGE_W, vh / STAGE_H) * (this.isMobile ? 1.3 : 1);
    const z = fit * this.cam.zoom;
    const x = this.cam.x;
    const y = this.cam.y;
    this.world.style.transformOrigin = `${x}px ${y}px`;
    this.world.style.transform = `translate(${(vw / 2 - x).toFixed(1)}px, ${(
      vh / 2 -
      y
    ).toFixed(1)}px) scale(${z.toFixed(4)})`;

    // Parallax depth: background layers lag behind the camera target.
    const dx = x - STAGE_W / 2;
    const dy = y - STAGE_H / 2;
    const layers = [
      ['.cine-sky', 0.025],
      ['.cine-sky-glow', 0.035],
      ['.cine-curtain-l', 0.05],
      ['.cine-curtain-r', 0.05],
      ['.cine-valance', 0.045],
      ['.cine-rig', 0.06],
      ['.cine-sign', 0.07],
      ['.cine-floor', 0.09],
      ['.cine-fg', 0.13],
    ];
    for (const [sel, factor] of layers) {
      const el = this.world.querySelector(sel);
      if (!el) continue;
      el.style.transform = `translate3d(${Math.round(-dx * factor)}px, ${Math.round(
        -dy * factor
      )}px, 0)`;
    }
  }

  /* ============================ FRAME LOOP ============================ */

  tick(ts) {
    const perf = performance.now();
    if (this.screen === 'intro') {
      this.updateIntroFrame();
    }
    if (this.tween) {
      const t = clamp((perf - this.tween.start) / this.tween.dur, 0, 1);
      const eased = easeInOutCubic(t);
      const from = this.tween.from;
      const to = this.tween.to;
      this.cam = {
        x: from.x + (to.x - from.x) * eased,
        y: from.y + (to.y - from.y) * eased,
        zoom: from.zoom + (to.zoom - from.zoom) * eased,
        rotY: from.rotY + (to.rotY - from.rotY) * eased,
        rotX: from.rotX + (to.rotX - from.rotX) * eased,
      };
      if (t >= 1) this.tween = null;
    }
    if (this.screen !== 'none') this.applyCamera();

    if (this.screen === 'focus' || this.screen === 'champion' || this.screen === 'bumper') {
      if (this.focusEndsAt && perf >= this.focusEndsAt) {
        this.focusEndsAt = 0;
        this.endScreen(300);
      }
    }
    requestAnimationFrame((next) => this.tick(next));
  }

  endScreen(fadeMs = 300) {
    if (this.screen === 'none') return;
    this.screen = 'none';
    this.els.skip.hidden = true;
    const layer = this.layer;
    if (!layer) return;
    layer.classList.add('is-leaving');
    clearTimeout(this.endTimer);
    this.endTimer = setTimeout(
      () => {
        if (this.screen === 'none') {
          layer.hidden = true;
          layer.className = 'cinematic-layer';
          this.world.innerHTML = '';
          this.introId = null;
          this.clearCutawayFrame();
          document.body.classList.remove('cine-active');
        }
      },
      Math.max(0, fadeMs)
    );
  }

  showLowerThird({ name, line, avatar, tag, title = false }) {
    const { lt, ltName, ltLine, ltAvatar, ltTag } = this.els;
    if (!lt) return;
    lt.classList.remove('is-hidden');
    lt.classList.toggle('is-title', Boolean(title));
    ltName.textContent = name || '';
    ltLine.textContent = line || '';
    if (avatar != null) ltAvatar.innerHTML = avatar;
    ltTag.textContent = tag || '';
    this.lastSubtitleKey = `${name}|${line}`;
  }

  animateFocusMoney(el, from, to, losing) {
    this.focusMoney = { el, from, to, losing };
    const start = performance.now();
    const duration = 780;
    const step = (now) => {
      if (!this.focusMoney || this.focusMoney.el !== el) return;
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (to - from) * eased);
      el.textContent = formatMoney(t >= 1 ? to : value, this.halloween);
      el.classList.toggle('is-negative', value < 0);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  buildConfetti() {
    const wrap = document.createElement('span');
    wrap.className = 'cine-confetti';
    for (let i = 0; i < 16; i++) {
      const bit = document.createElement('i');
      bit.style.setProperty('--x', `${Math.round(Math.random() * 180 - 90)}px`);
      bit.style.setProperty('--d', `${(Math.random() * 0.9).toFixed(2)}s`);
      bit.style.setProperty('--c', ['#ffd900', '#53e237', '#ff6be8', '#2c99e6'][i % 4]);
      wrap.appendChild(bit);
    }
    return wrap;
  }

  flash() {
    if (this.reduceMotion) return;
    const flash = this.els.flash;
    if (!flash) return;
    flash.classList.remove('is-on');
    void flash.offsetWidth;
    flash.classList.add('is-on');
  }

  cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(String(value));
    }
    return String(value).replace(/["\\]/g, '\\$&');
  }
}

export const cinematic = new CinematicCamera();
