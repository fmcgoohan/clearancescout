import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiClient.js';
import { pluralize, formatStatus, formatCategory, formatExplanationText } from '../utils/formatters.js';
import { TERMINOLOGY } from '../constants/terminology.js';
import { useModalFocus } from '../hooks/useModalFocus.js';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LayersIcon,
  XIcon,
  ChevronRightIcon,
} from './icons/Icons';

export interface ProductionDashboardKPIs {
  totalScenes: number;
  finalClearScenes: number;
  workingClearScenes: number;
  redScenes: number;
  readinessPercentage: number;
  totalEntities: number;
  criticalBlockersCount: number;
  activePlaceholdersCount: number;
  rightsExpiringSoonCount: number;
  pendingActionsCount: number;
}

export interface BlockerItemDetail {
  sceneId: string;
  sceneNumber: number;
  heading: string;
  occurrenceId: string;
  canonicalEntityId: string;
  canonicalName: string;
  clearanceStatus: string;
  riskRationale: string;
}

export interface ExpiringRightsDetail {
  rightsId: string;
  canonicalEntityId: string;
  canonicalName: string;
  agreementName: string;
  licensor: string;
  expirationDate: string;
  daysRemaining: number;
}

export interface ActivePlaceholderDetail {
  id: string;
  canonicalEntityId: string;
  canonicalName: string;
  fictionalName: string;
  assetCategory: string;
  clearanceTier: 'TEMP_APPROVED' | 'FINAL_CLEARED';
  approvedBy: string;
}

export interface SceneReadinessDistributionItem {
  sceneId: string;
  sceneNumber: number;
  heading: string;
  status: 'FINAL_CLEAR' | 'WORKING_CLEAR' | 'RED';
  blockerCount: number;
  workingCount: number;
  totalOccurrences: number;
}

export interface ProductionDashboardData {
  projectId: string;
  projectTitle: string;
  projectType: string;
  kpis: ProductionDashboardKPIs;
  sceneReadinessDistribution: SceneReadinessDistributionItem[];
  shootBlockers: BlockerItemDetail[];
  expiringRights: ExpiringRightsDetail[];
  activePlaceholders: ActivePlaceholderDetail[];
  departmentActionsSummary: {
    ART_DEPT: number;
    LEGAL_COUNSEL: number;
    LOCATIONS: number;
    PRODUCTION_MGMT: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    label: string;
    timestamp: string;
  }>;
}

interface ProductionDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onMitigateRights?: (canonicalEntityId: string) => void;
  onMitigatePlaceholder?: (canonicalEntityId: string) => void;
  onMitigateOverride?: (canonicalEntityId: string) => void;
}

export const ProductionDashboardModal: React.FC<ProductionDashboardModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onMitigateRights,
  onMitigatePlaceholder,
  onMitigateOverride,
}) => {
  const [data, setData] = useState<ProductionDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedScenes, setCollapsedScenes] = useState<Record<string, boolean>>({});

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const fetchDashboard = async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/dashboard`);
      if (!res.ok) {
        throw new Error(`Failed to load dashboard data: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDashboard();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary, #181926)',
          border: '1px solid var(--border-color, #2d3142)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #2d3142)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary, #181926)',
          }}
        >
          <div>
            <h2 id="dashboard-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayersIcon size={20} className="text-cyan-400" />
              <span>Production Clearance Operations Dashboard</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Executive cockpit: Shooting readiness, critical blockers, rights expirations, and active department work queues.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-secondary touch-target"
              onClick={fetchDashboard}
              style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '34px', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={isLoading}
            >
              <span>Refresh</span>
            </button>
            <button
              className="btn-secondary touch-target"
              onClick={onClose}
              style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '34px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <XIcon size={14} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {error && (
            <div style={{ background: 'rgba(237, 135, 150, 0.1)', color: '#ed8796', padding: '12px', borderRadius: '8px', border: '1px solid rgba(237, 135, 150, 0.3)' }}>
              {error}
            </div>
          )}

          {isLoading && !data && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading consolidated production dashboard...
            </div>
          )}

          {data && (
            <>
              {/* Executive KPI Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                }}
              >
                {/* Readiness Score */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Shoot Readiness
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: data.kpis.readinessPercentage >= 80 ? '#a6da95' : data.kpis.readinessPercentage >= 50 ? '#eed49f' : '#ed8796', marginTop: '4px' }}>
                    {data.kpis.readinessPercentage}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {data.kpis.finalClearScenes} Final / {data.kpis.workingClearScenes} Working / {data.kpis.redScenes} Red
                  </div>
                </div>

                {/* Blocking Occurrences */}
                <div
                  style={{
                    background: 'rgba(237, 135, 150, 0.05)',
                    border: '1px solid rgba(237, 135, 150, 0.3)',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                  title={TERMINOLOGY.BLOCKING_OCCURRENCES_TOOLTIP}
                >
                  <div style={{ fontSize: '0.75rem', color: '#ed8796', textTransform: 'uppercase', fontWeight: 600 }}>
                    {TERMINOLOGY.BLOCKING_OCCURRENCES_LABEL}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ed8796', marginTop: '4px' }}>
                    {data.kpis.criticalBlockersCount}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {TERMINOLOGY.BLOCKING_OCCURRENCES_SUBTITLE}
                  </div>
                </div>

                {/* Active Placeholders */}
                <div
                  style={{
                    background: 'rgba(238, 212, 159, 0.05)',
                    border: '1px solid rgba(238, 212, 159, 0.3)',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#eed49f', textTransform: 'uppercase', fontWeight: 600 }}>
                    Active Placeholders
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#eed49f', marginTop: '4px' }}>
                    {data.kpis.activePlaceholdersCount}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Fictional Props / Music / Art
                  </div>
                </div>

                {/* Expiring Rights */}
                <div
                  style={{
                    background: 'rgba(145, 215, 227, 0.05)',
                    border: '1px solid rgba(145, 215, 227, 0.3)',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#91d7e3', textTransform: 'uppercase', fontWeight: 600 }}>
                    Rights Expiring (≤90d)
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#91d7e3', marginTop: '4px' }}>
                    {data.kpis.rightsExpiringSoonCount}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Active License Windows
                  </div>
                </div>

                {/* Open Department Tasks */}
                <div
                  style={{
                    background: 'rgba(198, 160, 246, 0.05)',
                    border: '1px solid rgba(198, 160, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                  title={TERMINOLOGY.TASKS_TOOLTIP}
                >
                  <div style={{ fontSize: '0.75rem', color: '#c6a0f6', textTransform: 'uppercase', fontWeight: 600 }}>
                    {TERMINOLOGY.TASKS_LABEL}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c6a0f6', marginTop: '4px' }}>
                    {data.kpis.pendingActionsCount}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Art: {data.departmentActionsSummary?.ART_DEPT || 0} | Legal: {data.departmentActionsSummary?.LEGAL_COUNSEL || 0} | Locations: {data.departmentActionsSummary?.LOCATIONS || 0} | Prod: {data.departmentActionsSummary?.PRODUCTION_MGMT || 0}
                  </div>
                </div>
              </div>

              {/* Multi-Occurrence Relationship Explanation Banner */}
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>
                  <strong>Count Relationship:</strong> {TERMINOLOGY.COUNT_RELATIONSHIP_EXPLANATION}
                </span>
              </div>

              {/* Scene Readiness Distribution */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px' }}>
                  Scene Readiness Overview
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {data.sceneReadinessDistribution.map((scn) => (
                    <div
                      key={scn.sceneId}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        background:
                          scn.status === 'FINAL_CLEAR'
                            ? 'rgba(166, 218, 149, 0.1)'
                            : scn.status === 'WORKING_CLEAR'
                            ? 'rgba(238, 212, 159, 0.1)'
                            : 'rgba(237, 135, 150, 0.15)',
                        border:
                          scn.status === 'FINAL_CLEAR'
                            ? '1px solid rgba(166, 218, 149, 0.3)'
                            : scn.status === 'WORKING_CLEAR'
                            ? '1px solid rgba(238, 212, 159, 0.3)'
                            : '1px solid rgba(237, 135, 150, 0.4)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        Scene {scn.sceneNumber}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color:
                            scn.status === 'FINAL_CLEAR'
                              ? '#a6da95'
                              : scn.status === 'WORKING_CLEAR'
                              ? '#eed49f'
                              : '#ed8796',
                          fontWeight: 600,
                          marginTop: '4px',
                        }}
                      >
                        {formatStatus(scn.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blocking Occurrences Triage Center */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ed8796', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{TERMINOLOGY.BLOCKING_OCCURRENCES_LABEL} Triage ({data.shootBlockers.length})</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Resolve via direct mitigation actions
                  </span>
                </div>

                {/* Why This Blocks Shooting Callout */}
                <div
                  style={{
                    background: 'rgba(237, 135, 150, 0.08)',
                    border: '1px solid rgba(237, 135, 150, 0.3)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '0.75rem',
                    color: '#ed8796',
                    marginBottom: '14px',
                    lineHeight: 1.4,
                  }}
                >
                  {TERMINOLOGY.WHY_SCENE_BLOCKS_SHOOTING}
                </div>

                {data.shootBlockers.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#a6da95', padding: '12px 0' }}>
                    No blocking occurrences! All scenes are cleared or covered by placeholders/rights.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Group by Scene (Collapsible) */}
                    {Object.entries(
                      data.shootBlockers.reduce((acc, blk) => {
                        const key = `Scene ${blk.sceneNumber}: ${blk.heading}`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(blk);
                        return acc;
                      }, {} as Record<string, BlockerItemDetail[]>)
                    ).map(([sceneHeading, blockers]) => {
                      const isCollapsed = collapsedScenes[sceneHeading] ?? false;
                      return (
                        <div
                          key={sceneHeading}
                          style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(237, 135, 150, 0.25)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                          }}
                        >
                          <button
                            type="button"
                            aria-expanded={!isCollapsed}
                            aria-label={`Toggle ${sceneHeading} (${pluralize(blockers.length, 'blocking occurrence', 'blocking occurrences')})`}
                            onClick={() => setCollapsedScenes((prev) => ({ ...prev, [sceneHeading]: !isCollapsed }))}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#ed8796',
                              marginBottom: isCollapsed ? 0 : '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              textAlign: 'left',
                            }}
                          >
                            <span>{isCollapsed ? '▸' : '▾'} {sceneHeading}</span>
                            <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
                              {pluralize(blockers.length, 'blocking occurrence', 'blocking occurrences')}
                            </span>
                          </button>
                          {!isCollapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {blockers.map((blk) => (
                                <div
                                  key={blk.occurrenceId}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.07)',
                                    borderRadius: '6px',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: '220px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                        {blk.canonicalName}
                                      </span>
                                      <span className="badge badge-ACTION_REQUIRED" style={{ fontSize: '0.65rem' }}>
                                        {formatStatus(blk.clearanceStatus)}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '4px', lineHeight: 1.4 }}>
                                      {formatExplanationText(blk.riskRationale)}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {onMitigatePlaceholder && (
                                      <button
                                        className="btn-secondary touch-target resolve-row-action"
                                        onClick={() => onMitigatePlaceholder(blk.canonicalEntityId)}
                                        style={{ fontSize: '0.7rem', padding: '4px 8px', borderColor: '#c6a0f6', color: '#c6a0f6', minHeight: '30px' }}
                                      >
                                        Placeholder
                                      </button>
                                    )}
                                    {onMitigateRights && (
                                      <button
                                        className="btn-secondary touch-target resolve-row-action"
                                        onClick={() => onMitigateRights(blk.canonicalEntityId)}
                                        style={{ fontSize: '0.7rem', padding: '4px 8px', borderColor: '#91d7e3', color: '#91d7e3', minHeight: '30px' }}
                                      >
                                        Attach Rights
                                      </button>
                                    )}
                                    {onMitigateOverride && (
                                      <button
                                        className="btn-secondary touch-target resolve-row-action"
                                        onClick={() => onMitigateOverride(blk.canonicalEntityId)}
                                        style={{ fontSize: '0.7rem', padding: '4px 8px', borderColor: '#f87171', color: '#f87171', minHeight: '30px' }}
                                      >
                                        Counsel Override
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expiring Rights & Active Placeholders Two-Column */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Expiring Rights */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
                    Upcoming Rights Expirations (≤ 90 Days)
                  </div>
                  {data.expiringRights.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      No active agreements expiring within 90 days.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {data.expiringRights.map((exp) => (
                        <div
                          key={exp.rightsId}
                          style={{
                            fontSize: '0.75rem',
                            background: 'rgba(0,0,0,0.15)',
                            padding: '8px 10px',
                            borderRadius: '4px',
                            border: exp.daysRemaining <= 30 ? '1px solid rgba(237, 135, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {exp.canonicalName}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: exp.daysRemaining <= 30 ? '#ed8796' : '#eed49f',
                                fontWeight: 600,
                              }}
                            >
                              {exp.daysRemaining} days remaining
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {exp.licensor} — {exp.agreementName} (Exp: {exp.expirationDate})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Placeholders */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
                    Active Production Placeholders
                  </div>
                  {data.activePlaceholders.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      No fictional replacements or placeholders registered.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {data.activePlaceholders.map((ph) => (
                        <div
                          key={ph.id}
                          style={{
                            fontSize: '0.75rem',
                            background: 'rgba(0,0,0,0.15)',
                            padding: '8px 10px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {ph.fictionalName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({ph.canonicalName})</span>
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: ph.clearanceTier === 'FINAL_CLEARED' ? 'rgba(166, 218, 149, 0.2)' : 'rgba(238, 212, 159, 0.2)',
                                color: ph.clearanceTier === 'FINAL_CLEARED' ? '#a6da95' : '#eed49f',
                                border: ph.clearanceTier === 'FINAL_CLEARED' ? '1px solid #a6da95' : '1px solid #eed49f',
                              }}
                            >
                              {formatStatus(ph.clearanceTier)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Category: {ph.assetCategory} | Approved by: {ph.approvedBy}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
