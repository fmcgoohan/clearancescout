import React from 'react';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  HelpCircleIcon
} from './icons/Icons';

interface SceneRiskBadgeProps {
  status: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
}

export const SceneRiskBadge: React.FC<SceneRiskBadgeProps> = ({ status }) => {
  const renderIconAndLabel = () => {
    switch (status) {
      case 'NO_ISSUE_SURFACED':
        return (
          <>
            <CheckCircleIcon size={14} className="badge-icon" />
            <span>Cleared</span>
          </>
        );
      case 'REVIEW_RECOMMENDED':
        return (
          <>
            <AlertTriangleIcon size={14} className="badge-icon" />
            <span>Review Recommended</span>
          </>
        );
      case 'ACTION_REQUIRED':
        return (
          <>
            <XCircleIcon size={14} className="badge-icon" />
            <span>Blocks Shooting</span>
          </>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <>
            <HelpCircleIcon size={14} className="badge-icon" />
            <span>Research Required</span>
          </>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const isBlocked = status === 'ACTION_REQUIRED';

  return (
    <span className={`badge badge-${status} ${isBlocked ? 'pulse-block-signal' : ''}`}>
      {renderIconAndLabel()}
    </span>
  );
};
