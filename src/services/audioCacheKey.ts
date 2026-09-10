/**
 * Deterministic Audio Cache Key Engine
 *
 * Computes composite deterministic hash keys for TTS audio segments.
 * Decouples Client-Side DSP (EQ, Compression, Ambience) from TTS audio generation
 * to ensure changing acoustic mastering never triggers unnecessary TTS API calls.
 */

import { GEMINI_TTS_MODEL_ID, TTS_PIPELINE_VERSION } from '../constants/versions';
import { VoiceNarratorProfile, CadenceMode } from '../types';

export interface AudioCacheKeyParams {
  text: string;
  voiceName: string;
  modelId?: string;
  language?: string;
  rate?: number;
  pitch?: number;
  profile?: VoiceNarratorProfile;
  cadenceMode?: CadenceMode;
  pipelineVersion?: string;
}

// Fast 32-bit FNV-1a / Murmur-like stable string hash
export function computeStableHash(str: string): string {
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^ Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^ Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(36);
}

/**
 * Computes a deterministic audio cache key.
 * Changing EQ/DSP or Ambience ducking DOES NOT change this key.
 */
export function computeAudioCacheKey(params: AudioCacheKeyParams): string {
  const normalizedText = params.text.trim().toLowerCase().replace(/\s+/g, ' ');
  const textHash = computeStableHash(normalizedText);

  const model = params.modelId || GEMINI_TTS_MODEL_ID;
  const voice = params.voiceName || 'Puck';
  const lang = params.language || 'en-US';
  const rate = (params.rate !== undefined ? params.rate : 1.0).toFixed(2);
  const pitch = (params.pitch !== undefined ? params.pitch : 1.0).toFixed(2);
  const profile = params.profile || 'standard';
  const cadence = params.cadenceMode || 'natural-audiobook';
  const version = params.pipelineVersion || TTS_PIPELINE_VERSION;

  const rawCompositeKey = [
    textHash,
    model,
    voice,
    lang,
    rate,
    pitch,
    profile,
    cadence,
    version,
  ].join('|');

  const compositeHash = computeStableHash(rawCompositeKey);
  return `${voice.toLowerCase()}_${compositeHash}`;
}
