import React from 'react';

export interface Citation {
  id: string;
  sourceUrl: string;
  query: string;
  retrievedAt: string;
  excerptSnippet: string;
  registrationStatus: string;
  corporateOwner?: string;
  disputePrecedents?: string;
}

interface CitationDrawerProps {
  citations: Citation[];
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  rationale?: string;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citations,
  isOpen,
  onClose,
  entityName,
  rationale,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '460px',
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
        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
          Research Evidence: {entityName}
        </h3>
        <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={onClose}>
          ✕ Close
        </button>
      </div>

      {/* Mandatory Non-Legal-Advice Disclaimer Invariant */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: '0.75rem',
          color: '#fbbf24',
        }}
      >
        <strong>Legal Disclaimer:</strong> ClearanceScout provides research issue-spotting and clearance workflow management. It does NOT render formal legal advice or legal opinions.
      </div>

      {rationale && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-main)' }}>Clearance Rationale</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{rationale}</p>
        </div>
      )}

      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
        Live Parallel-Web Search Provenance ({citations.length})
      </h4>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {citations.map((c) => (
          <div
            key={c.id}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                {c.registrationStatus}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {new Date(c.retrievedAt).toLocaleTimeString()}
              </span>
            </div>

            {c.corporateOwner && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Owner:</span> <strong>{c.corporateOwner}</strong>
              </div>
            )}

            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              "{c.excerptSnippet}"
            </p>

            {c.disputePrecedents && (
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                <strong>Enforcement / Precedents:</strong> {c.disputePrecedents}
              </div>
            )}

            <a
              href={c.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', wordBreak: 'break-all' }}
            >
              🔗 {c.sourceUrl}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
