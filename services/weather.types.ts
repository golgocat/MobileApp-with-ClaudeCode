// AccuWeather API Response Types

export interface AccuWeatherLocation {
  Key: string;
  LocalizedName: string;
  Country: {
    ID: string;
    LocalizedName: string;
  };
  AdministrativeArea: {
    ID: string;
    LocalizedName: string;
  };
  GeoPosition: {
    Latitude: number;
    Longitude: number;
  };
  TimeZone: {
    Name: string;
  };
}

export interface AccuWeatherCurrentConditions {
  LocalObservationDateTime: string;
  EpochTime: number;
  WeatherText: string;
  WeatherIcon: number;
  HasPrecipitation: boolean;
  IsDayTime: boolean;
  Temperature: {
    Metric: { Value: number; Unit: string };
    Imperial: { Value: number; Unit: string };
  };
  RealFeelTemperature: {
    Metric: { Value: number; Unit: string };
    Imperial: { Value: number; Unit: string };
  };
  RelativeHumidity: number;
  Wind: {
    Speed: {
      Metric: { Value: number; Unit: string };
      Imperial: { Value: number; Unit: string };
    };
    Direction: {
      Degrees: number;
      Localized: string;
    };
  };
  UVIndex: number;
  UVIndexText: string;
  Visibility: {
    Metric: { Value: number; Unit: string };
    Imperial: { Value: number; Unit: string };
  };
  CloudCover: number;
  Pressure: {
    Metric: { Value: number; Unit: string };
    Imperial: { Value: number; Unit: string };
  };
}

export interface AccuWeatherDailyForecast {
  Date: string;
  EpochDate: number;
  Temperature: {
    Minimum: { Value: number; Unit: string };
    Maximum: { Value: number; Unit: string };
  };
  Day: {
    Icon: number;
    IconPhrase: string;
    HasPrecipitation: boolean;
    PrecipitationType?: string;
    PrecipitationIntensity?: string;
  };
  Night: {
    Icon: number;
    IconPhrase: string;
    HasPrecipitation: boolean;
  };
  Sun: {
    Rise: string;
    Set: string;
  };
  Moon: {
    Rise: string;
    Set: string;
    Phase: string;
  };
  HoursOfSun: number;
  RealFeelTemperature: {
    Minimum: { Value: number; Unit: string };
    Maximum: { Value: number; Unit: string };
  };
}

export interface AccuWeatherHourlyForecast {
  DateTime: string;
  EpochDateTime: number;
  WeatherIcon: number;
  IconPhrase: string;
  HasPrecipitation: boolean;
  IsDaylight: boolean;
  Temperature: {
    Value: number;
    Unit: string;
  };
  RealFeelTemperature: {
    Value: number;
    Unit: string;
  };
  RelativeHumidity: number;
  Wind: {
    Speed: {
      Value: number;
      Unit: string;
    };
  };
  PrecipitationProbability: number;
  UVIndex: number;
}

// Normalized types for our app (to maintain compatibility with UI components)

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
