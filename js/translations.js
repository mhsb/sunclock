window.translations = {
    en: {
        title: '🌅 Sunset Clock',
        clockLabel: 'Time since sunset',
        countryLabel: 'Country:',
        cityLabel: 'City:',
        saveBtn: 'Save Location',
        locationText: 'Loading location...',
        pleaseEnterLocation: 'Please enter your location',
        searchCountry: 'Search country...',
        selectCountryFirst: 'Select country first...',
        searchCity: 'Search city...',
        loadingCities: 'Loading cities...',
        noCountriesFound: 'No countries found',
        noCitiesFound: 'No cities found',
        pleaseSelectBoth: 'Please select both country and city',
        pleaseSelectValidCountry: 'Please select a valid country from the list',
        locationNotSet: 'Location not set',
        fetchingSunset: 'Fetching sunset time...',
        usingCached: 'Using cached sunset time',
        sunsetUpdated: 'Sunset time updated',
        errorFetching: 'Error fetching sunset time. Using cached data if available.',
        usingCachedOutdated: 'Using cached sunset time (may be outdated)',
        unableToLoad: 'Unable to load sunset time',
        offline: 'Offline - using cached sunset time',
        estimatedOffline: 'Estimated sunset time (offline)',
        settings: '⚙️',
        aboutTitle: 'About Sunset Clock',
        aboutText: '<p>Sunset Clock is a unique time display that shows time elapsed since the last sunset. The clock resets every day at sunset, creating a natural 24-hour cycle.</p><p>The background gradient changes throughout the day to reflect the time of day, transitioning from deep night blues to morning purples and afternoon oranges.</p><p>You can set your location to get accurate sunset times for your area. The app works offline using cached sunset times when internet is unavailable.</p>'
    },
    fa: {
        title: '🌅 ساعت غروب کوک',
        clockLabel: 'زمان از غروب',
        countryLabel: 'کشور:',
        cityLabel: 'شهر:',
        saveBtn: 'ذخیره موقعیت',
        locationText: 'در حال بارگذاری موقعیت...',
        pleaseEnterLocation: 'لطفاً موقعیت خود را وارد کنید',
        searchCountry: 'جستجوی کشور...',
        selectCountryFirst: 'ابتدا کشور را انتخاب کنید...',
        searchCity: 'جستجوی شهر...',
        loadingCities: 'در حال بارگذاری شهرها...',
        noCountriesFound: 'کشوری یافت نشد',
        noCitiesFound: 'شهری یافت نشد',
        pleaseSelectBoth: 'لطفاً کشور و شهر را انتخاب کنید',
        pleaseSelectValidCountry: 'لطفاً یک کشور معتبر از لیست انتخاب کنید',
        locationNotSet: 'موقعیت تنظیم نشده',
        fetchingSunset: 'در حال دریافت زمان غروب...',
        usingCached: 'استفاده از زمان غروب ذخیره شده',
        sunsetUpdated: 'زمان غروب به‌روزرسانی شد',
        errorFetching: 'خطا در دریافت زمان غروب. در صورت وجود، از داده‌های ذخیره شده استفاده می‌شود.',
        usingCachedOutdated: 'استفاده از زمان غروب ذخیره شده (ممکن است قدیمی باشد)',
        unableToLoad: 'امکان بارگذاری زمان غروب وجود ندارد',
        offline: 'آفلاین - استفاده از زمان غروب ذخیره شده',
        estimatedOffline: 'زمان غروب تخمینی (آفلاین)',
        settings: '⚙️',
        aboutTitle: 'درباره ساعت غروب',
        aboutText: '<p>ساعت غروب یک نمایش زمان منحصر به فرد است که زمان سپری شده از آخرین غروب را نشان می‌دهد. ساعت هر روز در زمان غروب بازنشانی می‌شود و یک چرخه طبیعی 24 ساعته ایجاد می‌کند.</p><p>گرادیان پس‌زمینه در طول روز تغییر می‌کند تا زمان روز را منعکس کند و از آبی‌های عمیق شب به بنفش‌های صبحگاهی و نارنجی‌های بعدازظهر تبدیل می‌شود.</p><p>می‌توانید موقعیت خود را تنظیم کنید تا زمان‌های دقیق غروب برای منطقه خود را دریافت کنید. این برنامه به صورت آفلاین کار می‌کند و از زمان‌های غروب ذخیره شده استفاده می‌کند.</p>'
    }
};

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sunsetClockLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    
    const t = window.translations[lang];
    
    // Update all translatable elements
    const elements = {
        'title': t.title,
        'clockLabel': t.clockLabel,
        'countryLabel': t.countryLabel,
        'cityLabel': t.cityLabel,
        'saveBtn': t.saveBtn,
        'languageToggleText': lang === 'en' ? 'فا' : 'en',
        'aboutTitle': t.aboutTitle,
        'aboutText': t.aboutText
    };
    
    for (const [id, text] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'aboutText') {
                element.innerHTML = text;
            } else {
                element.textContent = text;
            }
        }
    }
    
    // Update placeholders
    const countryInput = document.getElementById('country');
    const cityInput = document.getElementById('city');
    if (countryInput) countryInput.placeholder = t.searchCountry;
    if (cityInput) {
        cityInput.placeholder = window.selectedCountry ? t.searchCity : t.selectCountryFirst;
    }
    
    // Update location info if it exists
    if (typeof window.updateLocationInfo === 'function') {
        window.updateLocationInfo();
    }
}

function toggleLanguage() {
    const newLang = currentLang === 'en' ? 'fa' : 'en';
    setLanguage(newLang);
}

// Make functions available globally
window.setLanguage = setLanguage;
window.toggleLanguage = toggleLanguage;
window.currentLang = currentLang;