# Deployment Guide

Deploying ColourWang to a production environment.

## Architecture

In production the two parts are served separately:

- **Backend** — Node.js/Express/Socket.IO server (Docker recommended), exposed on port `3001`.
- **Frontend** — Static files built by Vite (`client/dist`), served by any static host or reverse proxy.

A reverse proxy (e.g. Nginx) in front of both gives players a single public URL and handles the WebSocket upgrade for Socket.IO.

## 1. Build and Run the Server Container

```bash
docker compose up -d --build
```

This uses `docker-compose.yml` to build `server/Dockerfile` and expose port `3001`.

To view logs:

```bash
docker compose logs -f
```

## 2. Build the Frontend

```bash
cd client
npm run build
```

Output goes to `client/dist`. Serve this directory with your preferred static host — Nginx, Azure Static Web Apps, Netlify, Vercel, or any CDN.

Before building, set environment variables:

```bash
# client/.env (or set in your CI/CD environment)
VITE_SOCKET_SERVER_URL=https://your-backend.example.com
```

## 3. Nginx Reverse Proxy

The recommended setup is a single public domain with Nginx proxying both the static files and Socket.IO:

```nginx
server {
    listen 80;
    server_name your-domain.example;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.example;

    ssl_certificate     /etc/letsencrypt/live/your-domain.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.example/privkey.pem;

    # Frontend static files
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

    # Socket.IO WebSocket upgrade
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

> If your backend routes are not under `/api`, update the `location /api/` block to match.

## 4. CORS / Origins

The server reads the `FRONTEND_ORIGIN` environment variable to set allowed CORS origins:

```bash
FRONTEND_ORIGIN=https://your-domain.example
```

Multiple origins can be comma-separated:

```bash
FRONTEND_ORIGIN=https://your-domain.example,https://www.your-domain.example
```

If the variable is not set, the server falls back to `*` (all origins) which is fine for quick testing but not recommended for production.

## 5. Deployment Config

Deployment-oriented settings live in `config/deployment.json`:

| Key | Purpose |
|-----|---------|
| `deployment.environment` | `"production"` or `"development"` |
| `deployment.ssl` | SSL options for the server process |
| `deployment.compression` | Enable gzip/brotli response compression |
| `deployment.minify` | Enable output minification |

Optional ngrok fields are also defined in that file for tunnel-based remote testing.

## 6. Hosted Platforms (e.g. Render, Railway)

When the backend is on a separate host from the frontend (e.g. Render free tier):

1. Set `VITE_SOCKET_SERVER_URL` in the frontend build environment to the backend's public URL.
2. Set `FRONTEND_ORIGIN` on the backend to the frontend's public URL.
3. The client includes a "wake backend" ping on startup to reduce cold-start latency on free-tier services.

---

## Security

### Local Certificates

Local HTTPS certs are generated into `certs/` for development only.

- `certs/` is already gitignored — never commit its contents.
- If cert files were ever committed by mistake, regenerate them immediately.

### Secrets and Environment Variables

- Never put secrets in `config/*.json` or committed `.env` files.
- Use environment variables for sensitive values (API keys, tokens).
- Commit only placeholder templates like `.env.example`.

### Pre-Commit Leak Scan

Before pushing, run a quick scan in the repo root:

```bash
git grep -nE "(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{80,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9]{20,}|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----)"
```

Any matches in first-party files should be removed or rotated before the commit is pushed.
