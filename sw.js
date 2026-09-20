const BUILD = 'R23';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const freshCode =
    request.mode === 'navigate' ||
    /\.(?:js|css|json|html)$/.test(url.pathname) ||
    url.pathname.endsWith('/');

  if (!freshCode) return;

  event.respondWith(
    fetch(new Request(request, { cache: 'no-store' }))
      .catch(() => fetch(request))
  );
});
