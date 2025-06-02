// ShoreSquad Application
const CONFIG = {
    API: {
        NEA_WEATHER: 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast',
        CACHE_DURATION: 300000 // 5 minutes
    },
    USER: {
        login: 'rllimkc05',
        timestamp: '2025-06-02 07:28:30'
    }
};

// Cache management
class Cache {
    constructor(duration) {
        this.duration = duration;
        this.store = new Map();
    }

    set(key, value) {
        this.store.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        
        const expired = Date.now() - item.timestamp > this.duration;
        if (expired) {
            this.store.delete(key);
            return null;
        }
        
        return item.value;
    }
}

// Weather Service
class WeatherService {
    constructor() {
        this.cache = new Cache(CONFIG.API.CACHE_DURATION);
    }

    async getWeather() {
        const cached = this.cache.get('weather');
        if (cached) return cached;

        try {
            const response = await fetch(CONFIG.API.NEA_WEATHER);
            if (!response.ok) throw new Error('Weather API error');
            
            const data = await response.json();
            this.cache.set('weather', data);
            return data;
        } catch (error) {
            console.error('Weather fetch error:', error);
            throw error;
        }
    }
}

// UI Management
class UI {
    constructor() {
        this.weatherWidget = document.querySelector('.weather-widget');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.timeDisplay = document.querySelector('.current-time');
    }

    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            this.loadingOverlay.style.display = 'none';
        }, 300);
    }

    updateWeather(data) {
        const forecast = data.items[0].general;
        const html = `
            <div class="weather-card">
                <div class="weather-info">
                    <h3>Current Forecast</h3>
                    <p>${forecast.forecast}</p>
                    <p>Temperature: ${forecast.temperature.low}°C - ${forecast.temperature.high}°C</p>
                    <p>Humidity: ${forecast.relative_humidity.low}% - ${forecast.relative_humidity.high}%</p>
                    <p>Wind: ${forecast.wind.speed.low} - ${forecast.wind.speed.high} km/h</p>
                </div>
            </div>
        `;
        this.weatherWidget.innerHTML = html;
    }

    showError(message) {
        const html = `
            <div class="error-message">
                <p>🚨 ${message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
        this.weatherWidget.innerHTML = html;
    }

    updateTime() {
        const now = new Date();
        this.timeDisplay.textContent = now.toISOString()
            .replace('T', ' ')
            .slice(0, 19) + ' UTC';
    }
}

// Main Application
class App {
    constructor() {
        this.weather = new WeatherService();
        this.ui = new UI();
    }

    async init() {
        this.ui.showLoading();
        
        try {
            // Start periodic updates
            this.startTimeUpdates();
            
            // Load weather data
            const weatherData = await this.weather.getWeather();
            this.ui.updateWeather(weatherData);
            
        } catch (error) {
            this.ui.showError('Could not load weather data. Please try again later.');
        } finally {
            this.ui.hideLoading();
        }
    }

    startTimeUpdates() {
        this.ui.updateTime();
        setInterval(() => this.ui.updateTime(), 1000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

// Export for testing
export { App, WeatherService, UI, Cache };
