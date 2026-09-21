import { getSfxVolume } from './AudioSettings.js?v=20260921-r57';

// TOKYO SHIFT live vanilla engine audio
// Purely tonal engine synthesis: no static/noise bed and deliberately NO turbo,
// wastegate or blow-off audio. Forced-induction sounds belong to upgrade modules.

const AudioCtx = window.AudioContext || window.webkitAudioContext;

const ENGINE_PROFILES = {
  '4age': {
    events: 2.0,
    harmonics: [1.00, 0.68, 0.38, 0.22, 0.13, 0.08],
    lowOrder: 0.22,
    mechanical: 0.12,
    brightness: 1.10,
    roughness: 0.055,
  },
  rb26dett: {
    events: 3.0,
    harmonics: [1.00, 0.45, 0.24, 0.13, 0.065, 0.032],
    lowOrder: 0.18,
    mechanical: 0.065,
    brightness: 0.72,
    roughness: 0.022,
  },
  '4g63t': {
    events: 2.0,
    harmonics: [1.00, 0.61, 0.34, 0.19, 0.11, 0.065],
    lowOrder: 0.26,
    mechanical: 0.10,
    brightness: 0.92,
    roughness: 0.070,
  },
  '13bt': {
    events: 2.0,
    harmonics: [1.00, 0.30, 0.24, 0.19, 0.15, 0.11, 0.075, 0.05],
    lowOrder: 0.10,
    mechanical: 0.16,
    brightness: 1.30,
    roughness: 0.012,
    rotary: true,
  },
  ej22g: {
    events: 2.0,
    harmonics: [1.00, 0.70, 0.40, 0.22, 0.12, 0.07],
    lowOrder: 0.34,
    mechanical: 0.08,
    brightness: 0.76,
    roughness: 0.085,
    boxer: true,
  },
  b16b: {
    events: 2.0,
    harmonics: [1.00, 0.57, 0.33, 0.20, 0.12, 0.075],
    lowOrder: 0.20,
    mechanical: 0.13,
    brightness: 1.28,
    roughness: 0.045,
    vtecRPM: 6000,
  },
};

const DEFAULT_PROFILE = ENGINE_PROFILES['4age'];

let ctx = null;
let unlockInstalled = false;
let sfxVolume = getSfxVolume();

if (typeof window !== 'undefined') {
  window.addEventListener('tokyo-shift-audio-settings', event => {
    sfxVolume = Math.max(0, Math.min(1, Number(event.detail?.sfx) || 0));
  });
}

function ensureContext() {
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state !== 'running') installUnlock();
  return ctx;
}

function installUnlock() {
  if (unlockInstalled || !ctx) return;
  unlockInstalled = true;

  const unlock = async () => {
    try { await ctx.resume(); } catch (e) {}
    if (ctx.state === 'running') {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      unlockInstalled = false;
    }
  };

  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('keydown', unlock, true);
}

function smoothParam(param, value, now, timeConstant = 0.035) {
  param.cancelScheduledValues(now);
  param.setTargetAtTime(value, now, timeConstant);
}

function makeDriveCurve(amount = 1.4) {
  const n = 512;
  const curve = new Float32Array(n);
  const k = Math.max(0.01, amount);
  for (let i = 0; i < n; i++) {
    const x = i * 2 / (n - 1) - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

class EngineVoice {
  constructor(engineId, { volume = 0.24, pan = 0 } = {}) {
    this.ctx = ensureContext();
    this.engineId = engineId;
    this.profile = ENGINE_PROFILES[engineId] || DEFAULT_PROFILE;
    this.baseVolume = volume;
    this.destroyed = false;

    if (!this.ctx) return;

    this.output = this.ctx.createGain();
    this.output.gain.value = 0.0001;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.Q.value = 0.5;
    this.filter.frequency.value = 2600;

    this.shaper = this.ctx.createWaveShaper();
    this.shaper.curve = makeDriveCurve(1.35);
    this.shaper.oversample = '2x';

    this.panner = this.ctx.createStereoPanner
      ? this.ctx.createStereoPanner()
      : this.ctx.createGain();

    if ('pan' in this.panner) this.panner.pan.value = pan;

    this.output.connect(this.filter);
    this.filter.connect(this.shaper);
    this.shaper.connect(this.panner);
    this.panner.connect(this.ctx.destination);

    this.harmonics = this.profile.harmonics.map((weight, index) =>
      this.createPartial(index + 1, weight)
    );

    this.lowPartials = [
      this.createPartial(0.50, this.profile.lowOrder * 0.52),
      this.createPartial(0.25, this.profile.lowOrder * 0.28),
      this.createPartial(1.50, this.profile.lowOrder * 0.20),
    ];

    this.mechanical = [
      this.createCrankPartial(4, this.profile.mechanical * 0.55),
      this.createCrankPartial(7, this.profile.mechanical * 0.28),
      this.createCrankPartial(10, this.profile.mechanical * 0.14),
    ];

    this.boxerPartials = this.profile.boxer
      ? [
          this.createPartial(0.50, 0.18),
          this.createPartial(0.25, 0.09),
        ]
      : [];

    this.rotaryPartials = this.profile.rotary
      ? [
          this.createPartial(3.0, 0.13),
          this.createPartial(4.5, 0.09),
          this.createPartial(6.0, 0.055),
        ]
      : [];

    this.vtecPartials = this.profile.vtecRPM
      ? [
          this.createPartial(3.0, 0.0),
          this.createPartial(5.0, 0.0),
        ]
      : [];

    this.start();
  }

  createPartial(multiplier, weight) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 80;
    gain.gain.value = Math.max(0.0001, weight * 0.08);
    osc.connect(gain);
    gain.connect(this.output);
    return { osc, gain, multiplier, weight };
  }

  createCrankPartial(multiplier, weight) {
    const partial = this.createPartial(multiplier, weight);
    partial.crankBased = true;
    return partial;
  }

  start() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const all = [
      ...this.harmonics,
      ...this.lowPartials,
      ...this.mechanical,
      ...this.boxerPartials,
      ...this.rotaryPartials,
      ...this.vtecPartials,
    ];
    all.forEach(partial => {
      try { partial.osc.start(now); } catch (e) {}
    });
  }

  update(telemetry, config, volumeScale = 1) {
    if (!this.ctx || this.destroyed || !telemetry) return;

    const now = this.ctx.currentTime;
    const idle = Math.max(500, config?.engineIdleRPM || 850);
    const redline = Math.max(idle + 1000, config?.engineRedlineRPM || 7600);
    const rpm = Math.max(idle * 0.82, Number(telemetry.rpm) || idle);
    const throttle = Math.max(0, Math.min(1, Number(telemetry.throttle) || 0));
    const rpmN = Math.max(0, Math.min(1, (rpm - idle) / (redline - idle)));

    const firingHz = Math.max(18, rpm / 60 * this.profile.events);
    const crankHz = Math.max(12, rpm / 60);

    const throttleBody = 0.20 + throttle * 0.80;
    const speedBody = 0.48 + Math.sqrt(Math.max(0.015, rpmN)) * 0.52;
    const overall = this.baseVolume * volumeScale * throttleBody * speedBody;

    smoothParam(this.output.gain, Math.max(0.0001, overall), now, 0.045);

    const cutoff = 1500 + rpmN * (3100 * this.profile.brightness) + throttle * 1300;
    smoothParam(this.filter.frequency, Math.max(1100, Math.min(7200, cutoff)), now, 0.06);

    this.harmonics.forEach((partial, index) => {
      const harmonic = index + 1;
      smoothParam(partial.osc.frequency, firingHz * harmonic, now, 0.022);

      const brighten = 1 + (harmonic - 1) * 0.035 * rpmN * this.profile.brightness;
      const gain = partial.weight * brighten * 0.085;
      smoothParam(partial.gain.gain, Math.max(0.0001, gain), now, 0.05);
    });

    this.lowPartials.forEach(partial => {
      smoothParam(partial.osc.frequency, firingHz * partial.multiplier, now, 0.03);
      smoothParam(partial.gain.gain, Math.max(0.0001, partial.weight * 0.085), now, 0.06);
    });

    this.mechanical.forEach(partial => {
      smoothParam(partial.osc.frequency, crankHz * partial.multiplier, now, 0.022);
      const gain = partial.weight * (0.35 + rpmN * 0.65) * 0.08;
      smoothParam(partial.gain.gain, Math.max(0.0001, gain), now, 0.045);
    });

    this.boxerPartials.forEach(partial => {
      smoothParam(partial.osc.frequency, firingHz * partial.multiplier, now, 0.035);
      const gain = partial.weight * (0.72 + 0.28 * (1 - rpmN)) * 0.10;
      smoothParam(partial.gain.gain, Math.max(0.0001, gain), now, 0.06);
    });

    this.rotaryPartials.forEach(partial => {
      smoothParam(partial.osc.frequency, firingHz * partial.multiplier, now, 0.024);
      const gain = partial.weight * (0.42 + rpmN * 0.58) * 0.085;
      smoothParam(partial.gain.gain, Math.max(0.0001, gain), now, 0.05);
    });

    if (this.vtecPartials.length) {
      const crossover = this.profile.vtecRPM;
      const vtec = Math.max(0, Math.min(1, (rpm - (crossover - 350)) / 700));

      this.vtecPartials.forEach((partial, i) => {
        smoothParam(partial.osc.frequency, firingHz * partial.multiplier, now, 0.022);
        const target = vtec * (i === 0 ? 0.010 : 0.0065);
        smoothParam(partial.gain.gain, Math.max(0.0001, target), now, 0.055);
      });
    }
  }

  fadeOut(seconds = 0.18) {
    if (!this.ctx || this.destroyed) return;
    const now = this.ctx.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setTargetAtTime(0.0001, now, Math.max(0.02, seconds / 4));
  }

  destroy() {
    if (!this.ctx || this.destroyed) return;
    this.destroyed = true;

    const all = [
      ...this.harmonics,
      ...this.lowPartials,
      ...this.mechanical,
      ...this.boxerPartials,
      ...this.rotaryPartials,
      ...this.vtecPartials,
    ];

    all.forEach(partial => {
      try { partial.osc.stop(); } catch (e) {}
      try { partial.osc.disconnect(); } catch (e) {}
      try { partial.gain.disconnect(); } catch (e) {}
    });

    try { this.output.disconnect(); } catch (e) {}
    try { this.filter.disconnect(); } catch (e) {}
    try { this.shaper.disconnect(); } catch (e) {}
    try { this.panner.disconnect(); } catch (e) {}
  }
}


function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function getUpgradeAudioLevels(state = {}) {
  const engine = state.tuning || state.engineTuning || {};
  const drivetrain = state.drivetrainTuning || {};
  const exhaustNos = state.exhaustNosTuning || {};

  return {
    turbo: Math.max(0, Math.min(3, Number(engine.turbo) || 0)),
    gearbox: Math.max(0, Math.min(3, Number(drivetrain.gearbox) || 0)),
    exhaust: Math.max(
      Number(engine.exhaust) || 0,
      Number(exhaustNos.headers) || 0,
      Number(exhaustNos.exhaust) || 0,
      Number(exhaustNos.muffler) || 0
    ),
    nos: Math.max(
      Number(exhaustNos.nosKit) || 0,
      state.nosInstalled ? 1 : 0
    ),
    nitrousShot: Math.max(
      Number(exhaustNos.nitrousShot) || 0,
      state.nosInstalled ? 1 : 0
    ),
  };
}

function makeNoiseBuffer(duration = 0.5) {
  const context = ensureContext();
  if (!context) return null;

  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

class UpgradeAudioVoice {
  constructor(state = {}, { pan = -0.04, volume = 1 } = {}) {
    this.ctx = ensureContext();
    this.levels = getUpgradeAudioLevels(state);
    this.pan = pan;
    this.volume = volume;
    this.destroyed = false;

    this.prev = {
      throttle: 0,
      boostBar: 0,
      turboSpool: 0,
      gear: 0,
      pendingGear: null,
      nosActive: false,
      wheelspin: false,
      rpm: 0,
    };

    this.cooldowns = {
      bov: 0,
      exhaust: 0,
      wastegate: 0,
      chirp: 0,
    };

    if (!this.ctx) return;

    this.output = this.ctx.createGain();
    this.output.gain.value = 1;

    this.panner = this.ctx.createStereoPanner
      ? this.ctx.createStereoPanner()
      : this.ctx.createGain();

    if ('pan' in this.panner) this.panner.pan.value = pan;

    this.output.connect(this.panner);
    this.panner.connect(this.ctx.destination);

    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.value = 900;
    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.value = 0.0001;
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.output);
    this.turboOsc.start();

    this.turboNoise = this.ctx.createBufferSource();
    this.turboNoise.buffer = makeNoiseBuffer(1.0);
    this.turboNoise.loop = true;
    this.turboNoiseFilter = this.ctx.createBiquadFilter();
    this.turboNoiseFilter.type = 'bandpass';
    this.turboNoiseFilter.frequency.value = 1050;
    this.turboNoiseFilter.Q.value = 0.55;
    this.turboNoiseGain = this.ctx.createGain();
    this.turboNoiseGain.gain.value = 0.0001;
    this.turboNoise.connect(this.turboNoiseFilter);
    this.turboNoiseFilter.connect(this.turboNoiseGain);
    this.turboNoiseGain.connect(this.output);
    this.turboNoise.start();
    this.spoolBurst = 0;

    this.gearOsc = this.ctx.createOscillator();
    this.gearOsc.type = 'sine';
    this.gearOsc.frequency.value = 500;
    this.gearGain = this.ctx.createGain();
    this.gearGain.gain.value = 0.0001;
    this.gearOsc.connect(this.gearGain);
    this.gearGain.connect(this.output);
    this.gearOsc.start();

    this.gearUpperOsc = this.ctx.createOscillator();
    this.gearUpperOsc.type = 'sine';
    this.gearUpperOsc.frequency.value = 1000;
    this.gearUpperGain = this.ctx.createGain();
    this.gearUpperGain.gain.value = 0.0001;
    this.gearUpperOsc.connect(this.gearUpperGain);
    this.gearUpperGain.connect(this.output);
    this.gearUpperOsc.start();

    this.tyreOsc = this.ctx.createOscillator();
    this.tyreOsc.type = 'sine';
    this.tyreOsc.frequency.value = 1050;
    this.tyreGain = this.ctx.createGain();
    this.tyreGain.gain.value = 0.0001;
    this.tyreOsc.connect(this.tyreGain);
    this.tyreGain.connect(this.output);
    this.tyreOsc.start();

    this.tyreNoise = this.ctx.createBufferSource();
    this.tyreNoise.buffer = makeNoiseBuffer(1.0);
    this.tyreNoise.loop = true;
    this.tyreNoiseFilter = this.ctx.createBiquadFilter();
    this.tyreNoiseFilter.type = 'bandpass';
    this.tyreNoiseFilter.frequency.value = 720;
    this.tyreNoiseFilter.Q.value = 0.55;
    this.tyreNoiseGain = this.ctx.createGain();
    this.tyreNoiseGain.gain.value = 0.0001;
    this.tyreNoise.connect(this.tyreNoiseFilter);
    this.tyreNoiseFilter.connect(this.tyreNoiseGain);
    this.tyreNoiseGain.connect(this.output);
    this.tyreNoise.start();
  }

  playNoiseBurst({
    duration = 0.35,
    gain = 0.08,
    filterType = 'bandpass',
    frequency = 2200,
    q = 0.8,
    decay = 8,
    delay = 0,
  } = {}) {
    if (!this.ctx || this.destroyed || sfxVolume <= 0) return;

    const start = this.ctx.currentTime + delay;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();

    source.buffer = makeNoiseBuffer(duration);
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;

    amp.gain.setValueAtTime(Math.max(0.0001, gain * this.volume * sfxVolume), start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.05, duration / Math.max(1, decay / 4)));

    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.output);

    source.start(start);
    source.stop(start + duration);
  }

  playTone({
    frequency = 800,
    endFrequency = null,
    duration = 0.18,
    gain = 0.08,
    type = 'sine',
    delay = 0,
  } = {}) {
    if (!this.ctx || this.destroyed || sfxVolume <= 0) return;

    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, frequency), start);
    if (endFrequency != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration);
    }

    amp.gain.setValueAtTime(Math.max(0.0001, gain * this.volume * sfxVolume), start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(amp);
    amp.connect(this.output);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playBov(level) {
    if (level >= 3) {
      for (let i = 0; i < 5; i++) {
        this.playNoiseBurst({
          duration: 0.075,
          gain: 0.055,
          filterType: 'bandpass',
          frequency: 1150 - i * 90,
          q: 1.1,
          decay: 12,
          delay: i * 0.065,
        });
      }
      this.playTone({
        frequency: 900,
        endFrequency: 560,
        duration: 0.34,
        gain: 0.035,
      });
      return;
    }

    const race = level >= 2;
    this.playNoiseBurst({
      duration: race ? 0.38 : 0.52,
      gain: race ? 0.13 : 0.095,
      filterType: 'highpass',
      frequency: race ? 1350 : 900,
      q: 0.7,
      decay: race ? 11 : 8,
    });

    this.playTone({
      frequency: race ? 2450 : 1700,
      endFrequency: race ? 1200 : 820,
      duration: race ? 0.26 : 0.38,
      gain: race ? 0.035 : 0.025,
    });
  }

  playWastegate() {
    this.playNoiseBurst({
      duration: 0.22,
      gain: 0.085,
      filterType: 'bandpass',
      frequency: 760,
      q: 0.9,
      decay: 13,
    });
    this.playTone({
      frequency: 110,
      endFrequency: 82,
      duration: 0.20,
      gain: 0.045,
      type: 'square',
    });
  }

  playNitrousActivation(level) {
    this.playTone({
      frequency: 950,
      endFrequency: 640,
      duration: 0.035,
      gain: 0.095,
      type: 'square',
    });

    this.playNoiseBurst({
      duration: 0.42,
      gain: 0.075 + level * 0.012,
      filterType: 'highpass',
      frequency: 3200,
      q: 0.5,
      decay: 7,
      delay: 0.012,
    });
  }

  playExhaustPop(level) {
    const race = level >= 3;
    this.playTone({
      frequency: race ? 82 : 100,
      endFrequency: race ? 58 : 72,
      duration: race ? 0.24 : 0.17,
      gain: race ? 0.13 : 0.075,
      type: 'sine',
    });

    this.playNoiseBurst({
      duration: race ? 0.28 : 0.18,
      gain: race ? 0.10 : 0.055,
      filterType: 'bandpass',
      frequency: race ? 1700 : 1250,
      q: 0.7,
      decay: race ? 14 : 16,
    });

    if (race) {
      this.playTone({
        frequency: 130,
        endFrequency: 90,
        duration: 0.13,
        gain: 0.055,
        type: 'square',
        delay: 0.085,
      });
    }
  }

  playTyreChirp() {
    this.playNoiseBurst({
      duration: 0.12,
      gain: 0.075,
      filterType: 'bandpass',
      frequency: 820,
      q: 0.48,
      decay: 18,
    });
    this.playNoiseBurst({
      duration: 0.16,
      gain: 0.050,
      filterType: 'lowpass',
      frequency: 1450,
      q: 0.35,
      decay: 15,
      delay: 0.018,
    });
  }

  update(telemetry, config, dt = 1 / 60, volumeScale = 1) {
    if (!this.ctx || this.destroyed || !telemetry) return;

    const now = this.ctx.currentTime;
    const throttle = clamp01(telemetry.throttle);
    const boost = Math.max(0, Number(telemetry.boostBar) || 0);
    const spool = clamp01(telemetry.turboSpool);
    const gear = Number(telemetry.gear) || 0;
    const pendingGear = telemetry.pendingGear == null ? null : Number(telemetry.pendingGear);
    const rpm = Math.max(0, Number(telemetry.rpm) || 0);
    const speed = Math.max(0, Number(telemetry.speedKmh) || 0);
    const wheelRPM = Math.max(0, Number(telemetry.wheelRPM) || 0);
    const slip = clamp01(telemetry.slipRatio);
    const nosActive = Boolean(telemetry.nosActive);
    const wheelspin = Boolean(telemetry.wheelspin);

    Object.keys(this.cooldowns).forEach(key => {
      this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    });

    // TURBO: only workshop turbo upgrades generate turbo audio.
    // Factory forced induction at turbo level 0 remains acoustically "vanilla".
    if (this.levels.turbo > 0) {
      const spoolRise = Math.max(0, spool - this.prev.turboSpool);
      const boostRise = Math.max(0, boost - this.prev.boostBar);
      const impulse = Math.max(0, clamp01(spoolRise * 18 + boostRise * 7) - 0.035);
      this.spoolBurst = Math.max(this.spoolBurst * Math.exp(-dt * 7.5), impulse);

      const turboSize = this.levels.turbo / 3;
      const spoolFreq = 420 + spool * (760 - turboSize * 160);
      const airFreq = 900 + spool * (1150 - turboSize * 220);
      const burst = this.spoolBurst;

      smoothParam(this.turboOsc.frequency, spoolFreq, now, 0.03);
      smoothParam(this.turboNoiseFilter.frequency, airFreq, now, 0.04);
      smoothParam(
        this.turboOsc.gain ? this.turboOsc.gain : this.turboGain.gain,
        0.0001,
        now,
        0.02
      );
      smoothParam(
        this.turboGain.gain,
        Math.max(0.0001, burst * 0.0035 * volumeScale * sfxVolume),
        now,
        0.028
      );
      smoothParam(
        this.turboNoiseGain.gain,
        Math.max(0.0001, burst * (0.014 + this.levels.turbo * 0.0025) * volumeScale * sfxVolume),
        now,
        0.025
      );

      const throttleLift = this.prev.throttle > 0.62 && throttle < 0.28;
      const shiftStarted =
        this.prev.pendingGear == null &&
        pendingGear != null &&
        this.prev.gear > 0;

      if (
        this.cooldowns.bov <= 0 &&
        this.prev.boostBar > 0.10 &&
        (throttleLift || shiftStarted)
      ) {
        this.playBov(this.levels.turbo);
        this.cooldowns.bov = 0.32;
      }

      if (
        this.levels.turbo >= 3 &&
        this.cooldowns.wastegate <= 0 &&
        throttle > 0.88 &&
        boost > Math.max(0.30, Number(config?.maximumBoost || 0) * 0.88)
      ) {
        this.playWastegate();
        this.cooldowns.wastegate = 0.95;
      }
    } else {
      this.spoolBurst = 0;
      smoothParam(this.turboGain.gain, 0.0001, now, 0.035);
      smoothParam(this.turboNoiseGain.gain, 0.0001, now, 0.035);
    }

    // GEARBOX: close-ratio gets a subtle whine; dog box is much more obvious.
    if (this.levels.gearbox >= 2 && gear > 0 && speed > 8) {
      const base = 440 + wheelRPM * 0.42 + gear * 55;
      const intensity = this.levels.gearbox === 3 ? 1 : 0.42;
      smoothParam(this.gearOsc.frequency, Math.max(420, base), now, 0.035);
      smoothParam(this.gearUpperOsc.frequency, Math.max(840, base * 2.02), now, 0.035);
      smoothParam(
        this.gearGain.gain,
        (0.010 + throttle * 0.010) * intensity * volumeScale * sfxVolume,
        now,
        0.05
      );
      smoothParam(
        this.gearUpperGain.gain,
        (0.0035 + throttle * 0.004) * intensity * volumeScale * sfxVolume,
        now,
        0.05
      );
    } else {
      smoothParam(this.gearGain.gain, 0.0001, now, 0.05);
      smoothParam(this.gearUpperGain.gain, 0.0001, now, 0.05);
    }

    // NOS: fire the activation hiss/click only on the leading edge.
    if (this.levels.nos > 0 && this.levels.nitrousShot > 0 && nosActive && !this.prev.nosActive) {
      this.playNitrousActivation(this.levels.nos);
    }

    // EXHAUST: freer systems pop on a hard lift at useful RPM.
    const hardLift = this.prev.throttle > 0.58 && throttle < 0.22;
    if (
      this.levels.exhaust > 0 &&
      this.cooldowns.exhaust <= 0 &&
      hardLift &&
      rpm > 3200
    ) {
      this.playExhaustPop(this.levels.exhaust);
      this.cooldowns.exhaust = this.levels.exhaust >= 3 ? 0.26 : 0.42;
    }

    // TYRES: driven entirely from actual slip telemetry, independent of upgrades.
    if (wheelspin && slip > 0.08 && speed > 1.5) {
      const scrubFreq = 560 + Math.min(520, speed * 2.2 + slip * 260);
      smoothParam(this.tyreNoiseFilter.frequency, scrubFreq, now, 0.04);
      smoothParam(
        this.tyreNoiseGain.gain,
        (0.020 + slip * 0.050) * volumeScale * sfxVolume,
        now,
        0.035
      );
      smoothParam(this.tyreGain.gain, 0.0001, now, 0.025);

      if (!this.prev.wheelspin && this.cooldowns.chirp <= 0) {
        this.playTyreChirp();
        this.cooldowns.chirp = 0.32;
      }
    } else {
      smoothParam(this.tyreNoiseGain.gain, 0.0001, now, 0.04);
      smoothParam(this.tyreGain.gain, 0.0001, now, 0.04);
    }

    this.prev = {
      throttle,
      boostBar: boost,
      turboSpool: spool,
      gear,
      pendingGear,
      nosActive,
      wheelspin,
      rpm,
    };
  }

  fadeOut() {
    if (!this.ctx || this.destroyed) return;
    const now = this.ctx.currentTime;
    [this.turboGain, this.turboNoiseGain, this.gearGain, this.gearUpperGain, this.tyreGain, this.tyreNoiseGain].forEach(gain => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0.0001, now, 0.035);
    });
  }

  destroy() {
    if (!this.ctx || this.destroyed) return;
    this.destroyed = true;

    [this.turboOsc, this.turboNoise, this.gearOsc, this.gearUpperOsc, this.tyreOsc, this.tyreNoise].forEach(osc => {
      try { osc.stop(); } catch (e) {}
      try { osc.disconnect(); } catch (e) {}
    });

    [this.turboGain, this.turboNoiseGain, this.gearGain, this.gearUpperGain, this.tyreGain, this.tyreNoiseGain].forEach(gain => {
      try { gain.disconnect(); } catch (e) {}
    });

    try { this.turboNoiseFilter.disconnect(); } catch (e) {}
    try { this.tyreNoiseFilter.disconnect(); } catch (e) {}
    try { this.output.disconnect(); } catch (e) {}
    try { this.panner.disconnect(); } catch (e) {}
  }
}

export default class EngineAudioSystem {
  constructor(playerEngineId, opponentEngineId, playerState = {}, opponentState = {}) {
    this.ctx = ensureContext();

    this.player = new EngineVoice(playerEngineId, {
      volume: 0.26,
      pan: -0.05,
    });

    this.opponent = new EngineVoice(opponentEngineId, {
      volume: 0.15,
      pan: 0.22,
    });

    this.playerUpgrades = new UpgradeAudioVoice(playerState, {
      volume: 1.0,
      pan: -0.04,
    });

    this.opponentUpgrades = new UpgradeAudioVoice(opponentState, {
      volume: 0.58,
      pan: 0.22,
    });

    this.destroyed = false;
  }

  update(playerTelemetry, opponentTelemetry, playerConfig, opponentConfig, dt = 1 / 60) {
    if (this.destroyed) return;

    this.player.update(playerTelemetry, playerConfig, sfxVolume);
    this.playerUpgrades.update(playerTelemetry, playerConfig, dt, 1.0);

    const separation = Math.abs(
      (playerTelemetry?.positionM || 0) - (opponentTelemetry?.positionM || 0)
    );
    const opponentScale = Math.max(0.22, Math.min(0.72, 0.72 - separation * 0.025));

    this.opponent.update(
      opponentTelemetry,
      opponentConfig,
      opponentScale * sfxVolume
    );
    this.opponentUpgrades.update(
      opponentTelemetry,
      opponentConfig,
      dt,
      opponentScale
    );
  }

  fadeOut() {
    this.player.fadeOut(0.16);
    this.opponent.fadeOut(0.16);
    this.playerUpgrades.fadeOut();
    this.opponentUpgrades.fadeOut();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.player.destroy();
    this.opponent.destroy();
    this.playerUpgrades.destroy();
    this.opponentUpgrades.destroy();
  }
}
