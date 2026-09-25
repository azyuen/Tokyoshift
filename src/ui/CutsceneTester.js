import { characters } from '../data/characters.js?v=20260925-r195';
import {
  CUTSCENES,
  CUTSCENE_ORDER,
} from '../data/cutscenes.js?v=20260925-r188';
import {
  playMangaCutscene,
  sceneCutsceneActive,
} from './MangaCutscene.js?v=20260925-r188';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const DEPTH = 820;
const PAGE_SIZE = 5;

const destroyObjects = objects => {
  (objects || []).forEach(obj => {
    try { obj?.destroy?.(); } catch (e) {}
  });
};

function resolvePreviewCharacter(scene, definition, side) {
  const token = definition.characters?.[side];
  if (!token) return '—';
  if (token === '$PLAYER') {
    const id = scene.registry.get('playerCharacterId') || 'renMizuno';
    return characters[id]?.name || id;
  }
  if (String(token).startsWith('$')) {
    const key = String(token).slice(1);
    const id = definition.preview?.characterOverrides?.[key];
    return characters[id]?.name || id || token;
  }
  return characters[token]?.name || token;
}

export function addDevCutsceneButton(scene, x = 840, y = 35, options = {}) {
  if (!scene?.registry?.get('devMode')) return null;

  const depth = Number(options.depth || 43);
  const button = scene.add.rectangle(x, y, 166, 38, 0x15131c, 1)
    .setStrokeStyle(1, 0xff72a6, 0.95)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth)
    .setScrollFactor(0);

  const label = scene.add.text(x, y, 'DEV // SCENES', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#ffc0d6',
  }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);

  button.on('pointerover', () => button.setStrokeStyle(2, 0xff9fc1, 1));
  button.on('pointerout', () => button.setStrokeStyle(1, 0xff72a6, 0.95));
  button.on('pointerdown', () => {
    if (!sceneCutsceneActive(scene)) showCutsceneTester(scene);
  });

  const api = {
    button,
    label,
    setVisible(value) {
      button.setVisible(Boolean(value));
      label.setVisible(Boolean(value));
      if (value) button.setInteractive({ useHandCursor: true });
      else button.disableInteractive();
      return api;
    },
    destroy() {
      button.destroy();
      label.destroy();
    },
  };
  return api;
}

export function showCutsceneTester(scene) {
  if (!scene?.registry?.get('devMode')) return;
  if (scene._cutsceneTesterObjects?.length || sceneCutsceneActive(scene)) return;

  const width = Number(scene.scale.width || 1560);
  const height = Number(scene.scale.height || 840);
  const objects = [];
  const rowObjects = [];
  const add = obj => { objects.push(obj); return obj; };
  const addRow = obj => { rowObjects.push(obj); objects.push(obj); return obj; };
  let offset = 0;

  const close = () => {
    destroyObjects(objects);
    scene._cutsceneTesterObjects = [];
  };

  scene._cutsceneTesterObjects = objects;

  add(scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72)
    .setDepth(DEPTH)
    .setScrollFactor(0)
    .setInteractive());

  add(scene.add.rectangle(width / 2, height / 2, Math.min(1040, width - 100), Math.min(690, height - 70), 0x09111a, 0.995)
    .setStrokeStyle(3, 0xff72a6, 1)
    .setDepth(DEPTH + 1)
    .setScrollFactor(0));

  add(scene.add.text(width / 2 - 455, 92, 'CUTSCENE TESTER', {
    fontFamily: PIXEL_FONT,
    fontSize: '14px',
    color: '#fff4f8',
  }).setDepth(DEPTH + 2).setScrollFactor(0));

  add(scene.add.text(width / 2 - 455, 126,
    'PREVIEW MODE // NO STORY FLAGS, REWARDS OR PROGRESSION CHANGES',
    {
      fontFamily: BODY_FONT,
      fontSize: '10px',
      color: '#ffadc9',
      fontStyle: '700',
    }
  ).setDepth(DEPTH + 2).setScrollFactor(0));

  const closeButton = add(scene.add.rectangle(width / 2 + 420, 105, 120, 38, 0x171c25, 1)
    .setStrokeStyle(1, 0x718493, 1)
    .setInteractive({ useHandCursor: true })
    .setDepth(DEPTH + 3)
    .setScrollFactor(0));

  add(scene.add.text(width / 2 + 420, 105, 'CLOSE', {
    fontFamily: PIXEL_FONT,
    fontSize: '7px',
    color: '#dce9ef',
  }).setOrigin(0.5).setDepth(DEPTH + 4).setScrollFactor(0));

  closeButton.on('pointerdown', close);

  const pageLabel = add(scene.add.text(width / 2, height - 92, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#90a7b5',
  }).setOrigin(0.5).setDepth(DEPTH + 4).setScrollFactor(0));

  const previous = add(scene.add.rectangle(width / 2 - 150, height - 91, 160, 40, 0x121a24, 1)
    .setStrokeStyle(1, 0x4e6575, 1)
    .setDepth(DEPTH + 3)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true }));

  add(scene.add.text(width / 2 - 150, height - 91, '< PREV', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#cbd9e1',
  }).setOrigin(0.5).setDepth(DEPTH + 4).setScrollFactor(0));

  const next = add(scene.add.rectangle(width / 2 + 150, height - 91, 160, 40, 0x121a24, 1)
    .setStrokeStyle(1, 0x4e6575, 1)
    .setDepth(DEPTH + 3)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true }));

  add(scene.add.text(width / 2 + 150, height - 91, 'NEXT >', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#cbd9e1',
  }).setOrigin(0.5).setDepth(DEPTH + 4).setScrollFactor(0));

  const clearRows = () => {
    while (rowObjects.length) {
      const obj = rowObjects.pop();
      const index = objects.indexOf(obj);
      if (index >= 0) objects.splice(index, 1);
      destroyObjects([obj]);
    }
  };

  const render = () => {
    clearRows();
    const ids = CUTSCENE_ORDER.filter(id => CUTSCENES[id]);
    const maxOffset = Math.max(0, Math.ceil(ids.length / PAGE_SIZE) - 1);
    offset = Math.max(0, Math.min(maxOffset, offset));
    const pageIds = ids.slice(offset * PAGE_SIZE, offset * PAGE_SIZE + PAGE_SIZE);

    pageLabel.setText(
      'PAGE ' + (offset + 1) + ' / ' + (maxOffset + 1) +
      '  //  ' + ids.length + ' REGISTERED'
    );

    previous.setAlpha(offset > 0 ? 1 : 0.35);
    next.setAlpha(offset < maxOffset ? 1 : 0.35);

    pageIds.forEach((id, index) => {
      const definition = CUTSCENES[id];
      const y = 215 + index * 110;
      const row = addRow(scene.add.rectangle(width / 2, y, 900, 94, 0x101923, 1)
        .setStrokeStyle(2, 0x304b5d, 1)
        .setDepth(DEPTH + 2)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true }));

      addRow(scene.add.text(width / 2 - 425, y - 30,
        String(definition.testerLabel || definition.title || id).toUpperCase(),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#ffffff',
        }
      ).setDepth(DEPTH + 3).setScrollFactor(0));

      const pages = Array.isArray(definition.pages) ? definition.pages.length : 0;
      const left = resolvePreviewCharacter(scene, definition, 'left');
      const right = resolvePreviewCharacter(scene, definition, 'right');

      addRow(scene.add.text(width / 2 - 425, y + 8,
        definition.category + '  //  ' + id +
        '\n' + pages + ' PAGES  //  LEFT: ' + left + '  //  RIGHT: ' + right,
        {
          fontFamily: BODY_FONT,
          fontSize: '9px',
          color: '#9fb6c4',
          fontStyle: '600',
          lineSpacing: 2,
        }
      ).setDepth(DEPTH + 3).setScrollFactor(0));

      addRow(scene.add.text(width / 2 + 410, y, 'PLAY  >', {
        fontFamily: PIXEL_FONT,
        fontSize: '7px',
        color: '#ff9fc1',
      }).setOrigin(1, 0.5).setDepth(DEPTH + 3).setScrollFactor(0));

      row.on('pointerover', () => row.setStrokeStyle(2, 0xff72a6, 1));
      row.on('pointerout', () => row.setStrokeStyle(2, 0x304b5d, 1));
      row.on('pointerdown', () => {
        close();
        playMangaCutscene(scene, id, { preview: true });
      });
    });
  };

  previous.on('pointerdown', () => {
    if (offset <= 0) return;
    offset -= 1;
    render();
  });
  next.on('pointerdown', () => {
    const maxOffset = Math.max(
      0,
      Math.ceil(CUTSCENE_ORDER.filter(id => CUTSCENES[id]).length / PAGE_SIZE) - 1
    );
    if (offset >= maxOffset) return;
    offset += 1;
    render();
  });

  render();
}
