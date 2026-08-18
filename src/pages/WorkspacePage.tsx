import React, { useState, useEffect } from 'react';
import { ScriptViewer, Scene, CounselOverrideItem } from '../components/ScriptViewer';
import { EntityRegistryTable, CanonicalEntity } from '../components/EntityRegistryTable';
import { ItemEditModal, EntityCategory } from '../components/ItemEditModal';

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

        // Fetch all entity overrides
        const allOverrides: CounselOverrideItem[] = [];
        for (const ent of entitiesData) {
          try {
            const ovrRes = await fetch(`/api/projects/${projectId}/entities/${ent.id}/overrides`);
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

  const handleLoadSampleScreenplay = async () => {
    try {
      const fixtureRes = await fetch('/api/fixtures/demo-screenplay');
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
      const res = await fetch(`/api/projects/${projectId}/entities/${entityToEdit.id}`, {
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
      const res = await fetch(`/api/projects/${projectId}/entities`, {
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
      const res = await fetch(`/api/projects/${projectId}/entities/${entityId}`, {
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
      const res = await fetch(`/api/projects/${projectId}/entities/${entityId}/retry-research`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error('Failed to retry research on entity:', err);
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
          <button
            className="btn-secondary"
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
            <option value="PLAINTEXT">Plaintext (.txt)</option>
            <option value="FOUNTAIN">Fountain (.fountain)</option>
            <option value="PDF">Screenplay PDF (.pdf)</option>
          </select>

          <button
            className="btn-primary"
            onClick={() => handleParseScript(defaultFictionalDemoScript, scriptFormat)}
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
          overrides={overrides}
          selectedSceneId={selectedSceneId}
          onSelectScene={setSelectedSceneId}
          onEntityClick={(entityId, sceneId) => onOpenCounselReview(entityId, sceneId)}
        />
        <EntityRegistryTable
          entities={entities}
          onEvaluateClearance={onEvaluateClearance}
          onRetryResearch={handleRetryResearch}
          onGenerateReplacement={onGenerateReplacement}
          onOpenCounselReview={(entityId) => onOpenCounselReview(entityId, selectedSceneId || undefined)}
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
      />
    </div>
  );
};
