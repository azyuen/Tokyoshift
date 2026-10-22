// Scene-local authored tableau over whichever real venue/gameplay screen is active.
// Uses canonical character assets; cars/backgrounds are explicit texture references.
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261022-r639';
import { cars as carCatalog } from '../data/cars.js?v=20261017-r565';
import { preloadStoryCar, renderStoryCar } from './StoryCarRenderer.js?v=20261022-r642';
import { DEFAULT_STORY_COMPOSITION, resolveStoryComposition } from './StoryComposition.js?v=20261022-r642';
import { getStoryBackground } from '../data/storyBackgroundCatalog.js?v=20261022-r644';
import { projectGroundEntity } from '../story/StoryPerspective.js?v=20261022-r644';

export function showStoryStage(scene, {
  background = null, backgroundId = null, stageMode = 'cinematic',
  characters = [], cars = [], depth = 160,
  backgroundAlpha = 1, composition = DEFAULT_STORY_COMPOSITION,
} = {}) {
  if (!scene?.add || !scene?.textures) return null;
  scene._storyDirectorStage?.destroy?.();
  const profile=backgroundId?getStoryBackground(backgroundId):null;
  if(backgroundId && !profile) {
    console.warn('[TOKYO SHIFT] Story background ID not found',backgroundId);
    return null;
  }
  if(profile?.layered) {
    console.warn('[TOKYO SHIFT] Layered road/drag backgrounds require a live race adapter:',backgroundId);
    return null; // Never pretend a skyline PNG is a full moving road scene.
  }
  const backdrop=profile?.asset||background;
  const autoPerspective=Boolean(profile);
  const w=scene.scale?.width||1560,h=scene.scale?.height||840;
  const native=stageMode==='native'&&Boolean(profile);
  const frame=native?profile.frame:{x:0,y:0,w,h};
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
  for (const item of [backdrop, ...carProps.map(x => x.asset)]) {
    if (item?.key && item?.path) assets.push(item);
  }
  let alive = true;
  const objects = [];
  let clipGraphics=null,clipMask=null;
  const state = {
    destroy() {
      if (!alive) return;
      alive = false;
      objects.forEach(x => x?.destroy?.());
      clipGraphics?.destroy?.();
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
    if(clipMask)image.setMask(clipMask);
    objects.push(image);
  };
  const draw = () => {
    if (!alive || !scene.sys?.isActive?.()) return;
    const w = scene.scale?.width || 1560, h = scene.scale?.height || 840;
    if(native){
      clipGraphics=scene.make.graphics({add:false});
      clipGraphics.fillStyle(0xffffff,1);
      clipGraphics.fillRect(frame.x,frame.y,frame.w,frame.h);
      clipMask=clipGraphics.createGeometryMask();
    }
    if(backdrop){
      const src=scene.textures.exists(backdrop.key)
        ? scene.textures.get(backdrop.key).getSourceImage() : null;
      if(src){
        const fw=frame.w,fh=frame.h;
        const fit=profile?.fit||'cover';
        const contain=fit==='contain'||fit==='top-fit';
        const scale=(contain?Math.min:Math.max)(fw/src.width,fh/src.height)*
          (fit==='zoom-cover'?1.12:1);
        const displayW=src.width*scale,displayH=src.height*scale;
        const bgX=frame.x+fw/2,
          bgY=fit==='bottom-cover'?frame.y+fh-displayH/2:
            fit==='top-fit'?frame.y+displayH/2:frame.y+fh/2;
        addImage(backdrop,bgX,bgY,displayW,null,depth,backgroundAlpha);
      }
    }
    const carInFront=layout.car.layer==='foreground';
    const portraitDepth=depth+(carInFront?3:10);
    const vehicleDepth=depth+(carInFront?11:3);
    const drawCars=()=>carProps.forEach((c,i)=>{
      const estimate=autoPerspective?projectGroundEntity(profile,{
        kind:'car',frame,
        x:Number(c.x??(layout.car.x-i*275))/w,
        ground:c.ground??(layout.car.groundY/h),
        layerBias:carInFront?2:-1,
      }):null;
      const x=Number(c.x??estimate?.x??(layout.car.x-i*275));
      const targetWidth=Number(c.width??
        (estimate?.displayWidth??layout.car.targetWidth)*(i?0.78:1));
      const groundY=Number(c.groundY??estimate?.groundY??layout.car.groundY);
      const layer=Number(c.depth??estimate?.depth??(vehicleDepth+i));
      if(c.model){
        renderStoryCar(scene,c.model,{
          x,groundY,targetWidth,depth:layer,flipX:Boolean(c.flipX),
          paintColor:c.paintColor??0xffffff,
        }).forEach(obj=>{
          if(clipMask)obj?.setMask?.(clipMask);
          objects.push(obj);
        });
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
      const estimate=autoPerspective?projectGroundEntity(profile,{
        kind:'character',frame,
        x:Number(a.x??anchor.x)/w,
        ground:a.ground??(anchor.feetY/h),
        layerBias:carInFront?-2:1,
      }):null;
      addImage(a.asset,Number(a.x??estimate?.x??anchor.x),
        Number(a.y??estimate?.groundY??anchor.feetY),
        null,Number(a.height??estimate?.displayHeight??anchor.height),
        Number(a.depth??estimate?.depth??(portraitDepth+i)),1,true);
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
