/**
 * Audio processing utilities for StoryVoice Narrator
 */

export function base64ToBlobUrl(base64: string, mimeType: string = 'audio/wav'): string {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to convert base64 to blob url:', err);
    return `data:${mimeType};base64,${base64}`;
  }
}

export function downloadAudioFile(base64: string, filename: string, mimeType: string = 'audio/wav'): void {
  try {
    const blobUrl = base64ToBlobUrl(base64, mimeType);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (err) {
    console.error('Download failed:', err);
  }
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function estimateReadingTime(text: string, wordsPerMinute: number = 135) {
  if (!text || !text.trim()) {
    return { words: 0, minutes: 0, seconds: 0, formatted: '0s' };
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const totalMinutes = words / wordsPerMinute;
  const minutes = Math.floor(totalMinutes);
  const seconds = Math.round((totalMinutes - minutes) * 60);

  let formatted = '';
  if (minutes > 0) {
    formatted += `${minutes}m `;
  }
  formatted += `${seconds}s`;

  return {
    words,
    minutes,
    seconds,
    formatted: formatted.trim() || '1s',
  };
}

/**
 * Web Audio Ambient Soundscape Generator
 * Synthesizes calming background sounds (Fireside crackle, gentle rain, warm drone, wind)
 * without requiring large external audio asset downloads.
 */
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: string = 'none';
  private isRunning: boolean = false;
  private nodesToStop: (AudioNode | number)[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      const safeVol = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.setTargetAtTime(safeVol, this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    this.nodesToStop.forEach((item) => {
      if (typeof item === 'number') {
        clearInterval(item);
      } else if ('stop' in item && typeof (item as any).stop === 'function') {
        try {
          (item as any).stop();
        } catch (_) {}
      } else if ('disconnect' in item) {
        try {
          item.disconnect();
        } catch (_) {}
      }
    });
    this.nodesToStop = [];
    this.currentType = 'none';
    this.isRunning = false;
  }

  public play(type: 'none' | 'fireside' | 'rain' | 'wind' | 'cozy-drone', volume: number = 0.2) {
    if (type === 'none') {
      this.stop();
      return;
    }
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.currentType === type && this.isRunning) {
      this.setVolume(volume);
      return;
    }

    this.stop();
    this.currentType = type;
    this.isRunning = true;
    this.setVolume(volume);

    const ctx = this.ctx;
    const dest = this.masterGain;

    if (type === 'rain') {
      // Pink noise + low-pass filter for soothing rain
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      whiteNoise.connect(filter);
      filter.connect(dest);
      whiteNoise.start();
      this.nodesToStop.push(whiteNoise, filter);
    } else if (type === 'fireside') {
      // Warm low rumble + intermittent crackles
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, ctx.currentTime);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.connect(rumbleGain);
      rumbleGain.connect(dest);
      osc.start();
      this.nodesToStop.push(osc, rumbleGain);

      // Random micro-crackle pops
      const intervalId = window.setInterval(() => {
        if (!this.isRunning || this.currentType !== 'fireside') return;
        if (Math.random() > 0.4) {
          const pop = ctx.createOscillator();
          const popGain = ctx.createGain();
          pop.type = 'triangle';
          pop.frequency.setValueAtTime(400 + Math.random() * 1200, ctx.currentTime);
          popGain.gain.setValueAtTime(0.08 + Math.random() * 0.15, ctx.currentTime);
          popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05 + Math.random() * 0.08);

          pop.connect(popGain);
          popGain.connect(dest);
          pop.start();
          pop.stop(ctx.currentTime + 0.15);
        }
      }, 180);

      this.nodesToStop.push(intervalId);
    } else if (type === 'cozy-drone') {
      // Warm analog chord drone (Root, 5th, Octave) with slow chorus LFO
      const freqs = [110, 164.81, 220]; // A2, E3, A3
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(dest);
        osc.start();
        this.nodesToStop.push(osc, gain, filter);
      });
    } else if (type === 'wind') {
      // Soft whispering autumn wind
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      noise.connect(filter);
      filter.connect(dest);
      noise.start();
      this.nodesToStop.push(noise, filter);
    }
  }
}

export const ambientEngine = new AmbientSoundEngine();
