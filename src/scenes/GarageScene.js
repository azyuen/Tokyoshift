import { cars, carOrder } from '../data/cars.js?v=20260921-r38';
import { characters } from '../data/characters.js?v=20260921-r38';

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

    this.selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    if (!cars[this.selectedCarId]) this.selectedCarId = 'ae86';

    this.selectedDisplay = [];
    this.thumbButtons = [];
    this.upgradeButtons = [];
    this.selectedUpgrade = 'ENGINE';

    this.drawScene();
    this.buildHeader();
    this.buildSpecsAndUpgrades();
    this.buildGarageStrip();
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
    this.addGarageCharacter(characters.renMizuno, 282, 558, 350, 14);
  }

  addGarageCharacter(character, x, feetY, targetHeight, depth) {
    const sprite = this.add.image(x, feetY, character.visual.spriteKey)
      .setOrigin(0.5, 1)
      .setDepth(depth);

    const source = this.textures.get(character.visual.spriteKey).getSourceImage();
    sprite.setScale(targetHeight / source.height);

    this.add.ellipse(
      x,
      feetY - 8,
      Math.max(60, sprite.displayWidth * 0.80),
      18,
      0x000000,
      0.60
    ).setDepth(depth - 0.12);

    this.add.ellipse(
      x,
      feetY - 6,
      Math.max(44, sprite.displayWidth * 0.60),
      10,
      0x000000,
      0.86
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

    this.headerCarText = this.add.text(250, 35, '', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#8bbde0'
    }).setOrigin(0, 0.5).setDepth(42);

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const cash = this.registry.get('cash') ?? 25000;

    this.add.text(1105, 25, 'WINS  ' + wins, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);
    this.add.text(1105, 47, 'LOSSES  ' + losses, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);

    this.add.text(1512, 35, '¥ ' + Number(cash).toLocaleString('en-US'), {
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

    this.add.text(SIDE.x + 20, SIDE.y + 198, 'TUNING', {
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

    const cardW = 170;
    const gap = 14;
    const startX = STRIP.x + 15 + cardW / 2;

    carOrder.forEach((id, i) => {
      const x = startX + i * (cardW + gap);
      const y = STRIP.y + 100;

      const box = this.add.rectangle(x, y, cardW, 112, 0x0b1724, 1)
        .setStrokeStyle(2, 0x29465c, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(32);

      const display = this.createCarDisplay(cars[id], x, y - 9, 132, 34);

      const label = this.add.text(x, y + 38, cars[id].shortName, {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b8cad7'
      }).setOrigin(0.5).setDepth(36);

      box.on('pointerdown', () => this.selectCar(id));
      this.thumbButtons.push({ id, box, label, display });
    });

    this.garageCountText.setText(carOrder.length + ' CARS');
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
      this.scene.start('MeetScene');
    });
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
      wheelY + Math.max(4, rearWheel.displayHeight * 0.12),
      Math.max(128, targetWidth * 0.96),
      Math.max(16, source.height * bodyScale * 0.14),
      0x000000,
      0.82
    ).setDepth(depth - 0.12);

    const body = this.add.image(x, y, car.visual.bodyKey)
      .setScale(bodyScale)
      .setDepth(depth + 1);

    return [rearWheelBacking, frontWheelBacking, roadShadow, rearWheel, frontWheel, body];
  }

  selectCar(id) {
    if (!cars[id]) return;

    this.selectedCarId = id;
    this.registry.set('selectedCarId', id);

    for (const obj of this.selectedDisplay) obj.destroy();

    // Larger hero car inside the now-contained workshop viewport.
    this.selectedDisplay = this.createCarDisplay(cars[id], 708, 386, 690, 10);

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
    try {
      localStorage.setItem('tokyoShiftProfile', JSON.stringify({
        selectedCarId: this.selectedCarId,
        wins: this.registry.get('wins') ?? 0,
        losses: this.registry.get('losses') ?? 0,
        cash: this.registry.get('cash') ?? 25000,
        playerCharacterId: this.registry.get('playerCharacterId') || 'renMizuno',
      }));
    } catch (e) {
      // Storage can be unavailable in some private-browser contexts.
    }
  }
}
