import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  Check,
  Play,
  Square,
  Award,
  BookOpen,
  Sliders,
  Zap,
  Mic,
  Activity,
  Layers,
  ChevronRight,
  UserCheck,
  Compass,
  Cpu,
  Feather,
  Info,
  Flame,
  Radio,
  Music,
  Download,
  HardDrive,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { TTSVoiceInfo, VoiceNarratorProfile, CadenceMode } from '../types';
import { ttsEngine, BUILTIN_STUDIO_VOICES } from '../services/ttsService';
import { PodcastEQPreset, PODCAST_EQ_PRESETS } from '../utils/podcastEqualizer';
import { CADENCE_MODES } from '../utils/cadenceSettings';
import { NARRATOR_PROFILES } from '../utils/voiceHumanizer';
import { AmbienceSoundscape, AMBIENCE_PRESETS, ambienceEngine } from '../services/ambienceService';
import { offlineAudioStorage, CacheStats } from '../services/offlineAudioStorage';

export interface VoiceStudioPreset {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  icon: string;
  accentColor: string;
  borderColor: string;
  bgGradient: string;
  targetVoiceCloudName: string;
  preferredVoiceURI?: string;
  profile: VoiceNarratorProfile;
  cadence: CadenceMode;
  eq: PodcastEQPreset;
  ambience: AmbienceSoundscape;
  rate: number;
  pitch: number;
  description: string;
  idealFor: string[];
  quoteSample: string;
}

export const VOICE_STUDIO_PRESETS: VoiceStudioPreset[] = [
  {
    id: 'jungian-philosophy',
    name: 'The Carl Jung Masterclass',
    tagline: 'Deep Baritone, Contemplative Pauses & Scholarly Depth',
    badge: 'Deep Philosophy',
    icon: 'Brain',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgGradient: 'from-amber-950/20 via-slate-900/60 to-slate-950',
    targetVoiceCloudName: 'Charon',
    preferredVoiceURI: 'builtin-cloud-charon',
    profile: 'philosopher',
    cadence: 'deep-reflection',
    eq: 'pro-podcast',
    ambience: 'library',
    rate: 0.88,
    pitch: 0.95,
    description: 'Calibrated specifically for Carl Jung, Nietzsche, and Kant. Rich chest resonance, extended conceptual pauses, and academic study hall acoustic presence.',
    idealFor: ['C.G. Jung (Red Book & Archetypes)', 'Continental Philosophy', 'Psychoanalysis Treatises'],
    quoteSample: 'Who looks outside, dreams; who looks inside, awakes. The meeting of two personalities is like the contact of two chemical substances.',
  },
  {
    id: 'master-storyteller',
    name: 'The New Yorker Storyteller',
    tagline: 'Warm Narrative Pacing with Subtle Analog Vinyl Air',
    badge: 'Master Audiobook',
    icon: 'BookOpen',
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgGradient: 'from-indigo-950/20 via-slate-900/60 to-slate-950',
    targetVoiceCloudName: 'Puck',
    preferredVoiceURI: 'builtin-cloud-puck',
    profile: 'storyteller',
    cadence: 'natural-audiobook',
    eq: 'pro-podcast',
    ambience: 'vinyl',
    rate: 0.94,
    pitch: 1.0,
    description: 'Balanced, organic storytelling timbre powered by Gemini HD synthesis. Eliminates fatigue over long listening sessions with gentle breathing gaps.',
    idealFor: ['Literary Biographies', 'Essays & Longform Journalism', 'Classic Fiction'],
    quoteSample: 'In the depth of winter, I finally learned that within me there lay an invincible summer.',
  },
  {
    id: 'oxford-lecture',
    name: 'Oxford Academic Lecture',
    tagline: 'High Consonant Articulation & Structured Cadence',
    badge: 'Academic & Science',
    icon: 'GraduationCap',
    accentColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgGradient: 'from-blue-950/20 via-slate-900/60 to-slate-950',
    targetVoiceCloudName: 'Fenrir',
    preferredVoiceURI: 'builtin-cloud-fenrir',
    profile: 'lecturer',
    cadence: 'intensive-study',
    eq: 'crisp-vocal',
    ambience: 'none',
    rate: 0.98,
    pitch: 0.98,
    description: 'Authoritative enunciation designed for dense research papers, psychological hypotheses, and structured chapters.',
    idealFor: ['Scientific Papers', 'Cognitive Psychology', 'History & Jurisprudence'],
    quoteSample: 'Knowing yourself is the beginning of all wisdom. It is the mark of an educated mind to be able to entertain a thought without accepting it.',
  },
  {
    id: 'fireside-essayist',
    name: 'Fireside Intimate Essayist',
    tagline: 'Warm Conversational FM Tone with Raindrop Ambience',
    badge: 'Intimate & Conversational',
    icon: 'Coffee',
    accentColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgGradient: 'from-orange-950/20 via-slate-900/60 to-slate-950',
    targetVoiceCloudName: 'Zephyr',
    preferredVoiceURI: 'builtin-cloud-zephyr',
    profile: 'essayist',
    cadence: 'natural-audiobook',
    eq: 'warm-fm',
    ambience: 'rain',
    rate: 0.95,
    pitch: 0.99,
    description: 'Personal mentor tone that evokes a quiet study room with gentle rain outside for thoughtful essays.',
    idealFor: ['Montaigne & Emerson', 'Personal Memoirs', 'Humanistic Psychology'],
    quoteSample: 'Do not go where the path may lead, go instead where there is no path and leave a trail.',
  },
  {
    id: 'literary-crystalline',
    name: 'Crystalline Literary Studio',
    tagline: 'Silky Articulation with Pristine Upper Air',
    badge: 'Studio Broadcast HD',
    icon: 'Feather',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgGradient: 'from-purple-950/20 via-slate-900/60 to-slate-950',
    targetVoiceCloudName: 'Kore',
    preferredVoiceURI: 'builtin-cloud-kore',
    profile: 'narrator',
    cadence: 'natural-audiobook',
    eq: 'pro-podcast',
    ambience: 'room-tone',
    rate: 0.95,
    pitch: 1.0,
    description: 'Crisp female vocal reproduction with zero harsh sibilance. Soothing room presence for prose, memoirs, and existential literature.',
    idealFor: ['Virginia Woolf & Simone de Beauvoir', 'Poetry & Aesthetic Prose', 'Modern Literature'],
    quoteSample: 'You cannot find peace by avoiding life. Literature is the immortality of speech.',
  },
  {
    id: 'rapid-executive',
    name: 'Executive Rapid Digest (1.25×)',
    tagline: 'Accelerated Pacing with High-Clarity Speech Boost',
    badge: 'High-Speed Skim',
    icon: 'Zap',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-950/20 via-slate-900/60 to-slate-950',
    targetVoiceCloudName: 'Puck',
    preferredVoiceURI: 'builtin-cloud-puck',
    profile: 'standard',
    cadence: 'executive-skim',
    eq: 'crisp-vocal',
    ambience: 'none',
    rate: 1.25,
    pitch: 1.0,
    description: 'High-speed intellectual digest mode. Tight pauses and speech intelligibility EQ to absorb 300 pages efficiently.',
    idealFor: ['Executive Summaries', 'Fast Chapter Revisions', 'Dense Technical Reports'],
    quoteSample: 'Simplicity is the ultimate sophistication. Time is the most valuable thing a person can spend.',
  },
];

interface CuratedVoiceProfile {
  id: string;
  name: string;
  shortName: string;
  cloudVoiceName?: string;
  voiceURI: string;
  gender: 'male' | 'female';
  grade: 'studio-ai' | 'natural-os';
  badge: string;
  timbreDescription: string;
  highlightTraits: string[];
  bestFor: string;
  sampleQuote: string;
  geminiModelTag: string;
}

const CURATED_GEMINI_VOICES: CuratedVoiceProfile[] = [
  {
    id: 'charon',
    name: 'Charon (Deep Baritone & Philosophy)',
    shortName: 'Charon',
    cloudVoiceName: 'Charon',
    voiceURI: 'builtin-cloud-charon',
    gender: 'male',
    grade: 'studio-ai',
    badge: 'Deep Baritone',
    geminiModelTag: 'Gemini 3.1 Flash TTS · 24kHz HD',
    timbreDescription: 'Resonant, authoritative, deep lower chest frequencies with gravitas and measured tempo.',
    highlightTraits: ['Baritone Timbre', 'Scholarly Gravitas', 'Contemplative'],
    bestFor: 'Carl Jung, Friedrich Nietzsche, Meditations of Marcus Aurelius',
    sampleQuote: 'The privilege of a lifetime is to become who you truly are. What is not brought to consciousness comes about as fate.',
  },
  {
    id: 'puck',
    name: 'Puck (Narrator & Literary Master)',
    shortName: 'Puck',
    cloudVoiceName: 'Puck',
    voiceURI: 'builtin-cloud-puck',
    gender: 'male',
    grade: 'studio-ai',
    badge: 'Master Narrator',
    geminiModelTag: 'Gemini 3.1 Flash TTS · 24kHz HD',
    timbreDescription: 'Nuanced storytelling timbre, natural cadence, breath awareness, and crisp consonant clarity.',
    highlightTraits: ['Versatile', 'Warm Resonance', 'Breath Natural'],
    bestFor: 'Novels, Biographies, Psychology Case Studies, Long-form essays',
    sampleQuote: 'The world is a book, and those who do not travel read only one page. Everything we hear is an opinion, not a fact.',
  },
  {
    id: 'fenrir',
    name: 'Fenrir (Scholarly & Academic Master)',
    shortName: 'Fenrir',
    cloudVoiceName: 'Fenrir',
    voiceURI: 'builtin-cloud-fenrir',
    gender: 'male',
    grade: 'studio-ai',
    badge: 'Academic Lecturer',
    geminiModelTag: 'Gemini 3.1 Flash TTS · 24kHz HD',
    timbreDescription: 'Analytical, razor-sharp consonant articulation, confident intellectual delivery.',
    highlightTraits: ['Clear Articulation', 'Zero Fatigue', 'Intellectual Tone'],
    bestFor: 'Scientific Papers, Cognitive Neuroscience, Epistemology Treatises',
    sampleQuote: 'The unexamined life is not worth living. We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
  },
  {
    id: 'kore',
    name: 'Kore (Silky Studio Literary)',
    shortName: 'Kore',
    cloudVoiceName: 'Kore',
    voiceURI: 'builtin-cloud-kore',
    gender: 'female',
    grade: 'studio-ai',
    badge: 'Crystalline HD',
    geminiModelTag: 'Gemini 3.1 Flash TTS · 24kHz HD',
    timbreDescription: 'Silky, soothing, crystal-clear upper frequency vocal reproduction with intimate proximity effect.',
    highlightTraits: ['Silky Smooth', 'Studio Mastered', 'Calming Presence'],
    bestFor: 'Virginia Woolf, Simone de Beauvoir, Poetry, Introspective Memoirs',
    sampleQuote: 'I am no bird; and no net ensnares me: I am a free human being with an independent will.',
  },
  {
    id: 'zephyr',
    name: 'Zephyr (Warm Conversational Essayist)',
    shortName: 'Zephyr',
    cloudVoiceName: 'Zephyr',
    voiceURI: 'builtin-cloud-zephyr',
    gender: 'male',
    grade: 'studio-ai',
    badge: 'Fireside Warm',
    geminiModelTag: 'Gemini 3.1 Flash TTS · 24kHz HD',
    timbreDescription: 'Gentle, conversational, warm mid-range, inviting companion for long nocturnal reading sessions.',
    highlightTraits: ['Conversational', 'Warm Mid-Presence', 'Intimate Pacing'],
    bestFor: 'Montaigne, Ralph Waldo Emerson, Personal Letters, Meditations',
    sampleQuote: 'Live in the sunshine, swim the sea, drink the wild air. To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.',
  },
  {
    id: 'aoede',
    name: 'Aoede (Classic Elegance & History)',
    shortName: 'Aoede',
    cloudVoiceName: 'Aoede',
    voiceURI: 'builtin-cloud-aoede',
    gender: 'female',
    grade: 'studio-ai',
    badge: 'Classic Elegance',
    geminiModelTag: 'Gemini 3.1 Flash TTS · 24kHz HD',
    timbreDescription: 'Elegant, poised, expressive dramatic range suitable for historical chronicles and philosophy of art.',
    highlightTraits: ['Expressive Range', 'Dramatic Poise', 'Warm Enunciation'],
    bestFor: 'History of Art, Antiquity Chronicles, Historical Fiction',
    sampleQuote: 'History is a gallery of pictures in which there are few originals and many copies. Art enables us to find ourselves and lose ourselves at the same time.',
  },
];

interface ProfessionalVoiceLibraryProps {
  voices: TTSVoiceInfo[];
  selectedVoiceURI: string | null;
  onSelectVoice: (voice: TTSVoiceInfo) => void;
  currentProfile?: VoiceNarratorProfile;
  onSelectProfile?: (profile: VoiceNarratorProfile) => void;
  currentCadenceMode?: CadenceMode;
  onSelectCadenceMode?: (mode: CadenceMode) => void;
  currentEQPreset?: PodcastEQPreset;
  onSelectEQPreset?: (preset: PodcastEQPreset) => void;
  currentAmbience?: AmbienceSoundscape;
  onSelectAmbience?: (ambience: AmbienceSoundscape) => void;
  onApplyPresetNotification?: (presetName: string) => void;
  documentSentences?: string[];
  documentName?: string;
}

export const ProfessionalVoiceLibrary: React.FC<ProfessionalVoiceLibraryProps> = ({
  voices,
  selectedVoiceURI,
  onSelectVoice,
  currentProfile,
  onSelectProfile,
  currentCadenceMode,
  onSelectCadenceMode,
  currentEQPreset,
  onSelectEQPreset,
  currentAmbience,
  onSelectAmbience,
  onApplyPresetNotification,
  documentSentences = [],
  documentName,
}) => {
  const [viewMode, setViewMode] = useState<'presets' | 'voices' | 'offline-vault'>('presets');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'male' | 'female' | 'academic' | 'narrative'>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [customTestText, setCustomTestText] = useState('The privilege of a lifetime is to become who you truly are.');

  // Offline Vault stats
  const [cacheStats, setCacheStats] = useState<CacheStats>({ count: 0, totalBytes: 0, formattedSize: '0 KB', voiceBreakdown: {} });
  const [isPrecaching, setIsPrecaching] = useState(false);
  const [precacheProgress, setPrecacheProgress] = useState<{ current: number; total: number; percent: number; currentText: string }>({
    current: 0,
    total: 0,
    percent: 0,
    currentText: '',
  });
  const [precacheSuccessToast, setPrecacheSuccessToast] = useState<string | null>(null);

  // Refresh cache stats
  const refreshCacheStats = async () => {
    try {
      const stats = await offlineAudioStorage.getCacheStats();
      setCacheStats(stats);
    } catch (e) {
      console.warn('Failed to fetch cache stats:', e);
    }
  };

  useEffect(() => {
    refreshCacheStats();
  }, []);

  // Audition voice
  const handleAuditionVoice = async (voiceURI: string, textToSpeak: string) => {
    if (previewingId === voiceURI) {
      ttsEngine.stop();
      setPreviewingId(null);
      return;
    }

    setPreviewingId(voiceURI);
    const matchedVoice =
      voices.find((v) => v.voice.voiceURI === voiceURI) ||
      BUILTIN_STUDIO_VOICES.find((v) => v.voice.voiceURI === voiceURI);

    if (matchedVoice) {
      await ttsEngine.speakSentenceDirect(textToSpeak, matchedVoice.voice, () => {
        setPreviewingId(null);
      });
    } else {
      setTimeout(() => setPreviewingId(null), 3000);
    }
  };

  // Apply complete Preset Suite
  const handleApplyPreset = (preset: VoiceStudioPreset) => {
    const targetVoice =
      voices.find((v) => v.voice.voiceURI === preset.preferredVoiceURI) ||
      BUILTIN_STUDIO_VOICES.find((v) => v.voice.voiceURI === preset.preferredVoiceURI) ||
      voices.find((v) => v.voice.name.toLowerCase().includes(preset.targetVoiceCloudName.toLowerCase())) ||
      voices[0];

    if (targetVoice) {
      onSelectVoice(targetVoice);
      ttsEngine.setVoiceByURI(targetVoice.voice.voiceURI);
    }

    if (onSelectProfile) onSelectProfile(preset.profile);
    if (onSelectCadenceMode) onSelectCadenceMode(preset.cadence);
    if (onSelectEQPreset) onSelectEQPreset(preset.eq);
    if (onSelectAmbience) {
      onSelectAmbience(preset.ambience);
      ambienceEngine.setAmbience(preset.ambience);
    }

    ttsEngine.setRate(preset.rate);
    ttsEngine.setPitch(preset.pitch);

    setAppliedPresetId(preset.id);
    onApplyPresetNotification?.(preset.name);

    setTimeout(() => {
      setAppliedPresetId(null);
    }, 3000);
  };

  // Pre-cache Current Document sentences
  const handlePrecacheDocument = async () => {
    if (!documentSentences || documentSentences.length === 0) return;

    setIsPrecaching(true);
    const selectedBuiltin = BUILTIN_STUDIO_VOICES.find((v) => v.voice.voiceURI === selectedVoiceURI);
    const targetCloudVoice = selectedBuiltin?.cloudVoiceName || 'Puck';

    const cleanList = documentSentences.filter((s) => s && s.trim().length > 0);
    const total = cleanList.length;

    setPrecacheProgress({ current: 0, total, percent: 0, currentText: 'Initializing offline audio engine...' });

    try {
      const result = await ttsEngine.precacheChapterSentences(
        cleanList,
        targetCloudVoice,
        (completed, totalCount, text) => {
          const pct = Math.round((completed / totalCount) * 100);
          setPrecacheProgress({
            current: completed,
            total: totalCount,
            percent: pct,
            currentText: text.slice(0, 60) + '...',
          });
        }
      );

      await refreshCacheStats();
      setPrecacheSuccessToast(
        `Cached ${result.successCount} sentences for offline listening (${targetCloudVoice} Voice)`
      );
      setTimeout(() => setPrecacheSuccessToast(null), 5000);
    } catch (err) {
      console.error('Pre-caching error:', err);
    } finally {
      setIsPrecaching(false);
    }
  };

  // Clear offline vault
  const handleClearCache = async () => {
    if (window.confirm('Clear all offline cached voice audio from local storage?')) {
      await offlineAudioStorage.clearAudioCache();
      await refreshCacheStats();
    }
  };

  // Filter curated voices
  const filteredCuratedVoices = useMemo(() => {
    return CURATED_GEMINI_VOICES.filter((cv) => {
      if (categoryFilter === 'male') return cv.gender === 'male';
      if (categoryFilter === 'female') return cv.gender === 'female';
      if (categoryFilter === 'academic') return cv.id === 'fenrir' || cv.id === 'charon';
      if (categoryFilter === 'narrative') return cv.id === 'puck' || cv.id === 'zephyr' || cv.id === 'kore' || cv.id === 'aoede';
      return true;
    });
  }, [categoryFilter]);

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Refined Header Banner: Clean Architecture */}
      <div className="px-5 py-3 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                Google Gemini Voice Pack
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                24kHz HD
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Offline Vault</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Zero-lag playback with local IndexedDB neural audio persistence
            </p>
          </div>
        </div>

        {/* Minimal Segmented Switcher */}
        <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('presets')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'presets'
                ? 'bg-slate-800 text-slate-100 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Master Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('voices')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'voices'
                ? 'bg-slate-800 text-slate-100 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>Gemini Voices</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('offline-vault');
              refreshCacheStats();
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'offline-vault'
                ? 'bg-slate-800 text-slate-100 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3 h-3 text-emerald-400" />
            <span>Offline Vault</span>
            {cacheStats.count > 0 && (
              <span className="px-1 py-0.1 text-[9px] rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {cacheStats.count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Offline Pre-cache Notification Toast */}
      {precacheSuccessToast && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 px-4 py-2 text-xs font-medium flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{precacheSuccessToast}</span>
          </span>
          <button type="button" onClick={() => setPrecacheSuccessToast(null)} className="p-1 hover:text-emerald-100">
            ×
          </button>
        </div>
      )}

      {/* Pre-caching in Progress Banner */}
      {isPrecaching && (
        <div className="bg-slate-900 border-b border-indigo-500/40 px-5 py-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-200">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
              <span>Caching audio for offline playback: {precacheProgress.current} / {precacheProgress.total} sentences</span>
            </span>
            <span className="font-mono text-indigo-300">{precacheProgress.percent}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-200"
              style={{ width: `${precacheProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Fast Offline Action Bar (Shown when a document has sentences) */}
      {documentSentences.length > 0 && !isPrecaching && viewMode !== 'offline-vault' && (
        <div className="px-5 py-2 bg-slate-900/30 border-b border-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Document: <strong className="text-slate-200">{documentName || 'Loaded Chapter'}</strong> ({documentSentences.length} sentences)</span>
          </div>
          <button
            type="button"
            onClick={handlePrecacheDocument}
            className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3 h-3 text-indigo-400" />
            <span>Pre-Cache Chapter for 100% Offline</span>
          </button>
        </div>
      )}

      {/* VIEW 1: Master Presets */}
      {viewMode === 'presets' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {VOICE_STUDIO_PRESETS.map((preset) => {
              const isApplied = appliedPresetId === preset.id;
              const isVoiceSelected =
                selectedVoiceURI === preset.preferredVoiceURI ||
                (selectedVoiceURI?.startsWith('builtin-cloud-') &&
                  selectedVoiceURI?.toLowerCase().includes(preset.targetVoiceCloudName.toLowerCase()));

              return (
                <div
                  key={preset.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    isApplied
                      ? 'bg-slate-900/90 border-indigo-400 ring-1 ring-indigo-400/50'
                      : isVoiceSelected
                      ? 'bg-slate-900/80 border-indigo-500/60 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {preset.badge}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                          Voice: Gemini {preset.targetVoiceCloudName}
                        </span>
                      </div>
                      {isVoiceSelected && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100 mb-0.5">
                      {preset.name}
                    </h4>
                    <p className={`text-xs font-medium mb-2 ${preset.accentColor}`}>{preset.tagline}</p>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{preset.description}</p>

                    {/* Suite Configuration Specs */}
                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 text-[11px] text-slate-400 mb-3 font-mono">
                      <div>EQ: <strong className="text-slate-200">{preset.eq}</strong></div>
                      <div>Ambience: <strong className="text-slate-200">{preset.ambience}</strong></div>
                      <div>Cadence: <strong className="text-slate-200">{preset.cadence}</strong></div>
                      <div>Speed: <strong className="text-slate-200">{preset.rate}×</strong></div>
                    </div>

                    {/* Sample Quote */}
                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/40 mb-3 text-xs italic text-slate-400">
                      "{preset.quoteSample}"
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-800/60 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleAuditionVoice(preset.preferredVoiceURI || 'builtin-cloud-puck', preset.quoteSample)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                        previewingId === (preset.preferredVoiceURI || 'builtin-cloud-puck')
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      {previewingId === (preset.preferredVoiceURI || 'builtin-cloud-puck') ? (
                        <>
                          <Square className="w-3 h-3 text-rose-400 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-indigo-400 fill-current" />
                          <span>Audition</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Apply Master Suite</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Gemini Curated Voices */}
      {viewMode === 'voices' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'all', label: 'All 6 Gemini Voices' },
              { id: 'male', label: 'Male Baritone & Warm' },
              { id: 'female', label: 'Female Studio HD' },
              { id: 'academic', label: 'Academic & Philosophy' },
              { id: 'narrative', label: 'Narrative & Storytelling' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCuratedVoices.map((cv) => {
              const matchedSystemVoice =
                voices.find((v) => v.voice.voiceURI === cv.voiceURI) ||
                BUILTIN_STUDIO_VOICES.find((v) => v.voice.voiceURI === cv.voiceURI);

              const isSelected = selectedVoiceURI === cv.voiceURI;
              const isAuditioning = previewingId === cv.voiceURI;

              return (
                <div
                  key={cv.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900/90 border-indigo-500/60 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {cv.badge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-slate-100 mb-0.5">{cv.name}</h4>
                    <p className="text-[10px] text-indigo-400 font-mono mb-2">{cv.geminiModelTag}</p>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">{cv.timbreDescription}</p>

                    {/* Highlight Traits */}
                    <div className="flex items-center gap-1 flex-wrap mb-2.5">
                      {cv.highlightTraits.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 text-[9px] rounded bg-slate-950 text-slate-400 border border-slate-800/80 font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Best For Tag */}
                    <div className="text-[11px] text-slate-400 mb-3 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/40">
                      <strong className="text-slate-300">Ideal for:</strong> {cv.bestFor}
                    </div>
                  </div>

                  {/* Audition & Select Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleAuditionVoice(cv.voiceURI, cv.sampleQuote)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                        isAuditioning
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      {isAuditioning ? (
                        <>
                          <Square className="w-3 h-3 text-rose-400 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-indigo-400 fill-current" />
                          <span>Audition</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (matchedSystemVoice) {
                          onSelectVoice(matchedSystemVoice);
                          ttsEngine.setVoiceByURI(cv.voiceURI);
                        }
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: Offline Vault & Pre-Caching Suite */}
      {viewMode === 'offline-vault' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Vault Status Overview */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                  <span>Local IndexedDB Offline Audio Vault</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    0ms Latency
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cached audio clips play instantly even without an internet connection.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Stored</div>
                <div className="text-sm font-mono font-bold text-emerald-400">{cacheStats.count} sentences</div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Vault Size</div>
                <div className="text-sm font-mono font-bold text-emerald-400">{cacheStats.formattedSize}</div>
              </div>
            </div>
          </div>

          {/* Chapter Pre-Caching Action Box */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Pre-Cache Chapter Audio for Offline Reading</span>
                </h5>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synthesizes all sentences in your active document in advance into local browser storage.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrecacheDocument}
                disabled={isPrecaching || documentSentences.length === 0}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                {isPrecaching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Caching ({precacheProgress.percent}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Cache {documentSentences.length} Sentences</span>
                  </>
                )}
              </button>
            </div>

            {/* Document Info */}
            <div className="text-xs text-slate-400 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between font-mono text-[11px]">
              <span>Active: <strong className="text-slate-200">{documentName || 'Loaded Document'}</strong></span>
              <span>Total: <strong className="text-slate-200">{documentSentences.length} sentences</strong></span>
            </div>
          </div>

          {/* Voice Cache Breakdown & Vault Management */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Voice Cache Distribution</span>
              </h5>
              <button
                type="button"
                onClick={handleClearCache}
                disabled={cacheStats.count === 0}
                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Cache</span>
              </button>
            </div>

            {Object.keys(cacheStats.voiceBreakdown).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">
                No audio clips stored in offline vault yet. Audition or pre-cache sentences to build offline memory.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(cacheStats.voiceBreakdown).map(([vName, count]) => (
                  <div
                    key={vName}
                    className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-medium">Gemini {vName}</span>
                    <span className="font-mono text-emerald-400 font-semibold">{count} clips</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audition Input Bar */}
      <div className="px-5 py-2.5 bg-slate-900/50 border-t border-slate-800/80 flex items-center gap-3">
        <input
          type="text"
          value={customTestText}
          onChange={(e) => setCustomTestText(e.target.value)}
          placeholder="Type custom test phrase to audition Google Gemini voices..."
          className="flex-1 bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
        />
        <button
          type="button"
          onClick={() => handleAuditionVoice(selectedVoiceURI || 'builtin-cloud-puck', customTestText)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
        >
          <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Audition</span>
        </button>
      </div>
    </div>
  );
};
