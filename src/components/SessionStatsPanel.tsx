import React, { useState } from 'react';
import { Clock, CheckCircle2, RotateCcw, Activity } from 'lucide-react';
import { ReaderTheme } from '../types';

interface SessionStatsPanelProps {
  readingSeconds: number;
  pagesCompleted: number;
  isPlaying: boolean;
  onResetSession: () => void;
  theme: ReaderTheme;
}

export const SessionStatsPanel: React.FC<SessionStatsPanelProps> = ({
  readingSeconds,
  pagesCompleted,
  isPlaying,
  onResetSession,
  theme,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Format seconds into clean readable format
  const formatTime = (totalSec: number) => {
    if (totalSec < 60) {
      return `${totalSec}s`;
    }
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins < 60) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins.toString().padStart(2, '0')}m`;
  };

  const themeStyles: Record<
    ReaderTheme,
    {
      cardBg: string;
      border: string;
      text: string;
      subtext: string;
      accentBg: string;
      accentText: string;
    }
  > = {
    light: {
      cardBg: 'bg-white/90 shadow-xs backdrop-blur-xs',
      border: 'border-slate-200/80',
      text: 'text-slate-800',
      subtext: 'text-slate-500',
      accentBg: 'bg-blue-50 text-blue-700 border-blue-100',
      accentText: 'text-blue-600',
    },
    sepia: {
      cardBg: 'bg-[#fffaf0]/90 shadow-xs backdrop-blur-xs',
      border: 'border-[#e6dbc8]',
      text: 'text-[#433422]',
      subtext: 'text-[#7a6449]',
      accentBg: 'bg-[#ebd8b5]/60 text-[#342410] border-[#dec9a4]',
      accentText: 'text-[#a37941]',
    },
    dark: {
      cardBg: 'bg-slate-900/90 shadow-xs backdrop-blur-xs',
      border: 'border-slate-800',
      text: 'text-slate-200',
      subtext: 'text-slate-400',
      accentBg: 'bg-blue-950/60 text-blue-300 border-blue-900/40',
      accentText: 'text-blue-400',
    },
    oled: {
      cardBg: 'bg-black/90 shadow-none backdrop-blur-xs',
      border: 'border-neutral-800',
      text: 'text-neutral-100',
      subtext: 'text-neutral-400',
      accentBg: 'bg-purple-950/60 text-purple-300 border-purple-900/40',
      accentText: 'text-purple-400',
    },
    nord: {
      cardBg: 'bg-[#2e3440]/90 shadow-xs backdrop-blur-xs',
      border: 'border-[#4c566a]',
      text: 'text-[#eceff4]',
      subtext: 'text-[#d8dee9]',
      accentBg: 'bg-[#3b4252] text-[#88c0d0] border-[#434c5e]',
      accentText: 'text-[#88c0d0]',
    },
  };

  const currentStyle = themeStyles[theme];

  return (
    <div
      id="session-statistics-panel"
      className={`rounded-2xl border p-3 sm:p-3.5 mb-4 transition-all duration-200 ${currentStyle.cardBg} ${currentStyle.border}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Left: Session Badge & Title */}
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${currentStyle.accentBg} flex items-center justify-center`}>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-wider ${currentStyle.subtext}`}>
                Current Session
              </span>
              {isPlaying && (
                <span className="flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              )}
            </div>
            <p className={`text-[11px] ${currentStyle.subtext}`}>
              Live reading & listening progress
            </p>
          </div>
        </div>

        {/* Right: The Two Statistics (Time spent reading + Pages completed) */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Stat 1: Time Spent Reading */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Clock className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Time Reading
              </div>
              <div className={`text-sm sm:text-base font-bold font-mono ${currentStyle.text}`}>
                {formatTime(readingSeconds)}
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Stat 2: Pages Completed */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Pages Completed
              </div>
              <div className={`text-sm sm:text-base font-bold ${currentStyle.text}`}>
                {pagesCompleted} {pagesCompleted === 1 ? 'page' : 'pages'}
              </div>
            </div>
          </div>

          {/* Reset Session Button */}
          <div className="ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
            {showConfirmReset ? (
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => {
                    onResetSession();
                    setShowConfirmReset(false);
                  }}
                  className="px-2 py-1 bg-rose-600 text-white rounded-md text-[11px] font-semibold hover:bg-rose-700 transition"
                  title="Reset current session statistics to zero"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className={`px-1.5 py-1 rounded-md text-[11px] ${currentStyle.subtext} hover:underline`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="reset-session-stats-btn"
                onClick={() => setShowConfirmReset(true)}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition`}
                title="Reset session statistics"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
