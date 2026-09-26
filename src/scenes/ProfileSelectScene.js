import { characters } from '../data/characters.js?v=20260926-r213';
import { cars } from '../data/cars.js?v=20260926-r209';
import {
  getProfileSlots,
  getActiveProfileIndex,
  setActiveProfileIndex,
  beginNewProfile,
} from '../state/GameState.js?v=20260926-r214';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20260926-r213';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function money(value) {
  return '¥ ' + Number(value || 0).toLocaleString('en-US');
}

function districtLabel(value = '') {
  return String(value || 'ODAIBA').replaceAll('_', ' ');
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
    this.add.rectangle(780, 420, 1560, 840, 0x03070d, 1);

    const glow = this.add.graphics().setDepth(0);
    glow.fillStyle(0x0b2435, 0.46);
    glow.fillEllipse(780, 390, 1320, 650);
    glow.lineStyle(1, 0x1f526d, 0.20);
    for (let y = 145; y <= 760; y += 44) {
      glow.lineBetween(90, y, 1470, y);
    }
    glow.lineStyle(1, 0xff4f94, 0.12);
    for (let x = 140; x <= 1420; x += 92) {
      glow.lineBetween(x, 165, x - 155, 780);
    }

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

      this.add.text(x, cardY + 82, 'Create a new profile\nand choose your first car.', {
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

    this.add.text(x, cardY + 197, lastPlayedLabel(slot.updatedAt), {
      fontFamily: BODY_FONT,
      fontSize: '9px',
      color: '#637d8c',
      fontStyle: '600',
    }).setOrigin(0.5).setDepth(depth + 2);

    this.add.text(x, cardY + 228, 'TAP TO SELECT', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#7da9ba',
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
    this.continueButton = this.add.rectangle(780, 744, 470, 54, 0x0c2b29, 1)
      .setStrokeStyle(3, 0x62e8c7, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    this.continueLabel = this.add.text(780, 744, '', {
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

    setActiveProfileIndex(index);
    this.reloadSelectedProfile('LOADING DRIVER');
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
