import { useState } from 'react';

export type ExecutionMode = 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';

export function useExecutionMode(initialMode: ExecutionMode = 'DEMO_MODE') {
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(initialMode);

  return {
    executionMode,
    setExecutionMode,
  };
}
