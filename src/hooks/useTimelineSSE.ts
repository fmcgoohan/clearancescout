import { useState, useEffect } from 'react';

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

    // Fetch initial event history
    fetch(`/api/projects/${projectId}/timeline`)
      .then((res) => res.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
      })
      .catch((err) => console.error('Error fetching timeline history:', err));

    // Connect to SSE stream
    const eventSource = new EventSource(`/api/projects/${projectId}/timeline/stream`);

    eventSource.addEventListener('timeline_event', (e: MessageEvent) => {
      try {
        const eventData = JSON.parse(e.data) as TimelineEvent;
        setEvents((prev) => [...prev, eventData]);
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
