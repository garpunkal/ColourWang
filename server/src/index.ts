
console.log('Starting ColourWang server...');

import express from 'express';
import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketHandlers } from './socket/handlers';

const app = express();
app.use(cors());

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
        console.error('Error listing BGM files:', e);
        res.status(500).json([]);
    }
});

// Check if SSL certificates exist
const certPath = join(__dirname, '../../certs');
const keyPath = join(certPath, 'localhost-key.pem');
const certFilePath = join(certPath, 'localhost.pem');

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
    console.log('✓ SSL certificates found, using HTTPS');
} else {
    // Fallback to HTTP if certificates don't exist yet
    server = createHttpServer(app);
    console.log('⚠ SSL certificates not found, using HTTP');
    console.log('  Run the client first to generate certificates, then restart the server');
}

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (needed for ngrok tunnels)
        methods: ["GET", "POST"],
        credentials: true
    }
});

console.log('Registering socket handlers...');
registerSocketHandlers(io);

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running on ${protocol}://localhost:${PORT}`);
});
