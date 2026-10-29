// Professional race lane paint is chosen by the live FourLaneTestScene.
// Reuse these same colors in the individual Open Circuit opponent preview,
// rather than previewing an untinted stock white body.
export const PRO_RACE_RIVAL_PAINTS = Object.freeze([
  0xd04a59, // first opponent (individual driver and trophy heats)
  0x63b3d4, // second opponent in four-wide
  0xefca66, // third opponent in four-wide
]);

export function getProRaceRivalPaint(index = 0) {
  return PRO_RACE_RIVAL_PAINTS[index] ?? PRO_RACE_RIVAL_PAINTS[0];
}
