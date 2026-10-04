import { cars } from '../data/cars.js?v=20261005-r342';
import {
  characters,
  getCharacterAssetUrl,
} from '../data/characters.js?v=20261004-r333';
import {
  CREW_REGIONS,
} from '../data/crewRoster.js?v=20261005-r341';
import {
  getCrewMembers,
  getCrewCount,
  isCrewComplete,
  removeCrewMember,
  isCrewUnlocked,
  getCrewBattleWinCount,
  areAllCrewBattlesComplete,
} from '../data/crewSystem.js?v=20261005-r342';
import {
  saveSessionState,
} from '../state/GameState.js?v=20261005-r342';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import {
  getCarBodyTextureKey,
  createCarBodyLayers,
  getCarPaintColor,
  preloadCarAppearanceAssets,
  preloadCarWheel,
  ensureDerivedModularCarTextures,
  getCarBodyScaleForWidth,
} from '../vehicles/CarAppearance.js?v=20260929-r246';
import {
  createVisualModLayers,
  getVisualModWheelVisual,
  preloadVisualModSelectionAssets,
} from '../data/visualMods.js?v=20261004-r333';
import {
  getWheelPairFit,
  getWheelContactOffsetY,
} from '../vehicles/WheelFit.js?v=20260929-r258';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20260922-r128';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const STAGE = { x: 24, y: 92, w: 1512, h: 520 };
const CARDS = { x: 24, y: 628, w: 1512, h: 188 };

function regionLabel(regionId) {
  return String(regionId || '').replace(/_/g, ' ');
}

export default class CrewScene extends Phaser.Scene {
  constructor() {
    super('CrewScene');
  }

  preload() {
    let queued = 0;
    const queueImage = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
      queued += 1;
    };

    queueImage('crewSpaceDayBg', 'assets/Garage/shinonome_crewspace_day.png?v=20261005-r342');
    queueImage('crewSpaceNightBg', 'assets/Garage/shinonome_crewspace_night.png?v=20261005-r342');

    const members = getCrewMembers(this.registry);
    const carStates = this.registry.get('carStates') || {};

    Object.values(members).forEach(member => {
      const character = characters[member.characterId];
      const car = cars[member.loanCarId];
      if (character?.visual) {
        queueImage(character.visual.spriteKey, getCharacterAssetUrl(character.visual.path));
      }
      if (car) {
        queued += preloadCarAppearanceAssets(this, { [member.loanCarId]: car }, '20261005-r342');
        queued += preloadCarWheel(this, car, carStates[member.loanCarId] || {});
        queued += preloadVisualModSelectionAssets(
          this,
          member.loanCarId,
          carStates[member.loanCarId] || {},
          '20261005-r342'
        );
      }
    });

    const playerCharacterId = this.registry.get('playerCharacterId') || 'renMizuno';
    const player = characters[playerCharacterId];
    if (player?.visual) {
      queueImage(player.visual.spriteKey, getCharacterAssetUrl(player.visual.path));
    }

    startSceneLoading(this, 'LOADING CREW SPACE', queued);
  }

  create() {
    document.body.dataset.scene = 'crew';
    this.scale.resize(1560, 840);
    playMusic('workshop');

    if (!isCrewUnlocked(this.registry)) {
      this.scene.start('GarageScene');
      return;
    }

    const members = getCrewMembers(this.registry);
    ensureDerivedModularCarTextures(
      this,
      Object.fromEntries(
        Object.values(members)
          .filter(member => cars[member.loanCarId])
          .map(member => [member.loanCarId, cars[member.loanCarId]])
      )
    );

    this.worldPhase = getWorldPhase();
    this.selectedRegionId =
      CREW_REGIONS.find(regionId => members[regionId]) || CREW_REGIONS[0];
    this.contentObjects = [];
    this.carObjects = [];

    this.drawShell();
    this.render();

    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => this.syncWorldPhase(),
    });

    finishSceneLoading('CREW SPACE');
  }

  drawShell() {
    this.add.rectangle(780, 420, 1560, 840, 0x050a11).setDepth(-20);

    this.add.rectangle(780, 35, 1512, 62, 0x07111d, 1)
      .setStrokeStyle(2, 0x173249, 1)
      .setDepth(40);

    this.add.text(52, 35, 'CREW MEETING SPACE', {
      fontFamily: PIXEL_FONT,
      fontSize: '19px',
      color: '#eefaff',
    }).setOrigin(0, 0.5).setDepth(42);

    this.headerStatus = this.add.text(1510, 35, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#8fe7ff',
    }).setOrigin(1, 0.5).setDepth(42);

    this.add.rectangle(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      STAGE.w,
      STAGE.h,
      0x08121d,
      1
    ).setStrokeStyle(2, 0x24475f, 1).setDepth(-12);

    this.add.rectangle(
      CARDS.x + CARDS.w / 2,
      CARDS.y + CARDS.h / 2,
      CARDS.w,
      CARDS.h,
      0x07111d,
      0.99
    ).setStrokeStyle(2, 0x17354d, 1).setDepth(30);

    this.background = this.add.image(
      STAGE.x + STAGE.w / 2,
      STAGE.y + STAGE.h / 2,
      this.worldPhase === 'day' ? 'crewSpaceDayBg' : 'crewSpaceNightBg'
    ).setDepth(-10);

    this.fitBackground();

    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(STAGE.x, STAGE.y, STAGE.w, STAGE.h);
    this.background.setMask(maskShape.createGeometryMask());

    const back = this.add.rectangle(1420, 782, 210, 46, 0x102138, 1)
      .setStrokeStyle(2, 0x55b8ff, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(50);
    this.add.text(1420, 782, 'BACK TO WAREHOUSE  >', {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#eef8ff',
    }).setOrigin(0.5).setDepth(51);

    back.on('pointerdown', () => {
      const owned = (this.registry.get('ownedCarIds') || [])
        .filter(id => cars[id] && !cars[id].crewLoan);
      const requested = this.registry.get('crewPreviousCarId');
      this.registry.set(
        'selectedCarId',
        owned.includes(requested) ? requested : owned[0] || null
      );
      this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
      this.registry.set('crewPreviousCarId', null);
      saveSessionState(this.registry);
      this.scene.start('GarageScene');
    });
  }

  fitBackground() {
    if (!this.background?.active) return;
    const source = this.textures.get(this.background.texture.key).getSourceImage();
    const scale = Math.max(STAGE.w / source.width, STAGE.h / source.height);
    this.background.setScale(scale)
      .setPosition(STAGE.x + STAGE.w / 2, STAGE.y + STAGE.h / 2);
  }

  syncWorldPhase() {
    const next = getWorldPhase();
    if (next === this.worldPhase || !this.background?.active) return;
    this.worldPhase = next;
    const key = next === 'day' ? 'crewSpaceDayBg' : 'crewSpaceNightBg';

    this.tweens.add({
      targets: this.background,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        if (!this.background?.active) return;
        this.background.setTexture(key);
        this.fitBackground();
        this.tweens.add({ targets: this.background, alpha: 1, duration: 260 });
      },
    });
  }

  clearContent() {
    this.contentObjects.forEach(obj => obj?.destroy?.());
    this.contentObjects = [];
    this.carObjects.forEach(obj => obj?.destroy?.());
    this.carObjects = [];
  }

  addContent(obj) {
    this.contentObjects.push(obj);
    return obj;
  }

  render() {
    this.clearContent();

    const members = getCrewMembers(this.registry);
    const count = getCrewCount(this.registry);
    const complete = isCrewComplete(this.registry);
    const battleWins = getCrewBattleWinCount(this.registry);

    this.headerStatus?.setText(
      complete
        ? 'CREW 8/8 // REGIONAL CREW BATTLES ' + battleWins + '/7'
        : 'CREW ' + (count + 1) + '/8 // RECRUIT ' + (7 - count) + ' MORE'
    );

    this.addContent(this.add.text(52, 112, complete ? 'TOKYO CREW COMPLETE' : 'BUILD YOUR TOKYO CREW', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: complete ? '#86efd7' : '#ffffff',
    }).setDepth(20));

    this.addContent(this.add.text(
      52,
      150,
      complete
        ? (areAllCrewBattlesComplete(this.registry)
            ? 'All regional crews defeated. Tokyo Championship invitation received — event coming later.'
            : 'Return to the seven regions and challenge their full crews. Choose your running order before each battle.')
        : 'Win stock-vs-stock recruitment challenges in each region. You may recruit one driver from every region.',
      {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#b8cbd7',
        fontStyle: '600',
        wordWrap: { width: 760 },
      }
    ).setDepth(20));

    const regionY = CARDS.y + 72;
    const left = CARDS.x + 82;
    const usable = CARDS.w - 330;
    const gap = usable / (CREW_REGIONS.length - 1);

    CREW_REGIONS.forEach((regionId, index) => {
      const member = members[regionId];
      const selected = regionId === this.selectedRegionId;
      const x = left + index * gap;

      const box = this.addContent(this.add.rectangle(
        x,
        regionY,
        142,
        92,
        selected ? 0x123047 : member ? 0x102138 : 0x11151b,
        1
      ).setStrokeStyle(
        selected ? 3 : 1,
        selected ? 0x43dfff : member ? 0x4f849e : 0x4a5158,
        1
      ).setDepth(33));

      this.addContent(this.add.text(x, regionY - 26, regionLabel(regionId), {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: member ? '#ffffff' : '#74818a',
        align: 'center',
      }).setOrigin(0.5).setDepth(34));

      this.addContent(this.add.text(
        x,
        regionY + 18,
        member
          ? String(characters[member.characterId]?.name || member.characterId).toUpperCase()
          : 'OPEN SLOT',
        {
          fontFamily: BODY_FONT,
          fontSize: '8px',
          color: member ? '#9fd8f0' : '#657078',
          fontStyle: '700',
          align: 'center',
          wordWrap: { width: 128 },
        }
      ).setOrigin(0.5).setDepth(34));

      box.setInteractive({ useHandCursor: true });
      box.on('pointerdown', () => {
        this.selectedRegionId = regionId;
        this.render();
      });
    });

    const member = members[this.selectedRegionId];
    if (!member) {
      this.addContent(this.add.text(
        780,
        380,
        regionLabel(this.selectedRegionId) + '\nNO CREW MEMBER YET',
        {
          fontFamily: PIXEL_FONT,
          fontSize: '14px',
          color: '#8295a2',
          align: 'center',
          lineSpacing: 10,
        }
      ).setOrigin(0.5).setDepth(24));
      return;
    }

    this.renderSelectedMember(member);
  }

  renderSelectedMember(member) {
    const character = characters[member.characterId];
    const car = cars[member.loanCarId];
    const state = (this.registry.get('carStates') || {})[member.loanCarId] || {};

    if (character?.visual?.spriteKey && this.textures.exists(character.visual.spriteKey)) {
      const sprite = this.addContent(this.add.image(
        STAGE.x + 235,
        STAGE.y + 310,
        character.visual.spriteKey
      ).setDepth(16));

      const source = this.textures.get(character.visual.spriteKey).getSourceImage();
      sprite.setScale(Math.min(260 / source.width, 390 / source.height));
      sprite.setOrigin(0.5, 0.5);
    }

    this.addContent(this.add.rectangle(
      STAGE.x + STAGE.w - 260,
      STAGE.y + 150,
      430,
      180,
      0x06111d,
      0.82
    ).setStrokeStyle(2, 0x315470, 0.95).setDepth(19));

    this.addContent(this.add.text(
      STAGE.x + STAGE.w - 445,
      STAGE.y + 92,
      String(character?.name || member.characterId).toUpperCase(),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '12px',
        color: '#ffffff',
      }
    ).setDepth(20));

    this.addContent(this.add.text(
      STAGE.x + STAGE.w - 445,
      STAGE.y + 132,
      regionLabel(member.regionId) + ' // ' +
        String(car?.shortName || member.baseCarId).toUpperCase() +
        '\nLOAN CAR // YOUR CREW BUILD',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#a7d5ef',
        fontStyle: '700',
        lineSpacing: 5,
      }
    ).setDepth(20));

    const tuneButton = this.addContent(this.add.rectangle(
      STAGE.x + STAGE.w - 360,
      STAGE.y + 210,
      250,
      44,
      0x0c2827,
      1
    ).setStrokeStyle(2, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(22));

    this.addContent(this.add.text(
      STAGE.x + STAGE.w - 360,
      STAGE.y + 210,
      'TUNE / DYNO CAR  >',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#f1fffb',
      }
    ).setOrigin(0.5).setDepth(23));

    tuneButton.on('pointerdown', () => {
      const previous = (this.registry.get('ownedCarIds') || [])
        .find(id => id === this.registry.get('selectedCarId') && !cars[id]?.crewLoan) ||
        (this.registry.get('ownedCarIds') || []).find(id => !cars[id]?.crewLoan) ||
        null;
      this.registry.set('crewPreviousCarId', previous);
      this.registry.set('selectedCarId', member.loanCarId);
      this.registry.set('workshopLocationId', 'shinonomeWarehouseStrip');
      saveSessionState(this.registry);
      this.scene.start('GarageScene');
    });

    const kickButton = this.addContent(this.add.rectangle(
      STAGE.x + STAGE.w - 360,
      STAGE.y + 265,
      250,
      40,
      0x271820,
      1
    ).setStrokeStyle(1, 0xff7cac, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(22));

    this.addContent(this.add.text(
      STAGE.x + STAGE.w - 360,
      STAGE.y + 265,
      'REMOVE FROM CREW',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#ffc0d7',
      }
    ).setOrigin(0.5).setDepth(23));

    kickButton.on('pointerdown', () => this.confirmRemove(member));

    if (car) {
      this.renderCar(car, state, STAGE.x + 800, STAGE.y + 385, 650);
    }
  }

  confirmRemove(member) {
    const depth = 120;
    const objects = [];
    const add = obj => {
      objects.push(obj);
      return obj;
    };
    const close = () => objects.forEach(obj => obj?.destroy?.());

    add(this.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.80)
      .setDepth(depth).setInteractive());

    add(this.add.rectangle(780, 420, 760, 350, 0x09131d, 1)
      .setStrokeStyle(2, 0xff7cac, 1).setDepth(depth + 1));

    add(this.add.text(780, 330, 'REMOVE CREW MEMBER?', {
      fontFamily: PIXEL_FONT,
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(depth + 2));

    add(this.add.text(
      780,
      390,
      'Their loan car leaves with them. Every upgrade you bought for that car is lost.\nYou can return to the region and wait for another recruitment challenge.',
      {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#c5d2da',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: 650 },
      }
    ).setOrigin(0.5).setDepth(depth + 2));

    const cancel = add(this.add.rectangle(650, 505, 220, 48, 0x151d28, 1)
      .setStrokeStyle(1, 0x657d8c, 1).setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(650, 505, 'KEEP MEMBER', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d2dce2',
    }).setOrigin(0.5).setDepth(depth + 3));

    const remove = add(this.add.rectangle(910, 505, 220, 48, 0x351820, 1)
      .setStrokeStyle(2, 0xff7cac, 1).setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    add(this.add.text(910, 505, 'REMOVE', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffd1e0',
    }).setOrigin(0.5).setDepth(depth + 3));

    cancel.on('pointerdown', close);
    remove.on('pointerdown', () => {
      removeCrewMember(this.registry, member.regionId);
      saveSessionState(this.registry);
      close();
      this.render();
    });
  }

  renderCar(car, state, x, y, targetWidth) {
    const bodyKey = getCarBodyTextureKey(this, car);
    if (!bodyKey || !this.textures.exists(bodyKey)) return;

    const wheelVisual = getVisualModWheelVisual(car, state);
    if (!wheelVisual?.wheelKey || !this.textures.exists(wheelVisual.wheelKey)) return;

    const wheelSource = this.textures.get(wheelVisual.wheelKey).getSourceImage();
    const bodyScale = getCarBodyScaleForWidth(this, car, targetWidth);
    const fit = getWheelPairFit(wheelVisual, bodyScale, false, wheelSource);
    const displayY = y + Number(car.visual?.renderOffsetY || 0) * bodyScale;

    const rearX = x + fit.rear.offsetX;
    const frontX = x + fit.front.offsetX;
    const rearY = displayY + fit.rear.offsetY;
    const frontY = displayY + fit.front.offsetY;

    const rear = this.add.image(rearX, rearY, wheelVisual.wheelKey)
      .setScale(fit.rear.wheelScale).setDepth(12);
    const front = this.add.image(frontX, frontY, wheelVisual.wheelKey)
      .setScale(fit.front.wheelScale).setDepth(12);

    const tyreBottom = Math.max(
      rearY + getWheelContactOffsetY(wheelSource, fit.rear.wheelScale),
      frontY + getWheelContactOffsetY(wheelSource, fit.front.wheelScale)
    );

    const shadow = this.add.ellipse(
      x,
      tyreBottom + 5,
      targetWidth * 0.92,
      Math.max(24, rear.displayHeight * 0.34),
      0x000000,
      0.70
    ).setDepth(11);

    const bodyLayers = createCarBodyLayers(this, car, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: 13,
      paintColor: getCarPaintColor(state),
    });

    const mods = createVisualModLayers(this, car, state, {
      x,
      y: displayY,
      scale: bodyScale,
      depth: 13.01,
      paintColor: getCarPaintColor(state),
      bodyLayers,
    });

    const objects = [shadow, rear, front, ...bodyLayers.objects, ...mods];
    objects.forEach(obj => {
      if (!obj) return;
      this.carObjects.push(obj);
      obj.x -= 650;
    });

    this.tweens.add({
      targets: objects,
      x: '+=650',
      duration: 950,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: [rear, front],
      angle: 540,
      duration: 950,
      ease: 'Cubic.easeOut',
    });
  }
}
