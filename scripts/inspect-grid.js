'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
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
  const pageWs = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${targetId}`);
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

  const dir = 'C:/Users/Administrator/Downloads/jeoparty/public/assets/ms-paint';
  const bodiesB64 = fs.readFileSync(path.join(dir, 'avatar-bodies.gif')).toString('base64');
  const eyesB64 = fs.readFileSync(path.join(dir, 'avatar-eyes.gif')).toString('base64');
  const mouthsB64 = fs.readFileSync(path.join(dir, 'avatar-mouths.gif')).toString('base64');
  const hatsB64 = fs.readFileSync(path.join(dir, 'avatar-hats.gif')).toString('base64');

  const gridRes = await pSend('Runtime.evaluate', {
    expression: `(async () => {
      const loadImage = (b64, type) => new Promise(res => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = 'data:' + type + ';base64,' + b64;
      });

      const [imgBodies, imgEyes, imgMouths, imgHats] = await Promise.all([
        loadImage('${bodiesB64}', 'image/gif'),
        loadImage('${eyesB64}', 'image/gif'),
        loadImage('${mouthsB64}', 'image/gif'),
        loadImage('${hatsB64}', 'image/gif'),
      ]);

      function scanGrid(img, cellW, cellH) {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;

        const cols = Math.floor(c.width / cellW);
        const rows = Math.floor(c.height / cellH);
        const cells = [];

        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            let count = 0;
            const x0 = col * cellW;
            const y0 = r * cellH;
            for (let py = 0; py < cellH; py++) {
              for (let px = 0; px < cellW; px++) {
                const idx = ((y0 + py) * c.width + (x0 + px)) * 4;
                if (data[idx + 3] > 10) count++;
              }
            }
            if (count > 0) {
              cells.push({ row: r, col, count, index: cells.length });
            }
          }
        }
        return { cols, rows, cellW, cellH, totalNonEmpty: cells.length, sample: cells.slice(0, 15) };
      }

      return {
        bodies48: scanGrid(imgBodies, 48, 48),
        eyes48: scanGrid(imgEyes, 48, 48),
        mouths48: scanGrid(imgMouths, 48, 48),
        hats80: scanGrid(imgHats, 80, 80),
        hats50: scanGrid(imgHats, 50, 50),
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Grid scan result:', JSON.stringify(gridRes.result?.value, null, 2));
  chromeProc.kill();
  process.exit(0);
}

main().catch(console.error);
