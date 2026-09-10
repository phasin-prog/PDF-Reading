import { describe, it, expect } from 'vitest';
import { computeAudioCacheKey, computeStableHash } from '../audioCacheKey';

describe('computeStableHash', () => {
  it('is deterministic', () => {
    expect(computeStableHash('hello world')).toBe(computeStableHash('hello world'));
  });

  it('differs for different input', () => {
    expect(computeStableHash('alpha')).not.toBe(computeStableHash('beta'));
  });
});

describe('computeAudioCacheKey', () => {
  const base = { text: 'Who looks outside, dreams.', voiceName: 'Puck' };

  it('is deterministic for identical params', () => {
    expect(computeAudioCacheKey(base)).toBe(computeAudioCacheKey({ ...base }));
  });

  it('ignores whitespace/case differences in text', () => {
    expect(computeAudioCacheKey({ ...base, text: '  WHO   looks outside, dreams. ' })).toBe(
      computeAudioCacheKey(base)
    );
  });

  it('separates voices, rates, profiles and cadence', () => {
    expect(computeAudioCacheKey({ ...base, voiceName: 'Charon' })).not.toBe(computeAudioCacheKey(base));
    expect(computeAudioCacheKey({ ...base, rate: 1.5 })).not.toBe(computeAudioCacheKey(base));
    expect(computeAudioCacheKey({ ...base, pitch: 0.9 })).not.toBe(computeAudioCacheKey(base));
    expect(computeAudioCacheKey({ ...base, profile: 'philosopher' })).not.toBe(
      computeAudioCacheKey({ ...base, profile: 'lecturer' })
    );
    expect(computeAudioCacheKey({ ...base, cadenceMode: 'deep-reflection' })).not.toBe(
      computeAudioCacheKey(base)
    );
  });

  it('separates different sentences', () => {
    expect(computeAudioCacheKey({ ...base, text: 'Completely different sentence here.' })).not.toBe(
      computeAudioCacheKey(base)
    );
  });
});
