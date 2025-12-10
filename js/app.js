// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        const swCode = `
            const CACHE_NAME = 'sunset-clock-v1';
            const urlsToCache = [
                './',
                './index.html',
                './manifest.json',
                './icons/icon.svg',
                './css/main.css',
                './css/components/layout.css',
                './css/components/controls.css',
                './css/components/panels.css',
                './js/utils.js',
                './js/translations.js',
                './js/clock.js',
                './js/location.js',
                './js/ui.js',
                './js/app.js',
                'https://v1.fontapi.ir/css/Vazir',
                'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap',
                'https://cdn.jsdelivr.net/gh/rastikerdar/vazirfont@v30.1.0/dist/font-face.css'
            ];

            self.addEventListener('install', (e) => {
                e.waitUntil(
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.addAll(urlsToCache))
                        .then(() => self.skipWaiting())
                );
            });

            self.addEventListener('activate', (e) => {
                e.waitUntil(
                    caches.keys().then((cacheNames) => {
                        return Promise.all(
                            cacheNames.map((cacheName) => {
                                if (cacheName !== CACHE_NAME) {
                                    return caches.delete(cacheName);
                                }
                            })
                        );
                    }).then(() => self.clients.claim())
                );
            });

            self.addEventListener('fetch', (e) => {
                e.respondWith(
                    caches.match(e.request)
                        .then((response) => {
                            if (response) {
                                return response;
                            }
                            return fetch(e.request).catch(() => {
                                // Return a fallback for navigation requests
                                if (e.request.mode === 'navigate') {
                                    return caches.match('./');
                                }
                            });
                        })
                );
            });
        `;
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        navigator.serviceWorker.register(swUrl).catch(() => {});
    }

    // Prevent refresh when offline
    window.addEventListener('beforeunload', (e) => {
        if (!navigator.onLine) {
            e.preventDefault();
            e.returnValue = '';
            const t = window.translations[currentLang];
            const offlineMessage = currentLang === 'fa' ?
                'شما در حالت آفلاین هستید. لطفاً اتصال اینترنت خود را بررسی کنید.' :
                'You are offline. Please check your internet connection.';
            alert(offlineMessage);
            return false;
        }
    });

    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            initializeApp();
        });
    } else {
        // Fallback if font loading API not available
        setTimeout(initializeApp, 500);
    }
});

function initializeApp() {
    // Set initial language
    window.setLanguage(currentLang);
    
    // Initialize clock state FIRST
    if (window.clockState) {
        window.clockState.startWatchdog();
    }
    
    // Initialize countries
    if (typeof window.initializeCountries === 'function') {
        window.initializeCountries();
    }
    
    // Setup event listeners
    if (typeof window.setupEventListeners === 'function') {
        window.setupEventListeners();
    }
    
    // Load saved location
    if (typeof window.loadSavedLocation === 'function') {
        window.loadSavedLocation();
    } else {
        // If location fails, still ensure clock runs
        setTimeout(() => {
            if (window.clockState) {
                window.clockState.ensureClockIsRunning();
            }
        }, 1000);
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
    
    // Final safety net: ensure clock starts within 3 seconds
    setTimeout(() => {
        if (window.clockState) {
            window.clockState.ensureClockIsRunning();
        }
    }, 3000);
}