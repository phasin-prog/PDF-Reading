import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sparkles,
  BookOpen,
  Layers,
  FileCheck,
  Zap,
  Search,
  Grid,
  Globe,
  Bookmark,
  Sliders,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Edit3,
  Trash2,
  AlertTriangle,
  ScanText,
} from 'lucide-react';
import {
  DocumentItem,
  ReaderTheme,
  ReaderFontSize,
  ReaderFontFamily,
  ReaderLineWidth,
  ReaderLineHeight,
  ParagraphIndent,
  HighlightMode,
  PageViewMode,
} from '../types';
import { SessionStatsPanel } from './SessionStatsPanel';
import { tokenizeSentenceWords } from '../utils/wordTokenizer';
import { isScannedPage } from '../services/ocrService';

interface DocumentReaderProps {
  document: DocumentItem | null;
  currentPageIndex: number;
  currentSentenceIndex: number;
  isPlaying: boolean;
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
  fontFamily?: ReaderFontFamily;
  lineWidth?: ReaderLineWidth;
  lineHeight?: ReaderLineHeight;
  paragraphIndent?: ParagraphIndent;
  autoScroll: boolean;
  sessionReadingSeconds: number;
  sessionPagesCompleted: number;
  activeWordCharIndex?: number | null;
  activeWordLength?: number | null;
  highlightMode?: HighlightMode;
  pageViewMode: PageViewMode;
  autoAdvancePage: boolean;
  zenMode?: boolean;
  onToggleZenMode?: () => void;
  onTogglePageViewMode: () => void;
  onToggleAutoAdvancePage: () => void;
  onToggleHighlightMode?: () => void;
  onResetSession: () => void;
  onSelectSentence: (sentenceIndex: number, pageIndex?: number) => void;
  onChangePage: (pageIndex: number) => void;
  onOpenLibrary: () => void;
  onInspectWord?: (word: string, sentence?: string) => void;
  onOpenPronunciationModal?: () => void;
  onOpenOCR?: () => void;
  onOpenSearch?: () => void;
  onOpenPageSelector?: () => void;
  onOpenLanguageSwitcher?: () => void;
  onOpenStyleModal?: () => void;
  onOpenPageNotes?: () => void;
  onOpenDeepListening?: () => void;
  onOpenConceptMemory?: () => void;
  isCurrentPageBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onTogglePlay?: () => void;
  onDeleteDocument?: (docId: string) => void;
  onChangeLineWidth?: (width: ReaderLineWidth) => void;
  onChangeFontSize?: (size: ReaderFontSize) => void;
  onChangeLineHeight?: (height: ReaderLineHeight) => void;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  document,
  currentPageIndex,
  currentSentenceIndex,
  isPlaying,
  theme,
  fontSize,
  fontFamily = 'serif',
  lineWidth = 'medium',
  lineHeight = 'comfortable',
  paragraphIndent = 'standard',
  autoScroll,
  sessionReadingSeconds,
  sessionPagesCompleted,
  activeWordCharIndex = null,
  highlightMode = 'word',
  pageViewMode = 'single',
  autoAdvancePage = true,
  zenMode = false,
  onToggleZenMode,
  onTogglePageViewMode,
  onToggleAutoAdvancePage,
  onToggleHighlightMode,
  onResetSession,
  onSelectSentence,
  onChangePage,
  onOpenLibrary,
  onInspectWord,
  onOpenPronunciationModal,
  onOpenOCR,
  onOpenSearch,
  onOpenPageSelector,
  onOpenLanguageSwitcher,
  onOpenStyleModal,
  onOpenPageNotes,
  onOpenDeepListening,
  onOpenConceptMemory,
  isCurrentPageBookmarked = false,
  onToggleBookmark,
  onTogglePlay,
  onDeleteDocument,
  onChangeLineWidth,
  onChangeFontSize,
  onChangeLineHeight,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [pageHeightMode, setPageHeightMode] = useState<'fit' | 'a4'>(() => {
    return (localStorage.getItem('pdf_tts_page_height_mode') as 'fit' | 'a4') || 'fit';
  });

  const togglePageHeightMode = () => {
    setPageHeightMode((prev) => {
      const next = prev === 'fit' ? 'a4' : 'fit';
      localStorage.setItem('pdf_tts_page_height_mode', next);
      return next;
    });
  };

  const activeSentenceRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut: Escape exits Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zenMode && onToggleZenMode) {
        onToggleZenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode, onToggleZenMode]);

  // Auto-scroll to active sentence when it changes smoothly
  useEffect(() => {
    if (autoScroll && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSentenceIndex, currentPageIndex, autoScroll, pageViewMode]);

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ไม่มีหนังสือหรือเอกสารที่เปิดอยู่
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
            เปิดไฟล์ PDF จากอุปกรณ์ของคุณ หรือเลือกบทความปรัชญา & C.G. Jung 1,000 หน้าเพื่อเริ่มอ่านทันที
          </p>
          <button
            id="open-library-empty-btn"
            onClick={onOpenLibrary}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-md active:scale-98"
          >
            เปิดคลังเอกสาร (Document Library)
          </button>
        </div>
      </div>
    );
  }

  const currentPage = document.pages[currentPageIndex] || document.pages[0];
  const totalPages = document.pages.length;

  // Typography scale classes
  const fontSizes: Record<ReaderFontSize, { text: string; leading: string }> = {
    sm: { text: 'text-base', leading: 'leading-relaxed' },
    md: { text: 'text-lg', leading: 'leading-loose' },
    lg: { text: 'text-xl', leading: 'leading-loose' },
    xl: { text: 'text-2xl', leading: 'leading-loose' },
  };

  const fontFamilies: Record<ReaderFontFamily, string> = {
    serif: 'font-serif',
    sans: 'font-sans',
    dyslexic: 'font-sans tracking-wide',
    mono: 'font-mono',
  };

  const lineHeights: Record<ReaderLineHeight, string> = {
    compact: 'leading-relaxed',
    comfortable: 'leading-loose',
    relaxed: 'leading-[2.2]',
  };

  const lineWidths: Record<ReaderLineWidth, string> = {
    narrow: 'max-w-2xl',
    medium: 'max-w-4xl',
    wide: 'max-w-6xl',
    full: 'max-w-full',
  };

  // Theme styling classes
  const themeClasses: Record<
    ReaderTheme,
    {
      bg: string;
      text: string;
      cardBg: string;
      highlight: string;
      highlightBorder: string;
      highlightBadge: string;
      hoverBg: string;
      secondaryText: string;
      wordActiveSentenceBg: string;
      activeWord: string;
    }
  > = {
    light: {
      bg: 'bg-[#f8f9fa]',
      text: 'text-slate-800',
      cardBg: 'bg-white shadow-xs border-slate-200/80',
      highlight: 'bg-amber-100/80 text-slate-900 rounded-md shadow-2xs',
      highlightBorder: 'border-b-2 border-amber-400/80',
      highlightBadge: 'bg-blue-600 text-white',
      hoverBg: 'hover:bg-slate-100/80',
      secondaryText: 'text-slate-500',
      wordActiveSentenceBg: 'bg-amber-500/10 text-slate-900 rounded-md border-b border-amber-400/50',
      activeWord: 'bg-amber-300 text-slate-950 font-medium rounded-xs shadow-xs',
    },
    sepia: {
      bg: 'bg-[#f6efe2]',
      text: 'text-[#3d2f21]',
      cardBg: 'bg-[#fffaf0] shadow-xs border-[#e6dbc8]',
      highlight: 'bg-[#ebd8b5]/85 text-[#2c1d0f] rounded-md shadow-2xs',
      highlightBorder: 'border-b-2 border-[#b88628]/70',
      highlightBadge: 'bg-[#a37941] text-white',
      hoverBg: 'hover:bg-[#f2e2c8]/60',
      secondaryText: 'text-[#7a6449]',
      wordActiveSentenceBg: 'bg-[#ebd8b5]/50 text-[#2c1d0f] rounded-md border-b border-[#c49a45]/40',
      activeWord: 'bg-[#e5c07b] text-[#24170c] font-medium rounded-xs shadow-xs',
    },
    dark: {
      bg: 'bg-[#0b0f19]',
      text: 'text-slate-200',
      cardBg: 'bg-[#151c2c] shadow-xs border-slate-800/80',
      highlight: 'bg-blue-500/15 text-slate-100 rounded-md shadow-2xs',
      highlightBorder: 'border-b-2 border-blue-400/60',
      highlightBadge: 'bg-blue-500 text-white',
      hoverBg: 'hover:bg-slate-800/60',
      secondaryText: 'text-slate-400',
      wordActiveSentenceBg: 'bg-blue-500/10 text-slate-100 rounded-md border-b border-blue-400/40',
      activeWord: 'bg-amber-400/95 text-slate-950 font-medium rounded-xs shadow-xs',
    },
    oled: {
      bg: 'bg-black',
      text: 'text-slate-200',
      cardBg: 'bg-[#0a0a0a] shadow-none border-neutral-800/90',
      highlight: 'bg-indigo-500/20 text-slate-100 rounded-md shadow-2xs',
      highlightBorder: 'border-b-2 border-indigo-400/60',
      highlightBadge: 'bg-purple-600 text-white',
      hoverBg: 'hover:bg-neutral-900/60',
      secondaryText: 'text-neutral-400',
      wordActiveSentenceBg: 'bg-indigo-500/12 text-slate-100 rounded-md border-b border-indigo-400/40',
      activeWord: 'bg-amber-400 text-black font-medium rounded-xs shadow-xs',
    },
    nord: {
      bg: 'bg-[#242933]',
      text: 'text-[#eceff4]',
      cardBg: 'bg-[#2e3440] shadow-xs border-[#434c5e]',
      highlight: 'bg-[#434c5e]/80 text-[#eceff4] rounded-md shadow-2xs',
      highlightBorder: 'border-b-2 border-[#88c0d0]/70',
      highlightBadge: 'bg-[#88c0d0] text-[#2e3440]',
      hoverBg: 'hover:bg-[#3b4252]/60',
      secondaryText: 'text-[#d8dee9]',
      wordActiveSentenceBg: 'bg-[#434c5e]/50 text-[#eceff4] rounded-md border-b border-[#88c0d0]/40',
      activeWord: 'bg-[#ebcb8b] text-[#2e3440] font-medium rounded-xs shadow-xs',
    },
  };

  const currentTheme = themeClasses[theme];
  const currentFont = fontSizes[fontSize];

  /**
   * Render words inline with pure smooth flow.
   * NO inline-block, NO scale transform, NO text jumping!
   */
  const renderSentenceContent = (sentence: string, isActive: boolean, pageIdx: number, sentenceIdx: number) => {
    // Check for Princeton Edition C.G. Jung paragraph marker like [1], [2], [145]
    const princetonMatch = sentence.match(/^\[(\d+)\]\s*(.*)$/);
    const paragraphBadge = princetonMatch ? (
      <span
        className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md mr-2 border border-amber-300/80 dark:border-amber-800/80 shadow-2xs select-none inline-block align-middle"
        title={`Princeton Edition Paragraph ${princetonMatch[1]}`}
      >
        § [{princetonMatch[1]}]
      </span>
    ) : null;

    const bodyText = princetonMatch ? princetonMatch[2] : sentence;

    if (!isActive || highlightMode !== 'word') {
      return (
        <span>
          {paragraphBadge}
          <span>{bodyText}</span>
        </span>
      );
    }

    const tokens = tokenizeSentenceWords(bodyText, document.detectedLanguage);
    const charIdx = activeWordCharIndex ?? 0;

    let activeTokenIdx = -1;
    if (isPlaying) {
      activeTokenIdx = tokens.findIndex(
        (t) => t.isWord && charIdx >= t.start && charIdx < t.end
      );
      if (activeTokenIdx === -1) {
        activeTokenIdx = tokens.findIndex((t) => t.isWord && t.start >= charIdx);
      }
      if (activeTokenIdx === -1) {
        activeTokenIdx = tokens.findIndex((t) => t.isWord);
      }
    }

    return (
      <span className="inline">
        {paragraphBadge}
        {tokens.map((token, tIdx) => {
          if (!token.isWord) {
            return <span key={tIdx}>{token.text}</span>;
          }

          const isCurrentWord = isPlaying && tIdx === activeTokenIdx;
          const isPastWord = isPlaying && activeTokenIdx !== -1 && tIdx < activeTokenIdx;

          return (
            <span
              key={tIdx}
              id={`word-${pageIdx}-${sentenceIdx}-${tIdx}`}
              onClick={(e) => {
                e.stopPropagation();
                onInspectWord?.(token.text, sentence);
              }}
              className={`inline px-1 py-0.5 rounded-sm reader-word-highlight cursor-pointer ${
                isCurrentWord
                  ? currentTheme.activeWord
                  : isPastWord
                  ? 'text-inherit opacity-90'
                  : 'hover:bg-amber-400/15 dark:hover:bg-blue-400/15'
              }`}
              title="คลิกเพื่อดู IPA, การออกเสียง และความหมาย"
            >
              {token.text}
            </span>
          );
        })}
      </span>
    );
  };

  // Determine which pages to render based on pageViewMode
  // In 'continuous' mode, render a fluid scroll of all pages or a window around current page
  const pagesToRender =
    pageViewMode === 'continuous'
      ? document.pages.slice(
          Math.max(0, currentPageIndex - 3),
          Math.min(totalPages, currentPageIndex + 7)
        )
      : [currentPage];

  return (
    <div
      ref={containerRef}
      id="document-reader-container"
      className={`flex-1 overflow-y-auto pb-36 pt-3 sm:pt-4 px-3 sm:px-6 transition-colors duration-200 ${currentTheme.bg}`}
    >
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
        {/* Subtle Document Utility Bar (Quiet, clean, uncluttered) */}
        <div className="flex items-center justify-between gap-2.5 py-1.5 px-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs text-xs flex-wrap">
          {/* LEFT: Chapter Selector & Document Meta */}
          <div className="flex items-center gap-2 min-w-0">
            {document.chapters && document.chapters.length > 0 ? (
              <select
                id="chapter-jump-select"
                value={
                  document.chapters.reduce((bestIdx, chap, idx) => {
                    return currentPageIndex >= chap.pageIndex ? idx : bestIdx;
                  }, 0)
                }
                onChange={(e) => {
                  const chapIndex = parseInt(e.target.value, 10);
                  const targetChap = document.chapters?.[chapIndex];
                  if (targetChap) {
                    onChangePage(targetChap.pageIndex);
                  }
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 cursor-pointer focus:outline-none max-w-[150px] sm:max-w-[220px] truncate ${currentTheme.text}`}
                title="Chapter Navigation"
              >
                {document.chapters.map((chap, idx) => (
                  <option key={idx} value={idx} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                    {chap.author ? `${(chap.author || '').split(' ').slice(-1)[0]}: ` : ''}{chap.title} (p.{chap.pageIndex + 1})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[200px] font-semibold">{document.name}</span>
              </div>
            )}

            {/* Scanned page indicator & quick OCR if needed */}
            {currentPage && isScannedPage(currentPage) && onOpenOCR && (
              <button
                id="open-ocr-btn"
                type="button"
                onClick={onOpenOCR}
                className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-2xs animate-pulse cursor-pointer shrink-0"
                title="Perform OCR on scanned page"
              >
                <ScanText className="w-3 h-3" />
                <span>OCR</span>
              </button>
            )}
          </div>

          {/* RIGHT: Layout & Reading Utilities */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap">
            {/* Concept Memory */}
            {onOpenConceptMemory && (
              <button
                id="open-concept-memory-btn"
                onClick={onOpenConceptMemory}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 flex items-center gap-1 cursor-pointer"
                title="Concept Memory Bank"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Concepts</span>
              </button>
            )}

            {/* Deep Listening Mode */}
            {onOpenDeepListening && (
              <button
                id="open-deep-listening-btn"
                onClick={onOpenDeepListening}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-semibold transition border border-purple-200/60 dark:border-purple-800/60 flex items-center gap-1 cursor-pointer"
                title="Distraction-Free Deep Listening Mode"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span className="hidden sm:inline">Deep Mode</span>
              </button>
            )}

            {/* Pronunciation & IPA Assistant */}
            {onOpenPronunciationModal && (
              <button
                id="open-pronunciation-btn"
                onClick={onOpenPronunciationModal}
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center gap-1 cursor-pointer"
                title="Pronunciation & IPA Assistant"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden lg:inline">IPA</span>
              </button>
            )}

            {/* Content Language Switcher */}
            {onOpenLanguageSwitcher && (
              <button
                id="open-language-switcher-btn"
                onClick={onOpenLanguageSwitcher}
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center gap-1 cursor-pointer"
                title="Content Language & Voice"
              >
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden xl:inline">{((document.detectedLanguage || 'EN').split('-')[0] || 'EN').toUpperCase()}</span>
              </button>
            )}

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            {/* Continuous vs Single Page Mode */}
            <button
              id="toggle-page-view-mode-btn"
              onClick={onTogglePageViewMode}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                pageViewMode === 'continuous'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={pageViewMode === 'continuous' ? 'Continuous Scroll Mode' : 'Single Page Mode'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{pageViewMode === 'continuous' ? 'Continuous' : 'Single'}</span>
            </button>

            {/* Word vs Sentence Highlight */}
            {onToggleHighlightMode && (
              <button
                id="toggle-highlight-mode-btn"
                onClick={onToggleHighlightMode}
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                title="Toggle Word or Sentence Highlight"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">{highlightMode === 'word' ? 'Word' : 'Sentence'}</span>
              </button>
            )}

            {/* Page fit / A4 height toggle */}
            <button
              type="button"
              onClick={togglePageHeightMode}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                pageHeightMode === 'fit'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Toggle Fit Height vs A4 Sheet Height"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{pageHeightMode === 'fit' ? 'Fit' : 'A4'}</span>
            </button>

            {/* Delete Book Button */}
            {onDeleteDocument && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                title="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Reading Canvas Pages */}
        <div className="space-y-6">
          {pagesToRender.map((page) => {
            const isActualCurrentPage = page.pageNumber - 1 === currentPageIndex;
            const actualPageIdx = page.pageNumber - 1;

            return (
              <div
                key={page.pageNumber}
                id={`reader-page-${page.pageNumber}`}
                className={`mx-auto w-full ${lineWidths[lineWidth]} ${
                  pageHeightMode === 'fit' ? 'min-h-0 sm:min-h-[280px]' : 'min-h-[297mm]'
                } ${
                  pageHeightMode === 'fit' ? 'p-5 sm:p-8 md:p-10' : 'p-6 sm:p-12 md:p-16'
                } rounded-xl sm:rounded-2xl border transition-all duration-200 relative flex flex-col justify-between shadow-xl sm:shadow-2xl ${currentTheme.cardBg} ${
                  isActualCurrentPage && pageViewMode === 'continuous'
                    ? 'ring-2 ring-blue-500/50 shadow-2xl border-blue-400 dark:border-blue-600'
                    : 'border-slate-200/90 dark:border-slate-800/80'
                }`}
              >
                {/* Chapter & Page Header */}
                <div className="mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {page.chapterTitle || `หน้า ${page.pageNumber}`}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      หน้า {page.pageNumber} จาก {totalPages}
                    </span>

                    {onToggleBookmark && isActualCurrentPage && (
                      <button
                        id="toggle-bookmark-btn"
                        type="button"
                        onClick={onToggleBookmark}
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                          isCurrentPageBookmarked
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-950/60'
                        }`}
                        title={isCurrentPageBookmarked ? 'ลบบุ๊กมาร์กหน้านี้' : 'บุ๊กมาร์กหน้านี้ (Save Page Bookmark)'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-current text-white' : 'text-amber-500'}`} />
                        <span>{isCurrentPageBookmarked ? 'บันทึกแล้ว' : 'บุ๊กมาร์กหน้า'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sentences structured Paragraph by Paragraph */}
                <div className={`space-y-5 ${fontFamilies[fontFamily]} ${currentFont.text} ${lineHeights[lineHeight]} ${currentTheme.text}`}>
                  {page.sentences.length > 0 ? (
                    (() => {
                      // Group sentences strictly respecting original page.paragraphs and bracket markers [1], [2], [145], [§12]
                      const paragraphGroups: { sentenceIdx: number; sentence: string }[][] = [];
                      let currentGroup: { sentenceIdx: number; sentence: string }[] = [];

                      const hasBracketMarkers = page.sentences.some(s => /^\s*\[§?\d+\]/.test(s) || /\[§?\d+\]/.test(s));

                      if (hasBracketMarkers) {
                        page.sentences.forEach((sentence, sIdx) => {
                          const isBracketStart = /^\s*\[§?\d+\]/.test(sentence);
                          if (isBracketStart && currentGroup.length > 0) {
                            paragraphGroups.push(currentGroup);
                            currentGroup = [];
                          }
                          currentGroup.push({ sentenceIdx: sIdx, sentence });
                        });
                        if (currentGroup.length > 0) {
                          paragraphGroups.push(currentGroup);
                        }
                      } else if (page.paragraphs && page.paragraphs.length > 0) {
                        // Align sentences with original source paragraphs extracted from PDF
                        let pIndex = 0;
                        page.sentences.forEach((sentence, sIdx) => {
                          currentGroup.push({ sentenceIdx: sIdx, sentence });
                          const currentGroupText = currentGroup.map(g => g.sentence).join(' ');
                          const targetPara = page.paragraphs[pIndex] || '';

                          if (
                            pIndex < page.paragraphs.length - 1 &&
                            targetPara.length > 0 &&
                            currentGroupText.length >= targetPara.length - 10
                          ) {
                            paragraphGroups.push(currentGroup);
                            currentGroup = [];
                            pIndex++;
                          }
                        });
                        if (currentGroup.length > 0) {
                          paragraphGroups.push(currentGroup);
                        }
                      } else {
                        page.sentences.forEach((sentence, sIdx) => {
                          currentGroup.push({ sentenceIdx: sIdx, sentence });
                          if (currentGroup.length >= 4 || sentence.length > 280) {
                            paragraphGroups.push(currentGroup);
                            currentGroup = [];
                          }
                        });
                        if (currentGroup.length > 0) {
                          paragraphGroups.push(currentGroup);
                        }
                      }

                      const indentClasses: Record<ParagraphIndent, string> = {
                        none: 'indent-0',
                        standard: 'indent-8 sm:indent-12 [text-indent:2.2em]',
                        deep: 'indent-12 sm:indent-16 [text-indent:3.8em]',
                      };

                      return paragraphGroups.map((group, pIdx) => {
                        const firstSentenceText = group[0]?.sentence ? group[0].sentence.trim() : '';
                        const isBlockQuote = /^["'«“]/.test(firstSentenceText) && group.length >= 1;

                        return (
                          <p
                            key={pIdx}
                            className={`text-justify leading-relaxed sm:leading-loose my-4 tracking-normal transition-all ${
                              isBlockQuote
                                ? 'border-l-3 border-amber-400 dark:border-amber-600 pl-4 sm:pl-6 my-5 italic bg-amber-500/5 py-2.5 rounded-r-2xl indent-0'
                                : indentClasses[paragraphIndent]
                            }`}
                          >
                            {group.map(({ sentence, sentenceIdx: sIdx }) => {
                              const isSentenceActive =
                                isActualCurrentPage && sIdx === currentSentenceIndex;
                              const isWordActive = isSentenceActive && highlightMode === 'word';
                              const isSentenceHighlightActive =
                                isSentenceActive && highlightMode === 'sentence';

                              return (
                                <span
                                  key={sIdx}
                                  ref={isSentenceActive ? activeSentenceRef : null}
                                  id={`sentence-${actualPageIdx}-${sIdx}`}
                                  onClick={() => onSelectSentence(sIdx, actualPageIdx)}
                                  className={`inline cursor-pointer rounded-md mx-0.5 reader-sentence-highlight ${
                                    isWordActive
                                      ? `${currentTheme.wordActiveSentenceBg} px-1.5 py-0.5`
                                      : isSentenceHighlightActive
                                      ? `${currentTheme.highlight} ${currentTheme.highlightBorder} px-1.5 py-0.5`
                                      : `${currentTheme.hoverBg} px-1 py-0.5`
                                  }`}
                                  title="คลิกเพื่อเริ่มอ่านจากประโยคนี้"
                                >
                                  {isSentenceActive && isPlaying && (
                                    <span className="inline-flex items-center align-middle mr-1 -mt-0.5 opacity-80">
                                      <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                                    </span>
                                  )}
                                  {renderSentenceContent(
                                    sentence,
                                    isSentenceActive,
                                    actualPageIdx,
                                    sIdx
                                  )}{' '}
                                </span>
                              );
                            })}
                          </p>
                        );
                      });
                    })()
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      หน้านี้ไม่มีข้อความ หรือเป็นภาพประกอบ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Page Bottom Navigation Hint */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 flex-wrap gap-2">
          <span>💡 คลิกที่คำหรือประโยคเพื่อฟังเสียง และคลิกคำเพื่อดู IPA & ความหมาย</span>
          <div className="flex items-center gap-3">
            {currentPageIndex > 0 && (
              <button
                id="prev-page-link"
                onClick={() => onChangePage(currentPageIndex - 1)}
                className="hover:text-blue-600 font-medium cursor-pointer"
              >
                ← หน้าก่อนหน้า
              </button>
            )}
            {currentPageIndex < totalPages - 1 && (
              <button
                id="next-page-link"
                onClick={() => onChangePage(currentPageIndex + 1)}
                className="hover:text-blue-600 font-medium cursor-pointer"
              >
                หน้าถัดไป →
              </button>
            )}
          </div>
        </div>
        {/* Floating Zen Bar when in Zen Mode */}
        {zenMode && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 px-4 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/80 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {onTogglePlay && (
              <button
                type="button"
                onClick={onTogglePlay}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md active:scale-95"
                title={isPlaying ? 'หยุดการอ่านเสียง' : 'เล่นเสียงอ่าน'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
            )}

            <div className="h-4 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => onChangePage(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex <= 0}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition"
              title="หน้าก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenPageSelector}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-blue-300 transition"
              title="คลิกเพื่อเลือกหน้า"
            >
              น. {currentPageIndex + 1} / {totalPages}
            </button>

            <button
              type="button"
              onClick={() => onChangePage(Math.min(totalPages - 1, currentPageIndex + 1))}
              disabled={currentPageIndex >= totalPages - 1}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition"
              title="หน้าถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-700" />

            {onOpenStyleModal && (
              <button
                type="button"
                onClick={onOpenStyleModal}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition"
                title="ปรับแต่งรูปแบบตัวอักษรและธีม"
              >
                <Sliders className="w-4 h-4 text-blue-400" />
              </button>
            )}

            {onOpenPageNotes && (
              <button
                type="button"
                onClick={onOpenPageNotes}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition"
                title="เปิดบันทึกย่อ"
              >
                <Bookmark className="w-4 h-4 text-amber-400" />
              </button>
            )}

            <div className="h-4 w-px bg-slate-700" />

            {onToggleZenMode && (
              <button
                type="button"
                onClick={onToggleZenMode}
                className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1 active:scale-95"
                title="ออกจาก Zen Mode (หรือกด Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Zen (Esc)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal: Delete Current Active Document */}
      {showDeleteConfirm && document && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ยืนยันการลบหนังสือเล่มนี้?
              </h3>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 max-w-xs mx-auto truncate">
                "{document.name}"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                เอกสารจำนวน {document.pageCount} หน้า พร้อมบุ๊กมาร์กและประวัติการอ่านของเล่มนี้จะถูกลบออกจากเครื่องทันที
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteDocument) onDeleteDocument(document.id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบเล่มนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
