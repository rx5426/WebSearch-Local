import React, { useState } from 'react';
import { ShieldCheck, Wifi, Sliders, CheckCircle2, AlertTriangle, Layers, Copy, Check } from 'lucide-react';
import { BROWSER_PROFILES_DATA } from '../data/scriptData';

export const EvasionLab: React.FC = () => {
  const [selectedProfileId, setSelectedProfileId] = useState(BROWSER_PROFILES_DATA[0].id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeProfile = BROWSER_PROFILES_DATA.find((p) => p.id === selectedProfileId) || BROWSER_PROFILES_DATA[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Anti-Bot &amp; Fingerprint Evasion Architecture
          </h1>
          <p className="text-sm text-slate-400">
            How running Claude Code CLI on your local desktop eliminates CAPTCHAs, bot walls, and IP bans by combining residential routing with synthetic client-hint consistency.
          </p>
        </div>
      </div>

      {/* Comparison: Datacenter IP vs Local Residential Machine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cloud Datacenter Scraping (Fails) */}
        <div className="bg-slate-900/60 border border-rose-950/60 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Cloud Datacenter Scraping (AWS, GCP, Azure, DigitalOcean)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">✕</span>
              <span><strong>ASN Blacklisting:</strong> Cloud IP subnets (AS16509, AS14061, AS15169) are flagged by Cloudflare, Datadome, and Akamai before requests reach HTML renderers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">✕</span>
              <span><strong>Immediate CAPTCHA Challenges:</strong> Turnstile and hCaptcha activate instantly when non-browser headers query search endpoints from server racks.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">✕</span>
              <span><strong>Strict Rate Limiting:</strong> Hard bans at &gt;5 requests per minute with permanent IP blocklisting.</span>
            </li>
          </ul>
        </div>

        {/* Local Residential Scraping (Succeeds) */}
        <div className="bg-slate-900/60 border border-emerald-950/60 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Local Desktop Routing (Your Machine ISP)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Clean Residential IP:</strong> Outbound traffic originates from your home/office ISP (Comcast, AT&amp;T, Deutsche Telekom, etc.) with 0.0 bot risk reputation.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Client Hints Pairing:</strong> Chrome 124 Linux/Win11 Sec-CH-UA headers match exact desktop platforms, bypassing passive fingerprinting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Human Latency Jitter:</strong> 0.8s to 2.2s delays mimic genuine human reading speed without triggering burst-rate detectors.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 5 Evasion Pillars */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          The 5 Evasion Pillars Implemented in claude_local_search.py
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              1. Residential ISP Connection
            </div>
            <p className="text-slate-400 leading-relaxed">
              Never uses proxy datacenters. Every byte leaves through your local Ethernet or Wi-Fi network adapter, inheriting your regular browsing IP trust score.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              2. Synthetic Client Hints (Sec-CH-UA)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Google &amp; modern search engines verify client hints alongside User-Agent. Our profile generator ensures Chromium headers never conflict with underlying OS strings.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              3. Human Latency Jitter
            </div>
            <p className="text-slate-400 leading-relaxed">
              A Python randomized uniform sleep between 0.8s and 2.2s precedes each network dispatch, avoiding mechanical timing patterns that trigger rate limiters.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              4. Zero-JS Lightweight Scrapers
            </div>
            <p className="text-slate-400 leading-relaxed">
              Uses DuckDuckGo HTML Lite and Qwant API endpoints rather than spawning heavy Chromium Puppeteer instances that leak navigator.webdriver flags.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              5. 5-Tier Priority Cascade
            </div>
            <p className="text-slate-400 leading-relaxed">
              Tries in strict priority: <strong>1. Google → 2. Bing → 3. Wikipedia → 4. Brave Search → 5. DuckDuckGo HTML</strong>. If an engine blocks or rate-limits, it cascades immediately without failing the user's turn.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              6. Direct Meteorological Grounding
            </div>
            <p className="text-slate-400 leading-relaxed">
              Time and weather requests bypass HTML search scraping entirely, hitting Open-Meteo's open endpoints for sub-millisecond real regional time resolution.
            </p>
          </div>
        </div>
      </div>

      {/* Rotating Fingerprint Profile Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Interactive Browser Fingerprint Profiles
            </h2>
            <p className="text-xs text-slate-400">
              Select a profile below to inspect the exact header set emitted by the Python tool.
            </p>
          </div>

          {/* Profile Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {BROWSER_PROFILES_DATA.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedProfileId === p.id
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {p.browser} ({p.os.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>

        {/* Selected Profile Inspector */}
        <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">
              Profile: {activeProfile.name}
            </span>
            <button
              onClick={() => handleCopy(JSON.stringify(activeProfile, null, 2), 'profile')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
            >
              {copiedKey === 'profile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'profile' ? 'Copied' : 'Copy Headers JSON'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-500">User-Agent:</span>
              <div className="p-2 bg-slate-900 rounded border border-slate-800/80 text-cyan-300 break-all mt-0.5">
                {activeProfile.user_agent}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Sec-CH-UA:</span>
                <div className="p-2 bg-slate-900 rounded border border-slate-800/80 text-slate-300 break-all mt-0.5">
                  {activeProfile.sec_ch_ua || 'Omitted (Firefox Profile)'}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Sec-CH-UA-Platform:</span>
                <div className="p-2 bg-slate-900 rounded border border-slate-800/80 text-slate-300 mt-0.5">
                  {activeProfile.platform || 'Native Linux'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Accept-Language:</span>
                <div className="p-2 bg-slate-900 rounded border border-slate-800/80 text-slate-300 mt-0.5">
                  {activeProfile.accept_lang}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Sec-Fetch-Mode &amp; Dest:</span>
                <div className="p-2 bg-slate-900 rounded border border-slate-800/80 text-slate-300 mt-0.5">
                  navigate · document · ?1
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
