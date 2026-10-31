'use strict';

/**
 * Master MS Paint Pixel-Art & Animated Sprite Sheet Generator for Jeoparty.io
 *
 * Generates 100% custom, zero-dependency, nearest-neighbor PNG sprite sheets into:
 *   - public/assets/sprites/avatars/
 *   - public/assets/sprites/reactions/
 *   - public/assets/sprites/icons/
 *   - public/assets/sprites/categories/
 *   - public/assets/sprites/effects/
 *   - public/assets/sprites/interface/
 */

const fs = require('node:fs');
const path = require('node:path');

const { generateAllReactionSprites } = require('./generators/reactions');
const { generateAllCategorySprites } = require('./generators/categories');
const {
  generateLogoSheet,
  generateDoodleBg,
  generateInterfaceSprites,
  generateIconSprites,
  generateEffectSprites,
  generateAvatarSpriteSheets,
} = require('./generators/interface-and-effects');

const ROOT = path.resolve(__dirname, '..');
const LEGACY_ASSETS_DIR = path.join(ROOT, 'public', 'assets');
const SPRITES_ROOT = path.join(LEGACY_ASSETS_DIR, 'sprites');

const DIRS = {
  avatars: path.join(SPRITES_ROOT, 'avatars'),
  reactions: path.join(SPRITES_ROOT, 'reactions'),
  icons: path.join(SPRITES_ROOT, 'icons'),
  categories: path.join(SPRITES_ROOT, 'categories'),
  effects: path.join(SPRITES_ROOT, 'effects'),
  interface: path.join(SPRITES_ROOT, 'interface'),
};

function main() {
  fs.mkdirSync(LEGACY_ASSETS_DIR, { recursive: true });
  for (const dir of Object.values(DIRS)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log('Generating MS Paint pixel-art sprite sheets...');

  generateLogoSheet(DIRS.interface, LEGACY_ASSETS_DIR);
  generateDoodleBg(DIRS.interface, LEGACY_ASSETS_DIR);
  generateInterfaceSprites(DIRS.interface, LEGACY_ASSETS_DIR);
  generateIconSprites(DIRS.icons, LEGACY_ASSETS_DIR);
  generateEffectSprites(DIRS.effects, LEGACY_ASSETS_DIR);
  generateAvatarSpriteSheets(DIRS.avatars);

  const reactions = generateAllReactionSprites(DIRS.reactions);
  const categories = generateAllCategorySprites(DIRS.categories, LEGACY_ASSETS_DIR);

  // Remove stale reaction-strips.png from legacy assets if present so no old graphic lingers
  const oldReactionStrips = path.join(LEGACY_ASSETS_DIR, 'reaction-strips.png');
  if (fs.existsSync(oldReactionStrips)) {
    fs.unlinkSync(oldReactionStrips);
  }

  // Count and validate PNG headers across all sprite folders
  let totalFiles = 0;
  let totalBytes = 0;
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  for (const [group, dir] of Object.entries(DIRS)) {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const buf = fs.readFileSync(fullPath);
      if (buf.length < 64 || !buf.subarray(0, 8).equals(PNG_SIG)) {
        throw new Error(`Invalid PNG generated at ${fullPath}`);
      }
      totalFiles++;
      totalBytes += buf.length;
    }
    console.log(`  [${group}] ${files.length} PNG sprite sheets verified`);
  }

  console.log(
    `Done! Generated ${totalFiles} verified MS Paint pixel-art PNG sprite sheets (${(
      totalBytes / 1024
    ).toFixed(1)} KB total) covering ${reactions.length} animated reactions and ${
      categories.count
    } animated trivia categories.`
  );
}

main();
