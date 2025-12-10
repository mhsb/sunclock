// js/state.js - Guaranteed Clock Operation
class ClockState {
    constructor() {
        this.isRunning = false;
        this.forceInterval = null;
        this.watchdogInterval = null;
        this.lastUpdateTime = null;
    }
    
    // MAIN FUNCTION: Always ensure clock is running
    ensureClockIsRunning() {
        console.log('ClockState: Ensuring clock is running...');
        
        if (this.isRunning) {
            console.log('ClockState: Already running');
            return true;
        }
        
        // Try to use the main clock first
        if (this.tryStartMainClock()) {
            this.isRunning = true;
            return true;
        }
        
        // Fallback: Start our own clock
        console.log('ClockState: Starting fallback clock');
        this.startFallbackClock();
        return true;
    }
    
    tryStartMainClock() {
        try {
            // Check if we have sunset time
            if (!window.sunsetTime) {
                console.log('ClockState: No sunsetTime available');
                return false;
            }
            
            // Check if startClock function exists
            if (typeof window.startClock !== 'function') {
                console.log('ClockState: startClock function not available');
                return false;
            }
            
            // Try to start the main clock
            window.startClock();
            console.log('ClockState: Main clock started successfully');
            return true;
        } catch (error) {
            console.error('ClockState: Failed to start main clock:', error);
            return false;
        }
    }
    
    startFallbackClock() {
        console.log('ClockState: Starting fallback clock mechanism');
        
        // Clear any existing intervals
        this.stopAllIntervals();
        
        // Ensure we have a sunset time
        if (!window.sunsetTime) {
            console.log('ClockState: Creating default sunset time');
            this.createDefaultSunsetTime();
        }
        
        // Update immediately
        this.updateClockDisplay();
        
        // Start interval for continuous updates
        this.forceInterval = setInterval(() => {
            this.updateClockDisplay();
        }, 1000);
        
        this.isRunning = true;
        console.log('ClockState: Fallback clock started');
    }
    
    createDefaultSunsetTime() {
        const now = new Date();
        window.sunsetTime = new Date(now);
        window.sunsetTime.setHours(18, 0, 0, 0); // Default to 6 PM
        
        // If it's before 6 PM, use yesterday's sunset
        if (now.getHours() < 18) {
            window.sunsetTime.setDate(window.sunsetTime.getDate() - 1);
        }
        
        console.log('ClockState: Created default sunset time:', window.sunsetTime);
    }
    
    updateClockDisplay() {
        try {
            if (!window.sunsetTime) {
                console.log('ClockState: No sunset time for display');
                return;
            }
            
            const now = new Date();
            this.lastUpdateTime = now;
            
            // Calculate time since sunset
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
            
            // Format and display
            const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            const clockElement = document.getElementById('clock');
            if (clockElement) {
                clockElement.textContent = display;
            }
            
            // Update gradient if available
            if (typeof window.updateGradient === 'function') {
                window.updateGradient();
            }
            
        } catch (error) {
            console.error('ClockState: Error updating clock display:', error);
        }
    }
    
    startWatchdog() {
        console.log('ClockState: Starting watchdog');
        
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
        }
        
        this.watchdogInterval = setInterval(() => {
            this.monitorClock();
        }, 2000);
    }
    
    monitorClock() {
        const clockElement = document.getElementById('clock');
        if (!clockElement) {
            console.log('ClockState: No clock element found');
            this.ensureClockIsRunning();
            return;
        }
        
        const currentTime = clockElement.textContent;
        const now = new Date();
        
        // Check if clock is frozen or showing default
        if (currentTime === '00:00:00' || 
            currentTime === '--:--:--' ||
            (this.lastUpdateTime && (now - this.lastUpdateTime) > 3000)) {
            
            console.log('ClockState: Clock appears frozen, restarting...');
            this.isRunning = false;
            this.ensureClockIsRunning();
        }
    }
    
    stopAllIntervals() {
        if (this.forceInterval) {
            clearInterval(this.forceInterval);
            this.forceInterval = null;
        }
        if (window.clockInterval) {
            clearInterval(window.clockInterval);
            window.clockInterval = null;
        }
    }
    
    // Public method to force clock update
    forceUpdate() {
        this.updateClockDisplay();
    }
}

// Initialize and expose globally
window.clockState = new ClockState();

// Auto-start when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('ClockState: DOM loaded, initializing...');
    setTimeout(() => {
        window.clockState.startWatchdog();
        window.clockState.ensureClockIsRunning();
    }, 1000);
});

// Also start when window loads (extra safety)
window.addEventListener('load', () => {
    console.log('ClockState: Window loaded');
    setTimeout(() => {
        if (!window.clockState.isRunning) {
            window.clockState.ensureClockIsRunning();
        }
    }, 500);
});