import { getMusicVolume } from './AudioSettings.js?v=20260921-r56';

// TOKYO SHIFT procedural soundtrack
// Original eurobeat-inspired score. Generated in-browser to keep the PWA light
// and avoid shipping large PCM masters.

const AudioCtx = window.AudioContext || window.webkitAudioContext;

let ctx = null;
let master = null;
let scheduler = null;
let currentTrack = null;
let nextStepTime = 0;
let stepIndex = 0;
let noiseBuffer = null;
let activeNodes = new Set();
let pendingTrack = null;
let lastRaceTrack = null;
let unlockInstalled = false;
let musicVolume = getMusicVolume();
let stopToken = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('tokyo-shift-audio-settings', event => {
    musicVolume = Math.max(0, Math.min(1, Number(event.detail?.music) || 0));
    if (!ctx || !master || !currentTrack || !TRACKS[currentTrack]) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(
      Math.max(0.0001, TRACKS[currentTrack].volume * musicVolume),
      now,
      0.035
    );
  });
}

const PROGRESSION_A = [
  { chord: [57, 60, 64], root: 45 },
  { chord: [53, 57, 60], root: 41 },
  { chord: [55, 59, 62], root: 43 },
  { chord: [52, 55, 59], root: 40 },
];

const PROGRESSION_REDLINE = [
  { chord: [57, 60, 64], root: 45 },
  { chord: [55, 59, 62], root: 43 },
  { chord: [53, 57, 60], root: 41 },
  { chord: [52, 55, 59], root: 40 },
];

const MOTIF = [69, 72, 76, 79, 76, 74, 72, 69];

const TRACKS = {
  title:        { bpm: 150, volume: 0.26, style: 'title', progression: PROGRESSION_A },
  workshop:     { bpm: 118, volume: 0.18, style: 'workshop', progression: PROGRESSION_A },
  meet:         { bpm: 132, volume: 0.21, style: 'meet', progression: PROGRESSION_A },
  ignition:     { bpm: 160, volume: 0.19, style: 'race', variant: 'ignition', progression: PROGRESSION_A },
  redline:      { bpm: 166, volume: 0.20, style: 'race', variant: 'redline', progression: PROGRESSION_REDLINE },
  midnightApex: { bpm: 172, volume: 0.19, style: 'race', variant: 'apex', progression: PROGRESSION_A },
};

function midiToHz(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function ensureAudio() {
  if (!AudioCtx) return false;

  if (!ctx) {
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  if (ctx.state !== 'running') installUnlock();
  return true;
}

function installUnlock() {
  if (unlockInstalled) return;
  unlockInstalled = true;

  const unlock = async () => {
    if (!ctx) return;
    try { await ctx.resume(); } catch (e) {}

    if (ctx.state === 'running') {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      unlockInstalled = false;

      if (pendingTrack) {
        const key = pendingTrack;
        pendingTrack = null;
        startTrack(key);
      }
    }
  };

  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('keydown', unlock, true);
}

function trackNode(node) {
  activeNodes.add(node);
  node.addEventListener?.('ended', () => activeNodes.delete(node), { once: true });
  return node;
}

function stopActiveNodes() {
  for (const node of activeNodes) {
    try { node.stop(); } catch (e) {}
  }
  activeNodes.clear();
}

function makePan(pan) {
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    return p;
  }
  return ctx.createGain();
}

function synth(midi, start, duration, {
  type = 'sawtooth',
  gain = 0.04,
  pan = 0,
  detune = 0,
  attack = 0.008,
  release = 0.06,
  octave = false,
} = {}) {
  if (!ctx || ctx.state !== 'running') return;

  const osc = trackNode(ctx.createOscillator());
  const amp = ctx.createGain();
  const panner = makePan(pan);

  osc.type = type;
  osc.frequency.value = midiToHz(midi);
  osc.detune.value = detune;

  const end = start + Math.max(0.04, duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(attack, duration * 0.25));
  amp.gain.setValueAtTime(Math.max(0.0002, gain * 0.72), Math.max(start + attack, end - release));
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(amp);
  amp.connect(panner);
  panner.connect(master);
  osc.start(start);
  osc.stop(end + 0.02);

  if (octave) {
    const upper = trackNode(ctx.createOscillator());
    const upperAmp = ctx.createGain();

    upper.type = type;
    upper.frequency.value = midiToHz(midi + 12);
    upper.detune.value = -detune;

    upperAmp.gain.setValueAtTime(0.0001, start);
    upperAmp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 0.28), start + Math.min(attack, duration * 0.25));
    upperAmp.gain.exponentialRampToValueAtTime(0.0001, end);

    upper.connect(upperAmp);
    upperAmp.connect(panner);
    upper.start(start);
    upper.stop(end + 0.02);
  }
}

function kick(start, gain = 0.34) {
  if (!ctx || ctx.state !== 'running') return;

  const osc = trackNode(ctx.createOscillator());
  const amp = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, start);
  osc.frequency.exponentialRampToValueAtTime(46, start + 0.22);

  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

  osc.connect(amp);
  amp.connect(master);
  osc.start(start);
  osc.stop(start + 0.27);
}

function noiseHit(start, duration, gain, highpass, pan = 0) {
  if (!ctx || ctx.state !== 'running') return;

  const src = trackNode(ctx.createBufferSource());
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  const panner = makePan(pan);

  src.buffer = noiseBuffer;
  filter.type = 'highpass';
  filter.frequency.value = highpass;

  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(filter);
  filter.connect(amp);
  amp.connect(panner);
  panner.connect(master);

  src.start(start);
  src.stop(start + duration + 0.01);
}

function snare(start, gain = 0.105) {
  noiseHit(start, 0.14, gain, 1300, 0);
  synth(50, start, 0.10, {
    type: 'triangle',
    gain: gain * 0.45,
    release: 0.08,
  });
}

function hat(start, gain = 0.030, open = false, pan = 0.15) {
  noiseHit(start, open ? 0.12 : 0.04, gain, 6200, pan);
}

function chordStab(chord, start, beat, gain = 0.022) {
  chord.forEach((m, i) => synth(m + 12, start, beat * 0.42, {
    type: 'sawtooth',
    gain,
    pan: -0.28 + i * 0.28,
    detune: (i - 1) * 3,
    release: 0.055,
  }));
}

function chordPad(chord, start, beat, gain = 0.012) {
  chord.forEach((m, i) => synth(m + 12, start, beat * 3.8, {
    type: 'sawtooth',
    gain,
    pan: -0.35 + i * 0.35,
    detune: (i - 1) * 4,
    attack: 0.18,
    release: 0.25,
  }));
}

function leadNote(midi, start, beat, gain = 0.045, fast = false) {
  const dur = beat * (fast ? 0.18 : 0.38);
  synth(midi, start, dur, {
    type: 'sawtooth',
    gain,
    pan: -0.11,
    detune: -5,
    octave: true,
  });
  synth(midi, start, dur, {
    type: 'sawtooth',
    gain: gain * 0.70,
    pan: 0.11,
    detune: 5,
  });
}

function scheduleStep(track, absoluteStep, time) {
  const beat = 60 / track.bpm;
  const s = absoluteStep % 128;
  const bar = Math.floor(s / 16);
  const inBar = s % 16;
  const harmonic = track.progression[bar % track.progression.length];

  if (track.style === 'workshop') {
    if (inBar === 0) kick(time, 0.18);
    if (inBar === 8) kick(time, 0.14);
    if (inBar === 4 || inBar === 12) snare(time, 0.045);
    if (inBar % 2 === 0) hat(time, 0.012, false, inBar % 4 ? 0.2 : -0.2);
    if (inBar === 0) chordPad(harmonic.chord, time, beat, 0.008);

    if (inBar % 4 === 0) {
      synth(harmonic.root, time, beat * 0.7, {
        type: 'square',
        gain: 0.020,
        release: 0.08,
      });
    }

    if ((bar === 2 || bar === 6) && [0, 3, 6, 9].includes(inBar)) {
      const i = [0, 3, 6, 9].indexOf(inBar);
      leadNote(MOTIF[i], time, beat, 0.018);
    }
    return;
  }

  const race = track.style === 'race';
  const intensity = race ? 1 : track.style === 'title' ? 0.78 : 0.68;

  if (inBar % 4 === 0) kick(time, 0.30 * intensity);
  if (inBar === 4 || inBar === 12) snare(time, 0.095 * intensity);
  if (inBar % 2 === 0) hat(time, 0.024 * intensity, false, inBar % 4 ? 0.18 : -0.18);
  if (race && inBar === 14) hat(time, 0.030, true, 0.25);

  if (inBar % 2 === 0) {
    const bassMidi = harmonic.root + ((inBar / 2) % 2 ? 12 : 0);
    synth(bassMidi, time, beat * 0.34, {
      type: 'square',
      gain: race ? 0.050 : 0.032,
      release: 0.05,
    });
  }

  if ([2, 6, 10, 14].includes(inBar)) {
    chordStab(harmonic.chord, time, beat, race ? 0.026 : 0.018);
  }

  if (track.style === 'meet') {
    if ((bar === 3 || bar === 7) && inBar % 2 === 0) {
      const i = (inBar / 2) % MOTIF.length;
      leadNote(MOTIF[i] - 12, time, beat, 0.022);
    }
    return;
  }

  if (track.style === 'title') {
    if ([2, 3, 6, 7].includes(bar) && inBar % 2 === 0) {
      const i = (inBar / 2) % MOTIF.length;
      leadNote(MOTIF[i] + (bar >= 6 ? 12 : 0), time, beat, 0.034);
    }
    return;
  }

  if (track.variant === 'apex') {
    const arp = [
      harmonic.chord[0] + 24,
      harmonic.chord[1] + 24,
      harmonic.chord[2] + 24,
      harmonic.chord[1] + 24,
    ];

    synth(arp[inBar % 4], time, beat * 0.18, {
      type: 'square',
      gain: 0.012,
      pan: inBar % 2 ? 0.36 : -0.36,
      release: 0.025,
    });

    if (inBar % 2 === 0) {
      const i = (inBar / 2) % MOTIF.length;
      leadNote(MOTIF[i] + 12, time, beat, 0.048, true);
    }
    return;
  }

  if (track.variant === 'redline') {
    const red = [76, 79, 81, 79, 76, 74, 72, 74];
    if (inBar % 2 === 0) {
      leadNote(red[(inBar / 2) % red.length], time, beat, 0.047);
    }
    return;
  }

  if (bar >= 1 && inBar % 2 === 0) {
    const i = (inBar / 2) % MOTIF.length;
    leadNote(MOTIF[i] + (bar >= 5 ? 12 : 0), time, beat, 0.044);
  }
}

function runScheduler() {
  if (!ctx || !currentTrack || ctx.state !== 'running') return;

  const track = TRACKS[currentTrack];
  const stepDuration = (60 / track.bpm) / 4;
  const horizon = ctx.currentTime + 0.18;

  while (nextStepTime < horizon) {
    scheduleStep(track, stepIndex, nextStepTime);
    nextStepTime += stepDuration;
    stepIndex++;
  }
}

function startTrack(key) {
  if (!ensureAudio() || !TRACKS[key]) return;
  stopToken++;

  if (ctx.state !== 'running') {
    pendingTrack = key;
    currentTrack = key;
    return;
  }

  if (currentTrack === key && scheduler) return;

  clearInterval(scheduler);
  scheduler = null;
  stopActiveNodes();

  currentTrack = key;
  stepIndex = 0;
  nextStepTime = ctx.currentTime + 0.06;

  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, TRACKS[key].volume * musicVolume),
    ctx.currentTime + 0.28
  );

  runScheduler();
  scheduler = setInterval(runScheduler, 50);
}

export function playMusic(key) {
  if (!TRACKS[key]) return;
  if (!ensureAudio()) return;
  startTrack(key);
}

export function playRaceMusic() {
  const choices = ['ignition', 'redline', 'midnightApex'];
  const pool = choices.filter(key => key !== lastRaceTrack);
  const chosen = pool[Math.floor(Math.random() * pool.length)] || choices[0];

  lastRaceTrack = chosen;
  playMusic(chosen);
  return chosen;
}

export function stopMusic() {
  const token = ++stopToken;
  pendingTrack = null;
  currentTrack = null;

  if (scheduler) clearInterval(scheduler);
  scheduler = null;

  if (!ctx || !master) return;

  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(0.0001, now, 0.035);
  setTimeout(() => {
    if (token === stopToken) stopActiveNodes();
  }, 180);
}

export function playVictorySting() {
  if (!ensureAudio()) return;

  const fire = () => {
    if (!ctx || ctx.state !== 'running') return;

    if (scheduler) clearInterval(scheduler);
    scheduler = null;
    currentTrack = null;
    stopActiveNodes();

    const now = ctx.currentTime + 0.04;
    const beat = 60 / 160;

    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, 0.31 * musicVolume),
      now + 0.08
    );

    [0, 1, 2, 3, 4, 5].forEach(b => kick(now + b * beat, b === 0 ? 0.33 : 0.25));
    [1, 3, 5].forEach(b => snare(now + b * beat, 0.08));

    const melody = [
      [69, 0, 0.5],
      [72, 0.5, 0.5],
      [76, 1, 0.5],
      [81, 1.5, 1],
      [79, 2.5, 0.5],
      [81, 3, 0.5],
      [84, 3.5, 1.5],
    ];

    melody.forEach(([m, off, len]) => {
      leadNote(m, now + off * beat, beat * len * 1.8, 0.050);
    });

    [[57, 60, 64], [55, 59, 62], [57, 60, 64]].forEach((ch, i) => {
      ch.forEach((m, j) => synth(m + 12, now + i * 2 * beat, beat * 1.8, {
        type: 'sawtooth',
        gain: 0.020,
        pan: -0.25 + j * 0.25,
        release: 0.18,
      }));
    });

    master.gain.setTargetAtTime(0.0001, now + 5.3 * beat, 0.18);
  };

  if (ctx.state === 'running') {
    fire();
    return;
  }

  pendingTrack = null;
  installUnlock();

  const once = async () => {
    try { await ctx.resume(); } catch (e) {}
    fire();
    document.removeEventListener('pointerdown', once, true);
    document.removeEventListener('touchstart', once, true);
  };

  document.addEventListener('pointerdown', once, true);
  document.addEventListener('touchstart', once, true);
}
