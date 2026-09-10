import { TTSVoiceInfo, WordBoundaryInfo, VoiceNarratorProfile, CadenceMode } from '../types';
import {
  evaluateVoiceQuality,
  NARRATOR_PROFILES,
  humanizeSpeechText,
  calculateDynamicSentenceUtterance,
} from '../utils/voiceHumanizer';
import { PodcastEQPreset, PODCAST_EQ_PRESETS } from '../utils/podcastEqualizer';
import { CADENCE_MODES, calculatePunctuationPause } from '../utils/cadenceSettings';
import { ambienceEngine } from './ambienceService';
import { offlineAudioStorage, CacheStats } from './offlineAudioStorage';
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
      // Punctuation-only fragment (",", ":") gets NO utterance of its own —
      // fold a single capped pause into the previous clause instead. Each
      // stray utterance costs ~200ms startup + its pause, which reads as a crawl.
      if (/^[,;:\s—–-]+$/.test(clauseText)) {
        const prev = clauses[clauses.length - 1];
        if (prev) {
          prev.pauseAfterMs = Math.min(400, prev.pauseAfterMs + 120);
        }
      } else {
        const isCommaOrDash = /[,;:—\u2014]/.test(match[1]);
        const pauseMs = isCommaOrDash ? config.commaPauseMs : config.clausePauseMs;

        clauses.push({
          text: clauseText,
          startCharIndex: lastIndex,
          length: clauseText.length,
          pauseAfterMs: pauseMs,
        });
      }
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
  /** Document language used to pick a local fallback voice when the selected voice is cloud. */
  private targetLang = 'en-US';

  /**
   * Generation token — bumped on every stop/seek/restart. All async continuations
   * (fetch, audio events, pause timers, utterance events) capture the token and
   * no-op when stale, so Stop is instant and taps never double-speak.
   */
  private generation = 0;

  /** Local voice pack: prebuilt per-sentence word ranges + weights for instant seek & highlight. */
  private pack: Array<{ ranges: { charIndex: number; charLength: number; word: string }[]; totalWeight: number }> = [];
  private interpTimer: ReturnType<typeof setInterval> | null = null;
  private interpBaseIdx = 0;
  private interpBaseAt = 0; // performance.now() at base index

  public setTargetLang(lang: string) {
    if (lang) this.targetLang = lang;
  }

  // Pro Podcast mastering chain (WebAudio) — applied to real TTS <audio>
  private masteringCtx: AudioContext | null = null;
  private masteringNodes: {
    highpass: BiquadFilterNode;
    warm: BiquadFilterNode;
    presence: BiquadFilterNode;
    air: BiquadFilterNode;
    compressor: DynamicsCompressorNode;
    master: GainNode;
  } | null = null;
  private masteringSource: MediaElementAudioSourceNode | null = null;

  private ensureMasteringChain(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      if (!this.masteringCtx) {
        this.masteringCtx = new AudioCtx();
      }
      if (this.masteringCtx.state === 'suspended') {
        this.masteringCtx.resume().catch(() => {});
      }
      const eqConfig = PODCAST_EQ_PRESETS[this.currentEQPreset] || PODCAST_EQ_PRESETS['pro-podcast'];
      if (!this.masteringNodes) {
        const ctx = this.masteringCtx;
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 80;
        const warm = ctx.createBiquadFilter();
        warm.type = 'peaking';
        warm.frequency.value = 250;
        warm.Q.value = 1.2;
        const presence = ctx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.value = 3500;
        presence.Q.value = 1.5;
        const air = ctx.createBiquadFilter();
        air.type = 'highshelf';
        air.frequency.value = 11000;
        const compressor = ctx.createDynamicsCompressor();
        const master = ctx.createGain();
        master.gain.value = 1.0;
        highpass.connect(warm);
        warm.connect(presence);
        presence.connect(air);
        air.connect(compressor);
        compressor.connect(master);
        master.connect(ctx.destination);
        this.masteringNodes = { highpass, warm, presence, air, compressor, master };
      }
      // Live-update gains from preset (so switching EQ is audible instantly)
      const n = this.masteringNodes;
      n.warm.gain.value = eqConfig.bands[1]?.gain ?? 0;
      n.presence.gain.value = eqConfig.bands[3]?.gain ?? 0;
      n.air.gain.value = eqConfig.bands[4]?.gain ?? 0;
      n.compressor.threshold.value = eqConfig.compression.thresholdDb;
      n.compressor.knee.value = eqConfig.compression.kneeDb;
      n.compressor.ratio.value = parseFloat(eqConfig.compression.ratio.split(':')[0]) || 2.5;
      n.compressor.attack.value = eqConfig.compression.attackMs / 1000;
      n.compressor.release.value = eqConfig.compression.releaseMs / 1000;
      return true;
    } catch {
      return false;
    }
  }

  private attachMastering(audio: HTMLAudioElement): void {
    try {
      if (!this.ensureMasteringChain() || !this.masteringCtx || !this.masteringNodes) return;
      // One MediaElementSource per element; reconnect new element to shared chain
      if (this.masteringSource) {
        try { this.masteringSource.disconnect(); } catch {}
        this.masteringSource = null;
      }
      this.masteringSource = this.masteringCtx.createMediaElementSource(audio);
      this.masteringSource.connect(this.masteringNodes.highpass);
    } catch {
      // Fallback to plain <audio> playback
    }
  }

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

  // ---- Zero-API local-first mode ----
  private cloudAvailable = false;

  /** Set from /api/health at startup. Cloud voices are only offered when true. */
  public setCloudAvailable(available: boolean) {
    this.cloudAvailable = available;
  }

  public isCloudAvailable(): boolean {
    return this.cloudAvailable;
  }

  public static isCloudVoiceURI(uri: string | null | undefined): boolean {
    return !!uri && uri.startsWith('builtin-cloud-');
  }

  /**
   * Best ON-DEVICE voice for a language. Never returns a cloud voice, so it
   * always works with zero API key and fully offline. Prefers local +
   * high-quality (natural/enhanced) voices.
   */
  public getBestLocalVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    const all = this.getVoices().filter((v) => !v.isBuiltInStudioVoice);
    if (all.length === 0) return null;

    const normalizedTarget = (langCode || 'en-US').toLowerCase().replace('_', '-');
    const primaryTarget = normalizedTarget.split('-')[0];

    const byQuality = (list: TTSVoiceInfo[]) =>
      [...list].sort((a, b) =>
        Number(b.isLocal) - Number(a.isLocal) || b.qualityScore - a.qualityScore
      )[0]?.voice || null;

    const exact = all.filter((v) => (v.lang || '').toLowerCase().replace('_', '-') === normalizedTarget);
    if (exact.length > 0) return byQuality(exact);

    const primary = all.filter((v) => (v.lang || '').toLowerCase().split(/[-_]/)[0] === primaryTarget);
    if (primary.length > 0) return byQuality(primary);

    const english = all.filter((v) => v.lang.toLowerCase().startsWith('en'));
    if (english.length > 0) return byQuality(english);

    return byQuality(all);
  }

  /**
   * Out-of-the-box tuning per language — no user fiddling required.
   * Thai needs a slightly slower rate for intelligibility; tonal pitch stays flat.
   */
  public static getTunedDefaults(langCode: string): { rate: number; pitch: number; sentenceDelayMs: number } {
    const primary = (langCode || 'en-US').split(/[-_]/)[0].toLowerCase();
    switch (primary) {
      case 'th':
        return { rate: 0.95, pitch: 1.0, sentenceDelayMs: 200 };
      case 'de':
        return { rate: 0.96, pitch: 0.99, sentenceDelayMs: 180 };
      case 'ja':
      case 'zh':
      case 'ko':
        return { rate: 0.95, pitch: 1.0, sentenceDelayMs: 200 };
      default:
        return { rate: 0.98, pitch: 1.0, sentenceDelayMs: 150 };
    }
  }

  /**
   * Resolves once device voices are actually loaded. Chrome/Edge deliver them
   * asynchronously via voiceschanged; without this the first Play press can be silent.
   */
  public ensureVoicesLoaded(timeoutMs = 4000): Promise<TTSVoiceInfo[]> {
    const current = this.getVoices().filter((v) => !v.isBuiltInStudioVoice);
    if (current.length > 0) return Promise.resolve(this.getVoices());
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve(this.getVoices());
      };
      const timer = setTimeout(() => {
        this.loadVoices();
        finish();
        clearTimeout(timer);
      }, timeoutMs);
      try {
        if (this.synth) {
          this.synth.onvoiceschanged = () => {
            this.loadVoices();
            finish();
            clearTimeout(timer);
          };
          // Nudge some Chromium builds to populate the voice list
          this.synth.getVoices();
        } else {
          finish();
        }
      } catch {
        finish();
      }
    });
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

  public getRate(): number {
    return this.rate;
  }

  public getPitch(): number {
    return this.pitch;
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
    // Prebuild the local voice pack: word ranges + weights per sentence.
    // Zero network, pure computation — seeking to any sentence is instant.
    this.pack = sentences.map((s) => {
      const ranges = extractWordRanges(s);
      const totalWeight = ranges.reduce((sum, w) => sum + Math.max(1, w.word.length), 0) || 1;
      return { ranges, totalWeight };
    });
  }

  /** Per-word millisecond estimate at current rate (~14 chars/sec at 1.0×). */
  private wordMsPerWeight(): number {
    return 1000 / (14 * Math.max(0.5, this.rate));
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

  public isOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
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
    // NOTE: must use the same full key (rate/pitch/profile/cadence) as RAM cache, else offline hits miss.
    try {
      const offlineCached = await offlineAudioStorage.getAudioClip(voiceName, cleanText, {
        rate: this.rate,
        pitch: this.pitch,
        profile: this.currentProfile,
        cadenceMode: this.currentCadenceMode,
      });
      if (offlineCached) {
        memoryAudioCache.set(audioKey, offlineCached);
        return offlineCached;
      }
    } catch (err) {
      console.warn('TTS: Offline vault retrieval failed', err);
    }

    // 3. Offline-first: never hit network when browser reports offline.
    // Cached audio above still plays 100% offline; uncached falls back to local WebSpeech.
    if (!this.isOnline()) {
      throw new Error('Offline: audio not cached, using local voice');
    }

    // 4. Tier 3: Network API call to Gemini TTS engine (60s timeout + 1 retry)
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      try {
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
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`TTS API returned ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.audioBase64) {
          throw new Error(data.error || 'Failed to generate speech');
        }

        // Validate payload before caching: non-empty base64, sane size (<15MB decoded)
        const approxBytes = Math.round((data.audioBase64.length * 3) / 4);
        if (approxBytes < 100 || approxBytes > 15 * 1024 * 1024) {
          throw new Error(`Invalid TTS audio payload (${approxBytes} bytes)`);
        }

        const dataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;

        // 5. Save to Tier 1 RAM Cache and Tier 2 IndexedDB
        memoryAudioCache.set(audioKey, dataUrl);
        await offlineAudioStorage.storeAudioClip(voiceName, cleanText, dataUrl, {
          ...metadata,
          rate: this.rate,
          pitch: this.pitch,
          profile: this.currentProfile,
          cadenceMode: this.currentCadenceMode,
        });

        return dataUrl;
      } catch (err) {
        clearTimeout(timeout);
        lastErr = err;
        // Don't retry aborts caused by stop/seek — fail over to local voice immediately
        if (err instanceof DOMException && err.name === 'AbortError') break;
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Failed to generate speech');
  }

  // Prefetch upcoming sentences in background with high performance lookahead window
  // Offline-first: skip network prefetch entirely when offline (cache checks are cheap, fetches are not)
  private prefetchUpcomingSentences(currentIndex: number, voiceName: string) {
    try {
      if (!this.isOnline()) return;
      const lookahead = [1, 2, 3, 4];
      for (const offset of lookahead) {
        const targetIdx = currentIndex + offset;
        if (targetIdx < this.sentences.length) {
          const raw = this.sentences[targetIdx];
          const text = humanizeSpeechText(raw);
          if (text && text.trim()) {
            const clean = text.trim();
            const audioKey = computeAudioCacheKey({
              text: clean,
              voiceName,
              rate: this.rate,
              pitch: this.pitch,
              profile: this.currentProfile,
              cadenceMode: this.currentCadenceMode,
            });
            if (!memoryAudioCache.has(audioKey)) {
              // Check IndexedDB and fetch if needed (same full key or offline hits miss)
              offlineAudioStorage.hasAudioClip(voiceName, clean, {
                rate: this.rate,
                pitch: this.pitch,
                profile: this.currentProfile,
                cadenceMode: this.currentCadenceMode,
              }).then((hasClip) => {
                if (!hasClip) {
                  this.fetchStudioAudio(clean, voiceName, { sentenceIndex: targetIdx }).catch(() => {});
                }
              }).catch(() => {});
            }
          }
        }
      }
    } catch {
      // Prefetch must never crash playback
    }
  }

  // Pre-cache entire chapter / document sentences into Offline Storage
  // Chunked (4 concurrent) + cancellable. Check cancelPrecache() from UI to abort long books.
  private precacheCancelled = false;

  public cancelPrecache(): void {
    this.precacheCancelled = true;
  }

  public async precacheChapterSentences(
    sentences: string[],
    voiceName = 'Puck',
    onProgress?: (completed: number, total: number, currentText: string) => void
  ): Promise<{ successCount: number; failCount: number; cancelled: boolean }> {
    const cleanItems = sentences
      .map((s) => humanizeSpeechText(s).trim())
      .filter((t) => t.length > 0);

    const total = cleanItems.length;
    let completed = 0;
    let successCount = 0;
    let failCount = 0;
    this.precacheCancelled = false;

    // Offline-first: precaching needs network by definition (unless already cached)
    if (!this.isOnline()) {
      // Still warm RAM from IndexedDB for already-cached items
      for (let i = 0; i < cleanItems.length; i++) {
        if (this.precacheCancelled) break;
        try {
          await this.fetchStudioAudio(cleanItems[i], voiceName, { sentenceIndex: i });
          successCount++;
        } catch {
          failCount++;
        } finally {
          completed++;
          onProgress?.(completed, total, cleanItems[i]);
        }
      }
      return { successCount, failCount, cancelled: this.precacheCancelled };
    }

    // Process in batches of 4 for optimal network concurrency
    const batchSize = 4;
    for (let i = 0; i < cleanItems.length; i += batchSize) {
      if (this.precacheCancelled) break;
      const chunk = cleanItems.slice(i, i + batchSize);
      await Promise.all(
        chunk.map(async (text, cIdx) => {
          if (this.precacheCancelled) return;
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

    return { successCount, failCount, cancelled: this.precacheCancelled };
  }

  // Get current offline storage statistics
  public async getOfflineCacheStats(): Promise<CacheStats> {
    return offlineAudioStorage.getCacheStats();
  }

  // Clear all offline stored audio
  public async clearOfflineCache(): Promise<void> {
    memoryAudioCache.clear();
    await offlineAudioStorage.clearAudioCache();
  }

  private stopInterpTimer() {
    if (this.interpTimer) {
      clearInterval(this.interpTimer);
      this.interpTimer = null;
    }
  }

  public startPlayback(sentences?: string[], startIndex = 0) {
    if (sentences) {
      this.loadSentences(sentences, startIndex);
    }

    if (this.sentences.length === 0) return;

    this.generation++;
    this.clearSentencePauseTimer();
    this.stopInterpTimer();
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
    // Instant stop: invalidate every in-flight continuation first, then silence.
    this.generation++;
    this.clearSentencePauseTimer();
    this.stopAudioProgressTimer();
    this.stopInterpTimer();
    this.isPlaying = false;
    this.isPaused = false;
    this.stopSimulatedWordTimer();
    this.stopHeartbeat();

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.onended = null;
        this.currentAudioElement.onerror = null;
      } catch {}
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
    this.stopInterpTimer();
    if (this.currentSentenceIndex < this.sentences.length - 1) {
      this.generation++;
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
    this.stopInterpTimer();
    if (this.currentSentenceIndex > 0) {
      this.generation++;
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
    this.stopInterpTimer();
    if (index >= 0 && index < this.sentences.length) {
      this.generation++;
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
    this.stopInterpTimer();

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
    // Word ranges come from the prebuilt local pack (same ranges every seek — no recompute)
    const packEntry = this.pack[this.currentSentenceIndex];
    const wordRanges = packEntry?.ranges || extractWordRanges(rawSentence);

    // Check if using a Built-in System Studio Voice
    const isBuiltinVoice = !this.selectedVoice || this.selectedVoice.voiceURI.startsWith('builtin-cloud-');
    const matchedBuiltin = BUILTIN_STUDIO_VOICES.find(v => v.voice.voiceURI === this.selectedVoice?.voiceURI);
    const cloudVoiceName = matchedBuiltin?.cloudVoiceName || 'Puck';

    // Zero-API fast path: cloud selected but no backend key — skip the doomed
    // network round-trip and synthesize locally immediately.
    if (isBuiltinVoice && !this.cloudAvailable) {
      this.playFallbackWebSpeech(rawSentence, textToSpeak, wordRanges, modeConfig);
      return;
    }

    if (isBuiltinVoice) {
      ambienceEngine.setSpeakingState(true);
      this.prefetchUpcomingSentences(this.currentSentenceIndex, cloudVoiceName);

      const gen = this.generation;
      const sentenceIdx = this.currentSentenceIndex;
      // Fires when audio ACTUALLY starts — never highlight during fetch latency
      let started = false;
      const fireSentenceStart = () => {
        if (started || gen !== this.generation) return;
        started = true;
        this.callbacks.onSentenceStart?.(sentenceIdx, rawSentence);
        if (wordRanges.length > 0) {
          this.callbacks.onWordBoundary?.({
            sentenceIndex: sentenceIdx,
            charIndex: wordRanges[0].charIndex,
            charLength: wordRanges[0].charLength,
            word: wordRanges[0].word,
          });
        }
      };
      this.fetchStudioAudio(textToSpeak, cloudVoiceName)
        .then((audioDataUrl) => {
          if (gen !== this.generation || !this.isPlaying || this.isPaused) return;

          const audio = new Audio(audioDataUrl);
          this.currentAudioElement = audio;
          audio.playbackRate = this.rate;
          audio.volume = this.volume;
          this.attachMastering(audio);

          let lastWordIdx = -1;
          // Weight words by length PLUS punctuation pauses (commas/breaths take
          // real time in speech) so highlight tracks natural speech, not linear steps
          const wordWeights = wordRanges.map((w) => {
            let weight = Math.max(1, w.word.length);
            if (/[,;:—–-]$/.test(w.word)) weight += 3;
            if (/[.?!…]$/.test(w.word)) weight += 6;
            return weight;
          });
          const totalWeight = wordWeights.reduce((s, w) => s + w, 0) || 1;

          // Accurately map audio timeline to words in sentence
          const updateWordHighlight = () => {
            if (gen !== this.generation) return;
            if (!audio || audio.paused || audio.ended) return;
            const duration = audio.duration || 1;
            const current = audio.currentTime;
            const progressRatio = Math.max(0, Math.min(1, current / duration));

            if (wordRanges.length > 0) {
              const targetWeight = progressRatio * totalWeight;
              let acc = 0;
              let targetIdx = 0;
              for (let i = 0; i < wordRanges.length; i++) {
                acc += wordWeights[i];
                if (acc >= targetWeight) { targetIdx = i; break; }
                targetIdx = i;
              }
              if (targetIdx !== lastWordIdx && wordRanges[targetIdx]) {
                lastWordIdx = targetIdx;
                this.callbacks.onWordBoundary?.({
                  sentenceIndex: sentenceIdx,
                  charIndex: wordRanges[targetIdx].charIndex,
                  charLength: wordRanges[targetIdx].charLength,
                  word: wordRanges[targetIdx].word,
                });
              }
            }
          };

          this.audioProgressTimer = setInterval(updateWordHighlight, 80);

          audio.onended = () => {
            if (gen !== this.generation) return;
            this.stopAudioProgressTimer();
            ambienceEngine.setSpeakingState(false);
            this.callbacks.onSentenceEnd?.(sentenceIdx);

            if (this.isPlaying && !this.isPaused) {
              const isParagraphEnd = /\n\s*$/.test(rawSentence) || sentenceIdx === this.sentences.length - 1;
              const pauseMs = calculatePunctuationPause(rawSentence, isParagraphEnd, modeConfig, this.sentenceDelayMs);
              const totalPause = pauseMs + modeConfig.shadowingDelayMs;

              if (totalPause > 0) {
                this.sentencePauseTimer = setTimeout(() => {
                  if (gen !== this.generation) return;
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
            if (gen !== this.generation) return;
            console.warn('Audio playback error, falling back to Web Speech:', err);
            this.stopAudioProgressTimer();
            this.playFallbackWebSpeech(rawSentence, textToSpeak, wordRanges, modeConfig);
          };

          // Soft fade-in (60ms) to remove clicks + human breath feel
          try {
            audio.volume = 0;
            audio.play().then(() => {
              if (gen !== this.generation) return;
              fireSentenceStart();
              const steps = 6;
              let s = 0;
              const fade = setInterval(() => {
                if (gen !== this.generation) {
                  clearInterval(fade);
                  return;
                }
                s++;
                audio.volume = Math.min(this.volume, (this.volume * s) / steps);
                if (s >= steps) clearInterval(fade);
              }, 10);
            }).catch((err) => {
              if (gen !== this.generation) return;
              console.warn('Auto-play audio failed, falling back:', err);
              this.playFallbackWebSpeech(rawSentence, textToSpeak, wordRanges, modeConfig);
            });
          } catch {
            audio.play().catch((err) => {
              if (gen !== this.generation) return;
              console.warn('Auto-play audio failed, falling back:', err);
              this.playFallbackWebSpeech(rawSentence, textToSpeak, wordRanges, modeConfig);
            });
          }
        })
        .catch((err) => {
          if (gen !== this.generation) return;
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
    const gen = this.generation;
    const sentenceIdx = this.currentSentenceIndex;
    if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
      console.warn('TTS: Web Speech unavailable, skipping to next sentence');
      this.callbacks.onError?.(new Error('Web Speech synthesis unavailable in this browser'));
      this.callbacks.onSentenceEnd?.(sentenceIdx);
      if (this.isPlaying && !this.isPaused) {
        this.sentencePauseTimer = setTimeout(() => {
          if (gen !== this.generation) return;
          if (this.isPlaying && !this.isPaused) this.nextSentence();
        }, 300);
      }
      return;
    }

    const clauses = splitSentenceIntoClauses(rawSentence, this.currentCadenceMode);
    let clauseIdx = 0;
    let interpLastEmitted = -1;

    // Highlight interpolation: advances the highlight by estimated word timing
    // between native boundary events, so highlighting stays glued to speech even
    // on browsers that never fire onboundary (e.g. Firefox) or fire sparsely.
    const emitWord = (idx: number) => {
      if (idx === interpLastEmitted) return;
      const w = wordRanges[idx];
      if (!w) return;
      interpLastEmitted = idx;
      this.callbacks.onWordBoundary?.({
        sentenceIndex: sentenceIdx,
        charIndex: w.charIndex,
        charLength: w.charLength,
        word: w.word,
      });
    };
    const startInterp = (fromWordIdx: number) => {
      this.stopInterpTimer();
      interpLastEmitted = fromWordIdx - 1;
      this.interpBaseIdx = fromWordIdx;
      this.interpBaseAt = performance.now();
      emitWord(fromWordIdx);
      const msPerWeight = this.wordMsPerWeight();
      this.interpTimer = setInterval(() => {
        if (gen !== this.generation) {
          this.stopInterpTimer();
          return;
        }
        if (!this.isPlaying || this.isPaused) {
          // Freeze estimation while paused so resume continues in sync
          this.interpBaseAt = performance.now();
          return;
        }
        const elapsed = performance.now() - this.interpBaseAt;
        let acc = 0;
        let target = this.interpBaseIdx;
        for (let i = this.interpBaseIdx; i < wordRanges.length; i++) {
          let wWeight = Math.max(1, wordRanges[i].word.length);
          if (/[,;:—–-]$/.test(wordRanges[i].word)) wWeight += 3;
          if (/[.?!…]$/.test(wordRanges[i].word)) wWeight += 6;
          acc += wWeight * msPerWeight;
          if (acc > elapsed) break;
          target = i + 1;
        }
        if (target >= wordRanges.length) {
          this.stopInterpTimer();
          return;
        }
        emitWord(target);
      }, 60);
    };

    const playNextClause = () => {
      if (gen !== this.generation) return;
      if (!this.isPlaying || this.isPaused) return;

      if (clauseIdx >= clauses.length) {
        this.stopInterpTimer();
        this.callbacks.onSentenceEnd?.(sentenceIdx);
        if (this.isPlaying && !this.isPaused) {
          const isParagraphEnd = /\n\s*$/.test(rawSentence) || sentenceIdx === this.sentences.length - 1;
          const pauseMs = calculatePunctuationPause(rawSentence, isParagraphEnd, modeConfig, this.sentenceDelayMs);
          const totalPause = pauseMs + modeConfig.shadowingDelayMs;

          if (totalPause > 0) {
            this.sentencePauseTimer = setTimeout(() => {
              if (gen !== this.generation) return;
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
      // Zero-API path: cloud voices can't synthesize locally, so resolve an
      // on-device voice for the document language instead of the browser default.
      let utteranceVoice: SpeechSynthesisVoice | null = null;
      if (this.selectedVoice && !TTSEngine.isCloudVoiceURI(this.selectedVoice.voiceURI)) {
        utteranceVoice = this.selectedVoice;
      } else {
        utteranceVoice = this.getBestLocalVoiceForLanguage(this.targetLang);
      }
      if (utteranceVoice) {
        utterance.voice = utteranceVoice;
        utterance.lang = utteranceVoice.lang;
      }
      utterance.rate = dynamicParams.rate;
      utterance.pitch = Math.max(0.5, Math.min(2.0, dynamicParams.pitch * eqConfig.pitchFormantShift));
      utterance.volume = Math.max(0.1, Math.min(1.0, dynamicParams.volume * eqConfig.volumePeakCap));

      utterance.onstart = () => {
        if (gen !== this.generation) return;
        this.markSynthActivity();
        ambienceEngine.setSpeakingState(true);
        if (clauseIdx === 0) {
          this.callbacks.onSentenceStart?.(sentenceIdx, rawSentence);
        }

        const firstIdx = wordRanges.findIndex((w) => w.charIndex >= clause.startCharIndex);
        startInterp(firstIdx === -1 ? 0 : firstIdx);
      };

      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (gen !== this.generation) return;
        this.markSynthActivity();
        if (e.name === 'word' || !e.name) {
          this.hasReceivedNativeBoundary = true;
          this.stopSimulatedWordTimer();

          const absCharIndex = clause.startCharIndex + e.charIndex;

          let matchedIdx = wordRanges.findIndex(
            (w) => absCharIndex >= w.charIndex && absCharIndex < w.charIndex + w.charLength + 2
          );
          if (matchedIdx === -1) {
            matchedIdx = wordRanges.findIndex((w) => w.charIndex >= absCharIndex);
          }

          if (matchedIdx !== -1) {
            // Snap interpolation to the true spoken position
            this.interpBaseIdx = matchedIdx;
            this.interpBaseAt = performance.now();
            emitWord(matchedIdx);
          } else {
            const targetCharLength = (e as any).charLength || 1;
            this.callbacks.onWordBoundary?.({
              sentenceIndex: sentenceIdx,
              charIndex: absCharIndex,
              charLength: targetCharLength,
              word: rawSentence.substring(absCharIndex, absCharIndex + targetCharLength),
            });
          }
        }
      };

      utterance.onend = () => {
        if (gen !== this.generation) return;
        ambienceEngine.setSpeakingState(false);
        this.stopSimulatedWordTimer();
        this.stopInterpTimer();
        clauseIdx++;
        if (clauseIdx < clauses.length) {
          const pause = Math.max(80, clause.pauseAfterMs);
          this.sentencePauseTimer = setTimeout(() => {
            if (gen !== this.generation) return;
            if (this.isPlaying && !this.isPaused) {
              playNextClause();
            }
          }, pause);
        } else {
          playNextClause();
        }
      };

      utterance.onerror = (e) => {
        if (gen !== this.generation) return;
        this.stopSimulatedWordTimer();
        this.stopInterpTimer();
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('TTS Speech error:', e);
          this.callbacks.onError?.(new Error(`Speech error: ${e.error}`));
          // Avoid stall: advance to next clause/sentence on real errors
          clauseIdx++;
          if (this.isPlaying && !this.isPaused) {
            this.sentencePauseTimer = setTimeout(() => {
              if (gen !== this.generation) return;
              if (this.isPlaying && !this.isPaused) {
                if (clauseIdx < clauses.length) playNextClause();
                else this.nextSentence();
              }
            }, 300);
          }
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
   * Chromium marathon workaround: speech synthesis can go idle on very long
   * sessions. Only nudge when the synth has been speaking with NO progress
   * events for >25s (stuck long utterance) — never touch short utterances,
   * where pause/resume truncates speech on some Chrome builds.
   */
  private lastSynthActivity = 0;

  private markSynthActivity() {
    this.lastSynthActivity = Date.now();
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.markSynthActivity();
    this.heartbeatTimer = setInterval(() => {
      if (this.synth && this.isPlaying && !this.isPaused) {
        // Cloud-audio path doesn't use synth — nothing to keep alive
        if (this.currentAudioElement && !this.currentAudioElement.paused) return;
        if (this.synth.speaking && !this.synth.paused && Date.now() - this.lastSynthActivity > 25000) {
          this.synth.pause();
          this.synth.resume();
          this.markSynthActivity();
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
    // Refresh live mastering gains if chain already built
    this.ensureMasteringChain();
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
