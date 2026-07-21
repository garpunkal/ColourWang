# ColourWang

Real-time multiplayer party quiz game with a host screen and mobile player controllers.

## Overview

ColourWang is built for local multiplayer sessions:

- Host runs the game on a larger screen.
- Players join from phones using a room code or QR code.
- Gameplay is synchronized in real time over Socket.IO.

Core highlights:

- Multi-screen host + player architecture
- Real-time game state sync
- HTTPS local dev setup for better mobile/browser compatibility
- PWA-ready client assets
- Centralized game/content configuration in the `config` folder

## Gameplay Events

When jokers are enabled, players can use special event cards during question time.

- STEAL: removes a random set of answer cards from other players.
- BLOCK: choose a player to block from answering for the current question.

BLOCK rules:

- Can target any other player, whether they already answered or not.
- Can only be used while question time is still active.
- The blocked state lasts for the current question only.

## Tech Stack

- Frontend: React 19 + Vite + TypeScript
- Backend: Node.js + Express + Socket.IO
- Tooling: ESLint, Nodemon, Concurrently

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Devices on the same local network for multiplayer testing

### Install

```bash
git clone https://github.com/garpunkal/ColourWang.git
cd ColourWang
npm run install:all
```

### Run (Client + Server)

```bash
npm run dev
```

Default local URLs:

- Client (host screen): `https://localhost:5173`
- Server API/Socket: `http://localhost:3001`

## HTTPS Notes (Local Dev)

The client uses local certificates and runs over HTTPS.

- Start the client first at least once to generate cert files in `certs`.
- Then run the server (or run both with `npm run dev`).
- On first use, browsers/devices may show a self-signed certificate warning.

## Scripts

From the project root:

- `npm run dev` - run server and client together
- `npm run dev:server` - run only server
- `npm run dev:client` - run only client
- `npm run install:all` - install root, server, and client dependencies

From `server`:

- `npm run dev` - restart-on-change development server
- `npm run start` - start with ts-node
- `npm run build` - compile TypeScript
- `npm run kill-port` - free port 3001 on Windows

From `client`:

- `npm run dev` - Vite dev server
- `npm run build` - TypeScript build + Vite build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## Project Structure

```text
ColourWang/
├── client/                  # React/Vite frontend
├── server/                  # Express/Socket.IO backend
├── config/                  # Shared game and content configuration
├── certs/                   # Local HTTPS certificates
├── docker-compose.yml
└── package.json             # Root orchestration scripts
```

## Configuration

Most gameplay/content settings live in `config`:

- `config/gameDefaults.json` - default game rules and feature toggles
- `config/server.json` - server behavior and timing settings
- `config/questions/` - category question sets
- `config/palette.json`, `config/avatars.json`, `config/rounds.json`, `config/music.json`

For detailed configuration docs, see `config/README.md`.

## Production Deployment

This repository includes a production container setup for the backend server.

### 1. Build and Run the Server Container

```bash
docker compose up -d --build
```

This uses `docker-compose.yml` to build `server/Dockerfile` and expose port `3001`.

### 2. Build the Frontend for Production

```bash
cd client
npm run build
```

This outputs static assets to `client/dist`.

### 3. Serve Frontend Assets

Serve `client/dist` with your preferred static host (for example Nginx, Azure Static Web Apps, Netlify, or Vercel).

Recommended production pattern:

- Host frontend over HTTPS
- Route API and Socket.IO traffic to the backend service on port `3001`
- Use a reverse proxy so browser clients use a single public origin

Example Nginx site config (single origin with SPA + Socket.IO):

```nginx
server {
	listen 80;
	server_name your-domain.example;

	# Frontend static files from client/dist
	root /var/www/colourwang/client/dist;
	index index.html;

	# React/Vite SPA fallback
	location / {
		try_files $uri $uri/ /index.html;
	}

	# Backend REST endpoints
	location /api/ {
		proxy_pass http://127.0.0.1:3001/api/;
		proxy_http_version 1.1;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}

	# Socket.IO upgrade path
	location /socket.io/ {
		proxy_pass http://127.0.0.1:3001/socket.io/;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_read_timeout 60s;
		proxy_send_timeout 60s;
	}
}
```

If your backend routes are not under `/api`, update the API `location` block to match your actual server routes.

### 4. Deployment Config

Deployment-oriented settings are in `config/deployment.json`:

- `deployment.environment`
- `deployment.ssl`
- `deployment.compression`
- `deployment.minify`

If you use tunnels for remote testing, optional ngrok fields are also defined in that file.

## Security

### Local Certificates

Local HTTPS certificates are generated into the `certs` folder for development use.

- Do not share or upload files from `certs`.
- The repository ignore rules already exclude `certs/` from git tracking.
- If certificate files were ever committed by mistake, rotate/regenerate them immediately.

### Secrets and Environment Variables

- Keep secrets out of source code and JSON config files.
- Use environment variables for sensitive values.
- Commit only templates (for example `.env.example`) with empty or placeholder values.

### Pre-Commit Leak Check

Before pushing changes, run a quick scan in the repo root:

```bash
git grep -nE "(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{80,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9]{20,}|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----)"
```

If this returns results in first-party files, remove or rotate the exposed secret before commit.

## Troubleshooting

Server port already in use:

```bash
cd server
npm run kill-port
```

Players cannot join from mobile:

- Confirm all devices are on the same Wi-Fi network.
- Use your machine's LAN IP (for example, `https://192.168.1.50:5173`).
- Accept certificate warnings on mobile browsers when prompted.

Questions are missing:

- Check JSON files in `config/questions` for syntax/format problems.
- Review server console output for load errors.

## License

MIT
