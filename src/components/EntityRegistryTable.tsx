import React, { useState, useEffect } from 'react';
import { BatchResearchProgress } from '../hooks/useBatchResearch.js';
import { pluralize, formatStatus, formatCategory } from '../utils/formatters.js';
import {
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  HelpCircleIcon,
  ChevronRightIcon,
} from './icons/Icons';

export type ClearanceStatusType = 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';

export interface CanonicalEntity {
  id: string;
  canonicalName: string;
  entityCategory: string;
  description: string;
  overallClearanceStatus: ClearanceStatusType;
  origin?: 'AUTO_EXTRACTED' | 'USER_EDITED' | 'MANUALLY_ADDED';
  aliases?: string[];
  parentEntityId?: string;
  parentEntityName?: string;
  relationshipType?: string;
  isOverridden?: boolean;
  latestOverride?: {
    overrideStatus: string;
    rationale: string;
    counselName: string;
    timestamp: string;
  };
  replacementCard?: any;
}

export interface SceneFilterOption {
  id: string;
  sceneNumber: number;
  heading: string;
  occurrences?: { canonicalEntityId: string }[];
}

export interface RegistryFilterState {
  status: 'ALL' | ClearanceStatusType;
  category: 'ALL' | string;
  sceneId: 'ALL' | string;
}

/**
 * Pure predicate helper combining Status, Category, and Scene filters with logical AND
 */
export function filterEntities(
  entities: CanonicalEntity[],
  filter: RegistryFilterState,
  scenes?: SceneFilterOption[]
): CanonicalEntity[] {
  if (!entities || entities.length === 0) return [];

  // Build set of entity IDs in selected scene
  let sceneEntityIds: Set<string> | null = null;
  if (filter.sceneId !== 'ALL' && scenes) {
    const matchedScene = scenes.find((s) => s.id === filter.sceneId);
    if (matchedScene && matchedScene.occurrences) {
      sceneEntityIds = new Set(matchedScene.occurrences.map((o) => o.canonicalEntityId));
    } else {
      sceneEntityIds = new Set();
    }
  }

  return entities.filter((e) => {
    // 1. Status Filter
    if (filter.status !== 'ALL' && e.overallClearanceStatus !== filter.status) {
      return false;
    }
    // 2. Category Filter
    if (filter.category !== 'ALL' && e.entityCategory !== filter.category) {
      return false;
    }
    // 3. Scene Filter
    if (filter.sceneId !== 'ALL' && sceneEntityIds !== null) {
      if (!sceneEntityIds.has(e.id)) {
        return false;
      }
    }
    return true;
  });
}

export interface EntityRegistryTableProps {
  entities: CanonicalEntity[];
  scenes?: SceneFilterOption[];
  selectedSceneId?: string | null;
  onEvaluateClearance: (entityId: string) => void;
  onEvaluateBatch?: (entities: { id: string; canonicalName: string }[]) => void;
  batchProgress?: BatchResearchProgress;
  onRetryResearch?: (entityId: string) => void;
  onGenerateReplacement: (entityId: string) => void;
  onOpenCounselReview?: (entityId: string) => void;
  onOpenRightsModal?: (entityId: string, entityName: string) => void;
  onOpenPlaceholderModal?: (entityId: string, entityName: string, entityCategory: string) => void;
  onOpenComparison?: (entityId: string) => void;
  onViewOccurrences?: (entityId: string) => void;
  onEditItem?: (entity: CanonicalEntity) => void;
  onDeleteItem?: (entityId: string) => void;
  onAddItem?: () => void;
  isEvaluating: boolean;
}

export const EntityRegistryTable: React.FC<EntityRegistryTableProps> = ({
  entities,
  scenes = [],
  selectedSceneId,
  onEvaluateClearance,
  onEvaluateBatch,
  batchProgress,
  onRetryResearch,
  onGenerateReplacement,
  onOpenCounselReview,
  onOpenRightsModal,
  onOpenPlaceholderModal,
  onOpenComparison,
  onViewOccurrences,
  onEditItem,
  onDeleteItem,
  onAddItem,
  isEvaluating,
}) => {
  const [filter, setFilter] = useState<RegistryFilterState>({
    status: 'ALL',
    category: 'ALL',
    sceneId: 'ALL',
  });

  // Sync sceneId when selectedSceneId changes from external ScriptViewer
  useEffect(() => {
    if (selectedSceneId) {
      setFilter((prev) => ({ ...prev, sceneId: selectedSceneId }));
    }
  }, [selectedSceneId]);

  const [openDropdownEntityId, setOpenDropdownEntityId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdownEntityId(null);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('.action-overflow-container')) {
        setOpenDropdownEntityId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredEntities = filterEntities(entities, filter, scenes);
  const pendingEntities = entities.filter(
    (e) => !e.overallClearanceStatus || e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE'
  );

  const getBadgeClass = (status: string) => {
    return `badge badge-${status}`;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'BRAND':
        return '#38bdf8';
      case 'ART_MUSIC':
        return '#c084fc';
      case 'PUBLIC_FIGURE':
        return '#fbbf24';
      case 'PROPRIETARY_LOCATION':
        return '#34d399';
      case 'GRAPHIC_PROP':
        return '#f87171';
      default:
        return 'var(--text-muted)';
    }
  };

  const categories = ['ALL', 'BRAND', 'ART_MUSIC', 'PUBLIC_FIGURE', 'PROPRIETARY_LOCATION', 'GRAPHIC_PROP'];
  const statuses: ('ALL' | ClearanceStatusType)[] = [
    'ALL',
    'NO_ISSUE_SURFACED',
    'REVIEW_RECOMMENDED',
    'ACTION_REQUIRED',
    'INSUFFICIENT_EVIDENCE',
  ];

  const handleClearFilters = () => {
    setFilter({
      status: 'ALL',
      category: 'ALL',
      sceneId: 'ALL',
    });
  };

  const isAnyFilterActive = filter.status !== 'ALL' || filter.category !== 'ALL' || filter.sceneId !== 'ALL';

  const getSceneLabel = (sceneId: string) => {
    if (sceneId === 'ALL') return 'All Scenes';
    const sc = scenes.find((s) => s.id === sceneId);
    return sc ? `Scene ${sc.sceneNumber}: ${sc.heading}` : sceneId;
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      {/* Header & Batch/Item Triggers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', margin: 0 }}>
              Canonical Entity Registry ("Clear Once, Recognize Everywhere")
            </h3>
            {onAddItem && (
              <button
                className="btn-secondary"
                onClick={onAddItem}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderColor: 'var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Add Item</span>
              </button>
            )}
            {onEvaluateBatch && (
              <button
                className="btn-secondary"
                onClick={() =>
                  onEvaluateBatch(
                    pendingEntities.map((e) => ({ id: e.id, canonicalName: e.canonicalName }))
                  )
                }
                disabled={isEvaluating || batchProgress?.isActive || pendingEntities.length === 0}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  borderColor: pendingEntities.length > 0 ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: pendingEntities.length > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  cursor: pendingEntities.length === 0 || batchProgress?.isActive ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title={
                  pendingEntities.length === 0
                    ? 'All entities already have completed clearance evaluations.'
                    : `Run clearance research on ${pendingEntities.length} pending entities`
                }
              >
                <SearchIcon size={14} />
                <span>
                  {batchProgress?.isActive
                    ? `Evaluating (${batchProgress.completed}/${batchProgress.total})...`
                    : `Research All Pending (${pendingEntities.length})`}
                </span>
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredEntities.length} of {pluralize(entities.length, 'entity', 'entities')}
          </span>
        </div>

        {/* Clear Filters Reset Button */}
        {isAnyFilterActive && (
          <button
            className="btn-secondary"
            onClick={handleClearFilters}
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderColor: 'var(--border-bright)',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCwIcon size={12} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Batch Research Progress Banner */}
      {batchProgress && (batchProgress.isActive || batchProgress.total > 0) && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.8rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {batchProgress.isActive ? '⚡ Multi-Item Clearance Research in Progress' : '✅ Batch Clearance Research Completed'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {batchProgress.completed} of {batchProgress.total} Evaluated • Concurrency: {batchProgress.activeCount} / 2
              {batchProgress.failed > 0 && <span style={{ color: '#f87171', marginLeft: '6px' }}>({batchProgress.failed} Failed)</span>}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.round(((batchProgress.completed + batchProgress.failed) / (batchProgress.total || 1)) * 100)}%`,
                height: '100%',
                background: batchProgress.failed > 0 ? 'linear-gradient(90deg, var(--accent-cyan), #f87171)' : 'var(--accent-cyan)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Filter Control Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '16px',
        }}
      >
        {/* Category Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="filter-category" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category:</label>
          <select
            id="filter-category"
            aria-label="Filter entities by category"
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : formatCategory(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="filter-status" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</label>
          <select
            id="filter-status"
            aria-label="Filter entities by clearance status"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
            }}
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st === 'ALL' ? 'All Statuses' : formatStatus(st)}
              </option>
            ))}
          </select>
        </div>

        {/* Scene Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="filter-scene" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scene:</label>
          <select
            id="filter-scene"
            aria-label="Filter entities by screenplay scene"
            value={filter.sceneId}
            onChange={(e) => setFilter({ ...filter, sceneId: e.target.value })}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              maxWidth: '220px',
            }}
          >
            <option value="ALL">All Scenes</option>
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>
                Scene {s.sceneNumber}: {s.heading}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table or Empty State */}
      {(!entities || entities.length === 0) ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No canonical entities registered. Parse a script or click "➕ Add Item" to populate the registry.
        </div>
      ) : filteredEntities.length === 0 ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--border-color)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ color: 'var(--text-muted)' }}>
            <SearchIcon size={24} />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
            No entities match the active filters
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
            Active criteria: Category: <strong>{filter.category === 'ALL' ? 'All' : formatCategory(filter.category)}</strong> • Status: <strong>{filter.status === 'ALL' ? 'All' : formatStatus(filter.status)}</strong> • Scene: <strong>{getSceneLabel(filter.sceneId)}</strong>
          </div>
          <button
            className="btn-secondary touch-target"
            aria-label="Reset all active filters"
            onClick={handleClearFilters}
            style={{ fontSize: '0.75rem', padding: '6px 14px', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
          >
            🔄 Reset All Filters
          </button>
        </div>
      ) : (
        <div className="responsive-table-container">
          <table
            aria-label="Canonical Entity Clearance Registry"
            style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Canonical Entity</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Clearance Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map((e) => {
                const itemProgress = batchProgress?.items?.[e.id];
                const isItemInActiveBatch =
                  batchProgress?.isActive &&
                  (itemProgress?.status === 'QUEUED' || itemProgress?.status === 'RESEARCHING');

                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{e.canonicalName}</span>
                        {e.origin === 'USER_EDITED' && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.4)',
                              borderRadius: '4px',
                              padding: '2px 5px',
                            }}
                          >
                            ✏️ Edited
                          </span>
                        )}
                        {e.origin === 'MANUALLY_ADDED' && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              background: 'rgba(192, 132, 252, 0.15)',
                              color: '#c084fc',
                              border: '1px solid rgba(192, 132, 252, 0.4)',
                              borderRadius: '4px',
                              padding: '2px 5px',
                            }}
                          >
                            ✨ Added
                          </span>
                        )}
                        {e.parentEntityName && (
                          <span
                            title={`Child entity of ${e.parentEntityName} (${e.relationshipType || 'BRAND_PRODUCT'})`}
                            style={{
                              fontSize: '0.65rem',
                              background: 'rgba(251, 146, 60, 0.15)',
                              color: '#fb923c',
                              border: '1px solid rgba(251, 146, 60, 0.4)',
                              borderRadius: '4px',
                              padding: '2px 5px',
                            }}
                          >
                            🏢 Part of: {e.parentEntityName}
                          </span>
                        )}
                        {e.aliases && e.aliases.length > 0 && (
                          <span
                            title={`Recognized Aliases: ${e.aliases.join(', ')}`}
                            style={{
                              fontSize: '0.65rem',
                              background: 'rgba(244, 114, 182, 0.15)',
                              color: '#f472b6',
                              border: '1px solid rgba(244, 114, 182, 0.4)',
                              borderRadius: '4px',
                              padding: '2px 5px',
                            }}
                          >
                            🏷️ {e.aliases.length} {e.aliases.length === 1 ? 'alias' : 'aliases'}
                          </span>
                        )}
                        {e.isOverridden && (
                          <span
                            title={e.latestOverride ? `Overridden by ${e.latestOverride.counselName}: ${e.latestOverride.rationale}` : 'Overridden by Legal Counsel'}
                            style={{
                              fontSize: '0.65rem',
                              background: 'rgba(52, 211, 153, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(52, 211, 153, 0.4)',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontWeight: 500,
                              cursor: 'help',
                            }}
                          >
                            ⚖️ Counsel Override
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '0.75rem',
                          color: getCategoryColor(e.entityCategory),
                          background: 'rgba(255,255,255,0.04)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {formatCategory(e.entityCategory)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {batchProgress?.isActive && itemProgress?.status === 'QUEUED' ? (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                          ⏳ Queued
                        </span>
                      ) : batchProgress?.isActive && itemProgress?.status === 'RESEARCHING' ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                          }}
                        >
                          🔄 Researching...
                        </span>
                      ) : itemProgress?.status === 'FAILED' ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                          }}
                          title={itemProgress.error || 'Clearance research failed'}
                        >
                          ⚠️ Failed
                        </span>
                      ) : (
                        <span className={getBadgeClass(e.overallClearanceStatus)}>{formatStatus(e.overallClearanceStatus)}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }} className="action-overflow-container">
                        {/* Primary Action 1: Research / Compare / Ground */}
                        {e.replacementCard && onOpenComparison ? (
                          <button
                            className="btn-secondary touch-target"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}
                            onClick={() => onOpenComparison(e.id)}
                            disabled={isItemInActiveBatch}
                            title="View side-by-side original and fictional replacement comparison"
                          >
                            Compare
                          </button>
                        ) : e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE' ? (
                          <button
                            className="btn-secondary touch-target"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}
                            onClick={() => {
                              if (onRetryResearch) {
                                onRetryResearch(e.id);
                              } else {
                                onEvaluateClearance(e.id);
                              }
                            }}
                            disabled={isEvaluating || isItemInActiveBatch}
                            title="Retry clearance research for this item"
                          >
                            {isEvaluating || isItemInActiveBatch ? 'Retrying...' : 'Retry Research'}
                          </button>
                        ) : (
                          <button
                            className="btn-secondary touch-target"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => onEvaluateClearance(e.id)}
                            disabled={isEvaluating || isItemInActiveBatch}
                            title="Evaluate clearance research"
                          >
                            {isEvaluating || isItemInActiveBatch ? 'Researching...' : 'Ground'}
                          </button>
                        )}

                        {/* Primary Action 2: Occurrences */}
                        {onViewOccurrences && (
                          <button
                            className="btn-secondary touch-target"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => onViewOccurrences(e.id)}
                            disabled={isEvaluating || isItemInActiveBatch}
                            title={`View scene occurrences for ${e.canonicalName}`}
                            aria-label={`View occurrences for ${e.canonicalName}`}
                          >
                            🎬 Occurrences
                          </button>
                        )}

                        {/* Overflow Dropdown Trigger for Secondary Actions */}
                        <div style={{ position: 'relative' }}>
                          <button
                            className="btn-secondary touch-target"
                            style={{
                              fontSize: '0.85rem',
                              padding: '4px 8px',
                              background: openDropdownEntityId === e.id ? 'rgba(0, 240, 255, 0.15)' : undefined,
                              borderColor: openDropdownEntityId === e.id ? 'var(--accent-cyan)' : undefined,
                            }}
                            onClick={() => setOpenDropdownEntityId(openDropdownEntityId === e.id ? null : e.id)}
                            aria-label={`More actions for ${e.canonicalName}`}
                            aria-haspopup="true"
                            aria-expanded={openDropdownEntityId === e.id}
                            title="More actions"
                          >
                            ⋯
                          </button>

                          {openDropdownEntityId === e.id && (
                            <div
                              role="menu"
                              aria-label={`Actions for ${e.canonicalName}`}
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 4px)',
                                zIndex: 1000,
                                background: 'var(--bg-secondary, #1e293b)',
                                border: '1px solid var(--border-color, #334155)',
                                borderRadius: '6px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                padding: '4px',
                                minWidth: '190px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                              }}
                            >
                              {onEditItem && (
                                <button
                                  role="menuitem"
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '6px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-main)',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                  onClick={() => {
                                    setOpenDropdownEntityId(null);
                                    onEditItem(e);
                                  }}
                                >
                                  ✏️ Edit Details
                                </button>
                              )}

                              {onOpenRightsModal && (
                                <button
                                  role="menuitem"
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '6px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#34d399',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                  onClick={() => {
                                    setOpenDropdownEntityId(null);
                                    onOpenRightsModal(e.id, e.canonicalName);
                                  }}
                                >
                                  📜 Contractual Rights
                                </button>
                              )}

                              {onOpenPlaceholderModal && (
                                <button
                                  role="menuitem"
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '6px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--accent-cyan)',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                  onClick={() => {
                                    setOpenDropdownEntityId(null);
                                    onOpenPlaceholderModal(e.id, e.canonicalName, e.entityCategory);
                                  }}
                                >
                                  🎨 Attach Placeholder
                                </button>
                              )}

                              {onOpenCounselReview && (
                                <button
                                  role="menuitem"
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '6px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-main)',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                  onClick={() => {
                                    setOpenDropdownEntityId(null);
                                    onOpenCounselReview(e.id);
                                  }}
                                >
                                  ⚖️ Counsel Review & Override
                                </button>
                              )}

                              {(e.overallClearanceStatus === 'ACTION_REQUIRED' || e.overallClearanceStatus === 'REVIEW_RECOMMENDED') && (
                                <button
                                  role="menuitem"
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '6px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--accent-cyan)',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                  onClick={() => {
                                    setOpenDropdownEntityId(null);
                                    onGenerateReplacement(e.id);
                                  }}
                                >
                                  ✨ Generate Fictional Replacement
                                </button>
                              )}

                              {onDeleteItem && (
                                <button
                                  role="menuitem"
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '6px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--danger-color, #ef4444)',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                  }}
                                  onClick={() => {
                                    setOpenDropdownEntityId(null);
                                    if (window.confirm(`Are you sure you want to remove "${e.canonicalName}" from the clearance registry?`)) {
                                      onDeleteItem(e.id);
                                    }
                                  }}
                                >
                                  🗑️ Delete Item
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
