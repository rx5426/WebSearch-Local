export interface WeatherTimeData {
  status: 'success' | 'error' | 'not_found';
  location: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  timezone_abbreviation?: string;
  utc_offset: string;
  local_time: string;
  is_daytime: boolean;
  weather: {
    condition: string;
    temperature_celsius: number;
    temperature_fahrenheit: number;
    feels_like_celsius?: number;
    feels_like_fahrenheit?: number;
    humidity_percent: number;
    wind_speed_kmh: number;
  };
  source: string;
  error?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchResponse {
  query: string;
  results_count?: number;
  results?: SearchResultItem[];
  intent_detected?: string;
  location_weather_time?: WeatherTimeData;
  summary?: string;
  connection: string;
  fingerprint: string;
  jitter_ms: number;
}

export interface BrowserProfile {
  id: string;
  name: string;
  os: string;
  browser: string;
  user_agent: string;
  sec_ch_ua: string | null;
  platform: string | null;
  mobile: string | null;
  accept_lang: string;
  accept: string;
}
