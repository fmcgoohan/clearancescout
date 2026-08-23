import React, { useState, useRef, useEffect } from 'react';
import { SettingsIcon, LockIcon, ZapIcon, XIcon } from './icons/Icons';

interface SettingsPopoverProps {
  hasTokenConfigured: boolean;
  onOpenTokenModal: () => void;
  executionMode: 'DEMO_MODE' | 'TEST_MODE' | 'CLOUD_MODE';
  setExecutionMode: (mode: 'DEMO_MODE' | 'TEST_MODE' | 'CLOUD_MODE') => void;
  liveQuota: { remaining: number; limit: number };
  eventsCount: number;
  onOpenTimeline: () => void;
}

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({
  hasTokenConfigured,
  onOpenTokenModal,
  executionMode,
  setExecutionMode,
  liveQuota,
  eventsCount,
  onOpenTimeline,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        id="settings-menu-button"
        className="btn-secondary touch-target"
        aria-label="Settings and Administrative Options"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderColor: isOpen ? 'var(--accent-cyan)' : 'var(--border-color)',
        }}
      >
        <SettingsIcon size={16} />
        <span>Settings</span>
        {hasTokenConfigured && <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>●</span>}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Administrative Settings Menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '280px',
            background: 'var(--bg-panel, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            padding: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Settings & Options
            </span>
            <button
              className="touch-target"
              aria-label="Close Settings Menu"
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* Demo Token Option */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auth & Tokens</span>
            <button
              id="demo-token-button"
              className="btn-secondary touch-target"
              aria-label="Configure Demo Access Token"
              onClick={() => {
                setIsOpen(false);
                onOpenTokenModal();
              }}
              style={{
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                borderColor: hasTokenConfigured ? 'var(--accent-cyan)' : 'var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LockIcon size={14} />
                <span>Demo Access Token</span>
              </div>
              {hasTokenConfigured && <span style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>Configured</span>}
            </button>
          </div>

          {/* Execution Mode Option */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="mode-select" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Execution Mode
            </label>
            <select
              id="mode-select"
              aria-label="Server execution mode from health endpoint"
              title="Execution mode reported by GET /api/health"
              value={executionMode}
              onChange={(e) => setExecutionMode(e.target.value as any)}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--accent-cyan)',
                padding: '6px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                width: '100%',
              }}
            >
              <option value="DEMO_MODE" style={{ background: '#1e293b' }}>DEMO_MODE</option>
              <option value="TEST_MODE" style={{ background: '#1e293b' }}>TEST_MODE</option>
              <option value="CLOUD_MODE" style={{ background: '#1e293b' }}>CLOUD_MODE</option>
            </select>
          </div>

          {/* Quota Counter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>API Quota Usage</span>
            <div
              className="touch-target quota-meter"
              aria-label={`Live Quota Remaining: ${liveQuota.remaining} of ${liveQuota.limit}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: liveQuota.remaining === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${liveQuota.remaining === 0 ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-color)'}`,
                fontSize: '0.75rem',
                color: liveQuota.remaining === 0 ? '#f87171' : 'var(--text-main)',
              }}
            >
              <span>Quota Remaining:</span>
              <span className="quota-meter-number" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: liveQuota.remaining === 0 ? '#f87171' : 'var(--accent-cyan)' }}>
                {liveQuota.remaining} / {liveQuota.limit}
              </span>
            </div>
          </div>

          {/* Activity / Event Log Trigger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn-secondary touch-target"
              aria-label="Open Activity Timeline"
              onClick={() => {
                setIsOpen(false);
                onOpenTimeline();
              }}
              style={{
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ZapIcon size={14} />
                <span>Activity ({eventsCount})</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
