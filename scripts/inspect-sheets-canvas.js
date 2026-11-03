'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  console.log('Inspecting MS paint sprite sheets in Chrome canvas...');
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

  // Read the 4 images as base64 data URLs
  const dir = 'C:/Users/Administrator/Downloads/jeoparty/public/assets/ms-paint';
  const bodiesB64 = fs.readFileSync(path.join(dir, 'avatar-bodies.gif')).toString('base64');
  const eyesB64 = fs.readFileSync(path.join(dir, 'avatar-eyes.gif')).toString('base64');
  const mouthsB64 = fs.readFileSync(path.join(dir, 'avatar-mouths.gif')).toString('base64');
  const hatsB64 = fs.readFileSync(path.join(dir, 'avatar-hats.gif')).toString('base64');

  const evalRes = await pSend('Runtime.evaluate', {
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

      const analyzeImage = (img, name) => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        // Check pixel (0,0)
        const p0 = [data[0], data[1], data[2], data[3]];
        return {
          name,
          w: img.naturalWidth,
          h: img.naturalHeight,
          pixel0: p0
        };
      };

      return [
        analyzeImage(imgBodies, 'bodies'),
        analyzeImage(imgEyes, 'eyes'),
        analyzeImage(imgMouths, 'mouths'),
        analyzeImage(imgHats, 'hats')
      ];
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Sprite Sheet analysis:', JSON.stringify(evalRes.result?.value, null, 2));

  chromeProc.kill();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
