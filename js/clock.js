function startClock() {
    try {
        if (clockInterval) {
            clearInterval(clockInterval);
        }

        if (!window.sunsetTime) {
            // No sunset time available, show a basic clock or try to estimate
            const clockElement = document.getElementById('clock');
            if (clockElement) {
                clockElement.textContent = '--:--:--';
            }
            return;
        }

        function updateClock() {
            try {
                const now = new Date();

                // Get the most recent sunset (either today or yesterday)
                const todaySunset = new Date(window.sunsetTime);
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

                const clockElement = document.getElementById('clock');
                if (clockElement) {
                    clockElement.textContent = display;
                }

                // Update gradient
                if (typeof updateGradient === 'function') {
                    updateGradient();
                }
            } catch (error) {
                console.error('Error updating clock:', error);
            }
        }

        updateClock();
        clockInterval = setInterval(updateClock, 1000);
    } catch (error) {
        console.error('Error starting clock:', error);
    }
}

async function fetchSunsetTime() {
    try {
        const t = window.translations && window.translations[currentLang] ? window.translations[currentLang] : {};
        const statusDiv = document.getElementById('status');
    
    if (!locationData) {
        if (statusDiv) statusDiv.textContent = t.locationNotSet || 'Location not set';
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

        // Start clock regardless
        if (window.clockState) {
            window.clockState.start();
        }

        return;
    }

    // Online logic continues...
    try {
        const latitude = locationData.lat;
        const longitude = locationData.lon;
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

        const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${dateStr}&formatted=0`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('API response not ok');
        
        const data = await response.json();
        if (data.results && data.results.sunset) {
            const sunsetISO = data.results.sunset; // ISO 8601 string in UTC
            const sunsetDate = new Date(sunsetISO);
            
            window.sunsetTime = sunsetDate;
            localStorage.setItem('sunsetTimeCache', JSON.stringify({
                sunsetTime: sunsetDate.toISOString(),
                date: dateStr,
                lat: latitude,
                lon: longitude
            }));
            
            if (statusDiv) {
                statusDiv.textContent = t.sunsetUpdated;
                statusDiv.classList.remove('loading');
            }
            
            window.clockState.isRunning = false; // Reset to allow restart
            if (typeof window.startClock === 'function') {
                window.startClock();
            }
        } else {
            throw new Error('No sunset data in response');
        }
    } catch (error) {
        console.error('Error fetching sunset time:', error);
        // Use cache or fallback
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
        
        if (sunsetFromCache) {
            window.sunsetTime = sunsetFromCache;
        }
        
        if (statusDiv && !sunsetFromCache) {
            statusDiv.textContent = t.errorFetching || 'Error fetching sunset time. Using cached data if available.';
            statusDiv.classList.remove('loading');
        }
    } finally {
        // Start clock with available data
        if (window.clockState) {
            setTimeout(() => window.clockState.start(), 100);
        }
    }
    } catch (error) {
        console.error('Critical error in fetchSunsetTime:', error);
        // Clock will continue with fallback sunset time set at app level
    }
}

// Make functions available globally
window.startClock = startClock;
window.fetchSunsetTime = fetchSunsetTime;