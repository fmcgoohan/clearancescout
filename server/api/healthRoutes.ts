import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { HealthStatusResponse } from '../types/healthTypes.js';
import { verifyFirestoreConnectivity } from '../repositories/firestoreClient.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req: Request, res: Response) => {
  const geminiConfigured = !!config.geminiApiKey;
  const parallelWebConfigured = !!config.parallelWebApiKey;
  const uptimeSeconds = Math.round(process.uptime() * 10) / 10;

  const credentials = {
    geminiConfigured,
    parallelWebConfigured,
  };

  if (config.executionMode === 'CLOUD_MODE') {
    const missing: string[] = [];
    if (!geminiConfigured) missing.push('GEMINI_API_KEY');
    if (!parallelWebConfigured) missing.push('PARALLEL_WEB_API_KEY');

    if (missing.length > 0) {
      const responsePayload: HealthStatusResponse = {
        status: 'DEGRADED',
        executionMode: 'CLOUD_MODE',
        uptimeSeconds,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        credentials,
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
        credentials,
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
    credentials,
  };

  return res.json(responsePayload);
});
