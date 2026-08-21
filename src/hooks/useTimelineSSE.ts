import { useState, useEffect } from 'react';
import { apiFetch, getDemoToken } from '../utils/apiClient.js';

export interface TimelineEvent {
  id: string;
  projectId: string;
  eventType: string;
  label: string;
  payload: Record<string, any>;
  timestamp: string;
}

export function useTimelineSSE(projectId: string | null) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!projectId) return;

    // Fetch initial event history with authenticated client fetch
    apiFetch(`/api/projects/${projectId}/timeline`)
      .then((res) => {
        if (res.ok) return res.json();
        return { events: [] };
      })
      .then((data) => {
        if (data.events && Array.isArray(data.events)) {
          setEvents((prev) => {
            const map = new Map<string, TimelineEvent>();
            prev.forEach((e) => map.set(e.id, e));
            data.events.forEach((e: TimelineEvent) => map.set(e.id, e));
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
        }
      })
      .catch((err) => console.error('Error fetching timeline history:', err));

    // Connect to SSE stream with query parameter auth token
    const token = getDemoToken();
    const streamUrl = token
      ? `/api/projects/${projectId}/timeline/stream?token=${encodeURIComponent(token)}`
      : `/api/projects/${projectId}/timeline/stream`;

    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('timeline_event', (e: MessageEvent) => {
      try {
        const eventData = JSON.parse(e.data) as TimelineEvent;
        setEvents((prev) => {
          if (prev.some((item) => item.id === eventData.id)) {
            return prev;
          }
          return [...prev, eventData];
        });
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [projectId]);

  return { events };
}
