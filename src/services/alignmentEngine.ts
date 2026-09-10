/**
 * Audio Alignment & Timestamp Engine
 *
 * Provides accurate word, clause, and phrase timestamps for synchronized Dual-Layer Highlighting.
 * Bridges synthesized TTS audio durations with phonetic and syntactic text boundaries.
 */

import { AudioAlignmentData, WordTimestamp, ClauseTimestamp, CadenceMode } from '../types';
import { extractWordRanges, splitSentenceIntoClauses } from './ttsService';

export class AudioAlignmentEngine {
  /**
   * Generates synchronized word and clause timestamps mapped to audio duration
   */
  public static computeAlignment(
    audioKey: string,
    rawText: string,
    totalDurationMs: number,
    cadenceMode: CadenceMode = 'natural-audiobook'
  ): AudioAlignmentData {
    if (!rawText || totalDurationMs <= 0) {
      return {
        audioKey,
        totalDurationMs: Math.max(100, totalDurationMs),
        words: [],
        clauses: [],
        synthesizedAt: Date.now(),
      };
    }

    const words = extractWordRanges(rawText);
    const clauses = splitSentenceIntoClauses(rawText, cadenceMode);

    if (words.length === 0) {
      return {
        audioKey,
        totalDurationMs,
        words: [],
        clauses: [],
        synthesizedAt: Date.now(),
      };
    }

    // 1. Calculate word complexity weights based on character length and punctuation
    const wordWeights = words.map((w) => {
      const isPunctuationEnding = /[,.!?;:—]$/.test(w.word);
      const baseWeight = Math.max(1, w.charLength);
      // Punctuation after a word slightly extends spoken duration in prosody
      const punctuationMultiplier = isPunctuationEnding ? 1.4 : 1.0;
      return baseWeight * punctuationMultiplier;
    });

    const totalWeight = wordWeights.reduce((sum, wt) => sum + wt, 0);

    // 2. Allocate time slices proportionally to each word
    const wordTimestamps: WordTimestamp[] = [];
    let currentElapsedMs = 0;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const sliceFraction = wordWeights[i] / totalWeight;
      const wordDuration = totalDurationMs * sliceFraction;
      const startMs = Math.round(currentElapsedMs);
      const endMs = Math.round(currentElapsedMs + wordDuration);

      wordTimestamps.push({
        word: w.word,
        charIndex: w.charIndex,
        charLength: w.charLength,
        startMs,
        endMs,
        confidence: 0.95,
      });

      currentElapsedMs += wordDuration;
    }

    // 3. Allocate clause timestamps
    const clauseTimestamps: ClauseTimestamp[] = [];
    let clauseCurrentMs = 0;
    const clauseTotalChars = clauses.reduce((sum, c) => sum + Math.max(1, c.length), 0);

    for (const c of clauses) {
      const fraction = Math.max(1, c.length) / Math.max(1, clauseTotalChars);
      const clauseDuration = totalDurationMs * fraction;
      const startMs = Math.round(clauseCurrentMs);
      const endMs = Math.round(clauseCurrentMs + clauseDuration);

      clauseTimestamps.push({
        clauseText: c.text,
        startCharIndex: c.startCharIndex,
        length: c.length,
        pauseAfterMs: c.pauseAfterMs,
        startMs,
        endMs,
      });

      clauseCurrentMs += clauseDuration;
    }

    return {
      audioKey,
      totalDurationMs,
      words: wordTimestamps,
      clauses: clauseTimestamps,
      synthesizedAt: Date.now(),
    };
  }

  /**
   * Finds the currently active word at a given playback timestamp (in milliseconds)
   */
  public static getActiveWord(
    alignment: AudioAlignmentData,
    currentTimeMs: number
  ): WordTimestamp | null {
    if (!alignment || alignment.words.length === 0) return null;
    const found = alignment.words.find(
      (w) => currentTimeMs >= w.startMs && currentTimeMs <= w.endMs
    );
    return found || alignment.words[alignment.words.length - 1] || null;
  }
}
