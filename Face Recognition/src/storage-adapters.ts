import { StoredFaceRecord } from './types';

/**
 * Interface for database persistence
 */
export interface IFaceStorageAdapter {
  saveFace(record: StoredFaceRecord): Promise<void>;
  getAllFaces(): Promise<StoredFaceRecord[]>;
  deleteFace(idOrLabel: string): Promise<void>;
}

/**
 * 1. Browser LocalStorage Adapter (Offline-First / Zero Backend)
 */
export class LocalStorageFaceAdapter implements IFaceStorageAdapter {
  private key = 'registered_face_records_v1';

  async saveFace(record: StoredFaceRecord): Promise<void> {
    const list = await this.getAllFaces();
    const existingIndex = list.findIndex((item) => item.label === record.label);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  async getAllFaces(): Promise<StoredFaceRecord[]> {
    const data = localStorage.getItem(this.key);
    return data ? (JSON.parse(data) as StoredFaceRecord[]) : [];
  }

  async deleteFace(idOrLabel: string): Promise<void> {
    const list = await this.getAllFaces();
    const filtered = list.filter((item) => item.label !== idOrLabel && item.id !== idOrLabel);
    localStorage.setItem(this.key, JSON.stringify(filtered));
  }
}

/**
 * 2. REST API Adapter (Node.js, Express, Django, FastAPI, Laravel, Spring)
 */
export class RestApiFaceAdapter implements IFaceStorageAdapter {
  constructor(private baseUrl: string, private authToken?: string) {}

  private get headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
    };
  }

  async saveFace(record: StoredFaceRecord): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/faces`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`Failed to save face: ${res.statusText}`);
  }

  async getAllFaces(): Promise<StoredFaceRecord[]> {
    const res = await fetch(`${this.baseUrl}/api/faces`, {
      method: 'GET',
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`Failed to fetch faces: ${res.statusText}`);
    return (await res.json()) as StoredFaceRecord[];
  }

  async deleteFace(idOrLabel: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/faces/${encodeURIComponent(idOrLabel)}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`Failed to delete face: ${res.statusText}`);
  }
}

/**
 * 3. Firebase Firestore Code Example Snippet
 * 
 * ```typescript
 * import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
 * 
 * export class FirestoreFaceAdapter implements IFaceStorageAdapter {
 *   private db = getFirestore();
 *   private col = 'registered_faces';
 * 
 *   async saveFace(record: StoredFaceRecord): Promise<void> {
 *     await setDoc(doc(this.db, this.col, record.label), record);
 *   }
 * 
 *   async getAllFaces(): Promise<StoredFaceRecord[]> {
 *     const snap = await getDocs(collection(this.db, this.col));
 *     return snap.docs.map(d => d.data() as StoredFaceRecord);
 *   }
 * 
 *   async deleteFace(label: string): Promise<void> {
 *     await deleteDoc(doc(this.db, this.col, label));
 *   }
 * }
 * ```
 */

/**
 * 4. Supabase / PostgreSQL Schema Example
 * 
 * ```sql
 * CREATE TABLE registered_faces (
 *   id TEXT PRIMARY KEY,
 *   label TEXT NOT NULL UNIQUE,
 *   display_name TEXT,
 *   descriptors JSONB NOT NULL,
 *   registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * ```
 */
