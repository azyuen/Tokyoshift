// Hardware envelopes are gameplay design assumptions, not safe real-world tuning advice.
// Flow: lb/min. BMEP: bar, equivalent four-stroke displacement for rotary load limits.
export const ENGINEERING_VERSION = 1;
export const ENGINE_ENGINEERING = {
  "ej207_gdb": {
    "family": "EJ207",
    "displacementL": 2.0,
    "compression": 8.0,
    "compressorFlowLbMin": 54.0,
    "builtBmepBar": 35.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 3800.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 373,
    "factoryBoostBar": 1.05
  },
  "ej207_gf8": {
    "family": "Subaru EJ207 GF8 Version VI",
    "displacementL": 2.0,
    "compression": 8.0,
    "compressorFlowLbMin": 49.0,
    "builtBmepBar": 32.0,
    "stockBoostMargin": 0.25,
    "onsetRPM": 2000.0,
    "fullBoostRPM": 4000.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 353,
    "factoryBoostBar": 0.8
  },
  "sr20det_s15": {
    "family": "SR20DET S15",
    "displacementL": 2.0,
    "compression": 8.5,
    "compressorFlowLbMin": 54.0,
    "builtBmepBar": 35.0,
    "stockBoostMargin": 0.35,
    "onsetRPM": 1900.0,
    "fullBoostRPM": 4000.0,
    "rotary": false,
    "factoryPowerKW": 184,
    "factoryTorqueNm": 275,
    "factoryBoostBar": 0.8
  },
  "g54b_starion": {
    "family": "G54B Turbo",
    "displacementL": 2.6,
    "compression": 7.0,
    "compressorFlowLbMin": 42.0,
    "builtBmepBar": 25.0,
    "stockBoostMargin": 0.2,
    "onsetRPM": 1700.0,
    "fullBoostRPM": 3500.0,
    "rotary": false,
    "factoryPowerKW": 129,
    "factoryTorqueNm": 313,
    "factoryBoostBar": 0.6
  },
  "6a12_mivec": {
    "family": "6A12 MIVEC",
    "displacementL": 2.0,
    "compression": 10.0,
    "compressorFlowLbMin": 40.0,
    "builtBmepBar": 25.0,
    "stockBoostMargin": 0.28,
    "onsetRPM": 2200.0,
    "fullBoostRPM": 4300.0,
    "rotary": false,
    "factoryPowerKW": 147,
    "factoryTorqueNm": 200,
    "factoryBoostBar": 0
  },
  "bp_nb": {
    "family": "BP 1.8 DOHC",
    "displacementL": 1.8,
    "compression": 9.5,
    "compressorFlowLbMin": 39.0,
    "builtBmepBar": 29.0,
    "stockBoostMargin": 0.35,
    "onsetRPM": 2100.0,
    "fullBoostRPM": 4200.0,
    "rotary": false,
    "factoryPowerKW": 103,
    "factoryTorqueNm": 162,
    "factoryBoostBar": 0
  },
  "12at": {
    "family": "12A Turbo",
    "displacementL": 1.146,
    "compression": 8.5,
    "compressorFlowLbMin": 40.0,
    "builtBmepBar": 25.0,
    "stockBoostMargin": 0.2,
    "onsetRPM": 2100.0,
    "fullBoostRPM": 4200.0,
    "rotary": true,
    "factoryPowerKW": 121,
    "factoryTorqueNm": 226,
    "factoryBoostBar": 0.55
  },
  "klze": {
    "family": "KL-ZE 2.5 V6",
    "displacementL": 2.5,
    "compression": 10.0,
    "compressorFlowLbMin": 45.0,
    "builtBmepBar": 24.0,
    "stockBoostMargin": 0.28,
    "onsetRPM": 1900.0,
    "fullBoostRPM": 3900.0,
    "rotary": false,
    "factoryPowerKW": 147,
    "factoryTorqueNm": 224,
    "factoryBoostBar": 0
  },
  "h22a_types": {
    "family": "H22A Type S",
    "displacementL": 2.2,
    "compression": 11.0,
    "compressorFlowLbMin": 45.0,
    "builtBmepBar": 26.0,
    "stockBoostMargin": 0.23,
    "onsetRPM": 2200.0,
    "fullBoostRPM": 4500.0,
    "rotary": false,
    "factoryPowerKW": 162,
    "factoryTorqueNm": 221,
    "factoryBoostBar": 0
  },
  "3sgte_sw20": {
    "family": "3S-GTE Gen III",
    "displacementL": 2.0,
    "compression": 8.5,
    "compressorFlowLbMin": 54.0,
    "builtBmepBar": 36.0,
    "stockBoostMargin": 0.35,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 3700.0,
    "rotary": false,
    "factoryPowerKW": 180,
    "factoryTorqueNm": 304,
    "factoryBoostBar": 0.85
  },
  "1jzgte_soarer": {
    "family": "1JZ-GTE Twin Turbo",
    "displacementL": 2.5,
    "compression": 8.5,
    "compressorFlowLbMin": 64.0,
    "builtBmepBar": 37.0,
    "stockBoostMargin": 0.4,
    "onsetRPM": 2100.0,
    "fullBoostRPM": 4200.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 363,
    "factoryBoostBar": 0.7
  },
  "ej20_forester": {
    "family": "EJ20 Turbo S/tb",
    "displacementL": 2.0,
    "compression": 8.0,
    "compressorFlowLbMin": 46.0,
    "builtBmepBar": 30.0,
    "stockBoostMargin": 0.2,
    "onsetRPM": 1700.0,
    "fullBoostRPM": 3600.0,
    "rotary": false,
    "factoryPowerKW": 184,
    "factoryTorqueNm": 306,
    "factoryBoostBar": 0.8
  },
  "eg33": {
    "family": "EG33 Flat-Six",
    "displacementL": 3.3,
    "compression": 10.0,
    "compressorFlowLbMin": 49.0,
    "builtBmepBar": 23.0,
    "stockBoostMargin": 0.25,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 3800.0,
    "rotary": false,
    "factoryPowerKW": 169,
    "factoryTorqueNm": 309,
    "factoryBoostBar": 0
  },
  "ea82t": {
    "family": "EA82T",
    "displacementL": 1.8,
    "compression": 7.7,
    "compressorFlowLbMin": 28.0,
    "builtBmepBar": 24.0,
    "stockBoostMargin": 0.15,
    "onsetRPM": 2000.0,
    "fullBoostRPM": 3900.0,
    "rotary": false,
    "factoryPowerKW": 100,
    "factoryTorqueNm": 196,
    "factoryBoostBar": 0.5
  },
  "4age": {
    "family": "Toyota 4A-GE 1.6L DOHC",
    "displacementL": 1.6,
    "compression": 9.4,
    "compressorFlowLbMin": 34.0,
    "builtBmepBar": 28.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 2300.0,
    "fullBoostRPM": 4400.0,
    "rotary": false,
    "factoryPowerKW": 96,
    "factoryTorqueNm": 149,
    "factoryBoostBar": 0
  },
  "b16a": {
    "family": "Honda B16A VTEC",
    "displacementL": 1.6,
    "compression": 10.2,
    "compressorFlowLbMin": 38.0,
    "builtBmepBar": 30.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 2400.0,
    "fullBoostRPM": 4600.0,
    "rotary": false,
    "factoryPowerKW": 118,
    "factoryTorqueNm": 150,
    "factoryBoostBar": 0
  },
  "b16b": {
    "family": "Honda B16B 1.6L VTEC",
    "displacementL": 1.6,
    "compression": 10.8,
    "compressorFlowLbMin": 40.0,
    "builtBmepBar": 31.0,
    "stockBoostMargin": 0.25,
    "onsetRPM": 2500.0,
    "fullBoostRPM": 4700.0,
    "rotary": false,
    "factoryPowerKW": 136,
    "factoryTorqueNm": 160,
    "factoryBoostBar": 0
  },
  "f20c": {
    "family": "Honda F20C 2.0L VTEC",
    "displacementL": 2.0,
    "compression": 11.7,
    "compressorFlowLbMin": 45.0,
    "builtBmepBar": 31.0,
    "stockBoostMargin": 0.23,
    "onsetRPM": 2600.0,
    "fullBoostRPM": 4800.0,
    "rotary": false,
    "factoryPowerKW": 184,
    "factoryTorqueNm": 218,
    "factoryBoostBar": 0
  },
  "13bt": {
    "family": "Mazda 13B-T Rotary Turbo",
    "displacementL": 1.308,
    "compression": 8.5,
    "compressorFlowLbMin": 48.0,
    "builtBmepBar": 29.0,
    "stockBoostMargin": 0.25,
    "onsetRPM": 2100.0,
    "fullBoostRPM": 4000.0,
    "rotary": true,
    "factoryPowerKW": 136,
    "factoryTorqueNm": 245,
    "factoryBoostBar": 0.7
  },
  "13brew": {
    "family": "Mazda 13B-REW Twin Turbo",
    "displacementL": 1.308,
    "compression": 9.0,
    "compressorFlowLbMin": 60.0,
    "builtBmepBar": 33.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 1900.0,
    "fullBoostRPM": 3500.0,
    "rotary": true,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 314,
    "factoryBoostBar": 0.85
  },
  "13b_msp": {
    "family": "Mazda 13B-MSP RENESIS",
    "displacementL": 1.308,
    "compression": 10.0,
    "compressorFlowLbMin": 43.0,
    "builtBmepBar": 25.0,
    "stockBoostMargin": 0.18,
    "onsetRPM": 2700.0,
    "fullBoostRPM": 4900.0,
    "rotary": true,
    "factoryPowerKW": 170,
    "factoryTorqueNm": 211,
    "factoryBoostBar": 0
  },
  "4g63t_galant_vr4": {
    "family": "Mitsubishi 4G63T 2.0L DOHC Turbo // Galant VR-4 Evolution",
    "displacementL": 2.0,
    "compression": 7.8,
    "compressorFlowLbMin": 52.0,
    "builtBmepBar": 34.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 1900.0,
    "fullBoostRPM": 3800.0,
    "rotary": false,
    "factoryPowerKW": 176,
    "factoryTorqueNm": 304,
    "factoryBoostBar": 0.78
  },
  "4g63t_evo5": {
    "family": "Mitsubishi 4G63T Evolution V",
    "displacementL": 2.0,
    "compression": 8.8,
    "compressorFlowLbMin": 60.0,
    "builtBmepBar": 39.0,
    "stockBoostMargin": 0.4,
    "onsetRPM": 1700.0,
    "fullBoostRPM": 3500.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 373,
    "factoryBoostBar": 0.92
  },
  "4g63t_evo6": {
    "family": "Mitsubishi 4G63T Evolution VI",
    "displacementL": 2.0,
    "compression": 8.8,
    "compressorFlowLbMin": 61.0,
    "builtBmepBar": 39.0,
    "stockBoostMargin": 0.4,
    "onsetRPM": 1700.0,
    "fullBoostRPM": 3500.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 373,
    "factoryBoostBar": 0.96
  },
  "ej207_gc8": {
    "family": "Subaru EJ207 2.0L Turbo // Impreza GC8 STI",
    "displacementL": 2.0,
    "compression": 8.0,
    "compressorFlowLbMin": 50.0,
    "builtBmepBar": 33.0,
    "stockBoostMargin": 0.25,
    "onsetRPM": 1900.0,
    "fullBoostRPM": 3800.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 353,
    "factoryBoostBar": 0.8
  },
  "rb26dett": {
    "family": "Nissan RB26DETT 2.6L Twin Turbo",
    "displacementL": 2.6,
    "compression": 8.5,
    "compressorFlowLbMin": 68.0,
    "builtBmepBar": 39.0,
    "stockBoostMargin": 0.45,
    "onsetRPM": 2200.0,
    "fullBoostRPM": 4400.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 353,
    "factoryBoostBar": 0.75
  },
  "rb26dett_r34": {
    "family": "Nissan RB26DETT R34 Twin Turbo",
    "displacementL": 2.6,
    "compression": 8.5,
    "compressorFlowLbMin": 75.0,
    "builtBmepBar": 40.0,
    "stockBoostMargin": 0.45,
    "onsetRPM": 2000.0,
    "fullBoostRPM": 4200.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 392,
    "factoryBoostBar": 0.82
  },
  "6g72tt": {
    "family": "Mitsubishi 6G72 3.0L Twin Turbo V6",
    "displacementL": 3.0,
    "compression": 8.0,
    "compressorFlowLbMin": 67.0,
    "builtBmepBar": 35.0,
    "stockBoostMargin": 0.4,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 3500.0,
    "rotary": false,
    "factoryPowerKW": 235,
    "factoryTorqueNm": 427,
    "factoryBoostBar": 0.75
  },
  "5mge": {
    "family": "Toyota 5M-GE 2.8L Straight-Six",
    "displacementL": 2.8,
    "compression": 8.8,
    "compressorFlowLbMin": 40.0,
    "builtBmepBar": 24.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 2000.0,
    "fullBoostRPM": 4000.0,
    "rotary": false,
    "factoryPowerKW": 118,
    "factoryTorqueNm": 221,
    "factoryBoostBar": 0
  },
  "2jzgte": {
    "family": "Toyota 2JZ-GTE 3.0L Twin Turbo",
    "displacementL": 3.0,
    "compression": 8.5,
    "compressorFlowLbMin": 90.0,
    "builtBmepBar": 42.0,
    "stockBoostMargin": 0.55,
    "onsetRPM": 1700.0,
    "fullBoostRPM": 3500.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 435,
    "factoryBoostBar": 0.8
  },
  "c30a": {
    "family": "Honda C30A 3.0L V6 VTEC",
    "displacementL": 3.0,
    "compression": 10.2,
    "compressorFlowLbMin": 52.0,
    "builtBmepBar": 29.0,
    "stockBoostMargin": 0.28,
    "onsetRPM": 2400.0,
    "fullBoostRPM": 4500.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 294,
    "factoryBoostBar": 0
  },
  "vg30dett": {
    "family": "VG30DETT",
    "displacementL": 3.0,
    "compression": 8.5,
    "compressorFlowLbMin": 66.0,
    "builtBmepBar": 35.0,
    "stockBoostMargin": 0.4,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 3700.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 388,
    "factoryBoostBar": 0.7
  },
  "vq35de": {
    "family": "VQ35DE",
    "displacementL": 3.5,
    "compression": 10.3,
    "compressorFlowLbMin": 53.0,
    "builtBmepBar": 27.0,
    "stockBoostMargin": 0.25,
    "onsetRPM": 2100.0,
    "fullBoostRPM": 4100.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 363,
    "factoryBoostBar": 0
  },
  "l24": {
    "family": "L24",
    "displacementL": 2.4,
    "compression": 9.0,
    "compressorFlowLbMin": 38.0,
    "builtBmepBar": 25.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 2000.0,
    "fullBoostRPM": 3900.0,
    "rotary": false,
    "factoryPowerKW": 112,
    "factoryTorqueNm": 198,
    "factoryBoostBar": 0
  },
  "b16a_ef8": {
    "family": "B16A",
    "displacementL": 1.6,
    "compression": 10.2,
    "compressorFlowLbMin": 38.0,
    "builtBmepBar": 30.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 2400.0,
    "fullBoostRPM": 4600.0,
    "rotary": false,
    "factoryPowerKW": 118,
    "factoryTorqueNm": 152,
    "factoryBoostBar": 0
  },
  "b18c": {
    "family": "B18C",
    "displacementL": 1.8,
    "compression": 11.1,
    "compressorFlowLbMin": 44.0,
    "builtBmepBar": 31.0,
    "stockBoostMargin": 0.25,
    "onsetRPM": 2500.0,
    "fullBoostRPM": 4600.0,
    "rotary": false,
    "factoryPowerKW": 147,
    "factoryTorqueNm": 181,
    "factoryBoostBar": 0
  },
  "4g63t_gsx": {
    "family": "4G63T",
    "displacementL": 2.0,
    "compression": 8.5,
    "compressorFlowLbMin": 54.0,
    "builtBmepBar": 35.0,
    "stockBoostMargin": 0.35,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 3600.0,
    "rotary": false,
    "factoryPowerKW": 157,
    "factoryTorqueNm": 290,
    "factoryBoostBar": 0.75
  },
  "bpt": {
    "family": "BPT",
    "displacementL": 1.8,
    "compression": 8.2,
    "compressorFlowLbMin": 44.0,
    "builtBmepBar": 32.0,
    "stockBoostMargin": 0.25,
    "onsetRPM": 1900.0,
    "fullBoostRPM": 3900.0,
    "rotary": false,
    "factoryPowerKW": 136,
    "factoryTorqueNm": 235,
    "factoryBoostBar": 0.65
  },
  "sr20det": {
    "family": "SR20DET",
    "displacementL": 2.0,
    "compression": 8.5,
    "compressorFlowLbMin": 52.0,
    "builtBmepBar": 34.0,
    "stockBoostMargin": 0.35,
    "onsetRPM": 2000.0,
    "fullBoostRPM": 4100.0,
    "rotary": false,
    "factoryPowerKW": 151,
    "factoryTorqueNm": 274,
    "factoryBoostBar": 0.7
  },
  "3sgte": {
    "family": "3S-GTE",
    "displacementL": 2.0,
    "compression": 8.5,
    "compressorFlowLbMin": 55.0,
    "builtBmepBar": 36.0,
    "stockBoostMargin": 0.35,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 3700.0,
    "rotary": false,
    "factoryPowerKW": 188,
    "factoryTorqueNm": 304,
    "factoryBoostBar": 0.9
  },
  "1jzgte": {
    "family": "1JZ-GTE VVT-i",
    "displacementL": 2.5,
    "compression": 9.0,
    "compressorFlowLbMin": 65.0,
    "builtBmepBar": 37.0,
    "stockBoostMargin": 0.4,
    "onsetRPM": 1700.0,
    "fullBoostRPM": 3400.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 378,
    "factoryBoostBar": 0.75
  },
  "ej208": {
    "family": "EJ208",
    "displacementL": 2.0,
    "compression": 8.5,
    "compressorFlowLbMin": 49.0,
    "builtBmepBar": 31.0,
    "stockBoostMargin": 0.22,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 4000.0,
    "rotary": false,
    "factoryPowerKW": 206,
    "factoryTorqueNm": 343,
    "factoryBoostBar": 0.8
  },
  "6g72_magna": {
    "family": "6G72 3.0 V6",
    "displacementL": 3.0,
    "compression": 9.0,
    "compressorFlowLbMin": 47.0,
    "builtBmepBar": 25.0,
    "stockBoostMargin": 0.3,
    "onsetRPM": 1800.0,
    "fullBoostRPM": 3800.0,
    "rotary": false,
    "factoryPowerKW": 140,
    "factoryTorqueNm": 255,
    "factoryBoostBar": 0
  }
};
export const REGULAR_CAR_IDS = Object.freeze(["gdb", "gf8", "s15", "starion", "fto", "mx5", "sa22c", "mx6", "prelude", "sw20", "soarer", "forester", "svx", "xt", "ae86", "ef", "ek9", "s2000", "fc3s", "rx7fd", "rx8", "galant", "evo5", "evo6", "gc8", "r32", "r34", "3000gt", "a60", "jza80", "nsx", "z32", "z33", "240z", "crx", "dc2", "eclipse", "familia", "180sx", "st205", "jzx100", "b4rsk", "magna"]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function normaliseFactoryCurve(engine,p) {
 const source=engine.torqueCurve,peak=Math.max(...source.map(x=>x[1]));
 const points=new Set(source.map(x=>x[0]));
 for(let rpm=engine.idleRPM;rpm<=engine.limiterRPM;rpm+=50)points.add(rpm);
 const at=rpm=>{for(let i=1;i<source.length;i++)if(rpm<=source[i][0]){const [r0,t0]=source[i-1],[r1,t1]=source[i];return t0+(t1-t0)*clamp((rpm-r0)/(r1-r0),0,1);}return source.at(-1)[1];};
 const scale=p.factoryTorqueNm/peak;
 const power=Math.max(...[...points].filter(r=>r<=engine.redlineRPM).map(r=>at(r)*scale*r*Math.PI/30000));
 const gain=Math.max(1,p.factoryPowerKW/power);
 engine.torqueCurve=[...points].sort((a,b)=>a-b).map(rpm=>[rpm,Math.min(p.factoryTorqueNm,at(rpm)*scale*gain,p.factoryPowerKW*30000/(Math.PI*rpm))]);
 engine.referenceBoostBar=p.factoryBoostBar;
}
export function applyEngineeringTuning(car,engine,tuning,state) {
 const p=ENGINE_ENGINEERING[car.engine];if(!p)return null;
 const n=tuning.engine,ecu=tuning.ecu,turbo=tuning.turbo,cooling=tuning.intercooler;
 const ex=state.exhaustNosTuning||{};
 const exhaust=clamp(Number(ex.exhaust??state.tuning?.exhaust??state.engineTuning?.exhaust??0),0,3);
 const headers=clamp(Number(ex.headers||0),0,3),muffler=clamp(Number(ex.muffler||0),0,3);
 const breathing=1+(.025*n+.012*tuning.intake+.009*ecu+.009*headers+.012*exhaust+.004*muffler)*(p.rotary?1.1:1);
 engine.torqueCurve=engine.torqueCurve.map(([rpm,t])=>[rpm,t*breathing]);
 const revGain=[0,75,175,300][n]+ecu*25;engine.redlineRPM+=revGain;engine.limiterRPM+=revGain;
 car.engineRedlineRPM=engine.redlineRPM;car.engineLimiterRPM=engine.limiterRPM;
 const base=p.factoryBoostBar,hasBoost=base>0||turbo>0;
 const requested=base+(base>0?[0,.28,.75,1.55][turbo]:[0,.35,.75,1.30][turbo])+ecu*.045;
 const internal=base+p.stockBoostMargin+[0,.18,.65,1.2][n];
 const fuel=base+(base>0?.18:.30)+ecu*.48,thermal=base+(base>0?.20:.30)+cooling*.43;
 const limit=Math.min(internal,fuel,thermal);
 car.maximumBoost=hasBoost?Math.min(requested,limit):0;
 car.boostOnsetRPM=p.onsetRPM+turbo*160;
 car.boostRampRPM=Math.max(1200,p.fullBoostRPM-p.onsetRPM+turbo*190);
 car.turboSize=hasBoost?Math.max(car.turboSize||.25,[0,.36,.55,.78][turbo]):0;
 car.turboSpoolRate=hasBoost?(car.turboSpoolRate||1.8)*(1+.025*tuning.intake+.02*cooling)*[1,1.08,.98,.83][turbo]:0;
 car.vehicleMassKg+=[0,2,4,7][n]+(base===0&&turbo>0?18:0);
 if(hasBoost){
  const displacement=p.displacementL*(p.rotary?2:1);
  const torqueCapacity=p.builtBmepBar*100000*displacement/1000/(4*Math.PI);
  const maxPower=p.compressorFlowLbMin*7.1;
  engine.engineering={thermalEfficiency:.78+cooling*.045,
    powerHeadroom:Math.max(8,maxPower*(.28+.24*turbo)-p.factoryPowerKW)*(.78+.22*exhaust/3),
    torqueHeadroom:Math.max(20,torqueCapacity*(.56+.44*n/3)-p.factoryTorqueNm)};
 }
 car.engineering={family:p.family,requestedBoost:hasBoost?requested:0,availableBoost:car.maximumBoost,
   supportedBoost:hasBoost?limit:0,
   limitingHardware:hasBoost&&requested>limit?(limit===internal?'engine internals':limit===fuel?'fuel / ECU':'charge cooling'):'none'};
 return {car,engine,tuning,mechanicalScale:breathing,boostOutputScale:1};
}
