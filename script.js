const apiKey = "ca8be2ab9a1b4250071a018b220fc421";

const state = {
    unit: localStorage.getItem("unit") || "metric",
    lastCity: localStorage.getItem("lastCity") || "",
    lastLocation: null
};

const elements = {
    form: document.getElementById("search-form"),
    input: document.getElementById("city-input"),
    geoBtn: document.getElementById("geo-btn"),
    status: document.getElementById("status"),
    history: document.getElementById("history"),
    temp: document.getElementById("temp"),
    summary: document.getElementById("summary"),
    locationTime: document.getElementById("location-time"),
    icon: document.getElementById("weather-icon"),
    feelsLike: document.getElementById("feels-like"),
    humidity: document.getElementById("humidity"),
    wind: document.getElementById("wind"),
    pressure: document.getElementById("pressure"),
    visibility: document.getElementById("visibility"),
    sunrise: document.getElementById("sunrise"),
    forecast: document.getElementById("forecast")
};

const unitButtons = Array.from(document.querySelectorAll(".unit-btn"));

const iconMap = [
    { match: ["clear"], icon: "☀️" },
    { match: ["rain", "drizzle", "thunder"], icon: "🌧️" },
    { match: ["snow"], icon: "❄️" },
    { match: ["mist", "fog", "haze"], icon: "🌫️" },
    { match: ["cloud"], icon: "☁️" }
];

function init() {
    elements.input.value = state.lastCity;
    setUnitButtons();
    loadHistory();

    elements.form.addEventListener("submit", event => {
        event.preventDefault();
        const city = elements.input.value.trim();
        if (city) {
            fetchByCity(city);
        }
    });

    elements.geoBtn.addEventListener("click", () => {
        getWeatherByLocation();
    });

    unitButtons.forEach(button => {
        button.addEventListener("click", () => {
            const nextUnit = button.dataset.unit;
            if (state.unit !== nextUnit) {
                state.unit = nextUnit;
                localStorage.setItem("unit", state.unit);
                setUnitButtons();
                refreshLastLocation();
            }
        });
    });

    if (state.lastCity) {
        fetchByCity(state.lastCity);
    } else {
        getWeatherByLocation();
    }

    // Removed the following event listener:
    // alertForm.addEventListener("submit", ...);

    // Removed the following variables:
    // - alertCondition
    // - alertThreshold
    // - alertInterval

    // Removed the following HTML element references:
    // - alertForm
    // - alertStatus

    // Removed the following functions:
    // - checkWeatherAlarm
    // - triggerAlarm

    // Removed the following code blocks:
    // - Set Weather Alarm feature
    // - Related HTML elements and logic

    // Removed the following code blocks:
    // - Weather Alert notifications for Sri Lanka
    // - Related functions and logic

    // Removed the following code blocks:
    // - Periodic fetching of weather alerts
    // - Initial call to fetch weather alerts

    // Removed the following code blocks:
    // - fetchSriLankaWeatherAlerts
    // - generateSriLankaAlerts
    // - sendBrowserNotification
    // - setInterval

    // Removed the following code blocks:
    // - fetchByCoords
    // - fetchByCity
    // - fetchJson
    // - displayCurrent
    // - displayForecast
    // - groupForecastByDay
    // - pickClosestToHour
    // - toLocalDate
    // - formatLocalDay
    // - formatLocalDateTime
    // - formatLocalTime
    // - resolveIcon
    // - capitalize
    // - getWeatherByLocation
}

function setUnitButtons() {
    unitButtons.forEach(button => {
        button.classList.toggle("is-active", button.dataset.unit === state.unit);
    });
}

function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.classList.toggle("is-error", isError);
}

function saveHistory(city) {
    const history = JSON.parse(localStorage.getItem("cities")) || [];
    const trimmedCity = city.trim();

    const nextHistory = history.filter(item => item.toLowerCase() !== trimmedCity.toLowerCase());
    nextHistory.unshift(trimmedCity);

    localStorage.setItem("cities", JSON.stringify(nextHistory.slice(0, 6)));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem("cities")) || [];
    elements.history.innerHTML = "";

    history.forEach(city => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chip";
        button.textContent = city;
        button.addEventListener("click", () => {
            elements.input.value = city;
            fetchByCity(city);
        });
        elements.history.appendChild(button);
    });
}

function refreshLastLocation() {
    if (!state.lastLocation) return;

    if (state.lastLocation.type === "city") {
        fetchByCity(state.lastLocation.value, true);
        return;
    }

    if (state.lastLocation.type === "coords") {
        fetchByCoords(state.lastLocation.value.lat, state.lastLocation.value.lon, true);
    }
}

function fetchByCity(city, isRefresh = false) {
    if (!isRefresh) {
        setStatus("Loading weather...", false);
    }

    state.lastLocation = { type: "city", value: city };
    localStorage.setItem("lastCity", city);

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${state.unit}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${state.unit}`;

    Promise.all([fetchJson(currentUrl), fetchJson(forecastUrl)])
        .then(([current, forecast]) => {
            if (current.cod && Number(current.cod) !== 200) {
                throw new Error(current.message || "City not found");
            }
            if (forecast.cod && Number(forecast.cod) !== 200) {
                throw new Error(forecast.message || "Forecast not available");
            }
            displayCurrent(current);
            displayForecast(forecast, current.timezone);
            saveHistory(city);
            setStatus(`Updated ${formatLocalTime(current.dt, current.timezone)}`);
        })
        .catch(error => {
            setStatus(error.message || "Unable to load weather", true);
        });
}

function fetchByCoords(lat, lon, isRefresh = false) {
    if (!isRefresh) {
        setStatus("Detecting location...", false);
    }

    state.lastLocation = { type: "coords", value: { lat, lon } };

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${state.unit}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${state.unit}`;

    Promise.all([fetchJson(currentUrl), fetchJson(forecastUrl)])
        .then(([current, forecast]) => {
            if (current.cod && Number(current.cod) !== 200) {
                throw new Error(current.message || "Location not found");
            }
            if (forecast.cod && Number(forecast.cod) !== 200) {
                throw new Error(forecast.message || "Forecast not available");
            }
            displayCurrent(current);
            displayForecast(forecast, current.timezone);
            setStatus(`Updated ${formatLocalTime(current.dt, current.timezone)}`);
        })
        .catch(error => {
            setStatus(error.message || "Unable to load weather", true);
        });
}

function fetchJson(url) {
    return fetch(url).then(response => {
        if (!response.ok) {
            throw new Error("Weather service error");
        }
        return response.json();
    });
}

function displayCurrent(data) {
    const description = data.weather[0].description;
    const icon = resolveIcon(description);
    const tempUnit = state.unit === "metric" ? "C" : "F";

    elements.icon.textContent = icon;
    elements.temp.textContent = `${Math.round(data.main.temp)}°${tempUnit}`;
    elements.summary.textContent = `${capitalize(description)} in ${data.name}`;
    elements.locationTime.textContent = formatLocalDateTime(data.dt, data.timezone);
    elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°${tempUnit}`;
    elements.humidity.textContent = `${data.main.humidity}%`;
    elements.wind.textContent = `${Math.round(data.wind.speed)} ${state.unit === "metric" ? "m/s" : "mph"}`;
    elements.pressure.textContent = `${data.main.pressure} hPa`;
    elements.visibility.textContent = data.visibility ? `${Math.round(data.visibility / 1000)} km` : "--";
    elements.sunrise.textContent = formatLocalTime(data.sys.sunrise, data.timezone);
}

function displayForecast(forecast, timezoneOffset) {
    const groups = groupForecastByDay(forecast.list || [], timezoneOffset);
    elements.forecast.innerHTML = "";

    groups.slice(0, 5).forEach((day, index) => {
        const item = document.createElement("div");
        item.className = "forecast-item";
        item.style.setProperty("--delay", `${index * 80}ms`);

        item.innerHTML = `
            <div class="day">${day.label}</div>
            <div class="forecast-icon">${day.icon}</div>
            <div class="range">${day.min}° / ${day.max}°</div>
            <div class="range">${day.summary}</div>
        `;

        elements.forecast.appendChild(item);
    });
}

function groupForecastByDay(entries, timezoneOffset) {
    const days = new Map();

    entries.forEach(entry => {
        const localDate = toLocalDate(entry.dt, timezoneOffset);
        const key = `${localDate.getUTCFullYear()}-${localDate.getUTCMonth()}-${localDate.getUTCDate()}`;
        if (!days.has(key)) days.set(key, []);
        days.get(key).push(entry);
    });

    return Array.from(days.values()).map(dayEntries => {
        const temps = dayEntries.map(item => item.main.temp);
        const min = Math.round(Math.min(...temps));
        const max = Math.round(Math.max(...temps));

        const target = pickClosestToHour(dayEntries, 12, timezoneOffset);
        const summary = capitalize(target.weather[0].description);

        return {
            label: formatLocalDay(target.dt, timezoneOffset),
            icon: resolveIcon(target.weather[0].description),
            min,
            max,
            summary
        };
    });
}

function pickClosestToHour(entries, hour, timezoneOffset) {
    return entries.reduce((closest, entry) => {
        const entryHour = toLocalDate(entry.dt, timezoneOffset).getUTCHours();
        const closestHour = toLocalDate(closest.dt, timezoneOffset).getUTCHours();
        const entryDiff = Math.abs(entryHour - hour);
        const closestDiff = Math.abs(closestHour - hour);
        return entryDiff < closestDiff ? entry : closest;
    }, entries[0]);
}

function toLocalDate(dt, timezoneOffset) {
    return new Date((dt + timezoneOffset) * 1000);
}

function formatLocalDay(dt, timezoneOffset) {
    return toLocalDate(dt, timezoneOffset).toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC"
    });
}

function formatLocalDateTime(dt, timezoneOffset) {
    return toLocalDate(dt, timezoneOffset).toLocaleString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
        timeZone: "UTC"
    });
}

function formatLocalTime(dt, timezoneOffset) {
    return toLocalDate(dt, timezoneOffset).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC"
    });
}

function resolveIcon(description) {
    const lowered = description.toLowerCase();
    const match = iconMap.find(entry => entry.match.some(keyword => lowered.includes(keyword)));
    return match ? match.icon : "☁️";
}

function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function getWeatherByLocation() {
    if (!navigator.geolocation) {
        setStatus("Geolocation is not supported in this browser", true);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            fetchByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
            setStatus("Location access denied. Search by city instead.", true);
        }
    );
}

init();
