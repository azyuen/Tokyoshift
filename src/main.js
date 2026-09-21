import BootScene from './scenes/BootScene.js?v=20260921-r32';
import GarageScene from './scenes/GarageScene.js?v=20260921-r32';
import MeetScene from './scenes/MeetScene.js?v=20260921-r32';
import RaceScene from './scenes/RaceScene.js?v=20260921-r32';
import ResultScene from './scenes/ResultScene.js?v=20260921-r32';


// Phone readability pass: Workshop/Meet render into a 1560x840 logical canvas, so
// 10-12px logical text becomes extremely small on a landscape phone. Boost all
// canvas text consistently while preserving relative hierarchy.
const originalSetStyle = Phaser.GameObjects.Text.prototype.setStyle;
Phaser.GameObjects.Text.prototype.setStyle = function(style = {}, updateText = true) {
  if (style && style.fontSize != null) {
    const next = { ...style };
    const raw = next.fontSize;
    const numeric = typeof raw === 'number' ? raw : parseFloat(raw);

    if (Number.isFinite(numeric)) {
      const boosted = Math.max(44, Math.round(numeric * 5.30));
      next.fontSize = typeof raw === 'number' ? boosted : boosted + 'px';
    }
    return originalSetStyle.call(this, next, updateText);
  }
  return originalSetStyle.call(this, style, updateText);
};

const GAME_WIDTH = 1560;
const GAME_HEIGHT = 840;

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
  scene: [BootScene, GarageScene, MeetScene, RaceScene, ResultScene],
};

window.TOKYO_SHIFT = new Phaser.Game(config);
