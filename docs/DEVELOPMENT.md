# Development Guide

Local setup, running the project, testing, and troubleshooting.

## Prerequisites

- Node.js 18+
- npm 9+
- For multiplayer testing across devices: all devices on the same Wi-Fi network

## Install

```bash
git clone https://github.com/garpunkal/ColourWang.git
cd ColourWang
npm run install:all
```

`install:all` installs dependencies for the root, `server`, and `client` packages in one step.

## Run

```bash
npm run dev          # server + client together (recommended)
npm run dev:server   # server only
npm run dev:client   # client only
```

| Service | URL |
|---------|-----|
| Host screen (client) | `https://localhost:5173` |
| Server API / Socket.IO | `https://localhost:3001` |

## HTTPS Local Dev

The client uses self-signed local certificates for HTTPS. This is required for certain browser APIs and gives a closer match to production behaviour on mobile devices.

- **First run:** start the client (`npm run dev:client` or `npm run dev`) at least once before the server. This generates cert files into `certs/` via `vite-plugin-mkcert`.
- **After that:** `npm run dev` starts both together and the server finds the certs automatically.
- **Certificate warnings:** on first use, browsers and mobile devices will show a "not trusted" warning for the self-signed cert. Accept it manually to continue.
- **Mobile access:** use your machine's LAN IP instead of `localhost`, e.g. `https://192.168.1.50:5173`. Find it with `ipconfig` (Windows) or `ip addr` (Linux/macOS).

> `certs/` is gitignored. Never commit certificate files.

## Scripts

### Root (run from project root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Run server and client together |
| `npm run dev:server` | Run server only |
| `npm run dev:client` | Run client only |
| `npm run install:all` | Install all dependencies |
| `npm test` | Run Playwright E2E tests (headless) |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run test:debug` | Run Playwright with Inspector |

### Server (`cd server`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Nodemon watch + ts-node (restart on change) |
| `npm run start` | Start with ts-node (no watch) |
| `npm run build` | Compile TypeScript via `tsc` |
| `npm run kill-port` | Free port 3001 on Windows |

### Client (`cd client`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Testing

End-to-end tests use [Playwright](https://playwright.dev), configured at the project root in `playwright.config.ts`.

```bash
npm test             # headless, all tests
npm run test:ui      # Playwright UI mode (visual)
npm run test:debug   # Playwright Inspector (step-through)
```

The `webServer` config in `playwright.config.ts` automatically starts both the backend and the Vite client before running tests — you do not need to start them manually.

- **CI:** both servers run over HTTP (no certs needed).
- **Local:** HTTPS is used if `certs/` already exists, otherwise falls back to HTTP.
- **Reports:** written to `client/playwright-report/` after each run.

## Build & Lint

```bash
# Server: type-check / compile
cd server && npm run build

# Client: type-check + Vite build
cd client && npm run build

# Client: lint a specific file
cd client && npx eslint src/path/to/File.tsx

# Server: type-check a specific file
cd server && npx tsc --noEmit
```

## Environment Variables

Client env vars go in `client/.env.local` (gitignored). See `client/.env.example` for available keys.

| Variable | Purpose |
|----------|---------|
| `VITE_SOCKET_SERVER_URL` | Override the Socket.IO server URL (use in hosted environments, e.g. Render) |
| `VITE_SERVER_URL` | Legacy fallback for `VITE_SOCKET_SERVER_URL` |

In local development neither variable is needed — the socket connects to the Vite dev server proxy by default.

## Troubleshooting

**Port 3001 already in use**

```bash
cd server
npm run kill-port   # Windows only
```

Or find and kill the process manually:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Players cannot join from mobile**

- Confirm all devices are on the same Wi-Fi network.
- Use your machine's LAN IP, e.g. `https://192.168.1.50:5173`.
- Accept the self-signed certificate warning in the mobile browser.

**Questions are missing**

- Check JSON files in `config/questions/` for syntax errors.
- Review server console output (`config/server.json` → `logging.enabled: true`) for load errors.

**Socket not connecting in hosted environments**

Set `VITE_SOCKET_SERVER_URL` in `client/.env` to your backend's public URL and ensure CORS is configured via the `FRONTEND_ORIGIN` environment variable on the server (comma-separated list of allowed origins).
