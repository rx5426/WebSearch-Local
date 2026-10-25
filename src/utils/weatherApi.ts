import { WeatherTimeData } from '../types';

export const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm'
};

export async function fetchLiveWeatherAndTime(locationName: string): Promise<WeatherTimeData> {
  const trimmed = locationName.trim();
  if (!trimmed) {
    throw new Error('Location query cannot be empty');
  }

  // 1. Geocoding
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    throw new Error(`Geocoding failed with status: ${geoRes.status}`);
  }
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    return {
      status: 'not_found',
      location: locationName,
      timezone: 'Unknown',
      utc_offset: 'UTC+0',
      local_time: 'Unknown',
      is_daytime: true,
      weather: {
        condition: 'Unknown',
        temperature_celsius: 0,
        temperature_fahrenheit: 0,
        humidity_percent: 0,
        wind_speed_kmh: 0
      },
      source: 'Open-Meteo API',
      error: `Could not find coordinates for '${locationName}'. Please check spelling.`
    };
  }

  const place = geoData.results[0];
  const { latitude, longitude, name, country, admin1, timezone: tzId } = place;

  // 2. Weather & exact timezone local time
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;
  const forecastRes = await fetch(forecastUrl);
  if (!forecastRes.ok) {
    throw new Error(`Weather service responded with status: ${forecastRes.status}`);
  }
  const fData = await forecastRes.json();

  const current = fData.current || {};
  const regionalTz = fData.timezone || tzId || 'UTC';
  const tzAbbr = fData.timezone_abbreviation || '';
  const utcOffsetSec = fData.utc_offset_seconds || 0;
  const offsetHours = utcOffsetSec / 3600;
  const utcOffsetStr = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;

  // Time directly from meteorological station
  const rawIsoTime = current.time || '';
  const formattedTime = rawIsoTime.replace('T', ' ');

  const weatherCode = current.weather_code ?? 0;
  const condition = WMO_CODES[weatherCode] || 'Clear';
  const tempC = Math.round((current.temperature_2m ?? 0) * 10) / 10;
  const tempF = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
  const appC = Math.round((current.apparent_temperature ?? tempC) * 10) / 10;
  const appF = Math.round(((appC * 9) / 5 + 32) * 10) / 10;

  const locDisplay = [name, admin1 !== name ? admin1 : null, country].filter(Boolean).join(', ');

  return {
    status: 'success',
    location: locDisplay,
    latitude,
    longitude,
    timezone: regionalTz,
    timezone_abbreviation: tzAbbr,
    utc_offset: utcOffsetStr,
    local_time: formattedTime,
    is_daytime: current.is_day === 1,
    weather: {
      condition,
      temperature_celsius: tempC,
      temperature_fahrenheit: tempF,
      feels_like_celsius: appC,
      feels_like_fahrenheit: appF,
      humidity_percent: current.relative_humidity_2m ?? 0,
      wind_speed_kmh: current.wind_speed_10m ?? 0
    },
    source: 'Open-Meteo Real-time Forecast & Geocoding API'
  };
}

export function detectWeatherOrTimeIntent(query: string): { type: 'weather' | 'time'; location: string } | null {
  const clean = query.trim().toLowerCase();

  const weatherPatterns = [
    /(?:what(?:'s| is) the )?weather (?:in|for|at) ([a-zA-Z\s,.-]+)/,
    /(?:how is the weather in|current weather in) ([a-zA-Z\s,.-]+)/,
    /temperature in ([a-zA-Z\s,.-]+)/,
    /forecast for ([a-zA-Z\s,.-]+)/
  ];
  for (const pat of weatherPatterns) {
    const match = clean.match(pat);
    if (match && match[1]) {
      return {
        type: 'weather',
        location: match[1].replace(/[?]/g, '').replace('today', '').replace('now', '').trim()
      };
    }
  }

  const timePatterns = [
    /(?:what(?:'s| is) the )?(?:current )?time (?:in|at) ([a-zA-Z\s,.-]+)/,
    /what time is it in ([a-zA-Z\s,.-]+)/,
    /local time (?:in|for) ([a-zA-Z\s,.-]+)/,
    /timezone (?:of|for|in) ([a-zA-Z\s,.-]+)/
  ];
  for (const pat of timePatterns) {
    const match = clean.match(pat);
    if (match && match[1]) {
      return {
        type: 'time',
        location: match[1].replace(/[?]/g, '').replace('right now', '').replace('now', '').trim()
      };
    }
  }

  return null;
}
