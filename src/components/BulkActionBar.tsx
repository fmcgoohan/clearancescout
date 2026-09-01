import React, { useState } from 'react';
import { UserRole } from '../types/collaboration';

interface BulkActionBarProps {
  selectedTaskIds: string[];
  totalTasksCount: number;
  currentUserRole?: UserRole;
  demoToken?: string;
  onClearSelection: () => void;
  onRefreshTasks: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedTaskIds,
  totalTasksCount,
  currentUserRole = 'CLEARANCE_COORDINATOR',
  demoToken,
  onClearSelection,
  onRefreshTasks,
}) => {
  const [actionType, setActionType] = useState('SET_ASSIGNEE');
  const [actionValue, setActionValue] = useState('Sarah Jenkins');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  if (selectedTaskIds.length === 0) return null;

  const handleApplyBulk = async () => {
    setLoading(true);
    setResultSummary(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoToken) headers['x-demo-token'] = demoToken;

      const res = await fetch('/api/tasks/bulk-update', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          taskIds: selectedTaskIds,
          action: actionType,
          value: actionValue,
          userRole: currentUserRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResultSummary(`✓ ${data.summary}`);
        setTimeout(() => {
          setShowConfirmModal(false);
          onClearSelection();
          onRefreshTasks();
        }, 1200);
      } else {
        setResultSummary(`⚠️ ${data.error || data.summary || 'Bulk operation failed'}`);
      }
    } catch (err: any) {
      setResultSummary(`⚠️ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="sticky bottom-2 left-0 right-0 w-full p-3 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-800 flex items-center justify-between z-30 flex-wrap text-xs gap-2"
        data-testid="bulk-action-bar"
        data-bulk-bar="true"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold px-2 py-0.5 rounded bg-indigo-600">
            {selectedTaskIds.length} tasks selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-white underline text-[11px]"
          >
            Clear selection
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionType}
            onChange={(e) => {
              setActionType(e.target.value);
              if (e.target.value === 'SET_ASSIGNEE') setActionValue('Sarah Jenkins');
              if (e.target.value === 'SET_STATUS') setActionValue('IN_PROGRESS');
              if (e.target.value === 'SET_DEPARTMENT') setActionValue('LEGAL_COUNSEL');
            }}
            className="px-2.5 py-1 text-xs rounded bg-gray-800 border border-gray-700 text-white"
            aria-label="Select bulk action type"
          >
            <option value="SET_ASSIGNEE">Assign Owner</option>
            <option value="SET_STATUS">Change Status</option>
            <option value="SET_DUE_DATE">Set Due Date</option>
            <option value="SET_DEPARTMENT">Assign Department</option>
          </select>

          {actionType === 'SET_ASSIGNEE' && (
            <input
              type="text"
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              placeholder="Assignee name..."
              className="px-2.5 py-1 text-xs rounded bg-gray-800 border border-gray-700 text-white"
            />
          )}

          {actionType === 'SET_STATUS' && (
            <select
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              className="px-2.5 py-1 text-xs rounded bg-gray-800 border border-gray-700 text-white"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED (Legal Only)</option>
              <option value="WAIVED">WAIVED (Legal Only)</option>
            </select>
          )}

          {actionType === 'SET_DUE_DATE' && (
            <input
              type="date"
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-gray-800 border border-gray-700 text-white"
            />
          )}

          {actionType === 'SET_DEPARTMENT' && (
            <select
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              className="px-2.5 py-1 text-xs rounded bg-gray-800 border border-gray-700 text-white"
            >
              <option value="LEGAL_COUNSEL">Legal Counsel</option>
              <option value="ART_DEPT">Art Department</option>
              <option value="LOCATIONS">Locations</option>
              <option value="PRODUCTION_MGMT">Production Mgmt</option>
            </select>
          )}

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-3 py-1 font-semibold rounded bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Apply Bulk Action
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-xl max-w-md w-full border text-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Confirm Bulk Task Action
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to apply <span className="font-semibold text-indigo-600">{actionType} = "{actionValue}"</span> across <span className="font-bold">{selectedTaskIds.length} selected tasks</span>?
            </p>

            {resultSummary && (
              <div className="p-2.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-indigo-900 dark:text-indigo-200">
                {resultSummary}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="px-3 py-1.5 rounded border text-gray-700 hover:bg-gray-100 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulk}
                disabled={loading}
                className="px-3 py-1.5 font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {loading ? 'Processing...' : 'Confirm Bulk Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
