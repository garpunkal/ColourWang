
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
import serverConfig from '../../config/server.json';
import environmentConfig from '../../config/environment.json';

logger.info('Starting ColourWang server...');

const app = express();

const corsOptions: CorsOptions = {
    ...serverConfig.server.cors
};

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '').toLowerCase();

// Allow overriding CORS origin via env for hosted deployments (e.g. Render frontend URL).
if (process.env.FRONTEND_ORIGIN) {
    const origins = process.env.FRONTEND_ORIGIN
        .split(',')
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean);

    if (origins.length > 0) {
        const allowedOrigins = new Set(origins);
        corsOptions.origin = (requestOrigin, callback) => {
            // Allow requests with no origin (server-to-server, health checks, curl).
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

// Health check endpoint
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

// List all mp3 files in client/public/bgm for the frontend to consume
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

// Check if SSL certificates exist
const certPath = join(__dirname, serverConfig.server.ssl.certPath);
const keyPath = join(certPath, serverConfig.server.ssl.keyFileName);
const certFilePath = join(certPath, serverConfig.server.ssl.certFileName);

let server;
let protocol = 'http';

if (existsSync(keyPath) && existsSync(certFilePath)) {
    // Use HTTPS if certificates exist
    const httpsOptions = {
        key: readFileSync(keyPath),
        cert: readFileSync(certFilePath)
    };
    server = createHttpsServer(httpsOptions, app);
    protocol = 'https';
    logger.info('✓ SSL certificates found, using HTTPS');
} else {
    // Fallback to HTTP if certificates don't exist yet
    server = createHttpServer(app);
    logger.warn('⚠ SSL certificates not found, using HTTP');
    logger.warn('  Run the client first to generate certificates, then restart the server');
}

const io = new Server(server, {
    cors: corsOptions
});

logger.info('Registering socket handlers...');
registerSocketHandlers(io);

const PORT = process.env.PORT || serverConfig.server.port;
server.listen(PORT, () => {
    logger.info(`Server running on ${protocol}://localhost:${PORT}`);
});
