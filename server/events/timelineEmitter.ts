import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export type TimelineEventType =
  | 'TOOL_CALL'
  | 'DOCUMENT_QUERY'
  | 'DETERMINISTIC_CALC'
  | 'RISK_EVAL'
  | 'CITATION_ADDED'
  | 'STATE_TRANSITION'
  | 'REPLACEMENT_GEN'
  | 'REPLACEMENT_ATTEMPT'
  | 'REPLACEMENT_RESEARCH_STARTED'
  | 'REPLACEMENT_REJECTED'
  | 'REPLACEMENT_ACCEPTED'
  | 'BINDER_EXPORT'
  | 'OVERRIDE_RECORDED';

export interface ExecutionEvent {
  id: string;
  projectId: string;
  eventType: TimelineEventType;
  label: string;
  payload: Record<string, any>;
  timestamp: string;
}

class TimelineBroadcaster {
  private clients: Map<string, Set<Response>> = new Map();
  private eventHistory: Map<string, ExecutionEvent[]> = new Map();

  addClient(projectId: string, res: Response) {
    if (!this.clients.has(projectId)) {
      this.clients.set(projectId, new Set());
    }
    this.clients.get(projectId)!.add(res);

    // Send history to newly connected client
    const history = this.eventHistory.get(projectId) || [];
    for (const evt of history) {
      res.write(`event: timeline_event\ndata: ${JSON.stringify(evt)}\n\n`);
    }
  }

  removeClient(projectId: string, res: Response) {
    const projectClients = this.clients.get(projectId);
    if (projectClients) {
      projectClients.delete(res);
    }
  }

  private sanitizePayload(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.sanitizePayload(item));

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Chain-of-thought privacy invariant: strip internal reasoning fields
      if (['thought', 'thinking', 'chainOfThought', 'reasoningSteps', 'internalThought'].includes(key)) {
        continue;
      }
      sanitized[key] = this.sanitizePayload(value);
    }
    return sanitized;
  }

  emit(projectId: string, eventType: TimelineEventType, label: string, payload: Record<string, any>): ExecutionEvent {
    const sanitizedPayload = this.sanitizePayload(payload);
    const event: ExecutionEvent = {
      id: `evt-${uuidv4().slice(0, 8)}`,
      projectId,
      eventType,
      label,
      payload: sanitizedPayload,
      timestamp: new Date().toISOString(),
    };

    if (!this.eventHistory.has(projectId)) {
      this.eventHistory.set(projectId, []);
    }
    this.eventHistory.get(projectId)!.push(event);

    const projectClients = this.clients.get(projectId);
    if (projectClients) {
      const dataString = `event: timeline_event\ndata: ${JSON.stringify(event)}\n\n`;
      for (const client of projectClients) {
        client.write(dataString);
      }
    }

    return event;
  }

  getEvents(projectId: string): ExecutionEvent[] {
    return this.eventHistory.get(projectId) || [];
  }
}

export const timelineEmitter = new TimelineBroadcaster();
