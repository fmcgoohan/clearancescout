import React, { useState, useEffect } from 'react';
import { ScriptViewer, Scene } from '../components/ScriptViewer';
import { EntityRegistryTable, CanonicalEntity } from '../components/EntityRegistryTable';

interface WorkspacePageProps {
  projectId: string;
  onEvaluateClearance: (entityId: string) => void;
  onGenerateReplacement: (entityId: string) => void;
  onOpenCounselReview: (entityId: string) => void;
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
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scriptFormat, setScriptFormat] = useState<'PLAINTEXT' | 'FOUNTAIN' | 'PDF'>('FOUNTAIN');

  const multiCategoryFountainScript = `
.INT. COFFEE SHOP - DAY
ALEX sits at a corner table holding a chilled bottle of Coca-Cola, typing on an Apple MacBook. Through the speakers, Bohemian Rhapsody plays quietly.

ALEX
(whispering)
Did you see Taylor Swift at Madison Square Garden last night?

JORDAN
(checking Rolex)
Focus. The shipment near Empire State Building has an Acme Explosives warning label on the crate.

.EXT. CITY STREET - NIGHT
JORDAN accelerates in a Porsche 911 past the Empire State Building. ALEX finishes the can of Coca-Cola.
`;

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

  const handleParseScript = async (textToParse: string, format: 'PLAINTEXT' | 'FOUNTAIN' | 'PDF') => {
    if (!projectId) return;
    setIsUploading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/script`, {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Upload & Controls Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Multi-Format Script Ingestion & 5-Category Resolution
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Extract scenes, highlight in-line occurrences, and review legal counsel overrides.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={scriptFormat}
            onChange={(e) => setScriptFormat(e.target.value as any)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
            }}
          >
            <option value="FOUNTAIN">Fountain (.fountain)</option>
            <option value="PLAINTEXT">Plaintext (.txt)</option>
            <option value="PDF">Screenplay PDF (.pdf)</option>
          </select>

          <button
            className="btn-primary"
            onClick={() => handleParseScript(multiCategoryFountainScript, scriptFormat)}
            disabled={isUploading}
          >
            {isUploading ? 'Parsing...' : 'Ingest Screenplay'}
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        <ScriptViewer
          scenes={scenes}
          entities={entities}
          selectedSceneId={selectedSceneId}
          onSelectScene={setSelectedSceneId}
          onEntityClick={onOpenCounselReview}
        />
        <EntityRegistryTable
          entities={entities}
          onEvaluateClearance={onEvaluateClearance}
          onGenerateReplacement={onGenerateReplacement}
          onOpenCounselReview={onOpenCounselReview}
          isEvaluating={isEvaluating}
        />
      </div>
    </div>
  );
};
