import { makeDeferredScene } from './ui/DeferredScene.js?v=20261104-r788';
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

    // Fonts and scene modules are independent: overlap their network waits.
    const fontsReady = waitForTokyoShiftFonts();

    const MenuNavigation = (
      await import('./input/MenuNavigation.js?v=20261007-r423')
    ).default;

    const loadScene = async (name, path) => {
      try {
        const module = await import(path);
        return module.default;
      } catch (error) {
        error.message = name + ' IMPORT FAILED: ' + (error.message || error);
        throw error;
      }
    };

    // Existing profiles only need boot and the driver board. New-driver art,
    // car rendering and opening-story dependencies wait until those screens open.
    const [BootScene, ProfileSelectScene] = await Promise.all([
      loadScene('BOOT SCENE', './scenes/BootScene.js?v=20261026-r687'),
      loadScene('PROFILE SELECT', './scenes/ProfileSelectScene.js?v=20261026-r687'),
    ]);
    const CharacterSelectScene = makeDeferredScene('CharacterSelectScene',
      '../scenes/CharacterSelectScene.js?v=20261026-r687');
    const TrainStationScene = makeDeferredScene('TrainStationScene',
      '../scenes/TrainStationScene.js?v=20261026-r687');

    // Preserve the canonical Phaser scene keys and their init-data contract.
    // The placeholder is replaced by the actual class on first entry.
    const GarageScene = makeDeferredScene('GarageScene',
      '../scenes/GarageScene.js?v=20261105-r800-championship');
    const CrewSpaceScene = makeDeferredScene('CrewSpaceScene',
      '../scenes/CrewSpaceScene.js?v=20261026-r687');
    const CrewScene = makeDeferredScene('CrewScene',
      '../scenes/CrewScene.js?v=20261026-r687');
    const DynoScene = makeDeferredScene('DynoScene',
      '../scenes/DynoScene.js?v=20261026-r687');
    const CentralTokyoScene = makeDeferredScene('CentralTokyoScene',
      '../scenes/CentralTokyoScene.js?v=20261107-r804-hub');
    const OshiageScene = makeDeferredScene('OshiageScene',
      '../scenes/OshiageScene.js?v=20261026-r687');
    const MeetScene = makeDeferredScene('MeetScene',
      '../scenes/MeetScene.js?v=20261104-r788');
    const RaceScene = makeDeferredScene('RaceScene',
      '../scenes/RaceScene.js?v=20261104-r788');
    const DevVaultStoryScene = makeDeferredScene('DevVaultStoryScene',
      '../scenes/DevVaultStoryScene.js?v=20261026-r687');
    const FourLaneTestScene = makeDeferredScene('FourLaneTestScene',
      '../scenes/FourLaneTestScene.js?v=20261105-r800-championship');
    const RunOverScene = makeDeferredScene('RunOverScene',
      '../scenes/RunOverScene.js?v=20261026-r687');
    const ResultScene = makeDeferredScene('ResultScene',
      '../scenes/ResultScene.js?v=20261026-r687');
    const TunerShopScene = makeDeferredScene('TunerShopScene',
      '../scenes/TunerShopScene.js?v=20261103-r785');
    const WheelCalibrationScene = makeDeferredScene('WheelCalibrationScene',
      '../scenes/WheelCalibrationScene.js?v=20261026-r687');

    // Debug-only opt-in screen. No profile state or production car renderer changes.
    const useCarReference = new URLSearchParams(window.location.search).get('carref') === '1';
    const CarReferenceCalibrationScene = useCarReference
      ? await loadScene('CAR REFERENCE CALIBRATION', './scenes/CarReferenceCalibrationScene.js?v=20261026-r687')
      : null;


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

    await fontsReady;

    const allScenes = [
      BootScene, ProfileSelectScene, CharacterSelectScene, TrainStationScene, GarageScene,
      CrewSpaceScene, CrewScene, DynoScene, CentralTokyoScene, OshiageScene, MeetScene, RaceScene,
      DevVaultStoryScene, FourLaneTestScene, RunOverScene, ResultScene, TunerShopScene, WheelCalibrationScene,
    ];
    // Phaser starts its first scene. Put the test scene first only when asked.
    if (CarReferenceCalibrationScene) allScenes.unshift(CarReferenceCalibrationScene);

    // Avoid dozens of simultaneous full-resolution PNG/WebP decode/uploads
    // overwhelming older mobile Safari WebGL processes. Total artwork is
    // unchanged; only peak in-flight asset pressure is bounded on small CPUs.
    const olderMobile = /iPad|iPhone|iPod/i.test(navigator.userAgent) &&
      (navigator.hardwareConcurrency || 4) <= 4;
    const config = {
      type: Phaser.AUTO,
      loader: { maxParallelDownloads: olderMobile ? 4 : 16 },
      parent: 'game',
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: '#070914',
      dom: { createContainer: true },
      input: { gamepad: true },
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
      scene: allScenes,
    };

    window.TOKYO_SHIFT = new Phaser.Game(config);
    // Optional Story Director is installed after boot. A narrative module error
    // must never prevent a player reaching their profile on mobile/iPad.
    import('./story/StoryDirector.js?v=20261101-r749')
      .then(({ installStoryDirector }) => installStoryDirector(window.TOKYO_SHIFT))
      .catch(error => console.error('[Tokyo SHIFT] Story Director unavailable', error));
    try { window.TOKYO_SHIFT_MENU_NAV?.destroy?.(); } catch (e) {}
    window.TOKYO_SHIFT_MENU_NAV = new MenuNavigation(window.TOKYO_SHIFT);
  } catch (error) {
    showBootError(error);
  }
}

startTokyoShift();


