if ('function' === typeof importScripts) {
  importScripts('https://cdn.jsdelivr.net/npm/workbox-cdn@5.1.3/workbox/workbox-sw.min.js');
  workbox.setConfig({modulePathPrefix: 'https://cdn.jsdelivr.net/npm/workbox-cdn@5.1.3/workbox/'});

  const { core, precaching, routing, strategies, expiration } = workbox;
  const { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } = strategies;

  workbox.routing.registerRoute(
    ({request}) => request.destination === 'style' || request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static',
    })
  );

  workbox.routing.registerRoute(
    /\/sw.js/,
    new NetworkOnly()
  );

  workbox.routing.registerRoute(
    /.*\.(?:png|jpg|jpeg|webp|svg|gif)/,
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        })
      ],
    })
  );

  workbox.precaching.precacheAndRoute([{ url: "/", revision: "v1" }]);
}
