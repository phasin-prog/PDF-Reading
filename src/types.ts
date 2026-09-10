export interface PageContent {
  pageNumber: number;
  text: string;
  sentences: string[];
  paragraphs: string[];
  chapterTitle?: string;
  /** First sentence continues a sentence split by the page break — page turn must not pause. */
  firstSentenceContinues?: boolean;
}

export interface ChapterBookmark {
  title: string;
  author?: string;
  part?: string;
  pageIndex: number;
  description?: string;
}

export interface UserBookmark {
  id: string;
  documentId: string;
  documentName: string;
  pageIndex: number;
  pageNumber: number;
  snippet: string;
  createdAt: number;
  chapterTitle?: string;
  note?: string;
  colorTag?: 'yellow' | 'blue' | 'green' | 'purple' | 'red';
}

export interface ReadingProgress {
  pageIndex: number;
  sentenceIndex: number;
  paragraphIndex: number;
  completed: boolean;
  lastReadAt: number;
}

export type CadenceMode = 'natural-audiobook' | 'intensive-study' | 'executive-skim' | 'deep-reflection';

export type VoiceNarratorProfile =
  | 'philosopher'
  | 'professor'
  | 'storyteller'
  | 'essayist'
  | 'scholar'
  | 'observer'
  | 'narrator'
  | 'lecturer'
  | 'standard';

export type ReadingCursorMode =
  | 'smooth-follow'
  | 'center-focus'
  | 'sentence-focus'
  | 'paragraph-focus'
  | 'manual';

export type FootnoteHandlingMode =
  | 'inline'
  | 'separate'
  | 'skip'
  | 'listen-later';

export type ParagraphNarrativeState =
  | 'INTRODUCTION'
  | 'EXPLANATION'
  | 'ARGUMENT'
  | 'REFLECTION'
  | 'CONTRAST'
  | 'TENSION'
  | 'EXAMPLE'
  | 'REVELATION'
  | 'CONCLUSION';

export interface SavedConcept {
  id: string;
  documentId: string;
  documentName: string;
  term: string;
  definition: string;
  philosophicalContext?: string;
  pageIndex: number;
  sentenceIndex: number;
  createdAt: number;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  author?: string;
  subtitle?: string;
  size: number;
  pageCount: number;
  createdAt: number;
  lastReadAt: number;
  detectedLanguage: string;
  totalWords: number;
  estimatedMinutes: number;
  pages: PageContent[];
  chapters?: ChapterBookmark[];
  readingProgress: ReadingProgress;
  customSettings?: {
    rate?: number;
    pitch?: number;
    voiceURI?: string;
    lang?: string;
    profile?: VoiceNarratorProfile;
  };
}

export interface TTSVoiceInfo {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  langName: string;
  isDefault: boolean;
  isLocal: boolean;
  qualityGrade: 'natural' | 'enhanced' | 'standard';
  isHumanized: boolean;
  qualityScore: number;
  description?: string;
  isUSMale?: boolean;
  gender?: 'male' | 'female' | 'neutral';
  isBuiltInStudioVoice?: boolean;
  cloudVoiceName?: string;
}

export interface WordBoundaryInfo {
  sentenceIndex: number;
  charIndex: number;
  charLength: number;
  word: string;
}

export type HighlightMode = 'word' | 'sentence';

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentDocumentId: string | null;
  currentPageIndex: number;
  currentSentenceIndex: number;
  rate: number;
  pitch: number;
  volume: number;
  voiceURI: string | null;
  targetLang: string;
  autoScroll: boolean;
  sleepTimerEnd: number | null;
  sleepTimerRemainingMinutes: number | null;
  activeWordCharIndex?: number | null;
  activeWordLength?: number | null;
  activeWordText?: string | null;
  highlightMode?: HighlightMode;
  profile?: VoiceNarratorProfile;
  cadenceMode?: CadenceMode;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'oled' | 'nord';
export type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl';
export type ReaderFontFamily = 'serif' | 'sans' | 'dyslexic' | 'mono';
export type ReaderLineWidth = 'narrow' | 'medium' | 'wide' | 'full';
export type ReaderLineHeight = 'compact' | 'comfortable' | 'relaxed';
export type ParagraphIndent = 'none' | 'standard' | 'deep';
export type ViewMode = 'text' | 'pdf';
export type PageViewMode = 'single' | 'continuous';

export interface DictionaryDefinitionItem {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryMeaningGroup {
  partOfSpeech: string;
  definitions: DictionaryDefinitionItem[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface PhoneticVariant {
  text?: string;
  audio?: string;
  accent?: string;
}

export interface WordDefinition {
  word: string;
  ipa: string;
  syllables: string[];
  stressedSyllableIndex: number;
  partOfSpeech: string;
  partOfSpeechDescription?: string;
  whatItIs?: string;
  whatItSignifies?: string;
  definition: string;
  thaiMeaning: string;
  philosophicalContext?: string;
  sampleSentence?: string;
  audioUrl?: string;
  origin?: string;
  meaningsList?: DictionaryMeaningGroup[];
  phoneticVariants?: PhoneticVariant[];
  synonyms?: string[];
  antonyms?: string[];
  source: 'offline' | 'dictionary-api' | 'phonetic-rule';
}

export interface ConnectedSpeechLink {
  firstWord: string;
  secondWord: string;
  type: 'consonant-to-vowel' | 'vowel-to-vowel-glide' | 'flap-t' | 'elision' | 'breath-pause';
  description: string;
  phoneticGuide: string;
}

export interface SentencePronunciationAnalysis {
  sentence: string;
  words: Array<{
    word: string;
    ipa: string;
    stress: string;
    isContentWord: boolean;
  }>;
  links: ConnectedSpeechLink[];
}

// -------------------------------------------------------------
// P0 & P1 Production Schema Extensions
// -------------------------------------------------------------

export type TTSPlaybackStateEnum =
  | 'IDLE'
  | 'QUEUED'
  | 'GENERATING'
  | 'STREAMING'
  | 'DECODING'
  | 'CACHED'
  | 'PLAYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export interface AudioSegmentRecord {
  audioKey: string;           // Deterministic composite SHA256 / hash key
  documentId: string;
  chapterId?: string;
  segmentId: string;
  textHash: string;
  normalizedText: string;
  voiceId: string;            // 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Kore' | 'Aoede'
  modelId: string;            // 'gemini-2.5-flash-preview-tts'
  voiceSettingsHash: string;
  audioFormat: 'audio/wav' | 'audio/pcm' | 'audio/mp3';
  sampleRate: number;         // 24000
  durationMs: number;         // Milliseconds duration
  createdAt: number;
  lastPlayedAt: number;
  sizeBytes: number;
  version: string;            // TTS_PIPELINE_VERSION
  audioDataUrl: string;       // Base64 data URL
}

export interface AudioMetadataRecord {
  audioKey: string;
  documentId: string;
  chapterId?: string;
  segmentId: string;
  durationMs: number;
  wordCount: number;
  voiceId: string;
  sampleRate: number;
  createdAt: number;
  lastPlayedAt: number;
  sizeBytes: number;
}

export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
  charIndex: number;
  charLength: number;
  confidence?: number;
}

export interface ClauseTimestamp {
  clauseText: string;
  startMs: number;
  endMs: number;
  startCharIndex: number;
  length: number;
  pauseAfterMs: number;
}

export interface AudioAlignmentData {
  audioKey: string;
  totalDurationMs: number;
  words: WordTimestamp[];
  clauses: ClauseTimestamp[];
  synthesizedAt: number;
}

export type PrefetchPriority = 0 | 1 | 2 | 3 | 4 | 5;
// Priority 0 = Currently Playing (Immediate)
// Priority 1 = Next Segment (+1)
// Priority 2 = Previous Segment (-1)
// Priority 3 = Next 3 Segments (+2, +3, +4)
// Priority 4 = Current Paragraph Remainder
// Priority 5 = Chapter Pre-cache Background Job

export interface PrefetchQueueTask {
  id: string;
  priority: PrefetchPriority;
  text: string;
  voiceName: string;
  documentId?: string;
  chapterId?: string;
  pageIndex: number;
  sentenceIndex: number;
  addedAt: number;
  status: 'PENDING' | 'FETCHING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

export interface BatchJobItem {
  text: string;
  sentenceIndex: number;
  pageIndex?: number;
}

export interface BatchJobProgress {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  total: number;
  completed: number;
  failed: number;
  progressPercent: number;
  createdAt: number;
  completedAt?: number;
  estimatedRemainingMs?: number;
  voiceName: string;
  results?: Array<{
    text: string;
    audioKey?: string;
    success: boolean;
    error?: string;
  }>;
}

export interface StorageQuotaStats {
  usedBytes: number;
  availableBytes: number;
  quotaBytes: number;
  audioCacheBytes: number;
  audioClipsCount: number;
  documentsBytes: number;
  documentsCount: number;
  systemBytes: number;
  usagePercent: number;
  largestAudioClips: Array<{
    audioKey: string;
    textSnippet: string;
    voiceName: string;
    sizeBytes: number;
    createdAt: number;
  }>;
}

export interface PronunciationOverride {
  id: string;
  term: string;
  customIpa?: string;
  phoneticReplacement: string;
  language: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TextSegmentRecord {
  id: string;
  documentId: string;
  pageIndex: number;
  paragraphIndex: number;
  sentenceIndex: number;
  rawText: string;
  normalizedText: string;
  wordCount: number;
}

