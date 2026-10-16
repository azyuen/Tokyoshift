import {TUNING_POTENTIAL} from './tuningPotential.js';
// Fixed model classes from seeded 120 Hz Vehicle simulations; see docs/engineering.
export const STOCK_CLASS_DATA = {
  "gdb": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.179
  },
  "gf8": {
    "stockClass": "A",
    "stockCompositeSeconds": 14.016
  },
  "s15": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.106
  },
  "starion": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.43
  },
  "fto": {
    "stockClass": "C",
    "stockCompositeSeconds": 14.992
  },
  "mx5": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.787
  },
  "sa22c": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.694
  },
  "mx6": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.031
  },
  "prelude": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.046
  },
  "sw20": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.197
  },
  "soarer": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.699
  },
  "forester": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.675
  },
  "svx": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.763
  },
  "xt": {
    "stockClass": "D",
    "stockCompositeSeconds": 17.443
  },
  "ae86": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.53
  },
  "ef": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.281
  },
  "ek9": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.241
  },
  "s2000": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.363
  },
  "fc3s": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.58
  },
  "rx7fd": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.703
  },
  "rx8": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.575
  },
  "galant": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.795
  },
  "evo5": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.125
  },
  "evo6": {
    "stockClass": "A",
    "stockCompositeSeconds": 14.077
  },
  "gc8": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.663
  },
  "r32": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.436
  },
  "r34": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.558
  },
  "3000gt": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.516
  },
  "a60": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.832
  },
  "jza80": {
    "stockClass": "A",
    "stockCompositeSeconds": 14.032
  },
  "nsx": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.471
  },
  "z32": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.239
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
    "stockCompositeSeconds": 15.376
  },
  "dc2": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.698
  },
  "eclipse": {
    "stockClass": "C",
    "stockCompositeSeconds": 15.461
  },
  "familia": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.639
  },
  "180sx": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.678
  },
  "st205": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.768
  },
  "jzx100": {
    "stockClass": "A",
    "stockCompositeSeconds": 13.857
  },
  "b4rsk": {
    "stockClass": "B",
    "stockCompositeSeconds": 14.611
  },
  "magna": {
    "stockClass": "D",
    "stockCompositeSeconds": 15.583
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
export const STOCK_CLASSES=Object.freeze({A:'A / Performance',B:'B / Sports',C:'C / Club',D:'D / Entry'});
export function stockClassFor(car){return STOCK_CLASS_DATA[car?.ownedBaseCarId||car?.crewBaseCarId||car?.id]?.stockClass||null;}
export function engineeringLabel(car){const d=STOCK_CLASS_DATA[car?.ownedBaseCarId||car?.crewBaseCarId||car?.id];return d?'FACTORY '+d.stockClass+' // POTENTIAL '+d.tuningPotential.toUpperCase():'EXCLUSIVE';}
