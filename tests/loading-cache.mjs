import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const hash = body => createHash('sha256').update(body).digest('hex');
function worker({ body = 'original', revision = hash(body), shared = new Map(), brokenCache = false } = {}) {
  const handlers = {}, calls = [];
  const self = { location: { href: 'https://game.test/Tokyoshift/sw.js' },
    TOKYO_SHIFT_ASSET_REVISIONS: { 'assets/Cars/car.png': revision },
    addEventListener: (name, fn) => handlers[name] = fn,
    skipWaiting() {}, clients: { claim() {} } };
  let offline = false, status = 200;
  const caches = {
    keys: async () => [...shared.keys()], delete: async key => shared.delete(key),
    open: async name => {
      if (brokenCache) throw new Error('denied');
      if (!shared.has(name)) shared.set(name, new Map());
      const cache = shared.get(name);
      const key = request => typeof request === 'string' ? request : request.url;
      return { match: async r => cache.get(key(r))?.clone(), put: async (r, response) => cache.set(key(r), response.clone()) };
    }
  };
  vm.runInNewContext(source, { self, caches, URL, Request, Response, Uint8Array, crypto: webcrypto, importScripts() {},
    fetch: async request => { calls.push(request); if (offline) throw new Error('offline'); return new Response(body, {status}); } });
  return { shared, calls, setOffline(value) { offline=value; }, setStatus(value) { status=value; },
    async activate() { let task; handlers.activate({waitUntil(p) {task=p;}}); await task; },
    async get(path='assets/Cars/car.png', options={}) {
      let task;
      handlers.fetch({ request: new Request(new URL(path, 'https://game.test/Tokyoshift/'), options), respondWith(p) {task=p;} });
      return task;
    }
  };
}
test('asset downloaded once; query changes and worker restarts reuse verified bytes', async () => {
  const w = worker();
  assert.equal(await (await w.get()).text(), 'original');
  assert.equal(await (await w.get('assets/Cars/car.png?v=new')).text(), 'original');
  assert.equal(w.calls.length, 1);
  const next = worker({shared:w.shared}); await next.activate(); next.setOffline(true);
  assert.equal(await (await next.get()).text(), 'original'); assert.equal(next.calls.length, 0);
});
test('changed same-path artwork downloads fresh bytes; stale deployment bytes are not cached', async () => {
  const w = worker(); await w.get();
  const changed = worker({shared:w.shared,body:'updated'});
  assert.equal(await (await changed.get()).text(), 'updated'); assert.equal(changed.calls.length,1);
  const stale = worker({body:'old CDN copy',revision:hash('new content')});
  await stale.get(); await stale.get(); assert.equal(stale.calls.length,2);
});
test('cache denied still returns a successful network response', async () => {
  const w=worker({brokenCache:true}); assert.equal(await (await w.get()).text(),'original');
});
test('code validates via HTTP cache and falls back offline or on server failure', async () => {
  const w=worker(); await w.get('src/main.js'); assert.equal(w.calls[0].cache,'no-cache');
  w.setOffline(true); assert.equal(await (await w.get('src/main.js')).text(),'original');
  w.setOffline(false); w.setStatus(503); assert.equal((await w.get('src/main.js')).status,200);
});
test('version remains network-only; POST, range, other origins and sibling scopes bypass worker', async () => {
  const w=worker(); await w.get('version.json'); assert.equal(w.calls[0].cache,'no-store');
  assert.equal(await w.get('assets/Cars/car.png',{method:'POST'}),undefined);
  assert.equal(await w.get('assets/Cars/car.png',{headers:{Range:'bytes=0-1'}}),undefined);
  assert.equal(await w.get('https://other.test/file.js'),undefined);
  assert.equal(await w.get('../another-game/file.js'),undefined);
});
test('build reconciliation retains content assets and manual recovery can clear them', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const refresh=html.slice(html.indexOf('window.TOKYO_SHIFT_REFRESH_FILES ='),html.indexOf("document.getElementById('boot-retry-files')?.addEventListener"));
  const boot=html.slice(html.indexOf('window.TOKYO_SHIFT_BOOT_READY ='));
  assert.match(boot,/!key.startsWith\('tokyoshift-content-v1-'\)/);
  assert.doesNotMatch(refresh,/!key.startsWith\('tokyoshift-content-v1-'\)/);
  assert.doesNotMatch(refresh,/localStorage\.(clear|removeItem)|indexedDB.deleteDatabase/);
});
