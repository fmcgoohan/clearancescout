import React, { useRef, useState } from 'react';
import { CanonicalEntity } from './EntityRegistryTable';
import { AlertTriangleIcon, CheckCircleIcon, ChevronRightIcon } from './icons/Icons';

export interface RecommendedActionCardProps {
  entities: CanonicalEntity[];
  hasScreenplay?: boolean;
  departmentTasksCount?: number;
  selectedScene?: {
    id: string;
    sceneNumber: number;
    heading: string;
    readinessStatus?: string;
    blockersCount?: number;
    workingClearCount?: number;
    finalClearCount?: number;
    readinessDetails?: any;
    occurrences?: any[];
  } | null;
  onSelectTab?: (tab: 'overview' | 'screenplay' | 'clearance' | 'tasks', filter?: string) => void;
  onOpenUploadModal?: () => void;
  onExportBinder?: () => void;
  onResearchItem?: (entityId: string) => void;
  onLoadSample?: () => void;
}

export const RecommendedActionCard: React.FC<RecommendedActionCardProps> = ({
  entities,
  hasScreenplay = true,
  departmentTasksCount = 0,
  selectedScene = null,
  onSelectTab,
  onOpenUploadModal,
  onExportBinder,
  onResearchItem,
  onLoadSample,
}) => {
  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const sampleLoadTriggeredRef = useRef(false);
  const handleLoadSample = async (e: React.SyntheticEvent) => {
    if ('button' in e && (e as React.MouseEvent).button !== 0) return;
    if (sampleLoadTriggeredRef.current) return;
    sampleLoadTriggeredRef.current = true;
    setIsSampleLoading(true);
    try {
      await onLoadSample?.();
    } finally {
      setTimeout(() => {
        sampleLoadTriggeredRef.current = false;
        setIsSampleLoading(false);
      }, 1000);
    }
  };

  const isSceneFullyCleared = Boolean(
    selectedScene &&
      (selectedScene.readinessStatus === 'FINAL_CLEAR' ||
        selectedScene.readinessDetails?.status === 'FINAL_CLEAR' ||
        (selectedScene.blockersCount === 0 && (selectedScene.workingClearCount === 0 || selectedScene.readinessStatus === 'FINAL_CLEAR')))
  );

  const sceneEntities = selectedScene
    ? entities.filter((e) => {
        const matchViaEnt = e.occurrences?.some(
          (occ: any) => occ.sceneId === selectedScene.id || occ.sceneNumber === selectedScene.sceneNumber
        );
        const matchViaScene = (selectedScene as any).occurrences?.some(
          (occ: any) => occ.canonicalEntityId === e.id
        );
        return matchViaEnt || matchViaScene;
      })
    : [];

  const effectiveEntities = selectedScene ? sceneEntities : entities;
  const actionRequiredItems = isSceneFullyCleared
    ? []
    : effectiveEntities.filter(
        (e) => e.overallClearanceStatus === 'ACTION_REQUIRED' || e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE'
      );
  const reviewRecommendedItems = isSceneFullyCleared
    ? []
    : effectiveEntities.filter((e) => e.overallClearanceStatus === 'REVIEW_RECOMMENDED');

  const blockersCount = actionRequiredItems.length;
  const reviewsCount = reviewRecommendedItems.length;

  let title = '';
  let rationale = '';
  let buttonLabel = '';
  let ariaLabel = '';
  let badgeColor = 'var(--status-no-issue, #22c55e)';
  let badgeBg = 'rgba(34, 197, 94, 0.12)';
  let handleClick: () => void = () => {};
  const hasNoScreenplay = !hasScreenplay;

  if (hasNoScreenplay) {
    title = 'Upload Screenplay to Begin Clearance';
    rationale = 'Upload a screenplay in PDF, Fountain, or plain text format to extract scenes and detect clearance entities.';
    buttonLabel = 'Upload Screenplay';
    ariaLabel = 'Upload Screenplay to Begin Clearance';
    badgeColor = 'var(--accent-cyan, #38bdf8)';
    badgeBg = 'rgba(56, 189, 248, 0.12)';
    handleClick = () => onOpenUploadModal?.();
  } else if (entities.length === 0) {
    title = 'Screenplay Ingested — No Clearance Items Detected';
    rationale = 'The screenplay was parsed successfully. No candidate clearance brands, art, or proprietary items were identified across scenes (Pending Review).';
    buttonLabel = 'View Screenplay Scenes';
    ariaLabel = 'View Screenplay Scenes';
    badgeColor = 'var(--status-review, #f59e0b)';
    badgeBg = 'rgba(245, 158, 11, 0.12)';
    handleClick = () => onSelectTab?.('screenplay');
  } else if (selectedScene && (isSceneFullyCleared || (blockersCount === 0 && reviewsCount === 0))) {
    // When a specific scene is selected and all its items are cleared
    title = `Scene ${selectedScene.sceneNumber} Cleared for Filming`;
    rationale = `All clearance items in Scene ${selectedScene.sceneNumber} (${selectedScene.heading}) are cleared under executed location permit and release. Ready for production filming.`;
    buttonLabel = 'View Screenplay';
    ariaLabel = `View Scene ${selectedScene.sceneNumber} in Screenplay`;
    badgeColor = 'var(--status-no-issue, #22c55e)';
    badgeBg = 'rgba(34, 197, 94, 0.12)';
    handleClick = () => onSelectTab?.('screenplay');
  } else if (blockersCount > 0) {
    const target = actionRequiredItems[0];
    const targetName = target?.canonicalName || 'Uncleared Item';
    const scenePrefix = selectedScene ? `Scene ${selectedScene.sceneNumber}: ` : '';
    const isResearchNeeded = target?.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE';

    if (isResearchNeeded) {
      title = `Research ${targetName}`;
      rationale = `${scenePrefix}Clearance research pending for ${targetName}. Run grounding research to identify potential trademark or copyright conflicts.`;
      buttonLabel = `Research ${targetName}`;
      ariaLabel = `Research clearance status for ${targetName}`;
      badgeColor = 'var(--status-action, #ef4444)';
      badgeBg = 'rgba(239, 68, 68, 0.12)';
      handleClick = () => {
        if (onResearchItem && target) {
          onResearchItem(target.id);
        }
      };
    } else {
      title = `Review Clearance Blocker: ${targetName}`;
      rationale = target?.entityCategory === 'ART_MUSIC'
        ? `${scenePrefix}Copyrighted musical work requires synchronization license. Review clearance dossier or record rights agreement.`
        : `${scenePrefix}${blockersCount} clearance item${blockersCount > 1 ? 's require' : ' requires'} legal resolution. Review dossier to mitigate blocker.`;
      buttonLabel = `Review Dossier: ${targetName}`;
      ariaLabel = `Review clearance dossier for ${targetName}`;
      badgeColor = 'var(--status-action, #ef4444)';
      badgeBg = 'rgba(239, 68, 68, 0.12)';
      handleClick = () => {
        if (onSelectTab) {
          onSelectTab('clearance', 'ACTION_REQUIRED');
        }
      };
    }
  } else if (reviewsCount > 0) {
    const target = reviewRecommendedItems[0];
    const targetName = target?.canonicalName || 'Item';
    const scenePrefix = selectedScene ? `Scene ${selectedScene.sceneNumber}: ` : '';
    const isResearchNeeded = target?.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE';

    if (isResearchNeeded) {
      title = `Research ${targetName}`;
      rationale = `${scenePrefix}Clearance research pending for ${targetName}.`;
      buttonLabel = `Research ${targetName}`;
      ariaLabel = `Research clearance status for ${targetName}`;
      badgeColor = 'var(--status-review, #f59e0b)';
      badgeBg = 'rgba(245, 158, 11, 0.12)';
      handleClick = () => {
        if (onResearchItem && target) {
          onResearchItem(target.id);
        }
      };
    } else {
      title = `Review Item: ${targetName}`;
      rationale = `${scenePrefix}${reviewsCount} item${reviewsCount > 1 ? 's' : ''} recommended for review: ${targetName}.`;
      buttonLabel = `Review Dossier: ${targetName}`;
      ariaLabel = `Review clearance dossier for ${targetName}`;
      badgeColor = 'var(--status-review, #f59e0b)';
      badgeBg = 'rgba(245, 158, 11, 0.12)';
      handleClick = () => {
        if (onSelectTab) {
          onSelectTab('clearance', 'REVIEW_RECOMMENDED');
        }
      };
    }
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
    rationale = 'All identified clearance items are cleared. Project is ready for legal binder export.';
    buttonLabel = 'Export Clearance Binder';
    ariaLabel = 'Export Clearance Binder';
    badgeColor = 'var(--status-no-issue, #22c55e)';
    badgeBg = 'rgba(34, 197, 94, 0.12)';
    handleClick = () => onExportBinder?.();
  }

  return (
    <div
      role="region"
      data-testid="primary-recommendation-card"
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
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: '1 1 200px' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {hasNoScreenplay && onLoadSample && (
          <button
            type="button"
            data-testid="recommendation-load-sample-btn"
            className="btn btn-secondary touch-target"
            onPointerDown={handleLoadSample}
            onClick={handleLoadSample}
            aria-label="Load Sample Production Data"
            disabled={isSampleLoading}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: isSampleLoading ? 'not-allowed' : 'pointer',
              opacity: isSampleLoading ? 0.7 : 1,
            }}
          >
            {isSampleLoading ? 'Loading Sample...' : 'Load Sample Production'}
          </button>
        )}
        <button
          data-testid={hasNoScreenplay ? 'recommendation-upload-script-btn' : 'recommendation-primary-action-btn'}
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
