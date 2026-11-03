'use strict';
const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Administrator/Downloads/MS paint images';
if (!fs.existsSync(dir)) {
  console.log('Dir does not exist:', dir);
  process.exit(1);
}

const files = fs.readdirSync(dir);
console.log('Total files in MS paint images:', files.length);

for (const f of files) {
  const p = path.join(dir, f);
  const buf = fs.readFileSync(p);
  let w = 0, h = 0, type = 'unknown';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    type = 'PNG';
    w = buf.readUInt32BE(16);
    h = buf.readUInt32BE(20);
  } else if (buf.slice(0, 3).toString() === 'GIF') {
    type = 'GIF';
    w = buf.readUInt16LE(6);
    h = buf.readUInt16LE(8);
  }
  console.log(`${f.padEnd(32)} ${type.padEnd(6)} ${`${w}x${h}`.padEnd(12)} ${buf.length} bytes`);
}
