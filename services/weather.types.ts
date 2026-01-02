export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tz_id: string;
  localtime: string;
}

export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  is_day: number;
  condition: WeatherCondition;
  wind_kph: number;
  wind_mph: number;
  wind_dir: string;
  pressure_mb: number;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  vis_km: number;
  uv: number;
  gust_kph: number;
}

export interface ForecastDay {
  date: string;
  date_epoch: number;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    avgtemp_c: number;
    avgtemp_f: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    avgvis_km: number;
    avghumidity: number;
    daily_chance_of_rain: number;
    daily_chance_of_snow: number;
    condition: WeatherCondition;
    uv: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moon_phase: string;
  };
  hour: Array<{
    time: string;
    temp_c: number;
    temp_f: number;
    condition: WeatherCondition;
    wind_kph: number;
    humidity: number;
    chance_of_rain: number;
  }>;
}

export interface WeatherForecast {
  forecastday: ForecastDay[];
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  forecast: WeatherForecast;
}

export interface WeatherError {
  error: {
    code: number;
    message: string;
  };
}
