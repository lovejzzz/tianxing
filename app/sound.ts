"use client";

/**
 * The sound of a 2010 handset, synthesized.
 *
 * Every cue below is built from oscillators and filtered noise at run time, so
 * the site ships no audio files and reproduces none of Apple's own recordings.
 * What it borrows is the *manner* of that era's interface: tiny mechanical
 * clicks, short glassy swooshes, marimba-like confirmations, and a master chain
 * that narrows the spectrum the way a small handset speaker does.
 *
 * Nothing is created until the first cue plays, and the ringer switch on the
 * steel band silences the whole device the way the real one did.
 */

import { useSyncExternalStore } from "react";

export type PhoneSound =
  | "tap"        // a finger landing on an icon
  | "home"       // the physical Home key travelling into the glass
  | "key"        // keyboard tick
  | "tock"       // segmented control, tab, list selection
  | "pop"        // light confirmation
  | "open"       // an app expanding out of its icon
  | "close"      // the Home button collapsing it again
  | "swipe"      // paging through photos, months, notes
  | "whoosh"     // a longer travel: the Safari compass hunting
  | "send"       // message leaving the composer
  | "received"   // the reply that comes back
  | "shutter"    // camera mirror, up and down
  | "beep"       // Photo Booth countdown
  | "tick"       // the last seconds of a timer
  | "trash"      // deleting a photo, a note, an event
  | "restore"    // pulling something back out of the trash
  | "alert"      // something went wrong
  | "sparkle"    // a reward: an egg hatching
  | "stamp"      // a discovery pressed into the passport
  | "charge"     // a timer starting
  | "chime"      // a timer finishing
  | "purr"       // dragon: petted
  | "spark"      // dragon: sneezed fire
  | "zoom"       // dragon: spun
  | "ringer";    // the mute switch itself

const RINGER_KEY = "tian-iphone-ringer";
const NOISE_SECONDS = 1.2;

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let silenced = false;
let hydrated = false;
const listeners = new Set<() => void>();
const lastPlayed = new Map<PhoneSound, number>();

function readStoredRinger() {
  try {
    return window.localStorage.getItem(RINGER_KEY) === "off";
  } catch {
    return false;
  }
}

/** The ringer state, hydrated from storage the first time anything asks. */
export function isSilenced() {
  if (!hydrated && typeof window !== "undefined") {
    silenced = readStoredRinger();
    hydrated = true;
  }
  return silenced;
}

export function setSilenced(next: boolean) {
  if (next === isSilenced()) return;
  silenced = next;
  hydrated = true;
  try {
    window.localStorage.setItem(RINGER_KEY, next ? "off" : "on");
  } catch {
    // A silenced phone that forgets between visits is still a silenced phone.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToRinger(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function ensureContext() {
  if (typeof window === "undefined") return null;
  if (context) {
    // Browsers park the context whenever the tab loses focus; a tap is always
    // a fresh gesture, so it is safe to wake it back up here.
    if (context.state !== "running") void context.resume();
    return context;
  }
  const AudioContextClass = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    context = new AudioContextClass();
  } catch {
    return null;
  }

  // A 2010 handset speaker has little low end and a presence bump around 3 kHz.
  // Running every cue through the same voicing is what makes them sound like
  // one device rather than a folder of unrelated beeps. A soft compressor is
  // essential here: quick app transitions and reward cues can overlap, and
  // summing their oscillators directly made the small speaker turn brittle.
  const body = context.createBiquadFilter();
  body.type = "highpass";
  body.frequency.value = 140;
  body.Q.value = .7;
  const presence = context.createBiquadFilter();
  presence.type = "peaking";
  presence.frequency.value = 2900;
  presence.gain.value = 2.2;
  presence.Q.value = .9;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -19;
  limiter.knee.value = 12;
  limiter.ratio.value = 5;
  limiter.attack.value = .003;
  limiter.release.value = .13;

  master = context.createGain();
  master.gain.value = .72;
  master.connect(body).connect(presence).connect(limiter).connect(context.destination);

  if (context.state !== "running") void context.resume();

  noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * NOISE_SECONDS), context.sampleRate);
  const channel = noiseBuffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;

  return context;
}

type ToneOptions = {
  from: number;
  to?: number;
  at?: number;
  dur: number;
  level: number;
  shape?: OscillatorType;
  attack?: number;
};

function tone({ from, to, at = 0, dur, level, shape = "sine", attack = .006 }: ToneOptions) {
  const audio = ensureContext();
  if (!audio || !master) return;
  const start = audio.currentTime + at;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = shape;
  oscillator.frequency.setValueAtTime(Math.max(1, from), start);
  if (to !== undefined && to !== from) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + dur);
  const rise = Math.min(attack, dur * .5);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, level), start + rise);
  gain.gain.exponentialRampToValueAtTime(.0001, start + dur);
  oscillator.connect(gain).connect(master);
  oscillator.start(start);
  oscillator.stop(start + dur + .04);
}

type HissOptions = {
  from: number;
  to?: number;
  at?: number;
  dur: number;
  level: number;
  type?: BiquadFilterType;
  q?: number;
  attack?: number;
};

function hiss({ from, to, at = 0, dur, level, type = "bandpass", q = 1, attack = .004 }: HissOptions) {
  const audio = ensureContext();
  if (!audio || !master || !noiseBuffer) return;
  const start = audio.currentTime + at;
  const source = audio.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = audio.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(Math.max(20, from), start);
  if (to !== undefined && to !== from) filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + dur);
  const gain = audio.createGain();
  const rise = Math.min(attack, dur * .4);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, level), start + rise);
  gain.gain.exponentialRampToValueAtTime(.0001, start + dur);
  source.connect(filter).connect(gain).connect(master);
  // A random window into the noise keeps repeated clicks from sounding looped.
  source.start(start, Math.random() * (NOISE_SECONDS - dur - .05));
  source.stop(start + dur + .03);
}

/** A struck bar: fundamental plus the two inharmonic partials that read as glass. */
function bell(from: number, at: number, dur: number, level: number) {
  tone({ from, at, dur, level });
  tone({ from: from * 2.76, at, dur: dur * .52, level: level * .3 });
  tone({ from: from * 5.4, at, dur: dur * .24, level: level * .12 });
}

const cues: Record<PhoneSound, () => void> = {
  tap: () => {
    hiss({ from: 2500, to: 1300, dur: .024, level: .05, q: 1.2 });
    tone({ from: 940, to: 520, dur: .032, level: .026 });
  },
  home: () => {
    // Two surfaces, nearly together: the glass cap yielding, then the rubber
    // dome under it. Short and low enough to feel physical rather than musical.
    hiss({ from: 1800, to: 820, dur: .018, level: .036, q: 1.1 });
    tone({ from: 230, to: 132, dur: .052, level: .046, shape: "triangle", attack: .002 });
    tone({ from: 460, to: 245, at: .012, dur: .035, level: .018, shape: "sine", attack: .002 });
  },
  key: () => {
    hiss({ from: 3500, to: 2200, dur: .016, level: .038, q: 2.2 });
    tone({ from: 1700, to: 1180, dur: .022, level: .014, shape: "triangle" });
  },
  tock: () => {
    tone({ from: 540, to: 300, dur: .05, level: .05, shape: "triangle" });
    hiss({ from: 1900, dur: .014, level: .03 });
  },
  pop: () => {
    tone({ from: 430, to: 900, dur: .072, level: .045 });
    hiss({ from: 2700, dur: .02, level: .022, q: 1.6 });
  },
  open: () => {
    hiss({ from: 430, to: 2700, dur: .26, level: .034, q: .8, attack: .06 });
    tone({ from: 330, to: 742, dur: .24, level: .026, attack: .05 });
    tone({ from: 495, to: 1113, dur: .2, at: .03, level: .013, attack: .05 });
  },
  close: () => {
    hiss({ from: 2500, to: 430, dur: .24, level: .032, q: .8, attack: .02 });
    tone({ from: 720, to: 250, dur: .22, level: .026, attack: .02 });
  },
  swipe: () => {
    hiss({ from: 900, to: 2500, dur: .15, level: .028, q: .9, attack: .03 });
  },
  whoosh: () => {
    hiss({ from: 420, to: 3000, dur: .42, level: .03, q: .9, attack: .08 });
    hiss({ from: 3000, to: 480, at: .4, dur: .38, level: .026, q: .9, attack: .04 });
    tone({ from: 260, to: 620, dur: .5, level: .012, attack: .12 });
  },
  send: () => {
    hiss({ from: 520, to: 3600, dur: .28, level: .034, q: 1.4, attack: .05 });
    tone({ from: 440, to: 1480, dur: .26, level: .022, attack: .05 });
    bell(1760, .24, .3, .028);
  },
  received: () => {
    bell(1318, 0, .5, .038);
    bell(880, .1, .5, .032);
    bell(1760, .2, .72, .038);
  },
  shutter: () => {
    hiss({ from: 2200, dur: .012, level: .09, type: "highpass", q: .7 });
    tone({ from: 320, to: 150, dur: .034, level: .05, shape: "triangle" });
    hiss({ from: 1700, at: .088, dur: .034, level: .075, type: "highpass", q: .7 });
    tone({ from: 240, to: 110, dur: .06, at: .088, level: .045, shape: "triangle" });
  },
  beep: () => {
    tone({ from: 1046, dur: .09, level: .04 });
  },
  tick: () => {
    hiss({ from: 2600, dur: .012, level: .028, q: 3 });
  },
  trash: () => {
    for (let burst = 0; burst < 5; burst += 1) {
      hiss({
        at: burst * .034,
        dur: .05,
        level: .045 * (1 - burst * .16),
        from: 2600 - burst * 380,
        to: 1500 - burst * 210,
        q: 1.6,
      });
    }
    tone({ from: 300, to: 120, at: .06, dur: .18, level: .02, shape: "triangle" });
  },
  restore: () => {
    for (let burst = 0; burst < 4; burst += 1) {
      hiss({ at: burst * .036, dur: .05, level: .03, from: 1200 + burst * 420, to: 1900 + burst * 460, q: 1.6 });
    }
    bell(1046, .12, .32, .03);
  },
  alert: () => {
    tone({ from: 210, to: 178, dur: .16, level: .05, shape: "sawtooth" });
    tone({ from: 210, to: 178, at: .21, dur: .16, level: .05, shape: "sawtooth" });
    hiss({ from: 700, dur: .12, level: .014, q: .8 });
  },
  sparkle: () => {
    [784, 1046, 1318, 1568].forEach((note, index) => bell(note, index * .072, .62 - index * .06, .042));
    hiss({ from: 3200, to: 6000, at: .04, dur: .34, level: .014, q: .9, attack: .1 });
  },
  stamp: () => {
    tone({ from: 170, to: 72, dur: .13, level: .07, shape: "triangle" });
    hiss({ from: 900, to: 300, dur: .07, level: .05, type: "lowpass", q: .8 });
  },
  charge: () => {
    tone({ from: 300, to: 620, dur: .19, level: .034, attack: .03 });
    hiss({ from: 900, to: 2400, dur: .19, level: .016, q: 1.2, attack: .05 });
  },
  chime: () => {
    bell(988, 0, .72, .055);
    bell(1319, .3, .72, .05);
    bell(988, .6, .95, .055);
  },
  purr: () => {
    tone({ from: 660, dur: .09, level: .026 });
    tone({ from: 880, at: .1, dur: .13, level: .028 });
  },
  spark: () => {
    hiss({ from: 1400, to: 4200, dur: .1, level: .035, q: 1.1 });
    tone({ from: 330, dur: .1, level: .026 });
    tone({ from: 520, at: .08, dur: .13, level: .026 });
  },
  zoom: () => {
    tone({ from: 520, to: 1240, dur: .17, level: .028 });
    hiss({ from: 1200, to: 3000, dur: .17, level: .014, q: 1.2 });
  },
  ringer: () => {
    hiss({ from: 3000, dur: .01, level: .07, type: "highpass" });
    tone({ from: 260, to: 170, dur: .04, level: .05, shape: "triangle" });
    bell(1568, .05, .26, .03);
  },
};

// Each gesture family gets enough room to articulate before another copy can
// stack on top of it. Short tactile cues stay responsive; long travel and
// notification cues cannot turn into a wall of sound under impatient tapping.
const cueCooldownMs: Partial<Record<PhoneSound, number>> = {
  home: 90,
  key: 24,
  tick: 120,
  open: 150,
  close: 150,
  swipe: 90,
  whoosh: 650,
  send: 320,
  received: 650,
  shutter: 260,
  beep: 180,
  trash: 240,
  restore: 240,
  alert: 420,
  sparkle: 720,
  stamp: 280,
  charge: 180,
  chime: 1200,
  ringer: 180,
};

/**
 * Play a cue. Silent while the ringer switch is off, and rate-limited per cue so
 * a held key or a fast drag layers a texture instead of a wall of clicks.
 */
export function playSound(name: PhoneSound) {
  if (typeof window === "undefined" || isSilenced()) return;
  const now = performance.now();
  const previous = lastPlayed.get(name) ?? 0;
  if (now - previous < (cueCooldownMs[name] ?? 28)) return;
  lastPlayed.set(name, now);
  try {
    cues[name]();
  } catch {
    // Sound is decoration. A blocked or exhausted audio context must never
    // interrupt the interaction that asked for it.
  }
}

/** Flip the ringer switch, announcing the change when it lands on "on". */
export function toggleRinger() {
  const next = !isSilenced();
  // The steel switch is mechanical, so it should click in both directions.
  // Play before muting and after unmuting so the action always confirms itself.
  if (next) playSound("ringer");
  setSilenced(next);
  if (!next) playSound("ringer");
  return next;
}

/**
 * Read the ringer switch from a component. The server always renders the phone
 * unmuted; React re-checks storage once the client takes over, so a visitor who
 * silenced the device keeps it silent without a hydration mismatch.
 */
export function useRinger() {
  return useSyncExternalStore(subscribeToRinger, isSilenced, () => false);
}
