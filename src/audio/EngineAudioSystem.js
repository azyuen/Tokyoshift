import { getSfxVolume } from './AudioSettings.js?v=20260921-r56';

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
    harmonics: [1.00, 0.43, 0.25, 0.15, 0.09, 0.055],
    lowOrder: 0.16,
    mechanical: 0.08,
    brightness: 0.88,
    roughness: 0.025,
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

export default class EngineAudioSystem {
  constructor(playerEngineId, opponentEngineId) {
    this.ctx = ensureContext();

    this.player = new EngineVoice(playerEngineId, {
      volume: 0.26,
      pan: -0.05,
    });

    this.opponent = new EngineVoice(opponentEngineId, {
      volume: 0.15,
      pan: 0.22,
    });

    this.destroyed = false;
  }

  update(playerTelemetry, opponentTelemetry, playerConfig, opponentConfig) {
    if (this.destroyed) return;

    this.player.update(playerTelemetry, playerConfig, sfxVolume);

    const separation = Math.abs(
      (playerTelemetry?.positionM || 0) - (opponentTelemetry?.positionM || 0)
    );
    const opponentScale = Math.max(0.22, Math.min(0.72, 0.72 - separation * 0.025));

    this.opponent.update(
      opponentTelemetry,
      opponentConfig,
      opponentScale * sfxVolume
    );
  }

  fadeOut() {
    this.player.fadeOut(0.16);
    this.opponent.fadeOut(0.16);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.player.destroy();
    this.opponent.destroy();
  }
}
