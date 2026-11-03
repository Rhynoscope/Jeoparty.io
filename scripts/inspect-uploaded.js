const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Administrator/Downloads/MS paint images';

// Check the uploaded files from user request too!
const brainDir = 'C:/Users/Administrator/.gemini/antigravity/brain/ff3a672f-5cbd-45ff-9514-77bfbeb492ae/.user_uploaded';
const userFiles = fs.readdirSync(brainDir);
console.log('User uploaded files in brainDir:', userFiles);

userFiles.forEach(f => {
  const p = path.join(brainDir, f);
  const buf = fs.readFileSync(p);
  console.log(`Uploaded ${f}: ${buf.length} bytes`);
});
