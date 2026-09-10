/**
 * Offline Storage Quota Manager
 *
 * Inspects device storage quota (navigator.storage.estimate()),
 * breaks down storage usage between Audio Segments, Documents, and System buffers,
 * and provides granular eviction policies.
 */

import { StorageQuotaStats, AudioSegmentRecord } from '../types';
import { vault } from './indexedDbVault';

export class StorageQuotaManager {
  /**
   * Calculates comprehensive storage stats across IndexedDB stores and browser quota
   */
  public static async getStorageStats(): Promise<StorageQuotaStats> {
    let quotaBytes = 10 * 1024 * 1024 * 1024; // Default 10GB estimation fallback
    let usedBytes = 0;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) quotaBytes = est.quota;
        if (est.usage) usedBytes = est.usage;
      } catch (err) {
        console.warn('Storage estimate failed:', err);
      }
    }

    let audioCacheBytes = 0;
    let audioClipsCount = 0;
    let documentsBytes = 0;
    let documentsCount = 0;
    const largestAudioClips: StorageQuotaStats['largestAudioClips'] = [];

    try {
      const db = await vault.getDB();

      // 1. Audit Audio Segments
      if (db.objectStoreNames.contains('audioSegments')) {
        await new Promise<void>((resolve) => {
          const tx = db.transaction('audioSegments', 'readonly');
          const store = tx.objectStore('audioSegments');
          const req = store.openCursor();

          req.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
            if (cursor) {
              const rec = cursor.value as AudioSegmentRecord;
              const size = rec.sizeBytes || Math.round((rec.audioDataUrl?.length || 0) * 0.75);
              audioCacheBytes += size;
              audioClipsCount++;

              largestAudioClips.push({
                audioKey: rec.audioKey,
                textSnippet: (rec.normalizedText || '').slice(0, 80),
                voiceName: rec.voiceId,
                sizeBytes: size,
                createdAt: rec.createdAt,
              });

              cursor.continue();
            } else {
              resolve();
            }
          };
          req.onerror = () => resolve();
        });
      }

      // Sort largest clips descending and take top 5
      largestAudioClips.sort((a, b) => b.sizeBytes - a.sizeBytes);
      const top5Clips = largestAudioClips.slice(0, 5);

      // 2. Audit Documents
      const docs = await vault.getAllDocuments();
      documentsCount = docs.length;
      documentsBytes = docs.reduce((sum, d) => sum + (d.size || 50000), 0);

      const systemBytes = Math.max(0, usedBytes - audioCacheBytes - documentsBytes);
      const usagePercent = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

      return {
        usedBytes: usedBytes || audioCacheBytes + documentsBytes,
        availableBytes: Math.max(0, quotaBytes - usedBytes),
        quotaBytes,
        audioCacheBytes,
        audioClipsCount,
        documentsBytes,
        documentsCount,
        systemBytes,
        usagePercent: Math.min(100, Math.round(usagePercent * 10) / 10),
        largestAudioClips: top5Clips,
      };
    } catch (err) {
      console.warn('Failed to calculate storage stats:', err);
      return {
        usedBytes: 0,
        availableBytes: quotaBytes,
        quotaBytes,
        audioCacheBytes: 0,
        audioClipsCount: 0,
        documentsBytes: 0,
        documentsCount: 0,
        systemBytes: 0,
        usagePercent: 0,
        largestAudioClips: [],
      };
    }
  }

  /**
   * Clears all audio clips that have not been played in the last X days
   */
  public static async clearUnusedAudio(olderThanDays = 7): Promise<number> {
    try {
      const db = await vault.getDB();
      const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      const tx = db.transaction(['audioSegments', 'audioMetadata'], 'readwrite');
      const metaStore = tx.objectStore('audioMetadata');
      const audioStore = tx.objectStore('audioSegments');
      const req = metaStore.openCursor();

      return new Promise((resolve) => {
        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
          if (cursor) {
            const meta = cursor.value;
            if (meta.lastPlayedAt < cutoffTime) {
              audioStore.delete(meta.audioKey);
              cursor.delete();
              deletedCount++;
            }
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  public static async clearAllAudio(): Promise<void> {
    await vault.clearAllAudio();
  }

  public static async clearDocumentAudio(documentId: string): Promise<number> {
    return await vault.clearDocumentAudio(documentId);
  }

  public static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
