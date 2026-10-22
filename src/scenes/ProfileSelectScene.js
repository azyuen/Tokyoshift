import { characters } from '../data/characters.js?v=20261004-r333';
import { cars } from '../data/cars.js?v=20261011-r479';
import {
  getProfileSlots,
  getActiveProfileIndex,
  setActiveProfileIndex,
  beginNewProfile,
  setProfileGameMode,
} from '../state/GameState.js?v=20261011-r482';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261004-r333';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function money(value) {
  return '¥ ' + Number(value || 0).toLocaleString('en-US');
}

function districtLabel(value = '') {
  return String(value || 'ODAIBA').replaceAll('_', ' ');
}

function playTimeLabel(value = 0) {
  const totalMinutes = Math.max(0, Math.floor(Number(value || 0) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0
    ? 'PLAY TIME  ' + hours + 'H ' + minutes + 'M'
    : 'PLAY TIME  ' + minutes + 'M';
}

function lastPlayedLabel(value) {
  if (!value) return 'AUTOSAVED';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'AUTOSAVED';

  try {
    return 'LAST PLAYED  ' + date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
    }).toUpperCase();
  } catch (e) {
    return 'AUTOSAVED';
  }
}

export default class ProfileSelectScene extends Phaser.Scene {
  constructor() { super('ProfileSelectScene'); }

  preload() {
    // Only the three-profile opening scene uses this artwork.
    // Phaser caches the texture once and the boot splash remains visible until create().
    if (!this.textures.exists('tokyo_shift_profile_backing')) {
      this.load.image(
        'tokyo_shift_profile_backing',
        './assets/Ui/tokyo_shift_backing.webp?v=20261011-r481'
      );
    }
  }

  create() {
    document.body.dataset.scene = 'setup';
    this.scale.resize(1560, 840);
    playMusic('title');

    try { this.input.enabled = true; } catch (e) {}
    try { if (this.input.keyboard) this.input.keyboard.enabled = true; } catch (e) {}

    this.transitioning = false;
    this.profileObjects = [];
    this.profileCards = [];
    this.slots = getProfileSlots();

    const activeIndex = getActiveProfileIndex();
    this.selectedProfileIndex = this.slots[activeIndex]?.occupied
      ? activeIndex
      : Math.max(0, this.slots.findIndex(slot => slot.occupied));

    this.drawBackdrop();
    this.drawProfiles();
    this.buildContinueButton();
    this.refreshSelection();

    window.TOKYO_SHIFT_SET_LOADING?.(1, 'DRIVERS READY');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.TOKYO_SHIFT_HIDE_SPLASH?.();
    }));
  }

  drawBackdrop() {
    // Match the entire 1560x840 canvas without stretching the 16:9 artwork.
    // This uses a subtle centre crop, avoiding empty bands on wider devices.
    if (this.textures.exists('tokyo_shift_profile_backing')) {
      const backdrop = this.add.image(780, 420, 'tokyo_shift_profile_backing').setDepth(-2);
      backdrop.setScale(Math.max(1560 / backdrop.width, 840 / backdrop.height));
    } else {
      // Retain a safe fallback if the image fails to load.
      this.add.rectangle(780, 420, 1560, 840, 0x03070d).setDepth(-2);
    }

    // Slightly darken the bright roadway so profile cards and labels stay legible.
    this.add.rectangle(780, 420, 1560, 840, 0x020916, 0.30).setDepth(-1);

    this.add.text(780, 58, 'TOKYO SHIFT', {
      fontFamily: PIXEL_FONT,
      fontSize: '30px',
      color: '#f1fbff',
    }).setOrigin(0.5).setDepth(2);

    this.add.text(780, 105, 'SELECT DRIVER // CONTINUE THE NIGHT', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#69dfff',
    }).setOrigin(0.5).setDepth(2);

    this.add.text(
      780,
      816,
      'PROGRESS AUTOSAVES AFTER RACES, PURCHASES, TUNING AND OTHER MEANINGFUL ACTIONS.',
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#7893a2',
        fontStyle: '600',
      }
    ).setOrigin(0.5).setDepth(2);
  }

  drawProfiles() {
    const xs = [350, 780, 1210];

    this.slots.forEach((slot, index) => {
      this.drawProfileCard(slot, xs[index], index);
    });
  }

  drawProfileCard(slot, x, index) {
    const occupied = Boolean(slot.occupied);
    const lastActive = Boolean(slot.active && occupied);
    const depth = 4;
    const cardY = 430;
    const cardW = 360;
    const cardH = 560;

    const card = this.add.rectangle(
      x,
      cardY,
      cardW,
      cardH,
      lastActive ? 0x0c2232 : 0x08131f,
      0.99
    ).setStrokeStyle(
      lastActive ? 2 : 1,
      lastActive ? 0x397b98 : 0x294b63,
      1
    ).setDepth(depth)
      .setInteractive({ useHandCursor: true });

    const selectionFrame = this.add.rectangle(
      x,
      cardY,
      cardW + 10,
      cardH + 10,
      0xffffff,
      0
    ).setStrokeStyle(4, 0x55e1ff, 1)
      .setDepth(depth + 5)
      .setVisible(false);

    const selectedTag = this.add.text(
      x,
      cardY + cardH / 2 - 24,
      'SELECTED',
      {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#62e8c7',
        backgroundColor: '#071b20',
        padding: { x: 10, y: 6 },
      }
    ).setOrigin(0.5).setDepth(depth + 6).setVisible(false);

    this.profileCards[index] = {
      card,
      selectionFrame,
      selectedTag,
      slot,
      lastActive,
    };

    this.add.text(x - cardW / 2 + 24, cardY - cardH / 2 + 22, 'PROFILE ' + (index + 1), {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: lastActive ? '#67e5ff' : '#7d9bad',
    }).setDepth(depth + 1);

    if (lastActive) {
      this.add.text(x + cardW / 2 - 24, cardY - cardH / 2 + 22, 'LAST ACTIVE', {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#62e8c7',
      }).setOrigin(1, 0).setDepth(depth + 1);
    }

    if (!occupied) {
      this.add.rectangle(x, cardY - 88, 174, 174, 0x071019, 1)
        .setStrokeStyle(2, 0x35586d, 1)
        .setDepth(depth + 1);

      this.add.text(x, cardY - 93, '+', {
        fontFamily: PIXEL_FONT,
        fontSize: '38px',
        color: '#55ddff',
      }).setOrigin(0.5).setDepth(depth + 2);

      this.add.text(x, cardY + 35, 'NEW DRIVER', {
        fontFamily: PIXEL_FONT,
        fontSize: '11px',
        color: '#f0fbff',
      }).setOrigin(0.5).setDepth(depth + 2);

      this.add.text(x, cardY + 82, 'Create a driver profile\nand begin at the station.', {
        fontFamily: BODY_FONT,
        fontSize: '12px',
        color: '#829dac',
        align: 'center',
        lineSpacing: 5,
      }).setOrigin(0.5).setDepth(depth + 2);

      this.add.text(x, cardY + 198, 'EMPTY SLOT', {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#6d8b9b',
      }).setOrigin(0.5).setDepth(depth + 2);

      card.on('pointerdown', () => this.selectProfile(index));
      return;
    }

    const character = characters[slot.playerCharacterId] || characters.renMizuno;
    this.add.rectangle(x, cardY - 120, 190, 190, 0x101b27, 1)
      .setStrokeStyle(2, lastActive ? 0x48dfff : 0x315470, 1)
      .setDepth(depth + 1);

    const profile = createCharacterProfile(this, {
      characterId: character.id,
      pose: 'idle',
      x,
      y: cardY - 120,
      frameWidth: 186,
      frameHeight: 186,
      side: 'center',
      depth: depth + 2,
      flipInward: false,
      mask: true,
    });
    if (profile?.maskShape) this.profileObjects.push(profile.maskShape);

    const name = [slot.firstName, slot.lastName].filter(Boolean).join(' ') || character.name;
    const currentCar = cars[slot.selectedCarId];
    const currentCarLabel = currentCar?.shortName || 'NO CAR';

    this.add.text(x, cardY + 3, name.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '10px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 310 },
    }).setOrigin(0.5).setDepth(depth + 2);

    this.add.text(
      x,
      cardY + 50,
      slot.wins + ' W  //  ' + slot.losses + ' L     •     ' +
      slot.carCount + ' CAR' + (slot.carCount === 1 ? '' : 'S'),
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#abc0cc',
        fontStyle: '700',
      }
    ).setOrigin(0.5).setDepth(depth + 2);

    this.add.text(
      x,
      cardY + 88,
      currentCarLabel + '     •     ' + money(slot.cash),
      {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#ffe08a',
      }
    ).setOrigin(0.5).setDepth(depth + 2);

    const championText = slot.championCount > 0
      ? 'REGIONAL CHAMPION  ' + slot.championCount + ' / 7' +
        (slot.perfectCount > 0 ? '     ★ ' + slot.perfectCount : '')
      : 'REGIONAL CHAMPIONS  0 / 7';

    this.add.text(x, cardY + 128, championText, {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: slot.championCount > 0 ? '#ffe08a' : '#6f8795',
    }).setOrigin(0.5).setDepth(depth + 2);

    this.add.text(
      x,
      cardY + 164,
      'LAST DISTRICT  //  ' + districtLabel(slot.district),
      {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#7f9aaa',
        fontStyle: '600',
      }
    ).setOrigin(0.5).setDepth(depth + 2);

    this.add.text(x, cardY + 192, playTimeLabel(slot.playTimeMs), {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#83a9bc',
    }).setOrigin(0.5).setDepth(depth + 2);

    this.add.text(x, cardY + 218, lastPlayedLabel(slot.updatedAt), {
      fontFamily: BODY_FONT,
      fontSize: '9px',
      color: '#637d8c',
      fontStyle: '600',
    }).setOrigin(0.5).setDepth(depth + 2);

    card.on('pointerover', () => {
      if (this.selectedProfileIndex !== index) {
        card.setStrokeStyle(2, 0x55a9c7, 1).setFillStyle(0x0d1d2a, 1);
      }
    });
    card.on('pointerout', () => this.refreshSelection());
    card.on('pointerdown', () => this.selectProfile(index));
  }

  buildContinueButton() {
    this.continueButton = this.add.rectangle(780, 762, 470, 54, 0x0c2b29, 1)
      .setStrokeStyle(3, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    this.continueLabel = this.add.text(780, 762, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '9px',
      color: '#f2fffb',
      align: 'center',
    }).setOrigin(0.5).setDepth(21);

    this.continueButton.on('pointerdown', () => this.confirmSelectedProfile());
  }

  selectProfile(index) {
    if (this.transitioning) return;
    this.selectedProfileIndex = Phaser.Math.Clamp(Number(index) || 0, 0, 2);
    this.refreshSelection();
  }

  refreshSelection() {
    this.profileCards.forEach((item, index) => {
      if (!item) return;
      const selected = index === this.selectedProfileIndex;
      item.selectionFrame.setVisible(selected);
      item.selectedTag.setVisible(selected);

      if (selected) {
        item.card.setFillStyle(0x102536, 1).setStrokeStyle(2, 0x55b7d4, 1);
      } else {
        item.card
          .setFillStyle(item.lastActive ? 0x0c2232 : 0x08131f, 0.99)
          .setStrokeStyle(
            item.lastActive ? 2 : 1,
            item.lastActive ? 0x397b98 : 0x294b63,
            1
          );
      }
    });

    const slot = this.slots[this.selectedProfileIndex];
    if (!slot?.occupied) {
      this.continueLabel?.setText('CREATE PROFILE ' + (this.selectedProfileIndex + 1) + '  >');
      return;
    }

    const name = [slot.firstName, slot.lastName].filter(Boolean).join(' ') || 'DRIVER';
    this.continueLabel?.setText('CONTINUE AS ' + name.toUpperCase() + '  >');
  }

  confirmSelectedProfile() {
    if (this.transitioning) return;

    const index = Phaser.Math.Clamp(Number(this.selectedProfileIndex) || 0, 0, 2);
    const slot = this.slots[index];

    if (!slot?.occupied) {
      beginNewProfile(index);
      this.reloadSelectedProfile('CREATING DRIVER');
      return;
    }

    if (slot.playerCharacterId === 'arkonDen' &&
        (slot.firstName + slot.lastName).toLowerCase().replace(/[^a-z0-9]/g, '') === 'arkonden') {
      this.showArkonModeSelect(index);
      return;
    }
    setActiveProfileIndex(index);
    this.reloadSelectedProfile('LOADING DRIVER');
  }

  showArkonModeSelect(index) {
    if (this.modeSelectOpen || this.transitioning) return;
    this.modeSelectOpen = true;
    const items = [];
    const add = item => { items.push(item); return item; };
    add(this.add.rectangle(780, 420, 1560, 840, 0x030b14, 0.97)
      .setDepth(90).setInteractive());
    add(this.add.text(780, 100, 'ARKON DEN // TWO JOURNEYS', {
      fontFamily: PIXEL_FONT, fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(92));
    add(this.add.text(780, 152, 'SELECT WHICH LIFE TO CONTINUE', {
      fontFamily: BODY_FONT, fontSize: '20px', color: '#91c6d2',
    }).setOrigin(0.5).setDepth(92));
    const choose = mode => {
      setActiveProfileIndex(index);
      if (!setProfileGameMode(index, mode)) {
        this.modeSelectOpen = false;
        items.forEach(item => item.destroy());
        return;
      }
      this.reloadSelectedProfile(mode === 'arkonStory' ? 'LOADING STORY' : 'LOADING DEV CAREER');
    };
    const draw = (x, mode, title, subtitle, description, footer) => {
      const panel = add(this.add.rectangle(x, 426, 440, 360, 0x0c2030, 0.99)
        .setStrokeStyle(2, 0x548da7).setDepth(92)
        .setInteractive({ useHandCursor: true }));
      add(this.add.text(x, 308, title, { fontFamily: PIXEL_FONT, fontSize: '21px',
        color: '#f4fbff' }).setOrigin(0.5).setDepth(94));
      add(this.add.text(x, 354, subtitle, { fontFamily: BODY_FONT, fontSize: '21px',
        color: '#7de1e5' }).setOrigin(0.5).setDepth(94));
      add(this.add.text(x, 429, description, { fontFamily: BODY_FONT, fontSize: '22px',
        color: '#ddeaf1', align: 'center', wordWrap: { width: 385 } })
        .setOrigin(0.5).setDepth(94));
      add(this.add.text(x, 536, footer, { fontFamily: PIXEL_FONT, fontSize: '11px',
        color: '#7de1e5' }).setOrigin(0.5).setDepth(94));
      panel.on('pointerover', () => panel.setStrokeStyle(3, 0x7de1e5));
      panel.on('pointerout', () => panel.setStrokeStyle(2, 0x548da7));
      panel.on('pointerdown', () => choose(mode));
    };
    draw(535, 'career', 'CAREER / DEV', 'Present day',
      'Continue your existing cars, garages and developer testing.', 'EXISTING SAVE');
    draw(1025, 'arkonStory', 'STORY MODE', 'Before Ginza',
      'A separate ten-chapter journey. Earn every car and every yen.',
      this.slots[index]?.storyStarted ? 'CONTINUE STORY' : 'BEGIN NEW STORY');
    const back = add(this.add.rectangle(780, 704, 230, 52, 0x142b37, 1)
      .setStrokeStyle(1, 0x538799).setDepth(92).setInteractive({ useHandCursor: true }));
    add(this.add.text(780, 704, 'BACK TO DRIVERS', {
      fontFamily: PIXEL_FONT, fontSize: '11px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(94));
    back.on('pointerdown', () => {
      items.forEach(item => item.destroy());
      this.modeSelectOpen = false;
    });
  }

  reloadSelectedProfile(label) {
    if (this.transitioning) return;
    this.transitioning = true;

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftBootMessage', label);
      sessionStorage.removeItem('tokyoShiftForceGarage');
    } catch (e) {}

    window.TOKYO_SHIFT_SHOW_SPLASH?.(label);
    window.setTimeout(() => window.location.reload(), 80);
  }
}
