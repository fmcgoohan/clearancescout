import React, { useState, useEffect } from 'react';
import { WorkspacePage } from './pages/WorkspacePage';
import { CitationDrawer, Citation } from './components/CitationDrawer';
import { ReplacementCardModal, ReplacementCard } from './components/ReplacementCardModal';
import { TimelineDrawer } from './components/TimelineDrawer';
import { useTimelineSSE } from './hooks/useTimelineSSE';

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [executionMode, setExecutionMode] = useState<'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE'>('DEMO_MODE');
  const [projectTitle, setProjectTitle] = useState('Production Project Workspace');
  
  // UI Drawers & Modals State
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [citationEntityName, setCitationEntityName] = useState('');
  const [citationRationale, setCitationRationale] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);

  const [isReplacementOpen, setIsReplacementOpen] = useState(false);
  const [replacementCard, setReplacementCard] = useState<ReplacementCard | null>(null);

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
            title: 'ClearanceScout Workspace',
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
  }, []);

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
        body: JSON.stringify({ canonicalEntityId: entityId }),
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
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {executionMode}
            </span>
          </div>

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
            isEvaluating={isEvaluating}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Initializing ClearanceScout Workspace...</div>
        )}
      </main>

      {/* Slide-over Drawers & Modals */}
      <CitationDrawer
        citations={citations}
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
        entityName={citationEntityName}
        rationale={citationRationale}
      />

      <ReplacementCardModal card={replacementCard} isOpen={isReplacementOpen} onClose={() => setIsReplacementOpen(false)} />

      <TimelineDrawer events={events} isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} />
    </div>
  );
}
