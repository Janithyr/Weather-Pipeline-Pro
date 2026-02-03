const apiKey = "ca8be2ab9a1b4250071a018b220fc421";

function displayWeather(data) {
    const temp = data.main.temp;
    const feelsLike = data.main.feels_like;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const condition = data.weather[0].description.toLowerCase();

    let icon = "☁️";
    if (condition.includes("clear")) icon = "☀️";
    else if (condition.includes("rain")) icon = "🌧️";
    else if (condition.includes("cloud")) icon = "☁️";
    else if (condition.includes("snow")) icon = "❄️";

    document.getElementById("result").innerHTML = `
        <div style="font-size:42px">${icon}</div>
        <strong>${temp}°C</strong><br>
        Feels like: ${feelsLike}°C<br>
        💧 Humidity: ${humidity}%<br>
        💨 Wind: ${wind} m/s<br>
        ${data.name}
    `;
}

function saveHistory(city) {
    let history = JSON.parse(localStorage.getItem("cities")) || [];

    if (!history.includes(city)) history.unshift(city);
    if (history.length > 5) history.pop();

    localStorage.setItem("cities", JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const list = document.getElementById("history");
    list.innerHTML = "";

    const history = JSON.parse(localStorage.getItem("cities")) || [];
    history.forEach(city => {
        const li = document.createElement("li");
        li.textContent = city;
        li.onclick = () => {
            document.getElementById("city").value = city;
            getWeather();
        };
        list.appendChild(li);
    });
}

function getWeather() {
    const city = document.getElementById("city").value;

    if (!city) {
        document.getElementById("result").innerHTML = "Please enter a city";
        return;
    }

    document.getElementById("result").innerHTML = "⏳ Loading weather...";

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
            if (data.cod !== 200) {
                document.getElementById("result").innerHTML = "City not found";
                return;
            }
            displayWeather(data);
            saveHistory(city);
        });
}

function getWeatherByLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(pos => {
        document.getElementById("result").innerHTML = "📍 Detecting location...";

        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${apiKey}&units=metric`)
            .then(res => res.json())
            .then(data => displayWeather(data));
    });
}
