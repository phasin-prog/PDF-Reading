export interface WordToken {
  text: string;
  start: number;
  end: number;
  isWord: boolean;
}

/**
 * Tokenizes a sentence into word and whitespace tokens with exact character boundaries.
 * Supports multilingual text including Thai, Japanese, Chinese via Intl.Segmenter.
 */
export function tokenizeSentenceWords(sentence: string, lang = 'en-US'): WordToken[] {
  if (!sentence) return [];

  // Use Intl.Segmenter if supported by the browser runtime
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter(lang, { granularity: 'word' });
      const segments = Array.from(segmenter.segment(sentence)) as any[];
      if (segments.length > 0) {
        return segments.map((seg) => ({
          text: seg.segment,
          start: seg.index,
          end: seg.index + seg.segment.length,
          isWord: seg.isWordLike ?? /\S/.test(seg.segment),
        }));
      }
    } catch {
      // Fallback if specific locale is not supported
    }
  }

  // Standard regex fallback
  const tokens: WordToken[] = [];
  const regex = /\S+|\s+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sentence)) !== null) {
    tokens.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      isWord: /\S/.test(match[0]),
    });
  }
  return tokens;
}
