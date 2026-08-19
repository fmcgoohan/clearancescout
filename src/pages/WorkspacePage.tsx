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
import { useBatchResearch } from '../hooks/useBatchResearch.js';
import { apiFetch } from '../utils/apiClient.js';

interface WorkspacePageProps {
  projectId: string;
  onEvaluateClearance: (entityId: string) => void;
  onGenerateReplacement: (entityId: string) => void;
  onOpenCounselReview: (entityId: string, sceneId?: string) => void;
  isEvaluating: boolean;
  refreshTrigger: number;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  projectId,
  onEvaluateClearance,
  onGenerateReplacement,
  onOpenCounselReview,
  isEvaluating,
  refreshTrigger,
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [entities, setEntities] = useState<CanonicalEntity[]>([]);
  const [overrides, setOverrides] = useState<CounselOverrideItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

        // Fetch all entity overrides
        const allOverrides: CounselOverrideItem[] = [];
        for (const ent of entitiesData) {
          try {
            const ovrRes = await apiFetch(`/api/projects/${projectId}/entities/${ent.id}/overrides`);
            if (ovrRes.ok) {
              const ovrData = await ovrRes.json();
              if (ovrData.overrides) {
                allOverrides.push(...ovrData.overrides);
              }
            }
          } catch (e) {
            // continue
          }
        }
        setOverrides(allOverrides);
      }
    } catch (err) {
      console.error('Failed to fetch workspace data:', err);
    }
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
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error('Error parsing script:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSampleScreenplay = async () => {
    try {
      const fixtureRes = await apiFetch('/api/fixtures/demo-screenplay');
      let scriptToIngest = defaultFictionalDemoScript;
      if (fixtureRes.ok) {
        const data = await fixtureRes.json();
        if (data.scriptText) {
          scriptToIngest = data.scriptText;
        }
      }
      await handleParseScript(scriptToIngest, 'PLAINTEXT');
    } catch (err) {
      await handleParseScript(defaultFictionalDemoScript, 'PLAINTEXT');
    }
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
            aria-label="Ingest screenplay text into workspace"
            onClick={() => handleParseScript(defaultFictionalDemoScript, scriptFormat)}
            disabled={isUploading}
          >
            {isUploading ? 'Parsing...' : 'Ingest Screenplay'}
          </button>

          <button
            className="btn-secondary touch-target"
            aria-label="Open Department Action & Notification Center"
            onClick={() => setIsActionModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: openActionsCount > 0 ? '1px solid #f87171' : '1px solid var(--border-color)',
              color: openActionsCount > 0 ? '#f87171' : 'var(--text-main)',
            }}
          >
            📋 Actions ({openActionsCount})
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
            📊 Operations Dashboard
          </button>
        </div>
      </div>

      {/* Phase 5 Scene Shooting Readiness Banner */}
      {scenes.length > 0 && readinessSummary && (
        <div
          className="glass-panel"
          style={{
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderLeft:
              readinessSummary.redScenesCount > 0
                ? '4px solid #f87171'
                : readinessSummary.workingClearScenesCount > 0
                ? '4px solid #fbbf24'
                : '4px solid #34d399',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
              🎬 Scene Shooting Readiness ({readinessSummary.totalScenes} Scenes):
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                fontWeight: 600,
              }}
            >
              🟢 Final Clear: {readinessSummary.finalClearScenesCount}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                fontWeight: 600,
              }}
            >
              🟡 Working Clear: {readinessSummary.workingClearScenesCount}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                fontWeight: 600,
              }}
            >
              🔴 Red (Blocked): {readinessSummary.redScenesCount}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
            Shooting Readiness Index: {readinessSummary.overallReadinessPercentage}%
          </div>
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
    </div>
  );
};
