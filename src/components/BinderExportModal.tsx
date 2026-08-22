import React from 'react';
import { apiFetch } from '../utils/apiClient.js';
import { formatStatus, formatCategory } from '../utils/formatters.js';

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
    projectId?: string;
    projectType?: string;
    title: string;
    productionCompany: string;
    scriptVersion: string;
    totalScenes: number;
    finalClearScenes?: number;
    workingClearScenes?: number;
    redScenes?: number;
    overallReadinessPercentage?: number;
    totalEntities: number;
    clearedCount: number;
    actionRequiredCount: number;
    reviewRecommendedCount: number;
    activePlaceholdersCount?: number;
    activeRightsCount?: number;
    openActionsCount?: number;
    overridesCount: number;
  };
  provenanceSummary?: ProvenanceSummary;
  scenes: any[];
  sceneReadinessSchedule?: any[];
  canonicalEntities: any[];
  rightsAgreements?: any[];
  placeholders?: any[];
  unresolvedActions?: any[];
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
  onJumpToEvidence?: (entityId: string, entityName: string, citations?: any[], rationale?: string, status?: string) => void;
  onJumpToTimeline?: (entityId: string, entityName: string) => void;
}

export const BinderExportModal: React.FC<BinderExportModalProps> = ({
  binder,
  isOpen,
  onClose,
  executionMode = 'DEMO_MODE',
  onJumpToEvidence,
  onJumpToTimeline,
}) => {
  if (!isOpen || !binder) return null;

  const [activeTab, setActiveTab] = React.useState<'ALL' | 'SCENES' | 'RIGHTS' | 'PLACEHOLDERS' | 'ACTIONS'>('ALL');
  const [copiedDigest, setCopiedDigest] = React.useState(false);

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

  const handleDownloadMarkdown = async () => {
    try {
      const res = await apiFetch(`/api/projects/${binder.projectId}/binder/markdown`);
      if (!res.ok) throw new Error('Failed to fetch markdown');
      const md = await res.text();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Clearance_Binder_${binder.projectSummary.title.replace(/\s+/g, '_')}_${binder.id}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download markdown error', e);
    }
  };

  const handleCopyDigest = () => {
    navigator.clipboard.writeText(binder.integrityDigest);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
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
        {/* Executive Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
                {binder.projectSummary.title}
              </h2>
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', fontWeight: 600 }}>
                {binder.projectSummary.projectType || 'Movie'}
              </span>
              <span className="badge badge-NO_ISSUE_SURFACED" style={{ fontSize: '0.75rem' }}>
                AUDITABLE LEGAL DOSSIER
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Production Company: <strong style={{ color: 'var(--text-main)' }}>{binder.projectSummary.productionCompany}</strong> • Script Version: <strong style={{ color: 'var(--text-main)' }}>{binder.projectSummary.scriptVersion}</strong> • Exported: {new Date(binder.exportedAt).toLocaleString()}
            </p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handlePrintPdf}>
              🖨️ Print PDF
            </button>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleDownloadMarkdown}>
              📝 Markdown (.md)
            </button>
            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleDownloadJson}>
              ⬇ JSON
            </button>
            <button
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
        </div>

        {/* Provenance Watermark Badge Banner */}
        <div
          style={{
            background: isLive
              ? 'rgba(6, 182, 212, 0.08)'
              : isFallback
              ? 'rgba(248, 113, 113, 0.08)'
              : isMixed
              ? 'rgba(168, 85, 247, 0.08)'
              : 'rgba(251, 191, 36, 0.08)',
            border: `1px solid ${
              isLive
                ? 'rgba(6, 182, 212, 0.3)'
                : isFallback
                ? 'rgba(248, 113, 113, 0.3)'
                : isMixed
                ? 'rgba(168, 85, 247, 0.3)'
                : 'rgba(251, 191, 36, 0.3)'
            }`,
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>
              {isLive ? '🌐' : isFallback ? '⚠️' : isMixed ? '🔀' : '🧪'}
            </span>
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isLive ? 'var(--accent-cyan)' : isFallback ? '#f87171' : isMixed ? '#c084fc' : '#fbbf24',
                }}
              >
                {isLive
                  ? 'LIVE RESEARCH GROUNDING PROVENANCE'
                  : isFallback
                  ? 'CLOUD BENCHMARK FALLBACK PROVENANCE'
                  : isMixed
                  ? 'MIXED PROVENANCE CLEARANCE DOSSIER'
                  : 'SYNTHETIC BENCHMARK DEMO PROVENANCE'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {isLive
                  ? 'All research citations verified via live Google Search / Parallel API grounding.'
                  : isFallback
                  ? 'Parallel API unavailable. Evidence verified via deterministic cloud benchmark fallback fixture.'
                  : isMixed
                  ? `Dossier compiled from mixed evidence sources (${binder.provenanceSummary?.liveCount || 0} Live, ${binder.provenanceSummary?.demoCount || 0} Demo, ${binder.provenanceSummary?.fallbackCount || 0} Fallback).`
                  : 'Screenplay and entity research derived from competition synthetic fixture.'}
              </div>
            </div>
          </div>
          <span
            className="mono"
            style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              background: isLive
                ? 'rgba(6, 182, 212, 0.2)'
                : isFallback
                ? 'rgba(248, 113, 113, 0.2)'
                : isMixed
                ? 'rgba(168, 85, 247, 0.2)'
                : 'rgba(251, 191, 36, 0.2)',
              color: isLive ? 'var(--accent-cyan)' : isFallback ? '#f87171' : isMixed ? '#c084fc' : '#fbbf24',
            }}
          >
            {dominant}
          </span>
        </div>

        {/* SHA-256 Digest Box */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
              onClick={handleCopyDigest}
            >
              {copiedDigest ? '✓ Copied' : '📋 Copy Checksum'}
            </button>
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
          </div>
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

        {/* Executive Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>Shoot Readiness</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
              {binder.projectSummary.overallReadinessPercentage ?? 100}%
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Scenes</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{binder.projectSummary.totalScenes}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--status-no-issue)' }}>Final Clear</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-no-issue)' }}>
              {binder.projectSummary.finalClearScenes ?? binder.projectSummary.clearedCount}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Working Clear</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24' }}>
              {binder.projectSummary.workingClearScenes ?? 0}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--status-action-required)' }}>Red / Blocked</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-action-required)' }}>
              {binder.projectSummary.redScenes ?? binder.projectSummary.actionRequiredCount}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#34d399' }}>Rights & Props</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#34d399' }}>
              {(binder.projectSummary.activeRightsCount || 0) + (binder.projectSummary.activePlaceholdersCount || 0)}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="no-print" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          {(['ALL', 'SCENES', 'RIGHTS', 'PLACEHOLDERS', 'ACTIONS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.75rem', padding: '4px 12px' }}
            >
              {tab === 'ALL' && '📑 Full Binder'}
              {tab === 'SCENES' && `🎬 Scene Schedule (${binder.sceneReadinessSchedule?.length || 0})`}
              {tab === 'RIGHTS' && `📜 Rights Catalog (${binder.rightsAgreements?.length || 0})`}
              {tab === 'PLACEHOLDERS' && `🎨 Placeholders (${binder.placeholders?.length || 0})`}
              {tab === 'ACTIONS' && `📋 Unresolved Actions (${binder.unresolvedActions?.length || 0})`}
            </button>
          ))}
        </div>

        {/* Scene-by-Scene Shooting Readiness Schedule */}
        {(activeTab === 'ALL' || activeTab === 'SCENES') && binder.sceneReadinessSchedule && binder.sceneReadinessSchedule.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', margin: 0 }}>
              Scene-by-Scene Shooting Readiness Schedule ({binder.sceneReadinessSchedule.length})
            </h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {binder.sceneReadinessSchedule.map((s: any) => (
                <div
                  key={s.sceneId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', marginRight: '8px' }}>Scene {s.sceneNumber}:</span>
                    <span style={{ color: 'var(--text-muted)' }}>{s.heading}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {s.totalOccurrences} items ({s.blockersCount} blocked, {s.workingClearCount} working)
                    </span>
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background:
                          s.status === 'FINAL_CLEAR'
                            ? 'rgba(52, 211, 153, 0.15)'
                            : s.status === 'WORKING_CLEAR'
                            ? 'rgba(251, 191, 36, 0.15)'
                            : 'rgba(248, 113, 113, 0.15)',
                        color:
                          s.status === 'FINAL_CLEAR'
                            ? '#34d399'
                            : s.status === 'WORKING_CLEAR'
                            ? '#fbbf24'
                            : '#f87171',
                      }}
                    >
                      {formatStatus(s.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contractual Rights & Restrictions Catalog */}
        {(activeTab === 'ALL' || activeTab === 'RIGHTS') && binder.rightsAgreements && binder.rightsAgreements.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', margin: 0 }}>
              Contractual Rights & Restrictions Catalog ({binder.rightsAgreements.length})
            </h4>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {binder.rightsAgreements.map((r: any) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', marginRight: '8px' }}>{r.licensorName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      • {r.grantType} • {r.territory} • {r.mediaWindow}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: r.isPerpetual ? '#34d399' : '#fbbf24' }}>
                      {r.isPerpetual ? '♾️ Perpetual' : `Exp: ${r.expirationDate || 'N/A'}`}
                    </span>
                    <span className="badge badge-NO_ISSUE_SURFACED" style={{ fontSize: '0.65rem' }}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generalized Replacements & Fictional Placeholders */}
        {(activeTab === 'ALL' || activeTab === 'PLACEHOLDERS') && binder.placeholders && binder.placeholders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', margin: 0 }}>
              Generalized Replacements & Fictional Placeholders ({binder.placeholders.length})
            </h4>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {binder.placeholders.map((ph: any) => (
                <div
                  key={ph.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', marginRight: '8px' }}>{ph.fictionalName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      • Category: {ph.assetCategory} • Approved By: {ph.approvedBy}
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      background: ph.clearanceTier === 'FINAL_CLEARED' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      color: ph.clearanceTier === 'FINAL_CLEARED' ? '#34d399' : '#fbbf24',
                    }}
                  >
                    {ph.clearanceTier?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unresolved Department Actions */}
        {(activeTab === 'ALL' || activeTab === 'ACTIONS') && binder.unresolvedActions && binder.unresolvedActions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', margin: 0 }}>
              Unresolved Department Actions ({binder.unresolvedActions.length})
            </h4>
            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {binder.unresolvedActions.map((a: any) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', marginRight: '8px' }}>{a.title}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      • Dept: {a.targetDepartment}
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.65rem',
                      background: a.priority === 'CRITICAL' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      color: a.priority === 'CRITICAL' ? '#f87171' : '#fbbf24',
                    }}
                  >
                    {a.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canonical Entity Clearance Registry */}
        {binder.canonicalEntities && binder.canonicalEntities.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', margin: 0 }}>
              Canonical Entity Clearance Registry ({binder.canonicalEntities.length})
            </h4>
            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {binder.canonicalEntities.map((ent: any) => (
                <div
                  key={ent.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ent.canonicalName}</span>
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)' }}>
                      {formatCategory(ent.entityCategory)}
                    </span>
                    <span className={`badge badge-${ent.overallClearanceStatus}`} style={{ fontSize: '0.65rem' }}>
                      {formatStatus(ent.overallClearanceStatus)}
                    </span>
                  </div>
                  <div className="no-print" style={{ display: 'flex', gap: '6px' }}>
                    {onJumpToEvidence && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                        onClick={() =>
                          onJumpToEvidence(
                            ent.id,
                            ent.canonicalName,
                            binder.citationsIndex?.filter((c: any) => c.query?.toLowerCase().includes(ent.canonicalName.toLowerCase())),
                            ent.description,
                            ent.overallClearanceStatus
                          )
                        }
                      >
                        🔍 View Evidence
                      </button>
                    )}
                    {onJumpToTimeline && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                        onClick={() => onJumpToTimeline(ent.id, ent.canonicalName)}
                      >
                        📜 View Timeline
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <div className="no-print" style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      {onJumpToEvidence && (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          onClick={() =>
                            onJumpToEvidence(
                              rep.canonicalEntityId || rep.id,
                              rep.targetEntityName || 'Original Entity',
                              rep.citations,
                              rep.rationale,
                              'ACTION_REQUIRED'
                            )
                          }
                        >
                          🔍 View Evidence
                        </button>
                      )}
                      {onJumpToTimeline && (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          onClick={() => onJumpToTimeline(rep.canonicalEntityId || rep.id, rep.targetEntityName || 'Original Entity')}
                        >
                          📜 View Timeline
                        </button>
                      )}
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
                    <div className="no-print" style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      {onJumpToEvidence && (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          onClick={() =>
                            onJumpToEvidence(
                              rep.canonicalEntityId || rep.id,
                              rep.fictionalBrandName,
                              rep.citations,
                              rep.rationale,
                              'NO_ISSUE_SURFACED'
                            )
                          }
                        >
                          🔍 View Evidence
                        </button>
                      )}
                      {onJumpToTimeline && (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          onClick={() => onJumpToTimeline(rep.canonicalEntityId || rep.id, rep.fictionalBrandName)}
                        >
                          📜 View Timeline
                        </button>
                      )}
                    </div>
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
