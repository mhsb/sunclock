// onboarding-integration.js - Fixed location data passing
(function() {
    'use strict';

    let onboardingFrame = null;
    let mainAppHidden = false;

    function init() {
        console.log('Initializing onboarding integration');

        // Add message listener
        window.addEventListener('message', handleOnboardingMessage);

        // Check if onboarding should be shown
        const hasSeenOnboarding = localStorage.getItem('sunclock_onboarding_seen');

        if (!hasSeenOnboarding) {
            console.log('First visit - showing onboarding');
            showOnboarding();
        } else {
            console.log('Returning user - adding help icon');
            addHelpIcon();
        }
    }

    function showOnboarding() {
        console.log('Showing onboarding');

        // Hide main app
        hideMainApp();

        // Create or show onboarding iframe
        if (!onboardingFrame) {
            onboardingFrame = document.createElement('iframe');
            onboardingFrame.src = 'onboarding.html';
            onboardingFrame.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.95);
            `;
            document.body.appendChild(onboardingFrame);

            // Wait for iframe to load, then send initialization message
            onboardingFrame.onload = () => {
                console.log('Onboarding iframe loaded');
                // Give it a moment to initialize
                setTimeout(() => {
                    sendInitMessage();
                }, 500);
            };
        } else {
            onboardingFrame.style.display = 'block';
            hideMainApp();
            setTimeout(() => {
                sendInitMessage();
            }, 200);
        }

        // Also add help icon for future use
        addHelpIcon();
    }

    function sendInitMessage() {
        console.log('Sending init message to onboarding');
        const lang = window.currentLang || 'en';
        
        sendMessageToOnboarding({
            type: 'init',
            lang: lang
        });

        // Also send location data
        setTimeout(() => {
            sendLocationDataToOnboarding();
        }, 200);
    }

    function hideOnboarding() {
        if (!onboardingFrame) return;

        console.log('Hiding onboarding');
        onboardingFrame.style.display = 'none';
        showMainApp();
        localStorage.setItem('sunclock_onboarding_seen', 'true');
    }

    function addHelpIcon() {
        const existingIcon = document.querySelector('.help-icon');
        if (existingIcon) return; // Already exists

        const helpIcon = document.createElement('button');
        helpIcon.innerHTML = '?';
        helpIcon.className = 'help-icon';
        helpIcon.title = window.currentLang === 'fa' ? 'راهنما' : 'Help';
        helpIcon.onclick = () => showOnboarding();

        document.body.appendChild(helpIcon);
    }

    function hideMainApp() {
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.style.display = 'none';
            mainAppHidden = true;
        }
    }

    function showMainApp() {
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.style.display = 'block';
            mainAppHidden = false;
        }
    }

    function handleOnboardingMessage(event) {
        const data = event.data;
        console.log('Received message from onboarding:', data);

        switch (data.type) {
            // Update the onboardingComplete handler in onboarding-integration.js
            case 'onboardingComplete':
                console.log('Onboarding complete with location:', data.locationData);
                
                if (data.locationData) {
                    const englishCountry = data.locationData.country;
                    const englishCity = data.locationData.city;

                    // Store in localStorage
                    localStorage.setItem('sunsetClockLocation', JSON.stringify({
                        country: englishCountry,
                        city: englishCity
                    }));

                    // Update global locationData
                    window.locationData = {
                        country: englishCountry,
                        city: englishCity
                    };

                    // Update the input fields in the location panel
                    const countryInput = document.getElementById('country');
                    const cityInput = document.getElementById('city');
                    
                    if (countryInput && window.getTranslatedLocationName) {
                        countryInput.value = window.getTranslatedLocationName(englishCountry, 'countries');
                    }
                    
                    if (cityInput && window.getTranslatedLocationName) {
                        cityInput.value = window.getTranslatedLocationName(englishCity, 'cities');
                    }

                    // Update location display
                    if (typeof window.updateLocationInfo === 'function') {
                        window.updateLocationInfo();
                    }

                    // Fetch new sunset time
                    if (typeof window.fetchSunsetTime === 'function') {
                        window.fetchSunsetTime().then(() => {
                            // Start the clock after fetching sunset time
                            if (window.clockState && typeof window.clockState.start === 'function') {
                                window.clockState.start();
                            }
                        });
                    }

                    // Fetch prayer times if available
                    if (typeof window.fetchPrayerTimes === 'function') {
                        window.fetchPrayerTimes();
                    }
                }

                hideOnboarding();
                break;
                
            case 'skipOnboarding':
                hideOnboarding();
                break;

            case 'requestLocationData':
            case 'onboardingReady':
                console.log('Onboarding requesting location data');
                sendLocationDataToOnboarding();
                break;
        }
    }

    function sendLocationDataToOnboarding() {
        console.log('Preparing location data...');

        // Get the full countries list from your location.js
        const countries = [
            'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
            'Bangladesh', 'Belgium', 'Brazil', 'Bulgaria', 'Canada', 'Chile', 'China',
            'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Finland',
            'France', 'Germany', 'Greece', 'Hungary', 'India', 'Indonesia', 'Iran',
            'Iraq', 'Ireland', 'Italy', 'Japan', 'Jordan', 'Kenya',
            'Kuwait', 'Lebanon', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands',
            'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Peru', 'Philippines',
            'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia',
            'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
            'Syria', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates',
            'United Kingdom', 'United States', 'Venezuela', 'Vietnam', 'Yemen'
        ];

        // Translate country names
        const translatedCountries = countries.map(country => ({
            value: country,
            display: window.getTranslatedLocationName ? 
                window.getTranslatedLocationName(country, 'countries') : country
        }));

        // Build a simple cities data structure
        // We'll fetch cities dynamically in the onboarding, just like the main app does
        const citiesData = {};

        console.log('Sending location data:', {
            countriesCount: translatedCountries.length
        });

        sendMessageToOnboarding({
            type: 'locationData',
            countries: translatedCountries,
            citiesData: citiesData // Empty, will be fetched on-demand
        });
    }

    function sendMessageToOnboarding(message) {
        if (onboardingFrame && onboardingFrame.contentWindow) {
            try {
                onboardingFrame.contentWindow.postMessage(message, '*');
                console.log('Sent message to onboarding:', message.type);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }

    window.showOnboarding = showOnboarding;
    window.hideOnboarding = hideOnboarding;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
