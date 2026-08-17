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
  };
  scenes: any[];
  canonicalEntities: any[];
  citationsIndex: any[];
  replacementCatalog: any[];
  exportedAt: string;
  auditSignature: string;
  disclaimer: string;
}

interface BinderExportModalProps {
  binder: ClearanceBinder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BinderExportModal: React.FC<BinderExportModalProps> = ({ binder, isOpen, onClose }) => {
  if (!isOpen || !binder) return null;

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(binder, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Clearance_Binder_${binder.projectSummary.title.replace(/\s+/g, '_')}_${binder.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
      <div
        className="glass-panel"
        style={{
          width: '700px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
              AUDITABLE PRODUCTION CLEARANCE BINDER
            </span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {binder.projectSummary.title}
            </h3>
          </div>
          <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Audit Signature Header */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            SHA-256 Audit Signature:
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
            {binder.auditSignature}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Exported At: {new Date(binder.exportedAt).toLocaleString()}
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '0.75rem',
            color: '#fbbf24',
          }}
        >
          {binder.disclaimer}
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Scenes</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{binder.projectSummary.totalScenes}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Entities</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{binder.projectSummary.totalEntities}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-no-issue)' }}>Cleared</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--status-no-issue)' }}>{binder.projectSummary.clearedCount}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-action-required)' }}>Action Req.</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--status-action-required)' }}>{binder.projectSummary.actionRequiredCount}</div>
          </div>
        </div>

        {/* Summary Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Included Binder Records</h4>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-main)', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Complete Scene Breakdown & Occurrence Mapping</li>
            <li>5-Category Canonical Entity Registry & Risk Matrix</li>
            <li>Live Parallel-Web Search Citations Index ({binder.citationsIndex.length} citations)</li>
            <li>Approved Fictional Replacement Cards ({binder.replacementCatalog.length} replacement assets)</li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handleDownloadJson}>
            ⬇ Download Auditable Binder (.JSON)
          </button>
        </div>
      </div>
    </div>
  );
};
