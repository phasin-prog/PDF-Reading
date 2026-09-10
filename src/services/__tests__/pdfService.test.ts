import { describe, it, expect } from 'vitest';
import {
  isPageFooterMarker,
  cleanPageTextAndStripFooters,
  splitIntoSentences,
  stitchSentencesAcrossPages,
} from '../pdfService';
import { PageContent } from '../../types';

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

describe('stitchSentencesAcrossPages', () => {
  const page = (sentences: string[]): PageContent => ({
    pageNumber: 1,
    text: sentences.join(' '),
    sentences: [...sentences],
    paragraphs: [],
  });

  it('moves trailing fragment forward and flags continuation', () => {
    const pages = [
      page(['A complete sentence.', 'The story continues']),
      page(['on the next page.', 'Another sentence.']),
    ];
    stitchSentencesAcrossPages(pages);
    expect(pages[0].sentences).toEqual(['A complete sentence.']);
    expect(pages[1].sentences[0]).toBe('The story continues on the next page.');
    expect(pages[1].firstSentenceContinues).toBe(true);
  });

  it('leaves complete endings untouched', () => {
    const pages = [page(['Done here.']), page(['Fresh start here.'])];
    stitchSentencesAcrossPages(pages);
    expect(pages[0].sentences).toEqual(['Done here.']);
    expect(pages[1].firstSentenceContinues).toBeUndefined();
  });
});
