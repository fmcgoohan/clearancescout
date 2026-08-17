import { Router, Request, Response } from 'express';
import { timelineEmitter } from '../events/timelineEmitter.js';

export const timelineRouter = Router();

// Stream SSE Timeline Events
timelineRouter.get('/projects/:id/timeline/stream', (req: Request, res: Response) => {
  const projectId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  timelineEmitter.addClient(projectId, res);

  req.on('close', () => {
    timelineEmitter.removeClient(projectId, res);
  });
});

// Get Event History
timelineRouter.get('/projects/:id/timeline', (req: Request, res: Response) => {
  const projectId = req.params.id;
  const events = timelineEmitter.getEvents(projectId);
  res.json({ events });
});
