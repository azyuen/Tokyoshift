const BUILD = 'R803';
// Stable across releases: keys include the SHA-256 of each asset's contents.
// Generate the manifest after asset edits; never key these files by game build.
importScripts('./asset-manifest.js');
const SCOPE = new URL('./', self.location.href);
const ASSET_CACHE = 'tokyoshift-content-v1-' + encodeURIComponent(SCOPE.pathname);
const RUNTIME_CACHE = 'tokyoshift-runtime-r803';
const pendingAssets = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([ASSET_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('tokyoshift-') &&
      !key.startsWith('tokyoshift-content-v1-') && !keep.has(key)).map(key => caches.delete(key)));
    // iOS PWA quota is tight: a hash update otherwise leaves every obsolete
    // full-resolution image in permanent Cache Storage. Keep the CURRENT
    // content revision only, never touching profiles or any other app.
    try {
      const cache = await openCache(ASSET_CACHE);
      if (cache?.keys && cache?.delete) {
        const requests = await cache.keys();
        const stale = requests.filter(request => {
          const url = new URL(request.url);
          if (!url.pathname.startsWith(SCOPE.pathname)) return false;
          const path = decodeURIComponent(url.pathname.slice(SCOPE.pathname.length));
          const valid = self.TOKYO_SHIFT_ASSET_REVISIONS[path];
          return !valid || url.searchParams.get('content') !== valid;
        });
        // Bound concurrent deletes to avoid a burst of large storage operations.
        for (let offset = 0; offset < stale.length; offset += 16) {
          await Promise.all(stale.slice(offset, offset + 16).map(req =>
            cache.delete(req).catch(() => false)));
        }
      }
    } catch (_) { /* Cache Storage may be inaccessible on older iOS. */ }
    await self.clients.claim();
  })());
});

async function openCache(name) {
  try { return await caches.open(name); } catch { return null; }
}
async function match(cache, key) {
  try { return await cache?.match(key); } catch { return undefined; }
}
async function store(cache, key, response) {
  // Quota/private-mode failures must not turn a successful download into a boot failure.
  try { if (cache && response.ok && response.status === 200) await cache.put(key, response.clone()); } catch {}
}

async function verifyAndStore(cache, key, response, revision) {
  // Work on a clone while the original response streams to Phaser. Keep the
  // integrity check: old CDN bytes must never acquire a new content hash.
  try {
    const bytes = await response.clone().arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (actual === revision) await store(cache, key, response);
  } catch (_) { /* Cache/hash failure cannot block a successful download. */ }
}

async function fetchAsset(request, key, revision) {
  const cache = await openCache(ASSET_CACHE);
  const cached = await match(cache, key);
  if (cached) return { response: cached, cacheDone: Promise.resolve() };
  const response = await fetch(new Request(request, { cache: 'no-cache' }));
  const cacheDone = response.ok && response.status === 200 && cache
    ? verifyAndStore(cache, key, response, revision) : Promise.resolve();
  return { response, cacheDone };
}

function assetResponse(event, path, revision) {
  const key = new URL(path, SCOPE);
  key.searchParams.set('content', revision);
  const cacheKey = key.href;
  // Keep the shared response until its background write finishes, so another
  // request during hashing does not download the same image again.
  if (!pendingAssets.has(cacheKey)) {
    const pending = fetchAsset(event.request, cacheKey, revision);
    pendingAssets.set(cacheKey, pending);
    pending.then(result => result.cacheDone).finally(() => {
      if (pendingAssets.get(cacheKey) === pending) pendingAssets.delete(cacheKey);
    }).catch(() => {});
  }
  const pending = pendingAssets.get(cacheKey);
  // Register during the fetch event; iOS may otherwise stop the worker before
  // the persistent write finishes after the response has been delivered.
  event.waitUntil(pending.then(result => result.cacheDone).catch(() => {}));
  return pending.then(result => result.response.clone());
}

async function networkFirst(request) {
  const cache = await openCache(RUNTIME_CACHE);
  try {
    // Always validate code/HTML to retain the mixed-build recovery protection,
    // but allow HTTP 304 responses instead of bypassing the HTTP cache entirely.
    const response = await fetch(new Request(request, { cache: 'no-cache' }));
    if (response.ok) await store(cache, request, response);
    if (response.status >= 500) return (await match(cache, request)) || response;
    return response;
  } catch {
    return (await match(cache, request)) || Response.error();
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== SCOPE.origin ||
      !url.pathname.startsWith(SCOPE.pathname) || request.headers.has('range')) return;
  const path = decodeURIComponent(url.pathname.slice(SCOPE.pathname.length));
  if (path === 'version.json') {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })));
    return;
  }
  const revision = self.TOKYO_SHIFT_ASSET_REVISIONS[path];
  if (typeof revision === 'string') {
    event.respondWith(assetResponse(event, path, revision));
    return;
  }
  if (/\.(?:js|css|json|png|jpe?g|webp|svg|gif|mp3|ogg|wav|m4a|woff2?)$/i.test(url.pathname) ||
      request.mode === 'navigate' || url.pathname.endsWith('/')) {
    event.respondWith(networkFirst(request));
  }
});
