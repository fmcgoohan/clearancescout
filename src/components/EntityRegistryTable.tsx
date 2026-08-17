import React, { useState } from 'react';

export interface CanonicalEntity {
  id: string;
  canonicalName: string;
  entityCategory: string;
  description: string;
  overallClearanceStatus: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
}

interface EntityRegistryTableProps {
  entities: CanonicalEntity[];
  onEvaluateClearance: (entityId: string) => void;
  onGenerateReplacement: (entityId: string) => void;
  isEvaluating: boolean;
}

export const EntityRegistryTable: React.FC<EntityRegistryTableProps> = ({
  entities,
  onEvaluateClearance,
  onGenerateReplacement,
  isEvaluating,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!entities || entities.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No canonical entities registered. Parse a script to populate the registry.
      </div>
    );
  }

  const filteredEntities = selectedCategory === 'ALL'
    ? entities
    : entities.filter(e => e.entityCategory === selectedCategory);

  const getBadgeClass = (status: string) => {
    return `badge badge-${status}`;
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
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

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
            Canonical Entity Registry ("Clear Once, Recognize Everywhere")
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filteredEntities.length} of {entities.length} Entities Displayed
          </span>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '0.7rem',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: selectedCategory === cat ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 12px' }}>Canonical Entity</th>
              <th style={{ padding: '10px 12px' }}>Category</th>
              <th style={{ padding: '10px 12px' }}>Clearance Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntities.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{e.canonicalName}</td>
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
                    {e.entityCategory.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span className={getBadgeClass(e.overallClearanceStatus)}>{formatStatus(e.overallClearanceStatus)}</span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      onClick={() => onEvaluateClearance(e.id)}
                      disabled={isEvaluating}
                    >
                      {isEvaluating ? 'Researching...' : 'Ground Clearance'}
                    </button>
                    {(e.overallClearanceStatus === 'ACTION_REQUIRED' || e.overallClearanceStatus === 'REVIEW_RECOMMENDED') && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => onGenerateReplacement(e.id)}
                      >
                        Generate Replacement
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
