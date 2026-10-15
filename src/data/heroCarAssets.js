// Authored body-only collector art. Axles are measured from the PNG right edge;
// every tyre shares the PNG-bottom contact line, including staggered pairs.
// Stock's historical 'L' means medium (194px); use full names here for clarity.
export const HERO_WHEEL_DIAMETERS = Object.freeze({ small: 182, medium: 194, large: 210 });
export const HERO_CAR_ASSETS = Object.freeze({
  espritNsx: { stem: 'esprit_nsx', width: 1350, rearX: -1009, frontX: -329, rear: 'small', front: 'small' },
  amuseS2000Gt1: { stem: 'amuse_s2000_gt1', rearX: -896, frontX: -230, rear: 'medium', front: 'small' },
  topSecretSupra: { stem: 'top_secret_supra', rearX: -982, frontX: -252, rear: 'medium', front: 'medium' },
  minesR34: { stem: 'mines_r34', rearX: -991, frontX: -259, rear: 'medium', front: 'medium' },
  reAmemiyaRx7: { stem: 're_amemiya_rx7', rearX: -931, frontX: -242, rear: 'small', front: 'medium' },
  junHyperLemonEvo5: { stem: 'jun_hyper_lemon_evo5', rearX: -959, frontX: -263, rear: 'medium', front: 'medium' },
  renownMazda787B: { stem: 'renown787B', wheel: 'renown787b', rearX: -1055, frontX: -262, rear: 'medium', front: 'small' },
  cleanMazda787B: { stem: 'mazda787B', wheel: 'renown787b', rearX: -1055, frontX: -260, rear: 'medium', front: 'small' },
  spoonEk9: { stem: 'spoon_ek9', rearX: -932, frontX: -214, rear: 'small', front: 'small' },
  veilsideFortuneRx7: { stem: 'veilside_fortune_rx7', rearX: -944, frontX: -233, rear: 'medium', front: 'small' },
  libertyWalkR35: { stem: 'liberty_walk_r35', rearX: -995, frontX: -236, rear: 'large', front: 'medium' },
  rwbStellaPorsche: { stem: 'rwb_stella_artois_porsche', rearX: -954, frontX: -257, rear: 'medium', front: 'small' },
  zeroSportsGc8: { stem: 'zerosportsgc8', wheel: 'zerosportsgc8', rearX: -911, frontX: -268, rear: 'small', front: 'small' },
  castrolMugenNsx: { stem: 'castrolNSX', wheel: 'castrolnsx', rearX: -999, frontX: -248, rear: 'medium', front: 'medium' },
  mcrae22B: { stem: 'mcrae22B', wheel: 'mcrae22b', rearX: -914, frontX: -262, rear: 'small', front: 'small' },
  tommiEvo6: { stem: 'tommievoVI', wheel: 'tommievoVI', rearX: -969, frontX: -260, rear: 'medium', front: 'medium' },
});

export function applyHeroCarAssets(cars) {
  for (const [id, g] of Object.entries(HERO_CAR_ASSETS)) {
    if (g.wheel) Object.assign(cars[id].visual, {
      wheelKey: 'heroWheel_' + g.wheel,
      wheelPath: 'assets/wheels/' + g.wheel + '_hero_wheel.png',
    });
    const rear = HERO_WHEEL_DIAMETERS[g.rear];
    const front = HERO_WHEEL_DIAMETERS[g.front];
    Object.assign(cars[id].visual, {
      assetStem: g.stem + '_hero',
      bodyPath: 'assets/Cars/hero/' + g.stem + '_hero_body.png',
      singleBody: true, referenceStandard: true,
      referenceGeometry: { rearX: g.rearX, frontX: g.frontX },
      referenceCanvasWidth: g.width || 1300, referenceCanvasHeight: 440,
      referenceWheelDiameter: rear,
      referenceRearWheelDiameter: rear, referenceFrontWheelDiameter: front,
      referenceRearWheelSize: g.rear, referenceFrontWheelSize: g.front,
      bodyScale: 0.32, canvasDisplayScale: 1,
      renderOffsetY: 0, bodyRenderOffsetX: 0, bodyRenderOffsetY: 0,
      modularAssetRoot: null, paintPath: null, overlayPath: null,
      singleLayerModular: false, deriveModularFromPreview: false,
      layeredMasterGeometry: null, stockBodyKit: false, stockSpoiler: false,
      wheelFitMode: 'reference-standard', levelWheelContact: false,
      rearOffsetX: g.rearX, frontOffsetX: g.frontX,
      rearWheelOffsetX: g.rearX, frontWheelOffsetX: g.frontX,
      wheelOffsetY: -rear / 2, rearWheelOffsetY: -rear / 2, frontWheelOffsetY: -front / 2,
      rearWheelWellRadius: rear / 2, frontWheelWellRadius: front / 2,
      rearWheelBackingRadius: rear / 2, frontWheelBackingRadius: front / 2,
      exhaustOffsetX: -(g.width || 1300) + 35, exhaustOffsetY: -rear / 2,
    });
  }
}
