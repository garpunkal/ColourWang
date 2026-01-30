import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mkcert({
      savePath: resolve(__dirname, '../certs'),
      keyFileName: 'localhost-key.pem',
      certFileName: 'localhost.pem'
    })
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy Socket.IO requests to the backend server
      '/socket.io': {
        target: 'https://localhost:3001',
        ws: true, // Enable WebSocket proxying
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      },
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
