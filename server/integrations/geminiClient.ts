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
    let loc = locationOverride || activeVertexLocation;
    let client = new GoogleGenAI({
      vertexai: true,
      project: config.gcpProject,
      location: loc,
    });

    return new Proxy(client, {
      get(target, prop) {
        if (prop === 'models') {
          return new Proxy(client.models, {
            get(mTarget, mProp) {
              if (mProp === 'generateContent') {
                return async (params: any) => {
                  if (!locationOverride && loc !== activeVertexLocation) {
                    loc = activeVertexLocation;
                    client = new GoogleGenAI({
                      vertexai: true,
                      project: config.gcpProject,
                      location: loc,
                    });
                  }
                  try {
                    return await client.models.generateContent(params);
                  } catch (err: any) {
                    const errStr = String(err?.message || err);
                    const isNotFoundOrLocation =
                      err?.status === 404 ||
                      errStr.includes('404') ||
                      errStr.includes('was not found') ||
                      errStr.includes('locations/');
                    if (isNotFoundOrLocation && loc !== 'global') {
                      console.warn(
                        `[GeminiClient] Vertex AI rejected model in ${loc}, retrying with location 'global'...`
                      );
                      activeVertexLocation = 'global';
                      loc = 'global';
                      client = new GoogleGenAI({
                        vertexai: true,
                        project: config.gcpProject,
                        location: 'global',
                      });
                      return await client.models.generateContent(params);
                    }
                    throw err;
                  }
                };
              }
              return Reflect.get(client.models, mProp);
            }
          });
        }
        return Reflect.get(client, prop);
      }
    });
  }

  return new GoogleGenAI({
    apiKey: config.geminiApiKey,
  });
}
