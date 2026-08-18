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
import { healthRouter } from './api/healthRoutes.js';
import { fixtureRouter } from './api/fixtureRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json());

// API Route mounts
app.use('/api', healthRouter);
app.use('/api', fixtureRouter);
app.use('/api/projects', projectRouter);
app.use('/api', clearanceRouter);
app.use('/api', replacementRouter);
app.use('/api', timelineRouter);
app.use('/api', binderRouter);

// Global Observable Action Timeline Stream alias
app.use('/api/events', timelineRouter);

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
  const server = app.listen(config.port, () => {
    console.log(`[ClearanceScout Server] Listening on http://localhost:${config.port} (${config.executionMode})`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[ClearanceScout Server Error] Port ${config.port} is already in use by another process.`);
      console.error(`Tip: Set PORT=<custom_port> (e.g. PORT=8089 npm run start:demo) or terminate the conflicting process.`);
    } else {
      console.error('[ClearanceScout Server Error]:', err);
    }
    process.exit(1);
  });
}

export default app;
