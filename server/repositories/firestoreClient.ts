import { Firestore } from '@google-cloud/firestore';
import { config } from '../config.js';

class InMemoryStore {
  private collections: Map<string, Map<string, any>> = new Map();

  listCollectionNames(): string[] {
    return Array.from(this.collections.keys());
  }

  private getCollection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name)!;
  }

  doc(path: string) {
    const parts = path.split('/');
    const collectionName = parts.slice(0, -1).join('/');
    const docId = parts[parts.length - 1];
    const col = this.getCollection(collectionName);
    return {
      get: async () => ({
        exists: col.has(docId),
        data: () => col.get(docId),
      }),
      set: async (data: any) => {
        col.set(docId, data);
      },
      update: async (data: any) => {
        const existing = col.get(docId) || {};
        col.set(docId, { ...existing, ...data });
      },
      delete: async () => {
        col.delete(docId);
      },
    };
  }

  async collection(name: string) {
    const col = this.getCollection(name);
    return {
      doc: (id: string) => ({
        get: async () => ({
          exists: col.has(id),
          data: () => col.get(id),
        }),
        set: async (data: any) => {
          col.set(id, data);
        },
        update: async (data: any) => {
          const existing = col.get(id) || {};
          col.set(id, { ...existing, ...data });
        },
        delete: async () => {
          col.delete(id);
        },
      }),
      where: (field: string, op: string, val: any) => ({
        get: async () => {
          const docs = Array.from(col.entries())
            .filter(([_, data]) => data && data[field] === val)
            .map(([id, data]) => ({
              id,
              data: () => data,
            }));
          return {
            empty: docs.length === 0,
            docs,
          };
        },
      }),
      get: async () => ({
        empty: col.size === 0,
        docs: Array.from(col.entries()).map(([id, data]) => ({
          id,
          data: () => data,
        })),
      }),
    };
  }

  async runTransaction(updateFunction: (transaction: any) => Promise<any>): Promise<any> {
    const tx = {
      get: async (docRef: any) => await docRef.get(),
      set: async (docRef: any, data: any) => await docRef.set(data),
      update: async (docRef: any, data: any) => await docRef.update(data),
      delete: async (docRef: any) => await docRef.delete(),
    };
    return await updateFunction(tx);
  }
}

let dbInstance: any;

export function getDb(): any {
  if (!dbInstance) {
    const isCloudMode = config.executionMode === 'CLOUD_MODE' || process.env.EXECUTION_MODE === 'CLOUD_MODE';

    if (isCloudMode) {
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || undefined;
        dbInstance = new Firestore({ projectId, ignoreUndefinedProperties: true });
      } catch (err) {
        console.error('[FirestoreClient Error] Failed to initialize Google Cloud Firestore via ADC:', err);
        throw err;
      }
    } else {
      // In TEST_MODE, DEMO_MODE, or local test suite, use in-memory store
      dbInstance = new InMemoryStore();
    }
  }
  return dbInstance;
}

export function resetDb(): void {
  dbInstance = new InMemoryStore();
}

export async function verifyFirestoreConnectivity(): Promise<{ connected: boolean; error?: string }> {
  try {
    const isCloudMode = config.executionMode === 'CLOUD_MODE' || process.env.EXECUTION_MODE === 'CLOUD_MODE';
    const db = getDb();

    if (isCloudMode) {
      if (!(db instanceof Firestore)) {
        return {
          connected: false,
          error: 'CLOUD_MODE requires authentic Google Cloud Firestore instance via ADC; in-memory store is prohibited in live runtime.',
        };
      }
      // Execute a lightweight read to verify ADC credentials and project reachability
      const testCol = db.collection('_health_check');
      await testCol.limit(1).get();
    }

    return { connected: true };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Failed to connect to Google Cloud Firestore via ADC',
    };
  }
}

export const getFirestoreClient = getDb;
