export function startSceneLoading(scene, label = 'LOADING ASSETS', queuedCount = 1) {
  if (!scene || queuedCount <= 0) return false;

  window.TOKYO_SHIFT_SHOW_SPLASH?.(label);
  window.TOKYO_SHIFT_SET_LOADING?.(0.04, label);

  const onProgress = value => {
    const clamped = Math.max(0, Math.min(1, Number(value) || 0));
    window.TOKYO_SHIFT_SET_LOADING?.(0.05 + clamped * 0.90, label);
  };

  scene.load.on('progress', onProgress);
  scene.load.once('complete', () => {
    scene.load.off('progress', onProgress);
    window.TOKYO_SHIFT_SET_LOADING?.(0.97, 'OPENING TOKYO');
  });

  return true;
}

export function finishSceneLoading(label = 'READY') {
  window.TOKYO_SHIFT_SET_LOADING?.(1, label);

  // Hide on the next paint, with a short timeout fallback for iOS PWAs where
  // requestAnimationFrame can be throttled during a scene hand-off.
  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    window.TOKYO_SHIFT_HIDE_SPLASH?.();
  };

  requestAnimationFrame(() => requestAnimationFrame(hide));
  window.setTimeout(hide, 120);
}
