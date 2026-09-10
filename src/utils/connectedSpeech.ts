import { ConnectedSpeechLink, SentencePronunciationAnalysis } from '../types';

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'nor', 'so', 'yet',
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'to', 'from', 'up', 'down', 'is', 'am', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can',
  'could', 'shall', 'should', 'will', 'would', 'may', 'might', 'must',
  'it', 'its', 'he', 'she', 'they', 'them', 'his', 'her', 'their', 'this',
  'that', 'these', 'those', 'which', 'who', 'whom', 'whose', 'of', 'as',
]);

/**
 * Analyzes an English sentence to uncover native connected speech mechanics:
 * 1. Consonant-to-Vowel (C->V) linking: Consonant at end of word connects directly to opening vowel.
 * 2. Vowel-to-Vowel (V->V) glide insertion: /j/ or /w/ transitions.
 * 3. Flap T / Soft D: Intervocalic 't' sound.
 * 4. Content vs Function word stress: Which words carry heavy emphasis in speech rhythm.
 */
export function analyzeSentenceConnectedSpeech(sentence: string): SentencePronunciationAnalysis {
  const rawWords = sentence.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
  const links: ConnectedSpeechLink[] = [];

  const analyzedWords = rawWords.map((word) => {
    const lower = word.toLowerCase();
    const isContentWord = !FUNCTION_WORDS.has(lower) && word.length > 2;
    return {
      word,
      ipa: `/${word.toLowerCase()}/`,
      stress: isContentWord ? 'Primary / Pitch Accent' : 'Weak / Reduced',
      isContentWord,
    };
  });

  for (let i = 0; i < rawWords.length - 1; i++) {
    const w1 = rawWords[i];
    const w2 = rawWords[i + 1];
    const w1Lower = w1.toLowerCase();
    const w2Lower = w2.toLowerCase();

    const lastChar = w1Lower[w1Lower.length - 1];
    const firstChar = w2Lower[0];

    // Check Flap T (e.g. "not only", "what about", "let it")
    if (lastChar === 't' && VOWELS.has(firstChar)) {
      links.push({
        firstWord: w1,
        secondWord: w2,
        type: 'flap-t',
        description: `Flap-T Linking: The 't' in "${w1}" sounds like a soft tap [ɾ] flowing into "${w2}".`,
        phoneticGuide: `${w1.slice(0, -1)}[ɾ]‿${w2}`,
      });
      continue;
    }

    // Consonant to Vowel Linking (e.g. "turn off", "read it", "hold on")
    if (!VOWELS.has(lastChar) && VOWELS.has(firstChar)) {
      links.push({
        firstWord: w1,
        secondWord: w2,
        type: 'consonant-to-vowel',
        description: `Liaison (C→V): The final consonant "${lastChar}" binds directly to the first syllable of "${w2}".`,
        phoneticGuide: `${w1}‿${w2}`,
      });
      continue;
    }

    // Vowel to Vowel Glide Linking (e.g. "see it" -> /j/, "go in" -> /w/)
    if (VOWELS.has(lastChar) && VOWELS.has(firstChar)) {
      const glide = ['e', 'i', 'y'].includes(lastChar) ? 'ʸ' : 'ʷ';
      links.push({
        firstWord: w1,
        secondWord: w2,
        type: 'vowel-to-vowel-glide',
        description: `Smooth Vowel Glide: A soft [${glide === 'ʸ' ? 'y' : 'w'}] transition connects "${w1}" and "${w2}".`,
        phoneticGuide: `${w1}‿${glide}${w2}`,
      });
    }
  }

  return {
    sentence,
    words: analyzedWords,
    links,
  };
}
