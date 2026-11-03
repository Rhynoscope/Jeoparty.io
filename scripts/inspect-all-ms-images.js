const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Administrator/Downloads/MS paint images';
const files = fs.readdirSync(dir);
console.log('Total files in MS paint images:', files.length);

function getPngDimensions(buf) {
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), type: 'PNG' };
  }
  if (buf.length >= 10 && buf.toString('ascii', 0, 3) === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8), type: 'GIF' };
  }
  return { width: 0, height: 0, type: 'UNKNOWN' };
}

files.forEach(f => {
  const p = path.join(dir, f);
  const buf = fs.readFileSync(p);
  const info = getPngDimensions(buf);
  console.log(`${f.padEnd(35)} | Size: ${String(buf.length).padStart(7)} bytes | Dim: ${info.width}x${info.height} (${info.type})`);
});
