// Scene-local authored tableau over whichever real venue/gameplay screen is active.
// Uses canonical character assets; cars/backgrounds are explicit texture references.
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261022-r639';

export function showStoryStage(scene, {
  background = null, characters = [], cars = [], depth = 600,
  backgroundAlpha = 1,
} = {}) {
  if (!scene?.add || !scene?.textures) return null;
  scene._storyDirectorStage?.destroy?.();
  const assets = [];
  const playerId = scene.registry?.get?.('playerCharacterId') || 'renMizuno';
  const actors = characters.map(actor => {
    const id = actor.id === '$PLAYER' ? playerId : actor.id;
    const asset = getCharacterVisualAsset(id, actor.pose || 'idle', {
      playerCharacterId: playerId,
    });
    if (asset) assets.push(asset);
    return { ...actor, asset };
  });
  const carProps = cars.map(car => ({ ...car, asset: car.asset || (car.key ? { key:car.key,path:car.path }:null) }));
  for (const item of [background, ...carProps.map(x => x.asset)]) {
    if (item?.key && item?.path) assets.push(item);
  }
  let alive = true;
  const objects = [];
  const state = {
    destroy() {
      if (!alive) return;
      alive = false;
      objects.forEach(x => x?.destroy?.());
      scene.events?.off?.('shutdown', state.destroy);
      if (scene._storyDirectorStage === state) scene._storyDirectorStage = null;
    },
  };
  scene._storyDirectorStage = state;
  scene.events?.once?.('shutdown', state.destroy);
  const addImage = (asset, x, y, width, height, layer, alpha = 1) => {
    if (!asset?.key || !scene.textures.exists(asset.key)) return;
    const image = scene.add.image(x, y, asset.key).setDepth(layer).setScrollFactor(0)
      .setAlpha(alpha);
    if (height) image.setDisplaySize(height * (image.width / Math.max(1,image.height)),height);
    else if (width) image.setDisplaySize(width,image.height * width / Math.max(1,image.width));
    objects.push(image);
  };
  const draw = () => {
    if (!alive || !scene.sys?.isActive?.()) return;
    const w = scene.scale?.width || 1560, h = scene.scale?.height || 840;
    if (background) {
      const src=scene.textures.exists(background.key)
        ? scene.textures.get(background.key).getSourceImage() : null;
      const cover=src ? Math.max(w/src.width,h/src.height) : 1;
      addImage(background,w/2,h/2,src?.width*cover,null,depth,backgroundAlpha);
    }
    actors.forEach((a,i)=>addImage(a.asset, Number(a.x??(w*(i+1)/(actors.length+1))),
      Number(a.y??h*.79),null,Number(a.height??370),depth+3+i));
    carProps.forEach((c,i)=>addImage(c.asset,Number(c.x??w/2),Number(c.y??h*.75),
      Number(c.width??450),null,depth+1+i));
  };
  const pending=[...new Map(assets.filter(a=>a.key&&a.path&&!scene.textures.exists(a.key))
    .map(a=>[a.key,a])).values()];
  if (pending.length) {
    pending.forEach(a=>scene.load.image(a.key,getCharacterAssetUrl(a.path)));
    scene.load.once(Phaser.Loader.Events.COMPLETE,draw);
    if (!scene.load.isLoading()) scene.load.start();
  } else draw();
  return state;
}
