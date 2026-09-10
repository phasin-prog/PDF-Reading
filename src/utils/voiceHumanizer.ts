import { VoiceNarratorProfile } from '../types';
import { applyPodcastDeEsser } from './podcastEqualizer';

/**
 * Voice Narrator Profiles tailored for long-form literature, philosophy, and psychology.
 */
export interface NarratorProfileConfig {
  id: VoiceNarratorProfile;
  name: string;
  badge: string;
  rate: number;
  pitch: number;
  sentenceDelayMs: number;
  description: string;
  tagline: string;
}

export const NARRATOR_PROFILES: Record<VoiceNarratorProfile, NarratorProfileConfig> = {
  philosopher: {
    id: 'philosopher',
    name: 'The Philosopher',
    badge: '🧠 Calm & Intellectually Serious',
    rate: 0.88,
    pitch: 0.95,
    sentenceDelayMs: 380,
    tagline: 'Calm, deliberate, contemplative delivery tailored for C.G. Jung, Kant & Nietzsche.',
    description: 'Measured, deeply reflective cadence with extended conceptual pauses around key philosophical claims and contrasts.',
  },
  professor: {
    id: 'professor',
    name: 'The Professor',
    badge: '🏛️ Clear & Authoritative',
    rate: 0.96,
    pitch: 0.98,
    sentenceDelayMs: 250,
    tagline: 'Clear, structured, articulate academic lecture style.',
    description: 'Focused, highly intelligible enunciation with clear logical transitions and definition emphasis.',
  },
  storyteller: {
    id: 'storyteller',
    name: 'The Storyteller',
    badge: '📜 Expressive & Immersive',
    rate: 0.94,
    pitch: 1.02,
    sentenceDelayMs: 220,
    tagline: 'Rich, rhythmic, engaging narrative tone for literary prose and memoirs.',
    description: 'Warm acoustic modulation that brings historical essays and narrative psychology to life.',
  },
  essayist: {
    id: 'essayist',
    name: 'The Essayist',
    badge: '☕ Intimate & Conversational',
    rate: 0.95,
    pitch: 0.99,
    sentenceDelayMs: 200,
    tagline: 'Intimate, conversational tone for Montaigne, Emerson, and modern humanistic essays.',
    description: 'Relatable, thoughtful pacing that sounds like a close mentor thinking through an idea with you.',
  },
  scholar: {
    id: 'scholar',
    name: 'The Scholar',
    badge: '📚 Restrained & Precise',
    rate: 0.92,
    pitch: 0.96,
    sentenceDelayMs: 300,
    tagline: 'Restrained, objective precision with minimal emotionality.',
    description: 'High-precision academic delivery designed for complex analytical philosophy and research papers.',
  },
  observer: {
    id: 'observer',
    name: 'The Observer',
    badge: '🌌 Detached & Contemplative',
    rate: 0.85,
    pitch: 0.94,
    sentenceDelayMs: 450,
    tagline: 'Detached, spacious, meditative narration for Stoicism & Eastern Philosophy.',
    description: 'Unrushed, peaceful delivery with generous reflective gaps between philosophical thoughts.',
  },
  narrator: {
    id: 'narrator',
    name: 'Audiobook Storyteller',
    badge: '🎙️ Warm & Human',
    rate: 0.95,
    pitch: 0.98,
    sentenceDelayMs: 200,
    tagline: 'Warm, natural human narrative tone with gentle breathing pauses.',
    description: 'Relaxed storytelling cadence that reduces listening fatigue over long listening sessions.',
  },
  lecturer: {
    id: 'lecturer',
    name: 'Academic Lecturer',
    badge: '🎓 Crisp Enunciation',
    rate: 1.02,
    pitch: 1.0,
    sentenceDelayMs: 140,
    tagline: 'Articulate, high-clarity voice with clear consonant separation.',
    description: 'Focused academic tone ideal for absorbing dense research papers, structured chapters, and psychological arguments.',
  },
  standard: {
    id: 'standard',
    name: 'Standard Humanized Speech',
    badge: '⭐ Primary Baseline Engine',
    rate: 0.98,
    pitch: 1.0,
    sentenceDelayMs: 150,
    tagline: 'Primary baseline engine — smooth conversational flow with dynamic velocity & linking sounds.',
    description: 'Balanced baseline engine providing steady velocity, phonetic linking, and clean playback.',
  },
};

/**
 * Converts Roman numerals commonly found in philosophical literature to spoken numbers.
 */
function romanToArabic(roman: string): number {
  const map: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  const upper = roman.toUpperCase();
  let total = 0;
  for (let i = 0; i < upper.length; i++) {
    const curr = map[upper[i]] || 0;
    const next = map[upper[i + 1]] || 0;
    if (curr < next) {
      total -= curr;
    } else {
      total += curr;
    }
  }
  return total;
}

/**
 * Enhances phonetic linking sounds (liaisons / connected speech) so words blend smoothly
 * without artificial pauses between consonants and trailing vowels.
 */
export function applyLinkingSounds(text: string): string {
  if (!text) return '';
  return text
    // Linking phrasal verbs (e.g. pick it up, check it out, turn it on)
    .replace(/\b(pick|check|take|turn|read|look|fill|figure|find|keep|set|work|point|break|hold|carry|give|bring)\s+(it|out|in|on|up|off|over|away|about|into|along)\b/gi, '$1-$2')
    // Linking prepositions & pronouns (e.g. part of, some of, first of all, out of, kind of, sort of)
    .replace(/\b(part|kind|sort|a lot|most|all|some|one|none|instead|front|top|bottom|end)\s+of\b/gi, '$1-of')
    .replace(/\bfirst\s+of\s+all\b/gi, 'first-of-all')
    .replace(/\bout\s+of\b/gi, 'out-of')
    .replace(/\bnot\s+at\s+all\b/gi, 'not-at-all')
    // Linking 'r' before vowels (e.g. far away, there is, here and, more and more)
    .replace(/\b(far|there|here|more|where|for|never|ever)\s+([aeiouAEIOU]\w*)\b/gi, '$1-$2')
    // Linking auxiliary verb contractions & articles (e.g. is it, as if, an apple)
    .replace(/\b(is|as|it|has|was)\s+(it|a|an|in|on|at|of|us|up)\b/gi, '$1-$2');
}

/**
 * Accentuate key psychological and philosophical terms with subtle punctuation cadence
 * so SpeechSynthesis gives them distinct vocal prominence and stress.
 */
export function applyWordEmphasis(text: string): string {
  if (!text) return '';
  return text
    .replace(/\bcollective unconscious\b/gi, 'collective, unconscious')
    .replace(/\barchetype(s)?\b/gi, 'archetype$1')
    .replace(/\bindividuation\b/gi, 'in-dividuation')
    .replace(/\bsynchronicity\b/gi, 'synchro-nicity');
}

export interface DynamicUtteranceParams {
  rate: number;
  pitch: number;
  volume: number;
  pauseBonusMs: number;
  cadenceDescription: string;
}

/**
 * Dynamically calculates speech rate, pitch contour, and breath pauses
 * based on sentence punctuation, length, and clause structure (Dynamics Voices).
 */
export function calculateDynamicSentenceUtterance(
  sentence: string,
  baseRate: number,
  basePitch: number,
  baseVolume: number = 1.0
): DynamicUtteranceParams {
  let rate = baseRate;
  let pitch = basePitch;
  let volume = baseVolume;
  let pauseBonusMs = 0;
  let cadenceDescription = 'Standard Natural Flow';

  const trimmed = sentence.trim();

  // 0. Year fast-path: sentences carrying a year (1976, 1995, 2567...) get a
  // slight lift — digit clusters are already slow to articulate, never slow them further.
  const hasYear = /\b(?:1[0-9]{3}|20[0-9]{2}|24[0-9]{2}|25[0-9]{2})s?\b/.test(trimmed);
  const yearBoost = hasYear ? 1.06 : 1.0;
  if (hasYear) {
    cadenceDescription = 'Year Crisp Cadence';
  }

  // 1. Inquisitive sentence ending with '?'
  if (trimmed.endsWith('?') || /^(why|how|what|where|who|when|is|are|can|could|would|should|does|do)\b/i.test(trimmed)) {
    rate = baseRate * 0.94 * yearBoost; // slightly slower for clear inquisitive phrasing
    pitch = basePitch * 1.05; // natural rising intonation at question end
    pauseBonusMs = 120;
    cadenceDescription = 'Inquisitive Rising Cadence';
  }
  // 2. Energetic/Exclamatory sentence ending with '!'
  else if (trimmed.endsWith('!')) {
    rate = baseRate * 1.03 * yearBoost;
    pitch = basePitch * 1.06;
    volume = Math.min(1.0, baseVolume * 1.05);
    cadenceDescription = 'Emphatic Energetic Cadence';
  }
  // 3. Dense philosophical statement: long AND clause-heavy (commas/colons force
  // parsing pauses). Long but CLEAN sentences (no clause breaks) flow fast instead.
  else if (trimmed.length > 160) {
    const hasClauseBreaks = /[,;:—–]|--/.test(trimmed);
    if (hasClauseBreaks) {
      rate = baseRate * 0.92 * yearBoost; // deliberate, contemplative pace for complex concepts
      pitch = basePitch * 0.97; // warm, resonant pitch
      pauseBonusMs = 180;
      cadenceDescription = 'Deep Philosophical Measured Cadence';
    } else {
      rate = baseRate * 1.0 * yearBoost; // clean flow, no parsing pauses needed
      pauseBonusMs = 120;
      cadenceDescription = 'Flowing Narrative Cadence';
    }
  } else if (/[:;]/.test(trimmed)) {
    rate = baseRate * 0.94 * yearBoost;
    pitch = basePitch * 0.98;
    pauseBonusMs = 140;
    cadenceDescription = 'Structured Clause Cadence';
  }
  // 4. Short transition clause (<40 chars or starting with transitional adverbs)
  else if (trimmed.length < 40 || /^(however|therefore|thus|furthermore|for instance|for example|in fact|indeed)\b/i.test(trimmed)) {
    rate = baseRate * 1.02 * yearBoost; // crisp, energetic transition
    pitch = basePitch * 1.02;
    pauseBonusMs = 60;
    cadenceDescription = 'Crisp Transition Cadence';
  }
  // 5. Parenthetical / Quoted clause — barely slower now (quotes are stripped
  // downstream anyway); parens only mark a reflective aside, not a crawl.
  else if (/^["'«]/.test(trimmed) || /[\(\)]/.test(trimmed)) {
    rate = baseRate * 0.98 * yearBoost;
    pitch = basePitch * 1.03;
    cadenceDescription = 'Reflective Narrative Cadence';
  } else if (hasYear) {
    rate = baseRate * yearBoost;
  }

  // Anti-stack floor: profile × cadence × dynamic must never compound below 88%
  // of base (previously 0.88×0.90×0.92 ≈ 0.73× — the "everything is slow" bug).
  rate = Math.max(rate, baseRate * 0.88);

  return {
    rate: Math.max(0.5, Math.min(2.0, rate)),
    pitch: Math.max(0.5, Math.min(1.5, pitch)),
    volume,
    pauseBonusMs,
    cadenceDescription,
  };
}

/**
 * Filters out arbitrary numbers from speech text while preserving:
 * 1. Years (e.g., 1889, 1995, 2024, 2567, 1950s, 1800s, 350 B.C., 2026 C.E., ค.ศ. 2024, พ.ศ. 2567, ปี 1999)
 * 2. Specific structural identifiers (e.g., Chapter 1, Section 2, Volume 9, Part 3, Book 4, Figure 1, Table 2, Page 15, บทที่ 1, หน้า 10, ข้อที่ 5)
 * 3. Dates & Ordinals (e.g., January 15, May 4th, 19th century, 21st, 1st, 2nd, 3rd)
 */
export function filterNumbersExceptYearsAndSpecifics(text: string): string {
  if (!text) return '';

  const preservedMap: string[] = [];
  const protect = (match: string) => {
    const key = `__PRESERVED_NUM_${preservedMap.length}__`;
    preservedMap.push(match);
    return key;
  };

  let processed = text;

  // 1. Protect structural & specific prefixes (English & Thai):
  // e.g. "Chapter 1", "Section 2.3", "Volume 9", "Vol. 9", "Part 3", "Book 4", "Figure 1", "Table 2", "page 15", "pages 12 to 15", "บทที่ 1", "ส่วนที่ 2", "เล่มที่ 3", "หน้า 10", "รูปที่ 1", "ข้อที่ 5"
  processed = processed.replace(
    /\b(Chapter|Section|Volume|Vol\.|Part|Book|Figure|Table|Page|pages|No\.|บทที่|ส่วนที่|เล่มที่|หน้า|รูปที่|ข้อที่)\s+[0-9]+(?:\.[0-9]+)?(?:\s+to\s+[0-9]+)?\b/gi,
    protect
  );

  // 2. Protect month dates: "January 15", "Jan 15th", "15th of May", "May 4, 1995"
  processed = processed.replace(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?\b/gi,
    protect
  );
  processed = processed.replace(
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi,
    protect
  );

  // 3. Protect Years with BC / BCE / AD / CE / พ.ศ. / ค.ศ. / B.C.E. / A.D. / ปี / ศตวรรษที่
  processed = processed.replace(
    /\b\d{1,4}\s*(?:B\.?C\.?E?|A\.?D\.?|C\.?E\.?)\b/gi,
    protect
  );
  processed = processed.replace(
    /\b(?:B\.?C\.?E?|A\.?D\.?|C\.?E\.?|ค\.ศ\.|พ\.ศ\.|ปี|ศตวรรษที่)\s*\d{1,4}\b/gi,
    protect
  );

  // 4. Protect Centuries & Ordinals: "19th century", "20th century", "21st century", "1st", "2nd", "3rd", "4th", "19th", "20th"
  processed = processed.replace(
    /\b\d{1,2}(?:st|nd|rd|th)(?:\s+century)?\b/gi,
    protect
  );

  // 5. Protect 4-digit years (1000 to 2099 or 2400 to 2699 for Thai BE) and decades (e.g. 1980s, 1990s, 1800s, 1900s)
  processed = processed.replace(
    /\b(?:1[0-9]{3}|20[0-9]{2}|24[0-9]{2}|25[0-9]{2})(?:s|'s)?\b/g,
    protect
  );

  // Step 2: Now remove all remaining arbitrary numbers (integers, decimals, percentages, standalone digits)
  processed = processed
    .replace(/\b\d+(?:,\d+)*(?:\.\d+)?%?\b/g, '')
    // Clean up extra spaces or orphaned punctuation
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:;?!])/g, '$1');

  // Step 3: Restore preserved years and specific numbers
  preservedMap.forEach((val, idx) => {
    processed = processed.replace(`__PRESERVED_NUM_${idx}__`, val);
  });

  return processed.trim();
}

/**
 * Pre-processes and normalizes text for speech synthesis to sound human, articulate, and natural.
 * Eliminates robotic artifacts like reading "C dot G dot Jung" or "dash dash".
 */
export function humanizeSpeechText(rawText: string): string {
  if (!rawText) return '';

  // 0. Skip reading standalone page position footers at bottom of paper pages (e.g. "Page 123", "p. 123", "- 123 -", "123", "หน้า 123")
  const trimmed = rawText.trim();
  if (
    /^\d{1,4}$/.test(trimmed) ||
    /^\d{1,4}\s*[\/\-—]\s*\d{1,4}$/.test(trimmed) ||
    /^[\-\—\–\u2013\u2014]\s*\d{1,4}\s*[\-\—\–\u2013\u2014]$/.test(trimmed) ||
    /^(?:page|p\.|pg\.|p|หน้า)\s*\d{1,4}(?:\s*(?:of|\/|จาก)\s*\d{1,4})?$/i.test(trimmed) ||
    /^\d{1,4}\s*(?:of|\/|จาก)\s*\d{1,4}$/i.test(trimmed)
  ) {
    return ''; // Skip reading page position audio completely
  }

  let text = rawText;

  // 1. Strip Princeton Edition paragraph numbers [1], [145] from spoken audio so TTS reads seamlessly
  text = text.replace(/\[\d+\]\s*/g, '');

  // 1. Social titles & honorifics expansion (e.g. Mr., Mrs., Dr., Prof.)
  text = text
    .replace(/\bMr\.\s*/g, 'Mister ')
    .replace(/\bMrs\.\s*/g, 'Missus ')
    .replace(/\bMs\.\s*/g, 'Miss ')
    .replace(/\bDr\.\s*/g, 'Doctor ')
    .replace(/\bProf\.\s*/g, 'Professor ')
    .replace(/\bSt\.\s*/g, 'Saint ')
    .replace(/\bRev\.\s*/g, 'Reverend ')
    .replace(/\bFr\.\s*/g, 'Father ')
    .replace(/\bSr\.\s*/g, 'Senior ')
    .replace(/\bJr\.\s*/g, 'Junior ');

  // 2. Academic citations of Collected Works (C.W.) & philosophical figures (C.G. Jung = Carl Gustav Jung)
  text = text
    .replace(/\bC\.?\s*W\.?\s*(?:of\s+)?(?:C\.?\s*G\.?\s*)?Jung\b/gi, 'Collected Works of Carl Gustav Jung')
    .replace(/\bC\.?\s*W\.?\s*([0-9IVXLCDM]+)\b/gi, 'Collected Works, Volume $1')
    .replace(/\bC\.?\s*W\.?\s*vol\.?\s*([0-9IVXLCDM]+)\b/gi, 'Collected Works, Volume $1')
    .replace(/\bC\.?\s*W\.?\b/g, 'Collected Works')
    .replace(/\bCW\s+([0-9IVXLCDM]+)\b/gi, 'Collected Works, Volume $1')
    .replace(/\bCW\b/g, 'Collected Works')
    .replace(/\bC\.?\s*G\.?\s*Jung\b/gi, 'Carl Gustav Jung')
    .replace(/\bCG\s+Jung\b/gi, 'Carl Gustav Jung')
    .replace(/\bC\.?\s*G\.?\b/g, 'Carl Gustav')
    .replace(/\bS\.?\s*Freud\b/gi, 'Sigmund Freud')
    .replace(/\bF\.?\s*Nietzsche\b/gi, 'Friedrich Nietzsche')
    .replace(/\bW\.?\s*James\b/gi, 'William James')
    .replace(/\bM\.?\s*Aurelius\b/gi, 'Marcus Aurelius')
    .replace(/\bV\.?\s*Frankl\b/gi, 'Viktor Frankl')
    .replace(/\bI\.?\s*Kant\b/gi, 'Immanuel Kant');

  // 3. Latin, citations, and publication abbreviations
  text = text
    .replace(/\bi\.e\.,?\s*/gi, 'that is, ')
    .replace(/\be\.g\.,?\s*/gi, 'for example, ')
    .replace(/\bviz\.,?\s*/gi, 'namely, ')
    .replace(/\betc\.\s*/gi, 'et cetera, ')
    .replace(/\bcf\.\s*/gi, 'compare ')
    .replace(/\bvs\.\s*/gi, 'versus ')
    .replace(/\bibid\.\s*/gi, 'in the same place, ')
    .replace(/\bop\.\s*cit\.\s*/gi, 'in the work cited, ')
    .replace(/\bN\.B\.\s*/gi, 'Note well, ')
    .replace(/\bed\.\s*/gi, 'edition ')
    .replace(/\btrans\.\s*/gi, 'translated by ')
    .replace(/\bff\.\s*/gi, 'and following pages ');

  // 4. Document structure & citations (Chapters, Sections, Volumes, Pages)
  text = text
    .replace(/\bVol\.\s*([0-9IVXLCDM]+)/gi, 'Volume $1')
    .replace(/\bCh\.\s*([0-9IVXLCDM]+)/gi, 'Chapter $1')
    .replace(/\bpp\.\s*([0-9]+)\s*[-–—]\s*([0-9]+)/gi, 'pages $1 to $2')
    .replace(/\bp\.\s*([0-9]+)/gi, 'page $1')
    .replace(/§\s*([0-9]+)/g, 'section $1');

  // 5. Roman numeral chapters like "Chapter IV" -> "Chapter 4"
  text = text.replace(
    /\b(Chapter|Part|Section|Book)\s+([IVXLCDM]+)\b/gi,
    (_match, prefix, roman) => {
      const num = romanToArabic(roman);
      return num > 0 && num <= 100 ? `${prefix} ${num}` : _match;
    }
  );

  // 6. Skip arbitrary numbers while keeping years (ค.ศ., พ.ศ., B.C., A.D., 1889, 2024, 1950s) and specific identifiers
  text = filterNumbersExceptYearsAndSpecifics(text);

  // 7. Apply Linking Sounds for fluid connected speech liaisons
  text = applyLinkingSounds(text);

  // 7. Apply Word Emphasis for key philosophical concepts
  text = applyWordEmphasis(text);

  // 8. Punctuation cadence: convert dashes to gentle acoustic pauses
  text = text
    // Replace em-dashes and long hyphens with comma pauses so TTS breathes naturally
    .replace(/[\u2014\u2013]|--+/g, ', ')
    // Collapse stacked delimiters from OCR/scan noise (", , : :" -> ","):
    // each extra mark spawns its own utterance + pause, which reads as a crawl
    .replace(/([,;:])(?:\s*[,:;])+/g, '$1')
    .replace(/([!?])\1{2,}/g, '$1')
    // Normalize multiple periods or ellipses with breathing space
    .replace(/\.{3,}/g, '... ')
    // Normalize quotes around terms
    .replace(/["“”«»]/g, '')
    // Clean excessive spaces
    .replace(/\s+/g, ' ')
    .trim();

  // 9. Apply Pro Podcast Sibilance Control (De-Esser)
  text = applyPodcastDeEsser(text, 'strong');

  return text;
}

/**
 * Evaluates voice quality and human-likeness based on system voice characteristics.
 * Neural, Natural, and Enhanced models provide orders-of-magnitude clearer speech.
 */
export function evaluateVoiceQuality(voice: SpeechSynthesisVoice): {
  qualityGrade: 'natural' | 'enhanced' | 'standard';
  isHumanized: boolean;
  qualityScore: number;
  description: string;
  isUSMale: boolean;
  gender: 'male' | 'female' | 'neutral';
} {
  const name = voice.name.toLowerCase();
  const uri = voice.voiceURI.toLowerCase();
  const lang = voice.lang.toLowerCase();

  let score = 50;
  let grade: 'natural' | 'enhanced' | 'standard' = 'standard';
  let description = 'Standard synthetic voice';

  const isUSLanguage = lang.includes('en-us') || lang.includes('en_us') || (lang.startsWith('en') && (name.includes('united states') || name.includes('us') || name.includes('american')));

  // Identify Male names & signatures
  const maleKeywords = [
    'mark', 'guy', 'christopher', 'david', 'roger', 'steffan', 'alex', 'fred',
    'tom', 'ralph', 'daniel', 'matthew', 'joey', 'stephen', 'brian', 'eric',
    'richard', 'george', 'arthur', 'oliver', 'male', 'man', 'boy', 'andrew',
    'james', 'john', 'paul', 'michael', 'william', 'narrator', 'philosopher'
  ];

  const femaleKeywords = [
    'jenny', 'aria', 'samantha', 'ava', 'serena', 'victoria', 'karen', 'zira',
    'susan', 'catherine', 'hazel', 'emma', 'linda', 'female', 'woman', 'girl',
    'salli', 'joanna', 'kendra', 'kimberly', 'ivy'
  ];

  const isExplicitMale = maleKeywords.some(kw => name.includes(kw) || uri.includes(kw));
  const isExplicitFemale = femaleKeywords.some(kw => name.includes(kw) || uri.includes(kw));

  const gender: 'male' | 'female' | 'neutral' = isExplicitMale ? 'male' : isExplicitFemale ? 'female' : 'neutral';
  const isUSMale = Boolean(isUSLanguage && (isExplicitMale || (!isExplicitFemale && lang.startsWith('en'))));

  // High-fidelity neural/natural indicators
  const isNaturalKeyword =
    name.includes('natural') ||
    name.includes('neural') ||
    name.includes('multilingual') ||
    uri.includes('natural') ||
    uri.includes('neural');

  const isEnhancedKeyword =
    name.includes('enhanced') ||
    name.includes('premium') ||
    name.includes('studio') ||
    name.includes('siri') ||
    name.includes('hd');

  const isTier1Brand =
    name.includes('google') ||
    name.includes('microsoft') ||
    name.includes('apple');

  // Penalize robotic legacy voices
  const isRobotic =
    name.includes('espeak') ||
    name.includes('desktop') ||
    name.includes('compact') ||
    name.includes('klatt');

  // Top-Tier US Male Models
  if (name.includes('guy') && (isNaturalKeyword || isTier1Brand)) {
    score += 180;
    grade = 'natural';
    description = '🇺🇸 US Male Top-Tier: Microsoft Guy Natural (Ultra Clear, Smooth Audiobook Delivery)';
  } else if (name.includes('christopher') && (isNaturalKeyword || isTier1Brand)) {
    score += 175;
    grade = 'natural';
    grade = 'natural';
    description = '🇺🇸 US Male Top-Tier: Microsoft Christopher (Authoritative & Deep Baritone Lecture)';
  } else if (name.includes('mark') && isTier1Brand) {
    score += 160;
    grade = 'natural';
    description = '🇺🇸 US Male Top-Tier: Microsoft Mark (Smooth & High Intelligibility Baseline)';
  } else if (name.includes('alex') && isTier1Brand) {
    score += 160;
    grade = 'natural';
    description = '🇺🇸 US Male Top-Tier: Apple Alex (Advanced Natural Phonetics & Human Breathing)';
  } else if (name.includes('tom') && (isEnhancedKeyword || isTier1Brand)) {
    score += 155;
    grade = 'natural';
    description = '🇺🇸 US Male Top-Tier: Apple Tom Enhanced (Crisp Articulation & Studio Warmth)';
  } else if (name.includes('david') && isTier1Brand) {
    score += 150;
    grade = 'natural';
    description = '🇺🇸 US Male Top-Tier: Microsoft David (Clear Classic American Enunciation)';
  } else if (name.includes('roger') && isNaturalKeyword) {
    score += 150;
    grade = 'natural';
    description = '🇺🇸 US Male Top-Tier: Microsoft Roger Natural (Warm & Articulate US Male)';
  } else if (name.includes('google') && isUSLanguage && isExplicitMale) {
    score += 140;
    grade = 'natural';
    description = '🇺🇸 US Male Top-Tier: Google US English Male (Clean & Fast AI Articulation)';
  } else if (isUSMale && isNaturalKeyword) {
    score += 130;
    grade = 'natural';
    description = '🇺🇸 US Male Natural HD Voice (High-Fidelity American English)';
  } else if (isNaturalKeyword) {
    score += 90;
    grade = 'natural';
    description = 'Neural Natural HD Voice (Highest Clarity & Human Flow)';
  } else if (isEnhancedKeyword || (isTier1Brand && isUSMale)) {
    score += 70;
    grade = 'enhanced';
    description = 'Enhanced High-Definition Voice (Smooth & Articulate)';
  } else if (isTier1Brand) {
    score += 35;
    grade = 'enhanced';
    description = 'Modern System Voice (Clear enunciation)';
  }

  if (isUSMale) {
    score += 20;
  }

  if (voice.default) {
    score += 5;
  }

  if (isRobotic) {
    score -= 40;
    grade = 'standard';
    description = 'Basic System Synthesizer';
  }

  return {
    qualityGrade: grade,
    isHumanized: grade !== 'standard',
    qualityScore: Math.max(10, Math.min(100, score)),
    description,
    isUSMale,
    gender,
  };
}

/**
 * Finds the absolute clearest, highest-fidelity English voice available in the client runtime.
 */
export function findBestEnglishHumanizedVoice(
  voices: { voice: SpeechSynthesisVoice; qualityScore: number; lang: string }[]
): SpeechSynthesisVoice | null {
  const englishVoices = voices.filter(
    (v) => v.lang.toLowerCase().startsWith('en')
  );

  if (englishVoices.length === 0) return null;

  // Sort descending by qualityScore
  const sorted = [...englishVoices].sort((a, b) => b.qualityScore - a.qualityScore);
  return sorted[0]?.voice || null;
}
