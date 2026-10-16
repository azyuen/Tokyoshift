import { characters } from '../data/characters.js?v=20261006-r391';
import {
  CUTSCENES,
  CUTSCENE_ORDER,
} from '../data/cutscenes.js?v=20261017-r562';
import {
  playMangaCutscene,
  sceneCutsceneActive,
} from './MangaCutscene.js?v=20261017-r562';
import { playCanalYardStory } from './CanalYardStory.js?v=20261017-r562';
import { preloadSevenRivalsMontageAssets, startSevenRivalsPortraitMontage } from './SevenRivalsMontage.js?v=20261017-r562';
import { preloadFullCrewCelebrationAssets, showFullCrewCelebration } from './FullCrewCelebration.js?v=20261017-r562';

const PIXEL_FONT = '"Silkscreen", monospace';
const BODY_FONT = '"Rajdhani", monospace';
const DEPTH = 820;
const PAGE_SIZE = 5;

// A story chapter is one tester entry. Short encounter/result scenes follow
// the campaign chapters rather than obscuring their reading order.
const OPENING_SEQUENCE = [
  'openingStationEncounter',
  'openingSayakaPhoneCall',
  'openingSayakaKeys',
  'openingSayakaFarewell',
  'openingDaichiAfterSayaka',
];
const CAREER_CHAPTERS = [
  { id: '__openingChapter01', label: 'CHAPTER 01 — THE FIRST NIGHT (FULL OPENING)', sequence: OPENING_SEQUENCE },
  { id: 'centralTokyoUnlocked', label: 'CHAPTER 02 — TOKYO TAKES NOTICE' },
  { id: 'firstRegionalChampion', label: 'CHAPTER 03 — FIRST REGIONAL CHAMPION' },
  { id: 'canalYardBiggerDreams', label: 'CHAPTER 04 — BIGGER DREAMS' },
  { id: 'warehouseHqUnlocked', label: 'CHAPTER 05 — THE GINZA CONNECTION' },
  { id: 'sevenRegionsConquered', label: 'CHAPTER 06 — BEYOND SEVEN' },
  { id: 'fullCrewTogether', label: 'CHAPTER 07 — ONE CREW, SEVEN ROADS' },
];
const getTesterEntries = () => {
  const chapterIds = new Set([
    ...OPENING_SEQUENCE,
    ...CAREER_CHAPTERS.map(chapter => chapter.id),
  ]);
  const chapters = CAREER_CHAPTERS.map(chapter => ({
    ...chapter,
    definition: chapter.sequence
      ? CUTSCENES.openingStationEncounter
      : CUTSCENES[chapter.id],
    category: 'CAREER / CHAPTER',
  })).filter(entry => entry.definition);
  const smallerScenes = CUTSCENE_ORDER
    .filter(id => CUTSCENES[id] && !chapterIds.has(id))
    .map(id => ({ id, definition: CUTSCENES[id] }));
  return [...chapters, ...smallerScenes];
};

function playOpeningChapterPreview(scene) {
  // Connected, consequence-free preview of every opening dialogue/call beat.
  // Interactive station map, magazine selection and practice run are not
  // replayed: resetting those would mutate the actual saved career.
  let index = 0;
  const advance = () => {
    if (!scene?.sys?.isActive?.()) return;
    const id = OPENING_SEQUENCE[index++];
    if (!id) return;
    const result = playMangaCutscene(scene, id, {
      preview: true,
      preloadPagePosesOnly: true,
      onPreviewComplete: () => scene.time.delayedCall(120, advance),
    });
    if (!result?.played) scene.time.delayedCall(120, advance);
  };
  advance();
}

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

  const label = scene.add.text(x, y, 'D) SCENES', {
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

  const pageLabel = add(scene.add.text(width / 2, height - 135, '', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#90a7b5',
  }).setOrigin(0.5).setDepth(DEPTH + 4).setScrollFactor(0));

  const previous = add(scene.add.rectangle(width / 2 - 270, height - 135, 152, 40, 0x121a24, 1)
    .setStrokeStyle(1, 0x4e6575, 1)
    .setDepth(DEPTH + 3)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true }));

  add(scene.add.text(width / 2 - 270, height - 135, '< PREV', {
    fontFamily: PIXEL_FONT,
    fontSize: '6px',
    color: '#cbd9e1',
  }).setOrigin(0.5).setDepth(DEPTH + 4).setScrollFactor(0));

  const next = add(scene.add.rectangle(width / 2 + 270, height - 135, 152, 40, 0x121a24, 1)
    .setStrokeStyle(1, 0x4e6575, 1)
    .setDepth(DEPTH + 3)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true }));

  add(scene.add.text(width / 2 + 270, height - 135, 'NEXT >', {
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
    const entries = getTesterEntries();
    const maxOffset = Math.max(0, Math.ceil(entries.length / PAGE_SIZE) - 1);
    offset = Math.max(0, Math.min(maxOffset, offset));
    const pageEntries = entries.slice(offset * PAGE_SIZE, offset * PAGE_SIZE + PAGE_SIZE);

    pageLabel.setText(
      'PAGE ' + (offset + 1) + ' / ' + (maxOffset + 1) +
      '  //  ' + entries.length + ' REGISTERED'
    );

    previous.setAlpha(offset > 0 ? 1 : 0.35);
    next.setAlpha(offset < maxOffset ? 1 : 0.35);

    pageEntries.forEach((entry, index) => {
      const { id, definition } = entry;
      const y = 211 + index * 95;
      const row = addRow(scene.add.rectangle(width / 2, y, 900, 84, 0x101923, 1)
        .setStrokeStyle(2, 0x304b5d, 1)
        .setDepth(DEPTH + 2)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true }));

      addRow(scene.add.text(width / 2 - 425, y - 28,
        String(entry.label || definition.testerLabel || definition.title || id).toUpperCase(),
        {
          fontFamily: PIXEL_FONT,
          fontSize: '8px',
          color: '#ffffff',
          wordWrap: { width: 720, useAdvancedWrap: true },
        }
      ).setDepth(DEPTH + 3).setScrollFactor(0));

      const pages = entry.sequence
        ? entry.sequence.reduce((n, sceneId) => n + (CUTSCENES[sceneId]?.pages?.length || 0), 0)
        : (Array.isArray(definition.pages) ? definition.pages.length : 0);
      const left = entry.sequence ? 'DAICHI / SAYAKA' : resolvePreviewCharacter(scene, definition, 'left');
      const right = entry.sequence ? 'PLAYER' : resolvePreviewCharacter(scene, definition, 'right');

      addRow(scene.add.text(width / 2 - 425, y + 6,
        (entry.category || definition.category) + '  //  ' + (entry.sequence ? '5 CONNECTED SCENES' : id) +
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
        // GarageScene owns the RWB's cinematic entrance/fade choreography.
        // Other scenes can still preview its canonical manga dialogue.
        if (entry.sequence) {
          playOpeningChapterPreview(scene);
        } else if (id === 'canalYardBiggerDreams') {
          // Identical REAL ringing phone and pickup sequence in every tester
          // context; preview never modifies campaign cutscene history.
          playCanalYardStory(scene, { preview: true });
        } else if (id === 'warehouseHqUnlocked' && typeof scene.playWarehouseHqStory === 'function') {
          scene.playWarehouseHqStory({ preview: true });
        } else if (id === 'sevenRegionsConquered') {
          // The EXACT same portrait procession must work from Garage, Meet
          // and Race developer menus, including on fresh uncached profiles.
          preloadSevenRivalsMontageAssets(scene, () => {
            if (typeof scene.playSevenRegionsStory === 'function') {
              scene.playSevenRegionsStory({ preview: true });
            } else {
              playMangaCutscene(scene, id, {
                preview: true,
                onPageChange: ({ page }) => {
                  if (page?.cinematicBeat === 'sevenRivalsMontage') {
                    startSevenRivalsPortraitMontage(scene);
                  }
                },
                onPreviewComplete: () => scene._sevenRivalsMontage?.stop?.(),
              });
            }
          });
        } else if (id === 'fullCrewTogether') {
          // Full cinematic from ANY developer cutscene menu. Missing recruit
          // slots use sample characters for preview only, never save changes.
          preloadFullCrewCelebrationAssets(scene, { preview: true }, () => {
            if (typeof scene.playFullCrewStory === 'function') {
              scene.playFullCrewStory({ preview: true });
            } else {
              playMangaCutscene(scene, id, {
                preview: true, preloadPagePosesOnly: true,
                onPageChange: ({ page }) => {
                  if (page?.cinematicBeat === 'completeCrewGroup') {
                    showFullCrewCelebration(scene, { preview: true });
                  }
                },
                onPreviewComplete: () => scene._fullCrewCelebration?.stop?.(),
              });
            }
          });
        } else {
          playMangaCutscene(scene, id, { preview: true });
        }
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
      Math.ceil(getTesterEntries().length / PAGE_SIZE) - 1
    );
    if (offset >= maxOffset) return;
    offset += 1;
    render();
  });

  render();
}
