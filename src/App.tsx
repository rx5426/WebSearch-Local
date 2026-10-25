import { useState } from 'react';
import { Header } from './components/Header';
import { Playground } from './components/Playground';
import { WeatherStation } from './components/WeatherStation';
import { EvasionLab } from './components/EvasionLab';
import { InstallGuide } from './components/InstallGuide';
import { ScriptViewer } from './components/ScriptViewer';
import { PYTHON_SCRIPT_CONTENT, INSTALL_SH_CONTENT } from './data/scriptData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('playground');

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = () => {
    // Direct download of the compiled zip package
    const link = document.createElement('a');
    link.href = '/claude-local-search.zip';
    link.download = 'claude-local-search.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar Contract (Wordmark, Nav Links, 1 Primary Action) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadAll={handleDownloadZip}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'playground' && <Playground />}
        {activeTab === 'weather-station' && <WeatherStation />}
        {activeTab === 'evasion-lab' && <EvasionLab />}
        {activeTab === 'install-guide' && (
          <InstallGuide
            onDownloadInstaller={() => downloadFile('install.sh', INSTALL_SH_CONTENT)}
            onDownloadScript={() => downloadFile('claude_local_search.py', PYTHON_SCRIPT_CONTENT)}
          />
        )}
        {activeTab === 'script-viewer' && (
          <ScriptViewer onDownloadFile={downloadFile} />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Claude Code CLI Local Search MCP</span>
            <span aria-hidden="true">·</span>
            <span>Debian Linux &amp; Residential ISP Routing</span>
            <span aria-hidden="true">·</span>
            <span>Open-Meteo Planetary API</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('install-guide')}
              className="hover:text-slate-200 transition-colors"
            >
              Installation
            </button>
            <button
              onClick={() => setActiveTab('script-viewer')}
              className="hover:text-slate-200 transition-colors"
            >
              Source Scripts
            </button>
            <button
              onClick={() => setActiveTab('evasion-lab')}
              className="hover:text-slate-200 transition-colors"
            >
              Anti-Bot Docs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
