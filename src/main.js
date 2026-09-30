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
  window.TOKYO_SHIFT_SET_LOADING?.(0.06, 'LOADING FONTS');

  const fontLoad = Promise.all([
    document.fonts.load('400 16px "Silkscreen"'),
    document.fonts.load('700 16px "Silkscreen"'),
    document.fonts.load('500 16px "Rajdhani"'),
    document.fonts.load('600 16px "Rajdhani"'),
    document.fonts.load('600 16px "Teko"'),
  ]).then(() => document.fonts.ready);
  const timeout = new Promise(resolve => window.setTimeout(resolve, 2200));
  try { await Promise.race([fontLoad, timeout]); } catch (e) {}
}

async function startTokyoShift() {
  try {
    // Import after the loading UI has moved past 3%, so module failures are
    // observable instead of looking like a frozen first-load screen.
    window.TOKYO_SHIFT_SET_LOADING?.(0.07, 'LOADING GAME MODULES');

    const [
      { default: BootScene },
      { default: CharacterSelectScene },
      { default: ProfileSelectScene },
      { default: GarageScene },
      { default: CentralTokyoScene },
      { default: MeetScene },
      { default: RaceScene },
      { default: RunOverScene },
      { default: ResultScene },
      { default: TunerShopScene },
      { default: WheelCalibrationScene },
    ] = await Promise.all([
      import('./scenes/BootScene.js?v=20260930-recovery'),
      import('./scenes/CharacterSelectScene.js?v=20260930-recovery'),
      import('./scenes/ProfileSelectScene.js?v=20260930-recovery'),
      import('./scenes/GarageScene.js?v=20260930-recovery'),
      import('./scenes/CentralTokyoScene.js?v=20260930-recovery'),
      import('./scenes/MeetScene.js?v=20260930-recovery'),
      import('./scenes/RaceScene.js?v=20260930-recovery'),
      import('./scenes/RunOverScene.js?v=20260930-recovery'),
      import('./scenes/ResultScene.js?v=20260930-recovery'),
      import('./scenes/TunerShopScene.js?v=20260930-recovery'),
      import('./scenes/WheelCalibrationScene.js?v=20260930-recovery'),
    ]);

    window.TOKYO_SHIFT_SET_LOADING?.(0.08, 'STARTING ENGINE');

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
        BootScene, ProfileSelectScene, CharacterSelectScene, GarageScene,
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
