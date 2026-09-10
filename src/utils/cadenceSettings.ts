import { CadenceMode } from '../types';

export interface CadenceModeConfig {
  id: CadenceMode;
  name: string;
  nameThai: string;
  badge: string;
  icon: string;
  tagline: string;
  description: string;
  rateMultiplier: number;
  commaPauseMs: number;
  periodPauseMs: number;
  paragraphPauseMs: number;
  clausePauseMs: number;
  shadowingDelayMs: number;
  dynamicVelocity: boolean;
}

export const CADENCE_MODES: Record<CadenceMode, CadenceModeConfig> = {
  'natural-audiobook': {
    id: 'natural-audiobook',
    name: 'Natural Audiobook',
    nameThai: '📖 หนังสือนิยาย/บทความธรรมชาติ',
    badge: '📖 Storytelling Rhythm',
    icon: 'BookOpen',
    tagline: 'Warm storytelling flow with soft breath pauses and balanced pacing.',
    description: 'จังหวะการอ่านสไตล์หนังสือเสียง ละมุน เป็นธรรมชาติ เว้นช่วงวรรคตอนพอเหมาะ ฟังสบายได้ต่อเนื่องยาวนาน',
    rateMultiplier: 0.98,
    commaPauseMs: 280,
    periodPauseMs: 650,
    paragraphPauseMs: 1100,
    clausePauseMs: 220,
    shadowingDelayMs: 0,
    dynamicVelocity: true,
  },
  'intensive-study': {
    id: 'intensive-study',
    name: 'Intensive Study & Shadowing',
    nameThai: '🎓 ฝึกภาษา/ศึกษาเข้มข้น (Shadowing)',
    badge: '🎓 Shadowing & Repeating',
    icon: 'GraduationCap',
    tagline: 'Deliberate pacing with extended gaps after periods for practicing speech shadowing.',
    description: 'จังหวะเน้นความชัดเจน เว้นระยะหลังจบประโยค 1.2-1.6 วินาที เหมาะสำหรับผู้เรียนฝึกพูดตาม (Shadowing) หรือทำความเข้าใจประโยคซับซ้อน',
    rateMultiplier: 0.85,
    commaPauseMs: 380,
    periodPauseMs: 1200,
    paragraphPauseMs: 1600,
    clausePauseMs: 320,
    shadowingDelayMs: 1200,
    dynamicVelocity: false,
  },
  'executive-skim': {
    id: 'executive-skim',
    name: 'Executive Skim & Digest',
    nameThai: '⚡ สแกนเนื้อหาด่วน (Executive Skim)',
    badge: '⚡ High-Speed Skim',
    icon: 'Zap',
    tagline: 'Snappy cadence with compact pauses for absorbing documents rapidly.',
    description: 'จังหวะกระชับ รวดเร็ว ลดเวลาว่างระหว่างย่อหน้า เหมาะสำหรับการฟังเก็บหัวข้อหลักของเอกสารหรือรายงานสรุปอย่างมีประสิทธิภาพ',
    rateMultiplier: 1.35,
    commaPauseMs: 120,
    periodPauseMs: 320,
    paragraphPauseMs: 500,
    clausePauseMs: 100,
    shadowingDelayMs: 0,
    dynamicVelocity: true,
  },
  'deep-reflection': {
    id: 'deep-reflection',
    name: 'Deep Reflection & Philosophy',
    nameThai: '🧠 ปรัชญา/สะท้อนความคิด (Philosophy)',
    badge: '🧠 Deep Contemplation',
    icon: 'Brain',
    tagline: 'Measured, contemplative cadence tailored for C.G. Jung & complex psychoanalytic texts.',
    description: 'จังหวะสุขุม ตรึกตรอง เว้นวรรคเมื่อเจอเครื่องหมายวรรคตอนและย่อหน้าให้อารมณ์ตกผลึกความคิด เหมาะกับหนังสือ C.G. Jung, Nietzsche และวรรณกรรมวิชาการ',
    rateMultiplier: 0.90,
    commaPauseMs: 350,
    periodPauseMs: 800,
    paragraphPauseMs: 1400,
    clausePauseMs: 280,
    shadowingDelayMs: 0,
    dynamicVelocity: true,
  },
};

/**
 * Calculates effective pause duration in milliseconds based on text ending punctuation and paragraph position.
 */
export function calculatePunctuationPause(
  text: string,
  isParagraphEnd: boolean,
  modeConfig: CadenceModeConfig,
  customSentenceDelayMs?: number
): number {
  let basePause = modeConfig.periodPauseMs;
  const trimmed = text.trim();

  if (isParagraphEnd) {
    basePause = modeConfig.paragraphPauseMs;
  } else if (/[!?]$/.test(trimmed)) {
    basePause = modeConfig.periodPauseMs + 100;
  } else if (/[;:]$/.test(trimmed) || /—$|--$/.test(trimmed)) {
    basePause = modeConfig.commaPauseMs + 80;
  } else if (/,$/.test(trimmed)) {
    basePause = modeConfig.commaPauseMs;
  }

  if (customSentenceDelayMs !== undefined && customSentenceDelayMs > 0) {
    // Blend custom sentence delay setting proportionally
    const ratio = customSentenceDelayMs / 250;
    basePause = Math.round(basePause * ratio);
  }

  return Math.max(50, basePause);
}
