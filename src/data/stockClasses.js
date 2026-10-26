import {TUNING_POTENTIAL} from './tuningPotential.js?v=20261026-r687';
// Fixed model classes from seeded 120 Hz Vehicle simulations; see docs/engineering.
export const STOCK_CLASS_DATA = {
  "gdb": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.829
  },
  "gf8": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.624
  },
  "s15": {
    "stockClass": "A",
    "stockCompositeSeconds": 14.031
  },
  "starion": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.62
  },
  "fto": {
    "stockClass": "C",
    "stockCompositeSeconds": 14.993
  },
  "mx5": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.64
  },
  "sa22c": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.781
  },
  "mx6": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.032
  },
  "prelude": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.047
  },
  "sw20": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.82
  },
  "soarer": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.229
  },
  "forester": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.432
  },
  "svx": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.382
  },
  "xt": {
    "stockClass": "D",
    "stockCompositeSeconds": 16.86
  },
  "ae86": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.477
  },
  "ef": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.292
  },
  "ek9": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.239
  },
  "s2000": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.267
  },
  "fc3s": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.118
  },
  "rx7fd": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.711
  },
  "rx8": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.551
  },
  "galant": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.749
  },
  "evo5": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.852
  },
  "evo6": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.801
  },
  "gc8": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.513
  },
  "r32": {
    "stockClass": "A",
    "stockCompositeSeconds": 14.037
  },
  "r34": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.178
  },
  "3000gt": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.125
  },
  "a60": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.861
  },
  "jza80": {
    "stockClass": "A",
    "stockCompositeSeconds": 14.067
  },
  "nsx": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.353
  },
  "z32": {
    "stockClass": "A",
    "stockCompositeSeconds": 14.065
  },
  "z33": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.67
  },
  "240z": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.199
  },
  "crx": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.368
  },
  "dc2": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.699
  },
  "eclipse": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.327
  },
  "familia": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.339
  },
  "180sx": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.532
  },
  "st205": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.411
  },
  "jzx100": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.926
  },
  "b4rsk": {
    "stockClass": "A",
    "stockCompositeSeconds": 14.093
  },
  "magna": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.585
  }
};
// Potential is independent of permanent factory class and never gates recruitment.
for (const [id, potential] of Object.entries(TUNING_POTENTIAL)) {
  if (STOCK_CLASS_DATA[id]) STOCK_CLASS_DATA[id].tuningPotential = potential.rating;
}
export function tuningPotentialSummary(car) {
  const id=car?.ownedBaseCarId||car?.crewBaseCarId||car?.id;
  const p=TUNING_POTENTIAL[id];
  if (!p) return 'EXCLUSIVE BUILD';
  return p.rating.toUpperCase()+' DEVELOPMENT // PACE, USABILITY & COST\n'+
    'STANDARD MAX '+p.maximumPowerKW+' kW // '+p.maximumTorqueNm+' Nm'+
    (p.competitiveCost?'\nBENCHMARK BUILD FROM ¥'+p.competitiveCost.toLocaleString('en-US')+' INCLUDING CAR':'\nALL-ROUND BENCHMARK NOT REACHED WITH STANDARD PARTS');
}
// Permanent factory grades, ordered from lowest to highest. Upgrades never
// change the grade: class ceilings are inclusive (e.g. CLASS C allows D + C).
// S is reserved for authored hero/collector cars, not tuned regular cars.
export const STOCK_CLASS_ORDER = Object.freeze(['D', 'C', 'B', 'A', 'S']);
export const STOCK_CLASSES = Object.freeze({
  D: 'D / Entry',
  C: 'C / Club',
  B: 'B / Sports',
  A: 'A / Performance',
  S: 'S / Hero',
});

// The Aruken story Liberty Walk 240Z is a BODY conversion of the same base
// Datsun, not the separate sealed Ginza collector Liberty Walk 240Z.
const FACTORY_MODEL_ALIASES = Object.freeze({arkonLibertyWalk240z: '240z'});

export function stockClassFor(car) {
  if (!car) return null;
  // A collector retains S even if its engine/skin derives from a regular car.
  if (car.collector === true) return 'S';
  const rawId = String(car.ownedBaseCarId || car.crewBaseCarId || car.id || '');
  const id = FACTORY_MODEL_ALIASES[rawId] || rawId;
  return STOCK_CLASS_DATA[id]?.stockClass ||
    (STOCK_CLASS_ORDER.includes(car.stockClass) ? car.stockClass : null);
}

// FUTURE event restrictions: a "maximum Class C" meet admits both D and C,
// without changing the car's permanent class or inspecting installed upgrades.
export function isWithinStockClassLimit(car, maximumClass) {
  const actual = stockClassFor(car);
  const maximum = String(maximumClass || '').trim().toUpperCase();
  if (!actual || !STOCK_CLASS_ORDER.includes(maximum)) return false;
  return STOCK_CLASS_ORDER.indexOf(actual) <= STOCK_CLASS_ORDER.indexOf(maximum);
}

export function engineeringLabel(car) {
  const grade = stockClassFor(car);
  if (grade === 'S') return 'FACTORY S // HERO COLLECTOR';
  const rawId = String(car?.ownedBaseCarId || car?.crewBaseCarId || car?.id || '');
  const id = FACTORY_MODEL_ALIASES[rawId] || rawId;
  const d = STOCK_CLASS_DATA[id];
  return d ? 'FACTORY ' + d.stockClass + ' // POTENTIAL ' + d.tuningPotential.toUpperCase() : 'EXCLUSIVE';
}
