import React, { useState } from 'react';

export interface ReplacementAttempt {
  attemptNumber: number;
  candidateName: string;
  designBrief: string;
  eraAesthetic?: string;
  clearanceStatus: string;
  collisionRationale?: string;
  citations?: any[];
  provenance: string;
  timestamp: string;
}

export interface ReplacementCard {
  id: string;
  canonicalEntityId: string;
  targetEntityName?: string;
  fictionalBrandName: string;
  designBrief: string;
  eraAesthetic?: string;
  artworkImageUrl: string;
  nonInfringementRationale: string;
  clearanceStatus?: string;
  selfClearanceResult?: 'ACCEPTED' | 'ESCALATED_TO_COUNSEL';
  totalAttempts?: number;
  attemptHistory?: ReplacementAttempt[];
  citations?: any[];
  provenance?: string;
  status: string;
}

interface ReplacementCardModalProps {
  card: ReplacementCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReplacementCardModal: React.FC<ReplacementCardModalProps> = ({ card, isOpen, onClose }) => {
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen || !card) return null;

  const isAccepted = card.selfClearanceResult === 'ACCEPTED' || card.clearanceStatus === 'NO_ISSUE_SURFACED';
  const totalAttempts = card.totalAttempts || card.attemptHistory?.length || 1;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                REPLACEMENT BRAND CARD
              </span>
              {card.eraAesthetic && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                  }}
                >
                  {card.eraAesthetic}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {card.fictionalBrandName}
            </h3>
          </div>
          <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Self-Clearance Verification Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: isAccepted ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
            border: isAccepted ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isAccepted ? '#34d399' : '#fbbf24' }}>
              {isAccepted
                ? `✓ Self-Clearance Verified (Attempt ${totalAttempts} of 3)`
                : `⚠️ Escalated to Legal Counsel (3 Attempts Failed)`}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isAccepted
                ? 'Grounded trademark research returned NO_ISSUE_SURFACED.'
                : 'Automated attempts encountered collisions. Counsel manual review recommended.'}
            </div>
          </div>
          {card.attemptHistory && card.attemptHistory.length > 1 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                fontSize: '0.7rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {showHistory ? 'Hide Attempts' : `View ${card.attemptHistory.length} Attempts`}
            </button>
          )}
        </div>

        {/* Attempt History Breakdown (If Multi-Attempt) */}
        {showHistory && card.attemptHistory && (
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Attempt History Audit:</div>
            {card.attemptHistory.map((att) => (
              <div key={att.attemptNumber} style={{ fontSize: '0.75rem', borderLeft: `3px solid ${att.clearanceStatus === 'NO_ISSUE_SURFACED' ? '#34d399' : '#f87171'}`, paddingLeft: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Attempt #{att.attemptNumber}: {att.candidateName}</span> —{' '}
                <span style={{ color: att.clearanceStatus === 'NO_ISSUE_SURFACED' ? '#34d399' : '#f87171' }}>{att.clearanceStatus}</span>
                {att.collisionRationale && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>{att.collisionRationale}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Artwork Display */}
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px' }}>
          <img
            src={card.artworkImageUrl}
            alt={card.fictionalBrandName}
            style={{ width: '280px', height: '280px', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>

        {/* Design Brief & Non-Infringement Rationale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Design Brief</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{card.designBrief}</p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Non-Infringement Rationale</h4>
            <p style={{ fontSize: '0.85rem', color: isAccepted ? 'var(--status-no-issue)' : '#fbbf24', lineHeight: '1.4' }}>
              {isAccepted ? '✓' : '⚖️'} {card.nonInfringementRationale}
            </p>
          </div>

          {/* Research Citations */}
          {card.citations && card.citations.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Clearance Research Citations ({card.citations.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {card.citations.slice(0, 2).map((c, i) => (
                  <div key={i} style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.corporateOwner || 'USPTO / Web Registry'}</div>
                    <div>"{c.excerptSnippet}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-primary" onClick={onClose}>
            {isAccepted ? 'Approve & Assign to Production' : 'Acknowledge & Refer to Counsel'}
          </button>
        </div>
      </div>
    </div>
  );
};
