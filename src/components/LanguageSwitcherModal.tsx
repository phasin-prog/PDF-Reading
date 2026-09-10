import React, { useState, useMemo } from 'react';
import {
  X,
  Globe,
  Check,
  Volume2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { TTSVoiceInfo, DocumentItem } from '../types';
import { ttsEngine } from '../services/ttsService';

interface LanguageSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDoc: DocumentItem | null;
  voices: TTSVoiceInfo[];
  selectedVoice: TTSVoiceInfo | null;
  onSelectLanguage: (newLang: string, voiceURI?: string) => void;
  onSelectVoice: (voice: TTSVoiceInfo) => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isDefaultPriority: boolean;
  description: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en-US',
    name: 'English (US / UK)',
    nativeName: 'English (Default)',
    flag: '🇺🇸',
    isDefaultPriority: true,
    description: 'เหมาะสำหรับ C.G. Jung Collected Works, วรรณกรรมจิตวิทยา และปรัชญาสากล',
  },
  {
    code: 'de-DE',
    name: 'German (Deutsch)',
    nativeName: 'Deutsch (Original Jung)',
    flag: '🇩🇪',
    isDefaultPriority: true,
    description: 'ต้นฉบับภาษาเยอรมันของ Carl Gustav Jung, Nietzsche, Freud และ Kant',
  },
  {
    code: 'th-TH',
    name: 'Thai (ภาษาไทย)',
    nativeName: 'ภาษาไทย (แปลไทย)',
    flag: '🇹🇭',
    isDefaultPriority: false,
    description: 'เอกสารและบทความแปลภาษาไทย',
  },
  {
    code: 'fr-FR',
    name: 'French (Français)',
    nativeName: 'Français',
    flag: '🇫🇷',
    isDefaultPriority: false,
    description: 'วรรณกรรมและปรัชญาภาษาฝรั่งเศส (Foucault, Sartre, Camus)',
  },
  {
    code: 'es-ES',
    name: 'Spanish (Español)',
    nativeName: 'Español',
    flag: '🇪🇸',
    isDefaultPriority: false,
    description: 'เอกสารและวรรณกรรมภาษาสเปน',
  },
  {
    code: 'it-IT',
    name: 'Italian (Italiano)',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    isDefaultPriority: false,
    description: 'ภาษาอิตาลี (เลือกด้วยตนเองเท่านั้น ไม่เป็นค่าเริ่มต้น)',
  },
  {
    code: 'ja-JP',
    name: 'Japanese (日本語)',
    nativeName: '日本語',
    flag: '🇯🇵',
    isDefaultPriority: false,
    description: 'เอกสารและวรรณกรรมภาษาญี่ปุ่น',
  },
];

export const LanguageSwitcherModal: React.FC<LanguageSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentDoc,
  voices,
  selectedVoice,
  onSelectLanguage,
  onSelectVoice,
}) => {
  const currentLang = currentDoc?.detectedLanguage || 'en-US';
  const [activeLangCode, setActiveLangCode] = useState<string>(currentLang);
  const [testPlayingVoiceURI, setTestPlayingVoiceURI] = useState<string | null>(null);

  // Filter voices matching the active language
  const availableVoicesForLang = useMemo(() => {
    const primary = (activeLangCode || 'en').split(/[-_]/)[0].toLowerCase();
    const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(primary));
    if (matches.length > 0) return matches;

    // Fallback to English if no voice for this language
    return voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  }, [voices, activeLangCode]);

  const handleApplyLanguage = (langCode: string) => {
    setActiveLangCode(langCode);
    // Find best voice for this language
    const primary = (langCode || 'en').split(/[-_]/)[0].toLowerCase();
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(primary));
    const bestVoice = langVoices[0] || voices.find((v) => v.lang.toLowerCase().startsWith('en'));

    onSelectLanguage(langCode, bestVoice?.voice.voiceURI);
    if (bestVoice) {
      onSelectVoice(bestVoice);
    }
    onClose();
  };

  const handleTestVoice = (voice: TTSVoiceInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestPlayingVoiceURI(voice.voice.voiceURI);
    ttsEngine.previewVoice(voice.voice);
    setTimeout(() => {
      setTestPlayingVoiceURI(null);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="language-switcher-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                เปลี่ยนภาษาของเนื้อหา & เสียงพูด (Content Language)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดภาษาที่ระบบใช้ตรวจจับและออกเสียงสำหรับเอกสารนี้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="ปิด (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice on Default En - German Policy */}
        <div className="p-3.5 mx-4 mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">ค่าเริ่มต้น En - German ป้องกันการอ่านผิดภาษา:</span> ระบบกำหนดให้ <strong>English</strong> และ <strong>German</strong> เป็นภาษาหลักสำหรับหนังสือของ Carl Jung และปรัชญา คุณสามารถคลิกเลือกภาษาด้านล่างเพื่อเปลี่ยนได้ทันที
          </div>
        </div>

        {/* Language Options List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
            เลือกภาษาของเนื้อหา (Select Language)
          </div>

          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected =
              (currentLang || '').toLowerCase().startsWith((lang.code || '').split('-')[0].toLowerCase()) ||
              (currentLang || '').toLowerCase() === (lang.code || '').toLowerCase();

            return (
              <div
                key={lang.code}
                id={`lang-option-${lang.code}`}
                onClick={() => handleApplyLanguage(lang.code)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{lang.flag}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {lang.name}
                      </span>
                      {lang.isDefaultPriority && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          Priority Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {lang.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition"
                    >
                      เลือก
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Voice Selection Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              เสียงอ่านที่เลือกในปัจจุบัน (Active Voice):
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono">
              {selectedVoice?.name || 'Default Voice'} ({selectedVoice?.lang || currentLang})
            </span>
          </div>

          {availableVoicesForLang.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                id="language-modal-voice-select"
                value={selectedVoice?.voice.voiceURI || ''}
                onChange={(e) => {
                  const v = voices.find((item) => item.voice.voiceURI === e.target.value);
                  if (v) onSelectVoice(v);
                }}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              >
                {availableVoicesForLang.map((v) => (
                  <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                    {v.name} ({v.langName}) {v.qualityGrade === 'natural' ? '★ Natural' : ''}
                  </option>
                ))}
              </select>

              {selectedVoice && (
                <button
                  type="button"
                  onClick={(e) => handleTestVoice(selectedVoice, e)}
                  disabled={testPlayingVoiceURI !== null}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  title="ทดสอบฟังเสียงพูดของเสียงนี้"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{testPlayingVoiceURI ? 'กำลังพูด...' : 'ทดลองฟัง'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition active:scale-95 shadow-xs"
          >
            เรียบร้อย (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
