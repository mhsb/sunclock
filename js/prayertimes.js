// js/prayertimes.js - Prayer times module
// Uses Aladhan API to fetch prayer times based on latitude/longitude
// Caches results in localStorage for offline use

(function(){
    const CACHE_KEY = 'prayerTimesCache';
    const UPDATE_INTERVAL_MIN = 1; // minutes
    let updateTimer = null;

    function getCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) {
            // ignore
        }
    }

    function formatTimeForDisplay(timeStr) {
        // timeStr format from API is HH:MM (24h)
        return timeStr;
    }

    function minutesUntil(fromDate, toDate) {
        return Math.max(0, Math.round((toDate - fromDate) / 60000));
    }

    async function fetchPrayerTimes() {
        const t = window.translations && window.translations[window.currentLang] ? window.translations[window.currentLang] : null;
        const statusEl = document.getElementById('prayerStatus');

        if (!locationData || !locationData.lat || !locationData.lon) {
            // Try to use cached
            const cache = getCache();
            if (cache) {
                render(cache.timings, cache.dateReadable);
                if (statusEl) statusEl.textContent = t ? t.usingCached : 'Using cached prayer times';
            } else {
                if (statusEl) statusEl.textContent = t ? t.locationNotSet : 'Location not set';
            }
            return;
        }

        const latitude = locationData.lat;
        const longitude = locationData.lon;
        const today = new Date();
        const dateStr = today.toISOString().slice(0,10);

        // Check cache for today's data and same coords
        const cache = getCache();
        if (cache && cache.date === dateStr && cache.lat === latitude && cache.lon === longitude) {
            render(cache.timings, cache.dateReadable);
            if (statusEl) statusEl.textContent = t ? t.usingCached : 'Using cached prayer times';
            return;
        }

        if (statusEl) statusEl.textContent = t ? t.fetchingPrayers : 'Fetching prayer times...';

        const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=2`;

        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error('Network response not ok');
            const data = await resp.json();
            if (data && data.data && data.data.timings) {
                const timings = data.data.timings;
                const dateReadable = data.data.date.readable || dateStr;
                setCache({ date: dateStr, dateReadable, lat: latitude, lon: longitude, timings });
                render(timings, dateReadable);
                if (statusEl) statusEl.textContent = t ? t.prayerTimesUpdated : 'Prayer times updated';
            } else {
                throw new Error('Invalid data');
            }
        } catch (err) {
            // On error, use cache if available
            const cache2 = getCache();
            if (cache2) {
                render(cache2.timings, cache2.dateReadable);
                if (statusEl) statusEl.textContent = t ? t.usingCachedOutdated : 'Using cached prayer times (may be outdated)';
            } else {
                if (statusEl) statusEl.textContent = t ? t.errorFetchingPrayers : 'Error fetching prayer times';
            }
        }
    }

    function render(timings, dateReadable) {
        // Map to our required five prayers
        const keys = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
        const container = document.getElementById('prayerGrid');
        const statusEl = document.getElementById('prayerStatus');
        const t = window.translations && window.translations[window.currentLang] ? window.translations[window.currentLang] : null;
        if (!container) return;
        container.innerHTML = '';

        const now = new Date();
        let currentPrayerIndex = -1;
        let nextPrayerIndex = -1;
        let nextPrayerTime = null;

        // Get the reference sunset - use window.sunsetTime if available
        if (!window.sunsetTime) {
            console.warn('[Prayer Times] No sunsetTime available, cannot render prayer times');
            if (statusEl) statusEl.textContent = 'Sunset time not loaded yet';
            return;
        }

        const todaySunsetTime = window.sunsetTime;
        let referenceSunset = new Date(todaySunsetTime);
        referenceSunset.setSeconds(0, 0); // Remove seconds/ms

        // If current time is AFTER today's sunset, use today's sunset as reference
        // If current time is BEFORE today's sunset, use YESTERDAY's sunset as reference
        if (now < referenceSunset) {
            const yesterdaySunset = new Date(referenceSunset);
            yesterdaySunset.setDate(yesterdaySunset.getDate() - 1);
            referenceSunset = yesterdaySunset;
        }

        console.log('[Prayer Times Debug]');
        console.log('Now:', now);
        console.log('Reference Sunset:', referenceSunset);
        console.log('Sunset Time String:', referenceSunset.toString());

        // Build items with times relative to sunset
        keys.forEach((k, idx) => {
            const timeStr = timings[k];
            // Aladhan times may include (DST) or extra text; take first 5 chars
            const normalized = timeStr ? timeStr.split(' ')[0] : '--:--';
            
            // Parse prayer time in 24h format
            const [hh, mm] = normalized.split(':').map(n => parseInt(n,10));
            
            // Create prayer time for TODAY at the given hour:minute
            let prayerDate = new Date(now);
            prayerDate.setHours(hh, mm || 0, 0, 0);

            // Calculate milliseconds since the reference sunset
            let timeSinceSunset = prayerDate - referenceSunset;
            
            // If prayer is before reference sunset, add 1 day
            if (timeSinceSunset < 0) {
                prayerDate.setDate(prayerDate.getDate() + 1);
                timeSinceSunset = prayerDate - referenceSunset;
            }

            // Convert to HH:MM format (relative to sunset clock, no seconds)
            const totalSeconds = Math.floor(Math.max(0, timeSinceSunset) / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

            if (k === 'Maghrib') {
                console.log(`[${k}] API time: ${timeStr}, normalized: ${normalized}, prayerDate: ${prayerDate}, timeSinceSunset: ${timeSinceSunset}ms, display: ${display}`);
            }

            // Create item with name and time stacked vertically
            const item = document.createElement('div');
            item.className = 'prayer-item';
            
            const nameEl = document.createElement('div');
            nameEl.className = 'prayer-name';
            const nameText = (t && t['prayer'+k]) ? t['prayer'+k] : k;
            nameEl.textContent = nameText;
            
            const timeEl = document.createElement('div');
            timeEl.className = 'prayer-time';
            timeEl.textContent = display;
            
            item.appendChild(nameEl);
            item.appendChild(timeEl);
            container.appendChild(item);

            // Determine next/current prayer based on actual clock time
            if (now >= prayerDate) {
                currentPrayerIndex = idx;
            }
            if ((now < prayerDate) && nextPrayerIndex === -1) {
                nextPrayerIndex = idx;
                nextPrayerTime = prayerDate;
            }
        });

        // Update highlights
        const items = container.querySelectorAll('.prayer-item');
        items.forEach((el, i) => {
            el.classList.remove('current');
            el.classList.remove('next');
            if (i === currentPrayerIndex) el.classList.add('current');
            if (i === nextPrayerIndex) el.classList.add('next');
        });

        // If no nextPrayer found (we are after Isha), set next to Fajr tomorrow
        if (nextPrayerIndex === -1) {
            const f = timings.Fajr.split(' ')[0];
            const [hh, mm] = f.split(':').map(n=>parseInt(n,10));
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(hh, mm || 0, 0, 0);
            nextPrayerTime = tomorrow;
            nextPrayerIndex = 0; // Fajr
        }

        // Update status
        if (statusEl) {
            if (nextPrayerTime) {
                const mins = minutesUntil(now, nextPrayerTime);
                const nextName = (t && nextPrayerIndex !== -1 && t['prayer'+['Fajr','Dhuhr','Asr','Maghrib','Isha'][nextPrayerIndex]]) ? t['prayer'+['Fajr','Dhuhr','Asr','Maghrib','Isha'][nextPrayerIndex]] : 'Next';
                const nextText = (t && t.nextPrayer) ? t.nextPrayer.replace('{name}', nextName).replace('{mins}', mins) : `Next: ${nextName} in ${mins} minutes`;
                statusEl.textContent = nextText;
            } else {
                statusEl.textContent = '';
            }
        }
    }

    function startUpdater() {
        if (updateTimer) clearInterval(updateTimer);
        updateTimer = setInterval(() => {
            fetchPrayerTimes();
        }, UPDATE_INTERVAL_MIN * 60000);
    }

    // Expose
    window.fetchPrayerTimes = fetchPrayerTimes;
    window.startPrayerUpdater = function(){ startUpdater(); };

    // Auto-run when module loads if possible
    document.addEventListener('DOMContentLoaded', () => {
        // Fetch initially if locationData available later initializeApp will call fetchPrayerTimes
        const cache = getCache();
        if (cache) {
            render(cache.timings, cache.dateReadable);
        }
        startUpdater();
    });
})();
