const CACHE_NAME = 'olio-planeta-v1';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com'
];

// Installazione Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installazione...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Attivazione Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Attivazione...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Rimozione cache vecchia');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercettazione richieste
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Restituisci dalla cache se disponibile
        if (response) {
          return response;
        }
        
        // Altrimenti fetch dalla rete
        return fetch(event.request)
          .then(response => {
            // Controlla se la risposta è valida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona la risposta
            const responseToCache = response.clone();
            
            // Aggiungi alla cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Fallback in caso di errore di rete
            console.log('Service Worker: Fetch fallito, usando cache');
            return caches.match(event.request);
          });
      })
  );
});