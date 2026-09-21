import { cars, carOrder } from '../data/cars.js?v=20260921-r79';
import { engines } from '../data/engines.js?v=20260921-r43';
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
} from '../data/tuning.js?v=20260921-r57';
import {
  DRIVETRAIN_PART_ORDER,
  EXHAUST_NOS_PART_ORDER,
  DRIVETRAIN_TUNING_PARTS,
  EXHAUST_NOS_TUNING_PARTS,
  normaliseDrivetrainTuning,
  normaliseExhaustNosTuning,
  getDrivetrainTuning,
  getExhaustNosTuning,
  getDrivetrainUpgradePathCost,
  getExhaustNosUpgradePathCost,
  getDrivetrainCartCost,
  getExhaustNosCartCost,
  applySecondaryTuning,
} from '../data/secondaryTuning.js?v=20260921-r66';
import { saveManualState, saveSessionState } from '../state/GameState.js?v=20260921-r76';
import { addSettingsButton } from '../ui/SettingsPanel.js?v=20260921-r64';
import { getMeetLocation } from '../data/meetAssets.js?v=20260921-r76';
import { showTravelMap } from '../ui/TravelMap.js?v=20260921-r76';
import { playMusic } from '../audio/MusicManager.js?v=20260921-r57';
import {
  getGarageCapacity,
  getWorkshopByLocationId,
} from '../data/workshopProgression.js?v=20260921-r76';
import {
  PAINT_PRESETS,
  getCarPaintColor,
  paintColorToHex,
  paintColorToRgb,
  rgbToPaintColor,
  normalisePaintColor,
  hasLayeredPaintAssets,
  getCarBodyTextureKey,
  createCarBodyLayers,
  setCarBodyPaint,
} from '../vehicles/CarAppearance.js?v=20260921-r79';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const SAFE = 24;
const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const STRIP = { x: 24, y: 644, w: 1138, h: 172 };

export default class GarageScene extends Phaser.Scene {
  constructor() { super('GarageScene'); }

  create() {
    document.body.dataset.scene = 'garage';
    this.scale.resize(1560, 840);
    playMusic('workshop');

    this.ownedCarIds = (this.registry.get('ownedCarIds') || []).filter(id => cars[id]);

    this.selectedCarId = this.registry.get('selectedCarId') || this.ownedCarIds[0] || null;
    if (!cars[this.selectedCarId] || !this.ownedCarIds.includes(this.selectedCarId)) {
      this.selectedCarId = this.ownedCarIds[0] || null;
    }
    this.registry.set('ownedCarIds', this.ownedCarIds);
    this.registry.set('selectedCarId', this.selectedCarId);
    this.registry.set('meetStranded', false);

    this.selectedDisplay = [];
    this.thumbButtons = [];
    this.upgradeButtons = [];
    this.selectedUpgrade = 'ENGINE';
    this.engineMode = false;
    this.engineModeObjects = [];
    this.engineModalObjects = [];
    this.engineHotspotObjects = [];
    this.engineHelperObjects = [];
    this.secondaryMode = null;
    this.secondaryModeObjects = [];
    this.secondaryModalObjects = [];
    this.secondaryHelperObjects = [];
    this.secondaryHotspotObjects = [];

    this.chassisMode = false;
    this.chassisModeObjects = [];
    this.chassisPresetButtons = [];
    this.chassisRgbLabels = {};
    this.currentPaintColor = 0xffffff;
    this.pendingPaintColor = 0xffffff;

    this.garagePageSize = 4;
    this.garagePageObjects = [];
    const selectedGarageIndex = Math.max(0, this.ownedCarIds.indexOf(this.selectedCarId));
    this.garagePage = Math.floor(selectedGarageIndex / this.garagePageSize);

    this.drawScene();
    this.buildHeader();
    this.buildSpecsAndUpgrades();
    this.buildGarageStrip();
    this.buildSaveButton();
    this.buildMeetButton();

    if (this.selectedCarId) {
      this.selectCar(this.selectedCarId);
      this.selectUpgrade('ENGINE');
    } else {
      this.showEmptyGarageState();
    }
  }

  drawScene() {
    this.add.rectangle(780, 420, 1560, 840, 0x050a11).setDepth(-20);

    // Framed workshop viewport: the artwork is now deliberately contained in
    // the upper-left game panel instead of pretending to be the whole screen.
    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x08121d,
      1
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(-12);

    const activeWorkshop = getWorkshopByLocationId(
      this.registry.get('workshopLocationId') || 'shinonomeWorkshop'
    );
    const workshopTexture = this.textures.exists(activeWorkshop.textureKey)
      ? activeWorkshop.textureKey
      : 'garageWorkshopBg';

    const workshop = this.add.image(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      workshopTexture
    ).setDepth(-10);

    const source = this.textures.get(workshopTexture).getSourceImage();
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
      0.06
    ).setDepth(-9);

    if (activeWorkshop.tier > 0) {
      this.add.rectangle(STAGE.x + 142, STAGE.y + 30, 238, 34, 0x06101b, 0.82)
        .setStrokeStyle(1, 0x43dfff, 0.62)
        .setDepth(18);
      this.add.text(STAGE.x + 28, STAGE.y + 30, activeWorkshop.shortLabel, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#cbefff',
      }).setOrigin(0, 0.5).setDepth(19);
    }

    // Only show the selected protagonist in the workshop. Keeping this as a
    // separate sprite lets us swap protagonists later without changing the art.
    const playerCharacter = characters[this.registry.get('playerCharacterId')] || characters.renMizuno;
    this.addGarageCharacter(playerCharacter, 282, 558, 350, 14);
  }

  addGarageCharacter(character, x, feetY, targetHeight, depth) {
    const sprite = this.add.image(x, feetY, character.visual.spriteKey)
      .setOrigin(0.5, 1)
      .setDepth(depth);

    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    sprite.setScale(targetHeight / source.height);

    this.add.ellipse(
      x + 12,
      feetY - 16,
      Math.max(60, sprite.displayWidth * 0.80),
      30,
      0x000000,
      0.58
    ).setDepth(depth - 0.12);

    this.add.ellipse(
      x + 9,
      feetY - 11,
      Math.max(44, sprite.displayWidth * 0.60),
      18,
      0x000000,
      0.84
    ).setDepth(depth - 0.08);

    return sprite;
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

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const cash = this.registry.get('cash') ?? 50000;

    this.add.text(1105, 25, 'WINS  ' + wins, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);
    this.add.text(1105, 47, 'LOSSES  ' + losses, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);

    addSettingsButton(this, 955, 35);

    this.cashText = this.add.text(1512, 35, '¥ ' + Number(cash).toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(42);
  }

  buildCarLabel() {
    this.add.rectangle(206, 566, 330, 72, 0x07111d, 0.94)
      .setStrokeStyle(1, 0x26465e, 1)
      .setDepth(31);

    this.carNameText = this.add.text(52, 542, '', {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#ffffff'
    }).setDepth(32);

    this.carSubText = this.add.text(52, 575, '', {
      fontFamily: BODY_FONT, fontSize: '18px', color: '#79bce3', fontStyle: '600'
    }).setDepth(32);
  }

  buildSpecsAndUpgrades() {
    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      0.98
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(35);

    this.add.text(SIDE.x + 20, SIDE.y + 18, 'CAR SPECS', {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cc8ec'
    }).setDepth(37);

    const rows = [
      ['ENGINE', 'engine'],
      ['POWER', 'power'],
      ['TORQUE', 'torque'],
      ['WEIGHT', 'weight'],
    ];

    this.specValueTexts = {};
    rows.forEach((row, i) => {
      const y = SIDE.y + 76 + i * 32;
      this.add.line(
        SIDE.x + SIDE.w / 2,
        y + 16,
        SIDE.x + 20,
        0,
        SIDE.x + SIDE.w - 20,
        0,
        0x27465d,
        0.75
      ).setDepth(36);

      this.add.text(SIDE.x + 20, y, row[0], {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#9cc6df'
      }).setOrigin(0, 0.5).setDepth(37);

      this.specValueTexts[row[1]] = this.add.text(SIDE.x + SIDE.w - 20, y, '', {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#ffffff'
      }).setOrigin(1, 0.5).setDepth(37);
    });

    this.tuningStatusText = this.add.text(SIDE.x + 20, SIDE.y + 230, 'TUNING', {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cc8ec'
    }).setDepth(37);

    const categories = ['ENGINE', 'DRIVETRAIN', 'CHASSIS', 'EXHAUST / NOS'];

    categories.forEach((name, i) => {
      const y = SIDE.y + 285 + i * 48;
      const box = this.add.rectangle(SIDE.x + SIDE.w / 2, y, SIDE.w - 36, 40, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(37);

      const label = this.add.text(SIDE.x + 30, y, name, {
        fontFamily: PIXEL_FONT,
        fontSize: '11px',
        color: '#a9c7da'
      }).setOrigin(0, 0.5).setDepth(38);

      const arrow = this.add.text(SIDE.x + SIDE.w - 30, y, '>', {
        fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cb6cf'
      }).setOrigin(0.5).setDepth(38);

      box.on('pointerdown', () => {
        if (!this.selectedCarId) return;
        if (name === 'ENGINE') {
          this.enterEngineMode();
          return;
        }
        if (name === 'DRIVETRAIN') {
          this.enterSecondaryTuningMode('drivetrain');
          return;
        }
        if (name === 'CHASSIS') {
          this.enterChassisMode();
          return;
        }
        if (name === 'EXHAUST / NOS') {
          this.enterSecondaryTuningMode('exhaustNos');
          return;
        }
        this.selectUpgrade(name);
      });

      this.upgradeButtons.push({ name, box, label, arrow });
    });

  }

  buildGarageStrip() {
    this.garageStripPanel = this.add.rectangle(
      STRIP.x + STRIP.w / 2,
      STRIP.y + STRIP.h / 2,
      STRIP.w,
      STRIP.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);

    this.add.text(STRIP.x + 18, STRIP.y + 14, 'MY GARAGE', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
    }).setDepth(32);

    this.garageCountText = this.add.text(STRIP.x + STRIP.w - 18, STRIP.y + 14, '', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#7fa6bd'
    }).setOrigin(1, 0).setDepth(32);

    const navY = STRIP.y + 100;
    this.garagePrevButton = this.add.rectangle(
      STRIP.x + 28,
      navY,
      38,
      112,
      0x0a1521,
      0.96
    ).setStrokeStyle(1, 0x315470, 1).setDepth(35);

    this.garagePrevLabel = this.add.text(STRIP.x + 28, navY, '<', {
      fontFamily: PIXEL_FONT,
      fontSize: '16px',
      color: '#9edcf7',
    }).setOrigin(0.5).setDepth(36);

    this.garageNextButton = this.add.rectangle(
      STRIP.x + STRIP.w - 28,
      navY,
      38,
      112,
      0x0a1521,
      0.96
    ).setStrokeStyle(1, 0x315470, 1).setDepth(35);

    this.garageNextLabel = this.add.text(STRIP.x + STRIP.w - 28, navY, '>', {
      fontFamily: PIXEL_FONT,
      fontSize: '16px',
      color: '#9edcf7',
    }).setOrigin(0.5).setDepth(36);

    this.garagePageText = this.add.text(
      STRIP.x + STRIP.w / 2,
      STRIP.y + 16,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#607f92',
      }
    ).setOrigin(0.5, 0).setDepth(32);

    this.garagePrevButton.on('pointerdown', () => this.changeGaragePage(-1));
    this.garageNextButton.on('pointerdown', () => this.changeGaragePage(1));

    // Swipe anywhere across the garage strip to reveal the next four slots.
    this.input.on('pointerup', pointer => {
      if (this.engineMode || this.secondaryMode || this.chassisMode) return;

      const downInside = pointer.downY >= STRIP.y && pointer.downY <= STRIP.y + STRIP.h;
      const upInside = pointer.y >= STRIP.y && pointer.y <= STRIP.y + STRIP.h;
      if (!downInside || !upInside) return;

      const dx = pointer.x - pointer.downX;
      const dy = pointer.y - pointer.downY;
      if (Math.abs(dx) < 72 || Math.abs(dy) > 64) return;

      this.changeGaragePage(dx < 0 ? 1 : -1);
    });

    this.renderGaragePage();
  }

  renderGaragePage() {
    this.garagePageObjects.forEach(obj => obj?.destroy?.());
    this.garagePageObjects = [];
    this.thumbButtons = [];

    const add = obj => {
      this.garagePageObjects.push(obj);
      return obj;
    };

    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const pageSize = this.garagePageSize || 4;
    const totalPages = Math.max(1, Math.ceil(capacity / pageSize));
    this.garagePage = Phaser.Math.Clamp(Number(this.garagePage || 0), 0, totalPages - 1);

    const startIndex = this.garagePage * pageSize;
    const gap = 12;
    const usableLeft = STRIP.x + 58;
    const usableRight = STRIP.x + STRIP.w - 58;
    const usableWidth = usableRight - usableLeft;
    const cardW = (usableWidth - gap * (pageSize - 1)) / pageSize;
    const startX = usableLeft + cardW / 2;
    const y = STRIP.y + 100;

    for (let localIndex = 0; localIndex < pageSize; localIndex++) {
      const slotIndex = startIndex + localIndex;
      if (slotIndex >= capacity) break;

      const id = this.ownedCarIds[slotIndex] || null;
      const x = startX + localIndex * (cardW + gap);
      const active = id === this.selectedCarId;

      const box = add(this.add.rectangle(
        x,
        y,
        cardW,
        112,
        id ? (active ? 0x10263a : 0x0b1724) : 0x07101a,
        1
      ).setStrokeStyle(
        active ? 3 : 2,
        active ? 0x41dcff : id ? 0x29465c : 0x1d3445,
        1
      ).setDepth(32));

      if (!id) {
        add(this.add.text(x, y - 8, 'EMPTY SLOT', {
          fontFamily: PIXEL_FONT, fontSize: '8px', color: '#526d7e'
        }).setOrigin(0.5).setDepth(34));
        add(this.add.text(x, y + 24, 'WIN ON PINK SLIP', {
          fontFamily: PIXEL_FONT, fontSize: '6px', color: '#3f5665'
        }).setOrigin(0.5).setDepth(34));
        continue;
      }

      box.setInteractive({ useHandCursor: true });
      const thumbWidth = Math.min(190, cardW - 22);
      const thumbWheelBottomY = this.getWheelBottomY(cars.ae86, y - 9, thumbWidth);
      const thumbBodyY = this.getBodyYForWheelBottom(cars[id], thumbWidth, thumbWheelBottomY);
      const display = this.createCarDisplay(cars[id], x, thumbBodyY, thumbWidth, 34);
      display.forEach(obj => add(obj));

      const label = add(this.add.text(x, y + 38, cars[id].shortName, {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: active ? '#ffffff' : '#b8cad7'
      }).setOrigin(0.5).setDepth(36));

      box.on('pointerup', pointer => {
        const movedX = Math.abs(pointer.x - pointer.downX);
        const movedY = Math.abs(pointer.y - pointer.downY);
        if (movedX <= 20 && movedY <= 20) this.selectCar(id);
      });

      this.thumbButtons.push({ id, box, label, display });
    }

    this.garageCountText.setText(this.ownedCarIds.length + ' / ' + capacity + ' CARS');
    this.garagePageText.setText(
      totalPages > 1
        ? 'SLOTS ' + (startIndex + 1) + '-' + Math.min(startIndex + pageSize, capacity) + '  //  PAGE ' + (this.garagePage + 1) + '/' + totalPages
        : '4-CAR HOME GARAGE'
    );

    this.updateGarageNavState();
  }

  changeGaragePage(delta) {
    if (this.engineMode || this.secondaryMode || this.chassisMode) return;

    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const totalPages = Math.max(1, Math.ceil(capacity / (this.garagePageSize || 4)));
    const nextPage = Phaser.Math.Clamp(
      Number(this.garagePage || 0) + Number(delta || 0),
      0,
      totalPages - 1
    );

    if (nextPage === this.garagePage) return;
    this.garagePage = nextPage;
    this.renderGaragePage();
  }

  updateGarageNavState() {
    const capacity = getGarageCapacity(this.registry.get('garageTier') || 0);
    const totalPages = Math.max(1, Math.ceil(capacity / (this.garagePageSize || 4)));
    const locked = Boolean(this.engineMode || this.secondaryMode || this.chassisMode);
    const canPrev = !locked && this.garagePage > 0;
    const canNext = !locked && this.garagePage < totalPages - 1;

    const apply = (button, label, enabled) => {
      if (!button || !label) return;
      if (enabled) {
        button.setInteractive({ useHandCursor: true })
          .setFillStyle(0x0a1521, 0.96)
          .setStrokeStyle(1, 0x315470, 1);
        label.setColor('#9edcf7');
      } else {
        button.disableInteractive()
          .setFillStyle(0x080e15, 0.84)
          .setStrokeStyle(1, 0x263641, 0.70);
        label.setColor('#465965');
      }
    };

    apply(this.garagePrevButton, this.garagePrevLabel, canPrev);
    apply(this.garageNextButton, this.garageNextLabel, canNext);
  }

  buildSaveButton() {
    const button = this.saveButton = this.add.rectangle(SIDE.x + SIDE.w / 2, 716, SIDE.w - 32, 42, 0x102138, 1)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    const label = this.saveButtonLabel = this.add.text(SIDE.x + SIDE.w / 2, 716, 'SAVE GAME', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(41);

    button.on('pointerdown', () => {
      this.registry.set('selectedCarId', this.selectedCarId);
      saveManualState(this.registry);
      label.setText('SAVED // RESTORE POINT');
      button.setFillStyle(0x0f302b, 1).setStrokeStyle(2, 0x62e8c7, 1);
      this.time.delayedCall(1200, () => {
        if (!label.active) return;
        label.setText('SAVE GAME');
        button.setFillStyle(0x102138, 1).setStrokeStyle(2, 0x55b8ff, 1);
      });
    });
  }

  buildMeetButton() {
    const button = this.meetButton = this.add.rectangle(SIDE.x + SIDE.w / 2, 770, SIDE.w - 32, 42, 0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    this.meetButtonLabel = this.add.text(SIDE.x + SIDE.w / 2, 770, 'GO TO MEET  >', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#f1fffb'
    }).setOrigin(0.5).setDepth(41);

    button.on('pointerdown', () => {
      this.registry.set('selectedCarId', this.selectedCarId);
      this.saveProfile();

      showTravelMap(this, {
        currentLocationId: this.registry.get('meetLocation') || 'odaiba7eleven',
        title: 'TOKYO REGION MAP',
        actionVerb: 'GO TO MEET',
        fromWorkshop: true,
        allowCurrentAction: true,
        onWorkshopUpgrade: (location, cost, alreadyUnlocked) => {
          const cash = Number(this.registry.get('cash') || 0);
          if (!alreadyUnlocked && cash < cost) return;

          const nextCash = alreadyUnlocked ? cash : cash - cost;
          const targetTier = Number(location.garageTier || 0);

          if (!alreadyUnlocked) {
            this.registry.set('garageTier', Math.max(
              Number(this.registry.get('garageTier') || 0),
              targetTier
            ));
            this.registry.set('cash', nextCash);
          }

          this.registry.set('workshopLocationId', location.id);
          saveSessionState(this.registry);
          this.cashText?.setText('¥ ' + Number(nextCash).toLocaleString('en-US'));

          this.cameras.main.fadeOut(180, 2, 5, 11);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
        },
        onTravel: (locationId, cost) => {
          const cash = Number(this.registry.get('cash') || 0);
          if (cash < cost) return;

          const destination = getMeetLocation(locationId);
          this.registry.set('cash', cash - cost);
          this.registry.set('meetLocation', locationId);
          this.registry.set('district', destination.district);
          this.registry.set('selectedCarId', this.selectedCarId);
          this.registry.set('meetStranded', false);
          saveSessionState(this.registry);

          this.cashText?.setText('¥ ' + Number(cash - cost).toLocaleString('en-US'));
          this.scene.start('MeetScene');
        },
      });
    });
  }

  getWheelBottomY(car, bodyY, targetWidth) {
    const bodySource = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / bodySource.width;
    const wheelScale = bodyScale * (car.visual.wheelScale / car.visual.bodyScale) * 1.16;
    const wheelRadius = wheelSource.height * wheelScale * 0.5;
    const wheelCenterY = bodyY + car.visual.wheelOffsetY * bodyScale;
    return wheelCenterY + wheelRadius;
  }

  getBodyYForWheelBottom(car, targetWidth, wheelBottomY) {
    const bodySource = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / bodySource.width;
    const wheelScale = bodyScale * (car.visual.wheelScale / car.visual.bodyScale) * 1.16;
    const wheelRadius = wheelSource.height * wheelScale * 0.5;
    return wheelBottomY - wheelRadius - car.visual.wheelOffsetY * bodyScale;
  }

  createCarDisplay(car, x, y, targetWidth, depth) {
    const source = this.textures.get(getCarBodyTextureKey(this, car)).getSourceImage();
    const bodyScale = targetWidth / source.width;
    const ratio = car.visual.wheelScale / car.visual.bodyScale;
    const wheelScale = bodyScale * ratio * 1.16;

    const rearX = x + car.visual.rearOffsetX * bodyScale;
    const frontX = x + car.visual.frontOffsetX * bodyScale;
    const wheelY = y + car.visual.wheelOffsetY * bodyScale;

    const rearWheel = this.add.image(rearX, wheelY, car.visual.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(frontX, wheelY, car.visual.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const rearWheelBacking = this.add.circle(
      rearX, wheelY, Math.max(5, rearWheel.displayWidth * 0.50), 0x030507, 1
    ).setDepth(depth - 0.35);

    const frontWheelBacking = this.add.circle(
      frontX, wheelY, Math.max(5, frontWheel.displayWidth * 0.50), 0x030507, 1
    ).setDepth(depth - 0.35);

    const roadShadow = this.add.ellipse(
      x,
      wheelY + Math.max(16, rearWheel.displayHeight * 0.42),
      Math.max(128, targetWidth * 0.96),
      Math.max(20, rearWheel.displayHeight * 0.34),
      0x000000,
      0.82
    ).setDepth(depth - 0.12);

    const carStates = this.registry.get('carStates') || {};
    const paintColor = getCarPaintColor(carStates[car.id] || {});
    const bodyLayers = createCarBodyLayers(this, car, {
      x,
      y,
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

  selectCar(id) {
    if (!cars[id] || !this.ownedCarIds.includes(id)) return;
    if (this.engineMode || this.secondaryMode || this.chassisMode) {
      if (id !== this.selectedCarId) this.showWorkshopToast('EXIT TUNING BEFORE CHANGING CARS');
      return;
    }

    this.selectedCarId = id;
    this.registry.set('selectedCarId', id);

    for (const obj of this.selectedDisplay) obj.destroy();

    // Anchor every selected car to the same lowest wheel point so swapping cars
    // never makes them jump vertically. AE86 defines the current visual baseline.
    const heroWheelBottomY = this.getWheelBottomY(cars.ae86, 386, 690);
    const heroBodyY = this.getBodyYForWheelBottom(cars[id], 690, heroWheelBottomY);
    const heroSource = this.textures.get(getCarBodyTextureKey(this, cars[id])).getSourceImage();
    const heroBodyScale = 690 / heroSource.width;
    this.heroCarLayout = {
      x: 708,
      bodyY: heroBodyY,
      targetWidth: 690,
      bodyScale: heroBodyScale,
      frontWheelX: 708 + cars[id].visual.frontOffsetX * heroBodyScale,
      rearWheelX: 708 + cars[id].visual.rearOffsetX * heroBodyScale,
      wheelY: heroBodyY + cars[id].visual.wheelOffsetY * heroBodyScale,
      left: 708 - 345,
      right: 708 + 345,
    };
    this.selectedDisplay = this.createCarDisplay(cars[id], 708, heroBodyY, 690, 10);

    const car = cars[id];
    const carStates = this.registry.get('carStates') || {};
    const carState = carStates[id] || {};
    const engineBuild = applyEngineTuning(car, engines[car.engine], carState);
    const tunedBuild = applySecondaryTuning(engineBuild.car, engineBuild.engine, carState);

    this.headerCarText.setText(car.name.toUpperCase());

    this.specValueTexts.engine.setText(car.engineModel || '—');
    this.specValueTexts.power.setText((tunedBuild.car.powerKW ?? '—') + ' kW');
    this.specValueTexts.torque.setText((tunedBuild.car.torqueNm ?? '—') + ' Nm');
    this.specValueTexts.weight.setText(Math.round(tunedBuild.car.vehicleMassKg) + ' kg');

    if (this.tuningStatusText) this.tuningStatusText.setText('TUNING');

    for (const item of this.thumbButtons) {
      const active = item.id === id;
      item.box.setFillStyle(active ? 0x10263a : 0x0b1724, 1);
      item.box.setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
    }

    this.saveProfile();
  }

  showEmptyGarageState() {
    this.headerCarText.setText('NO CAR');
    this.specValueTexts.engine.setText('—');
    this.specValueTexts.power.setText('—');
    this.specValueTexts.torque.setText('—');
    this.specValueTexts.weight.setText('—');
    this.tuningStatusText?.setText('TUNING');

    this.upgradeButtons.forEach(item => {
      item.box.disableInteractive()
        .setFillStyle(0x0a1017, 1)
        .setStrokeStyle(1, 0x29343d, 1);
      item.label.setColor('#53626c');
      item.arrow.setColor('#46545e');
    });

    this.saveButton?.disableInteractive()
      .setFillStyle(0x17181d, 1)
      .setStrokeStyle(1, 0x514f55, 1);
    this.saveButtonLabel?.setText('NO CAR TO SAVE').setColor('#817d84');

    this.meetButton?.disableInteractive()
      .setFillStyle(0x17181d, 1)
      .setStrokeStyle(1, 0x514f55, 1);
    this.meetButtonLabel?.setText('NO CAR').setColor('#817d84');

    this.add.text(710, 330, 'GARAGE EMPTY', {
      fontFamily: PIXEL_FONT,
      fontSize: '18px',
      color: '#d9e8f0',
    }).setOrigin(0.5).setDepth(20);

    this.add.text(710, 382, 'You lost your last car. Restart from SETTINGS when you are ready for another run.', {
      fontFamily: BODY_FONT,
      fontSize: '13px',
      color: '#8da5b4',
      align: 'center',
      wordWrap: { width: 620 },
    }).setOrigin(0.5).setDepth(20);
  }

  enterEngineMode() {
    if (this.engineMode || this.secondaryMode || this.chassisMode || this.engineTransitioning || !this.selectedCarId) return;
    this.engineTransitioning = true;

    const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
      .setDepth(165)
      .setAlpha(0)
      .setInteractive();

    this.tweens.add({
      targets: veil,
      alpha: 1,
      duration: 210,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.activateEngineMode();
        this.tweens.add({
          targets: veil,
          alpha: 0,
          duration: 280,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            veil.destroy();
            this.engineTransitioning = false;
          },
        });
      },
    });
  }

  activateEngineMode() {
    if (this.engineMode || this.secondaryMode || this.chassisMode || !this.selectedCarId) return;
    this.engineMode = true;
    this.updateGarageNavState();

    this.upgradeButtons.forEach(item => item.box.disableInteractive());
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.disableInteractive()
        .setFillStyle(active ? 0x10263a : 0x080d12, 1)
        .setStrokeStyle(active ? 3 : 1, active ? 0x41dcff : 0x29343d, active ? 1 : 0.65);
      item.label.setColor(active ? '#ffffff' : '#56636b');
      item.display?.forEach(obj => obj?.setAlpha?.(active ? 1 : 0.22));
    });
    this.saveButton?.disableInteractive();
    this.meetButton?.disableInteractive();

    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};
    this.currentEngineTuning = getEngineTuning(state);
    this.pendingEngineTuning = { ...this.currentEngineTuning };

    const add = obj => {
      this.engineModeObjects.push(obj);
      return obj;
    };

    add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      1
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(70));

    this.engineInset = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 102,
      SIDE.w - 36,
      178,
      0x0b1724,
      1
    ).setStrokeStyle(2, 0x3b6f8d, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(71));

    this.engineInset.on('pointerover', () => {
      this.engineInset.setStrokeStyle(2, 0x43dfff, 1);
    });
    this.engineInset.on('pointerout', () => {
      this.engineInset.setStrokeStyle(2, 0x3b6f8d, 1);
    });
    this.engineInset.on('pointerdown', () => this.openEnginePartSelector('engine'));

    if (this.textures.exists('tuningCategoryEngine')) {
      const logo = add(this.add.image(
        SIDE.x + SIDE.w / 2,
        SIDE.y + 102,
        'tuningCategoryEngine'
      ).setOrigin(0.5).setDepth(73));

      const source = this.textures.get('tuningCategoryEngine').getSourceImage();
      const fit = Math.min(
        (SIDE.w - 54) / source.width,
        164 / source.height
      );
      logo.setScale(fit);
    } else {
      add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + 102, 'ENGINE', {
        fontFamily: PIXEL_FONT,
        fontSize: '14px',
        color: '#e9f8ff'
      }).setOrigin(0.5).setDepth(73));
    }

    const listIds = ENGINE_PART_ORDER.filter(id => id !== 'engine');
    this.enginePartRows = {};

    listIds.forEach((partId, i) => {
      const y = SIDE.y + 232 + i * 58;
      const part = ENGINE_TUNING_PARTS[partId];

      const box = add(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        48,
        0x0b1724,
        1
      ).setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(72));

      const label = add(this.add.text(SIDE.x + 24, y - 8, part.name, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#dff3ff'
      }).setOrigin(0, 0.5).setDepth(73));

      const detail = add(this.add.text(SIDE.x + 24, y + 12, '', {
        fontFamily: BODY_FONT, fontSize: '9px', color: '#7d9bad', fontStyle: '600'
      }).setOrigin(0, 0.5).setDepth(73));

      const level = add(this.add.text(SIDE.x + SIDE.w - 26, y, '', {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#8db6cc'
      }).setOrigin(1, 0.5).setDepth(73));

      box.on('pointerdown', () => this.openEnginePartSelector(partId));
      this.enginePartRows[partId] = { box, label, detail, level };
    });

    this.enginePreviewText = add(this.add.text(
      SIDE.x + 20,
      SIDE.y + 510,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#91b6ca',
        lineSpacing: 4,
      }
    ).setDepth(73));

    this.engineApplyButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 624,
      SIDE.w - 36,
      44,
      0x102226,
      1
    ).setStrokeStyle(2, 0x3e7f78, 1).setDepth(72));

    this.engineApplyText = add(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 624,
      'NO PARTS SELECTED',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#758e94',
      }
    ).setOrigin(0.5).setDepth(73));

    const backButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 678,
      SIDE.w - 36,
      44,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(72));

    add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + 678, '<  BACK TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(73));

    backButton.on('pointerdown', () => this.leaveEngineMode(true, true));

    this.buildEngineHotspots();
    this.addDaichiEngineHelper();
    this.refreshEngineMode();
  }

  leaveEngineMode(refreshCar = true, animate = true) {
    if (animate) {
      if (this.engineTransitioning) return;
      this.engineTransitioning = true;

      const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
        .setDepth(170)
        .setAlpha(0)
        .setInteractive();

      this.tweens.add({
        targets: veil,
        alpha: 1,
        duration: 190,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.leaveEngineMode(refreshCar, false);
          this.tweens.add({
            targets: veil,
            alpha: 0,
            duration: 280,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              veil.destroy();
              this.engineTransitioning = false;
            },
          });
        },
      });
      return;
    }

    this.closeEnginePartSelector();
    this.engineModeObjects.forEach(obj => obj?.destroy?.());
    this.engineHotspotObjects.forEach(obj => obj?.destroy?.());
    this.engineHelperObjects.forEach(obj => obj?.destroy?.());

    this.engineModeObjects = [];
    this.engineHotspotObjects = [];
    this.engineHelperObjects = [];
    this.engineMode = false;
    this.updateGarageNavState();
    this.enginePartRows = {};
    this.inlineEngineSprite = null;
    this.inlineEngineMask = null;

    this.upgradeButtons.forEach(item => item.box.setInteractive({ useHandCursor: true }));
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.setInteractive({ useHandCursor: true })
        .setFillStyle(active ? 0x10263a : 0x0b1724, 1)
        .setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
      item.display?.forEach(obj => obj?.setAlpha?.(1));
    });
    this.saveButton?.setInteractive({ useHandCursor: true });
    this.meetButton?.setInteractive({ useHandCursor: true });

    if (refreshCar) this.refreshWorkshopSpecs();
  }

  buildEngineHotspots() {
    const layout = this.heroCarLayout || {
      frontWheelX: 930,
      rearWheelX: 500,
      wheelY: 430,
      left: 363,
      right: 1053,
    };

    const frontX = layout.frontWheelX;
    const rearX = layout.rearWheelX;
    const wheelY = layout.wheelY;
    const carLeft = layout.left;
    const carRight = layout.right;
    const clampX = value => Phaser.Math.Clamp(value, carLeft + 42, carRight - 42);

    // Anchor the mechanical points to the selected car's wheelbase rather than
    // fixed screen coordinates. This keeps the markers on hatches, coupes and
    // sedans even when the body proportions change.
    const hotspots = {
      ecu: {
        x: clampX(frontX - 118),
        y: wheelY - 38,
        lx: clampX(frontX - 178),
        ly: wheelY + 30,
      },
      intake: {
        x: clampX(frontX + 78),
        y: wheelY - 48,
        lx: clampX(frontX + 112),
        ly: wheelY - 106,
      },
      turbo: {
        x: clampX(frontX - 48),
        y: wheelY - 54,
        lx: clampX(frontX - 74),
        ly: wheelY - 108,
      },
      intercooler: {
        x: clampX(carRight - 76),
        y: wheelY - 14,
        lx: clampX(carRight - 112),
        ly: wheelY + 30,
      },
      exhaust: {
        x: clampX(rearX - 92),
        y: wheelY + 4,
        lx: clampX(rearX - 54),
        ly: wheelY + 54,
      },
    };

    Object.entries(hotspots).forEach(([partId, p]) => {
      const part = ENGINE_TUNING_PARTS[partId];

      const line = this.add.line(0, 0, p.x, p.y, p.lx, p.ly, 0x43dfff, 0.95)
        .setOrigin(0, 0)
        .setLineWidth(2)
        .setDepth(74);

      const dot = this.add.circle(p.x, p.y, 10, 0x07111d, 1)
        .setStrokeStyle(3, 0x43dfff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(75);

      const width = Math.max(100, part.name.length * 12);
      const box = this.add.rectangle(p.lx, p.ly, width, 30, 0x07111d, 0.97)
        .setStrokeStyle(2, 0x43dfff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(74);

      const label = this.add.text(p.lx, p.ly, part.name, {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#e7fbff'
      }).setOrigin(0.5).setDepth(75);

      const open = () => this.openEnginePartSelector(partId);
      dot.on('pointerdown', open);
      box.on('pointerdown', open);

      this.engineHotspotObjects.push(line, dot, box, label);
    });
  }

  addDaichiEngineHelper() {
    const daichi = characters.daichiSakamoto;
    if (!daichi || !this.textures.exists(daichi.visual.spriteKey)) return;

    const x = 875;
    const feetY = 494;
    const targetHeight = 282;
    const depth = 8.4;

    const softShadow = this.add.ellipse(x + 6, feetY - 8, 74, 22, 0x000000, 0.55)
      .setDepth(depth - 0.2);
    const contactShadow = this.add.ellipse(x + 5, feetY - 5, 52, 13, 0x000000, 0.78)
      .setDepth(depth - 0.1);

    const sprite = this.add.image(x, feetY, daichi.visual.spriteKey)
      .setOrigin(0.5, 1)
      .setDepth(depth);

    const source = this.textures.get(daichi.visual.spriteKey).getSourceImage();
    sprite.setScale(targetHeight / source.height);

    this.engineHelperObjects.push(softShadow, contactShadow, sprite);
  }

  drawInlineEngineSchematic(level = 0) {
    const g = this.engineInsetGraphics;
    if (!g) return;
    g.clear();

    if (this.inlineEngineSprite) {
      this.inlineEngineSprite.destroy();
      this.inlineEngineSprite = null;
    }
    if (this.inlineEngineMask) {
      this.inlineEngineMask.destroy();
      this.inlineEngineMask = null;
    }

    const car = cars[this.selectedCarId];
    const engineKey = car?.visual?.engineKey;
    const insetLeft = SIDE.x + 18;
    const insetTop = SIDE.y + 13;
    const insetW = SIDE.w - 36;
    const insetH = 178;
    const cx = insetLeft + 70;
    const cy = SIDE.y + 110;

    if (engineKey && this.textures.exists(engineKey)) {
      this.inlineEngineSprite = this.add.image(cx, cy, engineKey)
        .setDepth(74)
        .setOrigin(0.5);
      this.engineModeObjects.push(this.inlineEngineSprite);

      const source = this.textures.get(engineKey).getSourceImage();
      const fit = Math.max(220 / source.width, 150 / source.height);
      this.inlineEngineSprite.setScale(fit * (1 + level * 0.035));

      this.inlineEngineMask = this.make.graphics({ add: false });
      this.inlineEngineMask.fillStyle(0xffffff, 1);
      this.inlineEngineMask.fillRect(insetLeft + 2, insetTop + 2, insetW - 4, insetH - 4);
      this.inlineEngineSprite.setMask(this.inlineEngineMask.createGeometryMask());
      this.engineModeObjects.push(this.inlineEngineMask);
      return;
    }

    const scale = 1.06 + level * 0.04;
    g.fillStyle(0x02070c, 0.65).fillEllipse(cx, cy + 32, 180 * scale, 22 * scale);
    g.fillStyle(0x8796a0, 1)
      .fillRoundedRect(cx - 82 * scale, cy - 24 * scale, 164 * scale, 62 * scale, 7);
    g.fillStyle(level >= 2 ? 0xbd3d49 : 0x9f2935, 1)
      .fillRoundedRect(cx - 64 * scale, cy - 39 * scale, 128 * scale, 33 * scale, 5);
    g.lineStyle(3, 0xd7e4ea, 0.76)
      .strokeRoundedRect(cx - 82 * scale, cy - 24 * scale, 164 * scale, 62 * scale, 7);

    for (let i = 0; i < 4; i++) {
      g.fillStyle(0x222b34, 1)
        .fillCircle(cx - 54 * scale + i * 35 * scale, cy + 15 * scale, 10 * scale);
    }
  }

  getPendingEngineCost() {
    if (!this.currentEngineTuning || !this.pendingEngineTuning) return 0;
    return getEngineTuningCartCost(this.currentEngineTuning, this.pendingEngineTuning);
  }

  refreshEngineMode() {
    if (!this.engineMode || !this.selectedCarId) return;

    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};
    const enginePreview = applyEngineTuning(car, engines[car.engine], {
      ...state,
      tuning: this.pendingEngineTuning,
    });
    const preview = applySecondaryTuning(enginePreview.car, enginePreview.engine, state);

    Object.entries(this.enginePartRows || {}).forEach(([partId, row]) => {
      const current = this.currentEngineTuning[partId];
      const pending = this.pendingEngineTuning[partId];
      const spec = ENGINE_TUNING_PARTS[partId].levels[pending];

      row.level.setText(
        pending === current ? 'LV.' + current : 'LV.' + current + ' > ' + pending
      );
      row.level.setColor(pending > current ? '#55e4ff' : '#8db6cc');
      row.detail.setText(spec.name.toUpperCase());
      row.box.setStrokeStyle(
        pending > current ? 2 : 1,
        pending > current ? 0x43dfff : 0x315470,
        1
      );
    });

    this.enginePreviewText?.setText(
      'POWER  ' + preview.car.powerKW + ' kW\n' +
      'TORQUE ' + preview.car.torqueNm + ' Nm\n' +
      'BOOST  ' + (preview.car.maximumBoost || 0).toFixed(2) + ' bar'
    );

    const cash = Number(this.registry.get('cash') || 0);
    const cost = this.getPendingEngineCost();
    this.engineApplyButton?.removeAllListeners('pointerdown');

    if (cost <= 0) {
      this.engineApplyButton?.disableInteractive()
        .setFillStyle(0x102226, 1)
        .setStrokeStyle(2, 0x3e7f78, 0.7);
      this.engineApplyText?.setText('NO PARTS SELECTED').setColor('#758e94');
      return;
    }

    const affordable = cash >= cost;
    this.engineApplyButton?.setInteractive({ useHandCursor: true })
      .setFillStyle(affordable ? 0x0c2827 : 0x2a171b, 1)
      .setStrokeStyle(2, affordable ? 0x62e8c7 : 0xff6f7d, 1);

    this.engineApplyText?.setText(
      affordable
        ? 'INSTALL // ¥ ' + cost.toLocaleString('en-US')
        : 'NEED ¥ ' + cost.toLocaleString('en-US')
    ).setColor(affordable ? '#f1fffb' : '#ffc0c6');

    this.engineApplyButton?.on('pointerdown', () => this.applyPendingEngineUpgrades());
  }

  addModificationModalVisual(add, {
    textureKey = null,
    title = '',
    subtitle = '',
    partName = '',
    mode = 'engine',
    depth = 120,
  } = {}) {
    const frameX = 360;
    const frameY = 405;
    const frameW = 330;
    const frameH = 430;

    add(this.add.rectangle(frameX, frameY, frameW, frameH, 0x07111d, 0.98)
      .setStrokeStyle(2, 0x315470, 1)
      .setDepth(depth + 2));

    add(this.add.text(frameX - frameW / 2 + 22, frameY - frameH / 2 + 24, 'CURRENT SETUP', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#6f93a8',
    }).setDepth(depth + 3));

    let renderedSprite = false;
    if (textureKey && this.textures.exists(textureKey)) {
      const sprite = add(this.add.image(frameX, frameY - 36, textureKey)
        .setDepth(depth + 3)
        .setOrigin(0.5));
      const source = this.textures.get(textureKey).getSourceImage();
      const fit = Math.min(280 / source.width, 245 / source.height);
      sprite.setScale(fit);
      renderedSprite = true;
    }

    if (!renderedSprite) {
      const g = add(this.add.graphics().setDepth(depth + 3));
      g.lineStyle(5, 0x7f98a8, 0.92);

      if (mode === 'drivetrain') {
        g.strokeRoundedRect(frameX - 82, frameY - 95, 126, 70, 10);
        g.lineBetween(frameX - 116, frameY - 60, frameX - 82, frameY - 60);
        g.lineBetween(frameX + 44, frameY - 60, frameX + 112, frameY - 60);
        g.strokeCircle(frameX - 120, frameY - 60, 22);
        g.strokeCircle(frameX + 116, frameY - 60, 22);
      } else if (mode === 'exhaustNos') {
        g.lineBetween(frameX - 112, frameY - 48, frameX + 30, frameY - 48);
        g.strokeRoundedRect(frameX + 30, frameY - 76, 90, 56, 10);
        g.strokeRoundedRect(frameX - 88, frameY - 128, 38, 80, 10);
      } else {
        g.strokeRoundedRect(frameX - 102, frameY - 100, 204, 118, 12);
        g.lineBetween(frameX - 92, frameY - 8, frameX + 92, frameY - 8);
        for (let i = 0; i < 4; i++) {
          g.strokeCircle(frameX - 72 + i * 48, frameY - 46, 14);
        }
      }

      add(this.add.text(frameX, frameY + 38, 'SPRITE SLOT', {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#526d7e',
      }).setOrigin(0.5).setDepth(depth + 3));
    }

    add(this.add.text(frameX, frameY + 118, title, {
      fontFamily: PIXEL_FONT,
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: frameW - 44, useAdvancedWrap: true },
    }).setOrigin(0.5, 0).setDepth(depth + 3));

    if (subtitle) {
      add(this.add.text(frameX, frameY + 166, subtitle, {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#8da9ba',
        align: 'center',
        fontStyle: '600',
        wordWrap: { width: frameW - 44, useAdvancedWrap: true },
      }).setOrigin(0.5, 0).setDepth(depth + 3));
    }

    if (partName) {
      add(this.add.text(frameX, frameY + 198, partName, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#59dfff',
        align: 'center',
      }).setOrigin(0.5, 1).setDepth(depth + 3));
    }
  }

  addUpgradeRowSprite(add, spec, x, y, depth = 120) {
    const well = add(this.add.rectangle(x, y, 72, 58, 0x07111d, 0.96)
      .setStrokeStyle(1, 0x29465c, 1)
      .setDepth(depth + 3));

    if (spec?.spriteKey && this.textures.exists(spec.spriteKey)) {
      const sprite = add(this.add.image(x, y, spec.spriteKey)
        .setDepth(depth + 4)
        .setOrigin(0.5));
      const source = this.textures.get(spec.spriteKey).getSourceImage();
      sprite.setScale(Math.min(62 / source.width, 48 / source.height));
    } else {
      add(this.add.text(x, y, 'LV.' + Number(spec?.level || 0), {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#658294',
      }).setOrigin(0.5).setDepth(depth + 4));
    }

    return well;
  }

  openEnginePartSelector(partId) {
    this.closeEnginePartSelector();
    const part = ENGINE_TUNING_PARTS[partId];
    if (!part) return;

    const add = obj => {
      this.engineModalObjects.push(obj);
      return obj;
    };
    const depth = 120;
    const car = cars[this.selectedCarId];
    const installed = this.currentEngineTuning[partId];
    const currentSpec = part.levels[installed];
    const currentEngineName =
      engines[car.engine]?.name || car.engineModel || String(car.engine || '').toUpperCase();

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 1240, 630, 0x08131f, 1)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(190, 132, part.name + ' // SELECT KIT', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    this.addModificationModalVisual(add, {
      textureKey: partId === 'engine'
        ? car?.visual?.engineKey
        : currentSpec?.spriteKey || car?.visual?.engineKey,
      title: partId === 'engine' ? currentEngineName : currentSpec?.name?.toUpperCase(),
      subtitle: partId === 'engine'
        ? 'FACTORY ENGINE // ' + car.shortName
        : currentSpec?.benefit?.toUpperCase(),
      partName: part.name,
      mode: 'engine',
      depth,
    });

    part.levels.forEach((spec, index) => {
      const y = 250 + index * 104;
      const selected = this.pendingEngineTuning[partId] === spec.level;
      const selectable = spec.level >= installed;
      const pathCost = getUpgradePathCost(partId, installed, spec.level);

      const box = add(this.add.rectangle(1010, y, 700, 86, selected ? 0x123047 : 0x0b1724, 1)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0x43dfff : 0x315470, 1)
        .setDepth(depth + 2));

      this.addUpgradeRowSprite(add, spec, 700, y, depth);

      add(this.add.text(750, y - 18, 'LV.' + spec.level + '  ' + spec.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: selectable ? '#eaf8ff' : '#5a6d79',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      add(this.add.text(750, y + 18, spec.benefit.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: selectable ? '#8eafc1' : '#53636e',
        fontStyle: '600',
        wordWrap: { width: 410, useAdvancedWrap: true },
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      let price = 'INSTALLED';
      if (spec.level > installed) price = '¥ ' + pathCost.toLocaleString('en-US');
      if (spec.level < installed) price = 'INCLUDED';

      add(this.add.text(1330, y, price, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: selected ? '#55e4ff' : selectable ? '#ffe08a' : '#61717b',
      }).setOrigin(1, 0.5).setDepth(depth + 3));

      if (selectable) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
          this.pendingEngineTuning[partId] = spec.level;
          this.closeEnginePartSelector();
          this.refreshEngineMode();
        });
      }
    });

    const close = add(this.add.rectangle(1330, 145, 100, 38, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));

    add(this.add.text(1330, 145, 'CLOSE', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#c4d5df'
    }).setOrigin(0.5).setDepth(depth + 3));

    close.on('pointerdown', () => this.closeEnginePartSelector());
    blocker.on('pointerdown', () => this.closeEnginePartSelector());
  }

  closeEnginePartSelector() {
    this.engineModalObjects.forEach(obj => obj?.destroy?.());
    this.engineModalObjects = [];
  }

  applyPendingEngineUpgrades() {
    const cost = this.getPendingEngineCost();
    if (cost <= 0) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) {
      this.showWorkshopToast('NOT ENOUGH CASH');
      return;
    }

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = carStates[this.selectedCarId] || {};
    const tuning = normaliseEngineTuning(this.pendingEngineTuning);

    carStates[this.selectedCarId] = {
      stock: false,
      nosInstalled: Boolean(existing.nosInstalled),
      tuneLevel: Number(existing.tuneLevel || 0),
      acquiredVia: existing.acquiredVia || 'garage',
      ...existing,
      tuning,
      stock:
        getEngineTuningCount(tuning) === 0 &&
        !existing.nosInstalled &&
        Object.values(existing.drivetrainTuning || {}).every(value => !Number(value)) &&
        Object.values(existing.exhaustNosTuning || {}).every(value => !Number(value)),
    };

    this.registry.set('carStates', carStates);
    this.registry.set('cash', cash - cost);
    this.cashText?.setText('¥ ' + (cash - cost).toLocaleString('en-US'));
    saveSessionState(this.registry);

    this.currentEngineTuning = getEngineTuning(carStates[this.selectedCarId]);
    this.pendingEngineTuning = { ...this.currentEngineTuning };
    this.refreshEngineMode();
    this.showWorkshopToast('DAICHI INSTALLED THE PARTS // ¥ ' + cost.toLocaleString('en-US'));
  }


  enterChassisMode() {
    if (this.engineMode || this.secondaryMode || this.chassisMode || this.engineTransitioning || !this.selectedCarId) return;
    this.engineTransitioning = true;

    const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
      .setDepth(165)
      .setAlpha(0)
      .setInteractive();

    this.tweens.add({
      targets: veil,
      alpha: 1,
      duration: 190,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.activateChassisMode();
        this.tweens.add({
          targets: veil,
          alpha: 0,
          duration: 260,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            veil.destroy();
            this.engineTransitioning = false;
          },
        });
      },
    });
  }

  activateChassisMode() {
    if (this.engineMode || this.secondaryMode || this.chassisMode || !this.selectedCarId) return;

    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};

    this.chassisMode = true;
    this.currentPaintColor = getCarPaintColor(state);
    this.pendingPaintColor = this.currentPaintColor;
    this.chassisModeObjects = [];
    this.chassisPresetButtons = [];
    this.chassisRgbLabels = {};
    this.updateGarageNavState();

    this.upgradeButtons.forEach(item => item.box.disableInteractive());
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.disableInteractive()
        .setFillStyle(active ? 0x10263a : 0x080d12, 1)
        .setStrokeStyle(active ? 3 : 1, active ? 0x41dcff : 0x29343d, active ? 1 : 0.65);
      item.label.setColor(active ? '#ffffff' : '#56636b');
      item.display?.forEach(obj => obj?.setAlpha?.(active ? 1 : 0.22));
    });
    this.saveButton?.disableInteractive();
    this.meetButton?.disableInteractive();

    const add = obj => {
      this.chassisModeObjects.push(obj);
      return obj;
    };

    add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      1
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(70));

    add(this.add.text(SIDE.x + 28, SIDE.y + 24, 'CHASSIS', {
      fontFamily: PIXEL_FONT,
      fontSize: '12px',
      color: '#e9f8ff',
    }).setDepth(73));

    add(this.add.text(SIDE.x + 28, SIDE.y + 62, 'PAINT', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#62dfff',
    }).setDepth(73));

    this.chassisPaintSwatch = add(this.add.rectangle(
      SIDE.x + 70,
      SIDE.y + 112,
      76,
      52,
      this.pendingPaintColor,
      1
    ).setStrokeStyle(2, 0xd8f5ff, 1).setDepth(72));

    this.chassisHexText = add(this.add.text(SIDE.x + 126, SIDE.y + 101, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#e8f7ff',
    }).setDepth(73));

    this.chassisAssetStatusText = add(this.add.text(SIDE.x + 126, SIDE.y + 126, '', {
      fontFamily: BODY_FONT,
      fontSize: '9px',
      color: '#7fa4b7',
      wordWrap: { width: 180 },
    }).setDepth(73));

    add(this.add.text(SIDE.x + 28, SIDE.y + 170, 'PRESET COLOURS', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#91b9ce',
    }).setDepth(73));

    const presetStartX = SIDE.x + 55;
    const presetStartY = SIDE.y + 214;
    const presetGapX = 62;
    const presetGapY = 54;

    PAINT_PRESETS.forEach((preset, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      const x = presetStartX + col * presetGapX;
      const y = presetStartY + row * presetGapY;

      const box = add(this.add.rectangle(x, y, 46, 32, preset.color, 1)
        .setStrokeStyle(2, 0x42586a, 1)
        .setDepth(72));

      const hit = add(this.add.rectangle(x, y, 52, 40, 0x000000, 0)
        .setDepth(74));

      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        if (!hasLayeredPaintAssets(this, car)) return;
        this.pendingPaintColor = preset.color;
        this.refreshChassisMode();
      });

      this.chassisPresetButtons.push({ preset, box, hit });
    });

    add(this.add.text(SIDE.x + 28, SIDE.y + 322, 'CUSTOM RGB', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#91b9ce',
    }).setDepth(73));

    ['r', 'g', 'b'].forEach((channel, index) => {
      const y = SIDE.y + 368 + index * 50;
      const label = channel.toUpperCase();

      add(this.add.text(SIDE.x + 32, y, label, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#dff3ff',
      }).setOrigin(0, 0.5).setDepth(73));

      const minus = add(this.add.rectangle(SIDE.x + 112, y, 42, 34, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(72));
      add(this.add.text(SIDE.x + 112, y, '−', {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#bde9ff'
      }).setOrigin(0.5).setDepth(73));

      const valueText = add(this.add.text(SIDE.x + 180, y, '000', {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(73));
      this.chassisRgbLabels[channel] = valueText;

      const plus = add(this.add.rectangle(SIDE.x + 248, y, 42, 34, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(72));
      add(this.add.text(SIDE.x + 248, y, '+', {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#bde9ff'
      }).setOrigin(0.5).setDepth(73));

      minus.on('pointerdown', () => this.adjustPendingPaintChannel(channel, -8));
      plus.on('pointerdown', () => this.adjustPendingPaintChannel(channel, 8));
    });

    this.chassisApplyButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 594,
      SIDE.w - 36,
      44,
      0x102226,
      1
    ).setStrokeStyle(2, 0x3e7f78, 1).setDepth(72));

    this.chassisApplyText = add(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 594,
      'PAINT INSTALLED',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#758e94',
      }
    ).setOrigin(0.5).setDepth(73));

    const backButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 654,
      SIDE.w - 36,
      44,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(72));

    add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + 654, '<  BACK TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(73));

    backButton.on('pointerdown', () => this.leaveChassisMode(true));
    this.refreshChassisMode();
  }

  adjustPendingPaintChannel(channel, delta) {
    if (!this.chassisMode || !hasLayeredPaintAssets(this, cars[this.selectedCarId])) return;

    const rgb = paintColorToRgb(this.pendingPaintColor);
    rgb[channel] = Phaser.Math.Clamp(Number(rgb[channel] || 0) + Number(delta || 0), 0, 255);
    this.pendingPaintColor = rgbToPaintColor(rgb.r, rgb.g, rgb.b);
    this.refreshChassisMode();
  }

  refreshChassisMode() {
    if (!this.chassisMode || !this.selectedCarId) return;

    const car = cars[this.selectedCarId];
    const ready = hasLayeredPaintAssets(this, car);
    const color = normalisePaintColor(this.pendingPaintColor);
    const rgb = paintColorToRgb(color);

    this.chassisPaintSwatch?.setFillStyle(color, 1);
    this.chassisHexText?.setText(paintColorToHex(color));
    this.chassisRgbLabels.r?.setText(String(rgb.r).padStart(3, '0'));
    this.chassisRgbLabels.g?.setText(String(rgb.g).padStart(3, '0'));
    this.chassisRgbLabels.b?.setText(String(rgb.b).padStart(3, '0'));

    this.chassisAssetStatusText?.setText(
      ready
        ? 'LIVE PREVIEW // PHASER TINT'
        : this.selectedCarId === 'ae86'
          ? 'UPLOAD ae86_body_paint.png + ae86_body_overlay.png TO ENABLE'
          : 'PAINT LAYERS NOT BUILT FOR THIS CAR YET'
    ).setColor(ready ? '#62e8c7' : '#ffbc71');

    this.chassisPresetButtons.forEach(item => {
      const active = item.preset.color === color;
      item.box.setStrokeStyle(active ? 3 : 2, active ? 0xffffff : 0x42586a, active ? 1 : 0.85);
      if (ready) item.hit.setInteractive({ useHandCursor: true });
      else item.hit.disableInteractive();
    });

    if (ready) setCarBodyPaint(this.selectedDisplay, color);

    this.chassisApplyButton?.removeAllListeners('pointerdown');

    if (!ready) {
      this.chassisApplyButton?.disableInteractive()
        .setFillStyle(0x241b16, 1)
        .setStrokeStyle(2, 0x79563a, 0.85);
      this.chassisApplyText?.setText('PAINT ASSETS REQUIRED').setColor('#c99b74');
      return;
    }

    if (color === this.currentPaintColor) {
      this.chassisApplyButton?.disableInteractive()
        .setFillStyle(0x102226, 1)
        .setStrokeStyle(2, 0x3e7f78, 0.7);
      this.chassisApplyText?.setText('PAINT INSTALLED').setColor('#758e94');
      return;
    }

    this.chassisApplyButton?.setInteractive({ useHandCursor: true })
      .setFillStyle(0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1);
    this.chassisApplyText?.setText('APPLY PAINT // TEST').setColor('#f1fffb');
    this.chassisApplyButton?.on('pointerdown', () => this.applyPendingPaint());
  }

  applyPendingPaint() {
    if (!this.chassisMode || !this.selectedCarId) return;
    const car = cars[this.selectedCarId];
    if (!hasLayeredPaintAssets(this, car)) {
      this.showWorkshopToast('PAINT LAYERS NOT AVAILABLE');
      return;
    }

    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = carStates[this.selectedCarId] || {};
    const paintColor = normalisePaintColor(this.pendingPaintColor);

    carStates[this.selectedCarId] = {
      ...existing,
      paintColor,
    };

    this.registry.set('carStates', carStates);
    saveSessionState(this.registry);
    this.currentPaintColor = paintColor;
    this.pendingPaintColor = paintColor;

    this.thumbButtons.forEach(item => {
      if (item.id === this.selectedCarId) setCarBodyPaint(item.display || [], paintColor);
    });
    setCarBodyPaint(this.selectedDisplay, paintColor);
    this.refreshChassisMode();
    this.showWorkshopToast('PAINT APPLIED // ' + paintColorToHex(paintColor));
  }

  leaveChassisMode(animate = true) {
    if (!this.chassisMode) return;

    if (animate) {
      if (this.engineTransitioning) return;
      this.engineTransitioning = true;

      const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
        .setDepth(170)
        .setAlpha(0)
        .setInteractive();

      this.tweens.add({
        targets: veil,
        alpha: 1,
        duration: 180,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.leaveChassisMode(false);
          this.tweens.add({
            targets: veil,
            alpha: 0,
            duration: 250,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              veil.destroy();
              this.engineTransitioning = false;
            },
          });
        },
      });
      return;
    }

    setCarBodyPaint(this.selectedDisplay, this.currentPaintColor);
    this.chassisModeObjects.forEach(obj => obj?.destroy?.());
    this.chassisModeObjects = [];
    this.chassisPresetButtons = [];
    this.chassisRgbLabels = {};
    this.chassisMode = false;
    this.updateGarageNavState();

    this.upgradeButtons.forEach(item => item.box.setInteractive({ useHandCursor: true }));
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.setInteractive({ useHandCursor: true })
        .setFillStyle(active ? 0x10263a : 0x0b1724, 1)
        .setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
      item.display?.forEach(obj => obj?.setAlpha?.(1));
    });
    this.saveButton?.setInteractive({ useHandCursor: true });
    this.meetButton?.setInteractive({ useHandCursor: true });

    this.refreshWorkshopSpecs();
  }

  enterSecondaryTuningMode(mode) {
    if (this.engineMode || this.secondaryMode || this.chassisMode || this.engineTransitioning || !this.selectedCarId) return;
    this.engineTransitioning = true;

    const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
      .setDepth(165)
      .setAlpha(0)
      .setInteractive();

    this.tweens.add({
      targets: veil,
      alpha: 1,
      duration: 210,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.activateSecondaryTuningMode(mode);
        this.tweens.add({
          targets: veil,
          alpha: 0,
          duration: 280,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            veil.destroy();
            this.engineTransitioning = false;
          },
        });
      },
    });
  }

  activateSecondaryTuningMode(mode) {
    if (this.engineMode || this.secondaryMode || this.chassisMode || !this.selectedCarId) return;

    const isDrivetrain = mode === 'drivetrain';
    const parts = isDrivetrain ? DRIVETRAIN_TUNING_PARTS : EXHAUST_NOS_TUNING_PARTS;
    const order = isDrivetrain ? DRIVETRAIN_PART_ORDER : EXHAUST_NOS_PART_ORDER;
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};

    this.secondaryMode = mode;
    this.updateGarageNavState();
    this.currentSecondaryTuning = isDrivetrain
      ? getDrivetrainTuning(state)
      : getExhaustNosTuning(state);
    this.pendingSecondaryTuning = { ...this.currentSecondaryTuning };

    this.upgradeButtons.forEach(item => item.box.disableInteractive());
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.disableInteractive()
        .setFillStyle(active ? 0x10263a : 0x080d12, 1)
        .setStrokeStyle(active ? 3 : 1, active ? 0x41dcff : 0x29343d, active ? 1 : 0.65);
      item.label.setColor(active ? '#ffffff' : '#56636b');
      item.display?.forEach(obj => obj?.setAlpha?.(active ? 1 : 0.22));
    });
    this.saveButton?.disableInteractive();
    this.meetButton?.disableInteractive();

    const add = obj => {
      this.secondaryModeObjects.push(obj);
      return obj;
    };

    add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      1
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(70));

    add(this.add.text(SIDE.x + 34, SIDE.y + 28, isDrivetrain ? 'DRIVETRAIN' : 'EXHAUST / NOS', {
      fontFamily: PIXEL_FONT,
      fontSize: isDrivetrain ? '12px' : '11px',
      color: '#e9f8ff',
    }).setDepth(73));

    this.secondarySpriteGraphics = add(this.add.graphics().setDepth(73));
    this.drawSecondarySchematic(mode);

    this.secondaryPartRows = {};
    order.forEach((partId, i) => {
      const y = SIDE.y + 232 + i * 58;
      const part = parts[partId];

      const box = add(this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        48,
        0x0b1724,
        1
      ).setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(72));

      const label = add(this.add.text(SIDE.x + 24, y - 8, part.name, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#dff3ff'
      }).setOrigin(0, 0.5).setDepth(73));

      const detail = add(this.add.text(SIDE.x + 24, y + 12, '', {
        fontFamily: BODY_FONT, fontSize: '9px', color: '#7d9bad', fontStyle: '600'
      }).setOrigin(0, 0.5).setDepth(73));

      const level = add(this.add.text(SIDE.x + SIDE.w - 26, y, '', {
        fontFamily: PIXEL_FONT, fontSize: '7px', color: '#8db6cc'
      }).setOrigin(1, 0.5).setDepth(73));

      box.on('pointerdown', () => this.openSecondaryPartSelector(partId));
      this.secondaryPartRows[partId] = { box, label, detail, level };
    });

    this.secondaryPreviewText = add(this.add.text(
      SIDE.x + 20,
      SIDE.y + 510,
      '',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#91b6ca',
        lineSpacing: 4,
      }
    ).setDepth(73));

    this.secondaryApplyButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 624,
      SIDE.w - 36,
      44,
      0x102226,
      1
    ).setStrokeStyle(2, 0x3e7f78, 1).setDepth(72));

    this.secondaryApplyText = add(this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 624,
      'NO PARTS SELECTED',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#758e94',
      }
    ).setOrigin(0.5).setDepth(73));

    const backButton = add(this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 678,
      SIDE.w - 36,
      44,
      0x102138,
      1
    ).setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(72));

    add(this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + 678, '<  BACK TO WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#eef8ff'
    }).setOrigin(0.5).setDepth(73));

    backButton.on('pointerdown', () => this.leaveSecondaryTuningMode(true));

    this.buildSecondaryHotspots(mode);
    this.addDaichiSecondaryHelper(mode);
    this.refreshSecondaryTuningMode();
  }

  leaveSecondaryTuningMode(animate = true) {
    if (animate) {
      if (this.engineTransitioning) return;
      this.engineTransitioning = true;

      const veil = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 1)
        .setDepth(170)
        .setAlpha(0)
        .setInteractive();

      this.tweens.add({
        targets: veil,
        alpha: 1,
        duration: 190,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.leaveSecondaryTuningMode(false);
          this.tweens.add({
            targets: veil,
            alpha: 0,
            duration: 280,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              veil.destroy();
              this.engineTransitioning = false;
            },
          });
        },
      });
      return;
    }

    this.closeSecondaryPartSelector();
    this.secondaryModeObjects.forEach(obj => obj?.destroy?.());
    this.secondaryHelperObjects.forEach(obj => obj?.destroy?.());
    this.secondaryHotspotObjects.forEach(obj => obj?.destroy?.());

    this.secondaryModeObjects = [];
    this.secondaryHelperObjects = [];
    this.secondaryHotspotObjects = [];
    this.secondaryMode = null;
    this.updateGarageNavState();
    this.secondaryPartRows = {};
    this.secondarySpriteImage = null;

    this.upgradeButtons.forEach(item => item.box.setInteractive({ useHandCursor: true }));
    this.thumbButtons.forEach(item => {
      const active = item.id === this.selectedCarId;
      item.box.setInteractive({ useHandCursor: true })
        .setFillStyle(active ? 0x10263a : 0x0b1724, 1)
        .setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
      item.display?.forEach(obj => obj?.setAlpha?.(1));
    });
    this.saveButton?.setInteractive({ useHandCursor: true });
    this.meetButton?.setInteractive({ useHandCursor: true });

    this.refreshWorkshopSpecs();
  }

  refreshWorkshopSpecs() {
    if (!this.selectedCarId) return;
    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};
    const engineBuild = applyEngineTuning(car, engines[car.engine], state);
    const fullBuild = applySecondaryTuning(engineBuild.car, engineBuild.engine, state);
    this.specValueTexts.power.setText(fullBuild.car.powerKW + ' kW');
    this.specValueTexts.torque.setText(fullBuild.car.torqueNm + ' Nm');
    this.specValueTexts.weight.setText(Math.round(fullBuild.car.vehicleMassKg) + ' kg');
  }

  buildSecondaryHotspots(mode) {
    const isDrivetrain = mode === 'drivetrain';
    const parts = isDrivetrain ? DRIVETRAIN_TUNING_PARTS : EXHAUST_NOS_TUNING_PARTS;
    const layout = this.heroCarLayout || {
      frontWheelX: 930,
      rearWheelX: 500,
      wheelY: 430,
      left: 363,
      right: 1053,
    };

    const frontX = layout.frontWheelX;
    const rearX = layout.rearWheelX;
    const wheelY = layout.wheelY;
    const midX = (frontX + rearX) / 2;
    const clampX = value => Phaser.Math.Clamp(value, layout.left + 48, layout.right - 48);

    const hotspots = isDrivetrain
      ? {
          clutch: {
            x: clampX(frontX - 64),
            y: wheelY - 44,
            lx: clampX(frontX - 94),
            ly: wheelY - 112,
          },
          gearbox: {
            x: clampX(frontX - 154),
            y: wheelY - 14,
            lx: clampX(frontX - 178),
            ly: wheelY + 48,
          },
          differential: {
            x: clampX(rearX + 42),
            y: wheelY + 4,
            lx: clampX(rearX + 34),
            ly: wheelY + 66,
          },
          suspension: {
            x: clampX(rearX - 34),
            y: wheelY - 48,
            lx: clampX(rearX - 94),
            ly: wheelY - 108,
          },
          launchSetup: {
            x: clampX(frontX + 34),
            y: wheelY + 2,
            lx: clampX(frontX + 92),
            ly: wheelY + 62,
          },
        }
      : {
          headers: {
            x: clampX(frontX - 80),
            y: wheelY - 58,
            lx: clampX(frontX - 168),
            ly: wheelY - 136,
          },
          exhaust: {
            x: clampX(midX),
            y: wheelY + 14,
            lx: clampX(midX + 8),
            ly: wheelY + 70,
          },
          muffler: {
            x: clampX(rearX - 92),
            y: wheelY + 2,
            lx: clampX(rearX - 56),
            ly: wheelY + 58,
          },
          nosKit: {
            x: clampX(midX - 72),
            y: wheelY - 88,
            lx: clampX(midX - 102),
            ly: wheelY - 150,
          },
          nitrousShot: {
            x: clampX(midX + 54),
            y: wheelY - 62,
            lx: clampX(midX + 152),
            ly: wheelY - 106,
          },
        };

    Object.entries(hotspots).forEach(([partId, p]) => {
      const part = parts[partId];
      if (!part) return;

      const line = this.add.line(0, 0, p.x, p.y, p.lx, p.ly, 0x43dfff, 0.95)
        .setOrigin(0, 0)
        .setLineWidth(2)
        .setDepth(74);

      const dot = this.add.circle(p.x, p.y, 10, 0x07111d, 1)
        .setStrokeStyle(3, 0x43dfff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(75);

      const width = Math.max(104, part.name.length * 12);
      const box = this.add.rectangle(p.lx, p.ly, width, 30, 0x07111d, 0.97)
        .setStrokeStyle(2, 0x43dfff, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(74);

      const label = this.add.text(p.lx, p.ly, part.name, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#e7fbff',
      }).setOrigin(0.5).setDepth(75);

      const open = () => this.openSecondaryPartSelector(partId);
      dot.on('pointerdown', open);
      box.on('pointerdown', open);

      this.secondaryHotspotObjects.push(line, dot, box, label);
    });
  }

  addDaichiSecondaryHelper(mode) {
    const daichi = characters.daichiSakamoto;
    if (!daichi || !this.textures.exists(daichi.visual.spriteKey)) return;

    const cfg = mode === 'drivetrain'
      ? { x: 690, feetY: 506, targetHeight: 258 }
      : { x: 520, feetY: 506, targetHeight: 258 };
    const depth = 8.4;

    const softShadow = this.add.ellipse(cfg.x + 6, cfg.feetY - 8, 72, 21, 0x000000, 0.55)
      .setDepth(depth - 0.2);
    const contactShadow = this.add.ellipse(cfg.x + 5, cfg.feetY - 5, 50, 13, 0x000000, 0.78)
      .setDepth(depth - 0.1);

    const sprite = this.add.image(cfg.x, cfg.feetY, daichi.visual.spriteKey)
      .setOrigin(0.5, 1)
      .setDepth(depth);

    const source = this.textures.get(daichi.visual.spriteKey).getSourceImage();
    sprite.setScale(cfg.targetHeight / source.height);

    this.secondaryHelperObjects.push(softShadow, contactShadow, sprite);
  }

  drawSecondarySchematic(mode) {
    const g = this.secondarySpriteGraphics;
    if (!g) return;
    g.clear();

    if (this.secondarySpriteImage) {
      this.secondarySpriteImage.destroy();
      this.secondarySpriteImage = null;
    }

    const car = cars[this.selectedCarId];
    const key = mode === 'drivetrain'
      ? car?.visual?.drivetrainKey
      : car?.visual?.exhaustNosKey;
    const cx = SIDE.x + SIDE.w - 92;
    const cy = SIDE.y + 105;

    if (key && this.textures.exists(key)) {
      this.secondarySpriteImage = this.add.image(cx, cy, key)
        .setDepth(74)
        .setOrigin(0.5);
      this.secondaryModeObjects.push(this.secondarySpriteImage);

      const source = this.textures.get(key).getSourceImage();
      const fit = Math.min(150 / source.width, 100 / source.height);
      this.secondarySpriteImage.setScale(fit);
      return;
    }

    if (mode === 'drivetrain') {
      g.lineStyle(5, 0x93aab8, 1);
      g.strokeRoundedRect(cx - 62, cy - 26, 92, 52, 8);
      g.lineBetween(cx - 86, cy, cx - 62, cy);
      g.lineBetween(cx + 30, cy, cx + 78, cy);
      g.fillStyle(0x5d6e79, 1).fillCircle(cx - 90, cy, 18);
      g.fillStyle(0x5d6e79, 1).fillCircle(cx + 82, cy, 18);
      g.fillStyle(0x263744, 1).fillCircle(cx + 4, cy, 18);
    } else {
      g.lineStyle(6, 0x8fa2ad, 1);
      g.lineBetween(cx - 78, cy + 14, cx + 18, cy + 14);
      g.strokeRoundedRect(cx + 18, cy - 7, 72, 42, 10);
      g.lineStyle(3, 0x48bde8, 1);
      g.strokeRoundedRect(cx - 62, cy - 48, 30, 62, 10);
      g.fillStyle(0x2d6ea5, 1).fillRoundedRect(cx - 58, cy - 44, 22, 54, 8);
      g.fillStyle(0xd6eef8, 1).fillRect(cx - 55, cy - 24, 16, 8);
    }
  }

  getPendingSecondaryCost() {
    if (!this.currentSecondaryTuning || !this.pendingSecondaryTuning || !this.secondaryMode) return 0;
    return this.secondaryMode === 'drivetrain'
      ? getDrivetrainCartCost(this.currentSecondaryTuning, this.pendingSecondaryTuning)
      : getExhaustNosCartCost(this.currentSecondaryTuning, this.pendingSecondaryTuning);
  }

  refreshSecondaryTuningMode() {
    if (!this.secondaryMode || !this.selectedCarId) return;

    const isDrivetrain = this.secondaryMode === 'drivetrain';
    const parts = isDrivetrain ? DRIVETRAIN_TUNING_PARTS : EXHAUST_NOS_TUNING_PARTS;
    const car = cars[this.selectedCarId];
    const carStates = this.registry.get('carStates') || {};
    const state = carStates[this.selectedCarId] || {};
    const previewState = {
      ...state,
      ...(isDrivetrain
        ? { drivetrainTuning: this.pendingSecondaryTuning }
        : { exhaustNosTuning: this.pendingSecondaryTuning }),
    };

    const engineBuild = applyEngineTuning(car, engines[car.engine], previewState);
    const preview = applySecondaryTuning(engineBuild.car, engineBuild.engine, previewState);

    Object.entries(this.secondaryPartRows || {}).forEach(([partId, row]) => {
      const current = this.currentSecondaryTuning[partId];
      const pending = this.pendingSecondaryTuning[partId];
      const spec = parts[partId].levels[pending];

      row.level.setText(pending === current ? 'LV.' + current : 'LV.' + current + ' > ' + pending);
      row.level.setColor(pending > current ? '#55e4ff' : '#8db6cc');
      row.detail.setText(spec.name.toUpperCase());
      row.box.setStrokeStyle(
        pending > current ? 2 : 1,
        pending > current ? 0x43dfff : 0x315470,
        1
      );
    });

    if (isDrivetrain) {
      const base = cars[this.selectedCarId];
      const launchGain = Math.round((preview.car.launchLoadMultiplier / Math.max(0.01, base.launchLoadMultiplier || 1) - 1) * 100);
      const gripGain = Math.round((preview.car.tyreGrip / Math.max(0.01, base.tyreGrip || 1) - 1) * 100);
      const clutchGain = Math.round((preview.car.clutchStrength / Math.max(1, base.clutchStrength || 1) - 1) * 100);
      const shiftGain = Math.round((1 - (preview.car.shiftTimeScale || 1)) * 100);
      this.secondaryPreviewText?.setText(
        'LAUNCH   +' + Math.max(0, launchGain) + '%\n' +
        'SHIFT    ' + Math.max(0, shiftGain) + '% FASTER\n' +
        'GRIP     +' + Math.max(0, gripGain) + '%\n' +
        'CLUTCH   +' + Math.max(0, clutchGain) + '%'
      );
    } else {
      this.secondaryPreviewText?.setText(
        'POWER    ' + preview.car.powerKW + ' kW\n' +
        'NITROUS  ' + Number(preview.car.nosPower || 0) + ' hp\n' +
        'CAPACITY ' + Number(preview.car.nosCapacitySeconds || 0).toFixed(1) + ' sec\n' +
        'WEIGHT   ' + Math.round(preview.car.vehicleMassKg) + ' kg'
      );
    }

    const cash = Number(this.registry.get('cash') || 0);
    const cost = this.getPendingSecondaryCost();
    this.secondaryApplyButton?.removeAllListeners('pointerdown');

    if (cost <= 0) {
      this.secondaryApplyButton?.disableInteractive()
        .setFillStyle(0x102226, 1)
        .setStrokeStyle(2, 0x3e7f78, 0.7);
      this.secondaryApplyText?.setText('NO PARTS SELECTED').setColor('#758e94');
      return;
    }

    const affordable = cash >= cost;
    this.secondaryApplyButton?.setInteractive({ useHandCursor: true })
      .setFillStyle(affordable ? 0x0c2827 : 0x2a171b, 1)
      .setStrokeStyle(2, affordable ? 0x62e8c7 : 0xff6f7d, 1);

    this.secondaryApplyText?.setText(
      affordable
        ? 'INSTALL // ¥ ' + cost.toLocaleString('en-US')
        : 'NEED ¥ ' + cost.toLocaleString('en-US')
    ).setColor(affordable ? '#f1fffb' : '#ffc0c6');

    this.secondaryApplyButton?.on('pointerdown', () => this.applyPendingSecondaryUpgrades());
  }

  openSecondaryPartSelector(partId) {
    this.closeSecondaryPartSelector();
    const isDrivetrain = this.secondaryMode === 'drivetrain';
    const parts = isDrivetrain ? DRIVETRAIN_TUNING_PARTS : EXHAUST_NOS_TUNING_PARTS;
    const part = parts[partId];
    if (!part) return;

    const add = obj => {
      this.secondaryModalObjects.push(obj);
      return obj;
    };
    const depth = 120;
    const installed = this.currentSecondaryTuning[partId];
    const currentSpec = part.levels[installed];
    const car = cars[this.selectedCarId];
    const contextTextureKey = isDrivetrain
      ? car?.visual?.drivetrainKey
      : car?.visual?.exhaustNosKey;

    const blocker = add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.76)
      .setDepth(depth)
      .setInteractive());

    add(this.add.rectangle(780, 420, 1240, 630, 0x08131f, 1)
      .setStrokeStyle(2, 0x43dfff, 1)
      .setDepth(depth + 1));

    add(this.add.text(190, 132, part.name + ' // SELECT KIT', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#eefaff',
    }).setDepth(depth + 2));

    this.addModificationModalVisual(add, {
      textureKey: currentSpec?.spriteKey || contextTextureKey,
      title: currentSpec?.name?.toUpperCase() || part.name,
      subtitle: currentSpec?.benefit?.toUpperCase() || '',
      partName: isDrivetrain ? 'DRIVETRAIN' : 'EXHAUST / NOS',
      mode: isDrivetrain ? 'drivetrain' : 'exhaustNos',
      depth,
    });

    part.levels.forEach((spec, index) => {
      const y = 250 + index * 104;
      const selected = this.pendingSecondaryTuning[partId] === spec.level;
      const selectable = spec.level >= installed;
      const pathCost = isDrivetrain
        ? getDrivetrainUpgradePathCost(partId, installed, spec.level)
        : getExhaustNosUpgradePathCost(partId, installed, spec.level);

      const box = add(this.add.rectangle(1010, y, 700, 86, selected ? 0x123047 : 0x0b1724, 1)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0x43dfff : 0x315470, 1)
        .setDepth(depth + 2));

      this.addUpgradeRowSprite(add, spec, 700, y, depth);

      add(this.add.text(750, y - 18, 'LV.' + spec.level + '  ' + spec.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: selectable ? '#eaf8ff' : '#5a6d79',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      add(this.add.text(750, y + 18, spec.benefit.toUpperCase(), {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: selectable ? '#8eafc1' : '#53636e',
        fontStyle: '600',
        wordWrap: { width: 410, useAdvancedWrap: true },
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      let price = 'INSTALLED';
      if (spec.level > installed) price = '¥ ' + pathCost.toLocaleString('en-US');
      if (spec.level < installed) price = 'INCLUDED';

      add(this.add.text(1330, y, price, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: selected ? '#55e4ff' : selectable ? '#ffe08a' : '#61717b',
      }).setOrigin(1, 0.5).setDepth(depth + 3));

      if (selectable) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
          this.pendingSecondaryTuning[partId] = spec.level;
          this.closeSecondaryPartSelector();
          this.refreshSecondaryTuningMode();
        });
      }
    });

    const close = add(this.add.rectangle(1330, 145, 100, 38, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));

    add(this.add.text(1330, 145, 'CLOSE', {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#c4d5df'
    }).setOrigin(0.5).setDepth(depth + 3));

    close.on('pointerdown', () => this.closeSecondaryPartSelector());
    blocker.on('pointerdown', () => this.closeSecondaryPartSelector());
  }

  closeSecondaryPartSelector() {
    this.secondaryModalObjects.forEach(obj => obj?.destroy?.());
    this.secondaryModalObjects = [];
  }

  applyPendingSecondaryUpgrades() {
    const cost = this.getPendingSecondaryCost();
    if (cost <= 0 || !this.secondaryMode) return;

    const cash = Number(this.registry.get('cash') || 0);
    if (cash < cost) {
      this.showWorkshopToast('NOT ENOUGH CASH');
      return;
    }

    const isDrivetrain = this.secondaryMode === 'drivetrain';
    const carStates = { ...(this.registry.get('carStates') || {}) };
    const existing = carStates[this.selectedCarId] || {};
    const tuning = isDrivetrain
      ? normaliseDrivetrainTuning(this.pendingSecondaryTuning)
      : normaliseExhaustNosTuning(this.pendingSecondaryTuning);

    const updated = {
      ...existing,
      stock: false,
      acquiredVia: existing.acquiredVia || 'garage',
      ...(isDrivetrain
        ? { drivetrainTuning: tuning }
        : { exhaustNosTuning: tuning }),
    };

    if (!isDrivetrain && tuning.nosKit > 0) {
      const kit = EXHAUST_NOS_TUNING_PARTS.nosKit.levels[tuning.nosKit];
      const shot = EXHAUST_NOS_TUNING_PARTS.nitrousShot.levels[tuning.nitrousShot];
      updated.nosInstalled = true;
      updated.nosCapacitySeconds = Number(kit.capacitySeconds || 0);
      updated.nosPower = Number(shot.powerHp || 0);
    }

    carStates[this.selectedCarId] = updated;
    this.registry.set('carStates', carStates);
    this.registry.set('cash', cash - cost);
    this.cashText?.setText('¥ ' + (cash - cost).toLocaleString('en-US'));
    saveSessionState(this.registry);

    this.currentSecondaryTuning = isDrivetrain
      ? getDrivetrainTuning(updated)
      : getExhaustNosTuning(updated);
    this.pendingSecondaryTuning = { ...this.currentSecondaryTuning };
    this.refreshSecondaryTuningMode();
    this.showWorkshopToast('DAICHI INSTALLED THE PARTS // ¥ ' + cost.toLocaleString('en-US'));
  }

  showWorkshopToast(message) {
    if (this.workshopToastObjects?.length) {
      this.workshopToastObjects.forEach(obj => obj?.destroy?.());
    }
    this.workshopToastObjects = [];

    const panel = this.add.rectangle(710, 600, 570, 44, 0x07131e, 0.98)
      .setStrokeStyle(2, 0x43dfff, 0.92)
      .setDepth(145);

    const text = this.add.text(710, 600, message, {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(146);

    this.workshopToastObjects.push(panel, text);
    this.time.delayedCall(1450, () => {
      this.workshopToastObjects?.forEach(obj => obj?.destroy?.());
      this.workshopToastObjects = [];
    });
  }

  selectUpgrade(name) {
    this.selectedUpgrade = name;
    for (const item of this.upgradeButtons) {
      const active = item.name === name;
      item.box.setFillStyle(active ? 0x10283b : 0x0b1724, 1);
      item.box.setStrokeStyle(active ? 2 : 1, active ? 0x43dfff : 0x315470, 1);
      item.label.setColor(active ? '#ffffff' : '#a9c7da');
      item.arrow.setColor(active ? '#55e4ff' : '#8cb6cf');
    }
  }

  saveProfile() {
    this.registry.set('selectedCarId', this.selectedCarId);
    this.registry.set('ownedCarIds', this.ownedCarIds);
    saveSessionState(this.registry);

  }
}
