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

  async doc(path: string) {
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
}

let dbInstance: any;

export function getDb(): any {
  if (!dbInstance) {
    if (config.executionMode === 'CLOUD_MODE' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        dbInstance = new Firestore();
      } catch (err) {
        console.warn('Firestore initialization fallback to in-memory store:', err);
        dbInstance = new InMemoryStore();
      }
    } else {
      // In TEST_MODE, DEMO_MODE, or local dev without GCP credentials, use in-memory store
      dbInstance = new InMemoryStore();
    }
  }
  return dbInstance;
}

export const getFirestoreClient = getDb;
