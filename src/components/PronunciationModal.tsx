import React, { useState, useEffect } from 'react';
import {
  Volume2,
  BookOpen,
  Sparkles,
  Link2,
  Search,
  X,
  Languages,
  RotateCcw,
  Zap,
  Globe,
  Tag,
  Compass,
} from 'lucide-react';
import { WordDefinition, SentencePronunciationAnalysis } from '../types';
import { lookupWord } from '../services/pronunciationDictionary';
import { analyzeSentenceConnectedSpeech } from '../utils/connectedSpeech';
import { ttsEngine } from '../services/ttsService';

interface PronunciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string | null;
  currentSentence?: string;
  detectedLang?: string;
}

export const PronunciationModal: React.FC<PronunciationModalProps> = ({
  isOpen,
  onClose,
  initialWord,
  currentSentence = '',
  detectedLang = 'en-US',
}) => {
  const [activeTab, setActiveTab] = useState<'word' | 'sentence'>('word');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [wordData, setWordData] = useState<WordDefinition | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState<boolean>(false);
  const [sentenceAnalysis, setSentenceAnalysis] = useState<SentencePronunciationAnalysis | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // When initialWord or currentSentence changes, update state
  useEffect(() => {
    if (initialWord && initialWord.trim()) {
      const clean = initialWord.trim();
      setSearchTerm(clean);
      handleLookup(clean);
    } else if (currentSentence && currentSentence.trim()) {
      const words = currentSentence.match(/[A-Za-z]+/g);
      if (words && words.length > 0) {
        setSearchTerm(words[0]);
        handleLookup(words[0]);
      }
    }
  }, [initialWord, isOpen]);

  useEffect(() => {
    if (currentSentence && currentSentence.trim()) {
      const analysis = analyzeSentenceConnectedSpeech(currentSentence);
      setSentenceAnalysis(analysis);
    }
  }, [currentSentence, isOpen]);

  const handleLookup = async (wordToFind: string) => {
    if (!wordToFind.trim()) return;
    const cleaned = wordToFind.trim().toLowerCase();
    setIsLoadingWord(true);
    try {
      const res = await lookupWord(cleaned);
      setWordData(res);
      setSearchHistory((prev) => {
        const filtered = prev.filter((w) => w.toLowerCase() !== cleaned);
        return [cleaned, ...filtered].slice(0, 8);
      });
    } catch (err) {
      console.error('Word lookup failed:', err);
    } finally {
      setIsLoadingWord(false);
    }
  };

  const handleSpeakWord = (word: string, slow = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = slow ? 0.65 : 0.95;
    utterance.lang = detectedLang.startsWith('en') ? detectedLang : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayNativeAudio = (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.warn('Native audio playback error, falling back to Web Speech:', err);
        if (wordData?.word) handleSpeakWord(wordData.word, false);
      });
    } catch {
      if (wordData?.word) handleSpeakWord(wordData.word, false);
    }
  };

  const handleSpeakSentence = (sentence: string) => {
    ttsEngine.startPlayback([sentence], 0);
  };

  if (!isOpen) return null;

  return (
    <div
      id="pronunciation-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="pronunciation-modal-card"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base">
              🗣️
            </div>
            <div>
              <h2 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                พจนานุกรม & ระบบช่วยการออกเสียง IPA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Online Dictionary API • IPA Phonetics • Native Audio • Meanings
              </p>
            </div>
          </div>
          <button
            id="close-pronunciation-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2 bg-slate-50/50 dark:bg-slate-900/40 gap-2">
          <button
            id="tab-word-def"
            onClick={() => setActiveTab('word')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'word'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            คำศัพท์ & พจนานุกรม (Dictionary)
          </button>
          <button
            id="tab-connected-speech"
            onClick={() => setActiveTab('sentence')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sentence'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            การเชื่อมเสียงประโยค (Liaison)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'word' ? (
            <>
              {/* Word Search Bar */}
              <div className="space-y-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLookup(searchTerm);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="search-word-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="พิมพ์คำภาษาอังกฤษเพื่อดูพจนานุกรม IPA & ความหมาย..."
                      className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    id="search-word-submit-btn"
                    type="submit"
                    disabled={isLoadingWord || !searchTerm.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    ค้นหา
                  </button>
                </form>

                {/* Quick Search History Pills */}
                {searchHistory.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-500">
                    <span className="shrink-0 text-[11px] font-medium text-slate-400">ค้นหาล่าสุด:</span>
                    {searchHistory.slice(0, 6).map((word, hIdx) => (
                      <button
                        key={hIdx}
                        type="button"
                        onClick={() => {
                          setSearchTerm(word);
                          handleLookup(word);
                        }}
                        className={`px-2 py-0.5 rounded-md border text-[11px] transition cursor-pointer ${
                          searchTerm.toLowerCase() === word.toLowerCase()
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Word Details Display */}
              {isLoadingWord ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">กำลังค้นหาพจนานุกรมออนไลน์ คำอ่าน IPA และความหมาย...</p>
                </div>
              ) : wordData ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Word Header Card */}
                  <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                          {wordData.word}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                          {wordData.partOfSpeech}
                        </span>

                        {/* Dictionary Source Badge */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                          {wordData.source === 'dictionary-api' ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Free Dictionary API (Online)</span>
                            </>
                          ) : wordData.source === 'offline' ? (
                            <>
                              <BookOpen className="w-3 h-3 text-blue-500" />
                              <span>Curated Offline Literature</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>Phonetic Engine</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/60">
                          {wordData.ipa}
                        </span>
                        <span className="text-xs text-slate-400">
                          (สัทอักษรสากล IPA)
                        </span>
                      </div>
                    </div>

                    {/* Audio Playback Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {wordData.audioUrl && (
                        <button
                          id="play-native-audio-btn"
                          onClick={() => handlePlayNativeAudio(wordData.audioUrl!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          title="ฟังเสียงจากไฟล์บันทึกเสียงจริงของเจ้าของภาษา"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>เจ้าของภาษา (Native)</span>
                        </button>
                      )}

                      <button
                        id="speak-word-normal-btn"
                        onClick={() => handleSpeakWord(wordData.word, false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        title="ฟังเสียงสังเคราะห์ TTS (ระดับปกติ 1.0x)"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>TTS ปกติ</span>
                      </button>

                      <button
                        id="speak-word-slow-btn"
                        onClick={() => handleSpeakWord(wordData.word, true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="ฟังเสียงแบบช้าชัดเจน (0.65x)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ช้าชัดเจน</span>
                      </button>
                    </div>
                  </div>

                  {/* Phonetic Accents (US / UK / AU Recordings) */}
                  {wordData.phoneticVariants && wordData.phoneticVariants.some((v) => v.audio) && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        สำเนียงเจ้าของภาษา (Native Recordings):
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {wordData.phoneticVariants
                          .filter((v) => v.audio)
                          .map((v, vIdx) => (
                            <button
                              key={vIdx}
                              onClick={() => handlePlayNativeAudio(v.audio!)}
                              className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>{v.accent} ({v.text})</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Syllable Stress Guide */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      การเน้นพยางค์ (Syllable Stress & Emphasis)
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {wordData.syllables.map((syllable, sIdx) => {
                        const isStressed = sIdx === wordData.stressedSyllableIndex;
                        return (
                          <div
                            key={sIdx}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                              isStressed
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 ring-1 ring-amber-400 font-bold shadow-2xs'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <span>{syllable}</span>
                            {isStressed && (
                              <span className="text-[10px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded-xs uppercase">
                                เน้นเสียง
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      พยางค์ที่เน้น (Stressed Syllable) จะต้องออกเสียงให้ยาวขึ้น มีระดับเสียง (Pitch) สูงขึ้น และชัดเจนกว่าพยางค์อื่น
                    </p>
                  </div>

                  {/* Word Origin / Etymology (If available) */}
                  {wordData.origin && (
                    <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs">
                      <div className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-600" />
                        ที่มาและประวัติความเป็นมาของคำ (Etymology & Word Origin)
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        "{wordData.origin}"
                      </p>
                    </div>
                  )}

                  {/* Full Dictionary Meanings List (Grouped by Part of Speech) */}
                  {wordData.meaningsList && wordData.meaningsList.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ความหมายอย่างเป็นทางการจากพจนานุกรม (Dictionary Definitions)
                      </div>

                      {wordData.meaningsList.map((meaningGroup, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 space-y-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white uppercase tracking-wider shadow-2xs">
                              {meaningGroup.partOfSpeech}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {meaningGroup.definitions.length} ความหมาย
                            </span>
                          </div>

                          <ol className="space-y-2 text-xs leading-relaxed divide-y divide-slate-100 dark:divide-slate-800/60">
                            {meaningGroup.definitions.map((defItem, dIdx) => (
                              <li key={dIdx} className="pt-2 first:pt-0 space-y-1">
                                <div className="flex items-start gap-2">
                                  <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                    {dIdx + 1}.
                                  </span>
                                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                                    {defItem.definition}
                                  </p>
                                </div>

                                {defItem.example && (
                                  <p className="pl-5 text-[11px] italic text-slate-500 dark:text-slate-400">
                                    ตัวอย่าง: "{defItem.example}"
                                  </p>
                                )}

                                {defItem.synonyms && defItem.synonyms.length > 0 && (
                                  <div className="pl-5 flex items-center gap-1 flex-wrap text-[11px] pt-0.5">
                                    <span className="text-slate-400 font-medium">คำเหมือน:</span>
                                    {defItem.synonyms.slice(0, 5).map((syn, sIdx) => (
                                      <button
                                        key={sIdx}
                                        type="button"
                                        onClick={() => {
                                          setSearchTerm(syn);
                                          handleLookup(syn);
                                        }}
                                        className="px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 hover:underline cursor-pointer"
                                      >
                                        {syn}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* 3-Dimensional Meaning Breakdown for offline / single definition fallback */
                    <div className="space-y-3">
                      {/* Dimension 1: ประเภทคำแบบไหน (Part of Speech & Grammatical Role) */}
                      <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
                        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[11px] font-extrabold">1</span>
                          🏷️ ประเภทคำแบบไหน (Part of Speech)
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white shadow-2xs">
                            {wordData.partOfSpeech}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                          {wordData.partOfSpeechDescription || 'ทำหน้าที่เป็นคำหลักในโครงสร้างประโยคตามหลักไวยากรณ์ภาษาอังกฤษ'}
                        </p>
                      </div>

                      {/* Dimension 2: มันคืออะไร? (What is it? - Core Essence & Definition) */}
                      <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[11px] font-extrabold">2</span>
                          🔍 มันคืออะไร? (What is it?)
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed mb-1.5">
                          {wordData.whatItIs || wordData.thaiMeaning || wordData.definition}
                        </p>
                        {wordData.definition && wordData.definition !== wordData.whatItIs && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">English: </span>
                            {wordData.definition}
                          </div>
                        )}
                      </div>

                      {/* Dimension 3: คำนั้นสื่อถึงอะไร? (What does it signify / represent?) */}
                      <div className="p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20">
                        <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[11px] font-extrabold">3</span>
                          💡 คำนั้นสื่อถึงอะไร? (What does it signify / represent?)
                        </div>
                        <p className="text-xs sm:text-sm text-purple-950 dark:text-purple-200 leading-relaxed">
                          {wordData.whatItSignifies || wordData.philosophicalContext || 'สื่อถึงมโนทัศน์หรือความหมายเชิงลึกที่ผู้เขียนต้องการถ่ายทอดถึงผู้อ่าน'}
                        </p>
                        {wordData.philosophicalContext && wordData.philosophicalContext !== wordData.whatItSignifies && (
                          <div className="mt-2 text-xs text-purple-800 dark:text-purple-300/90 bg-white/70 dark:bg-purple-900/30 p-2 rounded-lg border border-purple-200/60 dark:border-purple-800/40">
                            <span className="font-semibold">นัยทางปรัชญา/จิตวิทยา: </span>
                            {wordData.philosophicalContext}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Global Synonyms & Antonyms Pill Cloud */}
                  {((wordData.synonyms && wordData.synonyms.length > 0) || (wordData.antonyms && wordData.antonyms.length > 0)) && (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      {wordData.synonyms && wordData.synonyms.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-blue-500" />
                            คำที่มีความหมายคล้ายกัน (Synonyms - คลิกเพื่อค้นหาคำนั้น):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {wordData.synonyms.map((syn, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => {
                                  setSearchTerm(syn);
                                  handleLookup(syn);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200/60 dark:border-blue-900/60 transition cursor-pointer"
                              >
                                {syn}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {wordData.antonyms && wordData.antonyms.length > 0 && (
                        <div className="pt-1">
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-rose-500" />
                            คำที่มีความหมายตรงข้าม (Antonyms):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {wordData.antonyms.map((ant, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200/60 dark:border-rose-900/60"
                              >
                                {ant}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sample Sentence in Context */}
                  {wordData.sampleSentence && (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        ตัวอย่างประโยคในบริบท (Contextual Example)
                      </div>
                      <p className="text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed">
                        "{wordData.sampleSentence}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  เลือกคำในบทความ หรือพิมพ์คำที่ต้องการในช่องค้นหาด้านบน
                </div>
              )}
            </>
          ) : (
            /* Sentence Connected Speech Tab */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    ประโยคที่กำลังอ่าน (Active Sentence)
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    "{currentSentence || 'ไม่มีประโยคที่กำลังอ่าน'}"
                  </p>
                </div>
                {currentSentence && (
                  <button
                    id="speak-current-sentence-btn"
                    onClick={() => handleSpeakSentence(currentSentence)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    ฟังประโยค
                  </button>
                )}
              </div>

              {/* Stress Analysis on Words */}
              {sentenceAnalysis && sentenceAnalysis.words.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    จังหวะการเน้นคำในประโยค (Sentence Rhythm & Content Words)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sentenceAnalysis.words.map((w, wIdx) => (
                      <button
                        key={wIdx}
                        onClick={() => {
                          setSearchTerm(w.word);
                          setActiveTab('word');
                          handleLookup(w.word);
                        }}
                        className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${
                          w.isContentWord
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 ring-1 ring-blue-400/50 font-semibold'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 opacity-70'
                        }`}
                        title={`${w.word}: ${w.stress} (คลิกเพื่อดู IPA และความหมาย)`}
                      >
                        {w.word}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-400" />
                      คำสำคัญที่ต้องเน้นเสียง (Content Words)
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-700" />
                      คำเชื่อม/คำบุพบทลดเสียง (Function Words)
                    </div>
                  </div>
                </div>
              )}

              {/* Connected Speech Links (Liaison & Glide) */}
              {sentenceAnalysis && sentenceAnalysis.links.length > 0 ? (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-500" />
                    จุดเชื่อมเสียงระหว่างคำ (Liaison & Connected Speech)
                  </div>

                  <div className="space-y-2">
                    {sentenceAnalysis.links.map((link, lIdx) => (
                      <div
                        key={lIdx}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            <span>{link.phoneticGuide}</span>
                            <span className="text-[10px] font-sans font-normal px-1.5 py-0.2 rounded-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              {link.type === 'consonant-to-vowel'
                                ? 'พยัญชนะเชื่อมสระ (C→V)'
                                : link.type === 'flap-t'
                                ? 'Flap-T นุ่มนวล'
                                : 'เสียงสระเชื่อมสระ (V→V Glide)'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            {link.description}
                          </p>
                        </div>
                        <button
                          id={`listen-link-${lIdx}-btn`}
                          onClick={() => handleSpeakWord(`${link.firstWord} ${link.secondWord}`, true)}
                          className="shrink-0 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="ฟังเสียงเชื่อมคู่นี้"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">
                  ไม่มีจุดเชื่อมเสียงพิเศษในประโยคนี้
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>💡 เคล็ดลับ: คลิกที่คำใดก็ได้ในเนื้อหาเพื่อเปิดดู IPA และความหมายทันที</span>
          <button
            id="close-pronunciation-btn-footer"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
