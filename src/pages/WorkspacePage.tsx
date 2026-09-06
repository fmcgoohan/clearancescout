import React, { useState, useEffect, useId, useRef } from 'react';
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
import { RecommendedActionCard } from '../components/RecommendedActionCard';
import { OnboardingBanner } from '../components/OnboardingBanner';
import { Icon } from '../components/icons/Icon';
import { TERMINOLOGY } from '../constants/terminology';



interface WorkspacePageProps {
  projectId: string;
  projectTitle?: string;
  isSwitchingProject?: boolean;
  onEvaluateClearance: (entityId: string) => void;
  onGenerateReplacement: (entityId: string) => void;
  onOpenCounselReview: (entityId: string, sceneId?: string, preloadedEntity?: any) => void;
  onExportBinder?: () => void;
  onRefreshProjectSummary?: (snapshot?: any) => void | Promise<void>;
  isEvaluating: boolean;
  refreshTrigger: number;
  executionMode?: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  projectId,
  projectTitle,
  isSwitchingProject = false,
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
    projectId?: string;
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

  // Responsive Panel Collapse State
  const [isScriptCollapsed, setIsScriptCollapsed] = useState(false);

  // Contextual Collapsible Screenplay Intake State (Section 4)
  const [isIntakeCollapsed, setIsIntakeCollapsed] = useState<boolean>(() => {
    if (!projectId) return true;
    const stored = localStorage.getItem(`clearancescout:intake_collapsed:v1:${projectId}`);
    return stored !== null ? stored === 'true' : true;
  });

  // Readiness card disclosure state (Section 5)
  const [expandedReadiness, setExpandedReadiness] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (projectId) {
      const stored = localStorage.getItem(`clearancescout:intake_collapsed:v1:${projectId}`);
      setIsIntakeCollapsed(stored !== null ? stored === 'true' : true);
    }
  }, [projectId]);

  const toggleIntakeCollapsed = () => {
    setIsIntakeCollapsed((prev) => {
      const next = !prev;
      if (projectId) {
        localStorage.setItem(`clearancescout:intake_collapsed:v1:${projectId}`, String(next));
      }
      return next;
    });
  };

  const toggleReadinessCard = (sceneId: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setExpandedReadiness((prev) => ({ ...prev, [sceneId]: !prev[sceneId] }));
  };

  // Phase 2 Workspace Section Tab Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'screenplay' | 'clearance' | 'tasks'>('overview');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');
  const [isHydrating, setIsHydrating] = useState<boolean>(false);

  // URL Deep-Linking & Section Sync (FR-019)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['overview', 'screenplay', 'clearance', 'tasks'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    } catch (e) {
      console.warn('Failed to parse URL query params:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (activeTab && params.get('tab') !== activeTab) {
        params.set('tab', activeTab);
        const newSearch = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState(null, '', newSearch);
      }
    } catch (e) {
      // Ignore in non-browser environments
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['overview', 'screenplay', 'clearance', 'tasks'].includes(tabParam)) {
          setActiveTab(tabParam as any);
        }
      } catch (e) {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const lastLoadedProjectIdRef = useRef<string | null>(null);
  const activeProjectIdRef = useRef(projectId);
  useEffect(() => {
    activeProjectIdRef.current = projectId;
  }, [projectId]);

  const fetchWorkspaceData = async () => {
    if (!projectId) return;
    const targetId = projectId;
    const isProjectSwitch = lastLoadedProjectIdRef.current !== targetId;
    activeProjectIdRef.current = projectId;
    setIsHydrating(true);
    if (isProjectSwitch) {
      setReadinessSummary(null);
      setScenes([]);
      setEntities([]);
    }
    try {
      const [scenesRes, entitiesRes, readinessRes, actionsRes, snapshotRes] = await Promise.all([
        apiFetch(`/api/projects/${targetId}/scenes`),
        apiFetch(`/api/projects/${targetId}/entities`),
        apiFetch(`/api/projects/${targetId}/scenes/readiness`),
        apiFetch(`/api/projects/${targetId}/actions?status=OPEN`),
        apiFetch(`/api/projects/${targetId}/snapshot`),
      ]);

      if (targetId !== activeProjectIdRef.current) {
        console.log(`[WorkspacePage] fetchWorkspaceData DISCARDING stale result for targetId="${targetId}" (active is "${activeProjectIdRef.current}")`);
        return;
      }

      let openCount = 0;
      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        openCount = Array.isArray(actionsData) ? actionsData.length : 0;
      }

      let readinessSummaryData: any = null;
      let readinessMap = new Map<string, any>();
      if (readinessRes.ok) {
        readinessSummaryData = await readinessRes.json();
        if (readinessSummaryData) {
          readinessSummaryData.projectId = targetId;
        }
        if (Array.isArray(readinessSummaryData?.scenes)) {
          readinessSummaryData.scenes.forEach((s: any) => readinessMap.set(s.sceneId, s));
        }
      }

      let mappedScenes: Scene[] = [];
      if (scenesRes.ok) {
        const scenesData: Scene[] = await scenesRes.json();
        mappedScenes = scenesData.map((s) => {
          const readiness = readinessMap.get(s.id);
          return {
            ...s,
            readinessStatus: readiness ? readiness.status : s.readinessStatus,
            readinessDetails: readiness || s.readinessDetails,
          };
        });
      }

      let fetchedEntities: any[] = [];
      let fetchedOverrides: any[] = [];
      if (entitiesRes.ok) {
        fetchedEntities = await entitiesRes.json();

        // Fetch all entity overrides in parallel
        try {
          const overridePromises = fetchedEntities.map(async (ent: any) => {
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
          fetchedOverrides = nestedOverrides.flat();
        } catch {
          // ignore
        }
      }

      let snapshotData: any = null;
      if (snapshotRes.ok) {
        snapshotData = await snapshotRes.json();
      }

      if (!readinessSummaryData && snapshotData?.readiness) {
        readinessSummaryData = snapshotData.readiness;
      }

      // Apply all state updates atomically in the same batch
      setOpenActionsCount(openCount);
      setReadinessSummary(readinessSummaryData);
      setScenes(mappedScenes);
      setEntities(fetchedEntities);
      setOverrides(fetchedOverrides);
      lastLoadedProjectIdRef.current = targetId;

      if (onRefreshProjectSummary) {
        await Promise.resolve(onRefreshProjectSummary(snapshotData));
      }
    } catch (err) {
      console.error('Failed to fetch workspace data:', err);
    } finally {
      setIsHydrating(false);
    }
  };

  const applyWorkspaceSnapshot = (snapshot: any) => {
    if (!snapshot) return;
    if (projectId) {
      lastLoadedProjectIdRef.current = projectId;
    }
    if (Array.isArray(snapshot.scenes) && snapshot.scenes.length > 0) {
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
    const incomingEntities = Array.isArray(snapshot.entities)
      ? snapshot.entities
      : Array.isArray(snapshot.canonicalEntities)
      ? snapshot.canonicalEntities
      : null;
    if (incomingEntities && incomingEntities.length > 0) {
      setEntities(incomingEntities);
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
    setIsHydrating(false);
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
      {isSwitchingProject ? (
        <div
          data-testid="switching-production-indicator"
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            margin: '20px 0',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
            Switching production...
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Loading script version, clearance items, and shooting readiness snapshot...
          </p>
        </div>
      ) : (
        <>
          {/* Active Production Workspace Heading for Accessibility Focus */}
          <h1
            id="workspace-production-heading"
            tabIndex={-1}
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {projectTitle || 'Production Clearance Workspace'}
          </h1>

          {/* Workspace Section Navigation Bar (User Story 17) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '12px',
              marginBottom: '4px',
              maxWidth: '100%',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div
              role="tablist"
              aria-label="Workspace Sections"
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                maxWidth: '100%',
                paddingBottom: '4px',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                flexShrink: 1,
              }}
            >
              <button
                role="tab"
                id="tab-overview"
                aria-selected={activeTab === 'overview'}
                aria-controls="section-overview"
                className={`btn-secondary touch-target ${activeTab === 'overview' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('overview')}
                style={{
                  background: activeTab === 'overview' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  borderColor: activeTab === 'overview' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: activeTab === 'overview' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'overview' ? 700 : 500,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Overview
              </button>
              <button
                role="tab"
                id="tab-screenplay"
                aria-selected={activeTab === 'screenplay'}
                aria-controls="section-screenplay"
                className={`btn-secondary touch-target ${activeTab === 'screenplay' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('screenplay')}
                style={{
                  background: activeTab === 'screenplay' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  borderColor: activeTab === 'screenplay' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: activeTab === 'screenplay' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'screenplay' ? 700 : 500,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Screenplay ({pluralize(scenes.length, 'scene', 'scenes')})
              </button>
              <button
                role="tab"
                id="tab-clearance"
                aria-selected={activeTab === 'clearance'}
                aria-controls="section-clearance"
                className={`btn-secondary touch-target ${activeTab === 'clearance' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('clearance')}
                style={{
                  background: activeTab === 'clearance' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  borderColor: activeTab === 'clearance' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: activeTab === 'clearance' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'clearance' ? 700 : 500,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Clearance Items ({entities.length})
              </button>
              <button
                role="tab"
                id="tab-tasks"
                aria-selected={activeTab === 'tasks'}
                aria-controls="section-tasks"
                className={`btn-secondary touch-target ${activeTab === 'tasks' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('tasks')}
                style={{
                  background: activeTab === 'tasks' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  borderColor: activeTab === 'tasks' ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: activeTab === 'tasks' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'tasks' ? 700 : 500,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Department Tasks ({openActionsCount > 0 ? `${openActionsCount} Open` : '0 Open'})
              </button>
            </div>

            {/* Workspace Clearance Summary Indicator Bar */}
            <div
              data-testid="project-summary-bar"
              className="touch-target"
              aria-label={
                entities.length === 0
                  ? 'Project Summary: No clearance items recorded (0 entities)'
                  : `Project Summary: ${entities.length} Total Entities, ${entities.filter(e => e.overallClearanceStatus === 'NO_ISSUE_SURFACED').length} ${TERMINOLOGY.STATUS_CLEARED}, ${entities.filter(e => e.overallClearanceStatus === 'ACTION_REQUIRED').length} ${TERMINOLOGY.STATUS_ACTION_REQUIRED}, ${entities.filter(e => e.overallClearanceStatus === 'REVIEW_RECOMMENDED').length} ${TERMINOLOGY.STATUS_REVIEW_RECOMMENDED}`
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                background: 'rgba(0,0,0,0.3)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Summary:</span>
              {entities.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No clearance items recorded (0 entities)</span>
              ) : (
                <>
                  <span style={{ color: 'var(--status-no-issue)', fontWeight: 600 }}>
                    {entities.filter(e => e.overallClearanceStatus === 'NO_ISSUE_SURFACED').length} {TERMINOLOGY.STATUS_CLEARED}
                  </span>
                  {entities.filter(e => e.overallClearanceStatus === 'ACTION_REQUIRED').length > 0 && (
                    <span style={{ color: 'var(--status-action)', fontWeight: 600 }}>
                      {entities.filter(e => e.overallClearanceStatus === 'ACTION_REQUIRED').length} {TERMINOLOGY.STATUS_ACTION_REQUIRED}
                    </span>
                  )}
                  {entities.filter(e => e.overallClearanceStatus === 'REVIEW_RECOMMENDED').length > 0 && (
                    <span style={{ color: 'var(--status-review)', fontWeight: 600 }}>
                      {entities.filter(e => e.overallClearanceStatus === 'REVIEW_RECOMMENDED').length} {TERMINOLOGY.STATUS_REVIEW_RECOMMENDED}
                    </span>
                  )}
                  {entities.filter(e => e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE').length > 0 && (
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {entities.filter(e => e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE').length} {TERMINOLOGY.STATUS_INSUFFICIENT_EVIDENCE}
                    </span>
                  )}
                  <span style={{ color: 'var(--text-muted)' }}>({pluralize(entities.length, 'entity', 'entities')})</span>
                </>
              )}
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

      {/* Tab Panels with Real Content Switching */}
      {activeTab === 'overview' && (
        <section
          role="tabpanel"
          id="section-overview"
          aria-labelledby="tab-overview"
          tabIndex={0}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* Recommended Next Action Area (Hero Priority) */}
          {isHydrating ? (
            <div
              className="glass-panel"
              style={{
                padding: '24px 28px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'var(--accent-cyan)',
                  boxShadow: '0 0 12px var(--accent-cyan)',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Synchronizing Workspace Snapshot...
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Loading screenplay scenes, clearance items, and shooting readiness index.
                </div>
              </div>
            </div>
          ) : (
            <RecommendedActionCard
              entities={entities}
              hasScreenplay={scenes.length > 0}
              departmentTasksCount={openActionsCount}
              onSelectTab={(tab, filter) => {
                setActiveTab(tab);
                if (filter) setActiveStatusFilter(filter);
              }}
              onOpenUploadModal={() => {
                setUploadModalInitialMode('FILE');
                setIsUploadModalOpen(true);
              }}
              onExportBinder={onExportBinder}
              onResearchItem={(id) => onEvaluateClearance(id)}
              onLoadSample={async () => {
                try {
                  const res = await apiFetch(`/api/projects/${projectId}/script/demo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ autoEvaluate: true, includeSampleRights: true, includeSamplePlaceholders: true }),
                  });
                  if (res.ok) {
                    await fetchWorkspaceData();
                    if (onRefreshProjectSummary) {
                      await onRefreshProjectSummary();
                    }
                  }
                } catch (err) {
                  console.error('Error loading sample screenplay:', err);
                }
              }}
            />
          )}

          {/* Onboarding & Guidance Banner — Displayed Below Recommended Action Card, hidden once screenplay exists */}
          {scenes.length === 0 && (
            <OnboardingBanner
              projectId={projectId}
              onOpenDemo={() => {
                setUploadModalInitialMode('DEMO');
                setIsUploadModalOpen(true);
              }}
            />
          )}

          {/* Honest Empty State Banner if no scenes */}
          {scenes.length === 0 && (
            <div
              data-testid="workspace-empty-state"
              className="glass-panel"
              style={{
                padding: '32px 24px',
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px dashed var(--border-color)',
                background: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                No Screenplay Ingested
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                This workspace does not have any screenplay scenes or clearance entities recorded yet. Upload a screenplay to begin automated clearance extraction.
              </p>
              <button
                data-testid="workspace-empty-upload-btn"
                className="btn-primary touch-target"
                onClick={() => {
                  setUploadModalInitialMode('FILE');
                  setIsUploadModalOpen(true);
                }}
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Upload Screenplay
              </button>
            </div>
          )}

          {/* Hero Readiness Index Card */}
          {scenes.length > 0 && readinessSummary && (!readinessSummary.projectId || readinessSummary.projectId === projectId) && (
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
                    : readinessSummary.finalClearScenesCount === readinessSummary.totalScenes && readinessSummary.totalScenes > 0
                    ? '6px solid var(--status-no-issue)'
                    : '6px solid rgba(148, 163, 184, 0.5)',
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
                    data-testid="workspace-blocked-scenes"
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
                  data-testid="workspace-readiness-pct"
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

          {/* Per-Scene Readiness Reason Cards Grid (Section 5 Density Reduction) */}
          {scenes.length > 0 && (
            <div className="scene-readiness-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {scenes.map((s) => {
                const isConfirmed = Boolean((s as any).humanConfirmed || (s as any).isReviewed || (s.readinessDetails as any)?.isHumanConfirmed);
                const isZeroItems = (s.entityCount === 0 || (s as any).totalOccurrences === 0 || (s.occurrences && s.occurrences.length === 0) || s.readinessDetails?.totalOccurrences === 0);
                const isRed = s.readinessStatus === 'RED';
                const isWorking = s.readinessStatus === 'WORKING_CLEAR';
                const isFinalClear = s.readinessStatus === 'FINAL_CLEAR' && (!isZeroItems || isConfirmed);
                const isPendingReview = s.readinessStatus === 'PENDING_REVIEW' || (s.readinessStatus === 'FINAL_CLEAR' && isZeroItems && !isConfirmed) || (!s.readinessStatus && isZeroItems);

                const borderColor = isRed
                  ? 'var(--status-action)'
                  : isWorking
                  ? 'var(--status-review)'
                  : isPendingReview
                  ? 'rgba(148, 163, 184, 0.5)'
                  : 'var(--status-no-issue)';

                const bgColor = isRed
                  ? 'var(--status-action-bg)'
                  : isWorking
                  ? 'var(--status-review-bg)'
                  : isPendingReview
                  ? 'rgba(148, 163, 184, 0.08)'
                  : 'var(--status-no-issue-bg)';

                const textColor = isRed
                  ? 'var(--status-action)'
                  : isWorking
                  ? 'var(--status-review)'
                  : isPendingReview
                  ? 'var(--text-muted)'
                  : 'var(--status-no-issue)';

                const borderChip = isRed
                  ? 'var(--status-action-border)'
                  : isWorking
                  ? 'var(--status-review-border)'
                  : isPendingReview
                  ? 'rgba(148, 163, 184, 0.3)'
                  : 'var(--status-no-issue-border)';

                const statusLabel = isRed
                  ? 'BLOCKS SHOOTING'
                  : isWorking
                  ? 'WORKING CLEAR'
                  : isPendingReview
                  ? 'PENDING REVIEW'
                  : 'FINAL CLEAR';

                const isExpanded = Boolean(expandedReadiness[s.id]);

                const summaryText = isRed
                  ? 'Shooting Blocker: Action item(s) require legal resolution prior to filming.'
                  : isWorking
                  ? 'Review Recommended: Item(s) pending clearance verification.'
                  : isPendingReview
                  ? 'Pending Review: Human clearance verification required prior to filming.'
                  : 'All entities cleared. Ready for production filming.';

                return (
                  <div
                    key={s.id}
                    className="glass-panel scene-readiness-card"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      borderLeft: `6px solid ${borderColor}`,
                      borderTop: '1px solid var(--border-color)',
                      borderRight: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)',
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

                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {s.heading}
                    </div>

                    {/* Short Blocker / Review Summary Line */}
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: isRed ? '#fca5a5' : isWorking ? '#fde68a' : 'var(--text-muted)',
                        lineHeight: 1.4,
                        marginBottom: '8px',
                      }}
                    >
                      {summaryText}
                    </div>

                    {/* Disclosure Trigger Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        aria-expanded={isExpanded}
                        aria-controls={`readiness-detail-${s.id}`}
                        aria-label={`Toggle full readiness details for Scene ${s.sceneNumber}`}
                        onClick={(e) => toggleReadinessCard(s.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleReadinessCard(s.id, e);
                          }
                        }}
                        style={{ fontSize: '0.72rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>{isExpanded ? 'Hide Details ▲' : 'View Full Details ▼'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        aria-label={`Jump to Scene ${s.sceneNumber} in Screenplay`}
                        onClick={() => {
                          setSelectedSceneId(s.id);
                          setActiveTab('screenplay');
                        }}
                        style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      >
                        View Scene →
                      </button>
                    </div>

                    {/* Expandable Detailed Explanation Section */}
                    {isExpanded && (
                      <div
                        id={`readiness-detail-${s.id}`}
                        className="scene-why-blocked-reason"
                        style={{
                          marginTop: '8px',
                          padding: '8px 10px',
                          background: 'rgba(0,0,0,0.25)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.75rem',
                          color: 'var(--text-main)',
                          lineHeight: 1.45,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.7rem' }}>
                          Clearance Evaluation Context:
                        </div>
                        {getPlainLanguageSceneReason(s)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Overview Entity Registry Table */}
          <EntityRegistryTable
            entities={entities}
            scenes={scenes}
            selectedSceneId={selectedSceneId}
            initialStatusFilter={activeStatusFilter}
            onEvaluateClearance={onEvaluateClearance}
            onEvaluateBatch={startBatchResearch}
            batchProgress={batchProgress}
            onRetryResearch={handleRetryResearch}
            onGenerateReplacement={onGenerateReplacement}
            onOpenCounselReview={(entityId, ent) => onOpenCounselReview(entityId, selectedSceneId || undefined, ent)}
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
        </section>
      )}

      {activeTab === 'screenplay' && (
        <section
          role="tabpanel"
          id="section-screenplay"
          aria-labelledby="tab-screenplay"
          tabIndex={0}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* Screenplay Intake Toolbar */}
          <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileTextIcon size={18} className="text-cyan-400" />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Screenplay Intake: <span style={{ color: 'var(--accent-cyan)' }}>{pluralize(scenes.length, 'scene', 'scenes')} ingested</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                aria-label="Select screenplay format"
                value={scriptFormat}
                onChange={(e) => setScriptFormat(e.target.value as any)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem',
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
                style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FilmIcon size={14} />
                <span>Upload Screenplay</span>
              </button>
              <button
                className="btn-secondary touch-target"
                aria-label="Replace Screenplay File"
                onClick={() => {
                  setUploadModalInitialMode('FILE');
                  setIsUploadModalOpen(true);
                }}
                style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FilmIcon size={14} />
                <span>Replace Screenplay</span>
              </button>
              <button
                className="btn-secondary touch-target"
                aria-label="Load Bundled Fictional Demo Screenplay"
                onClick={handleLoadSampleScreenplay}
                disabled={isUploading}
                style={{
                  fontSize: '0.78rem',
                  padding: '6px 12px',
                  borderColor: 'var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FilmIcon size={14} />
                <span>Load Sample Screenplay</span>
              </button>
            </div>
          </div>

          <ScriptViewer
            scenes={scenes}
            entities={entities}
            overrides={overrides}
            selectedSceneId={selectedSceneId}
            onSelectScene={setSelectedSceneId}
            onEntityClick={(entityId, sceneId) => onOpenCounselReview(entityId, sceneId)}
          />
        </section>
      )}

      {activeTab === 'clearance' && (
        <section
          role="tabpanel"
          id="section-clearance"
          aria-labelledby="tab-clearance"
          tabIndex={0}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <EntityRegistryTable
            entities={entities}
            scenes={scenes}
            selectedSceneId={selectedSceneId}
            initialStatusFilter={activeStatusFilter}
            onEvaluateClearance={onEvaluateClearance}
            onEvaluateBatch={startBatchResearch}
            batchProgress={batchProgress}
            onRetryResearch={handleRetryResearch}
            onGenerateReplacement={onGenerateReplacement}
            onOpenCounselReview={(entityId, ent) => onOpenCounselReview(entityId, selectedSceneId || undefined, ent)}
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
        </section>
      )}

      {activeTab === 'tasks' && (
        <section
          role="tabpanel"
          id="section-tasks"
          aria-labelledby="tab-tasks"
          tabIndex={0}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <ActionListModal
            projectId={projectId}
            isOpen={true}
            embedded={true}
            onClose={() => {}}
            onActionUpdated={() => {
              fetchWorkspaceData();
            }}
          />
        </section>
      )}


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
          onOpenCounselReview(entityId, sceneId, entities.find(e => e.id === entityId));
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
          onOpenCounselReview(canonicalEntityId, undefined, entities.find(e => e.id === canonicalEntityId));
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
          }
          await fetchWorkspaceData();

          if (onRefreshProjectSummary) {
            await Promise.resolve(onRefreshProjectSummary(snapshot));
          }

          setIngestionToast({
            message: `Screenplay ${actionText} — ${pluralize(scenesCount, 'scene')} processed · ${pluralize(entitiesCount, 'entity', 'entities')} registered · ${pluralize(tasksCount, 'department task', 'department tasks')} created`,
            type: 'success',
          });
        }}
      />
        </>
      )}
    </div>
  );
};
