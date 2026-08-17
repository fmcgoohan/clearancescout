import React from 'react';

export interface ReplacementCard {
  id: string;
  canonicalEntityId: string;
  fictionalBrandName: string;
  designBrief: string;
  eraAesthetic?: string;
  artworkImageUrl: string;
  nonInfringementRationale: string;
  status: string;
}

interface ReplacementCardModalProps {
  card: ReplacementCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReplacementCardModal: React.FC<ReplacementCardModalProps> = ({ card, isOpen, onClose }) => {
  if (!isOpen || !card) return null;

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
          width: '550px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <p style={{ fontSize: '0.85rem', color: 'var(--status-no-issue)', lineHeight: '1.4' }}>
              ✓ {card.nonInfringementRationale}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-primary" onClick={onClose}>
            Approve & Assign to Production
          </button>
        </div>
      </div>
    </div>
  );
};
