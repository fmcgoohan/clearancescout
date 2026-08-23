import React from 'react';

export type ClearanceStatus =
  | 'CLEARED'
  | 'NO_ISSUE_SURFACED'
  | 'REVIEW_RECOMMENDED'
  | 'ACTION_REQUIRED'
  | 'BLOCKS_SHOOTING'
  | 'INSUFFICIENT_EVIDENCE'
  | 'WORKING'
  | 'PROCESSING';

export interface StatusBadgeProps {
  status: ClearanceStatus | string;
  label?: string;
  className?: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  size = 'medium',
}) => {
  const normalizedStatus = (status || '').toUpperCase();

  let chipClass = 'chip ok';
  let displayLabel = label;

  switch (normalizedStatus) {
    case 'CLEARED':
    case 'NO_ISSUE_SURFACED':
    case 'RESOLVED':
      chipClass = 'chip ok';
      displayLabel = label || 'CLEARED';
      break;

    case 'REVIEW_RECOMMENDED':
    case 'WORKING':
    case 'WAITING_EXTERNAL':
      chipClass = 'chip warn';
      displayLabel = label || 'REVIEW';
      break;

    case 'ACTION_REQUIRED':
    case 'BLOCKS_SHOOTING':
    case 'HUMAN_REVIEW':
    case 'HIGH':
      chipClass = 'chip crit';
      displayLabel = label || 'ACTION';
      break;

    case 'INSUFFICIENT_EVIDENCE':
    case 'PROCESSING':
    default:
      chipClass = 'chip warn';
      displayLabel = label || (normalizedStatus ? normalizedStatus.replace('_', ' ') : 'REVIEW');
      break;
  }

  const isSmall = size === 'small';

  return (
    <span
      className={`${chipClass} ${className}`.trim()}
      style={{
        fontSize: isSmall ? '9.5px' : '10.5px',
        padding: isSmall ? '2px 6px' : '3px 8px',
      }}
    >
      <span className="dot" />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
