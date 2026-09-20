import { cars, carOrder } from '../data/cars.js?v=20260920-r12';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

export default class GarageScene extends Phaser.Scene {
  constructor() { super('GarageScene'); }

  create() {
    this.selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    if (!cars[this.selectedCarId]) this.selectedCarId = 'ae86';

    this.selectedDisplay = [];
    this.thumbButtons = [];
    this.upgradeButtons = [];
    this.selectedUpgrade = 'ENGINE';

    this.drawScene();
    this.buildHeader();
    this.buildCarLabel();
    this.buildSpecsAndUpgrades();
    this.buildGarageStrip();
    this.buildRaceButton();

    this.selectCar(this.selectedCarId);
    this.selectUpgrade('ENGINE');
  }

  drawScene() {
    this.add.rectangle(780, 360, 1560, 720, 0x050a11).setDepth(-20);

    // Workshop artwork is a replaceable full-screen layer. Preserve the source
    // aspect ratio and crop only what falls outside the game canvas.
    const workshop = this.add.image(780, 360, 'garageWorkshopBg').setDepth(-10);
    const source = this.textures.get('garageWorkshopBg').getSourceImage();
    const coverScale = Math.max(1560 / source.width, 720 / source.height);
    workshop.setScale(coverScale);

    // Very light tint keeps the UI readable without flattening the artwork.
    this.add.rectangle(780, 360, 1560, 720, 0x03101b, 0.08).setDepth(-9);

    this.add.image(300, 532, 'garageCharacterLeft')
      .setOrigin(0.5, 1)
      .setScale(1.02)
      .setDepth(4);

    this.add.image(1030, 534, 'garageCharacterRight')
      .setOrigin(0.5, 1)
      .setScale(1.02)
      .setDepth(4);
  }

  buildHeader() {
    this.add.rectangle(780, 34, 1560, 68, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.rectangle(142, 34, 250, 48, 0x0a1a2b, 1)
      .setStrokeStyle(2, 0x39d9ff, 1)
      .setDepth(41);
    this.add.text(142, 34, 'WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '21px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(42);

    this.add.text(307, 34, 'TUNE   >   UPGRADE   >   RACE', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#8bbde0'
    }).setOrigin(0, 0.5).setDepth(42);

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const cash = this.registry.get('cash') ?? 25000;

    this.add.text(1080, 24, 'WINS', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#85a6be'
    }).setOrigin(1, 0.5).setDepth(42);
    this.add.text(1093, 24, String(wins), {
      fontFamily: PIXEL_FONT, fontSize: '17px', color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(42);

    this.add.text(1080, 46, 'LOSSES', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#85a6be'
    }).setOrigin(1, 0.5).setDepth(42);
    this.add.text(1093, 46, String(losses), {
      fontFamily: PIXEL_FONT, fontSize: '17px', color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(42);

    this.add.rectangle(1435, 34, 210, 48, 0x0b1623, 1)
      .setStrokeStyle(1, 0x274963, 1)
      .setDepth(41);
    this.add.text(1530, 34, '¥ ' + Number(cash).toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '17px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(42);
  }

  buildCarLabel() {
    this.add.rectangle(193, 509, 346, 72, 0x07111d, 0.94)
      .setStrokeStyle(1, 0x26465e, 1)
      .setDepth(31);

    this.carNameText = this.add.text(34, 492, '', {
      fontFamily: PIXEL_FONT, fontSize: '17px', color: '#ffffff'
    }).setDepth(32);

    this.carSubText = this.add.text(34, 520, '', {
      fontFamily: BODY_FONT, fontSize: '17px', color: '#79bce3', fontStyle: '600'
    }).setDepth(32);
  }

  buildSpecsAndUpgrades() {
    this.add.rectangle(1386, 340, 326, 536, 0x07111d, 0.98)
      .setStrokeStyle(2, 0x17354d, 1)
      .setDepth(35);

    this.add.text(1242, 88, 'CAR SPECS', {
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
      const y = 127 + i * 38;
      this.add.line(1385, y + 19, 1250, 0, 1520, 0, 0x27465d, 0.8).setDepth(36);
      this.add.text(1250, y, row[0], {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#9cc6df'
      }).setOrigin(0, 0.5).setDepth(37);
      this.specValueTexts[row[1]] = this.add.text(1522, y, '', {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#ffffff'
      }).setOrigin(1, 0.5).setDepth(37);
    });

    this.add.text(1242, 290, 'UPGRADES', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#8cc8ec'
    }).setDepth(37);

    const categories = ['ENGINE', 'TURBO', 'TIRES', 'SUSPENSION', 'GEARBOX', 'NITROUS', 'COSMETICS'];
    categories.forEach((name, i) => {
      const y = 329 + i * 43;
      const box = this.add.rectangle(1385, y, 286, 37, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(37);

      const label = this.add.text(1262, y, name, {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#a9c7da'
      }).setOrigin(0, 0.5).setDepth(38);

      const arrow = this.add.text(1512, y, '>', {
        fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cb6cf'
      }).setOrigin(0.5).setDepth(38);

      box.on('pointerdown', () => this.selectUpgrade(name));
      this.upgradeButtons.push({ name, box, label, arrow });
    });

    this.upgradeHint = this.add.text(1242, 625, '', {
      fontFamily: BODY_FONT, fontSize: '14px', color: '#6e91a9'
    }).setDepth(38);
  }

  buildGarageStrip() {
    this.add.rectangle(612, 635, 1206, 150, 0x07111d, 0.99)
      .setStrokeStyle(2, 0x17354d, 1)
      .setDepth(30);

    this.add.rectangle(158, 568, 280, 28, 0x0a1724, 1)
      .setStrokeStyle(1, 0x2c536e, 1)
      .setDepth(31);

    this.add.text(31, 568, 'MY GARAGE', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
    }).setOrigin(0, 0.5).setDepth(32);

    this.garageCountText = this.add.text(272, 568, '', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#7fa6bd'
    }).setOrigin(1, 0.5).setDepth(32);

    const startX = 109;
    const gap = 194;

    carOrder.forEach((id, i) => {
      const x = startX + i * gap;
      const y = 635;

      const box = this.add.rectangle(x, y, 178, 112, 0x0b1724, 1)
        .setStrokeStyle(2, 0x29465c, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(32);

      const display = this.createCarDisplay(cars[id], x, y - 8, 142, 34);

      const label = this.add.text(x, y + 42, cars[id].shortName, {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#b8cad7'
      }).setOrigin(0.5).setDepth(36);

      box.on('pointerdown', () => this.selectCar(id));
      this.thumbButtons.push({ id, box, label, display });
    });

    this.garageCountText.setText(carOrder.length + ' CARS');
  }

  buildRaceButton() {
    const button = this.add.rectangle(1385, 677, 306, 54, 0x0c2827, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);

    this.add.text(1385, 677, 'RACE  >', {
      fontFamily: PIXEL_FONT, fontSize: '17px', color: '#f1fffb'
    }).setOrigin(0.5).setDepth(41);

    button.on('pointerdown', () => {
      this.registry.set('selectedCarId', this.selectedCarId);
      this.saveProfile();
      this.scene.start('RaceScene');
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

    // Match the race screen: black wheel-arch backing prevents the workshop
    // background showing through the open rims/arches.
    const rearWheelBacking = this.add.circle(
      rearX, wheelY, Math.max(5, rearWheel.displayWidth * 0.50), 0x030507, 1
    ).setDepth(depth - 0.35);

    const frontWheelBacking = this.add.circle(
      frontX, wheelY, Math.max(5, frontWheel.displayWidth * 0.50), 0x030507, 1
    ).setDepth(depth - 0.35);

    const roadShadow = this.add.ellipse(
      x,
      y + Math.max(12, source.height * bodyScale * 0.38),
      Math.max(72, targetWidth * 0.78),
      Math.max(7, source.height * bodyScale * 0.11),
      0x000000,
      0.30
    ).setDepth(depth - 0.6);

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
    this.selectedDisplay = this.createCarDisplay(cars[id], 665, 444, 480, 10);

    const car = cars[id];
    this.carNameText.setText(car.name.toUpperCase());
    this.carSubText.setText(car.shortName + '  //  SELECTED CAR');

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
    this.upgradeHint.setText(name + ' selected  //  parts slot ready');
  }

  saveProfile() {
    try {
      localStorage.setItem('tokyoShiftProfile', JSON.stringify({
        selectedCarId: this.selectedCarId,
        wins: this.registry.get('wins') ?? 0,
        losses: this.registry.get('losses') ?? 0,
        cash: this.registry.get('cash') ?? 25000,
      }));
    } catch (e) {
      // Storage can be unavailable in some private-browser contexts.
    }
  }
}
