// Modular translation system - content files are loaded in HTML head
window.translations = { en: {}, fa: {} };
window.currentLang = 'en'; // Default language

// Merge all loaded content into the translations object
function initializeTranslations() {
    // Merge interface texts
    if (window.uiTexts && window.uiTexts.interface) {
        Object.assign(window.translations.en, window.uiTexts.interface.en);
        Object.assign(window.translations.fa, window.uiTexts.interface.fa);
    }

    // Merge prayer texts
    if (window.uiTexts && window.uiTexts.prayer) {
        Object.assign(window.translations.en, window.uiTexts.prayer.en);
        Object.assign(window.translations.fa, window.uiTexts.prayer.fa);
    }

    // Merge country texts
    if (window.uiTexts && window.uiTexts.countries) {
        Object.assign(window.translations.en, window.uiTexts.countries.en);
        Object.assign(window.translations.fa, window.uiTexts.countries.fa);
    }

    // Merge city texts
    if (window.uiTexts && window.uiTexts.cities) {
        Object.assign(window.translations.en, window.uiTexts.cities.en);
        Object.assign(window.translations.fa, window.uiTexts.cities.fa);
    }

    // Merge about content
    if (window.aboutContent) {
        Object.assign(window.translations.en, window.aboutContent.en);
        Object.assign(window.translations.fa, window.aboutContent.fa);
    }

    // Merge onboarding content
    if (window.onboardingContent) {
        Object.assign(window.translations.en, window.onboardingContent.en);
        Object.assign(window.translations.fa, window.onboardingContent.fa);
    }

    // Set initial language from localStorage or default
    const savedLang = localStorage.getItem('sunsetClockLanguage');
    if (savedLang && window.translations[savedLang]) {
        window.currentLang = savedLang;
    }
}

// Initialize translations immediately since content files are loaded in HTML head
initializeTranslations();

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sunsetClockLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    // Keep the window-scoped copy in sync for modules that read window.currentLang
    window.currentLang = currentLang;
    
    const t = window.translations[lang];
    
    // Update all translatable elements
    const elements = {
        'title': t.title,
        'clockLabel': t.clockLabel,
        'countryLabel': t.countryLabel,
        'cityLabel': t.cityLabel,
        'saveBtn': t.saveBtn,
        'languageToggleText': lang === 'en' ? 'فا' : 'en',
        'prayerTitle': t.prayerTitle,
        'aboutTitle': t.aboutTitle,
        'aboutText': t.aboutText,
        'aboutTextSummary': t.aboutTextSummary,
        'aboutTextDetails': t.aboutTextDetails,
        'developerContactTitle': t.developerContactTitle,
        'contactWebsiteText': t.contactWebsiteText,
        'contactLinkText': t.contactLinkText,
        'tutorialText': t.tutorialText
    };
    
    for (const [id, text] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            if (id.includes('aboutText')) {
                element.innerHTML = text;
            } else {
                element.textContent = text;
            }
        }
    }
    
    // Update tab labels for Persian
    if (lang === 'fa') {
        const tabTech = document.getElementById('tabTech');
        const tabSummary = document.getElementById('tabSummary');
        const tabDetails = document.getElementById('tabDetails');
        if (tabTech) tabTech.textContent = 'فناوری';
        if (tabSummary) tabSummary.textContent = 'خلاصه';
        if (tabDetails) tabDetails.textContent = 'توضیحات';
    } else {
        const tabTech = document.getElementById('tabTech');
        const tabSummary = document.getElementById('tabSummary');
        const tabDetails = document.getElementById('tabDetails');
        if (tabTech) tabTech.textContent = 'Tech';
        if (tabSummary) tabSummary.textContent = 'Summary';
        if (tabDetails) tabDetails.textContent = 'Details';
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

    // Refresh location display with new language
    if (typeof window.refreshLocationDisplay === 'function') {
        window.refreshLocationDisplay();
    }
    // Re-render prayer times/names for the selected language
    if (typeof window.fetchPrayerTimes === 'function') {
        try { window.fetchPrayerTimes(); } catch (e) { /* ignore */ }
    }

    // Refresh clock display with new language format
    if (typeof window.formatTimeDisplay === 'function' && window.sunsetTime) {
        setTimeout(() => {
            // Force immediate clock display update with new format
            const clockElement = document.getElementById('clock');
            if (clockElement) {
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

                const display = window.formatTimeDisplay(hours, minutes, seconds);
                clockElement.innerHTML = display;
            }
        }, 100);
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