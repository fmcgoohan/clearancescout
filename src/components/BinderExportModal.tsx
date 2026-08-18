import React from 'react';

export interface ProvenanceSummary {
  liveCount: number;
  demoCount: number;
  fallbackCount: number;
  dominantProvenance: 'PARALLEL_LIVE' | 'DEMO_FIXTURE' | 'FALLBACK_FIXTURE' | 'MIXED';
}

export interface ClearanceBinder {
  id: string;
  projectId: string;
  projectSummary: {
    title: string;
    productionCompany: string;
    scriptVersion: string;
    totalScenes: number;
    totalEntities: number;
    clearedCount: number;
    actionRequiredCount: number;
    reviewRecommendedCount: number;
    overridesCount: number;
  };
  provenanceSummary?: ProvenanceSummary;
  scenes: any[];
  canonicalEntities: any[];
  citationsIndex: any[];
  replacementCatalog: any[];
  overridesHistory: any[];
  exportedAt: string;
  integrityDigest: string;
  disclaimer: string;
}

interface BinderExportModalProps {
  binder: ClearanceBinder | null;
  isOpen: boolean;
  onClose: () => void;
  executionMode?: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
}

export const BinderExportModal: React.FC<BinderExportModalProps> = ({
  binder,
  isOpen,
  onClose,
  executionMode = 'DEMO_MODE',
}) => {
  if (!isOpen || !binder) return null;

  const dominant =
    binder.provenanceSummary?.dominantProvenance ||
    binder.citationsIndex[0]?.provenance ||
    (executionMode === 'CLOUD_MODE' ? 'FALLBACK_FIXTURE' : 'DEMO_FIXTURE');

  const isLive = dominant === 'PARALLEL_LIVE';
  const isFallback = dominant === 'FALLBACK_FIXTURE';
  const isMixed = dominant === 'MIXED';

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(binder, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Clearance_Binder_${binder.projectSummary.title.replace(/\s+/g, '_')}_${binder.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-binder-modal, #printable-binder-modal * {
            visibility: visible;
          }
          #printable-binder-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div
        id="printable-binder-modal"
        className="glass-panel"
        style={{
          width: '1000px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ClearanceScout Official Legal Dossier
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: 'var(--text-main)' }}>
              {binder.projectSummary.title}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {binder.projectSummary.productionCompany} • Script Version: {binder.projectSummary.scriptVersion}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: isLive
                  ? 'rgba(56, 189, 248, 0.15)'
                  : isFallback
                  ? 'rgba(251, 191, 36, 0.15)'
                  : isMixed
                  ? 'rgba(192, 132, 252, 0.15)'
                  : 'rgba(52, 211, 153, 0.15)',
                color: isLive
                  ? '#38bdf8'
                  : isFallback
                  ? '#fbbf24'
                  : isMixed
                  ? '#c084fc'
                  : '#34d399',
                border: `1px solid ${
                  isLive
                    ? 'rgba(56, 189, 248, 0.4)'
                    : isFallback
                    ? 'rgba(251, 191, 36, 0.4)'
                    : isMixed
                    ? 'rgba(192, 132, 252, 0.4)'
                    : 'rgba(52, 211, 153, 0.4)'
                }`,
              }}
            >
              {isLive
                ? '🌐 Parallel-Grounded Evidence'
                : isFallback
                ? '⚠️ Cloud Fallback Mode'
                : isMixed
                ? '🔀 Mixed Provenance Evidence'
                : '🧪 Demo Mode Fixtures'}
            </span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Exported: {new Date(binder.exportedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* SHA-256 Digest Box */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              SHA-256 Binder Cryptographic Integrity Digest
            </div>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: '2px', wordBreak: 'break-all' }}>
              {binder.integrityDigest}
            </div>
          </div>
          <span style={{ fontSize: '1.2rem', marginLeft: '12px' }}>🔒</span>
        </div>

        {/* Legal Disclaimer Box */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '0.75rem',
            color: '#fbbf24',
          }}
        >
          <strong>Legal Disclaimer:</strong> {binder.disclaimer}
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scenes</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{binder.projectSummary.totalScenes}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Entities</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{binder.projectSummary.totalEntities}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--status-no-issue)' }}>Cleared</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-no-issue)' }}>{binder.projectSummary.clearedCount}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--status-action-required)' }}>Action Req.</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-action-required)' }}>{binder.projectSummary.actionRequiredCount}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#34d399' }}>Overrides</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#34d399' }}>{binder.projectSummary.overridesCount || 0}</div>
          </div>
        </div>

        {/* Side-by-Side Original & Fictional Replacement Catalog */}
        {binder.replacementCatalog && binder.replacementCatalog.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', margin: 0 }}>
              Side-by-Side Original & Fictional Replacement Catalog ({binder.replacementCatalog.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {binder.replacementCatalog.map((rep, idx) => (
                <div
                  key={rep.id || idx}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  {/* Left: Original Target Entity */}
                  <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>
                      Original Scripted Entity
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                      {rep.targetEntityName || 'Original Entity'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Status: <span className="badge badge-ACTION_REQUIRED">ACTION REQUIRED</span>
                    </div>
                  </div>

                  {/* Right: Replacement Asset */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>
                      Fictional Replacement Card
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                      {rep.fictionalBrandName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Aesthetic: <span style={{ color: 'var(--accent-cyan)' }}>{rep.eraAesthetic || 'Modern Cinematic'}</span> • Attempts: {rep.totalAttempts || 1}/3
                    </div>
                    {rep.selfClearanceResult === 'ESCALATED_TO_COUNSEL' && (
                      <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '4px', fontWeight: 600 }}>
                        ⚖️ Escalated to Legal Counsel
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Counsel Overrides Section */}
        {binder.overridesHistory && binder.overridesHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
              Authoritative Counsel Overrides ({binder.overridesHistory.length})
            </h4>
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {binder.overridesHistory.map((ovr, idx) => (
                <div
                  key={ovr.id || idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(52, 211, 153, 0.08)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong>{ovr.counselName} ({ovr.counselRole || 'Counsel'})</strong>
                    <span className="mono" style={{ color: '#34d399' }}>
                      {ovr.sceneId ? `[${ovr.sceneId}] ` : ''}{ovr.previousStatus} → {ovr.overrideStatus}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '2px 0' }}>"{ovr.rationale}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Included Binder Dossiers</h4>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-main)', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Complete Scene Breakdown & Character Dialogue Mapping ({binder.scenes.length} scenes)</li>
            <li>5-Category Canonical Entity Registry & Risk Assessments ({binder.canonicalEntities.length} entities)</li>
            <li>
              Research Citations Index ({binder.citationsIndex.length} citations
              {binder.provenanceSummary && ` — ${binder.provenanceSummary.liveCount} Live, ${binder.provenanceSummary.demoCount} Demo, ${binder.provenanceSummary.fallbackCount} Fallback`})
            </li>
            <li>Approved Fictional Replacement Props & Imagen 3 Visual Cards ({binder.replacementCatalog.length} replacement assets)</li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-secondary" onClick={handlePrintPdf}>
            🖨️ Print / Save to PDF
          </button>
          <button className="btn-primary" onClick={handleDownloadJson}>
            ⬇ Download Auditable Binder (.JSON)
          </button>
        </div>
      </div>
    </div>
  );
};
