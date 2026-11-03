const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/Administrator/Downloads/MS paint images';
const destDir = 'C:/Users/Administrator/Downloads/jeoparty/public/assets/ms-paint';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
files.forEach(f => {
  const src = path.join(srcDir, f);
  const dst = path.join(destDir, f);
  fs.copyFileSync(src, dst);
});

// Also create clean canonical aliases for easiest sprite sheet referencing:
const aliases = {
  'avatar-bodies.gif': 'DM_20261029002538_001.gif',
  'avatar-eyes.gif': 'DM_20261029002539_001.gif',
  'avatar-mouths.gif': 'DM_20261029002532_001.gif',
  'avatar-hats.gif': 'DM_20261029002540_001.gif',
  'skribbl-logo-animated.gif': 'DM_20261101195844_001.gif',
  'doodle-bg.png': 'DM_20261029002534_001.png',
  'icon-dice.gif': 'DM_20261029002606_001.gif',
  'icon-clock.gif': 'DM_20261029002602_001.gif',
  'icon-sound.gif': 'DM_20261029002548_001.gif',
  'icon-gear.gif': 'DM_20261029002603_001.gif',
  'icon-crown.gif': 'DM_20261029002608_001.gif',
  'icon-help.gif': 'DM_20261029002547_001.gif',
  'icon-trash.gif': 'DM_20261029002552_001.gif',
  'icon-back.gif': 'DM_20261029002554_001.gif',
  'icon-arrow.gif': 'DM_20261029002604_001.gif',
};

for (const [alias, target] of Object.entries(aliases)) {
  const src = path.join(srcDir, target);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(destDir, alias));
  }
}

console.log('SUCCESS: Copied all MS paint images and created canonical aliases in public/assets/ms-paint.');
