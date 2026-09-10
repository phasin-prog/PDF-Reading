/**
 * Priority Prefetch Scheduler & Queue Orchestrator
 *
 * DEPRECATED (offline-first): TTSEngine now owns prefetch via prefetchUpcomingSentences()
 * with a unified computeAudioCacheKey (rate/pitch/profile/cadence). This scheduler is kept
 * for background chapter pre-cache only and is NOT wired to playback. Do not use for
 * live sentence prefetch unless setFetchFunction is explicitly configured.
 *
 * Implements priority-weighted pre-fetching:
 * - Priority 0: Active sentence (immediate execution)
 * - Priority 1: Next segment (+1)
 * - Priority 2: Previous segment (-1)
 * - Priority 3: Lookahead (+2, +3, +4)
 * - Priority 4: Paragraph remainder
 * - Priority 5: Background chapter pre-cache
 */

import { PrefetchPriority, PrefetchQueueTask } from '../types';
import { computeAudioCacheKey } from './audioCacheKey';
import { memoryAudioCache } from './memoryAudioCache';
import { vault } from './indexedDbVault';
import { DocumentNormalizer } from './documentNormalizer';
import { GEMINI_TTS_MODEL_ID } from '../constants/versions';

type FetchFunction = (text: string, voiceName: string) => Promise<string>;

export class PriorityPrefetchScheduler {
  private queue: PrefetchQueueTask[] = [];
  private isProcessing = false;
  private maxConcurrency = 2;
  private activeWorkers = 0;
  private fetchFunction: FetchFunction | null = null;
  private subscribers: Array<(tasks: PrefetchQueueTask[]) => void> = [];

  public setFetchFunction(fn: FetchFunction) {
    this.fetchFunction = fn;
  }

  public subscribe(callback: (tasks: PrefetchQueueTask[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.getTasks());
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify() {
    const current = this.getTasks();
    for (const sub of this.subscribers) {
      sub(current);
    }
  }

  public getTasks(): PrefetchQueueTask[] {
    return [...this.queue];
  }

  /**
   * Enqueue a prefetch task with priority
   */
  public enqueue(
    priority: PrefetchPriority,
    text: string,
    voiceName: string,
    pageIndex: number,
    sentenceIndex: number,
    docId?: string
  ): void {
    if (!text || !text.trim()) return;

    const clean = DocumentNormalizer.normalizeForTTS(text);
    const audioKey = computeAudioCacheKey({ text: clean, voiceName });

    // 1. If already in Memory Cache, skip enqueueing
    if (memoryAudioCache.has(audioKey)) {
      return;
    }

    // 2. Check if identical task already queued
    const existingIndex = this.queue.findIndex(
      (t) => t.pageIndex === pageIndex && t.sentenceIndex === sentenceIndex && t.voiceName === voiceName
    );

    if (existingIndex !== -1) {
      // Upgrade priority if new request has higher priority (lower number = higher priority)
      if (priority < this.queue[existingIndex].priority) {
        this.queue[existingIndex].priority = priority;
        this.sortQueue();
      }
      return;
    }

    const task: PrefetchQueueTask = {
      id: `${pageIndex}_${sentenceIndex}_${Date.now()}`,
      priority,
      text: clean,
      voiceName,
      documentId: docId,
      pageIndex,
      sentenceIndex,
      addedAt: Date.now(),
      status: 'PENDING',
    };

    this.queue.push(task);
    this.sortQueue();
    this.notify();
    this.processNext();
  }

  /**
   * Schedules surrounding sentences around the active sentence cursor
   */
  public scheduleSurroundingWindow(
    sentences: string[],
    currentIndex: number,
    voiceName: string,
    pageIndex: number,
    docId?: string
  ): void {
    if (!sentences || sentences.length === 0) return;

    // Priority 1: Next (+1)
    if (currentIndex + 1 < sentences.length) {
      this.enqueue(1, sentences[currentIndex + 1], voiceName, pageIndex, currentIndex + 1, docId);
    }

    // Priority 2: Previous (-1)
    if (currentIndex - 1 >= 0) {
      this.enqueue(2, sentences[currentIndex - 1], voiceName, pageIndex, currentIndex - 1, docId);
    }

    // Priority 3: Lookahead (+2, +3, +4)
    for (let offset = 2; offset <= 4; offset++) {
      const idx = currentIndex + offset;
      if (idx < sentences.length) {
        this.enqueue(3, sentences[idx], voiceName, pageIndex, idx, docId);
      }
    }
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // lower priority number first (0 -> 5)
      }
      return a.addedAt - b.addedAt;
    });
  }

  public clearQueue() {
    this.queue = this.queue.filter((t) => t.status === 'FETCHING');
    this.notify();
  }

  private async processNext(): Promise<void> {
    if (this.activeWorkers >= this.maxConcurrency) return;

    const pendingTask = this.queue.find((t) => t.status === 'PENDING');
    if (!pendingTask) return;

    pendingTask.status = 'FETCHING';
    this.activeWorkers++;
    this.notify();

    try {
      const audioKey = computeAudioCacheKey({
        text: pendingTask.text,
        voiceName: pendingTask.voiceName,
      });

      // 1. Check IndexedDB first
      const existingInVault = await vault.hasAudioSegment(audioKey);
      if (existingInVault) {
        const record = await vault.getAudioSegment(audioKey);
        if (record && record.audioDataUrl) {
          memoryAudioCache.set(audioKey, record.audioDataUrl, record.sizeBytes);
          pendingTask.status = 'COMPLETED';
          this.finishTask(pendingTask);
          return;
        }
      }

      // 2. If not in vault and fetchFunction exists, request it
      if (this.fetchFunction) {
        const dataUrl = await this.fetchFunction(pendingTask.text, pendingTask.voiceName);
        memoryAudioCache.set(audioKey, dataUrl);
        pendingTask.status = 'COMPLETED';
      }
    } catch (err: any) {
      pendingTask.status = 'FAILED';
      pendingTask.error = err?.message || 'Prefetch failed';
    } finally {
      this.finishTask(pendingTask);
    }
  }

  private finishTask(task: PrefetchQueueTask) {
    this.activeWorkers = Math.max(0, this.activeWorkers - 1);
    // Remove completed or failed tasks after brief retention
    setTimeout(() => {
      this.queue = this.queue.filter((t) => t.id !== task.id);
      this.notify();
    }, 1500);

    this.notify();
    this.processNext();
  }
}

export const prefetchScheduler = new PriorityPrefetchScheduler();
