import { cars, carOrder } from '../data/cars.js?v=20260921-r20';
import { characters, characterOrder } from '../data/characters.js?v=20260921-r20';
import { meetBackgrounds } from '../data/meetAssets.js?v=20260921-r20';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 30, y: 84, w: 1120, h: 420 };
const SIDE = { x: 1176, y: 84, w: 354, h: 520 };
const CARDS = { x: 30, y: 522, w: 1120, h: 168 };

const CATEGORY_DATA = {
  CHALLENGES: {
    types: ['Street Sprint', 'Standing Start', 'Roll Race'],
    stakes: [2500, 5000, 7500, 10000],
    distances: ['2.4 km', '3.2 km', '4.8 km'],
  },
  COMPETITIONS: {
    types: ['Night Cup', 'Quarter Mile', 'Eliminator'],
    stakes: [10000, 15000, 20000],
    distances: ['1/4 mile', '5.0 km', '3 rounds'],
  },
  PINK_SLIP: {
    types: ['Pink Slip', 'Winner Takes Car'],
    stakes: ['CAR', 'CAR'],
    distances: ['1/4 mile', '3.2 km'],
  },
  BET_RACE: {
    types: ['Cash Run', 'High Stakes', 'Double Down'],
    stakes: [10000, 25000, 50000],
    distances: ['2.8 km', '4.0 km', '1/4 mile'],
  },
};

export default class MeetScene extends Phaser.Scene {
  constructor() { super('MeetScene'); }

  preload() {
    characterOrder.forEach(id => {
      const character = characters[id];
      if (!this.textures.exists(character.visual.spriteKey)) {
        this.load.image(
          character.visual.spriteKey,
          character.visual.path + '?v=20260921-r20'
        );
      }
    });

    meetBackgrounds.forEach(bg => {
      if (!this.textures.exists(bg.key)) {
        this.load.image(bg.key, bg.path + '?v=20260921-r20');
      }
    });
  }

  create() {
    this.selectedCategory = 'CHALLENGES';
    this.offers = [];
    this.offerObjects = [];
    this.selectedOfferIndex = 0;
    this.nextRefreshAt = Date.now() + 180000;
    this.currentBackground = null;
    this.backgroundMaskShape = null;

    this.drawBase();
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

  drawBase() {
    this.add.rectangle(780, 360, 1560, 720, 0x050912).setDepth(-30);

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x08121d,
      1
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(-15);

    this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      CARDS.y + CARDS.h / 2,
      CARDS.w,
      CARDS.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);
  }

  setMeetBackground() {
    if (this.currentBackground) this.currentBackground.destroy();
    if (this.backgroundMaskShape) this.backgroundMaskShape.destroy();

    const bg = Phaser.Utils.Array.GetRandom(meetBackgrounds);
    const image = this.add.image(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      bg.key
    ).setDepth(-10);

    const source = this.textures.get(bg.key).getSourceImage();
    const coverScale = Math.max(STAGE.w / source.width, STAGE.h / source.height);
    image.setScale(coverScale);

    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    image.setMask(maskShape.createGeometryMask());

    this.currentBackground = image;
    this.backgroundMaskShape = maskShape;
    this.locationText.setText(bg.label);

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x03101b,
      0.08
    ).setDepth(-9);
  }

  buildHeader() {
    this.add.rectangle(780, 42, 1500, 52, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.rectangle(150, 42, 220, 40, 0x0a1a2b, 1)
      .setStrokeStyle(2, 0x39d9ff, 1)
      .setDepth(41);
    this.add.text(150, 42, 'MEET', {
      fontFamily: PIXEL_FONT, fontSize: '18px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(42);

    this.locationText = this.add.text(286, 42, 'TOKYO // NIGHT MEET', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8bbde0'
    }).setOrigin(0, 0.5).setDepth(42);

    const wins = this.registry.get('wins') ?? 0;
    const losses = this.registry.get('losses') ?? 0;
    const cash = this.registry.get('cash') ?? 25000;

    this.add.text(1095, 32, 'WINS  ' + wins, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);
    this.add.text(1095, 51, 'LOSSES  ' + losses, {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b4ccdb'
    }).setOrigin(1, 0.5).setDepth(42);

    this.add.text(1505, 42, '¥ ' + Number(cash).toLocaleString('en-US'), {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#ffe08a'
    }).setOrigin(1, 0.5).setDepth(42);
  }

  buildSidebar() {
    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      0.98
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(35);

    this.add.text(SIDE.x + 20, SIDE.y + 18, 'RACE TYPE', {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cc8ec'
    }).setDepth(37);

    const buttons = [
      ['CHALLENGES', 'CHALLENGES'],
      ['COMPETITIONS', 'COMPETITIONS'],
      ['PINK SLIP', 'PINK_SLIP'],
      ['BET RACE', 'BET_RACE'],
    ];

    this.categoryButtons = [];
    buttons.forEach((row, i) => {
      const y = SIDE.y + 62 + i * 52;
      const box = this.add.rectangle(SIDE.x + SIDE.w / 2, y, SIDE.w - 36, 42, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(37);

      const label = this.add.text(SIDE.x + 30, y, row[0], {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#a9c7da'
      }).setOrigin(0, 0.5).setDepth(38);

      this.add.text(SIDE.x + SIDE.w - 30, y, '>', {
        fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cb6cf'
      }).setOrigin(0.5).setDepth(38);

      box.on('pointerdown', () => {
        this.selectedCategory = row[1];
        this.rollOffers();
      });

      this.categoryButtons.push({ key: row[1], box, label });
    });

    this.add.text(SIDE.x + 20, SIDE.y + 286, 'RIVALS TONIGHT', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8cc8ec'
    }).setDepth(37);

    this.rivalCountText = this.add.text(SIDE.x + SIDE.w - 20, SIDE.y + 286, '3', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(37);

    this.add.text(SIDE.x + 20, SIDE.y + 322, 'NEXT REFRESH', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#7898ad'
    }).setDepth(37);

    this.refreshText = this.add.text(SIDE.x + SIDE.w - 20, SIDE.y + 322, '03:00', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b7d6e8'
    }).setOrigin(1, 0).setDepth(37);

    this.selectedSummary = this.add.text(SIDE.x + 20, SIDE.y + 360, '', {
      fontFamily: BODY_FONT,
      fontSize: '16px',
      color: '#d8e7ef',
      lineSpacing: 5,
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(37);

    this.raceButton = this.add.rectangle(SIDE.x + SIDE.w / 2, SIDE.y + 486, SIDE.w - 36, 48, 0x0b2826, 1)
      .setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(38);

    this.raceButtonLabel = this.add.text(SIDE.x + SIDE.w / 2, SIDE.y + 486, 'RACE  >', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#f1fffb'
    }).setOrigin(0.5).setDepth(39);

    this.raceButton.on('pointerdown', () => this.startSelectedRace());
  }

  buildBottomArea() {
    this.add.text(CARDS.x + 18, CARDS.y + 12, 'RIVALS IN WANGAN', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
    }).setDepth(33);

    const back = this.add.rectangle(130, 686, 196, 34, 0x24131a, 0.98)
      .setStrokeStyle(2, 0xff6177, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);
    this.add.text(130, 686, 'WORKSHOP', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffdce1'
    }).setOrigin(0.5).setDepth(41);
    back.on('pointerdown', () => this.scene.start('GarageScene'));

    const refresh = this.add.rectangle(1052, 686, 196, 34, 0x0b1724, 0.98)
      .setStrokeStyle(1, 0x315470, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);
    this.add.text(1052, 686, 'REFRESH', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#b7d6e8'
    }).setOrigin(0.5).setDepth(41);
    refresh.on('pointerdown', () => this.rollOffers());
  }

  rollOffers() {
    this.clearOfferObjects();
    this.setMeetBackground();

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
    const xPositions = [210, 590, 970];

    this.offers.forEach((offer, i) => {
      const x = xPositions[i];
      const car = cars[offer.carId];
      const character = characters[offer.characterId];

      const carObjects = this.createCarDisplay(car, x + 45, 403, 285, 10);
      this.offerObjects.push(...carObjects);

      const charSprite = this.add.image(x - 112, 485, character.visual.spriteKey)
        .setOrigin(0.5, 1)
        .setDepth(14);
      const charSource = this.textures.get(character.visual.spriteKey).getSourceImage();
      charSprite.setScale(145 / charSource.height);
      this.offerObjects.push(charSprite);

      const shadow = this.add.ellipse(
        x - 112, 482,
        Math.max(28, charSprite.displayWidth * 0.52), 8,
        0x000000, 0.27
      ).setDepth(13);
      this.offerObjects.push(shadow);

      const cardY = 603;
      const card = this.add.rectangle(x, cardY, 350, 116, 0x0a1521, 0.99)
        .setStrokeStyle(2, 0x2e4a61, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(34);

      const name = this.add.text(x - 158, cardY - 43, character.name.toUpperCase(), {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#ffffff'
      }).setDepth(35);

      const type = this.add.text(x - 158, cardY - 17, offer.raceType, {
        fontFamily: BODY_FONT, fontSize: '17px', color: '#8fd2f5', fontStyle: '600'
      }).setDepth(35);

      const quote = this.add.text(x - 158, cardY + 8, '"' + offer.quote + '"', {
        fontFamily: BODY_FONT, fontSize: '14px', color: '#a9bbc8',
        wordWrap: { width: 210 },
      }).setDepth(35);

      const stakeText = typeof offer.stake === 'number'
        ? '¥ ' + offer.stake.toLocaleString('en-US')
        : offer.stake;

      const footer = this.add.text(
        x + 158,
        cardY + 43,
        car.shortName + '  •  ' + offer.distance + '  •  ' + stakeText,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '9px',
          color: '#c5d9e6',
        }
      ).setOrigin(1, 0.5).setDepth(35);

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
      x,
      wheelY + Math.max(6, rearWheel.displayHeight * 0.25),
      Math.max(70, targetWidth * 0.78),
      Math.max(7, source.height * bodyScale * 0.10),
      0x000000,
      0.32
    ).setDepth(depth - 0.6);

    const body = this.add.image(x, y, car.visual.bodyKey)
      .setScale(bodyScale).setDepth(depth + 1);

    return [rearBacking, frontBacking, shadow, rearWheel, frontWheel, body];
  }
}
