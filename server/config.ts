export type ExecutionMode = 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';

export interface AppConfig {
  executionMode: ExecutionMode;
  port: number;
  geminiApiKey?: string;
  parallelWebApiKey?: string;
}

export function loadConfig(): AppConfig {
  const modeEnv = process.env.EXECUTION_MODE?.toUpperCase() as ExecutionMode | undefined;
  const executionMode: ExecutionMode = modeEnv || 'DEMO_MODE';

  const port = parseInt(process.env.PORT || '8088', 10);
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const parallelWebApiKey = process.env.PARALLEL_WEB_API_KEY;

  if (executionMode === 'CLOUD_MODE') {
    if (!geminiApiKey || !parallelWebApiKey) {
      const missingKeys = [];
      if (!geminiApiKey) missingKeys.push('GEMINI_API_KEY');
      if (!parallelWebApiKey) missingKeys.push('PARALLEL_WEB_API_KEY');
      
      throw new Error(
        `[ClearanceScout Configuration Error] Execution mode is CLOUD_MODE, but required API key(s) missing: ${missingKeys.join(
          ', '
        )}. Set environment variables or switch to DEMO_MODE or TEST_MODE.`
      );
    }
  }

  return {
    executionMode,
    port,
    geminiApiKey,
    parallelWebApiKey,
  };
}

export const config = loadConfig();
