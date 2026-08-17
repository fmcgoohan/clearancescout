import React from 'react';
import { CanonicalEntity } from './EntityRegistryTable';

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
  entities?: CanonicalEntity[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onEntityClick?: (entityId: string) => void;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({
  scenes,
  entities = [],
  selectedSceneId,
  onSelectScene,
  onEntityClick,
}) => {
  if (!scenes || scenes.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No script loaded. Upload a screenplay file to parse scenes and entities.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NO_ISSUE_SURFACED':
        return { bg: 'rgba(52, 211, 153, 0.15)', border: '#34d399', text: '#34d399' };
      case 'REVIEW_RECOMMENDED':
        return { bg: 'rgba(251, 191, 36, 0.15)', border: '#fbbf24', text: '#fbbf24' };
      case 'ACTION_REQUIRED':
        return { bg: 'rgba(248, 113, 113, 0.15)', border: '#f87171', text: '#f87171' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', border: '#94a3b8', text: '#94a3b8' };
    }
  };

  const renderHighlightedScriptText = (text: string) => {
    if (!entities || entities.length === 0 || !text) {
      return text;
    }

    // Build regex of canonical entity names (sorted by length descending to match longest phrases first)
    const sortedEntities = [...entities].sort((a, b) => b.canonicalName.length - a.canonicalName.length);
    const escapedNames = sortedEntities
      .map(e => e.canonicalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(name => name.length > 0);

    if (escapedNames.length === 0) return text;

    const regex = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'gi');
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];

      // Add text before match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      // Find matching entity
      const matchedEntity = entities.find(
        e => e.canonicalName.toLowerCase() === matchText.toLowerCase()
      );

      if (matchedEntity) {
        const colors = getStatusColor(matchedEntity.overallClearanceStatus);
        parts.push(
          <span
            key={`badge-${matchIndex}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onEntityClick) onEntityClick(matchedEntity.id);
            }}
            title={`${matchedEntity.canonicalName} (${matchedEntity.overallClearanceStatus}) - Click to review`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '1px 6px',
              borderRadius: '4px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              margin: '0 2px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{matchText}</span>
            {matchedEntity.isOverridden && <span style={{ fontSize: '0.65rem' }}>⚖️</span>}
          </span>
        );
      } else {
        parts.push(matchText);
      }

      lastIndex = matchIndex + matchText.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>
          Screenplay Breakdown & Visual Highlighter ({scenes.length} Scenes)
        </h3>
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem' }}>
          <span style={{ color: '#34d399' }}>● Cleared</span>
          <span style={{ color: '#fbbf24' }}>● Review</span>
          <span style={{ color: '#f87171' }}>● Action</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {scenes.map((s) => {
          const isSelected = s.id === selectedSceneId;
          return (
            <div
              key={s.id}
              onClick={() => onSelectScene(s.id)}
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  SCENE {s.sceneNumber}: {s.heading}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {s.locationType} • {s.timeOfDay}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Courier Prime, Courier, monospace',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                }}
              >
                {renderHighlightedScriptText(s.rawText)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
