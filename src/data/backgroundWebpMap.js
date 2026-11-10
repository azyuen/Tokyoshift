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
  // In Phaser 3.90, FileTypesManager injects image() onto EACH LoaderPlugin
  // instance. There is no LoaderPlugin.prototype.image method to patch.
  const types=Phaser?.Loader?.FileTypesManager;
  if(!types || typeof types.install !== 'function')
    throw new Error('Phaser file type installer unavailable for WebP mapping');
  if(types.__tokyoBackgroundWebpMapped)return;
  const originalInstall=types.install;
  const transform=input=>Array.isArray(input)?input.map(transform):
    input && typeof input==='object'?
      {...input,url:resolveBackgroundWebpUrl(input.url)}:input;
  types.install=function(loader){
    const result=originalInstall.call(this,loader);
    if(typeof loader?.image!=='function')
      throw new Error('Phaser image loader missing after file types install');
    const originalImage=loader.image;
    loader.image=function(key,url,...args){
      return originalImage.call(this,transform(key),
        resolveBackgroundWebpUrl(url),...args);
    };
    return result;
  };
  types.__tokyoBackgroundWebpMapped=true;
}
