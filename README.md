# jeoparty.io — Animated MS Paint Pixel-Art Multiplayer Jeopardy

An online multiplayer **Jeopardy** party web game crafted in an animated **MS Paint pixel-art** and **Skribbl.io**-inspired doodle style.

## Features

- **Animated MS Paint Pixel-Art Style**:
  - Hand-drawn 3-frame animated MS Paint pixel logo (`public/assets/logo-sheet.png`) and seamless `180x180` purple pixel-doodle wallpaper (`public/assets/doodle-bg.png`).
  - Dynamic 4-frame animated cartoon avatars (`public/js/avatar.js`) with 20 colors & diagonal stripe skins, 5 distinct head/body shapes, 16 eye expressions, 16 mouths, 11 hats, and animated leader/host crowns.
  - Hand-drawn pixel-art category icons (`public/assets/cat-icons-sheet.png`) and looping 2–3 frame pixel sprites for crowns, trophies, buzzers, Daily Double stars, correct/incorrect indicators, confetti, loading dots, dice, and timer clocks (`scripts/generate-pixel-assets.js`).
  - Built-in **Sound** and **Animations** toggles plus automatic support for `prefers-reduced-motion: reduce`.
- **Clean, Immediately Understandable Interface**:
  - **Main Menu**: Logo, 8 animated mascots, player name, 4-row `<`/`>` avatar customizer + dice button, **Play!**, **Create Private Room**, and **Join Room**, with secondary controls tucked into a compact top-right utility bar.
  - **Private-Room Lobby**: Organized into **ROOM** (code + one-click invite link), **GAME SETTINGS** (3 core selects, prominent category picker with search/presets/custom categories, and a collapsible `<details>` section for optional special rounds), and **ACTIONS** (**Leave Room** and **Start Game**).
- **Strict Host-Owned Room Lifecycle**:
  - When the host intentionally leaves an active match or waiting lobby, the server immediately terminates the match, cancels all timers, tombstones the room code so stale links/history cannot resurrect it, and notifies remaining players via a clear **Match Ended** dialog.
  - Pressing **Play!** or **Create Private Room** from the main menu always creates a brand-new room (`roomId`, `roomCode`, `gameId`) with reset scores (`$0`), reset timers, and a fresh board while remembering your preferred rules/category choices.
  - Unexpected host network drops allow a short, configurable reconnection grace window (`HOST_RECONNECT_GRACE_MS`, default `12000` ms) before terminating the match if the host does not return.
- **Full Jeopardy Gameplay**:
  - **24 Built-in Fun Categories** (`120+` clues) + **Custom 5-Clue Categories**.
  - **3 Game Modes**: Classic Buzzer (`Spacebar` or click + typo-tolerant fuzzy auto-judging), Everyone Answers (Skribbl speed guessing with progressive `_ _ _ _` hints), and Host Judges (party/voice mode).
  - Optional **Double Jeoparty** (Round 2), **Hidden Daily Doubles**, **Final Jeoparty** secret wagering finale, **Wrong Answer Penalties**, and **Play Again** rematch support.

## Game-Show Presentation Update (v4.0)

Jeoparty now presents every match like a televised game show while keeping the hand-drawn MS Paint pixel-art identity:

- **Permanent host character** — a fixed "Jeoparty Host" pixel-art presenter (never player-customized, never random, never counted as a player) with scripted, contextual announcements and optional text-to-speech captions.
- **Contestant podiums** — every human and bot stands behind their own podium with their real customized avatar (including Halloween cosmetics), name, player number and live authoritative money.
- **Typing clue reveal** — clues type out word-by-word on a server-owned timeline. Buzzing freezes the visible text for *all* players at the exact server word position; a wrong answer resumes typing from that word.
- **Streak bonus** — 3 correct answers in a row activates a server-calculated **+$100** bonus on that answer and every correct answer after it, with pixel flames, a streak chip and a floating money animation.
- **Final Jeopardy wheel** — the final round begins with a server-selected, client-synchronized category wheel built from the categories on the match board, followed by private wagers and a narrated reveal.
- **Money animations** — podiums count their totals up/down with floating `+$` / `-$` awards for correct, incorrect, timeout and final results.
- **MS Paint styling everywhere** — pixel borders, sprite flames, category panels, torn-paper transitions, and a Halloween Mayhem palette that adapts the host, board, podiums and wheel without touching the Halloween background or cosmetic system.

### Verification

```bash
node scripts/verify-gameshow.js    # headless multiplayer + bot + rule checks (117 assertions)
node scripts/visual-check.js       # real Chrome screenshots of every stage (desktop + mobile)
```

Both scripts run the real server (no mocks) and write their output under `scripts/artifacts/`.

## Cinematic 2.5D Update (v4.1)

- **Televised match intro** — the server runs a wide stage shot → host welcome → individual contestant introductions → board reveal, with exact subtitles and automatic completion. The host can skip it.
- **2.5D camera** — layered curtains, marquee, lighting rig, perspective floor, host stage, board and podiums moved by an eased pan/zoom/tilt camera with parallax depth.
- **Broadcast money close-ups** — correct answers, streaks, Daily Double and the champion cut to the scoring contestant's podium; live questions use an in-strip camera nudge so the buzzer is never blocked.
- **Cinematic Camera setting** — Enabled / Reduced Motion / Disabled in the lobby.
- **Halloween-ready** — the host, stage, board, podiums and lower third use the Halloween palette while the existing Halloween background/cosmetics stay intact.

See [DEPLOY_CINEMATIC.md](DEPLOY_CINEMATIC.md) for the release and deployment notes.

## Quick Start (Zero External Dependencies)

No `npm install` is required — the server runs natively on Node.js 20+ using built-in HTTP and RFC 6455 WebSockets.

- **Windows (Command Prompt / Double-click)**:
  ```bat
  .\start-server.bat
  ```
- **Windows (PowerShell)**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\start-server.ps1
  ```
- **Standard Node CLI**:
  ```bash
  node server/server.js
  ```
  *(If using Antigravity's bundled Node runtime without global `node` on `PATH`, run `agy-node.cmd server/server.js`.)*

Then open **http://localhost:3000** in your browser.

### Optional Environment Variables

- `PORT` — HTTP/WebSocket port (default: `3000`).
- `HOST_RECONNECT_GRACE_MS` — Grace period in milliseconds for an unexpected host network drop before terminating the match (default: `12000`, clamped to `2000..120000`).

### Regenerating Pixel-Art Assets

All PNG sprite sheets in `public/assets/` are generated deterministically with zero external dependencies via:

```bash
node scripts/generate-pixel-assets.js
```
