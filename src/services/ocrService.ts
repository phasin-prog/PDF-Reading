import * as pdfjsLib from 'pdfjs-dist';
import { createWorker, Worker } from 'tesseract.js';
import { DocumentItem, PageContent } from '../types';
import { splitIntoSentences, splitIntoParagraphs, cleanPageTextAndStripFooters, detectLanguage } from './pdfService';
import { saveDocument } from './storage';

export type OcrEngine = 'gemini' | 'tesseract';

export interface OcrResult {
  text: string;
  engineUsed: string;
}

let tesseractWorkerPromise: Promise<Worker> | null = null;

async function getTesseractWorker(onProgress?: (msg: string) => void): Promise<Worker> {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      if (onProgress) onProgress('Initializing Tesseract OCR Neural Worker (English)...');
      const worker = await createWorker('eng');
      return worker;
    })();
  }
  return tesseractWorkerPromise;
}

/**
 * Renders a PDF page to a high-resolution base64 PNG data URL using HTML Canvas
 */
export async function renderPdfPageToDataUrl(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 2.0
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (!context) {
    throw new Error('Failed to get 2D context for PDF page OCR canvas');
  }

  // Draw background white for transparent PDF pages
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  }).promise;

  return canvas.toDataURL('image/png', 0.95);
}

/**
 * Checks if a specific page is a scanned image (has no or very few extractable vector text)
 */
export function isScannedPage(page: PageContent): boolean {
  if (!page || !page.text) return true;
  const clean = page.text.trim();
  if (clean.length < 35) return true;
  if (/^\[Page \d+ has no extractable text\]$/i.test(clean)) return true;
  
  // Count real words
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  return words.length < 8;
}

/**
 * Checks if a document as a whole appears to be a scanned PDF
 */
export function isScannedDocument(doc: DocumentItem): boolean {
  if (!doc || !doc.pages || doc.pages.length === 0) return false;
  let scannedCount = 0;
  for (const p of doc.pages) {
    if (isScannedPage(p)) scannedCount++;
  }
  // If more than 25% of pages are scanned
  return scannedCount / doc.pages.length >= 0.25;
}

/**
 * Runs OCR on a single page image using Gemini 2.5 Flash Vision server API or Tesseract.js client worker
 * Offline-first: when navigator reports offline, skip Gemini network call and go straight to local Tesseract.
 */
export async function runOcrOnImage(
  dataUrl: string,
  preferredEngine: OcrEngine = 'gemini',
  onProgress?: (statusMsg: string) => void
): Promise<OcrResult> {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  // Option A: Try Gemini 2.5 Flash Vision AI OCR endpoint (online only)
  if (preferredEngine === 'gemini' && !offline) {
    try {
      if (onProgress) onProgress('Sending page image to Gemini 2.5 Flash AI Vision OCR...');
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType: 'image/png' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text && data.text.trim().length > 0) {
          return {
            text: data.text.trim(),
            engineUsed: 'Gemini 2.5 Flash AI Vision',
          };
        }
      }
      console.warn('Gemini OCR API not available or returned empty, falling back to local Tesseract OCR...');
    } catch (err) {
      console.warn('Gemini OCR fetch failed, falling back to Tesseract:', err);
    }
  }

  // Option B: Client-side Tesseract.js LSTM Neural OCR
  if (onProgress) onProgress('Running local Tesseract.js Neural Engine (English)...');
  const worker = await getTesseractWorker(onProgress);

  const res = await worker.recognize(dataUrl);
  const text = res.data.text ? res.data.text.trim() : '';

  return {
    text,
    engineUsed: 'Tesseract.js Neural Engine',
  };
}

/**
 * Runs OCR on a specific page index in a document and updates the document object
 */
export async function ocrSinglePageInDocument(
  doc: DocumentItem,
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  preferredEngine: OcrEngine = 'gemini',
  onProgress?: (statusMsg: string) => void
): Promise<{ updatedDoc: DocumentItem; pageText: string; engineUsed: string }> {
  const pageNum = pageIndex + 1;
  if (onProgress) onProgress(`Rendering Page ${pageNum} to 2x resolution canvas...`);

  const dataUrl = await renderPdfPageToDataUrl(pdfDoc, pageNum, 2.0);
  const { text: rawOcrText, engineUsed } = await runOcrOnImage(dataUrl, preferredEngine, onProgress);

  const cleanedText = cleanPageTextAndStripFooters(rawOcrText);
  const sentences = splitIntoSentences(cleanedText);
  const paragraphs = splitIntoParagraphs(cleanedText);

  // Deep clone pages array to avoid mutating original state directly
  const updatedPages = [...doc.pages];
  updatedPages[pageIndex] = {
    ...updatedPages[pageIndex],
    text: cleanedText,
    sentences: sentences.length > 0 ? sentences : [cleanedText || `[Page ${pageNum} empty after OCR]`],
    paragraphs: paragraphs.length > 0 ? paragraphs : [cleanedText],
  };

  // Recalculate total document words and detected language
  const fullText = updatedPages.map(p => p.text).join(' ');
  const totalWords = fullText.split(/\s+/).filter(w => w.length > 0).length;
  const detectedLang = detectLanguage(fullText);

  const updatedDoc: DocumentItem = {
    ...doc,
    pages: updatedPages,
    totalWords,
    detectedLanguage: detectedLang,
    estimatedMinutes: Math.max(1, Math.ceil(totalWords / 150)),
  };

  // Save to IndexedDB / localStorage
  saveDocument(updatedDoc);

  return { updatedDoc, pageText: cleanedText, engineUsed };
}

/**
 * Runs OCR on all scanned pages across an entire PDF document
 */
export async function ocrAllScannedPagesInDocument(
  doc: DocumentItem,
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  preferredEngine: OcrEngine = 'gemini',
  onProgress?: (current: number, total: number, pageNum: number, statusMsg: string) => void
): Promise<DocumentItem> {
  const pagesToProcess = doc.pages
    .map((p, idx) => ({ pageIndex: idx, isScanned: isScannedPage(p) }))
    .filter(p => p.isScanned);

  const total = pagesToProcess.length === 0 ? doc.pages.length : pagesToProcess.length;
  let currentDoc = { ...doc };

  const targetList = pagesToProcess.length === 0 
    ? doc.pages.map((_, idx) => ({ pageIndex: idx, isScanned: true }))
    : pagesToProcess;

  for (let i = 0; i < targetList.length; i++) {
    const target = targetList[i];
    const pageNum = target.pageIndex + 1;

    if (onProgress) {
      onProgress(i + 1, targetList.length, pageNum, `Processing Page ${pageNum} (${i + 1}/${targetList.length})...`);
    }

    const { updatedDoc } = await ocrSinglePageInDocument(
      currentDoc,
      pdfDoc,
      target.pageIndex,
      preferredEngine,
      (msg) => {
        if (onProgress) onProgress(i + 1, targetList.length, pageNum, msg);
      }
    );

    currentDoc = updatedDoc;
  }

  return currentDoc;
}
