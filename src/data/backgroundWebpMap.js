// Phaser keeps its existing texture keys and authored PNG paths. Only the
// network URL changes, using the generated source-PNG -> WebP mapping. This
// preserves every scene layout, dynamic day/night filename and saved profile.
import { BACKGROUND_WEBP_ASSETS } from './backgroundWebpTable.js?v=20261110-backgrounds';

export function resolveBackgroundWebpUrl(url) {
  if (typeof url !== 'string' || !url.includes('assets/')) return url;
  const start = url.indexOf('assets/');
  const suffix = url.slice(start);
  const match = suffix.match(/^([^?#]+\.png)(?=[?#]|$)/i);
  if (!match) return url;
  const destination = BACKGROUND_WEBP_ASSETS[match[1]];
  return destination ? url.slice(0, start) + destination +
    suffix.slice(match[1].length) : url;
}

/** Call before the Phaser.Game constructor creates its first scene. */
export function installBackgroundWebpLoader(Phaser) {
  const loader = Phaser?.Loader?.LoaderPlugin?.prototype;
  if (!loader || typeof loader.image !== 'function')
    throw new Error('Phaser image loader unavailable for WebP background mapping');
  if (loader.__tokyoBackgroundWebpMapped) return;
  const original = loader.image;
  const transform = input => Array.isArray(input) ?
    input.map(transform) :
    input && typeof input === 'object' ?
      { ...input, url: resolveBackgroundWebpUrl(input.url) } :
      input;
  loader.image = function(key, url, ...args) {
    return original.call(this, transform(key),
      resolveBackgroundWebpUrl(url), ...args);
  };
  loader.__tokyoBackgroundWebpMapped = true;
}
