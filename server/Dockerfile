# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app

# Install server dependencies first for better layer caching.
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
RUN npm ci --prefix server

# Copy only what is needed to compile the server.
COPY server ./server
COPY config ./config

RUN npm run build --prefix server

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Install production dependencies for the server.
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
RUN npm ci --omit=dev --prefix server

# Runtime artifacts and shared config/assets used by the server.
COPY --from=builder /app/server/dist ./server/dist
COPY config ./config
COPY certs ./certs
COPY client/public/bgm ./client/public/bgm

WORKDIR /app/server
EXPOSE 3001
CMD ["node", "dist/index.js"]
