// Scene-local authored tableau over whichever real venue/gameplay screen is active.
// Uses canonical character assets; cars/backgrounds are explicit texture references.
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261023-r655';
import { cars as carCatalog } from '../data/cars.js?v=20261017-r565';
import { getCarPaintColor } from '../vehicles/CarAppearance.js?v=20261020-r617';
import { preloadStoryCar, renderStoryCar } from './StoryCarRenderer.js?v=20261022-r642';
import { DEFAULT_STORY_COMPOSITION, resolveStoryComposition } from './StoryComposition.js?v=20261022-r642';
import { getStoryBackground } from '../data/storyBackgroundCatalog.js?v=20261022-r644';
import { resolveBackgroundViewport, projectEntityOnBackground } from '../story/BackgroundViewport.js?v=20261022-r645';
import { getNativeStoryStageTemplate, getNativeCastPlacement } from '../story/StoryNativeStageTemplates.js?v=20261023-r655';

export function showStoryStage(scene, {
  background = null, backgroundId = null, stageMode = 'cinematic',
  characters = [], cars = [], depth = 160,
  backgroundAlpha = 1, motion = null, composition = DEFAULT_STORY_COMPOSITION,
} = {}) {
  if (!scene?.add || !scene?.textures) return null;
  scene._storyDirectorStage?.destroy?.();
  // A private meet scene reuses the actual place/time where the player raced.
  // Never teleport Sayaka to a different stage or hardcode one venue.
  const actualBackgroundId = backgroundId === '$CURRENT_MEET'
    ? 'meet:' + String(scene.selectedMeetLocation || scene.registry?.get?.('meetLocation') || 'odaiba7eleven') +
      ':' + String(scene.worldPhase || 'night')
    : backgroundId;
  const profile=actualBackgroundId?getStoryBackground(actualBackgroundId):null;
  if(backgroundId && !profile) {
    console.warn('[TOKYO SHIFT] Story background ID not found',actualBackgroundId);
    return null;
  }
  if(profile?.layered) {
    console.warn('[TOKYO SHIFT] Layered road/drag backgrounds require a live race adapter:',backgroundId);
    return null; // Never pretend a skyline PNG is a full moving road scene.
  }
  const backdrop=profile?.asset||background;
  const autoPerspective=Boolean(profile);
  const w=scene.scale?.width||1560,h=scene.scale?.height||840;
  // Prefer the exact, tested gameplay staging in a live Workshop/Meet. This
  // supersedes story-authored pixel sizes and bypasses the old double-scaling.
  // Story tableaux at a DIFFERENT location must draw their own backdrop.
  // The live native layout remains unchanged for normal Garage/Meet moments.
  const template=stageMode==='story' ? null : getNativeStoryStageTemplate(profile,scene);
  const native=Boolean(template)||(stageMode==='native'&&Boolean(profile));
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
  const carProps = cars.map(car => {
    const carId = car.carId === '$SELECTED_CAR'
      ? scene.registry?.get?.('selectedCarId') : car.carId;
    return {
      ...car, carId,
      model:carId ? carCatalog[carId] : null,
      asset:car.asset || (car.key ? { key:car.key,path:car.path } : null),
    };
  });
  for (const item of [backdrop, ...carProps.map(x => x.asset)]) {
    if (item?.key && item?.path) assets.push(item);
  }
  let alive = true;
  const objects = [];
  let clipGraphics=null,clipMask=null;
  const hidden=[];
  const motionTweens=[];
  const hide=obj=>{if(obj?.active && obj?.setVisible){
    hidden.push({obj,visible:obj.visible});obj.setVisible(false);
  }};
  if(template?.kind==='workshop'){
    (scene.selectedDisplay||[]).forEach(hide);
    hide(scene.workshopPlayerSprite);
    (scene.workshopPlayerSprite?.stageShadows||[]).forEach(hide);
  }
  const state = {
    destroy() {
      if (!alive) return;
      alive = false;
      motionTweens.forEach(tween=>tween?.stop?.());
      objects.forEach(x => x?.destroy?.());
      hidden.forEach(({obj,visible})=>{if(obj?.active)obj.setVisible(visible);});
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
    return image;
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
    let viewport=null;
    // Native staging already owns/draws its real background in gameplay.
    // Do not paint a second, differently cropped workshop or Meet over it.
    if(backdrop && !template){
      const src=scene.textures.exists(backdrop.key)
        ? scene.textures.get(backdrop.key).getSourceImage() : null;
      if(src){
        viewport=resolveBackgroundViewport({
          sourceWidth:src.width,sourceHeight:src.height,
          frame,fit:profile?.fit||'cover',
        });
        const moving=motion==='drive';
        const image=addImage(backdrop,viewport.centreX,viewport.centreY,
          viewport.width*(moving?1.07:1),null,depth,backgroundAlpha);
        if(moving && image && scene.tweens?.add) {
          // An ambient night-drive tableau, not a second racing simulation.
          // Keep car physics and inputs exclusively in the real RaceScene.
          motionTweens.push(scene.tweens.add({
            targets:image,x:viewport.centreX+22,
            duration:4200,ease:'Sine.easeInOut',yoyo:true,repeat:-1,
          }));
        }
      }
    }
    // The native car always uses the SAME backing/frontend ordering as its
    // gameplay counterpart. Do not derive it from a Story composition preset.
    const carInFront=!template&&layout.car.layer==='foreground';
    const portraitDepth=depth+(carInFront?3:10);
    const vehicleDepth=depth+(carInFront?11:3);
    const drawCars=()=>carProps.forEach((c,i)=>{
      const estimate=!template&&autoPerspective?projectEntityOnBackground(profile,{
        kind:'car',frame,
        sourceWidth:viewport?.sourceWidth||1672,
        sourceHeight:viewport?.sourceHeight||941,
        x:Number(c.x??(layout.car.x-i*275))/w,
        ground:c.ground??(layout.car.groundY/h),
        layerBias:carInFront?2:-1,
      }):null;
      const x=Number(template?.car.x??estimate?.x??c.x??(layout.car.x-i*275));
      const targetWidth=Number(template?.car.targetWidth??c.width??
        (estimate?.displayWidth??layout.car.targetWidth)*(i?0.78:1));
      const groundY=Number(estimate?.groundY??c.groundY??layout.car.groundY);
      // No script 'depth' may compete with the normal game layer stack.
      const layer=Number(template?(vehicleDepth+i):
        (c.depth??estimate?.depth??(vehicleDepth+i)));
      if(c.model){
        let carObjects=null;
        if(template?.kind==='workshop' && typeof scene.createCarDisplay==='function'){
          const hero=typeof scene.buildWorkshopHeroLayout==='function'
            ?scene.buildWorkshopHeroLayout(c.model):null;
          if(hero)carObjects=scene.createCarDisplay(c.model,hero.x,hero.bodyY,
            hero.targetWidth,layer);
        }else if(template?.kind==='meet'&&typeof scene.createCarDisplay==='function'){
          // Meet createCarDisplay owns the original wheel/body centre conversion.
          carObjects=scene.createCarDisplay(c.model,template.car.x,template.car.y,
            template.car.targetWidth,layer,Boolean(c.flipX),
            c.paintColor??getCarPaintColor(
              (scene.registry.get('carStates')||{})[c.carId]||{}));
        }
        if(!carObjects)carObjects=renderStoryCar(scene,c.model,{
          x,groundY,targetWidth,depth:layer,flipX:Boolean(c.flipX),
          paintColor:c.paintColor??0xffffff,
        });
        carObjects.forEach(obj=>{
          if(clipMask)obj?.setMask?.(clipMask);
          objects.push(obj);
        });
      }else{
        const src=c.asset?.key&&scene.textures.exists(c.asset.key)
          ?scene.textures.get(c.asset.key).getSourceImage():null;
        const displayHeight=src?targetWidth*(src.height/Math.max(1,src.width)):0;
        addImage(c.asset,x,groundY-displayHeight*.5,targetWidth,null,layer);
      }
    });
    const drawCast=()=>actors.forEach((a,i)=>{
      const anchor=layout.cast[i]||{x:w*(i+1)/(actors.length+1),feetY:h*.84,height:h*.55};
      const assigned=template?getNativeCastPlacement(template,i,actors.length,a.role):null;
      const estimate=!template&&autoPerspective?projectEntityOnBackground(profile,{
        kind:'character',frame,
        sourceWidth:viewport?.sourceWidth||1672,
        sourceHeight:viewport?.sourceHeight||941,
        x:Number(a.x??anchor.x)/w,
        ground:a.ground??(anchor.feetY/h),
        layerBias:carInFront?-2:1,
      }):null;
      // Characters of a scene all share the same native ground/height:
      // only their horizontal slot or optional observer role differs.
      const x=Number(assigned?.x??estimate?.x??a.x??anchor.x);
      const feet=Number(assigned?.feetY??a.y??estimate?.groundY??anchor.feetY);
      const height=Number(assigned?.height??a.height??estimate?.displayHeight??anchor.height);
      const layer=Number(template?(portraitDepth+i):
        (a.depth??estimate?.depth??(portraitDepth+i)));
      addImage(a.asset,x,feet,null,height,layer,1,true);
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
