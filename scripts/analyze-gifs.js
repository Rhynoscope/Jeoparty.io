const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Administrator/Downloads/MS paint images';
const files = fs.readdirSync(dir);

function analyzeGif(buf) {
  let isGif = buf.toString('ascii', 0, 3) === 'GIF';
  if (!isGif) return null;
  let w = buf.readUInt16LE(6);
  let h = buf.readUInt16LE(8);
  // Scan for image descriptors (0x2C)
  let frames = 0;
  for (let i = 13; i < buf.length - 9; i++) {
    if (buf[i] === 0x2C) {
      frames++;
    }
  }
  return { w, h, frames };
}

files.forEach(f => {
  const p = path.join(dir, f);
  const buf = fs.readFileSync(p);
  const gifInfo = analyzeGif(buf);
  if (gifInfo) {
    console.log(`${f.padEnd(32)} | GIF ${gifInfo.w}x${gifInfo.h} | approx frames: ${gifInfo.frames} | ${buf.length} bytes`);
  } else {
    console.log(`${f.padEnd(32)} | PNG | ${buf.length} bytes`);
  }
});
