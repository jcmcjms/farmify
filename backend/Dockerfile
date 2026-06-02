# =============================================================================
# Backend Dockerfile — Express API server
# =============================================================================
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and TypeScript configuration
COPY tsconfig.json ./
COPY src/ src/

# Build TypeScript to JavaScript
RUN npm run build

# Create uploads directory for file storage
RUN mkdir -p uploads

# Expose the API port
EXPOSE 5000

# Start the compiled server
CMD ["node", "dist/server.js"]