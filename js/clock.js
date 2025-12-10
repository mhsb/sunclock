function startClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
    }

    if (!sunsetTime) {
        // No sunset time available, show a basic clock or try to estimate
        document.getElementById('clock').textContent = '--:--:--';
        return;
    }

    function updateClock() {
        const now = new Date();

        // Get the most recent sunset (either today or yesterday)
        const todaySunset = new Date(sunsetTime);
        todaySunset.setHours(todaySunset.getHours(), todaySunset.getMinutes(), todaySunset.getSeconds(), 0);
        const yesterdaySunset = new Date(todaySunset);
        yesterdaySunset.setDate(yesterdaySunset.getDate() - 1);

        // Determine which sunset to reference based on current time
        let referenceSunset;
        if (now >= todaySunset) {
            // After today's sunset, show time since today's sunset
            referenceSunset = todaySunset;
        } else if (now >= yesterdaySunset) {
            // Between yesterday's sunset and today's sunset, show time since yesterday's sunset
            referenceSunset = yesterdaySunset;
        } else {
            // Before yesterday's sunset (very unlikely), use yesterday's sunset
            referenceSunset = yesterdaySunset;
        }

        const timeSinceSunset = now - referenceSunset;
        const totalSeconds = Math.floor(Math.max(0, timeSinceSunset) / 1000);
        const hours = Math.floor(totalSeconds / 3600) % 24; // Keep within 24 hours
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('clock').textContent = display;

        // Update gradient
        updateGradient();
    }

    updateClock();
    clockInterval = setInterval(updateClock, 1000);
}

async function fetchSunsetTime() {
    const t = window.translations[currentLang];
    const statusDiv = document.getElementById('status');
    
    // Set a timeout to ensure clock starts regardless of API
    const clockTimeout = setTimeout(() => {
        if (window.clockState && !window.clockState.isRunning) {
            window.clockState.ensureClockIsRunning();
        }
    }, 5000);
    
    if (!locationData) {
        if (statusDiv) statusDiv.textContent = t.locationNotSet;
        clearTimeout(clockTimeout);
        if (window.clockState) window.clockState.ensureClockIsRunning();
        return;
    }

    if (statusDiv) {
        statusDiv.textContent = t.fetchingSunset;
        statusDiv.classList.add('loading');
    }

    const cached = localStorage.getItem('sunsetTimeCache');
    
    // OFFLINE GUARANTEE: If offline, immediately use cache or fallback
    if (!navigator.onLine) {
        if (statusDiv) {
            statusDiv.textContent = t.offline;
            statusDiv.classList.remove('loading');
        }
        
        let sunsetFromCache = null;
        
        if (cached) {
            try {
                const cachedData = JSON.parse(cached);
                sunsetFromCache = new Date(cachedData.sunsetTime);
                if (statusDiv) statusDiv.textContent = t.usingCachedOutdated;
            } catch (e) {
                console.error('Cache parse error:', e);
            }
        }
        
        window.sunsetTime = sunsetFromCache || window.sunsetTime;
        
        // GUARANTEED: Start clock regardless
        if (window.clockState) {
            window.clockState.ensureClockIsRunning();
        } else if (typeof window.startClock === 'function') {
            window.startClock();
        }
        
        clearTimeout(clockTimeout);
        return;
    }

    // Online logic continues...
    try {
        // ... existing API calls ...
    } catch (error) {
        // ... error handling ...
    } finally {
        // GUARANTEED: Always ensure clock runs
        clearTimeout(clockTimeout);
        if (window.clockState) {
            setTimeout(() => window.clockState.ensureClockIsRunning(), 100);
        }
    }
}

// Make functions available globally
window.startClock = startClock;
window.fetchSunsetTime = fetchSunsetTime;