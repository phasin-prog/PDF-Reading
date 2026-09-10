export type SpokenWordEQPreset =
  | 'natural'
  | 'podcast'
  | 'audiobook'
  | 'studio'
  | 'warm'
  | 'crisp';

export interface EQPresetConfig {
  id: SpokenWordEQPreset;
  name: string;
  badge: string;
  description: string;
  highPassFreq: number; // Hz
  lowWarmthGainDb: number; // 200Hz gain
  midClarityGainDb: number; // 2.5kHz gain
  highAirGainDb: number; // 8kHz gain
  deEsserThresholdDb: number;
  compressionRatio: number;
  gainCompensationDb: number;
}

export const SPOKEN_WORD_EQ_PRESETS: Record<SpokenWordEQPreset, EQPresetConfig> = {
  natural: {
    id: 'natural',
    name: 'Natural Studio Voice',
    badge: '🎙️ Pure Acoustic',
    description: 'Flat, transparent acoustic balance for maximum naturalness without artificial coloration.',
    highPassFreq: 75,
    lowWarmthGainDb: 0,
    midClarityGainDb: 1.5,
    highAirGainDb: 1.0,
    deEsserThresholdDb: -18,
    compressionRatio: 2.5,
    gainCompensationDb: 1.0,
  },
  podcast: {
    id: 'podcast',
    name: 'Pro Broadcast Podcast',
    badge: '📻 Broadcast Presence',
    description: 'Rich proximity warmth and crisp articulation modeled after broadcast microphone processors.',
    highPassFreq: 85,
    lowWarmthGainDb: 3.0,
    midClarityGainDb: 3.5,
    highAirGainDb: 2.0,
    deEsserThresholdDb: -22,
    compressionRatio: 4.0,
    gainCompensationDb: 2.5,
  },
  audiobook: {
    id: 'audiobook',
    name: 'Mastered Audiobook',
    badge: '📖 Soft & Fatigue-Free',
    description: 'Silky smooth mids and subtle compression designed for multi-hour uninterrupted listening.',
    highPassFreq: 80,
    lowWarmthGainDb: 1.5,
    midClarityGainDb: 1.0,
    highAirGainDb: 0.5,
    deEsserThresholdDb: -24,
    compressionRatio: 3.0,
    gainCompensationDb: 1.5,
  },
  studio: {
    id: 'studio',
    name: 'Reference Studio Monitor',
    badge: '🎛️ Precision Reference',
    description: 'Hyper-detailed vocal isolation with controlled sibilance and linear response.',
    highPassFreq: 90,
    lowWarmthGainDb: -0.5,
    midClarityGainDb: 2.5,
    highAirGainDb: 1.5,
    deEsserThresholdDb: -20,
    compressionRatio: 3.5,
    gainCompensationDb: 1.8,
  },
  warm: {
    id: 'warm',
    name: 'Deep Analog Warmth',
    badge: '☕ Resonant Deep Voice',
    description: 'Enriches low-frequency resonance and softens harsh sibilants for late-night reflection.',
    highPassFreq: 65,
    lowWarmthGainDb: 4.5,
    midClarityGainDb: 0.5,
    highAirGainDb: -1.0,
    deEsserThresholdDb: -25,
    compressionRatio: 2.8,
    gainCompensationDb: 2.0,
  },
  crisp: {
    id: 'crisp',
    name: 'Articulate High Clarity',
    badge: '✨ Ultra-Articulate',
    description: 'Boosts upper-midrange frequencies for effortless comprehension at fast playback speeds.',
    highPassFreq: 100,
    lowWarmthGainDb: -1.0,
    midClarityGainDb: 4.5,
    highAirGainDb: 3.0,
    deEsserThresholdDb: -16,
    compressionRatio: 3.2,
    gainCompensationDb: 1.2,
  },
};

export class AudioProcessingPipeline {
  private audioCtx: AudioContext | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowWarmthFilter: BiquadFilterNode | null = null;
  private midClarityFilter: BiquadFilterNode | null = null;
  private highAirFilter: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private currentPreset: SpokenWordEQPreset = 'audiobook';

  public init(audioCtx?: AudioContext) {
    try {
      this.audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // High-pass filter
      this.highPassFilter = this.audioCtx.createBiquadFilter();
      this.highPassFilter.type = 'highpass';

      // Low warmth parametric filter (200 Hz)
      this.lowWarmthFilter = this.audioCtx.createBiquadFilter();
      this.lowWarmthFilter.type = 'peaking';
      this.lowWarmthFilter.frequency.value = 200;
      this.lowWarmthFilter.Q.value = 1.0;

      // Mid clarity parametric filter (2500 Hz)
      this.midClarityFilter = this.audioCtx.createBiquadFilter();
      this.midClarityFilter.type = 'peaking';
      this.midClarityFilter.frequency.value = 2500;
      this.midClarityFilter.Q.value = 1.2;

      // High air shelving filter (8000 Hz)
      this.highAirFilter = this.audioCtx.createBiquadFilter();
      this.highAirFilter.type = 'highshelf';
      this.highAirFilter.frequency.value = 8000;

      // Spoken-Word Compressor
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.knee.value = 10;
      this.compressorNode.attack.value = 0.005; // 5ms
      this.compressorNode.release.value = 0.12; // 120ms

      // Output Gain & Limiter
      this.gainNode = this.audioCtx.createGain();

      // Chain nodes: HighPass -> Warmth -> Clarity -> Air -> Compressor -> Gain -> Destination
      this.highPassFilter.connect(this.lowWarmthFilter);
      this.lowWarmthFilter.connect(this.midClarityFilter);
      this.midClarityFilter.connect(this.highAirFilter);
      this.highAirFilter.connect(this.compressorNode);
      this.compressorNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.applyPreset(this.currentPreset);
    } catch (e) {
      console.warn('AudioProcessingPipeline WebAudio init warning:', e);
    }
  }

  public applyPreset(presetId: SpokenWordEQPreset) {
    this.currentPreset = presetId;
    const config = SPOKEN_WORD_EQ_PRESETS[presetId] || SPOKEN_WORD_EQ_PRESETS['audiobook'];

    if (!this.highPassFilter || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    this.highPassFilter.frequency.setTargetAtTime(config.highPassFreq, now, 0.02);
    if (this.lowWarmthFilter) this.lowWarmthFilter.gain.setTargetAtTime(config.lowWarmthGainDb, now, 0.02);
    if (this.midClarityFilter) this.midClarityFilter.gain.setTargetAtTime(config.midClarityGainDb, now, 0.02);
    if (this.highAirFilter) this.highAirFilter.gain.setTargetAtTime(config.highAirGainDb, now, 0.02);

    if (this.compressorNode) {
      this.compressorNode.threshold.setTargetAtTime(config.deEsserThresholdDb, now, 0.02);
      this.compressorNode.ratio.setTargetAtTime(config.compressionRatio, now, 0.02);
    }

    if (this.gainNode) {
      const linearGain = Math.pow(10, config.gainCompensationDb / 20);
      this.gainNode.gain.setTargetAtTime(linearGain, now, 0.02);
    }
  }

  public getPreset(): SpokenWordEQPreset {
    return this.currentPreset;
  }

  public getInputNode(): AudioNode | null {
    return this.highPassFilter;
  }
}

export const audioPipeline = new AudioProcessingPipeline();
