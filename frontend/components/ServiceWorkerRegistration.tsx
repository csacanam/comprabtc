'use client';

/**
 * SERVICE WORKER REGISTRATION
 * ===========================
 * Componente que registra el Service Worker para habilitar la PWA.
 * Se monta una sola vez en el layout principal.
 */

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Solo registramos en producción o si el navegador soporta SW
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Esperamos a que la página cargue completamente
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registrado:', registration.scope);
            
            // Verificamos si hay actualizaciones
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Hay una nueva versión disponible
                    console.log('[PWA] Nueva versión disponible');
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('[PWA] Error registrando Service Worker:', error);
          });
      });
    }
  }, []);

  // Este componente no renderiza nada visible
  return null;
}
