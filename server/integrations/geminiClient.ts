import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

let activeVertexLocation = config.gcpLocation || 'us-central1';

export function geminiConfigured(): boolean {
  if (config.geminiBackend === 'vertex') {
    return Boolean(config.gcpProject);
  }
  return Boolean(config.geminiApiKey);
}

export function getActiveVertexLocation(): string {
  return activeVertexLocation;
}

export function createGeminiClient(locationOverride?: string): GoogleGenAI | null {
  if (!geminiConfigured()) {
    return null;
  }

  if (config.geminiBackend === 'vertex') {
    const loc = locationOverride || activeVertexLocation;
    const client = new GoogleGenAI({
      vertexai: true,
      project: config.gcpProject,
      location: loc,
    });

    // Wrap generateContent to handle Vertex region rejection and auto-retry in 'global'
    const originalGenerateContent = client.models.generateContent.bind(client.models);
    client.models.generateContent = async (params: any) => {
      try {
        return await originalGenerateContent(params);
      } catch (err: any) {
        const errStr = String(err?.message || err);
        const isNotFoundOrLocation =
          err?.status === 404 ||
          errStr.includes('404') ||
          errStr.includes('was not found') ||
          errStr.includes('locations/');
        if (isNotFoundOrLocation && activeVertexLocation !== 'global') {
          console.warn(
            `[GeminiClient] Vertex AI rejected model in ${activeVertexLocation}, retrying with location 'global'...`
          );
          activeVertexLocation = 'global';
          const globalClient = new GoogleGenAI({
            vertexai: true,
            project: config.gcpProject,
            location: 'global',
          });
          return await globalClient.models.generateContent(params);
        }
        throw err;
      }
    };

    return client;
  }

  return new GoogleGenAI({
    apiKey: config.geminiApiKey,
  });
}
