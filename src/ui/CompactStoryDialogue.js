// General-purpose compact portrait dialogue: race HUD and normal-scene overlay.
// The Arkon/Sayaka Ginza banter remains untouched and uses its existing timing.
import { characters, getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261022-r639';
import { createRaceDialogueHud } from './RaceCoachHud.js?v=20261022-r640';
import { COMPACT_DIALOGUE_LAYOUTS, COMPACT_DIALOGUE_SHIFT_X } from './CompactDialogueLayout.js?v=20261022-r640';

const LAYOUTS = COMPACT_DIALOGUE_LAYOUTS;

const tokenToId = (token, playerId, cast) => {
  const value = cast?.[token] || token;
  return value === '$PLAYER' || value === 'player' ? playerId : value;
};

export function playCompactStoryDialogue(scene, {
  characters: cast = { left: 'sayakaFujieda', right: '$PLAYER' },
  pages = [], variables = {}, autoAdvanceMs = 3600, tapToAdvance = false,
  depth = 210, onComplete = null, onCancel = null,
} = {}) {
  if (!scene || scene._compactStoryDialogue?.active) {
    return { played: false, active: false, reason: 'active' };
  }
  if (!Array.isArray(pages) || !pages.length) {
    return { played: false, active: false, reason: 'empty' };
  }
  const playerId = scene.registry?.get?.('playerCharacterId') || 'renMizuno';
  const actorAt = page => {
    const side = page.speaker === 'right' || page.speaker === 'player' ? 'right' : 'left';
    const id = tokenToId(page.character || page[side + 'Character'] || cast[side], playerId, cast);
    return { side, id, pose: page.pose || page[side + 'Pose'] || 'idle' };
  };
  const prepared = pages.map(page => ({ ...page, ...actorAt(page) }));
  const assets = new Map();
  for (const page of prepared) {
    const asset = getCharacterVisualAsset(page.id, page.pose, { playerCharacterId: playerId });
    const key = page.id + ':' + page.pose;
    if (asset) assets.set(key, asset);
    const fallback = getCharacterVisualAsset(page.id, 'idle', { playerCharacterId: playerId });
    if (fallback) assets.set(page.id + ':idle', fallback);
  }
  let active = true;
  let index = 0;
  let timer = null;
  let hud = null;
  let nextButton = null;
  let nextLabel = null;
  const state = { played: true, active: true, close: null };
  scene._compactStoryDialogue = state;
  const cleanup = () => {
    if (!active) return false;
    active = false; state.active = false;
    timer?.remove?.();
    hud?.destroy?.();
    nextButton?.destroy?.();
    nextLabel?.destroy?.();
    scene.events?.off?.('shutdown', shutdown);
    scene.events?.off?.('destroy', shutdown);
    if (scene._compactStoryDialogue === state) scene._compactStoryDialogue = null;
    return true;
  };
  const shutdown = () => { if (cleanup()) onCancel?.({ reason: 'shutdown' }); };
  scene.events?.once?.('shutdown', shutdown);
  scene.events?.once?.('destroy', shutdown);
  state.close = (reason = 'complete') => {
    if (!cleanup()) return;
    if (reason === 'complete') onComplete?.({ reason, pages: prepared.length });
    else onCancel?.({ reason });
  };
  const interpolate = text => String(text ?? '').replace(/\{([A-Z0-9_]+)\}/g, (_, key) =>
    String(variables[key] ?? (key === 'PLAYER_FIRST_NAME'
      ? (scene.registry?.get?.('firstName') || 'Driver') : '')));
  const show = () => {
    if (!active || !scene.sys?.isActive?.()) return;
    const page = prepared[index];
    const asset = assets.get(page.id + ':' + page.pose) || assets.get(page.id + ':idle');
    const visual = characters[page.id]?.visual || {};
    hud?.destroy?.();
    hud = createRaceDialogueHud(scene, {
      speaker: page.speakerLabel || (page.id === playerId
        ? String(scene.registry?.get?.('firstName') || 'DRIVER').toUpperCase()
        : String(characters[page.id]?.name || page.id || 'DRIVER').toUpperCase()),
      side: page.side, layout: LAYOUTS[page.side], depth,
      initialPose: page.pose, characterVisual: visual,
      spriteKeyForPose: pose => {
        const a = assets.get(page.id + ':' + pose) || assets.get(page.id + ':idle');
        return a?.key && scene.textures.exists(a.key) ? a.key : '__DEFAULT';
      },
    });
    hud.dialogue.setText(interpolate(page.text));
    if (nextLabel) nextLabel.setText(index === prepared.length - 1 ? 'END >' : 'NEXT >');
    timer?.remove?.();
    if (!tapToAdvance) timer = scene.time.delayedCall(Math.max(1300, autoAdvanceMs), advance);
  };
  const advance = () => {
    if (!active) return;
    if (++index >= prepared.length) state.close('complete');
    else show();
  };
  if (tapToAdvance) {
    nextButton = scene.add.rectangle(654 + COMPACT_DIALOGUE_SHIFT_X, 336, 150, 36, 0x111111, .95)
      .setDepth(depth + 8).setScrollFactor(0).setInteractive({ useHandCursor: true });
    nextLabel = scene.add.text(654 + COMPACT_DIALOGUE_SHIFT_X, 336, 'NEXT >', {
      fontFamily: '"Silkscreen", monospace', fontSize: '10px', color: '#ffffff',
    }).setOrigin(.5).setDepth(depth + 9).setScrollFactor(0);
    nextButton.on('pointerdown', advance);
  }
  const missing = [...assets.values()].filter(asset =>
    asset?.key && asset?.path && !scene.textures.exists(asset.key));
  const unique = [...new Map(missing.map(asset => [asset.key, asset])).values()];
  const begin = () => { if (active) show(); };
  if (unique.length) {
    for (const asset of unique) scene.load.image(asset.key, getCharacterAssetUrl(asset.path));
    scene.load.once(Phaser.Loader.Events.COMPLETE, begin);
    if (!scene.load.isLoading()) scene.load.start();
  } else begin();
  return state;
}
