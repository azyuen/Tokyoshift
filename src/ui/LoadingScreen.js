let loadingWatchdog = null;

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

  // Keep every scene transition visually consistent: one bar, one label.
  window.TOKYO_SHIFT_SHOW_SPLASH?.('LOADING');
  window.TOKYO_SHIFT_SET_LOADING?.(0.12, 'LOADING');

  const onProgress = value => {
    const clamped = Math.max(0, Math.min(1, Number(value) || 0));
    window.TOKYO_SHIFT_SET_LOADING?.(0.12 + clamped * 0.84, 'LOADING');
  };

  scene.load.on('progress', onProgress);
  scene.load.once('complete', () => {
    scene.load.off('progress', onProgress);
    window.TOKYO_SHIFT_SET_LOADING?.(0.98, 'LOADING');

    // Scene create() normally calls finishSceneLoading immediately afterwards.
    // If a mobile/PWA scene handoff is interrupted, never leave the global
    // loader permanently parked at 98%.
    clearLoadingWatchdog();
    loadingWatchdog = window.setTimeout(() => {
      loadingWatchdog = null;
      console.warn('[Tokyo SHIFT] loading splash watchdog recovered a stalled scene handoff');
      hideLoadingSplash();
    }, 1600);
  });

  return true;
}

export function finishSceneLoading() {
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
