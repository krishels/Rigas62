/**
 * Rigas62 Home Documentation System
 * Service Worker for Offline Support
 */

const CACHE_NAME = 'rigas62-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './data.json',
    './manifest.json',
    './icons/home.svg',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // For media files (photos/videos), use cache-first with network fallback
    if (url.pathname.includes('/media/')) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request)
                        .then((networkResponse) => {
                            // Clone the response before caching
                            const responseToCache = networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });

                            return networkResponse;
                        })
                        .catch(() => {
                            // Return placeholder for images if offline
                            if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                                return new Response(
                                    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
                                        <rect fill="#252542" width="400" height="300"/>
                                        <text fill="#6366f1" font-family="sans-serif" font-size="16" x="200" y="150" text-anchor="middle">Image unavailable offline</text>
                                    </svg>`,
                                    {
                                        headers: { 'Content-Type': 'image/svg+xml' }
                                    }
                                );
                            }
                        });
                })
        );
        return;
    }

    // For static assets, use stale-while-revalidate strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                const fetchPromise = fetch(request)
                    .then((networkResponse) => {
                        // Update cache with fresh response
                        if (networkResponse.ok) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed, cached response will be used
                        console.log('Network unavailable for:', request.url);
                    });

                // Return cached response immediately, update in background
                return cachedResponse || fetchPromise;
            })
    );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }

    if (event.data.action === 'clearCache') {
        caches.delete(CACHE_NAME)
            .then(() => {
                console.log('Cache cleared');
            });
    }
});
