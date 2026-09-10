import React from 'react';
import {
  FolderOpen,
  Sun,
  Moon,
  Coffee,
  Search,
  Globe,
  Clock,
  Sliders,
  Bookmark,
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
    return `${Math.floor(mins / 60)}h ${(mins % 60).toString().padStart(2, '0')}m`;
  };

  const iconBtn =
    'p-2 rounded-lg text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition flex items-center gap-1.5 cursor-pointer';

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--surface)] border-b border-[var(--line)]">
      <div className="max-w-5xl mx-auto px-4 h-13 flex items-center gap-2">
        <button
          id="open-library-btn"
          onClick={onOpenLibrary}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)] px-1 py-1.5 rounded-md transition cursor-pointer"
          title="Library"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Library</span>
        </button>

        <span title={isOnline ? 'Online' : 'Offline'} className="flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </span>

        <div className="flex-1 min-w-0 text-center px-2">
          {currentDoc ? (
            <span className="inline-flex items-baseline gap-2 max-w-full">
              <h1 className="text-sm font-medium truncate" title={currentDoc.name}>
                {currentDoc.name}
              </h1>
              <span className="hidden sm:inline text-xs font-mono text-[var(--ink-3)] shrink-0">
                {currentDoc.pageCount}p
              </span>
              {onOpenLanguageSwitcher && (
                <button
                  type="button"
                  onClick={onOpenLanguageSwitcher}
                  className="hidden sm:inline-flex items-center gap-0.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] uppercase font-mono cursor-pointer shrink-0"
                  title="Language"
                >
                  <Globe className="w-3 h-3" />
                  {((currentDoc.detectedLanguage || 'EN').split(/[-_]/)[0] || 'EN').toUpperCase()}
                </button>
              )}
            </span>
          ) : (
            <span className="text-sm text-[var(--ink-3)] font-serif italic">PDF Voice</span>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {onToggleZenMode && (
            <button
              id="header-zen-mode-btn"
              type="button"
              onClick={onToggleZenMode}
              className={`${iconBtn} ${zenMode ? 'text-[var(--accent-ink)]' : ''}`}
              title="Zen mode"
            >
              <span className="hidden lg:inline text-[13px]">{zenMode ? 'Exit' : 'Zen'}</span>
            </button>
          )}
          {onOpenPageNotes && (
            <button id="header-page-notes-btn" type="button" onClick={onOpenPageNotes} className={iconBtn} title="Notes">
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && <span className="text-xs font-mono">{bookmarkCount}</span>}
            </button>
          )}
          {onOpenSearch && (
            <button id="header-search-btn" onClick={onOpenSearch} className={iconBtn} title="Search (Ctrl+F)">
              <Search className="w-4 h-4" />
            </button>
          )}
          {onOpenStyleModal && (
            <button
              id="header-style-customizer-btn"
              type="button"
              onClick={onOpenStyleModal}
              className={iconBtn}
              title="Reading appearance"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          <span
            id="header-session-badge"
            className="hidden xl:inline text-xs font-mono text-[var(--ink-3)] px-2"
            title="Session time · pages finished"
          >
            <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
            {formatTime(sessionReadingSeconds)} · {sessionPagesCompleted}p
          </span>

          <PWAInstallButton />

          <span className="flex items-center rounded-lg bg-[var(--surface-2)] p-0.5 ml-1">
            {(
              [
                { id: 'light' as ReaderTheme, title: 'Light', Icon: Sun },
                { id: 'sepia' as ReaderTheme, title: 'Sepia', Icon: Coffee },
                { id: 'dark' as ReaderTheme, title: 'Dark', Icon: Moon },
              ]
            ).map(({ id, title, Icon }) => {
              const active = theme === id || (id === 'dark' && (theme === 'oled' || theme === 'nord'));
              return (
                <button
                  key={id}
                  onClick={() => onChangeTheme(id)}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    active ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-3)] hover:text-[var(--ink-2)]'
                  }`}
                  title={title}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </span>
        </div>
      </div>
    </header>
  );
};
