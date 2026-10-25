const SETTINGS_KEY = 'tokyoShiftAudioSettings';

const DEFAULTS = {
  music: 0.80,
  sfx: 0.85,
};

const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));

export function getAudioSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    return {
      music: clamp(stored?.music ?? DEFAULTS.music),
      sfx: clamp(stored?.sfx ?? DEFAULTS.sfx),
    };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export function setAudioSettings(next = {}) {
  const current = getAudioSettings();
  const settings = {
    music: clamp(next.music ?? current.music),
    sfx: clamp(next.sfx ?? current.sfx),
  };

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('tokyo-shift-audio-settings', {
      detail: settings,
    }));
  } catch (e) {}

  return settings;
}

export function getMusicVolume() {
  return getAudioSettings().music;
}

export function getSfxVolume() {
  return getAudioSettings().sfx;
}
