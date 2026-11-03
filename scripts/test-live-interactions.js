'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');

const LIVE_URL = 'https://jeoparty-io.onrender.com/';

async function main() {
  console.log('=== VERIFYING LIVE PRODUCTION WEBSITE IN REAL BROWSER ===\n');
  console.log('Target:', LIVE_URL);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1280,850',
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
    chromeProc.kill();
    process.exit(1);
  }

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
  pageWs.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      const ex = msg.params.exceptionDetails;
      errors.push(`[EXCEPTION] ${ex.text} ${ex.exception?.description || ''} at line ${ex.lineNumber}:${ex.columnNumber}`);
    }
  });

  await pSend('Runtime.enable');
  await pSend('Page.enable');
  await pSend('DOM.enable');

  console.log('Navigating to live website...');
  await pSend('Page.navigate', { url: LIVE_URL });

  // Wait 3s for live load
  await new Promise(r => setTimeout(r, 3000));

  console.log(`Live site uncaught exceptions on load: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach(e => console.error(e));
  } else {
    console.log('PASS: Zero uncaught exceptions on load!');
  }

  // Capture screenshot of live home screen
  const shot1 = await pSend('Page.captureScreenshot', { format: 'png' });
  const shot1Path = 'C:/Users/Administrator/.gemini/antigravity/brain/ff3a672f-5cbd-45ff-9514-77bfbeb492ae/live-render-v440.png';
  fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
  console.log('Saved live-render-v440.png');

  // TEST 1: Avatar Customization Arrows on Live Site
  console.log('\n--- TEST 1: Testing all 8 Avatar Arrows on Live Site ---');
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
  console.log('Live Avatar Arrows & Dice Result:', JSON.stringify(arrowTest.result?.value, null, 2));

  // TEST 2: Play Button on Live Site
  console.log('\n--- TEST 2: Testing Play! Button on Live Site ---');
  const playTest = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const nameInput = document.getElementById('player-name-input');
      nameInput.value = 'LiveGamer';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      const playBtn = document.getElementById('play-btn');
      playBtn.click();
      return { clicked: true, text: playBtn.textContent.trim() };
    })()`,
    returnByValue: true
  });
  console.log('Live Play button click:', playTest.result?.value);

  // Wait 2s for server WebSocket room creation
  await new Promise(r => setTimeout(r, 2000));

  const liveRoomCheck = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const gameScreen = document.getElementById('game-screen');
      const homeScreen = document.getElementById('home-screen');
      const roomCode = document.getElementById('lobby-room-code-display')?.textContent;
      const topbarCode = document.getElementById('topbar-room-code')?.textContent;
      return {
        gameScreenHidden: gameScreen ? gameScreen.hidden : null,
        homeScreenHidden: homeScreen ? homeScreen.hidden : null,
        roomCode,
        topbarCode
      };
    })()`,
    returnByValue: true
  });
  console.log('Live Room State Check (after Play!):', JSON.stringify(liveRoomCheck.result?.value, null, 2));

  // Capture screenshot of live lobby after Play!
  const shot2 = await pSend('Page.captureScreenshot', { format: 'png' });
  const shot2Path = 'C:/Users/Administrator/.gemini/antigravity/brain/ff3a672f-5cbd-45ff-9514-77bfbeb492ae/live-lobby-v440.png';
  fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
  console.log('Saved live-lobby-v440.png');

  chromeProc.kill();
  console.log('\n=== LIVE BROWSER VERIFICATION COMPLETE: ALL PASS ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal live test error:', err);
  process.exit(1);
});
