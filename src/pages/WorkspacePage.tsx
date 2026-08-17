import React, { useState, useEffect } from 'react';
import { ScriptViewer, Scene } from '../components/ScriptViewer';
import { EntityRegistryTable, CanonicalEntity } from '../components/EntityRegistryTable';

interface WorkspacePageProps {
  projectId: string;
  onEvaluateClearance: (entityId: string) => void;
  onGenerateReplacement: (entityId: string) => void;
  isEvaluating: boolean;
  refreshTrigger: number;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  projectId,
  onEvaluateClearance,
  onGenerateReplacement,
  isEvaluating,
  refreshTrigger,
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [entities, setEntities] = useState<CanonicalEntity[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scriptText, setScriptText] = useState('');

  const sampleScript = `INT. COFFEE SHOP - DAY
ALEX sits at a corner table holding a bottle of Coca-Cola. ALEX looks at JORDAN wearing a Rolex watch.

ALEX
This new deal is dangerous.

JORDAN
Just don't drop the Porsche keys.

EXT. CITY STREET - NIGHT
JORDAN drives a Porsche 911 at high speed. ALEX drinks Coca-Cola while reviewing blueprints on an Apple MacBook.`;

  const fetchWorkspaceData = async () => {
    if (!projectId) return;
    try {
      const [scenesRes, entitiesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/scenes`),
        fetch(`/api/projects/${projectId}/entities`),
      ]);
      if (scenesRes.ok) {
        const scenesData = await scenesRes.json();
        setScenes(scenesData);
      }
      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        setEntities(entitiesData);
      }
    } catch (err) {
      console.error('Error fetching workspace data:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [projectId, refreshTrigger]);

  const handleParseScript = async (textToParse: string) => {
    if (!projectId) return;
    setIsUploading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: textToParse }),
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Upload & Controls Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Script Ingestion & Canonical Matching</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Parse screenplay text to build the project-wide canonical entity registry.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              setScriptText(sampleScript);
              handleParseScript(sampleScript);
            }}
            disabled={isUploading}
          >
            {isUploading ? 'Parsing...' : 'Load Sample Screenplay'}
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        <ScriptViewer scenes={scenes} selectedSceneId={selectedSceneId} onSelectScene={setSelectedSceneId} />
        <EntityRegistryTable
          entities={entities}
          onEvaluateClearance={onEvaluateClearance}
          onGenerateReplacement={onGenerateReplacement}
          isEvaluating={isEvaluating}
        />
      </div>
    </div>
  );
};
