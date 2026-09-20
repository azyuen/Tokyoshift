import Vehicle from '../vehicles/Vehicle.js';
import TouchControls from '../input/TouchControls.js?v=20260920-r6';
import DragRacingAI from '../ai/DragRacingAI.js?v=20260920-r6';
import RaceHUD from '../ui/RaceHUD.js?v=20260920-r6';
import DebugHUD from '../ui/DebugHUD.js';
import TokyoExpresswayBackground from '../environment/TokyoExpresswayBackground.js?v=20260920-r7';
import { cars, carOrder } from '../data/cars.js?v=20260920-r6';
import { engines } from '../data/engines.js';

const TRACK_M = 402.336;
const PX_PER_M = 76.0;
const TREE_START_M = 4.72;

const clone = value => JSON.parse(JSON.stringify(value));

export default class RaceScene extends Phaser.Scene {
  constructor() { super('RaceScene'); }

  init() {
    this.selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    if (!cars[this.selectedCarId]) this.selectedCarId = 'ae86';

    const rivals = carOrder.filter(id => id !== this.selectedCarId);
    this.opponentCarId = Phaser.Utils.Array.GetRandom(rivals);
  }

  create() {
    const playerConfig = clone(cars[this.selectedCarId]);
    const opponentConfig = clone(cars[this.opponentCarId]);

    this.player = new Vehicle(playerConfig, engines[playerConfig.engine]);
    this.opponent = new Vehicle(opponentConfig, engines[opponentConfig.engine]);

    this.player.transmission.currentGear = 0;
    this.player.transmission.lastShiftQuality = 'NEUTRAL';
    this.opponent.transmission.currentGear = 0;

    this.ai = new DragRacingAI(this.opponent, {
      reactionSkill: 0.86,
      launchSkill: 0.84,
      shiftSkill: 0.84,
      aggression: 0.82
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

    this.environment = new TokyoExpresswayBackground(this);
    this.worldG = this.add.graphics().setDepth(4);
    this.fxG = this.add.graphics().setDepth(8);
    this.treeLightsG = this.add.graphics().setDepth(23);

    this.playerVisual = this.createCarVisual(cars[this.selectedCarId].visual, 7, 1.0);
    this.opponentVisual = this.createCarVisual(cars[this.opponentCarId].visual, 6, 0.88);

    this.treeSprite = this.add.image(780, 192, 'dragTree')
      .setScale(0.105)
      .setDepth(20)
      .setAlpha(0.94);

    this.startButton = this.add.rectangle(780, 54, 250, 54, 0x142235, 0.96)
      .setStrokeStyle(3, 0x63d7ff, 1)
      .setDepth(45)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.startButtonText = this.add.text(780, 54, 'START RACE', {
      fontFamily: 'monospace', fontSize: '22px', color: '#eef8ff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(46).setScrollFactor(0);

    this.startButton.on('pointerdown', () => this.startRace());

    this.cancelButton = this.add.rectangle(135, 54, 210, 46, 0x24131a, 0.94)
      .setStrokeStyle(2, 0xff6b7a, 0.9)
      .setDepth(47)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.cancelButtonText = this.add.text(135, 54, 'CANCEL RACE', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffd8dc', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(48).setScrollFactor(0);

    this.cancelButton.on('pointerdown', () => this.scene.start('GarageScene'));
  }

  createCarVisual(cfg, depth, roleScale) {
    const bodyScale = cfg.bodyScale * roleScale;
    const wheelScale = cfg.wheelScale * roleScale;

    const rearWheel = this.add.image(0, 0, cfg.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(0, 0, cfg.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const body = this.add.image(0, 0, cfg.bodyKey)
      .setScale(bodyScale)
      .setDepth(depth + 1);

    return {
      cfg,
      bodyScale,
      wheelScale,
      rearWheel,
      frontWheel,
      body,
      wheelAngle: 0,
      noseOffsetPx: body.width * bodyScale * 0.5,
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
    if (Phaser.Input.Keyboard.JustDown(this.controls.keys.restart)) this.scene.start('GarageScene');

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
    else if (!this.raceStarted) status = cars[this.selectedCarId].shortName + '  vs  ' + cars[this.opponentCarId].shortName;
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
          playerName: cars[this.selectedCarId].name,
          opponentName: cars[this.opponentCarId].name,
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
    const W = 1560;
    const targetPlayerX = W * 0.27;
    const cameraPx = pt.positionM * PX_PER_M - targetPlayerX;

    this.environment.update(cameraPx, pt.speedKmh);

    this.worldG.clear();
    const finishX = TRACK_M * PX_PER_M - cameraPx;
    if (finishX > -60 && finishX < W + 60) {
      for (let y = 272; y < 498; y += 20) {
        this.worldG.fillStyle(((y / 20) % 2) ? 0xffffff : 0x151515, 1).fillRect(finishX, y, 16, 20);
        this.worldG.fillStyle(((y / 20) % 2) ? 0x151515 : 0xffffff, 1).fillRect(finishX + 16, y, 16, 20);
      }
    }

    const px = pt.positionM * PX_PER_M - cameraPx;
    const rawOppX = ot.positionM * PX_PER_M - cameraPx;
    const ox = rawOppX + this.playerVisual.noseOffsetPx - this.opponentVisual.noseOffsetPx;

    this.updateCarVisual(this.playerVisual, px, 373, pt, dt);
    this.updateCarVisual(this.opponentVisual, ox, 306, ot, dt);

    this.drawEffects(pt, ot);
    this.drawTree(cameraPx);
  }

  updateCarVisual(v, x, y, t, dt) {
    const c = v.cfg;
    const bodyY = y + Phaser.Math.Clamp(t.accelerationMps2 * 0.8, -2, 4);
    v.body.setPosition(x, bodyY);

    const rearX = x + c.rearOffsetX * v.bodyScale;
    const frontX = x + c.frontOffsetX * v.bodyScale;
    const wheelY = bodyY + c.wheelOffsetY * v.bodyScale;

    v.wheelAngle += ((t.wheelRPM || 0) / 60) * Math.PI * 2 * dt;
    v.rearWheel.setPosition(rearX, wheelY).setRotation(v.wheelAngle);
    v.frontWheel.setPosition(frontX, wheelY).setRotation(v.wheelAngle);

    v.rearX = rearX;
    v.rearY = wheelY;
    v.frontX = frontX;
    v.frontY = wheelY;
    v.exhaustX = x + c.exhaustOffsetX * v.bodyScale;
    v.exhaustY = bodyY + c.exhaustOffsetY * v.bodyScale;
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

  drawTree(cameraPx) {
    const treeX = TREE_START_M * PX_PER_M - cameraPx;
    const treeY = 192;
    const s = 0.105;
    const visible = treeX > -100 && treeX < 1660;

    this.treeSprite.setVisible(visible);
    this.treeLightsG.clear();
    if (!visible) return;

    this.treeSprite.setPosition(treeX, treeY);

    const phase = this.racePhase();
    const sourceW = 1086;
    const sourceH = 1448;
    const left = treeX - sourceW * s / 2;
    const top = treeY - sourceH * s / 2;
    const point = (sx, sy) => ({ x: left + sx * s, y: top + sy * s });

    const onlyGreen = phase === 'GREEN' && !this.falseStart;
    const onlyRed = this.falseStart;

    const lamps = [
      { x: 411, y: 130, r: 43, on: !onlyGreen && !onlyRed && ['PRE-STAGE','STAGE','AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 675, y: 130, r: 43, on: !onlyGreen && !onlyRed && ['PRE-STAGE','STAGE','AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 411, y: 284, r: 44, on: !onlyGreen && !onlyRed && ['STAGE','AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 675, y: 284, r: 44, on: !onlyGreen && !onlyRed && ['STAGE','AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 433, y: 466, r: 52, on: !onlyGreen && !onlyRed && ['AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 653, y: 466, r: 52, on: !onlyGreen && !onlyRed && ['AMBER 1','AMBER 2','AMBER 3'].includes(phase) },
      { x: 432, y: 632, r: 52, on: !onlyGreen && !onlyRed && ['AMBER 2','AMBER 3'].includes(phase) },
      { x: 653, y: 632, r: 52, on: !onlyGreen && !onlyRed && ['AMBER 2','AMBER 3'].includes(phase) },
      { x: 432, y: 797, r: 52, on: !onlyGreen && !onlyRed && phase === 'AMBER 3' },
      { x: 653, y: 797, r: 52, on: !onlyGreen && !onlyRed && phase === 'AMBER 3' },
      { x: 429, y: 959, r: 55, on: onlyGreen },
      { x: 657, y: 959, r: 55, on: onlyGreen },
      { x: 429, y: 1119, r: 55, on: onlyRed },
      { x: 656, y: 1119, r: 55, on: onlyRed },
    ];

    for (const lamp of lamps) {
      if (lamp.on) continue;
      const p = point(lamp.x, lamp.y);
      this.treeLightsG.fillStyle(0x05080d, 0.92).fillCircle(p.x, p.y, lamp.r * s);
    }
  }
}
