/**
 * Audio manager. Initializes only after a user gesture, fails silently, and
 * never blocks gameplay. Bundled ElevenLabs-generated files (dropped into
 * src/assets/audio/<name>.mp3|ogg) are preferred; when a file is missing or
 * fails, a gentle Web Audio oscillator tone plays instead. Captions are
 * emitted through a callback for the captions setting.
 */

export type EffectName =
  | "select"
  | "correct"
  | "complete"
  | "wrong"
  | "miss"
  | "badge"
  | "countdown"
  | "victory"
  | "defeat";

export const EFFECT_CAPTIONS: Record<EffectName, string> = {
  select: "[soft blip]",
  correct: "[tiny click]",
  complete: "[soft chime]",
  wrong: "[gentle bump]",
  miss: "[low bubble]",
  badge: "[sparkle]",
  countdown: "[tick]",
  victory: "[happy chime]",
  defeat: "[calm tone]",
};

/** Fallback tones: [frequencies, durationSec, type] — all soft and short. */
const FALLBACK_TONES: Record<EffectName, { freqs: number[]; dur: number; type: OscillatorType }> = {
  select: { freqs: [520], dur: 0.06, type: "sine" },
  correct: { freqs: [660], dur: 0.05, type: "sine" },
  complete: { freqs: [523, 659, 784], dur: 0.22, type: "sine" },
  wrong: { freqs: [220], dur: 0.09, type: "triangle" },
  miss: { freqs: [180, 140], dur: 0.25, type: "sine" },
  badge: { freqs: [784, 988, 1175], dur: 0.28, type: "sine" },
  countdown: { freqs: [440], dur: 0.08, type: "sine" },
  victory: { freqs: [523, 659, 784, 1047], dur: 0.5, type: "sine" },
  defeat: { freqs: [330, 262], dur: 0.4, type: "sine" },
};

// Bundled audio files (added by the ElevenLabs generation step). The glob is
// resolved at build time; an empty result simply means fallback tones.
const bundled: Record<string, string> = {};
try {
  const globbed = import.meta.glob("../assets/audio/*.{mp3,ogg}", {
    eager: true,
    query: "?url",
    import: "default",
  }) as Record<string, string>;
  for (const [path, url] of Object.entries(globbed)) {
    const name = path.split("/").pop()?.replace(/\.(mp3|ogg)$/, "");
    if (name) bundled[name] = url;
  }
} catch {
  // Non-Vite environment (tests): fallback tones only.
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private ambientNodes: { stop(): void } | null = null;
  private unavailable = false;

  /** Called with a caption string when a sound plays (captions setting). */
  onCaption: (text: string) => void = () => {};

  /** Must be called from a click/keydown handler. Safe to call repeatedly. */
  init(): void {
    if (this.ctx || this.unavailable) return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        this.unavailable = true;
        return;
      }
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
    } catch {
      this.unavailable = true;
    }
  }

  setVolumes(master: number, sfx: number, music: number): void {
    try {
      if (this.masterGain) this.masterGain.gain.value = master;
      if (this.sfxGain) this.sfxGain.gain.value = sfx;
      if (this.musicGain) this.musicGain.gain.value = music * 0.5;
    } catch {
      /* silent */
    }
  }

  play(name: EffectName): void {
    this.onCaption(EFFECT_CAPTIONS[name]);
    if (!this.ctx || !this.sfxGain) return;
    try {
      if (this.ctx.state === "suspended") {
        void this.ctx.resume().catch(() => {});
      }
      const url = bundled[name];
      if (url) {
        void this.playBuffer(name, url).catch(() => this.playTone(name));
      } else {
        this.playTone(name);
      }
    } catch {
      /* silent */
    }
  }

  private async playBuffer(name: string, url: string): Promise<void> {
    if (!this.ctx || !this.sfxGain) return;
    let buffer = this.buffers.get(name);
    if (!buffer) {
      const res = await fetch(url);
      const data = await res.arrayBuffer();
      buffer = await this.ctx.decodeAudioData(data);
      this.buffers.set(name, buffer);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.sfxGain);
    src.start();
  }

  private playTone(name: EffectName): void {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const { freqs, dur, type } = FALLBACK_TONES[name];
      const now = this.ctx.currentTime;
      const step = dur / freqs.length;
      freqs.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * step);
        gain.gain.linearRampToValueAtTime(0.25, now + i * step + 0.01);
        gain.gain.linearRampToValueAtTime(0, now + (i + 1) * step);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + i * step);
        osc.stop(now + (i + 1) * step + 0.02);
      });
    } catch {
      /* silent */
    }
  }

  /** Gentle procedural underwater ambience (very quiet filtered drone). */
  startAmbient(): void {
    if (!this.ctx || !this.musicGain || this.ambientNodes) return;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.value = 110;
      osc2.type = "sine";
      osc2.frequency.value = 165;
      filter.type = "lowpass";
      filter.frequency.value = 400;
      gain.gain.value = 0.08;
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc1.start();
      osc2.start();
      this.ambientNodes = {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {
            /* silent */
          }
        },
      };
    } catch {
      /* silent */
    }
  }

  stopAmbient(): void {
    this.ambientNodes?.stop();
    this.ambientNodes = null;
  }
}

export const audio = new AudioManager();
