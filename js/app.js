// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        const swVersion = 'v2.1';
        const CACHE_NAME = `sunset-clock-${swVersion}`;
        
        const swCode = `
            const CACHE_NAME = '${CACHE_NAME}';
            const urlsToCache = [
                './manifest.json',
                './icons/icon.svg',
                './icons/icon-192.png',
                './icons/icon-512.png',
                './css/main.css',
                './css/components/layout.css',
                './css/components/controls.css',
                './css/components/panels.css',
                './js/utils.js',
                './js/state.js',
                './js/translations.js',
                './js/clock.js',
                './js/location.js',
                './js/prayertimes.js',
                './js/ui.js',
                './js/app.js'
            ];

            // Install event - cache all resources
            self.addEventListener('install', (event) => {
                console.log('[Service Worker] Installing...');
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            console.log('[Service Worker] Caching app shell');
                            return cache.addAll(urlsToCache);
                        })
                        .then(() => {
                            console.log('[Service Worker] Skip waiting');
                            return self.skipWaiting();
                        })
                );
            });

            // Activate event - clean old caches
            self.addEventListener('activate', (event) => {
                console.log('[Service Worker] Activating...');
                event.waitUntil(
                    caches.keys().then((cacheNames) => {
                        return Promise.all(
                            cacheNames.map((cacheName) => {
                                if (cacheName !== CACHE_NAME) {
                                    console.log('[Service Worker] Deleting old cache:', cacheName);
                                    return caches.delete(cacheName);
                                }
                            })
                        );
                    }).then(() => {
                        console.log('[Service Worker] Claiming clients');
                        return self.clients.claim();
                    })
                );
            });

            // Fetch event - Network First for HTML, Cache First for assets
            self.addEventListener('fetch', (event) => {
                // Skip non-GET requests and chrome-extension requests
                if (event.request.method !== 'GET' ||
                    event.request.url.startsWith('chrome-extension://')) {
                    return;
                }

                const url = new URL(event.request.url);

                // For HTML pages (navigation requests), use Network First strategy
                if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
                    event.respondWith(
                        fetch(event.request)
                            .then((networkResponse) => {
                                // If network succeeds, return it (don't cache HTML)
                                console.log('[Service Worker] Serving HTML from network:', event.request.url);
                                return networkResponse;
                            })
                            .catch(() => {
                                // If network fails, try cache, then fallback to offline page
                                return caches.match(event.request)
                                    .then((cachedResponse) => {
                                        if (cachedResponse) {
                                            console.log('[Service Worker] Serving cached HTML:', event.request.url);
                                            return cachedResponse;
                                        }
                                        // Return a simple offline page
                                        return new Response(\`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sunset Clock - Offline</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        h1 { margin-bottom: 20px; }
        p { margin-bottom: 30px; }
    </style>
</head>
<body>
    <h1>🌅 Sunset Clock</h1>
    <p>You are currently offline. Please check your internet connection and try again.</p>
    <p>The app will work normally when you're back online.</p>
</body>
</html>
                                        \`, {
                                            headers: { 'Content-Type': 'text/html' }
                                        });
                                    });
                            })
                    );
                } else {
                    // For assets (CSS, JS, images, etc.), use Cache First strategy
                    event.respondWith(
                        caches.match(event.request)
                            .then((cachedResponse) => {
                                // Return cached response if found
                                if (cachedResponse) {
                                    console.log('[Service Worker] Serving asset from cache:', event.request.url);
                                    return cachedResponse;
                                }

                                // Otherwise fetch from network
                                return fetch(event.request)
                                    .then((networkResponse) => {
                                        // Don't cache non-successful responses
                                        if (!networkResponse || networkResponse.status !== 200) {
                                            return networkResponse;
                                        }

                                        // Clone and cache the successful response
                                        const responseToCache = networkResponse.clone();
                                        caches.open(CACHE_NAME)
                                            .then((cache) => {
                                                cache.put(event.request, responseToCache);
                                                console.log('[Service Worker] Caching new asset:', event.request.url);
                                            });

                                        return networkResponse;
                                    })
                                    .catch(() => {
                                        console.log('[Service Worker] Asset not available offline:', event.request.url);
                                        // For assets, return a simple error response
                                        return new Response('Offline', {
                                            status: 408,
                                            headers: { 'Content-Type': 'text/plain' }
                                        });
                                    });
                            })
                    );
                }
            });
            // Listen for messages from the main thread
            self.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SKIP_WAITING') {
                    self.skipWaiting();
                }
            });
        `;

        // Create and register service worker
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swUrl, { scope: './' })
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);

                // Force immediate activation of waiting service worker
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }

                // Listen for new service worker becoming available
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available, skip waiting to activate immediately
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                        });
                    }
                });

                // Check for updates every 30 minutes
                setInterval(() => {
                    registration.update();
                }, 30 * 60 * 1000);

                // Force update on page load (after 2 seconds)
                setTimeout(() => {
                    registration.update();
                }, 2000);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // Initialize the app
    initializeApp();
});

function initializeApp() {
    // Set initial language
    window.setLanguage(currentLang);

    // Initialize countries
    if (typeof window.initializeCountries === 'function') {
        window.initializeCountries();
    }

    // Setup event listeners
    if (typeof window.setupEventListeners === 'function') {
        window.setupEventListeners();
    }

    // Ensure we have a fallback sunset time before starting anything
    if (!sunsetTime) {
        const now = new Date();
        const fallbackSunset = new Date(now);
        fallbackSunset.setHours(18, 0, 0, 0); // 6:00 PM
        if (now.getHours() < 18) {
            fallbackSunset.setDate(fallbackSunset.getDate() - 1);
        }
        sunsetTime = fallbackSunset;
        console.log('App: Set fallback sunset time:', sunsetTime);
    }

    // Start clock immediately with fallback time
    if (window.clockState) {
        window.clockState.start();
    }

    // Load saved location and update with real data if available
    if (typeof window.loadSavedLocation === 'function') {
        window.loadSavedLocation().then(() => {
            // Fetch prayer times after location is loaded
            if (typeof window.fetchPrayerTimes === 'function') {
                window.fetchPrayerTimes();
                if (typeof window.startPrayerUpdater === 'function') window.startPrayerUpdater();
            }
        }).catch((err) => {
            console.error('Error loading location:', err);
            // Location failed, but clock is already running with fallback time
        });
    }

    // Initial gradient update
    if (typeof window.updateGradient === 'function') {
        window.updateGradient();
    }

    // Initial offline status
    if (typeof window.updateOfflineStatus === 'function') {
        window.updateOfflineStatus(!navigator.onLine);
    }

    // Update gradient every minute
    setInterval(() => {
        if (typeof window.updateGradient === 'function') {
            window.updateGradient();
        }
    }, 60000);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.clockState) {
            window.clockState.cleanup();
        }
    });
    // PWA Install Prompt
    let deferredPrompt;
    const installButton = document.createElement('button');

    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA install prompt available');
        
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Create and show install button (optional)
        installButton.textContent = '📱 Install App';
        installButton.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(102, 126, 234, 0.9);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: none;
        `;
        
        document.body.appendChild(installButton);
        
        // Show button after 5 seconds
        setTimeout(() => {
            installButton.style.display = 'block';
        }, 5000);
        
        installButton.addEventListener('click', () => {
            // Hide button
            installButton.style.display = 'none';
            
            // Show the install prompt
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        });
    });

    // Track app installation
    window.addEventListener('appinstalled', (evt) => {
        console.log('PWA was installed');
        if (installButton.parentNode) {
            installButton.parentNode.removeChild(installButton);
        }
    });
}