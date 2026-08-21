import React, { useEffect } from 'react';
import { TimelineEvent } from '../hooks/useTimelineSSE';

interface TimelineDrawerProps {
  events: TimelineEvent[];
  isOpen: boolean;
  onClose: () => void;
  targetEntityName?: string | null;
  targetEntityId?: string | null;
  onClearTargetEntity?: () => void;
}

export const TimelineDrawer: React.FC<TimelineDrawerProps> = ({
  events,
  isOpen,
  onClose,
  targetEntityName,
  targetEntityId,
  onClearTargetEntity,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeFocus = targetEntityName || targetEntityId || null;

  const filteredEvents = activeFocus
    ? events.filter((evt) => {
        const query = activeFocus.toLowerCase();
        const labelMatch = evt.label.toLowerCase().includes(query);
        const payloadMatch = JSON.stringify(evt.payload || {}).toLowerCase().includes(query);
        return labelMatch || payloadMatch;
      })
    : events;

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
      case 'REPLACEMENT_ATTEMPT':
        return { label: 'CANDIDATE', color: 'var(--accent-blue)' };
      case 'REPLACEMENT_RESEARCH_STARTED':
        return { label: 'SEARCH', color: 'var(--accent-cyan)' };
      case 'REPLACEMENT_REJECTED':
        return { label: 'REJECTED', color: '#f87171' };
      case 'REPLACEMENT_ACCEPTED':
        return { label: 'ACCEPTED', color: '#34d399' };
      case 'ITEM_ADDED':
        return { label: 'ITEM ADDED', color: '#c084fc' };
      case 'ITEM_EDITED':
        return { label: 'ITEM EDITED', color: '#38bdf8' };
      case 'ITEM_REMOVED':
        return { label: 'ITEM REMOVED', color: '#f87171' };
      case 'RESEARCH_RETRY_STARTED':
        return { label: 'RETRY SEARCH', color: '#38bdf8' };
      case 'OVERRIDE_RECORDED':
        return { label: 'COUNSEL', color: '#34d399' };
      case 'BINDER_EXPORT':
        return { label: 'BINDER', color: 'var(--accent-blue)' };
      default:
        return { label: 'EVENT', color: 'var(--text-muted)' };
    }
  };

  return (
    <div
      role="region"
      aria-label="Observable Action Timeline"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '480px',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 1350,
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

      {activeFocus && (
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '0.78rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: 'var(--accent-cyan)' }}>
            🎯 Focused on: <strong>{activeFocus}</strong> ({filteredEvents.length} events)
          </span>
          {onClearTargetEntity && (
            <button
              onClick={onClearTargetEntity}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline',
              }}
            >
              Show All
            </button>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '40px', fontSize: '0.85rem' }}>
            {activeFocus
              ? `No timeline events found matching "${activeFocus}".`
              : 'No timeline events recorded yet. Perform an action to see real-time workflow events.'}
          </div>
        ) : (
          filteredEvents.map((evt) => {
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
