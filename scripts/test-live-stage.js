'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');

const LIVE_URL = 'https://jeoparty-io.onrender.com/';

async function main() {
  console.log('=== VERIFYING LIVE STAGE IN PRODUCTION ===\n');

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

  await pSend('Runtime.enable');
  await pSend('Page.enable');
  await pSend('DOM.enable');

  console.log('Navigating to live website...');
  await pSend('Page.navigate', { url: LIVE_URL });
  await new Promise(r => setTimeout(r, 3000));

  // Enter name and click play
  await pSend('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById('player-name-input');
      input.value = 'StudioHost';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('play-btn').click();
    })()`
  });

  await new Promise(r => setTimeout(r, 2000));

  // Add 2 bots and start game
  await pSend('Runtime.evaluate', {
    expression: `(() => {
      const addBotBtn = document.getElementById('add-bot-btn');
      if (addBotBtn) {
        addBotBtn.click();
        setTimeout(() => addBotBtn.click(), 300);
      }
    })()`
  });

  await new Promise(r => setTimeout(r, 1500));

  // Click start match
  await pSend('Runtime.evaluate', {
    expression: `(() => {
      const startBtn = document.getElementById('start-game-btn');
      if (startBtn) startBtn.click();
    })()`
  });

  // Wait 4 seconds for match intro / board reveal
  await new Promise(r => setTimeout(r, 4000));

  // Skip intro if skip button is present
  await pSend('Runtime.evaluate', {
    expression: `(() => {
      const skip = document.querySelector('.cine-skip-btn');
      if (skip) skip.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 2000));

  // Capture live stage screenshot
  const stageShot = await pSend('Page.captureScreenshot', { format: 'png' });
  const stageShotPath = 'C:/Users/Administrator/.gemini/antigravity/brain/ff3a672f-5cbd-45ff-9514-77bfbeb492ae/live-stage-redesign-v440.png';
  fs.writeFileSync(stageShotPath, Buffer.from(stageShot.data, 'base64'));
  console.log('Saved live-stage-redesign-v440.png');

  chromeProc.kill();
  console.log('\n=== LIVE STAGE VERIFICATION COMPLETE ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
