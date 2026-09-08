// Bappa Swar Devotional App Service Worker
// Full Offline Architecture: App Shell + Intelligent Media Range-Request Caching

const SHELL_CACHE_NAME = 'bappaswar-shell-v4';
const MEDIA_CACHE_NAME = 'bappaswar-media-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/creator.html',
  '/manifest.json',
  '/images/bappa_theme_hero.png',
  '/images/player_thumb.jpg'
];

// Pre-cache the 5 Essential Daily Aartis so Puja works 100% offline from day one!
const CORE_AARTIS_TO_PRECACHE = [
  '/song/aarthi/' + encodeURIComponent("Ganpati Aarti _ Sukhkarta Dukhharta _ Lata Mangeshkar _ Devotional Song _ Marathi Song.mp3"),
  '/song/aarthi/' + encodeURIComponent("Shendur Laal Chadhayo (Aarti) Lyrical Video _ Vaastav - The Reality _ Ravindra Sathe _Sanjay Dutt.mp3"),
  '/song/aarthi/' + encodeURIComponent("Durge Durghat Bhari Ma Durga Aarti _ Aarti For Mental Peace & Stability _ Rajshri Soul.mp3"),
  '/song/aarthi/' + encodeURIComponent("Karpur Gauram Karunavtaram_ à¤_à¤£à¥_à¤¶ à¤_à¤¤à¥_à¤¸à¤µ à¤µà¤¿à¤¶à¥_à¤· 2025 Ganesh Maha Aarti _Dr. Balaji Tambe, Saam Gurukul.mp3"),
  '/song/aarthi/' + encodeURIComponent("Ganesh Aarti, JAI GANESH DEVA by Anuradha Paudwal with Hindi, English LyricsI I Full Video Song.mp3")
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => {
      // Pre-cache core shell
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Shell pre-caching non-fatal warning:', err);
      });
    }).then(() => {
      // Pre-cache core Aartis in background without blocking installation
      caches.open(MEDIA_CACHE_NAME).then((mediaCache) => {
        CORE_AARTIS_TO_PRECACHE.forEach((aartiUrl) => {
          fetch(aartiUrl).then((res) => {
            if (res.status === 200) {
              mediaCache.put(aartiUrl, res);
            }
          }).catch(() => {});
        });
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
          if (key !== SHELL_CACHE_NAME && key !== MEDIA_CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url.toLowerCase();
  const isMedia = 
    event.request.destination === 'audio' ||
    url.includes('/song/') ||
    url.endsWith('.mp3') ||
    url.endsWith('.m4a') ||
    url.endsWith('.wav') ||
    url.endsWith('.ogg');

  if (isMedia) {
    event.respondWith(handleMediaFetch(event));
    return;
  }

  // Handle standard page & asset requests (Cache-first with network refresh)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next load
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(SHELL_CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});

// Intelligent Media Fetch with HTTP 206 Partial Content Range slicing for offline playback & scrubber seeking
async function handleMediaFetch(event) {
  const mediaCache = await caches.open(MEDIA_CACHE_NAME);
  const cleanUrl = event.request.url.split('?')[0];
  const rangeHeader = event.request.headers.get('range');

  // 1. Check if the song exists in media cache
  const cachedResponse = await mediaCache.match(cleanUrl);

  if (cachedResponse) {
    if (rangeHeader) {
      return createPartialResponse(cachedResponse, rangeHeader);
    }
    return cachedResponse;
  }

  // 2. If online, fetch from network
  try {
    const networkResponse = await fetch(event.request);

    // If server returned full 200, cache it for offline!
    if (networkResponse.status === 200) {
      const clone = networkResponse.clone();
      mediaCache.put(cleanUrl, clone).catch(() => {});
    } else if (networkResponse.status === 206) {
      // If server returned 206 partial response, also fetch full track in background to save for offline
      fetch(cleanUrl).then((fullRes) => {
        if (fullRes.status === 200) {
          mediaCache.put(cleanUrl, fullRes);
        }
      }).catch(() => {});
    }

    return networkResponse;
  } catch (err) {
    // 3. Network failed (device is offline)
    const fallbackCached = await mediaCache.match(cleanUrl);
    if (fallbackCached) {
      if (rangeHeader) {
        return createPartialResponse(fallbackCached, rangeHeader);
      }
      return fallbackCached;
    }

    // Return a clean error if song was never played/cached
    return new Response('Track not available offline yet. Play it once while connected to save it offline.', {
      status: 503,
      statusText: 'Offline Track Unavailable'
    });
  }
}

// Slice cached ArrayBuffer to handle HTTP 206 Range requests (crucial for Chrome/Safari mobile audio)
async function createPartialResponse(response, rangeHeader) {
  const arrayBuffer = await response.clone().arrayBuffer();
  const totalLength = arrayBuffer.byteLength;

  const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!matches) {
    return response;
  }

  const start = parseInt(matches[1], 10);
  const end = matches[2] ? parseInt(matches[2], 10) : totalLength - 1;

  if (start >= totalLength || end >= totalLength || start > end) {
    return new Response(null, {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': `bytes */${totalLength}` }
    });
  }

  const slicedBuffer = arrayBuffer.slice(start, end + 1);

  return new Response(slicedBuffer, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${totalLength}`,
      'Content-Length': String(slicedBuffer.byteLength),
      'Accept-Ranges': 'bytes'
    }
  });
}
