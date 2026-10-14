// Ref2 torque curves are game calibrations matched to the requested rated power.
// R516 curves are gameplay approximations, not measured dyno traces.
export const engines = {
  "ej207_gdb": {"id": "ej207_gdb", "name": "EJ207", "idleRPM": 800, "redlineRPM": 8000, "limiterRPM": 8200, "inertia": 0.19, "referenceBoostBar": 1.05, "offBoostTorqueFraction": 0.54, "torqueCurve": [[1000, 115], [2000, 195], [3000, 300], [4000, 373], [5000, 360], [6000, 320], [6400, 307.36], [7000, 275], [8000, 225], [8200, 200]]},
  "sr20det_s15": {"id": "sr20det_s15", "name": "SR20DET S15", "idleRPM": 800, "redlineRPM": 7500, "limiterRPM": 7700, "inertia": 0.19, "referenceBoostBar": 0.8, "offBoostTorqueFraction": 0.54, "torqueCurve": [[1000, 100], [2000, 170], [3000, 245], [4800, 275], [5500, 273], [6400, 274.53], [7000, 240], [7500, 210], [7700, 190]]},
  "g54b_starion": {"id": "g54b_starion", "name": "G54B Turbo", "idleRPM": 800, "redlineRPM": 6000, "limiterRPM": 6200, "inertia": 0.29, "referenceBoostBar": 0.6, "offBoostTorqueFraction": 0.54, "torqueCurve": [[1000, 130], [2000, 230], [3000, 313], [3500, 310], [4000, 295], [4500, 267], [5000, 246.37], [5500, 220], [6000, 190], [6200, 170]]},
  "6a12_mivec": {"id": "6a12_mivec", "name": "6A12 MIVEC", "idleRPM": 800, "redlineRPM": 8000, "limiterRPM": 8200, "inertia": 0.17, "referenceBoostBar": 0, "offBoostTorqueFraction": 1, "torqueCurve": [[1000, 90], [2000, 125], [3000, 155], [4500, 175], [5500, 186], [6000, 200], [6800, 194], [7500, 187.16], [8000, 165], [8200, 150]]},
  "bp_nb": {"id": "bp_nb", "name": "BP 1.8 DOHC", "idleRPM": 800, "redlineRPM": 7000, "limiterRPM": 7200, "inertia": 0.16, "referenceBoostBar": 0, "offBoostTorqueFraction": 1, "torqueCurve": [[1000, 70], [2000, 100], [3000, 130], [4000, 150], [4500, 162], [5500, 158], [6500, 151.31], [7000, 132], [7200, 120]]},
  "12at": {"id": "12at", "name": "12A Turbo", "idleRPM": 900, "redlineRPM": 7000, "limiterRPM": 7200, "inertia": 0.13, "referenceBoostBar": 0.55, "offBoostTorqueFraction": 0.54, "torqueCurve": [[1000, 75], [2000, 105], [3000, 160], [4000, 226], [4500, 220], [5500, 205], [6500, 177.76], [7000, 155], [7200, 140]]},
  "klze": {"id": "klze", "name": "KL-ZE 2.5 V6", "idleRPM": 800, "redlineRPM": 7000, "limiterRPM": 7200, "inertia": 0.21, "referenceBoostBar": 0, "offBoostTorqueFraction": 1, "torqueCurve": [[1000, 115], [2000, 150], [3000, 185], [4000, 205], [4800, 224], [5500, 222], [6500, 215.96], [7000, 180], [7200, 165]]},
  "h22a_types": {"id": "h22a_types", "name": "H22A Type S", "idleRPM": 800, "redlineRPM": 7800, "limiterRPM": 8000, "inertia": 0.19, "referenceBoostBar": 0, "offBoostTorqueFraction": 1, "torqueCurve": [[1000, 105], [2000, 140], [3000, 165], [4500, 183], [5200, 195], [6500, 221], [7200, 214.86], [7800, 185], [8000, 170]]},
  "3sgte_sw20": {"id": "3sgte_sw20", "name": "3S-GTE Gen III", "idleRPM": 800, "redlineRPM": 7250, "limiterRPM": 7450, "inertia": 0.2, "referenceBoostBar": 0.85, "offBoostTorqueFraction": 0.54, "torqueCurve": [[1000, 110], [2000, 175], [3000, 260], [4000, 304], [5000, 298], [6000, 286.47], [6500, 260], [7250, 220], [7450, 200]]},
  "1jzgte_soarer": {"id": "1jzgte_soarer", "name": "1JZ-GTE Twin Turbo", "idleRPM": 800, "redlineRPM": 7000, "limiterRPM": 7200, "inertia": 0.27, "referenceBoostBar": 0.7, "offBoostTorqueFraction": 0.54, "torqueCurve": [[1000, 130], [2000, 200], [3000, 300], [4800, 363], [5500, 350], [6200, 317.28], [7000, 265], [7200, 240]]},
  "ej20_forester": {"id": "ej20_forester", "name": "EJ20 Turbo S/tb", "idleRPM": 800, "redlineRPM": 7000, "limiterRPM": 7200, "inertia": 0.23, "referenceBoostBar": 0.8, "offBoostTorqueFraction": 0.54, "torqueCurve": [[1000, 110], [2000, 190], [3000, 275], [4000, 306], [5000, 300], [5500, 291], [6250, 281.12], [7000, 230], [7200, 205]]},
  "eg33": {"id": "eg33", "name": "EG33 Flat-Six", "idleRPM": 800, "redlineRPM": 7000, "limiterRPM": 7200, "inertia": 0.27, "referenceBoostBar": 0, "offBoostTorqueFraction": 1, "torqueCurve": [[1000, 145], [2000, 205], [3000, 255], [4000, 290], [4800, 309], [5200, 305], [5600, 288.17], [6200, 250], [7000, 200], [7200, 180]]},
  "ea82t": {"id": "ea82t", "name": "EA82T", "idleRPM": 800, "redlineRPM": 6500, "limiterRPM": 6700, "inertia": 0.21, "referenceBoostBar": 0.5, "offBoostTorqueFraction": 0.54, "torqueCurve": [[1000, 80], [2000, 130], [2800, 170], [3600, 196], [4500, 190], [5000, 184], [5600, 170.52], [6500, 140], [6700, 125]]},
  "6g72_magna": {"id": "6g72_magna", "name": "6G72 3.0 V6", "idleRPM": 800, "redlineRPM": 6500, "limiterRPM": 6700, "inertia": 0.28, "referenceBoostBar": 0, "offBoostTorqueFraction": 1, "torqueCurve": [[1000, 120], [2000, 170], [3000, 210], [4000, 243], [4500, 255], [5000, 250], [5500, 243.07], [6000, 215], [6500, 180], [6700, 160]]},
  'vg30dett': {
  "id": "vg30dett",
  "name": "VG30DETT",
  "idleRPM": 850,
  "redlineRPM": 7000,
  "limiterRPM": 7200,
  "inertia": 0.25,
  "referenceBoostBar": 0.7,
  "offBoostTorqueFraction": 0.54,
  "torqueCurve": [
    [
      1000,
      155
    ],
    [
      2000,
      250
    ],
    [
      3000,
      350
    ],
    [
      3600,
      388
    ],
    [
      4500,
      380
    ],
    [
      5500,
      350
    ],
    [
      6400,
      307.36
    ],
    [
      7000,
      260
    ],
    [
      7200,
      240
    ]
  ]
},
  'vq35de': {
  "id": "vq35de",
  "name": "VQ35DE",
  "idleRPM": 850,
  "redlineRPM": 6600,
  "limiterRPM": 6800,
  "inertia": 0.25,
  "referenceBoostBar": 0,
  "offBoostTorqueFraction": 1,
  "torqueCurve": [
    [
      1000,
      200
    ],
    [
      2000,
      280
    ],
    [
      3000,
      330
    ],
    [
      4000,
      350
    ],
    [
      4800,
      363
    ],
    [
      5600,
      350
    ],
    [
      6200,
      317.28
    ],
    [
      6600,
      285
    ],
    [
      6800,
      260
    ]
  ]
},
  'l24': {
  "id": "l24",
  "name": "L24",
  "idleRPM": 850,
  "redlineRPM": 6500,
  "limiterRPM": 6700,
  "inertia": 0.25,
  "referenceBoostBar": 0,
  "offBoostTorqueFraction": 1,
  "torqueCurve": [
    [
      1000,
      95
    ],
    [
      2000,
      135
    ],
    [
      3000,
      170
    ],
    [
      4000,
      190
    ],
    [
      4400,
      198
    ],
    [
      5000,
      194
    ],
    [
      6000,
      178.25
    ],
    [
      6500,
      155
    ],
    [
      6700,
      140
    ]
  ]
},
  'b16a_ef8': {
  "id": "b16a_ef8",
  "name": "B16A",
  "idleRPM": 850,
  "redlineRPM": 8000,
  "limiterRPM": 8200,
  "inertia": 0.16,
  "referenceBoostBar": 0,
  "offBoostTorqueFraction": 1,
  "torqueCurve": [
    [
      1000,
      75
    ],
    [
      2000,
      95
    ],
    [
      3000,
      110
    ],
    [
      4000,
      123
    ],
    [
      5500,
      140
    ],
    [
      6500,
      152
    ],
    [
      7600,
      148.26
    ],
    [
      8000,
      136
    ],
    [
      8200,
      125
    ]
  ]
},
  'b18c': {
  "id": "b18c",
  "name": "B18C",
  "idleRPM": 850,
  "redlineRPM": 8400,
  "limiterRPM": 8600,
  "inertia": 0.16,
  "referenceBoostBar": 0,
  "offBoostTorqueFraction": 1,
  "torqueCurve": [
    [
      1000,
      95
    ],
    [
      2000,
      118
    ],
    [
      3000,
      138
    ],
    [
      4000,
      153
    ],
    [
      5500,
      169
    ],
    [
      6200,
      181
    ],
    [
      7200,
      180
    ],
    [
      8000,
      175.46
    ],
    [
      8400,
      157
    ],
    [
      8600,
      143
    ]
  ]
},
  '4g63t_gsx': {
  "id": "4g63t_gsx",
  "name": "4G63T",
  "idleRPM": 850,
  "redlineRPM": 7000,
  "limiterRPM": 7200,
  "inertia": 0.2,
  "referenceBoostBar": 0.75,
  "offBoostTorqueFraction": 0.54,
  "torqueCurve": [
    [
      1000,
      120
    ],
    [
      2000,
      210
    ],
    [
      3000,
      280
    ],
    [
      3500,
      290
    ],
    [
      4500,
      280
    ],
    [
      5500,
      270
    ],
    [
      6000,
      249.87
    ],
    [
      7000,
      205
    ],
    [
      7200,
      185
    ]
  ]
},
  'bpt': {
  "id": "bpt",
  "name": "BPT",
  "idleRPM": 850,
  "redlineRPM": 7000,
  "limiterRPM": 7200,
  "inertia": 0.2,
  "referenceBoostBar": 0.65,
  "offBoostTorqueFraction": 0.54,
  "torqueCurve": [
    [
      1000,
      95
    ],
    [
      2000,
      150
    ],
    [
      3000,
      215
    ],
    [
      4500,
      235
    ],
    [
      5500,
      228
    ],
    [
      6000,
      216.44
    ],
    [
      7000,
      172
    ],
    [
      7200,
      155
    ]
  ]
},
  'sr20det': {
  "id": "sr20det",
  "name": "SR20DET",
  "idleRPM": 850,
  "redlineRPM": 7500,
  "limiterRPM": 7700,
  "inertia": 0.2,
  "referenceBoostBar": 0.7,
  "offBoostTorqueFraction": 0.54,
  "torqueCurve": [
    [
      1000,
      100
    ],
    [
      2000,
      170
    ],
    [
      3000,
      250
    ],
    [
      4000,
      274
    ],
    [
      5000,
      265
    ],
    [
      6000,
      240.32
    ],
    [
      6500,
      218
    ],
    [
      7500,
      170
    ],
    [
      7700,
      155
    ]
  ]
},
  '3sgte': {
  "id": "3sgte",
  "name": "3S-GTE",
  "idleRPM": 850,
  "redlineRPM": 7200,
  "limiterRPM": 7400,
  "inertia": 0.2,
  "referenceBoostBar": 0.9,
  "offBoostTorqueFraction": 0.54,
  "torqueCurve": [
    [
      1000,
      120
    ],
    [
      2000,
      185
    ],
    [
      3000,
      270
    ],
    [
      4000,
      304
    ],
    [
      5000,
      302
    ],
    [
      6000,
      299.2
    ],
    [
      6500,
      270
    ],
    [
      7200,
      220
    ],
    [
      7400,
      200
    ]
  ]
},
  '1jzgte': {
  "id": "1jzgte",
  "name": "1JZ-GTE VVT-i",
  "idleRPM": 850,
  "redlineRPM": 7000,
  "limiterRPM": 7200,
  "inertia": 0.25,
  "referenceBoostBar": 0.75,
  "offBoostTorqueFraction": 0.54,
  "torqueCurve": [
    [
      1000,
      150
    ],
    [
      2000,
      285
    ],
    [
      2400,
      378
    ],
    [
      3500,
      375
    ],
    [
      4500,
      372
    ],
    [
      5500,
      352
    ],
    [
      6200,
      317.28
    ],
    [
      7000,
      265
    ],
    [
      7200,
      240
    ]
  ]
},
  'ej208': {
  "id": "ej208",
  "name": "EJ208",
  "idleRPM": 850,
  "redlineRPM": 7500,
  "limiterRPM": 7700,
  "inertia": 0.2,
  "referenceBoostBar": 0.8,
  "offBoostTorqueFraction": 0.54,
  "torqueCurve": [
    [
      1000,
      110
    ],
    [
      2000,
      195
    ],
    [
      3000,
      300
    ],
    [
      4500,
      328
    ],
    [
      5000,
      343
    ],
    [
      5500,
      340
    ],
    [
      6500,
      302.63
    ],
    [
      7500,
      245
    ],
    [
      7700,
      220
    ]
  ]
},
  '5mge': {
    id: '5mge', name: 'Toyota 5M-GE 2.8L Straight-Six', idleRPM: 800,
    redlineRPM: 6500, limiterRPM: 6800, inertia: 0.27,
    referenceBoostBar: 0, offBoostTorqueFraction: 1,
    torqueCurve: [[1000, 135], [2000, 175], [3000, 205], [3600, 221],
      [4500, 217], [5500, 205], [6000, 188], [6500, 170], [6800, 152]],
  },
  d16z6: {
    id: 'd16z6', name: 'Honda D16Z6 1.6L SOHC VTEC', idleRPM: 850,
    redlineRPM: 7200, limiterRPM: 7400, inertia: 0.17,
    referenceBoostBar: 0, offBoostTorqueFraction: 1,
    torqueCurve: [[1000, 70], [2000, 93], [3000, 114], [4000, 132],
      [5200, 144], [6000, 142], [6600, 135], [7200, 119], [7400, 108]],
  },
  '2jzgte': {
    id: '2jzgte', name: 'Toyota 2JZ-GTE 3.0L Twin Turbo', idleRPM: 800,
    redlineRPM: 6800, limiterRPM: 7200, inertia: 0.27,
    referenceBoostBar: 0.80, offBoostTorqueFraction: 0.52,
    torqueCurve: [[1000, 180], [2000, 280], [3000, 390], [3600, 435],
      [4200, 435], [5000, 395], [5600, 352], [6000, 325],
      [6800, 270], [7200, 245]],
  },
  c30a: {
    id: 'c30a', name: 'Honda C30A 3.0L V6 VTEC', idleRPM: 850,
    redlineRPM: 8000, limiterRPM: 8200, inertia: 0.19,
    referenceBoostBar: 0, offBoostTorqueFraction: 1,
    torqueCurve: [[1000, 145], [2000, 195], [3000, 235], [4000, 265],
      [5400, 294], [6500, 285], [7300, 275], [8000, 244], [8200, 230]],
  },
  '6g72tt': {
    id: '6g72tt', name: 'Mitsubishi 6G72 3.0L Twin Turbo V6', idleRPM: 800,
    redlineRPM: 7000, limiterRPM: 7200, inertia: 0.28,
    referenceBoostBar: 0.75, offBoostTorqueFraction: 0.55,
    torqueCurve: [[1000, 180], [2000, 280], [2500, 360], [3500, 420],
      [4500, 427], [5500, 410], [6000, 380], [7000, 315], [7200, 290]],
  },
  rb26dett_r34: {
    id: 'rb26dett_r34', name: 'Nissan RB26DETT R34 Twin Turbo', idleRPM: 850,
    redlineRPM: 8000, limiterRPM: 8200, inertia: 0.24,
    referenceBoostBar: 0.82, offBoostTorqueFraction: 0.53,
    torqueCurve: [[1000, 155], [2000, 230], [3000, 330], [4400, 392],
      [5000, 390], [6000, 360], [6800, 290], [8000, 240], [8200, 215]],
  },
  '4g63t_evo5': {
    id: '4g63t_evo5', name: 'Mitsubishi 4G63T Evolution V', idleRPM: 850,
    redlineRPM: 7500, limiterRPM: 7700, inertia: 0.20,
    referenceBoostBar: 0.92, offBoostTorqueFraction: 0.50,
    torqueCurve: [[1000, 145], [2000, 225], [3000, 345], [3500, 373],
      [4500, 370], [5500, 340], [6500, 300], [7500, 250], [7700, 230]],
  },
  '4g63t_evo6': {
    id: '4g63t_evo6', name: 'Mitsubishi 4G63T Evolution VI', idleRPM: 850,
    redlineRPM: 7500, limiterRPM: 7700, inertia: 0.20,
    referenceBoostBar: 0.96, offBoostTorqueFraction: 0.50,
    torqueCurve: [[1000, 145], [2000, 230], [2800, 330], [3500, 373],
      [4500, 365], [5500, 350], [6500, 310], [7500, 252], [7700, 230]],
  },
  '12a': {
    id: '12a', name: 'Mazda 12A Rotary', idleRPM: 900, redlineRPM: 7000,
    limiterRPM: 7200, inertia: 0.14, referenceBoostBar: 0,
    offBoostTorqueFraction: 1,
    torqueCurve: [[1000, 78], [2000, 105], [3000, 128], [4000, 147],
      [5000, 152], [6000, 145], [7000, 125], [7200, 115]],
  },
  '13brew': {
    id: '13brew', name: 'Mazda 13B-REW Twin Turbo', idleRPM: 850,
    redlineRPM: 8000, limiterRPM: 8200, inertia: 0.15,
    referenceBoostBar: 0.85, offBoostTorqueFraction: 0.54,
    // Late JDM 13B-REW: 314 Nm @ 5,000 rpm, 206 kW @ 6,500 rpm.
    // Replaces an overly top-heavy curve that peaked in power near the limiter.
    // Reference: Mazda RX-7 Spirit R Type A (2002) factory specifications.
    torqueCurve: [[1000, 120], [2000, 175], [3000, 250], [4500, 306],
      [5000, 314], [5500, 311], [6500, 303], [7000, 275],
      [7500, 247], [8000, 218], [8200, 202]],
  },
  '13b_msp': {
    id: '13b_msp', name: 'Mazda 13B-MSP RENESIS', idleRPM: 900,
    redlineRPM: 9000, limiterRPM: 9200, inertia: 0.14,
    referenceBoostBar: 0, offBoostTorqueFraction: 1,
    torqueCurve: [[1000, 100], [2000, 130], [3000, 160], [4000, 190],
      [5500, 211], [7000, 205], [8200, 198], [9000, 178], [9200, 165]],
  },
  'b16a': {
    id: 'b16a', name: 'Honda B16A VTEC', idleRPM: 850,
    redlineRPM: 8000, limiterRPM: 8200, inertia: 0.16,
    referenceBoostBar: 0, offBoostTorqueFraction: 1,
    torqueCurve: [[1000, 78], [2000, 96], [3000, 112], [4000, 124],
      [5500, 139], [6500, 150], [7500, 147], [8000, 137], [8200, 126]],
  },
  'fa24': {
    id: 'fa24', name: 'Toyota FA24 Boxer', idleRPM: 850,
    redlineRPM: 7400, limiterRPM: 7600, inertia: 0.20,
    referenceBoostBar: 0, offBoostTorqueFraction: 1,
    torqueCurve: [[1000, 155], [2000, 200], [3000, 230], [4000, 245],
      [5000, 250], [6000, 242], [7000, 237], [7400, 210], [7600, 196]],
  },
  '4g63t_late': {
    id: '4g63t_late', name: 'Mitsubishi 4G63T Evolution', idleRPM: 850,
    redlineRPM: 7500, limiterRPM: 7700, inertia: 0.20,
    referenceBoostBar: 0.92, offBoostTorqueFraction: 0.5,
    torqueCurve: [[1000, 145], [2000, 220], [3000, 335], [3500, 373],
      [4500, 370], [5500, 345], [6500, 300], [7500, 250], [7700, 230]],
  },
  '4age': {
    id: '4age',
    name: 'Toyota 4A-GE 1.6L DOHC',
    idleRPM: 850,
    redlineRPM: 7600,
    limiterRPM: 7900,
    inertia: 0.17,
    referenceBoostBar: 0,
    offBoostTorqueFraction: 1,
    torqueCurve: [
      [1000, 82],
      [2000, 103],
      [3000, 124],
      [4000, 141],
      [5200, 149],
      [6600, 139],
      [7600, 118],
      [7900, 104],
    ],
  },

  rb26dett: {
    id: 'rb26dett',
    name: 'Nissan RB26DETT 2.6L Twin Turbo',
    idleRPM: 850,
    redlineRPM: 8000,
    limiterRPM: 8200,
    inertia: 0.24,
    referenceBoostBar: 0.75,
    offBoostTorqueFraction: 0.53,
    torqueCurve: [
      [1000, 150],
      [2000, 210],
      [3000, 300],
      [4400, 353],
      [5500, 340],
      [6800, 289],
      [8000, 245],
      [8200, 220],
    ],
  },

  // Dedicated Galant VR-4 Evolution calibration: 176 kW stock and a
  // distinct broad, earlier turbo torque delivery from the Lancer Evo III.
  // Realistic period-inspired approximation, not a shared Evolution map.
  '4g63t_galant_vr4': {
    id: '4g63t_galant_vr4',
    name: 'Mitsubishi 4G63T 2.0L DOHC Turbo // Galant VR-4 Evolution',
    idleRPM: 850,
    redlineRPM: 7000,
    limiterRPM: 7200,
    inertia: 0.23,
    referenceBoostBar: 0.78,
    offBoostTorqueFraction: 0.52,
    torqueCurve: [
      [1000, 118],
      [1800, 178],
      [2600, 254],
      [3500, 304],
      [4500, 298],
      [5200, 291],
      [5800, 288],
      [6000, 280],
      [6300, 263],
      [7000, 215],
      [7200, 197],
    ],
  },

  '4g63t': {
    id: '4g63t',
    name: 'Mitsubishi 4G63T 2.0L Turbo',
    idleRPM: 850,
    redlineRPM: 7500,
    limiterRPM: 7700,
    inertia: 0.20,
    referenceBoostBar: 0.85,
    offBoostTorqueFraction: 0.50,
    torqueCurve: [
      [1000, 125],
      [1800, 180],
      [2500, 270],
      [3000, 309],
      [4500, 309],
      [5500, 305],
      [6250, 304],
      [7500, 245],
      [7700, 225],
    ],
  },

  '13bt': {
    id: '13bt',
    name: 'Mazda 13B-T Rotary Turbo',
    idleRPM: 850,
    redlineRPM: 7000,
    limiterRPM: 7200,
    inertia: 0.15,
    referenceBoostBar: 0.70,
    offBoostTorqueFraction: 0.56,
    torqueCurve: [
      [1000, 105],
      [2000, 145],
      [2800, 205],
      [3500, 245],
      [4500, 238],
      [5500, 224],
      [6500, 200],
      [7000, 185],
      [7200, 170],
    ],
  },

  ej22g: {
    id: 'ej22g',
    name: 'Subaru EJ22G 2.2L Turbo',
    idleRPM: 850,
    redlineRPM: 7000,
    limiterRPM: 7200,
    inertia: 0.21,
    referenceBoostBar: 0.80,
    offBoostTorqueFraction: 0.50,
    torqueCurve: [
      [1000, 145],
      [1800, 220],
      [2500, 320],
      [3200, 363],
      [4500, 355],
      [5500, 340],
      [6000, 328],
      [7000, 275],
      [7200, 255],
    ],
  },

  b16b: {
    id: 'b16b',
    name: 'Honda B16B 1.6L VTEC',
    idleRPM: 850,
    redlineRPM: 8400,
    limiterRPM: 8600,
    inertia: 0.16,
    referenceBoostBar: 0,
    offBoostTorqueFraction: 1,
    torqueCurve: [
      [1000, 82],
      [2000, 100],
      [3000, 112],
      [4000, 124],
      [5500, 142],
      [6500, 154],
      [7500, 160],
      [8200, 158],
      [8400, 151],
      [8600, 142],
    ],
  },

  rb26_mines: {
    id: 'rb26_mines',
    name: "Mine's RB26DETT",
    idleRPM: 900,
    redlineRPM: 8000,
    limiterRPM: 8200,
    inertia: 0.22,
    referenceBoostBar: 1.30,
    offBoostTorqueFraction: 0.45,
    torqueCurve: [
      [1000, 180], [2000, 270], [3000, 420], [4000, 560],
      [5000, 610], [6000, 605], [7000, 585], [7800, 540],
      [8000, 515], [8200, 485],
    ],
  },

  '2jz_topsecret': {
    id: '2jz_topsecret',
    name: 'Top Secret 2JZ-GTE',
    idleRPM: 900,
    redlineRPM: 8000,
    limiterRPM: 8200,
    inertia: 0.24,
    referenceBoostBar: 1.45,
    offBoostTorqueFraction: 0.38,
    torqueCurve: [
      [1000, 200], [2000, 300], [3000, 470], [4000, 680],
      [5000, 790], [5800, 800], [6500, 790], [7500, 750],
      [8000, 700], [8200, 665],
    ],
  },

  vr38_lb: {
    id: 'vr38_lb',
    name: 'Liberty Walk VR38DETT',
    idleRPM: 850,
    redlineRPM: 7200,
    limiterRPM: 7400,
    inertia: 0.25,
    referenceBoostBar: 1.20,
    offBoostTorqueFraction: 0.48,
    torqueCurve: [
      [1000, 280], [1800, 430], [2500, 650], [3200, 820],
      [4000, 900], [5000, 895], [6000, 880], [6500, 865],
      [7200, 790], [7400, 750],
    ],
  },

  '13brew_veilside': {
    id: '13brew_veilside',
    name: 'VeilSide 13B-REW',
    idleRPM: 900,
    redlineRPM: 8200,
    limiterRPM: 8400,
    inertia: 0.15,
    referenceBoostBar: 1.00,
    offBoostTorqueFraction: 0.48,
    torqueCurve: [
      [1000, 125], [2000, 180], [3000, 290], [4000, 410],
      [5000, 470], [6000, 480], [7000, 455], [8000, 400],
      [8200, 390], [8400, 375],
    ],
  },

  flat6_rwb: {
    id: 'flat6_rwb',
    name: 'RWB 3.6L Flat-Six',
    idleRPM: 900,
    redlineRPM: 7200,
    limiterRPM: 7400,
    inertia: 0.19,
    referenceBoostBar: 0,
    offBoostTorqueFraction: 1,
    torqueCurve: [
      [1000, 180], [2000, 250], [3000, 330], [4000, 390],
      [5000, 420], [6000, 415], [6800, 410], [7200, 390],
      [7400, 365],
    ],
  },

  r26b_787b: {
    id: 'r26b_787b',
    name: 'Mazda R26B 4-Rotor',
    idleRPM: 1200,
    redlineRPM: 9000,
    limiterRPM: 9200,
    inertia: 0.11,
    referenceBoostBar: 0,
    offBoostTorqueFraction: 1,
    torqueCurve: [
      [1500, 220], [3000, 390], [4500, 500], [6000, 585],
      [6500, 608], [7500, 600], [8500, 580], [9000, 548],
      [9200, 520],
    ],
  },


  f20c: {
    id: 'f20c',
    name: 'Honda F20C 2.0L VTEC',
    idleRPM: 900,
    redlineRPM: 9000,
    limiterRPM: 9200,
    inertia: 0.14,
    referenceBoostBar: 0,
    offBoostTorqueFraction: 1,
    torqueCurve: [
      [1000, 105], [2000, 135], [3000, 155], [4000, 170],
      [5000, 180], [6000, 190], [7000, 207], [7500, 218],
      [8000, 216], [8500, 207], [9000, 190], [9200, 175],
    ],
  },

  f20c_amuse: {
    id: 'f20c_amuse',
    name: 'Amuse F20C Turbo',
    idleRPM: 950,
    redlineRPM: 8500,
    limiterRPM: 8700,
    inertia: 0.14,
    referenceBoostBar: 1.05,
    offBoostTorqueFraction: 0.42,
    torqueCurve: [
      [1000, 120], [2000, 170], [3000, 260], [4000, 370],
      [5000, 445], [6000, 480], [7000, 475], [8000, 466],
      [8500, 430], [8700, 410],
    ],
  },
  b18c_spoon: {
    id: 'b18c_spoon',
    name: 'Spoon B18C 1.8L VTEC',
    idleRPM: 950,
    redlineRPM: 9000,
    limiterRPM: 9200,
    inertia: 0.13,
    referenceBoostBar: 0,
    offBoostTorqueFraction: 1,
    torqueCurve: [
      [1000, 95], [2000, 120], [3000, 145], [4000, 165],
      [5500, 190], [6500, 210], [7500, 220], [8500, 214],
      [9000, 203], [9200, 192],
    ],
  },

  '13brew_amemiya': {
    id: '13brew_amemiya',
    name: 'RE Amemiya 13B-REW',
    idleRPM: 950,
    redlineRPM: 8500,
    limiterRPM: 8700,
    inertia: 0.13,
    referenceBoostBar: 1.30,
    offBoostTorqueFraction: 0.42,
    torqueCurve: [
      [1000, 120], [2000, 180], [3000, 300], [4000, 420],
      [5000, 495], [5500, 500], [6500, 485], [7500, 470],
      [8000, 440], [8500, 410], [8700, 395],
    ],
  },

  '4g63_jun_hyper_lemon': {
    id: '4g63_jun_hyper_lemon',
    name: 'JUN 2.2L 4G63',
    idleRPM: 950,
    redlineRPM: 7800,
    limiterRPM: 8000,
    inertia: 0.18,
    referenceBoostBar: 1.90,
    offBoostTorqueFraction: 0.38,
    torqueCurve: [
      [1000, 170], [2000, 260], [3000, 400], [4000, 540],
      [5000, 620], [5500, 632], [6500, 610], [7200, 561],
      [7800, 520], [8000, 500],
    ],
  },

  c30a_esprit: {
    id: 'c30a_esprit',
    name: 'ESPRIT C30A 3.2L Twin Turbo',
    idleRPM: 1000,
    redlineRPM: 8200,
    limiterRPM: 8400,
    inertia: 0.18,
    referenceBoostBar: 1.60,
    offBoostTorqueFraction: 0.40,
    torqueCurve: [
      [1000, 180], [2000, 280], [3000, 450], [4000, 650],
      [5000, 790], [6000, 850], [7000, 835], [7400, 807],
      [8000, 750], [8200, 720], [8400, 690],
    ],
  },


};
