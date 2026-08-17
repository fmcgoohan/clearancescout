import React from 'react';

export interface Scene {
  id: string;
  sceneNumber: number;
  heading: string;
  locationType: string;
  timeOfDay: string;
  rawText: string;
  characterActionSummary: string;
}

interface ScriptViewerProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({ scenes, selectedSceneId, onSelectScene }) => {
  if (!scenes || scenes.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No script loaded. Upload a screenplay file to parse scenes and entities.
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '600px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--accent-cyan)' }}>
        Screenplay Breakdown ({scenes.length} Scenes)
      </h3>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {scenes.map((s) => {
          const isSelected = s.id === selectedSceneId;
          return (
            <div
              key={s.id}
              onClick={() => onSelectScene(s.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  SCENE {s.sceneNumber}: {s.heading}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {s.locationType} • {s.timeOfDay}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden' }}>
                {s.characterActionSummary || s.rawText.slice(0, 120)}...
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
