/* ============================================================
   SafeCook Pro — PWA Service Worker
   ============================================================ */

const CACHE_NAME = 'safecook-pro-cache-v4';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon.png',
  'css/design-system.css',
  'css/components.css',
  'css/animations.css',
  'css/screens.css',
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
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request);
    })
  );
});
