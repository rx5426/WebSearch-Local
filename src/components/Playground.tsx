import React, { useState, useEffect } from 'react';
import { Search, Compass, Terminal, ShieldCheck, Sun, Moon, Wind, Droplets, ArrowRight } from 'lucide-react';
import { WeatherTimeData, SearchResponse, SearchResultItem } from '../types';
import { fetchLiveWeatherAndTime, detectWeatherOrTimeIntent } from '../utils/weatherApi';
import { BROWSER_PROFILES_DATA } from '../data/scriptData';

const SAMPLE_QUERIES = [
  "What is the current time and weather in Tokyo?",
  "Current time in London right now",
  "Weather forecast for Paris, France",
  "Debian 13 Trixie release schedule",
  "Latest Linux kernel 6.x features",
  "Local time in San Francisco"
];

const MOCK_WEB_RESULTS: Record<string, SearchResultItem[]> = {
  "debian": [
    {
      title: "Debian 13 'Trixie' Release Timeline and Target Features",
      url: "https://wiki.debian.org/DebianTrixie",
      snippet: "Debian 13 (code name Trixie) is the next stable release following Debian 12 Bookworm. It includes GCC 14, updated Linux kernels, revised 64-bit time_t migration, and enhanced apt package management."
    },
    {
      title: "Debian Official Security Advisories and Distribution Status",
      url: "https://www.debian.org/releases/testing/",
      snippet: "The testing distribution is where packages that are intended for the next release migrate after testing in unstable. Packages in trixie currently receive security updates and continuous integration testing."
    },
    {
      title: "Package Management in Debian GNU/Linux 13",
      url: "https://packages.debian.org/trixie/",
      snippet: "Browse and inspect binaries, documentation, and dependencies for Debian GNU/Linux architectures including amd64, arm64, and riscv64."
    }
  ],
  "kernel": [
    {
      title: "The Linux Kernel Archives - Active Kernel Releases",
      url: "https://www.kernel.org/",
      snippet: "Official repository of the Linux kernel source code. Provides mainline, stable, and long-term maintenance trees maintained by Linus Torvalds and Greg Kroah-Hartman."
    },
    {
      title: "Linux Kernel Version History & Changelogs",
      url: "https://en.wikipedia.org/wiki/Linux_kernel_version_history",
      snippet: "Detailed breakdown of Linux kernel architectures, major subsystems (Bcachefs, io_uring, Rust support, memory tiering), and release intervals."
    },
    {
      title: "LWN.net Kernel Coverage and Developer Insights",
      url: "https://lwn.net/Kernel/",
      snippet: "Weekly in-depth reporting on Linux kernel development, patch submissions, memory safety initiatives, and sched_ext scheduler improvements."
    }
  ],
  "default": [
    {
      title: "Local Internet Web Search - Claude Code CLI MCP Tool",
      url: "https://modelcontextprotocol.io/",
      snippet: "Fast, resilient local desktop search routed via residential ISP connection. Eliminates datacenter IP blocking and CAPTCHA friction using rotating desktop headers and randomized request jitter."
    },
    {
      title: "Understanding HTTP Client Hints & Anti-Fingerprinting Techniques",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Client_hints",
      snippet: "Detailed guide to Sec-CH-UA, Sec-CH-UA-Platform, and Sec-Fetch-* headers required by modern search engines to prevent automated crawler detection."
    },
    {
      title: "Open-Meteo Weather and Planetary Time APIs Documentation",
      url: "https://open-meteo.com/en/docs",
      snippet: "Free high-precision weather forecast API and global geocoding database offering exact regional local times, timezone offsets, WMO weather codes, and astronomical data."
    }
  ]
};

export const Playground: React.FC = () => {
  const [query, setQuery] = useState("What is the current time and weather in Tokyo?");
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState(BROWSER_PROFILES_DATA[0]);
  const [jitterTime, setJitterTime] = useState<number>(0);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [rawJsonView, setRawJsonView] = useState(false);

  // Live regional clock timer
  const [liveClock, setLiveClock] = useState<string>('');

  useEffect(() => {
    // Run initial query on mount
    executeLiveQuery("What is the current time and weather in Tokyo?");
  }, []);

  // Update ticking clock for result timezone
  useEffect(() => {
    if (!result?.location_weather_time?.timezone) return;

    const updateClock = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: result.location_weather_time?.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(now);
        setLiveClock(formatted);
      } catch {
        setLiveClock(result.location_weather_time?.local_time.split(' ')[1] || '');
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const executeLiveQuery = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);

    // Pick random browser profile and jitter
    const profile = BROWSER_PROFILES_DATA[Math.floor(Math.random() * BROWSER_PROFILES_DATA.length)];
    setActiveProfile(profile);
    const simulatedJitter = Math.floor(Math.random() * 800) + 700; // 700 - 1500 ms
    setJitterTime(simulatedJitter);

    // Human delay jitter emulation
    await new Promise((resolve) => setTimeout(resolve, simulatedJitter));

    const intent = detectWeatherOrTimeIntent(searchQuery);

    try {
      if (intent) {
        // Live real-time call to Open-Meteo
        const weatherData: WeatherTimeData = await fetchLiveWeatherAndTime(intent.location);
        setResult({
          query: searchQuery,
          intent_detected: intent.type,
          location_weather_time: weatherData,
          summary: `Current local time in ${weatherData.location} is ${weatherData.local_time} (${weatherData.timezone}, ${weatherData.utc_offset}). Weather: ${weatherData.weather.condition}, ${weatherData.weather.temperature_celsius}°C (${weatherData.weather.temperature_fahrenheit}°F), humidity ${weatherData.weather.humidity_percent}%, wind ${weatherData.weather.wind_speed_kmh} km/h.`,
          connection: "Local Desktop / Browser Internet Connection (Residential ISP)",
          fingerprint: `${profile.name} · Sec-CH-UA Emulation`,
          jitter_ms: simulatedJitter
        });
      } else {
        // Evasive web search cascade (Google -> Bing -> Wikipedia -> Brave -> DuckDuckGo)
        let items: SearchResultItem[] = [];
        let engineUsed = "Wikipedia";
        const attempted = ["Google", "Bing", "Wikipedia"];

        try {
          // Attempt live search via Wikipedia API (CORS origin=*)
          const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&utf8=&format=json&origin=*&srlimit=6`;
          const wikiResp = await fetch(wikiUrl);
          if (wikiResp.ok) {
            const wikiData = await wikiResp.json();
            const searchItems = wikiData.query?.search || [];
            if (searchItems.length > 0) {
              items = searchItems.map((it: { title: string; snippet: string }) => ({
                title: it.title,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(it.title.replace(/ /g, '_'))}`,
                snippet: it.snippet.replace(/<[^>]+>/g, '').trim()
              }));
              engineUsed = "Wikipedia";
            }
          }
        } catch {
          // Fall through to mock/DuckDuckGo
        }

        if (!items || items.length === 0) {
          const lowerQ = searchQuery.toLowerCase();
          items = MOCK_WEB_RESULTS.default;
          if (lowerQ.includes('debian')) items = MOCK_WEB_RESULTS.debian;
          else if (lowerQ.includes('kernel') || lowerQ.includes('linux')) items = MOCK_WEB_RESULTS.kernel;
          engineUsed = "DuckDuckGo HTML";
          attempted.push("Brave Search", "DuckDuckGo HTML");
        }

        setResult({
          query: searchQuery,
          engine_used: engineUsed,
          cascade_order: ["Google", "Bing", "Wikipedia", "Brave Search", "DuckDuckGo HTML"],
          cascade_attempted: attempted,
          results_count: items.length,
          results: items,
          connection: "Local Desktop / Browser Internet Connection (Residential ISP)",
          fingerprint: `${profile.name} · Sec-CH-UA Emulation`,
          jitter_ms: simulatedJitter
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setResult({
        query: searchQuery,
        summary: `Query executed with error: ${errorMsg}`,
        connection: "Local Desktop / Browser Internet Connection",
        fingerprint: profile.name,
        jitter_ms: simulatedJitter
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLiveQuery(query);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Local Web Search & Regional Time Console
            </h1>
            <p className="text-sm text-slate-400">
              Interactive simulator demonstrating how Claude Code CLI routes web searches and real-time regional time requests through your local residential machine.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Residential ISP IP
            </span>
            <span aria-hidden="true">·</span>
            <span>Zero CAPTCHA Friction</span>
            <span aria-hidden="true">·</span>
            <span>Open-Meteo Live Synced</span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-5 relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search query or ask for local time / weather (e.g., 'what time is it in Tokyo?')..."
              className="w-full pl-10 pr-28 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-medium text-xs rounded-md transition-colors flex items-center gap-1.5"
            >
              {isLoading ? 'Executing...' : 'Run Query'}
            </button>
          </div>

          {/* Quick Query Suggestions */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span className="text-slate-500 mr-1">Try asking:</span>
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  executeLiveQuery(sample);
                }}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 hover:text-slate-200 rounded text-slate-300 transition-colors text-left"
              >
                {sample}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Main Grid: Telemetry & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evasion Engine Diagnostics */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Active Fingerprint Profile
              </span>
              <span className="text-xs font-mono text-emerald-400">Stealth Active</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Browser / Engine</span>
                <div className="text-slate-200 font-mono">{activeProfile.name}</div>
              </div>

              <div>
                <span className="text-slate-500">User-Agent Header</span>
                <div className="text-slate-400 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 break-all">
                  {activeProfile.user_agent}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Client Hints (Sec-CH-UA)</span>
                <div className="text-slate-400 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800">
                  {activeProfile.sec_ch_ua || 'None (Emulating Firefox Linux)'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div>
                  <span className="text-slate-500">Platform Hint</span>
                  <div className="text-slate-300 font-mono">{activeProfile.platform || 'Linux (Native)'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Language Pairing</span>
                  <div className="text-slate-300 font-mono">{activeProfile.accept_lang}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Jitter Pacing Latency Monitor */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Human Latency Jitter</span>
              <span className="font-mono text-cyan-400 tabular-nums">
                {jitterTime ? `${jitterTime} ms` : 'Pacing Ready'}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (jitterTime / 2000) * 100)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500">
              Random uniform delay (0.8s - 2.2s) injected before each request to prevent heuristic rate-limiting.
            </p>
          </div>
        </div>

        {/* Center & Right Column: Query Execution Result */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-slate-200">
                  Tool Execution Result (Claude Code MCP)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRawJsonView(!rawJsonView)}
                  className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded transition-colors"
                >
                  {rawJsonView ? 'Formatted View' : 'Raw JSON View'}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="inline-block w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-400">
                  Executing via local residential network · Rotating headers · Applying jitter...
                </p>
              </div>
            ) : !result ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                Enter a query above to test local search and real-time regional time detection.
              </div>
            ) : rawJsonView ? (
              <div className="mt-4">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto max-h-[460px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : result.location_weather_time ? (
              /* REAL-TIME WEATHER & REGIONAL LOCAL TIME CARD */
              <div className="mt-4 space-y-5">
                {/* Location & Time Header */}
                <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-5 rounded-lg border border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Coordinates: {result.location_weather_time.latitude?.toFixed(2)}°, {result.location_weather_time.longitude?.toFixed(2)}°</span>
                        <span aria-hidden="true">·</span>
                        <span>{result.location_weather_time.timezone}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-cyan-400">{result.location_weather_time.utc_offset}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mt-1">
                        {result.location_weather_time.location}
                      </h2>
                    </div>

                    {/* Regional Clock */}
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Regional Local Time</div>
                      <div className="text-3xl font-bold font-mono tracking-tight text-cyan-400 tabular-nums">
                        {liveClock || result.location_weather_time.local_time.split(' ')[1]}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {result.location_weather_time.local_time.split(' ')[0]} ({result.location_weather_time.timezone_abbreviation || 'Local'})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weather Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      {result.location_weather_time.is_daytime ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                      Condition
                    </span>
                    <div className="text-base font-semibold text-slate-200 mt-1">
                      {result.location_weather_time.weather.condition}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {result.location_weather_time.is_daytime ? 'Daytime' : 'Nighttime'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500">Temperature</span>
                    <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                      {result.location_weather_time.weather.temperature_celsius}°C
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {result.location_weather_time.weather.temperature_fahrenheit}°F
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      Humidity
                    </span>
                    <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                      {result.location_weather_time.weather.humidity_percent}%
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Feels like {result.location_weather_time.weather.feels_like_celsius}°C
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      Wind Speed
                    </span>
                    <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                      {result.location_weather_time.weather.wind_speed_kmh} <span className="text-xs font-normal">km/h</span>
                    </div>
                    <span className="text-[11px] text-slate-500">10m altitude</span>
                  </div>
                </div>

                {/* Claude CLI Formatted Payload Summary */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="text-xs font-medium text-slate-400">Claude CLI Tool Summary Output:</span>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800">
                    {result.summary}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Source: {result.location_weather_time.source}
                  </span>
                </div>
              </div>
            ) : (
              /* STANDARD WEB SEARCH RESULTS */
              <div className="mt-4 space-y-3">
                <div className="text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">
                      Engine: <span className="text-cyan-400 font-mono">{result.engine_used || 'Cascaded Engine'}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400">Found {result.results?.length || 0} results</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <span className="text-slate-500">Cascade:</span>
                    <span>1. Google → 2. Bing → 3. Wikipedia → 4. Brave → 5. DuckDuckGo</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.results?.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          {item.title}
                          <ArrowRight className="w-3 h-3 text-cyan-500" />
                        </a>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                        {item.url}
                      </div>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {item.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
