import { ParagraphNarrativeState } from '../types';

export interface SemanticWordInfo {
  word: string;
  cleanWord: string;
  isContentWord: boolean;
  isPhilosophicalTerm: boolean;
  isNegation: boolean;
  isContrastWord: boolean;
  isConceptAnchor: boolean;
  stressLevel: 'primary' | 'secondary' | 'unstressed';
  phoneticOverride?: string;
}

export type ClauseType =
  | 'main'
  | 'subordinate'
  | 'concession'
  | 'contrast'
  | 'causality'
  | 'definition'
  | 'qualification'
  | 'negation'
  | 'rhetorical-question'
  | 'conclusion'
  | 'central-claim'
  | 'example';

export interface ClauseAnalysis {
  text: string;
  clauseType: ClauseType;
  words: SemanticWordInfo[];
  pauseAfterMs: number;
  rateMultiplier: number;
  pitchMultiplier: number;
  volumeMultiplier: number;
  isQuotation: boolean;
  isCitation: boolean;
  primaryStressedWords: string[];
  semanticAnchors: string[];
}

export interface SentenceAnalysis {
  rawSentence: string;
  clauses: ClauseAnalysis[];
  clauseType: ClauseType;
  narrativeState: ParagraphNarrativeState;
  cognitiveDensityScore: number; // 0.0 (simple) to 1.0 (extremely dense)
  hasContrast: boolean;
  hasRhetoricalQuestion: boolean;
  isCentralThesis: boolean;
  suggestedPauseAfterMs: number;
  overallRateMultiplier: number;
  overallPitchMultiplier: number;
  overallVolumeMultiplier: number;
  semanticAnchors: string[];
}

export interface ParagraphAnalysis {
  paragraphIndex: number;
  rawText: string;
  sentences: SentenceAnalysis[];
  narrativeState: ParagraphNarrativeState;
  averageDensity: number;
  primaryConcept?: string;
  secondaryConcepts: string[];
}

// Key philosophical vocabulary list
const PHILOSOPHICAL_VOCAB = new Set([
  'phenomenology', 'being', 'dasein', 'ontology', 'existential', 'solipsism',
  'individuation', 'archetype', 'unconscious', 'synchronicity', 'dialectic',
  'epistemology', 'categorical', 'imperative', 'logos', 'teleology', 'qualia',
  'determinism', 'utilitarianism', 'deontology', 'hermeneutics', 'transcendent',
  'transcendental', 'a priori', 'a posteriori', 'noumenon', 'phenomenon',
  'consciousness', 'subjectivity', 'intersubjectivity', 'cogito', 'nihilism',
  'absurdism', 'will', 'representation', 'substance', 'monad', 'empiricism',
  'rationalism', 'metaphysics', 'dualism', 'materialism', 'idealism', 'superman',
  'overman', 'ressentiment', 'bad faith', 'mauvaise foi', 'angst', 'dread',
  'freedom', 'liberty', 'alienation', 'praxis', 'hegemony', 'structuralism',
  'post-structuralism', 'deconstruction', 'veritè', 'phronesis', 'eudaimonia',
]);

const CONTRAST_WORDS = new Set([
  'however', 'nevertheless', 'nonetheless', 'yet', 'but', 'on the contrary',
  'instead', 'whereas', 'rather', 'conversely', 'unlike', 'notwithstanding',
  'alternatively', 'in contrast', 'contrary to', 'despite', 'in spite of',
]);

const CONCESSION_WORDS = new Set([
  'although', 'even though', 'though', 'while', 'granted that', 'admittedly',
  'even if', 'despite the fact',
]);

const CAUSALITY_WORDS = new Set([
  'therefore', 'thus', 'hence', 'consequently', 'as a result', 'accordingly',
  'because', 'for this reason', 'so', 'wherefore',
]);

const DEFINITION_PATTERNS = [
  /\bis\s+(?:defined\s+as|understood\s+as|conceived\s+as|refers\t+to|means|denoted\s+by)\b/i,
  /\bby\s+["']?(\w+)["']?\s+we\s+mean\b/i,
  /\bconstitutes\s+the\s+essence\s+of\b/i,
];

const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'nor', 'for', 'but', 'so', 'yet',
  'in', 'on', 'at', 'by', 'to', 'from', 'with', 'about', 'of', 'for',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'can', 'could', 'should', 'would', 'may', 'might',
  'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those',
]);

/**
 * Evaluates semantic word properties (Content vs Function word, Stress, Concepts).
 */
export function analyzeWord(word: string): SemanticWordInfo {
  const clean = word.toLowerCase().replace(/[^a-z0-9\-]/g, '');
  const isPhilosophicalTerm = PHILOSOPHICAL_VOCAB.has(clean);
  const isContrastWord = CONTRAST_WORDS.has(clean);
  const isNegation = /^(not|no|never|neither|nor|without|un\w+|non\w+)$/i.test(clean);
  const isContent = !FUNCTION_WORDS.has(clean) && clean.length > 2;

  let stressLevel: 'primary' | 'secondary' | 'unstressed' = 'unstressed';
  if (isPhilosophicalTerm || isContrastWord || isNegation) {
    stressLevel = 'primary';
  } else if (isContent) {
    stressLevel = 'secondary';
  }

  const isConceptAnchor = isPhilosophicalTerm || (isContent && clean.length >= 7);

  return {
    word,
    cleanWord: clean,
    isContentWord: isContent,
    isPhilosophicalTerm,
    isNegation,
    isContrastWord,
    isConceptAnchor,
    stressLevel,
  };
}

/**
 * Segments a sentence into rhetorical clauses and assigns clause-specific prosodic properties.
 */
export function analyzeSentence(
  sentence: string,
  narrativeState: ParagraphNarrativeState = 'EXPLANATION'
): SentenceAnalysis {
  const raw = sentence.trim();
  const wordTokens = raw.split(/\s+/);
  const wordCount = wordTokens.length;

  let clauseType: ClauseType = 'main';
  let hasContrast = false;
  let hasRhetoricalQuestion = raw.endsWith('?');
  let isCentralThesis = false;

  // Detect clause type
  if (hasRhetoricalQuestion) {
    clauseType = 'rhetorical-question';
  } else if (DEFINITION_PATTERNS.some((p) => p.test(raw))) {
    clauseType = 'definition';
  } else if (/\b(not\s+simply|not\s+only|rather\s+than|does\s+not|never|is\s+not)\b/i.test(raw) && CONTRAST_WORDS.size > 0) {
    clauseType = 'contrast';
    hasContrast = true;
  } else if (Array.from(CONCESSION_WORDS).some((w) => new RegExp(`\\b${w}\\b`, 'i').test(raw))) {
    clauseType = 'concession';
  } else if (Array.from(CAUSALITY_WORDS).some((w) => new RegExp(`\\b${w}\\b`, 'i').test(raw))) {
    clauseType = 'causality';
  } else if (/\b(must|essential|fundamental|supreme|central|thesis|principle)\b/i.test(raw)) {
    clauseType = 'central-claim';
    isCentralThesis = true;
  } else if (/\b(for\s+instance|for\s+example|consider\s+the|suppose)\b/i.test(raw)) {
    clauseType = 'example';
  } else if (/\b(in\s+conclusion|ultimately|thus\s+we\s+see|in\s+short)\b/i.test(raw)) {
    clauseType = 'conclusion';
  }

  // Calculate Cognitive Density Score (0.0 to 1.0)
  const avgWordLength = raw.replace(/\s+/g, '').length / (wordCount || 1);
  const complexWordCount = wordTokens.filter((w) => w.length >= 8).length;
  const philosophicalWordCount = wordTokens.filter((w) => PHILOSOPHICAL_VOCAB.has(w.toLowerCase().replace(/[^a-z]/g, ''))).length;

  const densityScore = Math.min(
    1.0,
    (avgWordLength / 8.0) * 0.3 +
      (complexWordCount / (wordCount || 1)) * 0.4 +
      (philosophicalWordCount / Math.max(1, wordCount)) * 0.3
  );

  // Sub-clause splitting regex
  const clauseSplits = raw.split(/([,;:—\u2014]\s+|\b(?:although|even though|however|therefore|thus|because|whereas|not only|but also)\b\s+)/gi);

  const clauses: ClauseAnalysis[] = [];
  let currentPos = 0;

  for (let i = 0; i < clauseSplits.length; i += 2) {
    const chunkText = (clauseSplits[i] || '') + (clauseSplits[i + 1] || '');
    if (!chunkText.trim()) continue;

    const words = chunkText.trim().split(/\s+/).map(analyzeWord);
    const primaryStressedWords = words.filter((w) => w.stressLevel === 'primary').map((w) => w.word);
    const semanticAnchors = words.filter((w) => w.isConceptAnchor).map((w) => w.word);

    const isQuotation = /^["'“«]/.test(chunkText.trim()) || /["'”»]$/.test(chunkText.trim());
    const isCitation = /\b(ibid|op\.\s*cit|p\.\s*\d+|vol\.\s*\d+|pp\.\s*\d+)\b/i.test(chunkText);

    let pauseAfterMs = 280;
    let rateMultiplier = 1.0;
    let pitchMultiplier = 1.0;
    let volumeMultiplier = 1.0;

    // Adjust rate and pauses based on clause analysis
    if (clauseType === 'rhetorical-question') {
      rateMultiplier = 0.92;
      pitchMultiplier = 1.04;
      pauseAfterMs = 650;
    } else if (clauseType === 'contrast') {
      rateMultiplier = 0.94;
      pauseAfterMs = 420;
    } else if (clauseType === 'definition' || isCentralThesis) {
      rateMultiplier = 0.88;
      pitchMultiplier = 0.97;
      volumeMultiplier = 1.04;
      pauseAfterMs = 550;
    } else if (clauseType === 'conclusion') {
      rateMultiplier = 0.86;
      pitchMultiplier = 0.95;
      pauseAfterMs = 800;
    }

    // High cognitive density slows down speech for clarity
    if (densityScore > 0.6) {
      rateMultiplier *= 0.92;
      pauseAfterMs += 120;
    }

    // Quotations get subtle vocal shift
    if (isQuotation) {
      pitchMultiplier *= 1.02;
      rateMultiplier *= 0.96;
    }

    clauses.push({
      text: chunkText,
      clauseType,
      words,
      pauseAfterMs,
      rateMultiplier,
      pitchMultiplier,
      volumeMultiplier,
      isQuotation,
      isCitation,
      primaryStressedWords,
      semanticAnchors,
    });
  }

  const allSemanticAnchors = Array.from(
    new Set(clauses.flatMap((c) => c.semanticAnchors))
  );

  let suggestedPauseAfterMs = 600;
  if (clauseType === 'conclusion' || narrativeState === 'CONCLUSION') {
    suggestedPauseAfterMs = 1100;
  } else if (clauseType === 'rhetorical-question') {
    suggestedPauseAfterMs = 850;
  } else if (isCentralThesis) {
    suggestedPauseAfterMs = 950;
  } else if (densityScore > 0.65) {
    suggestedPauseAfterMs = 800;
  }

  let overallRateMultiplier = 1.0;
  if (densityScore > 0.7) overallRateMultiplier = 0.88;
  else if (narrativeState === 'REFLECTION' || narrativeState === 'TENSION') overallRateMultiplier = 0.92;
  else if (narrativeState === 'ARGUMENT') overallRateMultiplier = 0.96;

  return {
    rawSentence: raw,
    clauses,
    clauseType,
    narrativeState,
    cognitiveDensityScore: densityScore,
    hasContrast,
    hasRhetoricalQuestion,
    isCentralThesis,
    suggestedPauseAfterMs,
    overallRateMultiplier,
    overallPitchMultiplier: 1.0,
    overallVolumeMultiplier: 1.0,
    semanticAnchors: allSemanticAnchors,
  };
}

/**
 * Analyzes an entire paragraph to establish narrative structure and cognitive load.
 */
export function analyzeParagraph(
  paragraphText: string,
  paragraphIndex: number
): ParagraphAnalysis {
  const rawSentences = paragraphText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .filter((s) => s.trim().length > 0);

  // Determine narrative state based on paragraph position and keywords
  let narrativeState: ParagraphNarrativeState = 'EXPLANATION';

  if (paragraphIndex === 0) {
    narrativeState = 'INTRODUCTION';
  } else if (/\b(however|on the other hand|in contrast|nevertheless)\b/i.test(paragraphText)) {
    narrativeState = 'CONTRAST';
  } else if (/\b(therefore|we must conclude|ultimately|in sum)\b/i.test(paragraphText)) {
    narrativeState = 'CONCLUSION';
  } else if (/\b(for example|consider|as an illustration)\b/i.test(paragraphText)) {
    narrativeState = 'EXAMPLE';
  } else if (/\b(reveals|discovers|strikingly|unveils|aha)\b/i.test(paragraphText)) {
    narrativeState = 'REVELATION';
  } else if (/\b(if we examine|let us analyze|argument|proposes)\b/i.test(paragraphText)) {
    narrativeState = 'ARGUMENT';
  }

  const sentences = rawSentences.map((s) => analyzeSentence(s, narrativeState));

  const averageDensity =
    sentences.reduce((acc, s) => acc + s.cognitiveDensityScore, 0) /
    Math.max(1, sentences.length);

  const concepts = Array.from(
    new Set(sentences.flatMap((s) => s.semanticAnchors))
  );

  return {
    paragraphIndex,
    rawText: paragraphText,
    sentences,
    narrativeState,
    averageDensity,
    primaryConcept: concepts[0] || undefined,
    secondaryConcepts: concepts.slice(1),
  };
}
