import { cars, carOrder } from '../data/cars.js?v=20260921-r29';
import { characters, characterOrder } from '../data/characters.js?v=20260921-r29';
import { meetBackgrounds } from '../data/meetAssets.js?v=20260921-r29';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const SIDE = { x: 1180, y: 92, w: 356, h: 724 };
const CARDS = { x: 24, y: 636, w: 1138, h: 180 };

const MODE_DATA = {
  SINGLE: {
    label: 'SINGLE RACE',
    types: ['Street Sprint', 'Standing Start', 'Roll Race'],
    distances: ['2.4 km', '3.2 km', '4.8 km'],
  },
  COMPETITION: {
    label: 'COMPETITION',
    types: ['Night Cup', 'Quarter Mile', 'Eliminator'],
    distances: ['1/4 mile', '5.0 km', '3 rounds'],
  },
};

export default class MeetScene extends Phaser.Scene {
  constructor() { super('MeetScene'); }

  preload() {
    characterOrder.forEach(id => {
      const character = characters[id];
      if (!this.textures.exists(character.visual.spriteKey)) {
        this.load.image(character.visual.spriteKey, character.visual.path + '?v=20260921-r29');
      }
    });

    meetBackgrounds.forEach(bg => {
      if (!this.textures.exists(bg.key)) {
        this.load.image(bg.key, bg.path + '?v=20260921-r29');
      }
    });
  }

  create() {
    document.body.dataset.scene = 'meet';
    this.scale.resize(1560, 840);

    this.selectedMode = 'SINGLE';
    this.offers = [];
    this.cardObjects = [];
    this.stageObjects = [];
    this.selectedOfferIndex = 0;
    this.nextRefreshAt = Date.now() + 180000;
    this.currentBackground = null;
    this.backgroundMaskShape = null;
    this.backgroundTint = null;

    this.drawBase();
    this.buildHeader();
    this.buildSidebar();
    this.buildBottomArea();
    this.rollOffers();

    // Let the visible Meet render first, then quietly fetch the rest of the
    // character/background library and the heavy race-control artwork.
    this.time.delayedCall(120, () => this.prefetchDeferredAssets());

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.updateRefreshTimer(),
    });
  }

  drawBase() {
    this.add.rectangle(780, 420, 1560, 840, 0x050912).setDepth(-30);

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

    this.stageMaskShape = this.make.graphics({ add: false });
    this.stageMaskShape.fillStyle(0xffffff, 1);
    this.stageMaskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    this.stageMask = this.stageMaskShape.createGeometryMask();
  }

  setMeetBackground(preferredKey = null) {
    if (this.currentBackground) this.currentBackground.destroy();
    if (this.backgroundMaskShape) this.backgroundMaskShape.destroy();
    if (this.backgroundTint) this.backgroundTint.destroy();

    const available = meetBackgrounds.filter(bg => this.textures.exists(bg.key));
    const bg = available.find(item => item.key === preferredKey)
      || Phaser.Utils.Array.GetRandom(available)
      || meetBackgrounds[0];
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

    this.backgroundTint = this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x03101b,
      0.035
    ).setDepth(-9);
  }

  buildHeader() {
    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.rectangle(154, 35, 236, 48, 0x0a1a2b, 1)
      .setStrokeStyle(2, 0x39d9ff, 1)
      .setDepth(41);

    this.add.text(154, 35, 'MEET', {
      fontFamily: PIXEL_FONT, fontSize: '20px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(42);

    this.locationText = this.add.text(300, 35, 'TOKYO // NIGHT MEET', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8bbde0'
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

  buildSidebar() {
    this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + SIDE.h / 2,
      SIDE.w,
      SIDE.h,
      0x07111d,
      0.98
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(35);

    this.add.text(SIDE.x + 20, SIDE.y + 18, 'RACE MODE', {
      fontFamily: PIXEL_FONT, fontSize: '14px', color: '#8cc8ec'
    }).setDepth(37);

    const buttons = [
      ['SINGLE RACE', 'SINGLE'],
      ['COMPETITION', 'COMPETITION'],
    ];

    this.modeButtons = [];
    buttons.forEach((row, i) => {
      const y = SIDE.y + 65 + i * 58;
      const box = this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        46,
        0x0b1724,
        1
      ).setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(37);

      const label = this.add.text(SIDE.x + 30, y, row[0], {
        fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a9c7da'
      }).setOrigin(0, 0.5).setDepth(38);

      this.add.text(SIDE.x + SIDE.w - 30, y, '>', {
        fontFamily: PIXEL_FONT, fontSize: '15px', color: '#8cb6cf'
      }).setOrigin(0.5).setDepth(38);

      box.on('pointerdown', () => {
        this.selectedMode = row[1];
        this.rollOffers();
      });

      this.modeButtons.push({ key: row[1], box, label });
    });

    this.add.text(SIDE.x + 20, SIDE.y + 228, 'RIVALS TONIGHT', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8cc8ec'
    }).setDepth(37);

    this.add.text(SIDE.x + SIDE.w - 20, SIDE.y + 228, '3', {
      fontFamily: PIXEL_FONT, fontSize: '13px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(37);

    this.add.text(SIDE.x + 20, SIDE.y + 268, 'NEXT REFRESH', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#7898ad'
    }).setDepth(37);

    this.refreshText = this.add.text(SIDE.x + SIDE.w - 20, SIDE.y + 268, '03:00', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#b7d6e8'
    }).setOrigin(1, 0).setDepth(37);

    this.selectedSummary = this.add.text(SIDE.x + 20, SIDE.y + 314, '', {
      fontFamily: BODY_FONT,
      fontSize: '18px',
      color: '#d8e7ef',
      lineSpacing: 5,
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(37);

    this.raceButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 548,
      SIDE.w - 36,
      48,
      0x0b2826,
      1
    ).setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(38);

    this.raceButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 536,
      'RACE  >',
      {
        fontFamily: PIXEL_FONT, fontSize: '13px', color: '#f1fffb'
      }
    ).setOrigin(0.5).setDepth(39);

    this.raceButton.on('pointerdown', () => this.startSelectedRace());

    this.workshopButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 612,
      SIDE.w - 36,
      48,
      0x24131a,
      1
    ).setStrokeStyle(2, 0xff6177, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(38);

    this.workshopButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 594,
      'WORKSHOP',
      {
        fontFamily: PIXEL_FONT, fontSize: '13px', color: '#ffdce1'
      }
    ).setOrigin(0.5).setDepth(39);

    this.workshopButton.on('pointerdown', () => this.scene.start('GarageScene'));
  }

  buildBottomArea() {
    this.add.text(CARDS.x + 18, CARDS.y + 10, 'RIVALS IN WANGAN', {
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#a7d5ef'
    }).setDepth(33);
  }

  rollOffers() {
    this.clearCardObjects();
    this.clearStageObjects();

    const firstRoll = !this.initialRollUsed && this.initialRivalIds?.length === 3;
    this.setMeetBackground(firstRoll ? this.initialBackgroundKey : null);

    const playerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
    let pool = firstRoll
      ? [...this.initialRivalIds]
      : characterOrder.filter(id =>
          id !== playerCharacterId &&
          id !== 'daichiSakamoto' &&
          this.textures.exists(characters[id]?.visual?.spriteKey)
        );
    Phaser.Utils.Array.Shuffle(pool);

    const rivalCars = carOrder.filter(
      id => id !== (this.registry.get('selectedCarId') || 'ae86')
    );
    Phaser.Utils.Array.Shuffle(rivalCars);

    const cfg = MODE_DATA[this.selectedMode];

    this.offers = pool.slice(0, 3).map((characterId, i) => {
      const character = characters[characterId];
      const carId = rivalCars[i % rivalCars.length];

      const skill = character.skill ?? {
        rating: 3,
        label: 'SKILLED',
        betRange: [5000, 10000],
        competitionPrize: 15000,
      };

      let raceDeal = 'PRIZE';
      let stake = skill.competitionPrize ?? 15000;

      if (this.selectedMode === 'SINGLE') {
        raceDeal = 'BET';
        const minBet = skill.betRange?.[0] ?? 5000;
        const maxBet = skill.betRange?.[1] ?? 10000;
        stake = Phaser.Math.Snap.To(Phaser.Math.Between(minBet, maxBet), 500);
      }

      return {
        characterId,
        carId,
        raceType: Phaser.Utils.Array.GetRandom(cfg.types),
        raceDeal,
        stake,
        distance: Phaser.Utils.Array.GetRandom(cfg.distances),
        quote: character.introQuote,
      };
    });

    this.selectedOfferIndex = 0;
    this.nextRefreshAt = Date.now() + 180000;
    this.initialRollUsed = true;

    this.drawStage();
    this.drawCards();
    this.updateModeButtons();
    this.selectOffer(0);
  }

  prefetchDeferredAssets() {
    const queueImage = (key, path) => {
      if (!this.textures.exists(key)) this.load.image(key, path);
    };

    characterOrder.forEach(id => {
      const character = characters[id];
      if (character) {
        queueImage(
          character.visual.spriteKey,
          character.visual.path + '?v=20260921-r29'
        );
      }
    });

    meetBackgrounds.forEach(bg => {
      queueImage(bg.key, bg.path + '?v=20260921-r29');
    });

    // These used to block the very first Workshop load. Fetch them while the
    // player is choosing a rival instead.
    queueImage('hudCluster', 'assets/Ui/hud_cluster.png');
    queueImage('dragTree', 'assets/Ui/drag_tree.png');
    queueImage('clutchPedal', 'assets/Controls/clutch_pedal.png');
    queueImage('throttlePedal', 'assets/Controls/throttle_pedal.png');
    queueImage('nosButton', 'assets/Controls/nos_button.png');
    queueImage('shifterNeutral', 'assets/Controls/shifter_neutral.png');
    queueImage('shifterDown', 'assets/Controls/shifter_down.png');

    if (this.load.list.size > 0) this.load.start();
  }

  clearCardObjects() {
    for (const obj of this.cardObjects) {
      if (obj?.destroy) obj.destroy();
    }
    this.cardObjects = [];
  }

  clearStageObjects() {
    for (const obj of this.stageObjects) {
      if (obj?.destroy) obj.destroy();
    }
    this.stageObjects = [];
  }

  drawStage() {
    const placements = [
      {
        // Left foreground anchor. Its body AND wheels stay above the middle car.
        carX: 225,
        carY: 414,
        carW: 590,
        carDepth: 30,
        carFlipX: false,
        charX: 125,
        charY: 556,
        charH: 246,
        charDepth: 34,
        charFlipX: false,
      },
      {
        // Middle rival is physically farther away: higher, smaller and behind.
        carX: 620,
        carY: 368,
        carW: 390,
        carDepth: 14,
        carFlipX: false,
        charX: 535,
        charY: 456,
        charH: 182,
        charDepth: 16,
        charFlipX: true,
      },
      {
        // Right foreground car remains close and clipped by the stage edge.
        carX: 1110,
        carY: 414,
        carW: 640,
        carDepth: 24,
        carFlipX: true,
        charX: 875,
        charY: 536,
        charH: 255,
        charDepth: 19,
        charFlipX: true,
      },
    ];

    this.offers.forEach((offer, i) => {
      const placement = placements[i];
      const car = cars[offer.carId];
      const character = characters[offer.characterId];

      const carObjects = this.createCarDisplay(
        car,
        placement.carX,
        placement.carY,
        placement.carW,
        placement.carDepth,
        placement.carFlipX
      );
      carObjects.forEach(obj => obj.setMask(this.stageMask));
      this.stageObjects.push(...carObjects);

      const sprite = this.add.image(
        placement.charX,
        placement.charY,
        character.visual.spriteKey
      ).setOrigin(0.5, 1)
        .setDepth(placement.charDepth)
        .setMask(this.stageMask);

      const charSource = this.textures.get(character.visual.spriteKey).getSourceImage();
      sprite.setScale(placement.charH / charSource.height);
      sprite.setFlipX(placement.charFlipX);
      this.stageObjects.push(sprite);

      const softShadow = this.add.ellipse(
        placement.charX + 5,
        placement.charY + 13,
        Math.max(54, sprite.displayWidth * 0.76),
        i === 0 ? 22 : 18,
        0x000000,
        0.34
      ).setDepth(placement.carDepth - 0.85)
        .setMask(this.stageMask);

      const contactShadow = this.add.ellipse(
        placement.charX,
        placement.charY + 8,
        Math.max(38, sprite.displayWidth * 0.52),
        i === 0 ? 11 : 9,
        0x000000,
        0.48
      ).setDepth(placement.carDepth - 0.75)
        .setMask(this.stageMask);

      this.stageObjects.push(softShadow, contactShadow);
    });
  }

  drawCards() {
    const xPositions = [215, 593, 971];
    const cardY = 742;

    this.offers.forEach((offer, i) => {
      const x = xPositions[i];
      const car = cars[offer.carId];
      const character = characters[offer.characterId];

      const card = this.add.rectangle(
        x,
        cardY,
        350,
        148,
        0x0a1521,
        0.99
      ).setStrokeStyle(2, 0x2e4a61, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(34);

      const portraitSize = 90;
      const portraitX = x - 122;
      const portraitY = cardY;

      const portraitBg = this.add.rectangle(
        portraitX,
        portraitY,
        portraitSize,
        portraitSize,
        0x0d1824,
        1
      ).setStrokeStyle(1, 0x315470, 1).setDepth(35);

      const source = this.textures.get(character.visual.spriteKey).getSourceImage();

      const portrait = this.add.image(
        portraitX,
        portraitY - 48,
        character.visual.spriteKey
      ).setDepth(36)
        .setOrigin(0.5, 0);

      // Scale by full-body height, then let the square mask reveal the
      // head/shoulders. This is more reliable on iOS than combining crop+mask.
      const portraitScale = 305 / source.height;
      portrait.setScale(portraitScale);

      const portraitMaskShape = this.make.graphics({ add: false });
      portraitMaskShape.fillStyle(0xffffff, 1);
      portraitMaskShape.fillRect(
        portraitX - portraitSize / 2,
        portraitY - portraitSize / 2,
        portraitSize,
        portraitSize
      );
      portrait.setMask(portraitMaskShape.createGeometryMask());

      const name = this.add.text(x - 54, cardY - 48, character.name.toUpperCase(), {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: '#ffffff'
      }).setDepth(35);

      const dealColor = offer.raceDeal === 'PINK SLIP' ? '#ff7894' : '#8fd2f5';
      const deal = this.add.text(x - 54, cardY - 20, offer.raceDeal, {
        fontFamily: PIXEL_FONT,
        fontSize: '10px',
        color: dealColor
      }).setDepth(35);

      const type = this.add.text(x - 54, cardY + 6, offer.raceType, {
        fontFamily: BODY_FONT,
        fontSize: '17px',
        color: '#d7e9f3',
        fontStyle: '600'
      }).setDepth(35);

      const quote = this.add.text(x - 54, cardY + 34, '"' + offer.quote + '"', {
        fontFamily: BODY_FONT,
        fontSize: '13px',
        color: '#9fb4c2',
        wordWrap: { width: 138 },
      }).setDepth(35);

      const stakeText = typeof offer.stake === 'number'
        ? '¥ ' + offer.stake.toLocaleString('en-US')
        : offer.stake;

      const footer = this.add.text(
        x + 160,
        cardY + 52,
        car.shortName + '  •  ' + offer.distance + '  •  ' + stakeText,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '10px',
          color: '#c5d9e6',
        }
      ).setOrigin(1, 0.5).setDepth(35);

      card.on('pointerdown', () => this.selectOffer(i));

      this.cardObjects.push(card, portraitBg, portrait, portraitMaskShape, name, deal, type, quote, footer);
      offer.card = card;
    });
  }

  selectOffer(index) {
    this.selectedOfferIndex = index;

    this.offers.forEach((offer, i) => {
      if (!offer.card) return;

      const active = i === index;
      offer.card.setFillStyle(active ? 0x10263a : 0x0a1521, 0.99);
      offer.card.setStrokeStyle(
        active ? 3 : 2,
        active ? 0x41dcff : 0x2e4a61,
        1
      );
    });

    const offer = this.offers[index];
    if (!offer) return;

    const character = characters[offer.characterId];
    const car = cars[offer.carId];

    const stakeText = typeof offer.stake === 'number'
      ? '¥ ' + offer.stake.toLocaleString('en-US')
      : offer.stake;

    const dealLine = this.selectedMode === 'SINGLE'
      ? 'BET  •  ' + stakeText
      : 'PRIZE  •  ' + stakeText;

    this.selectedSummary.setText(
      character.name + '\n' +
      character.archetype + '  •  ' + (character.skill?.label ?? 'SKILLED') + '\n\n' +
      dealLine + '\n' +
      car.shortName + '  •  ' + offer.raceType + '  •  ' + offer.distance
    );

    const cash = this.registry.get('cash') ?? 0;
    const affordable = this.selectedMode !== 'SINGLE' || cash >= Number(offer.stake || 0);

    if (affordable) {
      this.raceButton.setFillStyle(0x0b2826, 1)
        .setStrokeStyle(2, 0x62e8c7, 1)
        .setInteractive({ useHandCursor: true });
      this.raceButtonLabel.setColor('#f1fffb').setText(
        'RACE ' + character.name.split(' ')[0].toUpperCase() + '  >'
      );
    } else {
      this.raceButton.setFillStyle(0x25151a, 1)
        .setStrokeStyle(2, 0x8b4f5c, 1)
        .disableInteractive();
      this.raceButtonLabel.setColor('#c99aa4').setText('NEED ' + stakeText);
    }
  }

  updateModeButtons() {
    this.modeButtons.forEach(item => {
      const active = item.key === this.selectedMode;
      item.box.setFillStyle(active ? 0x10283b : 0x0b1724, 1);
      item.box.setStrokeStyle(
        active ? 2 : 1,
        active ? 0x43dfff : 0x315470,
        1
      );
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

    const cash = this.registry.get('cash') ?? 0;
    if (this.selectedMode === 'SINGLE' && cash < Number(offer.stake || 0)) return;

    this.registry.set('selectedOpponentCarId', offer.carId);
    this.registry.set('selectedOpponentCharacterId', offer.characterId);
    this.registry.set('selectedRaceCategory', this.selectedMode);
    this.registry.set('selectedRaceType', offer.raceType);
    this.registry.set('selectedRaceDeal', offer.raceDeal);
    this.registry.set('selectedRaceStake', offer.stake);

    this.scene.start('RaceScene');
  }

  createCarDisplay(car, x, y, targetWidth, depth, flipX = false) {
    const source = this.textures.get(car.visual.bodyKey).getSourceImage();
    const bodyScale = targetWidth / source.width;
    const ratio = car.visual.wheelScale / car.visual.bodyScale;
    const wheelScale = bodyScale * ratio * 1.16;
    const dir = flipX ? -1 : 1;

    const rearX = x + car.visual.rearOffsetX * bodyScale * dir;
    const frontX = x + car.visual.frontOffsetX * bodyScale * dir;
    const wheelY = y + car.visual.wheelOffsetY * bodyScale;

    const rearWheel = this.add.image(rearX, wheelY, car.visual.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const frontWheel = this.add.image(frontX, wheelY, car.visual.wheelKey)
      .setScale(wheelScale)
      .setDepth(depth);

    const rearBacking = this.add.circle(
      rearX,
      wheelY,
      Math.max(5, rearWheel.displayWidth * 0.50),
      0x030507,
      1
    ).setDepth(depth - 0.35);

    const frontBacking = this.add.circle(
      frontX,
      wheelY,
      Math.max(5, frontWheel.displayWidth * 0.50),
      0x030507,
      1
    ).setDepth(depth - 0.35);

    const shadowY = wheelY + Math.max(22, rearWheel.displayHeight * 0.62);

    const softShadow = this.add.ellipse(
      x + (flipX ? -8 : 8),
      shadowY + 5,
      Math.max(110, targetWidth * 0.88),
      Math.max(18, source.height * bodyScale * 0.20),
      0x000000,
      0.34
    ).setDepth(depth - 0.75);

    const contactShadow = this.add.ellipse(
      x,
      shadowY,
      Math.max(90, targetWidth * 0.72),
      Math.max(9, source.height * bodyScale * 0.10),
      0x000000,
      0.50
    ).setDepth(depth - 0.65);

    const body = this.add.image(x, y, car.visual.bodyKey)
      .setScale(bodyScale)
      .setFlipX(flipX)
      .setDepth(depth + 1);

    return [rearBacking, frontBacking, softShadow, contactShadow, rearWheel, frontWheel, body];
  }
}
