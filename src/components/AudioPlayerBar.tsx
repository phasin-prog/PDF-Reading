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
  Sliders,
  BookOpen,
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

const SPEEDS = [1.0, 1.25, 1.5, 2.0];
const TIMERS: Array<{ label: string; val: number | null }> = [
  { label: 'Off', val: null },
  { label: '5 min', val: 5 },
  { label: '15 min', val: 15 },
  { label: '30 min', val: 30 },
  { label: '60 min', val: 60 },
];

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  playbackState,
  activeSentenceText,
  activeWordText = null,
  highlightMode = 'word',
  currentProfile = 'standard',
  cadenceMode = 'natural-audiobook',
  sentenceDelayMs = 150,
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
  const [timerOpen, setTimerOpen] = useState(false);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);
  const [inputPage, setInputPage] = useState(String(playbackState.currentPageIndex + 1));

  useEffect(() => {
    setInputPage(String(playbackState.currentPageIndex + 1));
  }, [playbackState.currentPageIndex]);

  const playing = playbackState.isPlaying && !playbackState.isPaused;
  const progress =
    totalSentencesInPage > 0
      ? Math.round(((playbackState.currentSentenceIndex + 1) / totalSentencesInPage) * 100)
      : 0;

  const gotoPage = (n: number) => {
    if (!onSelectPage || isNaN(n)) return;
    const clamped = Math.min(totalPageCount, Math.max(1, n));
    onSelectPage(clamped - 1);
    setPageOpen(false);
  };

  const iconBtn =
    'p-2 rounded-lg text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition active:scale-95 cursor-pointer';

  return (
    <div
      id="audio-player-bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)] border-t border-[var(--line)]"
      style={{ boxShadow: 'var(--shadow-bar)' }}
    >
      <div className="h-0.5 w-full bg-[var(--surface-2)]">
        <div className="h-full bg-[var(--accent)] transition-all duration-200" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-2 pb-3">
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-2)] min-w-0 mb-2">
          <span className="font-mono text-xs text-[var(--ink-3)] shrink-0">
            p.{playbackState.currentPageIndex + 1}/{totalPageCount}
          </span>
          <span className="truncate font-serif italic">
            {playing && highlightMode === 'word' && activeWordText ? (
              <>
                <strong className="not-italic font-sans font-semibold text-[var(--ink)]">{activeWordText}</strong>
                <span className="text-[var(--ink-3)]"> — </span>
              </>
            ) : null}
            {activeSentenceText || 'Select a sentence to start listening'}
          </span>
          {playbackState.sleepTimerRemainingMinutes !== null && (
            <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs text-[var(--ink-2)]">
              <Clock className="w-3 h-3" />
              {playbackState.sleepTimerRemainingMinutes}m
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            id="voice-selector-btn"
            onClick={onOpenVoiceModal}
            title="Voice and narration settings"
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition text-left cursor-pointer mr-1"
          >
            <Mic className="w-4 h-4 text-[var(--ink-2)] shrink-0" />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-[var(--ink)] truncate max-w-[130px]">
                {currentVoice ? currentVoice.name.replace(/^AI Studio\s+/, '').replace(/\s*\(.*\)\s*$/, '') : 'Voice'}
              </span>
              <span className="block text-[11px] text-[var(--ink-3)] truncate">
                {NARRATOR_PROFILES[currentProfile]?.name || ''} · {CADENCE_MODES[cadenceMode]?.name || ''}
                {currentVoice?.isLocal ? ' · Offline' : currentVoice?.isBuiltInStudioVoice ? ' · Cloud' : ''}
              </span>
            </span>
          </button>

          <button id="prev-sentence-btn" onClick={onPrevSentence} title="Previous sentence" className={iconBtn}>
            <SkipBack className="w-4 h-4" />
          </button>
          {playing ? (
            <button
              id="play-pause-btn"
              onClick={onPause}
              title="Pause"
              className="w-11 h-11 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center hover:opacity-85 active:scale-95 transition cursor-pointer shrink-0"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              id="play-pause-btn"
              onClick={() => (playbackState.isPaused ? onResume() : onPlay())}
              title="Play"
              className="w-11 h-11 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center hover:opacity-85 active:scale-95 transition cursor-pointer shrink-0"
            >
              <Play className="w-5 h-5 fill-current translate-x-[1px]" />
            </button>
          )}
          <button id="next-sentence-btn" onClick={onNextSentence} title="Next sentence" className={iconBtn}>
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setPageOpen(!pageOpen)}
              title="Go to page"
              className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition cursor-pointer font-mono"
            >
              <ChevronLeft
                className="w-4 h-4 hover:text-[var(--ink)]"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevPage();
                }}
              />
              <span>
                {playbackState.currentPageIndex + 1}/{totalPageCount}
              </span>
              <ChevronRight
                className="w-4 h-4 hover:text-[var(--ink)]"
                onClick={(e) => {
                  e.stopPropagation();
                  onNextPage();
                }}
              />
              <ChevronDown className={`w-3 h-3 text-[var(--ink-3)] transition-transform ${pageOpen ? 'rotate-180' : ''}`} />
            </button>
            {pageOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-60 p-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl z-50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    gotoPage(parseInt(inputPage, 10));
                  }}
                  className="flex gap-2 mb-2"
                >
                  <input
                    type="number"
                    min={1}
                    max={totalPageCount}
                    value={inputPage}
                    onChange={(e) => setInputPage(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[13px] focus:outline-none"
                  />
                  <button type="submit" className="px-3 py-1.5 rounded-lg bg-[var(--ink)] text-[var(--paper)] text-[13px] font-medium cursor-pointer">
                    Go
                  </button>
                </form>
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {[
                    { label: 'First', fn: () => gotoPage(1) },
                    { label: '-10', fn: () => gotoPage(playbackState.currentPageIndex + 1 - 10) },
                    { label: '+10', fn: () => gotoPage(playbackState.currentPageIndex + 1 + 10) },
                    { label: 'Last', fn: () => gotoPage(totalPageCount) },
                  ].map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={b.fn}
                      className="py-1 rounded-md bg-[var(--surface-2)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition cursor-pointer"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                {onOpenPageSelector && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPageSelector();
                      setPageOpen(false);
                    }}
                    className="w-full py-1.5 rounded-lg text-[13px] text-[var(--accent-ink)] hover:bg-[var(--surface-2)] transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Page grid
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center ml-1 rounded-lg bg-[var(--surface-2)] p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => onRateChange(s)}
                className={`px-2 py-1 text-xs font-mono rounded-md transition cursor-pointer ${
                  playbackState.rate === s ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm font-semibold' : 'text-[var(--ink-3)] hover:text-[var(--ink-2)]'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-0.5">
            <div className="relative">
              <button
                id="sleep-timer-btn"
                onClick={() => {
                  setTimerOpen(!timerOpen);
                  setTuneOpen(false);
                }}
                title="Sleep timer"
                className={`${iconBtn} ${playbackState.sleepTimerEnd ? 'text-[var(--accent-ink)]' : ''}`}
              >
                <Clock className="w-4 h-4" />
              </button>
              {timerOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-40 p-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl z-50">
                  {TIMERS.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => {
                        onSetSleepTimer(t.val);
                        setTimerOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] hover:bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                id="sound-settings-btn"
                onClick={() => {
                  setTuneOpen(!tuneOpen);
                  setTimerOpen(false);
                }}
                title="Volume, pitch, pause"
                className={iconBtn}
              >
                <Sliders className="w-4 h-4" />
              </button>
              {tuneOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-64 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl z-50 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-[var(--ink-2)] mb-1.5">
                      <span>Volume</span>
                      <span className="font-mono">{Math.round(playbackState.volume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <VolumeX className="w-3.5 h-3.5 text-[var(--ink-3)]" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={playbackState.volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <Volume2 className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[var(--ink-2)] mb-1.5">
                      <span>Pitch</span>
                      <span className="font-mono">{playbackState.pitch.toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.4"
                      step="0.05"
                      value={playbackState.pitch}
                      onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  {onSentenceDelayChange && (
                    <div>
                      <div className="flex justify-between text-xs text-[var(--ink-2)] mb-1.5">
                        <span>Pause between sentences</span>
                        <span className="font-mono">{sentenceDelayMs}ms</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="600"
                        step="20"
                        value={sentenceDelayMs}
                        onChange={(e) => onSentenceDelayChange(parseInt(e.target.value, 10))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              id="autoscroll-btn"
              onClick={onToggleAutoScroll}
              title={playbackState.autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
              className={`${iconBtn} ${playbackState.autoScroll ? 'text-[var(--accent-ink)]' : 'opacity-40'}`}
            >
              <span className="text-xs font-mono font-semibold px-0.5">Scroll</span>
            </button>

            {playbackState.isPlaying && (
              <button id="stop-btn" onClick={onStop} title="Stop" className={iconBtn}>
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>

      {(timerOpen || tuneOpen || pageOpen) && (
        <button
          aria-label="Close"
          className="fixed inset-0 -z-10 cursor-default"
          onClick={() => {
            setTimerOpen(false);
            setTuneOpen(false);
            setPageOpen(false);
          }}
        />
      )}
    </div>
  );
};
