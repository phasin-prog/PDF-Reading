import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, BookOpen, ArrowRight, FileText } from 'lucide-react';
import { DocumentItem } from '../types';

interface DocumentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  currentPageIndex: number;
  onSelectResult: (pageIndex: number, sentenceIndex: number) => void;
}

interface SearchMatch {
  pageIndex: number;
  pageNumber: number;
  sentenceIndex: number;
  sentence: string;
  matchIndex: number;
  snippetBefore: string;
  snippetMatch: string;
  snippetAfter: string;
}

export const DocumentSearchModal: React.FC<DocumentSearchModalProps> = ({
  isOpen,
  onClose,
  document,
  currentPageIndex,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 80);
    }
  }, [isOpen]);

  // Perform search across all pages and sentences
  const searchResults: SearchMatch[] = useMemo(() => {
    if (!document || !query.trim() || query.trim().length < 2) return [];

    const cleanQuery = query.trim().toLowerCase();
    const matches: SearchMatch[] = [];

    document.pages.forEach((page, pIdx) => {
      page.sentences.forEach((sentence, sIdx) => {
        const lowerSentence = sentence.toLowerCase();
        let startIndex = 0;
        let foundIdx = lowerSentence.indexOf(cleanQuery, startIndex);

        while (foundIdx !== -1 && matches.length < 200) {
          const startSnippet = Math.max(0, foundIdx - 40);
          const endSnippet = Math.min(sentence.length, foundIdx + cleanQuery.length + 50);

          matches.push({
            pageIndex: pIdx,
            pageNumber: page.pageNumber || pIdx + 1,
            sentenceIndex: sIdx,
            sentence,
            matchIndex: foundIdx,
            snippetBefore: (startSnippet > 0 ? '...' : '') + sentence.substring(startSnippet, foundIdx),
            snippetMatch: sentence.substring(foundIdx, foundIdx + cleanQuery.length),
            snippetAfter: sentence.substring(foundIdx + cleanQuery.length, endSnippet) + (endSnippet < sentence.length ? '...' : ''),
          });

          startIndex = foundIdx + cleanQuery.length;
          foundIdx = lowerSentence.indexOf(cleanQuery, startIndex);
        }
      });
    });

    return matches;
  }, [document, query]);

  // Reset active match index on query change
  useEffect(() => {
    setActiveMatchIndex(0);
  }, [query]);

  // Navigate matches with keyboard
  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + searchResults.length) % searchResults.length;
    setActiveMatchIndex(prevIdx);
    const m = searchResults[prevIdx];
    if (m) onSelectResult(m.pageIndex, m.sentenceIndex);
  };

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % searchResults.length;
    setActiveMatchIndex(nextIdx);
    const m = searchResults[nextIdx];
    if (m) onSelectResult(m.pageIndex, m.sentenceIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleJumpToMatch = (index: number) => {
    setActiveMatchIndex(index);
    const m = searchResults[index];
    if (m) {
      onSelectResult(m.pageIndex, m.sentenceIndex);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="document-search-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/70">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            id="pdf-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหาข้อความ, ปรัชญา, C.W., Jung, Archetype..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="ล้างข้อความ"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Stepper Count & Buttons */}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                {activeMatchIndex + 1}/{searchResults.length}
              </span>
              <button
                onClick={handlePrevMatch}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="ผลลัพธ์ก่อนหน้า (Shift+Enter)"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMatch}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="ผลลัพธ์ถัดไป (Enter)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="ปิดหน้าต่างค้นหา (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {query.trim().length < 2 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหาทั่วทั้งเอกสาร</p>
              <p className="text-xs mt-1 text-slate-400">เช่น "Jung", "unconscious", "shadow", "stoicism"</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm font-medium">ไม่พบผลลัพธ์ที่ตรงกับ "{query}"</p>
              <p className="text-xs mt-1">ลองใช้คำค้นหาที่สั้นลง หรือตรวจสอบตัวสะกด</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>พบทั้งหมด {searchResults.length} จุด</span>
                <span>คลิกเพื่อไปยังหน้านั้นทันที</span>
              </div>
              {searchResults.map((match, idx) => {
                const isActive = idx === activeMatchIndex;
                const isCurrentPage = match.pageIndex === currentPageIndex;

                return (
                  <div
                    key={idx}
                    onClick={() => handleJumpToMatch(idx)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-3 border ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-800'
                    }`}
                  >
                    <div className="shrink-0 flex flex-col items-center">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        น. {match.pageNumber}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {match.snippetBefore}
                        <mark className="bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-semibold px-1 rounded-xs">
                          {match.snippetMatch}
                        </mark>
                        {match.snippetAfter}
                      </p>
                    </div>

                    <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-blue-600 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                    }`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Quick Guide */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>กด <kbd className="px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Enter</kbd> เพื่อไปยังผลลัพธ์ถัดไป</span>
          <span><kbd className="px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Esc</kbd> เพื่อปิด</span>
        </div>
      </div>
    </div>
  );
};
