import React from 'react';
import { UserRole } from '../types/collaboration';

interface RoleWorkspaceSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
}

export const RoleWorkspaceSwitcher: React.FC<RoleWorkspaceSwitcherProps> = ({
  currentRole,
  onRoleChange,
}) => {
  return (
    <div className="flex items-center gap-1.5 text-xs" data-testid="role-workspace-switcher">
      <span className="role-label font-semibold text-gray-700 dark:text-gray-300">Workspace Perspective:</span>
      <select
        value={currentRole}
        onChange={(e) => onRoleChange(e.target.value as UserRole)}
        className="px-2.5 py-1 font-medium rounded border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200"
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
