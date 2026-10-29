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
