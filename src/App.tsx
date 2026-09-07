import React, { useState, useEffect, useRef } from 'react';
import { WorkspacePage } from './pages/WorkspacePage';
import { CitationDrawer, Citation } from './components/CitationDrawer';
import { ReplacementCardModal, ReplacementCard } from './components/ReplacementCardModal';
import { TimelineDrawer } from './components/TimelineDrawer';
import { BinderExportModal, ClearanceBinder, ExportLifecycleState, PreflightInfo } from './components/BinderExportModal';
import { ProjectListModal } from './components/ProjectListModal';
import { DemoTokenModal } from './components/DemoTokenModal';
import { useTimelineSSE } from './hooks/useTimelineSSE';
import { apiFetch, getDemoToken, setDemoToken } from './utils/apiClient';
import { pluralize, formatProjectCode } from './utils/formatters';
import { TERMINOLOGY } from './constants/terminology';
import { AlertTriangleIcon, LockIcon, KeyIcon, ZapIcon, RefreshCwIcon } from './components/icons/Icons';
import { SettingsPopover } from './components/SettingsPopover';
import { NotificationDrawer } from './components/NotificationDrawer';
import { RoleWorkspaceSwitcher } from './components/RoleWorkspaceSwitcher';
import { UserAdminModal } from './components/UserAdminModal';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { ActionListModal } from './components/ActionListModal';
import { NewProjectModal } from './components/NewProjectModal';
import { UserRole } from './types/collaboration';

interface ProjectSummary {
  entityCount: number;
  clearedCount: number;
  actionRequiredCount: number;
  reviewRecommendedCount: number;
  researchRequiredCount?: number;
}

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [executionMode, setExecutionMode] = useState<'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE'>('DEMO_MODE');
  const serverExecutionModeRef = useRef<'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE'>('DEMO_MODE');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectType, setProjectType] = useState<'Movie' | 'TV Show' | 'Commercial'>('Movie');
  const [projectSummary, setProjectSummary] = useState<ProjectSummary>({
    entityCount: 0,
    clearedCount: 0,
    actionRequiredCount: 0,
    reviewRecommendedCount: 0,
    researchRequiredCount: 0,
  });

  // Project List & New Project Modals State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  // Demo Access Token State
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [demoTokenInput, setDemoTokenInput] = useState(getDemoToken() || '');
  const [hasTokenConfigured, setHasTokenConfigured] = useState(Boolean(getDemoToken()));
  const [authError, setAuthError] = useState<string | null>(null);

  // Live Quota State
  const [liveQuota, setLiveQuota] = useState<{ limit: number; used: number; remaining: number }>({
    limit: 25,
    used: 0,
    remaining: 25,
  });
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [isSwitchingProject, setIsSwitchingProject] = useState<boolean>(false);
  
  // UI Drawers & Modals State
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedSceneId, setSelectedSceneId] = useState<string | undefined>(undefined);
  const [citationEntityName, setCitationEntityName] = useState('');
  const [citationRationale, setCitationRationale] = useState('');
  const [citationStatus, setCitationStatus] = useState<string>('ACTION_REQUIRED');
  const [citationOccurrenceCount, setCitationOccurrenceCount] = useState<number | undefined>(undefined);
  const [citationScenesCount, setCitationScenesCount] = useState<number | undefined>(undefined);
  const [isOverridden, setIsOverridden] = useState<boolean>(false);
  const [latestOverride, setLatestOverride] = useState<any>(null);
  const [citations, setCitations] = useState<Citation[]>([]);

  const [isReplacementOpen, setIsReplacementOpen] = useState(false);
  const [replacementCard, setReplacementCard] = useState<ReplacementCard | null>(null);

  const [isBinderOpen, setIsBinderOpen] = useState(false);
  const [binderData, setBinderData] = useState<ClearanceBinder | null>(null);
  const [isExportingBinder, setIsExportingBinder] = useState(false);
  const [exportState, setExportState] = useState<ExportLifecycleState>('IDLE');
  const [exportError, setExportError] = useState<string | null>(null);
  const [preflightData, setPreflightData] = useState<PreflightInfo | null>(null);

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineTargetEntity, setTimelineTargetEntity] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Phase 4 Collaboration & Admin State
  const [userRole, setUserRole] = useState<UserRole>('CLEARANCE_COORDINATOR');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [appViewMode, setAppViewMode] = useState<'WORKSPACE' | 'PORTFOLIO'>('WORKSPACE');
  const [deepLinkTaskId, setDeepLinkTaskId] = useState<string | undefined>(undefined);
  const [deepLinkActivityType, setDeepLinkActivityType] = useState<string | undefined>(undefined);
  const [deepLinkActivityId, setDeepLinkActivityId] = useState<string | undefined>(undefined);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const { events } = useTimelineSSE(projectId);

  const handleBinderJumpToEvidence = (
    entityId: string,
    entityName: string,
    passedCitations?: Citation[],
    passedRationale?: string,
    passedStatus?: string
  ) => {
    setSelectedEntityId(entityId);
    setCitationEntityName(entityName);
    if (passedCitations && passedCitations.length > 0) {
      setCitations(passedCitations);
      setCitationRationale(passedRationale || 'Grounded research evidence.');
      setCitationStatus(passedStatus || 'ACTION_REQUIRED');
    } else {
      const matching = binderData?.citationsIndex?.filter((c: any) =>
        c.query?.toLowerCase().includes(entityName.toLowerCase())
      );
      setCitations(matching || []);
      setCitationRationale(passedRationale || 'Clearance evidentiary assessment.');
      setCitationStatus(passedStatus || 'ACTION_REQUIRED');
    }
    setIsOverridden(false);
    setLatestOverride(null);
    setIsCitationOpen(true);
  };

  const handleBinderJumpToTimeline = (_entityId: string, entityName: string) => {
    setTimelineTargetEntity(entityName || null);
    setIsTimelineOpen(true);
  };

  const [initError, setInitError] = useState<string | null>(null);
  const [servingRevision, setServingRevision] = useState<string>('unknown');

  const bootstrapFromHealth = async () => {
    setInitError(null);
    let serverMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE' = 'DEMO_MODE';
    try {
      const healthRes = await apiFetch('/api/health');
      if (healthRes.ok) {
        const health = await healthRes.json();
        if (
          health.executionMode === 'TEST_MODE' ||
          health.executionMode === 'DEMO_MODE' ||
          health.executionMode === 'CLOUD_MODE'
        ) {
          // Server execution mode from health endpoint
          serverMode = health.executionMode;
        }
        if (health.revision) {
          setServingRevision(health.revision);
        }
      }
    } catch (err) {
      console.error('Error loading /api/health execution mode:', err);
    }

    serverExecutionModeRef.current = serverMode;
    setExecutionMode(serverMode);
    await initProject(serverMode);
  };

  const userDismissedTokenModalRef = useRef<boolean>(false);

  const handleSaveToken = (tokenToSave: string) => {
    const trimmed = tokenToSave.trim();
    if (trimmed) {
      setDemoToken(trimmed);
      setHasTokenConfigured(true);
      setDemoTokenInput(trimmed);
      userDismissedTokenModalRef.current = false;
      setAuthError(null);
      setInitError(null);
      setIsTokenModalOpen(false);
      bootstrapFromHealth();
    } else {
      setDemoToken(null);
      setHasTokenConfigured(false);
      setDemoTokenInput('');
      setAuthError('Demo access token cleared. Enter a valid access token to authenticate.');
      userDismissedTokenModalRef.current = true;
      setIsTokenModalOpen(false);
    }
  };

  const handleCloseTokenModal = () => {
    userDismissedTokenModalRef.current = true;
    setIsTokenModalOpen(false);
  };

  const handleOpenTokenModal = () => {
    userDismissedTokenModalRef.current = false;
    setDemoTokenInput(getDemoToken() || '');
    setIsTokenModalOpen(true);
  };

  // Listen for 401 auth required events from apiClient
  useEffect(() => {
    const handleAuthRequired = () => {
      setAuthError('Authentication Required: Configure Demo Access Token to access CLOUD_MODE.');
      if (!userDismissedTokenModalRef.current) {
        setIsTokenModalOpen(true);
      }
    };

    window.addEventListener('clearancescout:auth_required', handleAuthRequired);
    return () => window.removeEventListener('clearancescout:auth_required', handleAuthRequired);
  }, []);

  // Global Escape key handler to close topmost modal/drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isActionModalOpen) {
          setIsActionModalOpen(false);
          setDeepLinkTaskId(undefined);
          setDeepLinkActivityType(undefined);
          setDeepLinkActivityId(undefined);
        } else if (isReplacementOpen) {
          setIsReplacementOpen(false);
        } else if (isBinderOpen) {
          setIsBinderOpen(false);
        } else if (isCitationOpen) {
          setIsCitationOpen(false);
        } else if (isTimelineOpen) {
          setIsTimelineOpen(false);
        } else if (isTokenModalOpen) {
          handleCloseTokenModal();
        } else if (isProjectModalOpen) {
          setIsProjectModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActionModalOpen, isReplacementOpen, isBinderOpen, isCitationOpen, isTimelineOpen, isTokenModalOpen, isProjectModalOpen]);

  const currentProjectIdRef = useRef<string | null>(projectId);
  useEffect(() => {
    currentProjectIdRef.current = projectId;
  }, [projectId]);

  const loadProjectDetails = async (id: string): Promise<boolean> => {
    console.log(`[App] loadProjectDetails START for id="${id}"`);
    currentProjectIdRef.current = id;
    setIsSwitchingProject(true);
    setProjectSummary({
      entityCount: 0,
      clearedCount: 0,
      actionRequiredCount: 0,
      reviewRecommendedCount: 0,
      researchRequiredCount: 0,
    });
    setBinderData(null);
    setPreflightData(null);
    try {
      const res = await apiFetch(`/api/projects/${id}`);
      if (!res.ok) {
        setInitError(`Failed to load project details (Server HTTP ${res.status}).`);
        return false;
      }
      let data = await res.json();
      console.log(`[App] loadProjectDetails RESOLVED data:`, data.id, data.title);
      setProjectId(data.id);
      try {
        localStorage.setItem('clearancescout_active_project_id', data.id);
      } catch (e) {
        /* ignore */
      }
      setProjectTitle(data.title);
      setProjectType(data.projectType || 'Movie');
      setExecutionMode(serverExecutionModeRef.current || data.executionMode || 'DEMO_MODE');
      setAuthError(null);
      setInitError(null);
      setQuotaError(null);
      setProjectSummary({
        entityCount: data.entityCount || 0,
        clearedCount: data.clearedCount || 0,
        actionRequiredCount: data.actionRequiredCount || 0,
        reviewRecommendedCount: data.reviewRecommendedCount || 0,
        researchRequiredCount: data.researchRequiredCount || 0,
      });
      if (data.liveQuotaLimit !== undefined) {
        setLiveQuota({
          limit: data.liveQuotaLimit,
          used: data.liveQuotaUsed || 0,
          remaining: data.liveQuotaRemaining !== undefined ? data.liveQuotaRemaining : Math.max(0, data.liveQuotaLimit - (data.liveQuotaUsed || 0)),
        });
      }
      setRefreshTrigger((prev) => prev + 1);
      return true;
    } catch (err: any) {
      console.error('Error loading project details:', err);
      setInitError(`Error loading project: ${err?.message || 'Network error'}`);
      return false;
    }
  };

  const initProject = async (serverMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE') => {
    try {
      const listRes = await apiFetch('/api/projects');
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.projects && listData.projects.length > 0) {
          const storedId = localStorage.getItem('clearancescout_active_project_id');
          const targetProj =
            (storedId && listData.projects.find((p: any) => p.id === storedId)) ||
            listData.projects.find((p: any) => p.id === 'proj-default') ||
            listData.projects[0];
          await loadProjectDetails(targetProj.id);
          return;
        }
      } else if (listRes.status === 401) {
        const errData = await listRes.json().catch(() => ({}));
        setAuthError(errData.error || 'Authentication Required: Demo Access Token required.');
        if (!userDismissedTokenModalRef.current) {
          setIsTokenModalOpen(true);
        }
        return;
      }

      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Production Workspace',
          productionCompany: 'Apex Entertainment',
          scriptVersion: 'v1.0-ShootingDraft',
          projectType: 'Movie',
          executionMode: serverMode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await loadProjectDetails(data.id);
      } else if (res.status === 401) {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Authentication Required: Demo Access Token required.');
        if (!userDismissedTokenModalRef.current) {
          setIsTokenModalOpen(true);
        }
      } else {
        const errText = await res.text().catch(() => '');
        setInitError(`Unable to initialize project workspace (Server HTTP ${res.status}${errText ? `: ${errText}` : ''}).`);
      }
    } catch (err: any) {
      console.error('Error initializing project:', err);
      setInitError(`Workspace Initialization Failed: ${err?.message || 'Network connection error. Check server connectivity.'}`);
    }
  };

  // Initialize or fetch project. Header mode is sourced from GET /api/health on first paint.
  useEffect(() => {
    bootstrapFromHealth();
  }, [hasTokenConfigured]);

  const refreshProjectSummary = async (id?: string, snapshot?: any) => {
    const targetId = id || snapshot?.project?.id || currentProjectIdRef.current;
    if (targetId && targetId !== currentProjectIdRef.current) {
      console.log(`[App] refreshProjectSummary DISCARDING stale call for id="${targetId}" (active is "${currentProjectIdRef.current}")`);
      return;
    }
    if (snapshot && Array.isArray(snapshot.entities)) {
      if (snapshot.project?.title) {
        setProjectTitle(snapshot.project.title);
      }
      const entities = snapshot.entities;
      const clearedCount = entities.filter((e: any) => e.overallClearanceStatus === 'NO_ISSUE_SURFACED').length;
      const actionRequiredCount = entities.filter((e: any) => e.overallClearanceStatus === 'ACTION_REQUIRED').length;
      const reviewRecommendedCount = entities.filter((e: any) => e.overallClearanceStatus === 'REVIEW_RECOMMENDED').length;
      const researchRequiredCount = entities.filter((e: any) => e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE').length;
      setProjectSummary({
        entityCount: entities.length,
        clearedCount,
        actionRequiredCount,
        reviewRecommendedCount,
        researchRequiredCount,
      });
      setIsSwitchingProject(false);
      return;
    }
    try {
      const res = await apiFetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setProjectTitle(data.title);
        }
        setProjectSummary({
          entityCount: data.entityCount || 0,
          clearedCount: data.clearedCount || 0,
          actionRequiredCount: data.actionRequiredCount || 0,
          reviewRecommendedCount: data.reviewRecommendedCount || 0,
          researchRequiredCount: data.researchRequiredCount || 0,
        });
        setIsSwitchingProject(false);
        if (data.liveQuotaLimit !== undefined) {
          setLiveQuota({
            limit: data.liveQuotaLimit,
            used: data.liveQuotaUsed || 0,
            remaining: data.liveQuotaRemaining !== undefined ? data.liveQuotaRemaining : Math.max(0, data.liveQuotaLimit - (data.liveQuotaUsed || 0)),
          });
        }
      }
    } catch (err) {
      console.error('Error refreshing project summary:', err);
    }
  };

  const refreshProjectQuota = refreshProjectSummary;

  const handleOpenCounselReview = async (entityId: string, sceneId?: string, preloadedEntity?: any) => {
    if (!projectId) return;
    try {
      setSelectedSceneId(sceneId);
      setSelectedEntityId(entityId);
      if (preloadedEntity) {
        setCitationEntityName(preloadedEntity.canonicalName);
        setCitationRationale(preloadedEntity.description || 'Reviewing clearance context.');
        setCitationOccurrenceCount(preloadedEntity.occurrenceCount ?? preloadedEntity.occurrencesCount);
        setCitationScenesCount(preloadedEntity.scenesCount);
        setCitationStatus(preloadedEntity.overallClearanceStatus || 'NO_ISSUE_SURFACED');
      }
      setIsCitationOpen(true);

      // URL Deep Link Sync: update ?entity= without dropping tab
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('entity') !== entityId) {
          params.set('entity', entityId);
          const newSearch = params.toString() ? `?${params.toString()}` : window.location.pathname;
          window.history.replaceState(null, '', newSearch);
        }
      } catch (e) {}

      const [entitiesRes, overridesRes, assessRes] = await Promise.all([
        apiFetch(`/api/projects/${projectId}/entities`),
        apiFetch(`/api/projects/${projectId}/entities/${entityId}/overrides`),
        apiFetch(`/api/projects/${projectId}/entities/${entityId}/assessments`),
      ]);

      let ent: any = null;
      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        ent = entitiesData.find((e: any) => e.id === entityId);
      }

      let entityOverrides: any[] = [];
      if (overridesRes.ok) {
        const ovrData = await overridesRes.json();
        entityOverrides = ovrData.overrides || [];
      }

      let applicableOverride: any = null;
      if (ent) {
        setCitationEntityName(ent.canonicalName);
        setCitationRationale(ent.description || 'Reviewing clearance context.');
        setCitationOccurrenceCount(ent.occurrenceCount ?? ent.occurrencesCount);
        setCitationScenesCount(ent.scenesCount);

        const sceneOverride = sceneId
          ? entityOverrides
              .filter((o: any) => o.sceneId === sceneId)
              .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
          : null;

        const canonicalOverride = entityOverrides
          .filter((o: any) => !o.sceneId)
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        applicableOverride = sceneOverride || canonicalOverride || ent.latestOverride || null;

        if (applicableOverride) {
          setIsOverridden(true);
          setLatestOverride(applicableOverride);
          setCitationStatus(applicableOverride.overrideStatus);
        } else {
          setIsOverridden(false);
          setLatestOverride(null);
          setCitationStatus(ent.overallClearanceStatus || 'NO_ISSUE_SURFACED');
        }
      }

      // Check existing assessments first to avoid unnecessary slow evaluate call
      if (assessRes.ok) {
        const assessData = await assessRes.json();
        const assessments = Array.isArray(assessData) ? assessData : assessData.assessments || [];
        const matchingAssess = assessments[0];
        if (matchingAssess) {
          setCitations(matchingAssess.citations || []);
          if (matchingAssess.legalRationale) setCitationRationale(matchingAssess.legalRationale);
          if (!applicableOverride) {
            setCitationStatus(matchingAssess.riskStatus || ent?.overallClearanceStatus || 'NO_ISSUE_SURFACED');
          }
          return;
        }
      }

      const evalRes = await apiFetch(`/api/projects/${projectId}/clearance/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonicalEntityIds: [entityId] }),
      });
      if (evalRes.ok) {
        const data = await evalRes.json();
        const asm = data.assessments?.[0];
        if (asm) {
          setCitations(asm.citations || []);
          if (asm.legalRationale) setCitationRationale(asm.legalRationale);
          if (!applicableOverride) {
            setCitationStatus(asm.riskStatus || ent?.overallClearanceStatus || 'NO_ISSUE_SURFACED');
          }
        }
        await refreshProjectQuota(projectId);
      } else if (evalRes.status === 401) {
        setAuthError('Unauthorized: A valid Demo Access Token is required to evaluate clearance.');
      } else if (evalRes.status === 429) {
        const errData = await evalRes.json();
        setQuotaError(errData.error || 'Live research quota exceeded for this project.');
        if (errData.quota) setLiveQuota(errData.quota);
      }
    } catch (err) {
      console.error('Error opening counsel review:', err);
    }
  };

  // URL Deep-Linking: Parse ?entity= on load or popstate
  useEffect(() => {
    if (!projectId) return;

    const checkUrlEntity = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const entityParam = params.get('entity');
        if (entityParam) {
          const res = await apiFetch(`/api/projects/${projectId}/entities`);
          if (res.ok) {
            const entities = await res.json();
            const exists = entities.some((e: any) => e.id === entityParam);
            if (exists) {
              handleOpenCounselReview(entityParam);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse URL entity param:', e);
      }
    };

    checkUrlEntity();

    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const entityParam = params.get('entity');
        if (entityParam) {
          handleOpenCounselReview(entityParam);
        } else {
          setIsCitationOpen(false);
          setSelectedEntityId('');
        }
      } catch (e) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [projectId]);

  const handleEvaluateClearance = async (entityId: string) => {
    if (!projectId) return;
    setIsEvaluating(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/clearance/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonicalEntityIds: [entityId] }),
      });
      if (res.ok) {
        const data = await res.json();
        const asm = data.assessments?.[0];
        if (asm) {
          setSelectedEntityId(entityId);
          setCitations(asm.citations || []);
          let resolvedName = asm.canonicalName || asm.entityName || asm.canonicalEntityId;
          if (!resolvedName || resolvedName === entityId) {
            try {
              const entRes = await apiFetch(`/api/projects/${projectId}/entities`);
              if (entRes.ok) {
                const entitiesData = await entRes.json();
                const matchedEntity = entitiesData.find((e: any) => e.id === entityId);
                if (matchedEntity?.canonicalName) {
                  resolvedName = matchedEntity.canonicalName;
                }
              }
            } catch (e) {
              // ignore fetch error
            }
          }
          setCitationEntityName(resolvedName || entityId);
          setCitationRationale(asm.legalRationale);
          setIsCitationOpen(true);
        }
        setRefreshTrigger((prev) => prev + 1);
        await refreshProjectQuota(projectId);
      } else if (res.status === 401) {
        setAuthError('Unauthorized: A valid Demo Access Token is required to evaluate clearance.');
      } else if (res.status === 429) {
        const errData = await res.json();
        setQuotaError(errData.error || 'Live research quota exceeded for this project.');
        if (errData.quota) setLiveQuota(errData.quota);
      }
    } catch (err) {
      console.error('Error evaluating clearance:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGenerateReplacement = async (entityId: string) => {
    if (!projectId) return;
    try {
      const res = await apiFetch(`/api/projects/${projectId}/replacements/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonicalEntityId: entityId, eraAesthetic: 'Modern Cinematic' }),
      });
      if (res.ok) {
        const cardData = await res.json();
        setReplacementCard(cardData);
        setIsReplacementOpen(true);
        await refreshProjectQuota(projectId);
      } else if (res.status === 401) {
        setAuthError('Unauthorized: A valid Demo Access Token is required to generate replacements.');
      } else if (res.status === 429) {
        const errData = await res.json();
        setQuotaError(errData.error || 'Live research quota exceeded for this project.');
        if (errData.quota) setLiveQuota(errData.quota);
      }
    } catch (err) {
      console.error('Error generating replacement brand:', err);
    }
  };

  const handleExportBinder = async () => {
    if (!projectId) return;
    if (exportState === 'PREFLIGHT_CHECKING' || exportState === 'PROCESSING') return;

    setExportError(null);
    setPreflightData(null);
    setExportState('PREFLIGHT_CHECKING');
    setIsExportingBinder(true);
    setIsBinderOpen(true);

    try {
      // 1. Run Preflight Check (AC-23.1)
      const preflightRes = await apiFetch(`/api/projects/${projectId}/binder/preflight`);
      if (!preflightRes.ok) {
        const errJson = await preflightRes.json().catch(() => ({}));
        throw new Error(errJson.reason || `Preflight check failed (HTTP ${preflightRes.status})`);
      }

      const preflight = await preflightRes.json();
      setPreflightData(preflight);

      if (!preflight.canExport) {
        setExportError(preflight.reason || 'Project is not ready for binder export.');
        setExportState('FAILURE');
        return;
      }

      // 2. Transition to PROCESSING and compile binder (AC-23.2)
      setExportState('PROCESSING');
      const exportRes = await apiFetch(`/api/projects/${projectId}/binder/export`, { method: 'POST' });
      if (!exportRes.ok) {
        const errJson = await exportRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Binder compilation failed (HTTP ${exportRes.status})`);
      }

      const data = await exportRes.json();
      setBinderData(data);
      setExportState('SUCCESS');
    } catch (err: any) {
      console.error('Error exporting clearance binder:', err);
      setExportError(err.message || 'An unexpected error occurred during binder export.');
      setExportState('FAILURE');
    } finally {
      setIsExportingBinder(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header
        role="banner"
        className="glass-panel app-header"
        style={{
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          padding: '8px 20px',
          height: '60px',
          maxHeight: '64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          gap: '12px',
        }}
      >
        <div className="app-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            CS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1 }}>
            <button
              data-testid="header-switch-project-btn"
              className="btn-secondary touch-target"
              aria-label="Switch Production Project"
              style={{ fontSize: '0.78rem', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '150px', flexShrink: 1 }}
              onPointerDown={(e) => {
                if (e.button === 0) setIsProjectModalOpen(true);
              }}
              onClick={() => setIsProjectModalOpen(true)}
            >
              <span
                data-testid="workspace-project-title"
                style={{
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '75px',
                }}
              >
                {projectTitle || 'Untitled Production Workspace'}
              </span>
              <span
                data-testid="workspace-project-code"
                style={{
                  fontSize: '0.62rem',
                  fontFamily: 'monospace',
                  padding: '1px 3px',
                  borderRadius: '4px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              >
                [{formatProjectCode(projectId, projectTitle)}]
              </span>
            </button>
            <button
              data-testid="header-new-production-btn"
              className="btn-primary touch-target"
              aria-label="Create New Production"
              style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              <span className="desktop-only">+ New Production</span>
              <span className="mobile-only">+ New</span>
            </button>
          </div>
        </div>

        <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Phase 4 Role Perspective Switcher (Visible on desktop/tablet >=768px) */}
          <div className="desktop-only">
            <RoleWorkspaceSwitcher currentRole={userRole} onRoleChange={(role) => setUserRole(role)} />
          </div>

          {/* Phase 4 In-Product Notification Drawer */}
          <NotificationDrawer
            currentUserRole={userRole}
            projectId={projectId}
            demoToken={getDemoToken() || undefined}
            onSelectTask={(taskId, activityType, activityId) => {
              setDeepLinkTaskId(taskId);
              setDeepLinkActivityType(activityType);
              setDeepLinkActivityId(activityId);
              setIsActionModalOpen(true);
            }}
          />

          {/* Settings Menu Offloading Secondary Controls & Perspective on mobile */}
          <SettingsPopover
            hasTokenConfigured={hasTokenConfigured}
            onOpenTokenModal={handleOpenTokenModal}
            executionMode={executionMode}
            setExecutionMode={setExecutionMode}
            liveQuota={liveQuota}
            eventsCount={events.length}
            onOpenTimeline={() => setIsTimelineOpen(true)}
            servingRevision={servingRevision}
            onNewProduction={() => setIsNewProjectModalOpen(true)}
            onSwitchProject={() => setIsProjectModalOpen(true)}
            onExportBinder={handleExportBinder}
            onTogglePortfolio={() => setAppViewMode(appViewMode === 'WORKSPACE' ? 'PORTFOLIO' : 'WORKSPACE')}
            appViewMode={appViewMode}
            isExporting={exportState === 'PREFLIGHT_CHECKING' || exportState === 'PROCESSING'}
            currentUserRole={userRole}
            onRoleChange={(role) => setUserRole(role)}
          />
        </div>
      </header>

      {/* Quota Exhaustion Error Banner if 429 occurs */}
      {quotaError && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.5)',
            padding: '10px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#f87171',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangleIcon size={16} />
            <span>{quotaError}</span>
          </div>
          <button
            className="btn-secondary touch-target"
            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
            onClick={() => setQuotaError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Auth Error Banner if 401 occurs */}
      {authError && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '10px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#f87171',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangleIcon size={16} />
            <span>{authError}</span>
          </div>
          <button
            className="btn-primary"
            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
            onClick={() => {
              setDemoTokenInput(getDemoToken() || '');
              setIsTokenModalOpen(true);
            }}
          >
            Set Access Token
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {appViewMode === 'PORTFOLIO' ? (
          <PortfolioDashboard
            demoToken={getDemoToken() || undefined}
            onSelectProject={async (selectedId, selectedTitle) => {
              setIsSwitchingProject(true);
              currentProjectIdRef.current = selectedId;
              setProjectId(selectedId);
              if (selectedTitle) {
                setProjectTitle(selectedTitle);
              }
              setAppViewMode('WORKSPACE');
              await loadProjectDetails(selectedId);
              setIsSwitchingProject(false);
            }}
          />
        ) : projectId ? (
          <WorkspacePage
            projectId={projectId}
            projectTitle={projectTitle}
            isSwitchingProject={isSwitchingProject}
            onEvaluateClearance={handleEvaluateClearance}
            onGenerateReplacement={handleGenerateReplacement}
            onOpenCounselReview={handleOpenCounselReview}
            onExportBinder={handleExportBinder}
            onRefreshProjectSummary={(snapshot) => {
              refreshProjectSummary(currentProjectIdRef.current || projectId, snapshot);
            }}
            isEvaluating={isEvaluating}
            refreshTrigger={refreshTrigger}
            executionMode={executionMode}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            {authError ? (
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LockIcon size={20} /> Authentication Required
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  Production CLOUD_MODE requires an authorized Demo Access Token to access projects, observable timeline streams, and clearance workflows.
                </p>
                <button
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleOpenTokenModal}
                >
                  <KeyIcon size={16} /> Enter Access Token
                </button>
              </div>
            ) : initError ? (
              <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <AlertTriangleIcon size={20} /> Initialization Error
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  {initError}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    className="btn-primary"
                    style={{ padding: '10px 24px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => bootstrapFromHealth()}
                  >
                    <RefreshCwIcon size={16} /> Retry Workspace Initialization
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    onClick={handleOpenTokenModal}
                  >
                    <KeyIcon size={16} /> Configure Access Token
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                  Initializing ClearanceScout Workspace...
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Loading project snapshot, entity registry, and clearance status...
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Demo Access Token Settings Modal */}
      <DemoTokenModal
        isOpen={isTokenModalOpen}
        onClose={handleCloseTokenModal}
        tokenInput={demoTokenInput}
        onTokenInputChange={setDemoTokenInput}
        onSaveToken={handleSaveToken}
      />

      {/* Slide-over Drawers & Modals */}
      <CitationDrawer
        projectId={projectId || ''}
        canonicalEntityId={selectedEntityId}
        sceneId={selectedSceneId}
        citations={citations}
        isOpen={isCitationOpen}
        onClose={() => {
          setIsCitationOpen(false);
          setSelectedEntityId('');
          try {
            const params = new URLSearchParams(window.location.search);
            if (params.has('entity')) {
              params.delete('entity');
              const newSearch = params.toString() ? `?${params.toString()}` : window.location.pathname;
              window.history.replaceState(null, '', newSearch);
            }
          } catch (e) {}
        }}
        entityName={citationEntityName}
        rationale={citationRationale}
        currentStatus={citationStatus}
        occurrenceCount={citationOccurrenceCount}
        scenesCount={citationScenesCount}
        isOverridden={isOverridden}
        latestOverride={latestOverride}
        executionMode={executionMode}
        onOverrideSaved={() => {
          setRefreshTrigger((prev) => prev + 1);
          if (projectId) refreshProjectSummary(projectId);
        }}
      />

      <ReplacementCardModal card={replacementCard} isOpen={isReplacementOpen} onClose={() => setIsReplacementOpen(false)} />

      <ActionListModal
        projectId={projectId || 'proj-default'}
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setDeepLinkTaskId(undefined);
          setDeepLinkActivityType(undefined);
          setDeepLinkActivityId(undefined);
        }}
        targetTaskId={deepLinkTaskId}
        targetActivityType={deepLinkActivityType}
        targetActivityId={deepLinkActivityId}
      />

      <BinderExportModal
        binder={binderData}
        isOpen={isBinderOpen}
        onClose={() => {
          setIsBinderOpen(false);
          setExportState('IDLE');
          setExportError(null);
        }}
        exportState={exportState}
        exportError={exportError}
        preflightData={preflightData}
        onRetry={handleExportBinder}
        executionMode={executionMode}
        onJumpToEvidence={handleBinderJumpToEvidence}
        onJumpToTimeline={handleBinderJumpToTimeline}
      />

      <TimelineDrawer
        events={events}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        targetEntityName={timelineTargetEntity}
        onClearTargetEntity={() => setTimelineTargetEntity(null)}
      />

      <ProjectListModal
        isOpen={isProjectModalOpen}
        activeProjectId={projectId}
        activeProjectTitle={projectTitle}
        activeProjectType={projectType}
        activeExecutionMode={executionMode}
        activeProjectSummary={projectSummary}
        onSelectProject={(selectedId) => loadProjectDetails(selectedId)}
        onClose={() => setIsProjectModalOpen(false)}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={async (newId) => {
          setIsSwitchingProject(true);
          await loadProjectDetails(newId);
          setIsSwitchingProject(false);
        }}
        defaultExecutionMode={executionMode}
      />

      <UserAdminModal
        isOpen={isAdminOpen}
        projectId={projectId || 'proj-default'}
        currentUserRole={userRole}
        demoToken={getDemoToken() || undefined}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
