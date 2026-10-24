// R658 — shared readable typography for narrative dialogue, including BOTH
// telephone presentations (ordinary calls and vibrating/swipe-to-answer).
//
// Pixel sizes are final Phaser logical-stage sizes (1560 x 840). Apply via
// setFontSize *after* scene.add.text() so they are not affected by the old
// global initial text-factory size multiplier in main.js.
//
// All chapters using MangaCutscene or the canonical phone HUD inherit edits
// here automatically. This does NOT touch race coaching or other gameplay HUDs.
export const STORY_DIALOGUE_TYPOGRAPHY = Object.freeze({
  bodyPx: 22,
  emphasisPx: 24,
  speakerPx: 16,
  lineSpacing: 5,
});

export function applyStoryDialogueTypography({
  dialogue = null,
  heading = null,
  emphasis = false,
} = {}) {
  if (heading?.setFontSize) {
    heading.setFontSize(STORY_DIALOGUE_TYPOGRAPHY.speakerPx);
  }
  if (dialogue?.setFontSize) {
    dialogue.setFontSize(emphasis
      ? STORY_DIALOGUE_TYPOGRAPHY.emphasisPx
      : STORY_DIALOGUE_TYPOGRAPHY.bodyPx);
  }
  dialogue?.setLineSpacing?.(STORY_DIALOGUE_TYPOGRAPHY.lineSpacing);
  return { dialogue, heading };
}
