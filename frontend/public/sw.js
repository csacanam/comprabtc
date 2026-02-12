/**
 * SERVICE WORKER - CompraBTC PWA
 * =============================
 * Maneja el cache offline y las actualizaciones de la app.
 * Este es un SW básico pero funcional para una PWA instalable.
 */

const CACHE_NAME = 'saka-dca-v1';

// Archivos esenciales para funcionar offline
const STATIC_ASSETS = [
  '/',
  '/login',
  '/signup',
  '/app',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

/**
 * INSTALL: Se ejecuta cuando el SW se instala por primera vez.
 * Pre-cachea los archivos estáticos esenciales.
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-cacheando archivos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Activa inmediatamente sin esperar a que se cierren las pestañas
        return self.skipWaiting();
      })
  );
});

/**
 * ACTIVATE: Se ejecuta cuando el SW toma control.
 * Limpia caches antiguos si existen.
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Eliminando cache antiguo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Toma control de todas las páginas inmediatamente
        return self.clients.claim();
      })
  );
});

/**
 * FETCH: Intercepta todas las peticiones de red.
 * Estrategia: Network First, fallback a Cache.
 * - Intenta obtener de la red primero (datos frescos)
 * - Si falla, usa el cache (funciona offline)
 */
self.addEventListener('fetch', (event) => {
  // Solo manejamos peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignoramos peticiones a APIs externas o analytics
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    // Intenta la red primero
    fetch(event.request)
      .then((networkResponse) => {
        // Si la respuesta es válida, la guardamos en cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si la red falla, buscamos en cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Si no hay cache y es una navegación, mostramos la página principal
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // Para otros recursos, retornamos un error genérico
            return new Response('Offline - recurso no disponible', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

/**
 * MESSAGE: Escucha mensajes desde la app.
 * Útil para forzar actualizaciones o limpiar cache.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
  }
});
