function toggleLocationPanel() {
    const panel = document.getElementById('locationPanel');
    panel.classList.toggle('show');
}

function switchTab(tabName) {
    // Remove active class from all tabs and contents
    const tabButtons = document.querySelectorAll('.about-tab-btn');
    const tabContents = document.querySelectorAll('.about-tab-content');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`tabContent${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    
    if (selectedBtn) selectedBtn.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
}

function toggleAbout() {
    const aboutPanel = document.getElementById('aboutPanel');
    const mainContainer = document.getElementById('mainContainer');
    
    if (aboutPanel.classList.contains('show')) {
        closeAbout();
    } else {
        aboutPanel.classList.add('show');
        mainContainer.classList.add('main-hidden');
    }
}

function closeAbout() {
    const aboutPanel = document.getElementById('aboutPanel');
    const mainContainer = document.getElementById('mainContainer');

    aboutPanel.classList.remove('show');
    mainContainer.classList.remove('main-hidden');
}

function setupEventListeners() {
    const countryInput = document.getElementById('country');
    const cityInput = document.getElementById('city');
    const languageToggle = document.getElementById('languageToggle');
    const locationToggleBtn = document.getElementById('locationToggleBtn');
    const aboutToggleBtn = document.getElementById('aboutToggleBtn');
    const aboutCloseBtn = document.getElementById('aboutCloseBtn');
    const saveBtn = document.getElementById('saveBtn');

    // Language toggle
    if (languageToggle) {
        languageToggle.addEventListener('click', window.toggleLanguage);
    }

    // Location panel toggle
    if (locationToggleBtn) {
        locationToggleBtn.addEventListener('click', toggleLocationPanel);
    }

    // About panel toggle
    if (aboutToggleBtn) {
        aboutToggleBtn.addEventListener('click', toggleAbout);
    }

    // About close button
    if (aboutCloseBtn) {
        aboutCloseBtn.addEventListener('click', closeAbout);
    }

    // About tabs
    const tabButtons = document.querySelectorAll('.about-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Save location button
    if (saveBtn) {
        saveBtn.addEventListener('click', window.saveLocation);
    }

    // Country dropdown
    if (countryInput) {
        countryInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filteredCountries = countriesList.filter(country => 
                country.toLowerCase().includes(searchTerm)
            );
            renderCountryDropdown();
            document.getElementById('countryList').classList.add('show');
        });

        countryInput.addEventListener('focus', () => {
            if (countryInput.value === '') {
                filteredCountries = [...countriesList];
                renderCountryDropdown();
            }
            document.getElementById('countryList').classList.add('show');
        });
    }

    // City dropdown
    if (cityInput) {
        cityInput.addEventListener('input', (e) => {
            if (!selectedCountry) return;
            const searchTerm = e.target.value.toLowerCase();
            filteredCities = citiesList.filter(city => 
                city.name.toLowerCase().includes(searchTerm)
            );
            renderCityDropdown();
            document.getElementById('cityList').classList.add('show');
        });

        cityInput.addEventListener('focus', () => {
            if (!selectedCountry) return;
            if (cityInput.value === '') {
                filteredCities = [...citiesList];
                renderCityDropdown();
            }
            document.getElementById('cityList').classList.add('show');
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
            const countryList = document.getElementById('countryList');
            const cityList = document.getElementById('cityList');
            if (countryList) countryList.classList.remove('show');
            if (cityList) cityList.classList.remove('show');
        }
    });

    // Close location panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('locationPanel');
        const toggleBtn = document.getElementById('locationToggleBtn');
        if (panel && panel.classList.contains('show') && 
            !panel.contains(e.target) && 
            toggleBtn && !toggleBtn.contains(e.target)) {
            panel.classList.remove('show');
        }
    });

    // Close about panel when clicking outside the content area
    document.addEventListener('click', (e) => {
        const aboutPanel = document.getElementById('aboutPanel');
        const aboutContent = document.querySelector('.about-content');
        const aboutToggleBtn = document.getElementById('aboutToggleBtn');
        
        if (aboutPanel && aboutPanel.classList.contains('show') && 
            aboutContent && !aboutContent.contains(e.target) && 
            aboutToggleBtn && !aboutToggleBtn.contains(e.target)) {
            closeAbout();
        }
    });

    // Close about panel with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            const aboutPanel = document.getElementById('aboutPanel');
            if (aboutPanel && aboutPanel.classList.contains('show')) {
                closeAbout();
            }
        }
    });

    // Network status listeners
    window.addEventListener('online', () => {
        if (locationData && typeof window.fetchSunsetTime === 'function') {
            window.fetchSunsetTime();
        }
    });

    window.addEventListener('offline', () => {
        updateOfflineStatus(true);
        // Ensure clock keeps running with cached data when offline
        if (sunsetTime && !clockInterval && typeof window.startClock === 'function') {
            window.startClock();
        }
    });

    window.addEventListener('online', () => {
        updateOfflineStatus(false);
        // Refresh sunset time when coming back online
        if (locationData && typeof window.fetchSunsetTime === 'function') {
            window.fetchSunsetTime();
        }
    });
    // Add to setupEventListeners()
    window.addEventListener('offline', () => {
        updateOfflineStatus(true);
        // GUARANTEED: Always restart clock when going offline
        setTimeout(() => {
            if (window.clockState) {
                window.clockState.ensureClockIsRunning();
            }
        }, 500);
    });

    window.addEventListener('online', () => {
        updateOfflineStatus(false);
        // Refresh but don't stop existing clock
        if (locationData && typeof window.fetchSunsetTime === 'function') {
            window.fetchSunsetTime();
        }
    });
}

// Make functions available globally
window.toggleLocationPanel = toggleLocationPanel;
window.toggleAbout = toggleAbout;
window.closeAbout = closeAbout;
window.setupEventListeners = setupEventListeners;