import React from 'react';
import {
  BookOpen,
  FolderOpen,
  Sun,
  Moon,
  Coffee,
  Type,
  Wifi,
  WifiOff,
  Sparkles,
  Search,
  Globe,
  Clock,
  CheckCircle2,
  Sliders,
  Bookmark,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ReaderTheme, ReaderFontSize, DocumentItem } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  currentDoc: DocumentItem | null;
  onOpenLibrary: () => void;
  theme: ReaderTheme;
  onChangeTheme: (theme: ReaderTheme) => void;
  fontSize: ReaderFontSize;
  onChangeFontSize: (size: ReaderFontSize) => void;
  sessionReadingSeconds?: number;
  sessionPagesCompleted?: number;
  onOpenSearch?: () => void;
  onOpenLanguageSwitcher?: () => void;
  zenMode?: boolean;
  onToggleZenMode?: () => void;
  onOpenStyleModal?: () => void;
  onOpenPageNotes?: () => void;
  bookmarkCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDoc,
  onOpenLibrary,
  theme,
  onChangeTheme,
  fontSize,
  onChangeFontSize,
  sessionReadingSeconds = 0,
  sessionPagesCompleted = 0,
  onOpenSearch,
  onOpenLanguageSwitcher,
  zenMode = false,
  onToggleZenMode,
  onOpenStyleModal,
  onOpenPageNotes,
  bookmarkCount = 0,
}) => {
  const isOnline = useOnlineStatus();

  const formatTime = (totalSec: number) => {
    if (totalSec < 60) return `${totalSec}s`;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins < 60) return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins.toString().padStart(2, '0')}m`;
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-300 ${
        zenMode
          ? 'bg-slate-950/95 border-slate-800/80 text-slate-100 shadow-sm'
          : 'bg-white/95 dark:bg-slate-950/95 border-slate-200/80 dark:border-slate-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-3 sm:gap-6">
        {/* LEFT: Library & Document Identity / Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            id="open-library-btn"
            onClick={onOpenLibrary}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition active:scale-97 cursor-pointer"
            title="Open Offline Document Library"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold hidden sm:inline tracking-tight">Library</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Online / Offline subtle indicator */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="hidden md:inline">Online</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="hidden md:inline">Offline</span>
              </span>
            )}
          </div>
        </div>

        {/* CENTER: Document Title & Reading Metadata */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2 sm:px-4">
          {currentDoc ? (
            <div className="flex items-center gap-2 max-w-full text-center truncate">
              <h1
                className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate tracking-tight"
                title={currentDoc.name}
              >
                {currentDoc.name}
              </h1>

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 font-mono">
                <span>·</span>
                <span>{currentDoc.pageCount}p</span>
                {onOpenLanguageSwitcher && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={onOpenLanguageSwitcher}
                      className="uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Language & Voice settings"
                    >
                      <Globe className="w-3 h-3" />
                      <span>{((currentDoc.detectedLanguage || 'EN').split(/[-_]/)[0] || 'EN').toUpperCase()}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs font-serif italic text-slate-400 dark:text-slate-500">
              PDF Voice Reader
            </span>
          )}
        </div>

        {/* RIGHT: Zen Mode, Notes, Search, Format, Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zen Mode Button */}
          {onToggleZenMode && (
            <button
              id="header-zen-mode-btn"
              type="button"
              onClick={onToggleZenMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                zenMode
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                  : 'bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border-purple-200/60 dark:border-purple-800/60'
              }`}
              title="Toggle Zen Mode (Distraction-free reading)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-300" />
              <span className="hidden lg:inline">{zenMode ? 'Exit Zen' : 'Zen'}</span>
            </button>
          )}

          {/* Page Notes & Bookmarks Drawer Trigger */}
          {onOpenPageNotes && (
            <button
              id="header-page-notes-btn"
              type="button"
              onClick={onOpenPageNotes}
              className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition border border-slate-200/80 dark:border-slate-800 cursor-pointer"
              title="Open Notes & Bookmarks"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Notes</span>
              {bookmarkCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold">
                  {bookmarkCount}
                </span>
              )}
            </button>
          )}

          {/* Header Search Button */}
          {onOpenSearch && (
            <button
              id="header-search-btn"
              onClick={onOpenSearch}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 cursor-pointer"
              title="Search Document (Ctrl+F)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Search</span>
            </button>
          )}

          {/* Format & Style Customizer Modal Trigger */}
          {onOpenStyleModal && (
            <button
              id="header-style-customizer-btn"
              type="button"
              onClick={onOpenStyleModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 cursor-pointer"
              title="Format, Fonts & Layout"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden lg:inline">Format</span>
            </button>
          )}

          {/* Quick Session Stats Badge */}
          <div
            id="header-session-badge"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs border border-slate-200/80 dark:border-slate-800 font-mono"
            title="Current session reading time and completed pages"
          >
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatTime(sessionReadingSeconds)}</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>{sessionPagesCompleted}p</span>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Theme Selector (Segmented 3-state) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => onChangeTheme('light')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-amber-600 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeTheme('sepia')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                theme === 'sepia'
                  ? 'bg-amber-100 text-amber-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Warm Sepia Theme (Kindle Style)"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeTheme('dark')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                theme === 'dark' || theme === 'oled' || theme === 'nord'
                  ? 'bg-slate-800 text-indigo-300 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
