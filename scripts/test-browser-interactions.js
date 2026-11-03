'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const PORT = 3399;
const LOCAL_URL = `http://127.0.0.1:${PORT}/`;
const TARGET_URL = process.env.JEOPARTY_TEST_URL || LOCAL_URL;

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

  const physicalClick = async (selector) => {
    const hit = await pSend('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return { error: 'missing element', selector: ${JSON.stringify(selector)} };
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const top = document.elementFromPoint(x, y);
        return { x, y, rectTop: rect.top, rectBottom: rect.bottom, viewportHeight: window.innerHeight,
          disabled: el.disabled, hitTarget: Boolean(top && (top === el || el.contains(top))),
          topTag: top?.tagName || null, topId: top?.id || null, topClass: String(top?.className || '') };
      })()`,
      returnByValue: true
    });
    const target = hit.result?.value;
    if (!target || target.error || target.disabled || !target.hitTarget) return { ...target, clicked: false };
    await pSend('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y });
    await pSend('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 });
    await pSend('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 });
    await new Promise(r => setTimeout(r, 120));
    return { ...target, clicked: true };
  };

  const physicalTap = async (selector) => {
    const hit = await pSend('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return { error: 'missing element', selector: ${JSON.stringify(selector)} };
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const top = document.elementFromPoint(x, y);
        return { x, y, rectTop: rect.top, rectBottom: rect.bottom, viewportHeight: window.innerHeight,
          disabled: el.disabled, hitTarget: Boolean(top && (top === el || el.contains(top))),
          topTag: top?.tagName || null, topId: top?.id || null, topClass: String(top?.className || '') };
      })()`,
      returnByValue: true
    });
    const target = hit.result?.value;
    if (!target || target.error || target.disabled || !target.hitTarget) return { ...target, tapped: false };
    const point = { x: target.x, y: target.y, id: 1, radiusX: 2, radiusY: 2, force: 1 };
    await pSend('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await pSend('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await new Promise(r => setTimeout(r, 120));
    return { ...target, tapped: true };
  };

  const errors = [];
  const logs = [];
  const failures = [];
  const check = (condition, message) => {
    console.log(`${condition ? 'PASS' : 'FAIL'}: ${message}`);
    if (!condition) failures.push(message);
  };

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

  console.log('Navigating to', TARGET_URL);
  await pSend('Page.navigate', { url: TARGET_URL });

  // Wait 2.5s for load
  await new Promise(r => setTimeout(r, 2500));

  console.log(`\nCaptured ${errors.length} browser exceptions on load.`);
  if (errors.length > 0) {
    errors.forEach(e => console.error(e));
  } else {
    console.log('PASS: Zero uncaught exceptions on load!');
  }
  check(errors.length === 0, 'no uncaught browser errors during initial load');

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

  const arrowList = await pSend('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('.arrow-btn')).map((el) => ({ part: el.dataset.part, dir: el.dataset.dir }))`,
    returnByValue: true
  });
  const physicalArrowResults = [];
  for (const { part, dir } of arrowList.result?.value || []) {
    const selector = `.arrow-btn[data-part="${part}"][data-dir="${dir}"]`;
    const before = await pSend('Runtime.evaluate', { expression: `window.state.avatar[${JSON.stringify(part)}]`, returnByValue: true });
    const click = await physicalClick(selector);
    const after = await pSend('Runtime.evaluate', { expression: `window.state.avatar[${JSON.stringify(part)}]`, returnByValue: true });
    physicalArrowResults.push({ part, dir, ...click, before: before.result?.value, after: after.result?.value, changed: before.result?.value !== after.result?.value });
  }
  const avatarSaved = await pSend('Runtime.evaluate', {
    expression: `JSON.stringify(window.state.avatar) === localStorage.getItem('jeoparty_avatar')`,
    returnByValue: true
  });
  console.log('Physical arrow checks:', JSON.stringify({ results: physicalArrowResults, saved: avatarSaved.result?.value }, null, 2));
  check(physicalArrowResults.length === 8 && physicalArrowResults.every(result => result.clicked && result.changed), 'all avatar arrows respond to physical clicks');
  check(avatarSaved.result?.value === true, 'selected avatar persists to local storage');

  await pSend('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await pSend('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const touchBefore = await pSend('Runtime.evaluate', { expression: 'window.state.avatar.color', returnByValue: true });
  const touchArrow = await physicalTap('.arrow-btn[data-part="color"][data-dir="1"]');
  const touchAfter = await pSend('Runtime.evaluate', { expression: 'window.state.avatar.color', returnByValue: true });
  console.log('Mobile avatar tap:', JSON.stringify({ ...touchArrow, before: touchBefore.result?.value, after: touchAfter.result?.value, changed: touchBefore.result?.value !== touchAfter.result?.value }, null, 2));
  check(touchArrow.tapped && touchBefore.result?.value !== touchAfter.result?.value, 'avatar arrow responds to a mobile touch tap');
  await pSend('Emulation.setTouchEmulationEnabled', { enabled: false });
  await pSend('Emulation.clearDeviceMetricsOverride');

  // Public-room browser was implemented but its opener was missing from the home page.
  console.log('\n--- TEST 2: Public Room Browser and Join Dialog ---');
  const publicBrowserClick = await physicalClick('#open-public-browser-btn');
  const publicDialogOpen = await pSend('Runtime.evaluate', { expression: 'document.getElementById("public-rooms-dialog")?.open', returnByValue: true });
  const refreshClick = await physicalClick('#refresh-public-rooms-btn');
  await new Promise(r => setTimeout(r, 250));
  const publicBrowserClose = await physicalClick('#close-public-rooms-btn');
  check(publicBrowserClick.clicked && publicDialogOpen.result?.value === true, 'home button opens the public-room browser');
  check(refreshClick.clicked && publicBrowserClose.clicked, 'public-room refresh and close controls respond to clicks');
  const joinDialogClick = await physicalClick('#open-join-dialog-btn');
  const joinDialogOpen = await pSend('Runtime.evaluate', { expression: 'document.getElementById("join-code-dialog")?.open', returnByValue: true });
  const joinDialogClose = await physicalClick('#close-join-dialog-btn');
  check(joinDialogClick.clicked && joinDialogOpen.result?.value === true && joinDialogClose.clicked, 'join-room dialog opens and closes');

  // TEST 3: Play Button (Quick Play / Auto Create Public Room)
  console.log('\n--- TEST 3: Play! Button Quick Play ---');
  const playBtnTest = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const nameInput = document.getElementById('player-name-input');
      nameInput.value = 'PlayTester';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const playBtn = document.getElementById('play-btn');
      return { ready: true, btnText: playBtn.textContent.trim() };
    })()`,
    returnByValue: true
  });
  const playClick = await physicalClick('#play-btn');
  console.log('Play button physical click:', { ...playBtnTest.result?.value, ...playClick });

  // Wait 1.5s for room state to arrive over WebSocket
  await new Promise(r => setTimeout(r, 1500));

  const roomStateCheck = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const gameScreen = document.getElementById('game-screen');
      const homeScreen = document.getElementById('home-screen');
      const roomCode = document.getElementById('lobby-room-code-display')?.textContent;
      const topbarCode = document.getElementById('topbar-room-code')?.textContent;
      const players = window.state.room?.players || [];

      return {
        gameScreenHidden: gameScreen ? gameScreen.hidden : null,
        homeScreenHidden: homeScreen ? homeScreen.hidden : null,
        roomCode,
        topbarCode,
        playersCount: players.length,
        players: players.map(p => ({ name: p.name, isBot: p.isBot, isHost: p.isHost, avatar: p.avatar })),
        isPrivate: window.state.room?.isPrivate,
        playerIsHost: window.state.room?.hostId === window.state.playerId
      };
    })()`,
    returnByValue: true
  });

  console.log('Room State Check (after Play!):', JSON.stringify(roomStateCheck.result?.value, null, 2));
  const playRoom = roomStateCheck.result?.value;
  check(playClick.clicked && playRoom?.homeScreenHidden && !playRoom?.gameScreenHidden, 'Play opens the multiplayer lobby');
  check(Boolean(playRoom?.roomCode) && playRoom?.isPrivate === false && playRoom?.playerIsHost, 'Play creates or joins a public room and assigns host');
  check(playRoom?.players?.some(p => p.name === 'PlayTester' && p.avatar?.color === (touchAfter.result?.value)), 'selected avatar appears on the player in the room');

  // Capture Lobby screenshot
  const lobbyScreenshot = await pSend('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/ff3a672f-5cbd-45ff-9514-77bfbeb492ae/lobby-after-play.png', Buffer.from(lobbyScreenshot.data, 'base64'));
  console.log('Saved lobby-after-play.png');

  // TEST 4: Add Bot & Bot Difficulty
  console.log('\n--- TEST 4: Add Bot and Change Settings in Lobby ---');
  const botClick = await physicalClick('#add-bot-btn');
  console.log('Add bot physical click:', botClick);

  await new Promise(r => setTimeout(r, 1000));

  const botCheck = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const players = window.state.room?.players || [];
      return { playersCount: players.length, players: players.map(p => ({ name: p.name, isBot: p.isBot, difficulty: p.botDifficulty })) };
    })()`,
    returnByValue: true
  });
  console.log('After Add Bot:', JSON.stringify(botCheck.result?.value, null, 2));
  check(botClick.clicked && botCheck.result?.value?.playersCount > (playRoom?.playersCount || 0), 'visible Add Bot control adds a bot');
  check(botCheck.result?.value?.players?.some(p => p.isBot), 'new lobby player is synchronized as a bot');

  // TEST 5: Game Mode Selector Buttons in Lobby
  console.log('\n--- TEST 5: Game Mode Selector in Lobby ---');
  const modeClick = await physicalClick('.mode-btn[data-mode="survival"]');
  await new Promise(r => setTimeout(r, 250));
  const modeTest = await pSend('Runtime.evaluate', {
    expression: `({ modeBtnsCount: document.querySelectorAll('.mode-btn').length, survivalSelected: document.querySelector('.mode-btn[data-mode="survival"]')?.classList.contains('active'), activeLabel: document.getElementById('active-game-mode-indicator')?.textContent, serverMode: window.state.room?.settings?.gameMode })`,
    returnByValue: true
  });
  console.log('Mode physical-click test:', JSON.stringify({ ...modeClick, ...modeTest.result?.value }, null, 2));
  check(modeClick.clicked && modeTest.result?.value?.serverMode === 'survival', 'game mode selection reaches the server');

  // TEST 6: Private and public room creation from their intended controls.
  console.log('\n--- TEST 6: Private and Public Room Creation ---');
  const leavePublic = await physicalClick('#leave-room-btn');
  await new Promise(r => setTimeout(r, 700));
  const privateButtonClick = await physicalClick('#create-private-btn');
  await new Promise(r => setTimeout(r, 1200));
  const privateState = await pSend('Runtime.evaluate', {
    expression: `({ roomCode: window.state.room?.code, isPrivate: window.state.room?.isPrivate, isHost: window.state.room?.hostId === window.state.playerId, screenVisible: !document.getElementById('game-screen')?.hidden })`,
    returnByValue: true
  });
  console.log('Private room creation:', JSON.stringify({ leaveClicked: leavePublic.clicked, createClicked: privateButtonClick.clicked, ...privateState.result?.value }, null, 2));
  check(leavePublic.clicked && privateButtonClick.clicked && privateState.result?.value?.screenVisible, 'leave and create-private controls respond');
  check(Boolean(privateState.result?.value?.roomCode) && privateState.result?.value?.isPrivate === true && privateState.result?.value?.isHost, 'private room code is issued and creator becomes host');

  await physicalClick('#leave-room-btn');
  await new Promise(r => setTimeout(r, 700));
  await physicalClick('#open-public-browser-btn');
  const hostPublicClick = await physicalClick('#create-public-from-header-btn');
  await new Promise(r => setTimeout(r, 1200));
  const publicCreateState = await pSend('Runtime.evaluate', {
    expression: `({ roomCode: window.state.room?.code, isPrivate: window.state.room?.isPrivate, isHost: window.state.room?.hostId === window.state.playerId })`,
    returnByValue: true
  });
  console.log('Public room creation:', JSON.stringify({ hostClicked: hostPublicClick.clicked, ...publicCreateState.result?.value }, null, 2));
  check(hostPublicClick.clicked && Boolean(publicCreateState.result?.value?.roomCode) && publicCreateState.result?.value?.isPrivate === false && publicCreateState.result?.value?.isHost, 'Host Public Room control creates a public room');
  check(errors.length === 0, 'no uncaught browser errors during interaction checks');

  // Cleanup
  chromeProc.kill();
  serverProc.kill();

  if (failures.length) {
    console.error(`\n=== ${failures.length} BROWSER INTERACTION CHECK(S) FAILED ===`);
    failures.forEach(failure => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log('\n=== ALL BROWSER INTERACTION CHECKS PASSED ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
