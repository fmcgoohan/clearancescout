import React from 'react';

interface SceneRiskBadgeProps {
  status: 'NO_ISSUE_SURFACED' | 'REVIEW_RECOMMENDED' | 'ACTION_REQUIRED' | 'INSUFFICIENT_EVIDENCE';
}

export const SceneRiskBadge: React.FC<SceneRiskBadgeProps> = ({ status }) => {
  const getLabel = () => {
    switch (status) {
      case 'NO_ISSUE_SURFACED':
        return '✓ No Issue Surfaced';
      case 'REVIEW_RECOMMENDED':
        return '⚠️ Review Recommended';
      case 'ACTION_REQUIRED':
        return '⛔ Action Required';
      case 'INSUFFICIENT_EVIDENCE':
        return '❓ Insufficient Evidence';
      default:
        return status;
    }
  };

  return <span className={`badge badge-${status}`}>{getLabel()}</span>;
};
