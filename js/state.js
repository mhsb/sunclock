// js/state.js - Simplified Clock State Management
class ClockState {
    constructor() {
        this.isRunning = false;
        this.interval = null;
    }

    // Start the clock with proper error handling
    start() {
        if (this.isRunning) {
            console.log('ClockState: Clock already running');
            return;
        }

        try {
            if (typeof window.startClock === 'function') {
                window.startClock();
                this.isRunning = true;
                console.log('ClockState: Clock started successfully');
            } else {
                console.error('ClockState: startClock function not available');
            }
        } catch (error) {
            console.error('ClockState: Failed to start clock:', error);
        }
    }

    // Stop the clock and cleanup
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        console.log('ClockState: Clock stopped');
    }

    // Restart the clock
    restart() {
        console.log('ClockState: Restarting clock...');
        this.stop();
        setTimeout(() => this.start(), 100);
    }

    // Public method to check if clock is running
    isClockRunning() {
        return this.isRunning;
    }

    // Cleanup method to be called on page unload
    cleanup() {
        this.stop();
        console.log('ClockState: Cleanup completed');
    }
}

// Initialize and expose globally
window.clockState = new ClockState();

// Simple initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('ClockState: DOM loaded');
});