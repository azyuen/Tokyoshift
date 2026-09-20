import { cars, carOrder } from '../data/cars.js?v=20260921-r18';
import { characters, characterOrder } from '../data/characters.js?v=20260921-r18';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const CATEGORY_DATA = {
  CHALLENGES: {
    label: 'CHALLENGES',
    types: ['Street Sprint', 'Standing Start', 'Roll Race'],
    stakes: [2500, 5000, 7500, 10000],
    distances: ['2.4 km', '3.2 km', '4.8 km'],
  },
  COMPETITIONS: {
    label: 'COMPETITIONS',
    types: ['Night Cup', 'Quarter Mile', 'Eliminator'],
    stakes: [10000, 15000, 20000],
    distances: ['1/4 mile', '5.0 km', '3 rounds'],
  },
  PINK_SLIP: {
    label: 'PINK SLIP',
    types: ['Pink Slip', 'Winner Takes Car'],
    stakes: ['CAR', 'CAR'],
    distances: ['1/4 mile', '3.2 km'],
  },
  BET_RACE: {
    label: 'BET RACE',
    types: ['Cash Run', 'High Stakes', 'Double Down'],
    stakes: [10000, 25000, 50000],
    distances: ['2.8 km', '4.0 km', '1/4 mile'],
  },
};

export default class MeetScene extends Phaser.Scene {
  constructor() { super('MeetScene'); }

  preload() {
    // The workshop already loads Ren + Daichi. Load the remaining character
    // library here so the meet scene does not make initial boot unnecessarily heavy.
    characterOrder.forEach(id => {
      const character = characters[id];
      if (!this.textures.exists(character.visual.spriteKey)) {
        this.load.image(
          character.visual.spriteKey,
          character.visual.path + '?v=20260921-r18'
        );
      }
    });
  }

  create() {
    this.selectedCategory = 'CHALLENGES';
    this.offers = [];
    this.offerObjects = [];
    this.selectedOfferIndex = 0;
    this.nextRefreshAt = Date.now() + 180000;

    this.drawBackdrop();
    this.buildHeader();
    this.buildSidebar();
    this.buildBottomArea();
    this.rollOffers();

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.updateRefreshTimer(),
    });
  }

  drawBackdrop() {
    this.add.rectangle(780, 360, 1560, 720, 0x050912).setDepth(-20);

    const g = this.add.graphics().setDepth(-10);

    // Night sky + distant city.
    g.fillStyle(0x07111f, 1).fillRect(0, 62, 1210, 450);
    const buildings = [
      [20, 155, 110, 240], [145, 115, 120, 280], [280, 180, 92, 215],
      [385, 125, 145, 270], [545, 165, 102, 230], [662, 105, 155, 290],
      [832, 150, 108, 245], [952, 118, 145, 277], [1110, 175, 92, 220],
    ];
    buildings.forEach((b, i) => {
      g.fillStyle(i % 2 ? 0x0b1b2c : 0x0e2134, 1).fillRect(b[0], b[1], b[2], b[3]);
      for (let wx = b[0] + 14; wx < b[0] + b[2] - 8; wx += 24) {
        for (let wy = b[1] + 20; wy < b[1] + b[3] - 14; wy += 31) {
          const lit = ((wx + wy + i * 17) % 5) < 2;
          if (lit) g.fillStyle((wy % 3) ? 0x6fc9e8 : 0xe1b05b, 0.55).fillRect(wx, wy, 5, 7);
        }
      }
    });

    // Elevated road and underpass structure.
    g.fillStyle(0x151c25, 1).fillRect(0, 116, 1210, 43);
    g.fillStyle(0x25303a, 1).fillRect(0, 155, 1210, 8);
    g.fillStyle(0x11171e, 1).fillRect(0, 175, 1210, 52);
    g.fillStyle(0x2b3540, 1).fillRect(0, 220, 1210, 6);

    [95, 430, 785, 1110].forEach(x => {
      g.fillStyle(0x252d35, 1).fillRect(x, 62, 50, 355);
      g.fillStyle(0x313a43, 1).fillRect(x + 5, 62, 6, 355);
    });

    // Warm lamps.
    [225, 590, 945].forEach(x => {
      g.fillStyle(0x322919, 1).fillRect(x - 2, 168, 4, 21);
      g.fillStyle(0xf0c46c, 0.95).fillRect(x - 18, 188, 36, 6);
      g.fillStyle(0xf0c46c, 0.12).fillCircle(x, 197, 52);
    });

    // Fence / crowd line.
    g.fillStyle(0x0a0d12, 0.80).fillRect(0, 326, 1210, 48);
    g.lineStyle(2, 0x394957, 0.55);
    for (let x = 0; x < 1210; x += 28) {
      g.lineBetween(x, 326, x + 34, 374);
      g.lineBetween(x + 34, 326, x, 374);
    }

    // Wet road.
    g.fillStyle(0x131820, 1).fillRect(0, 374, 1210, 138);
    g.fillStyle(0x252f39, 1).fillRect(0, 488, 1210, 3);
    g.fillStyle(0xe5edf3, 0.16).fillRect(0, 438, 1210, 3);
    for (let x = 20; x < 1200; x += 150) {
      g.fillStyle(0x68d9ff, 0.06).fillRect(x, 382, 55, 110);
      g.fillStyle(0xff4b62, 0.045).fillRect(x + 55, 382, 35, 110);
    }

    // Background label.
    this.add.text(46, 103, 'TOKYO // NIGHT MEET', {
      fontFamily: PIXEL_FONT, fontSize: '16px', color: '#9eb6c7'
    }).setDepth(-5);
  }

  buildHeader() {
    this.add.rectangle(780, 32, 1560, 64, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.rectangle(130, 32, 220, 46, 0x0a1a2b, 1)
      .setStrokeStyle(2, 0x39d9ff, 1)
      .setDepth(41);
    this.add.text(130, 32, 'MEET', {
      fontFamily: PIXEL_FONT, fontSize: '21px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(42);

    this.add.text(270, 32, 'TOKYO   >   NIGHT MEET   >   SHIBUYA', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#8bbde0'
    }).setOrigin(0, 0.5).setDepth(42);

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const cash = this.registry.get('cash') ?? 25000;

    this.add.text(1110, 22, 'WINS ' + wins, {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#9ab7ca'
    }).setOrigin(1, 0.5).setDepth(42);
    this.add.text(1110, 43, 'LOSSES ' + losses, {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#9ab7ca'
    }).setOrigin(1, 0.5).setDepth(42);

    this.add.text(1518, 32, '¥ ' + Number(cash).toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '17px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(42);
  }

  buildSidebar() {
    this.add.rectangle(1382, 320, 334, 500, 0x07111d, 0.98)
      .setStrokeStyle(2, 0x17354d, 1)
      .setDepth(35);

    this.add.text(1235, 86, 'RACE TYPE', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#8cc8ec'
    }).setDepth(37);

    const buttons = [
      ['CHALLENGES', 'CHALLENGES'],
      ['COMPETITIONS', 'COMPETITIONS'],
      ['PINK SLIP', 'PINK_SLIP'],
      ['BET RACE', 'BET_RACE'],
    ];

    this.categoryButtons = [];
    buttons.forEach((row, i) => {
      const y = 128 + i * 53;
      const box = this.add.rectangle(1382, y, 294, 42, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(37);
      const label = this.add.text(1253, y, row[0], {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#a9c7da'
      }).setOrigin(0, 0.5).setDepth(38);
      this.add.text(1510, y, '>', {
        fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cb6cf'
      }).setOrigin(0.5).setDepth(38);

      box.on('pointerdown', () => {
        this.selectedCategory = row[1];
        this.rollOffers();
      });
      this.categoryButtons.push({ key: row[1], box, label });
    });

    this.add.text(1235, 355, 'RIVALS TONIGHT', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8cc8ec'
    }).setDepth(37);

    this.rivalCountText = this.add.text(1510, 355, '3', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(37);

    this.add.text(1235, 394, 'NEXT REFRESH', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#6f91a8'
    }).setDepth(37);

    this.refreshText = this.add.text(1510, 394, '03:00', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#b7d6e8'
    }).setOrigin(1, 0).setDepth(37);

    this.selectedSummary = this.add.text(1235, 438, '', {
      fontFamily: BODY_FONT,
      fontSize: '16px',
      color: '#d8e7ef',
      lineSpacing: 5,
      wordWrap: { width: 270 },
    }).setDepth(37);

    this.raceButton = this.add.rectangle(1382, 523, 294, 52, 0x0b2826, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(38);
    this.raceButtonLabel = this.add.text(1382, 523, 'RACE  >', {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#f1fffb'
    }).setOrigin(0.5).setDepth(39);

    this.raceButton.on('pointerdown', () => this.startSelectedRace());
  }

  buildBottomArea() {
    this.add.rectangle(606, 617, 1208, 158, 0x07111d, 0.99)
      .setStrokeStyle(2, 0x17354d, 1)
      .setDepth(30);

    this.add.text(28, 548, 'RIVALS IN SHIBUYA', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
    }).setDepth(33);

    const back = this.add.rectangle(112, 692, 180, 42, 0x24131a, 0.98)
      .setStrokeStyle(2, 0xff6177, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);
    this.add.text(112, 692, 'WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#ffdce1'
    }).setOrigin(0.5).setDepth(41);
    back.on('pointerdown', () => this.scene.start('GarageScene'));

    const refresh = this.add.rectangle(1096, 692, 170, 42, 0x0b1724, 0.98)
      .setStrokeStyle(1, 0x315470, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);
    this.add.text(1096, 692, 'REFRESH', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#b7d6e8'
    }).setOrigin(0.5).setDepth(41);
    refresh.on('pointerdown', () => this.rollOffers());
  }

  rollOffers() {
    this.clearOfferObjects();

    const playerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
    const pool = characterOrder.filter(id =>
      id !== playerCharacterId && id !== 'daichiSakamoto'
    );
    Phaser.Utils.Array.Shuffle(pool);

    const rivalCars = carOrder.filter(id => id !== (this.registry.get('selectedCarId') || 'ae86'));
    Phaser.Utils.Array.Shuffle(rivalCars);

    const cfg = CATEGORY_DATA[this.selectedCategory];
    this.offers = pool.slice(0, 3).map((characterId, i) => {
      const character = characters[characterId];
      const carId = rivalCars[i % rivalCars.length];
      return {
        characterId,
        carId,
        raceType: Phaser.Utils.Array.GetRandom(cfg.types),
        stake: Phaser.Utils.Array.GetRandom(cfg.stakes),
        distance: Phaser.Utils.Array.GetRandom(cfg.distances),
        quote: character.introQuote,
      };
    });

    this.selectedOfferIndex = 0;
    this.nextRefreshAt = Date.now() + 180000;
    this.drawOffers();
    this.updateCategoryButtons();
    this.selectOffer(0);
  }

  clearOfferObjects() {
    for (const obj of this.offerObjects) {
      if (obj?.destroy) obj.destroy();
    }
    this.offerObjects = [];
  }

  drawOffers() {
    const xPositions = [210, 600, 990];
    const carY = 425;
    const characterXOffset = -122;

    this.offers.forEach((offer, i) => {
      const x = xPositions[i];
      const car = cars[offer.carId];
      const character = characters[offer.characterId];

      const carObjects = this.createCarDisplay(car, x + 35, carY, 300, 10);
      this.offerObjects.push(...carObjects);

      const charSprite = this.add.image(x + characterXOffset, 472, character.visual.spriteKey)
        .setOrigin(0.5, 1)
        .setDepth(14);
      const charSource = this.textures.get(character.visual.spriteKey).getSourceImage();
      charSprite.setScale(155 / charSource.height);
      this.offerObjects.push(charSprite);

      const shadow = this.add.ellipse(
        x + characterXOffset, 470,
        Math.max(30, charSprite.displayWidth * 0.55), 9,
        0x000000, 0.28
      ).setDepth(13);
      this.offerObjects.push(shadow);

      const cardY = 616;
      const card = this.add.rectangle(x, cardY, 360, 116, 0x0a1521, 0.99)
        .setStrokeStyle(2, 0x2e4a61, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(34);

      const name = this.add.text(x - 164, cardY - 42, character.name.toUpperCase(), {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#ffffff'
      }).setDepth(35);

      const type = this.add.text(x - 164, cardY - 16, offer.raceType, {
        fontFamily: BODY_FONT, fontSize: '17px', color: '#8fd2f5', fontStyle: '600'
      }).setDepth(35);

      const quote = this.add.text(x - 164, cardY + 9, '"' + offer.quote + '"', {
        fontFamily: BODY_FONT, fontSize: '13px', color: '#9eb2c2',
        wordWrap: { width: 220 },
      }).setDepth(35);

      const stakeText = typeof offer.stake === 'number'
        ? '¥ ' + offer.stake.toLocaleString('en-US')
        : offer.stake;

      const footer = this.add.text(x + 160, cardY + 40,
        car.shortName + '   •   ' + offer.distance + '   •   ' + stakeText, {
          fontFamily: PIXEL_FONT, fontSize: '8px', color: '#c5d9e6'
        }).setOrigin(1, 0.5).setDepth(35);

      card.on('pointerdown', () => this.selectOffer(i));

      this.offerObjects.push(card, name, type, quote, footer);
      offer.card = card;
    });
  }

  selectOffer(index) {
    this.selectedOfferIndex = index;

    this.offers.forEach((offer, i) => {
      if (!offer.card) return;
      const active = i === index;
      offer.card.setFillStyle(active ? 0x10263a : 0x0a1521, 0.99);
      offer.card.setStrokeStyle(active ? 3 : 2, active ? 0x41dcff : 0x2e4a61, 1);
    });

    const offer = this.offers[index];
    if (!offer) return;

    const character = characters[offer.characterId];
    const car = cars[offer.carId];
    const stakeText = typeof offer.stake === 'number'
      ? '¥ ' + offer.stake.toLocaleString('en-US')
      : offer.stake;

    this.selectedSummary.setText(
      character.name + '\n' +
      character.archetype + '\n\n' +
      car.shortName + '  •  ' + offer.raceType + '\n' +
      offer.distance + '  •  ' + stakeText
    );

    this.raceButtonLabel.setText('RACE ' + character.name.split(' ')[0].toUpperCase() + '  >');
  }

  updateCategoryButtons() {
    this.categoryButtons.forEach(item => {
      const active = item.key === this.selectedCategory;
      item.box.setFillStyle(active ? 0x10283b : 0x0b1724, 1);
      item.box.setStrokeStyle(active ? 2 : 1, active ? 0x43dfff : 0x315470, 1);
      item.label.setColor(active ? '#ffffff' : '#a9c7da');
    });
  }

  updateRefreshTimer() {
    const remaining = Math.max(0, this.nextRefreshAt - Date.now());
    if (remaining <= 0) {
      this.rollOffers();
      return;
    }
    const totalSeconds = Math.ceil(remaining / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    this.refreshText.setText(
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0')
    );
  }

  startSelectedRace() {
    const offer = this.offers[this.selectedOfferIndex];
    if (!offer) return;

    this.registry.set('selectedOpponentCarId', offer.carId);
    this.registry.set('selectedOpponentCharacterId', offer.characterId);
    this.registry.set('selectedRaceCategory', this.selectedCategory);
    this.registry.set('selectedRaceType', offer.raceType);
    this.registry.set('selectedRaceStake', offer.stake);

    this.scene.start('RaceScene');
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
      .setScale(wheelScale).setDepth(depth);
    const frontWheel = this.add.image(frontX, wheelY, car.visual.wheelKey)
      .setScale(wheelScale).setDepth(depth);

    const rearBacking = this.add.circle(
      rearX, wheelY, Math.max(5, rearWheel.displayWidth * 0.50), 0x030507, 1
    ).setDepth(depth - 0.35);
    const frontBacking = this.add.circle(
      frontX, wheelY, Math.max(5, frontWheel.displayWidth * 0.50), 0x030507, 1
    ).setDepth(depth - 0.35);

    const shadow = this.add.ellipse(
      x, wheelY + Math.max(6, rearWheel.displayHeight * 0.25),
      Math.max(70, targetWidth * 0.78),
      Math.max(7, source.height * bodyScale * 0.10),
      0x000000, 0.32
    ).setDepth(depth - 0.6);

    const body = this.add.image(x, y, car.visual.bodyKey)
      .setScale(bodyScale).setDepth(depth + 1);

    return [rearBacking, frontBacking, shadow, rearWheel, frontWheel, body];
  }
}
