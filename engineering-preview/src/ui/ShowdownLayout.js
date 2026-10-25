// Shared geometry for Skytree and regional Street Showdown presentations.
// The three rival cards and the right-hand actions stay in identical slots.
export const SHOWDOWN_STAGE = Object.freeze({ x: 24, y: 92, w: 1138, h: 528 });
export const SHOWDOWN_SIDE = Object.freeze({ x: 1180, y: 92, w: 356, h: 724 });
export const SHOWDOWN_STRIP = Object.freeze({ x: 24, y: 636, w: 1138, h: 180 });
export const SHOWDOWN_CARD_CENTERS = Object.freeze([215, 593, 971]);
export const SHOWDOWN_CARD_Y = 744;
export const SHOWDOWN_CARD_WIDTH = 350;
export const SHOWDOWN_CARD_HEIGHT = 132;
export const SHOWDOWN_RACE_Y_OFFSET = 614;
export const SHOWDOWN_BACK_Y_OFFSET = SHOWDOWN_SIDE.h - 48;
export const SHOWDOWN_RACE_BUTTON_HEIGHT = 48;
export const SHOWDOWN_BACK_BUTTON_HEIGHT = 46;

// Single source for the Showdown foreground (also consumed by Story staging).
// These are the exact proven native positions used by StreetShowdownView.
export const SHOWDOWN_HERO_CAR=Object.freeze({
  x:SHOWDOWN_STAGE.x+SHOWDOWN_STAGE.w/2,
  y:455,
  targetWidth:663,
});
export const SHOWDOWN_HERO_CHARACTER=Object.freeze({
  x:SHOWDOWN_STAGE.x+255,
  feetY:SHOWDOWN_STAGE.y+SHOWDOWN_STAGE.h-4,
  height:315,
});
