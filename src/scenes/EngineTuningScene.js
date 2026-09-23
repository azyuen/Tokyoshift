import { cars } from '../data/cars.js?v=20260923-r154';
import {
  getCarBodyTextureKey,
  createCarBodyLayers,
  getCarPaintColor,
} from '../vehicles/CarAppearance.js?v=20260923-r154';
import { engines } from '../data/engines.js?v=20260923-r134';
import { getWheelPairFit } from '../vehicles/WheelFit.js?v=20260923-r152';
import { characters } from '../data/characters.js?v=20260921-r43';
import {
  ENGINE_PART_ORDER,
  ENGINE_TUNING_PARTS,
  normaliseEngineTuning,
  getEngineTuning,
  getEngineTuningCartCost,
  getUpgradePathCost,
  getEngineTuningCount,
  applyEngineTuning,
} from '../data/tuning.js?v=20260921-r55';
import { saveSessionState } from '../state/GameState.js?v=20260922-r115';
import { playMusic } from '../audio/MusicManager.js?v=20260921-r57';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 154, w: 1048, h: 506 };
const SIDE = { x: 1090, y: 154, w: 446, h: 662 };
const STRIP = { x: 24, y: 678, w: 1048, h: 138 };

const HOTSPOTS = {
  ecu: { x: 730, y: 377, labelX: 690, labelY: 337 },
  intake: { x: 830, y: 395, labelX: 866, labelY: 354 },
  turbo: { x: 908, y: 432, labelX: 970, labelY: 410 },
  intercooler: { x: 916, y: 474, labelX: 970, labelY: 520 },
  exhaust: { x: 456, y: 500, labelX: 514, labelY: 536 },
};

export default class EngineTuningScene extends Phaser.Scene {
  constructor() { super('EngineTuningScene'); }

  create() {
    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);
    playMusic('workshop');

    this.ownedCarIds = (this.registry.get('ownedCarIds') || ['ae86']).filter(id => cars[id]);
    if (!this.ownedCarIds.length) this.ownedCarIds = ['ae86'];

    this.selectedCarId = this.registry.get('selectedCarId') || this.ownedCarIds[0];
    if (!cars[this.selectedCarId] || !this.ownedCarIds.includes(this.selectedCarId)) {
      this.selectedCarId = this.ownedCarIds[0];
    }

    this.registry.set('selectedCarId', this.selectedCarId);
    this.registry.set('ownedCarIds', this.ownedCarIds);

    this.carStates = { ...(this.registry.get('carStates') || {}) };
    this.selectedDisplay = [];
    this.thumbButtons = [];
    this.partRows = {};
    this.hotspotObjects = [];
    this.modalObjects = [];
    this.toastObjects = [];

    this.drawBackground();
    this.buildHeader();
    this.buildCategoryTabs();
    this.buildStage();
    this.buildSidePanel();
    this.buildGarageStrip();

    this.selectCar(this.selectedCarId, false);
  }

  drawBackground() {
    this.add.rectangle(780, 420, 1560, 840, 0x050a11).setDepth(-30);
  }

  buildHeader() {
    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.text(52, 35, 'WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '20px', color: '#eefaff'
    }).setOrigin(0, 0.5).setDepth(42);

    this.headerCarText = this.add.text(305, 35, '', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#8bbde0'
    }).setOrigin(0, 0.5).setDepth(42);

    const back = this.add.rectangle(930, 35, 220, 38, 0x0b1724, 1)
      .setStrokeStyle(1, 0x315470, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(42);

    this.add.text(930, 35, '<  BACK TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#b9d9ea'
    }).setOrigin(0.5).setDepth(43);

    back.on('pointerdown', () => this.scene.start('GarageScene'));

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;

    this.add.text(1190, 25, 'WINS  ' + wins, {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);

    this.add.text(1190, 47, 'LOSSES  ' + losses, {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);

    this.cashText = this.add.text(1512, 35, '', {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(42);
  }

  buildCategoryTabs() {
    const labels = [
      ['ENGINE', true],
      ['DRIVETRAIN', false],
      ['CHASSIS', false],
      ['EXHAUST / NOS', false],
    ];

    const totalW = STAGE.w;
    const tabW = totalW / labels.length;

    labels.forEach(([label, active], index) => {
      const x = STAGE.x + tabW * index + tabW / 2;
      const box = this.add.rectangle(x, 113, tabW - 8, 48, active ? 0x10283b : 0x07111d, 1)
        .setStrokeStyle(active ? 2 : 1, active ? 0x43dfff : 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(34);

      this.add.text(x, 113, label, {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: active ? '#ffffff' : '#7895a8',
      }).setOrigin(0.5).setDepth(35);

      if (!active) box.on('pointerdown', () => this.showToast(label + ' // COMING NEXT'));
    });
  }

  buildStage() {
    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x08121d,
      1
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(-12);

    const workshop = this.add.image(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      'garageWorkshopBg'
    ).setDepth(-10);

    const source = this.textures.get('garageWorkshopBg').getSourceImage();
    const coverScale = Math.max(STAGE.w / source.width, STAGE.h / source.height) * 1.12;
    workshop.setScale(coverScale);

    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    workshop.setMask(maskShape.createGeometryMask());

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x03101b,
      0.08
    ).setDepth(-9);

    const playerCharacter = characters[this.registry.get('playerCharacterId')] || characters.renMizuno;
    this.addGarageCharacter(playerCharacter, 230, 610, 330, 14);

    Object.entries(HOTSPOTS).forEach(([partId, cfg]) => {
      this.createHotspot(partId, cfg);
    });
  }

  addGarageCharacter(character, x, feetY, targetHeight, depth) {
    const sprite = this.add.image(x, feetY, character.visual.spriteKey)
      .setOrigin(0.5, 1)
      .setDepth(depth);

    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    sprite.setScale(targetHeight / source.height);

    this.add.ellipse(
      x + 10,
      feetY - 14,
      Math.max(58, sprite.displayWidth * 0.78),
      28,
      0x000000,
      0.62
    ).setDepth(depth - 0.12);

    this.add.ellipse(
      x + 8,
      feetY - 10,
      Math.max(42, sprite.displayWidth * 0.58),
      17,
      0x000000,
      0.84
    ).setDepth(depth - 0.08);
  }

  createHotspot(partId, cfg) {
    const part = ENGINE_TUNING_PARTS[partId];
    const line = this.add.line(
      0, 0,
      cfg.x, cfg.y,
      cfg.labelX, cfg.labelY,
      0x45ddff,
      0.95
    ).setOrigin(0, 0).setLineWidth(2).setDepth(24);

    const dot = this.add.circle(cfg.x, cfg.y, 11, 0x0a1723, 1)
      .setStrokeStyle(3, 0x43e2ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(26);

    const labelW = Math.max(110, part.name.length * 13);
    const labelBox = this.add.rectangle(cfg.labelX, cfg.labelY, labelW, 32, 0x06111b, 0.96)
      .setStrokeStyle(2, 0x34dfff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(25);

    const label = this.add.text(cfg.labelX, cfg.labelY, part.name, {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#dffbff'
    }).setOrigin(0.5).setDepth(27);

    const open = () => this.openPartSelector(partId);
    dot.on('pointerdown', open);
    labelBox.on('pointerdown', open);

    this.hotspotObjects.push({ partId, line, dot, labelBox, label });
  }

  buildSidePanel() {
    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);

    this.add.text(SIDE.x + 20, SIDE.y + 15, 'ENGINE', {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#dff7ff'
    }).setDepth(33);

    this.engineModelText = this.add.text(SIDE.x + 20, SIDE.y + 46, '', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#44dfff'
    }).setDepth(33);

    this.engineCard = this.add.rectangle(SIDE.x + 205, SIDE.y + 112, 250, 120, 0x0a1622, 1)
      .setStrokeStyle(2, 0x2a5872, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(32);

    this.engineCard.on('pointerdown', () => this.openPartSelector('engine'));

    this.engineGraphics = this.add.graphics().setDepth(35);

    this.engineLevelText = this.add.text(SIDE.x + 340, SIDE.y + 80, '', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#f4fbff', align: 'right'
    }).setOrigin(1, 0).setDepth(36);

    this.engineChangeText = this.add.text(SIDE.x + 340, SIDE.y + 135, 'PRESS TO CHANGE  >', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#73dfff'
    }).setOrigin(1, 0).setDepth(36);

    const nonEngine = ENGINE_PART_ORDER.filter(id => id !== 'engine');
    nonEngine.forEach((partId, index) => {
      const part = ENGINE_TUNING_PARTS[partId];
      const y = SIDE.y + 220 + index * 54;
      const box = this.add.rectangle(SIDE.x + SIDE.w / 2, y, SIDE.w - 36, 46, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(32);

      const name = this.add.text(SIDE.x + 24, y - 7, part.name, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d7edf8'
      }).setOrigin(0, 0.5).setDepth(34);

      const level = this.add.text(SIDE.x + SIDE.w - 26, y - 7, '', {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#86b7d0'
      }).setOrigin(1, 0.5).setDepth(34);

      const detail = this.add.text(SIDE.x + 24, y + 12, '', {
        fontFamily: BODY_FONT, fontSize: '9px', color: '#6f91a5', fontStyle: '600'
      }).setOrigin(0, 0.5).setDepth(34);

      box.on('pointerdown', () => this.openPartSelector(partId));
      this.partRows[partId] = { box, name, level, detail };
    });

    this.add.text(SIDE.x + 20, SIDE.y + 496, 'PERFORMANCE PREVIEW', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#8cc8ec'
    }).setDepth(34);

    this.previewTexts = {};
    const previewRows = [
      ['POWER', 'power'],
      ['TORQUE', 'torque'],
      ['BOOST', 'boost'],
      ['WEIGHT', 'weight'],
    ];

    previewRows.forEach((row, index) => {
      const y = SIDE.y + 527 + index * 24;
      this.add.text(SIDE.x + 20, y, row[0], {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#8eaabc'
      }).setOrigin(0, 0.5).setDepth(34);

      this.previewTexts[row[1]] = this.add.text(SIDE.x + SIDE.w - 22, y, '', {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#f0fbff'
      }).setOrigin(1, 0.5).setDepth(34);
    });

    this.applyButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h - 34,
      SIDE.w - 34,
      48,
      0x102226,
      1
    ).setStrokeStyle(2, 0x3e7f78, 1).setDepth(34);

    this.applyButtonText = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h - 34,
      'NO PARTS SELECTED',
      {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#758e94'
      }
    ).setOrigin(0.5).setDepth(35);
  }

  buildGarageStrip() {
    this.add.rectangle(
      STRIP.x + STRIP.w / 2,
      STRIP.y + STRIP.h / 2,
      STRIP.w,
      STRIP.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);

    this.add.text(STRIP.x + 18, STRIP.y + 12, 'MY GARAGE', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#a7d5ef'
    }).setDepth(32);

    this.add.text(STRIP.x + STRIP.w - 18, STRIP.y + 12, this.ownedCarIds.length + ' CARS', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#7fa6bd'
    }).setOrigin(1, 0).setDepth(32);

    const slotCount = 6;
    const cardW = 154;
    const gap = 14;
    const startX = STRIP.x + 16 + cardW / 2;

    for (let i = 0; i < slotCount; i++) {
      const id = this.ownedCarIds[i] || null;
      const x = startX + i * (cardW + gap);
      const y = STRIP.y + 78;

      const box = this.add.rectangle(x, y, cardW, 88, id ? 0x0b1724 : 0x07101a, 1)
        .setStrokeStyle(2, id ? 0x29465c : 0x1d3445, id ? 1 : 0.78)
        .setDepth(32);

      if (!id) {
        this.add.text(x, y, 'EMPTY', {
          fontFamily: PIXEL_FONT, fontSize: '7px', color: '#526d7e'
        }).setOrigin(0.5).setDepth(34);
        continue;
      }

      box.setInteractive({ useHandCursor: true });
      const thumbWheelBottomY = this.getWheelBottomY(cars.ae86, y - 7, 112);
      const thumbBodyY = this.getBodyYForWheelBottom(cars[id], 112, thumbWheelBottomY);
      const display = this.createCarDisplay(cars[id], x, thumbBodyY, 112, 34);

      const label = this.add.text(x, y + 29, cars[id].shortName, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#b8cad7'
      }).setOrigin(0.5).setDepth(36);

      box.on('pointerdown', () => this.selectCar(id, true));
      this.thumbButtons.push({ id, box, label, display });
    }
  }

  selectCar(id, save = true) {
    if (!cars[id] || !this.ownedCarIds.includes(id)) return;

    if (id !== this.selectedCarId && this.getPendingCost() > 0) {
      this.showToast('APPLY OR DISCARD CURRENT PARTS FIRST');
      return;
    }

    this.selectedCarId = id;
    this.registry.set('selectedCarId', id);

    const state = this.ensureCarState(id);
    this.currentTuning = getEngineTuning(state);
    this.pendingTuning = { ...this.currentTuning };

    for (const obj of this.selectedDisplay) obj.destroy();
    this.selectedDisplay = [];

    const heroWheelBottomY = this.getWheelBottomY(cars.ae86, 440, 650);
    const heroBodyY = this.getBodyYForWheelBottom(cars[id], 650, heroWheelBottomY);
    this.selectedDisplay = this.createCarDisplay(cars[id], 650, heroBodyY, 650, 10);

    this.headerCarText.setText(cars[id].name.toUpperCase());

    for (const item of this.thumbButtons) {
      const active = item.id === id;
      item.box.setFillStyle(active ? 0x10263a : 0x0b1724, 1);
      item.box.setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
    }

    this.refreshUI();

    if (save) saveSessionState(this.registry);
  }

  ensureCarState(id) {
    const existing = this.carStates[id] || {};
    const state = {
      stock: existing.stock !== false,
      nosInstalled: Boolean(existing.nosInstalled),
      tuneLevel: Number(existing.tuneLevel || 0),
      acquiredVia: existing.acquiredVia || (id === 'ae86' ? 'starter' : 'garage'),
      ...existing,
      tuning: normaliseEngineTuning(existing.tuning || existing.engineTuning || {}),
    };

    this.carStates[id] = state;
    return state;
  }

  getPreviewBuild() {
    const car = cars[this.selectedCarId];
    const state = this.ensureCarState(this.selectedCarId);
    return applyEngineTuning(car, engines[car.engine], {
      ...state,
      tuning: this.pendingTuning,
    });
  }

  getPendingCost() {
    return getEngineTuningCartCost(this.currentTuning || {}, this.pendingTuning || {});
  }

  refreshUI() {
    const car = cars[this.selectedCarId];
    const preview = this.getPreviewBuild();
    const current = this.currentTuning;
    const pending = this.pendingTuning;
    const cash = Number(this.registry.get('cash') || 0);

    this.cashText.setText('¥ ' + cash.toLocaleString('en-US'));
    this.engineModelText.setText(car.engineModel + ' // ' + (preview.engine.name || 'ENGINE').toUpperCase());

    const engineSpec = ENGINE_TUNING_PARTS.engine.levels[pending.engine];
    this.engineLevelText.setText(
      'LV.' + pending.engine + '\n' + engineSpec.name.toUpperCase()
    );
    this.drawEngineSchematic(pending.engine);

    Object.keys(this.partRows).forEach(partId => {
      const row = this.partRows[partId];
      const currentLevel = current[partId];
      const pendingLevel = pending[partId];
      const spec = ENGINE_TUNING_PARTS[partId].levels[pendingLevel];

      row.level.setText(
        pendingLevel === currentLevel
          ? 'LV.' + currentLevel
          : 'LV.' + currentLevel + ' > LV.' + pendingLevel
      );
      row.level.setColor(pendingLevel > currentLevel ? '#55e4ff' : '#86b7d0');
      row.detail.setText(spec.name.toUpperCase());
      row.box.setStrokeStyle(
        pendingLevel > currentLevel ? 2 : 1,
        pendingLevel > currentLevel ? 0x43dfff : 0x315470,
        1
      );
    });

    this.previewTexts.power.setText(preview.car.powerKW + ' kW');
    this.previewTexts.torque.setText(preview.car.torqueNm + ' Nm');
    this.previewTexts.boost.setText((preview.car.maximumBoost || 0).toFixed(2) + ' bar');
    this.previewTexts.weight.setText(Math.round(preview.car.vehicleMassKg) + ' kg');

    this.hotspotObjects.forEach(item => {
      const changed = pending[item.partId] > current[item.partId];
      item.dot.setStrokeStyle(3, changed ? 0xffd86a : 0x43e2ff, 1);
      item.labelBox.setStrokeStyle(2, changed ? 0xffd86a : 0x34dfff, 1);
      item.label.setColor(changed ? '#fff0ad' : '#dffbff');
    });

    const cost = this.getPendingCost();
    this.applyButton.removeAllListeners('pointerdown');

    if (cost <= 0) {
      this.applyButton.disableInteractive()
        .setFillStyle(0x102226, 1)
        .setStrokeStyle(2, 0x3e7f78, 0.7);
      this.applyButtonText.setText('NO PARTS SELECTED').setColor('#758e94');
    } else {
      const affordable = cash >= cost;
      this.applyButton.setInteractive({ useHandCursor: true })
        .setFillStyle(affordable ? 0x0c2827 : 0x2a171b, 1)
        .setStrokeStyle(2, affordable ? 0x62e8c7 : 0xff6f7d, 1);

      this.applyButtonText
        .setText(
          affordable
            ? 'APPLY ENGINE PARTS // ¥ ' + cost.toLocaleString('en-US')
            : 'NEED ¥ ' + cost.toLocaleString('en-US')
        )
        .setColor(affordable ? '#f1fffb' : '#ffc0c6');

      this.applyButton.on('pointerdown', () => this.applyPendingUpgrades());
    }
  }

  drawEngineSchematic(level) {
    const g = this.engineGraphics;
    g.clear();

    if (this.engineSpriteImage) {
      this.engineSpriteImage.destroy();
      this.engineSpriteImage = null;
    }

    const car = cars[this.selectedCarId];
    const engineKey = car?.visual?.engineKey;
    const cx = SIDE.x + 196;
    const cy = SIDE.y + 112;

    // Sprite hook for the bespoke engine art pipeline. Once a car defines
    // visual.engineKey and BootScene has loaded that texture, it replaces the
    // temporary schematic automatically.
    if (engineKey && this.textures.exists(engineKey)) {
      this.engineSpriteImage = this.add.image(cx, cy, engineKey)
        .setDepth(35)
        .setOrigin(0.5);

      const source = this.textures.get(engineKey).getSourceImage();
      const maxW = 205;
      const maxH = 100;
      const fit = Math.min(maxW / source.width, maxH / source.height);
      this.engineSpriteImage.setScale(fit * (1 + level * 0.055));
      return;
    }

    const scale = 1 + level * 0.055;

    g.fillStyle(0x02070c, 0.55).fillEllipse(cx, cy + 34, 180 * scale, 24 * scale);

    g.fillStyle(0x7f8e98, 1)
      .fillRoundedRect(cx - 82 * scale, cy - 26 * scale, 164 * scale, 62 * scale, 7);

    g.fillStyle(level >= 2 ? 0xb93c47 : 0x9c2632, 1)
      .fillRoundedRect(cx - 64 * scale, cy - 39 * scale, 128 * scale, 35 * scale, 6);

    g.lineStyle(3, 0xd6e4ea, 0.78)
      .strokeRoundedRect(cx - 82 * scale, cy - 26 * scale, 164 * scale, 62 * scale, 7);

    for (let i = 0; i < 4; i++) {
      g.fillStyle(0x202933, 1)
        .fillCircle(cx - 54 * scale + i * 36 * scale, cy + 16 * scale, 12 * scale);
      g.lineStyle(2, 0xa7bac5, 0.9)
        .strokeCircle(cx - 54 * scale + i * 36 * scale, cy + 16 * scale, 12 * scale);
    }

    g.fillStyle(0x171d25, 1)
      .fillCircle(cx - 93 * scale, cy + 9 * scale, 18 * scale)
      .fillCircle(cx + 94 * scale, cy + 6 * scale, 16 * scale);

    if (level >= 1) {
      g.lineStyle(5, level >= 3 ? 0xffc35a : 0x49b9de, 1)
        .lineBetween(cx - 77 * scale, cy - 38 * scale, cx - 112 * scale, cy - 56 * scale);
    }

    if (level >= 3) {
      g.fillStyle(0xd9a23f, 1)
        .fillRoundedRect(cx - 74 * scale, cy - 48 * scale, 148 * scale, 7 * scale, 2);
    }
  }

  openPartSelector(partId) {
    this.closePartSelector();

    const part = ENGINE_TUNING_PARTS[partId];
    if (!part) return;

    const depth = 100;
    const add = obj => {
      this.modalObjects.push(obj);
      return obj;
    };

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.70)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 418, 850, 530, 0x08131f, 0.995)
      .setStrokeStyle(2, 0x48dfff, 0.95)
      .setDepth(depth + 1));

    add(this.add.text(405, 188, part.name + ' // SELECT KIT', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    add(this.add.text(405, 222, 'INSTALLED LV.' + this.currentTuning[partId] + '  //  SELECTED LV.' + this.pendingTuning[partId], {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#76b9da',
    }).setDepth(depth + 2));

    part.levels.forEach((spec, index) => {
      const y = 280 + index * 84;
      const current = this.currentTuning[partId];
      const selected = this.pendingTuning[partId] === spec.level;
      const belowInstalled = spec.level < current;
      const pathCost = getUpgradePathCost(partId, current, spec.level);
      const selectable = spec.level >= current;

      const box = add(this.add.rectangle(
        780,
        y,
        748,
        68,
        selected ? 0x123047 : 0x0b1724,
        1
      ).setStrokeStyle(
        selected ? 2 : 1,
        selected ? 0x43dfff : 0x315470,
        1
      ).setDepth(depth + 2));

      add(this.add.text(430, y - 14, 'LV.' + spec.level + '  ' + spec.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: belowInstalled ? '#607684' : '#e8f7ff',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      add(this.add.text(430, y + 15, spec.benefit.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: belowInstalled ? '#536673' : '#8fb3c7',
        fontStyle: '600',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      let status = '';
      if (spec.level === current) status = selected ? 'INSTALLED' : 'RESET TO INSTALLED';
      else if (belowInstalled) status = 'INCLUDED';
      else status = '¥ ' + pathCost.toLocaleString('en-US');

      add(this.add.text(1124, y, status, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: selected ? '#54e7ff' : belowInstalled ? '#607684' : '#ffe08a',
      }).setOrigin(1, 0.5).setDepth(depth + 3));

      if (selectable) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
          this.pendingTuning[partId] = spec.level;
          this.closePartSelector();
          this.refreshUI();
        });
      }
    });

    const close = add(this.add.rectangle(1132, 188, 94, 38, 0x151d28, 1)
      .setStrokeStyle(1, 0x6e8797, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 3));

    add(this.add.text(1132, 188, 'CLOSE', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#c0d1db'
    }).setOrigin(0.5).setDepth(depth + 4));

    close.on('pointerdown', () => this.closePartSelector());
    blocker.on('pointerdown', () => this.closePartSelector());
  }

  closePartSelector() {
    this.modalObjects.forEach(obj => obj?.destroy?.());
    this.modalObjects = [];
  }

  applyPendingUpgrades() {
    const cost = this.getPendingCost();
    if (cost <= 0) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) {
      this.showToast('NOT ENOUGH CASH');
      return;
    }

    const state = this.ensureCarState(this.selectedCarId);
    state.tuning = normaliseEngineTuning(this.pendingTuning);
    state.stock = getEngineTuningCount(state.tuning) === 0 && !state.nosInstalled;

    this.carStates[this.selectedCarId] = state;
    this.registry.set('carStates', this.carStates);
    this.registry.set('cash', cash - cost);
    this.registry.set('selectedCarId', this.selectedCarId);

    saveSessionState(this.registry);

    this.currentTuning = getEngineTuning(state);
    this.pendingTuning = { ...this.currentTuning };
    this.refreshUI();
    this.showToast('PARTS INSTALLED // ¥ ' + cost.toLocaleString('en-US'));
  }

  showToast(message) {
    this.toastObjects.forEach(obj => obj?.destroy?.());
    this.toastObjects = [];

    const panel = this.add.rectangle(780, 742, 520, 48, 0x07131e, 0.98)
      .setStrokeStyle(2, 0x43dfff, 0.92)
      .setDepth(130);

    const text = this.add.text(780, 742, message, {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(131);

    this.toastObjects.push(panel, text);
    this.time.delayedCall(1350, () => {
      this.toastObjects.forEach(obj => obj?.destroy?.());
      this.toastObjects = [];
    });
  }

  getWheelBottomY(car, bodyY, targetWidth) {
    const bodySource = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / bodySource.width;
    const fit = getWheelPairFit(car.visual, bodyScale, false, wheelSource);

    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const rearBottom = bodyY + renderOffsetY + fit.rear.offsetY + wheelSource.height * fit.rear.wheelScale * 0.5;
    const frontBottom = bodyY + renderOffsetY + fit.front.offsetY + wheelSource.height * fit.front.wheelScale * 0.5;
    return Math.max(rearBottom, frontBottom);
  }

  getBodyYForWheelBottom(car, targetWidth, wheelBottomY) {
    const bodySource = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / bodySource.width;
    const fit = getWheelPairFit(car.visual, bodyScale, false, wheelSource);

    const rearBottomOffset = fit.rear.offsetY + wheelSource.height * fit.rear.wheelScale * 0.5;
    const frontBottomOffset = fit.front.offsetY + wheelSource.height * fit.front.wheelScale * 0.5;
    return wheelBottomY - Math.max(rearBottomOffset, frontBottomOffset);
  }

  createCarDisplay(car, x, y, targetWidth, depth) {
    const source = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / source.width;
    const fit = getWheelPairFit(car.visual, bodyScale, false, wheelSource);
    const renderOffsetY = Number(car.visual.renderOffsetY || 0) * bodyScale;
    const displayY = y + renderOffsetY;

    const rearX = x + fit.rear.offsetX;
    const frontX = x + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    const rearWheel = this.add.image(rearX, rearY, car.visual.wheelKey)
      .setScale(fit.rear.wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(frontX, frontY, car.visual.wheelKey)
      .setScale(fit.front.wheelScale)
      .setDepth(depth);

    const rearWheelBacking = this.add.circle(
      rearX,
      rearY,
      fit.rear.backingRadius ?? Math.max(5, rearWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.35);

    const frontWheelBacking = this.add.circle(
      frontX,
      frontY,
      fit.front.backingRadius ?? Math.max(5, frontWheel.displayWidth * 0.50),
      0x020304,
      1
    ).setDepth(depth - 0.35);

    const tyreBottom = Math.max(
      rearY + rearWheel.displayHeight * 0.5,
      frontY + frontWheel.displayHeight * 0.5
    );
    const roadShadow = this.add.ellipse(
      x,
      tyreBottom + Math.max(8, rearWheel.displayHeight * 0.08),
      Math.max(128, targetWidth * 0.96),
      Math.max(20, rearWheel.displayHeight * 0.34),
      0x000000,
      0.82
    ).setDepth(depth - 0.12);

    const paintColor = getCarPaintColor(this.carStates?.[car.id] || {});
    const bodyLayers = createCarBodyLayers(this, car, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: depth + 1,
      paintColor,
    });

    return [
      rearWheelBacking,
      frontWheelBacking,
      roadShadow,
      rearWheel,
      frontWheel,
      ...bodyLayers.objects,
    ];
  }
}
