import React from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Bookmark,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { PlaybackState } from '../types';

interface DeepListeningOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  chapterTitle?: string;
  currentPageText: string;
  currentSentenceText: string;
  currentSentenceIndex: number;
  totalSentences: number;
  currentPageNumber: number;
  totalPages: number;
  playbackState: PlaybackState;
  onTogglePlay: () => void;
  onSeekSentence: (offset: number) => void;
  onSpeedChange: (speed: number) => void;
  onSaveConcept: (term: string) => void;
}

export const DeepListeningOverlay: React.FC<DeepListeningOverlayProps> = ({
  isOpen,
  onClose,
  documentTitle,
  chapterTitle,
  currentPageText,
  currentSentenceText,
  currentSentenceIndex,
  totalSentences,
  currentPageNumber,
  totalPages,
  playbackState,
  onTogglePlay,
  onSeekSentence,
  onSpeedChange,
  onSaveConcept,
}) => {
  if (!isOpen) return null;

  const progressPercent = Math.round(
    ((currentSentenceIndex + 1) / Math.max(1, totalSentences)) * 100
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-12 font-serif animate-fadeIn select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto w-full">
        <div className="space-y-1">
          <span className="text-xs font-mono tracking-widest text-amber-400 uppercase">
            Deep Listening Mode
          </span>
          <h2 className="text-sm font-bold text-slate-300 truncate max-w-md">
            {documentTitle} {chapterTitle ? `— ${chapterTitle}` : ''}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Page {currentPageNumber} of {totalPages}
          </span>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Exit Deep Listening Mode"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Focus Reading Canvas */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-3xl mx-auto w-full my-8 text-center space-y-8 px-4 overflow-y-auto">
        <div className="space-y-4">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/60">
            Sentence {currentSentenceIndex + 1} of {totalSentences}
          </span>

          <p className="text-2xl sm:text-3xl lg:text-4xl font-serif text-amber-100 leading-relaxed font-medium tracking-tight transition-all duration-300">
            “{currentSentenceText || 'Select a sentence to begin listening...'}”
          </p>
        </div>

        {/* Quick Concept Bookmark Action */}
        {currentSentenceText && (
          <button
            onClick={() => {
              const firstWord = (currentSentenceText || '').trim().split(/\s+/)[0] || 'Concept';
              onSaveConcept(firstWord);
            }}
            className="px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-amber-300 text-xs font-sans font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>Bookmark Concept in Memory Bank</span>
          </button>
        )}
      </div>

      {/* Bottom Audio Controller Bar */}
      <div className="max-w-xl mx-auto w-full space-y-4 font-sans">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>{progressPercent}% completed</span>
            <span>Speed: {playbackState.rate}x</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-2xl backdrop-blur-md">
          <button
            onClick={() => onSeekSentence(-1)}
            className="p-3 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Previous Sentence"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg cursor-pointer transform active:scale-95"
            title={playbackState.isPlaying ? 'Pause' : 'Play'}
          >
            {playbackState.isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onSeekSentence(1)}
            className="p-3 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Next Sentence"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-slate-800 my-auto" />

          {/* Speed Toggles */}
          <div className="flex items-center gap-1 font-mono text-xs text-slate-400">
            {[0.85, 1.0, 1.2, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => onSpeedChange(spd)}
                className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                  playbackState.rate === spd
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
