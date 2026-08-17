import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { projectRouter } from './api/projectRoutes.js';
import { clearanceRouter } from './api/clearanceRoutes.js';
import { replacementRouter } from './api/replacementRoutes.js';
import { timelineRouter } from './api/timelineRoutes.js';
import { binderRouter } from './api/binderRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json());

// API Route mounts
app.use('/api/projects', projectRouter);
app.use('/api', clearanceRouter);
app.use('/api', replacementRouter);
app.use('/api', timelineRouter);
app.use('/api', binderRouter);

// Global Observable Action Timeline Stream alias
app.use('/api/events', timelineRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'ClearanceScout API',
    executionMode: config.executionMode,
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend build in production / Cloud Run
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ClearanceScout API Error]:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
    },
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[ClearanceScout Server] Listening on http://localhost:${config.port} (${config.executionMode})`);
  });
}

export default app;
