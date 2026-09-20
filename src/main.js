import BootScene from './scenes/BootScene.js?v=20260920-r7';
import GarageScene from './scenes/GarageScene.js?v=20260920-r7';
import RaceScene from './scenes/RaceScene.js?v=20260920-r7';
import ResultScene from './scenes/ResultScene.js?v=20260920-r7';

const GAME_WIDTH = 1560;
const GAME_HEIGHT = 720;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#070914',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [BootScene, GarageScene, RaceScene, ResultScene],
};

window.TOKYO_SHIFT = new Phaser.Game(config);
