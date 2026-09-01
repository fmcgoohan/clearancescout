import React, { useState, useEffect } from 'react';
import { UserSavedView, FilterParams } from '../types/collaboration';

interface SavedViewSelectorProps {
  projectId?: string;
  demoToken?: string;
  activeFilterState: FilterParams;
  onApplySavedView: (filters: FilterParams, viewName: string) => void;
}

export const SavedViewSelector: React.FC<SavedViewSelectorProps> = ({
  projectId = 'proj-default',
  demoToken,
  activeFilterState,
  onApplySavedView,
}) => {
  const [views, setViews] = useState<UserSavedView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [isDefaultView, setIsDefaultView] = useState(false);

  const fetchViews = async () => {
    try {
      const headers: Record<string, string> = {};
      if (demoToken) headers['x-demo-token'] = demoToken;
      const res = await fetch(`/api/views?projectId=${projectId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setViews(data.views || []);
      }
    } catch (err) {
      console.error('Failed to fetch saved views:', err);
    }
  };

  useEffect(() => {
    fetchViews();
  }, [projectId]);

  const handleSaveViewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoToken) headers['x-demo-token'] = demoToken;

      const res = await fetch('/api/views', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newViewName,
          isSharedWithTeam: isShared,
          isDefault: isDefaultView,
          filters: activeFilterState,
          projectId,
        }),
      });

      if (res.ok) {
        setShowSaveModal(false);
        setNewViewName('');
        fetchViews();
      }
    } catch (err) {
      console.error('Error saving view:', err);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs" data-testid="saved-view-selector">
      <label htmlFor="saved-views-dropdown" className="font-medium text-gray-700 dark:text-gray-300">
        Filter Presets:
      </label>
      <select
        id="saved-views-dropdown"
        value={selectedViewId}
        onChange={(e) => {
          const id = e.target.value;
          setSelectedViewId(id);
          const v = views.find((item) => item.id === id);
          if (v) {
            onApplySavedView(v.filters, v.name);
          }
        }}
        className="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        <option value="">-- Standard Active Filters --</option>
        {views.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} {v.isDefaultView ? '(Default)' : ''}
          </option>
        ))}
      </select>

      <button
        onClick={() => setShowSaveModal(true)}
        className="px-2.5 py-1 text-xs font-medium rounded border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
      >
        + Save View
      </button>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveViewSubmit} className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-xl max-w-sm w-full border text-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Save Filter View Preset</h3>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Preset Name</label>
              <input
                type="text"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="e.g. My Overdue Blockers"
                className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                />
                <span>Share preset with production team</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isDefaultView}
                  onChange={(e) => setIsDefaultView(e.target.checked)}
                />
                <span>Set as my default view preset</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 rounded border text-gray-700 hover:bg-gray-100 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newViewName.trim()}
                className="px-3 py-1.5 font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Save Preset
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
