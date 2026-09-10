import { describe, it, expect } from 'vitest';
import { humanizeSpeechText, calculateDynamicSentenceUtterance } from '../../utils/voiceHumanizer';

describe('humanizeSpeechText', () => {
  it('skips standalone page footers', () => {
    expect(humanizeSpeechText('123')).toBe('');
    expect(humanizeSpeechText('Page 45')).toBe('');
    expect(humanizeSpeechText('- 12 -')).toBe('');
  });

  it('expands C.G. Jung citations', () => {
    const out = humanizeSpeechText('As C.G. Jung wrote in CW 9.');
    expect(out).toContain('Carl Gustav Jung');
    expect(out).toContain('Collected Works');
  });

  it('expands honorifics and latin abbreviations', () => {
    expect(humanizeSpeechText('Dr. Smith met Mr. Hyde, i.e. the doctor.')).toContain('Doctor');
    expect(humanizeSpeechText('Dr. Smith met Mr. Hyde, i.e. the doctor.')).toContain('that is');
  });

  it('strips numeric citations but keeps years', () => {
    const out = humanizeSpeechText('Jung argued this [12] in 1921.');
    expect(out).not.toContain('[12]');
    expect(out).toContain('1921');
  });

  it('returns empty for empty input', () => {
    expect(humanizeSpeechText('')).toBe('');
    expect(humanizeSpeechText('   ')).toBe('');
  });

  it('collapses stacked punctuation clusters', () => {
    expect(humanizeSpeechText('He said, , that it works.')).toBe('He said, that it works.');
    expect(humanizeSpeechText('Note: : the result.')).toBe('Note: the result.');
    expect(humanizeSpeechText('Wait;;; really?')).toBe('Wait; really?');
  });
});

describe('calculateDynamicSentenceUtterance', () => {
  it('boosts year sentences instead of slowing them', () => {
    const withYear = calculateDynamicSentenceUtterance('Jung published this in 1976.', 1.0, 1.0);
    const plain = calculateDynamicSentenceUtterance('Jung published this work.', 1.0, 1.0);
    expect(withYear.rate).toBeGreaterThan(plain.rate);
  });

  it('never stacks below 88% of base rate', () => {
    // worst case: long + dense + slow profile base
    const out = calculateDynamicSentenceUtterance(
      'A very long philosophical statement with colons: it keeps going and going past one hundred and sixty characters total.',
      0.8,
      1.0
    );
    expect(out.rate).toBeGreaterThanOrEqual(0.8 * 0.88);
  });

  it('keeps parenthetical clauses near base rate', () => {
    const out = calculateDynamicSentenceUtterance('He said (quite clearly) that it works.', 1.0, 1.0);
    expect(out.rate).toBeGreaterThanOrEqual(0.97);
  });

  it('reads long clean sentences fast, slows only clause-heavy ones', () => {
    const clean = 'The collective unconscious contains the whole spiritual heritage of all mankind and it is reborn anew in the brain structure of every single individual human being alive today in our world';
    const dense = 'The collective unconscious contains the whole spiritual heritage of all mankind: it is reborn anew, in the brain structure of every single individual; human being alive today in our world';
    const fast = calculateDynamicSentenceUtterance(clean, 1.0, 1.0);
    const slow = calculateDynamicSentenceUtterance(dense, 1.0, 1.0);
    expect(clean.length).toBeGreaterThan(160);
    expect(fast.rate).toBeGreaterThanOrEqual(1.0);
    expect(slow.rate).toBeLessThan(fast.rate);
  });
});
