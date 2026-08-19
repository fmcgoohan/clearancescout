import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';

export interface OccurrenceItem {
  id: string;
  sceneId: string;
  scriptLineNumber: number;
  excerptText: string;
  usageContext: string;
  sentimentScore?: number;
  exposureDurationSeconds?: number;
  clearanceStatus?: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
  riskScore?: number;
  riskRationale?: string;
  contextFlags?: string[];
  citations?: any[];
  evaluatedAt?: string;
}

interface EntityDetailModalProps {
  projectId: string;
  entityId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCounselReview?: (entityId: string, sceneId?: string) => void;
  onOccurrenceEvaluated?: () => void;
}

export function EntityDetailModal({
  projectId,
  entityId,
  isOpen,
  onClose,
  onOpenCounselReview,
  onOccurrenceEvaluated,
}: EntityDetailModalProps) {
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([]);
  const [canonicalName, setCanonicalName] = useState('');
  const [derivedStatus, setDerivedStatus] = useState<string>('INSUFFICIENT_EVIDENCE');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluatingOccId, setEvaluatingOccId] = useState<string | null>(null);

  const fetchOccurrences = async () => {
    if (!projectId || !entityId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/entities/${entityId}/occurrences`);
      if (res.ok) {
        const data = await res.json();
        setCanonicalName(data.canonicalName || '');
        setDerivedStatus(data.derivedOverallStatus || 'INSUFFICIENT_EVIDENCE');
        setOccurrences(data.occurrences || []);
      }
    } catch (err) {
      console.error('Error fetching occurrences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && entityId) {
      fetchOccurrences();
    }
  }, [isOpen, entityId, projectId]);

  const handleEvaluateOccurrence = async (occId: string) => {
    setEvaluatingOccId(occId);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/occurrences/${occId}/evaluate`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchOccurrences();
        if (onOccurrenceEvaluated) onOccurrenceEvaluated();
      }
    } catch (err) {
      console.error('Error evaluating occurrence:', err);
    } finally {
      setEvaluatingOccId(null);
    }
  };

  if (!isOpen || !entityId) return null;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'NO_ISSUE_SURFACED':
        return { label: '✓ No Issue Surfaced', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' };
      case 'REVIEW_RECOMMENDED':
        return { label: '⚠️ Review Recommended', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
      case 'ACTION_REQUIRED':
        return { label: '⛔ Action Required', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' };
      default:
        return { label: '⏳ Insufficient Evidence', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  const canonicalBadge = getStatusBadge(derivedStatus);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="entity-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1350,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel modal-responsive"
        style={{
          width: '760px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          borderRadius: '12px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 id="entity-detail-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {canonicalName || 'Clearance Asset Occurrences'}
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: canonicalBadge.bg,
                  color: canonicalBadge.color,
                  fontWeight: 600,
                }}
              >
                Roll-up: {canonicalBadge.label}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Occurrence-level scene breakdown & contextual legal risk evaluation
            </p>
          </div>
          <button
            className="btn-secondary touch-target"
            onClick={onClose}
            aria-label="Close details modal"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading scene occurrences...
            </div>
          ) : occurrences.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No scene occurrences recorded for this entity.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {occurrences.map((occ, idx) => {
                const badge = getStatusBadge(occ.clearanceStatus);
                const isEvaluating = evaluatingOccId === occ.id;
                return (
                  <div
                    key={occ.id}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          Occurrence #{idx + 1}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({occ.sceneId} · Line {occ.scriptLineNumber})
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: badge.bg,
                          color: badge.color,
                          fontWeight: 600,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Excerpt */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        fontSize: '0.85rem',
                        fontStyle: 'italic',
                        color: 'var(--text-main)',
                      }}
                    >
                      "{occ.excerptText}"
                    </div>

                    {/* Context & Rationale */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {occ.usageContext && (
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Context:</strong> {occ.usageContext}
                        </div>
                      )}
                      {occ.riskRationale && (
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Rationale:</strong> {occ.riskRationale}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button
                        className="btn-secondary touch-target"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => handleEvaluateOccurrence(occ.id)}
                        disabled={isEvaluating}
                      >
                        {isEvaluating ? 'Evaluating...' : '⚡ Evaluate Occurrence'}
                      </button>
                      {onOpenCounselReview && (
                        <button
                          className="btn-secondary touch-target"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--accent-cyan)' }}
                          onClick={() => {
                            onOpenCounselReview(entityId, occ.sceneId);
                            onClose();
                          }}
                        >
                          ⚖️ Counsel Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
