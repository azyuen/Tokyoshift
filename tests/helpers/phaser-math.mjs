// Faithful pure Phaser math helpers for Node tests of live car builds.
globalThis.Phaser ??= {};
globalThis.Phaser.Math ??= {};
Object.assign(globalThis.Phaser.Math, {
  Clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  Linear: (start, end, amount) => start + (end - start) * amount,
});
