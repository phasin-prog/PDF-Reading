import { TTSVoiceInfo, WordBoundaryInfo, VoiceNarratorProfile, CadenceMode } from '../types';
import {
  evaluateVoiceQuality,
  NARRATOR_PROFILES,
} from '../utils/voiceHumanizer';
import { PodcastEQPreset } from '../utils/podcastEqualizer';
import { CADENCE_MODES } from '../utils/cadenceSettings';
import { ambienceEngine } from './ambienceService';
import { offlineAudioStorage } from './offlineAudioStorage';
import { memoryAudioCache } from './memoryAudioCache';
import { computeAudioCacheKey } from './audioCacheKey';
import { DocumentNormalizer } from './documentNormalizer';
import { AudioAlignmentEngine } from './alignmentEngine';

export interface SentenceClause {
  text: string;
  startCharIndex: number;
  length: number;
  pauseAfterMs: number;
}

export function splitSentenceIntoClauses(
  sentence: string,
  mode: CadenceMode = 'natural-audiobook'
): SentenceClause[] {
  if (!sentence || !sentence.trim()) return [];

  const raw = sentence;
  const wordCount = raw.trim().split(/\s+/).length;
  const config = CADENCE_MODES[mode] || CADENCE_MODES['natural-audiobook'];

  // If sentence is short (<16 words) and has no clause breaks, speak as a single clause
  if (wordCount < 16 && !/[,;:—\u2014]|\b(because|although|which|however|whereas|in order to|even though)\b/i.test(raw)) {
    return [
      {
        text: raw,
        startCharIndex: 0,
        length: raw.length,
        pauseAfterMs: config.clausePauseMs,
      },
    ];
  }

  const clauses: SentenceClause[] = [];
  const regex = /([,;:—\u2014]\s+|\b(?:because|although|which|however|whereas|in order to|even though)\b\s+)/gi;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    const endMatchIndex = match.index + match[1].length;
    const clauseText = raw.substring(lastIndex, endMatchIndex);

    if (clauseText.trim()) {
      const isCommaOrDash = /[,;:—\u2014]/.test(match[1]);
      const pauseMs = isCommaOrDash ? config.commaPauseMs : config.clausePauseMs;

      clauses.push({
        text: clauseText,
        startCharIndex: lastIndex,
        length: clauseText.length,
        pauseAfterMs: pauseMs,
      });
    }

    lastIndex = endMatchIndex;
  }

  if (lastIndex < raw.length) {
    const tailText = raw.substring(lastIndex);
    if (tailText.trim()) {
      clauses.push({
        text: tailText,
        startCharIndex: lastIndex,
        length: tailText.length,
        pauseAfterMs: config.clausePauseMs,
      });
    }
  }

  return clauses.length > 0
    ? clauses
    : [
        {
          text: raw,
          startCharIndex: 0,
          length: raw.length,
          pauseAfterMs: config.clausePauseMs,
        },
      ];
}

export interface TTSPlaybackCallbacks {
  onSentenceStart?: (sentenceIndex: number, text: string) => void;
  onSentenceEnd?: (sentenceIndex: number) => void;
  onWordBoundary?: (boundary: WordBoundaryInfo) => void;
  onPageEnd?: () => void;
  onError?: (error: Error) => void;
  onStateChange?: (isPlaying: boolean, isPaused: boolean) => void;
}

export function extractWordRanges(text: string): { charIndex: number; charLength: number; word: string }[] {
  const words: { charIndex: number; charLength: number; word: string }[] = [];
  if (!text) return words;

  // Use Intl.Segmenter if available for multi-language & Asian languages (Thai, Japanese, Chinese)
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'word' });
      for (const seg of segmenter.segment(text) as any[]) {
        if (seg.isWordLike || /\S/.test(seg.segment)) {
          words.push({
            charIndex: seg.index,
            charLength: seg.segment.length,
            word: seg.segment,
          });
        }
      }
      if (words.length > 0) return words;
    } catch {
      // fallback
    }
  }

  const regex = /\S+/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    words.push({
      charIndex: m.index,
      charLength: m[0].length,
      word: m[0],
    });
  }
  return words;
}

// Built-in Studio HD Neural Voices embedded directly into the system
export const BUILTIN_STUDIO_VOICES: TTSVoiceInfo[] = [
  {
    name: 'AI Studio Puck - US English Male (Studio HD)',
    lang: 'en-US',
    langName: 'English (United States)',
    isDefault: true,
    isLocal: false,
    qualityGrade: 'natural',
    isHumanized: true,
    qualityScore: 200,
    description: '🌟 เสียง AI ในระบบ: ชายสำเนียง US คมชัดระดับสตูดิโอ (Ultra-Realistic Natural HD)',
    isUSMale: true,
    gender: 'male',
    isBuiltInStudioVoice: true,
    cloudVoiceName: 'Puck',
    voice: {
      default: true,
      lang: 'en-US',
      localService: false,
      name: 'AI Studio Puck - US English Male (Studio HD)',
      voiceURI: 'builtin-cloud-puck',
    } as SpeechSynthesisVoice,
  },
  {
    name: 'AI Studio Charon - US English Male (Deep Baritone)',
    lang: 'en-US',
    langName: 'English (United States)',
    isDefault: false,
    isLocal: false,
    qualityGrade: 'natural',
    isHumanized: true,
    qualityScore: 198,
    description: '🌟 เสียง AI ในระบบ: ชายสำเนียง US โทนทุ้มลึก Baritone เหมาะกับหนังสือและปรัชญา',
    isUSMale: true,
    gender: 'male',
    isBuiltInStudioVoice: true,
    cloudVoiceName: 'Charon',
    voice: {
      default: false,
      lang: 'en-US',
      localService: false,
      name: 'AI Studio Charon - US English Male (Deep Baritone)',
      voiceURI: 'builtin-cloud-charon',
    } as SpeechSynthesisVoice,
  },
  {
    name: 'AI Studio Fenrir - US English Male (Resonant Academic)',
    lang: 'en-US',
    langName: 'English (United States)',
    isDefault: false,
    isLocal: false,
    qualityGrade: 'natural',
    isHumanized: true,
    qualityScore: 195,
    description: '🌟 เสียง AI ในระบบ: ชายสำเนียง US บรรยายวิชาการ หนักแน่น สุขุม ชัดเจน',
    isUSMale: true,
    gender: 'male',
    isBuiltInStudioVoice: true,
    cloudVoiceName: 'Fenrir',
    voice: {
      default: false,
      lang: 'en-US',
      localService: false,
      name: 'AI Studio Fenrir - US English Male (Resonant Academic)',
      voiceURI: 'builtin-cloud-fenrir',
    } as SpeechSynthesisVoice,
  },
  {
    name: 'AI Studio Zephyr - US English Male (Crisp Warm)',
    lang: 'en-US',
    langName: 'English (United States)',
    isDefault: false,
    isLocal: false,
    qualityGrade: 'natural',
    isHumanized: true,
    qualityScore: 194,
    description: '🌟 เสียง AI ในระบบ: ชายสำเนียง US อบอุ่น เป็นธรรมชาติ ฟังสบายไม่ล้าหู',
    isUSMale: true,
    gender: 'male',
    isBuiltInStudioVoice: true,
    cloudVoiceName: 'Zephyr',
    voice: {
      default: false,
      lang: 'en-US',
      localService: false,
      name: 'AI Studio Zephyr - US English Male (Crisp Warm)',
      voiceURI: 'builtin-cloud-zephyr',
    } as SpeechSynthesisVoice,
  },
  {
    name: 'AI Studio Kore - US English Female (Studio HD)',
    lang: 'en-US',
    langName: 'English (United States)',
    isDefault: false,
    isLocal: false,
    qualityGrade: 'natural',
    isHumanized: true,
    qualityScore: 190,
    description: '🌟 เสียง AI ในระบบ: หญิงสำเนียง US นุ่มนวล ชัดเจน คมชัดระดับห้องอัด',
    isUSMale: false,
    gender: 'female',
    isBuiltInStudioVoice: true,
    cloudVoiceName: 'Kore',
    voice: {
      default: false,
      lang: 'en-US',
      localService: false,
      name: 'AI Studio Kore - US English Female (Studio HD)',
      voiceURI: 'builtin-cloud-kore',
    } as SpeechSynthesisVoice,
  },
  {
    name: 'AI Studio Aoede - US English Female (Expressive)',
    lang: 'en-US',
    langName: 'English (United States)',
    isDefault: false,
    isLocal: false,
    qualityGrade: 'natural',
    isHumanized: true,
    qualityScore: 189,
    description: '🌟 เสียง AI ในระบบ: หญิงสำเนียง US ถ่ายทอดอารมณ์และจังหวะอ่านอย่างเป็นธรรมชาติ',
    isUSMale: false,
    gender: 'female',
    isBuiltInStudioVoice: true,
    cloudVoiceName: 'Aoede',
    voice: {
      default: false,
      lang: 'en-US',
      localService: false,
      name: 'AI Studio Aoede - US English Female (Expressive)',
      voiceURI: 'builtin-cloud-aoede',
    } as SpeechSynthesisVoice,
  },
];

export class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: TTSVoiceInfo[] = [];
  private isLoaded = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private sentencePauseTimer: ReturnType<typeof setTimeout> | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioProgressTimer: ReturnType<typeof setInterval> | null = null;

  // Queue of sentences for the current page
  private sentences: string[] = [];
  private currentSentenceIndex = 0;
  private isPlaying = false;
  private isPaused = false;
  private rate = 0.98;
  private pitch = 1.0;
  private volume = 1.0;
  private sentenceDelayMs = 150; // Natural human breath gap between sentences
  private currentProfile: VoiceNarratorProfile = 'standard';
  private currentCadenceMode: CadenceMode = 'natural-audiobook';
  private currentEQPreset: PodcastEQPreset = 'pro-podcast';
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private callbacks: TTSPlaybackCallbacks = {};
  private wordTimer: ReturnType<typeof setTimeout> | null = null;
  private hasReceivedNativeBoundary = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  public isSupported(): boolean {
    return this.synth !== null || typeof window !== 'undefined';
  }

  public setCallbacks(callbacks: TTSPlaybackCallbacks) {
    this.callbacks = callbacks;
  }

  public loadVoices(): TTSVoiceInfo[] {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ko': 'Korean',
      'ru': 'Russian',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'th': 'Thai',
    };

    let deviceVoices: TTSVoiceInfo[] = [];
    if (this.synth) {
      const rawVoices = this.synth.getVoices();
      deviceVoices = rawVoices.map(voice => {
        const primaryLang = (voice.lang || 'en').split(/[-_]/)[0].toLowerCase();
        const langName = languageNames[primaryLang] || voice.lang || 'English';
        const quality = evaluateVoiceQuality(voice);

        return {
          voice,
          name: voice.name || 'Default Voice',
          lang: voice.lang || 'en-US',
          langName: `${langName} (${voice.lang || 'en-US'})`,
          isDefault: voice.default,
          isLocal: Boolean(voice.localService),
          qualityGrade: quality.qualityGrade,
          isHumanized: quality.isHumanized,
          qualityScore: quality.qualityScore,
          description: quality.description,
          isUSMale: quality.isUSMale,
          gender: quality.gender,
        };
      });
    }

    // Merge Built-in System Voices at the top of the list!
    this.voices = [...BUILTIN_STUDIO_VOICES, ...deviceVoices];

    // Sort voices by quality score descending so high-clarity Natural HD voices appear first
    this.voices.sort((a, b) => b.qualityScore - a.qualityScore);

    this.isLoaded = true;
    return this.voices;
  }

  public getVoices(): TTSVoiceInfo[] {
    if (!this.isLoaded || this.voices.length === 0) {
      return this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Find best voice matching target language, strongly prioritizing
   * high-clarity Natural / Neural / Enhanced voices and top-tier US Male voices for English.
   */
  public getBestVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    const all = this.getVoices();
    if (all.length === 0) return null;

    const normalizedTarget = (langCode || 'en-US').toLowerCase().replace('_', '-');
    const primaryTarget = normalizedTarget.split('-')[0];

    // 0. Primary Default: Prioritize top-tier US Male voices for English (Guy, Christopher, Mark, Alex, Tom, David)
    if (primaryTarget === 'en') {
      const guyMatch = all.find(v => v.name.toLowerCase().includes('guy'));
      if (guyMatch) return guyMatch.voice;

      const christopherMatch = all.find(v => v.name.toLowerCase().includes('christopher'));
      if (christopherMatch) return christopherMatch.voice;

      const markMatch = all.find(v => v.name.toLowerCase().includes('mark'));
      if (markMatch) return markMatch.voice;

      const alexMatch = all.find(v => v.name.toLowerCase().includes('alex'));
      if (alexMatch) return alexMatch.voice;

      const usMaleMatch = all.find(v => v.isUSMale && v.qualityGrade !== 'standard');
      if (usMaleMatch) return usMaleMatch.voice;
    }

    // 1. Exact language matches sorted by qualityScore
    const exactMatches = all.filter(
      v => (v.lang || '').toLowerCase().replace('_', '-') === normalizedTarget
    );
    if (exactMatches.length > 0) {
      exactMatches.sort((a, b) => b.qualityScore - a.qualityScore);
      return exactMatches[0].voice;
    }

    // 2. Primary language matches sorted by qualityScore
    const primaryMatches = all.filter(
      v => (v.lang || '').toLowerCase().split(/[-_]/)[0] === primaryTarget
    );
    if (primaryMatches.length > 0) {
      primaryMatches.sort((a, b) => b.qualityScore - a.qualityScore);
      return primaryMatches[0].voice;
    }

    // 3. Fallback: strongly prefer English or German voices before arbitrary default
    const englishFallback = all.filter(v => v.lang.toLowerCase().startsWith('en'));
    if (englishFallback.length > 0) {
      englishFallback.sort((a, b) => b.qualityScore - a.qualityScore);
      return englishFallback[0].voice;
    }

    const germanFallback = all.filter(v => v.lang.toLowerCase().startsWith('de'));
    if (germanFallback.length > 0) {
      germanFallback.sort((a, b) => b.qualityScore - a.qualityScore);
      return germanFallback[0].voice;
    }

    // 4. Default voice
    const defaultVoice = all.find(v => v.isDefault);
    if (defaultVoice) return defaultVoice.voice;

    // 5. First available highest scoring voice
    return all[0]?.voice || null;
  }

  /**
   * Finds the best, clearest English voice available
   */
  public getBestEnglishVoice(): SpeechSynthesisVoice | null {
    return this.getBestVoiceForLanguage('en-US');
  }

  public setVoiceByURI(uri: string) {
    const found = this.voices.find(v => v.voice.voiceURI === uri);
    if (found) {
      this.selectedVoice = found.voice;

      // Acoustic output smoothing for Microsoft Mark: soft, warm, natural delivery
      if (found.name.toLowerCase().includes('mark')) {
        this.rate = 0.98;
        this.pitch = 0.98;
        this.volume = 0.98; // Prevent peak distortion for silky smooth output
      }

      // Immediately switch voice in real time if playing!
      if (this.isPlaying && !this.isPaused) {
        this.playCurrentSentence();
      }
    }
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  /**
   * Apply narration style profile (philosopher, narrator, lecturer, standard)
   */
  public setProfile(profileId: VoiceNarratorProfile) {
    this.currentProfile = profileId;
    const config = NARRATOR_PROFILES[profileId] || NARRATOR_PROFILES.philosopher;
    this.rate = config.rate;
    this.pitch = config.pitch;
    this.sentenceDelayMs = config.sentenceDelayMs;

    if (this.isPlaying && !this.isPaused) {
      this.playCurrentSentence();
    }
  }

  public getProfile(): VoiceNarratorProfile {
    return this.currentProfile;
  }

  public setCadenceMode(mode: CadenceMode) {
    this.currentCadenceMode = mode;
    const config = CADENCE_MODES[mode] || CADENCE_MODES['natural-audiobook'];
    if (this.isPlaying && !this.isPaused) {
      this.playCurrentSentence();
    }
  }

  public getCadenceMode(): CadenceMode {
    return this.currentCadenceMode;
  }

  public setSentenceDelay(ms: number) {
    this.sentenceDelayMs = Math.max(0, Math.min(1200, ms));
  }

  public setRate(newRate: number) {
    this.rate = Math.max(0.5, Math.min(2.5, newRate));
    // If currently speaking, restart current sentence smoothly with new rate
    if (this.isPlaying && !this.isPaused) {
      this.playCurrentSentence();
    }
  }

  public setPitch(newPitch: number) {
    this.pitch = Math.max(0.5, Math.min(1.5, newPitch));
  }

  public setVolume(newVolume: number) {
    this.volume = Math.max(0, Math.min(1, newVolume));
    if (this.currentUtterance) {
      this.currentUtterance.volume = this.volume;
    }
  }

  public loadSentences(sentences: string[], startIndex = 0) {
    this.sentences = sentences;
    this.currentSentenceIndex = Math.max(0, Math.min(startIndex, sentences.length - 1));
  }

  private clearSentencePauseTimer() {
    if (this.sentencePauseTimer) {
      clearTimeout(this.sentencePauseTimer);
      this.sentencePauseTimer = null;
    }
  }

  private stopAudioProgressTimer() {
    if (this.audioProgressTimer) {
      clearInterval(this.audioProgressTimer);
      this.audioProgressTimer = null;
    }
  }

  // Fetch or retrieve cached HD Studio Audio (Multi-Tier: RAM -> IndexedDB Offline Vault -> Gemini API)
  public async fetchStudioAudio(text: string, voiceName: string, metadata?: { docId?: string; chapterId?: string; sentenceIndex?: number }): Promise<string> {
    const cleanText = DocumentNormalizer.normalizeForTTS(text);
    const audioKey = computeAudioCacheKey({
      text: cleanText,
      voiceName,
      rate: this.rate,
      pitch: this.pitch,
      profile: this.currentProfile,
      cadenceMode: this.currentCadenceMode,
    });

    // 1. Tier 1: Fast RAM Cache (0ms)
    const memCache = memoryAudioCache.get(audioKey);
    if (memCache) return memCache;

    // 2. Tier 2: Persistent IndexedDB Offline Storage (1-2ms, works 100% OFFLINE)
    try {
      const offlineCached = await offlineAudioStorage.getAudioClip(voiceName, cleanText, {
        rate: this.rate,
        pitch: this.pitch,
      });
      if (offlineCached) {
        memoryAudioCache.set(audioKey, offlineCached);
        return offlineCached;
      }
    } catch (err) {
      console.warn('TTS: Offline vault retrieval failed', err);
    }

    // 3. Tier 3: Network API call to Gemini TTS engine
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        voiceName,
        rate: this.rate,
        pitch: this.pitch,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API returned ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.audioBase64) {
      throw new Error(data.error || 'Failed to generate speech');
    }

    const dataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;

    // 4. Save to Tier 1 RAM Cache and Tier 2 IndexedDB
    memoryAudioCache.set(audioKey, dataUrl);
    await offlineAudioStorage.storeAudioClip(voiceName, cleanText, dataUrl, {
      ...metadata,
      rate: this.rate,
      pitch: this.pitch,
    });

    return dataUrl;
  }

  // Prefetch upcoming sentences in background with high performance lookahead window
  private prefetchUpcomingSentences(currentIndex: number, voiceName: string) {
    const lookahead = [1, 2, 3, 4];
    for (const offset of lookahead) {
      const targetIdx = currentIndex + offset;
      if (targetIdx < this.sentences.length) {
        const raw = this.sentences[targetIdx];
        const text = humanizeSpeechText(raw);
        if (text && text.trim()) {
          const clean = text.trim();
          const cacheKey = `${voiceName}:${clean}`;
          if (!this.audioCache.has(cacheKey)) {
            // Check IndexedDB and fetch if needed
            offlineAudioStorage.hasAudioClip(voiceName, clean).then((hasClip) => {
              if (!hasClip) {
                this.fetchStudioAudio(clean, voiceName, { sentenceIndex: targetIdx }).catch(() => {});
              }
            });
          }
        }
      }
    }
  }

  // Pre-cache entire chapter / document sentences into Offline Storage
  public async precacheChapterSentences(
    sentences: string[],
    voiceName = 'Puck',
    onProgress?: (completed: number, total: number, currentText: string) => void
  ): Promise<{ successCount: number; failCount: number }> {
    const cleanItems = sentences
      .map((s) => humanizeSpeechText(s).trim())
      .filter((t) => t.length > 0);

    const total = cleanItems.length;
    let completed = 0;
    let successCount = 0;
    let failCount = 0;

    // Process in batches of 4 for optimal network concurrency
    const batchSize = 4;
    for (let i = 0; i < cleanItems.length; i += batchSize) {
      const chunk = cleanItems.slice(i, i + batchSize);
      await Promise.all(
        chunk.map(async (text, cIdx) => {
          try {
            await this.fetchStudioAudio(text, voiceName, { sentenceIndex: i + cIdx });
            successCount++;
          } catch (err) {
            failCount++;
          } finally {
            completed++;
            onProgress?.(completed, total, text);
          }
        })
      );
    }

    return { successCount, failCount };
  }

  // Get current offline storage statistics
  public async getOfflineCacheStats(): Promise<CacheStats> {
    return offlineAudioStorage.getCacheStats();
  }

  // Clear all offline stored audio
  public async clearOfflineCache(): Promise<void> {
    this.audioCache.clear();
    await offlineAudioStorage.clearAudioCache();
  }

  public startPlayback(sentences?: string[], startIndex = 0) {
    if (sentences) {
      this.loadSentences(sentences, startIndex);
    }

    if (this.sentences.length === 0) return;

    this.clearSentencePauseTimer();
    this.isPlaying = true;
    this.isPaused = false;
    this.startHeartbeat();
    this.notifyState();
    this.playCurrentSentence();
  }

  public pause() {
    this.clearSentencePauseTimer();
    this.isPaused = true;
    this.stopSimulatedWordTimer();
    this.stopAudioProgressTimer();

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    }
    if (this.synth) {
      this.synth.pause();
    }
    this.stopHeartbeat();
    this.notifyState();
  }

  public resume() {
    this.clearSentencePauseTimer();
    if (this.isPaused) {
      this.isPaused = false;
      this.startHeartbeat();
      if (this.currentAudioElement && this.currentAudioElement.paused) {
        this.currentAudioElement.play().catch(() => {});
      }
      if (this.synth && this.synth.paused) {
        this.synth.resume();
      }
      this.notifyState();
    } else if (!this.isPlaying) {
      this.startPlayback();
    }
  }

  public stop() {
    this.clearSentencePauseTimer();
    this.stopAudioProgressTimer();
    this.isPlaying = false;
    this.isPaused = false;
    this.stopSimulatedWordTimer();
    this.stopHeartbeat();

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
    this.notifyState();
  }

  public nextSentence(): boolean {
    this.clearSentencePauseTimer();
    this.stopAudioProgressTimer();
    if (this.currentSentenceIndex < this.sentences.length - 1) {
      this.currentSentenceIndex++;
      if (this.isPlaying) {
        this.playCurrentSentence();
      } else {
        this.callbacks.onSentenceStart?.(this.currentSentenceIndex, this.sentences[this.currentSentenceIndex]);
      }
      return true;
    } else {
      // Reached page end
      this.callbacks.onPageEnd?.();
      return false;
    }
  }

  public previousSentence(): boolean {
    this.clearSentencePauseTimer();
    this.stopAudioProgressTimer();
    if (this.currentSentenceIndex > 0) {
      this.currentSentenceIndex--;
      if (this.isPlaying) {
        this.playCurrentSentence();
      } else {
        this.callbacks.onSentenceStart?.(this.currentSentenceIndex, this.sentences[this.currentSentenceIndex]);
      }
      return true;
    }
    return false;
  }

  public jumpToSentence(index: number) {
    this.clearSentencePauseTimer();
    this.stopAudioProgressTimer();
    if (index >= 0 && index < this.sentences.length) {
      this.currentSentenceIndex = index;
      if (this.isPlaying) {
        this.playCurrentSentence();
      } else {
        this.callbacks.onSentenceStart?.(this.currentSentenceIndex, this.sentences[this.currentSentenceIndex]);
      }
    }
  }

  public getCurrentSentenceIndex(): number {
    return this.currentSentenceIndex;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  private stopSimulatedWordTimer() {
    if (this.wordTimer) {
      clearTimeout(this.wordTimer);
      this.wordTimer = null;
    }
  }

  private playCurrentSentence() {
    this.clearSentencePauseTimer();
    this.stopAudioProgressTimer();
    this.stopSimulatedWordTimer();

    // Cancel current speech / audio
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.hasReceivedNativeBoundary = false;

    if (this.currentSentenceIndex >= this.sentences.length) {
      this.isPlaying = false;
      this.stopHeartbeat();
      this.notifyState();
      this.callbacks.onPageEnd?.();
      return;
    }

    const rawSentence = this.sentences[this.currentSentenceIndex];
    if (!rawSentence || !rawSentence.trim()) {
      this.nextSentence();
      return;
    }

    const textToSpeak = humanizeSpeechText(rawSentence);
    if (!textToSpeak || !textToSpeak.trim()) {
      this.nextSentence();
      return;
    }

    const modeConfig = CADENCE_MODES[this.currentCadenceMode] || CADENCE_MODES['natural-audiobook'];
    const wordRanges = extractWordRanges(rawSentence);

    // Check if using a Built-in System Studio Voice
    const isBuiltinVoice = !this.selectedVoice || this.selectedVoice.voiceURI.startsWith('builtin-cloud-');
    const matchedBuiltin = BUILTIN_STUDIO_VOICES.find(v => v.voice.voiceURI === this.selectedVoice?.voiceURI);
    const cloudVoiceName = matchedBuiltin?.cloudVoiceName || 'Puck';

    if (isBuiltinVoice) {
      this.callbacks.onSentenceStart?.(this.currentSentenceIndex, rawSentence);
      ambienceEngine.setSpeakingState(true);

      // Trigger initial word highlight immediately
      if (wordRanges.length > 0) {
        this.callbacks.onWordBoundary?.({
          sentenceIndex: this.currentSentenceIndex,
          charIndex: wordRanges[0].charIndex,
          charLength: wordRanges[0].charLength,
          word: wordRanges[0].word,
        });
      }

      this.prefetchUpcomingSentences(this.currentSentenceIndex, cloudVoiceName);

      this.fetchStudioAudio(textToSpeak, cloudVoiceName)
        .then((audioDataUrl) => {
          if (!this.isPlaying || this.isPaused) return;

          const audio = new Audio(audioDataUrl);
          this.currentAudioElement = audio;
          audio.playbackRate = this.rate;
          audio.volume = this.volume;

          let lastWordIdx = -1;

          // Accurately map audio timeline to words in sentence
          const updateWordHighlight = () => {
            if (!audio || audio.paused || audio.ended) return;
            const duration = audio.duration || 1;
            const current = audio.currentTime;
            const progressRatio = Math.max(0, Math.min(1, current / duration));

            if (wordRanges.length > 0) {
              const targetIdx = Math.min(
                wordRanges.length - 1,
                Math.floor(progressRatio * wordRanges.length)
              );
              if (targetIdx !== lastWordIdx && wordRanges[targetIdx]) {
                lastWordIdx = targetIdx;
                this.callbacks.onWordBoundary?.({
                  sentenceIndex: this.currentSentenceIndex,
                  charIndex: wordRanges[targetIdx].charIndex,
                  charLength: wordRanges[targetIdx].charLength,
                  word: wordRanges[targetIdx].word,
                });
              }
            }
          };

          this.audioProgressTimer = setInterval(updateWordHighlight, 80);

          audio.onended = () => {
            this.stopAudioProgressTimer();
            ambienceEngine.setSpeakingState(false);
            this.callbacks.onSentenceEnd?.(this.currentSentenceIndex);

            if (this.isPlaying && !this.isPaused) {
              const isParagraphEnd = /\n\s*$/.test(rawSentence) || this.currentSentenceIndex === this.sentences.length - 1;
              const pauseMs = calculatePunctuationPause(rawSentence, isParagraphEnd, modeConfig, this.sentenceDelayMs);
              const totalPause = pauseMs + modeConfig.shadowingDelayMs;

              if (totalPause > 0) {
                this.sentencePauseTimer = setTimeout(() => {
                  if (this.isPlaying && !this.isPaused) {
                    this.nextSentence();
                  }
                }, totalPause);
              } else {
                this.nextSentence();
              }
            }
          };

          audio.onerror = (err) => {
            console.warn('Audio playback error, falling back to Web Speech:', err);
            this.stopAudioProgressTimer();
            this.playFallbackWebSpeech(rawSentence, textToSpeak, wordRanges, modeConfig);
          };

          audio.play().catch((err) => {
            console.warn('Auto-play audio failed, falling back:', err);
            this.playFallbackWebSpeech(rawSentence, textToSpeak, wordRanges, modeConfig);
          });
        })
        .catch((err) => {
          console.warn('Studio TTS fetch failed, fallback to local synth:', err);
          this.playFallbackWebSpeech(rawSentence, textToSpeak, wordRanges, modeConfig);
        });

      return;
    }

    // Default Web Speech Synthesizer fallback
    this.playFallbackWebSpeech(rawSentence, textToSpeak, wordRanges, modeConfig);
  }

  private playFallbackWebSpeech(
    rawSentence: string,
    textToSpeak: string,
    wordRanges: { charIndex: number; charLength: number; word: string }[],
    modeConfig: any
  ) {
    if (!this.synth) return;

    const clauses = splitSentenceIntoClauses(rawSentence, this.currentCadenceMode);
    let clauseIdx = 0;

    const playNextClause = () => {
      if (!this.isPlaying || this.isPaused) return;

      if (clauseIdx >= clauses.length) {
        this.callbacks.onSentenceEnd?.(this.currentSentenceIndex);
        if (this.isPlaying && !this.isPaused) {
          const isParagraphEnd = /\n\s*$/.test(rawSentence) || this.currentSentenceIndex === this.sentences.length - 1;
          const pauseMs = calculatePunctuationPause(rawSentence, isParagraphEnd, modeConfig, this.sentenceDelayMs);
          const totalPause = pauseMs + modeConfig.shadowingDelayMs;

          if (totalPause > 0) {
            this.sentencePauseTimer = setTimeout(() => {
              if (this.isPlaying && !this.isPaused) {
                this.nextSentence();
              }
            }, totalPause);
          } else {
            this.nextSentence();
          }
        }
        return;
      }

      const clause = clauses[clauseIdx];
      const clauseTextToSpeak = humanizeSpeechText(clause.text);

      if (!clauseTextToSpeak.trim()) {
        clauseIdx++;
        playNextClause();
        return;
      }

      const dynamicParams = calculateDynamicSentenceUtterance(
        clause.text,
        this.rate * modeConfig.rateMultiplier,
        this.pitch,
        this.volume
      );

      const eqConfig = PODCAST_EQ_PRESETS[this.currentEQPreset] || PODCAST_EQ_PRESETS['pro-podcast'];

      const utterance = new SpeechSynthesisUtterance(clauseTextToSpeak);
      if (this.selectedVoice && !this.selectedVoice.voiceURI.startsWith('builtin-cloud-')) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang;
      }
      utterance.rate = dynamicParams.rate;
      utterance.pitch = Math.max(0.5, Math.min(2.0, dynamicParams.pitch * eqConfig.pitchFormantShift));
      utterance.volume = Math.max(0.1, Math.min(1.0, dynamicParams.volume * eqConfig.volumePeakCap));

      utterance.onstart = () => {
        ambienceEngine.setSpeakingState(true);
        if (clauseIdx === 0) {
          this.callbacks.onSentenceStart?.(this.currentSentenceIndex, rawSentence);
        }

        const clauseFirstWordRange = wordRanges.find((w) => w.charIndex >= clause.startCharIndex);
        if (clauseFirstWordRange) {
          this.callbacks.onWordBoundary?.({
            sentenceIndex: this.currentSentenceIndex,
            charIndex: clauseFirstWordRange.charIndex,
            charLength: clauseFirstWordRange.charLength,
            word: clauseFirstWordRange.word,
          });
        }
      };

      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === 'word' || !e.name) {
          this.hasReceivedNativeBoundary = true;
          this.stopSimulatedWordTimer();

          const absCharIndex = clause.startCharIndex + e.charIndex;

          let matchedItem = wordRanges.find(
            (w) => absCharIndex >= w.charIndex && absCharIndex < w.charIndex + w.charLength + 2
          );
          if (!matchedItem) {
            matchedItem = wordRanges.find((w) => w.charIndex >= absCharIndex);
          }

          const targetCharIndex = matchedItem ? matchedItem.charIndex : absCharIndex;
          const targetCharLength = matchedItem ? matchedItem.charLength : (e as any).charLength || 1;
          const targetWord = matchedItem
            ? matchedItem.word
            : rawSentence.substring(targetCharIndex, targetCharIndex + targetCharLength);

          this.callbacks.onWordBoundary?.({
            sentenceIndex: this.currentSentenceIndex,
            charIndex: targetCharIndex,
            charLength: targetCharLength,
            word: targetWord,
          });
        }
      };

      utterance.onend = () => {
        ambienceEngine.setSpeakingState(false);
        this.stopSimulatedWordTimer();
        clauseIdx++;
        if (clauseIdx < clauses.length) {
          const pause = Math.max(80, clause.pauseAfterMs);
          this.sentencePauseTimer = setTimeout(() => {
            if (this.isPlaying && !this.isPaused) {
              playNextClause();
            }
          }, pause);
        } else {
          playNextClause();
        }
      };

      utterance.onerror = (e) => {
        this.stopSimulatedWordTimer();
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('TTS Speech error:', e);
          this.callbacks.onError?.(new Error(`Speech error: ${e.error}`));
        }
      };

      this.currentUtterance = utterance;
      if (this.synth) {
        this.synth.speak(utterance);
      }
    };

    playNextClause();
  }

  private notifyState() {
    this.callbacks.onStateChange?.(this.isPlaying, this.isPaused);
  }

  /**
   * Chromium bug workaround: speech synthesis can freeze or go idle on long documents.
   * Periodically pausing and resuming keeps the internal audio context alive.
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.synth && this.isPlaying && !this.isPaused) {
        if (this.synth.speaking && !this.synth.paused) {
          this.synth.pause();
          this.synth.resume();
        }
      }
    }, 12000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public setEQPreset(preset: PodcastEQPreset) {
    this.currentEQPreset = preset;
  }

  public getEQPreset(): PodcastEQPreset {
    return this.currentEQPreset;
  }

  /**
   * Preview a voice with a short philosophical quote from Carl Jung or clean greeting
   */
  public previewVoice(voice: SpeechSynthesisVoice) {
    let sampleText = `Hello! I am ready to read your offline documents.`;

    if (voice.lang.toLowerCase().startsWith('en')) {
      sampleText = `Who looks outside, dreams; who looks inside, awakes. Carl Gustav Jung, Archetypes of the Collective Unconscious.`;
    } else if (voice.lang.toLowerCase().startsWith('th')) {
      sampleText = `สวัสดีครับ ระบบพร้อมอ่านหนังสือและเอกสารด้วยเสียงที่เป็นธรรมชาติครับ`;
    } else if (voice.lang.toLowerCase().startsWith('es')) {
      sampleText = `Hola, esta es una prueba de voz para lectura de libros y documentos.`;
    } else if (voice.lang.toLowerCase().startsWith('fr')) {
      sampleText = `Bonjour, ceci est un test vocal pour la lecture de vos livres et documents.`;
    } else if (voice.lang.toLowerCase().startsWith('de')) {
      sampleText = `Hallo, dies ist eine Hörprobe zum Vorlesen Ihrer Bücher und Dokumente.`;
    } else if (voice.lang.toLowerCase().startsWith('ja')) {
      sampleText = `こんにちは。これは書籍やドキュメントを読み上げるための音声サンプルです。`;
    }

    if (voice.voiceURI.startsWith('builtin-cloud-')) {
      const matched = BUILTIN_STUDIO_VOICES.find(v => v.voice.voiceURI === voice.voiceURI);
      const voiceName = matched?.cloudVoiceName || 'Puck';

      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
      }
      if (this.synth) {
        this.synth.cancel();
      }

      this.fetchStudioAudio(sampleText, voiceName)
        .then((url) => {
          const audio = new Audio(url);
          this.currentAudioElement = audio;
          audio.playbackRate = this.rate;
          audio.volume = this.volume;
          audio.play().catch(() => {});
        })
        .catch(() => {
          if (this.synth) {
            const testUtterance = new SpeechSynthesisUtterance(sampleText);
            testUtterance.rate = this.rate;
            testUtterance.pitch = this.pitch;
            this.synth.speak(testUtterance);
          }
        });
      return;
    }

    if (!this.synth) return;
    this.synth.cancel();

    const testUtterance = new SpeechSynthesisUtterance(sampleText);
    testUtterance.voice = voice;
    testUtterance.rate = this.rate;
    testUtterance.pitch = this.pitch;
    testUtterance.onend = () => {};
    this.synth.speak(testUtterance);
  }

  /**
   * Speak a specific custom sentence directly for auditioning with end callback
   */
  public async speakSentenceDirect(text: string, voice: SpeechSynthesisVoice, onEnd?: () => void) {
    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    if (voice.voiceURI.startsWith('builtin-cloud-')) {
      const matched = BUILTIN_STUDIO_VOICES.find((v) => v.voice.voiceURI === voice.voiceURI);
      const voiceName = matched?.cloudVoiceName || 'Puck';

      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
      }
      if (this.synth) {
        this.synth.cancel();
      }

      try {
        const url = await this.fetchStudioAudio(text, voiceName);
        const audio = new Audio(url);
        this.currentAudioElement = audio;
        audio.playbackRate = this.rate;
        audio.volume = this.volume;
        audio.onended = () => {
          onEnd?.();
        };
        audio.onerror = () => {
          onEnd?.();
        };
        await audio.play();
      } catch {
        if (this.synth) {
          const testUtterance = new SpeechSynthesisUtterance(text);
          testUtterance.rate = this.rate;
          testUtterance.pitch = this.pitch;
          testUtterance.onend = () => onEnd?.();
          testUtterance.onerror = () => onEnd?.();
          this.synth.speak(testUtterance);
        } else {
          onEnd?.();
        }
      }
      return;
    }

    if (!this.synth) {
      onEnd?.();
      return;
    }

    this.synth.cancel();
    const testUtterance = new SpeechSynthesisUtterance(text);
    testUtterance.voice = voice;
    testUtterance.rate = this.rate;
    testUtterance.pitch = this.pitch;
    testUtterance.onend = () => onEnd?.();
    testUtterance.onerror = () => onEnd?.();
    this.synth.speak(testUtterance);
  }
}

export const ttsEngine = new TTSEngine();
