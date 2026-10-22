// R641 — isolated, non-canonical developer story venue.
// No Meet rivals/cards/actions are created: just the real background,
// Arkon, Sayaka, the currently loaned Ginza car, and authored dialogue.
import { cars } from '../data/cars.js?v=20261017-r565';
import { characters, getCharacterVisualAsset, getCharacterAssetUrl } from '../data/characters.js?v=20261022-r639';
import { preloadStoryCar, renderStoryCar } from '../ui/StoryCarRenderer.js?v=20261022-r642';
import { resolveStoryComposition } from '../ui/StoryComposition.js?v=20261022-r643';
import { saveSessionState } from '../state/GameState.js?v=20261022-r639';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';
import {
  DEV_VAULT_STORY_ID, DEV_VAULT_RACE_ACTIVE_KEY,
  isArkonVaultStoryLoan, finishDevVaultHeroRace,
} from '../data/devVaultStory.js?v=20261022-r643';

const PIXEL='"Silkscreen", monospace';
const BODY='"Rajdhani", sans-serif';
const VENUES=Object.freeze({
  dogenzaka:{
    key:'devVaultDogenzakaR641',
    path:'assets/Meet/Day/shibuya_dogenzaka_day.png',
    title:'SHIBUYA // DOGENZAKA',subtitle:'ONE VAULT CAR. TWO QUESTIONABLE DECISIONS.',
  },
  dinner:{
    key:'devVaultDinnerR641',
    path:'assets/Meet/Night/shibuya_center_gai_night.png',
    title:'SHIBUYA // SIDE-STREET DINNER',subtitle:'THE FASTEST CAR HERE IS PARKED OUTSIDE.',
  },
  photo:{
    key:'devVaultPhotoR641',
    path:'assets/Meet/Night/shibuya_scramble_night.png',
    title:'SHIBUYA // AFTER-DARK PHOTO STOP',subtitle:'ONE PICTURE. NOTHING TO EXPLAIN.',
  },
});
const PORTRAITS=[['sayakaFujieda','ginzaDress'],['arkonDen','ginzaSuit']];

export default class DevVaultStoryScene extends Phaser.Scene {
  constructor(){super('DevVaultStoryScene');}
  init(){this.storyVenue='dogenzaka';}

  preload(){
    if(!isArkonVaultStoryLoan(this.registry))return;
    let queued=0;
    for(const item of Object.values(VENUES)){
      if(!this.textures.exists(item.key)){
        this.load.image(item.key,item.path+'?v=20261022-r641');queued++;
      }
    }
    for(const [id,pose] of PORTRAITS){
      const asset=getCharacterVisualAsset(id,pose);
      if(asset?.key&&asset?.path&&!this.textures.exists(asset.key)){
        this.load.image(asset.key,getCharacterAssetUrl(asset.path));queued++;
      }
    }
    const car=cars[this.registry.get('ginzaTestDrive')?.carId];
    if(car){
      queued+=preloadStoryCar(this,car);
    }
    startSceneLoading(this,'SHIBUYA // STORY MODE',queued);
  }

  create(){
    finishSceneLoading('READY');
    document.body.dataset.scene='story';
    this.scale.resize(1560,840);
    if(!isArkonVaultStoryLoan(this.registry)){
      this.scene.start('CentralTokyoScene',{locationId:'ginzaMotorGallery',ginzaRoom:3});
      return;
    }
    if(this.registry.get(DEV_VAULT_RACE_ACTIVE_KEY)){
      // Returning after the one-off hero challenge: restore the previous race
      // settings, while preserving the scene's win/loss dialogue condition.
      finishDevVaultHeroRace(this.registry);
      saveSessionState(this.registry);
    }
    this.add.rectangle(780,420,1560,840,0x050a13).setDepth(-5);
    this.backdrop=this.add.image(780,410,VENUES.dogenzaka.key)
      .setDepth(0).setScrollFactor(0);
    const cover=()=>{
      const src=this.textures.get(this.backdrop.texture.key).getSourceImage();
      this.backdrop.setScale(Math.max(1560/Math.max(1,src.width),840/Math.max(1,src.height)));
    };
    this.coverBackdrop=cover;cover();
    this.add.rectangle(780,420,1560,840,0x050812,.19).setDepth(1);
    this.add.rectangle(780,747,1560,186,0x030b12,.67).setDepth(14);
    this.add.rectangle(780,48,1560,95,0x030b12,.82).setDepth(18);
    this.venueName=this.add.text(340,28,'',{
      fontFamily:PIXEL,fontSize:'15px',color:'#f5f2e8',
    }).setDepth(19);
    this.venueSub=this.add.text(340,61,'',{
      fontFamily:BODY,fontSize:'13px',color:'#98cdd3',
    }).setDepth(19);
    this.add.text(1420,32,'STORY MODE // DEV REHEARSAL',{
      fontFamily:PIXEL,fontSize:'9px',color:'#ffbad2',
    }).setOrigin(1,0).setDepth(19);

    // One reusable composition governs car/character scale, feet alignment
    // and explicit foreground/background layering in Story AND Career.
    this.storyComposition=resolveStoryComposition({
      width:1560,height:840,preset:'car-behind-cast',castCount:2,
    });
    const actor=(id,pose,{x,feetY,height,depth})=>{
      const asset=getCharacterVisualAsset(id,pose);
      if(!asset?.key||!this.textures.exists(asset.key))return null;
      const image=this.add.image(x,feetY,asset.key).setOrigin(.5,1).setDepth(depth);
      const src=this.textures.get(asset.key).getSourceImage();
      image.setDisplaySize(height*src.width/Math.max(1,src.height),height);
      return image;
    };
    this.sayaka=actor('sayakaFujieda','ginzaDress',this.storyComposition.cast[0]);
    this.arkon=actor('arkonDen','ginzaSuit',this.storyComposition.cast[1]);
    this.drawLoanCar();
    this.venueName.setText(VENUES.dogenzaka.title);
    this.venueSub.setText(VENUES.dogenzaka.subtitle);
    this.cameras.main.fadeIn(650,0,0,0);

    // The Director is installed independently of scene imports to keep iPad
    // boot safe. A brief retry also supports a cold reload on this screen.
    let tries=0;
    const launch=()=>{
      if(!this.sys?.isActive?.())return;
      const director=this.game.storyDirector;
      if(director?.status?.active)return; // returning from the race branch
      if(director?.start?.(DEV_VAULT_STORY_ID,{preview:true}))return;
      if(++tries<18)this.time.delayedCall(150,launch);
      else{
        this.add.text(780,762,'STORY DIRECTOR UNAVAILABLE // RETURN TO GINZA',{
          fontFamily:PIXEL,fontSize:'10px',color:'#ffb7bc',
        }).setOrigin(.5).setDepth(25).setInteractive().on('pointerdown',()=>
          this.scene.start('CentralTokyoScene',{locationId:'ginzaMotorGallery',ginzaRoom:3}));
      }
    };
    this.time.delayedCall(80,launch);
  }

  drawLoanCar(){
    const car=cars[this.registry.get('ginzaTestDrive')?.carId];
    if(!car)return;
    const frame=this.storyComposition?.car || resolveStoryComposition().car;
    const objects=renderStoryCar(this,car,frame);
    this.storyCarObjects=objects;
    if(!objects.length){
      console.warn('[TOKYO SHIFT] Story car art missing',car.id);
      return;
    }
    this.add.text(1080,779,String(car.shortName||car.name||'GINZA VAULT CAR').toUpperCase(),{
      fontFamily:PIXEL,fontSize:'10px',color:'#f7e5bc',
    }).setOrigin(.5).setDepth(19);
    this.add.text(1080,802,'PRIVATE GALLERY // TEMPORARY LOAN',{
      fontFamily:BODY,fontSize:'11px',color:'#b2c5cf',
    }).setOrigin(.5).setDepth(19);
  }

  transitionVenue(next,onComplete){
    const venue=VENUES[next];
    if(!venue){onComplete?.();return false;}
    if(venue.key===this.backdrop.texture.key){onComplete?.();return true;}
    this.cameras.main.fadeOut(260,0,0,0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,()=>{
      if(!this.sys?.isActive?.())return;
      this.storyVenue=next;
      this.backdrop.setTexture(venue.key);
      this.coverBackdrop();
      this.venueName.setText(venue.title);
      this.venueSub.setText(venue.subtitle);
      this.cameras.main.fadeIn(430,0,0,0);
      // Avoid advancing the next dialogue beneath the black transition.
      this.time.delayedCall(430,()=>{if(this.sys?.isActive?.())onComplete?.();});
    });
    return true;
  }
}
