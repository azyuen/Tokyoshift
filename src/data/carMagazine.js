import { cars } from './cars.js?v=20261004-r333';

export const MAGAZINE_ISSUES = Object.freeze({
  1: Object.freeze({
    id: 1,
    label: 'ISSUE 01',
    coverKey: 'magazineCover01',
    coverPath: 'assets/Ui/magazine_cover_01.webp',
    insetKey: 'magazineInset01',
    insetPath: 'assets/Ui/magazine_inset_01.webp',
  }),
});

// Issue selection deliberately stays simple for R277. Future progression can
// switch this resolver without changing GarageScene or the magazine renderer.
export function getActiveMagazineIssue(source = null) {
  return MAGAZINE_ISSUES[1];
}

export const CAR_MAGAZINE_META = Object.freeze({
  ae86: { year: 1983, drivetrain: 'RWD', fact: 'The AE86 became a cult lightweight because balance and momentum mattered more than outright power.' },
  ef: { year: 1989, drivetrain: 'FWD', fact: 'The EF-era Civic paired low mass with simple mechanicals, making it a natural grassroots tuning platform.' },
  ek9: { year: 1997, drivetrain: 'FWD', fact: 'The EK9 was Honda’s first Civic Type R and built its reputation around a high-revving B16B.' },
  ej1: { year: 1993, drivetrain: 'FWD', fact: 'The EJ1 coupe brought the fifth-generation Civic formula into a lighter two-door shape popular with street builds.' },
  fc3s: { year: 1989, drivetrain: 'RWD', fact: 'The FC RX-7 blended turbo rotary power with a more mature grand-touring chassis than the generation before it.' },
  rx7fd: { year: 1992, drivetrain: 'RWD', fact: 'The FD RX-7 is famous for its compact 13B rotary, sequential twin turbos and unusually low-slung proportions.' },
  rx8: { year: 2003, drivetrain: 'RWD', fact: 'The RX-8 kept Mazda’s rotary lineage alive with the naturally aspirated Renesis and near-50:50 balance.' },
  gr86: { year: 2022, drivetrain: 'RWD', fact: 'The GR86 follows the classic lightweight rear-drive formula with a naturally aspirated boxer engine.' },
  evo3: { year: 1995, drivetrain: 'AWD', fact: 'The Evolution III sharpened Mitsubishi’s rally-bred formula with more aero and a stronger 4G63T package.' },
  evo5: { year: 1998, drivetrain: 'AWD', fact: 'The Evolution V widened the track and body, creating one of the most recognizable shapes in the Evo lineage.' },
  evo6: { year: 1999, drivetrain: 'AWD', fact: 'The Evolution VI refined cooling and response while keeping the compact 4G63T all-wheel-drive recipe.' },
  evo9: { year: 2005, drivetrain: 'AWD', fact: 'The Evolution IX added MIVEC to the 4G63T and became one of the last classic 4G63-powered Evos.' },
  wrx22b: { year: 1998, drivetrain: 'AWD', fact: 'The 22B STI was a wide-body homologation-era icon built to celebrate Subaru’s rally success.' },
  r32: { year: 1989, drivetrain: 'AWD', fact: 'The R32 GT-R revived the GT-R badge with the RB26DETT and ATTESA E-TS all-wheel-drive system.' },
  r34: { year: 1999, drivetrain: 'AWD', fact: 'The R34 GT-R evolved the RB26 and ATTESA formula into one of the defining Japanese performance cars of its era.' },
  '3000gt': { year: 1994, drivetrain: 'AWD', fact: 'The 3000GT VR-4 combined twin turbos, all-wheel drive and unusually ambitious chassis technology for the 1990s.' },
  a60: { year: 1985, drivetrain: 'RWD', fact: 'The A60 Supra marked the period when Toyota’s six-cylinder grand tourer began separating itself from the Celica line.' },
  jza80: { year: 1993, drivetrain: 'RWD', fact: 'The JZA80 Supra became legendary for the strength and tuning headroom of its 2JZ-GTE.' },
  nsx: { year: 1990, drivetrain: 'RWD', fact: 'The original NSX paired an aluminium structure with a mid-mounted V6 and everyday usability rare among contemporary exotics.' },
});

const HERO_LABELS = Object.freeze({
  espritNsx: 'ESPRIT NSX',
  amuseS2000Gt1: 'AMUSE S2000 GT1',
  topSecretSupra: 'TOP SECRET SUPRA',
  minesR34: "MINE'S R34",
  reAmemiyaRx7: 'RE AMEMIYA RX-7',
  spoonEk9: 'SPOON EK9',
  junEvo5: 'JUN HYPER LEMON EVO V',
});

export function getCarMagazineMeta(carId) {
  const id = String(carId || '');
  const car = cars[id];
  const meta = CAR_MAGAZINE_META[id] || {};
  return {
    id,
    name: car?.name || HERO_LABELS[id] || id.replaceAll('_', ' ').toUpperCase(),
    shortName: car?.shortName || HERO_LABELS[id] || id.toUpperCase(),
    year: Number(meta.year || 0),
    drivetrain: meta.drivetrain || 'SPECIAL',
    fact: meta.fact || car?.description || 'A noteworthy build spotted during this Tokyo SHIFT save.',
    isHero: !car && Boolean(HERO_LABELS[id]),
  };
}

export function recordCarMagazineSightings(registry, entries = [], source = 'street') {
  if (!registry?.get || !registry?.set) return {};
  const now = Date.now();
  const current = { ...(registry.get('carMagazineSightings') || {}) };
  const list = Array.isArray(entries) ? entries : [entries];

  list.forEach(raw => {
    const item = typeof raw === 'string' ? { carId: raw } : (raw || {});
    const carId = String(item.carId || item.id || '');
    if (!carId) return;
    if (!cars[carId] && !HERO_LABELS[carId] && !item.label) return;

    const existing = current[carId] || {};
    const sources = new Set(Array.isArray(existing.sources) ? existing.sources : []);
    sources.add(String(item.source || source || 'street'));

    current[carId] = {
      ...existing,
      carId,
      label: item.label || existing.label || getCarMagazineMeta(carId).name,
      firstSeenAt: Number(existing.firstSeenAt || now),
      lastSeenAt: now,
      seenCount: Math.max(0, Number(existing.seenCount || 0)) + 1,
      sources: [...sources],
    };
  });

  registry.set('carMagazineSightings', current);
  return current;
}

export function getCarMagazineSightings(source) {
  const raw = source && typeof source.get === 'function'
    ? source.get('carMagazineSightings')
    : source?.carMagazineSightings;
  return raw && typeof raw === 'object' ? raw : {};
}

export function carMatchesCompetitionRestriction(carId, restriction) {
  if (!restriction) return true;
  const id = String(carId || '');
  const meta = getCarMagazineMeta(id);
  if (!cars[id]) return false;

  if (restriction.kind === 'DRIVETRAIN') {
    return meta.drivetrain === restriction.value;
  }
  if (restriction.kind === 'ERA') {
    const year = Number(meta.year || 0);
    if (!year) return false;
    if (restriction.value === '80S') return year >= 1980 && year <= 1989;
    if (restriction.value === '90S') return year >= 1990 && year <= 1999;
    if (restriction.value === '00S_PLUS') return year >= 2000;
  }
  return true;
}

export function getCompetitionRestrictionPool(regionId, difficulty = 'MED') {
  const region = String(regionId || '').toUpperCase();
  const level = String(difficulty || '').toUpperCase();

  if (['ODAIBA', 'SHINAGAWA', 'TATSUMI'].includes(region)) return [];

  const broad = [
    { kind: 'DRIVETRAIN', value: 'FWD', label: 'FWD ONLY' },
    { kind: 'DRIVETRAIN', value: 'RWD', label: 'RWD ONLY' },
    { kind: 'DRIVETRAIN', value: 'AWD', label: 'AWD ONLY' },
    { kind: 'ERA', value: '90S', label: '1990s CARS ONLY' },
  ];

  if (region === 'SHIBUYA' || region === 'YOKOHAMA') {
    return broad;
  }

  if (region === 'SHINJUKU' || region === 'DAIKOKU' || level === 'ELITE') {
    return [
      ...broad,
      { kind: 'ERA', value: '80S', label: '1980s CARS ONLY' },
      { kind: 'ERA', value: '00S_PLUS', label: '2000+ CARS ONLY' },
    ];
  }

  return broad;
}
