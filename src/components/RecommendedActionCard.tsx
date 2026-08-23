import React from 'react';
import { CanonicalEntity } from './EntityRegistryTable';
import { Icon } from './icons/Icon';

export interface RecommendedActionCardProps {
  entities: CanonicalEntity[];
  onResearchItem?: (entityId: string) => void;
  onOpenDashboard?: () => void;
}

export const RecommendedActionCard: React.FC<RecommendedActionCardProps> = ({
  entities,
  onResearchItem,
}) => {
  // Identify highest priority unresolved item (BLOCKS_SHOOTING / ACTION_REQUIRED first, then REVIEW_RECOMMENDED)
  const actionRequiredItems = entities.filter(
    (e) => e.overallClearanceStatus === 'ACTION_REQUIRED' || e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE'
  );
  const reviewRecommendedItems = entities.filter((e) => e.overallClearanceStatus === 'REVIEW_RECOMMENDED');

  const activeBlockersCount = actionRequiredItems.length;
  const targetItem = actionRequiredItems[0] || reviewRecommendedItems[0];

  if (!targetItem && activeBlockersCount === 0) {
    return (
      <div
        role="region"
        aria-label="Recommended Action"
        className="card-surface"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, #232d42)',
          backgroundColor: 'rgba(34, 197, 94, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: 'var(--status-cleared, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="check" size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main, #f3f4f6)', fontSize: '0.95rem' }}>
              All Clearance Items Cleared
            </div>
            <div style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.85rem' }}>
              No immediate action required. Project is ready for production shoot.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCritical = targetItem?.overallClearanceStatus === 'ACTION_REQUIRED' || targetItem?.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE';
  const badgeColor = isCritical ? 'var(--status-action, #ef4444)' : 'var(--status-review, #f59e0b)';
  const badgeBg = isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)';

  const recommendationText = activeBlockersCount > 0
    ? `${activeBlockersCount} clearance item${activeBlockersCount > 1 ? 's' : ''} require action. Start with ${targetItem.canonicalName}.`
    : `1 item recommended for review: ${targetItem.canonicalName}.`;

  const sceneNumber = (targetItem as any).occurrences?.[0]?.sceneNumber || 1;

  return (
    <div
      role="region"
      aria-label="Recommended Action"
      style={{
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: `1px solid ${badgeColor}`,
        backgroundColor: badgeBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '280px', flex: '1 1 300px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="alert" size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: badgeColor,
              }}
            >
              RECOMMENDED NEXT ACTION
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9ca3af)' }}>
              • Scene {sceneNumber} Blocker
            </span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-main, #f3f4f6)', fontSize: '0.95rem' }}>
            {recommendationText}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="btn btn-primary"
          onClick={() => onResearchItem && onResearchItem(targetItem.id)}
          style={{
            backgroundColor: badgeColor,
            borderColor: badgeColor,
            color: '#ffffff',
            fontWeight: 600,
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <Icon name="search" size={16} />
          <span>Research {targetItem.canonicalName}</span>
        </button>
      </div>
    </div>
  );
};
