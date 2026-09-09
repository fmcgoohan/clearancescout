export type ExecutionMode = 'TEST_MODE' | 'DEMO_MODE' | 'CLOUD_MODE';
export type GeminiBackend = 'vertex' | 'apikey';

export interface AppConfig {
  executionMode: ExecutionMode;
  geminiBackend: GeminiBackend;
  gcpProject: string;
  gcpLocation: string;
  port: number;
  geminiApiKey?: string;
  parallelWebApiKey?: string;
  demoAccessToken?: string;
}

export function loadConfig(): AppConfig {
  const modeEnv = process.env.EXECUTION_MODE?.toUpperCase() as ExecutionMode | undefined;
  const executionMode: ExecutionMode = modeEnv || 'DEMO_MODE';

  const geminiBackend: GeminiBackend =
    process.env.GEMINI_BACKEND?.toLowerCase() === 'apikey' ? 'apikey' : 'vertex';

  const gcpProject = process.env.GOOGLE_CLOUD_PROJECT || 'clearance-scout-2026';
  const gcpLocation = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  const port = parseInt(process.env.PORT || '8088', 10);
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const parallelWebApiKey = process.env.PARALLEL_WEB_API_KEY;
  const demoAccessToken = process.env.DEMO_ACCESS_TOKEN || process.env.DEMO_TOKEN;

  if (executionMode === 'CLOUD_MODE') {
    const missingKeys: string[] = [];
    if (geminiBackend === 'apikey' && !geminiApiKey) {
      missingKeys.push('GEMINI_API_KEY');
    }
    if (geminiBackend === 'vertex' && !gcpProject) {
      missingKeys.push('GOOGLE_CLOUD_PROJECT');
    }
    if (!parallelWebApiKey) {
      missingKeys.push('PARALLEL_WEB_API_KEY');
    }

    if (missingKeys.length > 0) {
      throw new Error(
        `[ClearanceScout Configuration Error] Execution mode is CLOUD_MODE, but required credential(s) missing: ${missingKeys.join(
          ', '
        )}. Set environment variables or switch to DEMO_MODE or TEST_MODE.`
      );
    }
  }

  return {
    executionMode,
    geminiBackend,
    gcpProject,
    gcpLocation,
    port,
    geminiApiKey: geminiBackend === 'apikey' ? geminiApiKey : undefined,
    parallelWebApiKey,
    demoAccessToken: demoAccessToken?.trim() || undefined,
  };
}

export const config = loadConfig();
