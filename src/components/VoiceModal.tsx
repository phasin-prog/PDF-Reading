import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Volume2,
  Check,
  WifiOff,
  Globe,
  Sparkles,
  BookOpen,
  Award,
  Sliders,
  Mic,
  Activity,
  Gauge,
  RotateCcw,
  Play,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Download,
  UserCheck,
  Info,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { TTSVoiceInfo, VoiceNarratorProfile, CadenceMode } from '../types';
import { ttsEngine } from '../services/ttsService';
import { NARRATOR_PROFILES } from '../utils/voiceHumanizer';
import { PodcastEQPreset, PODCAST_EQ_PRESETS, playPodcastEQSoundCheck } from '../utils/podcastEqualizer';
import { CADENCE_MODES } from '../utils/cadenceSettings';
import { AmbienceSoundscape, AMBIENCE_PRESETS, ambienceEngine } from '../services/ambienceService';
import { ProfessionalVoiceLibrary } from './ProfessionalVoiceLibrary';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: TTSVoiceInfo[];
  selectedVoiceURI: string | null;
  onSelectVoice: (voice: TTSVoiceInfo) => void;
  currentLang: string;
  currentProfile?: VoiceNarratorProfile;
  onSelectProfile?: (profile: VoiceNarratorProfile) => void;
  currentCadenceMode?: CadenceMode;
  onSelectCadenceMode?: (mode: CadenceMode) => void;
  currentEQPreset?: PodcastEQPreset;
  onSelectEQPreset?: (preset: PodcastEQPreset) => void;
  currentAmbience?: AmbienceSoundscape;
  onSelectAmbience?: (ambience: AmbienceSoundscape) => void;
  documentSentences?: string[];
  documentName?: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  voices,
  selectedVoiceURI,
  onSelectVoice,
  currentLang,
  currentProfile = 'standard',
  onSelectProfile,
  currentCadenceMode = 'natural-audiobook',
  onSelectCadenceMode,
  currentEQPreset = 'pro-podcast',
  onSelectEQPreset,
  currentAmbience = 'none',
  onSelectAmbience,
  documentSentences = [],
  documentName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangCategory, setSelectedLangCategory] = useState<string>('all');
  const [onlyOffline, setOnlyOffline] = useState(false);
  const [onlyNatural, setOnlyNatural] = useState(false);
  const [onlyUSMale, setOnlyUSMale] = useState(false);
  const [activeTab, setActiveTab] = useState<'pro-library' | 'voices' | 'profiles' | 'cadence' | 'equalizer' | 'ambience'>('pro-library');
  const [appliedPresetToast, setAppliedPresetToast] = useState<string | null>(null);
  const [previewingURI, setPreviewingURI] = useState<string | null>(null);

  // Rate & Pitch Tuning State for live audition
  const [previewRate, setPreviewRate] = useState<number>(0.98);
  const [previewPitch, setPreviewPitch] = useState<number>(1.0);

  // Group languages for category filter tabs
  const languageOptions = useMemo(() => {
    const map = new Map<string, { code: string; label: string; count: number }>();
    for (const v of voices) {
      const primary = (v.lang || 'en').split(/[-_]/)[0].toLowerCase();
      const existing = map.get(primary);
      if (existing) {
        existing.count++;
      } else {
        const langName = (v.langName || 'English').split('(')[0].trim();
        map.set(primary, { code: primary, label: langName, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [voices]);

  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      const primary = (v.lang || 'en').split(/[-_]/)[0].toLowerCase();
      if (selectedLangCategory !== 'all' && primary !== selectedLangCategory) {
        return false;
      }
      if (onlyOffline && !v.isLocal) {
        return false;
      }
      if (onlyNatural && v.qualityGrade === 'standard') {
        return false;
      }
      if (onlyUSMale) {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        const isUS = lang.includes('us') || lang.startsWith('en');
        const isMaleNamed =
          name.includes('guy') ||
          name.includes('christopher') ||
          name.includes('mark') ||
          name.includes('david') ||
          name.includes('alex') ||
          name.includes('tom') ||
          name.includes('roger') ||
          name.includes('steffan') ||
          name.includes('fred') ||
          name.includes('daniel') ||
          name.includes('matthew') ||
          name.includes('joey') ||
          name.includes('google') ||
          v.isUSMale;
        if (!isUS || !isMaleNamed) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          (v.lang && v.lang.toLowerCase().includes(q)) ||
          (v.langName && v.langName.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [voices, selectedLangCategory, onlyOffline, onlyNatural, onlyUSMale, searchQuery]);

  const handleRecommendEnglishJungVoice = () => {
    const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    if (enVoices.length > 0) {
      const best = enVoices[0];
      onSelectVoice(best);
      if (onSelectProfile) {
        onSelectProfile('philosopher');
      }
    }
  };

  const handlePreviewVoice = (v: TTSVoiceInfo) => {
    // Isolate audition tuning: restore main playback rate/pitch after preview
    const mainRate = ttsEngine.getRate();
    const mainPitch = ttsEngine.getPitch();
    setPreviewingURI(v.voice.voiceURI);
    ttsEngine.setRate(previewRate);
    ttsEngine.setPitch(previewPitch);
    ttsEngine.previewVoice(v.voice);

    setTimeout(() => {
      setPreviewingURI(null);
      ttsEngine.setRate(mainRate);
      ttsEngine.setPitch(mainPitch);
    }, 4000);
  };

  const renderVoicesTab = () => (
    <div className="flex-1 overflow-y-auto flex flex-col font-sans bg-slate-950 text-slate-100">
      {/* Realtime Audition Tuner Bar */}
      <div className="px-5 py-3.5 bg-slate-900/40 border-b border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Audition Velocity & Tone
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Rate: <strong className="text-slate-200">{previewRate.toFixed(2)}×</strong></span>
            <span className="text-slate-400">Tone: <strong className="text-slate-200">{previewPitch.toFixed(2)}×</strong></span>
            <button
              type="button"
              onClick={() => {
                setPreviewRate(0.98);
                setPreviewPitch(1.0);
                ttsEngine.setRate(0.98);
                ttsEngine.setPitch(1.0);
              }}
              className="p-1 rounded-md bg-slate-800/60 text-slate-400 hover:text-slate-200 transition"
              title="Reset Rate & Pitch"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Reading Velocity</span>
              <span className="font-mono">{previewRate.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="2.0"
              step="0.05"
              value={previewRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPreviewRate(val);
                ttsEngine.setRate(val);
              }}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Acoustic Pitch</span>
              <span className="font-mono">{previewPitch.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.02"
              value={previewPitch}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPreviewPitch(val);
                ttsEngine.setPitch(val);
              }}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Filters & Command Search Area */}
      <div className="px-5 py-3 bg-slate-900/20 border-b border-slate-800/60 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter voices by name, accent, or region..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-900/60 rounded-lg border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setOnlyNatural(!onlyNatural)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition font-medium cursor-pointer ${
                onlyNatural
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Natural HD Only
            </button>
            <button
              onClick={() => setOnlyUSMale(!onlyUSMale)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition font-medium cursor-pointer ${
                onlyUSMale
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              US Male Presets
            </button>
          </div>
        </div>

        {/* Language Category Chips */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setSelectedLangCategory('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
              selectedLangCategory === 'all'
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({voices.length})
          </button>
          {languageOptions.map((opt) => (
            <button
              key={opt.code}
              onClick={() => setSelectedLangCategory(opt.code)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                selectedLangCategory === opt.code
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label} ({opt.count})
            </button>
          ))}
        </div>
      </div>

      {/* Voice Cards Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredVoices.map((v) => {
          const isSelected = selectedVoiceURI === v.voice.voiceURI;
          const isPreviewing = previewingURI === v.voice.voiceURI;

          return (
            <div
              key={v.voice.voiceURI}
              onClick={() => onSelectVoice(v)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-xs'
                  : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100">{v.name}</span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {v.isBuiltInStudioVoice ? (
                      <span title="Cloud HD: needs internet first time, then cached offline" className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">CLOUD</span>
                    ) : v.isLocal ? (
                      <span title="On-device voice: works fully offline" className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">OFFLINE</span>
                    ) : (
                      <span title="System voice: may need internet" className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-300 border border-slate-500/30">SYSTEM</span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800/60">
                      {v.lang}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{v.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(v);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    isPreviewing
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-medium'
                      : 'bg-slate-800/50 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isPreviewing ? 'Auditioning...' : 'Audition'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectVoice(v)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Use Voice'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      id="voice-selection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5"
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl bg-slate-950 text-slate-100 shadow-2xl border border-slate-800/80 overflow-hidden font-sans">
        {/* Layer 1: Refined Editorial Header (Height ~68px) */}
        <div className="h-16 sm:h-[70px] px-5 py-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
              <Headphones className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm sm:text-base font-semibold tracking-tight text-slate-100 truncate">
                  Voice Studio & Audio Controls
                </h2>
              </div>
              <p className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                <span>Precision narration tuning · acoustic EQ · reading velocity</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">{voices.length} voices</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRecommendEnglishJungVoice}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 text-amber-300/90 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
              title="Apply Jung & Philosophy Studio Preset"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400/90" />
              <span>Jung & Philosophy Preset</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
              title="Close Voice Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Layer 2: Editorial Navigation Bar (Height ~44px, No Clipping) */}
        <div className="border-b border-slate-800/80 bg-slate-950 px-4 sm:px-5 flex items-center gap-5 sm:gap-7 overflow-x-auto scrollbar-none font-sans shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pro-library')}
            className={`py-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pro-library'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini Voice Pack</span>
            <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 ml-0.5">
              HD Vault
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voices')}
            className={`py-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'voices'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>All System Voices</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`py-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'profiles'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Narrator Profiles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cadence')}
            className={`py-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'cadence'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Cadence & Pacing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equalizer')}
            className={`py-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'equalizer'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Spoken EQ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ambience')}
            className={`py-3 text-xs font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ambience'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Ambience</span>
          </button>
        </div>

        {/* Preset Applied Feedback Banner */}
        {appliedPresetToast && (
          <div className="bg-indigo-950/90 border-b border-indigo-500/40 text-indigo-200 px-4 py-2 text-xs font-medium flex items-center justify-between gap-2 shrink-0">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-indigo-400" />
              <span>Configured Voice Studio: <strong>{appliedPresetToast}</strong></span>
            </span>
            <button
              type="button"
              onClick={() => setAppliedPresetToast(null)}
              className="text-indigo-400 hover:text-indigo-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Layer 3: Workspace Content Panels */}
        {/* Tab 0: Gemini Voice Pack & Studio Library */}
        {activeTab === 'pro-library' && (
          <ProfessionalVoiceLibrary
            voices={voices}
            selectedVoiceURI={selectedVoiceURI}
            onSelectVoice={onSelectVoice}
            currentProfile={currentProfile}
            onSelectProfile={onSelectProfile}
            currentCadenceMode={currentCadenceMode}
            onSelectCadenceMode={onSelectCadenceMode}
            currentEQPreset={currentEQPreset}
            onSelectEQPreset={onSelectEQPreset}
            currentAmbience={currentAmbience}
            onSelectAmbience={onSelectAmbience}
            onApplyPresetNotification={(name) => {
              setAppliedPresetToast(name);
              setTimeout(() => setAppliedPresetToast(null), 4000);
            }}
            documentSentences={documentSentences}
            documentName={documentName}
          />
        )}

        {/* Tab 1: System Voices */}
        {activeTab === 'voices' && renderVoicesTab()}

        {/* Tab 2: Narrator Profiles */}
        {activeTab === 'profiles' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans bg-slate-950">
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                <span>Narrator Linguistic Cadence & Breath Phrasing</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates breath pauses, conjunct velocities, and consonant articulations calibrated for philosophical and academic prose.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(NARRATOR_PROFILES).map((prof) => {
                const isSelected = currentProfile === prof.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => onSelectProfile?.(prof.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900/90 border-indigo-500/60 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-slate-100">{prof.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {prof.badge}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-300 font-medium mb-1">{prof.tagline}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{prof.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Speed: {prof.rate}×</span>
                      <span>Breath: {prof.sentenceDelayMs}ms</span>
                      <span className={isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-500'}>
                        {isSelected ? '✓ Active' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Spoken Audio Equalizer */}
        {activeTab === 'equalizer' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans bg-slate-950">
            {/* DSP Visualizer */}
            <div className="bg-slate-900/50 p-4 sm:p-5 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    5-Band Studio Parametric Equalizer
                  </span>
                </div>
                <span className="text-[11px] font-mono text-indigo-300 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  {PODCAST_EQ_PRESETS[currentEQPreset]?.name}
                </span>
              </div>

              {/* Graphic 5-Band Equalizer Frequency Display */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {PODCAST_EQ_PRESETS[currentEQPreset]?.bands.map((b, i) => {
                  const isBoost = b.gain > 0;
                  const isCut = b.gain < 0;
                  const heightPct = Math.min(100, Math.max(18, 50 + b.gain * 6));

                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                      <div className="h-16 w-full bg-slate-950 rounded-lg p-1 flex items-end justify-center relative border border-slate-800/80 overflow-hidden">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-sm transition-all duration-300 ${
                            isBoost
                              ? 'bg-indigo-500'
                              : isCut
                              ? 'bg-amber-500/80'
                              : 'bg-slate-700'
                          }`}
                        />
                        <span className="absolute text-[10px] font-mono text-white bottom-1 z-10 font-bold">
                          {b.gain > 0 ? `+${b.gain}` : b.gain}dB
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 truncate w-full">
                        {(b.label || '').split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EQ Presets Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(PODCAST_EQ_PRESETS).map((preset) => {
                const isSelected = currentEQPreset === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      onSelectEQPreset?.(preset.id);
                      playPodcastEQSoundCheck(preset.id);
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900/90 border-indigo-500/60 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-slate-100">{preset.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-300 font-medium mb-1">{preset.tagline}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-slate-400 space-x-2">
                        <span>Ratio: {preset.compression.ratio}</span>
                        <span>Gain: {preset.compression.makeupGainDb}dB</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPodcastEQSoundCheck(preset.id);
                          if (voices.length > 0) {
                            const currentVoice = voices.find((v) => v.voice.voiceURI === selectedVoiceURI);
                            if (currentVoice) {
                              ttsEngine.previewVoice(currentVoice.voice);
                            }
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Sound Check</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Cadence Modes */}
        {activeTab === 'cadence' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans bg-slate-950">
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Syntactic Chunking & Punctuation Pause Rhythm</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Intelligently divides long sentences along clause boundaries with structured pause intervals for deep comprehension.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(CADENCE_MODES).map((mode) => {
                const isSelected = currentCadenceMode === mode.id;

                return (
                  <div
                    key={mode.id}
                    onClick={() => onSelectCadenceMode?.(mode.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900/90 border-indigo-500/60 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-slate-100">{mode.nameThai}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-300 font-medium mb-1">{mode.tagline}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{mode.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/60">
                        <span className="block text-[10px] text-slate-500">Comma (,)</span>
                        <strong className="text-slate-300">{mode.commaPauseMs}ms</strong>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/60">
                        <span className="block text-[10px] text-slate-500">Period (.)</span>
                        <strong className="text-slate-300">{mode.periodPauseMs}ms</strong>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800/60">
                        <span className="block text-[10px] text-slate-500">Paragraph</span>
                        <strong className="text-slate-300">{mode.paragraphPauseMs}ms</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Ambience Soundscapes */}
        {activeTab === 'ambience' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans bg-slate-950">
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Adaptive Acoustic Ducking</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Background soundscapes softly duck during active speech and subtly rise during reflective pauses for deep concentration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(AMBIENCE_PRESETS).map((preset) => {
                const isSelected = currentAmbience === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      onSelectAmbience?.(preset.id);
                      ambienceEngine.setAmbience(preset.id);
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900/90 border-indigo-500/60 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-slate-100">{preset.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-300 font-medium mb-1">{preset.badge}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quiet Editorial Footer */}
        <div className="h-13 px-5 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400 truncate">
            Calibrated for philosophical treatises, psychology, and academic papers.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition cursor-pointer shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
