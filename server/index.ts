import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { projectRouter } from './api/projectRoutes.js';
import { clearanceRouter } from './api/clearanceRoutes.js';
import { replacementRouter } from './api/replacementRoutes.js';
import { timelineRouter } from './api/timelineRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// API Route mounts
app.use('/api/projects', projectRouter);
app.use('/api', clearanceRouter);
app.use('/api', replacementRouter);
app.use('/api', timelineRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'ClearanceScout API',
    executionMode: config.executionMode,
    timestamp: new Date().toISOString(),
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
