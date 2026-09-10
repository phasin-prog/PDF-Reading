import React from 'react';
import {
  X,
  Sun,
  Moon,
  Coffee,
  Sparkles,
  Type,
  Layout,
  AlignLeft,
  Eye,
  Sliders,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';
import {
  ReaderTheme,
  ReaderFontSize,
  ReaderFontFamily,
  ReaderLineWidth,
  ReaderLineHeight,
  ParagraphIndent,
  HighlightMode,
} from '../types';

interface ReaderStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ReaderTheme;
  onChangeTheme: (theme: ReaderTheme) => void;
  fontSize: ReaderFontSize;
  onChangeFontSize: (size: ReaderFontSize) => void;
  fontFamily: ReaderFontFamily;
  onChangeFontFamily: (font: ReaderFontFamily) => void;
  lineWidth: ReaderLineWidth;
  onChangeLineWidth: (width: ReaderLineWidth) => void;
  lineHeight: ReaderLineHeight;
  onChangeLineHeight: (height: ReaderLineHeight) => void;
  paragraphIndent?: ParagraphIndent;
  onChangeParagraphIndent?: (indent: ParagraphIndent) => void;
  highlightMode: HighlightMode;
  onToggleHighlightMode: () => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
}

export const ReaderStyleModal: React.FC<ReaderStyleModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  fontSize,
  onChangeFontSize,
  fontFamily,
  onChangeFontFamily,
  lineWidth,
  onChangeLineWidth,
  lineHeight,
  onChangeLineHeight,
  paragraphIndent = 'standard',
  onChangeParagraphIndent,
  highlightMode,
  onToggleHighlightMode,
  zenMode,
  onToggleZenMode,
}) => {
  if (!isOpen) return null;

  const themes: { id: ReaderTheme; name: string; bg: string; text: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'light', name: 'Paper Light', bg: 'bg-white border-slate-300', text: 'text-slate-900', icon: <Sun className="w-4 h-4 text-amber-500" />, desc: 'สว่าง คมชัด มาตรฐานหนังสือพิมพ์' },
    { id: 'sepia', name: 'Warm Sepia', bg: 'bg-[#fbf0d9] border-[#e2d0ab]', text: 'text-[#433422]', icon: <Coffee className="w-4 h-4 text-amber-700" />, desc: 'โทนอุ่น ถนอมสายตา สไตล์ Kindle' },
    { id: 'dark', name: 'Dark Obsidian', bg: 'bg-[#1e293b] border-slate-700', text: 'text-slate-100', icon: <Moon className="w-4 h-4 text-indigo-400" />, desc: 'มืดสบายตา สำหรับอ่านตอนกลางคืน' },
    { id: 'oled', name: 'Midnight OLED', bg: 'bg-black border-slate-800', text: 'text-slate-200', icon: <Sparkles className="w-4 h-4 text-purple-400" />, desc: 'ดำสนิท ประหยัดพลังงาน จอ OLED' },
    { id: 'nord', name: 'Nord Ice Blue', bg: 'bg-[#2e3440] border-[#4c566a]', text: 'text-[#eceff4]', icon: <Eye className="w-4 h-4 text-cyan-400" />, desc: 'โทนฟ้าเย็น สบายสายตา สไตล์ Nord' },
  ];

  const fontFamilies: { id: ReaderFontFamily; name: string; class: string; sample: string; desc: string }[] = [
    { id: 'serif', name: 'Classic Serif', class: 'font-serif', sample: 'Nietzsche & Jung', desc: 'เหมาะสำหรับหนังสือปรัชญาและวรรณกรรม' },
    { id: 'sans', name: 'Modern Sans', class: 'font-sans', sample: 'Modern Reader', desc: 'เรียบง่าย อ่านสบายทุกขนาดหน้าจอ' },
    { id: 'dyslexic', name: 'High Clarity', class: 'font-sans tracking-wide', sample: 'Accessible Text', desc: 'เพิ่มระยะห่างตัวอักษร อ่านง่ายขึ้น' },
    { id: 'mono', name: 'Monospace', class: 'font-mono', sample: 'Academic Draft', desc: 'ฟอนต์ความกว้างเท่ากัน สไตล์งานวิจัย' },
  ];

  const lineHeights: { id: ReaderLineHeight; name: string; desc: string }[] = [
    { id: 'compact', name: 'กระชับ (1.5)', desc: 'บรรทัดแน่น เหมาะอ่านเร็ว' },
    { id: 'comfortable', name: 'สบายตา (1.8)', desc: 'ระยะห่างสมดุล อ่านต่อเนื่อง' },
    { id: 'relaxed', name: 'กว้างพิเศษ (2.2)', desc: 'บรรทัดโปร่งสบาย ลดความล้า' },
  ];

  const lineWidths: { id: ReaderLineWidth; name: string; desc: string }[] = [
    { id: 'narrow', name: 'แคบสมาธิ (max-w-2xl)', desc: 'สายตาไม่เคลื่อนไกล โฟกัสสูง' },
    { id: 'medium', name: 'สมดุลมาตรฐาน (max-w-4xl)', desc: 'ขนาดอ่านหนังสือนิยม' },
    { id: 'wide', name: 'กว้างพิเศษ (max-w-6xl)', desc: 'ขยายกว้าง ลดพื้นที่ว่างข้าง' },
    { id: 'full', name: 'เต็มความกว้างจอ (Full Width)', desc: 'ขยายเต็มหน้าจอ ไร้ขอบว่างข้าง' },
  ];

  return (
    <div
      id="reader-style-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                ตั้งค่ารูปแบบการอ่าน & Layout (Reading Format)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ปรับแต่งธีม ฟอนต์ ระยะห่างบรรทัด และ Zen Mode ได้ทันที
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

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Zen Mode Banner Toggle */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Zen Mode (โหมดอ่านสมาธิไร้สิ่งรบกวน)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ซ่อนไซด์บาร์และเมนูรอบข้างเพื่อขยายพื้นที่ข้อความให้อ่านได้อย่างดิ่งลึก
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleZenMode}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 ${
                zenMode
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
              }`}
            >
              {zenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{zenMode ? 'เปิดอยู่อย่างสมบูรณ์' : 'เปิด Zen Mode'}</span>
            </button>
          </div>

          {/* 1. Theme Selection */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>1. เลือกธีมสีอ่านหนังสือ (Reader Theme)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {themes.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onChangeTheme(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${t.bg} ${t.text} ${
                      isActive
                        ? 'ring-2 ring-blue-500 shadow-md border-blue-500'
                        : 'hover:border-blue-300/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {t.icon}
                        <span className="text-xs font-bold">{t.name}</span>
                      </div>
                      {isActive && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Font Family Selection */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-blue-500" />
              <span>2. รูปแบบตัวอักษร (Typography Style)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {fontFamilies.map((f) => {
                const isActive = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onChangeFontFamily(f.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-950 dark:text-blue-100 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${f.class}`}>{f.name}</span>
                        {isActive && <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">• ใช้อยู่</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{f.desc}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono shrink-0 ${f.class} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700`}>
                      {f.sample}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Font Size & Line Height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Font Size */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-emerald-500" />
                <span>ขนาดตัวอักษร (Font Size)</span>
              </h3>
              <div className="grid grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                {(['sm', 'md', 'lg', 'xl'] as ReaderFontSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => onChangeFontSize(s)}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      fontSize === s
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-purple-500" />
                <span>ระยะห่างบรรทัด (Line Height)</span>
              </h3>
              <div className="space-y-1.5">
                {lineHeights.map((lh) => {
                  const isActive = lineHeight === lh.id;
                  return (
                    <button
                      key={lh.id}
                      onClick={() => onChangeLineHeight(lh.id)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{lh.name}</span>
                      <span className="text-[10px] opacity-80">{lh.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Text Width, First-Line Indent & Highlighting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Academic Paragraph Indent */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-emerald-500" />
                <span>การย่อหน้าบรรทัดแรก (First-Line Indent)</span>
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'standard', name: 'ย่อหน้าวิชาการมาตรฐาน (2em)', desc: 'เว้นระยะย่อหน้าบรรทัดแรกสวยงาม รูปแบบสิ่งพิมพ์' },
                  { id: 'deep', name: 'ย่อหน้าลึกพิเศษ (3.5em)', desc: 'เว้นระยะย่อหน้ากว้าง ชัดเจนสำหรับปรัชญา' },
                  { id: 'none', name: 'ไม่ย่อหน้า (Flush Left)', desc: 'ชิดซ้ายเท่ากันทุกบรรทัด สไตล์เว็บการ์ด' },
                ].map((pi) => {
                  const isActive = paragraphIndent === pi.id;
                  return (
                    <button
                      key={pi.id}
                      onClick={() => onChangeParagraphIndent && onChangeParagraphIndent(pi.id as ParagraphIndent)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{pi.name}</span>
                      <span className="text-[10px] opacity-80">{pi.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Width */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-indigo-500" />
                <span>ความกว้างพื้นที่อ่าน (Text Line Width)</span>
              </h3>
              <div className="space-y-1.5">
                {lineWidths.map((lw) => {
                  const isActive = lineWidth === lw.id;
                  return (
                    <button
                      key={lw.id}
                      onClick={() => onChangeLineWidth(lw.id)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{lw.name}</span>
                      <span className="text-[10px] opacity-80">{lw.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Highlighting Mode */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>รูปแบบไฮไลต์การอ่าน (Voice Highlighting)</span>
              </h3>
              <button
                type="button"
                onClick={onToggleHighlightMode}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {highlightMode === 'word' ? '✨ คำต่อคำ (Active Word Glow)' : '🟦 ทั้งประโยค (Sentence Block)'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {highlightMode === 'word' ? 'เน้นข้อความวิ่งตามคำอ่านทีละคำ' : 'ไฮไลต์คลุมทั้งประโยคขณะอ่าน'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0">
                  สลับแบบ
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-sm active:scale-95"
          >
            เรียบร้อย (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
