// Reusable interactive seven-region portrait gallery for Career Scenes 06/07.
// Uses exactly the same manga character profile renderer for rivals and crew.
// Only NAV buttons/swipes move the fan; NEXT advances the suspended manga page.
import { characters, getCharacterForContext } from '../data/characters.js?v=20261011-r477';
import { createCharacterProfile } from '../characters/CharacterProfileRenderer.js?v=20261011-r477';

const FONT = '"Silkscreen", monospace';
const lerp = (a, b, t) => a + (b - a) * t;
const FLAG_NAMES = {
  ODAIBA: 'officeFlagOdaiba', SHINAGAWA: 'officeFlagShinagawa',
  TATSUMI: 'officeFlagTatsumi', SHIBUYA: 'officeFlagShibuya',
  YOKOHAMA: 'officeFlagYokohama', DAIKOKU: 'officeFlagDaikoku',
  SHINJUKU: 'officeFlagShinjuku',
};
export const PORTRAIT_GALLERY_FLAGS = Object.freeze(FLAG_NAMES);

function slot(delta, cx, cy) {
  const d = Math.abs(delta);
  if (delta >= 0) return {
    x: cx + (d ? 143 + (d - 1) * 110 : 0),
    y: cy + Math.min(46, d * 10),
    size: Math.max(0.73, 1 - d * .052),
    colour: d ? 0 : 1,
    grey: d ? Math.max(.16, .60 - d * .075) : 0,
  };
  return {
    x: cx - 185 * d, y: cy + Math.min(40, d * 10),
    size: Math.max(.76, 1 - d * .07),
    colour: 0, grey: Math.max(0, .36 - (d - 1) * .26),
  };
}
function dispose(obj) { try { obj?.destroy?.(); } catch (_) {} }

export function openSwipePortraitGallery(scene, {
  entries = [],
  transparentBackground = false,
  title = 'SEVEN REGIONAL CHAMPIONS',
  ownerKey = '_portraitGallery',
} = {}) {
  if (!scene || !entries.length) return null;
  if (scene._portraitGallery?.active) return scene._portraitGallery;
  const width = Number(scene.scale?.width || 1560);
  const height = Number(scene.scale?.height || 840);
  const cx = width * .55, cy = height * .50;
  const flagX = width * .19, flagY = height * .40;
  const frameHeight = Math.min(620, Math.max(450, height * .76));
  const frameWidth = Math.min(700,
    Math.min(550, Math.max(410, width * .35)) * 1.10);
  const playerId = scene.registry?.get?.('playerCharacterId') || '';
  const objects = [], portraits = [], flags = [], names = [], originals = [];
  const own = o => { if (o) objects.push(o); return o; };
  let index = 0, active = true, moving = false, tween = null, entrance = null;
  let swipeFromX = null, buttonWasPressed = false;

  const controller = scene._mangaCutscene;
  const affected = [];
  for (const side of ['left', 'right']) {
    const image = controller?.actors?.[side]?.profile?.image;
    if (image?.active) {
      affected.push({ obj: image, alpha: image.alpha });
      scene.tweens.killTweensOf(image);
    }
  }
  // Scene 7 has NO added opaque background. Reduce only the manga wash
  // temporarily so the real Crew Space remains visible through the gallery.
  const wash = transparentBackground ? controller?.objects?.[1] : null;
  if (wash?.active) {
    scene.tweens.killTweensOf(wash);
    affected.push({ obj: wash, alpha: wash.alpha });
  }

  const hideMangaUI = () => {
    if (!active || !controller) return;
    for (const obj of [
      ...(controller.dialogueObjects || []),
      ...(controller.topTitleObjects || []),
      ...(controller.objects || []).filter(x => x?.texture?.key === undefined && x?.input && x?.type === 'Text'),
    ]) {
      if (!obj?.active || originals.some(p => p.obj === obj)) continue;
      scene.tweens.killTweensOf(obj);
      originals.push({ obj, alpha: obj.alpha });
      obj.setAlpha(0);
    }
  };

  const state = {
    active: true, index: 0, count: entries.length,
    hideMangaUI,
    go(delta) { navigate(delta); },
    next() { complete(); },
    stop() { close(); },
  };
  scene._portraitGallery = state;
  scene[ownerKey] = state;
  scene.events?.once?.('shutdown', state.stop);
  scene.events?.once?.('destroy', state.stop);

  const close = () => {
    if (!active) return;
    active = false;
    state.active = false;
    tween?.stop?.();
    entrance?.stop?.();
    scene.input?.off?.('pointerup', onPointerUp);
    objects.forEach(dispose);
    portraits.forEach(p => p.profile.destroy());
    affected.forEach(({obj,alpha}) => {
      if (obj?.active) {
        scene.tweens.killTweensOf(obj);
        obj.setAlpha(alpha);
      }
    });
    originals.forEach(({obj,alpha}) => {
      if (obj?.active) {
        scene.tweens.killTweensOf(obj);
        obj.setAlpha(alpha);
      }
    });
    scene.events?.off?.('shutdown', state.stop);
    scene.events?.off?.('destroy', state.stop);
    if (scene._portraitGallery === state) scene._portraitGallery = null;
    if (scene[ownerKey] === state) scene[ownerKey] = null;
  };
  const complete = () => {
    if (!active || moving) return;
    const current = scene._mangaCutscene;
    const canAdvance = current?.active && current === controller;
    close();
    if (canAdvance) current.advance('button');
  };

  // A visually dark memory in Scene 06, absolutely NO curtain in Scene 07.
  if (!transparentBackground) own(scene.add.rectangle(
    width / 2, height / 2, width, height, 0x090d15, .84
  ).setDepth(949).setScrollFactor(0).setAlpha(0));

  const ctx = { rivalContext: true, playerCharacterId: playerId };
  entries.forEach((entry, i) => {
    const profile = createCharacterProfile(scene, {
      characterId: entry.characterId, pose: 'idle',
      x: cx, y: cy, frameWidth, frameHeight, side: 'center',
      flipInward: false, depth: 971, dimmed: false, mask: false,
      rivalContext: Boolean(entry.rivalContext), playerCharacterId: playerId,
    });
    if (profile?.image) {
      const colour = profile.image.setScrollFactor(0);
      const grey = own(scene.add.image(colour.x, colour.y, profile.spriteKey)
        .setOrigin(.5, 0).setScale(colour.scaleX)
        .setFlipX(colour.flipX).setTintFill(0x727780)
        .setScrollFactor(0).setDepth(972));
      portraits.push({
        index: i, profile, colour, grey,
        x: colour.x, y: colour.y, scale: colour.scaleX,
      });
    }
    const flagKey = FLAG_NAMES[entry.regionId];
    if (flagKey && scene.textures.exists(flagKey)) {
      const flag = own(scene.add.image(flagX, flagY, flagKey)
        .setDepth(987).setScrollFactor(0));
      const src = scene.textures.get(flagKey).getSourceImage();
      flag.setScale(Math.min(282 / Math.max(1,src.width),
        208 / Math.max(1,src.height)));
      flags.push({ index:i, obj:flag });
    }
    names.push({
      index:i,
      obj:own(scene.add.text(flagX, flagY+132, entry.regionId || '', {
        fontFamily:FONT,fontSize:'12px',color:'#f4f7ff',
        align:'center', backgroundColor:'#0815249e',padding:{x:10,y:5},
      }).setOrigin(.5).setDepth(988).setScrollFactor(0)),
    });
  });

  const personName = own(scene.add.text(cx,height*.79,'',{
    fontFamily: FONT,fontSize:'10px',color:'#ffffff',
    backgroundColor:'#081524ba',padding:{x:14,y:8},
  }).setOrigin(.5).setDepth(989).setScrollFactor(0));
  const heading = own(scene.add.text(cx,height*.12,title,{
    fontFamily:FONT,fontSize:'10px',color:'#eaf3ff',
    backgroundColor:'#081524b8',padding:{x:16,y:9},
  }).setOrigin(.5).setDepth(989).setScrollFactor(0));
  const counter = own(scene.add.text(cx,height*.865,'01 / 07',{
    fontFamily:FONT,fontSize:'9px',color:'#edf7ff',
    backgroundColor:'#081524a6',padding:{x:12,y:6},
  }).setOrigin(.5).setDepth(989).setScrollFactor(0));

  // Fullscreen transparent interactive blocker is ABOVE the underlying
  // manga panel so a swipe cannot accidentally progress the storyline.
  const blocker = own(scene.add.rectangle(
    width / 2,height / 2,width,height,0x000000,0
  ).setDepth(1000).setScrollFactor(0).setInteractive());

  const button = (x, label, w, action, depth=1008) => {
    const rect = own(scene.add.rectangle(x,height*.936,w,49,0x091827,.94)
      .setStrokeStyle(2,0x93bbda,.78).setScrollFactor(0)
      .setDepth(depth).setInteractive({useHandCursor:true}));
    own(scene.add.text(x,height*.936,label,{
      fontFamily:FONT,fontSize:'10px',color:'#ffffff',
    }).setOrigin(.5).setScrollFactor(0).setDepth(depth+1));
    rect.on('pointerdown', (_pointer,_lx,_ly,event) => {
      event?.stopPropagation?.();buttonWasPressed = true;swipeFromX=null;
      action();
    });
    return rect;
  };
  const prev = button(cx-260,'<',76,()=>navigate(-1));
  const nextRival = button(cx-170,'>',76,()=>navigate(1));
  const next = button(cx+180,'NEXT  >',232,complete);

  const paint = (oldIndex,newIndex=oldIndex,t=0) => {
    if (!active) return;
    for (const p of portraits) {
      const a=slot(p.index-oldIndex,cx,cy), b=slot(p.index-newIndex,cx,cy);
      const x=lerp(a.x,b.x,t), y=lerp(a.y,b.y,t);
      const scale=p.scale*lerp(a.size,b.size,t);
      p.colour.setPosition(p.x+x-cx,p.y+y-cy).setScale(scale);
      p.grey.setPosition(p.colour.x,p.colour.y).setScale(scale);
      const distance=Math.abs(p.index-lerp(oldIndex,newIndex,t));
      const depth=971+Math.max(0,8-distance)*1.6;
      p.colour.setDepth(depth);
      p.grey.setDepth(depth+.1);
      p.colour.setAlpha(lerp(a.colour,b.colour,t));
      p.grey.setAlpha(lerp(a.grey,b.grey,t));
    }
    const countAlpha=i=>(i===oldIndex ? 1-t : 0)+(i===newIndex ? t : 0);
    for(const {index:i,obj} of flags)obj.setAlpha(countAlpha(i));
    for(const {index:i,obj} of names)obj.setAlpha(countAlpha(i));
    const shown=entries[t<.5?oldIndex:newIndex];
    const display=shown?.rivalContext
      ? getCharacterForContext(shown.characterId,ctx)?.name
      : characters[shown?.characterId]?.name;
    personName.setText(String(display||shown?.characterId||'').toUpperCase());
    counter.setText(String(t<.5?oldIndex+1:newIndex+1).padStart(2,'0')
      +' / '+String(entries.length).padStart(2,'0'));
    prev.setAlpha((oldIndex===0&&t===0)?.37:1);
    nextRival.setAlpha((oldIndex===entries.length-1&&t===0)?.37:1);
  };

  function navigate(direction) {
    if (!active || moving) return;
    const target=Math.max(0,Math.min(entries.length-1,index+direction));
    if(target===index)return;
    moving=true;
    const from=index;
    const slider={v:0};
    tween=scene.tweens.add({
      targets:slider,v:1,duration:650,ease:'Sine.easeInOut',
      onUpdate:()=>paint(from,target,slider.v),
      onComplete:()=>{
        if(!active)return;
        index=target;state.index=index;moving=false;paint(index);
      },
    });
  }

  blocker.on('pointerdown',(pointer,_lx,_ly,event)=>{
    event?.stopPropagation?.();
    swipeFromX=pointer?.downX ?? pointer?.x ?? null;
    buttonWasPressed=false;
  });
  const onPointerUp = pointer => {
    if(!active || swipeFromX==null || buttonWasPressed)return;
    const moved=(pointer?.upX??pointer?.x??0)-swipeFromX;
    swipeFromX=null;
    if(Math.abs(moved)>=65)navigate(moved<0?1:-1);
  };
  scene.input?.on?.('pointerup',onPointerUp);
  hideMangaUI();
  paint(0);
  const initial = [
    ...portraits.flatMap(p=>[p.colour,p.grey]),
    ...flags.map(p=>p.obj), ...names.map(p=>p.obj),
    heading,personName,counter,
  ].map(obj=>({obj,alpha:obj.alpha}));
  initial.forEach(({obj})=>obj.setAlpha(0));
  const washTarget = transparentBackground ? .12 : null;
  const fade={v:0};
  entrance=scene.tweens.add({
    targets:fade,v:1,duration:1250,ease:'Sine.easeInOut',
    onUpdate:()=>{
      if(!active)return;
      if(!transparentBackground)objects[0]?.setAlpha(.84*fade.v);
      initial.forEach(({obj,alpha})=>{
        if(obj?.active)obj.setAlpha(alpha*fade.v);
      });
      for (const {obj,alpha} of affected) {
        if(obj?.active)obj.setAlpha(obj===wash
          ?lerp(alpha,washTarget,fade.v):lerp(alpha,.035,fade.v));
      }
    },
    onComplete:()=>{if(active)paint(index);},
  });
  return state;
}
