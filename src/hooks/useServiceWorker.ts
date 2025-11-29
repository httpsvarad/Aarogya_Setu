import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Get existing service worker registration (VitePWA handles registration)
    if ('serviceWorker' in navigator) {
      getServiceWorkerRegistration();
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getServiceWorkerRegistration = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      
      if (reg) {
        console.log('Service Worker found:', reg);
        setRegistration(reg);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Check for updates on page load
        reg.update();
      }
    } catch (error) {
      console.error('Error getting Service Worker registration:', error);
    }
  };

  const handleOnline = () => {
    setIsOnline(true);
    // Trigger background sync
    if (registration && 'sync' in registration) {
      registration.sync.register('sync-dose-events');
    }
  };

  const handleOffline = () => {
    setIsOnline(false);
  };

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    registration,
    updateAvailable,
    isOnline,
    updateServiceWorker
  };
}