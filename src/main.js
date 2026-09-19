import BootScene from './scenes/BootScene.js';
import RaceScene from './scenes/RaceScene.js';
import ResultScene from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#070914',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [BootScene, RaceScene, ResultScene],
};

window.TOKYO_SHIFT = new Phaser.Game(config);
