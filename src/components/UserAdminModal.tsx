import React, { useState, useEffect } from 'react';
import { ProjectMember, UserRole } from '../types/collaboration';

interface UserAdminModalProps {
  isOpen: boolean;
  projectId?: string;
  currentUserRole?: UserRole;
  demoToken?: string;
  onClose: () => void;
}

export const UserAdminModal: React.FC<UserAdminModalProps> = ({
  isOpen,
  projectId = 'proj-default',
  currentUserRole = 'ADMINISTRATOR',
  demoToken,
  onClose,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('usr-legal-1');
  const [newRole, setNewRole] = useState<UserRole>('LEGAL_COUNSEL');
  const [message, setMessage] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const headers: Record<string, string> = {};
      if (demoToken) headers['x-demo-token'] = demoToken;
      const res = await fetch(`/api/admin/members?projectId=${projectId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchMembers();
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoToken) headers['x-demo-token'] = demoToken;

      const res = await fetch('/api/admin/members/assign-role', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId,
          userId: selectedUser,
          projectRole: newRole,
          requesterRole: currentUserRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✓ Assigned role ${newRole} to user ${selectedUser}`);
        fetchMembers();
      } else {
        setMessage(`⚠️ ${data.error || 'Failed to update user role'}`);
      }
    } catch (err: any) {
      setMessage(`⚠️ Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="user-admin-modal">
      <div className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-xl max-w-md w-full border text-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">User Role Administration</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleRoleUpdate} className="space-y-3">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Target User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {members.map((m) => (
                <option key={m.id} value={m.userId}>
                  {m.userName} ({m.userEmail}) - [{m.projectRole}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="CLEARANCE_COORDINATOR">Clearance Coordinator</option>
              <option value="LEGAL_COUNSEL">Legal Counsel</option>
              <option value="ART_DEPT">Art Department</option>
              <option value="LOCATIONS">Locations</option>
              <option value="PRODUCTION_MGMT">Production Management</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>

          {message && (
            <div className="p-2.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium">
              {message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border text-gray-700 dark:text-gray-300">
              Close
            </button>
            <button type="submit" className="px-3 py-1.5 font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700">
              Update User Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
