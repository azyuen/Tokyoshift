// Test-only scene: verifies that Phaser's real scene manager can replace a
// deferred proxy and still forward its original init payload.
export default class DeferredSceneFixture extends Phaser.Scene {
  constructor() {super('DeferredFixture');}
  init(data) {window.__TOKYO_SHIFT_TEST_DEFERRED_INIT=data;}
  create() {window.__TOKYO_SHIFT_TEST_DEFERRED='ready';}
}
