const fs = require('fs');
const path = require('path');

// Let's inspect the sprite sheets from MS paint images
const dir = 'C:/Users/Administrator/Downloads/MS paint images';

const files = [
  'DM_20261029002538_001.gif', // bodies
  'DM_20261029002539_001.gif', // eyes
  'DM_20261029002532_001.gif', // mouths
  'DM_20261029002540_001.gif', // hats
];

files.forEach(f => {
  const p = path.join(dir, f);
  const buf = fs.readFileSync(p);
  console.log(f, buf.length, 'bytes');
});
