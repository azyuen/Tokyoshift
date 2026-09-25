import { getAudioSettings, setAudioSettings } from '../audio/AudioSettings.js?v=20260921-r57';
import { characters } from '../data/characters.js?v=20260922-r111';
import {
  getProfileSlots,
  getActiveProfileIndex,
  beginNewProfile,
  deleteProfileSlot,
  setActiveProfileIndex,
  saveSessionState,
} from '../state/GameState.js?v=20260925-r184';
import { addDevCutsceneButton } from './CutsceneTester.js?v=20260925-r185';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function destroyObjects(objects = []) {
  objects.forEach(obj => {
    try { obj?.destroy?.(); } catch (e) {}
  });
}

function drawCog(scene, x, y, depth = 44) {
  const g = scene.add.graphics().setDepth(depth);
  g.lineStyle(3, 0xbad7e8, 1);
  g.strokeCircle(x, y, 10);
  g.strokeCircle(x, y, 3);

  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.lineBetween(
      x + Math.cos(a) * 11,
      y + Math.sin(a) * 11,
      x + Math.cos(a) * 15,
      y + Math.sin(a) * 15
    );
  }

  return g;
}

export function addSettingsButton(scene, x = 995, y = 35) {
  const button = scene.add.rectangle(x, y, 50, 38, 0x0b1724, 1)
    .setStrokeStyle(1, 0x315470, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(43);

  const cog = drawCog(scene, x, y, 44);

  button.on('pointerover', () => button.setStrokeStyle(2, 0x43dfff, 1));
  button.on('pointerout', () => button.setStrokeStyle(1, 0x315470, 1));
  button.on('pointerdown', () => showSettingsPanel(scene));

  const devCutscenes = addDevCutsceneButton(scene, x - 115, y);
  return { button, cog, devCutscenes };
}

export function showSettingsPanel(scene) {
  if (scene._settingsOverlay?.length) return;

  const objects = [];
  const masks = [];
  const add = obj => {
    objects.push(obj);
    return obj;
  };

  scene._settingsOverlay = objects;

  let transitioning = false;

  const close = () => {
    masks.forEach(maskShape => {
      try { maskShape?.destroy?.(); } catch (e) {}
    });
    destroyObjects(objects);
    scene._settingsOverlay = [];
  };

  const reloadForProfile = (label = 'SWITCHING DRIVER', reopenSettings = false) => {
    if (transitioning) return;
    transitioning = true;

    close();

    try {
      sessionStorage.setItem('tokyoShiftInternalReload', '1');
      sessionStorage.setItem('tokyoShiftBootMessage', label);
      sessionStorage.removeItem('tokyoShiftForceGarage');
      if (reopenSettings) {
        sessionStorage.setItem('tokyoShiftOpenSettingsAfterReload', '1');
      } else {
        sessionStorage.removeItem('tokyoShiftOpenSettingsAfterReload');
      }
    } catch (e) {}

    // Profile switching is intentionally a controlled app reload. Phaser scene
    // instances carry input/tween/DOM state across restarts on iOS PWAs; Boot
    // already knows how to restore the selected slot's session safely.
    window.setTimeout(() => {
      window.location.reload();
    }, 0);
  };

  add(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.74)
    .setDepth(180)
    .setInteractive());

  add(scene.add.rectangle(780, 420, 850, 700, 0x08131f, 0.995)
    .setStrokeStyle(2, 0x43dfff, 0.92)
    .setDepth(181));

  add(scene.add.text(390, 95, 'SETTINGS', {
    fontFamily: PIXEL_FONT,
    fontSize: '15px',
    color: '#eefaff',
  }).setDepth(183));

  const closeButton = add(scene.add.rectangle(1130, 100, 100, 38, 0x141d28, 1)
    .setStrokeStyle(1, 0x678192, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(183));

  add(scene.add.text(1130, 100, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#cbdce6',
  }).setOrigin(0.5).setDepth(184));

  closeButton.on('pointerdown', close);

  let settings = getAudioSettings();

  const buildVolumeRow = (label, y, key) => {
    add(scene.add.text(410, y, label, {
      fontFamily: PIXEL_FONT,
      fontSize: '8px',
      color: '#a8d4ec',
    }).setOrigin(0, 0.5).setDepth(183));

    const percentText = add(scene.add.text(1145, y, '', {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#ffffff',
    }).setOrigin(1, 0.5).setDepth(183));

    const segments = [];
    for (let i = 0; i < 10; i++) {
      const x = 640 + i * 40;
      const seg = add(scene.add.rectangle(x, y, 29, 22, 0x102233, 1)
        .setStrokeStyle(1, 0x315470, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(183));
      segments.push(seg);

      seg.on('pointerdown', () => {
        settings = setAudioSettings({
          ...settings,
          [key]: (i + 1) / 10,
        });
        refresh();
      });
    }

    const mute = add(scene.add.rectangle(570, y, 76, 28, 0x151b23, 1)
      .setStrokeStyle(1, 0x526978, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(183));

    add(scene.add.text(570, y, 'MUTE', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#aabac4',
    }).setOrigin(0.5).setDepth(184));

    mute.on('pointerdown', () => {
      settings = setAudioSettings({ ...settings, [key]: 0 });
      refresh();
    });

    const refresh = () => {
      const value = Math.max(0, Math.min(1, settings[key]));
      percentText.setText(Math.round(value * 100) + '%');
      segments.forEach((seg, i) => {
        const active = i < Math.round(value * 10);
        seg.setFillStyle(active ? 0x1b6f83 : 0x102233, 1);
        seg.setStrokeStyle(1, active ? 0x45ddff : 0x315470, 1);
      });
    };

    refresh();
  };

  buildVolumeRow('MUSIC', 165, 'music');
  buildVolumeRow('SOUND FX', 220, 'sfx');

  add(scene.add.line(780, 266, 390, 0, 1170, 0, 0x315470, 0.9).setDepth(182));

  add(scene.add.text(410, 292, 'DRIVER PROFILES', {
    fontFamily: PIXEL_FONT,
    fontSize: '9px',
    color: '#a8d4ec',
  }).setDepth(183));

  add(scene.add.text(1150, 294, '3 SLOTS', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#718a99',
  }).setOrigin(1, 0).setDepth(183));

  const slots = getProfileSlots();
  const activeIndex = getActiveProfileIndex();
  const activeSlotOccupied = Boolean(slots[activeIndex]?.occupied);
  const cardXs = [535, 780, 1025];

  if (!activeSlotOccupied) {
    closeButton.disableInteractive()
      .setFillStyle(0x10161d, 1)
      .setStrokeStyle(1, 0x344754, 1);
  }

  const showDeleteConfirm = (slot) => {
    const confirmObjects = [];
    const addConfirm = obj => {
      confirmObjects.push(obj);
      return obj;
    };

    const fullName = [slot.firstName, slot.lastName].filter(Boolean).join(' ') || 'THIS DRIVER';

    addConfirm(scene.add.rectangle(780, 420, 1560, 840, 0x02050b, 0.86)
      .setDepth(220)
      .setInteractive());

    addConfirm(scene.add.rectangle(780, 420, 650, 330, 0x09121d, 1)
      .setStrokeStyle(2, 0xff657d, 1)
      .setDepth(221));

    addConfirm(scene.add.text(780, 322, 'DELETE PROFILE?', {
      fontFamily: PIXEL_FONT,
      fontSize: '13px',
      color: '#fff2f4',
    }).setOrigin(0.5).setDepth(222));

    addConfirm(scene.add.text(
      780,
      385,
      fullName.toUpperCase() + '\nCars, cash, tuning and save data in this slot will be permanently deleted.',
      {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#ffb6c2',
        align: 'center',
        wordWrap: { width: 520 },
      }
    ).setOrigin(0.5).setDepth(222));

    const cancel = addConfirm(scene.add.rectangle(665, 505, 190, 44, 0x10202a, 1)
      .setStrokeStyle(1, 0x617987, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(222));

    addConfirm(scene.add.text(665, 505, 'CANCEL', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d9e7ef'
    }).setOrigin(0.5).setDepth(223));

    const confirm = addConfirm(scene.add.rectangle(895, 505, 190, 44, 0x32151e, 1)
      .setStrokeStyle(2, 0xff657d, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(222));

    addConfirm(scene.add.text(895, 505, 'DELETE', {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: '#ffe2e8'
    }).setOrigin(0.5).setDepth(223));

    const dismiss = () => destroyObjects(confirmObjects);
    cancel.on('pointerdown', dismiss);

    confirm.on('pointerdown', () => {
      const deletingActive = slot.index === getActiveProfileIndex();
      deleteProfileSlot(slot.index);
      dismiss();

      if (!deletingActive) {
        close();
        showSettingsPanel(scene);
        return;
      }

      const remaining = getProfileSlots().filter(profile => profile.occupied);

      if (remaining.length > 0) {
        // Move the active pointer to an existing driver, reload safely, then
        // reopen this same selection panel so the deleted slot is visibly empty.
        setActiveProfileIndex(remaining[0].index);
        reloadForProfile('DRIVER DELETED', true);
        return;
      }

      // Last driver deleted: stay on the selection panel with three empty
      // slots. Do not force character creation.
      close();
      showSettingsPanel(scene);
    });
  };

  slots.forEach((slot, i) => {
    const x = cardXs[i];
    const occupied = slot.occupied;
    const active = occupied && i === activeIndex;

    const card = add(scene.add.rectangle(x, 455, 210, 285, active ? 0x10283a : 0x0a1723, 1)
      .setStrokeStyle(active ? 3 : 2, active ? 0x48dfff : 0x29485e, 1)
      .setDepth(183)
      .setInteractive({ useHandCursor: true }));

    add(scene.add.text(x - 88, 329, 'SLOT ' + (i + 1), {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: active ? '#65e4ff' : '#7894a5',
    }).setDepth(184));

    if (!occupied) {
      add(scene.add.rectangle(x, 414, 112, 112, 0x0b1119, 1)
        .setStrokeStyle(2, 0x37556a, 1)
        .setDepth(184));

      add(scene.add.text(x, 410, '+', {
        fontFamily: PIXEL_FONT,
        fontSize: '30px',
        color: '#55dfff',
      }).setOrigin(0.5).setDepth(185));

      add(scene.add.text(x, 495, 'NEW DRIVER', {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#dff9ff',
      }).setOrigin(0.5).setDepth(185));

      add(scene.add.text(x, 530, 'Tap to start', {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#78909e',
      }).setOrigin(0.5).setDepth(185));

      card.on('pointerdown', () => {
        if (transitioning) return;

        // If the currently active slot was just deleted, do not save the stale
        // in-memory driver back into that empty slot.
        const currentSlots = getProfileSlots();
        const currentActive = getActiveProfileIndex();
        if (currentSlots[currentActive]?.occupied) {
          saveSessionState(scene.registry);
        }

        beginNewProfile(i);
        reloadForProfile('CREATING DRIVER');
      });
      return;
    }

    const character = characters[slot.playerCharacterId] || characters.renMizuno;
    const portraitX = x;
    const portraitY = 414;
    const portraitSize = 112;

    add(scene.add.rectangle(portraitX, portraitY, portraitSize, portraitSize, 0x101b27, 1)
      .setStrokeStyle(1, active ? 0x49dfff : 0x315470, 1)
      .setDepth(184));

    if (scene.textures.exists(character.visual.spriteKey)) {
      const source = scene.textures.get(character.visual.spriteKey).getSourceImage();
      const maskShape = scene.make.graphics({ add: false });
      maskShape.fillStyle(0xffffff, 1);
      maskShape.fillRect(
        portraitX - portraitSize / 2,
        portraitY - portraitSize / 2,
        portraitSize,
        portraitSize
      );
      masks.push(maskShape);

      const portrait = add(scene.add.image(
        portraitX,
        portraitY - portraitSize / 2 - 8,
        character.visual.spriteKey
      ).setOrigin(0.5, 0).setDepth(185));

      portrait.setScale(330 / source.height);
      portrait.setMask(maskShape.createGeometryMask());
    }

    const name = [slot.firstName, slot.lastName].filter(Boolean).join(' ') || character.name;
    add(scene.add.text(x, 492, name.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 180 },
    }).setOrigin(0.5).setDepth(185));

    add(scene.add.text(
      x,
      526,
      slot.carCount + ' CAR' + (slot.carCount === 1 ? '' : 'S') + '  •  ¥' + slot.cash.toLocaleString('en-US'),
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#88a4b4',
      }
    ).setOrigin(0.5).setDepth(185));

    if (active) {
      add(scene.add.text(x, 556, 'ACTIVE', {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#64e5ff',
      }).setOrigin(0.5).setDepth(185));
    } else {
      add(scene.add.text(x, 556, 'TAP TO SWITCH', {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#9ac5d9',
      }).setOrigin(0.5).setDepth(185));

      card.on('pointerdown', () => {
        if (transitioning) return;

        const currentSlots = getProfileSlots();
        const currentActive = getActiveProfileIndex();
        if (currentSlots[currentActive]?.occupied) {
          saveSessionState(scene.registry);
        }

        setActiveProfileIndex(i);
        reloadForProfile('SWITCHING DRIVER');
      });
    }

    const deleteButton = add(scene.add.rectangle(x, 587, 116, 28, 0x25141a, 1)
      .setStrokeStyle(1, 0x965266, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(188));

    add(scene.add.text(x, 587, 'DELETE', {
      fontFamily: PIXEL_FONT,
      fontSize: '5px',
      color: '#ffafbd',
    }).setOrigin(0.5).setDepth(189));

    deleteButton.on('pointerdown', () => showDeleteConfirm(slot));
  });

  add(scene.add.line(780, 625, 390, 0, 1170, 0, 0x315470, 0.9).setDepth(182));

  add(scene.add.text(780, 656, 'Driver names are set when a profile is created.', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#8099a8',
  }).setOrigin(0.5).setDepth(183));

  add(scene.add.text(780, 690, 'Each profile keeps its own cars, cash, tuning and Workshop save.', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#8099a8',
  }).setOrigin(0.5).setDepth(183));
}
