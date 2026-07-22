import express from 'express';
import { logger } from './utils/logger';
import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import { registerSocketHandlers } from './socket/handlers';
import { createAdminRouter } from './routes/admin';
import { logBus, getLogHistory } from './utils/logger';
import { games } from './game/gamesMap';

const serverConfig: typeof import('../../config/server.json') = require('../../config/server.json');
const environmentConfig: typeof import('../../config/environment.json') = require('../../config/environment.json');

logger.info('Starting ColourWang server...');

const app = express();

// Render (and most PaaS reverse proxies) terminate TLS and forward requests
// internally over plain HTTP. Without this, req.protocol always reports
// 'http' even for real https:// requests, which breaks any same-origin
// comparison built from req.protocol/req.get('host') (see CORS setup below).
app.set('trust proxy', true);

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const baseCorsOptions: CorsOptions = {
    ...serverConfig.server.cors
};

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '').toLowerCase();

let allowedOrigins: Set<string> | null = null;
if (process.env.FRONTEND_ORIGIN) {
    const origins = process.env.FRONTEND_ORIGIN
        .split(',')
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean);

    if (origins.length > 0) {
        allowedOrigins = new Set(origins);
        logger.info(`Using FRONTEND_ORIGIN for CORS: ${origins.join(', ')}`);
    }
}

if (baseCorsOptions.origin === '*' && baseCorsOptions.credentials) {
    logger.warn('CORS origin is "*" with credentials=true; disabling credentials for compatibility');
    baseCorsOptions.credentials = false;
}

// Socket.IO handles its own CORS separately from Express middleware, so it
// needs its own options object. The dashboard doesn't use Socket.IO (only
// the game clients do), so the "always allow self origin" behavior above
// isn't relevant here — this preserves the original FRONTEND_ORIGIN
// allowlist behavior.
const socketCorsOptions: CorsOptions = {
    ...baseCorsOptions,
    origin: allowedOrigins
        ? (requestOrigin, callback) => {
            if (!requestOrigin || allowedOrigins!.has(normalizeOrigin(requestOrigin))) {
                callback(null, true);
                return;
            }
            callback(new Error(`CORS blocked origin: ${requestOrigin}`));
        }
        : baseCorsOptions.origin
};

// Use a per-request delegate (rather than a static origin function) so we can
// always allow the request's own host — e.g. the admin dashboard served by
// this same Express app — regardless of what FRONTEND_ORIGIN is set to.
// Browsers attach an Origin header to POST/DELETE/etc. requests even when
// same-origin, so without this a same-origin dashboard request could get
// rejected purely because its origin wasn't in the FRONTEND_ORIGIN allowlist
// (curl requests without an Origin header were never affected by this).
app.use(cors((req, callback) => {
    if (!allowedOrigins) {
        callback(null, baseCorsOptions);
        return;
    }

    const requestOrigin = req.headers.origin as string | undefined;
    const selfOrigin = normalizeOrigin(`${req.protocol}://${req.get('host') || ''}`);

    if (!requestOrigin || allowedOrigins.has(normalizeOrigin(requestOrigin)) || normalizeOrigin(requestOrigin) === selfOrigin) {
        callback(null, { ...baseCorsOptions, origin: true });
        return;
    }

    // Don't throw — just omit CORS headers so genuinely cross-origin browser
    // requests get blocked client-side, instead of erroring the request for
    // everyone (including legitimate same-origin callers hitting edge cases
    // in host/protocol detection behind a proxy).
    logger.warn(`CORS: origin not in allowlist and not self: ${requestOrigin}`);
    callback(null, { ...baseCorsOptions, origin: false });
}));

// Serve static frontend files directly at root
app.use(express.static(join(process.cwd(), 'public')));

app.get('/', (_req, res) => {
    res.sendFile(join(process.cwd(), 'public/index.html'));
});

// System Status API
// Real process CPU usage, tracked as a delta between polls rather than a
// point-in-time snapshot (process.cpuUsage() alone is cumulative since
// process start, not a percentage). process.cpuUsage(previous) returns the
// diff since the previous snapshot, which we divide by real elapsed time.
let lastCpuUsage = process.cpuUsage();
let lastCpuSampleAt = process.hrtime.bigint();

function sampleCpuPercent(): number {
    const usageDelta = process.cpuUsage(lastCpuUsage);
    const now = process.hrtime.bigint();
    const elapsedMicros = Number(now - lastCpuSampleAt) / 1000;

    lastCpuUsage = process.cpuUsage();
    lastCpuSampleAt = now;

    if (elapsedMicros <= 0) return 0;

    const busyMicros = usageDelta.user + usageDelta.system;
    return Math.min(100, Math.max(0, Math.round((busyMicros / elapsedMicros) * 100)));
}

app.get('/api/status', (_req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        cpu: sampleCpuPercent(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB'
        },
        games: {
            total: games.size,
            byStatus: Object.fromEntries(
                ['LOBBY', 'COUNTDOWN', 'ROUND_INTRO', 'QUESTION', 'RESULT', 'FINAL_SCORE'].map(s => [
                    s, [...games.values()].filter(g => g.status === s).length
                ])
            )
        },
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Real-Time SSE Log Streaming (Proxy Buffering Disabled for Render)
app.get('/api/logs/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (res.flushHeaders) {
        res.flushHeaders();
    }

    getLogHistory().forEach(entry => {
        res.write(`data: ${JSON.stringify(entry)}\n\n`);
    });

    const onEntry = (entry: any) => res.write(`data: ${JSON.stringify(entry)}\n\n`);
    logBus.on('entry', onEntry);

    req.on('close', () => logBus.off('entry', onEntry));
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB'
        },
        version: process.env.npm_package_version || '1.0.0'
    });
});

app.get('/api/bgm-list', (req, res) => {
    try {
        const bgmPath = join(__dirname, '../../client/public/bgm');
        if (existsSync(bgmPath)) {
            const files = readdirSync(bgmPath).filter(f => f.endsWith('.mp3'));
            res.json(files);
        } else {
            res.json([]);
        }
    } catch (e) {
        logger.error('Error listing BGM files:', e);
        res.status(500).json([]);
    }
});

const certPath = join(__dirname, serverConfig.server.ssl.certPath);
const keyPath = join(certPath, serverConfig.server.ssl.keyFileName);
const certFilePath = join(certPath, serverConfig.server.ssl.certFileName);

let server;
let protocol = 'http';

// Proxy / Environment aware server initialization
if (process.env.RENDER || process.env.NODE_ENV === 'production') {
    server = createHttpServer(app);
    protocol = 'https';
    logger.info('✓ Running behind reverse proxy with TLS termination');
} else if (existsSync(keyPath) && existsSync(certFilePath)) {
    const httpsOptions = {
        key: readFileSync(keyPath),
        cert: readFileSync(certFilePath)
    };
    server = createHttpsServer(httpsOptions, app);
    protocol = 'https';
    logger.info('✓ Local SSL certificates found, using HTTPS');
} else {
    server = createHttpServer(app);
    protocol = 'http';
    logger.info('Running on HTTP for local development');
}

const io = new Server(server, {
    cors: socketCorsOptions
});

logger.info('Registering socket handlers...');
registerSocketHandlers(io);

// Mount admin REST routes
app.use('/api/admin', createAdminRouter(io));

const PORT = process.env.PORT || serverConfig.server.port;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Dashboard running at: ${protocol}://localhost:${PORT}/`);
});