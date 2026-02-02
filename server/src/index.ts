
import express from 'express';
import { logger } from './utils/logger';
import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketHandlers } from './socket/handlers';
import serverConfig from '../../config/server.json';
import environmentConfig from '../../config/environment.json';

logger.info('Starting ColourWang server...');

const app = express();
app.use(cors(serverConfig.server.cors));

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
    cors: serverConfig.server.cors
});

logger.info('Registering socket handlers...');
registerSocketHandlers(io);

const PORT = process.env.PORT || serverConfig.server.port;
server.listen(PORT, () => {
    logger.info(`Server running on ${protocol}://localhost:${PORT}`);
});
