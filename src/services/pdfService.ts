import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { DocumentItem, PageContent } from '../types';

// Configure PDF.js worker for offline asset bundled by Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
} catch (e) {
  console.warn('PDF.js worker setup note:', e);
}

/**
 * Detects whether a line or sentence represents a standalone page location footer
 * at the bottom/end of a paper page (e.g. "Page 123", "p. 123", "- 123 -", "123", "หน้า 123", "123 of 450").
 */
export function isPageFooterMarker(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // 1. Pure page number or range: "123", "123-124", "123/450"
  if (/^\d{1,4}$/.test(trimmed) || /^\d{1,4}\s*[\/\-—]\s*\d{1,4}$/.test(trimmed)) {
    return true;
  }

  // 2. Framed by hyphens, dashes or brackets: "- 123 -", "— 123 —", "[123]", "(123)", "• 123 •"
  if (/^[\-\—\–\u2013\u2014\(\[\u2022]\s*\d{1,4}\s*[\-\—\–\u2013\u2014\)\]\u2022]$/.test(trimmed)) {
    return true;
  }

  // 3. Explicit page prefixes in multiple languages: "Page 123", "p. 123", "pg. 123", "P. 123", "หน้า 123", "Página 123", "Seite 123"
  if (/^(?:page|p\.|pg\.|p|หน้า|página|seite)\s*\d{1,4}(?:\s*(?:of|\/|จาก|de)\s*\d{1,4})?$/i.test(trimmed)) {
    return true;
  }

  // 4. Page of Total: "123 of 450", "123 / 450", "123 จาก 450"
  if (/^\d{1,4}\s*(?:of|\/|จาก|de)\s*\d{1,4}$/i.test(trimmed)) {
    return true;
  }

  // 5. Volume/Book citation footers at page bottom: "Vol. 9i, p. 123", "CW 9i, p. 145", "Loc. 123"
  if (/^(?:vol\.|cw|v\.|volume|loc\.|ibid\.)\s*[0-9a-z]+\s*,\s*p\.\s*\d{1,4}$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * P0-1/P0-2: layout-aware PDF text ordering.
 * PDF.js returns items in content-stream order (not reading order), so we:
 * 1. sort by Y (top first, PDF origin is bottom-left) then X (left first),
 * 2. group into visual lines with a font-relative tolerance,
 * 3. detect 2-column pages and read left column fully before right column,
 * 4. drop running headers (top zone, pages>1), bottom page-number zone,
 *    and footnote-size text at the bottom — captions are KEPT for fidelity.
 */
interface PdfLayoutItem {
  str: string;
  x: number;
  y: number;
  fontSize: number;
  width: number;
  hasEOL: boolean;
}

function medianNum(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function itemFontSize(item: any): number {
  const t = item.transform;
  if (Array.isArray(t) && t.length >= 6) {
    const h = Math.hypot(t[2] || 0, t[3] || 0);
    if (h > 0.5 && h < 200) return h;
    const w = Math.abs(t[0] || 0);
    if (w > 0.5 && w < 200) return w;
  }
  return 10;
}

function groupIntoLines(items: PdfLayoutItem[], yTol: number): PdfLayoutItem[][] {
  const lines: PdfLayoutItem[][] = [];
  let current: PdfLayoutItem[] = [];
  let lineY = Infinity;
  for (const it of items) {
    if (current.length === 0) {
      current = [it];
      lineY = it.y;
    } else if (Math.abs(it.y - lineY) <= yTol) {
      current.push(it);
    } else {
      current.sort((a, b) => a.x - b.x);
      lines.push(current);
      current = [it];
      lineY = it.y;
    }
  }
  if (current.length > 0) {
    current.sort((a, b) => a.x - b.x);
    lines.push(current);
  }
  return lines;
}

function linesToText(lines: PdfLayoutItem[][], medianFont: number): string {
  const out: string[] = [];
  let prevY: number | null = null;
  for (const line of lines) {
    const lineY = line[0]?.y ?? 0;
    const text = line.map((i) => i.str).join(' ').replace(/[ \t]+/g, ' ').trim();
    if (!text) {
      prevY = lineY;
      continue;
    }
    if (prevY !== null) {
      const gap = prevY - lineY; // lines are top-first, so gap is positive
      out.push(gap > medianFont * 1.7 ? '\n\n' + text : '\n' + text);
    } else {
      out.push(text);
    }
    prevY = lineY;
  }
  return out.join('').replace(/\n{3,}/g, '\n\n');
}

/** Header-like single line: short, no terminal punctuation (running titles, chapter names). */
function looksLikeRunningHeader(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 140) return false;
  if (/[.?!:…。！？]$/.test(t)) return false;
  if (isPageFooterMarker(t)) return true;
  // Typical running header: few words, title-ish, no digits-heavy content
  return t.split(/\s+/).length <= 14;
}

function buildPageRawText(textContent: any, pageHeight: number, pageNum: number): string {
  const rawItems: PdfLayoutItem[] = [];
  for (const item of textContent.items || []) {
    if (!('str' in item)) continue;
    const s = (item as any).str as string;
    const t = (item as any).transform;
    if (!Array.isArray(t) || t.length < 6) {
      if (s) rawItems.push({ str: s, x: 0, y: 0, fontSize: 10, width: 0, hasEOL: !!(item as any).hasEOL });
      continue;
    }
    rawItems.push({
      str: s,
      x: t[4] || 0,
      y: t[5] || 0,
      fontSize: itemFontSize(item),
      width: (item as any).width || 0,
      hasEOL: !!(item as any).hasEOL,
    });
  }
  const content = rawItems.filter((i) => i.str.trim().length > 0);
  if (content.length === 0) return '';

  const medianFont = medianNum(content.map((i) => i.fontSize)) || 10;
  const yTol = Math.max(3.5, medianFont * 0.45);

  // P0-2a: footnote-size text in bottom 14% (footnotes/endnotes) — drop before ordering.
  // Guard: only when it is a minority, so uniformly-small pages are preserved.
  const footnoteCandidates = content.filter(
    (i) => i.y < pageHeight * 0.14 && i.fontSize <= medianFont * 0.82
  );
  let items = content;
  if (footnoteCandidates.length > 0 && footnoteCandidates.length < content.length * 0.3) {
    const drop = new Set(footnoteCandidates);
    items = content.filter((i) => !drop.has(i));
  }
  if (items.length === 0) return '';

  // P0-2b: bottom page-number zone (3.5%) + top running-header zone (pages > 1).
  const body = items.filter((i) => i.y >= pageHeight * 0.035);
  const bottomZone = items.filter((i) => i.y < pageHeight * 0.035);
  // Keep bottom-zone text only if it looks like body (long line ending with punctuation)
  const bottomText = bottomZone.map((i) => i.str).join(' ').trim();
  const keepBottom = bottomText.length > 60 && /[.?!:…。！？]$/.test(bottomText) && !isPageFooterMarker(bottomText);

  let topDropped: PdfLayoutItem[] = [];
  let core: PdfLayoutItem[] = keepBottom ? body.concat(bottomZone) : body;
  if (pageNum > 1) {
    const topZone = core.filter((i) => i.y > pageHeight * 0.955);
    if (topZone.length > 0 && topZone.length < core.length * 0.2) {
      const topLine = topZone.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
      if (looksLikeRunningHeader(topLine)) {
        const drop = new Set(topZone);
        topDropped = topZone;
        core = core.filter((i) => !drop.has(i));
      }
    }
  }
  void topDropped;
  if (core.length === 0) return '';

  // P0-1: sort top-first (Y desc), then left-first (X asc)
  const sorted = [...core].sort((a, b) => b.y - a.y || a.x - b.x);

  // P0-1: two-column detection — both halves populated, middle gap nearly empty
  const xs = sorted.map((i) => i.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const span = maxX - minX;
  if (span > 100) {
    const mid = (minX + maxX) / 2;
    const band = span * 0.04;
    let left = 0;
    let right = 0;
    let middle = 0;
    for (const i of sorted) {
      const cx = i.x + i.width * 0.5;
      if (cx < mid - band) left++;
      else if (cx > mid + band) right++;
      else middle++;
    }
    const total = sorted.length;
    if (left / total > 0.2 && right / total > 0.2 && middle / total < 0.15) {
      const leftItems = sorted.filter((i) => i.x + i.width * 0.5 <= mid);
      const rightItems = sorted.filter((i) => i.x + i.width * 0.5 > mid);
      const leftText = linesToText(groupIntoLines(leftItems, yTol), medianFont);
      const rightText = linesToText(groupIntoLines(rightItems, yTol), medianFont);
      return (leftText + '\n\n' + rightText).replace(/\n{3,}/g, '\n\n');
    }
  }

  return linesToText(groupIntoLines(sorted, yTol), medianFont);
}

/**
 * P0-3: stitch a trailing incomplete sentence to the next page.
 * Display text (page.text/paragraphs) stays faithful to the book; only the
 * TTS sentence arrays are re-chained so playback never pauses mid-sentence.
 */
function looksIncompleteSentence(s: string): boolean {
  const t = (s || '').trim();
  if (!t || t.length < 8) return false;
  if (isPageFooterMarker(t)) return false;
  if (/[.?!…。！？]['"»”)\]]?\s*$/.test(t)) return false;
  if (/^\[\d+\]|^\[§?\d+\]/.test(t)) return false;
  return true;
}

export function stitchSentencesAcrossPages(pages: PageContent[]): void {
  for (let i = 0; i < pages.length - 1; i++) {
    const cur = pages[i];
    const next = pages[i + 1];
    if (!cur.sentences.length || !next.sentences.length) continue;
    const tail = cur.sentences[cur.sentences.length - 1];
    if (!looksIncompleteSentence(tail)) continue;
    const head = next.sentences[0].trim();
    if (!head || isPageFooterMarker(head)) continue;
    // Move fragment forward: drop tail here, prepend to next head
    cur.sentences = cur.sentences.slice(0, -1);
    next.sentences = [tail.trim() + ' ' + head, ...next.sentences.slice(1)];
  }
}

/**
 * Strips standalone trailing page numbers and footer markers from page text
 */
export function cleanPageTextAndStripFooters(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  const lines = rawText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return '';

  // Check from bottom to top for trailing page numbers or footers
  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1];
    if (isPageFooterMarker(lastLine)) {
      lines.pop(); // Remove trailing footer line
    } else {
      break;
    }
  }

  return lines.join('\n');
}

/**
 * Splits text into clean sentences suitable for natural speech synthesis.
 * Supports Western punctuation (.?!), East Asian (。！？), and multi-paragraph boundaries.
 * Automatically skips standalone page position footers at the bottom of pages.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || !text.trim()) return [];

  const cleanedText = cleanPageTextAndStripFooters(text);
  if (!cleanedText) return [];

  // Protect common honorifics, titles & abbreviations from triggering false sentence breaks
  let preprocessed = cleanedText
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|St|Rev|Fr|Sr|Jr|C\.G|C\.W|e\.g|i\.e|vs|etc|Vol|Ch|Chap|pp|ed|trans|ibid|cf)\./gi, '$1__DOT__');

  // Normalize excessive white spaces
  const normalized = preprocessed
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Regex splitting on sentence terminators or Princeton paragraph markers [1], [2], [145], [§12]
  const rawSegments = normalized.split(/(?<=[.?!…]['"»”]?\s+|[。！？])|(?=\[\d+\])|(?=\[§?\d+\])/u);

  const sentences: string[] = [];

  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    // Skip standalone page numbers or page position footers
    if (isPageFooterMarker(trimmed)) {
      continue;
    }

    // Restore protected abbreviation dots
    const restored = trimmed.replace(/__DOT__/g, '.');

    // Further split on double newlines (paragraphs) or Princeton paragraph numbers
    if (restored.includes('\n\n') || /\[\d+\]|\[§?\d+\]/.test(restored)) {
      const subParas = restored.split(/(?=\[\d+\])|(?=\[§?\d+\])|\n\n+/);
      for (const p of subParas) {
        const pTrimmed = p.trim().replace(/\n/g, ' ');
        if (pTrimmed.length > 0 && !isPageFooterMarker(pTrimmed)) {
          sentences.push(pTrimmed);
        }
      }
    } else {
      const cleanLine = restored.replace(/\n+/g, ' ');
      if (!isPageFooterMarker(cleanLine)) {
        sentences.push(cleanLine);
      }
    }
  }

  return sentences.length > 0 ? sentences : [cleanedText.trim()];
}

/**
 * Splits text into clean paragraphs for readable layout.
 * Strictly respects Princeton Edition C.G. Jung paragraph numbers like [1], [2], [145], [§12], and double newlines.
 */
export function splitIntoParagraphs(text: string): string[] {
  if (!text || !text.trim()) return [];

  const cleaned = cleanPageTextAndStripFooters(text);
  if (!cleaned) return [];

  // Split on bracketed paragraph markers like [1], [2], [145], [§12] OR double newlines
  const rawParas = cleaned.split(/(?=\[\d+\])|(?=\[§?\d+\])|(?=\n\s*\n+)/);

  const paragraphs = rawParas
    .map(p => p.replace(/\n+/g, ' ').trim())
    .filter(p => p.length > 0 && !isPageFooterMarker(p));

  return paragraphs.length > 0 ? paragraphs : [cleaned.trim()];
}

/**
 * Language detector based on script ranges and character frequencies.
 * Strictly defaults to English (en-US) and German (de-DE) for literature & philosophy.
 */
export function detectLanguage(text: string): string {
  if (!text) return 'en-US';

  // Thai Script
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th-TH';

  // East Asian & other specific scripts
  if (/[\u3040-\u30ff]/.test(text)) return 'ja-JP'; // Japanese Hiragana/Katakana
  if (/[\uac00-\ud7af]/.test(text)) return 'ko-KR'; // Korean Hangul
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN'; // Chinese Hanzi
  if (/[\u0400-\u04ff]/.test(text)) return 'ru-RU'; // Russian Cyrillic
  if (/[\u0600-\u06ff]/.test(text)) return 'ar-SA'; // Arabic
  if (/[\u0900-\u097f]/.test(text)) return 'hi-IN'; // Hindi Devanagari

  const sample = text.toLowerCase().slice(0, 4000);

  // English Stopwords - Preponderant across philosophy, Jungian analysis & academic papers
  const englishMatches = sample.match(/\b(the|and|of|to|in|a|is|that|for|it|as|was|with|be|by|on|not|he|this|are|from|at|or|an|have|which|were|all|we|there|can|they|his|her|has)\b/g) || [];
  const englishScore = englishMatches.length;

  // German Stopwords - Distinctive articles & conjunctions
  const germanMatches = sample.match(/\b(der|die|das|und|den|von|zu|mit|sich|des|auf|für|ist|nicht|eine|einer|einem|einen|dem|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|oder)\b/g) || [];
  const germanScore = germanMatches.length;

  // If text is predominantly German
  if (germanScore > 12 && germanScore > englishScore) {
    return 'de-DE';
  }

  // If text has common English words (even if containing Latin/German quotes or references)
  if (englishScore >= 6 || englishScore >= germanScore) {
    return 'en-US';
  }

  // French (requires specific French character/words)
  if (/\b(les|des|du|dans|pour|avec|cette|sont|nous|vous)\b/g.test(sample) &&
      (sample.match(/\b(le|la|les|des|dans|pour)\b/g) || []).length > 12) {
    return 'fr-FR';
  }

  // Spanish (requires distinctive Spanish stopwords/accents)
  if (/\b(los|las|del|por|para|con|este|esta|como)\b/g.test(sample) &&
      (sample.match(/\b(el|la|los|las|del|por)\b/g) || []).length > 12) {
    return 'es-ES';
  }

  // Strict Default for literature and philosophy: English
  return 'en-US';
}

/**
 * Extract text from a PDF file using client-side PDF.js
 */
export async function parsePdfFile(file: File): Promise<DocumentItem> {
  const arrayBuffer = await file.arrayBuffer();
  return parsePdfArrayBuffer(arrayBuffer, file.name, file.size);
}

export async function parsePdfArrayBuffer(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<DocumentItem> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: PageContent[] = [];

  let fullCombinedText = '';
  let totalWordCount = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    // P0-1/P0-2: layout-aware ordering (Y/X sort, 2-column, header/footnote strip)
    const orderedRaw = buildPageRawText(textContent, viewport.height, pageNum);

    // Join preserving newlines while removing redundant horizontal spaces
    const pageRawText = orderedRaw
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n');

    const pageCleanText = cleanPageTextAndStripFooters(pageRawText.trim());
    fullCombinedText += ' ' + pageCleanText;

    const sentences = splitIntoSentences(pageCleanText);
    const paragraphs = splitIntoParagraphs(pageCleanText);

    const words = pageCleanText.split(/\s+/).filter(w => w.length > 0);
    totalWordCount += words.length;

    pages.push({
      pageNumber: pageNum,
      text: pageCleanText,
      sentences: sentences.length > 0 ? sentences : [pageCleanText || `[Page ${pageNum} has no extractable text]`],
      paragraphs: paragraphs.length > 0 ? paragraphs : [pageCleanText],
    });
  }

  // P0-3: re-chain sentences split by page breaks (display text untouched)
  stitchSentencesAcrossPages(pages);

  const detectedLang = detectLanguage(fullCombinedText);
  // Average reading speed: 150 words per minute
  const estimatedMins = Math.max(1, Math.ceil(totalWordCount / 150));

  const doc: DocumentItem = {
    id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    name: fileName.replace(/\.pdf$/i, ''),
    size: fileSize,
    pageCount: numPages,
    createdAt: Date.now(),
    lastReadAt: Date.now(),
    detectedLanguage: detectedLang,
    totalWords: totalWordCount,
    estimatedMinutes: estimatedMins,
    pages,
    readingProgress: {
      pageIndex: 0,
      sentenceIndex: 0,
      paragraphIndex: 0,
      completed: false,
      lastReadAt: Date.now(),
    },
  };

  return doc;
}

/**
 * High quality built-in multilingual sample documents so users can test offline playback immediately!
 */
export const SAMPLE_DOCUMENTS: Array<{
  id: string;
  name: string;
  lang: string;
  langLabel: string;
  description: string;
  pages: Array<{ text: string }>;
}> = [
  {
    id: 'sample_jung_princeton_cw9i',
    name: 'C.G. Jung: Archetypes & The Collective Unconscious (Princeton CW 9i)',
    lang: 'en-US',
    langLabel: 'Princeton CW 9i',
    description: 'Princeton Edition (Bollingen Series) with official paragraph numbers [1], [2], [3]...',
    pages: [
      {
        text: `The Concept of the Collective Unconscious (Bollingen Series XX).

[1] The concept of the collective unconscious is an essential element in analytical psychology. A more or less superficial layer of the unconscious is undoubtedly personal. We call it the personal unconscious. It rests upon a deeper layer, which does not derive from personal experience and is not a personal acquisition but is inborn. This deeper layer is the so-called collective unconscious.

[2] I have chosen the term "collective" because this part of the unconscious is not individual but universal; in contrast to the personal psyche, it has contents and modes of behavior that are more or less the same everywhere and in all individuals. It is, in other words, identical in all men and thus constitutes a common psychic substrate of a suprapersonal nature which is present in every one of us.

[3] Psychic existence is recognized only by the presence of contents that are capable of consciousness. We can therefore speak of an unconscious only in so far as we are able to demonstrate or infer the presence of contents. The contents of the personal unconscious are chiefly the feeling-toned complexes, as they are called; they constitute the personal and private side of psychic life. The contents of the collective unconscious, on the other hand, are known as archetypes.`
      },
      {
        text: `Chapter II: The Archetypes of the Collective Unconscious.

[4] For the scientific worker, the archetype represents a structural rule or pattern of instinctual behavior. There are as many archetypes as there are typical situations in life. Endless repetition has engraved these experiences into our psychic constitution, not in the form of images filled with content, but at first merely as forms without content, representing merely the possibility of a certain type of perception and action.

[5] When a situation occurs which corresponds to a given archetype, that archetype becomes activated and a compulsiveness appears, which, like an instinctual drive, gains its way against all reason and will, or else produces a conflict of pathological dimensions.`
      }
    ]
  },
  {
    id: 'sample_en_mindful_reading',
    name: 'The Art of Deep Reading & Audio Focus',
    lang: 'en-US',
    langLabel: 'English',
    description: 'A study on how audio synthesis improves comprehension and cognitive retention.',
    pages: [
      {
        text: `The Art of Deep Reading in the Modern Age.

In our rapid, screen-dominated world, deep reading has become both a sanctuary and an art form. When we listen to the spoken word while visually tracking the text, our brains activate multiple neural pathways simultaneously. This multimodal processing creates a deeper cognitive imprint, allowing complex ideas to take root with greater clarity.

Audio-guided reading is not merely a convenience; it transforms long commutes, quiet walks, and solitary evenings into rich landscapes of learning. Without requiring a constant internet tether, an offline library travels with you wherever you venture.

Focus is like a muscle that strengthens with deliberate practice. By adjusting the playback speed and cadence to match your cognitive tempo, you enter an effortless state of flow where comprehension flourishes naturally.`
      },
      {
        text: `Chapter 2: The Rhythm of Voice.

Human speech possesses a musical cadence: a balance of rhythm, pitch, and intentional pauses. When you listen to literature read aloud, the cadence of punctuation guides your mental breath.

Periods provide closure and contemplation. Commas offer gentle pauses to digest a clause. Questions invite curiosity and inner dialogue.

As you explore this reader, notice how each sentence unfolds. You can pause, jump ahead, or slow down whenever a thought demands your full reflection. Happy listening!`
      }
    ]
  },
  {
    id: 'sample_es_el_principito',
    name: 'El Principito - La Esencia Invisible',
    lang: 'es-ES',
    langLabel: 'Español',
    description: 'Hermosa selección literaria clásica para escuchar en español.',
    pages: [
      {
        text: `El Principito y el Zorro.

—Adiós —dijo el zorro—. He aquí mi secreto. Es muy simple: solo con el corazón se puede ver bien; lo esencial es invisible para los ojos.

—Lo esencial es invisible para los ojos —repitió el principito para acordarse.

—Es el tiempo que pasaste con tu rosa lo que hace que tu rosa sea tan importante.

—Es el tiempo que pasé con mi rosa... —dijo el principito para acordarse.

—Los hombres han olvidado esta verdad —dijo el zorro—. Pero tú no debes olvidarla. Eres responsable para siempre de lo que has domesticado. Eres responsable de tu rosa...

—Soy responsable de mi rosa —repitió el principito a fin de acordarse.`
      },
      {
        text: `Capítulo 2: El Desierto y las Estrellas.

Por la noche me gusta escuchar las estrellas. Son como quinientos millones de cascabeles.

Cuando mires al cielo por la noche, como yo habitaré en una de ellas, como yo reiré en una de ellas, será para ti como si todas las estrellas se rieran. ¡Tendrás tú, solo tú, estrellas que saben reír!

Y cuando te hayas consolado, te alegrarás de haberme conocido. Serás siempre mi amigo. Tendrás deseos de reír conmigo y abrirás a veces tu ventana, así, por placer.`
      }
    ]
  },
  {
    id: 'sample_fr_voyage',
    name: 'Voyage et Philosophie de la Nature',
    lang: 'fr-FR',
    langLabel: 'Français',
    description: 'Une méditation littéraire sur le voyage et la découverte.',
    pages: [
      {
        text: `L'Invitation au Voyage et la Sérénité.

Le voyage n'est pas seulement le déplacement d'un lieu à un autre. C'est une métamorphose de l'esprit, une ouverture vers l'inconnu qui réveille nos sens assoupis par l'habitude.

Lorsque l'on écoute une œuvre au fil de ses pas, les mots acquièrent une densité nouvelle. La voix trace un chemin intérieur qui fait écho aux paysages traversés.

Prenez le temps de savourer chaque phrase, de laisser résonner les silences et de voyager en toute liberté, même loin de toute connexion.`
      }
    ]
  },
  {
    id: 'sample_de_philosophie',
    name: 'Die Poesie des Reisens',
    lang: 'de-DE',
    langLabel: 'Deutsch',
    description: 'Reflexionen über Gedankenfreiheit und die Kunst des Zuhörens.',
    pages: [
      {
        text: `Die Kunst des Zuhörens.

Das gesprochene Wort hat eine eigene Kraft. Wenn wir aufmerksam zuhören, verwandelt sich der geschriebene Text in eine lebendige Unterhaltung zwischen Autor und Hörer.

Besonders unterwegs, fernab von Hektik und digitalem Lärm, schenkt uns das Offline-Hören wertvolle Momente der Ruhe. Gedanken können frei fließen, während die Sprache ihre Wirkung entfaltet.

Genießen Sie den Rhythmus und die Tiefe jedes einzelnen Gedankens.`
      }
    ]
  },
  {
    id: 'sample_ja_harmony',
    name: '日々の調和と静けさの探求',
    lang: 'ja-JP',
    langLabel: '日本語',
    description: '心を落ち着かせる日本語の散文テキスト。',
    pages: [
      {
        text: `静寂と調和の美学。

私たちの日常には、多くの音が溢れています。しかし、静けさの中で紡がれる言葉には、心を整える特別な響きがあります。

耳から入る言葉は、視覚とは異なる深さで心に届きます。移動中や旅先でも、インターネットを必要とせずに読書を楽しめる時間は、現代における贅沢なひとときです。

心地よい音声のリズムとともに、穏やかな思索の旅をお楽しみください。`
      }
    ]
  }
];

/**
 * Converts a sample document definition into a full DocumentItem
 */
export function createDocumentFromSample(sample: typeof SAMPLE_DOCUMENTS[0]): DocumentItem {
  const pages: PageContent[] = sample.pages.map((p, idx) => {
    const sentences = splitIntoSentences(p.text);
    const paragraphs = splitIntoParagraphs(p.text);
    return {
      pageNumber: idx + 1,
      text: p.text,
      sentences,
      paragraphs,
    };
  });

  const totalWords = sample.pages.reduce((acc, p) => acc + p.text.split(/\s+/).length, 0);

  return {
    id: sample.id,
    name: sample.name,
    size: 24500,
    pageCount: pages.length,
    createdAt: Date.now(),
    lastReadAt: Date.now(),
    detectedLanguage: sample.lang,
    totalWords,
    estimatedMinutes: Math.max(1, Math.ceil(totalWords / 150)),
    pages,
    readingProgress: {
      pageIndex: 0,
      sentenceIndex: 0,
      paragraphIndex: 0,
      completed: false,
      lastReadAt: Date.now(),
    },
  };
}
