import { characters, getCharacterAssetUrl } from '../data/characters.js?v=20261010-r459';
import { saveSessionState } from '../state/GameState.js?v=20261010-r467';
import { getWorldPhase } from '../environment/WorldClock.js?v=20260929-r286';
import { playMusic } from '../audio/MusicManager.js?v=20260922-r99';
import { startSceneLoading, finishSceneLoading } from '../ui/LoadingScreen.js?v=20261005-r355';

const PIXEL = '"Silkscreen", monospace';
const BODY = '"Rajdhani", monospace';

const DIALOGUE = [
  ['DAICHI', "There you are. Have you seen the first issue of Tokyo SHIFT?"],
  ['DAICHI', "It's a new magazine about Tokyo's street racing and car-modifying scene. Issue one looks back at last year's Tokyo Champion."],
  ['YOU', "Not yet. I'd like to see what everyone's driving."],
  ['DAICHI', "I posted a copy to your place. You should find it in the office when you get home."],
  ['YOU', "Thanks. This should be my last day taking the train. A family friend is bringing over my first car today."],
  ['DAICHI', "About time! Your family said there were two cars you could choose from. Have a look at that magazine first, then let Sayaka know which one you want."],
  ['YOU', "I'll head home and check it out."],
];

// Deliberately a separate scene: a new save has no owned car until the
// magazine choice and must not be fed into the normal street-racing map.
export default class TrainStationScene extends Phaser.Scene {
  constructor() { super('TrainStationScene'); }

  preload() {
    const phase = getWorldPhase() === 'day' ? 'day' : 'night';
    const backgroundKey = 'tokyoOpeningStation_' + phase;
    this.stationKey = backgroundKey;
    let queued = 0;
    const queue = (key, path) => {
      if (this.textures.exists(key) || !path) return;
      this.load.image(key, path);
      queued += 1;
    };
    queue(backgroundKey, 'assets/CentralTokyo/tokyo_trainstation_' + phase + '.png?v=20261010-r467');
    const ids = [this.registry.get('playerCharacterId') || 'renMizuno', 'daichiSakamoto'];
    for (const id of ids) {
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

    const bg = this.add.image(780, 420, this.stationKey).setDepth(0);
    const scale = Math.max(1560 / bg.width, 840 / bg.height);
    bg.setScale(scale);
    this.add.rectangle(780, 420, 1560, 840, 0x04101b, 0.24).setDepth(1);
    this.add.text(58, 48, 'TOKYO // THE FIRST DAY', {
      fontFamily: PIXEL, fontSize: '14px', color: '#f4fbff',
      backgroundColor: '#071521', padding: { x: 16, y: 10 },
    }).setDepth(8);

    const placeCharacter = (id, x, feetY, height) => {
      const visual = characters[id]?.visual;
      if (!visual?.spriteKey || !this.textures.exists(visual.spriteKey)) return;
      const source = this.textures.get(visual.spriteKey).getSourceImage();
      this.add.ellipse(x + 8, feetY - 7, 132, 28, 0x000000, 0.45).setDepth(4);
      this.add.image(x, feetY, visual.spriteKey)
        .setOrigin(0.5, 1).setScale(height / source.height).setDepth(5);
    };
    placeCharacter(this.registry.get('playerCharacterId') || 'renMizuno', 540, 590, 270);
    placeCharacter('daichiSakamoto', 1030, 590, 290);

    this.add.rectangle(780, 716, 1488, 230, 0x05101c, 0.95)
      .setStrokeStyle(3, 0x5bcedf, 0.9).setDepth(12);
    this.speaker = this.add.text(96, 622, '', {
      fontFamily: PIXEL, fontSize: '11px', color: '#6bdeff',
    }).setDepth(13);
    this.dialogue = this.add.text(96, 667, '', {
      fontFamily: BODY, fontSize: '16px', color: '#f5faff',
      wordWrap: { width: 1310 }, lineSpacing: 7, fontStyle: '700',
    }).setDepth(13);

    const next = this.add.rectangle(1366, 795, 286, 50, 0x0b302f, 1)
      .setStrokeStyle(2, 0x62e8c7, 1).setInteractive({ useHandCursor: true }).setDepth(14);
    this.nextText = this.add.text(1366, 795, 'NEXT  >', {
      fontFamily: PIXEL, fontSize: '10px', color: '#f2fffb',
    }).setOrigin(0.5).setDepth(15);
    this.page = 0;
    this.transitioning = false;
    this.showLine();
    next.on('pointerdown', () => {
      if (this.transitioning) return;
      if (this.page < DIALOGUE.length - 1) {
        this.page += 1;
        this.showLine();
      } else {
        this.showTrainMap();
      }
    });
    finishSceneLoading('STATION READY');
  }

  showLine() {
    const [speaker, line] = DIALOGUE[this.page];
    this.speaker.setText(speaker);
    this.dialogue.setText(line);
    this.nextText.setText(this.page === DIALOGUE.length - 1 ? 'GO TO MAP  >' : 'NEXT  >');
  }

  showTrainMap() {
    if (this.transitioning) return;
    this.transitioning = true;
    const shade = this.add.rectangle(780, 420, 1560, 840, 0x030812, 0.89)
      .setInteractive().setDepth(100);
    this.add.rectangle(780, 420, 1060, 580, 0x0a1623, 0.99)
      .setStrokeStyle(3, 0x4bd4ff, 1).setDepth(101);
    this.add.text(780, 210, 'TOKYO REGION MAP // TRAIN', {
      fontFamily: PIXEL, fontSize: '17px', color: '#f4fbff',
    }).setOrigin(0.5).setDepth(102);
    this.add.text(780, 300, 'YOUR ONLY DESTINATION', {
      fontFamily: PIXEL, fontSize: '9px', color: '#79a5b8',
    }).setOrigin(0.5).setDepth(102);
    const home = this.add.rectangle(780, 415, 760, 122, 0x112f3d, 1)
      .setStrokeStyle(3, 0x62e8c7, 1).setInteractive({ useHandCursor: true }).setDepth(102);
    this.add.text(780, 412, 'SHINONOME WORKSHOP', {
      fontFamily: PIXEL, fontSize: '16px', color: '#f0fffc',
    }).setOrigin(0.5).setDepth(103);
    this.add.text(780, 476, 'TRAIN HOME // FREE', {
      fontFamily: PIXEL, fontSize: '9px', color: '#8cebd4',
    }).setOrigin(0.5).setDepth(103);
    shade.on('pointerdown', () => {});
    home.on('pointerdown', () => {
      home.disableInteractive();
      this.registry.set('openingChapter', 'home');
      this.registry.set('workshopLocationId', 'shinonomeWorkshop');
      saveSessionState(this.registry);
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('GarageScene');
      });
    });
  }
}
