# Worldwide Deployment Manual for Jeoparty.io

This document provides instructions for deploying **Jeoparty.io** as a public, worldwide online multiplayer game.

---

## Architecture Overview

- **Stack**: Pure Node.js (v20+), Express-like HTTP static server, custom RFC-6455 WebSocket engine.
- **Dependencies**: 0 external npm packages required (instant builds, minimal attack surface, runs on any Node.js host).
- **Protocols**: Full HTTPS support and WSS (WebSocket Secure) protocol with 25-second heartbeat ping/pong to prevent proxy disconnects.
- **Matchmaking**: Real-time Public Rooms browser, automatic Public Quick Play matchmaking, and cryptographically secure Private Room codes/invitation links.

---

## Option 1: Free 24/7 Cloud Hosting on Render (Recommended)

Render provides free hosting for Node.js Web Services with free automatic SSL (HTTPS), custom domains, and native WebSocket support.

### Step-by-Step Instructions:

1. **Push your code to GitHub / GitLab**:
   - Create a repository named `jeoparty-io` on [github.com](https://github.com).
   - Commit the files from `C:\Users\Administrator\.gemini\antigravity\scratch\skribbl-jeopardy`.
   - Push to your main branch.

2. **Sign up or log in to Render**:
   - Visit [dashboard.render.com](https://dashboard.render.com/) and sign in (you can use your GitHub account with 1 click).

3. **Deploy using the Blueprint (Easiest)**:
   - In Render, click **New +** -> **Blueprint**.
   - Select your `jeoparty-io` repository.
   - Render will automatically read [render.yaml](file:///C:/Users/Administrator/.gemini/antigravity/scratch/skribbl-jeopardy/render.yaml) and configure:
     - **Name**: `jeoparty-io`
     - **Environment**: `Node`
     - **Plan**: `Free`
     - **Build Command**: *(empty - zero dependencies)*
     - **Start Command**: `node server/server.js`
   - Click **Apply**.

4. **Or Deploy Manually as a Web Service**:
   - Click **New +** -> **Web Service**.
   - Connect your repository.
   - Fill in:
     - **Name**: `jeoparty-io` (or your chosen game name)
     - **Region**: Choose the closest region to your players (e.g. *US East - Ohio* or *US West - Oregon*)
     - **Runtime**: `Node`
     - **Build Command**: *(leave blank)*
     - **Start Command**: `node server/server.js`
     - **Instance Type**: `Free`
   - Under **Environment Variables**, add:
     - `NODE_ENV` = `production`
     - `PORT` = `10000` *(Render sets this automatically, but good to declare)*
   - Click **Create Web Service**.

5. **Your Live Public Game URL**:
   - Render will assign an HTTPS address such as:
     ```text
     https://jeoparty-io.onrender.com
     ```
   - Share this link with friends anywhere in the world!

---

## Option 2: Instant Live Worldwide Access from Your PC (0 Setup)

If you want to play worldwide right this second from your PC without creating any cloud accounts:

1. Double-click [start-worldwide.bat](file:///C:/Users/Administrator/.gemini/antigravity/scratch/skribbl-jeopardy/start-worldwide.bat).
2. It launches the local server and connects a secure Cloudflare Tunnel to the public internet.
3. The terminal will display a live worldwide HTTPS link:
   ```text
   https://your-unique-tunnel.trycloudflare.com
   ```
4. Copy and send that link to anyone in the world. They can open it on their phone, Mac, or PC and join your room immediately!

---

## Option 3: Docker / Railway / Fly.io / VPS

The project includes a production-ready [Dockerfile](file:///C:/Users/Administrator/.gemini/antigravity/scratch/skribbl-jeopardy/Dockerfile) based on `node:20-alpine`.

### Run with Docker locally or on a VPS:
```bash
docker build -t jeoparty-io .
docker run -d -p 3000:3000 --name jeoparty jeoparty-io
```

### Deploy to Railway:
1. Log in to [railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Railway automatically detects the Dockerfile or Node.js project and provisions a live HTTPS URL.

### Deploy to Fly.io:
```bash
fly launch
fly deploy
```

---

## Production Security & Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port the server listens on (cloud hosts set this automatically). |
| `NODE_ENV` | `development` | Set to `production` in live deployments. |
| `PUBLIC_URL` | *(none)* | Set to your public domain (e.g. `https://jeoparty-io.onrender.com`) to enforce public invite URLs. |
| `HOST_RECONNECT_GRACE_MS` | `12000` | Grace period in milliseconds before terminating a room if the host disconnects unexpectedly. |

All room codes are generated using cryptographic random bytes (`crypto.randomBytes`) providing over 2 billion non-guessable private room permutations.
