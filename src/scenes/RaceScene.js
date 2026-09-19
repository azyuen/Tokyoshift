import Vehicle from '../vehicles/Vehicle.js';
import TouchControls from '../input/TouchControls.js';
import DragRacingAI from '../ai/DragRacingAI.js';
import RaceHUD from '../ui/RaceHUD.js';
import DebugHUD from '../ui/DebugHUD.js';
import { cars } from '../data/cars.js';
import { engines } from '../data/engines.js';

const TRACK_M = 402.336;
const PX_PER_M = 8.0;

export default class RaceScene extends Phaser.Scene {
  constructor() { super('RaceScene'); }

  create() {
    this.player = new Vehicle(cars.playerPrototype, engines[cars.playerPrototype.engine]);
    this.opponent = new Vehicle(cars.opponentPrototype, engines[cars.opponentPrototype.engine]);

    // Player stages in neutral so idle torque cannot creep the car into a false start.
    // The opponent remains preloaded in 1st with its clutch held by the AI.
    this.player.transmission.currentGear = 0;
    this.player.transmission.lastShiftQuality = 'NEUTRAL';
    this.ai = new DragRacingAI(this.opponent, { reactionSkill: 0.76, launchSkill: 0.70, shiftSkill: 0.74, aggression: 0.73 });
    this.controls = new TouchControls(this);
    this.hud = new RaceHUD(this);
    this.debug = new DebugHUD(this);

    this.raceClock = 0;
    this.countdownClock = 0;
    this.greenClock = null;
    this.stageArmed = false;
    this.falseStart = false;
    this.finished = false;
    this.afterFinishTimer = 0;
    this.startMoved = false;
    this.times = { reaction: null, sixty: null, eighth: null, quarter: null, trapKmh: null };
    this.opponentFinishClock = null;
    this.playerFinishClock = null;

    this.bg = this.add.graphics().setDepth(0);
    this.road = this.add.graphics().setDepth(1);
    this.worldG = this.add.graphics().setDepth(3);
    this.playerG = this.add.graphics().setDepth(7);
    this.opponentG = this.add.graphics().setDepth(6);
    this.fxG = this.add.graphics().setDepth(5);
    this.treeG = this.add.graphics().setDepth(20).setScrollFactor(0);

  }

  racePhase() {
    if (!this.stageArmed) return 'READY';
    if (this.greenClock != null) return 'GREEN';
    if (this.countdownClock < 0.9) return 'PRE-STAGE';
    if (this.countdownClock < 1.8) return 'STAGE';
    if (this.countdownClock < 2.3) return 'AMBER 1';
    if (this.countdownClock < 2.8) return 'AMBER 2';
    if (this.countdownClock < 3.3) return 'AMBER 3';
    return 'GREEN';
  }

  update(_, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    this.raceClock += dt;
    if (Phaser.Input.Keyboard.JustDown(this.controls.keys.debug)) this.debug.toggle();
    if (Phaser.Input.Keyboard.JustDown(this.controls.keys.restart)) this.scene.restart();

    const controlState = this.controls.update();
    const requestedGear = this.controls.consumeGearRequest();

    if (requestedGear === 'UP') {
      const tr = this.player.transmission;
      if (tr.shiftTimer <= 0) {
        const nextGear = tr.currentGear <= 0 ? 1 : tr.currentGear + 1;
        if (nextGear <= this.player.config.gearRatios.length) {
          this.player.requestGear(nextGear);
        }
      }
    } else if (typeof requestedGear === 'number') {
      this.player.requestGear(requestedGear);
    }

    // The tree only starts once the player has genuinely staged:
    // clutch depressed and 1st gear selected.
    if (!this.stageArmed &&
        this.player.transmission.currentGear === 1 &&
        controlState.clutch >= 0.65) {
      this.stageArmed = true;
      this.countdownClock = 0;
    }

    if (this.stageArmed && this.greenClock == null) {
      this.countdownClock += dt;
      if (this.countdownClock >= 3.3) this.greenClock = this.raceClock;
    }

    const aiState = this.ai.update(dt, this.raceClock, this.greenClock);
    const playerT = this.player.update(dt, controlState);
    const oppT = this.opponent.update(dt, aiState);

    this.handleTiming(playerT, oppT);
    this.drawScene(playerT, oppT);

    let status = '';
    if (this.falseStart) status = 'RED LIGHT';
    else if (!this.stageArmed) status = 'CLUTCH + SHIFT';
    else if (this.greenClock != null) status = 'GO!';
    else if (this.countdownClock < 1.8) status = 'STAGED';

    this.hud.update(playerT, status);
    this.debug.update(playerT);

    if (this.finished) {
      this.afterFinishTimer += dt;
      if (this.afterFinishTimer > 2.0) {
        this.scene.start('ResultScene', {
          times: this.times,
          falseStart: this.falseStart,
          playerFinishClock: this.playerFinishClock,
          opponentFinishClock: this.opponentFinishClock,
          playerName: this.player.config.name,
          opponentName: this.opponent.config.name,
        });
      }
    }
  }

  handleTiming(pt, ot) {
    const moved = pt.positionM > 0.20 || pt.speedMps > 0.60;
    if (this.stageArmed && moved && !this.startMoved) {
      this.startMoved = true;
      if (this.greenClock == null) {
        this.falseStart = true;
        this.times.reaction = null;
      } else {
        this.times.reaction = this.raceClock - this.greenClock;
      }
    }

    if (this.greenClock != null && this.startMoved && !this.falseStart) {
      const launchClock = this.greenClock + (this.times.reaction ?? 0);
      const elapsed = this.raceClock - launchClock;
      if (this.times.sixty == null && pt.positionM >= 18.288) this.times.sixty = elapsed;
      if (this.times.eighth == null && pt.positionM >= 201.168) this.times.eighth = elapsed;
      if (this.times.quarter == null && pt.positionM >= TRACK_M) {
        this.times.quarter = elapsed;
        this.times.trapKmh = pt.speedKmh;
      }
    }

    if (pt.positionM >= TRACK_M && this.playerFinishClock == null) this.playerFinishClock = this.raceClock;
    if (ot.positionM >= TRACK_M && this.opponentFinishClock == null) this.opponentFinishClock = this.raceClock;

    if (!this.finished && (this.playerFinishClock != null || this.falseStart && this.greenClock != null)) {
      if (this.falseStart || this.opponentFinishClock != null || this.raceClock - this.playerFinishClock > 1.0) this.finished = true;
    }
  }

  makeSplitText() {
    const f = v => v == null ? '—' : `${v.toFixed(3)}s`;
    return `RT ${f(this.times.reaction)}   60ft ${f(this.times.sixty)}   1/8 ${f(this.times.eighth)}   1/4 ${f(this.times.quarter)}`;
  }

  drawScene(pt, ot) {
    const W = 1280, H = 720;
    const targetPlayerX = W * 0.38;
    const cameraPx = Math.max(0, pt.positionM * PX_PER_M - targetPlayerX);

    this.bg.clear();
    this.bg.fillStyle(0x070914, 1).fillRect(0, 0, W, H);
    // Distant skyline / parallax.
    const slow = -(cameraPx * 0.12) % 240;
    for (let i = -1; i < 8; i++) {
      const x = slow + i * 240;
      const h = 70 + ((i * 37) % 110 + 110) % 110;
      this.bg.fillStyle(i % 2 ? 0x11172b : 0x0d1324, 1).fillRect(x, 255 - h, 160, h);
      this.bg.fillStyle(0x5ddcff, 0.35);
      for (let wy = 0; wy < 4; wy++) for (let wx = 0; wx < 4; wx++) this.bg.fillRect(x + 18 + wx * 28, 202 - h + wy * 22, 7, 4);
    }
    // Elevated expressway.
    const mid = -(cameraPx * 0.28) % 320;
    this.bg.fillStyle(0x161b27, 1).fillRect(0, 280, W, 36);
    for (let i = -1; i < 6; i++) this.bg.fillStyle(0x202737, 1).fillRect(mid + i * 320, 316, 28, 150);
    // Neon/signage blocks.
    for (let i = -1; i < 7; i++) {
      const x = (-(cameraPx * 0.45) % 210) + i * 210;
      this.bg.fillStyle(i % 3 === 0 ? 0xff3d9d : i % 3 === 1 ? 0x3ddcff : 0xffb34c, 0.55).fillRect(x + 70, 330, 44, 18);
    }

    // Wet road and lane reflections.
    this.road.clear();
    this.road.fillStyle(0x11151e, 1).fillRect(0, 300, W, 260);
    this.road.fillStyle(0x1a202b, 1).fillRect(0, 327, W, 180);
    this.road.fillStyle(0x26303d, 1).fillRect(0, 383, W, 3);
    const stripeOffset = -cameraPx % 180;
    this.road.fillStyle(0xe9c46a, 0.38);
    for (let i = -1; i < 10; i++) this.road.fillRect(stripeOffset + i * 180, 435, 90, 3);
    this.road.fillStyle(0x2dc9ff, 0.10).fillRect(0, 390, W, 72);
    this.road.fillStyle(0xff43a8, 0.07).fillRect(0, 462, W, 58);

    this.worldG.clear();
    // Finish line.
    const finishX = TRACK_M * PX_PER_M - cameraPx;
    if (finishX > -60 && finishX < W + 60) {
      for (let y = 295; y < 510; y += 20) {
        this.worldG.fillStyle(((y / 20) % 2) ? 0xffffff : 0x151515, 1).fillRect(finishX, y, 16, 20);
        this.worldG.fillStyle(((y / 20) % 2) ? 0x151515 : 0xffffff, 1).fillRect(finishX + 16, y, 16, 20);
      }
      this.worldG.fillStyle(0xffffff, 0.8).fillRect(finishX - 2, 292, 3, 220);
    }

    const px = pt.positionM * PX_PER_M - cameraPx;
    const ox = ot.positionM * PX_PER_M - cameraPx;
    this.drawCar(this.playerG, px, 396, 0x3ad2ff, pt, false);
    this.drawCar(this.opponentG, ox, 322, 0xff4f9f, ot, true);
    this.drawEffects(px, 396, pt, ox, 322, ot);
    this.drawTree();
  }

  drawCar(g, x, y, color, t, opponent) {
    g.clear();
    const suspensionSquat = Phaser.Math.Clamp(t.accelerationMps2 * 1.5, -4, 8);
    const bodyY = y + suspensionSquat;
    const wheelSpinPhase = (t.wheelRPM * this.raceClock * 0.001) % (Math.PI * 2);

    g.fillStyle(color, 1).fillRect(x - 70, bodyY - 28, 140, 28);
    g.fillStyle(color, 1).fillRect(x - 36, bodyY - 48, 68, 22);
    g.fillStyle(0x111827, 1).fillRect(x - 27, bodyY - 44, 24, 14);
    g.fillStyle(0x111827, 1).fillRect(x + 4, bodyY - 44, 20, 14);
    g.fillStyle(0x090b0f, 1).fillCircle(x - 43, y + 4, 18).fillCircle(x + 43, y + 4, 18);
    g.lineStyle(3, 0xaeb9c4, 1).beginPath().arc(x - 43, y + 4, 11, wheelSpinPhase, wheelSpinPhase + Math.PI * 1.2).strokePath();
    g.lineStyle(3, 0xaeb9c4, 1).beginPath().arc(x + 43, y + 4, 11, wheelSpinPhase, wheelSpinPhase + Math.PI * 1.2).strokePath();
    g.fillStyle(0xffe6a1, 1).fillRect(x + 69, bodyY - 18, 6, 6);
    g.fillStyle(0xff436d, 1).fillRect(x - 75, bodyY - 18, 6, 7);

    if (opponent) g.fillStyle(0xffffff, 0.5).fillRect(x - 30, bodyY - 52, 56, 2);
  }

  drawEffects(px, py, pt, ox, oy, ot) {
    this.fxG.clear();
    const smoke = (x, y, amount) => {
      for (let i = 0; i < 4; i++) {
        const r = 5 + amount * 12 + i * 2;
        this.fxG.fillStyle(0xdde5ef, 0.10 + amount * 0.13).fillCircle(x - 55 - i * 12, y + 4 - i * 4, r);
      }
    };
    if (pt.wheelspin) smoke(px, py, Phaser.Math.Clamp(pt.slipRatio, 0, 1));
    if (ot.wheelspin) smoke(ox, oy, Phaser.Math.Clamp(ot.slipRatio, 0, 1));
    if (pt.nosActive) this.fxG.fillStyle(0x58d9ff, 0.9).fillTriangle(px - 76, py - 18, px - 105, py - 25, px - 105, py - 11);
  }

  drawTree() {
    const phase = this.racePhase();
    this.treeG.clear();
    this.treeG.fillStyle(0x0b0f16, 0.90).fillRoundedRect(612, 82, 56, 190, 10);
    const circles = [
      { y: 106, on: phase === 'PRE-STAGE' || phase === 'STAGE' || phase.startsWith('AMBER') || phase === 'GREEN', c: 0xf5f3d5 },
      { y: 132, on: phase === 'STAGE' || phase.startsWith('AMBER') || phase === 'GREEN', c: 0xf5f3d5 },
      { y: 171, on: ['AMBER 1','AMBER 2','AMBER 3','GREEN'].includes(phase), c: 0xffb000 },
      { y: 201, on: ['AMBER 2','AMBER 3','GREEN'].includes(phase), c: 0xffb000 },
      { y: 231, on: ['AMBER 3','GREEN'].includes(phase), c: 0xffb000 },
    ];
    for (const l of circles) this.treeG.fillStyle(l.on ? l.c : 0x2a2f37, 1).fillCircle(640, l.y, 10);
    this.treeG.fillStyle(phase === 'GREEN' && !this.falseStart ? 0x4dff77 : 0x24302a, 1).fillCircle(627, 257, 9);
    this.treeG.fillStyle(this.falseStart ? 0xff355e : 0x30242a, 1).fillCircle(653, 257, 9);
  }
}
