import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Play,
  Search,
  X,
  Clock,
  Sparkles,
  BookOpen,
  WifiOff,
  Globe,
  Loader2,
  Bookmark,
  ExternalLink,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { DocumentItem, UserBookmark } from '../types';
import {
  SAMPLE_DOCUMENTS,
  createDocumentFromSample,
  parsePdfArrayBuffer,
} from '../services/pdfService';
import {
  saveDocument,
  savePdfBuffer,
  deleteDocument,
  deleteAllDocuments,
  getUserBookmarks,
  deleteUserBookmark,
} from '../services/storage';

interface DocumentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  currentDocId: string | null;
  onSelectDocument: (doc: DocumentItem, targetPageIndex?: number) => void;
  onRefreshDocuments: () => Promise<void>;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  isOpen,
  onClose,
  documents,
  currentDocId,
  onSelectDocument,
  onRefreshDocuments,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'bookmarks' | 'samples'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string>('');
  const [parseProgress, setParseProgress] = useState<{ page: number; total: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>([]);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBookmarks(getUserBookmarks());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please select a valid .PDF document');
      return;
    }

    try {
      setIsParsing(true);
      setParseProgress(null);
      setParseStatus(`Extracting text and pages from "${file.name}"...`);
      const arrayBuffer = await file.arrayBuffer();
      const newDoc = await parsePdfArrayBuffer(arrayBuffer, file.name, file.size, (page, total) => {
        setParseProgress({ page, total });
        setParseStatus(`Reading page ${page} of ${total}...`);
      });
      setParseStatus('Saving to offline storage...');
      await saveDocument(newDoc);
      await savePdfBuffer(newDoc.id, arrayBuffer);
      await onRefreshDocuments();
      onSelectDocument(newDoc);
      onClose();
    } catch (err) {
      console.error('Failed to parse PDF:', err);
      alert(`Could not parse PDF file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
      setParseStatus('');
      setParseProgress(null);
    }
  };

  const handleLoadSample = async (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    try {
      setIsParsing(true);
      setParseStatus(`Loading "${sample.name}" (${sample.langLabel})...`);
      const newDoc = createDocumentFromSample(sample);
      await saveDocument(newDoc);
      await onRefreshDocuments();
      onSelectDocument(newDoc);
      onClose();
    } catch (err) {
      console.error('Failed to load sample:', err);
    } finally {
      setIsParsing(false);
      setParseStatus('');
    }
  };

  const handleDelete = (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    setDocToDelete(doc);
  };

  const filteredDocs = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.detectedLanguage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="document-library-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header & Tabs */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Document Library & Bookmarks
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage offline PDFs, saved bookmarks, and preloaded literature samples.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              id="tab-library"
              type="button"
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'library'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>เอกสารทั้งหมด ({documents.length})</span>
            </button>

            <button
              id="tab-bookmarks"
              type="button"
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'bookmarks'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4 fill-amber-500/20 text-amber-500" />
              <span>บุ๊กมาร์ก ({bookmarks.length})</span>
              {bookmarks.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                  {bookmarks.length}
                </span>
              )}
            </button>

            <button
              id="tab-samples"
              type="button"
              onClick={() => setActiveTab('samples')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'samples'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ตัวอย่างปรัชญา & C.G. Jung</span>
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: ALL DOCUMENTS & PDF UPLOAD */}
          {activeTab === 'library' && (
            <>
              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />

                {isParsing ? (
                  <div className="flex flex-col items-center justify-center py-2 space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {parseStatus}
                    </p>
                    {parseProgress && parseProgress.total > 0 && (
                      <div className="w-full max-w-sm">
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-150"
                            style={{ width: `${Math.round((parseProgress.page / parseProgress.total) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs font-mono text-slate-500 mt-1.5">
                          {parseProgress.page}/{parseProgress.total} pages (
                          {Math.round((parseProgress.page / parseProgress.total) * 100)}%)
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-slate-500">
                      Parsing and tokenizing sentences for high clarity offline TTS...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      ลากไฟล์ PDF มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                      ระบบจะสกัดข้อความ จัดเรียงย่อหน้า และเก็บไว้ในตัวเครื่อง ปลอดภัย ทำงานแบบออฟไลน์ได้ 100%
                    </p>
                  </div>
                )}
              </div>

              {/* Document Search & List */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      รายการเอกสารของคุณ ({documents.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {documents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteAllModal(true)}
                        className="px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/80 rounded-lg border border-rose-200/80 dark:border-rose-900/80 flex items-center gap-1 transition cursor-pointer"
                        title="ลบหนังสือทั้งหมดออกจากคลัง"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบทั้งหมด</span>
                      </button>
                    )}

                    {documents.length > 1 && (
                      <div className="relative w-40 sm:w-48">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ค้นหาชื่อเอกสาร..."
                          className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {filteredDocs.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-500">
                      {searchQuery ? 'ไม่พบเอกสารที่ค้นหา' : 'ยังไม่มีเอกสารในคลัง คุณลบหนังสือหมดแล้ว หรือยังไม่ได้เพิ่มไฟล์'}
                    </p>
                    {!searchQuery && (
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>อัปโหลด PDF ใหม่</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            localStorage.removeItem('pdf_tts_library_cleared');
                            await onRefreshDocuments();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>คืนค่าตัวอย่างหนังสือ</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDocs.map((doc) => {
                      const isCurrent = doc.id === currentDocId;
                      const progressPct = doc.pageCount > 0
                        ? Math.round(((doc.readingProgress.pageIndex + 1) / doc.pageCount) * 100)
                        : 0;

                      return (
                        <div
                          key={doc.id}
                          id={`doc-card-${doc.id}`}
                          onClick={() => {
                            onSelectDocument(doc);
                            onClose();
                          }}
                          className={`group flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600'
                              : 'bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                                isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600'
                              }`}
                            >
                              <FileText className="w-5 h-5" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {doc.name}
                                </span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {((doc.detectedLanguage || 'EN').split('-')[0] || 'EN').toUpperCase()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                <span>{doc.pageCount} หน้า</span>
                                <span>•</span>
                                <span>{doc.totalWords.toLocaleString()} คำ</span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  ~{doc.estimatedMinutes} นาที
                                </span>
                                <span>•</span>
                                <span>อ่านแล้ว {progressPct}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectDocument(doc);
                                onClose();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isCurrent ? 'กำลังอ่าน' : 'เปิดอ่าน'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, doc)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                              title="ลบหนังสือเล่มนี้ออกจากเครื่อง"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: BOOKMARKS TAB */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>หน้าที่บันทึกไว้ (Saved Bookmarks)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    เข้าถึงหน้าสำคัญและข้อความสำคัญที่คุณกดบุ๊กมาร์กไว้ได้ทันที
                  </p>
                </div>

                {bookmarks.length > 0 && (
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาบุ๊กมาร์ก..."
                      className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {bookmarks.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    ยังไม่มีบุ๊กมาร์กที่บันทึกไว้
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    ขณะอ่านหนังสือ คุณสามารถกดปุ่ม <span className="font-semibold text-amber-600 dark:text-amber-400">"บุ๊กมาร์กหน้า"</span> บนแถบเครื่องมือ เพื่อบันทึกหน้าที่ชอบไว้ดูย้อนหลังได้ง่ายๆ
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarks
                    .filter(
                      (bm) =>
                        !searchQuery.trim() ||
                        bm.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        bm.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (bm.chapterTitle && bm.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((bm) => {
                      const matchedDoc = documents.find((d) => d.id === bm.documentId);

                      return (
                        <div
                          key={bm.id}
                          id={`bookmark-card-${bm.id}`}
                          className="group p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500/80 transition shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                  หน้า {bm.pageNumber}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {bm.documentName}
                                </span>
                              </div>

                              {bm.chapterTitle && (
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  <span>{bm.chapterTitle}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (matchedDoc) {
                                    onSelectDocument(matchedDoc, bm.pageIndex);
                                    onClose();
                                  } else {
                                    alert('ไม่พบไฟล์เอกสารนี้ในคลังเครื่อง');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-98"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>ข้ามไปหน้านี้</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = deleteUserBookmark(bm.id);
                                  setBookmarks(updated);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                                title="ลบบุ๊กมาร์ก"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 font-serif leading-relaxed line-clamp-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            "{bm.snippet}"
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRELOADED SAMPLES */}
          {activeTab === 'samples' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  ตัวอย่างผลงาน C.G. Jung & ปรัชญาคลาสสิก (Multi-language)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_DOCUMENTS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleLoadSample(sample)}
                    className="group flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition cursor-pointer shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 text-xs font-extrabold group-hover:scale-105 transition-transform">
                      {((sample.lang || 'EN').split('-')[0] || 'EN').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {sample.name}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md shrink-0">
                          {sample.langLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                        {sample.description}
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>โหลดและเริ่มอ่าน</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
            <span>ระบบเก็บข้อมูลออฟไลน์บน IndexedDB & LocalStorage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Delete Single Document */}
      {docToDelete && (
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
                "{docToDelete.name}"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                เอกสารจำนวน {docToDelete.pageCount} หน้า และประวัติการอ่านพร้อมบุ๊กมาร์กทั้งหมดของหนังสือเล่มนี้จะถูกลบออกจากเครื่องของคุณอย่างถาวร
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteDocument(docToDelete.id);
                  await onRefreshDocuments();
                  setBookmarks(getUserBookmarks());
                  setDocToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบหนังสือ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete All Documents */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ยืนยันลบหนังสือทั้งหมดในคลัง?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                คุณกำลังจะลบหนังสือทั้งหมดจำนวน <strong className="text-rose-600 dark:text-rose-400">{documents.length} เล่ม</strong> ออกจากคลังออฟไลน์ ประวัติการอ่านและบุ๊กมาร์กทั้งหมดจะถูกลบรวดเดียว
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteAllDocuments();
                  await onRefreshDocuments();
                  setBookmarks(getUserBookmarks());
                  setShowDeleteAllModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบทั้งหมด ({documents.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
