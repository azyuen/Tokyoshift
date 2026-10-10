import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261011-r475';
import { saveSessionState } from '../state/GameState.js?v=20261011-r479';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import { playMangaCutscene } from '../ui/MangaCutscene.js?v=20261011-r475';
import { showTravelMap } from '../ui/TravelMap.js?v=20261010-r471';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';

const PIXEL = '"Silkscreen", monospace';

// The station is a silent establishing shot. The actual conversation is the
// shared translucent MangaCutscene, not a bespoke black dialogue panel.
export default class TrainStationScene extends Phaser.Scene {
  constructor() { super('TrainStationScene'); }

  preload() {
    const phase = getWorldPhase() === 'day' ? 'day' : 'night';
    this.stationKey = 'tokyoOpeningStation_' + phase;
    let queued = 0;
    const queue = (key, path) => {
      if (!key || !path || this.textures.exists(key)) return;
      this.load.image(key, path);
      queued += 1;
    };

    queue(this.stationKey, 'assets/CentralTokyo/tokyo_trainstation_' + phase + '.png?v=20261010-r467');
    for (const id of [this.registry.get('playerCharacterId') || 'renMizuno', 'daichiSakamoto']) {
      const visual = characters[id]?.visual;
      if (visual) queue(visual.spriteKey, getCharacterAssetUrl(visual.path));
    }
    startSceneLoading(this, 'ARRIVING AT THE STATION', queued);
  }

  create() {
    document.body.dataset.scene = 'setup';
    this.scale.resize(1560, 840);
    this.cameras.main.resetFX?.();
    this.cameras.main.setAlpha(1);
    playMusic('title');

    const background = this.add.image(780, 420, this.stationKey).setDepth(0);
    background.setScale(Math.max(1560 / background.width, 840 / background.height));
    this.add.rectangle(780, 420, 1560, 840, 0x04101b, 0.24).setDepth(1);
    this.add.text(58, 48, 'TOKYO // THE FIRST DAY', {
      fontFamily: PIXEL, fontSize: '14px', color: '#f4fbff',
      backgroundColor: '#071521', padding: { x: 16, y: 10 },
    }).setDepth(8);

    // 150% of the original sizes. Keep both characters grounded on the
    // station forecourt and close together on the right side of the screen.
    const placeCharacter = (id, x, feetY, targetHeight) => {
      const visual = characters[id]?.visual;
      if (!visual?.spriteKey || !this.textures.exists(visual.spriteKey)) return;
      const source = this.textures.get(visual.spriteKey).getSourceImage();
      const shadow = this.add.ellipse(x + 9, feetY - 6, 142, 28, 0x000000, 0.43).setDepth(4);
      const actor = this.add.image(x, feetY, visual.spriteKey)
        .setOrigin(0.5, 1)
        .setScale(targetHeight / source.height)
        .setDepth(5);
      return { actor, shadow };
    };
    placeCharacter(this.registry.get('playerCharacterId') || 'renMizuno', 985, 739, 405);
    const daichiStage = placeCharacter('daichiSakamoto', 1265, 739, 435);

    const next = this.add.rectangle(1410, 783, 220, 56, 0x0b302f, 1)
      .setStrokeStyle(2, 0x62e8c7, 1).setDepth(14);
    this.nextText = this.add.text(1410, 783, 'NEXT  >', {
      fontFamily: PIXEL, fontSize: '10px', color: '#f2fffb',
    }).setOrigin(0.5).setDepth(15);

    this.conversationComplete = false;
    this.nextBusy = false;
    const finishStationConversation = () => {
      if (this.conversationComplete) return;
      // Stay at the platform after the manga sequence, with the driver alone.
      this.nextBusy = true;
      const finish = () => {
        this.conversationComplete = true;
        this.nextBusy = false;
        this.nextText.setText('GO TO MAP  >');
      };
      if (!daichiStage?.actor?.active) { finish(); return; }
      this.tweens.add({
        targets: [daichiStage.actor, daichiStage.shadow],
        alpha: 0,
        duration: 800,
        ease: 'Sine.easeInOut',
        onComplete: finish,
      });
    };
    next.on('pointerdown', () => {
      if (this.nextBusy || this.registry.get('openingChapter') !== 'station') return;
      if (this.conversationComplete) {
        this.showTrainMap();
        return;
      }

      this.nextBusy = true;
      const result = playMangaCutscene(this, 'openingStationEncounter', {
        onComplete: finishStationConversation,
      });
      if (!result.played) {
        this.nextBusy = false;
        if (result.reason === 'seen') {
          finishStationConversation();
        }
      }
    });

    // The establishing shot remains silent and completely unobstructed until
    // the player explicitly advances into the full-size manga portraits.
    next.disableInteractive();
    this.cameras.main.fadeIn(1600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
      next.setInteractive({ useHandCursor: true });
    });
    finishSceneLoading('STATION READY');
  }

  showTrainMap() {
    if (this.nextBusy || this.registry.get('openingChapter') !== 'station') return;
    this.nextBusy = true;
    // Reuse the real Tokyo region map artwork and interaction, but show only
    // the Shinonome node / HOME destination during this prologue.
    showTravelMap(this, {
      currentLocationId: 'tokyoOpeningStation',
      title: 'TOKYO REGION MAP',
      travelMode: 'openingTrain',
      homeCost: 0,
      fromWorkshop: false,
      onHome: (locationId) => {
        if (locationId !== 'shinonomeWorkshop') return;
        this.registry.set('openingChapter', 'home');
        this.registry.set('workshopLocationId', 'shinonomeWorkshop');
        saveSessionState(this.registry);
        this.cameras.main.fadeOut(380, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('GarageScene');
        });
      },
    });
    // The map can be closed and reopened. Its own popup state blocks duplicate
    // maps; don't lock the station NEXT button for the rest of the scene.
    this.nextBusy = false;
  }
}
