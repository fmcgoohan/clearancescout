# Deployment Contract: Google Cloud Run Single Service

**Target**: Google Cloud Run (Fully Managed Serverless Container)  
**Containerfile**: Multi-stage `Dockerfile` at repository root  

---

## 1. Container Build & Packaging

```dockerfile
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/server ./server
COPY --from=frontend-builder /app/fixtures ./fixtures

EXPOSE 8080
CMD ["node", "server/index.js"]
```

---

## 2. Cloud Run Deployment Specification

```bash
gcloud run deploy clearancescout \
  --image gcr.io/${PROJECT_ID}/clearancescout:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars EXECUTION_MODE=DEMO_MODE \
  --set-secrets GEMINI_API_KEY=clearancescout-gemini-key:latest,PARALLEL_WEB_API_KEY=clearancescout-parallel-key:latest
```

---

## 3. Operational Guarantees

- **Container Port**: Listens on `process.env.PORT` (defaults to 8080 / 3000).
- **Static Assets**: Root `/` and SPA routes served directly from `dist/`.
- **API Routes**: Handled under `/api/*` prefix.
- **Health Check**: Cloud Run HTTP readiness check points to `/api/health`.
