import { describe, it, expect } from 'vitest';
import { humanizeSpeechText } from '../../utils/voiceHumanizer';

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
});
