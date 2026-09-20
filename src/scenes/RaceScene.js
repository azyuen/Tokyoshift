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

    this.player.transmission.currentGear = 0;
    this.player.transmission.lastShiftQuality = 'NEUTRAL';
    this.ai = new DragRacingAI(this.opponent, {
      reactionSkill: 0.76, launchSkill: 0.70, shiftSkill: 0.74, aggression: 0.73
    });
    this.controls = new TouchControls(this);
    this.hud = new RaceHUD(this);
    this.debug = new DebugHUD(this);

    this.raceClock = 0;
    this.countdownClock = 0;
    this.greenClock = null;
    this.raceStarted = false;
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
    this.fxG = this.add.graphics().setDepth(8);
    this.treeLightsG = this.add.graphics().setDepth(23).setScrollFactor(0);

    // Uniform scaling only: body sprites retain their native aspect ratio.
    // At 0.13 the 2172px source car is ~282px wide on the 1280px game canvas.
    this.playerVisual = this.createCarVisual({
      bodyKey: 'carAE86',
      wheelKey: 'wheel8Spoke',
      bodyScale: 0.13,
      wheelScale: 0.032,
      rearOffsetX: -603,
      frontOffsetX: 594,
      wheelOffsetY: 138,
      exhaustOffsetX: -955,
      exhaustOffsetY: 165,
    }, 7);

    this.opponentVisual = this.createCarVisual({
      bodyKey: 'carR32',
      wheelKey: 'wheel5Spoke',
      bodyScale: 0.13,
      wheelScale: 0.032,
      rearOffsetX: -619,
      frontOffsetX: 594,
      wheelOffsetY: 138,
      exhaustOffsetX: -955,
      exhaustOffsetY: 165,
    }, 6);

    this.treeSprite = this.add.image(640, 193, 'dragTree')
      .setScale(0.12)
      .setDepth(20)
      .setScrollFactor(0)
      .setAlpha(0.78);

    this.startButton = this.add.rectangle(640, 44, 250, 54, 0x142235, 0.96)
      .setStrokeStyle(3, 0x63d7ff, 1)
      .setDepth(45)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.startButtonText = this.add.text(640, 44, 'START RACE', {
      fontFamily: 'monospace', fontSize: '22px', color: '#eef8ff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(46).setScrollFactor(0);

    this.startButton.on('pointerdown', () => this.startRace());
  }

  createCarVisual(cfg, depth) {
    return {
      cfg,
      rearWheel: this.add.image(0, 0, cfg.wheelKey).setScale(cfg.wheelScale).setDepth(depth),
      frontWheel: this.add.image(0, 0, cfg.wheelKey).setScale(cfg.wheelScale).setDepth(depth),
      body: this.add.image(0, 0, cfg.bodyKey).setScale(cfg.bodyScale).setDepth(depth + 1),
      wheelAngle: 0,
      rearX: 0,
      rearY: 0,
      frontX: 0,
      frontY: 0,
      exhaustX: 0,
      exhaustY: 0,
    };
  }

  startRace() {
    if (this.raceStarted || this.finished) return;
    this.raceStarted = true;
    this.countdownClock = 0;
    this.greenClock = null;
    this.startMoved = false;
    this.startButton.setVisible(false).disableInteractive();
    this.startButtonText.setVisible(false);
  }

  racePhase() {
    if (!this.raceStarted) return 'READY';
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
        if (nextGear <= this.player.config.gearRatios.length) this.player.requestGear(nextGear);
      }
    } else if (requestedGear === 'DOWN') {
      const tr = this.player.transmission;
      if (tr.shiftTimer <= 0 && tr.currentGear > 1) this.player.requestGear(tr.currentGear - 1);
    } else if (typeof requestedGear === 'number') {
      this.player.requestGear(requestedGear);
    }

    if (this.raceStarted && this.greenClock == null) {
      this.countdownClock += dt;
      if (this.countdownClock >= 3.3) this.greenClock = this.raceClock;
    }

    const aiState = this.ai.update(dt, this.raceClock, this.greenClock);
    const playerT = this.player.update(dt, controlState);
    const oppT = this.opponent.update(dt, aiState);

    this.handleTiming(playerT, oppT);
    this.drawScene(playerT, oppT, dt);

    let status = '';
    if (this.falseStart) status = 'RED LIGHT';
    else if (this.greenClock != null) status = 'GO!';
    else if (this.raceStarted && this.countdownClock < 1.8) status = 'STAGED';

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
    if (this.raceStarted && moved && !this.startMoved) {
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

    if (!this.finished && (this.playerFinishClock != null || (this.falseStart && this.greenClock != null))) {
      if (this.falseStart || this.opponentFinishClock != null || this.raceClock - this.playerFinishClock > 1.0) {
        this.finished = true;
      }
    }
  }

  drawScene(pt, ot, dt) {
    const W = 1280;
    const targetPlayerX = W * 0.30;
    const cameraPx = pt.positionM * PX_PER_M - targetPlayerX;

    this.bg.clear();
    this.bg.fillStyle(0x070914, 1).fillRect(0, 0, 1280, 720);

    const slow = -(cameraPx * 0.12) % 240;
    for (let i = -1; i < 8; i++) {
      const x = slow + i * 240;
      const h = 70 + ((i * 37) % 110 + 110) % 110;
      this.bg.fillStyle(i % 2 ? 0x11172b : 0x0d1324, 1).fillRect(x, 240 - h, 160, h);
      this.bg.fillStyle(0x5ddcff, 0.25);
      for (let wy = 0; wy < 4; wy++) {
        for (let wx = 0; wx < 4; wx++) {
          this.bg.fillRect(x + 18 + wx * 28, 190 - h + wy * 22, 7, 4);
        }
      }
    }

    const mid = -(cameraPx * 0.28) % 320;
    this.bg.fillStyle(0x161b27, 1).fillRect(0, 250, 1280, 32);
    for (let i = -1; i < 6; i++) {
      this.bg.fillStyle(0x202737, 1).fillRect(mid + i * 320, 282, 28, 125);
    }

    this.road.clear();
    this.road.fillStyle(0x11151e, 1).fillRect(0, 280, 1280, 250);
    this.road.fillStyle(0x1a202b, 1).fillRect(0, 318, 1280, 180);
    this.road.fillStyle(0x26303d, 1).fillRect(0, 383, 1280, 3);

    const stripeOffset = -cameraPx % 180;
    this.road.fillStyle(0xe9c46a, 0.35);
    for (let i = -1; i < 10; i++) this.road.fillRect(stripeOffset + i * 180, 438, 90, 3);

    this.worldG.clear();
    const finishX = TRACK_M * PX_PER_M - cameraPx;
    if (finishX > -60 && finishX < 1340) {
      for (let y = 275; y < 500; y += 20) {
        this.worldG.fillStyle(((y / 20) % 2) ? 0xffffff : 0x151515, 1).fillRect(finishX, y, 16, 20);
        this.worldG.fillStyle(((y / 20) % 2) ? 0x151515 : 0xffffff, 1).fillRect(finishX + 16, y, 16, 20);
      }
    }

    const px = pt.positionM * PX_PER_M - cameraPx;
    const ox = ot.positionM * PX_PER_M - cameraPx;

    // Smaller cars, higher on screen, matching the approved composition reference.
    this.updateCarVisual(this.playerVisual, px, 340, pt, dt);
    this.updateCarVisual(this.opponentVisual, ox, 270, ot, dt);

    this.drawEffects(pt, ot);
    this.drawTreeLights();
  }

  updateCarVisual(v, x, y, t, dt) {
    const c = v.cfg;
    const bodyY = y + Phaser.Math.Clamp(t.accelerationMps2 * 0.8, -2, 4);
    v.body.setPosition(x, bodyY);

    const rearX = x + c.rearOffsetX * c.bodyScale;
    const frontX = x + c.frontOffsetX * c.bodyScale;
    const wheelY = bodyY + c.wheelOffsetY * c.bodyScale;

    // Actual tyre wheel RPM drives the visible wheel rotation, including wheelspin.
    v.wheelAngle += ((t.wheelRPM || 0) / 60) * Math.PI * 2 * dt;
    v.rearWheel.setPosition(rearX, wheelY).setRotation(v.wheelAngle);
    v.frontWheel.setPosition(frontX, wheelY).setRotation(v.wheelAngle);

    v.rearX = rearX;
    v.rearY = wheelY;
    v.frontX = frontX;
    v.frontY = wheelY;
    v.exhaustX = x + c.exhaustOffsetX * c.bodyScale;
    v.exhaustY = bodyY + c.exhaustOffsetY * c.bodyScale;
  }

  drawEffects(pt, ot) {
    this.fxG.clear();

    const smoke = (v, amount) => {
      for (let i = 0; i < 4; i++) {
        this.fxG.fillStyle(0xdde5ef, 0.10 + amount * 0.12)
          .fillCircle(v.rearX - 12 - i * 9, v.rearY + 8 - i * 3, 4 + amount * 8 + i * 1.5);
      }
    };

    if (pt.wheelspin) smoke(this.playerVisual, Phaser.Math.Clamp(pt.slipRatio, 0, 1));
    if (ot.wheelspin) smoke(this.opponentVisual, Phaser.Math.Clamp(ot.slipRatio, 0, 1));

    if (pt.nosActive) {
      const x = this.playerVisual.exhaustX;
      const y = this.playerVisual.exhaustY;
      this.fxG.fillStyle(0x58d9ff, 0.92).fillTriangle(x, y, x - 28, y - 6, x - 28, y + 6);
      this.fxG.fillStyle(0xffffff, 0.82).fillTriangle(x - 4, y, x - 17, y - 3, x - 17, y + 3);
    }
  }

  drawTreeLights() {
    const phase = this.racePhase();
    const g = this.treeLightsG;
    g.clear();

    const sourceW = 1086;
    const sourceH = 1448;
    const s = 0.12;
    const left = 640 - sourceW * s / 2;
    const top = 193 - sourceH * s / 2;
    const p = (x, y) => ({ x: left + x * s, y: top + y * s });

    const rows = [
      { y: 128, on: this.raceStarted, color: 0xf4f1cd },
      { y: 351, on: this.raceStarted, color: 0xf4f1cd },
      { y: 574, on: ['AMBER 1','AMBER 2','AMBER 3','GREEN'].includes(phase), color: 0xffae18 },
      { y: 789, on: ['AMBER 2','AMBER 3','GREEN'].includes(phase), color: 0xffae18 },
      { y: 1004, on: ['AMBER 3','GREEN'].includes(phase), color: 0xffae18 },
      { y: 1220, on: phase === 'GREEN' && !this.falseStart, color: 0x52ef72 },
      { y: 1414, on: this.falseStart, color: 0xff3c4f },
    ];

    for (const row of rows) {
      for (const x of [374, 711]) {
        const q = p(x, row.y);
        g.fillStyle(0x090b0d, 0.78).fillCircle(q.x, q.y, 7.5);
        if (row.on) {
          g.fillStyle(row.color, 0.30).fillCircle(q.x, q.y, 11);
          g.fillStyle(row.color, 1).fillCircle(q.x, q.y, 6.3);
        }
      }
    }
  }
}
