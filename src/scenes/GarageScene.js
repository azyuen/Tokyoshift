import { cars, carOrder } from '../data/cars.js?v=20260920-r6';

export default class GarageScene extends Phaser.Scene {
  constructor() { super('GarageScene'); }

  create() {
    this.selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    if (!cars[this.selectedCarId]) this.selectedCarId = 'ae86';

    this.drawGarage();

    this.add.text(780, 36, 'TOKYO SHIFT // GARAGE', {
      fontFamily: 'monospace', fontSize: '28px', color: '#eaf7ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.carName = this.add.text(780, 106, '', {
      fontFamily: 'monospace', fontSize: '25px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.carInfo = this.add.text(780, 139, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#a9bbd2', align: 'center'
    }).setOrigin(0.5, 0);

    this.selectedDisplay = [];
    this.thumbButtons = [];

    const xs = [145, 399, 653, 907, 1161, 1415];
    carOrder.forEach((id, i) => {
      const x = xs[i];
      const y = 600;
      const box = this.add.rectangle(x, y, 216, 124, 0x0d1625, 0.98)
        .setStrokeStyle(2, 0x35506f, 1)
        .setInteractive({ useHandCursor: true });

      const display = this.createCarDisplay(cars[id], x, y - 14, 178, 15);
      const label = this.add.text(x, y + 44, cars[id].shortName, {
        fontFamily: 'monospace', fontSize: '14px', color: '#dde8f7', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(18);

      box.on('pointerdown', () => this.selectCar(id));
      this.thumbButtons.push({ id, box, label, display });
    });

    this.raceButton = this.add.rectangle(1370, 86, 260, 66, 0x16324f, 0.98)
      .setStrokeStyle(3, 0x68e0ff, 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(1370, 77, 'RACE', {
      fontFamily: 'monospace', fontSize: '27px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(1370, 104, 'RANDOM RIVAL', {
      fontFamily: 'monospace', fontSize: '12px', color: '#96dff4'
    }).setOrigin(0.5);

    this.raceButton.on('pointerdown', () => {
      this.registry.set('selectedCarId', this.selectedCarId);
      this.scene.start('RaceScene');
    });

    this.selectCar(this.selectedCarId);
  }

  drawGarage() {
    const g = this.add.graphics();
    g.fillStyle(0x070b13, 1).fillRect(0, 0, 1560, 720);
    g.fillStyle(0x111827, 1).fillRect(38, 82, 1484, 380);
    g.fillStyle(0x0a101b, 1).fillRect(58, 102, 1444, 338);

    for (let i = 0; i < 12; i++) {
      const x = 82 + i * 120;
      const h = 125 + (i % 4) * 35;
      g.fillStyle(i % 2 ? 0x131d2c : 0x0f1725, 1).fillRect(x, 250 - h, 82, h);
      g.fillStyle(0x5edfff, 0.16).fillRect(x + 15, 145, 8, 42);
    }

    g.fillStyle(0x222c3d, 1).fillRect(0, 445, 1560, 275);
    g.fillStyle(0x111827, 1).fillRect(0, 505, 1560, 3);
    g.fillStyle(0x62dcff, 0.12).fillEllipse(780, 404, 760, 86);

    g.lineStyle(2, 0x33435b, 0.7);
    for (let x = 0; x < 1560; x += 130) {
      g.lineBetween(x, 720, 630 + (x - 780) * 0.22, 470);
    }
  }

  createCarDisplay(car, x, y, targetWidth, depth) {
    const source = this.textures.get(car.visual.bodyKey).getSourceImage();
    const bodyScale = targetWidth / source.width;
    const ratio = car.visual.wheelScale / car.visual.bodyScale;
    const wheelScale = bodyScale * ratio;

    const rearWheel = this.add.image(
      x + car.visual.rearOffsetX * bodyScale,
      y + car.visual.wheelOffsetY * bodyScale,
      car.visual.wheelKey
    ).setScale(wheelScale).setDepth(depth);

    const frontWheel = this.add.image(
      x + car.visual.frontOffsetX * bodyScale,
      y + car.visual.wheelOffsetY * bodyScale,
      car.visual.wheelKey
    ).setScale(wheelScale).setDepth(depth);

    const body = this.add.image(x, y, car.visual.bodyKey)
      .setScale(bodyScale)
      .setDepth(depth + 1);

    return [rearWheel, frontWheel, body];
  }

  selectCar(id) {
    this.selectedCarId = id;
    this.registry.set('selectedCarId', id);

    for (const obj of this.selectedDisplay) obj.destroy();
    this.selectedDisplay = this.createCarDisplay(cars[id], 780, 347, 680, 10);

    const car = cars[id];
    this.carName.setText(car.name);
    this.carInfo.setText(
      car.description + '\n' +
      car.vehicleMassKg + ' kg   •   grip ' + car.tyreGrip.toFixed(2) +
      '   •   max boost ' + car.maximumBoost.toFixed(2) + ' bar'
    );

    for (const item of this.thumbButtons) {
      const active = item.id === id;
      item.box.setFillStyle(active ? 0x17283f : 0x0d1625, 0.98);
      item.box.setStrokeStyle(active ? 3 : 2, active ? 0x70e4ff : 0x35506f, 1);
      item.label.setColor(active ? '#ffffff' : '#dde8f7');
    }
  }
}
