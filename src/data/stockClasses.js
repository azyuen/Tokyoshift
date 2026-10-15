// Fixed model classes from seeded 120 Hz Vehicle simulations; see docs/engineering.
export const STOCK_CLASS_DATA = {
  "gdb": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.179
  },
  "gf8": {
    "stockClass": "A",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.016
  },
  "s15": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.106
  },
  "starion": {
    "stockClass": "C",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.43
  },
  "fto": {
    "stockClass": "C",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 14.992
  },
  "mx5": {
    "stockClass": "D",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.787
  },
  "sa22c": {
    "stockClass": "D",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.694
  },
  "mx6": {
    "stockClass": "C",
    "tuningPotential": "High",
    "stockCompositeSeconds": 15.031
  },
  "prelude": {
    "stockClass": "C",
    "tuningPotential": "High",
    "stockCompositeSeconds": 15.046
  },
  "sw20": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.197
  },
  "soarer": {
    "stockClass": "B",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 14.699
  },
  "forester": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.675
  },
  "svx": {
    "stockClass": "D",
    "tuningPotential": "High",
    "stockCompositeSeconds": 15.763
  },
  "xt": {
    "stockClass": "D",
    "tuningPotential": "Low",
    "stockCompositeSeconds": 17.443
  },
  "ae86": {
    "stockClass": "D",
    "tuningPotential": "Low",
    "stockCompositeSeconds": 15.53
  },
  "ef": {
    "stockClass": "C",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.281
  },
  "ek9": {
    "stockClass": "C",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.241
  },
  "s2000": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.363
  },
  "fc3s": {
    "stockClass": "D",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.58
  },
  "rx7fd": {
    "stockClass": "A",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 13.703
  },
  "rx8": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.575
  },
  "galant": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.795
  },
  "evo5": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.125
  },
  "evo6": {
    "stockClass": "A",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.077
  },
  "gc8": {
    "stockClass": "A",
    "tuningPotential": "High",
    "stockCompositeSeconds": 13.663
  },
  "r32": {
    "stockClass": "B",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 14.436
  },
  "r34": {
    "stockClass": "B",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 14.558
  },
  "3000gt": {
    "stockClass": "B",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 14.516
  },
  "a60": {
    "stockClass": "D",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.832
  },
  "jza80": {
    "stockClass": "A",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 14.032
  },
  "nsx": {
    "stockClass": "A",
    "tuningPotential": "High",
    "stockCompositeSeconds": 13.471
  },
  "z32": {
    "stockClass": "B",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 14.239
  },
  "z33": {
    "stockClass": "A",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 13.67
  },
  "240z": {
    "stockClass": "C",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.199
  },
  "crx": {
    "stockClass": "C",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.376
  },
  "dc2": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.698
  },
  "eclipse": {
    "stockClass": "C",
    "tuningPotential": "High",
    "stockCompositeSeconds": 15.461
  },
  "familia": {
    "stockClass": "D",
    "tuningPotential": "Moderate",
    "stockCompositeSeconds": 15.639
  },
  "180sx": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.678
  },
  "st205": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.768
  },
  "jzx100": {
    "stockClass": "A",
    "tuningPotential": "Exceptional",
    "stockCompositeSeconds": 13.857
  },
  "b4rsk": {
    "stockClass": "B",
    "tuningPotential": "High",
    "stockCompositeSeconds": 14.611
  },
  "magna": {
    "stockClass": "D",
    "tuningPotential": "High",
    "stockCompositeSeconds": 15.583
  }
};
export const STOCK_CLASSES=Object.freeze({A:'A / Performance',B:'B / Sports',C:'C / Club',D:'D / Entry'});
export function stockClassFor(car){return STOCK_CLASS_DATA[car?.ownedBaseCarId||car?.crewBaseCarId||car?.id]?.stockClass||null;}
export function engineeringLabel(car){const d=STOCK_CLASS_DATA[car?.ownedBaseCarId||car?.crewBaseCarId||car?.id];return d?'FACTORY '+d.stockClass+' // POTENTIAL '+d.tuningPotential.toUpperCase():'EXCLUSIVE';}
