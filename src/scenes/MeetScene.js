import { cars, carOrder } from '../data/cars.js?v=20260921-r43';
import { characters, characterOrder } from '../data/characters.js?v=20260921-r43';
import { meetBackgrounds } from '../data/meetAssets.js?v=20260921-r43';
import { playMusic } from '../audio/MusicManager.js?v=20260921-r44';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

const STAGE = { x: 24, y: 92, w: 1138, h: 528 };
const GPS = { x: 1180, y: 92, w: 356, h: 220 };
const SIDE = { x: 1180, y: 330, w: 356, h: 486 };
const CARDS = { x: 24, y: 636, w: 1138, h: 180 };

const MODE_DATA = {
  SINGLE: {
    label: 'SINGLE RACE',
    types: ['Standing Start', 'Roll Race'],
    distances: ['1/4 mile'],
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
        this.load.image(character.visual.spriteKey, character.visual.path + '?v=20260921-r43');
      }
    });

    meetBackgrounds.forEach(bg => {
      if (!this.textures.exists(bg.key)) {
        this.load.image(bg.key, bg.path + '?v=20260921-r43');
      }
    });
  }

  create() {
    document.body.dataset.scene = 'meet';
    this.scale.resize(1560, 840);
    playMusic('meet');

    this.selectedMode = 'SINGLE';
    this.selectedDeal = 'CASH';
    this.refreshTransitioning = false;
    this.offers = [];
    this.cardObjects = [];
    this.stageObjects = [];
    this.selectedOfferIndex = 0;
    this.selectedDeal = 'CASH';
    this.nextRefreshAt = Date.now() + 180000;
    this.currentBackground = null;
    this.backgroundMaskShape = null;
    this.backgroundTint = null;

    this.drawBase();
    this.buildHeader();
    this.buildGpsPanel();
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

    this.add.text(52, 35, 'MEET', {
      fontFamily: PIXEL_FONT, fontSize: '20px', color: '#eefaff'
    }).setOrigin(0, 0.5).setDepth(42);

    this.locationText = this.add.text(235, 35, 'TOKYO // NIGHT MEET', {
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

  buildGpsPanel() {
    const panel = this.add.rectangle(
      GPS.x + GPS.w / 2,
      GPS.y + GPS.h / 2,
      GPS.w,
      GPS.h,
      0x07111d,
      0.98
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(35);

    this.add.text(GPS.x + 20, GPS.y + 16, 'GPS', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#8cc8ec'
    }).setDepth(37);

    this.add.text(GPS.x + GPS.w - 20, GPS.y + 17, 'WANGAN', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#6f8798'
    }).setOrigin(1, 0).setDepth(37);

    const route = this.add.graphics().setDepth(36);
    route.lineStyle(3, 0x2f91b8, 0.52);
    route.beginPath();
    route.moveTo(GPS.x + 88, GPS.y + 108);
    route.lineTo(GPS.x + 268, GPS.y + 108);
    route.strokePath();

    const nodes = [
      { x: GPS.x + 88, y: GPS.y + 108, label: '7-ELEVEN', active: true },
      { x: GPS.x + 268, y: GPS.y + 108, label: 'BRIDGE', active: false },
    ];

    nodes.forEach(node => {
      this.add.circle(
        node.x,
        node.y,
        node.active ? 8 : 6,
        node.active ? 0x42dfff : 0x253b4b,
        1
      ).setStrokeStyle(2, node.active ? 0xb8f3ff : 0x45647a, 0.9).setDepth(37);

      this.add.text(node.x, node.y + 18, node.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: node.active ? '#e8fbff' : '#829aaa',
      }).setOrigin(0.5, 0).setDepth(37);
    });

    this.districtButton = this.add.rectangle(
      GPS.x + GPS.w / 2,
      GPS.y + 184,
      GPS.w - 40,
      36,
      0x0b1724,
      0.96
    ).setStrokeStyle(1, 0x27475e, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(36);

    this.add.text(GPS.x + 28, GPS.y + 184, 'DISTRICT', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#718fa3'
    }).setOrigin(0, 0.5).setDepth(37);

    this.districtValueText = this.add.text(
      GPS.x + GPS.w - 28,
      GPS.y + 184,
      this.registry.get('district') || 'WANGAN',
      {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#65dfff'
      }
    ).setOrigin(1, 0.5).setDepth(37);

    this.districtButton.on('pointerdown', () => this.showDistrictPopup());
    this.gpsPanel = panel;
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
      fontFamily: PIXEL_FONT, fontSize: '12px', color: '#8cc8ec'
    }).setDepth(37);

    const buttons = [
      ['SINGLE RACE', 'SINGLE', false],
      ['COMPETITION // LOCKED', 'COMPETITION', true],
    ];

    this.modeButtons = [];
    buttons.forEach((row, i) => {
      const y = SIDE.y + 68 + i * 54;
      const locked = row[2];
      const box = this.add.rectangle(
        SIDE.x + SIDE.w / 2,
        y,
        SIDE.w - 36,
        42,
        locked ? 0x0a1017 : 0x0b1724,
        1
      ).setStrokeStyle(1, locked ? 0x29343d : 0x315470, 1)
        .setDepth(37);

      const label = this.add.text(SIDE.x + 24, y, row[0], {
        fontFamily: PIXEL_FONT, fontSize: locked ? '8px' : '10px',
        color: locked ? '#53626c' : '#a9c7da'
      }).setOrigin(0, 0.5).setDepth(38);

      const arrow = this.add.text(SIDE.x + SIDE.w - 28, y, locked ? '—' : '>', {
        fontFamily: PIXEL_FONT, fontSize: '11px', color: locked ? '#46525a' : '#8cb6cf'
      }).setOrigin(0.5).setDepth(38);

      if (!locked) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerdown', () => {
          this.selectedMode = row[1];
          this.selectedDeal = 'CASH';
          this.rollOffers();
        });
      }

      this.modeButtons.push({ key: row[1], box, label, arrow, locked });
    });

    this.add.text(SIDE.x + 20, SIDE.y + 184, 'SELECTED RIVAL', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#8cc8ec'
    }).setDepth(37);

    this.selectedSummary = this.add.text(SIDE.x + 20, SIDE.y + 214, '', {
      fontFamily: BODY_FONT,
      fontSize: '13px',
      color: '#d8e7ef',
      lineSpacing: 1,
      wordWrap: { width: SIDE.w - 40 },
    }).setDepth(37);

    this.add.text(SIDE.x + 20, SIDE.y + 292, 'STAKE', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#8cc8ec'
    }).setDepth(37);

    this.dealButtons = [];
    const deals = [
      { key: 'CASH', label: 'CASH BET', x: SIDE.x + 93 },
      { key: 'PINK', label: 'PINK SLIP', x: SIDE.x + 263 },
    ];

    deals.forEach(deal => {
      const box = this.add.rectangle(deal.x, SIDE.y + 330, 146, 40, 0x0b1724, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(37);
      const label = this.add.text(deal.x, SIDE.y + 330, deal.label, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: '#a9c7da'
      }).setOrigin(0.5).setDepth(38);
      box.on('pointerdown', () => this.setDeal(deal.key));
      this.dealButtons.push({ ...deal, box, label });
    });

    this.raceButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 400,
      SIDE.w - 36,
      42,
      0x0b2826,
      1
    ).setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(38);

    this.raceButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 400,
      'RACE  >',
      {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#f1fffb'
      }
    ).setOrigin(0.5).setDepth(39);

    this.raceButton.on('pointerdown', () => this.startSelectedRace());

    this.workshopButton = this.add.rectangle(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 454,
      SIDE.w - 36,
      42,
      0x24131a,
      1
    ).setStrokeStyle(2, 0xff6177, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(38);

    this.workshopButtonLabel = this.add.text(
      SIDE.x + SIDE.w / 2,
      SIDE.y + 454,
      'WORKSHOP',
      {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#ffdce1'
      }
    ).setOrigin(0.5).setDepth(39);

    this.workshopButton.on('pointerdown', () => this.scene.start('GarageScene'));
  }

  buildBottomArea() {
    this.add.text(CARDS.x + 18, CARDS.y + 10, 'RIVALS // WANGAN', {
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

    const ownedCars = this.registry.get('ownedCarIds') || [];
    const selectedCarId = this.registry.get('selectedCarId') || 'ae86';
    const usedRivalCars = new Set();

    const carBands = {
      1: ['ae86', 'ek9'],
      2: ['ae86', 'ek9', 'fc3s'],
      3: ['ek9', 'fc3s', 'evo3'],
      4: ['fc3s', 'evo3', 'wrx22b', 'r32'],
      5: ['evo3', 'wrx22b', 'r32'],
    };

    const chooseCarForSkill = rating => {
      const band = carBands[Phaser.Math.Clamp(Number(rating) || 3, 1, 5)] || carBands[3];

      const tiers = [
        band.filter(id => id !== selectedCarId && !ownedCars.includes(id) && !usedRivalCars.has(id)),
        band.filter(id => id !== selectedCarId && !usedRivalCars.has(id)),
        carOrder.filter(id => id !== selectedCarId && !ownedCars.includes(id) && !usedRivalCars.has(id)),
        carOrder.filter(id => id !== selectedCarId && !usedRivalCars.has(id)),
        carOrder.filter(id => id !== selectedCarId),
      ];

      const candidates = tiers.find(list => list.length) || ['ek9'];
      const id = Phaser.Utils.Array.GetRandom(candidates);
      usedRivalCars.add(id);
      return id;
    };

    const cfg = MODE_DATA[this.selectedMode];

    this.offers = pool.slice(0, 3).map((characterId, i) => {
      const character = characters[characterId];
      const carId = chooseCarForSkill(character?.skill?.rating);

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
          character.visual.path + '?v=20260921-r43'
        );
      }
    });

    meetBackgrounds.forEach(bg => {
      queueImage(bg.key, bg.path + '?v=20260921-r43');
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
        carY: 440,
        carW: 590,
        carDepth: 30,
        carFlipX: false,
        charX: 125,
        charY: 592,
        charH: 278,
        charDepth: 34,
        charFlipX: false,
      },
      {
        // Middle rival is physically farther away: higher, smaller and behind.
        carX: 620,
        carY: 394,
        carW: 390,
        carDepth: 14,
        carFlipX: false,
        charX: 535,
        charY: 482,
        charH: 182,
        charDepth: 16,
        charFlipX: true,
      },
      {
        // Right foreground car remains close and clipped by the stage edge.
        carX: 1110,
        carY: 456,
        carW: 705,
        carDepth: 24,
        carFlipX: true,
        charX: 875,
        charY: 548,
        charH: 248,
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
        placement.charX + 2,
        placement.charY - 12,
        Math.max(60, sprite.displayWidth * 0.78),
        i === 0 ? 30 : 26,
        0x000000,
        0.58
      ).setDepth(placement.charDepth - 0.12)
        .setMask(this.stageMask);

      const contactShadow = this.add.ellipse(
        placement.charX,
        placement.charY - 8,
        Math.max(44, sprite.displayWidth * 0.58),
        i === 0 ? 18 : 15,
        0x000000,
        0.84
      ).setDepth(placement.charDepth - 0.08)
        .setMask(this.stageMask);

      this.stageObjects.push(softShadow, contactShadow);
    });
  }

  drawCards() {
    const xPositions = [215, 593, 971];
    const cardY = 746;
    const cardH = 124;

    this.offers.forEach((offer, i) => {
      const x = xPositions[i];
      const character = characters[offer.characterId];

      const card = this.add.rectangle(
        x,
        cardY,
        350,
        cardH,
        0x0a1521,
        0.99
      ).setStrokeStyle(2, 0x2e4a61, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(34);

      const portraitSize = 104;
      const portraitX = x - 108;
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
        portraitY - 54,
        character.visual.spriteKey
      ).setDepth(36)
        .setOrigin(0.5, 0);

      portrait.setScale(405 / source.height);

      const portraitMaskShape = this.make.graphics({ add: false });
      portraitMaskShape.fillStyle(0xffffff, 1);
      portraitMaskShape.fillRect(
        portraitX - portraitSize / 2,
        portraitY - portraitSize / 2,
        portraitSize,
        portraitSize
      );
      portrait.setMask(portraitMaskShape.createGeometryMask());

      const stakeText = typeof offer.stake === 'number'
        ? '¥ ' + offer.stake.toLocaleString('en-US')
        : offer.stake;
      const dealText = this.selectedMode === 'SINGLE' ? 'BET' : 'PRIZE';
      const textX = x - 42;

      const name = this.add.text(textX, cardY - 44, character.name.toUpperCase(), {
        fontFamily: PIXEL_FONT,
        fontSize: '9px',
        color: '#ffffff'
      }).setDepth(35);

      const deal = this.add.text(x + 160, cardY - 44, dealText, {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: this.selectedMode === 'SINGLE' ? '#8fd2f5' : '#8fe7ff',
      }).setOrigin(1, 0).setDepth(35);

      const quote = this.add.text(textX, cardY - 14, '"' + offer.quote + '"', {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#9fb4c2',
        wordWrap: { width: 214 },
        lineSpacing: 1,
      }).setDepth(35);

      card.on('pointerdown', () => this.selectOffer(i));

      this.cardObjects.push(
        card,
        portraitBg,
        portrait,
        portraitMaskShape,
        name,
        deal,
        quote
      );
      offer.card = card;
    });
  }

  setDeal(key) {
    this.selectedDeal = key === 'PINK' ? 'PINK' : 'CASH';
    this.updateDealButtons();
    this.selectOffer(this.selectedOfferIndex);
  }

  updateDealButtons() {
    this.dealButtons?.forEach(item => {
      const active = item.key === this.selectedDeal;
      item.box.setFillStyle(active ? (item.key === 'PINK' ? 0x341623 : 0x10283b) : 0x0b1724, 1);
      item.box.setStrokeStyle(2, active ? (item.key === 'PINK' ? 0xff5f93 : 0x43dfff) : 0x315470, 1);
      item.label.setColor(active ? '#ffffff' : '#a9c7da');
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
    const playerCar = cars[this.registry.get('selectedCarId') || 'ae86'];

    const stakeText = typeof offer.stake === 'number'
      ? '¥ ' + offer.stake.toLocaleString('en-US')
      : offer.stake;

    const dealLine = this.selectedDeal === 'PINK'
      ? 'PINK SLIP  •  ' + playerCar.shortName + ' vs ' + car.shortName
      : 'BET  •  ' + stakeText;

    this.selectedSummary.setText(
      (character.skill?.label ?? 'SKILLED') + '\n' +
      car.shortName + '  •  ' + offer.raceType + '\n' +
      offer.distance + '  •  ' + dealLine
    );

    this.updateDealButtons();

    const cash = this.registry.get('cash') ?? 0;
    const affordable = this.selectedDeal === 'PINK' || cash >= Number(offer.stake || 0);

    if (affordable) {
      this.raceButton.setFillStyle(this.selectedDeal === 'PINK' ? 0x32151f : 0x0b2826, 1)
        .setStrokeStyle(2, this.selectedDeal === 'PINK' ? 0xff5f93 : 0x62e8c7, 1)
        .setInteractive({ useHandCursor: true });
      this.raceButtonLabel.setColor('#f1fffb').setText(
        (this.selectedDeal === 'PINK' ? 'PINK SLIP // ' : 'RACE ') +
        character.name.split(' ')[0].toUpperCase() + '  >'
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
      if (item.locked) {
        item.box.setFillStyle(0x0a1017, 1).setStrokeStyle(1, 0x29343d, 1);
        item.label.setColor('#53626c');
        item.arrow?.setColor('#46525a');
        return;
      }

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
    if (Date.now() >= this.nextRefreshAt) this.refreshOffersWithTransition();
  }

  refreshOffersWithTransition() {
    if (this.refreshTransitioning) return;
    this.refreshTransitioning = true;

    const stageVeil = this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x02050b,
      1
    ).setDepth(78).setAlpha(0);

    const cardVeil = this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      CARDS.y + CARDS.h / 2,
      CARDS.w,
      CARDS.h,
      0x02050b,
      1
    ).setDepth(78).setAlpha(0);

    this.tweens.add({
      targets: [stageVeil, cardVeil],
      alpha: 1,
      duration: 320,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.rollOffers();

        const noteBg = this.add.rectangle(
          STAGE.x + STAGE.w - 200,
          STAGE.y + 32,
          370,
          44,
          0x07111d,
          0.94
        ).setStrokeStyle(1, 0x4bdcff, 0.8).setDepth(84);

        const note = this.add.text(
          STAGE.x + STAGE.w - 24,
          STAGE.y + 32,
          '15 MINUTES LATER // NEW RACERS',
          {
            fontFamily: PIXEL_FONT,
            fontSize: '8px',
            color: '#dff8ff',
          }
        ).setOrigin(1, 0.5).setDepth(85);

        this.tweens.add({
          targets: [stageVeil, cardVeil],
          alpha: 0,
          duration: 420,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            stageVeil.destroy();
            cardVeil.destroy();
            this.refreshTransitioning = false;
          },
        });

        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: [noteBg, note],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              noteBg.destroy();
              note.destroy();
            },
          });
        });
      },
    });
  }

  showDistrictPopup() {
    if (this.districtPopup?.active) return;

    const depth = 90;
    const blocker = this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.58)
      .setDepth(depth)
      .setInteractive();

    const panel = this.add.rectangle(780, 420, 640, 280, 0x08131f, 0.99)
      .setStrokeStyle(2, 0x46d7ff, 0.9)
      .setDepth(depth + 1);

    const title = this.add.text(780, 330, 'DISTRICT SELECT', {
      fontFamily: PIXEL_FONT, fontSize: '15px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(depth + 2);

    const current = this.add.text(780, 402, 'WANGAN  //  CURRENT DISTRICT', {
      fontFamily: PIXEL_FONT, fontSize: '10px', color: '#65dfff'
    }).setOrigin(0.5).setDepth(depth + 2);

    const future = this.add.text(780, 448, 'MORE DISTRICTS UNLOCK LATER', {
      fontFamily: BODY_FONT, fontSize: '14px', color: '#788f9f'
    }).setOrigin(0.5).setDepth(depth + 2);

    const close = this.add.rectangle(780, 506, 190, 38, 0x102338, 1)
      .setStrokeStyle(1, 0x4caed7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2);

    const closeText = this.add.text(780, 506, 'CLOSE', {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: '#eefaff'
    }).setOrigin(0.5).setDepth(depth + 3);

    const objects = [blocker, panel, title, current, future, close, closeText];
    const dismiss = () => {
      objects.forEach(obj => obj.destroy());
      this.districtPopup = null;
    };

    blocker.on('pointerdown', dismiss);
    close.on('pointerdown', dismiss);
    this.districtPopup = panel;
  }

  startSelectedRace() {
    const offer = this.offers[this.selectedOfferIndex];
    if (!offer) return;

    const cash = this.registry.get('cash') ?? 0;
    if (this.selectedDeal === 'CASH' && cash < Number(offer.stake || 0)) return;

    this.registry.set('selectedOpponentCarId', offer.carId);
    this.registry.set('selectedOpponentCharacterId', offer.characterId);
    this.registry.set('selectedRaceCategory', this.selectedMode);
    this.registry.set('selectedRaceType', offer.raceType);
    this.registry.set('selectedRaceDeal', this.selectedDeal === 'PINK' ? 'PINK_SLIP' : 'BET');
    this.registry.set('selectedRaceStake', this.selectedDeal === 'PINK' ? 0 : offer.stake);

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

    // Ground contact: place the ellipse low enough that only its upper edge
    // overlaps the lower portion of the tyres.
    const shadowY = wheelY + Math.max(16, rearWheel.displayHeight * 0.42);

    const softShadow = this.add.ellipse(
      x + (flipX ? -4 : 4),
      shadowY,
      Math.max(112, targetWidth * 0.88),
      Math.max(20, rearWheel.displayHeight * 0.34),
      0x000000,
      0.64
    ).setDepth(depth - 0.12);

    const contactShadow = this.add.ellipse(
      x,
      shadowY - 1,
      Math.max(92, targetWidth * 0.72),
      Math.max(10, rearWheel.displayHeight * 0.18),
      0x000000,
      0.88
    ).setDepth(depth - 0.08);

    const body = this.add.image(x, y, car.visual.bodyKey)
      .setScale(bodyScale)
      .setFlipX(flipX)
      .setDepth(depth + 1);

    return [rearBacking, frontBacking, softShadow, contactShadow, rearWheel, frontWheel, body];
  }
}
