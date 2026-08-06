// Aidan Command Lab service worker.
// Cache name is Aidan-specific: a shared origin must never let this evict or serve
// another app's cached shell.
const CACHE = 'aidan-command-lab-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png',
               './icon-512.png', './pll-mark.png', './pll-logo.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.allSettled(SHELL.map(function (u) { return c.add(u); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k.startsWith('aidan-command-lab-') && k !== CACHE;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                     // never cache dispatches
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // never cache switchboard/API
  if (url.pathname.endsWith('brief.json')) return;       // always-fresh data
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () { return caches.match(req); })  // offline fallback
  );
});
