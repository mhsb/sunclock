// Global variables (shared across modules)
let sunsetTime = null;
let currentLang = localStorage.getItem('sunsetClockLanguage') || 'fa';
let locationData = null;
let clockInterval = null;

// Default values
const DEFAULT_COUNTRY = 'Iran';
const DEFAULT_CITY = 'Qom';

function updateGradient() {
    if (!sunsetTime) {
        // Default gradient
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        return;
    }

    const now = new Date();
    const todaySunset = new Date(sunsetTime);
    todaySunset.setHours(todaySunset.getHours(), todaySunset.getMinutes(), todaySunset.getSeconds(), 0);
    
    const yesterdaySunset = new Date(todaySunset);
    yesterdaySunset.setDate(yesterdaySunset.getDate() - 1);
    
    let referenceSunset = todaySunset;
    if (now < todaySunset) {
        referenceSunset = yesterdaySunset;
    }
    
    const hoursSinceSunset = (now - referenceSunset) / (1000 * 60 * 60);
    
    // Gradient colors based on time of day (0-24 hours since sunset)
    let color1, color2;
    
    if (hoursSinceSunset < 2) {
        // Early night - deep purple/blue
        color1 = '#1a1a2e';
        color2 = '#16213e';
    } else if (hoursSinceSunset < 6) {
        // Midnight - dark blue
        color1 = '#0f0c29';
        color2 = '#302b63';
    } else if (hoursSinceSunset < 10) {
        // Late night - deep blue
        color1 = '#1e3c72';
        color2 = '#2a5298';
    } else if (hoursSinceSunset < 14) {
        // Early morning - blue to purple
        color1 = '#667eea';
        color2 = '#764ba2';
    } else if (hoursSinceSunset < 18) {
        // Morning - purple to pink
        color1 = '#f093fb';
        color2 = '#f5576c';
    } else if (hoursSinceSunset < 22) {
        // Afternoon - orange to red
        color1 = '#fa709a';
        color2 = '#fee140';
    } else {
        // Evening - red to purple (approaching sunset)
        color1 = '#f5576c';
        color2 = '#764ba2';
    }
    
    document.body.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

function updateOfflineStatus(isOffline) {
    const statusDiv = document.getElementById('status');
    const t = window.translations[currentLang];

    if (isOffline) {
        statusDiv.innerHTML = `
            <div class="offline-indicator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                ${t.offline}
            </div>
        `;
    } else {
        if (statusDiv) {
            statusDiv.textContent = '';
        }
    }
}

function useFallbackSunsetTime() {
    const t = window.translations[currentLang];
    const statusDiv = document.getElementById('status');

    // Estimate sunset time based on location and season
    // Default to 6 PM local time as a reasonable fallback
    const now = new Date();
    const fallbackSunset = new Date(now);
    fallbackSunset.setHours(18, 0, 0, 0); // 6:00 PM

    // If current time is before 6 PM, use yesterday's sunset
    if (now.getHours() < 18) {
        fallbackSunset.setDate(fallbackSunset.getDate() - 1);
    }

    sunsetTime = fallbackSunset;
    if (statusDiv) {
        statusDiv.textContent = t.estimatedOffline;
    }
    if (typeof window.startClock === 'function') {
        window.startClock();
    }
}

function getMajorCitiesForCountry(country) {
    const majorCities = {
        'Iran': ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Qom', 'Ahvaz', 'Kermanshah', 'Urmia', 'Rasht', 'Zahedan', 'Hamadan', 'Kerman', 'Yazd', 'Ardabil', 'Bandar Abbas', 'Arak', 'Eslamshahr', 'Zanjan'],
        'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
        'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Edinburgh', 'Bristol', 'Cardiff', 'Belfast'],
        'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
        'Germany': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
        'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
        'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'],
        'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'],
        'Japan': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama'],
        'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xi\'an', 'Nanjing', 'Tianjin'],
        'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Surat'],
        'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
        'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
        'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don'],
        'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakir'],
        'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí'],
        'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan'],
        'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang'],
        'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Taif', 'Tabuk', 'Buraydah', 'Khamis Mushait'],
        'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Asyut', 'Ismailia'],
        'Pakistan': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Hyderabad', 'Peshawar', 'Islamabad', 'Quetta'],
        'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang', 'Makassar', 'Batam', 'Pekanbaru', 'Bandar Lampung'],
        'Bangladesh': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Comilla', 'Rangpur', 'Mymensingh', 'Barisal', 'Jessore'],
        'Philippines': ['Manila', 'Quezon City', 'Caloocan', 'Davao', 'Cebu', 'Zamboanga', 'Antipolo', 'Pasig', 'Cagayan de Oro', 'Valenzuela'],
        'Thailand': ['Bangkok', 'Nonthaburi', 'Pak Kret', 'Hat Yai', 'Nakhon Ratchasima', 'Chiang Mai', 'Udon Thani', 'Pattaya', 'Khon Kaen', 'Nakhon Si Thammarat'],
        'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Can Tho', 'Bien Hoa', 'Hue', 'Nha Trang', 'Vung Tau', 'Quy Nhon'],
        'Malaysia': ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Melaka', 'Kota Kinabalu', 'Kuching', 'Seremban'],
        'Singapore': ['Singapore'],
        'Iraq': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala', 'Nasiriyah', 'Amara', 'Samarra', 'Ramadi'],
        'Syria': ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Tartus', 'Deir ez-Zor', 'Raqqa', 'Idlib', 'Daraa'],
        'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek', 'Byblos', 'Batroun'],
        'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Russeifa', 'Wadi al-Sir', 'Aqaba', 'Madaba', 'Salt', 'Mafraq', 'Karak'],
        'Yemen': ['Sana\'a', 'Aden', 'Taiz', 'Hodeidah', 'Ibb', 'Dhamar', 'Al-Mukalla', 'Zinjibar', 'Sayyan', 'Lahij'],
        'Kuwait': ['Kuwait City', 'Al Ahmadi', 'Hawalli', 'Al Jahra', 'Al Farwaniyah', 'Salmiya', 'Mangaf', 'Mahboula', 'Abu Halifa', 'Fahaheel'],
        'Qatar': ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Dukhan', 'Mesaieed', 'Lusail', 'Al Shamal', 'Al Daayen', 'Umm Salal'],
        'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba']
    };

    if (majorCities[country]) {
        return majorCities[country].map(name => ({ name, country }));
    }
    
    return [];
}