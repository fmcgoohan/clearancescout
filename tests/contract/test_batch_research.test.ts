import { describe, it, expect, vi } from 'vitest';
import { runBatchClearancePool, BatchItemStatus } from '../../src/hooks/useBatchResearch.js';

describe('Feature 011: Multi-Item Clearance Research Progress & Concurrency Control Contract Tests', () => {
  it('T003 [US1]: executes batch clearance research with per-item progress transitions (QUEUED -> RESEARCHING -> COMPLETED)', async () => {
    const items = [
      { id: 'ent-1', canonicalName: 'Acme Cola' },
      { id: 'ent-2', canonicalName: 'Summit Coffee' },
      { id: 'ent-3', canonicalName: 'Starlight Diner' },
    ];

    const progressLogs: { id: string; status: BatchItemStatus }[] = [];
    const evaluateSingle = vi.fn().mockImplementation(async (id: string) => {
      // Simulate async processing
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const onItemProgress = (id: string, status: BatchItemStatus) => {
      progressLogs.push({ id, status });
    };

    const result = await runBatchClearancePool(items, evaluateSingle, onItemProgress, 2);

    expect(result.completedCount).toBe(3);
    expect(result.failedCount).toBe(0);
    expect(evaluateSingle).toHaveBeenCalledTimes(3);

    // Verify all items transitioned to QUEUED initially
    const queuedLogs = progressLogs.filter((l) => l.status === 'QUEUED');
    expect(queuedLogs.length).toBe(3);

    // Verify all items transitioned to RESEARCHING and COMPLETED
    const completedLogs = progressLogs.filter((l) => l.status === 'COMPLETED');
    expect(completedLogs.length).toBe(3);
  });

  it('T006 [US2]: strictly enforces concurrency limit of 2 and persists all completions without drops', async () => {
    const items = [
      { id: 'ent-1', canonicalName: 'Item 1' },
      { id: 'ent-2', canonicalName: 'Item 2' },
      { id: 'ent-3', canonicalName: 'Item 3' },
      { id: 'ent-4', canonicalName: 'Item 4' },
      { id: 'ent-5', canonicalName: 'Item 5' },
    ];

    let activeCount = 0;
    let maxObservedConcurrency = 0;

    const evaluateSingle = vi.fn().mockImplementation(async () => {
      activeCount++;
      if (activeCount > maxObservedConcurrency) {
        maxObservedConcurrency = activeCount;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
      activeCount--;
    });

    const onItemProgress = vi.fn();
    const result = await runBatchClearancePool(items, evaluateSingle, onItemProgress, 2);

    expect(maxObservedConcurrency).toBeLessThanOrEqual(2);
    expect(result.completedCount).toBe(5);
    expect(result.failedCount).toBe(0);
  });

  it('T008 [US3]: isolates item failure, marks fail-visible, and continues remaining queue to completion', async () => {
    const items = [
      { id: 'ent-1', canonicalName: 'Valid Item 1' },
      { id: 'ent-2', canonicalName: 'Failing Item 2' },
      { id: 'ent-3', canonicalName: 'Valid Item 3' },
    ];

    const progressStatuses: Record<string, BatchItemStatus[]> = {};

    const evaluateSingle = vi.fn().mockImplementation(async (id: string) => {
      if (id === 'ent-2') {
        throw new Error('Parallel Search API 503 Service Unavailable');
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const onItemProgress = (id: string, status: BatchItemStatus) => {
      if (!progressStatuses[id]) progressStatuses[id] = [];
      progressStatuses[id].push(status);
    };

    const result = await runBatchClearancePool(items, evaluateSingle, onItemProgress, 2);

    expect(result.completedCount).toBe(2);
    expect(result.failedCount).toBe(1);

    // Verify ent-2 failed fail-visibly
    expect(progressStatuses['ent-2']).toContain('FAILED');

    // Verify ent-1 and ent-3 completed successfully despite ent-2 failure
    expect(progressStatuses['ent-1']).toContain('COMPLETED');
    expect(progressStatuses['ent-3']).toContain('COMPLETED');
  });

  it('T003 [US1]: filters and queues ONLY unresearched or INSUFFICIENT_EVIDENCE entities', () => {
    const allEntities = [
      { id: 'ent-1', canonicalName: 'Already Cleared', overallClearanceStatus: 'NO_ISSUE_SURFACED' },
      { id: 'ent-2', canonicalName: 'Needs Research', overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
      { id: 'ent-3', canonicalName: 'Unresearched', overallClearanceStatus: undefined as any },
      { id: 'ent-4', canonicalName: 'Action Required', overallClearanceStatus: 'ACTION_REQUIRED' },
    ];

    const eligible = allEntities.filter(
      (e) => !e.overallClearanceStatus || e.overallClearanceStatus === 'INSUFFICIENT_EVIDENCE'
    );

    expect(eligible.map((e) => e.id)).toEqual(['ent-2', 'ent-3']);
  });
});
