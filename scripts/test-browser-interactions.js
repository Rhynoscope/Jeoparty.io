'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const PORT = 3399;
const LOCAL_URL = `http://127.0.0.1:${PORT}/`;

async function main() {
  console.log('=== STARTING COMPLETE BROWSER INTERACTIONS TEST ===\n');

  // 1. Start local server
  console.log(`Starting local server on port ${PORT}...`);
  const serverPath = path.resolve(__dirname, '../server/server.js');
  const serverProc = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProc.stdout.on('data', d => process.stdout.write(`[SERVER] ${d}`));
  serverProc.stderr.on('data', d => process.stderr.write(`[SERVER ERR] ${d}`));

  // Wait for server to listen
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      await new Promise((res, rej) => {
        http.get(LOCAL_URL, r => res(r.statusCode)).on('error', rej);
      });
      console.log('Local server is UP!');
      break;
    } catch {}
  }

  // 2. Launch Chrome headless with CDP
  console.log('Launching Headless Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1280,800',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const json = await new Promise((res, rej) => {
        http.get('http://127.0.0.1:9222/json/version', r => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => res(JSON.parse(d)));
        }).on('error', rej);
      });
      wsUrl = json.webSocketDebuggerUrl;
      break;
    } catch {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome debugging port');
    serverProc.kill();
    chromeProc.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome CDP:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const pageWsUrl = `ws://127.0.0.1:9222/devtools/page/${targetId}`;
  const pageWs = new WebSocket(pageWsUrl);
  await new Promise(r => pageWs.onopen = r);

  let pId = 1;
  const pSend = (method, params = {}) => new Promise((resolve) => {
    const curId = pId++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === curId) {
        pageWs.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    pageWs.addEventListener('message', handler);
    pageWs.send(JSON.stringify({ id: curId, method, params }));
  });

  const errors = [];
  const logs = [];

  pageWs.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      logs.push(`[CONSOLE ${msg.params.type}] ${text}`);
      if (msg.params.type === 'error') {
        errors.push(`[CONSOLE ERROR] ${text}`);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const ex = msg.params.exceptionDetails;
      errors.push(`[EXCEPTION] ${ex.text} ${ex.exception?.description || ''} at line ${ex.lineNumber}:${ex.columnNumber}`);
    }
  });

  await pSend('Runtime.enable');
  await pSend('Page.enable');
  await pSend('DOM.enable');

  console.log('Navigating to', LOCAL_URL);
  await pSend('Page.navigate', { url: LOCAL_URL });

  // Wait 2.5s for load
  await new Promise(r => setTimeout(r, 2500));

  console.log(`\nCaptured ${errors.length} browser exceptions on load.`);
  if (errors.length > 0) {
    errors.forEach(e => console.error(e));
  } else {
    console.log('PASS: Zero uncaught exceptions on load!');
  }

  // Capture Home Screen screenshot
  const homeScreenshot = await pSend('Page.captureScreenshot', { format: 'png' });
  const fs = require('fs');
  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/ff3a672f-5cbd-45ff-9514-77bfbeb492ae/home-screen-interactions.png', Buffer.from(homeScreenshot.data, 'base64'));
  console.log('Saved home-screen-interactions.png');

  // TEST 1: Avatar Customization Arrows
  console.log('\n--- TEST 1: Avatar Customization Arrows (Hat, Eyes, Mouth, Color) ---');
  const arrowTest = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const previewEl = document.getElementById('home-avatar-preview');
      const arrows = Array.from(document.querySelectorAll('.arrow-btn'));
      const results = [];

      for (const arrow of arrows) {
        const part = arrow.dataset.part;
        const dir = arrow.dataset.dir;
        const before = previewEl.innerHTML;
        arrow.click();
        const after = previewEl.innerHTML;
        results.push({
          part,
          dir,
          changed: before !== after
        });
      }

      // Also test randomizer dice
      const dice = document.getElementById('avatar-random-btn');
      const beforeDice = previewEl.innerHTML;
      if (dice) dice.click();
      const afterDice = previewEl.innerHTML;

      return {
        arrowCount: arrows.length,
        results,
        diceWorked: beforeDice !== afterDice
      };
    })()`,
    returnByValue: true
  });

  console.log('Arrow Test Result:', JSON.stringify(arrowTest.result?.value, null, 2));

  // TEST 2: Play Button (Quick Play / Auto Create Public Room)
  console.log('\n--- TEST 2: Play! Button Quick Play ---');
  const playBtnTest = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const nameInput = document.getElementById('player-name-input');
      nameInput.value = 'PlayTester';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const playBtn = document.getElementById('play-btn');
      playBtn.click();
      return { clicked: true, btnText: playBtn.textContent.trim() };
    })()`,
    returnByValue: true
  });
  console.log('Play button clicked:', playBtnTest.result?.value);

  // Wait 1.5s for room state to arrive over WebSocket
  await new Promise(r => setTimeout(r, 1500));

  const roomStateCheck = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const gameScreen = document.getElementById('game-screen');
      const homeScreen = document.getElementById('home-screen');
      const roomCode = document.getElementById('lobby-room-code-display')?.textContent;
      const topbarCode = document.getElementById('topbar-room-code')?.textContent;
      const players = Array.from(document.querySelectorAll('.player-card')).map(c => c.textContent.trim());

      return {
        gameScreenHidden: gameScreen ? gameScreen.hidden : null,
        homeScreenHidden: homeScreen ? homeScreen.hidden : null,
        roomCode,
        topbarCode,
        playersCount: players.length,
        players
      };
    })()`,
    returnByValue: true
  });

  console.log('Room State Check (after Play!):', JSON.stringify(roomStateCheck.result?.value, null, 2));

  // Capture Lobby screenshot
  const lobbyScreenshot = await pSend('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/ff3a672f-5cbd-45ff-9514-77bfbeb492ae/lobby-after-play.png', Buffer.from(lobbyScreenshot.data, 'base64'));
  console.log('Saved lobby-after-play.png');

  // TEST 3: Add Bot & Bot Difficulty
  console.log('\n--- TEST 3: Add Bot and Change Settings in Lobby ---');
  const botTest = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const addBotBtn = document.getElementById('add-bot-btn');
      if (addBotBtn) addBotBtn.click();
      return { clickedAddBot: Boolean(addBotBtn) };
    })()`,
    returnByValue: true
  });
  console.log('Add bot clicked:', botTest.result?.value);

  await new Promise(r => setTimeout(r, 1000));

  const botCheck = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const players = Array.from(document.querySelectorAll('.player-card')).map(c => c.textContent.trim());
      return { playersCount: players.length, players };
    })()`,
    returnByValue: true
  });
  console.log('After Add Bot:', JSON.stringify(botCheck.result?.value, null, 2));

  // TEST 4: Game Mode Selector Buttons in Lobby
  console.log('\n--- TEST 4: Game Mode Selector in Lobby ---');
  const modeTest = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const modeBtns = Array.from(document.querySelectorAll('.mode-btn'));
      const survivalBtn = document.querySelector('.mode-btn[data-mode="survival"]');
      if (survivalBtn) survivalBtn.click();
      return {
        modeBtnsCount: modeBtns.length,
        survivalSelected: survivalBtn ? survivalBtn.classList.contains('active') : false,
        activeLabel: document.getElementById('active-game-mode-indicator')?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('Mode selector test:', JSON.stringify(modeTest.result?.value, null, 2));

  // Cleanup
  chromeProc.kill();
  serverProc.kill();

  console.log('\n=== ALL BROWSER INTERACTION TESTS COMPLETE ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
