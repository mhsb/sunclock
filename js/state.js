// js/state.js
class ClockState {
    constructor() {
        this.isRunning = false;
        this.lastUpdate = null;
        this.forceInterval = null;
        this.minimumInterval = null;
    }
    
    // ALWAYS ensure a clock is running
    ensureClockIsRunning() {
        if (this.isRunning) return;
        
        console.log('Ensuring clock is running...');
        
        // Method 1: Try to start the main clock
        if (window.sunsetTime && typeof window.startClock === 'function') {
            window.startClock();
            this.isRunning = true;
            return;
        }
        
        // Method 2: Start a fallback clock with estimated time
        this.startFallbackClock();
    }
    
    startFallbackClock() {
        console.log('Starting fallback clock...');
        
        // Clear any existing intervals
        if (this.forceInterval) clearInterval(this.forceInterval);
        if (window.clockInterval) clearInterval(window.clockInterval);
        
        // Set a default sunset time if none exists
        if (!window.sunsetTime) {
            const now = new Date();
            window.sunsetTime = new Date(now);
            window.sunsetTime.setHours(18, 0, 0, 0); // 6 PM default
            if (now.getHours() < 18) {
                window.sunsetTime.setDate(window.sunsetTime.getDate() - 1);
            }
        }
        
        // Start updating immediately
        this.updateFallbackClock();
        
        // Set interval for continuous updates
        this.forceInterval = setInterval(() => {
            this.updateFallbackClock();
        }, 1000);
        
        this.isRunning = true;
    }
    
    updateFallbackClock() {
        if (!window.sunsetTime) return;
        
        const now = new Date();
        const todaySunset = new Date(window.sunsetTime);
        todaySunset.setHours(todaySunset.getHours(), todaySunset.getMinutes(), todaySunset.getSeconds(), 0);
        const yesterdaySunset = new Date(todaySunset);
        yesterdaySunset.setDate(yesterdaySunset.getDate() - 1);
        
        let referenceSunset = todaySunset;
        if (now < todaySunset) {
            referenceSunset = yesterdaySunset;
        }
        
        const timeSinceSunset = now - referenceSunset;
        const totalSeconds = Math.floor(Math.max(0, timeSinceSunset) / 1000);
        const hours = Math.floor(totalSeconds / 3600) % 24;
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const clockElement = document.getElementById('clock');
        if (clockElement) {
            clockElement.textContent = display;
        }
        
        // Also update gradient if the function exists
        if (typeof window.updateGradient === 'function') {
            window.updateGradient();
        }
    }
    
    // Monitor and restart if stopped
    startWatchdog() {
        this.minimumInterval = setInterval(() => {
            const clockElement = document.getElementById('clock');
            if (clockElement) {
                const time = clockElement.textContent;
                // If clock shows default or hasn't changed in 2 seconds, restart
                if (time === '00:00:00' || time === '--:--:--') {
                    this.ensureClockIsRunning();
                }
            }
        }, 2000);
    }
}

// Create global instance
window.clockState = new ClockState();