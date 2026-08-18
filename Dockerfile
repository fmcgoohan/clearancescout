# Multi-Stage Build for ClearanceScout Cloud Run Deployment
# Stage 1: Build Frontend and Transpile TypeScript Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json tsconfig.json vite.config.ts ./
RUN npm ci

# Copy source files
COPY server/ ./server/
COPY src/ ./src/
COPY fixtures/ ./fixtures/
COPY index.html ./

# Build frontend and compile TypeScript
RUN npm run build

# Stage 2: Production Minimal Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV EXECUTION_MODE=CLOUD_MODE

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets, fixtures, and transpiled server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/fixtures ./fixtures
COPY --from=builder /app/node_modules ./node_modules

# Expose standard Cloud Run port
EXPOSE 8080

# Start server using tsx in production mode
CMD ["npx", "tsx", "server/index.ts"]
