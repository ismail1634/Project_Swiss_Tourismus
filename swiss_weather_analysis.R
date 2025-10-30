# --- Quick setup ---
library(httr)
library(jsonlite)
library(dplyr)
library(lubridate)
library(ggplot2)
library(tidyr)

# --- 1. Cities and coordinates ---
cities <- data.frame(
  city = c("Zurich", "Geneva", "Lucerne"),
  lat = c(47.3769, 46.2044, 47.0502),
  lon = c(8.5417, 6.1432, 8.3093)
)

start_date <- "2023-01-01"
end_date   <- "2023-12-31"

# --- 2. Function to get daily weather from Open-Meteo ---
get_weather <- function(lat, lon, city){
  url <- "https://archive-api.open-meteo.com/v1/archive"
  params <- list(
    latitude = lat,
    longitude = lon,
    start_date = start_date,
    end_date = end_date,
    timezone = "Europe/Zurich",
    daily = "temperature_2m_mean,precipitation_sum"
  )
  res <- GET(url, query = params)
  dat <- fromJSON(content(res, "text"))
  df <- dat$daily
  df <- data.frame(date = as.Date(df$time),
                   temp = df$temperature_2m_mean,
                   precip = df$precipitation_sum)
  df$city <- city
  return(df)
}

# --- 3. Loop through cities ---
weather_all <- do.call(rbind,
                       mapply(get_weather, cities$lat, cities$lon, cities$city,
                              SIMPLIFY = FALSE))

# --- 4. Add season labels ---
weather_all <- weather_all %>%
  mutate(month = month(date),
         season = case_when(
           month %in% c(12,1,2) ~ "Winter",
           month %in% c(3,4,5)  ~ "Spring",
           month %in% c(6,7,8)  ~ "Summer",
           TRUE                 ~ "Autumn"
         ))

# --- 5. Aggregate by city and season ---
seasonal_summary <- weather_all %>%
  group_by(city, season) %>%
  summarise(mean_temp = mean(temp, na.rm=TRUE),
            total_precip = sum(precip, na.rm=TRUE))

print(seasonal_summary)

# --- 6. Add quick (fake) tourism numbers (in thousands) ---
tourism <- data.frame(
  city = c("Zurich","Geneva","Lucerne"),
  Winter = c(250, 220, 180),
  Spring = c(320, 290, 250),
  Summer = c(480, 430, 400),
  Autumn = c(300, 270, 230)
) %>%
  pivot_longer(-city, names_to="season", values_to="tourists_k")

# --- 7. Combine and plot ---
combined <- merge(seasonal_summary, tourism, by=c("city","season"))

ggplot(combined, aes(x=mean_temp, y=tourists_k, color=city)) +
  geom_point(size=3) +
  geom_smooth(method="lm", se=FALSE) +
  labs(title="Tourists vs Average Temperature (2023)",
       x="Mean Temperature (°C)", y="Tourists (thousands)")

print(combined)

