'use strict';

/**
 * Visual verification driver: launches the real server + headless Chrome,
 * plays a complete match through the actual UI, and captures screenshots of
 * every game-show presentation state (desktop + mobile widths).
 *
 * Usage: node scripts/visual-check.js [port] [chromePath]
 */

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const {
  BUILTIN_CATEGORIES,
  HALLOWEEN_CATEGORIES,
} = require('../server/categoriesData.js');

const PORT = Number(process.argv[2]) || 3400;
const CHROME =
  process.argv[3] ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = (process.env.JEOPARTY_URL || '').trim().replace(/\/+$/, '');
const IS_REMOTE = Boolean(TARGET_URL);
const BASE = IS_REMOTE ? TARGET_URL : `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = path.join(__dirname, 'artifacts');
const DEBUG_PORT = 9333;
const SHOT_PREFIX = IS_REMOTE ? 'live-' : '';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const ANSWER_MAP = new Map();
for (const cat of [...BUILTIN_CATEGORIES, ...HALLOWEEN_CATEGORIES]) {
  for (const clue of cat.clues || []) {
    if (clue?.clue && clue.answer) ANSWER_MAP.set(clue.clue, clue.answer);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      const timer = setTimeout(() => reject(new Error('CDP connect timeout')), 8000);
      ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      ws.addEventListener('error', () => reject(new Error('CDP connect error')));
      ws.addEventListener('message', (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve: res, reject: rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(new Error(`${msg.error.message}`));
          else res(msg.result);
          return;
        }
        if (msg.method && this.listeners.has(msg.method)) {
          for (const cb of this.listeners.get(msg.method)) cb(msg.params);
        }
      });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30000);
    });
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(cb);
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        `Page exception: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`
      );
    }
    return res.result?.value;
  }

  async shot(name) {
    const { data } = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const file = path.join(ARTIFACT_DIR, `${SHOT_PREFIX}${name}.png`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`  [shot] ${SHOT_PREFIX}${name}.png`);
    return file;
  }
}

async function waitFor(fn, label, timeout = 20000, interval = 60) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeout) {
    try {
      if (await fn()) return true;
    } catch (err) {
      lastErr = err;
    }
    await sleep(interval);
  }
  throw new Error(`Timeout waiting for ${label}${lastErr ? ` (${lastErr.message})` : ''}`);
}

async function roomState(page) {
  return page.evaluate(`(() => {
    const s = window.state;
    if (!s || !s.room) return null;
    const r = s.room;
    return {
      phase: r.phase,
      pickerId: r.pickerId,
      playerId: s.playerId,
      round: r.round,
      awards: (r.awards || []).length,
      hostLine: r.lastHostLine ? r.lastHostLine.line : null,
      clues: r.activeClue ? { col: r.activeClue.col, row: r.activeClue.row, clueText: r.activeClue.clueText, category: r.activeClue.categoryName, reveal: r.activeClue.reveal, frozenWords: r.activeClue.reveal?.frozenWords ?? null } : null,
      board: r.board ? r.board.categories.map((c) => ({ name: c.name, tiles: c.tiles.map((t) => ({ used: t.used, value: t.value })) })) : null,
      final: r.finalState ? { category: r.finalState.category, wheel: r.finalState.wheel, clue: r.finalState.clue, results: r.finalState.results } : null,
      players: r.players.map((p) => ({ name: p.name, score: p.score, streak: p.streak, isBot: p.isBot, hat: p.avatar.hat })),
    };
  })()`);
}

async function chooseTile(page) {
  const st = await roomState(page);
  if (!st || st.phase !== 'board' || st.pickerId !== st.playerId) return false;
  for (let c = 0; c < st.board.length; c++) {
    for (let r = 0; r < st.board[c].tiles.length; r++) {
      if (!st.board[c].tiles[r].used) {
        await page.evaluate(
          `window.state.ws.send(JSON.stringify({ type: 'select_tile', col: ${c}, row: ${r} }))`
        );
        return true;
      }
    }
  }
  return false;
}

async function buzz(page) {
  await page.evaluate(
    `(() => { const b = document.getElementById('buzz-btn'); if (b && !b.hidden && !b.disabled) b.click(); })()`
  );
}

async function submitClueAnswer(page, text) {
  await page.evaluate(`(() => {
    const input = document.getElementById('clue-answer-input');
    const form = document.getElementById('clue-answer-form');
    if (!input || !form || form.hidden) return;
    input.value = ${JSON.stringify(text)};
    form.requestSubmit();
  })()`);
}

async function submitFinalAnswer(page, text) {
  await page.evaluate(`(() => {
    const input = document.getElementById('final-answer-input');
    const form = document.getElementById('final-answer-form');
    if (!input || !form) return;
    input.value = ${JSON.stringify(text)};
    form.requestSubmit();
  })()`);
}

async function lockFinalWager(page, amount) {
  await page.evaluate(`(() => {
    const num = document.getElementById('final-wager-number');
    const btn = document.getElementById('final-lock-wager-btn');
    if (!num || !btn) return;
    num.value = String(${amount});
    btn.click();
  })()`);
}

async function main() {
  const serverPath = path.join(__dirname, '..', 'server', 'server.js');
  const log = IS_REMOTE
    ? null
    : fs.openSync(path.join(ARTIFACT_DIR, 'visual-server.log'), 'w');
  const server = IS_REMOTE
    ? null
    : spawn(process.execPath, [serverPath], {
        env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
        stdio: ['ignore', log, log],
      });
  console.log(IS_REMOTE ? `\nTarget: DEPLOYED ${BASE}` : `\nTarget: LOCAL ${BASE}`);

  const userDataDir = path.join(os.tmpdir(), `jeoparty-chrome-${Date.now()}`);
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--autoplay-policy=no-user-gesture-required',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--window-size=1440,960',
      '--force-device-scale-factor=1',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let page = null;
  const pageErrors = [];
  try {
    await waitFor(
      async () => {
        try {
          const res = await fetch(`${BASE}/api/server-info`);
          return res.ok;
        } catch {
          return false;
        }
      },
      'server',
      IS_REMOTE ? 90000 : 20000
    );

    let target = null;
    await waitFor(
      async () => {
        try {
          const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
          target = list.find((t) => t.type === 'page');
          return Boolean(target && target.webSocketDebuggerUrl);
        } catch {
          return false;
        }
      },
      'chrome devtools',
      25000
    );

    page = new CDP(target.webSocketDebuggerUrl);
    await page.connect();
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Log.enable');
    page.on('Runtime.exceptionThrown', (p) => {
      pageErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'exception');
    });
    page.on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error') {
        pageErrors.push(p.args.map((a) => a.value ?? a.description).join(' '));
      }
    });

    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 940,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await page.send('Page.navigate', { url: BASE });
    await waitFor(
      async () =>
        page.evaluate(
          `document.readyState === 'complete' && !!window.state && !!window.state.ws && window.state.ws.readyState === 1`
        ),
      'app boot',
      IS_REMOTE ? 45000 : 20000
    );

    console.log('\n[1] Home + private room');
    await page.shot('01-home');
    await page.evaluate(`(() => {
      const input = document.getElementById('player-name-input');
      input.value = 'PixelPal';
      document.getElementById('create-private-btn').click();
    })()`);
    await waitFor(async () => {
      const st = await roomState(page);
      return st && st.phase === 'lobby';
    }, 'lobby');

    // Configure a compact 3x3 match and add bot contestants.
    await page.evaluate(`(() => {
      window.state.ws.send(JSON.stringify({ type: 'update_settings', settings: {
        autoScaleMatch: false, matchPace: 'custom', boardCols: 3, cluesPerCat: 3,
        clueTimeSec: 18, dailyDoubles: true, finalJeopardy: true, doubleJeopardy: false,
        wrongPenalty: true, specialFrequency: 'normal', answerMode: 'buzzer'
      }}));
      for (let i = 0; i < 4; i++) setTimeout(() => document.getElementById('add-bot-btn').click(), i * 90);
    })()`);
    await sleep(900);
    await page.shot('02-lobby');
    await page.evaluate(`document.getElementById('start-game-btn').click()`);
    await waitFor(async () => {
      const st = await roomState(page);
      return st && st.phase === 'board';
    }, 'board');
    await sleep(700);
    await page.shot('03-board-desktop');
    const boardDom = await page.evaluate(`(() => {
      const podiums = [...document.querySelectorAll('#contestant-stage .podium')];
      const money = [...document.querySelectorAll('#contestant-stage .podium-money')].map((m) => m.textContent);
      const names = [...document.querySelectorAll('#contestant-stage .podium-name-plate')].map((m) => m.textContent);
      return {
        podiums: podiums.length,
        wronglySolved: podiums.filter((p) => p.classList.contains('is-solved')).length,
        names,
        money,
        hostVisible: !document.getElementById('host-stage').hidden,
        hostCaption: document.getElementById('host-speech-text').textContent,
        boardTiles: document.querySelectorAll('.j-tile-btn').length,
        usedTiles: document.querySelectorAll('.j-tile-used').length,
      };
    })()`);
    console.log('  board DOM:', JSON.stringify(boardDom));

    // Mobile board check
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(650);
    await page.shot('04-board-mobile');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 940,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(400);

    console.log('\n[2] Clue typing + buzzer freeze + wrong answer resume');
    await chooseTile(page);
    await waitFor(async () => {
      const st = await roomState(page);
      return st && st.phase === 'clue_open';
    }, 'clue open');
    await sleep(1200);
    const typingState = await roomState(page);
    await page.shot('05-clue-typing-desktop');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(500);
    await page.shot('06-clue-typing-mobile');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 940,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(250);

    await buzz(page);
    await waitFor(async () => {
      const st = await roomState(page);
      return st && st.phase === 'clue_buzzed';
    }, 'buzzed');
    const frozenState = await roomState(page);
    await sleep(500);
    await page.shot('07-clue-frozen');
    const visibleText = await page.evaluate(
      `document.getElementById('clue-prompt-text').textContent`
    );
    const frozenDom = await page.evaluate(`(() => {
      const p = document.getElementById('clue-prompt-text');
      return { text: p.textContent, frozen: p.classList.contains('is-frozen'), typing: p.dataset.typing };
    })()`);
    console.log('  frozen DOM:', JSON.stringify(frozenDom));

    const answer = ANSWER_MAP.get(typingState.clues.clueText) || null;
    // Deliberately answer wrong first to exercise the resume-from-frozen behavior.
    await submitClueAnswer(page, 'a completely wrong answer');
    await waitFor(async () => {
      const st = await roomState(page);
      return st && (st.phase === 'clue_open' || st.phase === 'clue_result');
    }, 'wrong answer resolved');
    await sleep(1400);
    if ((await roomState(page)).phase === 'clue_open') {
      await page.shot('08-clue-resumed');
    }
    // If the clue is still open, another contestant answers it; wait for a result.
    await waitFor(async () => {
      const st = await roomState(page);
      return st && st.phase !== 'clue_open';
    }, 'clue resolved', 22000);

    console.log('\n[3] Fast-forward remaining clues');
    const answersUsed = new Set();
    let capturedAward = false;
    let capturedStreak = false;
    const deadline = Date.now() + 150000;
    let gameover = false;
    while (Date.now() < deadline) {
      const st = await roomState(page);
      if (!st) break;
      if (!capturedAward || !capturedStreak) {
        const fx = await page.evaluate(`(() => ({
          gain: !!document.querySelector('.podium-float'),
          fire: !!document.querySelector('.podium.on-fire'),
        }))()`);
        if (!capturedAward && fx.gain) {
          capturedAward = true;
          await page.shot('08b-podium-award');
        }
        if (!capturedStreak && fx.fire) {
          capturedStreak = true;
          await page.shot('08c-streak-flames');
        }
      }
      if (st.phase === 'board') {
        await chooseTile(page);
        await sleep(250);
        continue;
      }
      if (st.phase === 'clue_open') {
        await buzz(page);
        await sleep(120);
        continue;
      }
      if (st.phase === 'clue_buzzed') {
        const clueText = st.clues?.clueText || '';
        const ans = ANSWER_MAP.get(clueText) || 'unknown';
        if (!answersUsed.has(clueText)) {
          answersUsed.add(clueText);
          await submitClueAnswer(page, ans);
        }
        await sleep(180);
        continue;
      }
      if (st.phase === 'clue_chaos') {
        const clueText = st.clues?.clueText || '';
        await page.evaluate(
          `window.state.ws.send(JSON.stringify({ type: 'submit_chaos_answer', answer: ${JSON.stringify(
            ANSWER_MAP.get(clueText) || 'unknown'
          )} }))`
        );
        await sleep(600);
        continue;
      }
      if (st.phase === 'daily_double_wager') {
        await page.evaluate(
          `window.state.ws.send(JSON.stringify({ type: 'submit_dd_wager', wager: 300 }))`
        );
        await sleep(250);
        continue;
      }
      if (st.phase === 'daily_double_answer') {
        const clueText = st.clues?.clueText || '';
        await page.evaluate(
          `window.state.ws.send(JSON.stringify({ type: 'submit_dd_answer', answer: ${JSON.stringify(
            ANSWER_MAP.get(clueText) || 'unknown'
          )} }))`
        );
        await sleep(250);
        continue;
      }
      if (st.phase === 'round_intermission') {
        await page.evaluate(
          `window.state.ws.send(JSON.stringify({ type: 'continue_intermission' }))`
        );
        await sleep(250);
        continue;
      }
      if (st.phase === 'final_wheel') {
        await sleep(2200);
        await page.shot('09-final-wheel-spinning');
        await page.send('Emulation.setDeviceMetricsOverride', {
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          mobile: true,
        });
        await sleep(500);
        await page.shot('10-final-wheel-mobile');
        await page.send('Emulation.setDeviceMetricsOverride', {
          width: 1440,
          height: 940,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await sleep(3600);
        await page.shot('11-final-wheel-landed');
        const wheelState = await roomState(page);
        await waitFor(async () => {
          const s = await roomState(page);
          return s && s.phase === 'final_wager';
        }, 'final wager');
        console.log(`  wheel category: ${wheelState.final.wheel.wheelCategory}`);
        await page.shot('12-final-wager');
        await lockFinalWager(page, 300);
        await waitFor(async () => {
          const s = await roomState(page);
          return s && s.phase === 'final_clue';
        }, 'final clue');
        await sleep(1500);
        await page.shot('13-final-clue-typing');
        const fsFinal = await roomState(page);
        await submitFinalAnswer(page, ANSWER_MAP.get(fsFinal.final.clue) || 'unknown');
        await waitFor(async () => {
          const s = await roomState(page);
          return s && s.phase === 'game_over';
        }, 'game over');
        await sleep(1200);
        await page.shot('14-gameover');
        await sleep(2600);
        await page.shot('15-gameover-host-winner');
        gameover = true;
        break;
      }
      await sleep(200);
    }

    console.log(`\n  typing snapshot at char-reveal: ${JSON.stringify(typingState.clues.reveal?.frozenWords ?? null)}`);
    console.log(`  frozen words: ${frozenState.clues?.frozenWords}`);
    console.log(`  visible frozen text: "${visibleText}"`);
    if (frozenState.clues && Number.isInteger(frozenState.clues.frozenWords)) {
      const reveal = frozenState.clues.reveal;
      const cut = reveal.wordOffsets[frozenState.clues.frozenWords - 1] || 0;
      const expected = frozenState.clues.clueText.slice(0, cut).replace(/\s+$/, '');
      console.log(`  matches authoritative freeze point: ${visibleText === expected}`);
    }
    console.log(`  answer known: ${Boolean(answer)}`);
    console.log(`  reached game over: ${gameover}`);

    // Halloween theme board check (fresh room)
    console.log('\n[4] Halloween Mayhem stage');
    await page.evaluate(
      `document.getElementById('gameover-leave-btn') ? document.getElementById('gameover-leave-btn').click() : null`
    );
    await sleep(600);
    await page.evaluate(`(() => {
      const input = document.getElementById('player-name-input');
      if (input) input.value = 'SpookyPal';
      document.getElementById('create-private-btn').click();
    })()`);
    await waitFor(async () => {
      const st = await roomState(page);
      return st && st.phase === 'lobby';
    }, 'halloween lobby');
    await page.evaluate(`(() => {
      window.state.ws.send(JSON.stringify({ type: 'update_settings', settings: {
        gameMode: 'halloween', autoScaleMatch: false, matchPace: 'custom',
        boardCols: 4, cluesPerCat: 4, clueTimeSec: 18, dailyDoubles: true,
        finalJeopardy: true, wrongPenalty: true, specialFrequency: 'normal', answerMode: 'buzzer'
      }}));
      for (let i = 0; i < 3; i++) setTimeout(() => document.getElementById('add-bot-btn').click(), i * 100);
    })()`);
    await sleep(1200);
    await page.evaluate(`document.getElementById('start-game-btn').click()`);
    await waitFor(async () => {
      const st = await roomState(page);
      return st && st.phase === 'board';
    }, 'halloween board');
    await sleep(800);
    await page.shot('16-halloween-board');
    await chooseTile(page);
    await waitFor(async () => {
      const st = await roomState(page);
      return st && (st.phase === 'clue_open' || st.phase === 'daily_double_wager');
    }, 'halloween clue');
    await sleep(1600);
    await page.shot('17-halloween-clue');
  } catch (err) {
    console.error('\nVISUAL CHECK FAILED:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    if (pageErrors.length > 0) {
      console.log('\nPAGE ERRORS:');
      for (const e of new Set(pageErrors)) console.log(' -', e);
      process.exitCode = 1;
    } else {
      console.log('\nNo page errors detected.');
    }
    try {
      chrome.kill();
    } catch {
      // ignore
    }
    if (server) {
      try {
        server.kill('SIGTERM');
      } catch {
        // ignore
      }
    }
    if (log) fs.closeSync(log);
  }
}

main();
