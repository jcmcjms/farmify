# =============================================================================
# Stage 1: Build — Compile the React/Vite frontend
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and configuration files
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY public/ public/
COPY src/ src/

# Build the production bundle
RUN npm run build

# =============================================================================
# Stage 2: Serve — Nginx serves the built SPA
# =============================================================================
FROM nginx:alpine

# Copy the custom nginx config (which proxies /api/ and /uploads/ to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built frontend assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]