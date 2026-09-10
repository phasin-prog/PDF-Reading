import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Volume2,
  VolumeX,
  Clock,
  Mic,
  WifiOff,
  Sliders,
  Compass,
  Sparkles,
  BookOpen,
  Layers,
  X,
} from 'lucide-react';
import { PlaybackState, TTSVoiceInfo, VoiceNarratorProfile, CadenceMode } from '../types';
import { NARRATOR_PROFILES } from '../utils/voiceHumanizer';
import { CADENCE_MODES } from '../utils/cadenceSettings';

interface AudioPlayerBarProps {
  playbackState: PlaybackState;
  activeSentenceText: string;
  activeWordText?: string | null;
  highlightMode?: 'word' | 'sentence';
  currentProfile?: VoiceNarratorProfile;
  cadenceMode?: CadenceMode;
  sentenceDelayMs?: number;
  totalSentencesInPage: number;
  totalPageCount: number;
  currentVoice: TTSVoiceInfo | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onSelectPage?: (pageIndex: number) => void;
  onOpenPageSelector?: () => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
  onVolumeChange: (vol: number) => void;
  onSentenceDelayChange?: (ms: number) => void;
  onOpenVoiceModal: () => void;
  onToggleAutoScroll: () => void;
  onSetSleepTimer: (minutes: number | null) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  playbackState,
  activeSentenceText,
  activeWordText = null,
  highlightMode = 'word',
  currentProfile = 'philosopher',
  cadenceMode = 'natural-audiobook',
  sentenceDelayMs = 260,
  totalSentencesInPage,
  totalPageCount,
  currentVoice,
  onPlay,
  onPause,
  onResume,
  onStop,
  onNextSentence,
  onPrevSentence,
  onNextPage,
  onPrevPage,
  onSelectPage,
  onOpenPageSelector,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onSentenceDelayChange,
  onOpenVoiceModal,
  onToggleAutoScroll,
  onSetSleepTimer,
}) => {
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [showTimerPopover, setShowTimerPopover] = useState(false);
  const [showPagePopover, setShowPagePopover] = useState(false);
  const [inputPageNum, setInputPageNum] = useState<string>(
    String(playbackState.currentPageIndex + 1)
  );

  useEffect(() => {
    setInputPageNum(String(playbackState.currentPageIndex + 1));
  }, [playbackState.currentPageIndex]);

  const speedOptions = [1.0, 1.25, 1.5, 2.0];

  const currentSentenceIdx = playbackState.currentSentenceIndex;
  const sentenceProgress =
    totalSentencesInPage > 0
      ? Math.round(((currentSentenceIdx + 1) / totalSentencesInPage) * 100)
      : 0;
  const documentProgress =
    totalPageCount > 0
      ? Math.round(((playbackState.currentPageIndex + 1) / totalPageCount) * 100)
      : 0;

  return (
    <div
      id="audio-player-bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-all"
    >
      {/* Mini Dual Progress Track: Audio Progress (Primary) + Document Progress (Underlay) */}
      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1 relative overflow-hidden">
        {/* Document overall progress baseline */}
        <div
          className="absolute top-0 left-0 h-full bg-slate-300 dark:bg-slate-700/60 opacity-40 transition-all duration-300"
          style={{ width: `${documentProgress}%` }}
          title={`Document Progress: ${documentProgress}%`}
        />
        {/* Active page sentence audio playback progress */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-500 transition-all duration-200 ease-out"
          style={{ width: `${sentenceProgress}%` }}
          title={`Page Audio Progress: ${sentenceProgress}%`}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        {/* ROW A: Subtle "Now Reading" Context Line */}
        <div className="flex items-center justify-between gap-3 mb-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
              Now Reading
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 font-semibold shrink-0">
              p. {playbackState.currentPageIndex + 1} / {totalPageCount}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>

            {playbackState.isPlaying && highlightMode === 'word' && activeWordText ? (
              <span className="truncate italic text-slate-800 dark:text-slate-200 font-serif flex items-center gap-1.5 min-w-0">
                <span className="px-1.5 py-0.2 rounded-md bg-amber-400/90 text-slate-950 font-bold not-italic text-[10px] shrink-0">
                  {activeWordText}
                </span>
                <span className="truncate">“{activeSentenceText}”</span>
              </span>
            ) : (
              <span className="truncate italic text-slate-700 dark:text-slate-300 font-serif">
                “{activeSentenceText || 'Select a document or sentence to start listening...'}”
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
            {playbackState.sleepTimerRemainingMinutes !== null && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                <Clock className="w-2.5 h-2.5 animate-spin" />
                <span>{playbackState.sleepTimerRemainingMinutes}m left</span>
              </span>
            )}
            <span className="text-slate-400 dark:text-slate-500">
              {currentSentenceIdx + 1}/{totalSentencesInPage || 1}
            </span>
          </div>
        </div>

        {/* ROW B: Main Playback Dock */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* LEFT: Voice & Narration Style Identity Block */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <button
              id="voice-selector-btn"
              onClick={onOpenVoiceModal}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-left transition cursor-pointer group"
              title="Click to change TTS Voice & Narration Style"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[140px]">
                    {currentVoice ? currentVoice.name : 'Select Voice'}
                  </span>
                  {currentVoice?.qualityGrade === 'natural' && (
                    <span className="px-1 py-0.2 text-[9px] font-mono font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      HD
                    </span>
                  )}
                  {currentVoice?.isLocal && (
                    <span
                      className="p-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      title="Offline Ready Voice"
                    >
                      <WifiOff className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 font-mono">
                  <span>{NARRATOR_PROFILES[currentProfile]?.name || 'Philosopher'}</span>
                  <span>·</span>
                  <span>{CADENCE_MODES[cadenceMode]?.label ? CADENCE_MODES[cadenceMode].label.split(' ')[0] : 'Natural'}</span>
                </div>
              </div>
            </button>
          </div>

          {/* CENTER: Core Playback & Compact Page Nav */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 mx-auto">
            {/* Previous Sentence */}
            <button
              id="prev-sentence-btn"
              onClick={onPrevSentence}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-95 cursor-pointer"
              title="Previous Sentence"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Primary Play / Pause Button */}
            {playbackState.isPlaying && !playbackState.isPaused ? (
              <button
                id="play-pause-btn"
                onClick={onPause}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer shrink-0"
                title="Pause Speech"
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                id="play-pause-btn"
                onClick={() => {
                  if (playbackState.isPaused) {
                    onResume();
                  } else {
                    onPlay();
                  }
                }}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer shrink-0"
                title="Play Speech"
              >
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              </button>
            )}

            {/* Next Sentence */}
            <button
              id="next-sentence-btn"
              onClick={onNextSentence}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-95 cursor-pointer"
              title="Next Sentence"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Compact Page Stepper: ‹ Page 13 / 109 › */}
            <div className="relative inline-flex items-center ml-1 sm:ml-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-800">
                <button
                  id="prev-page-btn"
                  onClick={onPrevPage}
                  disabled={playbackState.currentPageIndex <= 0}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 transition cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  id="page-selector-btn-center"
                  type="button"
                  onClick={() => setShowPagePopover(!showPagePopover)}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1 font-mono cursor-pointer"
                  title="Click to jump to a page"
                >
                  <span>p. {playbackState.currentPageIndex + 1}</span>
                  <span className="text-slate-400 dark:text-slate-600">/ {totalPageCount}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showPagePopover ? 'rotate-180' : ''}`} />
                </button>

                <button
                  id="next-page-btn"
                  onClick={onNextPage}
                  disabled={playbackState.currentPageIndex >= totalPageCount - 1}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 transition cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Popover Menu for Page Jump */}
              {showPagePopover && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Page Selector</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPagePopover(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Jump directly by input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const target = parseInt(inputPageNum, 10);
                      if (!isNaN(target) && target >= 1 && target <= totalPageCount) {
                        if (onSelectPage) onSelectPage(target - 1);
                        setShowPagePopover(false);
                      }
                    }}
                    className="flex gap-1.5 mb-3"
                  >
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={1}
                        max={totalPageCount}
                        value={inputPageNum}
                        onChange={(e) => setInputPageNum(e.target.value)}
                        placeholder={`1 - ${totalPageCount}`}
                        className="w-full pl-2.5 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                        /{totalPageCount}
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-2xs active:scale-95 cursor-pointer"
                    >
                      Go
                    </button>
                  </form>

                  {/* Dropdown list select */}
                  <div className="mb-3">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">
                      Quick Jump
                    </label>
                    <select
                      value={playbackState.currentPageIndex}
                      onChange={(e) => {
                        const p = parseInt(e.target.value, 10);
                        if (onSelectPage) onSelectPage(p);
                        setShowPagePopover(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {Array.from({ length: totalPageCount }, (_, i) => (
                        <option key={i} value={i}>
                          Page {i + 1} {i === playbackState.currentPageIndex ? '✓ (Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step Buttons */}
                  <div className="grid grid-cols-4 gap-1 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPage) onSelectPage(0);
                        setShowPagePopover(false);
                      }}
                      className="py-1 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition text-center cursor-pointer"
                    >
                      First
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPage) onSelectPage(Math.max(0, playbackState.currentPageIndex - 10));
                        setShowPagePopover(false);
                      }}
                      className="py-1 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition text-center cursor-pointer"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPage) onSelectPage(Math.min(totalPageCount - 1, playbackState.currentPageIndex + 10));
                        setShowPagePopover(false);
                      }}
                      className="py-1 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition text-center cursor-pointer"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPage) onSelectPage(totalPageCount - 1);
                        setShowPagePopover(false);
                      }}
                      className="py-1 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition text-center cursor-pointer"
                    >
                      Last
                    </button>
                  </div>

                  {/* Full Page Grid Modal Trigger */}
                  {onOpenPageSelector && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPageSelector();
                        setShowPagePopover(false);
                      }}
                      className="w-full py-2 px-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-blue-200/60 dark:border-blue-800/60 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Open Page Grid</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Segmented Speed Control: [ 1× | 1.25× | 1.5× | 2× ] */}
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-800 ml-1">
              {speedOptions.map((rate) => (
                <button
                  key={rate}
                  onClick={() => onRateChange(rate)}
                  className={`px-2 py-1 text-[11px] font-mono font-semibold rounded-lg transition cursor-pointer ${
                    playbackState.rate === rate
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Secondary Audio Tools (Auto-scroll, Timer, Pitch/Volume, Stop) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Auto-scroll toggle */}
            <button
              id="autoscroll-btn"
              onClick={onToggleAutoScroll}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                playbackState.autoScroll
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300/80 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-400'
              }`}
              title={playbackState.autoScroll ? 'Auto-scroll is ON' : 'Auto-scroll is OFF'}
            >
              <Compass className="w-3.5 h-3.5" />
            </button>

            {/* Sleep Timer popover */}
            <div className="relative">
              <button
                id="sleep-timer-btn"
                onClick={() => {
                  setShowTimerPopover(!showTimerPopover);
                  setShowSettingsPopover(false);
                }}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  playbackState.sleepTimerEnd
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
                title="Sleep Timer"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>

              {showTimerPopover && (
                <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs z-50">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    Sleep Timer
                  </div>
                  {[
                    { label: 'Off', val: null },
                    { label: '5 minutes', val: 5 },
                    { label: '15 minutes', val: 15 },
                    { label: '30 minutes', val: 30 },
                    { label: '45 minutes', val: 45 },
                    { label: '60 minutes', val: 60 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        onSetSleepTimer(item.val);
                        setShowTimerPopover(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer"
                    >
                      <span>{item.label}</span>
                      {playbackState.sleepTimerRemainingMinutes === item.val && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pitch & Volume Popover */}
            <div className="relative">
              <button
                id="sound-settings-btn"
                onClick={() => {
                  setShowSettingsPopover(!showSettingsPopover);
                  setShowTimerPopover(false);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                title="Voice Pitch, Volume & Breath Pause"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {showSettingsPopover && (
                <div className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs z-50">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span>Voice Tuning</span>
                    <button
                      onClick={() => {
                        onPitchChange(1.0);
                        onVolumeChange(1.0);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Volume</span>
                      <span className="font-mono">{Math.round(playbackState.volume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={playbackState.volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    </div>
                  </div>

                  {/* Pitch Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Pitch</span>
                      <span className="font-mono">{playbackState.pitch.toFixed(1)}×</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.4"
                      step="0.05"
                      value={playbackState.pitch}
                      onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  {/* Sentence Breath Pause Slider */}
                  {onSentenceDelayChange && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Acoustic Breath Pause</span>
                        <span className="font-mono">{sentenceDelayMs}ms</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="600"
                        step="20"
                        value={sentenceDelayMs}
                        onChange={(e) => onSentenceDelayChange(parseInt(e.target.value, 10))}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Crisp (0ms)</span>
                        <span>Natural (250ms)</span>
                        <span>Deep (600ms)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stop Button (quiet when active) */}
            {playbackState.isPlaying && (
              <button
                id="stop-btn"
                onClick={onStop}
                className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                title="Stop Speech"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
