let loadingWatchdog = null;
let loadingGeneration = 0;

function clearLoadingWatchdog() {
  if (loadingWatchdog != null) {
    window.clearTimeout(loadingWatchdog);
    loadingWatchdog = null;
  }
}

function hideLoadingSplash() {
  window.TOKYO_SHIFT_SET_LOADING?.(1, 'READY');
  window.TOKYO_SHIFT_HIDE_SPLASH?.();
}

export function startSceneLoading(scene, label = 'LOADING', queuedCount = 1) {
  if (!scene || queuedCount <= 0) return false;

  clearLoadingWatchdog();
  const generation = ++loadingGeneration;

  // Keep every scene transition visually consistent: one bar, one label.
  window.TOKYO_SHIFT_SHOW_SPLASH?.(label || 'LOADING');
  window.TOKYO_SHIFT_SET_LOADING?.(0.12, label || 'LOADING');

  const onProgress = value => {
    // A scene that has already been left must never be allowed to resurrect
    // the global splash. This was the cause of the Crew Space -> Warehouse
    // transition occasionally returning to 98% after the new scene was ready.
    if (generation !== loadingGeneration) return;
    const clamped = Math.max(0, Math.min(1, Number(value) || 0));
    window.TOKYO_SHIFT_SET_LOADING?.(
      0.12 + clamped * 0.84,
      label || 'LOADING'
    );
  };

  const onComplete = () => {
    scene.load.off('progress', onProgress);
    if (generation !== loadingGeneration) return;

    window.TOKYO_SHIFT_SET_LOADING?.(0.98, label || 'LOADING');

    clearLoadingWatchdog();
    loadingWatchdog = window.setTimeout(() => {
      if (generation !== loadingGeneration) return;
      loadingWatchdog = null;
      console.warn('[Tokyo SHIFT] loading splash watchdog recovered a stalled scene handoff');
      hideLoadingSplash();
    }, 1200);
  };

  scene.load.on('progress', onProgress);
  scene.load.once('complete', onComplete);

  // Invalidate this loader the instant its owning scene shuts down. Phaser can
  // still deliver a late Loader COMPLETE event on mobile after Scene.start().
  const invalidate = () => {
    if (generation === loadingGeneration) loadingGeneration += 1;
    clearLoadingWatchdog();
    try { scene.load.off('progress', onProgress); } catch (e) {}
    try { scene.load.off('complete', onComplete); } catch (e) {}
  };
  scene.events?.once?.('shutdown', invalidate);
  scene.events?.once?.('destroy', invalidate);

  return true;
}

export function cancelSceneLoading(scene = null) {
  loadingGeneration += 1;
  clearLoadingWatchdog();
  if (scene?.load) {
    try { scene.load.removeAllListeners('progress'); } catch (e) {}
    // Do not remove unrelated COMPLETE listeners globally; generation guards
    // make stale loading-screen handlers harmless.
  }
  window.TOKYO_SHIFT_SET_LOADING?.(1, 'READY');
  window.TOKYO_SHIFT_HIDE_SPLASH?.();
}

export function finishSceneLoading() {
  loadingGeneration += 1;
  clearLoadingWatchdog();
  window.TOKYO_SHIFT_SET_LOADING?.(1, 'READY');

  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    window.TOKYO_SHIFT_HIDE_SPLASH?.();
  };

  requestAnimationFrame(() => requestAnimationFrame(hide));
  window.setTimeout(hide, 120);
}
