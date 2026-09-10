import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DocumentReader } from './components/DocumentReader';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { DocumentLibrary } from './components/DocumentLibrary';
import { VoiceModal } from './components/VoiceModal';
import { PronunciationModal } from './components/PronunciationModal';
import { DocumentSearchModal } from './components/DocumentSearchModal';
import { PageSelectorModal } from './components/PageSelectorModal';
import { LanguageSwitcherModal } from './components/LanguageSwitcherModal';
import { ReaderStyleModal } from './components/ReaderStyleModal';
import { PageNotesDrawerModal } from './components/PageNotesDrawerModal';
import { OCRModal } from './components/OCRModal';
import { ConceptMemoryModal } from './components/ConceptMemoryModal';
import { DeepListeningOverlay } from './components/DeepListeningOverlay';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AmbienceSoundscape, ambienceEngine } from './services/ambienceService';
import { conceptMemoryService } from './services/conceptMemoryService';
import {
  DocumentItem,
  PlaybackState,
  ReaderTheme,
  ReaderFontSize,
  ReaderFontFamily,
  ReaderLineWidth,
  ReaderLineHeight,
  ParagraphIndent,
  TTSVoiceInfo,
  HighlightMode,
  VoiceNarratorProfile,
  CadenceMode,
  PageViewMode,
  UserBookmark,
} from './types';
import { PodcastEQPreset } from './utils/podcastEqualizer';
import {
  getAllDocuments,
  saveDocument,
  getPdfBuffer,
  deleteDocument,
  updateReadingProgress,
  getUserBookmarks,
  toggleUserBookmark,
  saveUserBookmark,
  deleteUserBookmark,
} from './services/storage';
import {
  SAMPLE_DOCUMENTS,
  createDocumentFromSample,
} from './services/pdfService';
import { ttsEngine, extractWordRanges } from './services/ttsService';
import {
  build1000PagePhilosophicalCompendium,
  buildJungDedicatedBook,
} from './data/philosophyLibrary';
import { NARRATOR_PROFILES } from './utils/voiceHumanizer';

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentDoc, setCurrentDoc] = useState<DocumentItem | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);

  const [voices, setVoices] = useState<TTSVoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoiceInfo | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Modals
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isPageSelectorOpen, setIsPageSelectorOpen] = useState<boolean>(false);
  const [isLanguageSwitcherOpen, setIsLanguageSwitcherOpen] = useState<boolean>(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState<boolean>(false);
  const [isPageNotesOpen, setIsPageNotesOpen] = useState<boolean>(false);
  const [isOCROpen, setIsOCROpen] = useState<boolean>(false);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);

  // Load cached PDF ArrayBuffer for OCR whenever current document changes
  useEffect(() => {
    if (!currentDoc) {
      setPdfArrayBuffer(null);
      return;
    }
    getPdfBuffer(currentDoc.id).then((buf) => {
      if (buf) {
        setPdfArrayBuffer(buf);
      }
    });
  }, [currentDoc?.id]);

  // Zen Mode
  const [zenMode, setZenMode] = useState<boolean>(() => {
    return localStorage.getItem('pdf_tts_zen_mode') === 'true';
  });

  const handleToggleZenMode = () => {
    setZenMode((prev) => {
      const next = !prev;
      localStorage.setItem('pdf_tts_zen_mode', String(next));
      return next;
    });
  };

  // Themes and display
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    return (localStorage.getItem('pdf_tts_theme') as ReaderTheme) || 'light';
  });
  const [fontSize, setFontSize] = useState<ReaderFontSize>(() => {
    return (localStorage.getItem('pdf_tts_fontsize') as ReaderFontSize) || 'md';
  });
  const [fontFamily, setFontFamily] = useState<ReaderFontFamily>(() => {
    return (localStorage.getItem('pdf_tts_font_family') as ReaderFontFamily) || 'serif';
  });
  const [lineWidth, setLineWidth] = useState<ReaderLineWidth>(() => {
    return (localStorage.getItem('pdf_tts_line_width') as ReaderLineWidth) || 'medium';
  });
  const [lineHeight, setLineHeight] = useState<ReaderLineHeight>(() => {
    return (localStorage.getItem('pdf_tts_line_height') as ReaderLineHeight) || 'comfortable';
  });
  const [paragraphIndent, setParagraphIndent] = useState<ParagraphIndent>(() => {
    return (localStorage.getItem('pdf_tts_paragraph_indent') as ParagraphIndent) || 'standard';
  });

  // User Bookmarks and Notes
  const [userBookmarks, setUserBookmarks] = useState<UserBookmark[]>(() => getUserBookmarks());

  const handleSaveBookmarkNote = (pageIdx: number, noteText: string, colorTag?: 'yellow' | 'blue' | 'green' | 'purple' | 'red') => {
    if (!currentDoc) return;
    const page = currentDoc.pages[pageIdx];
    const snippet = page?.text ? page.text.slice(0, 160) + '...' : `หน้า ${pageIdx + 1}`;
    
    // Find if already bookmarked
    const existing = userBookmarks.find(b => b.documentId === currentDoc.id && b.pageIndex === pageIdx);
    const updatedBookmark: UserBookmark = {
      id: existing ? existing.id : `bm_${currentDoc.id}_p${pageIdx}_${Date.now()}`,
      documentId: currentDoc.id,
      documentName: currentDoc.name,
      pageIndex: pageIdx,
      pageNumber: page?.pageNumber || pageIdx + 1,
      snippet,
      createdAt: existing ? existing.createdAt : Date.now(),
      chapterTitle: page?.chapterTitle,
      note: noteText,
      colorTag: colorTag || 'yellow',
    };

    const updatedList = saveUserBookmark(updatedBookmark);
    setUserBookmarks(updatedList);
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    const updated = deleteUserBookmark(bookmarkId);
    setUserBookmarks(updated);
  };

  // Sleep Timer state
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // Word-level highlighting state
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(() => {
    return (localStorage.getItem('pdf_tts_highlight_mode') as HighlightMode) || 'word';
  });
  const [activeWordCharIndex, setActiveWordCharIndex] = useState<number | null>(null);
  const [activeWordLength, setActiveWordLength] = useState<number | null>(null);
  const [activeWordText, setActiveWordText] = useState<string | null>(null);

  const handleToggleHighlightMode = () => {
    setHighlightMode((prev) => {
      const next = prev === 'word' ? 'sentence' : 'word';
      localStorage.setItem('pdf_tts_highlight_mode', next);
      return next;
    });
  };

  // Reading Modes (Continuous Scroll vs Single Page)
  const [pageViewMode, setPageViewMode] = useState<PageViewMode>(() => {
    return (localStorage.getItem('pdf_tts_page_view_mode') as PageViewMode) || 'single';
  });

  // Auto-advance page toggle
  const [autoAdvancePage, setAutoAdvancePage] = useState<boolean>(() => {
    const saved = localStorage.getItem('pdf_tts_auto_advance');
    return saved !== null ? saved === 'true' : true;
  });
  const autoAdvancePageRef = useRef(autoAdvancePage);
  autoAdvancePageRef.current = autoAdvancePage;

  // Pronunciation & Word Definition Modal State
  const [isPronunciationModalOpen, setIsPronunciationModalOpen] = useState<boolean>(false);
  const [inspectedWord, setInspectedWord] = useState<string | null>(null);
  const [inspectedSentence, setInspectedSentence] = useState<string | null>(null);

  const handleTogglePageViewMode = () => {
    setPageViewMode((prev) => {
      const next = prev === 'single' ? 'continuous' : 'single';
      localStorage.setItem('pdf_tts_page_view_mode', next);
      return next;
    });
  };

  const handleToggleAutoAdvancePage = () => {
    setAutoAdvancePage((prev) => {
      const next = !prev;
      localStorage.setItem('pdf_tts_auto_advance', String(next));
      return next;
    });
  };

  const handleInspectWord = (word: string, sentence?: string) => {
    setInspectedWord(word);
    if (sentence) {
      setInspectedSentence(sentence);
    }
    setIsPronunciationModalOpen(true);
  };

  // Narrator Profile, Cadence Mode & Breath Pause
  const [narratorProfile, setNarratorProfile] = useState<VoiceNarratorProfile>(() => {
    return (localStorage.getItem('pdf_tts_narrator_profile') as VoiceNarratorProfile) || 'standard';
  });
  const [cadenceMode, setCadenceMode] = useState<CadenceMode>(() => {
    return (localStorage.getItem('pdf_tts_cadence_mode') as CadenceMode) || 'natural-audiobook';
  });
  const [sentenceDelayMs, setSentenceDelayMs] = useState<number>(() => {
    const saved = localStorage.getItem('pdf_tts_sentence_delay');
    return saved ? parseInt(saved, 10) : 150;
  });

  // Pro Podcast Equalizer & Audio Mastering Preset
  const [podcastEQPreset, setPodcastEQPreset] = useState<PodcastEQPreset>(() => {
    return (localStorage.getItem('pdf_tts_podcast_eq') as PodcastEQPreset) || 'pro-podcast';
  });

  // Adaptive Background Audio Ambience
  const [ambience, setAmbience] = useState<AmbienceSoundscape>(() => {
    return (localStorage.getItem('pdf_tts_ambience') as AmbienceSoundscape) || 'none';
  });

  // Modals for Concept Memory Bank & Deep Listening Mode
  const [isConceptMemoryOpen, setIsConceptMemoryOpen] = useState<boolean>(false);
  const [isDeepListeningOpen, setIsDeepListeningOpen] = useState<boolean>(false);

  // Current Session Statistics (Reading Time & Pages Completed)
  const [sessionReadingSeconds, setSessionReadingSeconds] = useState<number>(0);
  const [sessionCompletedPages, setSessionCompletedPages] = useState<Set<string>>(new Set());

  // Sync profile, cadence mode, delay & podcast EQ preset to engine
  useEffect(() => {
    ttsEngine.setProfile(narratorProfile);
    ttsEngine.setCadenceMode(cadenceMode);
    ttsEngine.setSentenceDelay(sentenceDelayMs);
    ttsEngine.setEQPreset(podcastEQPreset);
    ambienceEngine.setAmbience(ambience);
    localStorage.setItem('pdf_tts_cadence_mode', cadenceMode);
    localStorage.setItem('pdf_tts_podcast_eq', podcastEQPreset);
    localStorage.setItem('pdf_tts_ambience', ambience);
  }, [narratorProfile, cadenceMode, sentenceDelayMs, podcastEQPreset, ambience]);

  // Track session reading time (ticks every second while actively playing/listening)
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    const interval = setInterval(() => {
      setSessionReadingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  const handleResetSession = () => {
    setSessionReadingSeconds(0);
    setSessionCompletedPages(new Set());
  };

  // Keep references to state for TTS engine callbacks
  const currentDocRef = useRef(currentDoc);
  currentDocRef.current = currentDoc;
  const currentPageIndexRef = useRef(currentPageIndex);
  currentPageIndexRef.current = currentPageIndex;
  const currentSentenceIndexRef = useRef(currentSentenceIndex);
  currentSentenceIndexRef.current = currentSentenceIndex;

  // Refresh saved documents list
  const refreshDocuments = useCallback(async () => {
    const loaded = await getAllDocuments();
    const isCleared = localStorage.getItem('pdf_tts_library_cleared') === 'true';

    if (loaded.length === 0) {
      if (!isCleared) {
        // First run: Seed initial literature compendium, Jung book, and sample
        const compendium = build1000PagePhilosophicalCompendium();
        const jungBook = buildJungDedicatedBook();
        const sample1 = createDocumentFromSample(SAMPLE_DOCUMENTS[0]);
        await saveDocument(compendium);
        await saveDocument(jungBook);
        await saveDocument(sample1);
        const seeded = [compendium, jungBook, sample1];
        setDocuments(seeded);
        if (!currentDocRef.current) {
          setCurrentDoc(compendium);
          setCurrentPageIndex(0);
          setCurrentSentenceIndex(0);
        }
      } else {
        setDocuments([]);
        if (currentDocRef.current) {
          ttsEngine.stop();
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentDoc(null);
        }
      }
    } else {
      setDocuments(loaded);
      if (currentDocRef.current) {
        const stillExists = loaded.some((d) => d.id === currentDocRef.current?.id);
        if (!stillExists) {
          ttsEngine.stop();
          setIsPlaying(false);
          setIsPaused(false);
          const nextDoc = loaded[0] || null;
          setCurrentDoc(nextDoc);
          setCurrentPageIndex(nextDoc?.readingProgress?.pageIndex || 0);
          setCurrentSentenceIndex(nextDoc?.readingProgress?.sentenceIndex || 0);
        }
      } else {
        const firstDoc = loaded[0];
        setCurrentDoc(firstDoc);
        setCurrentPageIndex(firstDoc.readingProgress?.pageIndex || 0);
        setCurrentSentenceIndex(firstDoc.readingProgress?.sentenceIndex || 0);
      }
    }
  }, []);

  // Initialize voices & documents
  useEffect(() => {
    refreshDocuments();

    const updateVoicesList = () => {
      const v = ttsEngine.getVoices();
      setVoices(v);
    };

    updateVoicesList();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoicesList;
    }
  }, [refreshDocuments]);

  // Sync voice when current document or voice list changes
  // Offline-first: when navigator reports offline, force a local (on-device) voice
  // so playback never depends on Gemini cloud. Online keeps Studio HD default.
  useEffect(() => {
    if (voices.length === 0) return;
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;

    // Primary Baseline Voice: Prefer Built-in Studio HD US Male Voice (Puck / Charon)
    const studioMaleVoice = voices.find((v) => v.isBuiltInStudioVoice && v.isUSMale) || voices.find((v) => v.isBuiltInStudioVoice);
    const markVoice = voices.find((v) => v.name.toLowerCase().includes('mark'));
    const localFallback =
      voices.find((v) => !v.isBuiltInStudioVoice && v.isLocal && v.qualityGrade !== 'standard') ||
      voices.find((v) => !v.isBuiltInStudioVoice && v.isLocal) ||
      voices.find((v) => !v.isBuiltInStudioVoice);

    if (!selectedVoice) {
      const defaultToUse = offline
        ? (localFallback || markVoice || voices[0])
        : (studioMaleVoice || markVoice || voices[0]);
      if (defaultToUse) {
        setSelectedVoice(defaultToUse);
        ttsEngine.setVoiceByURI(defaultToUse.voice.voiceURI);
        return;
      }
    }

    // If we just went offline while a cloud voice is selected, auto-switch to local
    if (offline && selectedVoice?.isBuiltInStudioVoice && localFallback) {
      setSelectedVoice(localFallback);
      ttsEngine.setVoiceByURI(localFallback.voice.voiceURI);
      return;
    }

    // Check if current voice matches document language
    const docLang = currentDoc?.detectedLanguage || 'en-US';
    const primaryDocLang = docLang.split(/[-_]/)[0].toLowerCase();

    if (
      !selectedVoice ||
      (!selectedVoice.lang.toLowerCase().startsWith(primaryDocLang) && primaryDocLang !== 'en')
    ) {
      if (primaryDocLang === 'en' && studioMaleVoice) {
        setSelectedVoice(studioMaleVoice);
        ttsEngine.setVoiceByURI(studioMaleVoice.voice.voiceURI);
      } else {
        const best = ttsEngine.getBestVoiceForLanguage(docLang);
        if (best) {
          const found = voices.find((v) => v.voice.voiceURI === best.voiceURI);
          if (found) {
            setSelectedVoice(found);
            ttsEngine.setVoiceByURI(found.voice.voiceURI);
          }
        }
      }
    }
  }, [currentDoc, voices, selectedVoice]);

  // Setup TTS Engine Callbacks
  useEffect(() => {
    ttsEngine.setCallbacks({
      onWordBoundary: (boundary) => {
        setActiveWordCharIndex(boundary.charIndex);
        setActiveWordLength(boundary.charLength);
        setActiveWordText(boundary.word);
      },
      onSentenceStart: (sentenceIdx, text) => {
        setCurrentSentenceIndex(sentenceIdx);
        setActiveWordCharIndex(0);

        // Pre-detect first word range for immediate feedback
        const wordRanges = extractWordRanges(text);
        if (wordRanges.length > 0) {
          setActiveWordLength(wordRanges[0].charLength);
          setActiveWordText(wordRanges[0].word);
        } else {
          setActiveWordLength(null);
          setActiveWordText(null);
        }

        // Update Media Session API for mobile lock screen & on-the-go controls
        if ('mediaSession' in navigator && currentDocRef.current) {
          const doc = currentDocRef.current;
          const pageIdx = currentPageIndexRef.current;
          navigator.mediaSession.metadata = new MediaMetadata({
            title: text || `Page ${pageIdx + 1} Sentence ${sentenceIdx + 1}`,
            artist: `PDF Voice • ${doc.detectedLanguage.toUpperCase()}`,
            album: doc.name,
          });
        }
      },
      onSentenceEnd: (sentenceIdx) => {
        setActiveWordCharIndex(null);
        setActiveWordLength(null);
        setActiveWordText(null);

        // Save progress periodically and mark page as completed if reached the end
        if (currentDocRef.current) {
          const doc = currentDocRef.current;
          const pageIdx = currentPageIndexRef.current;
          const page = doc.pages[pageIdx];

          if (page && sentenceIdx >= page.sentences.length - 1) {
            const pageKey = `${doc.id}_p${pageIdx}`;
            setSessionCompletedPages((prev) => {
              const next = new Set(prev);
              next.add(pageKey);
              return next;
            });
          }

          updateReadingProgress(doc.id, {
            pageIndex: pageIdx,
            sentenceIndex: sentenceIdx,
            paragraphIndex: 0,
            completed: false,
            lastReadAt: Date.now(),
          });
        }
      },
      onPageEnd: () => {
        // Mark page completed in current session
        const doc = currentDocRef.current;
        const pageIdx = currentPageIndexRef.current;

        if (doc) {
          const pageKey = `${doc.id}_p${pageIdx}`;
          setSessionCompletedPages((prev) => {
            const next = new Set(prev);
            next.add(pageKey);
            return next;
          });
        }

        // When a page ends, automatically advance to next page if autoAdvancePage is enabled!
        if (doc && autoAdvancePageRef.current && pageIdx < doc.pages.length - 1) {
          const nextPageIdx = pageIdx + 1;
          currentPageIndexRef.current = nextPageIdx;
          setCurrentPageIndex(nextPageIdx);
          setCurrentSentenceIndex(0);
          const nextPage = doc.pages[nextPageIdx];
          if (nextPage && nextPage.sentences.length > 0) {
            ttsEngine.startPlayback(nextPage.sentences, 0);
          }
        } else {
          // Finished entire document or auto-advance is disabled
          setIsPlaying(false);
          setIsPaused(false);
        }
      },
      onStateChange: (playing, paused) => {
        setIsPlaying(playing);
        setIsPaused(paused);
      },
      onError: (err) => {
        console.warn('TTS error encountered:', err);
        const msg = err?.message || 'Speech playback failed';
        // Don't spam for user-initiated interrupts; surface real failures
        if (/interrupted|canceled/i.test(msg)) return;
        setTtsError(msg);
      },
    });
  }, []);

  // Configure Media Session Action Handlers
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        handleResume();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        handlePause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrevSentence();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNextSentence();
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        handlePrevSentence();
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        handleNextSentence();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        handleStop();
      });
    }
  }, [isPlaying, isPaused, currentPageIndex, currentSentenceIndex, currentDoc]);

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (!sleepTimerEnd) {
      setSleepTimerRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = sleepTimerEnd - now;

      if (remainingMs <= 0) {
        // Timer fired: stop speech smoothly
        ttsEngine.stop();
        setIsPlaying(false);
        setIsPaused(false);
        setSleepTimerEnd(null);
        setSleepTimerRemaining(null);
      } else {
        setSleepTimerRemaining(Math.max(1, Math.ceil(remainingMs / 60000)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerEnd]);

  // Playback Control Handlers
  const handlePlay = () => {
    if (!currentDoc) return;
    const page = currentDoc.pages[currentPageIndex];
    if (!page || page.sentences.length === 0) return;

    ttsEngine.setRate(rate);
    ttsEngine.setPitch(pitch);
    ttsEngine.setVolume(volume);
    if (selectedVoice) {
      ttsEngine.setVoiceByURI(selectedVoice.voice.voiceURI);
    }
    ttsEngine.startPlayback(page.sentences, currentSentenceIndex);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    ttsEngine.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    if (isPaused) {
      ttsEngine.resume();
      setIsPaused(false);
    } else {
      handlePlay();
    }
  };

  const handleStop = () => {
    ttsEngine.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveWordCharIndex(null);
    setActiveWordLength(null);
    setActiveWordText(null);
  };

  const handleNextSentence = () => {
    if (!currentDoc) return;
    const page = currentDoc.pages[currentPageIndex];
    if (!page) return;

    if (currentSentenceIndex < page.sentences.length - 1) {
      ttsEngine.nextSentence();
    } else if (currentPageIndex < currentDoc.pages.length - 1) {
      handleNextPage();
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      ttsEngine.previousSentence();
    } else if (currentPageIndex > 0) {
      handlePrevPage();
    }
  };

  const handleNextPage = () => {
    if (!currentDoc || currentPageIndex >= currentDoc.pages.length - 1) return;
    const nextIdx = currentPageIndex + 1;
    setCurrentPageIndex(nextIdx);
    setCurrentSentenceIndex(0);

    const nextPage = currentDoc.pages[nextIdx];
    if (nextPage && nextPage.sentences.length > 0) {
      if (isPlaying) {
        ttsEngine.startPlayback(nextPage.sentences, 0);
      } else {
        ttsEngine.loadSentences(nextPage.sentences, 0);
      }
    }
  };

  const handlePrevPage = () => {
    if (!currentDoc || currentPageIndex <= 0) return;
    const prevIdx = currentPageIndex - 1;
    setCurrentPageIndex(prevIdx);
    setCurrentSentenceIndex(0);

    const prevPage = currentDoc.pages[prevIdx];
    if (prevPage && prevPage.sentences.length > 0) {
      if (isPlaying) {
        ttsEngine.startPlayback(prevPage.sentences, 0);
      } else {
        ttsEngine.loadSentences(prevPage.sentences, 0);
      }
    }
  };

  const handleSelectSentence = (sentenceIdx: number, pageIdx?: number) => {
    if (!currentDoc) return;
    const targetPageIdx = pageIdx !== undefined ? pageIdx : currentPageIndex;
    if (targetPageIdx !== currentPageIndex) {
      setCurrentPageIndex(targetPageIdx);
      currentPageIndexRef.current = targetPageIdx;
    }
    const page = currentDoc.pages[targetPageIdx];
    if (!page) return;

    setCurrentSentenceIndex(sentenceIdx);
    setActiveWordCharIndex(0);
    const words = extractWordRanges(page.sentences[sentenceIdx] || '');
    if (words.length > 0) {
      setActiveWordLength(words[0].charLength);
      setActiveWordText(words[0].word);
    } else {
      setActiveWordLength(null);
      setActiveWordText(null);
    }
    ttsEngine.loadSentences(page.sentences, sentenceIdx);
    ttsEngine.startPlayback(page.sentences, sentenceIdx);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePageChange = (pageIdx: number) => {
    if (!currentDoc || pageIdx < 0 || pageIdx >= currentDoc.pages.length) return;
    setCurrentPageIndex(pageIdx);
    setCurrentSentenceIndex(0);

    const page = currentDoc.pages[pageIdx];
    if (page && page.sentences.length > 0) {
      if (isPlaying) {
        ttsEngine.startPlayback(page.sentences, 0);
      } else {
        ttsEngine.loadSentences(page.sentences, 0);
      }
    }
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    ttsEngine.setRate(newRate);
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    ttsEngine.setPitch(newPitch);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ttsEngine.setVolume(newVol);
  };

  const handleSelectVoice = (voiceInfo: TTSVoiceInfo) => {
    setSelectedVoice(voiceInfo);
    ttsEngine.setVoiceByURI(voiceInfo.voice.voiceURI);
    setIsVoiceModalOpen(false);
  };

  const handleSelectProfile = (newProfile: VoiceNarratorProfile) => {
    setNarratorProfile(newProfile);
    localStorage.setItem('pdf_tts_narrator_profile', newProfile);
    ttsEngine.setProfile(newProfile);
    const cfg = NARRATOR_PROFILES[newProfile];
    if (cfg) {
      setRate(cfg.rate);
      ttsEngine.setRate(cfg.rate);
      setPitch(cfg.pitch);
      ttsEngine.setPitch(cfg.pitch);
      setSentenceDelayMs(cfg.sentenceDelayMs);
      ttsEngine.setSentenceDelay(cfg.sentenceDelayMs);
    }
  };

  // Bookmark state & toggle for current page
  const [bookmarks, setBookmarks] = useState(() => getUserBookmarks());

  const handleToggleBookmarkCurrentPage = () => {
    if (!currentDoc) return;
    const result = toggleUserBookmark(currentDoc, currentPageIndex);
    setBookmarks(result.bookmarks);
  };

  const isCurrentPageBookmarked = currentDoc
    ? bookmarks.some(
        (b) => b.documentId === currentDoc.id && b.pageIndex === currentPageIndex
      )
    : false;

  const handleSentenceDelayChange = (ms: number) => {
    setSentenceDelayMs(ms);
    localStorage.setItem('pdf_tts_sentence_delay', ms.toString());
    ttsEngine.setSentenceDelay(ms);
  };

  const handleSelectDocument = (doc: DocumentItem, targetPageIndex?: number) => {
    ttsEngine.stop();
    setCurrentDoc(doc);
    const initialPage = targetPageIndex !== undefined
      ? Math.min(targetPageIndex, doc.pages.length - 1)
      : Math.min(doc.readingProgress?.pageIndex || 0, doc.pages.length - 1);
    const initialSentence = targetPageIndex !== undefined ? 0 : (doc.readingProgress?.sentenceIndex || 0);
    setCurrentPageIndex(initialPage);
    setCurrentSentenceIndex(initialSentence);

    const page = doc.pages[initialPage];
    if (page && page.sentences.length > 0) {
      ttsEngine.loadSentences(page.sentences, initialSentence);
    }
  };

  const handleSetSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerEnd(null);
      setSleepTimerRemaining(null);
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      setSleepTimerEnd(endTime);
      setSleepTimerRemaining(minutes);
    }
  };

  const handleChangeTheme = (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    localStorage.setItem('pdf_tts_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync dark class on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleChangeFontSize = (newSize: ReaderFontSize) => {
    setFontSize(newSize);
    localStorage.setItem('pdf_tts_fontsize', newSize);
  };

  // Keyboard shortcut Ctrl+F / Cmd+F for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectSearchResult = (pageIdx: number, sentenceIdx: number) => {
    handlePageChange(pageIdx);
    setTimeout(() => {
      handleSelectSentence(sentenceIdx, pageIdx);
    }, 40);
  };

  const handleDeleteDocument = useCallback(async (docId: string) => {
    await deleteDocument(docId);
    await refreshDocuments();
  }, [refreshDocuments]);

  const handleChangeContentLanguage = (newLang: string, voiceURI?: string) => {
    if (!currentDoc) return;
    const updatedDoc: DocumentItem = {
      ...currentDoc,
      detectedLanguage: newLang,
      customSettings: {
        ...currentDoc.customSettings,
        lang: newLang,
        voiceURI: voiceURI || currentDoc.customSettings?.voiceURI,
      },
    };
    setCurrentDoc(updatedDoc);
    saveDocument(updatedDoc);

    // Pick matching voice
    if (voiceURI) {
      const v = voices.find((item) => item.voice.voiceURI === voiceURI);
      if (v) {
        setSelectedVoice(v);
        ttsEngine.setVoiceByURI(voiceURI);
      }
    } else {
      const best = ttsEngine.getBestVoiceForLanguage(newLang);
      if (best) {
        const found = voices.find((item) => item.voice.voiceURI === best.voiceURI);
        if (found) {
          setSelectedVoice(found);
          ttsEngine.setVoiceByURI(found.voice.voiceURI);
        }
      }
    }

    // If active playback is ongoing, restart current sentence with the new language voice immediately!
    if (isPlaying) {
      const page = updatedDoc.pages[currentPageIndex];
      if (page && page.sentences.length > 0) {
        ttsEngine.startPlayback(page.sentences, currentSentenceIndex);
      }
    }
  };

  const currentPage = currentDoc?.pages[currentPageIndex];
  const activeSentenceText = currentPage?.sentences[currentSentenceIndex] || '';
  const totalSentencesInPage = currentPage?.sentences.length || 0;
  const totalPageCount = currentDoc?.pages.length || 1;

  // Auto-dismiss TTS error toast after 6s
  useEffect(() => {
    if (!ttsError) return;
    const t = setTimeout(() => setTtsError(null), 6000);
    return () => clearTimeout(t);
  }, [ttsError]);

  const playbackState: PlaybackState = {
    isPlaying,
    isPaused,
    currentDocumentId: currentDoc?.id || null,
    currentPageIndex,
    currentSentenceIndex,
    rate,
    pitch,
    volume,
    voiceURI: selectedVoice?.voice.voiceURI || null,
    targetLang: currentDoc?.detectedLanguage || 'en-US',
    autoScroll,
    sleepTimerEnd,
    sleepTimerRemainingMinutes: sleepTimerRemaining,
    profile: narratorProfile,
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased ${theme === 'dark' || theme === 'oled' || theme === 'nord' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navigation - Collapsed/Hidden in Zen Mode for distraction-free reading */}
      {!zenMode && (
        <Header
          currentDoc={currentDoc}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          theme={theme}
          onChangeTheme={handleChangeTheme}
          fontSize={fontSize}
          onChangeFontSize={handleChangeFontSize}
          sessionReadingSeconds={sessionReadingSeconds}
          sessionPagesCompleted={sessionCompletedPages.size}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenLanguageSwitcher={() => setIsLanguageSwitcherOpen(true)}
          zenMode={zenMode}
          onToggleZenMode={handleToggleZenMode}
          onOpenStyleModal={() => setIsStyleModalOpen(true)}
          onOpenPageNotes={() => setIsPageNotesOpen(true)}
        />
      )}

      {/* Main Document Reader Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <DocumentReader
          document={currentDoc}
          currentPageIndex={currentPageIndex}
          currentSentenceIndex={currentSentenceIndex}
          isPlaying={isPlaying}
          theme={theme}
          fontSize={fontSize}
          fontFamily={fontFamily}
          lineWidth={lineWidth}
          lineHeight={lineHeight}
          paragraphIndent={paragraphIndent}
          autoScroll={autoScroll}
          sessionReadingSeconds={sessionReadingSeconds}
          sessionPagesCompleted={sessionCompletedPages.size}
          activeWordCharIndex={activeWordCharIndex}
          activeWordLength={activeWordLength}
          highlightMode={highlightMode}
          pageViewMode={pageViewMode}
          autoAdvancePage={autoAdvancePage}
          zenMode={zenMode}
          onToggleZenMode={handleToggleZenMode}
          onTogglePageViewMode={handleTogglePageViewMode}
          onToggleAutoAdvancePage={handleToggleAutoAdvancePage}
          onToggleHighlightMode={handleToggleHighlightMode}
          onResetSession={handleResetSession}
          onSelectSentence={handleSelectSentence}
          onChangePage={handlePageChange}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onInspectWord={handleInspectWord}
          onOpenPronunciationModal={() => setIsPronunciationModalOpen(true)}
          onOpenOCR={() => setIsOCROpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenPageSelector={() => setIsPageSelectorOpen(true)}
          onOpenLanguageSwitcher={() => setIsLanguageSwitcherOpen(true)}
          onOpenStyleModal={() => setIsStyleModalOpen(true)}
          onOpenPageNotes={() => setIsPageNotesOpen(true)}
          onOpenDeepListening={() => setIsDeepListeningOpen(true)}
          onOpenConceptMemory={() => setIsConceptMemoryOpen(true)}
          isCurrentPageBookmarked={isCurrentPageBookmarked}
          onToggleBookmark={handleToggleBookmarkCurrentPage}
          onTogglePlay={isPlaying ? handlePause : handlePlay}
          onDeleteDocument={handleDeleteDocument}
          onChangeLineWidth={(w) => {
            setLineWidth(w);
            localStorage.setItem('pdf_tts_line_width', w);
          }}
          onChangeFontSize={(s) => {
            setFontSize(s);
            localStorage.setItem('pdf_tts_fontsize', s);
          }}
          onChangeLineHeight={(h) => {
            setLineHeight(h);
            localStorage.setItem('pdf_tts_line_height', h);
          }}
        />
      </main>

      {/* Sticky Audio Player Controls (Hidden in Zen Mode to maximize canvas area) */}
      {!zenMode && (
        <AudioPlayerBar
          playbackState={playbackState}
          activeSentenceText={activeSentenceText}
          activeWordText={activeWordText}
          highlightMode={highlightMode}
          currentProfile={narratorProfile}
          cadenceMode={cadenceMode}
          sentenceDelayMs={sentenceDelayMs}
          onSentenceDelayChange={handleSentenceDelayChange}
          totalSentencesInPage={totalSentencesInPage}
          totalPageCount={totalPageCount}
          currentVoice={selectedVoice}
          onPlay={handlePlay}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onNextSentence={handleNextSentence}
          onPrevSentence={handlePrevSentence}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          onSelectPage={handlePageChange}
          onOpenPageSelector={() => setIsPageSelectorOpen(true)}
          onRateChange={handleRateChange}
          onPitchChange={handlePitchChange}
          onVolumeChange={handleVolumeChange}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
          onSetSleepTimer={handleSetSleepTimer}
        />
      )}

      {/* Document Library / PDF Uploader Modal */}
      <DocumentLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        documents={documents}
        currentDocId={currentDoc?.id || null}
        onSelectDocument={handleSelectDocument}
        onRefreshDocuments={refreshDocuments}
      />

      {/* Voice & Language Selection Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        voices={voices}
        selectedVoiceURI={selectedVoice?.voice.voiceURI || null}
        onSelectVoice={handleSelectVoice}
        currentLang={currentDoc?.detectedLanguage || 'en-US'}
        currentProfile={narratorProfile}
        onSelectProfile={handleSelectProfile}
        currentCadenceMode={cadenceMode}
        onSelectCadenceMode={setCadenceMode}
        currentEQPreset={podcastEQPreset}
        onSelectEQPreset={setPodcastEQPreset}
        currentAmbience={ambience}
        onSelectAmbience={setAmbience}
        documentSentences={currentDoc?.pages?.[currentPageIndex]?.sentences || currentDoc?.pages?.flatMap(p => p.sentences) || []}
        documentName={currentDoc?.name || 'Active Document'}
      />

      {/* Pronunciation, IPA, Stress & Word Meaning Modal */}
      <PronunciationModal
        isOpen={isPronunciationModalOpen}
        onClose={() => setIsPronunciationModalOpen(false)}
        initialWord={inspectedWord}
        currentSentence={inspectedSentence || activeSentenceText}
        detectedLang={currentDoc?.detectedLanguage || 'en-US'}
      />

      {/* Document Text Search Modal (Ctrl+F) */}
      <DocumentSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        document={currentDoc}
        currentPageIndex={currentPageIndex}
        onSelectResult={handleSelectSearchResult}
      />

      {/* PDF Page Selector Modal (Grid & List thumbnails) */}
      <PageSelectorModal
        isOpen={isPageSelectorOpen}
        onClose={() => setIsPageSelectorOpen(false)}
        document={currentDoc}
        currentPageIndex={currentPageIndex}
        onSelectPage={handlePageChange}
      />

      {/* Content Language & Voice Switcher Modal (Default En-German priority) */}
      <LanguageSwitcherModal
        isOpen={isLanguageSwitcherOpen}
        onClose={() => setIsLanguageSwitcherOpen(false)}
        currentDoc={currentDoc}
        voices={voices}
        selectedVoice={selectedVoice}
        onSelectLanguage={handleChangeContentLanguage}
        onSelectVoice={handleSelectVoice}
      />

      {/* Reader Typography & Theme Customization Modal */}
      <ReaderStyleModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        theme={theme}
        onChangeTheme={handleChangeTheme}
        fontSize={fontSize}
        onChangeFontSize={handleChangeFontSize}
        fontFamily={fontFamily}
        onChangeFontFamily={(f) => {
          setFontFamily(f);
          localStorage.setItem('pdf_tts_font_family', f);
        }}
        lineWidth={lineWidth}
        onChangeLineWidth={(w) => {
          setLineWidth(w);
          localStorage.setItem('pdf_tts_line_width', w);
        }}
        lineHeight={lineHeight}
        onChangeLineHeight={(h) => {
          setLineHeight(h);
          localStorage.setItem('pdf_tts_line_height', h);
        }}
        paragraphIndent={paragraphIndent}
        onChangeParagraphIndent={(pi) => {
          setParagraphIndent(pi);
          localStorage.setItem('pdf_tts_paragraph_indent', pi);
        }}
        highlightMode={highlightMode}
        onToggleHighlightMode={handleToggleHighlightMode}
        zenMode={zenMode}
        onToggleZenMode={handleToggleZenMode}
      />

      {/* Bookmark & Page Notes Drawer Modal */}
      <PageNotesDrawerModal
        isOpen={isPageNotesOpen}
        onClose={() => setIsPageNotesOpen(false)}
        document={currentDoc}
        currentPageIndex={currentPageIndex}
        bookmarks={userBookmarks}
        onSaveBookmarkNote={handleSaveBookmarkNote}
        onDeleteBookmark={handleDeleteBookmark}
        onSelectPage={(pageIdx) => {
          handlePageChange(pageIdx);
          setIsPageNotesOpen(false);
        }}
      />

      {/* Professional English OCR Modal */}
      <OCRModal
        isOpen={isOCROpen}
        onClose={() => setIsOCROpen(false)}
        document={currentDoc}
        currentPageIndex={currentPageIndex}
        pdfArrayBuffer={pdfArrayBuffer}
        onDocumentUpdated={(updatedDoc) => {
          setCurrentDoc(updatedDoc);
          refreshDocuments();
        }}
      />

      {/* Concept Memory Bank Modal */}
      <ConceptMemoryModal
        isOpen={isConceptMemoryOpen}
        onClose={() => setIsConceptMemoryOpen(false)}
        documentId={currentDoc?.id}
        documentName={currentDoc?.name}
        onJumpToConcept={(pageIdx, sentenceIdx) => {
          handlePageChange(pageIdx);
          handleSelectSentence(sentenceIdx, pageIdx);
          if (!isPlaying) handlePlay();
        }}
      />

      {/* Distraction-Free Deep Listening Mode Overlay */}
      <DeepListeningOverlay
        isOpen={isDeepListeningOpen}
        onClose={() => setIsDeepListeningOpen(false)}
        documentTitle={currentDoc?.name || 'Philosophical Library'}
        chapterTitle={currentDoc?.pages[currentPageIndex]?.chapterTitle}
        currentPageText={currentDoc?.pages[currentPageIndex]?.text || ''}
        currentSentenceText={
          currentDoc?.pages[currentPageIndex]?.sentences[currentSentenceIndex] || ''
        }
        currentSentenceIndex={currentSentenceIndex}
        totalSentences={currentDoc?.pages[currentPageIndex]?.sentences.length || 0}
        currentPageNumber={currentPageIndex + 1}
        totalPages={currentDoc?.pages.length || 1}
        playbackState={{
          isPlaying,
          isPaused,
          rate,
          pitch,
          volume,
          currentSentenceIndex,
          totalSentences: currentDoc?.pages[currentPageIndex]?.sentences.length || 0,
          currentPageIndex,
          totalPages: currentDoc?.pages.length || 1,
          selectedVoiceURI: selectedVoice?.voice.voiceURI || null,
          selectedVoiceName: selectedVoice?.name,
          currentProfile: narratorProfile,
          cadenceMode,
          sentenceDelayMs,
          podcastEQPreset,
          ambienceSoundscape: ambience,
        }}
        onTogglePlay={isPlaying ? handlePause : handlePlay}
        onSeekSentence={(offset) => {
          const nextIdx = currentSentenceIndex + offset;
          const maxIdx = (currentDoc?.pages[currentPageIndex]?.sentences.length || 1) - 1;
          if (nextIdx >= 0 && nextIdx <= maxIdx) {
            handleSelectSentence(nextIdx, currentPageIndex);
          }
        }}
        onSpeedChange={(newRate) => {
          setRate(newRate);
          ttsEngine.setRate(newRate);
        }}
        onSaveConcept={(term) => {
          if (!currentDoc) return;
          conceptMemoryService.addConcept({
            documentId: currentDoc.id,
            documentName: currentDoc.name,
            term,
            definition: currentDoc.pages[currentPageIndex]?.sentences[currentSentenceIndex] || '',
            pageIndex: currentPageIndex,
            sentenceIndex: currentSentenceIndex,
          });
          setIsConceptMemoryOpen(true);
        }}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* TTS Error Toast — tells user why audio failed + fallback state */}
      {ttsError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-2xl bg-rose-600 text-white shadow-2xl flex items-start gap-3 text-sm">
          <span className="font-semibold shrink-0">TTS ล้มเหลว</span>
          <span className="flex-1 opacity-90">{ttsError} — ลองใช้เสียงระบบ / เช็ค GEMINI_API_KEY</span>
          <button
            onClick={() => setTtsError(null)}
            className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
