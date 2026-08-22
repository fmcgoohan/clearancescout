import React, { useState, useEffect } from 'react';
import { ScriptViewer, Scene, CounselOverrideItem } from '../components/ScriptViewer';
import { EntityRegistryTable, CanonicalEntity } from '../components/EntityRegistryTable';
import { ItemEditModal, EntityCategory } from '../components/ItemEditModal';
import { ComparisonModal, ComparisonViewModel } from '../components/ComparisonModal';
import { EntityDetailModal } from '../components/EntityDetailModal';
import { RightsModal } from '../components/RightsModal';
import { ActionListModal } from '../components/ActionListModal';
import { PlaceholderManagerModal } from '../components/PlaceholderManagerModal';
import { ProductionDashboardModal } from '../components/ProductionDashboardModal';
import { ScriptUploadModal } from '../components/ScriptUploadModal';
import { useBatchResearch } from '../hooks/useBatchResearch.js';
import { apiFetch } from '../utils/apiClient.js';
import { pluralize, getPlainLanguageSceneReason } from '../utils/formatters.js';
import {
  FilmIcon,
  FileTextIcon,
  LayersIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  HelpCircleIcon,
  XIcon,
} from '../components/icons/Icons';

interface WorkspacePageProps {
  projectId: string;
  onEvaluateClearance: (entityId: string) => void;
  onGenerateReplacement: (entityId: string) => void;
  onOpenCounselReview: (entityId: string, sceneId?: string) => void;
  onExportBinder?: () => void;
  onRefreshProjectSummary?: (snapshot?: any) => void | Promise<void>;
  isEvaluating: boolean;
  refreshTrigger: number;
  executionMode?: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  projectId,
  onEvaluateClearance,
  onGenerateReplacement,
  onOpenCounselReview,
  onExportBinder,
  onRefreshProjectSummary,
  isEvaluating,
  refreshTrigger,
  executionMode = 'DEMO_MODE',
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [entities, setEntities] = useState<CanonicalEntity[]>([]);
  const [overrides, setOverrides] = useState<CounselOverrideItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalInitialMode, setUploadModalInitialMode] = useState<'FILE' | 'PASTE' | 'DEMO'>('FILE');
  const [scriptFormat, setScriptFormat] = useState<'PLAINTEXT' | 'FOUNTAIN' | 'PDF'>('PLAINTEXT');

  // Edit / Add modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [entityToEdit, setEntityToEdit] = useState<CanonicalEntity | null>(null);

  // Comparison modal state
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonViewModel | null>(null);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);

  // Occurrences Detail modal state (Phase 2)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailEntityId, setSelectedDetailEntityId] = useState<string | null>(null);

  // Rights modal state (Phase 4)
  const [isRightsModalOpen, setIsRightsModalOpen] = useState(false);
  const [rightsEntityId, setRightsEntityId] = useState<string | null>(null);
  const [rightsEntityName, setRightsEntityName] = useState<string>('');

  // Scene Readiness summary state (Phase 5)
  const [readinessSummary, setReadinessSummary] = useState<{
    totalScenes: number;
    redScenesCount: number;
    workingClearScenesCount: number;
    finalClearScenesCount: number;
    overallReadinessPercentage: number;
  } | null>(null);

  // Action Center modal state (Phase 6)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [openActionsCount, setOpenActionsCount] = useState(0);

  // Placeholder Manager modal state (Phase 7)
  const [isPlaceholderModalOpen, setIsPlaceholderModalOpen] = useState(false);
  const [placeholderEntityId, setPlaceholderEntityId] = useState<string | null>(null);
  const [placeholderEntityName, setPlaceholderEntityName] = useState<string>('');
  const [placeholderEntityCategory, setPlaceholderEntityCategory] = useState<string>('BRAND');

  // Operations Dashboard modal state (Phase 9)
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);

  // Ingestion feedback toast banner (Feature 021)
  const [ingestionToast, setIngestionToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Batch research hook
  const { progress: batchProgress, startBatchResearch } = useBatchResearch(
    projectId,
    () => {
      fetchWorkspaceData();
    }
  );

  const defaultFictionalDemoScript = `TITLE: THE NEON HORIZON
AUTHOR: Entrant Studio Team
FORMAT: Feature Screenplay Excerpt (Fully Fictional Assets)

INT. PENTHOUSE WORKSPACE - NIGHT

Rain lashes against floor-to-ceiling glass overlooking the neon cityscape.

ALEX (30s) sits at a curved glass desk. He taps the illuminated keyboard of his AeroTech Prism Laptop. Data streams across the transparent display.

On the desk rests a chilled crimson can of Summit Cola. Alex pops the tab and takes a drink.

Across the room, an ambient holo-screen broadcasts an archival profile of Elena Vance delivering her landmark keynote on orbital power grids.

From the spatial audio system, the atmospheric synth-rock melody of Nocturne of the Wild plays softly in the background.

EXT. MIDTOWN SPIRE TOWER - NIGHT

Down on the wet asphalt, streetlights reflect in glistening puddles.

JORDAN (20s) steers a sleek metallic silver Veloce GT sports coupe into the private circular driveway directly beneath the soaring art-deco arches of the Midtown Spire Tower.

Jordan steps out, locking the car with a subtle chime.

INT. INDUSTRIAL SUB-LEVEL - NIGHT

Jordan walks through the reinforced maintenance corridor.

Along the heavy steel bulkhead, a weathered warning sign is bolted to the wall: a bold yellow-and-black Titan Industrial Hazard Placard flashing an active circuit warning.

Jordan inputs the security code. The hydraulic lock hisses open.`;

  const fetchWorkspaceData = async () => {
    if (!projectId) return;
    try {
      const [scenesRes, entitiesRes, readinessRes, actionsRes] = await Promise.all([
        apiFetch(`/api/projects/${projectId}/scenes`),
        apiFetch(`/api/projects/${projectId}/entities`),
        apiFetch(`/api/projects/${projectId}/scenes/readiness`),
        apiFetch(`/api/projects/${projectId}/actions?status=OPEN`),
      ]);

      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        setOpenActionsCount(Array.isArray(actionsData) ? actionsData.length : 0);
      }

      let readinessMap = new Map<string, any>();
      if (readinessRes.ok) {
        const readinessData = await readinessRes.json();
        setReadinessSummary(readinessData);
        if (Array.isArray(readinessData.scenes)) {
          readinessData.scenes.forEach((s: any) => readinessMap.set(s.sceneId, s));
        }
      }

      if (scenesRes.ok) {
        const scenesData: Scene[] = await scenesRes.json();
        const mappedScenes = scenesData.map((s) => {
          const readiness = readinessMap.get(s.id);
          return {
            ...s,
            readinessStatus: readiness ? readiness.status : s.readinessStatus,
            readinessDetails: readiness || s.readinessDetails,
          };
        });
        setScenes(mappedScenes);
      }

      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        setEntities(entitiesData);

        // Fetch all entity overrides in parallel
        try {
          const overridePromises = entitiesData.map(async (ent: any) => {
            try {
              const ovrRes = await apiFetch(`/api/projects/${projectId}/entities/${ent.id}/overrides`);
              if (ovrRes.ok) {
                const ovrData = await ovrRes.json();
                return ovrData.overrides || [];
              }
            } catch {
              return [];
            }
            return [];
          });
          const nestedOverrides = await Promise.all(overridePromises);
          setOverrides(nestedOverrides.flat());
        } catch {
          // ignore
        }
      }
      if (onRefreshProjectSummary) {
        await Promise.resolve(onRefreshProjectSummary());
      }
    } catch (err) {
      console.error('Failed to fetch workspace data:', err);
    }
  };

  const applyWorkspaceSnapshot = (snapshot: any) => {
    if (!snapshot) return;
    if (Array.isArray(snapshot.scenes)) {
      let readinessMap = new Map<string, any>();
      if (snapshot.readiness?.scenes && Array.isArray(snapshot.readiness.scenes)) {
        snapshot.readiness.scenes.forEach((s: any) => readinessMap.set(s.sceneId, s));
      }
      const mappedScenes = snapshot.scenes.map((s: any) => {
        const readiness = readinessMap.get(s.id);
        return {
          ...s,
          readinessStatus: readiness ? readiness.status : s.readinessStatus,
          readinessDetails: readiness || s.readinessDetails,
        };
      });
      setScenes(mappedScenes);
    }
    if (Array.isArray(snapshot.entities)) {
      setEntities(snapshot.entities);
    }
    if (Array.isArray(snapshot.overrides)) {
      setOverrides(snapshot.overrides);
    }
    if (snapshot.readiness) {
      setReadinessSummary(snapshot.readiness);
    }
    if (snapshot.actionsSummary) {
      setOpenActionsCount(snapshot.actionsSummary.openActions || 0);
    }
    onRefreshProjectSummary?.(snapshot);
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [projectId, refreshTrigger]);

  const handleParseScript = async (textToParse: string, format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF') => {
    if (!projectId) return;
    setIsUploading(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: textToParse, format }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
          applyWorkspaceSnapshot(data.snapshot);
        } else {
          await fetchWorkspaceData();
        }
      }
    } catch (err) {
      console.error('Error parsing script:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSampleScreenplay = () => {
    setUploadModalInitialMode('DEMO');
    setIsUploadModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEntityToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (entity: CanonicalEntity) => {
    setEntityToEdit(entity);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (data: {
    canonicalName: string;
    entityCategory: EntityCategory;
    description: string;
    sceneId?: string;
  }) => {
    if (!projectId) return;

    if (entityToEdit) {
      // Edit existing entity
      const res = await apiFetch(`/api/projects/${projectId}/entities/${entityToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to update item.');
      }
    } else {
      // Add new entity
      const res = await apiFetch(`/api/projects/${projectId}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create item.');
      }
    }
    await fetchWorkspaceData();
  };

  const handleDeleteItem = async (entityId: string) => {
    if (!projectId) return;
    try {
      const res = await apiFetch(`/api/projects/${projectId}/entities/${entityId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error('Failed to delete entity:', err);
    }
  };

  const handleRetryResearch = async (entityId: string) => {
    if (!projectId) return;
    try {
      const res = await apiFetch(`/api/projects/${projectId}/entities/${entityId}/retry-research`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error('Failed to retry research on entity:', err);
    }
  };

  const handleOpenComparison = async (entityId: string) => {
    if (!projectId) return;
    setIsComparisonModalOpen(true);
    setIsComparisonLoading(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/entities/${entityId}/comparison`);
      if (res.ok) {
        const data = await res.json();
        setComparisonData(data);
      } else {
        const errJson = await res.json();
        console.error('Error fetching comparison:', errJson.error);
      }
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    } finally {
      setIsComparisonLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Upload & Controls Panel */}
      <div className="glass-panel responsive-stack" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Multi-Format Script Ingestion & 5-Category Resolution
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Extract scenes, highlight in-line occurrences, and review legal counsel overrides.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary touch-target"
            aria-label="Load Bundled Fictional Demo Screenplay"
            onClick={handleLoadSampleScreenplay}
            disabled={isUploading}
            style={{
              borderColor: 'var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🎬 Load Sample Screenplay
          </button>

          <select
            aria-label="Select screenplay format"
            value={scriptFormat}
            onChange={(e) => setScriptFormat(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              minHeight: '38px',
            }}
          >
            <option value="PLAINTEXT">Plaintext (.txt)</option>
            <option value="FOUNTAIN">Fountain (.fountain)</option>
            <option value="PDF">Screenplay PDF (.pdf)</option>
          </select>

          <button
            className="btn-primary touch-target"
            aria-label="Upload Screenplay File (.fountain, .txt, .pdf)"
            onClick={() => {
              setUploadModalInitialMode('FILE');
              setIsUploadModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FilmIcon size={16} />
            <span>Upload Screenplay</span>
          </button>

          <button
            className="btn-secondary touch-target"
            aria-label={`Open Department Action & Notification Center (${openActionsCount} Department Tasks)`}
            onClick={() => setIsActionModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: openActionsCount > 0 ? '1px solid var(--status-action)' : '1px solid var(--border-color)',
              color: openActionsCount > 0 ? 'var(--status-action)' : 'var(--text-main)',
            }}
          >
            <FileTextIcon size={16} />
            <span>Department Tasks ({openActionsCount})</span>
          </button>

          <button
            className="btn-secondary touch-target"
            aria-label="Open Production Operations Dashboard"
            onClick={() => setIsDashboardModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'var(--accent-cyan)',
              color: 'var(--accent-cyan)',
            }}
          >
            <LayersIcon size={16} />
            <span>Operations Dashboard</span>
          </button>
        </div>
      </div>

      {/* Accessible Ingestion Success Toast Banner (Feature 021) */}
      {ingestionToast && (
        <div
          role="status"
          aria-live="polite"
          className="glass-panel"
          style={{
            padding: '12px 20px',
            background: 'var(--status-no-issue-bg)',
            border: '1px solid var(--status-no-issue-border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: 'var(--status-no-issue)',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircleIcon size={18} />
            <span>{ingestionToast.message}</span>
          </div>
          <button
            onClick={() => setIngestionToast(null)}
            className="btn-secondary touch-target"
            aria-label="Dismiss ingestion notification"
            style={{
              padding: '2px 8px',
              fontSize: '0.75rem',
              borderColor: 'var(--status-no-issue-border)',
              color: 'var(--status-no-issue)',
              minHeight: '28px',
            }}
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Hero Readiness Index Card (Constitution v1.1.0 Article 4: The Hero Is the Answer) */}
      {scenes.length > 0 && readinessSummary && (
        <div
          className="glass-panel hero-animate"
          style={{
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            background: 'var(--bg-secondary)',
            borderLeft:
              readinessSummary.redScenesCount > 0
                ? '6px solid var(--status-action)'
                : readinessSummary.workingClearScenesCount > 0
                ? '6px solid var(--status-review)'
                : '6px solid var(--status-no-issue)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
              Film Production Readiness Metrics
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {pluralize(readinessSummary?.totalScenes ?? scenes.length, 'Scene')} Total
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: 'var(--status-no-issue-bg)',
                  color: 'var(--status-no-issue)',
                  border: '1px solid var(--status-no-issue-border)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircleIcon size={14} />
                <span>Final Clear: {readinessSummary.finalClearScenesCount}</span>
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: 'var(--status-review-bg)',
                  color: 'var(--status-review)',
                  border: '1px solid var(--status-review-border)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangleIcon size={14} />
                <span>Working Clear: {readinessSummary.workingClearScenesCount}</span>
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: 'var(--status-action-bg)',
                  color: 'var(--status-action)',
                  border: '1px solid var(--status-action-border)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                className={readinessSummary.redScenesCount > 0 ? 'pulse-block-signal' : ''}
              >
                <XCircleIcon size={14} />
                <span>Red (Blocked): {readinessSummary.redScenesCount}</span>
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Shooting Readiness Index
            </div>
            <div
              style={{
                fontSize: '2.75rem',
                fontWeight: 900,
                lineHeight: 1,
                color:
                  readinessSummary.overallReadinessPercentage === 100
                    ? 'var(--status-no-issue)'
                    : readinessSummary.redScenesCount > 0
                    ? 'var(--status-action)'
                    : 'var(--status-review)',
                marginTop: '4px',
              }}
            >
              {readinessSummary.overallReadinessPercentage}%
            </div>
          </div>
        </div>
      )}

      {/* Per-Scene Readiness Reason Cards Grid (Feature 023 Section 2) */}
      {scenes.length > 0 && (
        <div className="scene-readiness-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {scenes.map((s) => {
            const isRed = s.readinessStatus === 'RED';
            const isWorking = s.readinessStatus === 'WORKING_CLEAR';
            const borderColor = isRed ? 'var(--status-action)' : isWorking ? 'var(--status-review)' : 'var(--status-no-issue)';
            const bgColor = isRed ? 'var(--status-action-bg)' : isWorking ? 'var(--status-review-bg)' : 'var(--status-no-issue-bg)';
            const textColor = isRed ? 'var(--status-action)' : isWorking ? 'var(--status-review)' : 'var(--status-no-issue)';
            const borderChip = isRed ? 'var(--status-action-border)' : isWorking ? 'var(--status-review-border)' : 'var(--status-no-issue-border)';
            const statusLabel = isRed ? 'BLOCKS SHOOTING' : isWorking ? 'WORKING CLEAR' : 'FINAL CLEAR';

            return (
              <div
                key={s.id}
                className="glass-panel scene-readiness-card"
                onClick={() => setSelectedSceneId(s.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  borderLeft: `6px solid ${borderColor}`,
                  borderTop: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      SCENE {s.sceneNumber}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {s.locationType || (s.heading?.startsWith('EXT') ? 'EXT' : 'INT')} • {s.timeOfDay || 'DAY'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: bgColor,
                      color: textColor,
                      border: `1px solid ${borderChip}`,
                      fontWeight: 700,
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {s.heading}
                </div>
                <div
                  className="scene-why-blocked-reason"
                  style={{
                    fontSize: '0.78rem',
                    color: isRed ? '#fca5a5' : isWorking ? '#fde68a' : 'var(--text-muted)',
                    lineHeight: 1.4,
                  }}
                >
                  {getPlainLanguageSceneReason(s)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid Workspace - Responsive Stacking */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <ScriptViewer
          scenes={scenes}
          entities={entities}
          overrides={overrides}
          selectedSceneId={selectedSceneId}
          onSelectScene={setSelectedSceneId}
          onEntityClick={(entityId, sceneId) => onOpenCounselReview(entityId, sceneId)}
        />
        <EntityRegistryTable
          entities={entities}
          scenes={scenes}
          selectedSceneId={selectedSceneId}
          onEvaluateClearance={onEvaluateClearance}
          onEvaluateBatch={startBatchResearch}
          batchProgress={batchProgress}
          onRetryResearch={handleRetryResearch}
          onGenerateReplacement={onGenerateReplacement}
          onOpenCounselReview={(entityId) => onOpenCounselReview(entityId, selectedSceneId || undefined)}
          onOpenRightsModal={(entityId, entityName) => {
            setRightsEntityId(entityId);
            setRightsEntityName(entityName);
            setIsRightsModalOpen(true);
          }}
          onOpenPlaceholderModal={(entityId, entityName, entityCategory) => {
            setPlaceholderEntityId(entityId);
            setPlaceholderEntityName(entityName);
            setPlaceholderEntityCategory(entityCategory || 'BRAND');
            setIsPlaceholderModalOpen(true);
          }}
          onOpenComparison={handleOpenComparison}
          onViewOccurrences={(entityId) => {
            setSelectedDetailEntityId(entityId);
            setIsDetailModalOpen(true);
          }}
          onEditItem={handleOpenEditModal}
          onDeleteItem={handleDeleteItem}
          onAddItem={handleOpenAddModal}
          isEvaluating={isEvaluating}
        />
      </div>

      {/* Item Add / Edit Modal */}
      <ItemEditModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        entityToEdit={entityToEdit}
        scenes={scenes.map((s) => ({ id: s.id, sceneNumber: s.sceneNumber, heading: s.heading }))}
        existingEntities={entities}
      />

      {/* Side-by-Side Original and Replacement Comparison Modal */}
      <ComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        data={comparisonData}
        isLoading={isComparisonLoading}
      />

      {/* Occurrence-Level Detail & Evaluation Modal (Phase 2) */}
      <EntityDetailModal
        projectId={projectId}
        entityId={selectedDetailEntityId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailEntityId(null);
        }}
        onOpenCounselReview={(entityId, sceneId) => {
          setIsDetailModalOpen(false);
          onOpenCounselReview(entityId, sceneId);
        }}
        onOpenRightsModal={(entityId, entityName) => {
          setIsDetailModalOpen(false);
          setRightsEntityId(entityId);
          setRightsEntityName(entityName);
          setIsRightsModalOpen(true);
        }}
        onOpenPlaceholderModal={(entityId, entityName) => {
          setIsDetailModalOpen(false);
          setPlaceholderEntityId(entityId);
          setPlaceholderEntityName(entityName);
          setPlaceholderEntityCategory('BRAND');
          setIsPlaceholderModalOpen(true);
        }}
        onOccurrenceEvaluated={() => {
          fetchWorkspaceData();
        }}
      />

      {/* Rights & Restrictions Modal (Phase 4) */}
      <RightsModal
        projectId={projectId}
        entityId={rightsEntityId}
        entityName={rightsEntityName}
        isOpen={isRightsModalOpen}
        onClose={() => {
          setIsRightsModalOpen(false);
          setRightsEntityId(null);
          setRightsEntityName('');
        }}
        onRightsUpdated={() => {
          fetchWorkspaceData();
        }}
      />

      {/* Department Action & Notification Center Modal (Phase 6) */}
      <ActionListModal
        projectId={projectId}
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onActionUpdated={() => {
          fetchWorkspaceData();
        }}
      />

      {/* Generalized Replacement & Placeholder Manager Modal (Phase 7) */}
      <PlaceholderManagerModal
        projectId={projectId}
        entityId={placeholderEntityId}
        entityName={placeholderEntityName}
        entityCategory={placeholderEntityCategory}
        isOpen={isPlaceholderModalOpen}
        onClose={() => {
          setIsPlaceholderModalOpen(false);
          setPlaceholderEntityId(null);
          setPlaceholderEntityName('');
        }}
        onPlaceholderUpdated={() => {
          fetchWorkspaceData();
        }}
      />

      {/* Production Clearance Operations Dashboard Modal (Phase 9) */}
      <ProductionDashboardModal
        projectId={projectId}
        isOpen={isDashboardModalOpen}
        onClose={() => setIsDashboardModalOpen(false)}
        onMitigateRights={(canonicalEntityId) => {
          const ent = entities.find((e) => e.id === canonicalEntityId);
          setRightsEntityId(canonicalEntityId);
          setRightsEntityName(ent?.canonicalName || 'Selected Entity');
          setIsRightsModalOpen(true);
        }}
        onMitigatePlaceholder={(canonicalEntityId) => {
          const ent = entities.find((e) => e.id === canonicalEntityId);
          setPlaceholderEntityId(canonicalEntityId);
          setPlaceholderEntityName(ent?.canonicalName || 'Selected Entity');
          setPlaceholderEntityCategory(ent?.entityCategory || 'BRAND');
          setIsPlaceholderModalOpen(true);
        }}
        onMitigateOverride={(canonicalEntityId) => {
          onOpenCounselReview(canonicalEntityId);
        }}
      />

      {/* Screenplay Multipart File-Picker & Upload Modal (Feature 019 / 021) */}
      <ScriptUploadModal
        projectId={projectId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        hasExistingScenes={scenes.length > 0}
        initialMode={uploadModalInitialMode}
        executionMode={executionMode}
        onUploadSuccess={async (snapshot, meta) => {
          const scenesCount = Array.isArray(snapshot?.scenes) ? snapshot.scenes.length : (meta?.scenesCount ?? scenes.length);
          const entitiesCount = Array.isArray(snapshot?.entities) ? snapshot.entities.length : (meta?.entitiesCount ?? entities.length);
          const tasksCount = snapshot?.actionsSummary?.openActions !== undefined ? snapshot.actionsSummary.openActions : (meta?.openActionsCount ?? openActionsCount);
          const actionText = meta?.reingestMode === 'MERGE' ? 'merged as new version' : 'replaced successfully';

          if (snapshot) {
            applyWorkspaceSnapshot(snapshot);
          } else {
            await fetchWorkspaceData();
          }

          if (onRefreshProjectSummary) {
            await Promise.resolve(onRefreshProjectSummary(snapshot));
          }

          setIngestionToast({
            message: `Screenplay ${actionText} — ${pluralize(scenesCount, 'scene')} processed · ${pluralize(entitiesCount, 'entity', 'entities')} registered · ${pluralize(tasksCount, 'department task', 'department tasks')} created`,
            type: 'success',
          });
        }}
      />
    </div>
  );
};
