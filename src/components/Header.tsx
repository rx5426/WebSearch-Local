import React from 'react';
import { Download } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onDownloadAll }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="font-semibold text-base tracking-tight text-white">
            Claude Local Search MCP
          </span>
          <span className="text-xs text-slate-500 font-mono">v1.0</span>
        </div>

        {/* Zone 2: 4-5 single-line clean navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('playground')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'playground' ? 'text-cyan-400' : 'hover:text-slate-200'
            }`}
          >
            Live Search & Time
          </button>
          <button
            onClick={() => setActiveTab('weather-station')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'weather-station' ? 'text-cyan-400' : 'hover:text-slate-200'
            }`}
          >
            Regional Weather Station
          </button>
          <button
            onClick={() => setActiveTab('evasion-lab')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'evasion-lab' ? 'text-cyan-400' : 'hover:text-slate-200'
            }`}
          >
            Evasion Architecture
          </button>
          <button
            onClick={() => setActiveTab('install-guide')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'install-guide' ? 'text-cyan-400' : 'hover:text-slate-200'
            }`}
          >
            Debian Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('script-viewer')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'script-viewer' ? 'text-cyan-400' : 'hover:text-slate-200'
            }`}
          >
            Python & Shell Scripts
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Package</span>
          </button>
        </div>
      </div>
    </header>
  );
};
