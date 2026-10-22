// Scene-local authored tableau over whichever real venue/gameplay screen is active.
// Uses canonical character assets; cars/backgrounds are explicit texture references.
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261022-r639';
import { cars as carCatalog } from '../data/cars.js?v=20261017-r565';
import { preloadStoryCar, renderStoryCar } from './StoryCarRenderer.js?v=20261022-r642';
import { DEFAULT_STORY_COMPOSITION, resolveStoryComposition } from './StoryComposition.js?v=20261022-r642';

export function showStoryStage(scene, {
  background = null, characters = [], cars = [], depth = 160,
  backgroundAlpha = 1, composition = DEFAULT_STORY_COMPOSITION,
} = {}) {
  if (!scene?.add || !scene?.textures) return null;
  scene._storyDirectorStage?.destroy?.();
  const assets = [];
  const layout = resolveStoryComposition({
    width:scene.scale?.width||1560,height:scene.scale?.height||840,
    preset:composition,castCount:characters.length,
  });
  const playerId = scene.registry?.get?.('playerCharacterId') || 'renMizuno';
  const actors = characters.map(actor => {
    const id = actor.id === '$PLAYER' ? playerId : actor.id;
    const asset = getCharacterVisualAsset(id, actor.pose || 'idle', {
      playerCharacterId: playerId,
    });
    if (asset) assets.push(asset);
    return { ...actor, asset };
  });
  const carProps = cars.map(car => ({
    ...car,
    model:car.carId ? carCatalog[car.carId] : null,
    asset:car.asset || (car.key ? { key:car.key,path:car.path } : null),
  }));
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
  const addImage = (asset, x, y, width, height, layer, alpha = 1, feetAnchored = false) => {
    if (!asset?.key || !scene.textures.exists(asset.key)) return;
    const image = scene.add.image(x, y, asset.key).setDepth(layer).setScrollFactor(0)
      .setAlpha(alpha);
    if (feetAnchored) image.setOrigin(.5,1);
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
    const carInFront=layout.car.layer==='foreground';
    const portraitDepth=depth+(carInFront?3:10);
    const vehicleDepth=depth+(carInFront?11:3);
    const drawCars=()=>carProps.forEach((c,i)=>{
      const x=Number(c.x??(layout.car.x-i*275));
      const targetWidth=Number(c.width??layout.car.targetWidth*(i?0.78:1));
      const groundY=Number(c.groundY??layout.car.groundY);
      const layer=Number(c.depth??vehicleDepth+i);
      if(c.model){
        renderStoryCar(scene,c.model,{
          x,groundY,targetWidth,depth:layer,flipX:Boolean(c.flipX),
          paintColor:c.paintColor??0xffffff,
        }).forEach(obj=>objects.push(obj));
      }else{
        // Static PNG cars share the ground line; the image is centred in Phaser.
        const src=c.asset?.key&&scene.textures.exists(c.asset.key)
          ? scene.textures.get(c.asset.key).getSourceImage():null;
        const displayHeight=src?targetWidth*(src.height/Math.max(1,src.width)):0;
        addImage(c.asset,x,groundY-displayHeight*.5,targetWidth,null,layer);
      }
    });
    const drawCast=()=>actors.forEach((a,i)=>{
      const anchor=layout.cast[i]||{x:w*(i+1)/(actors.length+1),feetY:h*.84,height:h*.55};
      addImage(a.asset,Number(a.x??anchor.x),Number(a.y??anchor.feetY),
        null,Number(a.height??anchor.height),Number(a.depth??portraitDepth+i),1,true);
    });
    // The stage's front/back relationship is deterministic and authored.
    if(carInFront){drawCast();drawCars();}
    else{drawCars();drawCast();}
  };
  const queuedCars=carProps.reduce((total,c)=>total+(c.model?preloadStoryCar(scene,c.model):0),0);
  const pending=[...new Map(assets.filter(a=>a.key&&a.path&&!scene.textures.exists(a.key))
    .map(a=>[a.key,a])).values()];
  if (pending.length || queuedCars) {
    pending.forEach(a=>scene.load.image(a.key,getCharacterAssetUrl(a.path)));
    scene.load.once(Phaser.Loader.Events.COMPLETE,draw);
    if (!scene.load.isLoading()) scene.load.start();
  } else draw();
  return state;
}
