# Jeoparty v4.0 — Game-Show Presentation Update

This release upgrades the **gameplay presentation and mechanics** of Jeoparty in place. It does not rebuild the game, and it preserves multiplayer, public/private rooms, bots with individual difficulty, the question database, category settings, Classic + Halloween Mayhem modes, and the MS Paint pixel-art identity.

---

## What changed

### 1. Permanent host — "Jeoparty Host"
- Fixed, non-customizable pixel-art character (slick hair, mustache, blue suit, gold tie, gold microphone) drawn as crisp SVG pixels.
- Never counted as a player, never randomized, never uses player cosmetics. The same character is re-skinned for Halloween Mayhem (fixed palette swap only).
- Scripted, contextual announcements only: clue selection, buzz-in, correct/incorrect, streaks, timeouts, Daily Double, Final Jeopardy wheel spin/landing, final reveal, champion, intermission.
- Server emits `host_line` messages **after** an authoritative result only, so the host can never announce a wrong result.
- Optional host voice via the browser SpeechSynthesis API (toggle in the host bar and in Audio & Voice Settings). Captions always display.
- Files: `server/hostLines.js`, `public/js/host.js`.

### 2. Contestant podiums
- Every player (humans **and** bots) gets a podium with their actual customized avatar standing **behind** it; the podium face covers the avatar's lower body.
- Podium plates show player number, name, bot tag, authoritative money, leader crown, buzz/solved/wrong/picking states, and a streak chip.
- Podium layout is count-aware (2–10 players) and horizontally scrollable on small screens.
- Money count-up/count-down animations plus floating `+$` / `-$` / `TIME!` / `STREAK` awards driven by server-side score deltas.
- Files: `public/js/gameshow.js`, `public/css/gameshow.css`.

### 3. Server-authoritative word-by-word clue typing
- The server builds a deterministic word schedule per clue (`activeClue.reveal`), aligned with the countdown. Typing accelerates as the timer runs down.
- Every client renders from the same server timeline (`serverNow` clock offset), so reveal positions stay synchronized.
- A buzzer press freezes the reveal at the server-calculated word and broadcasts the exact frozen position to everyone.
- Incorrect answers resume the reveal from that same word with a fresh, faster schedule. Correct answers/timeouts/result screens reveal the complete question.
- Final Jeopardy clue uses the same reveal system.
- Files: `server/reveal.js` (plan/freeze/resume), `public/js/gameshow.js` (renderer).

### 4. Streak bonus ($100)
- 3rd consecutive correct answer and every one after it earns a server-calculated **+$100** on top of the clue value.
- 1st and 2nd correct answers earn no bonus. An incorrect answer (including a timeout) resets the streak to 0.
- Bonus is applied once per answer, never twice for the same question.
- Server returns the bonus inside the award stream; client shows the podium chip (`x3 +$100`), animated flames, a floating `+$100 STREAK`, a result-line note and the host's streak announcement.
- File: `server/server.js` (`recordCorrectAnswer`, `pushAward`).

### 5. Final Jeopardy category wheel
- New `final_wheel` phase before wagering.
- Wheel slices are built from the categories on the match board (the current/final board when available).
- The server alone chooses the winning slice with `crypto.randomInt`, derives the Final clue from that category in the existing question database, and broadcasts the spin plan (`startedAt`, `durationMs`, `targetIndex`, `sectors`).
- Every client animates the identical spin from server time; the winning category is not shown until the spin lands.
- Wagers and answers are validated server-side and lock permanently on submission; wager amounts stay private until the final reveal.
- Files: `server/finalWheel.js`, `server/server.js`, `public/js/gameshow.js`.

### 6. Board, transitions and Halloween theme
- Televised board framing (deep blue panels, gold insets, pixel borders, breathing selectable tiles, `USED` answered tiles).
- Fast CSS stage transitions for board → question → result → board and intermission → wheel; selected tiles pulse before the question screen.
- Halloween Mayhem gets a full palette adaptation for host, podiums, board, clue cards and wheel; the Halloween background/cosmetic system is untouched.
- **Bonus fix:** the server previously clamped avatars to base ranges (color 0–19, eyes/mouth 0–15, hat 0–10), which silently stripped Halloween skins/eyes/mouths/hats from the synchronized player state. The sanitizer now accepts the full catalogue (color 0–28, eyes/mouth 0–21, hat 0–20), so Halloween customization survives multiplayer.

---

## Compatibility preserved

- Public rooms / public matchmaking / private rooms / invite links / reconnect grace / host transfer / host-left termination.
- All three answer modes (buzzer, Everyone Answers, Host Judges), Chaos All-Play, Steal, Blitz, Double Trouble, Underdog Boost, bounties, Daily Doubles, Double Jeoparty/intermission, superlatives.
- Bots: names, assigned avatars, per-bot difficulty, reaction/sfx logic and difficulty-driven buzz/answer/wager timing are unchanged; they participate in podiums, streaks, and Final Jeopardy.
- Question database and category selection are unchanged; the new code only reads existing category/clue data.
- No new npm dependencies (Node built-ins only).

---

## Verification performed (local)

```bash
node scripts/verify-gameshow.js     # 87/87 checks passed
node scripts/visual-check.js        # Chrome screenshots, no page errors
```

The multiplayer harness drives real WebSocket clients through a full match and verifies:
- room settings, 2 humans + bots, public-room discovery, 10-player cap;
- board categories/values, actual avatar customization in player state;
- reveal plans, accelerating typing, freeze on buzz for both clients, resume after wrong answers;
- streak award at exactly 3+, wager privacy, locked wagers/answers, final scoring consistency;
- identical wheel sector list/target/timing for both clients, wheel category from the board;
- host identity/name/permanence and required announcement events;
- Halloween mode categories/currency/cosmetics and reset-to-lobby;
- static asset serving of the new files.

The visual harness plays a real match in headless Chrome at desktop and mobile widths and captures:
`03-board-desktop`, `04-board-mobile`, `05-clue-typing-desktop`, `06-clue-typing-mobile`, `07-clue-frozen`, `08b-podium-award`, `08c-streak-flames`, `09/10/11-final-wheel`, `12-final-wager`, `13-final-clue-typing`, `14/15-gameover`, `16/17-halloween`.
Artifacts are written to `scripts/artifacts/` (git-ignored).

---

## Deploying to the existing public site

Production is the Render service `jeoparty-io` (`https://jeoparty-io.onrender.com`) described in `render.yaml`:

```yaml
services:
  - type: web
    name: jeoparty-io
    env: node
    plan: free
    region: oregon
    buildCommand: ""
    startCommand: node server/server.js
    autoDeploy: true
```

`autoDeploy: true` means any push to the connected GitHub branch (`main` on `https://github.com/Rhynoscope/Jeoparty.io.git`) redeploys automatically.

### Steps (on a machine with Git + repo access)

```bash
cd jeoparty
git status                       # review changed/added files
git add -A
git commit -m "feat: game-show presentation, host, podiums, typing reveal, streak bonus, final wheel (v4.0)"
git push origin main
```

Then:
1. Open the Render dashboard → **jeoparty-io** → **Events/Logs** and wait for the deploy to reach **Live**.
2. Hard-refresh `https://jeoparty-io.onrender.com/` (cache-busted asset URLs are `?v=4.0.0`).
3. Smoke test on the public URL: create a private room, add a bot, start a 3×3 game, check the host/podiums, buzz during typing, reach a 3-answer streak, and complete Final Jeopardy.

### If the repo is not connected / no auto-deploy
In Render: **New + → Blueprint → select the repo** (or the existing service's **Manual Deploy → Deploy latest commit**). Start command stays `node server/server.js`; no build step and no environment requirements beyond the existing `NODE_ENV=production`, `PORT=10000`, `HOST_RECONNECT_GRACE_MS`.

### Rollback
Revert the commit and push (Render auto-deploys the previous version), or use the Render dashboard's **Rollback** action on the service.

> **Note:** this workspace has no Git executable, no GitHub credentials, and no Render API key, so the changes have **not** been pushed or deployed from here. The live site remains on the previous build until someone with repo access pushes the commit above.
