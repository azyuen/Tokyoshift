import { getAudioSettings, setAudioSettings } from '../audio/AudioSettings.js?v=20260921-r57';
import {
  getControlSettings,
  updateControlSettings,
  resetControlSettings,
  keyboardBindingLabel,
  controllerBindingLabel,
  getConnectedGamepads,
  CONTROL_ACTIONS,
  TOUCH_COMPONENTS,
  CONTROL_LAYOUT_DEFAULTS,
  CONTROL_REFERENCE,
  isTouchControlPlacementValid,
} from '../input/ControlSettings.js?v=20261007-r422';
import { characters } from '../data/characters.js?v=20260926-r213';
import {
  getProfileSlots,
  getActiveProfileIndex,
  beginNewProfile,
  deleteProfileSlot,
  setActiveProfileIndex,
  saveSessionState,
  saveIdentityState,
  exportProfileBackup,
  importProfileBackup,
} from '../state/GameState.js?v=20261007-r422';
import { addDevCutsceneButton } from './CutsceneTester.js?v=20261009-r451';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20260926-r213';
import {
  PLAYER_DIFFICULTIES,
  normalisePlayerDifficulty,
} from '../data/playerDifficulty.js?v=20260929-r268';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';

function destroyObjects(objects = []) {
  objects.forEach(obj => {
    try { obj?.destroy?.(); } catch (e) {}
  });
}

function playTimeLabel(value = 0) {
  const totalMinutes = Math.max(0, Math.floor(Number(value || 0) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0
    ? 'PLAY ' + hours + 'H ' + minutes + 'M'
    : 'PLAY ' + minutes + 'M';
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

function showRenameDriverPanel(scene, onSaved = null) {
  if (scene._renameDriverOverlay?.length) return;

  const objects = [];
  const add = obj => { objects.push(obj); return obj; };
  scene._renameDriverOverlay = objects;

  const form = document.getElementById('driver-name-overlay');
  const firstInput = document.getElementById('driverFirstName');
  const lastInput = document.getElementById('driverLastName');

  if (!form || !firstInput || !lastInput) return;

  firstInput.value = String(scene.registry.get('firstName') || '');
  lastInput.value = String(scene.registry.get('lastName') || '');
  form.classList.add('is-visible', 'is-settings-edit');
  form.setAttribute('aria-hidden', 'false');

  const stop = event => event.stopPropagation();
  [firstInput, lastInput].forEach(input => {
    input.onkeydown = stop;
    input.onkeyup = stop;
    input.onkeypress = stop;
  });

  try {
    if (scene.input.keyboard) scene.input.keyboard.enabled = false;
  } catch (e) {}

  const dismiss = () => {
    form.classList.remove('is-visible', 'is-settings-edit');
    form.setAttribute('aria-hidden', 'true');
    [firstInput, lastInput].forEach(input => {
      input.onkeydown = null;
      input.onkeyup = null;
      input.onkeypress = null;
    });
    try {
      if (scene.input.keyboard) scene.input.keyboard.enabled = true;
    } catch (e) {}
    destroyObjects(objects);
    scene._renameDriverOverlay = [];
  };

  add(scene.add.rectangle(780, 420, 1560, 840, 0x010309, 0.78)
    .setDepth(240)
    .setInteractive());

  add(scene.add.rectangle(780, 420, 690, 430, 0x09141f, 0.998)
    .setStrokeStyle(2, 0x43dfff, 1)
    .setDepth(241));

  add(scene.add.text(780, 275, 'CHANGE DRIVER NAME', {
    fontFamily: PIXEL_FONT,
    fontSize: '13px',
    color: '#eefaff',
  }).setOrigin(0.5).setDepth(242));

  add(scene.add.text(780, 326, 'Update the name rivals and profile screens use.', {
    fontFamily: BODY_FONT,
    fontSize: '11px',
    color: '#91a9b7',
  }).setOrigin(0.5).setDepth(242));

  const error = add(scene.add.text(780, 515, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#ff8198',
  }).setOrigin(0.5).setDepth(242));

  const cancel = add(scene.add.rectangle(655, 580, 200, 48, 0x131c27, 1)
    .setStrokeStyle(1, 0x617987, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(242));
  add(scene.add.text(655, 580, 'CANCEL', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#d7e5ed',
  }).setOrigin(0.5).setDepth(243));

  const confirm = add(scene.add.rectangle(905, 580, 200, 48, 0x0c2b29, 1)
    .setStrokeStyle(2, 0x62e8c7, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(242));
  add(scene.add.text(905, 580, 'SAVE NAME', {
    fontFamily: PIXEL_FONT,
    fontSize: '8px',
    color: '#f1fffb',
  }).setOrigin(0.5).setDepth(243));

  cancel.on('pointerdown', dismiss);
  confirm.on('pointerdown', () => {
    const firstName = String(firstInput.value || '').trim();
    const lastName = String(lastInput.value || '').trim();

    if (!firstName || !lastName) {
      error.setText('ENTER A FIRST AND LAST NAME');
      return;
    }

    scene.registry.set('firstName', firstName);
    scene.registry.set('lastName', lastName);
    saveIdentityState(scene.registry);
    dismiss();
    onSaved?.();
  });

  window.setTimeout(() => firstInput.focus(), 60);
}

function safeBackupFilenamePart(value = 'driver') {
  return String(value || 'driver')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'driver';
}

function downloadProfileBackup(scene, profileIndex) {
  // Export the exact state currently on screen, not merely the last action
  // that happened to trigger an autosave. This matters on iPad where the PWA
  // may be reloaded or evicted immediately after the backup is made.
  if (profileIndex === getActiveProfileIndex()) {
    saveSessionState(scene.registry);
  }

  const build = String(document.getElementById('build-stamp')?.textContent || 'UNKNOWN');
  const payload = exportProfileBackup(profileIndex, build);
  if (!payload) return false;

  // Make sure the payload itself survives JSON serialisation before offering
  // it to the browser as a downloadable file.
  let serialised = '';
  try {
    serialised = JSON.stringify(payload, null, 2);
    JSON.parse(serialised);
  } catch (e) {
    return false;
  }

  const state = payload.state || {};
  const driver = safeBackupFilenamePart(
    [state.firstName, state.lastName].filter(Boolean).join('_') || ('profile_' + (profileIndex + 1))
  );
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([serialised], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'TokyoSHIFT_' + driver + '_' + date + '.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  return true;
}

function readProfileBackupFile(file) {
  if (!file) return Promise.resolve(null);

  if (typeof file.text === 'function') {
    return file.text();
  }

  // Older iPad Safari builds do not expose Blob.text(). FileReader is slower
  // but widely supported and keeps old devices able to restore backups.
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('FILE READ FAILED'));
      reader.readAsText(file);
    } catch (e) {
      reject(e);
    }
  });
}

function chooseProfileBackupFile() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    // iOS Safari/PWA is more reliable when the file input is technically
    // on-screen rather than positioned thousands of pixels away.
    Object.assign(input.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: '1px',
      height: '1px',
      opacity: '0.001',
      zIndex: '99999',
    });
    document.body.appendChild(input);

    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      try { input.remove(); } catch (e) {}
      resolve(value);
    };

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }

      try {
        const raw = await readProfileBackupFile(file);
        finish(JSON.parse(raw));
      } catch (e) {
        finish({ __parseError: true });
      }
    }, { once: true });

    input.addEventListener('cancel', () => finish(null), { once: true });

    // showPicker() keeps the user-activation chain explicit on newer Safari.
    // Fall back to click() for older iPadOS versions.
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.click();
      }
    } catch (e) {
      try { input.click(); } catch (inner) { finish(null); }
    }
  });
}

function showBackupImportConfirm(scene, profileIndex, payload, onConfirm) {
  const objects = [];
  const add = obj => {
    objects.push(obj);
    return obj;
  };
  const close = () => destroyObjects(objects);

  const state = payload?.state || {};
  const name = [state.firstName, state.lastName].filter(Boolean).join(' ') || 'UNKNOWN DRIVER';
  const carCount = Array.isArray(state.ownedCarIds) ? state.ownedCarIds.length : 0;
  const exported = payload?.exportedAt
    ? new Date(payload.exportedAt).toLocaleString()
    : 'UNKNOWN DATE';

  add(scene.add.rectangle(780, 420, 1560, 840, 0x010309, 0.86)
    .setDepth(250)
    .setInteractive());
  add(scene.add.rectangle(780, 420, 720, 390, 0x09141f, 1)
    .setStrokeStyle(2, 0xffc760, 1)
    .setDepth(251));

  add(scene.add.text(780, 292, 'IMPORT PROFILE BACKUP?', {
    fontFamily: PIXEL_FONT,
    fontSize: '13px',
    color: '#fff5dc',
  }).setOrigin(0.5).setDepth(252));

  add(scene.add.text(
    780,
    380,
    'SLOT ' + (profileIndex + 1) + ' WILL BE OVERWRITTEN\n\n' +
      name.toUpperCase() + '\n' +
      carCount + ' CARS  •  ¥' + Number(state.cash || 0).toLocaleString('en-US') + '\n' +
      'BACKUP: ' + exported,
    {
      fontFamily: BODY_FONT,
      fontSize: '12px',
      color: '#c8d5dc',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: 570 },
    }
  ).setOrigin(0.5).setDepth(252));

  const cancel = add(scene.add.rectangle(655, 555, 200, 48, 0x131c27, 1)
    .setStrokeStyle(1, 0x617987, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(252));
  add(scene.add.text(655, 555, 'CANCEL', {
    fontFamily: PIXEL_FONT, fontSize: '8px', color: '#d7e5ed',
  }).setOrigin(0.5).setDepth(253));

  const confirm = add(scene.add.rectangle(905, 555, 200, 48, 0x302619, 1)
    .setStrokeStyle(2, 0xffc760, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(252));
  add(scene.add.text(905, 555, 'OVERWRITE', {
    fontFamily: PIXEL_FONT, fontSize: '8px', color: '#fff5dc',
  }).setOrigin(0.5).setDepth(253));

  cancel.on('pointerdown', close);
  confirm.on('pointerdown', () => {
    close();
    onConfirm?.();
  });
}

function showControlsPanel(scene) {
  if (scene._controlsOverlay?.length) return;

  const objects = [];
  let tabObjects = [];
  let activeTab = 'touch';
  let settings = getControlSettings();
  let keyboardCaptureAction = null;
  let controllerCaptureAction = null;
  let keyboardCaptureHandler = null;
  let controllerTimer = null;

  const add = obj => {
    objects.push(obj);
    return obj;
  };
  const addTab = obj => {
    tabObjects.push(obj);
    objects.push(obj);
    return obj;
  };
  scene._controlsOverlay = objects;

  const destroyTab = () => {
    if (controllerTimer) {
      try { controllerTimer.destroy(); } catch (e) {}
      controllerTimer = null;
    }
    tabObjects.forEach(obj => {
      try { obj?.destroy?.(); } catch (e) {}
      const index = objects.indexOf(obj);
      if (index >= 0) objects.splice(index, 1);
    });
    tabObjects = [];
  };

  const close = () => {
    scene._menuNavigationCaptureInput = false;
    destroyTab();
    if (keyboardCaptureHandler) {
      try { scene.input.keyboard.off('keydown', keyboardCaptureHandler); } catch (e) {}
      keyboardCaptureHandler = null;
    }
    destroyObjects(objects);
    scene._controlsOverlay = [];
  };

  const depth = 230;
  add(scene.add.rectangle(780, 420, 1560, 840, 0x010309, 0.84)
    .setDepth(depth)
    .setInteractive());

  add(scene.add.rectangle(780, 420, 1180, 720, 0x08131f, 0.998)
    .setStrokeStyle(2, 0x43dfff, 0.96)
    .setDepth(depth + 1));

  add(scene.add.text(235, 85, 'DRIVING CONTROLS', {
    fontFamily: PIXEL_FONT,
    fontSize: '14px',
    color: '#eefaff',
  }).setDepth(depth + 2));

  add(scene.add.text(235, 116, 'ONE SHARED LAYOUT + INPUT MAP FOR RACE AND DYNO', {
    fontFamily: BODY_FONT,
    fontSize: '9px',
    color: '#7da6b8',
    fontStyle: '700',
  }).setDepth(depth + 2));

  const closeButton = add(scene.add.rectangle(1280, 92, 100, 40, 0x141d28, 1)
    .setStrokeStyle(1, 0x678192, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 2));
  add(scene.add.text(1280, 92, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#cbdce6',
  }).setOrigin(0.5).setDepth(depth + 3));
  closeButton.on('pointerdown', close);

  const tabDefs = [
    ['touch', 'TOUCH LAYOUT', 520],
    ['keyboard', 'KEYBOARD', 780],
    ['controller', 'CONTROLLER', 1040],
  ];
  const tabButtons = [];

  const refreshTabs = () => {
    tabButtons.forEach(({ id, box, label }) => {
      const selected = activeTab === id;
      box
        .setFillStyle(selected ? 0x123246 : 0x0d1822, 1)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0x55dcff : 0x355267, 1);
      label.setColor(selected ? '#f3fcff' : '#86a1b0');
    });
  };

  const renderTouchTab = () => {
    // Exact race-screen aspect ratio: 1560 x 720.
    const preview = { x: 300, y: 205, w: 960, h: 443 };
    const sx = preview.w / CONTROL_REFERENCE.width;
    const sy = preview.h / CONTROL_REFERENCE.height;
    const mapX = value => preview.x + Number(value || 0) * sx;
    const mapY = value => preview.y + Number(value || 0) * sy;

    addTab(scene.add.rectangle(
      preview.x + preview.w / 2,
      preview.y + preview.h / 2,
      preview.w,
      preview.h,
      0x050d16,
      1
    ).setStrokeStyle(2, 0x294b61, 1).setDepth(depth + 2));

    // Mock race view. Keep the road/background as spatial context for the real
    // draggable controls, but do not add fake cars to the preview.
    const raceMock = addTab(scene.add.graphics().setDepth(depth + 2.2));
    raceMock.fillStyle(0x08111b, 1).fillRect(preview.x, preview.y, preview.w, preview.h);
    raceMock.fillStyle(0x101c28, 1).fillRect(preview.x, preview.y, preview.w, 145 * sy);

    // Low skyline / barriers.
    raceMock.fillStyle(0x172735, 1);
    [70, 170, 275, 390, 520, 650, 790, 905, 1040, 1180, 1310, 1440].forEach((logicalX, i) => {
      const h = (55 + (i % 4) * 17) * sy;
      raceMock.fillRect(mapX(logicalX), mapY(145) - h, 72 * sx, h);
    });
    raceMock.fillStyle(0x27323b, 1).fillRect(preview.x, mapY(238), preview.w, 285 * sy);

    // Subtle grey shoulders only. The centre dotted divider is the sole
    // white road marking, matching the actual race renderer.
    raceMock.fillStyle(0x62686d, 1)
      .fillRect(preview.x, mapY(238), preview.w, 18 * sy)
      .fillRect(preview.x, mapY(505), preview.w, 18 * sy);

    // Dotted lane line sits just below the top car's wheel line.
    raceMock.fillStyle(0xf2f3f1, 0.88);
    for (let logicalX = 15; logicalX < CONTROL_REFERENCE.width; logicalX += 145) {
      raceMock.fillRect(mapX(logicalX), mapY(377), 72 * sx, 4 * sy);
    }

    addTab(scene.add.text(preview.x + 18, preview.y + 15,
      'MOCK RACE VIEW  //  DRAG THE ACTUAL CONTROLS', {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#c8f3ff',
      }).setDepth(depth + 6));

    addTab(scene.add.text(preview.x + preview.w - 18, preview.y + 15,
      'RACE + DYNO SHARE THIS LAYOUT', {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: '#7fb7c9',
      }).setOrigin(1, 0).setDepth(depth + 6));

    // Clip the real control artwork to the mock race screen. This means moving
    // the dash partly below the viewport previews the same crop seen in-race.
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff, 1).fillRect(preview.x, preview.y, preview.w, preview.h);
    tabObjects.push(maskShape);
    objects.push(maskShape);
    const previewMask = maskShape.createGeometryMask();

    const visuals = {
      hud: {
        texture: 'hudCluster',
        gameScale: 0.47,
        originX: 0.5,
        originY: 1,
        zoneW: 1473 * 0.47,
        zoneH: 452 * 0.47,
        color: 0x55dcff,
      },
      clutch: {
        texture: 'clutchPedal',
        gameScale: 0.175,
        originX: 0.5,
        originY: 0.5,
        zoneW: 220,
        zoneH: 320,
        color: 0x48c9e8,
      },
      nos: {
        texture: 'nosButton',
        gameScale: 0.088,
        originX: 0.5,
        originY: 0.5,
        zoneW: 122,
        zoneH: 145,
        color: 0xa06be3,
      },
      shifter: {
        texture: 'shifterNeutral',
        gameScale: 0.20,
        originX: 0.5,
        originY: 0.5,
        zoneW: 245,
        zoneH: 330,
        color: 0xe0b24e,
      },
      throttle: {
        texture: 'throttlePedal',
        gameScale: 0.175,
        originX: 0.5,
        originY: 0.5,
        zoneW: 190,
        zoneH: 325,
        color: 0xe0b24e,
      },
    };

    TOUCH_COMPONENTS.forEach(({ id, label }) => {
      const base = CONTROL_LAYOUT_DEFAULTS[id];
      const saved = settings.layout?.[id] || {};
      const logicalX = base.x + Number(saved.dx || 0);
      const logicalY = base.y + Number(saved.dy || 0);
      const itemScale = Number(saved.scale || 1);
      const spec = visuals[id];

      const zoneW = spec.zoneW * itemScale * sx;
      const zoneH = spec.zoneH * itemScale * sy;
      const visualX = mapX(logicalX);
      const visualY = mapY(logicalY);
      const zoneCenterY = id === 'hud'
        ? visualY - zoneH / 2
        : visualY;

      let visual = null;
      if (scene.textures.exists(spec.texture)) {
        visual = addTab(scene.add.image(visualX, visualY, spec.texture)
          .setOrigin(spec.originX, spec.originY)
          .setScale(spec.gameScale * itemScale * sx)
          .setDepth(depth + 4)
          .setMask(previewMask));
      } else {
        visual = addTab(scene.add.rectangle(
          visualX,
          id === 'hud' ? zoneCenterY : visualY,
          Math.max(40, zoneW * 0.72),
          Math.max(30, zoneH * 0.72),
          0x10212d,
          0.94
        ).setStrokeStyle(2, spec.color, 1).setDepth(depth + 4).setMask(previewMask));
      }

      const zone = addTab(scene.add.rectangle(
        visualX,
        zoneCenterY,
        zoneW,
        zoneH,
        0xffffff,
        0.001
      ).setStrokeStyle(2, spec.color, 0.90)
        .setInteractive({ useHandCursor: true, draggable: true })
        .setDepth(depth + 5)
        .setMask(previewMask));
      scene.input.setDraggable(zone);

      const tag = addTab(scene.add.text(
        visualX,
        zoneCenterY - zoneH / 2 + 11,
        label,
        {
          fontFamily: PIXEL_FONT,
          fontSize: '5px',
          color: '#f4fbff',
          backgroundColor: '#08131f',
          padding: { x: 5, y: 3 },
        }
      ).setOrigin(0.5).setDepth(depth + 6).setMask(previewMask));

      const syncVisual = (x, centerY) => {
        const bottomY = centerY + zoneH / 2;
        if (visual?.setPosition) {
          visual.setPosition(x, id === 'hud' ? bottomY : centerY);
        }
        tag.setPosition(x, centerY - zoneH / 2 + 11);
      };

      zone.on('drag', (_pointer, dragX, dragY) => {
        const halfW = zoneW / 2;
        const clampedX = Phaser.Math.Clamp(
          dragX,
          preview.x + halfW,
          preview.x + preview.w - halfW
        );

        let clampedCenterY = dragY;
        if (id === 'hud') {
          // HUD is bottom-anchored in RaceHUD. Allow up to 60 logical px of
          // intentional bottom crop so the player can get it fully clear of
          // the cars if desired.
          const minBottomY = preview.y + zoneH;
          const maxBottomY = preview.y + preview.h + 60 * sy;
          const proposedBottomY = dragY + zoneH / 2;
          const bottomY = Phaser.Math.Clamp(proposedBottomY, minBottomY, maxBottomY);
          clampedCenterY = bottomY - zoneH / 2;
        } else {
          const halfH = zoneH / 2;
          clampedCenterY = Phaser.Math.Clamp(
            dragY,
            preview.y + halfH,
            preview.y + preview.h - halfH
          );
        }

        const proposedLogical = {
          x: (clampedX - preview.x) / sx,
          y: id === 'hud'
            ? ((clampedCenterY + zoneH / 2 - preview.y) / sy)
            : ((clampedCenterY - preview.y) / sy),
        };
        const candidatePlacement = {
          ...(settings.layout?.[id] || {}),
          dx: proposedLogical.x - base.x,
          dy: proposedLogical.y - base.y,
        };

        // The three large driving touch zones are mutually exclusive. Keeping
        // the invalid drag at its last valid point makes the boundary feel
        // like a physical stop rather than silently creating ambiguous input.
        if (!isTouchControlPlacementValid(id, candidatePlacement, settings.layout)) {
          return;
        }

        zone.setPosition(clampedX, clampedCenterY);
        syncVisual(clampedX, clampedCenterY);
      });

      zone.on('dragend', () => {
        const logical = {
          x: (zone.x - preview.x) / sx,
          y: id === 'hud'
            ? ((zone.y + zoneH / 2 - preview.y) / sy)
            : ((zone.y - preview.y) / sy),
        };
        settings = updateControlSettings(next => {
          next.layout[id].dx = logical.x - base.x;
          next.layout[id].dy = logical.y - base.y;
          return next;
        });
      });
    });

    // Keep every scale control on one evenly spaced baseline below the mock
    // race view. RESET occupies its own sixth slot and cannot overlap.
    const rowY = 742;
    const scaleXs = [370, 535, 700, 865, 1030];
    TOUCH_COMPONENTS.forEach(({ id, label }, index) => {
      const x = scaleXs[index];
      const currentScale = Number(settings.layout?.[id]?.scale || 1);

      addTab(scene.add.text(x, rowY - 31,
        label + '  ' + Math.round(currentScale * 100) + '%', {
          fontFamily: PIXEL_FONT,
          fontSize: '5px',
          color: '#8fb0c0',
        }).setOrigin(0.5).setDepth(depth + 3));

      const minus = addTab(scene.add.rectangle(x - 34, rowY, 56, 34, 0x111d28, 1)
        .setStrokeStyle(1, 0x456273, 1)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 3));
      const plus = addTab(scene.add.rectangle(x + 34, rowY, 56, 34, 0x111d28, 1)
        .setStrokeStyle(1, 0x456273, 1)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 3));
      addTab(scene.add.text(x - 34, rowY, '−', {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#dcebf2',
      }).setOrigin(0.5).setDepth(depth + 4));
      addTab(scene.add.text(x + 34, rowY, '+', {
        fontFamily: PIXEL_FONT, fontSize: '10px', color: '#dcebf2',
      }).setOrigin(0.5).setDepth(depth + 4));

      const changeScale = delta => {
        const nextScale = Phaser.Math.Clamp(
          Number(settings.layout?.[id]?.scale || 1) + delta,
          0.55,
          1.65
        );
        const candidatePlacement = {
          ...(settings.layout?.[id] || {}),
          scale: nextScale,
        };
        if (!isTouchControlPlacementValid(id, candidatePlacement, settings.layout)) return;

        settings = updateControlSettings(next => {
          next.layout[id].scale = nextScale;
          return next;
        });
        renderTab();
      };
      minus.on('pointerdown', () => changeScale(-0.10));
      plus.on('pointerdown', () => changeScale(0.10));
    });

    const resetX = 1195;
    const reset = addTab(scene.add.rectangle(resetX, rowY, 130, 34, 0x191c23, 1)
      .setStrokeStyle(1, 0x7a6d59, 1)
      .setInteractive({ useHandCursor: true }).setDepth(depth + 3));
    addTab(scene.add.text(resetX, rowY, 'RESET', {
      fontFamily: PIXEL_FONT, fontSize: '6px', color: '#d9c9ad',
    }).setOrigin(0.5).setDepth(depth + 4));
    reset.on('pointerdown', () => {
      settings = resetControlSettings('layout');
      renderTab();
    });
  };

  const renderBindingRows = (mode) => {
    const source = mode === 'keyboard' ? settings.keyboard : settings.controller;
    const heading = mode === 'keyboard'
      ? 'TAP A BINDING, THEN PRESS THE NEW KEY'
      : 'TAP A BINDING, THEN PRESS A GAMEPAD BUTTON / TRIGGER / STICK AXIS';
    addTab(scene.add.text(780, 215, heading, {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#93dff7',
    }).setOrigin(0.5).setDepth(depth + 3));

    if (mode === 'controller') {
      const pads = getConnectedGamepads();
      const padLabel = pads.length
        ? 'CONNECTED  //  ' + String(pads[0].id || 'GAMEPAD').slice(0, 70)
        : 'NO GAMEPAD DETECTED  //  CONNECT BY BLUETOOTH OR USB-C, THEN PRESS A BUTTON';
      addTab(scene.add.text(780, 250, padLabel, {
        fontFamily: BODY_FONT, fontSize: '8px',
        color: pads.length ? '#72e6c4' : '#d0b77d',
        fontStyle: '700',
      }).setOrigin(0.5).setDepth(depth + 3));
    }

    CONTROL_ACTIONS.forEach((action, index) => {
      const column = index < 6 ? 0 : 1;
      const row = column === 0 ? index : index - 6;
      const x = column === 0 ? 515 : 1045;
      const y = (mode === 'controller' ? 305 : 275) + row * 66;

      addTab(scene.add.text(x - 205, y, action.label, {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#9cb7c6',
      }).setOrigin(0, 0.5).setDepth(depth + 3));

      const box = addTab(scene.add.rectangle(x + 75, y, 300, 42, 0x0d1b27, 1)
        .setStrokeStyle(1, 0x3e7189, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(depth + 3));

      const value = mode === 'keyboard'
        ? keyboardBindingLabel(source?.[action.id])
        : controllerBindingLabel(source?.[action.id]);
      const label = addTab(scene.add.text(x + 75, y, value, {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#eefaff',
      }).setOrigin(0.5).setDepth(depth + 4));
      if (label.width > 276) label.setScale(276 / label.width);

      box.on('pointerdown', () => {
        if (mode === 'keyboard') {
          keyboardCaptureAction = action.id;
          controllerCaptureAction = null;
        } else {
          controllerCaptureAction = action.id;
          keyboardCaptureAction = null;
        }
        scene._menuNavigationCaptureInput = true;
        label.setText('PRESS INPUT…').setColor('#ffe08a').setScale(1);
      });
    });

    const reset = addTab(scene.add.rectangle(780, 690, 260, 38, 0x191c23, 1)
      .setStrokeStyle(1, 0x7a6d59, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 3));
    addTab(scene.add.text(780, 690,
      mode === 'keyboard' ? 'RESET KEYBOARD' : 'RESET CONTROLLER', {
        fontFamily: PIXEL_FONT, fontSize: '6px', color: '#d9c9ad',
      }).setOrigin(0.5).setDepth(depth + 4));
    reset.on('pointerdown', () => {
      settings = resetControlSettings(mode);
      keyboardCaptureAction = null;
      controllerCaptureAction = null;
      renderTab();
    });

    if (mode === 'controller') {
      addTab(scene.add.text(780, 735,
        'DEFAULT: RT THROTTLE  •  LT CLUTCH  •  RB SHIFT UP  •  LB SHIFT DOWN  •  A/CROSS NOS\nAnalogue triggers and stick axes keep their progressive 0–100% input.\nMENUS: D-PAD / LEFT STICK  •  A/CROSS OR X/SQUARE SELECT', {
          fontFamily: BODY_FONT, fontSize: '8px', color: '#829eac',
          align: 'center', lineSpacing: 3,
        }).setOrigin(0.5).setDepth(depth + 3));
    } else {
      addTab(scene.add.text(780, 735,
        'SHIFT UP / DOWN can be bound as sequential controls; GEAR 1–6 remain available for direct selection.\nMENUS: ARROW KEYS  •  ENTER / SPACE / X SELECT', {
          fontFamily: BODY_FONT, fontSize: '8px', color: '#829eac',
          align: 'center',
        }).setOrigin(0.5).setDepth(depth + 3));
    }
  };

  const renderControllerTab = () => {
    renderBindingRows('controller');

    controllerTimer = scene.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        if (!controllerCaptureAction) return;
        const pad = getConnectedGamepads()[0];
        if (!pad) return;

        for (let i = 0; i < (pad.buttons?.length || 0); i++) {
          const button = pad.buttons[i];
          if (Number(button?.value || 0) >= 0.60 || button?.pressed) {
            const action = controllerCaptureAction;
            controllerCaptureAction = null;
            settings = updateControlSettings(next => {
              next.controller[action] = { kind: 'button', index: i };
              return next;
            });
            renderTab();
            return;
          }
        }

        for (let i = 0; i < (pad.axes?.length || 0); i++) {
          const value = Number(pad.axes[i] || 0);
          if (Math.abs(value) >= 0.78) {
            const action = controllerCaptureAction;
            controllerCaptureAction = null;
            settings = updateControlSettings(next => {
              next.controller[action] = {
                kind: 'axis',
                index: i,
                direction: value < 0 ? -1 : 1,
                deadzone: 0.18,
              };
              return next;
            });
            renderTab();
            return;
          }
        }
      },
    });
  };

  const renderTab = () => {
    scene._menuNavigationCaptureInput = false;
    destroyTab();
    settings = getControlSettings();
    keyboardCaptureAction = null;
    controllerCaptureAction = null;
    refreshTabs();

    if (activeTab === 'touch') {
      renderTouchTab();
    } else if (activeTab === 'keyboard') {
      renderBindingRows('keyboard');
    } else {
      renderControllerTab();
    }
  };

  tabDefs.forEach(([id, labelText, x]) => {
    const box = add(scene.add.rectangle(x, 160, 220, 42, 0x0d1822, 1)
      .setStrokeStyle(1, 0x355267, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(depth + 2));
    const label = add(scene.add.text(x, 160, labelText, {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: '#86a1b0',
    }).setOrigin(0.5).setDepth(depth + 3));
    box.on('pointerdown', () => {
      activeTab = id;
      renderTab();
    });
    tabButtons.push({ id, box, label });
  });

  keyboardCaptureHandler = event => {
    if (activeTab !== 'keyboard' || !keyboardCaptureAction) return;
    const code = String(event?.code || '');
    if (!code) return;
    if (code === 'Escape') {
      keyboardCaptureAction = null;
      renderTab();
      return;
    }
    try { event.preventDefault?.(); } catch (e) {}
    const action = keyboardCaptureAction;
    keyboardCaptureAction = null;
    settings = updateControlSettings(next => {
      next.keyboard[action] = [code];
      return next;
    });
    renderTab();
  };
  scene.input.keyboard.on('keydown', keyboardCaptureHandler);

  renderTab();
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

  add(scene.add.rectangle(780, 420, 980, 770, 0x08131f, 0.995)
    .setStrokeStyle(2, 0x43dfff, 0.92)
    .setDepth(181));

  add(scene.add.text(320, 68, 'SETTINGS', {
    fontFamily: PIXEL_FONT,
    fontSize: '15px',
    color: '#eefaff',
  }).setDepth(183));

  const closeButton = add(scene.add.rectangle(1190, 72, 110, 40, 0x141d28, 1)
    .setStrokeStyle(1, 0x678192, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(183));

  add(scene.add.text(1190, 72, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#cbdce6',
  }).setOrigin(0.5).setDepth(184));

  closeButton.on('pointerdown', close);

  if (scene.registry.get('devMode')) {
    const wheelFitButton = add(scene.add.rectangle(610, 72, 150, 40, 0x182138, 1)
      .setStrokeStyle(1, 0xc59652, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(183));
    add(scene.add.text(610, 72, 'D) WHEEL FIT', {
      fontFamily: PIXEL_FONT,
      fontSize: '6px',
      color: '#ffe1a6',
    }).setOrigin(0.5).setDepth(184));
    wheelFitButton.on('pointerdown', () => {
      close();
      scene.scene.start('WheelCalibrationScene');
    });
  }

  const controlsButton = add(scene.add.rectangle(810, 72, 170, 40, 0x102138, 1)
    .setStrokeStyle(1, 0x45a8cc, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(183));

  add(scene.add.text(810, 72, 'CONTROLS', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#c6efff',
  }).setOrigin(0.5).setDepth(184));

  controlsButton.on('pointerdown', () => showControlsPanel(scene));

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

  buildVolumeRow('MUSIC', 150, 'music');
  buildVolumeRow('SOUND FX', 212, 'sfx');

  add(scene.add.text(340, 270, 'DRIVER PROFILES', {
    fontFamily: PIXEL_FONT,
    fontSize: '9px',
    color: '#a8d4ec',
  }).setDepth(183));

  add(scene.add.text(1220, 272, '3 SLOTS', {
    fontFamily: BODY_FONT,
    fontSize: '10px',
    color: '#718a99',
  }).setOrigin(1, 0).setDepth(183));

  // Capture the live slot before any profile pointer can change. If the active
  // slot was just deleted, do not snapshot the stale registry back into it.
  const beforeSnapshotSlots = getProfileSlots();
  const beforeSnapshotActiveIndex = getActiveProfileIndex();
  if (beforeSnapshotSlots[beforeSnapshotActiveIndex]?.occupied) {
    saveSessionState(scene.registry);
  }
  const slots = getProfileSlots();
  const activeIndex = getActiveProfileIndex();
  const activeSlotOccupied = Boolean(slots[activeIndex]?.occupied);
  let selectedProfileIndex = activeSlotOccupied
    ? activeIndex
    : Math.max(0, slots.findIndex(slot => slot.occupied));
  const cardXs = [500, 780, 1060];
  const profileCards = [];
  const selectionFrames = [];
  let profileActionButton = null;
  let profileActionLabel = null;

  const refreshProfileSelection = () => {
    selectionFrames.forEach((frame, index) => {
      frame?.setVisible(index === selectedProfileIndex);
    });

    profileCards.forEach((card, index) => {
      if (!card) return;
      const slot = slots[index];
      const active = Boolean(slot?.occupied && index === activeIndex);
      const selected = index === selectedProfileIndex;

      card
        .setFillStyle(selected ? 0x102536 : active ? 0x10283a : 0x0a1723, 1)
        .setStrokeStyle(
          selected ? 2 : active ? 3 : 2,
          selected ? 0x55dfff : active ? 0x48dfff : 0x29485e,
          1
        );
    });

    const selectedSlot = slots[selectedProfileIndex];
    if (!profileActionLabel) return;

    if (!selectedSlot?.occupied) {
      profileActionLabel.setText('CREATE PROFILE ' + (selectedProfileIndex + 1) + '  >');
      profileActionButton
        ?.setFillStyle(0x0c2b29, 1)
        .setStrokeStyle(2, 0x62e8c7, 1);
      return;
    }

    const selectedName = [selectedSlot.firstName, selectedSlot.lastName]
      .filter(Boolean)
      .join(' ')
      .toUpperCase() || 'DRIVER';

    profileActionLabel.setText(
      selectedProfileIndex === activeIndex
        ? 'RETURN TO ' + selectedName + '  >'
        : 'SWITCH TO ' + selectedName + '  >'
    );
    profileActionButton
      ?.setFillStyle(0x102638, 1)
      .setStrokeStyle(2, 0x45c9ed, 1);
  };

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

  const profileLowerShift = -46;

  slots.forEach((slot, i) => {
    const x = cardXs[i];
    const occupied = slot.occupied;
    const active = occupied && i === activeIndex;

    const card = add(scene.add.rectangle(x, 475, 240, 340, active ? 0x10283a : 0x0a1723, 1)
      .setStrokeStyle(active ? 3 : 2, active ? 0x48dfff : 0x29485e, 1)
      .setDepth(183)
      .setInteractive({ useHandCursor: true }));

    profileCards[i] = card;
    selectionFrames[i] = add(scene.add.rectangle(x, 475, 250, 350, 0xffffff, 0)
      .setStrokeStyle(3, 0x62e8c7, 1)
      .setDepth(187)
      .setVisible(false));

    const profileName = occupied
      ? ([slot.firstName, slot.lastName].filter(Boolean).join(' ') || characters[slot.playerCharacterId]?.name || 'DRIVER')
      : 'NEW DRIVER';
    const profileHeading = add(scene.add.text(x, 326, profileName.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: '7px',
      color: active ? '#65e4ff' : '#7894a5',
      align: 'center',
      padding: { x: 4, y: 3 },
    }).setOrigin(0.5).setDepth(184));
    if (profileHeading.width > 204) profileHeading.setScale(204 / profileHeading.width);

    if (!occupied) {
      add(scene.add.rectangle(x, 405, 120, 120, 0x0b1119, 1)
        .setStrokeStyle(2, 0x37556a, 1)
        .setDepth(184));

      add(scene.add.text(x, 401, '+', {
        fontFamily: PIXEL_FONT,
        fontSize: '30px',
        color: '#55dfff',
      }).setOrigin(0.5).setDepth(185));

      add(scene.add.text(x, 505 + profileLowerShift, 'NEW DRIVER', {
        fontFamily: PIXEL_FONT,
        fontSize: '8px',
        color: '#dff9ff',
      }).setOrigin(0.5).setDepth(185));

      add(scene.add.text(x, 548 + profileLowerShift, 'Tap to start', {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: '#78909e',
      }).setOrigin(0.5).setDepth(185));

      card.on('pointerdown', () => {
        if (transitioning) return;
        selectedProfileIndex = i;
        refreshProfileSelection();
      });
      return;
    }

    const character = characters[slot.playerCharacterId] || characters.renMizuno;
    const portraitX = x;
    const portraitY = 405;
    const portraitSize = 120;

    add(scene.add.rectangle(portraitX, portraitY, portraitSize, portraitSize, 0x101b27, 1)
      .setStrokeStyle(1, active ? 0x49dfff : 0x315470, 1)
      .setDepth(184));

    const profile = createCharacterProfile(scene, {
      characterId: character.id,
      pose: 'idle',
      x: portraitX,
      y: portraitY,
      frameWidth: portraitSize,
      frameHeight: portraitSize,
      side: 'center',
      depth: 185,
      flipInward: false,
      mask: true,
    });

    if (profile) {
      add(profile.image);
      if (profile.maskShape) masks.push(profile.maskShape);
    } else {
      add(scene.add.text(portraitX, portraitY, '?', {
        fontFamily: PIXEL_FONT,
        fontSize: '18px',
        color: '#688396',
      }).setOrigin(0.5).setDepth(185));
    }


    add(scene.add.text(
      x,
      530 + profileLowerShift,
      slot.carCount + ' CAR' + (slot.carCount === 1 ? '' : 'S') + '  •  ¥' + slot.cash.toLocaleString('en-US'),
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#88a4b4',
      }
    ).setOrigin(0.5).setDepth(185));

    add(scene.add.text(
      x,
      558 + profileLowerShift,
      slot.wins + ' W  •  ' + slot.losses + ' L',
      {
        fontFamily: BODY_FONT,
        fontSize: '9px',
        color: '#7695a6',
        fontStyle: '700',
      }
    ).setOrigin(0.5).setDepth(185));

    add(scene.add.text(x, 580 + profileLowerShift, playTimeLabel(slot.playTimeMs), {
      fontFamily: PIXEL_FONT,
      fontSize: '5px',
      color: '#789dad',
    }).setOrigin(0.5).setDepth(185));

    if (active) {
      add(scene.add.text(x, 603 + profileLowerShift, 'ACTIVE', {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#64e5ff',
      }).setOrigin(0.5).setDepth(185));
    } else {
      add(scene.add.text(x, 603 + profileLowerShift, 'TAP TO SELECT', {
        fontFamily: PIXEL_FONT,
        fontSize: '6px',
        color: '#9ac5d9',
      }).setOrigin(0.5).setDepth(185));
    }

    card.on('pointerdown', () => {
      if (transitioning) return;
      selectedProfileIndex = i;
      refreshProfileSelection();
    });

    if (active) {
      const renameButton = add(scene.add.rectangle(x - 56, 610, 100, 30, 0x102638, 1)
        .setStrokeStyle(1, 0x45b9dc, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(188));

      add(scene.add.text(x - 56, 610, 'RENAME', {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: '#c9f4ff',
      }).setOrigin(0.5).setDepth(189));

      renameButton.on('pointerdown', () => {
        showRenameDriverPanel(scene, () => {
          close();
          showSettingsPanel(scene);
        });
      });

      const deleteButton = add(scene.add.rectangle(x + 56, 610, 100, 30, 0x25141a, 1)
        .setStrokeStyle(1, 0x965266, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(188));

      add(scene.add.text(x + 56, 610, 'DELETE', {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: '#ffafbd',
      }).setOrigin(0.5).setDepth(189));

      deleteButton.on('pointerdown', () => showDeleteConfirm(slot));
    } else {
      const deleteButton = add(scene.add.rectangle(x, 610, 116, 30, 0x25141a, 1)
        .setStrokeStyle(1, 0x965266, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(188));

      add(scene.add.text(x, 610, 'DELETE', {
        fontFamily: PIXEL_FONT,
        fontSize: '5px',
        color: '#ffafbd',
      }).setOrigin(0.5).setDepth(189));

      deleteButton.on('pointerdown', () => showDeleteConfirm(slot));
    }
  });

  profileActionButton = add(scene.add.rectangle(780, 681, 390, 44, 0x102638, 1)
    .setStrokeStyle(2, 0x45c9ed, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(188));

  profileActionLabel = add(scene.add.text(780, 681, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#effbff',
  }).setOrigin(0.5).setDepth(189));

  profileActionButton.on('pointerdown', () => {
    if (transitioning) return;

    const selectedSlot = slots[selectedProfileIndex];
    if (selectedProfileIndex === activeIndex && selectedSlot?.occupied) {
      close();
      return;
    }

    const currentSlots = getProfileSlots();
    const currentActive = getActiveProfileIndex();
    if (currentSlots[currentActive]?.occupied) {
      saveSessionState(scene.registry);
    }

    if (!selectedSlot?.occupied) {
      beginNewProfile(selectedProfileIndex);
      reloadForProfile('CREATING DRIVER');
      return;
    }

    setActiveProfileIndex(selectedProfileIndex);
    reloadForProfile('SWITCHING DRIVER');
  });

  refreshProfileSelection();

  // Keep the low-priority account controls together at the bottom:
  // difficulty on the left, profile backup on the right.
  add(scene.add.text(520, 734, 'RACE DIFFICULTY', {
    fontFamily: PIXEL_FONT,
    fontSize: '5px',
    color: '#6f8f9f',
  }).setOrigin(0.5).setDepth(183));

  let activeDifficulty = normalisePlayerDifficulty(
    scene.registry.get('playerDifficulty')
  );
  const difficultyProfileAvailable = Boolean(
    getProfileSlots()[getActiveProfileIndex()]?.occupied
  );
  const difficultyButtons = [];
  const difficultyXs = [410, 520, 630];

  const refreshDifficulty = () => {
    difficultyButtons.forEach(({ id, box, label }) => {
      const active = id === activeDifficulty;
      box
        .setFillStyle(active ? 0x123044 : 0x0c1721, 1)
        .setStrokeStyle(active ? 2 : 1, active ? 0x55dcff : 0x355267, 1);
      label.setColor(active ? '#f2fcff' : '#7895a5');
    });
  };

  PLAYER_DIFFICULTIES.forEach((id, index) => {
    const box = add(scene.add.rectangle(
      difficultyXs[index],
      764,
      96,
      28,
      0x0c1721,
      1
    ).setStrokeStyle(1, 0x355267, 1)
      .setDepth(183));

    const label = add(scene.add.text(difficultyXs[index], 764, id, {
      fontFamily: PIXEL_FONT,
      fontSize: id === 'STANDARD' ? '4px' : '5px',
      color: '#7895a5',
    }).setOrigin(0.5).setDepth(184));

    if (difficultyProfileAvailable) {
      box.setInteractive({ useHandCursor: true });
      box.on('pointerdown', () => {
        activeDifficulty = id;
        scene.registry.set('playerDifficulty', id);
        saveSessionState(scene.registry);
        refreshDifficulty();
      });
    } else {
      box.disableInteractive();
      label.setColor('#4e5c65');
    }

    difficultyButtons.push({ id, box, label });
  });
  refreshDifficulty();

  add(scene.add.text(980, 734, 'PROFILE BACKUP', {
    fontFamily: PIXEL_FONT,
    fontSize: '5px',
    color: '#536b79',
  }).setOrigin(0.5).setDepth(183));

  const exportBackupButton = add(scene.add.rectangle(900, 764, 140, 28, 0x0d1720, 1)
    .setStrokeStyle(1, 0x395467, 1)
    .setDepth(183));
  const exportBackupLabel = add(scene.add.text(900, 764, 'EXPORT', {
    fontFamily: PIXEL_FONT,
    fontSize: '5px',
    color: '#8da7b5',
  }).setOrigin(0.5).setDepth(184));

  const importBackupButton = add(scene.add.rectangle(1060, 764, 140, 28, 0x0d1720, 1)
    .setStrokeStyle(1, 0x395467, 1)
    .setDepth(183));
  const importBackupLabel = add(scene.add.text(1060, 764, 'IMPORT', {
    fontFamily: PIXEL_FONT,
    fontSize: '5px',
    color: '#8da7b5',
  }).setOrigin(0.5).setDepth(184));

  const selectedSlotForBackup = slots[selectedProfileIndex];
  if (selectedSlotForBackup?.occupied) {
    exportBackupButton.setInteractive({ useHandCursor: true });
    exportBackupButton.on('pointerdown', () => {
      const ok = downloadProfileBackup(scene, selectedProfileIndex);
      if (ok) {
        exportBackupLabel.setText('EXPORTED').setColor('#62e8c7');
      } else {
        exportBackupLabel.setText('EXPORT FAILED').setColor('#ff8fa3');
      }
      window.setTimeout(() => {
        if (exportBackupLabel?.active) exportBackupLabel.setText('EXPORT').setColor('#8da7b5');
      }, 1800);
    });
  } else {
    exportBackupLabel.setColor('#4f5b63');
  }

  importBackupButton.setInteractive({ useHandCursor: true });
  importBackupButton.on('pointerdown', async () => {
    if (transitioning) return;
    const payload = await chooseProfileBackupFile();
    if (!payload) return;

    if (
      payload.__parseError ||
      payload.format !== 'TOKYO_SHIFT_PROFILE_BACKUP' ||
      Number(payload.formatVersion || 0) !== 1 ||
      !payload.state ||
      typeof payload.state !== 'object'
    ) {
      importBackupLabel.setText('INVALID FILE').setColor('#ff8fa3');
      window.setTimeout(() => {
        if (importBackupLabel?.active) importBackupLabel.setText('IMPORT').setColor('#8da7b5');
      }, 1800);
      return;
    }

    showBackupImportConfirm(scene, selectedProfileIndex, payload, () => {
      try {
        importProfileBackup(selectedProfileIndex, payload);
      } catch (e) {
        importBackupLabel.setText('IMPORT FAILED').setColor('#ff8fa3');
        return;
      }

      if (selectedProfileIndex === getActiveProfileIndex()) {
        reloadForProfile('RESTORING BACKUP');
        return;
      }

      close();
      showSettingsPanel(scene);
    });
  });
}
