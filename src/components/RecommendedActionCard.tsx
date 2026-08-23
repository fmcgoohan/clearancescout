import React from 'react';
import { CanonicalEntity } from './EntityRegistryTable';
import { AlertTriangleIcon, CheckCircleIcon, ChevronRightIcon } from './icons/Icons';

export interface RecommendedActionCardProps {
  entities: CanonicalEntity[];
  hasScreenplay?: boolean;
  departmentTasksCount?: number;
  onSelectTab?: (tab: 'overview' | 'screenplay' | 'clearance' | 'tasks', filter?: string) => void;
  onOpenUploadModal?: () => void;
  onExportBinder?: () => void;
  onResearchItem?: (entityId: string) => void;
}

export const RecommendedActionCard: React.FC<RecommendedActionCardProps> = ({
  entities,
  hasScreenplay = true,
  departmentTasksCount = 0,
  onSelectTab,
  onOpenUploadModal,
  onExportBinder,
  onResearchItem,
}) => {
  const actionRequiredItems = entities.filter(
    (e) => e.overallClearanceStatus === 'ACTION_REQUIRED' || e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE'
  );
  const reviewRecommendedItems = entities.filter((e) => e.overallClearanceStatus === 'REVIEW_RECOMMENDED');

  const blockersCount = actionRequiredItems.length;
  const reviewsCount = reviewRecommendedItems.length;

  let title = '';
  let rationale = '';
  let buttonLabel = '';
  let ariaLabel = '';
  let badgeColor = 'var(--status-no-issue, #22c55e)';
  let badgeBg = 'rgba(34, 197, 94, 0.12)';
  let handleClick: () => void = () => {};

  if (!hasScreenplay && entities.length === 0) {
    title = 'No Screenplay Ingested';
    rationale = 'Import a Fountain, Plaintext, or PDF screenplay to begin automated clearance extraction.';
    buttonLabel = 'Add Screenplay';
    ariaLabel = 'Add Screenplay';
    badgeColor = 'var(--accent-cyan, #38bdf8)';
    badgeBg = 'rgba(56, 189, 248, 0.12)';
    handleClick = () => onOpenUploadModal?.();
  } else if (blockersCount > 0) {
    const target = actionRequiredItems[0];
    title = `Review ${blockersCount} Clearance Blocker${blockersCount > 1 ? 's' : ''}`;
    rationale = `${blockersCount} clearance item${blockersCount > 1 ? 's' : ''} require action. Start with ${target?.canonicalName || 'uncleared item'}.`;
    buttonLabel = `Review ${blockersCount} Clearance Blocker${blockersCount > 1 ? 's' : ''}`;
    ariaLabel = target ? `Research ${target.canonicalName}` : buttonLabel;
    badgeColor = 'var(--status-action, #ef4444)';
    badgeBg = 'rgba(239, 68, 68, 0.12)';
    handleClick = () => {
      if (onResearchItem && target) {
        onResearchItem(target.id);
      }
      if (onSelectTab) {
        onSelectTab('clearance', 'ACTION_REQUIRED');
      }
    };
  } else if (reviewsCount > 0) {
    const target = reviewRecommendedItems[0];
    title = `Review ${reviewsCount} Recommended Item${reviewsCount > 1 ? 's' : ''}`;
    rationale = `1 item recommended for review: ${target?.canonicalName || 'item'}.`;
    buttonLabel = `Review ${reviewsCount} Recommended Item${reviewsCount > 1 ? 's' : ''}`;
    ariaLabel = target ? `Research ${target.canonicalName}` : buttonLabel;
    badgeColor = 'var(--status-review, #f59e0b)';
    badgeBg = 'rgba(245, 158, 11, 0.12)';
    handleClick = () => {
      if (onResearchItem && target) {
        onResearchItem(target.id);
      }
      if (onSelectTab) {
        onSelectTab('clearance', 'REVIEW_RECOMMENDED');
      }
    };
  } else if (departmentTasksCount > 0) {
    title = `View ${departmentTasksCount} Department Task${departmentTasksCount > 1 ? 's' : ''}`;
    rationale = 'All clearance items resolved; outstanding department tasks remain.';
    buttonLabel = `View ${departmentTasksCount} Department Tasks`;
    ariaLabel = buttonLabel;
    badgeColor = 'var(--accent-blue, #818cf8)';
    badgeBg = 'rgba(129, 140, 248, 0.12)';
    handleClick = () => onSelectTab?.('tasks');
  } else {
    title = 'All Clearance Items Cleared';
    rationale = 'No immediate action required. Project is ready for production shoot.';
    buttonLabel = 'Export Clearance Binder';
    ariaLabel = 'Export Clearance Binder';
    badgeColor = 'var(--status-no-issue, #22c55e)';
    badgeBg = 'rgba(34, 197, 94, 0.12)';
    handleClick = () => onExportBinder?.();
  }

  return (
    <div
      role="region"
      aria-label="Recommended Action"
      style={{
        padding: '1.25rem 1.5rem',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px', flex: '1 1 300px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
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
          {blockersCount > 0 || reviewsCount > 0 ? (
            <AlertTriangleIcon size={22} />
          ) : (
            <CheckCircleIcon size={22} />
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
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
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-main, #f3f4f6)', fontSize: '1.05rem', marginBottom: '0.15rem' }}>
            {title}
          </div>
          <div style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.85rem' }}>
            {rationale}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="btn btn-primary touch-target"
          onClick={handleClick}
          aria-label={ariaLabel}
          style={{
            backgroundColor: badgeColor,
            borderColor: badgeColor,
            color: '#ffffff',
            fontWeight: 700,
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <span>{buttonLabel}</span>
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
};
