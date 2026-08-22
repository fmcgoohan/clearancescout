import React from 'react';
import { useModalFocus } from '../hooks/useModalFocus';

interface DemoTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenInput: string;
  onTokenInputChange: (val: string) => void;
  onSaveToken: (token: string) => void;
}

export const DemoTokenModal: React.FC<DemoTokenModalProps> = ({
  isOpen,
  onClose,
  tokenInput,
  onTokenInputChange,
  onSaveToken,
}) => {
  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="token-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="glass-panel modal-responsive"
        style={{
          width: '460px',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 id="token-modal-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔑 Demo Access Token</h3>
          <button
            aria-label="Close Demo Access Token dialog"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          Production Access Token Required for Live Cloud Mode. Enter the authorized access token below to unlock production clearance workflows, real-time observable timeline streams, and project data access.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSaveToken(tokenInput);
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="demo-token-input-field"
              style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
            >
              Access Token
            </label>
            <input
              id="demo-token-input-field"
              type="password"
              value={tokenInput}
              onChange={(e) => onTokenInputChange(e.target.value)}
              placeholder="Enter demo token (e.g. judge-pass-2026)"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.8rem' }}
              onClick={() => {
                onTokenInputChange('');
                onSaveToken('');
              }}
            >
              Clear Token
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ fontSize: '0.8rem' }}
              >
                Save Token
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
