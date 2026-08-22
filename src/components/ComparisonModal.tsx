import React, { useState } from 'react';
import { formatStatus } from '../utils/formatters.js';
import { useModalFocus } from '../hooks/useModalFocus.js';

export interface ClearanceCitation {
  id: string;
  sourceUrl: string;
  query: string;
  retrievedAt: string;
  excerptSnippet: string;
  registrationStatus: 'REGISTERED_ACTIVE' | 'PENDING' | 'EXPIRED' | 'UNKNOWN';
  corporateOwner?: string;
  disputePrecedents?: string;
  provenance?: 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE';
}

export interface OriginalEntitySummary {
  id: string;
  canonicalName: string;
  entityCategory: string;
  description: string;
  overallClearanceStatus: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
  riskScore: number;
  legalRationale: string;
  citations: ClearanceCitation[];
  isOverridden?: boolean;
  latestOverride?: {
    overrideStatus: string;
    rationale: string;
    counselName: string;
    timestamp: string;
  };
}

export interface ReplacementSummary {
  id: string;
  replacementName: string;
  entityCategory: string;
  clearanceStatus: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
  isEscalated: boolean;
  attemptsCount: number;
  generationPrompt: string;
  visualStyle: string;
  artworkImageUrl?: string;
  nonInfringementRationale?: string;
  citations: ClearanceCitation[];
  provenance?: 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE';
}

export interface CandidateAttemptSummary {
  attemptNumber: number;
  candidateName: string;
  riskStatus: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
  rejectionRationale?: string;
  negativeConstraintsApplied?: string[];
  timestamp: string;
}

export interface ComparisonViewModel {
  projectId: string;
  original: OriginalEntitySummary;
  replacement: ReplacementSummary;
  attemptHistory: CandidateAttemptSummary[];
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ComparisonViewModel | null;
  isLoading?: boolean;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading = false,
}) => {
  const [showHistory, setShowHistory] = useState(true);

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const getBadgeClass = (status: string) => {
    return `badge badge-${status}`;
  };

  const getProvenanceBadge = (prov?: string) => {
    switch (prov) {
      case 'PARALLEL_LIVE':
        return (
          <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', padding: '1px 5px' }}>
            🌐 Live Search
          </span>
        );
      case 'FALLBACK_FIXTURE':
        return (
          <span style={{ fontSize: '0.65rem', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '4px', padding: '1px 5px' }}>
            ⚠️ Fallback Fixture
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '0.65rem', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.4)', borderRadius: '4px', padding: '1px 5px' }}>
            🧪 Demo Fixture
          </span>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Side-by-Side Asset Comparison"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel modal-responsive"
        style={{
          width: '1000px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          outline: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚖️ Side-by-Side Asset Comparison</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--accent-cyan)' }}>
                Original Entity vs. Fictional Replacement
              </span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Compare risk rationale, clearance citations, visual styling, and candidate self-clearance loop history.
            </p>
          </div>
          <button
            aria-label="Close comparison modal"
            className="touch-target"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {isLoading || !data ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading comparison data...
          </div>
        ) : (
          <>
            {/* Side-by-Side Comparison Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left Column: Original Entity */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Original Scripted Entity
                    </span>
                    <h3 style={{ margin: '2px 0 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                      {data.original.canonicalName}
                    </h3>
                  </div>
                  <span className={getBadgeClass(data.original.overallClearanceStatus)}>
                    {formatStatus(data.original.overallClearanceStatus)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>{data.original.entityCategory}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>Risk Score:</span>
                  <span style={{ color: data.original.riskScore > 60 ? '#f87171' : '#fbbf24', fontWeight: 600 }}>
                    {data.original.riskScore}/100
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Clearance Rationale:</div>
                  <div>{data.original.legalRationale}</div>
                </div>

                {data.original.isOverridden && data.original.latestOverride && (
                  <div style={{ fontSize: '0.75rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ color: '#34d399', fontWeight: 600 }}>⚖️ Legal Counsel Override Active:</div>
                    <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>"{data.original.latestOverride.rationale}"</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>— {data.original.latestOverride.counselName}</div>
                  </div>
                )}

                {/* Original Citations */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Research Citations ({data.original.citations.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {data.original.citations.map((c, i) => (
                      <div key={i} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.corporateOwner || c.query}</span>
                          {getProvenanceBadge(c.provenance)}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>{c.excerptSnippet}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Replacement Asset */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: data.replacement.isEscalated ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: data.replacement.isEscalated ? '#fbbf24' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Fictional Replacement Card
                    </span>
                    <h3 style={{ margin: '2px 0 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                      {data.replacement.replacementName}
                    </h3>
                  </div>
                  {data.replacement.isEscalated ? (
                    <span className="badge badge-REVIEW_RECOMMENDED" style={{ borderColor: '#fbbf24', color: '#fbbf24' }}>
                      ESCALATED
                    </span>
                  ) : (
                    <span className="badge badge-NO_ISSUE_SURFACED">
                      CLEARED (Attempt {data.replacement.attemptsCount}/3)
                    </span>
                  )}
                </div>

                {/* Escalation Banner or Cleared Notice */}
                {data.replacement.isEscalated ? (
                  <div style={{ fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.5)', borderRadius: '6px', padding: '8px 10px', color: '#fbbf24' }}>
                    <strong>⚖️ Counsel Review Required:</strong> Automated self-clearance exhausted 3 attempts. Production counsel review required prior to sign-off.
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '6px', padding: '8px 10px', color: '#34d399' }}>
                    <strong>✅ Autonomous Self-Clearance Passed:</strong> Candidate brand confirmed non-infringing with zero commercial collisions on attempt #{data.replacement.attemptsCount}.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Aesthetic:</span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>{data.replacement.visualStyle}</span>
                </div>

                {/* Visual Artwork Card Image / Preview */}
                {data.replacement.artworkImageUrl && (
                  <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <img
                      src={data.replacement.artworkImageUrl}
                      alt={data.replacement.replacementName}
                      style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }}
                    />
                  </div>
                )}

                {/* Replacement Citations */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Clearance Research Citations ({data.replacement.citations.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                    {data.replacement.citations.map((c, i) => (
                      <div key={i} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.query}</span>
                          {getProvenanceBadge(c.provenance || data.replacement.provenance)}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>{c.excerptSnippet}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Attempt History Breakdown */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowHistory(!showHistory)}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔄 Candidate Self-Clearance Attempt History ({data.attemptHistory.length} Attempts)</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {showHistory ? '▲ Hide' : '▼ Show Details'}
                </span>
              </div>

              {showHistory && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.attemptHistory.map((att) => (
                    <div
                      key={att.attemptNumber}
                      style={{
                        fontSize: '0.75rem',
                        background: 'rgba(0,0,0,0.2)',
                        border: att.riskStatus === 'NO_ISSUE_SURFACED' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(248, 113, 113, 0.2)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          Attempt #{att.attemptNumber}: "{att.candidateName}"
                        </span>
                        <span className={getBadgeClass(att.riskStatus)}>
                          {formatStatus(att.riskStatus)}
                        </span>
                      </div>
                      {att.rejectionRationale && (
                        <div style={{ color: '#f87171' }}>
                          <strong>Collision / Rejection Reason:</strong> {att.rejectionRationale}
                        </div>
                      )}
                      {att.negativeConstraintsApplied && att.negativeConstraintsApplied.length > 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          <strong>Negative Constraint Injected on Retry:</strong> {att.negativeConstraintsApplied.join('; ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <button className="btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
