import React, { useState, useEffect } from 'react';
import { WorkspacePage } from './pages/WorkspacePage';
import { CitationDrawer, Citation } from './components/CitationDrawer';
import { ReplacementCardModal, ReplacementCard } from './components/ReplacementCardModal';
import { TimelineDrawer } from './components/TimelineDrawer';
import { BinderExportModal, ClearanceBinder } from './components/BinderExportModal';
import { useTimelineSSE } from './hooks/useTimelineSSE';

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [executionMode, setExecutionMode] = useState<'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE'>('DEMO_MODE');
  const [projectTitle, setProjectTitle] = useState('Production Project Workspace');
  
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
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { events } = useTimelineSSE(projectId);

  // Initialize or fetch project
  useEffect(() => {
    const initProject = async () => {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'ClearanceScout MVP Workspace',
            productionCompany: 'Apex Entertainment',
            scriptVersion: 'v1.0-ShootingDraft',
            executionMode,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setProjectId(data.id);
          setProjectTitle(data.title);
        }
      } catch (err) {
        console.error('Error initializing project:', err);
      }
    };
    initProject();
  }, [executionMode]);

  const handleOpenCounselReview = async (entityId: string, sceneId?: string) => {
    if (!projectId) return;
    try {
      setSelectedSceneId(sceneId);
      const entitiesRes = await fetch(`/api/projects/${projectId}/entities`);
      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        const ent = entitiesData.find((e: any) => e.id === entityId);
        if (ent) {
          setSelectedEntityId(ent.id);
          setCitationEntityName(ent.canonicalName);
          setCitationStatus(ent.overallClearanceStatus);
          setIsOverridden(Boolean(ent.isOverridden));
          setLatestOverride(ent.latestOverride || null);
          setCitationRationale(ent.description || 'Reviewing clearance context.');
        }
      }

      const evalRes = await fetch(`/api/projects/${projectId}/clearance/evaluate`, {
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
      const res = await fetch(`/api/projects/${projectId}/clearance/evaluate`, {
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
      const res = await fetch(`/api/projects/${projectId}/replacements/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonicalEntityId: entityId, eraAesthetic: 'Modern Cinematic' }),
      });
      if (res.ok) {
        const cardData = await res.json();
        setReplacementCard(cardData);
        setIsReplacementOpen(true);
      }
    } catch (err) {
      console.error('Error generating replacement brand:', err);
    }
  };

  const handleExportBinder = async () => {
    if (!projectId) return;
    setIsExportingBinder(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/binder/export`);
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
        className="glass-panel"
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
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>ClearanceScout</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agentic Entertainment Clearance Workspace</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Execution Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mode:</span>
            <select
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

          {/* Export Clearance Binder Trigger */}
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleExportBinder}
            disabled={isExportingBinder}
          >
            📋 {isExportingBinder ? 'Compiling...' : 'Export Clearance Binder'}
          </button>

          {/* Timeline Action Trigger */}
          <button className="btn-secondary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsTimelineOpen(true)}>
            ⚡ Observable Timeline ({events.length})
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {projectId ? (
          <WorkspacePage
            projectId={projectId}
            onEvaluateClearance={handleEvaluateClearance}
            onGenerateReplacement={handleGenerateReplacement}
            onOpenCounselReview={handleOpenCounselReview}
            isEvaluating={isEvaluating}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Initializing ClearanceScout Workspace...</div>
        )}
      </main>

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
        onOverrideSaved={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <ReplacementCardModal card={replacementCard} isOpen={isReplacementOpen} onClose={() => setIsReplacementOpen(false)} />

      <BinderExportModal binder={binderData} isOpen={isBinderOpen} onClose={() => setIsBinderOpen(false)} executionMode={executionMode} />

      <TimelineDrawer events={events} isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} />
    </div>
  );
}
