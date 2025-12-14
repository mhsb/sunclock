let countriesList = [];
let citiesList = [];
let selectedCountry = null;
let filteredCountries = [];
let filteredCities = [];
let selectedCityCoords = null;

// Helper function to get translated location name
function getTranslatedLocationName(name, type = 'countries') {
    const lang = window.currentLang || 'en';
    const translations = window.translations && window.translations[lang];
    if (translations && translations[type] && translations[type][name]) {
        return translations[type][name];
    }
    return name; // Fallback to original name if no translation
}

// Helper function to get English name from translated name
function getEnglishLocationName(translatedName, type = 'countries') {
    const lang = window.currentLang || 'en';
    const translations = window.translations && window.translations[lang];

    if (translations && translations[type]) {
        // Find the English key for the translated value
        for (const [englishName, translatedValue] of Object.entries(translations[type])) {
            if (translatedValue === translatedName) {
                return englishName;
            }
        }
    }
    return translatedName; // Fallback to the input if no mapping found
}

async function initializeCountries() {
    countriesList = [
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

    // Sort based on translated names if in Persian mode
    const lang = window.currentLang || 'en';
    if (lang === 'fa') {
        countriesList.sort((a, b) => {
            const translatedA = getTranslatedLocationName(a, 'countries');
            const translatedB = getTranslatedLocationName(b, 'countries');
            return translatedA.localeCompare(translatedB, 'fa');
        });
    } else {
        countriesList.sort();
    }

    filteredCountries = [...countriesList];
    renderCountryDropdown();
}

function renderCountryDropdown() {
    const countryList = document.getElementById('countryList');
    if (!countryList) return;
    
    countryList.innerHTML = '';
    
    const t = window.translations[currentLang];
    
    if (filteredCountries.length === 0) {
        countryList.innerHTML = `<div class="dropdown-item">${t.noCountriesFound}</div>`;
        countryList.classList.add('show');
        return;
    }

    filteredCountries.forEach(country => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = getTranslatedLocationName(country, 'countries');
        item.onclick = () => selectCountry(country);
        countryList.appendChild(item);
    });
}

function renderCityDropdown() {
    const cityList = document.getElementById('cityList');
    if (!cityList) return;
    
    cityList.innerHTML = '';
    
    const t = window.translations[currentLang];
    
    if (filteredCities.length === 0) {
        cityList.innerHTML = `<div class="dropdown-item">${t.noCitiesFound}</div>`;
        cityList.classList.add('show');
        return;
    }

    filteredCities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = getTranslatedLocationName(city.name, 'cities');
        item.onclick = () => selectCity(city.name, city.lat, city.lon);
        cityList.appendChild(item);
    });
}

function selectCountry(country) {
    selectedCountry = country;
    document.getElementById('country').value = getTranslatedLocationName(country, 'countries');
    document.getElementById('countryList').classList.remove('show');
    document.getElementById('city').disabled = false;
    const t = window.translations[currentLang];
    document.getElementById('city').placeholder = t.searchCity;
    document.getElementById('city').value = '';
    citiesList = [];
    filteredCities = [];
    fetchCitiesForCountry(country);
}

function selectCity(city, lat, lon) {
    document.getElementById('city').value = getTranslatedLocationName(city, 'cities');
    document.getElementById('cityList').classList.remove('show');
    // Attach coordinates to a temporary object so saveLocation can persist them
    selectedCityCoords = null;
    if (lat && lon) {
        selectedCityCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };
        // If locationData already exists, update it immediately
        if (locationData) {
            locationData.lat = selectedCityCoords.lat;
            locationData.lon = selectedCityCoords.lon;
        }
    }
}

// Function to refresh location display when language changes
function refreshLocationDisplay() {
    if (locationData) {
        const countryInput = document.getElementById('country');
        const cityInput = document.getElementById('city');

        if (countryInput && locationData.country) {
            countryInput.value = getTranslatedLocationName(locationData.country, 'countries');
        }
        if (cityInput && locationData.city) {
            cityInput.value = getTranslatedLocationName(locationData.city, 'cities');
        }
    }
}

async function fetchCitiesForCountry(country) {
    const cityList = document.getElementById('cityList');
    const t = window.translations[currentLang];
    cityList.innerHTML = `<div class="loading-cities">${t.loadingCities}</div>`;
    cityList.classList.add('show');

    try {
        const searchUrl = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(country)}&maxRows=1000&featureClass=P&username=demo`;
        let response = await fetch(searchUrl);
        if (!response.ok) throw new Error('GeoNames failed');
        
        let data = await response.json();
        
        if (data.geonames && data.geonames.length > 0) {
            citiesList = data.geonames
                .filter(place => place.countryName === country || place.adminName1)
                .map(place => ({ name: place.name, country: place.countryName, lat: place.lat, lon: place.lng || place.lon }))
                .filter((city, index, self) => 
                    index === self.findIndex(c => c.name === city.name)
                )
                .sort((a, b) => {
                    const lang = window.currentLang || 'en';
                    if (lang === 'fa') {
                        const translatedA = getTranslatedLocationName(a.name, 'cities');
                        const translatedB = getTranslatedLocationName(b.name, 'cities');
                        return translatedA.localeCompare(translatedB, 'fa');
                    } else {
                        return a.name.localeCompare(b.name);
                    }
                });
            
            filteredCities = [...citiesList];
            renderCityDropdown();
        } else {
            citiesList = getMajorCitiesForCountry(country);
            // Sort by translated names when in Persian mode
            const lang = window.currentLang || 'en';
            if (lang === 'fa') {
                citiesList.sort((a, b) => {
                    const translatedA = getTranslatedLocationName(a.name, 'cities');
                    const translatedB = getTranslatedLocationName(b.name, 'cities');
                    return translatedA.localeCompare(translatedB, 'fa');
                });
            } else {
                citiesList.sort((a, b) => a.name.localeCompare(b.name));
            }
            filteredCities = [...citiesList];
            renderCityDropdown();
        }
    } catch (error) {
        console.error('Error fetching cities:', error);
        citiesList = getMajorCitiesForCountry(country);
        // Sort by translated names when in Persian mode
        const lang = window.currentLang || 'en';
        if (lang === 'fa') {
            citiesList.sort((a, b) => {
                const translatedA = getTranslatedLocationName(a.name, 'cities');
                const translatedB = getTranslatedLocationName(b.name, 'cities');
                return translatedA.localeCompare(translatedB, 'fa');
            });
        } else {
            citiesList.sort((a, b) => a.name.localeCompare(b.name));
        }
        filteredCities = [...citiesList];
        renderCityDropdown();
    }
}

// Try to geocode a city+country to lat/lon using Nominatim
async function geocodeLocation(country, city) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&format=json&limit=1`;
        const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!resp.ok) return null;
        const arr = await resp.json();
        if (!arr || arr.length === 0) return null;
        const r = arr[0];
        return { lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
    } catch (e) {
        console.error('Geocode error:', e);
        return null;
    }
}

async function loadSavedLocation() {
    const saved = localStorage.getItem('sunsetClockLocation');
    if (saved) {
        try {
            locationData = JSON.parse(saved);
            document.getElementById('country').value = locationData.country || '';
            document.getElementById('city').value = locationData.city || '';
            if (locationData.country) {
                selectedCountry = locationData.country;
                document.getElementById('city').disabled = false;
                const t = window.translations[currentLang];
                document.getElementById('city').placeholder = t.searchCity;
                await fetchCitiesForCountry(locationData.country);
                // If saved location lacks coordinates, try to geocode it
                if ((!locationData.lat || !locationData.lon) && locationData.city) {
                    const coords = await geocodeLocation(locationData.country, locationData.city);
                    if (coords) {
                        locationData.lat = coords.lat;
                        locationData.lon = coords.lon;
                        localStorage.setItem('sunsetClockLocation', JSON.stringify(locationData));
                    }
                }
            }
            updateLocationInfo();
            if (typeof window.fetchSunsetTime === 'function') {
                await window.fetchSunsetTime();
            }
            if (typeof window.fetchPrayerTimes === 'function') {
                window.fetchPrayerTimes();
            }
        } catch (e) {
            console.error('Error loading saved location:', e);
            await setDefaults();
        }
    } else {
        await setDefaults();
    }
}

async function setDefaults() {
    document.getElementById('country').value = getTranslatedLocationName(DEFAULT_COUNTRY, 'countries');
    selectedCountry = DEFAULT_COUNTRY;
    document.getElementById('city').disabled = false;
    const t = window.translations[currentLang];
    document.getElementById('city').placeholder = t.searchCity;
    
    try {
        await fetchCitiesForCountry(DEFAULT_COUNTRY);
        document.getElementById('city').value = getTranslatedLocationName(DEFAULT_CITY, 'cities');
        locationData = { country: DEFAULT_COUNTRY, city: DEFAULT_CITY };
        updateLocationInfo();
        if (typeof window.fetchSunsetTime === 'function') {
            await window.fetchSunsetTime();
        }
        if (typeof window.fetchPrayerTimes === 'function') {
            window.fetchPrayerTimes();
        }
    } catch (error) {
        console.error('Error setting defaults:', error);
        document.getElementById('city').value = getTranslatedLocationName(DEFAULT_CITY, 'cities');
        locationData = { country: DEFAULT_COUNTRY, city: DEFAULT_CITY };
        updateLocationInfo();
        if (typeof window.fetchSunsetTime === 'function') {
            await window.fetchSunsetTime();
        }
    }
}

function saveLocation() {
    const countryInput = document.getElementById('country').value.trim();
    const cityInput = document.getElementById('city').value.trim();
    const errorDiv = document.getElementById('error');
    const t = window.translations[currentLang];

    if (!countryInput || !cityInput) {
        errorDiv.textContent = t.pleaseSelectBoth;
        return;
    }

    // Convert translated names back to English for validation and storage
    const country = getEnglishLocationName(countryInput, 'countries');
    const city = getEnglishLocationName(cityInput, 'cities');

    if (!countriesList.includes(country)) {
        errorDiv.textContent = t.pleaseSelectValidCountry;
        return;
    }

    errorDiv.textContent = '';
    locationData = { country, city };
    // If user selected a city from the list and coordinates are known, attach them
    if (typeof selectedCityCoords !== 'undefined' && selectedCityCoords && selectedCityCoords.lat && selectedCityCoords.lon) {
        locationData.lat = selectedCityCoords.lat;
        locationData.lon = selectedCityCoords.lon;
    }

    // If coordinates are still missing, try to geocode once
    (async () => {
        if (!locationData.lat || !locationData.lon) {
            const coords = await geocodeLocation(country, city);
            if (coords) {
                locationData.lat = coords.lat;
                locationData.lon = coords.lon;
            }
        }
        localStorage.setItem('sunsetClockLocation', JSON.stringify(locationData));
        updateLocationInfo();
        if (typeof window.fetchSunsetTime === 'function') {
            window.fetchSunsetTime();
        }
        if (typeof window.fetchPrayerTimes === 'function') {
            window.fetchPrayerTimes();
        }
    })();

    document.getElementById('locationPanel').classList.remove('show');
}

function updateLocationInfo() {
    const locationText = document.getElementById('locationText');
    const t = window.translations[currentLang];
    if (locationData) {
        const translatedCity = getTranslatedLocationName(locationData.city, 'cities');
        const translatedCountry = getTranslatedLocationName(locationData.country, 'countries');
        locationText.textContent = `${translatedCity}, ${translatedCountry}`;
    } else {
        locationText.textContent = t.pleaseEnterLocation;
    }
}

// Make functions available globally
window.initializeCountries = initializeCountries;
window.selectCountry = selectCountry;
window.selectCity = selectCity;
window.fetchCitiesForCountry = fetchCitiesForCountry;
window.loadSavedLocation = loadSavedLocation;
window.saveLocation = saveLocation;
window.updateLocationInfo = updateLocationInfo;
window.refreshLocationDisplay = refreshLocationDisplay;
window.getEnglishLocationName = getEnglishLocationName;
window.selectedCountry = selectedCountry;