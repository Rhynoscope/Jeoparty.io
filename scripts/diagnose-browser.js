'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');

async function main() {
  const targetUrl = process.argv[2] || 'https://jeoparty-io.onrender.com/';
  console.log('Diagnosing page:', targetUrl);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1280,800',
    'about:blank'
  ]);

  // Wait for Chrome port to be open
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

  // Create a new target/page
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

  console.log('Navigating to', targetUrl);
  await pSend('Page.navigate', { url: targetUrl });

  // Wait 4 seconds for load and scripts
  await new Promise(r => setTimeout(r, 4000));

  console.log('=== LOGS (' + logs.length + ') ===');
  logs.forEach(l => console.log(l));

  console.log('\n=== ERRORS (' + errors.length + ') ===');
  errors.forEach(e => console.error(e));

  // Test DOM state & arrow clickability
  const evalRes = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const leftBtn = document.getElementById('avatar-prev-btn') || document.querySelector('.avatar-arrow-left') || document.querySelector('.btn-arrow-left') || document.querySelector('[data-arrow="prev"]');
      const rightBtn = document.getElementById('avatar-next-btn') || document.querySelector('.avatar-arrow-right') || document.querySelector('.btn-arrow-right') || document.querySelector('[data-arrow="next"]');
      const playBtn = document.getElementById('play-btn') || document.getElementById('btn-play') || document.querySelector('.btn-play');
      const createPrivateBtn = document.getElementById('create-private-btn') || document.getElementById('btn-create-private');
      
      const allBtns = Array.from(document.querySelectorAll('button')).map(b => ({
        id: b.id,
        className: b.className,
        text: b.textContent.trim().slice(0, 30),
        disabled: b.disabled,
        offsetParent: Boolean(b.offsetParent),
        rect: b.getBoundingClientRect()
      }));

      // Check what element is at the center of the arrow and play button
      function getTopElementAt(el) {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const topEl = document.elementFromPoint(cx, cy);
        return {
          same: topEl === el || el.contains(topEl),
          topTag: topEl ? topEl.tagName : null,
          topId: topEl ? topEl.id : null,
          topClass: topEl ? topEl.className : null
        };
      }

      return {
        allButtonsCount: allBtns.length,
        buttons: allBtns.filter(b => b.offsetParent).slice(0, 15),
        leftBtn: leftBtn ? { id: leftBtn.id, hit: getTopElementAt(leftBtn) } : null,
        rightBtn: rightBtn ? { id: rightBtn.id, hit: getTopElementAt(rightBtn) } : null,
        playBtn: playBtn ? { id: playBtn.id, hit: getTopElementAt(playBtn) } : null,
        createPrivateBtn: createPrivateBtn ? { id: createPrivateBtn.id, hit: getTopElementAt(createPrivateBtn) } : null,
      };
    })()`,
    returnByValue: true
  });

  console.log('\n=== DOM EVALUATION ===');
  console.log(JSON.stringify(evalRes.result?.value, null, 2));

  // Try clicking the right arrow
  console.log('\nAttempting to click right arrow...');
  const clickRes = await pSend('Runtime.evaluate', {
    expression: `(() => {
      const prevAvatar = document.querySelector('.avatar-preview')?.innerHTML || '';
      const rightBtn = document.getElementById('avatar-next-btn') || document.querySelector('.avatar-arrow-right');
      if (!rightBtn) return { error: 'No right button found' };
      rightBtn.click();
      const newAvatar = document.querySelector('.avatar-preview')?.innerHTML || '';
      return { clicked: true, changed: prevAvatar !== newAvatar, prevLen: prevAvatar.length, newLen: newAvatar.length };
    })()`,
    returnByValue: true
  });
  console.log('Click result:', JSON.stringify(clickRes.result?.value, null, 2));

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
