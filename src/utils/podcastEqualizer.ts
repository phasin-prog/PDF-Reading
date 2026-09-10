export type PodcastEQPreset = 'pro-podcast' | 'warm-fm' | 'crisp-vocal' | 'flat-studio';

export interface EQBandSetting {
  frequency: number; // Hz (e.g. 80, 250, 1000, 3500, 11000)
  gain: number;      // dB (-12 to +12)
  label: string;     // e.g. "80Hz Cut", "250Hz Warmth", "1kHz Body", "3.5kHz Presence", "11kHz Air"
  type: 'highpass' | 'peaking' | 'highshelf';
}

export interface PodcastMasteringPresetConfig {
  id: PodcastEQPreset;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  bands: EQBandSetting[];
  compression: {
    ratio: string;        // e.g. "2.8 : 1"
    attackMs: number;     // e.g. 12
    releaseMs: number;    // e.g. 160
    thresholdDb: number;  // e.g. -16
    kneeDb: number;       // e.g. 6
    makeupGainDb: number; // e.g. +1.8
  };
  pitchFormantShift: number; // pitch multiplier e.g. 0.98 for proximity chest warmth
  volumePeakCap: number;     // volume multiplier e.g. 0.96 for peak limiter protection
  deEsserLevel: 'gentle' | 'moderate' | 'strong';
}

export const PODCAST_EQ_PRESETS: Record<PodcastEQPreset, PodcastMasteringPresetConfig> = {
  'pro-podcast': {
    id: 'pro-podcast',
    name: '🎙️ Pro Podcast Studio (Mastered Broadcast)',
    badge: '⭐ Professional Podcast Standard (Default)',
    tagline: 'Deep chest warmth, 80Hz low-cut rumble filter, 3.5kHz vocal presence & soft peak limiter.',
    description: 'Calibrated to replicate top-tier podcast studio gear (Shure SM7B mic & DBX 286s vocal processor). Removes room hum, boosts chest resonance, and tames harsh sibilance.',
    bands: [
      { frequency: 80, gain: -6, label: '80Hz Rumble Cut', type: 'highpass' },
      { frequency: 250, gain: +2.8, label: '250Hz Proximity Warmth', type: 'peaking' },
      { frequency: 1000, gain: 0, label: '1kHz Mid Body', type: 'peaking' },
      { frequency: 3500, gain: +3.2, label: '3.5kHz Vocal Presence', type: 'peaking' },
      { frequency: 11000, gain: -1.2, label: '11kHz Air High Shelf', type: 'highshelf' },
    ],
    compression: {
      ratio: '2.8 : 1',
      attackMs: 12,
      releaseMs: 160,
      thresholdDb: -16,
      kneeDb: 6,
      makeupGainDb: 1.8,
    },
    pitchFormantShift: 0.98,
    volumePeakCap: 0.96,
    deEsserLevel: 'strong',
  },
  'warm-fm': {
    id: 'warm-fm',
    name: '📻 Warm FM Radio Resonance',
    badge: '📻 Deep FM Warmth',
    tagline: 'Rich low-end proximity resonance with velvet soft highs for immersive listening.',
    description: 'Classic radio broadcast tone with emphasized low-mid body and smooth high-frequency roll-off.',
    bands: [
      { frequency: 80, gain: -4, label: '80Hz Sub Cut', type: 'highpass' },
      { frequency: 250, gain: +4.0, label: '250Hz Deep Bass', type: 'peaking' },
      { frequency: 1000, gain: +0.5, label: '1kHz Core', type: 'peaking' },
      { frequency: 3500, gain: +1.8, label: '3.5kHz Clarity', type: 'peaking' },
      { frequency: 11000, gain: -2.5, label: '11kHz Soft Roll-off', type: 'highshelf' },
    ],
    compression: {
      ratio: '3.2 : 1',
      attackMs: 10,
      releaseMs: 200,
      thresholdDb: -18,
      kneeDb: 8,
      makeupGainDb: 2.2,
    },
    pitchFormantShift: 0.96,
    volumePeakCap: 0.95,
    deEsserLevel: 'moderate',
  },
  'crisp-vocal': {
    id: 'crisp-vocal',
    name: '🎧 Crisp Academic Clarity',
    badge: '🎓 High Articulation',
    tagline: 'Sharp consonant definition and enhanced speech intelligibility for complex literature.',
    description: 'Brings vocals forward with boosted 3.5kHz presence and high-pass filtering to maximize academic concentration.',
    bands: [
      { frequency: 80, gain: -8, label: '80Hz Cut', type: 'highpass' },
      { frequency: 250, gain: +1.0, label: '250Hz Neutral', type: 'peaking' },
      { frequency: 1000, gain: +1.2, label: '1kHz Mid Punch', type: 'peaking' },
      { frequency: 3500, gain: +4.5, label: '3.5kHz Sharp Focus', type: 'peaking' },
      { frequency: 11000, gain: +1.0, label: '11kHz Crisp Air', type: 'highshelf' },
    ],
    compression: {
      ratio: '2.0 : 1',
      attackMs: 15,
      releaseMs: 120,
      thresholdDb: -14,
      kneeDb: 4,
      makeupGainDb: 1.0,
    },
    pitchFormantShift: 1.0,
    volumePeakCap: 0.98,
    deEsserLevel: 'gentle',
  },
  'flat-studio': {
    id: 'flat-studio',
    name: '🔊 Flat Studio Monitor',
    badge: '🎛️ Reference Flat',
    tagline: 'Clean uncolored acoustic reference with default system response.',
    description: 'Raw un-equalized speech output for direct reference without EQ coloring or compression.',
    bands: [
      { frequency: 80, gain: 0, label: '80Hz Flat', type: 'highpass' },
      { frequency: 250, gain: 0, label: '250Hz Flat', type: 'peaking' },
      { frequency: 1000, gain: 0, label: '1kHz Flat', type: 'peaking' },
      { frequency: 3500, gain: 0, label: '3.5kHz Flat', type: 'peaking' },
      { frequency: 11000, gain: 0, label: '11kHz Flat', type: 'highshelf' },
    ],
    compression: {
      ratio: '1.0 : 1',
      attackMs: 20,
      releaseMs: 100,
      thresholdDb: 0,
      kneeDb: 0,
      makeupGainDb: 0,
    },
    pitchFormantShift: 1.0,
    volumePeakCap: 1.0,
    deEsserLevel: 'gentle',
  },
};

/**
 * Applies De-Essing sibilance control to raw speech text.
 * Softens harsh 's', 'sh', 'z' consonant clusters so speech audio output sounds velvety soft.
 */
export function applyPodcastDeEsser(text: string, level: 'gentle' | 'moderate' | 'strong'): string {
  if (!text) return '';
  if (level === 'gentle') return text;

  let deEssed = text;
  if (level === 'strong') {
    // Soften sharp double sibilants and harsh uppercase cluster explosions
    deEssed = deEssed
      .replace(/([a-z])s{2,}([a-z])/gi, '$1s$2')
      .replace(/\b(psychology|psychoanalysis|psyche|psychological|psychiatry)\b/gi, 'psy-chology')
      .replace(/\b(consciousness|unconscious|subconscious)\b/gi, 'con-sciousness');
  }

  return deEssed;
}

/**
 * Plays a Web Audio API synthesized acoustic sound sample through a Pro Podcast EQ DSP filter node chain
 * (HighPass -> 250Hz Peaking -> 3.5kHz Peaking -> 11kHz HighShelf -> Dynamic Compressor -> Master Gain).
 * Provides instantaneous visual & acoustic feedback when switching EQ presets in UI.
 */
export function playPodcastEQSoundCheck(presetKey: PodcastEQPreset = 'pro-podcast'): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const eqConfig = PODCAST_EQ_PRESETS[presetKey] || PODCAST_EQ_PRESETS['pro-podcast'];

    // 1. Dual warm vocal harmonic oscillator (synthesizing a rich 220Hz / 440Hz vocal fundamental)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(220, ctx.currentTime); // A3 vocal fundamental
    osc2.frequency.setValueAtTime(440, ctx.currentTime); // A4 vocal overtone

    // 2. Build 5-band Equalizer DSP Filter Chain
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 80;

    const warmBand = ctx.createBiquadFilter();
    warmBand.type = 'peaking';
    warmBand.frequency.value = 250;
    warmBand.gain.value = eqConfig.bands[1].gain;
    warmBand.Q.value = 1.2;

    const presenceBand = ctx.createBiquadFilter();
    presenceBand.type = 'peaking';
    presenceBand.frequency.value = 3500;
    presenceBand.gain.value = eqConfig.bands[3].gain;
    presenceBand.Q.value = 1.5;

    const airBand = ctx.createBiquadFilter();
    airBand.type = 'highshelf';
    airBand.frequency.value = 11000;
    airBand.gain.value = eqConfig.bands[4].gain;

    // 3. Pro Dynamic Vocal Compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = eqConfig.compression.thresholdDb;
    compressor.knee.value = eqConfig.compression.kneeDb;
    compressor.ratio.value = parseFloat(eqConfig.compression.ratio.split(':')[0]) || 2.5;
    compressor.attack.value = eqConfig.compression.attackMs / 1000;
    compressor.release.value = eqConfig.compression.releaseMs / 1000;

    // 4. Master Volume Gain Node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.08);
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

    // Connect DSP Filter Nodes in series: Osc -> Highpass -> Warmth -> Presence -> Air -> Compressor -> Master -> Destination
    osc1.connect(highpass);
    osc2.connect(highpass);
    highpass.connect(warmBand);
    warmBand.connect(presenceBand);
    presenceBand.connect(airBand);
    airBand.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.68);
    osc2.stop(ctx.currentTime + 0.68);
  } catch (err) {
    console.warn('Web Audio DSP note:', err);
  }
}
