import BootScene from './scenes/BootScene.js?v=20260921-r49';
import CharacterSelectScene from './scenes/CharacterSelectScene.js?v=20260921-r49';
import GarageScene from './scenes/GarageScene.js?v=20260921-r49';
import MeetScene from './scenes/MeetScene.js?v=20260921-r49';
import RaceScene from './scenes/RaceScene.js?v=20260921-r49';
import ResultScene from './scenes/ResultScene.js?v=20260921-r49';


// Phone readability pass.
// Previous revisions patched Text.setStyle(), but Phaser's add.text() constructor
// applies its initial style before that path, so much of the UI stayed tiny.
// Scale the style at the GameObject factory instead, which catches every add.text().
const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function(x, y, text, style = {}) {
  const next = { ...(style || {}) };
  const raw = next.fontSize;

  if (raw != null) {
    const numeric = typeof raw === 'number' ? raw : parseFloat(raw);
    if (Number.isFinite(numeric)) {
      const boosted = Math.max(14, Math.round(numeric * 1.60));
      next.fontSize = typeof raw === 'number' ? boosted : boosted + 'px';
    }
  }

  return originalTextFactory.call(this, x, y, text, next);
};

const GAME_WIDTH = 1560;
const GAME_HEIGHT = 840;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#070914',
  dom: { createContainer: true },
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
  scene: [BootScene, CharacterSelectScene, GarageScene, MeetScene, RaceScene, ResultScene],
};

window.TOKYO_SHIFT = new Phaser.Game(config);
