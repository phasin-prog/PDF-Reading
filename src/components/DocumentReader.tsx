import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Layers,
  Zap,
  Globe,
  Bookmark,
  Sliders,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Trash2,
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
  activeWordCharIndex = null,
  highlightMode = 'word',
  pageViewMode = 'single',
  zenMode = false,
  onToggleZenMode,
  onTogglePageViewMode,
  onToggleHighlightMode,
  onSelectSentence,
  onChangePage,
  onOpenLibrary,
  onInspectWord,
  onOpenPronunciationModal,
  onOpenOCR,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zenMode && onToggleZenMode) {
        onToggleZenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode, onToggleZenMode]);

  useEffect(() => {
    if (autoScroll && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSentenceIndex, currentPageIndex, autoScroll, pageViewMode]);

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full p-8 rounded-xl border border-[var(--line)] bg-[var(--surface)]">
          <BookOpen className="w-6 h-6 text-[var(--ink-3)] mx-auto mb-4" />
          <h2 className="text-base font-semibold">ไม่มีเอกสารที่เปิดอยู่</h2>
          <p className="text-sm text-[var(--ink-2)] mt-1.5 mb-6">
            เปิดไฟล์ PDF จากอุปกรณ์ของคุณ หรือเลือกจากคลังเพื่อเริ่มอ่าน
          </p>
          <button
            id="open-library-empty-btn"
            onClick={onOpenLibrary}
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--ink)] text-[var(--paper)] font-medium text-sm transition hover:opacity-85 active:scale-[0.98] cursor-pointer"
          >
            เปิดคลังเอกสาร
          </button>
        </div>
      </div>
    );
  }

  const currentPage = document.pages[currentPageIndex] || document.pages[0];
  const totalPages = document.pages.length;

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

  const themeClasses: Record<
    ReaderTheme,
    { bg: string; text: string; card: string; secondary: string; hover: string; sentence: string; word: string }
  > = {
    light: {
      bg: 'bg-[var(--paper)]',
      text: 'text-[var(--ink)]',
      card: 'bg-[var(--surface)] border-[var(--line)]',
      secondary: 'text-[var(--ink-2)]',
      hover: 'hover:bg-[var(--surface-2)]',
      sentence: 'bg-[#f5efdc]',
      word: 'bg-[#e8c547] text-[#18181b]',
    },
    sepia: {
      bg: 'bg-[#f6efe2]',
      text: 'text-[#3d2f21]',
      card: 'bg-[#fffaf0] border-[#e6dbc8]',
      secondary: 'text-[#7a6449]',
      hover: 'hover:bg-[#f2e2c8]',
      sentence: 'bg-[#efe0c3]',
      word: 'bg-[#ddb45e] text-[#24170c]',
    },
    dark: {
      bg: 'bg-[var(--paper)]',
      text: 'text-[var(--ink)]',
      card: 'bg-[var(--surface)] border-[var(--line)]',
      secondary: 'text-[var(--ink-2)]',
      hover: 'hover:bg-[var(--surface-2)]',
      sentence: 'bg-white/[0.07]',
      word: 'bg-[#e8c547] text-[#18181b]',
    },
    oled: {
      bg: 'bg-black',
      text: 'text-neutral-200',
      card: 'bg-[#0a0a0a] border-neutral-800',
      secondary: 'text-neutral-400',
      hover: 'hover:bg-neutral-900',
      sentence: 'bg-white/[0.08]',
      word: 'bg-[#e8c547] text-black',
    },
    nord: {
      bg: 'bg-[#242933]',
      text: 'text-[#eceff4]',
      card: 'bg-[#2e3440] border-[#434c5e]',
      secondary: 'text-[#b8c0cf]',
      hover: 'hover:bg-[#3b4252]',
      sentence: 'bg-white/[0.07]',
      word: 'bg-[#ebcb8b] text-[#2e3440]',
    },
  };

  const currentTheme = themeClasses[theme];
  const currentFont = fontSizes[fontSize];

  const renderSentenceContent = (sentence: string, isActive: boolean, pageIdx: number, sentenceIdx: number) => {
    const princetonMatch = sentence.match(/^\[(\d+)\]\s*(.*)$/);
    const paragraphBadge = princetonMatch ? (
      <span
        className="font-mono text-xs text-[var(--ink-3)] mr-2 select-none"
        title={`Paragraph ${princetonMatch[1]}`}
      >
        [{princetonMatch[1]}]
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
      activeTokenIdx = tokens.findIndex((t) => t.isWord && charIdx >= t.start && charIdx < t.end);
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
          return (
            <span
              key={tIdx}
              id={`word-${pageIdx}-${sentenceIdx}-${tIdx}`}
              onClick={(e) => {
                e.stopPropagation();
                onInspectWord?.(token.text, sentence);
              }}
              className={`rounded-sm reader-word-highlight cursor-pointer ${
                isCurrentWord ? currentTheme.word : 'hover:underline underline-offset-4'
              }`}
              title="ดูการออกเสียงและความหมาย"
            >
              {token.text}
            </span>
          );
        })}
      </span>
    );
  };

  const pagesToRender =
    pageViewMode === 'continuous'
      ? document.pages.slice(Math.max(0, currentPageIndex - 3), Math.min(totalPages, currentPageIndex + 7))
      : [currentPage];

  const toolBtn =
    'p-1.5 rounded-md text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] text-xs font-medium transition flex items-center gap-1 cursor-pointer';

  return (
    <div
      ref={containerRef}
      id="document-reader-container"
      className={`flex-1 overflow-y-auto pb-36 pt-4 px-4 sm:px-6 ${currentTheme.bg}`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-2 pb-3 mb-5 border-b border-[var(--line)] text-[13px] flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {document.chapters && document.chapters.length > 0 ? (
              <select
                id="chapter-jump-select"
                value={document.chapters.reduce((bestIdx, chap, idx) => {
                  return currentPageIndex >= chap.pageIndex ? idx : bestIdx;
                }, 0)}
                onChange={(e) => {
                  const targetChap = document.chapters?.[parseInt(e.target.value, 10)];
                  if (targetChap) onChangePage(targetChap.pageIndex);
                }}
                className="px-2 py-1 text-[13px] rounded-md bg-transparent border border-[var(--line)] cursor-pointer focus:outline-none max-w-[220px] truncate"
                title="Chapter"
              >
                {document.chapters.map((chap, idx) => (
                  <option key={idx} value={idx}>
                    {chap.author ? `${(chap.author || '').split(' ').slice(-1)[0]}: ` : ''}{chap.title} (p.{chap.pageIndex + 1})
                  </option>
                ))}
              </select>
            ) : (
              <span className="flex items-center gap-1.5 text-[var(--ink-2)]">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[200px] font-medium">{document.name}</span>
              </span>
            )}
            {currentPage && isScannedPage(currentPage) && onOpenOCR && (
              <button
                id="open-ocr-btn"
                type="button"
                onClick={onOpenOCR}
                className="px-2 py-0.5 rounded-md border border-[var(--line)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition flex items-center gap-1 cursor-pointer shrink-0"
                title="OCR หน้านี้"
              >
                <ScanText className="w-3 h-3" />
                <span>OCR</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0 flex-wrap">
            {onOpenConceptMemory && (
              <button id="open-concept-memory-btn" onClick={onOpenConceptMemory} className={toolBtn} title="Concept memory">
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Concepts</span>
              </button>
            )}
            {onOpenDeepListening && (
              <button id="open-deep-listening-btn" onClick={onOpenDeepListening} className={toolBtn} title="Deep listening">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deep</span>
              </button>
            )}
            {onOpenPronunciationModal && (
              <button id="open-pronunciation-btn" onClick={onOpenPronunciationModal} className={toolBtn} title="Pronunciation">
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">IPA</span>
              </button>
            )}
            {onOpenLanguageSwitcher && (
              <button id="open-language-switcher-btn" onClick={onOpenLanguageSwitcher} className={toolBtn} title="Language">
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden xl:inline font-mono">
                  {((document.detectedLanguage || 'EN').split('-')[0] || 'EN').toUpperCase()}
                </span>
              </button>
            )}
            <button
              id="toggle-page-view-mode-btn"
              onClick={onTogglePageViewMode}
              className={toolBtn}
              title={pageViewMode === 'continuous' ? 'Continuous scroll' : 'Single page'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{pageViewMode === 'continuous' ? 'Continuous' : 'Single'}</span>
            </button>
            {onToggleHighlightMode && (
              <button
                id="toggle-highlight-mode-btn"
                onClick={onToggleHighlightMode}
                className={toolBtn}
                title="Word / sentence highlight"
              >
                <span className="hidden md:inline font-mono text-[11px]">{highlightMode === 'word' ? 'Word' : 'Sent'}</span>
              </button>
            )}
            <button type="button" onClick={togglePageHeightMode} className={toolBtn} title="Fit / A4 height">
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline font-mono text-[11px]">{pageHeightMode === 'fit' ? 'Fit' : 'A4'}</span>
            </button>
            {onDeleteDocument && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-md text-[var(--ink-3)] hover:text-[var(--danger)] transition cursor-pointer shrink-0"
                title="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {pagesToRender.map((page) => {
            const isActualCurrentPage = page.pageNumber - 1 === currentPageIndex;
            const actualPageIdx = page.pageNumber - 1;

            return (
              <article
                key={page.pageNumber}
                id={`reader-page-${page.pageNumber}`}
                className={`mx-auto w-full ${lineWidths[lineWidth]} ${
                  pageHeightMode === 'fit' ? '' : 'min-h-[250mm]'
                } px-1 sm:px-2 py-2 rounded-xl border transition-colors ${
                  isActualCurrentPage && pageViewMode === 'continuous'
                    ? 'border-[var(--ink-3)]'
                    : `${currentTheme.card}`
                } ${pageViewMode === 'continuous' ? 'px-4 sm:px-6 py-6' : 'border-transparent'}`}
              >
                <div className="mb-5 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-widest text-[var(--ink-3)]">
                    {page.chapterTitle || `Page ${page.pageNumber}`}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--ink-3)]">
                      {page.pageNumber}/{totalPages}
                    </span>
                    {onToggleBookmark && isActualCurrentPage && (
                      <button
                        id="toggle-bookmark-btn"
                        type="button"
                        onClick={onToggleBookmark}
                        className={`text-xs flex items-center gap-1 transition cursor-pointer ${
                          isCurrentPageBookmarked ? 'text-[var(--ink)] font-semibold' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                        }`}
                        title={isCurrentPageBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-current' : ''}`} />
                        <span>{isCurrentPageBookmarked ? 'Saved' : 'Save'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className={`${fontFamilies[fontFamily]} ${currentFont.text} ${lineHeights[lineHeight]} ${currentTheme.text}`}>
                  {page.sentences.length > 0 ? (
                    (() => {
                      const paragraphGroups: { sentenceIdx: number; sentence: string }[][] = [];
                      let currentGroup: { sentenceIdx: number; sentence: string }[] = [];

                      const hasBracketMarkers = page.sentences.some((s) => /^\s*\[§?\d+\]/.test(s) || /\[§?\d+\]/.test(s));

                      if (hasBracketMarkers) {
                        page.sentences.forEach((sentence, sIdx) => {
                          const isBracketStart = /^\s*\[§?\d+\]/.test(sentence);
                          if (isBracketStart && currentGroup.length > 0) {
                            paragraphGroups.push(currentGroup);
                            currentGroup = [];
                          }
                          currentGroup.push({ sentenceIdx: sIdx, sentence });
                        });
                        if (currentGroup.length > 0) paragraphGroups.push(currentGroup);
                      } else if (page.paragraphs && page.paragraphs.length > 0) {
                        let pIndex = 0;
                        page.sentences.forEach((sentence, sIdx) => {
                          currentGroup.push({ sentenceIdx: sIdx, sentence });
                          const currentGroupText = currentGroup.map((g) => g.sentence).join(' ');
                          const targetPara = page.paragraphs[pIndex] || '';
                          if (pIndex < page.paragraphs.length - 1 && targetPara.length > 0 && currentGroupText.length >= targetPara.length - 10) {
                            paragraphGroups.push(currentGroup);
                            currentGroup = [];
                            pIndex++;
                          }
                        });
                        if (currentGroup.length > 0) paragraphGroups.push(currentGroup);
                      } else {
                        page.sentences.forEach((sentence, sIdx) => {
                          currentGroup.push({ sentenceIdx: sIdx, sentence });
                          if (currentGroup.length >= 4 || sentence.length > 280) {
                            paragraphGroups.push(currentGroup);
                            currentGroup = [];
                          }
                        });
                        if (currentGroup.length > 0) paragraphGroups.push(currentGroup);
                      }

                      const indentClasses: Record<ParagraphIndent, string> = {
                        none: '',
                        standard: 'indent-8',
                        deep: 'indent-12',
                      };

                      return paragraphGroups.map((group, pIdx) => {
                        const firstSentenceText = group[0]?.sentence ? group[0].sentence.trim() : '';
                        const isBlockQuote = /^["'«“]/.test(firstSentenceText);

                        return (
                          <p
                            key={pIdx}
                            className={`text-justify my-5 ${
                              isBlockQuote
                                ? 'border-l-2 border-[var(--line)] pl-5 italic indent-0'
                                : pIdx === 0
                                  ? 'indent-0'
                                  : indentClasses[paragraphIndent]
                            }`}
                          >
                            {group.map(({ sentence, sentenceIdx: sIdx }) => {
                              const isSentenceActive = isActualCurrentPage && sIdx === currentSentenceIndex;
                              const isWordActive = isSentenceActive && highlightMode === 'word';
                              const isSentenceHighlightActive = isSentenceActive && highlightMode === 'sentence';

                              return (
                                <span
                                  key={sIdx}
                                  ref={isSentenceActive ? activeSentenceRef : null}
                                  id={`sentence-${actualPageIdx}-${sIdx}`}
                                  onClick={() => onSelectSentence(sIdx, actualPageIdx)}
                                  className={`cursor-pointer rounded reader-sentence-highlight ${
                                    isWordActive || isSentenceHighlightActive ? `${currentTheme.sentence} px-1` : ''
                                  }`}
                                  title="อ่านจากประโยคนี้"
                                >
                                  {renderSentenceContent(sentence, isSentenceActive, actualPageIdx, sIdx)}{' '}
                                </span>
                              );
                            })}
                          </p>
                        );
                      });
                    })()
                  ) : (
                    <div className="text-center py-10 text-[var(--ink-3)] text-sm">หน้านี้ไม่มีข้อความ</div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="pt-6 flex items-center justify-between text-[13px] text-[var(--ink-3)]">
          <span>คลิกประโยคเพื่อเริ่มฟังจากตรงนั้น · คลิกคำเพื่อดูความหมาย</span>
          <div className="flex items-center gap-4">
            {currentPageIndex > 0 && (
              <button id="prev-page-link" onClick={() => onChangePage(currentPageIndex - 1)} className="hover:text-[var(--ink)] cursor-pointer">
                ← Prev
              </button>
            )}
            {currentPageIndex < totalPages - 1 && (
              <button id="next-page-link" onClick={() => onChangePage(currentPageIndex + 1)} className="hover:text-[var(--ink)] cursor-pointer">
                Next →
              </button>
            )}
          </div>
        </div>

        {zenMode && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] shadow-xl">
            {onTogglePlay && (
              <button
                type="button"
                onClick={onTogglePlay}
                className="w-9 h-9 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center transition hover:opacity-85 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => onChangePage(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex <= 0}
              className="p-2 rounded-full text-[var(--ink-2)] hover:bg-[var(--surface-2)] disabled:opacity-30 transition cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenPageSelector}
              className="px-2 text-xs font-mono text-[var(--ink-2)] hover:text-[var(--ink)] transition cursor-pointer"
              title="Pages"
            >
              {currentPageIndex + 1}/{totalPages}
            </button>
            <button
              type="button"
              onClick={() => onChangePage(Math.min(totalPages - 1, currentPageIndex + 1))}
              disabled={currentPageIndex >= totalPages - 1}
              className="p-2 rounded-full text-[var(--ink-2)] hover:bg-[var(--surface-2)] disabled:opacity-30 transition cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {onToggleZenMode && (
              <button
                type="button"
                onClick={onToggleZenMode}
                className="p-2 rounded-full text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                title="Exit zen (Esc)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirm && document && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm p-6 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-xl">
            <h3 className="text-[15px] font-semibold">ลบ “{document.name}”?</h3>
            <p className="text-[13px] text-[var(--ink-2)] mt-1.5">
              {document.pageCount} หน้า พร้อมบุ๊กมาร์กและประวัติการอ่านจะหายไปจากเครื่อง
            </p>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-[var(--line)] text-sm font-medium hover:bg-[var(--surface-2)] transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteDocument) onDeleteDocument(document.id);
                }}
                className="flex-1 py-2 rounded-lg bg-[var(--danger)] text-white text-sm font-medium hover:opacity-90 transition cursor-pointer"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
