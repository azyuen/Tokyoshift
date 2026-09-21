import { cars, carOrder } from '../data/cars.js?v=20260921-r43';
import { characters } from '../data/characters.js?v=20260921-r43';
import { saveManualState, saveSessionState } from '../state/GameState.js?v=20260921-r49';
import { getMeetLocation } from '../data/meetAssets.js?v=20260921-r49';
import { showTravelMap } from '../ui/TravelMap.js?v=20260921-r49';
import { playMusic } from '../audio/MusicManager.js?v=20260921-r44';

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

    this.ownedCarIds = (this.registry.get('ownedCarIds') || ['ae86']).filter(id => cars[id]);
    if (!this.ownedCarIds.length) this.ownedCarIds = ['ae86'];

    this.selectedCarId = this.registry.get('selectedCarId') || this.ownedCarIds[0];
    if (!cars[this.selectedCarId] || !this.ownedCarIds.includes(this.selectedCarId)) {
      this.selectedCarId = this.ownedCarIds[0];
    }
    this.registry.set('ownedCarIds', this.ownedCarIds);
    this.registry.set('selectedCarId', this.selectedCarId);

    this.selectedDisplay = [];
    this.thumbButtons = [];
    this.upgradeButtons = [];
    this.selectedUpgrade = 'ENGINE';

    this.drawScene();
    this.buildHeader();
    this.buildSpecsAndUpgrades();
    this.buildGarageStrip();
    this.buildSaveButton();
    this.buildMeetButton();

    this.selectCar(this.selectedCarId);
    this.selectUpgrade('ENGINE');
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
      0.06
    ).setDepth(-9);

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
      const y = SIDE.y + 58 + i * 32;
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

    this.add.text(SIDE.x + 20, SIDE.y + 198, 'TUNING // STOCK', {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cc8ec'
    }).setDepth(37);

    const categories = ['ENGINE', 'TURBO', 'TIRES', 'SUSPENSION', 'GEARBOX', 'NITROUS', 'COSMETICS'];
    categories.forEach((name, i) => {
      const y = SIDE.y + 250 + i * 46;
      const box = this.add.rectangle(SIDE.x + SIDE.w / 2, y, SIDE.w - 36, 40, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(37);

      const label = this.add.text(SIDE.x + 30, y, name, {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#a9c7da'
      }).setOrigin(0, 0.5).setDepth(38);

      const arrow = this.add.text(SIDE.x + SIDE.w - 30, y, '>', {
        fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cb6cf'
      }).setOrigin(0.5).setDepth(38);

      box.on('pointerdown', () => this.selectUpgrade(name));
      this.upgradeButtons.push({ name, box, label, arrow });
    });

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

    this.add.text(STRIP.x + 18, STRIP.y + 14, 'MY GARAGE', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
    }).setDepth(32);

    this.garageCountText = this.add.text(STRIP.x + STRIP.w - 18, STRIP.y + 14, '', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#7fa6bd'
    }).setOrigin(1, 0).setDepth(32);

    const slotCount = 6;
    const cardW = 170;
    const gap = 14;
    const startX = STRIP.x + 15 + cardW / 2;

    for (let i = 0; i < slotCount; i++) {
      const id = this.ownedCarIds[i] || null;
      const x = startX + i * (cardW + gap);
      const y = STRIP.y + 100;

      const box = this.add.rectangle(x, y, cardW, 112, id ? 0x0b1724 : 0x07101a, 1)
        .setStrokeStyle(2, id ? 0x29465c : 0x1d3445, id ? 1 : 0.78)
        .setDepth(32);

      if (!id) {
        this.add.text(x, y - 8, 'EMPTY SLOT', {
          fontFamily: PIXEL_FONT, fontSize: '9px', color: '#526d7e'
        }).setOrigin(0.5).setDepth(34);
        this.add.text(x, y + 24, 'WIN ON PINK SLIP', {
          fontFamily: PIXEL_FONT, fontSize: '6px', color: '#3f5665'
        }).setOrigin(0.5).setDepth(34);
        continue;
      }

      box.setInteractive({ useHandCursor: true });
      const thumbWheelBottomY = this.getWheelBottomY(cars.ae86, y - 9, 132);
      const thumbBodyY = this.getBodyYForWheelBottom(cars[id], 132, thumbWheelBottomY);
      const display = this.createCarDisplay(cars[id], x, thumbBodyY, 132, 34);

      const label = this.add.text(x, y + 38, cars[id].shortName, {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b8cad7'
      }).setOrigin(0.5).setDepth(36);

      box.on('pointerdown', () => this.selectCar(id));
      this.thumbButtons.push({ id, box, label, display });
    }

    this.garageCountText.setText(this.ownedCarIds.length + ' / ' + slotCount + ' CARS');
  }

  buildSaveButton() {
    const button = this.add.rectangle(SIDE.x + SIDE.w / 2, 716, SIDE.w - 32, 42, 0x102138, 1)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    const label = this.add.text(SIDE.x + SIDE.w / 2, 716, 'SAVE GAME', {
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
    const button = this.add.rectangle(SIDE.x + SIDE.w / 2, 770, SIDE.w - 32, 42, 0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    this.add.text(SIDE.x + SIDE.w / 2, 770, 'GO TO MEET  >', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#f1fffb'
    }).setOrigin(0.5).setDepth(41);

    button.on('pointerdown', () => {
      this.registry.set('selectedCarId', this.selectedCarId);
      this.saveProfile();

      showTravelMap(this, {
        currentLocationId: this.registry.get('meetLocation') || 'wangan7eleven',
        title: 'DRIVE TO MEET',
        actionVerb: 'GO TO MEET',
        allowCurrentAction: true,
        onTravel: (locationId, cost) => {
          const cash = Number(this.registry.get('cash') || 0);
          if (cash < cost) return;

          const destination = getMeetLocation(locationId);
          this.registry.set('cash', cash - cost);
          this.registry.set('meetLocation', locationId);
          this.registry.set('district', destination.district);
          this.registry.set('selectedCarId', this.selectedCarId);
          saveSessionState(this.registry);

          this.cashText?.setText('¥ ' + Number(cash - cost).toLocaleString('en-US'));
          this.scene.start('MeetScene');
        },
      });
    });
  }

  getWheelBottomY(car, bodyY, targetWidth) {
    const bodySource = this.textures.get(car.visual.bodyKey).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / bodySource.width;
    const wheelScale = bodyScale * (car.visual.wheelScale / car.visual.bodyScale) * 1.16;
    const wheelRadius = wheelSource.height * wheelScale * 0.5;
    const wheelCenterY = bodyY + car.visual.wheelOffsetY * bodyScale;
    return wheelCenterY + wheelRadius;
  }

  getBodyYForWheelBottom(car, targetWidth, wheelBottomY) {
    const bodySource = this.textures.get(car.visual.bodyKey).getSourceImage();
    const wheelSource = this.textures.get(car.visual.wheelKey).getSourceImage();
    const bodyScale = targetWidth / bodySource.width;
    const wheelScale = bodyScale * (car.visual.wheelScale / car.visual.bodyScale) * 1.16;
    const wheelRadius = wheelSource.height * wheelScale * 0.5;
    return wheelBottomY - wheelRadius - car.visual.wheelOffsetY * bodyScale;
  }

  createCarDisplay(car, x, y, targetWidth, depth) {
    const source = this.textures.get(car.visual.bodyKey).getSourceImage();
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

    const body = this.add.image(x, y, car.visual.bodyKey)
      .setScale(bodyScale)
      .setDepth(depth + 1);

    return [rearWheelBacking, frontWheelBacking, roadShadow, rearWheel, frontWheel, body];
  }

  selectCar(id) {
    if (!cars[id] || !this.ownedCarIds.includes(id)) return;

    this.selectedCarId = id;
    this.registry.set('selectedCarId', id);

    for (const obj of this.selectedDisplay) obj.destroy();

    // Anchor every selected car to the same lowest wheel point so swapping cars
    // never makes them jump vertically. AE86 defines the current visual baseline.
    const heroWheelBottomY = this.getWheelBottomY(cars.ae86, 386, 690);
    const heroBodyY = this.getBodyYForWheelBottom(cars[id], 690, heroWheelBottomY);
    this.selectedDisplay = this.createCarDisplay(cars[id], 708, heroBodyY, 690, 10);

    const car = cars[id];
    this.headerCarText.setText(car.name.toUpperCase());

    this.specValueTexts.engine.setText(car.engineModel || '—');
    this.specValueTexts.power.setText((car.powerKW ?? '—') + ' kW');
    this.specValueTexts.torque.setText((car.torqueNm ?? '—') + ' Nm');
    this.specValueTexts.weight.setText(car.vehicleMassKg + ' kg');

    for (const item of this.thumbButtons) {
      const active = item.id === id;
      item.box.setFillStyle(active ? 0x10263a : 0x0b1724, 1);
      item.box.setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x29465c, 1);
      item.label.setColor(active ? '#ffffff' : '#b8cad7');
    }

    this.saveProfile();
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
