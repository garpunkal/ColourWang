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

// Parse JSON request bodies
app.use(express.json());

const corsOptions: CorsOptions = {
    ...serverConfig.server.cors
};

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '').toLowerCase();

if (process.env.FRONTEND_ORIGIN) {
    const origins = process.env.FRONTEND_ORIGIN
        .split(',')
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean);

    if (origins.length > 0) {
        const allowedOrigins = new Set(origins);
        corsOptions.origin = (requestOrigin, callback) => {
            if (!requestOrigin) {
                callback(null, true);
                return;
            }

            const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
            if (allowedOrigins.has(normalizedRequestOrigin)) {
                callback(null, true);
                return;
            }

            callback(new Error(`CORS blocked origin: ${requestOrigin}`));
        };
        logger.info(`Using FRONTEND_ORIGIN for CORS: ${origins.join(', ')}`);
    }
}

if (corsOptions.origin === '*' && corsOptions.credentials) {
    logger.warn('CORS origin is "*" with credentials=true; disabling credentials for compatibility');
    corsOptions.credentials = false;
}

app.use(cors(corsOptions));

// Serve static frontend files directly at root
app.use(express.static(join(process.cwd(), 'public')));

app.get('/', (_req, res) => {
    res.sendFile(join(process.cwd(), 'public/index.html'));
});

// System Status API
app.get('/api/status', (_req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
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

if (existsSync(keyPath) && existsSync(certFilePath)) {
    const httpsOptions = {
        key: readFileSync(keyPath),
        cert: readFileSync(certFilePath)
    };
    server = createHttpsServer(httpsOptions, app);
    protocol = 'https';
    logger.info('✓ SSL certificates found, using HTTPS');
} else {
    server = createHttpServer(app);
    protocol = 'http';
    logger.warn('⚠ SSL certificates not found, using HTTP');
}

const io = new Server(server, {
    cors: corsOptions
});

logger.info('Registering socket handlers...');
registerSocketHandlers(io);

// Mount admin REST routes
app.use('/api/admin', createAdminRouter(io));

const PORT = process.env.PORT || serverConfig.server.port;
server.listen(PORT, () => {
    logger.info(`Server running on ${protocol}://localhost:${PORT}`);
    logger.info(`Dashboard running at: ${protocol}://localhost:${PORT}/`);
});