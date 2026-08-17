import React from 'react';

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
    overridesCount?: number;
  };
  scenes: any[];
  canonicalEntities: any[];
  citationsIndex: any[];
  replacementCatalog: any[];
  overridesHistory?: any[];
  exportedAt: string;
  auditSignature: string;
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

  const isLive = executionMode === 'CLOUD_MODE';

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
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px;
            box-shadow: none !important;
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
          width: '780px',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                STUDIO E&O LEGAL CLEARANCE BINDER
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  background: isLive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                  color: isLive ? 'var(--accent-cyan)' : '#fbbf24',
                  border: `1px solid ${isLive ? 'rgba(6, 182, 212, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                }}
              >
                {isLive ? 'CLOUD LIVE' : 'DEMO FIXTURE'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {binder.projectSummary.title}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {binder.projectSummary.productionCompany} • Script Version: {binder.projectSummary.scriptVersion}
            </span>
          </div>
          <button className="btn-secondary no-print" style={{ padding: '4px 10px' }} onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Audit Signature Header */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Cryptographic SHA-256 Audit Signature:
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
            {binder.auditSignature}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Exported & Audited At: {new Date(binder.exportedAt).toLocaleString()}
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'rgba(245, 158, 11, 0.1)',
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
                    <span className="mono" style={{ color: '#34d399' }}>{ovr.previousStatus} → {ovr.overrideStatus}</span>
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
              {isLive ? 'Live Parallel-Web Search Citations Index' : 'Demo Fixture Research Citations Index'} ({binder.citationsIndex.length} citations)
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
