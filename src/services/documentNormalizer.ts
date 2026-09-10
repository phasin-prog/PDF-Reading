/**
 * Document Normalization & Text Cleanup Layer
 *
 * Prepares extracted raw PDF text for clean TTS synthesis and visual alignment.
 * Resolves hyphenation across line breaks, ligatures, citations, running headers/footers,
 * and integrates custom philosophical pronunciation overrides.
 */

import { PronunciationOverride } from '../types';

export interface NormalizedDocumentOutput {
  displayHtml: string;
  ttsCleanText: string;
  wordCount: number;
  hasHyphenationRepairs: boolean;
  repairedHyphensCount: number;
}

// Common ligatures found in academic PDFs and books
const LIGATURE_MAP: Record<string, string> = {
  'ﬁ': 'fi',
  'ﬂ': 'fl',
  'ﬀ': 'ff',
  'ﬃ': 'ffi',
  'ﬄ': 'ffl',
  'ﬆ': 'st',
  'æ': 'ae',
  'Æ': 'AE',
  'œ': 'oe',
  'Œ': 'OE',
};

export class DocumentNormalizer {
  /**
   * Normalizes raw page or paragraph text for high-fidelity speech synthesis
   */
  public static normalizeForTTS(
    rawText: string,
    userOverrides: PronunciationOverride[] = []
  ): string {
    if (!rawText || !rawText.trim()) return '';

    let text = rawText;

    // 1. Replace all typographic ligatures
    for (const [ligature, replacement] of Object.entries(LIGATURE_MAP)) {
      text = text.replaceAll(ligature, replacement);
    }

    // 2. Fix hyphenation split across lines (e.g. "intel-\nlectual" -> "intellectual")
    // Handles soft hyphens (\u00AD), standard hyphens (-), and em/en dashes
    text = text.replace(/(\b[a-zA-Z]{2,})[-\u00AD]\s*\n\s*([a-zA-Z]{2,}\b)/g, '$1$2');
    text = text.replace(/(\b[a-zA-Z]{2,})[-\u00AD]\s+([a-zA-Z]{2,}\b)/g, (match, p1, p2) => {
      // Check if it looks like a single word broken by column wrap
      const joined = `${p1}${p2}`.toLowerCase();
      // Common split prefixes
      if (['philos', 'psycho', 'unconscious', 'arche', 'conscious', 'individ', 'intel', 'symbol', 'experi'].some(prefix => joined.startsWith(prefix))) {
        return `${p1}${p2}`;
      }
      return match;
    });

    // 3. Remove standalone running page numbers at borders (e.g. "\n124\n", "— 45 —", "[Page 12]")
    text = text.replace(/^\s*(?:—\s*)?\d{1,4}(?:\s*—)?\s*$/gm, '');
    text = text.replace(/\[\s*(?:Page|p\.)\s*\d+\s*\]/gi, '');

    // 4. Clean academic citation brackets for TTS while retaining words
    // e.g. "[1]", "[12-15]", "[see Jung, 1921]" -> spoken smoothly
    text = text.replace(/\[\s*\d{1,3}(?:\s*[-–,]\s*\d{1,3})*\s*\]/g, ''); // pure numeric citations like [1] or [12-14]
    text = text.replace(/\(\s*(?:ibid|op\.\s*cit|loc\.\s*cit)\.?\s*,?\s*(?:p\.\s*\d+)?\s*\)/gi, ''); // (ibid., p. 45)

    // 5. Standardize dashes and quotes for natural speech prosody
    text = text.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, ' — ');
    text = text.replace(/[\u2018\u2019]/g, "'");
    text = text.replace(/[\u201C\u201D]/g, '"');

    // 6. Clean multiple spaces and irregular newlines
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');

    // 7. Apply user-defined persistent pronunciation overrides
    if (userOverrides && userOverrides.length > 0) {
      for (const override of userOverrides) {
        if (override.term && override.phoneticReplacement) {
          const regex = new RegExp(`\\b${escapeRegExp(override.term)}\\b`, 'gi');
          text = text.replace(regex, override.phoneticReplacement);
        }
      }
    }

    return text.trim();
  }

  /**
   * Normalizes text for visual display (retains visual formatting without destroying layout)
   */
  public static normalizeForDisplay(rawText: string): string {
    if (!rawText) return '';
    let text = rawText;
    for (const [ligature, replacement] of Object.entries(LIGATURE_MAP)) {
      text = text.replaceAll(ligature, replacement);
    }
    // Fix line-break hyphenations
    text = text.replace(/(\b[a-zA-Z]{2,})[-\u00AD]\s*\n\s*([a-zA-Z]{2,}\b)/g, '$1$2');
    return text.trim();
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
