import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert'
import { resolve } from 'path'
import { existsSync } from 'fs'

const isCI = !!process.env.CI;
const skipMkcert = isCI || !!process.env.SKIP_MKCERT;

// Use HTTPS proxy target only when certs already exist.
// On first run they won't exist yet — the server falls back to HTTP in that case too.
const certsExist =
  !skipMkcert &&
  existsSync(resolve(__dirname, '../certs/localhost-key.pem')) &&
  existsSync(resolve(__dirname, '../certs/localhost.pem'));

const serverProxyTarget = certsExist ? 'https://localhost:3001' : 'http://localhost:3001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // mkcert generates local HTTPS certs for dev; skip during tests and CI.
    ...(!skipMkcert ? [mkcert({
      savePath: resolve(__dirname, '../certs'),
      keyFileName: 'localhost-key.pem',
      certFileName: 'localhost.pem'
    })] : []),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/socket.io': {
        target: serverProxyTarget,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: serverProxyTarget,
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
