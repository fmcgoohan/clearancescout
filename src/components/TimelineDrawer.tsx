import React from 'react';
import { TimelineEvent } from '../hooks/useTimelineSSE';

interface TimelineDrawerProps {
  events: TimelineEvent[];
  isOpen: boolean;
  onClose: () => void;
}

export const TimelineDrawer: React.FC<TimelineDrawerProps> = ({ events, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'TOOL_CALL':
        return { label: 'TOOL', color: 'var(--accent-cyan)' };
      case 'DOCUMENT_QUERY':
        return { label: 'SCRIPT', color: 'var(--accent-blue)' };
      case 'RISK_EVAL':
        return { label: 'RISK VERDICT', color: 'var(--status-review)' };
      case 'CITATION_ADDED':
        return { label: 'GROUNDING', color: 'var(--status-no-issue)' };
      case 'REPLACEMENT_GEN':
        return { label: 'ARTWORK', color: 'var(--status-insufficient)' };
      default:
        return { label: 'EVENT', color: 'var(--text-muted)' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '480px',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 1000,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
            Observable Action Timeline
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Real-time SSE Event Log (CoT Hidden)
          </span>
        </div>
        <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={onClose}>
          ✕ Close
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '40px', fontSize: '0.85rem' }}>
            No timeline events recorded yet. Perform an action to see real-time workflow events.
          </div>
        ) : (
          events.map((evt) => {
            const badge = getEventBadge(evt.eventType);
            return (
              <div
                key={evt.id}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: badge.color,
                      padding: '2px 6px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '4px',
                    }}
                  >
                    {badge.label}
                  </span>
                  <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {evt.label}
                </div>

                <pre
                  className="mono"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '4px',
                    overflowX: 'auto',
                    marginTop: '4px',
                  }}
                >
                  {JSON.stringify(evt.payload, null, 2)}
                </pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
