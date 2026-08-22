import React, { useState } from 'react';
import { apiFetch } from '../utils/apiClient.js';
import { formatStatus } from '../utils/formatters.js';
import { useModalFocus } from '../hooks/useModalFocus.js';
import {
  SearchIcon,
  CheckCircleIcon,
  XIcon,
} from './icons/Icons';

export type ProvenanceType = 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE';

export interface Citation {
  id: string;
  sourceUrl: string;
  query: string;
  retrievedAt: string;
  excerptSnippet: string;
  registrationStatus: string;
  corporateOwner?: string;
  disputePrecedents?: string;
  provenance?: ProvenanceType;
}

interface CitationDrawerProps {
  projectId: string;
  canonicalEntityId?: string;
  sceneId?: string;
  citations: Citation[];
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  rationale?: string;
  currentStatus?: string;
  isOverridden?: boolean;
  latestOverride?: {
    overrideStatus: string;
    rationale: string;
    counselName: string;
    timestamp: string;
    sceneId?: string;
  };
  executionMode?: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
  onOverrideSaved?: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  projectId,
  canonicalEntityId,
  sceneId,
  citations,
  isOpen,
  onClose,
  entityName,
  rationale,
  currentStatus = 'ACTION_REQUIRED',
  isOverridden = false,
  latestOverride,
  executionMode = 'DEMO_MODE',
  onOverrideSaved,
}) => {
  const { containerRef } = useModalFocus<HTMLElement>({
    isOpen,
    onClose,
  });

  const [activeTab, setActiveTab] = useState<'PROVENANCE' | 'OVERRIDE'>('PROVENANCE');
  const [overrideStatus, setOverrideStatus] = useState<string>('NO_ISSUE_SURFACED');
  const [applySceneSpecific, setApplySceneSpecific] = useState<boolean>(false);
  const [counselName, setCounselName] = useState<string>('');
  const [counselRole, setCounselRole] = useState<string>('');
  const [overrideRationale, setOverrideRationale] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine actual provenance from citations
  const dominantProvenance: ProvenanceType =
    citations[0]?.provenance ||
    (executionMode === 'CLOUD_MODE' ? 'FALLBACK_FIXTURE' : 'DEMO_FIXTURE');

  const isLive = dominantProvenance === 'PARALLEL_LIVE';
  const isFallback = dominantProvenance === 'FALLBACK_FIXTURE';

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalEntityId || !projectId) return;

    if (!counselName.trim()) {
      setSubmitError('Counsel name is required for legal audit authentication.');
      return;
    }

    if (!overrideRationale.trim()) {
      setSubmitError('A non-empty legal counsel rationale is mandatory for audit logging.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await apiFetch(`/api/projects/${projectId}/entities/${canonicalEntityId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overrideStatus,
          sceneId: applySceneSpecific ? sceneId : undefined,
          rationale: overrideRationale.trim(),
          counselName: counselName.trim(),
          counselRole: counselRole.trim() || 'Studio Production Counsel',
        }),
      });

      if (res.ok) {
        setOverrideRationale('');
        if (onOverrideSaved) onOverrideSaved();
        setActiveTab('OVERRIDE');
      } else {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to submit counsel override.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting counsel override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside
      ref={containerRef}
      tabIndex={-1}
      className="glass-panel drawer-responsive"
      role="dialog"
      aria-modal="true"
      aria-label={`Research Dossier for ${entityName}`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '560px',
        maxWidth: '90vw',
        zIndex: 1300,
        borderTop: 'none',
        borderBottom: 'none',
        borderRight: 'none',
        borderRadius: 0,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        outline: 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Entity Evidence & Research Dossier
          </span>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '4px 0 0' }}>
            {entityName}
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
            <span className={`badge badge-${currentStatus}`}>
              {formatStatus(currentStatus)}
            </span>
            {isOverridden && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'var(--status-no-issue-bg)',
                  color: 'var(--status-no-issue)',
                  border: '1px solid var(--status-no-issue-border)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircleIcon size={12} />
                <span>Legal Counsel Override</span>
              </span>
            )}
          </div>
        </div>
        <button
          className="btn-secondary touch-target"
          aria-label="Close research evidence drawer"
          style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={onClose}
        >
          <XIcon size={16} />
          <span>Close</span>
        </button>
      </div>

      {/* Rationale and Summary */}
      {rationale && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Clearance Assessment Rationale:</strong>
          {rationale}
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          role="tab"
          aria-selected={activeTab === 'PROVENANCE'}
          className={activeTab === 'PROVENANCE' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('PROVENANCE')}
        >
          <SearchIcon size={14} />
          <span>Research Evidence ({citations.length})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'OVERRIDE'}
          className={activeTab === 'OVERRIDE' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('OVERRIDE')}
        >
          <CheckCircleIcon size={14} />
          <span>Counsel Decision Override {isOverridden && '✓'}</span>
        </button>
      </div>

      {/* Mandatory Non-Legal-Advice Disclaimer Invariant */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: '6px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: '0.72rem',
          color: 'var(--status-review)',
        }}
      >
        <strong>Legal Disclaimer:</strong> ClearanceScout provides research issue-spotting and workflow tracking. It does NOT render formal legal advice.
      </div>

      {activeTab === 'PROVENANCE' ? (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isFallback && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                fontSize: '0.72rem',
                color: 'var(--status-action)',
              }}
            >
              <strong>⚠️ Cloud Fallback Active:</strong> Live Parallel search API was unavailable. Displaying deterministic benchmark fallback fixture.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              {isLive
                ? 'Live Parallel-Web Grounded Research Citations'
                : isFallback
                ? 'Cloud Fallback Fixture Evidence'
                : 'Demo Fixture Research Evidence (Synthetic Dataset)'}{' '}
              ({citations.length})
            </h4>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                background: isLive
                  ? 'rgba(6, 182, 212, 0.15)'
                  : isFallback
                  ? 'rgba(248, 113, 113, 0.15)'
                  : 'rgba(251, 191, 36, 0.15)',
                color: isLive ? 'var(--accent-cyan)' : isFallback ? '#f87171' : '#fbbf24',
                border: `1px solid ${
                  isLive ? 'rgba(6, 182, 212, 0.3)' : isFallback ? 'rgba(248, 113, 113, 0.3)' : 'rgba(251, 191, 36, 0.3)'
                }`,
              }}
            >
              {isLive ? '● PARALLEL LIVE' : isFallback ? '⚠️ FALLBACK FIXTURE' : '● DEMO FIXTURE'}
            </span>
          </div>

          {citations.length === 0 && (
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ color: 'var(--text-muted)' }}>
                <SearchIcon size={20} />
              </div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>No Grounded Citations Recorded</div>
              <div style={{ fontSize: '0.75rem' }}>
                No grounded research citations surfaced for this entity. Click 'Ground' in the workspace registry to evaluate research.
              </div>
            </div>
          )}

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
                <span className="mono" style={{ fontSize: '0.7rem', color: isLive ? 'var(--accent-cyan)' : '#fbbf24' }}>
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
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isOverridden && latestOverride && (
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#34d399' }}>✓ Counsel Decision Overridden</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(latestOverride.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scope:</span>{' '}
                <strong>{latestOverride.sceneId ? `Scene Specific (${latestOverride.sceneId})` : 'Project-Wide Baseline'}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Counsel:</span> {latestOverride.counselName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Override Status:</span> <strong>{formatStatus(latestOverride.overrideStatus)}</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                "{latestOverride.rationale}"
              </p>
            </div>
          )}

          <form onSubmit={handleApplyOverride} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Record Authoritative Legal Override</h4>

            {submitError && (
              <div style={{ color: '#f87171', fontSize: '0.75rem', padding: '8px', background: 'rgba(248,113,113,0.1)', borderRadius: '4px' }}>
                {submitError}
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                New Clearance Status:
              </label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                }}
              >
                <option value="NO_ISSUE_SURFACED">No issue surfaced (Cleared)</option>
                <option value="REVIEW_RECOMMENDED">Review recommended (Coordinator Review)</option>
                <option value="ACTION_REQUIRED">Action required (High Risk / Replace)</option>
              </select>
            </div>

            {sceneId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="sceneSpecificOverride"
                  checked={applySceneSpecific}
                  onChange={(e) => setApplySceneSpecific(e.target.checked)}
                />
                <label htmlFor="sceneSpecificOverride" style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>
                  Apply as Scene-Specific Override only for current scene ({sceneId})
                </label>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Counsel Name (Required):
              </label>
              <input
                type="text"
                value={counselName}
                onChange={(e) => setCounselName(e.target.value)}
                placeholder="e.g. Jane Doe, Esq."
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Counsel Role / Title:
              </label>
              <input
                type="text"
                value={counselRole}
                onChange={(e) => setCounselRole(e.target.value)}
                placeholder="e.g. Senior Production Counsel"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Mandatory Legal Rationale (E&O Audit Trail):
              </label>
              <textarea
                value={overrideRationale}
                onChange={(e) => setOverrideRationale(e.target.value)}
                placeholder="e.g. Paid product placement license agreement #PP-2026-09 executed with trademark holder."
                rows={4}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !counselName.trim() || !overrideRationale.trim()}
              style={{ marginTop: '8px' }}
            >
              {isSubmitting ? 'Saving Override...' : '⚖️ Apply Authoritative Legal Override'}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
};
