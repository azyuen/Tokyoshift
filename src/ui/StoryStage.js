// Scene-local authored tableau over whichever real venue/gameplay screen is active.
// Uses canonical character assets; cars/backgrounds are explicit texture references.
import { getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261028-pilot';
import { cars as carCatalog } from '../data/cars.js?v=20261026-r687';
import { getCarPaintColor } from '../vehicles/CarAppearance.js?v=20261020-r617';
import { preloadStoryCar, renderStoryCar } from './StoryCarRenderer.js?v=20261023-r663';
import { DEFAULT_STORY_COMPOSITION, resolveStoryComposition } from './StoryComposition.js?v=20261022-r642';
import { getStoryBackground } from '../data/storyBackgroundCatalog.js?v=20261022-r644';
import { resolveBackgroundViewport, projectEntityOnBackground } from '../story/BackgroundViewport.js?v=20261022-r645';
import { getNativeStoryStageTemplate, getNativeCastPlacement } from '../story/StoryNativeStageTemplates.js?v=20261025-r685';
import {getChapter05DuelCar,getChapter05DuelActor} from '../story/Chapter05MeetLayout.js?v=20261023-r670';

import {getArukenGuests,getArukenDisplayCars,getArukenCarBay,getArukenActorPlacement,arukenPoseHeight,alignArukenActor,getArukenEnvironmentTemplate} from '../story/ArukenStageLayout.js?v=20261026-audit';

export function showStoryStage(scene, {
  background = null, backgroundId = null, stageMode = 'cinematic',
  characters = [], cars = [], depth = 160,
  backgroundAlpha = 1, motion = null, composition = DEFAULT_STORY_COMPOSITION,
  castBehindCar = false, characterScale = 1, onArrivalComplete = null,
  meetDuel = false, fadeInMs = 0,
  meetCarLayout = null, meetCastLayout = null, workshopRepairPair = false, vipParty = false, population = null,
} = {}) {
  if (!scene?.add || !scene?.textures) return null;
  scene._storyDirectorStage?.destroy?.();
  // A private meet scene reuses the actual place/time where the player raced.
  // Never teleport Sayaka to a different stage or hardcode one venue.
  const actualBackgroundId = backgroundId === '$CURRENT_MEET'
    ? 'meet:' + String(scene.selectedMeetLocation || scene.registry?.get?.('meetLocation') || 'odaiba7eleven') +
      ':' + String(scene.worldPhase || 'night')
    : backgroundId === '$CURRENT_WORKSHOP'
      ? 'workshop:' + String(scene.registry?.get?.('workshopLocationId') || 'shinonomeWorkshop') +
        ':' + String(scene.worldPhase === 'day' ? 'day' : 'night')
      : backgroundId;
  const profile=actualBackgroundId?getStoryBackground(actualBackgroundId):null;
  const aruken=scene.registry?.get?.('gameMode')==='arkonStory';
  const guests=aruken?getArukenGuests(population):[];
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
  // Customer-tuning jobs use the ordinary three-panel Garage viewport even
  // when the Story Director is running over MeetScene. Avoid projecting or
  // scaling vehicles a second time; their coordinates are Garage coordinates.
  const garagePanel=stageMode==='garage-panel' && profile?.frameId==='workshop';
  const template=(stageMode==='story'||garagePanel)
    ? null : getNativeStoryStageTemplate(profile,scene) || (aruken?getArukenEnvironmentTemplate(profile):null);
  const native=stageMode==='chapter08-full' ? false : garagePanel||Boolean(template)||(stageMode==='native'&&Boolean(profile));
  const duel=Boolean(meetDuel&&template?.kind==='meet'&&profile?.frameId==='location');
  const frame=native?profile.frame:{x:0,y:0,w,h};
  // Story-only Chapter 08 fills the display and masks irrelevant gameplay UI.
  // Keep the normal Meet and Garage layouts intact for actual gameplay.
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
  const displayCars=(aruken?getArukenDisplayCars(population):[]).map(c=>({...c,model:carCatalog[c.carId]})).filter(c=>c.model);
  guests.forEach(g=>assets.push(g.asset));
  for (const item of [backdrop, ...carProps.map(x => x.asset)]) {
    if (item?.key && item?.path) assets.push(item);
  }
  let alive = true;
  const objects = [];
  let clipGraphics=null,clipMask=null;
  const hidden=[];
  const motionTweens=[];
  const actorImages=new Map();
  const carImages=new Map();
  const pendingFades=[];
  const hide=obj=>{if(obj?.active && obj?.setVisible){
    hidden.push({obj,visible:obj.visible});obj.setVisible(false);
  }};
  if(template?.kind==='workshop'){
    (scene.selectedDisplay||[]).forEach(hide);
    hide(scene.workshopPlayerSprite);
    (scene.workshopPlayerSprite?.stageShadows||[]).forEach(hide);
  }
  const state = {
    fullScreenChapter08:stageMode==='chapter08-full',
    setPaintColor(color) {
      let changed=false;
      for(const object of objects){
        if(object?.active && object?.getData?.('carPaintLayer')){
          object.setTint(color);changed=true;
        }
      }
      return changed;
    },
    exitCar(slot=1,duration=3000,onComplete=()=>{}) {
      const parts=carImages.get(slot);
      if(!parts?.length){onComplete();return;}
      // The flipped rival AE86 faces LEFT. Moving RIGHT is a physical reverse
      // out of its bay, including tyres, shadows and every paint layer.
      const xPositions=parts.filter(x=>Number.isFinite(x.x)).map(x=>x.x);
      const distance=Math.max(460,frame.x+frame.w+320-Math.min(...xPositions));
      const original=parts.map(obj=>({obj,x:obj.x,
        rotation:Number(obj.rotation||0),
        radius:Math.max(12,Number(obj.storyRollRadius)||obj.displayHeight*.44||18)}));
      const travel={x:0};
      const position=()=>{
        for(const part of original){
          if(!part.obj.active)continue;
          part.obj.setX(part.x+travel.x);
          if(part.obj.storyRollRadius||part.obj.type==='Image'&&part.obj.texture?.key?.toLowerCase().includes('wheel'))
            part.obj.setRotation(part.rotation-travel.x/part.radius);
        }
      };
      const tween=scene.tweens?.add?.({
        targets:travel,x:distance,duration:Math.max(900,duration),
        ease:'Sine.InOut',onUpdate:position,
        onComplete:()=>{
          original.forEach(({obj})=>obj?.setVisible?.(false));
          if(alive)onComplete();
        },
      });
      if(tween)motionTweens.push(tween);
      else{travel.x=distance;position();onComplete();}
    },
    retreatActor(actorId,onComplete=()=>{}) {
      // Reusable static-sprite depth retreat: three automatic dissolves.
      // No walking animation or dialogue confirmations required.
      const target=actorImages.get(actorId);
      if(!target?.active){onComplete();return;}
      const startX=target.x,startY=target.y,startScale=target.scaleX;
      const frames=[
        {x:startX-44,y:startY-4,scale:startScale*.82,alpha:.78},
        {x:startX+20,y:startY-28,scale:startScale*.62,alpha:.55},
        {x:startX-65,y:startY-49,scale:startScale*.42,alpha:0},
      ];
      let i=0;
      const next=()=>{
        if(!alive||!target.active){onComplete();return;}
        if(i>=frames.length){target.setVisible(false);onComplete();return;}
        const f=frames[i++];
        const tween=scene.tweens?.add?.({
          targets:target,alpha:0,duration:380,ease:'Sine.InOut',
          onComplete:()=>{
            if(!alive||!target.active){onComplete();return;}
            target.setPosition(f.x,f.y).setScale(f.scale).setAlpha(0);
            const appear=scene.tweens?.add?.({
              targets:target,alpha:f.alpha,duration:480,ease:'Sine.InOut',
              onComplete:next,
            });
            if(appear)motionTweens.push(appear);else next();
          },
        });
        if(tween)motionTweens.push(tween);else next();
      };
      next();
    },
    fadeActor(actorId,duration=900,onComplete=()=>{}) {
      const target=actorImages.get(actorId);
      if(!target?.active){pendingFades.push({actorId,duration,onComplete});return;}
      const tween=scene.tweens?.add?.({targets:target,alpha:0,
        duration:Math.max(150,duration),ease:'Sine.InOut',
        onComplete:()=>{if(alive)onComplete();}});
      if(tween)motionTweens.push(tween);
      else {target.setAlpha(0);onComplete();}
    },
    destroy() {
      if (!alive) return;
      alive = false;
      motionTweens.forEach(tween=>tween?.stop?.());
      objects.forEach(x => x?.destroy?.());
      hidden.forEach(({obj,visible})=>{if(obj?.active)obj.setVisible(visible);});
      actorImages.clear();carImages.clear();pendingFades.length=0;
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
    if(aruken&&feetAnchored&&height)alignArukenActor(image,x,y,height);
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
    if(stageMode==='chapter08-full'){
      const cover=scene.add.rectangle(w/2,h/2,w,h,0x080e19,1)
        .setDepth(depth-1).setScrollFactor(0).setInteractive();
      objects.push(cover);
    }
    let viewport=null;
    // Native staging already owns/draws its real background in gameplay.
    // Do not paint a second, differently cropped workshop or Meet over it.
    // For the dock job the SAME Meet/Showdown car geometry is used, but
    // the location is a separate authored Daikoku backdrop.
    if(backdrop && (aruken || !template || (template.kind==='meet' &&
        backgroundId!=='$CURRENT_MEET'))){
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
    for(const car of displayCars){
      const parts=renderStoryCar(scene,car.model,{x:frame.x+frame.w*car.x,
        groundY:frame.y+frame.h*.62,targetWidth:frame.w*.25,depth:depth+1.2,garageGeometry:true});
      parts.forEach(o=>{if(clipMask)o.setMask?.(clipMask);objects.push(o);});
    }
    for(const guest of guests){
      const sprite=addImage(guest.asset,frame.x+frame.w*guest.x,
        frame.y+frame.h*guest.ground,null,guest.height,depth+1.8,1,true);
      sprite?.setTint(0xa1a7b5).setFlipX(guest.flipX);
    }
    // Chapter 08's private Shibuya VIP terrace overlays the actual existing
    // Shibuya night meet art. These decorative lights live only in Story Mode;
    // Meet geometry, driving backgrounds and Career remain untouched.
    if(vipParty && profile?.frameId==='location'){
      const g=scene.add.graphics().setDepth(depth+1).setScrollFactor(0);
      g.fillStyle(0x190923,.22).fillRect(frame.x,frame.y,frame.w,frame.h);
      g.fillStyle(0x411264,.18).fillTriangle(
        frame.x+frame.w*.09,frame.y+20,
        frame.x,frame.y+frame.h*.83,
        frame.x+frame.w*.52,frame.y+frame.h*.85);
      g.fillStyle(0x17646f,.18).fillTriangle(
        frame.x+frame.w*.84,frame.y+15,
        frame.x+frame.w*.52,frame.y+frame.h*.84,
        frame.x+frame.w,frame.y+frame.h*.87);
      g.lineStyle(2,0xffc8b5,.75);
      g.lineBetween(frame.x+36,frame.y+38,frame.x+frame.w-36,frame.y+62);
      for(let i=0;i<15;i++){
        const x=frame.x+45+i*(frame.w-90)/14;
        const y=frame.y+38+i*24/14;
        g.fillStyle(i%3===0?0xffc77e:i%3===1?0x80e9ea:0xf4a7df,.92);
        g.fillCircle(x,y+7,3.7);
      }
      g.fillStyle(0x110b1f,.72)
        .fillRoundedRect(frame.x+frame.w-268,frame.y+18,246,54,5);
      g.lineStyle(2,0xb273be,.8).strokeRoundedRect(
        frame.x+frame.w-268,frame.y+18,246,54,5);
      if(clipMask)g.setMask(clipMask);
      objects.push(g);
      const sign=scene.add.text(frame.x+frame.w-145,frame.y+44,
        'SHIBUYA  //  VIP',{
          fontFamily:'"Silkscreen", monospace',fontSize:'11px',
          color:'#ffe6ff',align:'center',
        }).setOrigin(.5).setDepth(depth+14).setScrollFactor(0);
      if(clipMask)sign.setMask(clipMask);
      objects.push(sign);
    }
    // The native car always uses the SAME backing/frontend ordering as its
    // gameplay counterpart. Do not derive it from a Story composition preset.
    const carInFront=Boolean(castBehindCar) ||
      (!template&&layout.car.layer==='foreground');
    const portraitDepth=depth+(carInFront?3:10);
    const vehicleDepth=depth+(carInFront?11:3);
    const drawCars=()=>carProps.forEach((c,i)=>{
      const estimate=!template&&!garagePanel&&autoPerspective?projectEntityOnBackground(profile,{
        kind:'car',frame,
        sourceWidth:viewport?.sourceWidth||1672,
        sourceHeight:viewport?.sourceHeight||941,
        x:Number(c.x??(layout.car.x-i*275))/w,
        ground:c.ground??(layout.car.groundY/h),
        layerBias:carInFront?2:-1,
      }):null;
      const duelCar=duel?getChapter05DuelCar(i):null;
      const sharedBay=aruken&&!duel&&!meetCarLayout?getArukenCarBay(template,i,carProps.length):null;
      const finaleCar=meetCarLayout==='yokohamaFinale' && template?.kind==='meet'
        ? {x:805,y:412,targetWidth:505,flipX:false}:null;
      const ch6Car=meetCarLayout==='yokohamaGift' &&
        template?.kind==='meet' && i===0
        ? {x:815,y:409,targetWidth:518,flipX:false}:null;
      const cinematicCar=stageMode==='chapter08-full' ? {
        x:w*(carProps.length===1?.52:(i===0?.40:.76)),
        targetWidth:w*(carProps.length===1?.43:(i===0?.33:.30)),
        groundY:h*.73,
      }:null;
      const x=Number(cinematicCar?.x??sharedBay?.x??finaleCar?.x??ch6Car?.x??duelCar?.x??template?.car.x??estimate?.x??c.x??(layout.car.x-i*275));
      const targetWidth=Number(cinematicCar?.targetWidth??sharedBay?.targetWidth??finaleCar?.targetWidth??ch6Car?.targetWidth??duelCar?.targetWidth??template?.car.targetWidth??c.width??
        (estimate?.displayWidth??layout.car.targetWidth)*(i?0.78:1));
      const groundY=Number(cinematicCar?.groundY??sharedBay?.groundY??finaleCar?.y??ch6Car?.y??duelCar?.y??template?.car.tyreContactY??estimate?.groundY??c.groundY??layout.car.groundY);
      // No script 'depth' may compete with the normal game layer stack.
      const layer=Number(template?(vehicleDepth+i):
        (c.depth??(carInFront
          ?Math.max(vehicleDepth+i,estimate?.depth??vehicleDepth+i)
          :Math.min(vehicleDepth+i,estimate?.depth??vehicleDepth+i))));
      if(c.model){
        let carObjects=null;
        if(sharedBay){
          carObjects=renderStoryCar(scene,c.model,{x,groundY,targetWidth,depth:layer,
            flipX:sharedBay.flipX,garageGeometry:true,paintColor:c.paintColor??0xffffff});
        }else if(template?.kind==='workshop' && scene.sys.settings.key==='GarageScene' && typeof scene.createCarDisplay==='function'){
          const hero=typeof scene.buildWorkshopHeroLayout==='function'
            ?scene.buildWorkshopHeroLayout(c.model):null;
          if(hero)carObjects=scene.createCarDisplay(c.model,hero.x,hero.bodyY,
            hero.targetWidth,layer);
        }else if(template?.kind==='meet'&&scene.sys.settings.key==='MeetScene'&&typeof scene.createCarDisplay==='function'){
          // Meet createCarDisplay owns the original wheel/body centre conversion.
          // Preserve the EXACT previous native single-car geometry for all
          // other chapters. Only Chapter 05's explicit matchup uses two bays.
          if(duel||ch6Car||finaleCar)carObjects=scene.createCarDisplay(c.model,x,groundY,
            targetWidth,layer,(finaleCar||duelCar||ch6Car).flipX,
            c.paintColor??getCarPaintColor(
              (scene.registry.get('carStates')||{})[c.carId]||{}));
          else carObjects=scene.createCarDisplay(c.model,template.car.x,template.car.y,
            template.car.targetWidth,layer,Boolean(c.flipX),
            c.paintColor??getCarPaintColor(
              (scene.registry.get('carStates')||{})[c.carId]||{}));
        }
        if(!carObjects)carObjects=renderStoryCar(scene,c.model,{
          x,groundY:template?.kind==='meet'?575:groundY,targetWidth,depth:layer,flipX:Boolean(c.flipX),
          paintColor:c.paintColor??0xffffff,
          garageGeometry:garagePanel||Boolean(template),
        });
        if(duel)carImages.set(i,carObjects);
        carObjects.forEach(obj=>{
          if(clipMask)obj?.setMask?.(clipMask);
          objects.push(obj);
        });
        // The paid Chapter 03 drive-in is a deliberate LOW-SPEED roll from
        // fully outside the LEFT of the bay. One tween governs the entire
        // vehicle and each wheel rotates according to the actual distance
        // travelled / tyre radius. There is no alpha fade, jump or wheel slip.
        if(motion==='roll-in-left' && i===0 && carObjects.length){
          const distance=Math.max(targetWidth+80,
            x+targetWidth*.5+80-frame.x);
          const parts=carObjects.filter(obj=>obj?.active &&
            Number.isFinite(obj.x) && typeof obj.setX==='function').map(obj=>({
              obj,restX:obj.x,rotation:Number(obj.rotation||0),
              radius:Number(obj.storyRollRadius||0),
            }));
          const progress={travelled:0};
          const position=()=>{
            for(const part of parts){
              if(!part.obj.active)continue;
              part.obj.setX(part.restX-distance+progress.travelled);
              if(part.radius>0)
                part.obj.setRotation(part.rotation+progress.travelled/part.radius);
            }
          };
          position(); // Start hidden beyond the left edge, using stage mask.
          if(scene.tweens?.add && parts.length){
            motionTweens.push(scene.tweens.add({
              targets:progress,travelled:distance,
              duration:4800,ease:'Sine.Out',
              onUpdate:position,
              onComplete:()=>{
                progress.travelled=distance;
                position(); // exact final car/tyre position; wheels stop here.
                if(alive)onArrivalComplete?.();
              },
            }));
          }else{
            progress.travelled=distance;
            position();
            onArrivalComplete?.();
          }
        }
        // Legacy fade-slide remains available for old sequences. Chapter 04
        // explicitly uses the calibrated slow roll and tyre rotation.
        if(motion==='arrive' && i===0 && scene.tweens?.add){
          for(const obj of carObjects){
            if(!obj?.active || !Number.isFinite(obj.x) || !obj.setX || !obj.setAlpha)continue;
            const rest=obj.x;
            obj.setX(rest+250).setAlpha(0);
            motionTweens.push(scene.tweens.add({
              targets:obj,x:rest,alpha:1,
              duration:900,ease:'Cubic.Out',
            }));
          }
        }
      }else{
        const src=c.asset?.key&&scene.textures.exists(c.asset.key)
          ?scene.textures.get(c.asset.key).getSourceImage():null;
        const displayHeight=src?targetWidth*(src.height/Math.max(1,src.width)):0;
        addImage(c.asset,x,groundY-displayHeight*.5,targetWidth,null,layer);
      }
    });
    const drawCast=()=>actors.forEach((a,i)=>{
      const anchor=layout.cast[i]||{x:w*(i+1)/(actors.length+1),feetY:h*.84,height:h*.55};
      const ch6Cast=meetCastLayout==='yokohamaGift' && template?.kind==='meet'
        ? a.role==='yokohamaArkon'
          ? {x:420,feetY:599,height:299}
          :a.role==='yokohamaSayaka'
            ? {x:560,feetY:599,height:291}:null
        :null;
      // Only RWB restoration: position Arkon at the engine-bay side, and
      // Sayaka right beside him. Derive from the canonical workshop hero
      // anchor; do not reproject or move the vehicle.
      const repairCast=workshopRepairPair&&template?.kind==='workshop'
        ? a.role==='rwbMechanic'
          ? {x:template.car.x-180,feetY:template.character.feetY,
             height:292}
          :a.role==='rwbSayaka'
            ? {x:template.car.x-335,feetY:template.character.feetY,
               height:278}:null
        :null;
      const storyCast=aruken?getArukenActorPlacement(template,a,i,actors.length):null;
      const assigned=repairCast??ch6Cast??(duel?(getChapter05DuelActor(a.role)??
        (aruken?getChapter05DuelActor(i===0?'player':i===1&&actors.length>2?'companion':'challenger'):null)):
        storyCast??(template?getNativeCastPlacement(template,i,actors.length,a.role):null));
      const estimate=!template&&!garagePanel&&autoPerspective?projectEntityOnBackground(profile,{
        kind:'character',frame,
        sourceWidth:viewport?.sourceWidth||1672,
        sourceHeight:viewport?.sourceHeight||941,
        x:Number(a.x??anchor.x)/w,
        ground:a.ground??(anchor.feetY/h),
        layerBias:carInFront?-2:1,
      }):null;
      // Characters of a scene all share the same native ground/height:
      // only their horizontal slot or optional observer role differs.
      const cinematicCast=stageMode==='chapter08-full' ? {
        x:w*(actors.length===2?[.17,.30][i]:actors.length===3?[.15,.29,.85][i]:.22),
        feetY:h*.73,
        height:h*(a.role==='challenger'?.36:.39),
      }:null;
      const x=Number(cinematicCast?.x??a.x??assigned?.x??estimate?.x??anchor.x)+(cinematicCast?0:Number(a.offsetX||0));
      const feet=Number(cinematicCast?.feetY??assigned?.feetY??a.y??estimate?.groundY??anchor.feetY);
      const height=Number(cinematicCast?.height??assigned?.height??a.height??estimate?.displayHeight??anchor.height) *
        (Number.isFinite(Number(characterScale))?Number(characterScale):1) * (aruken?arukenPoseHeight(a.pose):1);
      const layer=Number(template
        ? (a.role==='chapter01RepairSayaka'?portraitDepth-3:portraitDepth+i)
        : (a.depth??(carInFront
          ?Math.min(portraitDepth+i,estimate?.depth??portraitDepth+i)
          :Math.max(portraitDepth+i,estimate?.depth??portraitDepth+i))));
      const sprite=addImage(a.asset,x,feet,null,height,layer,
        a.fadeInMs ? 0 : 1,true);
      if(sprite){
        if(a.flipX)sprite.setFlipX(true);
        actorImages.set(a.id,sprite);
        if(duel && a.approach && scene.tweens?.add){
          // Daigo's shameless attempt to get closer to Sayaka happens while
          // their cars remain properly parked on opposite sides of the meet.
          const endX=x-53;
          sprite.setX(x+22);
          motionTweens.push(scene.tweens.add({targets:sprite,x:endX,
            delay:280,duration:1500,ease:'Sine.Out'}));
        }
        if(a.fadeInMs && scene.tweens?.add)
          motionTweens.push(scene.tweens.add({targets:sprite,alpha:1,
            duration:Math.max(250,Number(a.fadeInMs)||850),ease:'Sine.Out'}));
      }
    });
    // The stage's front/back relationship is deterministic and authored.
    if(carInFront){drawCast();drawCars();}
    else{drawCars();drawCast();}
    for(const fade of pendingFades.splice(0))
      state.fadeActor(fade.actorId,fade.duration,fade.onComplete);
    if(fadeInMs>0 && scene.add){
      const veil=scene.add.rectangle(frame.x+frame.w*.5,frame.y+frame.h*.5,
        frame.w,frame.h,0x03080e,1).setScrollFactor(0).setDepth(depth+40);
      if(clipMask)veil.setMask(clipMask);
      objects.push(veil);
      const tween=scene.tweens?.add?.({targets:veil,alpha:0,
        duration:Math.max(300,Math.min(2200,Number(fadeInMs)||700)),
        ease:'Sine.InOut',onComplete:()=>{
          veil.destroy();
          if(alive)onArrivalComplete?.();
        }});
      if(tween)motionTweens.push(tween);
      else{veil.destroy();onArrivalComplete?.();}
    } else if(onArrivalComplete && motion!=='roll-in-left')onArrivalComplete();
  };
  const queuedCars=[...carProps,...displayCars].reduce((total,c)=>total+(c.model?preloadStoryCar(scene,c.model):0),0);
  const pending=[...new Map(assets.filter(a=>a.key&&a.path&&!scene.textures.exists(a.key))
    .map(a=>[a.key,a])).values()];
  if (pending.length || queuedCars) {
    pending.forEach(a=>scene.load.image(a.key,getCharacterAssetUrl(a.path)));
    scene.load.once(Phaser.Loader.Events.COMPLETE,draw);
    if (!scene.load.isLoading()) scene.load.start();
  } else draw();
  return state;
}
