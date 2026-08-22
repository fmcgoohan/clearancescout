import React from 'react';
import { CanonicalEntity } from './EntityRegistryTable';
import { pluralize } from '../utils/formatters.js';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
} from './icons/Icons';

export interface Scene {
  id: string;
  sceneNumber: number;
  heading: string;
  locationType: string;
  timeOfDay: string;
  rawText: string;
  characterActionSummary: string;
  readinessStatus?: 'RED' | 'WORKING_CLEAR' | 'FINAL_CLEAR';
  readinessDetails?: {
    blockersCount?: number;
    workingClearCount?: number;
    finalClearCount?: number;
    totalOccurrences?: number;
    summaryText?: string;
    blockingRationale?: string;
  };
}

export interface CounselOverrideItem {
  id: string;
  canonicalEntityId: string;
  sceneId?: string;
  overrideStatus: string;
  rationale: string;
  counselName: string;
  timestamp: string;
}

interface ScriptViewerProps {
  scenes: Scene[];
  entities?: CanonicalEntity[];
  overrides?: CounselOverrideItem[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onEntityClick?: (entityId: string, sceneId?: string) => void;
}

export function resolveEffectiveStatus(
  entity: CanonicalEntity,
  overrides: CounselOverrideItem[] = [],
  sceneId?: string
): string {
  if (sceneId) {
    const sceneOverrides = overrides
      .filter((o) => o.canonicalEntityId === entity.id && o.sceneId === sceneId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (sceneOverrides.length > 0) {
      return sceneOverrides[0].overrideStatus;
    }
  }

  const canonicalOverrides = overrides
    .filter((o) => o.canonicalEntityId === entity.id && !o.sceneId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (canonicalOverrides.length > 0) {
    return canonicalOverrides[0].overrideStatus;
  }

  if (entity.isOverridden && entity.latestOverride) {
    return entity.latestOverride.overrideStatus;
  }

  return entity.overallClearanceStatus;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({
  scenes,
  entities = [],
  overrides = [],
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
      case 'INSUFFICIENT_EVIDENCE':
      default:
        return { bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8', text: '#38bdf8' };
    }
  };

  const renderHighlightedScriptText = (text: string, sceneId: string) => {
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
        const effectiveStatus = resolveEffectiveStatus(matchedEntity, overrides, sceneId);
        const hasSceneOverride = overrides.some(
          o => o.canonicalEntityId === matchedEntity.id && o.sceneId === sceneId
        );
        const colors = getStatusColor(effectiveStatus);

        parts.push(
          <span
            key={`badge-${matchIndex}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onEntityClick) onEntityClick(matchedEntity.id, sceneId);
            }}
            title={`${matchedEntity.canonicalName} (${effectiveStatus}) - Click to review`}
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
            {(matchedEntity.isOverridden || hasSceneOverride) && (
              <span style={{ fontSize: '0.65rem' }}>⚖️</span>
            )}
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
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', margin: 0 }}>
            Screenplay Breakdown & Visual Highlighter ({pluralize(scenes.length, 'Scene')})
          </h3>
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#38bdf8' }}>● Insufficient evidence</span>
            <span style={{ color: '#34d399' }}>● Cleared</span>
            <span style={{ color: '#fbbf24' }}>● Review</span>
            <span style={{ color: '#f87171' }}>● Action</span>
          </div>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Items with insufficient evidence are treated as blockers until research, rights, a placeholder, or counsel approval is attached.
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    SCENE {s.sceneNumber}: {s.heading}
                  </span>
                  {s.readinessStatus === 'FINAL_CLEAR' && (
                    <span
                      title={s.readinessDetails?.summaryText || 'Scene is 100% Cleared for Shooting'}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'var(--status-no-issue-bg)',
                        color: 'var(--status-no-issue)',
                        border: '1px solid var(--status-no-issue-border)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircleIcon size={12} />
                      <span>FINAL CLEAR</span>
                    </span>
                  )}
                  {s.readinessStatus === 'WORKING_CLEAR' && (
                    <span
                      title={s.readinessDetails?.summaryText || 'Scene is Working Clear with interim assets'}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'var(--status-review-bg)',
                        color: 'var(--status-review)',
                        border: '1px solid var(--status-review-border)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <AlertTriangleIcon size={12} />
                      <span>WORKING CLEAR</span>
                    </span>
                  )}
                  {s.readinessStatus === 'RED' && (
                    <span
                      title={s.readinessDetails?.blockingRationale || s.readinessDetails?.summaryText || 'Clearance Blocker: Cannot Shoot As Written'}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'var(--status-action-bg)',
                        color: 'var(--status-action)',
                        border: '1px solid var(--status-action-border)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      className="pulse-block-signal"
                    >
                      <XCircleIcon size={12} />
                      <span>BLOCKS SHOOTING</span>
                    </span>
                  )}
                </div>
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
                {renderHighlightedScriptText(s.rawText, s.id)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
