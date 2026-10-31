# Loading audit — 1 November 2026

Baseline: `161e375` (main, R749). Scope: download reuse and startup waits. No beta release, history rewrite, artwork edits, save changes or gameplay rebalance.

## Findings

- `sw.js` forced network requests with `cache: no-store` for cars, wheels, major characters, garages, meets, tuner shops and several other heavily used images. Existing Cache Storage copies were only offline fallbacks for these paths.
- `index.html` deleted every Tokyo SHIFT cache on each build change. Even unchanged images had to be fetched again.
- Code also used `no-store`, preventing ordinary HTTP conditional revalidation.
- BootScene already limits asset loading to profile/setup images; gameplay scenes load their assets on demand. This behaviour is retained.
- Main waits for 18 scene modules and then starts its font wait. Font loading can safely overlap module imports.
- Source JavaScript totals 3,938,032 bytes on disk. Assets are dominated by Characters (455,719,789 bytes), CentralTokyo (136,607,914), Meet (129,368,155), Locations (57,905,415), Oshiage (46,573,747), Garage (45,396,731), and Cars (34,386,416). These are repository sizes, NOT startup transfer measurements. Several backgrounds are over 4 MB each.

## Implemented

1. Generated SHA-256 manifest for 755 artwork/audio/font assets and icons. Nothing is bulk downloaded or precached.
2. Known assets use a stable, application-scoped content cache. Unchanged files are reusable across sessions, build changes and asset query-string changes. Changed contents create a new cache key.
3. Newly downloaded asset bytes are checked against the manifest before caching, so a stale CDN response cannot permanently poison a new revision's cache entry.
4. Code and HTML remain network-first but use HTTP revalidation (`no-cache`) instead of disabling HTTP caching (`no-store`). Version checks stay network-only. Offline code fallback remains.
5. Cache quota/access failures do not prevent normal network loading. Non-GET, range, cross-origin and sibling application requests are excluded.
6. Build reconciliation retains verified content assets and scopes worker unregistering to this app. Manual Refresh Game Files still clears the content cache; save storage is untouched.
7. Font loading starts alongside module loading rather than after it.

## Validation

- Eight local Node tests pass: content reuse across requests/worker restarts, same-path changes, stale deployment bytes, cache access denial, offline/server-failure code fallback, request boundaries, build/cache-save separation, and repository import integrity.
- Manifest regeneration check and JavaScript syntax/diff checks pass.
- `tests/loading-cache-browser.mjs` compares the original R749 worker with the new worker in real Chromium and WebKit mobile-sized contexts. It measures server request counts/bytes for an actual car image, checks reload reuse and offline reuse. The original worker fixture is from `161e375`.
- Local browser installation failed (download was not a valid archive), so browser checks ran in GitHub Actions on commit `ca8078393952ffdadc2daf47c23458d8cd88c6f9`.
- Chromium and WebKit both passed: the original worker made two network requests (711,880 bytes) for two reads of the 355,940-byte Amuse S2000 image. The new worker made one request (355,940 bytes), with no additional download for the second read, reload or offline read. This is an asset-level measurement, not a whole-game loading-time claim.
- Existing mobile viewport boot/reload and Oshiage browser regression workflows passed. These emulate device viewports; they are not physical iPhone/iPad testing.
- An additional 35 local Central Tokyo startup and Arkon Story/save regressions passed (43 local checks in total).
- CI evidence: https://github.com/azyuen/Tokyoshift/actions/runs/41246369551 (cache), https://github.com/azyuen/Tokyoshift/actions/runs/41246369432 (mobile), https://github.com/azyuen/Tokyoshift/actions/runs/41246369428 (Oshiage).

## Deployment and maintenance

- Run `node scripts/generate-asset-manifest.mjs` after any asset/icon change. CI checks the generated result. Deploy `asset-manifest.js` together with `sw.js` and the corresponding assets.
- Preserve the existing release/version reconciliation convention. This branch deliberately does not increment the production version or deploy.
- Initial visits still need to download the images they use. The first uncontrolled page may rely on ordinary HTTP caching until the worker controls it. Returning controlled visits benefit from persistent asset reuse.
- Browser-managed storage is evictable. There is no full-offline-game guarantee; external Phaser/fonts and uncached content still require a connection.
- Older content revisions are retained for now. A bounded eviction policy can be added after measuring real usage; manual Refresh Game Files removes the cache.

## Remaining opportunities

Measure first-time and returning startup on a real iPhone/iPad and record network transfer, time-to-profile and time-to-garage. Profile scene import graphs before introducing asynchronous scene registration. Assess lossless image alternatives for large backgrounds/characters with visual comparison; no artwork format/geometry has changed in this patch. Consider self-hosting pinned Phaser/fonts for reliable offline coverage. These are follow-up opportunities, not claimed improvements from this patch.
