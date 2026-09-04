import React from 'react';
import { UserRole } from '../types/collaboration';

interface RoleWorkspaceSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  hideLabel?: boolean;
  selectId?: string;
}

export const RoleWorkspaceSwitcher: React.FC<RoleWorkspaceSwitcherProps> = ({
  currentRole,
  onRoleChange,
  hideLabel = false,
  selectId = 'role-workspace-select',
}) => {
  return (
    <div className="flex items-center gap-1.5 text-xs" data-testid="role-workspace-switcher">
      {!hideLabel && (
        <label htmlFor={selectId} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Workspace Perspective:
        </label>
      )}
      <select
        id={selectId}
        value={currentRole}
        onChange={(e) => onRoleChange(e.target.value as UserRole)}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          background: 'var(--bg-secondary, #111827)',
          color: 'var(--text-main, #f8fafc)',
          border: '1px solid var(--border-color, #334155)',
          fontSize: '0.75rem',
          outline: 'none',
          cursor: 'pointer',
        }}
        aria-label="Switch Role Workspace Perspective"
      >
        <option value="CLEARANCE_COORDINATOR">Clearance Coordinator (Triage Queue)</option>
        <option value="LEGAL_COUNSEL">Legal Counsel (Rights & Overrides)</option>
        <option value="ART_DEPT">Art Department (Graphics & Delivery)</option>
        <option value="LOCATIONS">Locations (Permits & Releases)</option>
        <option value="PRODUCTION_MGMT">Production Management (Blockers & Readiness)</option>
        <option value="ADMINISTRATOR">Administrator (Config & Users)</option>
      </select>
    </div>
  );
};
