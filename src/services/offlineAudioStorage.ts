// IndexedDB-powered Offline Audio Storage for Google Gemini Voice Pack
// Enables high-performance, 0ms latency, zero-network playback once cached

import { AudioSegmentRecord, VoiceNarratorProfile, CadenceMode } from '../types';
import { vault } from './indexedDbVault';
import { computeAudioCacheKey, computeStableHash } from './audioCacheKey';
import { GEMINI_TTS_MODEL_ID, TTS_PIPELINE_VERSION } from '../constants/versions';
import { DocumentNormalizer } from './documentNormalizer';

export interface AudioClipLookup {
  rate?: number; pitch?: number;
  profile?: VoiceNarratorProfile; cadenceMode?: CadenceMode;
  language?: string; modelId?: string;
  docId?: string; chapterId?: string; sentenceIndex?: number;
}

export interface CachedAudioClip {
  cacheKey: string;
  voiceName: string;
  textHash: string;
  textSnippet: string;
  dataUrl: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: number;
  lastAccessedAt: number;
  docId?: string;
  sentenceIndex?: number;
}

export interface CacheStats {
  count: number;
  totalSizeBytes: number;
  formattedSize: string;
  voiceBreakdown: Record<string, number>;
}

class OfflineAudioStorageService {
  /**
   * Save an audio clip to local offline IndexedDB vault
   */
  public async storeAudioClip(
    voiceName: string,
    text: string,
    dataUrl: string,
    metadata?: AudioClipLookup
  ): Promise<void> {
    try {
      const clean = DocumentNormalizer.normalizeForTTS(text);
      const audioKey = computeAudioCacheKey({
        text: clean,
        voiceName,
        rate: metadata?.rate,
        pitch: metadata?.pitch,
        profile: metadata?.profile,
        cadenceMode: metadata?.cadenceMode,
        language: metadata?.language,
        modelId: metadata?.modelId,
      });

      const approxSizeBytes = Math.round((dataUrl.length * 3) / 4);

      const record: AudioSegmentRecord = {
        audioKey,
        documentId: metadata?.docId || 'default',
        chapterId: metadata?.chapterId,
        segmentId: `${metadata?.docId || 'doc'}_${metadata?.sentenceIndex ?? 0}`,
        textHash: computeStableHash(clean),
        normalizedText: clean,
        voiceId: voiceName,
        modelId: GEMINI_TTS_MODEL_ID,
        voiceSettingsHash: `${metadata?.rate || 1.0}_${metadata?.pitch || 1.0}`,
        audioFormat: 'audio/wav',
        sampleRate: 24000,
        durationMs: 0,
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
        sizeBytes: approxSizeBytes,
        version: TTS_PIPELINE_VERSION,
        audioDataUrl: dataUrl,
      };

      await vault.putAudioSegment(record);
    } catch (err) {
      console.warn('Failed to store audio clip in IndexedDB offline vault:', err);
    }
  }

  /**
   * Retrieve cached audio data URL from offline IndexedDB
   */
  public async getAudioClip(
    voiceName: string,
    text: string,
    metadata?: AudioClipLookup
  ): Promise<string | null> {
    try {
      const clean = DocumentNormalizer.normalizeForTTS(text);
      const audioKey = computeAudioCacheKey({
        text: clean,
        voiceName,
        rate: metadata?.rate,
        pitch: metadata?.pitch,
        profile: metadata?.profile,
        cadenceMode: metadata?.cadenceMode,
        language: metadata?.language,
        modelId: metadata?.modelId,
      });

      const record = await vault.getAudioSegment(audioKey);
      if (record && record.audioDataUrl) {
        return record.audioDataUrl;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a specific sentence is cached offline
   */
  public async hasAudioClip(
    voiceName: string,
    text: string,
    metadata?: AudioClipLookup
  ): Promise<boolean> {
    try {
      const clean = DocumentNormalizer.normalizeForTTS(text);
      const audioKey = computeAudioCacheKey({
        text: clean,
        voiceName,
        rate: metadata?.rate,
        pitch: metadata?.pitch,
        profile: metadata?.profile,
        cadenceMode: metadata?.cadenceMode,
        language: metadata?.language,
        modelId: metadata?.modelId,
      });

      return await vault.hasAudioSegment(audioKey);
    } catch {
      return false;
    }
  }

  /**
   * Calculate overall cache statistics
   */
  public async getCacheStats(): Promise<CacheStats> {
    try {
      const db = await vault.getDB();
      if (!db.objectStoreNames.contains('audioSegments')) {
        return { count: 0, totalSizeBytes: 0, formattedSize: '0 B', voiceBreakdown: {} };
      }

      return new Promise((resolve) => {
        const tx = db.transaction('audioSegments', 'readonly');
        const store = tx.objectStore('audioSegments');
        const req = store.openCursor();

        let count = 0;
        let totalSizeBytes = 0;
        const voiceBreakdown: Record<string, number> = {};

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor) {
            count++;
            const item = cursor.value as AudioSegmentRecord;
            totalSizeBytes += item.sizeBytes || 0;
            voiceBreakdown[item.voiceId] = (voiceBreakdown[item.voiceId] || 0) + 1;
            cursor.continue();
          } else {
            const formattedSize = this.formatBytes(totalSizeBytes);
            resolve({ count, totalSizeBytes, formattedSize, voiceBreakdown });
          }
        };

        req.onerror = () => {
          resolve({ count: 0, totalSizeBytes: 0, formattedSize: '0 B', voiceBreakdown: {} });
        };
      });
    } catch {
      return { count: 0, totalSizeBytes: 0, formattedSize: '0 B', voiceBreakdown: {} };
    }
  }

  /**
   * Clear all offline cached audio
   */
  public async clearAudioCache(): Promise<void> {
    await vault.clearAllAudio();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export const offlineAudioStorage = new OfflineAudioStorageService();
