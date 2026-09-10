import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Search,
  Grid,
  List,
  Sliders,
  Bookmark,
} from 'lucide-react';
import { DocumentItem } from '../types';

interface PageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  currentPageIndex: number;
  onSelectPage: (pageIndex: number) => void;
}

export const PageSelectorModal: React.FC<PageSelectorModalProps> = ({
  isOpen,
  onClose,
  document,
  currentPageIndex,
  onSelectPage,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | 'all'>('all');
  const [sliderValue, setSliderValue] = useState<number>(currentPageIndex + 1);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSliderValue(currentPageIndex + 1);
      setJumpPageInput((currentPageIndex + 1).toString());
    }
  }, [isOpen, currentPageIndex]);

  const totalPages = document?.pages.length || 0;

  // Filter pages
  const filteredPages = useMemo(() => {
    if (!document) return [];

    return document.pages.filter((page, pIdx) => {
      // Chapter filter
      if (selectedChapterIdx !== 'all' && document.chapters) {
        const targetChapter = document.chapters[selectedChapterIdx];
        const nextChapter = document.chapters[selectedChapterIdx + 1];
        const minPage = targetChapter.pageIndex;
        const maxPage = nextChapter ? nextChapter.pageIndex - 1 : totalPages - 1;
        if (pIdx < minPage || pIdx > maxPage) {
          return false;
        }
      }

      // Text / Number search
      if (filterQuery.trim()) {
        const q = filterQuery.trim().toLowerCase();
        const pageNumMatch = (page.pageNumber || pIdx + 1).toString() === q;
        const textMatch = page.sentences.some((s) => s.toLowerCase().includes(q));
        const chapMatch = page.chapterTitle && page.chapterTitle.toLowerCase().includes(q);
        return pageNumMatch || textMatch || chapMatch;
      }

      return true;
    });
  }, [document, selectedChapterIdx, filterQuery, totalPages]);

  const handleJumpFromInput = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(jumpPageInput, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      onSelectPage(val - 1);
      onClose();
    }
  };

  const handleSliderCommit = () => {
    if (sliderValue >= 1 && sliderValue <= totalPages) {
      onSelectPage(sliderValue - 1);
      onClose();
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div
      id="page-selector-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                เลือกหน้าเอกสาร (PDF Page Selector)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เอกสารทั้งหมด {totalPages} หน้า • กำลังอ่านหน้าที่ {currentPageIndex + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewLayout === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="มุมมองแบบตาราง (Grid Thumbnails)"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewLayout === 'list'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="มุมมองแบบรายการ (List View)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="ปิดหน้าต่าง (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Slider & Direct Page Jump Bar */}
        <div className="p-3 sm:p-4 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Fast Scrubber Slider */}
          <div className="w-full sm:flex-1 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              เลื่อนหน้าเร็ว:
            </span>
            <input
              type="range"
              min={1}
              max={totalPages}
              value={sliderValue}
              onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
              onMouseUp={handleSliderCommit}
              onTouchEnd={handleSliderCommit}
              className="flex-1 accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 shrink-0">
              น. {sliderValue} / {totalPages}
            </span>
          </div>

          {/* Jump Form */}
          <form onSubmit={handleJumpFromInput} className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-600 dark:text-slate-400">ไปที่หน้า:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              className="w-16 px-2 py-1 text-xs font-bold text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95"
            >
              ไปทันที
            </button>
          </form>
        </div>

        {/* Filter and Chapter selection bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="กรองตามเลขหน้า หรือค้นเนื้อหาบนหน้า..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Chapter pills if available */}
          {document.chapters && document.chapters.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
              <button
                onClick={() => setSelectedChapterIdx('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition ${
                  selectedChapterIdx === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ทุกบท ({totalPages})
              </button>
              {document.chapters.slice(0, 8).map((chap, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedChapterIdx(idx)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1 ${
                    selectedChapterIdx === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Bookmark className="w-3 h-3 text-blue-400" />
                  <span>{chap.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Page Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/40"
        >
          {viewLayout === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredPages.map((page) => {
                const pageIdx = (page.pageNumber || 1) - 1;
                const isCurrent = pageIdx === currentPageIndex;
                const previewSentence = page.sentences[0] || '';

                return (
                  <div
                    key={pageIdx}
                    id={`page-thumbnail-${pageIdx}`}
                    onClick={() => {
                      onSelectPage(pageIdx);
                      onClose();
                    }}
                    className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between aspect-3/4 ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 dark:border-blue-400 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                    }`}
                  >
                    {/* Top page badge */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50'
                      }`}>
                        หน้า {page.pageNumber || pageIdx + 1}
                      </span>
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-md">
                          กำลังอ่าน
                        </span>
                      )}
                    </div>

                    {/* Page Snippet Preview */}
                    <div className="flex-1 overflow-hidden">
                      {page.chapterTitle && (
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate mb-1">
                          {page.chapterTitle}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-6 leading-relaxed">
                        {previewSentence}
                      </p>
                    </div>

                    {/* Bottom stats */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{page.sentences.length} ประโยค</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-blue-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredPages.map((page) => {
                const pageIdx = (page.pageNumber || 1) - 1;
                const isCurrent = pageIdx === currentPageIndex;

                return (
                  <div
                    key={pageIdx}
                    onClick={() => {
                      onSelectPage(pageIdx);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-16 px-2 py-1 rounded-lg text-xs font-bold font-mono text-center shrink-0 ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        หน้า {page.pageNumber || pageIdx + 1}
                      </span>
                      <div className="min-w-0">
                        {page.chapterTitle && (
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {page.chapterTitle}
                          </div>
                        )}
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-xl">
                          {page.sentences[0]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">{page.sentences.length} ประโยค</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredPages.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">ไม่พบหน้าที่ตรงกับการค้นหา "{filterQuery}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>แสดง {filteredPages.length} จาก {totalPages} หน้า</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition font-medium"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
