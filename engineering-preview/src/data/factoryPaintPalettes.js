// Factory-inspired paint choices approved for the Tokyo SHIFT showroom and paint studio.
// Digital hex values are tuned *approximations*, NOT official colour-matching formulae.
// Year, market, trim and two-tone availability still need factory-brochure verification
// for some of the older entries. Do not advertise these as exact OEM RGB values.
// The 1998 TF Magna Sports has four documented finishes; Frontier Green is the
// requested dark-green default for the developer's Magna.
const RAW_FACTORY_PAINTS = Object.freeze({
  "ae86": "White|EDECE4|041;Silver Metallic|ADB2B5|148;Red|B9232E|3E6;Medium Grey|676D72|159;White / Black Panda|EEEAE3|2T7;Red / Black Panda|BC2835|2T6",
  "a60": "Super White|F0EFEA|035;Black|1A1A1D|202;Super Red|B52A2E|3D1;Deep Maroon|66333E|379;Dark Blue Metallic|263E60|8B4;Light Blue Metallic|7D9DB8|894;Blue Two-Tone|496C90|2P3",
  "jza80": "Super White II|EEEDE7|040;Silver Metallic|ACB1B4|199;Black|171819|202;Super Red IV|B4242C|3L2;Deep Teal Metallic|225760|752;Dark Green Mica|164638|6P3;Blue Mica Metallic|263F78|8L5;Super Bright Yellow|E7BD23|576",
  "st205": "Super White|EDEDEB|040;Black|17191B|202;Renaissance Red|BB2A33|3L2;Alpine Silver|ADB4BA|199;Baltic Blue|205361|752;Topaz Metallic|8E9090|1A2",
  "jzx100": "Super White II|EEECE6;White Pearl Mica|DEDED5;Silver Metallic|ADB0B3;Dark Blue Mica|26354A;Blue Mica|426280;Dark Green Mica|263D33;Pearl Two-Tone|C8C4B6",
  "sw20": "Pure White|EEEAE4|040;Astral Black|181919|202;Sunburst Red|C22632|3E5;Goodwood Green|234B40|6M1;Caribbean Blue|245577|8B6",
  "soarer": "Pearl White|E9E6DF|051;Black Onyx|191A1D|202;Silver|ADB2B7|176;Royal Jade Pearl|245950|6M2;Red Mica|8D3040|3K3;Dark Blue Mica|253958|8J5;Super Red IV|B72A35|3L2",
  "r32": "Crystal White|E9E9E4|326;Gun Grey Metallic|5A6065|KH2;Black Pearl|1D2026|732;Jet Silver|ABB0B3|KG1;Spark Silver|A4AAB2|KL0;Red Pearl|912B32|AH3;Dark Blue Pearl|24384E|TH1",
  "r34": "White|ECECE7|QM1;Bayside Blue|235CA6|TV2;Sonic Silver|AEB4B9|KR4;Black Pearl|1B2027|GV1;Active Red|AE2632|AR2;Midnight Purple II|42354D|LV4;Lightning Yellow|E5C332|EV1;Millennium Jade|999E8F|JW0",
  "z32": "Glacier White|EAE8E1;Super Black|1A1A1D;Cherry Red Pearl|92323A;Bright Red|BC2D31;Platinum Silver|ABAEB0;Dark Blue Pearl|273B58;Emerald Green|2E554B",
  "z33": "Glacier Pearl|E5E5DF;Chrome Silver|B5B8BD;Ebony Black|1C1E20;Redline|AA2931;Le Mans Sunset|B56836;Brickyard|693B42;Daytona Blue|25517D;Silverstone|6A7076",
  "240z": "Silver Grey|A8ACAA|901;Universal Blue|4B7391|903;Kilimanjaro White|E7E4D8|904;Monte Carlo Red|B33228|905;Racing Green|315A38|907;New Sight Orange|D76B2C|918;Sunshine Yellow|DCC23A|919;Safari Gold|AC8C49|920",
  "180sx": "White|E9E9E5;Super Black|1A1A1E;Spark Silver Metallic|B3B6B8;Super Red|B62E35;Midnight Purple Pearl|43364E",
  "s15": "Pearl White|E8E6DE;Sparkling Silver|B4B7BB;Super Black|1B1B20;Super Red|B82932;Brilliant Blue|2466A3;Lightning Yellow|E5C330",
  "ef": "Polar White|E8E8E1|NH-512Z;Flint Black|292C30|NH-526M;Rio Red|B52C32|R-63;Phoenix Red|C23435|R-51;Superior Blue|8199B1|B-47M;Asturias Grey|82868A|NH-502M",
  "ek9": "Championship White|EDE9DC|NH-0;Vogue Silver|ADB2B4|NH-583M;Starlight Black Pearl|24242A|NH-592P;Sunlight Yellow|EDC93D|Y-56",
  "s2000": "Grand Prix White|EEEAE3|NH-565;Berlina Black|1C1B1E|NH-547;New Formula Red|B81D30|R-510;Silverstone Metallic|A9ADB3|NH-630M;Monte Carlo Blue|254878|B-66P;Indy Yellow Pearl|E4C031|Y-52P",
  "nsx": "Formula Red|BC2730|R-77;Berlina Black|202024|NH-547;Grand Prix White|EAE8E1|NH-565;Sebring Silver|AAB1B6|NH-552M;Brooklands Green|245044|G-70P;Monte Carlo Blue|254777|B-66P;Indy Yellow|E9C22C|Y-52P",
  "crx": "Polar White|EAE9E3|NH-512Z;Flint Black|26282E|NH-526M;Rio Red|B52B32|R-63;Celestial Blue|325B87|B-53P;Barbados Yellow|DEC44A|Y-49;Torino Red Pearl|8F2A39|R-72P",
  "dc2": "Championship White|EAE8DF|NH-0;Granada Black|25242B|NH-503P;Flamenco Black|202229|NH-592P;Nighthawk Black|19232C|B-92P;Milano Red|B52A32|R-81;Vogue Silver|A9B0B2|NH-583M;Phoenix Yellow|E7C139|Y-56",
  "prelude": "Premium White Pearl|E7E5DF|NH-624P;Flamenco Black|25232A|NH-592P;San Marino Red|B62934|R-94;Milano Red|B82930|R-81;Nordic Mist|A4AEB6|B-83M;Eucalyptus Green|315345|G-83P;Crystal Blue|5485A5|B-91M",
  "fc3s": "Crystal White|EAE7E2|UC;Brilliant Black|1B1C20|PZ;Blaze Red|B52B2F|SQ;Winning Silver|ACB0B5|1F;Shadow Silver|71777E|3G;Harbor Blue|42678B|5D;Brave Blue|294668|5N",
  "rx7fd": "Crystal White|E9E9E6|UC;Silver Stone|B3B7BD|3L;Vintage Red|AE2534|NU;Brilliant Black|1C1E21|PX;Montego Blue|235868|M8;Competition Yellow|DEC333|J9;Deep Purple Pearl|403248|E9",
  "rx8": "Brilliant Black|1B1D20|A3F;Sunlight Silver|B7BBBE|22V;Titanium Grey|787E84|29Y;Velocity Red|A22536|27A;Winning Blue|246995|27B;Lightning Yellow|EBC840|A4J;Nordic Green|285743|27C",
  "familia": "White|EAE9E2;Black|202124;Red|AA3032;Silver Metallic|A5ABB1;Dark Blue|314D6D",
  "mx5": "White|EDECE5|PT;Brilliant Black|1E2023|A3F;Classic Red|BD2E34|SU;Highlight Silver|ABB3B9|18G;Emerald Mica|2C5444|18J;Twilight Blue|2E486B|12K;Sapphire Blue|24548B|20P",
  "sa22c": "White|EBE6DD;Black|222427;Classic Red|AD2E2D;Silver Metallic|ACB2B8;Dark Blue Metallic|304966;Champagne Metallic|BCAD87",
  "mx6": "White|EAE8E1;Black|222427;Red|AD3037;Silver Metallic|AEB2B6;Deep Blue|29476C;Green Metallic|375849",
  "galant": "Sophia White|E9E9E3;Grace Silver|AFB2B5;Chateau Silver|898F94;Super Cosmic Blue|26415F;Grace/Chateau Two-Tone|AAABAD;Lamp Black Two-Tone|24272B;Monaco Red Two-Tone|92333A",
  "evo5": "Scotia White|EAE9E1|W83;Satellite Silver|ABB0B6|A69;Pyrenees Black|24262E|X08;Ijsselmeer Blue|63819A|T73;Palma Red|B22D37|P85;Dandelion Yellow|EAC837|Y77",
  "evo6": "Scotia White|E8E8E3|W83;Satellite Silver|ABB0B7|A69;Pyrenees Black|25252C|X08;Reims Blue|293E92|T36;Icelle Blue|63839A|T73",
  "3000gt": "Zurich White Pearl|E6E4DF|W29;Sable Black Pearl|22232A;Caracas Red|B32730|R71;Sorrento Red|823443|P03;Danube Blue|2E536F|B34;Panama Green|265D4E;Martinique Yellow|DFBE35",
  "eclipse": "White|ECEAE4;Black|222326;Rally Red|B82C36;Silver Metallic|AAB0B6;Dark Green Pearl|33554C;Blue Pearl|335777",
  "starion": "Sophia White|EAE6DF;Selbia Black|202225;Mexican Red|B32C31;Grace Silver|ABB0B5;Palermo Grey|666B72",
  "fto": "Scotia White|EAE9E3|W83;Pyrenees Black|22252B|X08;Passion Red|B92732|R71;Moonlight Blue|253B59|T88;Imperial Red|823541|R39;Steel Silver|ADB1B6|A34;Timber Green|2B5445|G13",
  "gc8": "Feather White|E9E8E3|230;Sonic Blue Mica|2155A2|74F;Light Silver|B2B5B9|406;Black Mica|22242B|47A;Active Red|B82E34|559;Chase Yellow|E5C23D|518;Cool Grey|767C84|86F",
  "b4rsk": "Premium Silver|B6B5B7;Black Topaz Mica|24262E;Nautic Blue Mica|2B4B67;Woodland Green Mica|365349;Mist Green Opal|899F96;Copper Orange Mica|AF7351",
  "gf8": "Feather White|EAEAE6|230;Sonic Blue Mica|2355A3|74F;Light Silver|B4B8BD|406;Black Mica|22242A|47A;Active Red|AD2934|559;Cool Grey|82888E|86F",
  "gdb": "Pure White|EAEAE5|51E;WR Blue Mica|265AA7|02C;Premium Silver|B3B9BE|01G;Blue Black Mica|262E3C|08V;Red Mica|963442|94H;Sports Yellow|E3BC31|797",
  "forester": "Pure White|E9E8E3;Black Mica|22262D;Arctic Silver Metallic|B8BCC0;Cool Grey Metallic|787D82;Royal Blue / Slate|284566;Arctic Silver / Slate|ADB1B6",
  "svx": "Pearl White|E4E1DD;Liquid Silver|ACB1B7;Ebony Mica|25262B;Claret Pearl|75414D;Dark Teal|36535B;Barcelona Red|A0333A;Emerald Pearl|2E594D",
  "xt": "White|EBE8E2;Black|202329;Red|A53035;Silver Metallic|ABB0B5;Dark Blue Metallic|2D435E",
  "magna": "Paris White|EAE9E2;Calypso Red|B02B33;Nautilus Blue|1E314A;Frontier Green|254637"
});

const parseFactoryPaints = raw => Object.freeze(raw.split(';').map(entry => {
  const [name, hex, code = ''] = entry.split('|');
  return Object.freeze({ name, code, color: Number.parseInt(hex, 16) });
}));
export const FACTORY_PAINT_PALETTES = Object.freeze(Object.fromEntries(
  Object.entries(RAW_FACTORY_PAINTS).map(([id, raw]) => [id, parseFactoryPaints(raw)])
));

export function getFactoryPaintPalette(carId) {
  const base = String(carId || '').replace(/__copy[2-9][0-9]*$/, '');
  return FACTORY_PAINT_PALETTES[base] || Object.freeze([]);
}
export function getFactoryPaintColor(carId, index = 0) {
  const palette = getFactoryPaintPalette(carId);
  if (!palette.length) return null;
  const n = Math.trunc(Number(index) || 0);
  return palette[((n % palette.length) + palette.length) % palette.length].color;
}
export function getDefaultFactoryPaintColor(carId) {
  // Show the real 1998 TF Sports in its familiar dark green, not white.
  return getFactoryPaintColor(carId, carId === 'magna' ? 3 : 0) ?? 0xffffff;
}
export function getFactoryPaintName(carId, color) {
  return getFactoryPaintPalette(carId).find(entry => entry.color === Number(color))?.name || null;
}
