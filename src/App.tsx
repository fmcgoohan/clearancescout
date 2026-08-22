import React, { useState, useEffect, useRef } from 'react';
import { WorkspacePage } from './pages/WorkspacePage';
import { CitationDrawer, Citation } from './components/CitationDrawer';
import { ReplacementCardModal, ReplacementCard } from './components/ReplacementCardModal';
import { TimelineDrawer } from './components/TimelineDrawer';
import { BinderExportModal, ClearanceBinder } from './components/BinderExportModal';
import { ProjectListModal } from './components/ProjectListModal';
import { useTimelineSSE } from './hooks/useTimelineSSE';
import { apiFetch, getDemoToken, setDemoToken } from './utils/apiClient';
import { pluralize } from './utils/formatters';

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [executionMode, setExecutionMode] = useState<'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE'>('DEMO_MODE');
  const serverExecutionModeRef = useRef<'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE'>('DEMO_MODE');
  const [projectTitle, setProjectTitle] = useState('Production Project Workspace');
  const [projectType, setProjectType] = useState<'Movie' | 'TV Show' | 'Commercial'>('Movie');
  const [projectSummary, setProjectSummary] = useState<{
    entityCount: number;
    clearedCount: number;
    actionRequiredCount: number;
    reviewRecommendedCount: number;
  }>({
    entityCount: 0,
    clearedCount: 0,
    actionRequiredCount: 0,
    reviewRecommendedCount: 0,
  });

  // Project List Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
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
  
  // UI Drawers & Modals State
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedSceneId, setSelectedSceneId] = useState<string | undefined>(undefined);
  const [citationEntityName, setCitationEntityName] = useState('');
  const [citationRationale, setCitationRationale] = useState('');
  const [citationStatus, setCitationStatus] = useState<string>('ACTION_REQUIRED');
  const [isOverridden, setIsOverridden] = useState<boolean>(false);
  const [latestOverride, setLatestOverride] = useState<any>(null);
  const [citations, setCitations] = useState<Citation[]>([]);

  const [isReplacementOpen, setIsReplacementOpen] = useState(false);
  const [replacementCard, setReplacementCard] = useState<ReplacementCard | null>(null);

  const [isBinderOpen, setIsBinderOpen] = useState(false);
  const [binderData, setBinderData] = useState<ClearanceBinder | null>(null);
  const [isExportingBinder, setIsExportingBinder] = useState(false);

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineTargetEntity, setTimelineTargetEntity] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const bootstrapFromHealth = async () => {
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
          serverMode = health.executionMode;
        }
      }
    } catch (err) {
      console.error('Error loading /api/health execution mode:', err);
    }

    serverExecutionModeRef.current = serverMode;
    setExecutionMode(serverMode);
    await initProject(serverMode);
  };

  const handleSaveToken = (tokenToSave: string) => {
    const trimmed = tokenToSave.trim();
    if (trimmed) {
      setDemoToken(trimmed);
      setHasTokenConfigured(true);
      setDemoTokenInput(trimmed);
    } else {
      setDemoToken(null);
      setHasTokenConfigured(false);
      setDemoTokenInput('');
    }
    setAuthError(null);
    setIsTokenModalOpen(false);
    // Immediately reload project & workspace bootstrap
    bootstrapFromHealth();
  };

  // Listen for 401 auth required events from apiClient
  useEffect(() => {
    const handleAuthRequired = () => {
      setAuthError('Authentication Required: Configure Demo Access Token to access CLOUD_MODE.');
      setIsTokenModalOpen(true);
    };

    window.addEventListener('clearancescout:auth_required', handleAuthRequired);
    return () => window.removeEventListener('clearancescout:auth_required', handleAuthRequired);
  }, []);

  // Global Escape key handler to close topmost modal/drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isReplacementOpen) {
          setIsReplacementOpen(false);
        } else if (isBinderOpen) {
          setIsBinderOpen(false);
        } else if (isCitationOpen) {
          setIsCitationOpen(false);
        } else if (isTimelineOpen) {
          setIsTimelineOpen(false);
        } else if (isTokenModalOpen) {
          setIsTokenModalOpen(false);
        } else if (isProjectModalOpen) {
          setIsProjectModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReplacementOpen, isBinderOpen, isCitationOpen, isTimelineOpen, isTokenModalOpen, isProjectModalOpen]);

  const loadProjectDetails = async (id: string) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProjectId(data.id);
        setProjectTitle(data.title);
        setProjectType(data.projectType || 'Movie');
        setExecutionMode(serverExecutionModeRef.current || data.executionMode || 'DEMO_MODE');
        setAuthError(null);
        setQuotaError(null);
        setProjectSummary({
          entityCount: data.entityCount || 0,
          clearedCount: data.clearedCount || 0,
          actionRequiredCount: data.actionRequiredCount || 0,
          reviewRecommendedCount: data.reviewRecommendedCount || 0,
        });
        if (data.liveQuotaLimit !== undefined) {
          setLiveQuota({
            limit: data.liveQuotaLimit,
            used: data.liveQuotaUsed || 0,
            remaining: data.liveQuotaRemaining !== undefined ? data.liveQuotaRemaining : Math.max(0, data.liveQuotaLimit - (data.liveQuotaUsed || 0)),
          });
        }
        setRefreshTrigger((prev) => prev + 1);
      } else if (res.status === 401) {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Authentication Required: Demo Access Token required.');
        setIsTokenModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading project details:', err);
    }
  };

  const initProject = async (serverMode: 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE') => {
    try {
      const listRes = await apiFetch('/api/projects');
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.projects && listData.projects.length > 0) {
          await loadProjectDetails(listData.projects[0].id);
          return;
        }
      } else if (listRes.status === 401) {
        const errData = await listRes.json().catch(() => ({}));
        setAuthError(errData.error || 'Authentication Required: Demo Access Token required.');
        setIsTokenModalOpen(true);
        return;
      }

      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'ClearanceScout Production Clearance Workspace',
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
        setIsTokenModalOpen(true);
      }
    } catch (err) {
      console.error('Error initializing project:', err);
    }
  };

  // Initialize or fetch project. Header mode is sourced from GET /api/health on first paint.
  useEffect(() => {
    bootstrapFromHealth();
  }, [hasTokenConfigured]);

  const refreshProjectSummary = async (id: string) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProjectSummary({
          entityCount: data.entityCount || 0,
          clearedCount: data.clearedCount || 0,
          actionRequiredCount: data.actionRequiredCount || 0,
          reviewRecommendedCount: data.reviewRecommendedCount || 0,
        });
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

  const handleOpenCounselReview = async (entityId: string, sceneId?: string) => {
    if (!projectId) return;
    try {
      setSelectedSceneId(sceneId);
      const [entitiesRes, overridesRes] = await Promise.all([
        apiFetch(`/api/projects/${projectId}/entities`),
        apiFetch(`/api/projects/${projectId}/entities/${entityId}/overrides`),
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

      if (ent) {
        setSelectedEntityId(ent.id);
        setCitationEntityName(ent.canonicalName);
        setCitationRationale(ent.description || 'Reviewing clearance context.');

        // Find applicable override: scene-specific first, then canonical override
        const sceneOverride = sceneId
          ? entityOverrides
              .filter((o: any) => o.sceneId === sceneId)
              .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
          : null;

        const canonicalOverride = entityOverrides
          .filter((o: any) => !o.sceneId)
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        const applicableOverride = sceneOverride || canonicalOverride || ent.latestOverride || null;

        if (applicableOverride) {
          setIsOverridden(true);
          setLatestOverride(applicableOverride);
          setCitationStatus(applicableOverride.overrideStatus);
        } else {
          setIsOverridden(false);
          setLatestOverride(null);
          setCitationStatus(ent.overallClearanceStatus);
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
        }
        await refreshProjectQuota(projectId);
      } else if (evalRes.status === 401) {
        setAuthError('Unauthorized: A valid Demo Access Token is required to evaluate clearance.');
      } else if (evalRes.status === 429) {
        const errData = await evalRes.json();
        setQuotaError(errData.error || 'Live research quota exceeded for this project.');
        if (errData.quota) setLiveQuota(errData.quota);
      }
      setIsCitationOpen(true);
    } catch (err) {
      console.error('Error opening counsel review:', err);
    }
  };

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
          setCitationEntityName(asm.canonicalEntityId);
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
    setIsExportingBinder(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/binder/export`);
      if (res.ok) {
        const data = await res.json();
        setBinderData(data);
        setIsBinderOpen(true);
      }
    } catch (err) {
      console.error('Error exporting clearance binder:', err);
    } finally {
      setIsExportingBinder(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header
        className="glass-panel responsive-stack"
        style={{
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#ffffff',
            }}
          >
            CS
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                {projectTitle}
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background:
                    projectType === 'TV Show'
                      ? 'rgba(56, 189, 248, 0.15)'
                      : projectType === 'Commercial'
                      ? 'rgba(251, 191, 36, 0.15)'
                      : 'rgba(129, 140, 248, 0.15)',
                  color:
                    projectType === 'TV Show'
                      ? '#38bdf8'
                      : projectType === 'Commercial'
                      ? '#fbbf24'
                      : '#818cf8',
                  fontWeight: 600,
                }}
              >
                {projectType === 'TV Show' ? '📺 TV Show' : projectType === 'Commercial' ? '📢 Commercial' : '🎬 Movie'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ClearanceScout · Production Clearance Workspace
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Project Switcher Trigger */}
          <button
            className="btn-secondary touch-target"
            aria-label="Switch or Create Production Project"
            style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsProjectModalOpen(true)}
          >
            📁 Switch Project
          </button>

          {/* Landing Clearance Summary Indicator */}
          <div
            className="touch-target"
            aria-label={`Project Summary: ${projectSummary.entityCount} Total Entities, ${projectSummary.clearedCount} Cleared, ${projectSummary.actionRequiredCount} Action Required`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0,0,0,0.3)',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>📊 Summary:</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{projectSummary.clearedCount} Cleared</span>
            {projectSummary.actionRequiredCount > 0 && (
              <span style={{ color: '#f87171', fontWeight: 600 }}>{projectSummary.actionRequiredCount} Clearance Blockers</span>
            )}
            {projectSummary.reviewRecommendedCount > 0 && (
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>{projectSummary.reviewRecommendedCount} Review Recommended</span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>({pluralize(projectSummary.entityCount, 'entity', 'entities')})</span>
          </div>

          {/* Demo Token Header Trigger */}
          <button
            className="btn-secondary touch-target"
            aria-label="Configure Demo Access Token"
            style={{
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: hasTokenConfigured ? 'var(--accent-cyan)' : 'var(--border-color)',
            }}
            onClick={() => {
              setDemoTokenInput(getDemoToken() || '');
              setIsTokenModalOpen(true);
            }}
          >
            🔑 Demo Token {hasTokenConfigured && <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>●</span>}
          </button>

          {/* Execution Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <label htmlFor="mode-select" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mode:</label>
            <select
              id="mode-select"
              aria-label="Server execution mode from health endpoint"
              title="Execution mode reported by GET /api/health"
              value={executionMode}
              onChange={(e) => setExecutionMode(e.target.value as any)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="DEMO_MODE" style={{ background: '#1e293b' }}>DEMO_MODE</option>
              <option value="TEST_MODE" style={{ background: '#1e293b' }}>TEST_MODE</option>
              <option value="CLOUD_MODE" style={{ background: '#1e293b' }}>CLOUD_MODE</option>
            </select>
          </div>

          {/* Live Quota Indicator */}
          <div
            className="touch-target"
            aria-label={`Live Quota Remaining: ${liveQuota.remaining} of ${liveQuota.limit}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: liveQuota.remaining === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)',
              padding: '4px 10px',
              borderRadius: '20px',
              border: `1px solid ${liveQuota.remaining === 0 ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-color)'}`,
              fontSize: '0.75rem',
              fontFamily: 'JetBrains Mono, monospace',
              color: liveQuota.remaining === 0 ? '#f87171' : 'var(--text-main)',
            }}
          >
            <span>⚡ Live Quota:</span>
            <span style={{ fontWeight: 700, color: liveQuota.remaining === 0 ? '#f87171' : 'var(--accent-cyan)' }}>
              {liveQuota.remaining} / {liveQuota.limit}
            </span>
          </div>

          {/* Export Clearance Binder Trigger */}
          <button
            className="btn-secondary touch-target"
            aria-label="Export Legal Clearance Binder with SHA-256 Digest"
            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleExportBinder}
            disabled={isExportingBinder}
          >
            📋 {isExportingBinder ? 'Compiling...' : 'Export Clearance Binder'}
          </button>

          {/* Timeline Action Trigger */}
          <button
            className="btn-secondary touch-target"
            aria-label="Open Observable Action Timeline"
            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsTimelineOpen(true)}
          >
            ⚡ Observable Timeline ({events.length})
          </button>
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
            <span>⚠️</span>
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
            <span>⚠️</span>
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
        {projectId ? (
          <WorkspacePage
            projectId={projectId}
            onEvaluateClearance={handleEvaluateClearance}
            onGenerateReplacement={handleGenerateReplacement}
            onOpenCounselReview={handleOpenCounselReview}
            onExportBinder={handleExportBinder}
            onRefreshProjectSummary={() => {
              if (projectId) refreshProjectSummary(projectId);
            }}
            isEvaluating={isEvaluating}
            refreshTrigger={refreshTrigger}
            executionMode={executionMode}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            {authError ? (
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '12px' }}>
                  🔒 Authentication Required
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  Production CLOUD_MODE requires an authorized Demo Access Token to access projects, observable timeline streams, and clearance workflows.
                </p>
                <button
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                  onClick={() => setIsTokenModalOpen(true)}
                >
                  🔑 Enter Access Token
                </button>
              </div>
            ) : (
              'Initializing ClearanceScout Workspace...'
            )}
          </div>
        )}
      </main>

      {/* Demo Access Token Settings Modal */}
      {isTokenModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="token-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1400,
          }}
        >
          <div
            className="glass-panel modal-responsive"
            style={{
              width: '460px',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 id="token-modal-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔑 Demo Access Token</h3>
              <button
                aria-label="Close Demo Access Token dialog"
                onClick={() => setIsTokenModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Production Access Token Required for Live Cloud Mode. Enter the authorized access token below to unlock production clearance workflows, real-time observable timeline streams, and project data access.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Access Token
              </label>
              <input
                type="password"
                value={demoTokenInput}
                onChange={(e) => setDemoTokenInput(e.target.value)}
                placeholder="Enter demo token (e.g. judge-pass-2026)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.8rem' }}
                onClick={() => {
                  setDemoTokenInput('');
                  handleSaveToken('');
                }}
              >
                Clear Token
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setIsTokenModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => handleSaveToken(demoTokenInput)}
                >
                  Save Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawers & Modals */}
      <CitationDrawer
        projectId={projectId || ''}
        canonicalEntityId={selectedEntityId}
        sceneId={selectedSceneId}
        citations={citations}
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
        entityName={citationEntityName}
        rationale={citationRationale}
        currentStatus={citationStatus}
        isOverridden={isOverridden}
        latestOverride={latestOverride}
        executionMode={executionMode}
        onOverrideSaved={() => {
          setRefreshTrigger((prev) => prev + 1);
          if (projectId) refreshProjectSummary(projectId);
        }}
      />

      <ReplacementCardModal card={replacementCard} isOpen={isReplacementOpen} onClose={() => setIsReplacementOpen(false)} />

      <BinderExportModal
        binder={binderData}
        isOpen={isBinderOpen}
        onClose={() => setIsBinderOpen(false)}
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
        onSelectProject={(selectedId) => loadProjectDetails(selectedId)}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </div>
  );
}
