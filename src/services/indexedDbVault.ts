/**
 * Unified Multi-Store IndexedDB Data & Audio Vault (Tier 2 Storage)
 *
 * Implements strict separation between Audio Cache and Application Data:
 * - documents, pages, textSegments
 * - audioSegments, audioMetadata
 * - bookmarks, notes, highlights
 * - pronunciationOverrides, playbackState, pdfBuffers
 */

import { SCHEMA_VERSION } from '../constants/versions';
import {
  DocumentItem,
  UserBookmark,
  SavedConcept,
  PronunciationOverride,
  AudioSegmentRecord,
  AudioMetadataRecord,
  PlaybackState,
} from '../types';

const VAULT_DB_NAME = 'pdf_reader_production_vault';

export class IndexedDbVaultService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported on this platform'));
      }

      const request = indexedDB.open(VAULT_DB_NAME, SCHEMA_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Documents Store
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('lastReadAt', 'lastReadAt', { unique: false });
          docStore.createIndex('name', 'name', { unique: false });
        }

        // 2. Audio Segments Store (Raw Audio + Deterministic Key)
        if (!db.objectStoreNames.contains('audioSegments')) {
          const audioStore = db.createObjectStore('audioSegments', { keyPath: 'audioKey' });
          audioStore.createIndex('documentId', 'documentId', { unique: false });
          audioStore.createIndex('voiceId', 'voiceId', { unique: false });
          audioStore.createIndex('createdAt', 'createdAt', { unique: false });
          audioStore.createIndex('lastPlayedAt', 'lastPlayedAt', { unique: false });
        }

        // 3. Audio Metadata Store
        if (!db.objectStoreNames.contains('audioMetadata')) {
          const metaStore = db.createObjectStore('audioMetadata', { keyPath: 'audioKey' });
          metaStore.createIndex('documentId', 'documentId', { unique: false });
        }

        // 4. Bookmarks Store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bmStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bmStore.createIndex('documentId', 'documentId', { unique: false });
          bmStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 5. Notes & Concept Memory Store
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('documentId', 'documentId', { unique: false });
          noteStore.createIndex('term', 'term', { unique: false });
        }

        // 6. Highlights Store
        if (!db.objectStoreNames.contains('highlights')) {
          const hlStore = db.createObjectStore('highlights', { keyPath: 'id' });
          hlStore.createIndex('documentId', 'documentId', { unique: false });
        }

        // 7. Pronunciation Overrides Store (P1 requirement)
        if (!db.objectStoreNames.contains('pronunciationOverrides')) {
          const pronStore = db.createObjectStore('pronunciationOverrides', { keyPath: 'id' });
          pronStore.createIndex('term', 'term', { unique: false });
        }

        // 8. Playback State Store
        if (!db.objectStoreNames.contains('playbackState')) {
          db.createObjectStore('playbackState', { keyPath: 'id' });
        }

        // 9. PDF Buffers Store
        if (!db.objectStoreNames.contains('pdfBuffers')) {
          db.createObjectStore('pdfBuffers');
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open vault'));
    });

    return this.dbPromise;
  }

  // -------------------------------------------------------------
  // Audio Segments Operations
  // -------------------------------------------------------------

  public async putAudioSegment(record: AudioSegmentRecord): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(['audioSegments', 'audioMetadata'], 'readwrite');
        const audioStore = tx.objectStore('audioSegments');
        const metaStore = tx.objectStore('audioMetadata');

        audioStore.put(record);

        const metadataRecord: AudioMetadataRecord = {
          audioKey: record.audioKey,
          documentId: record.documentId,
          chapterId: record.chapterId,
          segmentId: record.segmentId,
          durationMs: record.durationMs,
          wordCount: record.normalizedText ? record.normalizedText.split(/\s+/).length : 0,
          voiceId: record.voiceId,
          sampleRate: record.sampleRate,
          createdAt: record.createdAt,
          lastPlayedAt: record.lastPlayedAt,
          sizeBytes: record.sizeBytes,
        };
        metaStore.put(metadataRecord);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Vault: putAudioSegment error', err);
    }
  }

  public async getAudioSegment(audioKey: string): Promise<AudioSegmentRecord | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('audioSegments', 'readonly');
        const store = tx.objectStore('audioSegments');
        const req = store.get(audioKey);
        req.onsuccess = () => {
          const rec = req.result as AudioSegmentRecord | undefined;
          if (rec) {
            // Touch lastPlayedAt asynchronously
            this.touchAudioSegment(audioKey);
            resolve(rec);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async hasAudioSegment(audioKey: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('audioMetadata', 'readonly');
        const store = tx.objectStore('audioMetadata');
        const req = store.count(IDBKeyRange.only(audioKey));
        req.onsuccess = () => resolve(req.result > 0);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  private async touchAudioSegment(audioKey: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('audioMetadata', 'readwrite');
      const store = tx.objectStore('audioMetadata');
      const req = store.get(audioKey);
      req.onsuccess = () => {
        if (req.result) {
          req.result.lastPlayedAt = Date.now();
          store.put(req.result);
        }
      };
    } catch {
      // ignore
    }
  }

  public async deleteAudioSegment(audioKey: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['audioSegments', 'audioMetadata'], 'readwrite');
      tx.objectStore('audioSegments').delete(audioKey);
      tx.objectStore('audioMetadata').delete(audioKey);
    } catch (err) {
      console.warn('Vault: deleteAudioSegment error', err);
    }
  }

  public async clearAllAudio(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['audioSegments', 'audioMetadata'], 'readwrite');
      tx.objectStore('audioSegments').clear();
      tx.objectStore('audioMetadata').clear();
    } catch (err) {
      console.warn('Vault: clearAllAudio error', err);
    }
  }

  public async clearDocumentAudio(documentId: string): Promise<number> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['audioSegments', 'audioMetadata'], 'readwrite');
      const metaStore = tx.objectStore('audioMetadata');
      const audioStore = tx.objectStore('audioSegments');
      const index = metaStore.index('documentId');
      const req = index.getAllKeys(IDBKeyRange.only(documentId));

      return new Promise((resolve) => {
        req.onsuccess = () => {
          const keys = req.result as string[];
          for (const k of keys) {
            audioStore.delete(k);
            metaStore.delete(k);
          }
          resolve(keys.length);
        };
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  // -------------------------------------------------------------
  // Pronunciation Overrides Operations
  // -------------------------------------------------------------

  public async getPronunciationOverrides(): Promise<PronunciationOverride[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('pronunciationOverrides', 'readonly');
        const store = tx.objectStore('pronunciationOverrides');
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as PronunciationOverride[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async savePronunciationOverride(override: PronunciationOverride): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('pronunciationOverrides', 'readwrite');
      tx.objectStore('pronunciationOverrides').put(override);
    } catch (err) {
      console.warn('Vault: savePronunciationOverride error', err);
    }
  }

  public async deletePronunciationOverride(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('pronunciationOverrides', 'readwrite');
      tx.objectStore('pronunciationOverrides').delete(id);
    } catch (err) {
      console.warn('Vault: deletePronunciationOverride error', err);
    }
  }

  // -------------------------------------------------------------
  // Documents Operations
  // -------------------------------------------------------------

  public async getAllDocuments(): Promise<DocumentItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('documents', 'readonly');
        const store = tx.objectStore('documents');
        const req = store.getAll();
        req.onsuccess = () => {
          const docs = (req.result as DocumentItem[]) || [];
          docs.sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));
          resolve(docs);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async saveDocument(doc: DocumentItem): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('documents', 'readwrite');
      tx.objectStore('documents').put(doc);
    } catch (err) {
      console.warn('Vault: saveDocument error', err);
    }
  }

  public async deleteDocument(docId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['documents', 'pdfBuffers'], 'readwrite');
      tx.objectStore('documents').delete(docId);
      tx.objectStore('pdfBuffers').delete(docId);
      await this.clearDocumentAudio(docId);
    } catch (err) {
      console.warn('Vault: deleteDocument error', err);
    }
  }

  public async savePdfBuffer(docId: string, buffer: ArrayBuffer): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('pdfBuffers', 'readwrite');
      tx.objectStore('pdfBuffers').put(buffer, docId);
    } catch (err) {
      console.warn('Vault: savePdfBuffer error', err);
    }
  }

  public async getPdfBuffer(docId: string): Promise<ArrayBuffer | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('pdfBuffers', 'readonly');
        const req = tx.objectStore('pdfBuffers').get(docId);
        req.onsuccess = () => resolve((req.result as ArrayBuffer) || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
}

export const vault = new IndexedDbVaultService();
