import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Volume2,
  Check,
  Play,
  Gauge,
  RotateCcw,
  Sliders,
  Mic,
  BookOpen,
  Award,
  Headphones,
  Sparkles,
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
  cloudAvailable?: boolean;
}

type Tab = 'voices' | 'studio' | 'reading' | 'sound';

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  voices,
  selectedVoiceURI,
  onSelectVoice,
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
  cloudAvailable = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangCategory, setSelectedLangCategory] = useState<string>('all');
  const [onlyOffline, setOnlyOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(cloudAvailable ? 'studio' : 'voices');
  const [appliedPresetToast, setAppliedPresetToast] = useState<string | null>(null);
  const [previewingURI, setPreviewingURI] = useState<string | null>(null);
  const [previewRate, setPreviewRate] = useState<number>(0.98);
  const [previewPitch, setPreviewPitch] = useState<number>(1.0);

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
    const localFirst = [...voices].sort((a, b) => Number(b.isLocal) - Number(a.isLocal));
    return localFirst.filter((v) => {
      const primary = (v.lang || 'en').split(/[-_]/)[0].toLowerCase();
      if (selectedLangCategory !== 'all' && primary !== selectedLangCategory) return false;
      if (onlyOffline && !v.isLocal && !v.isBuiltInStudioVoice) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          (v.lang && v.lang.toLowerCase().includes(q)) ||
          (v.langName && v.langName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [voices, selectedLangCategory, onlyOffline, searchQuery]);

  const handleSelectVoice = (v: TTSVoiceInfo) => {
    if (v.isBuiltInStudioVoice && !cloudAvailable) {
      setAppliedPresetToast('เสียง Cloud ต้องใส่ GEMINI_API_KEY ใน .env ก่อน — ตอนนี้ใช้เสียงเครื่องไปก่อน');
      setTimeout(() => setAppliedPresetToast(null), 4000);
      return;
    }
    onSelectVoice(v);
  };

  const handlePreviewVoice = (v: TTSVoiceInfo) => {
    if (v.isBuiltInStudioVoice && !cloudAvailable) {
      setAppliedPresetToast('เสียง Cloud ต้องใส่ GEMINI_API_KEY ใน .env ก่อน (เสียงเครื่องใช้ได้เลย)');
      setTimeout(() => setAppliedPresetToast(null), 4000);
      return;
    }
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

  if (!isOpen) return null;

  const card =
    'p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] transition text-left w-full';
  const cardActive = 'border-[var(--accent)] ring-1 ring-[var(--accent)]';

  const tabs: Array<{ id: Tab; label: string; Icon: React.ElementType }> = [
    { id: 'voices', label: 'Voices', Icon: Mic },
    { id: 'studio', label: 'Studio', Icon: Sparkles },
    { id: 'reading', label: 'Reading', Icon: BookOpen },
    { id: 'sound', label: 'Sound', Icon: Sliders },
  ];

  return (
    <div id="voice-selection-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center gap-3">
          <Headphones className="w-4 h-4 text-[var(--ink-2)] shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold truncate">Voice & Audio</h2>
            <p className="text-xs text-[var(--ink-3)] truncate">
              {voices.length} voices{cloudAvailable ? '' : ' · local only (no API key)'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition cursor-pointer" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 border-b border-[var(--line)] flex gap-1 overflow-x-auto">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`py-2.5 px-3 text-[13px] font-medium border-b-2 -mb-px transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === id
                  ? 'border-[var(--ink)] text-[var(--ink)]'
                  : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink-2)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {appliedPresetToast && (
          <div className="px-4 py-2 text-[13px] bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--ink-2)] flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              {appliedPresetToast}
            </span>
            <button type="button" onClick={() => setAppliedPresetToast(null)} className="p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'voices' && (
            <div>
              <div className="px-5 py-3 border-b border-[var(--line)] space-y-2.5 sticky top-0 bg-[var(--surface)]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search voices..."
                    className="w-full pl-8 pr-3 py-1.5 text-[13px] rounded-lg border border-[var(--line)] bg-[var(--paper)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSelectedLangCategory('all')}
                    className={`px-2 py-1 text-xs rounded-md cursor-pointer ${selectedLangCategory === 'all' ? 'bg-[var(--surface-2)] font-semibold' : 'text-[var(--ink-3)]'}`}
                  >
                    All ({voices.length})
                  </button>
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => setSelectedLangCategory(opt.code)}
                      className={`px-2 py-1 text-xs rounded-md cursor-pointer ${selectedLangCategory === opt.code ? 'bg-[var(--surface-2)] font-semibold' : 'text-[var(--ink-3)]'}`}
                    >
                      {opt.label} ({opt.count})
                    </button>
                  ))}
                  <button
                    onClick={() => setOnlyOffline(!onlyOffline)}
                    className={`px-2 py-1 text-xs rounded-md border ml-auto cursor-pointer ${onlyOffline ? 'border-[var(--ink)] font-semibold' : 'border-[var(--line)] text-[var(--ink-3)]'}`}
                  >
                    Offline only
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-[var(--ink-2)]">
                    Rate <span className="font-mono">{previewRate.toFixed(2)}×</span>
                    <input type="range" min="0.75" max="2.0" step="0.05" value={previewRate} onChange={(e) => setPreviewRate(parseFloat(e.target.value))} className="w-full" />
                  </label>
                  <label className="text-xs text-[var(--ink-2)]">
                    Pitch <span className="font-mono">{previewPitch.toFixed(2)}×</span>
                    <input type="range" min="0.8" max="1.2" step="0.02" value={previewPitch} onChange={(e) => setPreviewPitch(parseFloat(e.target.value))} className="w-full" />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRate(0.98);
                    setPreviewPitch(1.0);
                  }}
                  className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset audition tuning
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredVoices.map((v) => {
                  const isSelected = selectedVoiceURI === v.voice.voiceURI;
                  const isPreviewing = previewingURI === v.voice.voiceURI;
                  const gated = v.isBuiltInStudioVoice && !cloudAvailable;
                  return (
                    <div key={v.voice.voiceURI} className={`${card} ${isSelected ? cardActive : ''} ${gated ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[13px] font-medium">{v.name}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          {v.isBuiltInStudioVoice ? (
                            <span className="text-[10px] font-mono text-[var(--ink-3)]">Cloud</span>
                          ) : v.isLocal ? (
                            <span className="text-[10px] font-mono text-[var(--ink-3)]">Offline</span>
                          ) : null}
                          <span className="text-[10px] font-mono text-[var(--ink-3)]">{v.lang}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-2)] leading-relaxed line-clamp-2 mb-2.5">{v.description}</p>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(v);
                          }}
                          className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          {isPreviewing ? 'Playing...' : 'Preview'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectVoice(v)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                            isSelected ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--surface-2)] hover:opacity-80'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Use'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <ProfessionalVoiceLibrary
              voices={voices}
              selectedVoiceURI={selectedVoiceURI}
              onSelectVoice={handleSelectVoice}
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
              cloudAvailable={cloudAvailable}
            />
          )}

          {activeTab === 'reading' && (
            <div className="p-5 space-y-6">
              <section>
                <h3 className="text-[13px] font-semibold mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[var(--ink-3)]" /> Narrator
                </h3>
                <p className="text-xs text-[var(--ink-3)] mb-2.5">Pacing and tone for long-form reading.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(NARRATOR_PROFILES).map((prof) => (
                    <button
                      key={prof.id}
                      onClick={() => onSelectProfile?.(prof.id)}
                      className={`${card} ${currentProfile === prof.id ? cardActive : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-medium">{prof.name}</span>
                        {currentProfile === prof.id && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-xs text-[var(--ink-2)]">{prof.tagline}</p>
                      <p className="text-[11px] font-mono text-[var(--ink-3)] mt-1.5">
                        {prof.rate}× · {prof.sentenceDelayMs}ms pause
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-semibold mb-1 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[var(--ink-3)]" /> Cadence
                </h3>
                <p className="text-xs text-[var(--ink-3)] mb-2.5">Pause lengths at punctuation.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(CADENCE_MODES).map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => onSelectCadenceMode?.(mode.id)}
                      className={`${card} ${currentCadenceMode === mode.id ? cardActive : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-medium">{mode.name}</span>
                        {currentCadenceMode === mode.id && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-xs text-[var(--ink-2)]">{mode.tagline}</p>
                      <p className="text-[11px] font-mono text-[var(--ink-3)] mt-1.5">
                        , {mode.commaPauseMs}ms · . {mode.periodPauseMs}ms · ¶ {mode.paragraphPauseMs}ms
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'sound' && (
            <div className="p-5 space-y-6">
              <section>
                <h3 className="text-[13px] font-semibold mb-1">Equalizer</h3>
                <p className="text-xs text-[var(--ink-3)] mb-2.5">Applies to cloud audio playback.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(PODCAST_EQ_PRESETS).map((preset) => (
                    <div key={preset.id} className={`${card} ${currentEQPreset === preset.id ? cardActive : ''}`}>
                      <button
                        onClick={() => {
                          onSelectEQPreset?.(preset.id);
                          playPodcastEQSoundCheck(preset.id);
                        }}
                        className="text-left w-full cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[13px] font-medium">{preset.name}</span>
                          {currentEQPreset === preset.id && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <p className="text-xs text-[var(--ink-2)]">{preset.tagline}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => playPodcastEQSoundCheck(preset.id)}
                        className="mt-2 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" /> Test tone
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-semibold mb-1">Ambience</h3>
                <p className="text-xs text-[var(--ink-3)] mb-2.5">Background sound, ducked while speaking.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(AMBIENCE_PRESETS).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onSelectAmbience?.(preset.id);
                        ambienceEngine.setAmbience(preset.id);
                      }}
                      className={`${card} ${currentAmbience === preset.id ? cardActive : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-medium">{preset.name}</span>
                        {currentAmbience === preset.id && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-xs text-[var(--ink-2)]">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--line)] flex items-center justify-between">
          <span className="text-xs text-[var(--ink-3)]">Settings apply instantly.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] font-medium rounded-lg bg-[var(--surface-2)] hover:opacity-80 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
