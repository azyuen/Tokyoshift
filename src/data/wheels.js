// Tokyo Auto Market wheel catalogue.
//
// Every asset follows the R244 384x384 centred-wheel standard, so any catalogue
// wheel can use the receiving car's existing WheelFit geometry without bespoke
// offsets. "TUNER" entries are recognizable shop-derived designs; "HERO"
// entries are the rarer one-off/competition designs and carry the top prices.

export const WHEEL_CATALOG = [
  {
    id: 'street5Spoke',
    label: '5-SPOKE STREET',
    tier: 'STANDARD',
    source: 'TOKYO STANDARD',
    price: 65000,
    textureKey: 'wheel5Spoke',
    path: 'assets/wheels/wheel_5spoke.png',
  },
  {
    id: 'street8Spoke',
    label: '8-SPOKE STREET',
    tier: 'STANDARD',
    source: 'TOKYO STANDARD',
    price: 65000,
    textureKey: 'wheel8Spoke',
    path: 'assets/wheels/wheel_8spoke.png',
  },
  {
    id: 'streetMesh',
    label: 'MESH STREET',
    tier: 'STANDARD',
    source: 'TOKYO STANDARD',
    price: 78000,
    textureKey: 'wheelMesh',
    path: 'assets/wheels/wheel_mesh.png',
  },
  {
    id: 'streetDeepDish',
    label: 'DEEP DISH',
    tier: 'STANDARD',
    source: 'TOKYO STANDARD',
    price: 90000,
    textureKey: 'wheelDeepDish',
    path: 'assets/wheels/wheel_deepdish.png',
  },
  {
    id: 'spoonEk9',
    label: 'SPOON EK9',
    tier: 'TUNER',
    source: 'SPOON SPORTS',
    price: 180000,
    textureKey: 'heroWheelSpoonEk9',
    path: 'assets/wheels/spoon_ek9_hero_wheel.png',
  },
  {
    id: 'reAmemiyaRx7',
    label: 'RE AMEMIYA RX-7',
    tier: 'TUNER',
    source: 'RE AMEMIYA',
    price: 220000,
    textureKey: 'heroWheelReAmemiyaRx7',
    path: 'assets/wheels/re_amemiya_rx7_hero_wheel.png',
  },
  {
    id: 'amuseS2000',
    label: 'AMUSE S2000 GT1',
    tier: 'TUNER',
    source: 'POWERHOUSE AMUSE',
    price: 230000,
    textureKey: 'heroWheelAmuseS2000Gt1',
    path: 'assets/wheels/amuse_s2000_gt1_hero_wheel.png',
  },
  {
    id: 'junEvo5',
    label: 'JUN EVO V',
    tier: 'TUNER',
    source: 'JUN AUTO',
    price: 250000,
    textureKey: 'heroWheelJunHyperLemonEvo5',
    path: 'assets/wheels/jun_hyper_lemon_evo5_hero_wheel.png',
  },
  {
    id: 'minesR34',
    label: "MINE'S R34",
    tier: 'TUNER',
    source: "MINE'S",
    price: 260000,
    textureKey: 'heroWheelMinesR34',
    path: 'assets/wheels/mines_r34_hero_wheel.PNG',
  },
  {
    id: 'espritNsx',
    label: 'ESPRIT NSX',
    tier: 'TUNER',
    source: 'ESPRIT',
    price: 275000,
    textureKey: 'heroWheelEspritNsx',
    path: 'assets/wheels/esprit_nsx_hero_wheel.png',
  },
  {
    id: 'topSecretSupra',
    label: 'TOP SECRET SUPRA',
    tier: 'TUNER',
    source: 'TOP SECRET',
    price: 290000,
    textureKey: 'heroWheelTopSecretSupra',
    path: 'assets/wheels/top_secret_supra_hero_wheel.png',
  },
  {
    id: 'libertyWalkR35',
    label: 'LB-WORKS R35',
    tier: 'HERO',
    source: 'LIBERTY WALK HERO',
    price: 420000,
    textureKey: 'heroWheelLibertyWalkR35',
    path: 'assets/wheels/liberty_walk_r35_hero_wheel.png',
  },
  {
    id: 'veilsideFortune',
    label: 'VEILSIDE FORTUNE',
    tier: 'HERO',
    source: 'FORTUNE HERO',
    price: 460000,
    textureKey: 'heroWheelVeilsideFortuneRx7',
    path: 'assets/wheels/veilside_fortune_rx7_hero_wheel.png',
  },
  {
    id: 'rwbStella',
    label: 'RWB STELLA',
    tier: 'HERO',
    source: 'RWB HERO',
    price: 500000,
    textureKey: 'heroWheelRwbStella',
    path: 'assets/wheels/rwb_stella_artois_porsche_hero_wheel.png',
  },
  {
    id: 'renown787B',
    label: 'RENOWN 787B',
    tier: 'HERO',
    source: 'RENOWN LE MANS',
    price: 650000,
    textureKey: 'heroWheelRenown787B',
    path: 'assets/wheels/renown_mazda_787b_hero_wheel.png',
  },
];

const WHEEL_BY_ID = Object.fromEntries(WHEEL_CATALOG.map(item => [item.id, item]));

export function getWheelOption(id) {
  return WHEEL_BY_ID[String(id || '')] || null;
}

export function getEquippedWheelOption(carState = {}) {
  return getWheelOption(carState?.customWheelId);
}

export function preloadWheelOption(scene, optionOrId, cacheBust = '20260929-r246') {
  const option = typeof optionOrId === 'string'
    ? getWheelOption(optionOrId)
    : optionOrId;
  if (!option?.textureKey || !option?.path || scene.textures.exists(option.textureKey)) {
    return 0;
  }
  scene.load.image(option.textureKey, option.path + '?v=' + encodeURIComponent(cacheBust));
  return 1;
}

export function getOwnedWheelIds(source) {
  const raw = source && typeof source.get === 'function'
    ? source.get('ownedWheelIds')
    : source?.ownedWheelIds;
  return Array.isArray(raw) ? [...new Set(raw.map(String).filter(id => WHEEL_BY_ID[id]))] : [];
}
