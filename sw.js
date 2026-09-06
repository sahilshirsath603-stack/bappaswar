// Bappa Swar Devotional App Service Worker
const CACHE_NAME = 'bappaswar-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/creator.html',
  '/manifest.json',
  '/images/bappa_theme_hero.png',
  '/images/player_thumb.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-caching non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging old service worker cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url.toLowerCase();

  // CRITICAL: NEVER intercept audio/video streams or partial range requests!
  // Chrome on mobile fails with net::ERR_CACHE_OPERATION_NOT_SUPPORTED when service workers touch range requests
  const isMedia = 
    event.request.destination === 'audio' ||
    event.request.destination === 'video' ||
    url.includes('/song/') ||
    url.endsWith('.mp3') ||
    url.endsWith('.m4a') ||
    url.endsWith('.wav') ||
    url.endsWith('.ogg') ||
    event.request.headers.has('range') ||
    Boolean(event.request.headers.get('range'));

  if (isMedia) {
    // Let browser network stack stream audio directly with HTTP 206 Partial Content support
    return;
  }

  // Handle standard page & asset requests with Network-First or Cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache valid responses for offline capability
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
