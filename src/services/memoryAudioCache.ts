/**
 * Bounded Multi-Parameter Memory Audio Cache (Tier 1 RAM Cache)
 *
 * Implements strict memory accounting (maxBytes + maxEntries + TTL + LRU eviction)
 * to prevent browser tab out-of-memory crashes while guaranteeing 0ms audio playback.
 */

interface MemoryCacheEntry {
  key: string;
  dataUrl: string;
  sizeBytes: number;
  createdAt: number;
  lastAccessedAt: number;
}

export interface MemoryCacheConfig {
  maxEntries?: number;   // Max clip count (default: 200)
  maxBytes?: number;     // Max memory consumption in bytes (default: 96MB)
  ttlMs?: number;        // Time-to-live in ms (default: 2 hours)
}

export class BoundedMemoryAudioCache {
  private cache = new Map<string, MemoryCacheEntry>();
  private currentSizeBytes = 0;
  private maxEntries: number;
  private maxBytes: number;
  private ttlMs: number;

  constructor(config?: MemoryCacheConfig) {
    this.maxEntries = config?.maxEntries || 200;
    this.maxBytes = config?.maxBytes || 96 * 1024 * 1024; // 96 MB
    this.ttlMs = config?.ttlMs || 2 * 60 * 60 * 1000;      // 2 hours
  }

  public get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    // Check TTL expiration
    if (now - entry.createdAt > this.ttlMs) {
      this.delete(key);
      return null;
    }

    // Refresh LRU position (delete & re-insert)
    entry.lastAccessedAt = now;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.dataUrl;
  }

  public set(key: string, dataUrl: string, explicitSizeBytes?: number): void {
    const now = Date.now();
    const sizeBytes = explicitSizeBytes || Math.round((dataUrl.length * 3) / 4);

    // If key already exists, update size delta
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSizeBytes -= existing.sizeBytes;
      this.cache.delete(key);
    }

    // Enforce byte and entry limits via LRU eviction
    while (
      (this.cache.size >= this.maxEntries || this.currentSizeBytes + sizeBytes > this.maxBytes) &&
      this.cache.size > 0
    ) {
      this.evictOldest();
    }

    const newEntry: MemoryCacheEntry = {
      key,
      dataUrl,
      sizeBytes,
      createdAt: now,
      lastAccessedAt: now,
    };

    this.cache.set(key, newEntry);
    this.currentSizeBytes += sizeBytes;
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.delete(key);
      return false;
    }
    return true;
  }

  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSizeBytes -= entry.sizeBytes;
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  public clear(): void {
    this.cache.clear();
    this.currentSizeBytes = 0;
  }

  private evictOldest(): void {
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  public getStats() {
    return {
      entriesCount: this.cache.size,
      maxEntries: this.maxEntries,
      usedBytes: this.currentSizeBytes,
      maxBytes: this.maxBytes,
      formattedUsedSize: `${(this.currentSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
      formattedMaxSize: `${(this.maxBytes / (1024 * 1024)).toFixed(0)} MB`,
    };
  }
}

export const memoryAudioCache = new BoundedMemoryAudioCache();
