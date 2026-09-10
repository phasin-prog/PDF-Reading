import React, { useState } from 'react';
import {
  X,
  ScanText,
  Sparkles,
  Cpu,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Zap,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentItem } from '../types';
import { OcrEngine, ocrSinglePageInDocument, ocrAllScannedPagesInDocument, isScannedPage } from '../services/ocrService';

interface OCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  currentPageIndex: number;
  pdfArrayBuffer: ArrayBuffer | null;
  onDocumentUpdated: (updatedDoc: DocumentItem) => void;
}

export const OCRModal: React.FC<OCRModalProps> = ({
  isOpen,
  onClose,
  document,
  currentPageIndex,
  pdfArrayBuffer,
  onDocumentUpdated,
}) => {
  const [engine, setEngine] = useState<OcrEngine>('gemini');
  const [targetScope, setTargetScope] = useState<'single' | 'all'>('single');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [extractedSnippet, setExtractedSnippet] = useState<string>('');
  const [lastEngineUsed, setLastEngineUsed] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen || !document) return null;

  const scannedPagesCount = document.pages.filter(p => isScannedPage(p)).length;
  const isCurrentPageScanned = isScannedPage(document.pages[currentPageIndex]);

  const handleStartOCR = async () => {
    if (!pdfArrayBuffer) {
      setErrorMessage('ไม่พบบัฟเฟอร์ไฟล์ PDF กรุณาโหลดไฟล์ใหม่อีกครั้ง');
      return;
    }

    setIsProcessing(true);
    setIsSuccess(false);
    setErrorMessage('');
    setProgressPercent(5);
    setStatusText('กำลังเตรียมระบบประมวลผล PDF.js...');
    setExtractedSnippet('');

    try {
      // Load PDF.js document proxy from array buffer
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(pdfArrayBuffer),
        useSystemFonts: true,
      });
      const pdfDoc = await loadingTask.promise;

      if (targetScope === 'single') {
        setStatusText(`กำลังเรนเดอร์ภาพความละเอียดสูงสำหรับหน้า ${currentPageIndex + 1}...`);
        setProgressPercent(20);

        const { updatedDoc, pageText, engineUsed } = await ocrSinglePageInDocument(
          document,
          pdfDoc,
          currentPageIndex,
          engine,
          (msg) => {
            setStatusText(msg);
            setProgressPercent(60);
          }
        );

        setProgressPercent(100);
        setStatusText('ทำ OCR ภาษาอังกฤษสำเร็จเรียบร้อย!');
        setExtractedSnippet(pageText.slice(0, 300) + (pageText.length > 300 ? '...' : ''));
        setLastEngineUsed(engineUsed);
        setIsSuccess(true);
        onDocumentUpdated(updatedDoc);
      } else {
        // Run OCR across all scanned pages in full document
        setStatusText('กำลังเริ่มต้นทำ OCR ภาษาอังกฤษทั้งเล่ม...');
        setProgressPercent(10);

        const updatedDoc = await ocrAllScannedPagesInDocument(
          document,
          pdfDoc,
          engine,
          (current, total, pageNum, msg) => {
            const pct = Math.min(98, Math.round((current / total) * 100));
            setProgressPercent(pct);
            setStatusText(`[หน้า ${pageNum} (${current}/${total})] ${msg}`);
          }
        );

        const firstExtracted = updatedDoc.pages[currentPageIndex]?.text || '';
        setProgressPercent(100);
        setStatusText('ทำ OCR ภาษาอังกฤษทั้งเอกสารสำเร็จเรียบร้อย!');
        setExtractedSnippet(firstExtracted.slice(0, 300) + (firstExtracted.length > 300 ? '...' : ''));
        setLastEngineUsed(engine === 'gemini' ? 'Gemini 3.8 Flash AI Vision' : 'Tesseract.js Neural Engine');
        setIsSuccess(true);
        onDocumentUpdated(updatedDoc);
      }
    } catch (err: any) {
      console.error('OCR Modal Execution Error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการประมวลผล OCR');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="ocr-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>ระบบ OCR อ่านข้อความภาษาอังกฤษ (English OCR)</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold border border-purple-300 dark:border-purple-800">
                  Professional
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สกัดข้อความภาษาอังกฤษจากไฟล์ PDF สแกนหรือไฟล์ภาพหนังสือ ด้วย AI Vision & Tesseract
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Status info bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{document.name}</span>
                <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>รวมทั้งหมด {document.pageCount} หน้า</span>
                  <span>•</span>
                  <span className={scannedPagesCount > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                    {scannedPagesCount > 0 ? `พบหน้าสแกนภาพ ${scannedPagesCount} หน้า` : 'หน้าเวกเตอร์พร้อมใช้งาน'}
                  </span>
                </div>
              </div>
            </div>

            {isCurrentPageScanned && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>หน้าที่เปิดอยู่ (หน้า {currentPageIndex + 1}) เป็นภาพสแกน</span>
              </span>
            )}
          </div>

          {/* Engine Selection */}
          {!isProcessing && !isSuccess && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 block">
                  1. เลือกเอนจิน OCR (OCR Engine Selection)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gemini Vision AI */}
                  <button
                    type="button"
                    onClick={() => setEngine('gemini')}
                    className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                      engine === 'gemini'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/40 text-slate-900 dark:text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>Gemini 3.8 Flash AI Vision</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-extrabold">
                        แนะนำ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      สกัดข้อความแม่นยำสูงสุด 99.9% จัดย่อหน้า วรรคตอน และสัญลักษณ์เชิงอรรถ [1] ให้เรียบร้อย
                    </p>
                  </button>

                  {/* Tesseract.js Neural */}
                  <button
                    type="button"
                    onClick={() => setEngine('tesseract')}
                    className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                      engine === 'tesseract'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/40 text-slate-900 dark:text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                        <Cpu className="w-4 h-4 text-blue-500" />
                        <span>Tesseract.js Neural Worker</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        Local Browser
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      ทำงานด้วย Web Worker ภาษาอังกฤษตรงในเบราว์เซอร์ 100% ปลอดภัย ไม่ผ่านเน็ต
                    </p>
                  </button>
                </div>
              </div>

              {/* Target Scope Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 block">
                  2. เลือกขอบเขตหน้าทำ OCR (Target Scope)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetScope('single')}
                    className={`p-3 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                      targetScope === 'single'
                        ? 'bg-slate-900 text-white dark:bg-blue-600 font-bold border-slate-900 dark:border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>เฉพาะหน้าที่เปิดอยู่ (หน้า {currentPageIndex + 1})</span>
                    </div>
                    <span className="text-[10px] opacity-75">เร็วที่สุด</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope('all')}
                    className={`p-3 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                      targetScope === 'all'
                        ? 'bg-slate-900 text-white dark:bg-blue-600 font-bold border-slate-900 dark:border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ScanText className="w-4 h-4 text-amber-400" />
                      <span>ทำทั้งเล่ม (ทุกหน้าสแกน {scannedPagesCount > 0 ? `${scannedPagesCount} หน้า` : ''})</span>
                    </div>
                    <span className="text-[10px] opacity-75">ครบทั้งเอกสาร</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar & Status */}
          {isProcessing && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  กำลังประมวลผล OCR ภาษาอังกฤษ...
                </h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                  {statusText}
                </p>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                {progressPercent}% Complete
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Result Display */}
          {isSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>ประมวลผล OCR สำเร็จด้วย {lastEngineUsed}!</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold">
                  Ready to Read & Speech
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                สกัดเนื้อหาเป็นข้อความเรียบร้อย สามารถกดฟังเสียงอ่าน TTS, ค้นหาศัพท์ หรือตรวจสอบคำแปล IPA ได้ทันที
              </p>

              {extractedSnippet && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto leading-relaxed">
                  {extractedSnippet}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition disabled:opacity-50"
          >
            {isSuccess ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
          </button>

          {!isSuccess && (
            <button
              type="button"
              onClick={handleStartOCR}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังประมวลผล...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-current" />
                  <span>เริ่มทำ OCR มืออาชีพ (Start Professional OCR)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
