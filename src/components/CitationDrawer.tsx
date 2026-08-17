import React, { useState } from 'react';

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
      const res = await fetch(`/api/projects/${projectId}/entities/${canonicalEntityId}/override`, {
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
        gap: '16px',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entity Dossier</span>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>{entityName}</h3>
        </div>
        <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={onClose}>
          ✕ Close
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          className={activeTab === 'PROVENANCE' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          onClick={() => setActiveTab('PROVENANCE')}
        >
          🔍 Research Evidence ({citations.length})
        </button>
        <button
          className={activeTab === 'OVERRIDE' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          onClick={() => setActiveTab('OVERRIDE')}
        >
          ⚖️ Counsel Decision Override {isOverridden && '✓'}
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
          color: '#fbbf24',
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
                color: '#f87171',
              }}
            >
              <strong>⚠️ Cloud Fallback Active:</strong> Live Parallel search API was unavailable. Displaying deterministic benchmark fallback fixture.
            </div>
          )}

          {rationale && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-main)' }}>Clearance Rationale</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{rationale}</p>
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No research citations retrieved yet.
            </p>
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
                <span style={{ color: 'var(--text-muted)' }}>Override Status:</span> <strong>{latestOverride.overrideStatus}</strong>
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
                <option value="NO_ISSUE_SURFACED">NO ISSUE SURFACED (Cleared)</option>
                <option value="REVIEW_RECOMMENDED">REVIEW RECOMMENDED (Coordinator Review)</option>
                <option value="ACTION_REQUIRED">ACTION REQUIRED (High Risk / Replace)</option>
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
    </div>
  );
};
