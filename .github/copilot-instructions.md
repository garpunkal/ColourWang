# ColourWang — Copilot Instructions

Real-time multiplayer party quiz game: a host screen (big screen) + mobile player
controllers, synchronized over Socket.IO. Frontend: React 19 + Vite + TypeScript.
Backend: Node.js + Express + Socket.IO (TypeScript).

## Setup & Run

```bash
npm run install:all   # installs root, server, and client deps
npm run dev            # runs server + client together (concurrently)
npm run dev:server     # server only
npm run dev:client     # client only
```

- Client (host screen): `https://localhost:5173` — Server API/Socket: `http://localhost:3001`.
- The client dev server generates local HTTPS certs into `certs/` on first run (via
  `vite-plugin-mkcert`). **Start the client at least once before the server** so the
  server can find `certs/` and use HTTPS; otherwise it falls back to HTTP.
- Server port 3001 already in use? `cd server && npm run kill-port` (Windows-only
  PowerShell script that frees the port).

## Build / Lint / Test

- No test suite exists in this repo (`server` `npm test` is a placeholder that exits 1).
  Don't add a test runner unless asked.
- Server build: `cd server && npm run build` (`tsc`, per `server/tsconfig.json`).
- Client build: `cd client && npm run build` (`tsc -b && vite build`).
- Client lint: `cd client && npm run lint` (ESLint flat config, `client/eslint.config.js`;
  `typescript-eslint` + `react-hooks` + `react-refresh` recommended rules). There is no
  lint script for `server`.
- To type-check/lint a single file, run the underlying tool directly, e.g.
  `cd client && npx eslint src/path/to/File.tsx` or `cd server && npx tsc --noEmit`.

## Architecture

- **`config/`** is the single source of truth for game/content/server settings, shared by
  both apps via relative imports (e.g. `import serverConfig from '../../config/server.json'`
  in server code, similar relative paths from client). Never duplicate these values in
  `client/src` or `server/src` — edit the JSON in `config/` instead. See `config/README.md`
  for the full list of files (`gameDefaults.json`, `server.json`, `palette.json`,
  `avatars.json`, `rounds.json`, `music.json`, `questions/`, `environment.json`,
  `deployment.json`). Server logging is controlled by `config/server.json`
  (`logging.enabled`, per-level toggles) and is **disabled by default**.
- **Server** (`server/src/index.ts`): boots Express, conditionally creates an HTTPS or
  HTTP server depending on whether cert files exist under the path from
  `serverConfig.server.ssl`, attaches Socket.IO, and calls `registerSocketHandlers(io)`.
  CORS origin can be overridden at runtime via the `FRONTEND_ORIGIN` env var (comma-
  separated list) for hosted deployments.
  - `server/src/socket/handlers.ts` — the entire real-time protocol lives here: all
    `socket.on(...)` event handlers (`create-game`, `join-game`, `rejoin-game`,
    `remove-question`, answer submission, joker/steal/block events, etc.) and their
    corresponding emits back to host/player sockets. This is the first place to look
    when tracing any gameplay event end-to-end.
  - `server/src/game/gamesMap.ts` — in-memory `Map` of active games keyed by room code;
    all game state lives in server memory (no database/persistence layer).
  - `server/src/models/` — `GameState` and `Player` shape definitions.
  - `server/src/scripts/` — one-off/maintenance scripts for migrating or bulk-adding
    question data in `config/questions/` (not part of the runtime server).
- **Client** (`client/src`): a single Vite app that renders different screens for the
  **host** vs a **player**, based on route/state, not separate apps.
  - `components/host/*` and `components/player/*` — screen-specific components
    (`HostLobbyScreen`, `HostQuestionScreen`, `PlayerQuestionScreen`, etc.), mirroring the
    server's game `status` state machine (`LOBBY` → `ROUND_INTRO`/`COUNTDOWN` →
    `QUESTION` → `RESULT` → ... → `FINAL_SCORE`).
  - `components/shared/*` — components used by both host and player views.
  - `hooks/useSocketGameState.ts` — owns all inbound socket listeners
    (`game-created`, `joined-game`, `game-status-changed`, `player-joined`,
    `game-ended`, `error`, reconnection) and merges them into local `GameState`; this is
    the client-side counterpart to `server/src/socket/handlers.ts` and the best place to
    trace how a server emit reaches the UI.
  - `hooks/useSocketConnection.ts` — socket.io-client connection setup.
  - Client persists rejoin info in `localStorage` (`cw_hostCode`, `cw_playerId`,
    `cw_gameCode`, `cw_playerName`) to auto-rejoin an in-progress game on reconnect —
    keep these keys in sync if you change the rejoin flow.
  - `contexts/SettingsContext.tsx` — app-wide settings (sound/reduced motion/etc.).
- Both `client` and `server` declare `colour-wang` (the repo root `package.json`) as a
  `file:..` dependency — this is how root-level shared code/config gets resolved as a
  package from within each subproject.

## Conventions

- Game/content values (colours, avatars, rounds, timings, feature toggles) belong in
  `config/*.json`, not hardcoded in TypeScript.
- Room codes are matched case-insensitively — handlers normalize with
  `code.toUpperCase()` before looking up `games.get(...)`.
- Socket event names are kebab-case strings (`create-game`, `player-joined`,
  `game-status-changed`, `question-removed`, ...) — keep new events consistent with this
  naming and add both the emitting (server) and listening (client) sides together.
- Use the shared `logger` (`server/src/utils/logger`) instead of `console.log` on the
  server so logging respects the `config/server.json` `logging` toggles.

## Security

- Never commit `certs/` (already gitignored) — regenerate/rotate if ever leaked.
- Keep secrets out of `config/*.json`; use environment variables (see
  `client/.env.example` for `VITE_SERVER_URL`) and commit only placeholder `.env.example`
  files.
