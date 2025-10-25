const apiKey = "e864aa3b62719955c92e17449846206d";
const geoapifyKey = "2642527f22924b08996489b8f2163d47";
document.querySelector("button").addEventListener("click", getWeather);

function getWeatherEmoji(condition) {
  switch (condition) {
    case "Clear":
      return "☀️";
    case "Rain":
      return "🌧";
    case "Snow":
      return "❄️";
    case "Clouds":
      return "☁️";
    case "Thunderstorm":
      return "⛈";
    case "Drizzle":
      return "🌦";
    case "Mist":
    case "Fog":
      return "🌫";
    default:
      return "🌤";
  }
}
const cityCoordinates = {
  Zurich: [47.3769, 8.5417],
  Geneva: [46.2044, 6.1432],
  Lucerne: [47.0502, 8.3093],
  Bern: [46.9481, 7.4474],
  Interlaken: [46.6863, 7.8632],
};

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

  weatherBox.style.display = "block";
  weatherIcon.textContent = getWeatherEmoji(weather);
  weatherText.textContent = `Weather in ${city}: ${weather}, ${data.main.temp}°C`;

  await getActivities(city);
}
const map = L.map("map").setView([47.3769, 8.5417], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);


async function getActivities(city) {
  const [lat, lon] = cityCoordinates[city];
  const radius = 10000; // 10 km
  const limit = 10;
  const kinds = "cultural,museums,architecture";

  const url = `https://api.geoapify.com/v2/places?categories=tourism.sights&filter=circle:${lon},${lat},${radius}&limit=${limit}&apiKey=${geoapifyKey}`;

  try {
    const response = await fetch(url);
const data = await response.json();

if (!data.features || data.features.length === 0) {
  alert("No activities available at the moment.");
  return;
}

const namedFeatures = data.features.filter(item => item.properties.name);
const activityBox = document.getElementById("activityBox");
const activityList = document.getElementById("activityList");

activityList.innerHTML = ""; // Clear previous results

namedFeatures.slice(0, 5).forEach(item => {
  const { name } = item.properties;
  const [lon, lat] = item.geometry.coordinates;

  // Add marker to map
  L.marker([lat, lon]).addTo(map).bindPopup(name);

  // Add item to list
  const li = document.createElement("li");
  li.textContent = name;
  activityList.appendChild(li);
});

  } catch (error) {
    console.error("Error fetching activities:", error);
    alert("Failed to fetch activities. Please try again later.");
  }
}