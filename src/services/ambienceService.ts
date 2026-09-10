export type AmbienceSoundscape =
  | 'none'
  | 'library'
  | 'rain'
  | 'room-tone'
  | 'night'
  | 'fireplace'
  | 'vinyl'
  | 'forest';

export interface AmbienceConfig {
  id: AmbienceSoundscape;
  name: string;
  badge: string;
  description: string;
  icon: string;
  duckingLevel: number; // Volume multiplier when narrator is speaking (0.1 to 0.3)
}

export const AMBIENCE_PRESETS: Record<AmbienceSoundscape, AmbienceConfig> = {
  none: {
    id: 'none',
    name: 'Silent Library',
    badge: '🔇 Pure Silence',
    description: 'No background ambient audio.',
    icon: 'VolumeX',
    duckingLevel: 0,
  },
  library: {
    id: 'library',
    name: 'Academic Study Hall',
    badge: '🏛️ Quiet Library',
    description: 'Subtle warm acoustic room resonance with gentle distant warmth.',
    icon: 'Library',
    duckingLevel: 0.18,
  },
  rain: {
    id: 'rain',
    name: 'Soft Rain on Glass',
    badge: '🌧️ Raindrop Comfort',
    description: 'Gentle, meditative rain against study window.',
    icon: 'CloudRain',
    duckingLevel: 0.15,
  },
  'room-tone': {
    id: 'room-tone',
    name: 'Warm Room Tone',
    badge: '🛋️ Cozy Studio',
    description: 'Quiet analog acoustic room presence eliminating harsh empty digital silence.',
    icon: 'Home',
    duckingLevel: 0.22,
  },
  night: {
    id: 'night',
    name: 'Midnight Study Breeze',
    badge: '🌙 Peaceful Night',
    description: 'Soft late-night breeze for focused contemplative reading.',
    icon: 'Moon',
    duckingLevel: 0.16,
  },
  fireplace: {
    id: 'fireplace',
    name: 'Cozy Fireplace',
    badge: '🔥 Warm Hearth',
    description: 'Rhythmic soft crackle of wood fire in a quiet study.',
    icon: 'Flame',
    duckingLevel: 0.18,
  },
  vinyl: {
    id: 'vinyl',
    name: 'Vintage Vinyl Crackle',
    badge: '📻 Analog Texture',
    description: 'Warm analog turntable surface noise giving physical texture to reading.',
    icon: 'Disc',
    duckingLevel: 0.20,
  },
  forest: {
    id: 'forest',
    name: 'Philosopher’s Forest Walk',
    badge: '🌲 Pines & Breeze',
    description: 'Gentle rustling leaves and distant wind through pine trees.',
    icon: 'Trees',
    duckingLevel: 0.15,
  },
};

export class AmbienceEngine {
  private audioCtx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private currentAmbience: AmbienceSoundscape = 'none';
  private masterVolume = 0.25;
  private isSpeaking = false;
  private isPlaying = false;

  public setAmbience(soundscape: AmbienceSoundscape) {
    this.currentAmbience = soundscape;
    if (soundscape === 'none') {
      this.stop();
    } else {
      this.startSynthesizedAmbience(soundscape);
    }
  }

  public getAmbience(): AmbienceSoundscape {
    return this.currentAmbience;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1.0, vol));
    this.updateGain();
  }

  public setSpeakingState(speaking: boolean) {
    this.isSpeaking = speaking;
    this.updateGain();
  }

  private updateGain() {
    if (!this.gainNode || !this.audioCtx) return;

    const config = AMBIENCE_PRESETS[this.currentAmbience];
    if (!config || this.currentAmbience === 'none') {
      this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      return;
    }

    const targetGain = this.isSpeaking
      ? this.masterVolume * config.duckingLevel
      : this.masterVolume;

    this.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, this.isSpeaking ? 0.3 : 0.8);
  }

  private startSynthesizedAmbience(soundscape: AmbienceSoundscape) {
    this.stop();

    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioCtx.createGain();

      const bufferSize = this.audioCtx.sampleRate * 4; // 4 seconds loop
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate procedural acoustic textures
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (soundscape === 'rain' || soundscape === 'forest') {
          // Pink noise filter
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
        } else if (soundscape === 'vinyl' || soundscape === 'fireplace') {
          // Crackle spikes
          const spike = Math.random() > 0.997 ? (Math.random() * 0.8 - 0.4) : 0;
          data[i] = white * 0.05 + spike;
        } else {
          // Warm brown noise
          data[i] = (lastOut + 0.01 * white) / 1.01;
          lastOut = data[i];
        }
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Bandpass shaping filter
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = soundscape === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = soundscape === 'rain' ? 1800 : soundscape === 'vinyl' ? 3200 : 800;

      noise.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.updateGain();
      noise.start();
      this.noiseNode = noise;
      this.isPlaying = true;
    } catch (e) {
      console.warn('AmbienceEngine WebAudio start error:', e);
    }
  }

  public stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as any).stop?.();
      } catch (e) {}
      this.noiseNode = null;
    }
    this.isPlaying = false;
  }
}

export const ambienceEngine = new AmbienceEngine();
