const BUILD = 'R752';
// Stable across releases: keys include the SHA-256 of each asset's contents.
// Generate the manifest after asset edits; never key these files by game build.
importScripts('./asset-manifest.js');
const SCOPE = new URL('./', self.location.href);
const ASSET_CACHE = 'tokyoshift-content-v1-' + encodeURIComponent(SCOPE.pathname);
const RUNTIME_CACHE = 'tokyoshift-runtime-r752';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([ASSET_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('tokyoshift-') &&
      !key.startsWith('tokyoshift-content-v1-') && !keep.has(key)).map(key => caches.delete(key)));
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

async function assetResponse(request, path, revision) {
  const key = new URL(path, SCOPE);
  key.searchParams.set('content', revision);
  const cache = await openCache(ASSET_CACHE);
  const cached = await match(cache, key.href);
  if (cached) return cached;
  // Revalidate the HTTP cache when contents change, including same-path art edits.
  const response = await fetch(new Request(request, { cache: 'no-cache' }));
  // Do not label a stale CDN/deployment response with the new content hash.
  if (response.ok && response.status === 200 && cache) {
    const bytes = await response.clone().arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (actual === revision) await store(cache, key.href, response);
  }
  return response;
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
    event.respondWith(assetResponse(request, path, revision));
    return;
  }
  if (/\.(?:js|css|json|png|jpe?g|webp|svg|gif|mp3|ogg|wav|m4a|woff2?)$/i.test(url.pathname) ||
      request.mode === 'navigate' || url.pathname.endsWith('/')) {
    event.respondWith(networkFirst(request));
  }
});
