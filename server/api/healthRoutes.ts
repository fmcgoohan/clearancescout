import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { HealthStatusResponse } from '../types/healthTypes.js';
import { verifyFirestoreConnectivity } from '../repositories/firestoreClient.js';
import { geminiConfigured, createGeminiClient } from '../integrations/geminiClient.js';

export const healthRouter = Router();

export async function runStartupProbe(): Promise<void> {
  if (config.executionMode !== 'CLOUD_MODE' || process.env.NODE_ENV === 'test') {
    return;
  }
  try {
    const client = createGeminiClient();
    if (!client) {
      console.warn('[Startup Probe] Gemini client not configured, skipping startup probe.');
      return;
    }
    console.log(`[Startup Probe] Probing ${config.geminiBackend} Gemini model gemini-3.6-flash...`);
    const probeRes = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Ping startup health check',
    });
    console.log(`[Startup Probe] Vertex AI Gemini probe SUCCESS: "${probeRes.text?.trim()}"`);
  } catch (err: any) {
    console.error(`[Startup Probe] Vertex AI Gemini probe ERROR: ${err?.message || err}`);
  }
}

healthRouter.get('/health', async (req: Request, res: Response) => {
  const isGeminiConfigured = geminiConfigured();
  const parallelWebConfigured = !!config.parallelWebApiKey;
  const uptimeSeconds = Math.round(process.uptime() * 10) / 10;

  const credentials = {
    geminiConfigured: isGeminiConfigured,
    parallelWebConfigured,
  };

  if (config.executionMode === 'CLOUD_MODE') {
    const missing: string[] = [];
    if (!isGeminiConfigured) {
      missing.push(config.geminiBackend === 'vertex' ? 'GOOGLE_CLOUD_PROJECT' : 'GEMINI_API_KEY');
    }
    if (!parallelWebConfigured) missing.push('PARALLEL_WEB_API_KEY');

    const revision = process.env.K_REVISION || 'unknown';
    const service = process.env.K_SERVICE || 'clearancescout';

    if (missing.length > 0) {
      const responsePayload: HealthStatusResponse = {
        status: 'DEGRADED',
        executionMode: 'CLOUD_MODE',
        uptimeSeconds,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        revision,
        service,
        credentials,
        geminiBackend: config.geminiBackend,
        ...(config.geminiBackend === 'vertex' ? { geminiProject: config.gcpProject } : {}),
        missingCredentials: missing,
        error: `CLOUD_MODE is active but missing required API credentials: ${missing.join(', ')}. Production clearance operations will fail visibly without silent mock fallback.`,
      };
      return res.status(503).json(responsePayload);
    }

    const firestoreCheck = await verifyFirestoreConnectivity();
    if (!firestoreCheck.connected) {
      const responsePayload: HealthStatusResponse = {
        status: 'DEGRADED',
        executionMode: 'CLOUD_MODE',
        uptimeSeconds,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        revision,
        service,
        credentials,
        geminiBackend: config.geminiBackend,
        ...(config.geminiBackend === 'vertex' ? { geminiProject: config.gcpProject } : {}),
        firestoreConnected: false,
        error: `CLOUD_MODE is active but Google Cloud Firestore via ADC is unreachable: ${firestoreCheck.error}. Volatile in-memory fallback is prohibited in production.`,
      };
      return res.status(503).json(responsePayload);
    }
  }

  const responsePayload: HealthStatusResponse = {
    status: 'HEALTHY',
    executionMode: config.executionMode as any,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    revision: process.env.K_REVISION || 'unknown',
    service: process.env.K_SERVICE || 'clearancescout',
    credentials,
    geminiBackend: config.geminiBackend,
    ...(config.geminiBackend === 'vertex' ? { geminiProject: config.gcpProject } : {}),
    ...(config.executionMode === 'CLOUD_MODE' ? { firestoreConnected: true } : {}),
  };

  return res.json(responsePayload);
});
