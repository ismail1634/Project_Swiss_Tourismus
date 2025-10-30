const apiKey = "e864aa3b62719955c92e17449846206d";
const geoapifyKey = "2642527f22924b08996489b8f2163d47";

const cityCoordinates = {
  Zurich: [47.3769, 8.5417],
  Geneva: [46.2044, 6.1432],
  Lucerne: [47.0502, 8.3093],
  Bern: [46.9481, 7.4474],
  Interlaken: [46.6863, 7.8632],
  Basel: [47.5596, 7.5886],
  Lugano: [46.0037, 8.9511],
  Lauterbrunnen: [46.5946, 7.9070],
  Schafhausen: [47.6970, 8.6351],
  Solothurn: [47.2088, 7.5326],
  Thun: [46.7519, 7.6216],
  Lausanne: [46.5197, 6.6323],
};

const map = L.map("map").setView([47.3769, 8.5417], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

const markerIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
});

document.getElementById("recommendBtn").addEventListener("click", getWeather);

function getWeatherEmoji(condition) {
  switch (condition) {
    case "Clear": return "☀️";
    case "Rain": return "🌧";
    case "Snow": return "❄️";
    case "Clouds": return "☁️";
    case "Thunderstorm": return "⛈";
    case "Drizzle": return "🌦";
    case "Mist":
    case "Fog": return "🌫";
    default: return "🌤";
  }
}

async function getWeather() {
  const city = document.getElementById("citySelector").value;

  map.setView(cityCoordinates[city], 13);

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);
  const data = await response.json();
  const weather = data.weather[0].main;

  const weatherBox = document.getElementById("weatherBox");
  const weatherIcon = document.getElementById("weatherIcon");
  const weatherText = document.getElementById("weatherText");

  weatherBox.style.display = "inline-flex";
  weatherIcon.textContent = getWeatherEmoji(weather);
  weatherText.textContent = `${city}: ${weather}, ${data.main.temp.toFixed(1)}°C`;

  await getActivities(city);
}
document.getElementById("aiSuggestBtn").addEventListener("click", suggestBestCity);

async function suggestBestCity() {
  const cities = Object.keys(cityCoordinates);
  let bestCity = null;
  let bestScore = -Infinity;

  for (const city of cities) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    const weather = data.weather[0].main;

    let score = 0;
    if (weather === "Clear") score += 3;
    if (weather === "Clouds") score += 1;
    if (weather === "Rain" || weather === "Snow") score -= 2;

    if (score > bestScore) {
      bestScore = score;
      bestCity = city;
    }
  }

  if (bestCity) {
    document.getElementById("citySelector").value = bestCity;
    getWeather(); 
  }
}

async function getActivities(city) {
  const [lat, lon] = cityCoordinates[city];
  const url = `https://api.geoapify.com/v2/places?categories=tourism.sights&filter=circle:${lon},${lat},10000&limit=8&apiKey=${geoapifyKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const namedFeatures = data.features.filter(item => item.properties.name);
    const activityList = document.getElementById("activityList");
    activityList.innerHTML = "";

    namedFeatures.slice(0, 6).forEach(item => {
      const { name } = item.properties;
      const [lon, lat] = item.geometry.coordinates;
      L.marker([lat, lon], { icon: markerIcon }).addTo(map).bindPopup(name);

      const li = document.createElement("li");
      li.textContent = name;
      activityList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    alert("Failed to fetch activities. Please try again later.");
  }
}
