// Shared compact portrait/speech geometry for in-car banter, scripted compact
// dialogue, and phone calls. Tokyo SHIFT uses a 1560 x 840 logical viewport.
// The entire assembly is moved one portrait width right of the original
// Ginza prototype, keeping faces and the speech-tail clear of iPhone notches.
export const COMPACT_DIALOGUE_SHIFT_X = 150;
const x = value => value + COMPACT_DIALOGUE_SHIFT_X;

export const COMPACT_DIALOGUE_LAYOUTS = Object.freeze({
  left: Object.freeze({
    face: Object.freeze({
      x: x(22), y: 114, width: 150, height: 170,
      targetX: x(96), targetY: 226, headHeight: 162,
    }),
    bubble: Object.freeze({
      left: x(184), right: x(726), top: 118, bottom: 326,
      notchDepth: 18, notchHalfHeight: 18,
      headingX: x(207), headingY: 140,
      textX: x(207), textY: 170, textWidth: 488,
    }),
  }),
  right: Object.freeze({
    face: Object.freeze({
      x: x(755), y: 114, width: 150, height: 170,
      targetX: x(830), targetY: 226, headHeight: 162,
    }),
    bubble: Object.freeze({
      left: x(194), right: x(733), top: 118, bottom: 326,
      notchDepth: 18, notchHalfHeight: 18,
      headingX: x(217), headingY: 140,
      textX: x(217), textY: 170, textWidth: 486,
    }),
  }),
});

// Phone cards travel within their speech-box footprint, not from the
// bottom of the 840px screen. The action button remains fixed.
export const PHONE_CARD_SWIPE_DISTANCE = Math.round(
  (COMPACT_DIALOGUE_LAYOUTS.left.bubble.bottom -
   COMPACT_DIALOGUE_LAYOUTS.left.bubble.top) * 0.60
);
