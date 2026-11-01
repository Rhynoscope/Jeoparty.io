# Jeoparty v4.1 — Cinematic 2.5D Game-Show Camera

This release adds a televised opening sequence and broadcast camera moves to the
existing Jeoparty presentation. It extends the v4.0 game-show stage; it does not
replace the game engine, multiplayer, rooms, bots, question database, categories,
Classic/Halloween modes or the MS Paint pixel-art identity.

---

## What's new

### 1. Cinematic match intro (`intro` phase)
- A new server-owned phase runs before the board: **wide stage shot → host →
  every contestant individually → board reveal**.
- The server builds the storyboard (`room.intro.steps`) with exact start times,
  so every client sees the same order and timing. No client decides the intro.
- The permanent **Jeoparty Host** says exactly:
  - `Hello, everyone! I'm your host, and welcome to Jeoparty!`
  - `Alright, contestants! Let's get this game started!`
- Every human is introduced with their **real username** and **actual avatar**:
  `Hello, I'm <name>!`
- Bots use a short scripted line (no AI personalities):
  `I'm <name>, and I'm ready to play!`
- The intro finishes automatically. The host can press **Skip Intro** to advance
  the whole room; non-hosts cannot skip for everyone.
- Late joiners are rejected during the show (as with any non-lobby phase);
  reconnecting players with their saved token return to the live intro position.

### 2. 2.5D camera stage
- New layered cinematic stage: animated marquee logo, curtains, valance bulbs,
  lighting rig/sweeping lamps, perspective floor grid, host platform, category
  board and contestant podiums.
- A virtual camera applies translate / scale / `rotateY` / `rotateX` with easing
  and per-layer parallax, creating depth without 3D models.
- Camera shots: wide establishing shot, slow host push-in, pans/zooms across
  contestant podiums, board push-in and pull-back to the normal gameplay view.
- The stage stays inside the centre stage; it never causes horizontal page
  overflow and is fully responsive (portrait framing boost on phones).

### 3. Money-event camera
- Correct answers / streaks / Daily Double / Final results: a broadcast
  **close-up cutaway** of the scoring contestant's podium (avatar, name,
  animated money, floating `+$` / `-$`, streak flames, host line subtitle).
- The cutaway is only used when the question is resolved (`clue_result`,
  `game_over`, final phases) so it can never cover a live buzzer or answer box.
- During an open clue (including Chaos All-Play / Skribbl / a wrong answer that
  keeps the question open) the camera instead performs a **podium nudge**: the
  actual podium zooms forward, siblings dim, the money animates, and the clue UI
  keeps running normally.
- Match winner: on the host's champion line, a dramatic zoom to the winner's
  podium with confetti and the champion lower third.
- Final Jeopardy: a wide cinematic bumper before the category wheel.

### 4. Cinematic Camera setting
Lobby → Game Settings → **Cinematic Camera**:
- **Enabled** — full intro + broadcast camera moves.
- **Reduced Motion** — shorter intro, gentler shots.
- **Disabled** — no intro; the match starts straight on the board; event
  cutaways are replaced by podium highlights.

The host controls this room-wide setting (it is locked during a match); it is
saved in the host's preferred settings. Clients also respect the existing
`Anim: On/Off` / `prefers-reduced-motion` preference: reduced motion suppresses
cutaways and shortens camera moves locally.

### 5. Halloween Mayhem
- The cinematic stage, curtains, lights, board, podiums and lower third adapt to
  the Halloween palette; the permanent host gets the same fixed Halloween suit
  palette (purple suit / orange tie) in both the stage and the lower third.
- The Halloween background and existing cosmetic system are untouched.

---

## Files added / changed

Added:
- `server/` intro phase + storyboard in `server/server.js`
- `public/js/cinematic.js`
- `public/css/cinematic.css`

Changed:
- `server/server.js` (intro phase, `cinematicCamera` setting, `skip_intro`,
  intro serialization, `intro_outro` line)
- `server/hostLines.js` (exact board-reveal line)
- `public/index.html` (cinematic layer, camera setting, v4.1 assets)
- `public/js/app.js` (intro phase rendering, camera setting UI, cinematic hooks)
- `public/js/gameshow.js` (awards feed the camera; hidden host bar during intro)
- `public/css/gameshow.css` (podium rise animation no longer blocks the nudge)
- `public/js/audio.js` (intro fanfare, board reveal, camera shot sounds)
- `README.md`, `.gitignore`, verification scripts

---

## Verification (run against a real server, no mocks)

```bash
node scripts/verify-gameshow.js      # 117/117 checks
node scripts/visual-check.js         # real Chrome desktop + mobile screenshots
```

The harness covers:
- the existing v4.0 gameplay suite (typing freeze/resume, streak bonus, Final
  wheel, wagers, Halloween, public rooms, 10-player cap);
- the intro storyboard order and exact host lines;
- every connected player introduced once with real names/avatars;
- bot scripted intro lines;
- identical intro timing on multiple clients;
- host-only skip; late-join rejection; token reconnect into the live intro;
- reduced/disabled camera modes;
- a 10-contestant intro with a bounded duration;
- all new static assets/settings.

The Chrome driver plays a full match and captures the wide/host/first
contestant/mobile/board intro steps, a money cutaway, the final wheel and the
champion close-up, with **no page errors**.

---

## Deployment

Same Render service as v4.0 (`jeoparty-io.onrender.com`), `autoDeploy: true`.

```bash
git add -A
git commit -m "feat: cinematic 2.5D game-show intro, host/contestant camera tour, money close-ups (v4.1)"
git push origin main
```

Then verify on the public URL:

```bash
JEOPARTY_URL=https://jeoparty-io.onrender.com node scripts/verify-gameshow.js
JEOPARTY_URL=https://jeoparty-io.onrender.com node scripts/visual-check.js
```

Expected public assets: `styles.css?v=4.1.0`, `gameshow.css?v=4.1.0`,
`cinematic.css?v=4.1.0`, `app.js?v=4.1.0`, plus `js/cinematic.js`.
