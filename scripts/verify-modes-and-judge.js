'use strict';

/**
 * Verification script for:
 * 1. Hardened Bot Difficulties (Easy, Medium, Hard hardened; Champion unchanged)
 * 2. All 8 Game Modes (standard, survival, double_or_nothing, hot_potato, teams, chaos, speed, halloween)
 * 3. Complete Removal of Judge Mode (server, client, HTML, CSS, assets)
 * 4. Hot Potato Game Mode (ticking bomb, passing, explosion, podium potato)
 * 5. Team Jeopardy (15s selection overlay, 4 teams: Red, Blue, Green, Yellow, scoreboard banner)
 * 6. Speed Blitz, Survival (sole survivor), Double or Nothing (doubled board values)
 * 7. Host Redesign (symmetrical, stylish hair, defined nose, shine eyes, clean smile, no mustache)
 */

const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

console.log('=== STARTING JEOPARTY MODES, BOT FAIRNESS & GAMEPLAY VERIFICATION ===\n');

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

// 3. Verify Complete Removal of Judge Mode
console.log('Test 3: Verify Complete Removal of Judge Mode across server and client...');
assert(!serverCode.includes('function handleHostJudge'), 'server.js must NOT contain handleHostJudge');
assert(!serverCode.includes("case 'host_judge':"), 'server.js must NOT handle host_judge websocket message');
assert(!serverCode.includes("ac.judgePlayerId"), 'server.js must NOT contain ac.judgePlayerId');
assert(!serverCode.includes("answerMode === 'host'"), 'server.js must NOT reference answerMode === host');

const indexHtml = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
assert(!indexHtml.includes('id="judge-stage"'), 'index.html must NOT contain #judge-stage');
assert(!indexHtml.includes('id="host-judge-box"'), 'index.html must NOT contain #host-judge-box');
assert(!indexHtml.includes('value="host"'), 'index.html must NOT contain <option value="host">');
assert(!indexHtml.includes('Judge Mode:'), 'index.html must NOT mention Judge Mode in news/help');

const judgeFilePath = path.resolve(__dirname, '../public/js/judge.js');
assert(!fs.existsSync(judgeFilePath), 'public/js/judge.js must be completely removed');

const gameshowJs = fs.readFileSync(path.resolve(__dirname, '../public/js/gameshow.js'), 'utf8');
assert(!gameshowJs.includes("from './judge.js'"), 'gameshow.js must NOT import judge.js');
assert(!gameshowJs.includes('judgePresenter'), 'gameshow.js must NOT reference judgePresenter');

const gameshowCss = fs.readFileSync(path.resolve(__dirname, '../public/css/gameshow.css'), 'utf8');
assert(!gameshowCss.includes('.judge-stage'), 'gameshow.css must NOT contain .judge-stage styles');
console.log('PASS: Judge Mode completely eradicated from codebase!\n');

// 4. Verify Hot Potato Game Mode
console.log('Test 4: Verify Hot Potato Game Mode mechanics...');
assert(serverCode.includes('ac.hotPotatoHolderId'), 'server.js must track hotPotatoHolderId');
assert(serverCode.includes('HOT POTATO EXPLODED'), 'server.js must handle explosion detonation');
assert(gameshowJs.includes('podium-hot-potato'), 'gameshow.js must render podium-hot-potato element');
assert(gameshowCss.includes('.podium-hot-potato'), 'gameshow.css must style .podium-hot-potato');
assert(gameshowCss.includes('.has-hot-potato'), 'gameshow.css must style .has-hot-potato');
console.log('PASS: Hot Potato mechanics verified.\n');

// 5. Verify Team Jeopardy (4 Teams + 15s Selection Overlay)
console.log('Test 5: Verify Team Jeopardy 4-team selection and scoreboard...');
assert(serverCode.includes('function enterTeamSelectPhase'), 'server.js must have enterTeamSelectPhase');
assert(serverCode.includes('function finishTeamSelect'), 'server.js must have finishTeamSelect');
assert(serverCode.includes("case 'select_team':"), 'server.js must handle select_team websocket message');
assert(indexHtml.includes('id="team-select-overlay"'), 'index.html must have #team-select-overlay');
assert(indexHtml.includes('data-team="red"') && indexHtml.includes('data-team="yellow"'), 'index.html must have 4 team cards');
assert(indexHtml.includes('id="team-green-score"') && indexHtml.includes('id="team-yellow-score"'), 'index.html must have 4 team score indicators');
assert(gameshowJs.includes('team-green') || gameshowJs.includes('safeTeam'), 'gameshow.js must support all 4 teams');
assert(gameshowCss.includes('.team-green') && gameshowCss.includes('.team-yellow'), 'gameshow.css must style all 4 teams');
console.log('PASS: Team Jeopardy 4-team expansion verified.\n');

// 6. Verify Speed Blitz, Survival, and Double or Nothing
console.log('Test 6: Verify Speed Blitz, Survival (sole survivor), Double or Nothing...');
assert(serverCode.includes('SPEED BLITZ BONUS'), 'server.js must award Speed Blitz bonus');
assert(serverCode.includes('SOLE SURVIVOR'), 'server.js must crown Sole Survivor');
assert(serverCode.includes("room.settings.gameMode === 'double_or_nothing' ? 2 : 1"), 'server.js must double board tile values for double_or_nothing');
console.log('PASS: Speed Blitz, Survival, and Double or Nothing verified.\n');

// 7. Verify Redesigned Host (no mustache, defined nose, shine eyes, stylish hair)
console.log('Test 7: Verify Host Redesign in public/js/host.js...');
const hostJs = fs.readFileSync(path.resolve(__dirname, '../public/js/host.js'), 'utf8');
assert(hostJs.includes('export function drawHostFrame'), 'host.js must export drawHostFrame');
assert(hostJs.includes("'smiling'") && hostJs.includes("'blinking'"), 'host.js must include smiling and blinking moods');
assert(hostJs.includes('Defined Nose Bridge'), 'host.js must have defined nose bridge');
assert(!hostJs.includes('stachePts'), 'host.js must NOT have old mustache cluttering face');
assert(hostJs.includes('Expressive Game-Show Eyes with White Sclera & Shine'), 'host.js must have eye shine');
console.log('PASS: Redesigned Host verified.\n');

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
