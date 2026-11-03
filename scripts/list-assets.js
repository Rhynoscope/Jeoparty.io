const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const assets = walk('C:/Users/Administrator/Downloads/jeoparty/public/assets');
console.log('Total asset files:', assets.length);
assets.forEach(a => {
  const rel = path.relative('C:/Users/Administrator/Downloads/jeoparty/public', a).replace(/\\/g, '/');
  const sz = fs.statSync(a).size;
  console.log(`${rel.padEnd(45)} (${sz} bytes)`);
});
