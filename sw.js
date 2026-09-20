/* ============================================================
   SafeCook Pro — PWA Service Worker (Network-First Strategy)
   ============================================================ */

const CACHE_NAME = 'safecook-pro-cache-v9';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon.png',
  'css/design-system.css',
  'css/components.css',
  'css/animations.css',
  'css/screens.css',
  'css/dashboard.css',
  'css/monitoring.css',
  'css/alerts.css',
  'css/emergency.css',
  'js/i18n.js',
  'js/state.js',
  'js/mock-data.js',
  'js/router.js',
  'js/components.js',
  'js/charts.js',
  'js/screens/splash.js',
  'js/screens/onboarding.js',
  'js/screens/auth.js',
  'js/screens/dashboard.js',
  'js/screens/monitoring.js',
  'js/screens/alerts.js',
  'js/screens/analytics.js',
  'js/screens/devices.js',
  'js/screens/family.js',
  'js/screens/emergency.js',
  'js/screens/settings.js',
  'js/screens/recipes.js',
  'js/app.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with Cache Fallback strategy
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Don't cache chrome-extension or external analytics
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback to cache
        return caches.match(e.request);
      })
  );
});
