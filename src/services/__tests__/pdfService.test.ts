import { describe, it, expect } from 'vitest';
import {
  isPageFooterMarker,
  cleanPageTextAndStripFooters,
  splitIntoSentences,
} from '../pdfService';

describe('isPageFooterMarker', () => {
  it.each(['123', 'Page 12', 'p. 45', '- 7 -', '12 of 450', 'หน้า 10'])(
    'detects footer %s',
    (s) => {
      expect(isPageFooterMarker(s)).toBe(true);
    }
  );

  it.each(['Chapter 12', 'Jung was born in 1875.', 'see page 45 for details'])(
    'keeps body text %s',
    (s) => {
      expect(isPageFooterMarker(s)).toBe(false);
    }
  );
});

describe('cleanPageTextAndStripFooters', () => {
  it('strips trailing page numbers only', () => {
    const out = cleanPageTextAndStripFooters('First line\nSecond line\n123');
    expect(out).not.toContain('\n123');
    expect(out).toContain('First line');
  });

  it('returns empty for footer-only text', () => {
    expect(cleanPageTextAndStripFooters('42')).toBe('');
  });
});

describe('splitIntoSentences', () => {
  it('splits on sentence terminators', () => {
    const out = splitIntoSentences('Who looks outside, dreams. Who looks inside, awakes.');
    expect(out.length).toBe(2);
  });

  it('does not split protected abbreviations', () => {
    const out = splitIntoSentences('Dr. Jung met Mr. Hyde today.');
    expect(out.length).toBe(1);
  });

  it('skips standalone page markers', () => {
    const out = splitIntoSentences('A real sentence here.\n99');
    expect(out).toEqual(['A real sentence here.']);
  });

  it('returns empty for blank input', () => {
    expect(splitIntoSentences('   ')).toEqual([]);
  });
});
