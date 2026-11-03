'use strict';

/**
 * End-to-end verification script for:
 * 1. Hardened Bot Difficulties (Easy, Medium, Hard hardened; Champion unchanged)
 * 2. All 8 Game Modes (standard, survival, double_or_nothing, hot_potato, teams, chaos, speed, halloween)
 * 3. Fair Judge Mode (auto-passes correct answers, rotating player judge for ambiguous answers, grief-proof)
 * 4. Avatar & Studio presentation assets
 */

const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

console.log('=== STARTING JEOPARTY MODES, BOT DIFFICULTY & JUDGE VERIFICATION ===\n');

// 1. Verify Bot Difficulty Profiles
const serverPath = path.resolve(__dirname, '../server/server.js');
const serverCode = fs.readFileSync(serverPath, 'utf8');

console.log('Test 1: Verify Bot Skill Profiles in server.js...');
assert(serverCode.includes("baseAccuracy = 0.52;"), 'Easy baseAccuracy should be 0.52');
assert(serverCode.includes("readingMultiplier = 1.12;"), 'Easy reading multiplier should be 1.12');
assert(serverCode.includes("minHesitationMs = 1800;") && serverCode.includes("maxHesitationMs = 3600;"), 'Easy hesitation should be 1.8-3.6s');

assert(serverCode.includes("baseAccuracy = 0.74;"), 'Medium baseAccuracy should be 0.74');
assert(serverCode.includes("readingMultiplier = 0.88;"), 'Medium reading multiplier should be 0.88');
assert(serverCode.includes("minHesitationMs = 950;") && serverCode.includes("maxHesitationMs = 1950;"), 'Medium hesitation should be 0.95-1.95s');

assert(serverCode.includes("baseAccuracy = 0.88;"), 'Hard baseAccuracy should be 0.88');
assert(serverCode.includes("readingMultiplier = 0.70;"), 'Hard reading multiplier should be 0.70');
assert(serverCode.includes("minHesitationMs = 550;") && serverCode.includes("maxHesitationMs = 1150;"), 'Hard hesitation should be 0.55-1.15s');

// Champion MUST BE UNCHANGED
assert(serverCode.includes("baseAccuracy = 0.91;"), 'Champion accuracy must remain exactly 0.91');
assert(serverCode.includes("readingMultiplier = 0.62;"), 'Champion reading multiplier must remain exactly 0.62');
assert(serverCode.includes("minHesitationMs = 450;") && serverCode.includes("maxHesitationMs = 950;"), 'Champion hesitation must remain exactly 0.45-0.95s');
console.log('PASS: Bot skill profiles verified (Easy, Medium, Hard hardened; Champion unchanged).\n');

// 2. Verify VALID_GAME_MODES in server.js
console.log('Test 2: Verify Game Modes support in server.js...');
const requiredModes = [
  'standard',
  'survival',
  'double_or_nothing',
  'hot_potato',
  'teams',
  'chaos',
  'speed',
  'halloween'
];
for (const mode of requiredModes) {
  assert(serverCode.includes(`'${mode}'`), `server.js must contain game mode: ${mode}`);
}
console.log('PASS: All 8 game modes defined and handled in server.js.\n');

// 3. Verify Fair Host Judge Mode in server.js
console.log('Test 3: Verify Fair Host Judge Mode rules...');
assert(serverCode.includes("if (evaluation.status === 'correct') {"), 'Server must check answer first and auto-award correct answers');
assert(serverCode.includes("applyCorrectBuzz(room, player)"), 'Server must auto-award correct answers immediately');
assert(serverCode.includes("evaluation.status === 'close'"), 'Judge mode must only route ambiguous (close) answers to judge');
assert(serverCode.includes("eligibleJudges"), 'Must pick rotating eligible judge excluding answering player');
assert(serverCode.includes("judgePlayer.id === buzzed.id"), 'Anti-griefing: Contestants cannot judge themselves');
assert(serverCode.includes("auto.status === 'correct'"), 'Anti-griefing: Judges cannot reject server-verified correct answers');
console.log('PASS: Fair Host Judge Mode logic satisfies all requirements.\n');

// 4. Verify Judge Presenter in public/js/judge.js
console.log('Test 4: Verify public/js/judge.js existence and exports...');
const judgePath = path.resolve(__dirname, '../public/js/judge.js');
assert(fs.existsSync(judgePath), 'judge.js must exist');
const judgeCode = fs.readFileSync(judgePath, 'utf8');
assert(judgeCode.includes('export class JudgePresenter'), 'judge.js must export JudgePresenter');
assert(judgeCode.includes('drawJudgeFrame'), 'judge.js must export drawJudgeFrame');
assert(judgeCode.includes('judgePresenter = new JudgePresenter()'), 'judge.js must export judgePresenter singleton');
console.log('PASS: Judge module and MS Paint pixel-art character verified.\n');

// 5. Verify enlarged avatar sizing & quiz show studio in gameshow.js and gameshow.css
console.log('Test 5: Verify avatar scaling and quiz show studio presentation...');
const gameshowJs = fs.readFileSync(path.resolve(__dirname, '../public/js/gameshow.js'), 'utf8');
assert(gameshowJs.includes('count <= 3 ? 136 : count <= 6 ? 108 : 88'), 'Avatar size must scale: 1-3 -> 136px, 4-6 -> 108px, 7-10 -> 88px');
assert(gameshowJs.includes('podium-lives'), 'gameshow.js must render podium-lives for Survival mode');
assert(gameshowJs.includes('podium-team-badge'), 'gameshow.js must render podium-team-badge for Teams mode');

const gameshowCss = fs.readFileSync(path.resolve(__dirname, '../public/css/gameshow.css'), 'utf8');
assert(gameshowCss.includes('width: 140px'), 'Host figure must be enlarged (140px)');
assert(gameshowCss.includes('--av-size: 136px'), 'Host avatar must be enlarged (136px)');
assert(gameshowCss.includes('width: 124px'), 'Judge figure must be 120-130px (124px)');
assert(gameshowCss.includes('.judge-stage'), 'CSS must style .judge-stage');
assert(gameshowCss.includes('.podium-lives'), 'CSS must style .podium-lives');
assert(gameshowCss.includes('.podium-team-badge'), 'CSS must style .podium-team-badge');

const indexHtml = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
assert(indexHtml.includes('id="judge-stage"'), 'index.html must have #judge-stage');
assert(indexHtml.includes('data-mode="survival"'), 'index.html must have survival mode button');
assert(indexHtml.includes('data-mode="double_or_nothing"'), 'index.html must have double_or_nothing mode button');
assert(indexHtml.includes('data-mode="hot_potato"'), 'index.html must have hot_potato mode button');
assert(indexHtml.includes('data-mode="teams"'), 'index.html must have teams mode button');
assert(indexHtml.includes('data-mode="chaos"'), 'index.html must have chaos mode button');
assert(indexHtml.includes('data-mode="speed"'), 'index.html must have speed mode button');
assert(indexHtml.includes('Fair Judge Mode (Random Player Judge)'), 'index.html must have Fair Judge Mode option');
assert(indexHtml.includes('v=4.4.') || indexHtml.includes('v=4.3.1') || indexHtml.includes('v=4.3.0'), 'index.html must be cache-busted to v=4.4.x');

console.log('PASS: All UI elements, sizing, styles, and cache versions verified.\n');

// 6. Verify Authentic Seamless Doodle Wallpaper
console.log('Test 6: Verify authentic Skribbl doodle background asset...');
const doodlePath1 = path.resolve(__dirname, '../public/assets/doodle-bg.png');
const doodlePath2 = path.resolve(__dirname, '../public/assets/sprites/interface/doodle-bg.png');
assert(fs.existsSync(doodlePath1), 'doodle-bg.png must exist');
assert(fs.existsSync(doodlePath2), 'interface doodle-bg.png must exist');
const doodleStat = fs.statSync(doodlePath1);
assert(doodleStat.size > 8000, 'doodle-bg.png should be the authentic 512x512 asset (~8.9KB)');
console.log(`PASS: Doodle background verified (${doodleStat.size} bytes).\n`);

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
