import React, { useState, useEffect } from 'react';
import { Search, Compass, RefreshCw, Sun, Moon, Wind, Droplets } from 'lucide-react';
import { WeatherTimeData } from '../types';
import { fetchLiveWeatherAndTime } from '../utils/weatherApi';

interface CityItem {
  id: string;
  name: string;
  country: string;
  timezone: string;
  data?: WeatherTimeData;
  isLoading: boolean;
}

const DEFAULT_CITIES: CityItem[] = [
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', isLoading: true },
  { id: 'london', name: 'London', country: 'United Kingdom', timezone: 'Europe/London', isLoading: true },
  { id: 'new_york', name: 'New York', country: 'United States', timezone: 'America/New_York', isLoading: true },
  { id: 'berlin', name: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', isLoading: true },
  { id: 'san_francisco', name: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles', isLoading: true },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', isLoading: true },
  { id: 'sydney', name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', isLoading: true },
  { id: 'paris', name: 'Paris', country: 'France', timezone: 'Europe/Paris', isLoading: true },
];

export const WeatherStation: React.FC = () => {
  const [cities, setCities] = useState<CityItem[]>(DEFAULT_CITIES);
  const [searchCity, setSearchCity] = useState('');
  const [searchedData, setSearchedData] = useState<WeatherTimeData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [tick, setTick] = useState(0);

  // Load weather for preset cities
  useEffect(() => {
    cities.forEach((city) => {
      fetchLiveWeatherAndTime(city.name).then((data) => {
        setCities((prev) =>
          prev.map((c) => (c.id === city.id ? { ...c, data, isLoading: false } : c))
        );
      }).catch(() => {
        setCities((prev) =>
          prev.map((c) => (c.id === city.id ? { ...c, isLoading: false } : c))
        );
      });
    });
  }, []);

  // Update live clock ticks every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getLiveTimeForTz = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date());
    } catch {
      return '--:--:--';
    }
  };

  const handleCustomCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const data = await fetchLiveWeatherAndTime(searchCity);
      if (data.status === 'not_found' || data.status === 'error') {
        setSearchError(data.error || 'Location not found.');
        setSearchedData(null);
      } else {
        setSearchedData(data);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSearchError(errorMsg);
      setSearchedData(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Real-Time Regional Weather & Planetary Clock API
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live meteorological station pulling real-time regional clock time directly from coordinates and weather station sensors via Open-Meteo API.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Free API · No Keys Required</span>
            <span aria-hidden="true">·</span>
            <span>Worldwide Geocoding</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400">WMO Standard Sensors</span>
          </div>
        </div>

        {/* Custom Location Lookup */}
        <form onSubmit={handleCustomCitySearch} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Query any city or territory (e.g., Cairo, Reykjavik, São Paulo, Kyoto)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Fetch Regional Time</span>
          </button>
        </form>

        {searchError && (
          <div className="mt-3 text-xs text-rose-400 font-mono">
            [Error] {searchError}
          </div>
        )}

        {/* Custom Searched City Result */}
        {searchedData && (
          <div className="mt-4 p-4 bg-slate-950 border border-cyan-500/40 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-cyan-400 font-mono flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>{searchedData.timezone} ({searchedData.utc_offset})</span>
                </div>
                <div className="text-xl font-bold text-white mt-0.5">
                  {searchedData.location}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>Weather: <strong className="text-slate-200">{searchedData.weather.condition}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Temp: <strong className="text-slate-200 font-mono">{searchedData.weather.temperature_celsius}°C ({searchedData.weather.temperature_fahrenheit}°F)</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Humidity: <strong className="text-slate-200 font-mono">{searchedData.weather.humidity_percent}%</strong></span>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Local Regional Time</span>
                <div className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">
                  {getLiveTimeForTz(searchedData.timezone)}
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Station ISO: {searchedData.local_time}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Regional Hubs Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Global Tech Hubs — Real-Time Synced Clocks & Meteorological Conditions
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Auto-refreshing 1s pulse · <span className="text-cyan-400">{tick}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cities.map((city) => {
            const timeStr = getLiveTimeForTz(city.timezone);
            const data = city.data;

            return (
              <div
                key={city.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 hover:border-slate-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">{city.name}</h3>
                    <p className="text-xs text-slate-500">{city.country}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {data?.utc_offset || 'UTC'}
                  </span>
                </div>

                {/* Regional Clock */}
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Local Clock</div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-cyan-400 tabular-nums">
                    {timeStr}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {city.timezone}
                  </div>
                </div>

                {/* Weather Metrics */}
                {city.isLoading ? (
                  <div className="py-2 text-center text-xs text-slate-500">
                    Loading weather sensor...
                  </div>
                ) : data?.weather ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        {data.is_daytime ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                        {data.weather.condition}
                      </span>
                      <span className="font-mono text-slate-200 font-semibold tabular-nums">
                        {data.weather.temperature_celsius}°C
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-cyan-400" />
                        {data.weather.humidity_percent}% hum.
                      </span>
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-teal-400" />
                        {data.weather.wind_speed_kmh} km/h
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Weather data unavailable</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
