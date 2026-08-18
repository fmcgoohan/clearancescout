import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/apiClient.js';

export type BatchItemStatus = 'QUEUED' | 'RESEARCHING' | 'COMPLETED' | 'FAILED';

export interface BatchResearchItem {
  entityId: string;
  entityName: string;
  status: BatchItemStatus;
  error?: string;
}

export interface BatchResearchProgress {
  isActive: boolean;
  total: number;
  completed: number;
  failed: number;
  activeCount: number;
  items: Record<string, BatchResearchItem>;
}

export const INITIAL_BATCH_PROGRESS: BatchResearchProgress = {
  isActive: false,
  total: 0,
  completed: 0,
  failed: 0,
  activeCount: 0,
  items: {},
};

/**
 * Executes batch research with a strict concurrency limit (default = 2).
 * Guarantees that at most `concurrencyLimit` tasks run simultaneously,
 * every task result is reported, and individual failures do not abort the queue.
 */
export async function runBatchClearancePool(
  entities: { id: string; canonicalName: string }[],
  evaluateSingle: (entityId: string) => Promise<void>,
  onItemProgress: (entityId: string, status: BatchItemStatus, error?: string) => void,
  concurrencyLimit: number = 2
): Promise<{ completedCount: number; failedCount: number }> {
  if (entities.length === 0) {
    return { completedCount: 0, failedCount: 0 };
  }

  let nextIndex = 0;
  let completedCount = 0;
  let failedCount = 0;

  // Mark all as initially QUEUED
  for (const ent of entities) {
    onItemProgress(ent.id, 'QUEUED');
  }

  const worker = async () => {
    while (nextIndex < entities.length) {
      const currentIndex = nextIndex++;
      const entity = entities[currentIndex];
      if (!entity) break;

      onItemProgress(entity.id, 'RESEARCHING');

      try {
        await evaluateSingle(entity.id);
        completedCount++;
        onItemProgress(entity.id, 'COMPLETED');
      } catch (err: any) {
        failedCount++;
        const errorMessage = err?.message || 'Clearance research failed';
        onItemProgress(entity.id, 'FAILED', errorMessage);
      }
    }
  };

  const poolSize = Math.min(concurrencyLimit, entities.length);
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);

  return { completedCount, failedCount };
}

export function useBatchResearch(
  projectId: string,
  onItemEvaluated?: (entityId: string) => void
) {
  const [progress, setProgress] = useState<BatchResearchProgress>(INITIAL_BATCH_PROGRESS);

  const startBatchResearch = useCallback(
    async (entitiesToResearch: { id: string; canonicalName: string }[]) => {
      if (!projectId || entitiesToResearch.length === 0) return;

      const initialItems: Record<string, BatchResearchItem> = {};
      for (const ent of entitiesToResearch) {
        initialItems[ent.id] = {
          entityId: ent.id,
          entityName: ent.canonicalName,
          status: 'QUEUED',
        };
      }

      setProgress({
        isActive: true,
        total: entitiesToResearch.length,
        completed: 0,
        failed: 0,
        activeCount: Math.min(2, entitiesToResearch.length),
        items: initialItems,
      });

      const handleItemProgress = (entityId: string, status: BatchItemStatus, error?: string) => {
        setProgress((prev) => {
          const updatedItems = {
            ...prev.items,
            [entityId]: {
              ...(prev.items[entityId] || { entityId, entityName: entityId }),
              status,
              error,
            },
          };

          const completed = Object.values(updatedItems).filter((i) => i.status === 'COMPLETED').length;
          const failed = Object.values(updatedItems).filter((i) => i.status === 'FAILED').length;
          const researching = Object.values(updatedItems).filter((i) => i.status === 'RESEARCHING').length;

          return {
            ...prev,
            completed,
            failed,
            activeCount: researching,
            items: updatedItems,
          };
        });

        if (status === 'COMPLETED' || status === 'FAILED') {
          onItemEvaluated?.(entityId);
        }
      };

      const evaluateSingle = async (entityId: string) => {
        const res = await apiFetch(`/api/projects/${projectId}/clearance/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canonicalEntityIds: [entityId] }),
        });
        if (!res.ok) {
          throw new Error(`Clearance evaluation returned status ${res.status}`);
        }
      };

      try {
        await runBatchClearancePool(entitiesToResearch, evaluateSingle, handleItemProgress, 2);
      } finally {
        setProgress((prev) => ({
          ...prev,
          isActive: false,
          activeCount: 0,
        }));
      }
    },
    [projectId, onItemEvaluated]
  );

  const resetBatchProgress = useCallback(() => {
    setProgress(INITIAL_BATCH_PROGRESS);
  }, []);

  return {
    progress,
    isBatchRunning: progress.isActive,
    startBatchResearch,
    resetBatchProgress,
  };
}
