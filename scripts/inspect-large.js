const fs = require('fs');
const path = require('path');

const brainDir = 'C:/Users/Administrator/.gemini/antigravity/brain/ff3a672f-5cbd-45ff-9514-77bfbeb492ae/.user_uploaded';

function getPngDimensions(buf) {
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), type: 'PNG' };
  }
  return { width: 0, height: 0, type: 'UNKNOWN' };
}

const largeFiles = [
  'media_1793247952990_fa5db550.png',
  'media_1793247953032_b656529a.png',
  'media_1793321507257_5a9be9aa.png',
  'media_1793559267807_db312cf1.png',
];

largeFiles.forEach(f => {
  const p = path.join(brainDir, f);
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    console.log(f, buf.length, 'bytes', getPngDimensions(buf));
  }
});
