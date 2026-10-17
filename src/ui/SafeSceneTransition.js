// R573 — Phaser input-safe scene transition.
// Never stop/restart a scene synchronously from the GameObject pointerdown
// that owns the button. In particular, iPad Safari can lose input/render when
// GarageScene is restarted while its Office or map is being destroyed.
export function queueSafeSceneStart(scene, targetScene, data = undefined) {
  if (!scene?.scene?.start || !targetScene) return false;
  if (scene._pendingSafeSceneStart) return false;
  scene._pendingSafeSceneStart = targetScene;
  const proceed = () => {
    if (scene._pendingSafeSceneStart !== targetScene) return;
    scene._pendingSafeSceneStart = null;
    if (typeof scene.sys?.isActive === 'function' && !scene.sys.isActive()) return;
    try {
      if (data === undefined) scene.scene.start(targetScene);
      else scene.scene.start(targetScene, data);
    }
    catch (error) {
      console.error('[TOKYO SHIFT] scene transition failed',targetScene,error);
      scene._pendingSafeSceneStart = null;
    }
  };
  // Browser event-loop deferral, not Phaser scene.time: cutscene clocks may
  // still be paused while the last page or portrait overlay is closing.
  if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
    window.setTimeout(proceed, 0);
  } else {
    setTimeout(proceed, 0);
  }
  return true;
}
