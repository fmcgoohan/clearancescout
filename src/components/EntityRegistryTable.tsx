import React from 'react';

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
  if (!entities || entities.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No canonical entities registered. Parse a script to populate the registry.
      </div>
    );
  }

  const getBadgeClass = (status: string) => {
    return `badge badge-${status}`;
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>
          Canonical Entity Registry ("Clear Once, Recognize Everywhere")
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entities.length} Unique Entities</span>
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
            {entities.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{e.canonicalName}</td>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                  <span className="mono" style={{ fontSize: '0.75rem' }}>
                    {e.entityCategory}
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
