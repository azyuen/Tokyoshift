// Defer substantial scene code until the player actually enters that area.
// Phaser still sees every canonical scene key, so existing scene.start(...) and
// saved return-scene identifiers remain unchanged. After the first visit we
// replace the proxy with the real scene class for the remainder of the session.
export function makeDeferredScene(key, modulePath, label = key) {
  return class DeferredScene extends Phaser.Scene {
    constructor() { super(key); }
    init(data) { this.forwardData = data; }

    async create() {
      const manager = this.game.scene;
      const data = this.forwardData;
      window.TOKYO_SHIFT_SHOW_SPLASH?.('LOADING ' + label);
      try {
        const module = await import(modulePath);
        const RealScene = module.default;
        if (typeof RealScene !== 'function')
          throw new Error(label + ' SCENE MODULE HAS NO DEFAULT CLASS');
        // An abandoned transition must not reactivate a screen the player
        // has already left. Import promises can outlast a scene transition.
        if (manager.getScene(key) !== this || !this.sys.isActive()) return;
        // The import finishes outside Phaser's synchronous SceneManager update.
        // Removing first avoids two scenes with the same canonical key.
        manager.remove(key);
        manager.add(key, RealScene, true, data);
      } catch (error) {
        console.error('[Tokyo SHIFT] deferred scene failed: ' + key, error);
        window.TOKYO_SHIFT_SHOW_BOOT_ERROR?.(error, label + ' LOAD ERROR');
      }
    }
  };
}
