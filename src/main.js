// Tokyo SHIFT boot recovery: load scene modules dynamically so a broken import
// cannot strand the splash at the initial 3% with no diagnostic.
const GAME_WIDTH = 1560;
const GAME_HEIGHT = 840;

window.TOKYO_SHIFT_SET_LOADING?.(0.05, 'STARTING ENGINE');

function showBootError(error) {
  const message = String(error?.stack || error?.message || error || 'Unknown startup error');
  console.error('[Tokyo SHIFT] boot failure', error);
  window.TOKYO_SHIFT_SET_LOADING?.(1, 'BOOT ERROR');
  const splash = document.getElementById('loading-screen');
  const label = document.getElementById('loading-label');
  const percent = document.getElementById('loading-percent');
  if (label) label.textContent = 'BOOT ERROR';
  if (percent) percent.textContent = 'ERROR';
  if (splash) {
    splash.classList.remove('is-hidden');
    splash.setAttribute('data-boot-error', message.slice(0, 500));
  }
}

async function waitForTokyoShiftFonts() {
  if (!document.fonts?.load) return;
  const fontLoad = Promise.all([
    document.fonts.load('400 16px "Silkscreen"'),
    document.fonts.load('700 16px "Silkscreen"'),
    document.fonts.load('500 16px "Rajdhani"'),
    document.fonts.load('600 16px "Rajdhani"'),
    document.fonts.load('600 16px "Teko"'),
    document.fonts.load('italic 900 16px "Exo 2"'),
  ]).then(() => document.fonts.ready);
  const timeout = new Promise(resolve => window.setTimeout(resolve, 2200));
  try { await Promise.race([fontLoad, timeout]); } catch (e) {}
}

async function startTokyoShift() {
  try {
    window.TOKYO_SHIFT_SET_LOADING?.(0.08, 'LOADING');

    const loadScene = async (name, path) => {
      try {
        const module = await import(path);
        return module.default;
      } catch (error) {
        error.message = name + ' IMPORT FAILED: ' + (error.message || error);
        throw error;
      }
    };

    const [
      BootScene,
      CharacterSelectScene,
      ProfileSelectScene,
      GarageScene,
      CrewSpaceScene,
      CrewScene,
      DynoScene,
      CentralTokyoScene,
      MeetScene,
      RaceScene,
      RunOverScene,
      ResultScene,
      TunerShopScene,
      WheelCalibrationScene,
    ] = await Promise.all([
      loadScene('BOOT SCENE', './scenes/BootScene.js?v=20261006-r388'),
      loadScene('CHARACTER SELECT', './scenes/CharacterSelectScene.js?v=20261006-r388'),
      loadScene('PROFILE SELECT', './scenes/ProfileSelectScene.js?v=20261006-r388'),
      loadScene('GARAGE', './scenes/GarageScene.js?v=20261007-r414'),
      loadScene('CREW SPACE', './scenes/CrewSpaceScene.js?v=20261007-r414'),
      loadScene('CREW BRIDGE', './scenes/CrewScene.js?v=20261006-r388'),
      loadScene('DYNO', './scenes/DynoScene.js?v=20261006-r388'),
      loadScene('CENTRAL TOKYO', './scenes/CentralTokyoScene.js?v=20261007-r411'),
      loadScene('MEET', './scenes/MeetScene.js?v=20261007-r413'),
      loadScene('RACE', './scenes/RaceScene.js?v=20261007-r412'),
      loadScene('RUN OVER', './scenes/RunOverScene.js?v=20261006-r388'),
      loadScene('RESULT', './scenes/ResultScene.js?v=20261005-r361'),
      loadScene('TUNER SHOP', './scenes/TunerShopScene.js?v=20261006-r393'),
      loadScene('WHEEL CALIBRATION', './scenes/WheelCalibrationScene.js?v=20261006-r388'),
    ]);

    window.TOKYO_SHIFT_SET_LOADING?.(0.10, 'LOADING');

    // Keep the existing phone readability pass.
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

    await waitForTokyoShiftFonts();

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
      scene: [
        BootScene, ProfileSelectScene, CharacterSelectScene, GarageScene, CrewSpaceScene, CrewScene, DynoScene,
        CentralTokyoScene, MeetScene, RaceScene, RunOverScene, ResultScene,
        TunerShopScene, WheelCalibrationScene
      ],
    };

    window.TOKYO_SHIFT = new Phaser.Game(config);
  } catch (error) {
    showBootError(error);
  }
}

startTokyoShift();

