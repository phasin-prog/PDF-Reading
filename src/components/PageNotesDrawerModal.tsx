import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Plus,
  Trash2,
  Edit3,
  Search,
  Download,
  BookOpen,
  ChevronRight,
  Tag,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react';
import { DocumentItem, UserBookmark } from '../types';

interface PageNotesDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDoc: DocumentItem | null;
  currentPageIndex: number;
  bookmarks: UserBookmark[];
  onSaveNote: (
    pageIndex: number,
    noteText: string,
    colorTag?: 'yellow' | 'blue' | 'green' | 'purple' | 'red'
  ) => void;
  onDeleteBookmark: (id: string) => void;
  onSelectPage: (pageIndex: number) => void;
}

export const PageNotesDrawerModal: React.FC<PageNotesDrawerModalProps> = ({
  isOpen,
  onClose,
  currentDoc,
  currentPageIndex,
  bookmarks,
  onSaveNote,
  onDeleteBookmark,
  onSelectPage,
}) => {
  const [noteInput, setNoteInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<'yellow' | 'blue' | 'green' | 'purple' | 'red'>('yellow');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);

  if (!isOpen || !currentDoc) return null;

  // Bookmarks for current document
  const docBookmarks = bookmarks.filter((b) => b.documentId === currentDoc.id);

  // Existing bookmark on current page
  const currentPageBookmark = docBookmarks.find((b) => b.pageIndex === currentPageIndex);

  const tagColors: Record<'yellow' | 'blue' | 'green' | 'purple' | 'red', { bg: string; border: string; text: string; badge: string; name: string }> = {
    yellow: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-200', badge: 'bg-amber-500', name: '🟡 สำคัญ / ประเด็นหลัก' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-200', badge: 'bg-blue-500', name: '🔵 แนวคิดปรัชญา' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-200', badge: 'bg-emerald-500', name: '🟢 โควทคำคม' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-300 dark:border-purple-800', text: 'text-purple-900 dark:text-purple-200', badge: 'bg-purple-500', name: '🟣 คำถาม / วิจัยต่อ' },
    red: { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-900 dark:text-rose-200', badge: 'bg-rose-500', name: '🔴 จุดสังเกตวิพากษ์' },
  };

  const handleSaveCurrentPageNote = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNote(currentPageIndex, noteInput, selectedTag);
    setNoteInput('');
  };

  const handleStartEdit = (bm: UserBookmark) => {
    setEditingBookmarkId(bm.id);
    setNoteInput(bm.note || '');
    if (bm.colorTag) setSelectedTag(bm.colorTag);
  };

  const handleExportNotesMarkdown = () => {
    if (docBookmarks.length === 0) return;

    let md = `# บันทึกการอ่าน (Reading Notes & Bookmarks)\n`;
    md += `**หนังสือ:** ${currentDoc.name}\n`;
    md += `**ผู้เขียน:** ${currentDoc.author || 'ไม่ระบุ'}\n`;
    md += `**วันที่บันทึก:** ${new Date().toLocaleDateString('th-TH')}\n`;
    md += `**จำนวนบันทึก:** ${docBookmarks.length} หน้า\n\n`;
    md += `---\n\n`;

    docBookmarks
      .sort((a, b) => a.pageIndex - b.pageIndex)
      .forEach((bm) => {
        md += `## 📌 หน้า ${bm.pageNumber} ${bm.chapterTitle ? `(${bm.chapterTitle})` : ''}\n`;
        if (bm.colorTag) {
          md += `**หมวดหมู่:** ${tagColors[bm.colorTag].name}\n`;
        }
        if (bm.note) {
          md += `**บันทึกย่อ:** ${bm.note}\n`;
        }
        md += `> "${bm.snippet}"\n\n`;
      });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${currentDoc.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered list
  const filteredBookmarks = docBookmarks.filter((bm) => {
    if (filterTag !== 'all' && bm.colorTag !== filterTag) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = bm.note && bm.note.toLowerCase().includes(q);
      const matchSnippet = bm.snippet.toLowerCase().includes(q);
      const matchPage = bm.pageNumber.toString().includes(q);
      return matchNote || matchSnippet || matchPage;
    }
    return true;
  });

  return (
    <div
      id="page-notes-overlay"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                บันทึกย่อ & บุ๊กมาร์ก (Page Notes)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentDoc.name} ({docBookmarks.length} หน้าที่มีบันทึก)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Note Form for Current Page */}
        <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-600" />
              <span>จดบันทึกสำหรับหน้าที่ {currentPageIndex + 1}</span>
            </span>
            {currentPageBookmark && (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                มีบันทึกแล้ว
              </span>
            )}
          </div>

          <form onSubmit={handleSaveCurrentPageNote} className="space-y-3">
            <textarea
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="พิมพ์ข้อความบันทึกย่อ ข้อสรุปปรัชญา หรือคำถามสำหรับหน้านี้..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
            />

            {/* Tag Selection */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {(['yellow', 'blue', 'green', 'purple', 'red'] as const).map((tagKey) => (
                  <button
                    key={tagKey}
                    type="button"
                    onClick={() => setSelectedTag(tagKey)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition ${tagColors[tagKey].badge} ${
                      selectedTag === tagKey ? 'ring-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={tagColors[tagKey].name}
                  >
                    {selectedTag === tagKey && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>บันทึกหน้านี้</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search & Export Toolbar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาข้อความบันทึก..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <button
            onClick={handleExportNotesMarkdown}
            disabled={docBookmarks.length === 0}
            className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition flex items-center gap-1 shrink-0 disabled:opacity-40"
            title="ส่งออกบันทึกทั้งหมดเป็นไฟล์ Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Export MD</span>
          </button>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          {filteredBookmarks.map((bm) => {
            const isCurrent = bm.pageIndex === currentPageIndex;
            const tagStyle = bm.colorTag ? tagColors[bm.colorTag] : tagColors.yellow;

            return (
              <div
                key={bm.id}
                id={`bookmark-card-${bm.id}`}
                className={`p-3.5 rounded-2xl border transition relative group flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 shadow-sm ring-1 ring-amber-400/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                {/* Card Top */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectPage(bm.pageIndex);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-mono font-bold text-xs hover:bg-amber-600 transition flex items-center gap-1"
                    >
                      <span>หน้า {bm.pageNumber}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>

                    {bm.chapterTitle && (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[160px]">
                        {bm.chapterTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(bm)}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="แก้ไขบันทึกย่อ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="ลบบุ๊กมาร์กนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* User Note if exists */}
                {bm.note && (
                  <div className={`p-2.5 rounded-xl border text-xs font-medium mb-2 ${tagStyle.bg} ${tagStyle.border} ${tagStyle.text}`}>
                    <p className="whitespace-pre-wrap">{bm.note}</p>
                  </div>
                )}

                {/* Text Snippet Preview */}
                <p
                  onClick={() => {
                    onSelectPage(bm.pageIndex);
                    onClose();
                  }}
                  className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 italic cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition"
                >
                  "{bm.snippet}"
                </p>

                {/* Bottom Timestamp */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>บันทึกเมื่อ {new Date(bm.createdAt).toLocaleDateString('th-TH')}</span>
                  {bm.colorTag && (
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      {tagStyle.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredBookmarks.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">ยังไม่มีบันทึกหรือบุ๊กมาร์กสำหรับเอกสารนี้</p>
              <p className="text-xs text-slate-500 mt-1">พิมพ์บันทึกย่อด้านบนแล้วกด "บันทึกหน้านี้" ได้ทันที</p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>รวม {docBookmarks.length} บันทึก</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
