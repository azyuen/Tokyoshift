// Scene 07: full-crew group reveal, using the REAL seven saved recruits.
// No hard-coded crew cast, no changes to saved cars, drivers or progression.
import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261011-r477';
import { getCrewMembers } from '../data/crewSystem.js?v=20261011-r479';
import { CREW_REGIONS, REGIONAL_CREW_ROSTERS } from '../data/crewRoster.js?v=20261011-r479';

const PIXEL = '"Silkscreen", monospace';
const safeDestroy = obj => { try { obj?.destroy?.(); } catch (_) {} };

export function getCelebrationCrew(source, { preview = false } = {}) {
  const recruited = getCrewMembers(source);
  return CREW_REGIONS.flatMap(regionId => {
    const saved = recruited[regionId];
    if (saved?.characterId) return [{ regionId, characterId: saved.characterId }];
    // The tester previews a sample cast for missing slots, never writes it
    // into the save and never represents it as a recruited member in gameplay.
    const candidate = preview
      ? REGIONAL_CREW_ROSTERS[regionId]?.members?.find(m => m.recruitable)
      : null;
    return candidate ? [{ regionId, characterId: candidate.characterId }] : [];
  });
}

export function preloadFullCrewCelebrationAssets(scene, { preview = false } = {}, onReady = null) {
  if (!scene?.textures || !scene?.load) { onReady?.();return 0; }
  const ids = [
    ...getCelebrationCrew(scene.registry, { preview }).map(m => m.characterId),
    scene.registry.get('playerCharacterId') || 'renMizuno',
    'daichiSakamoto',
    'sayakaFujieda',
  ];
  const needed = new Map();
  for (const id of new Set(ids)) {
    const visual = characters[id]?.visual;
    if (visual?.spriteKey && visual?.path && !scene.textures.exists(visual.spriteKey)) {
      needed.set(visual.spriteKey, getCharacterAssetUrl(visual.path));
    }
  }
  for (const phase of ['day','night']) {
    const key = phase === 'day' ? 'crewSpaceDayBg' : 'crewSpaceNightBg';
    if (!scene.textures.exists(key)) {
      needed.set(key, 'assets/Garage/shinonome_crewspace_' + phase + '.png?v=20261005-r349');
    }
  }
  if (!needed.size) { onReady?.();return 0; }
  for (const [key,url] of needed) scene.load.image(key,url);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => onReady?.());
  if (!scene.load.isLoading?.()) scene.load.start();
  return needed.size;
}

export function showFullCrewCelebration(scene, { preview = false } = {}) {
  if (!scene || scene._fullCrewCelebration?.active) return scene?._fullCrewCelebration || null;

  const group = getCelebrationCrew(scene.registry, { preview });
  if (!preview && group.length !== 7) return null;
  const W = Number(scene.scale?.width || 1560), H = Number(scene.scale?.height || 840);
  const objects = [], portraits = [];
  const own = obj => { if(obj) objects.push(obj); return obj; };
  let active = true, tween = null;
  const state = {
    active: true,
    stop() {
      if (!active) return;
      active = false;state.active = false;
      tween?.stop?.();
      objects.forEach(safeDestroy);
      scene.events?.off?.('shutdown', state.stop);
      scene.events?.off?.('destroy', state.stop);
      if (scene._fullCrewCelebration === state) scene._fullCrewCelebration = null;
    },
  };
  scene._fullCrewCelebration = state;
  scene.events?.once?.('shutdown', state.stop);
  scene.events?.once?.('destroy', state.stop);

  // Entire group is in Crew Space, rather than an unrelated generic backdrop.
  const bgKey = scene.worldPhase === 'day' ? 'crewSpaceDayBg' : 'crewSpaceNightBg';
  const backgroundKey = scene.textures.exists(bgKey) ? bgKey :
    (scene.textures.exists('crewSpaceNightBg') ? 'crewSpaceNightBg' : null);
  own(scene.add.rectangle(W/2,H/2,W,H,0x080f1c,1)
    .setScrollFactor(0).setDepth(949).setInteractive());
  if (backgroundKey) {
    const image = own(scene.add.image(W/2,H/2,backgroundKey)
      .setScrollFactor(0).setDepth(950));
    const src = scene.textures.get(backgroundKey).getSourceImage();
    image.setScale(Math.max(W/Math.max(1,src.width),H/Math.max(1,src.height)));
  }
  own(scene.add.rectangle(W/2,H/2,W,H,0x081322,0.30)
    .setScrollFactor(0).setDepth(951));

  // Seven regional drivers: rear balcony (3), workshop floor (4).
  // Player and Daichi stand together in the CENTRE foreground.
  const positions = [
    { x:235,y:450,h:232,depth:958 },
    { x:550,y:438,h:222,depth:959 },
    { x:1100,y:447,h:225,depth:960 },
    { x:152,y:650,h:290,depth:972 },
    { x:400,y:655,h:300,depth:973 },
    { x:1180,y:651,h:295,depth:974 },
    { x:1420,y:647,h:290,depth:975 },
  ];
  const makePerson = (id, pos) => {
    const visual = characters[id]?.visual;
    if (!visual?.spriteKey || !scene.textures.exists(visual.spriteKey)) return null;
    const tex = scene.textures.get(visual.spriteKey).getSourceImage();
    own(scene.add.ellipse(pos.x,pos.y-12,155,22,0x000000,0.28)
      .setDepth(pos.depth-0.1).setScrollFactor(0));
    const image = own(scene.add.image(pos.x,pos.y,visual.spriteKey)
      .setOrigin(0.5,1).setDepth(pos.depth).setScrollFactor(0)
      .setScale(pos.h/Math.max(1,tex.height)));
    portraits.push({ image, x:pos.x });
    return image;
  };

  group.forEach(({characterId},i)=>makePerson(characterId,positions[i]));
  makePerson(scene.registry.get('playerCharacterId') || 'renMizuno',
    {x:725,y:661,h:324,depth:979});
  makePerson('daichiSakamoto',{x:906,y:657,h:316,depth:980});

  const title = own(scene.add.text(W/2,74,'ONE CREW // SEVEN ROADS',{
    fontFamily:PIXEL,fontSize:'12px',color:'#f4f9ff',align:'center',
    backgroundColor:'#071423dd',padding:{x:22,y:12},
  }).setOrigin(0.5).setScrollFactor(0).setDepth(990));
  const caption = own(scene.add.text(W/2,H-72,'',{
    fontFamily:PIXEL,fontSize:'11px',color:'#f4faff',align:'center',
    backgroundColor:'#071423dd',padding:{x:16,y:12},
  }).setOrigin(0.5).setScrollFactor(0).setDepth(991));

  const baseline = objects.map(obj=>({obj,alpha:obj.alpha}));
  const reveal = value => baseline.forEach(({obj,alpha})=>{
    if(obj?.active)obj.setAlpha(alpha*value);
  });
  reveal(0);
  const opening={value:0};
  tween=scene.tweens.add({
    targets:opening,value:1,duration:500,ease:'Sine.easeInOut',
    onUpdate:()=>reveal(opening.value),
    onComplete:()=>{
      if(!active)return;
      const progress={value:0};
      tween=scene.tweens.add({
        targets:progress,value:7,duration:4250,ease:'Linear',
        onUpdate:()=>{
          if(!active)return;
          const i=Math.min(group.length-1,Math.floor(progress.value));
          const member=group[i];
          if(member)caption.setText(
            member.regionId+'  //  '+String(characters[member.characterId]?.name||'').toUpperCase()
          );
          portraits.forEach(({image,x})=>{
            if(image?.active)image.setX(x-20+40*progress.value/7);
          });
        },
        onComplete:()=>{
          if(!active)return;
          const fade={value:1};
          tween=scene.tweens.add({
            targets:fade,value:0,duration:550,ease:'Sine.easeInOut',
            onUpdate:()=>reveal(fade.value),
            onComplete:()=>state.stop(),
          });
        },
      });
    },
  });
  return state;
}
