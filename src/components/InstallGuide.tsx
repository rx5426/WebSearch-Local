import React, { useState } from 'react';
import { Terminal, Copy, Check, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import { CLAUDE_JSON_CONFIG } from '../data/scriptData';

interface InstallGuideProps {
  onDownloadInstaller: () => void;
  onDownloadScript: () => void;
}

export const InstallGuide: React.FC<InstallGuideProps> = ({ onDownloadInstaller, onDownloadScript }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: "Option A (Recommended): Download ZIP & Run install.sh",
      desc: "Download claude-local-search.zip, extract it anywhere in your user home, and run the installer. It dynamically adapts to your $USER and $HOME without needing root permissions.",
      command: `wget https://${window.location.host}/claude-local-search.zip
unzip claude-local-search.zip -d claude-local-search
cd claude-local-search
chmod +x install.sh
./install.sh`
    },
    {
      title: "Option B: One-Line Online curl Installer",
      desc: "Directly downloads and executes the installer, resolving your dynamic $HOME and installing to ~/.local/share/claude-local-search/:",
      command: `curl -fsSL https://${window.location.host}/install.sh | bash`
    },
    {
      title: "3. Verify Claude Code CLI Registration",
      desc: "Confirm that Claude Code has detected the MCP server and active tools ('web_search', 'get_weather_and_local_time'):",
      command: `claude mcp list`
    },
    {
      title: "4. Run Self-Test from your Debian Terminal",
      desc: "Verify your residential internet connection, Open-Meteo regional time query, and DuckDuckGo scraping:",
      command: `claude-local-search --test`
    }
  ];

  const handleDownloadZip = () => {
    const link = document.createElement('a');
    link.href = '/claude-local-search.zip';
    link.download = 'claude-local-search.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Debian / Linux Installation &amp; Claude Code CLI Setup
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Supports any Linux user (<code className="text-cyan-400 font-mono">$USER</code> &amp; <code className="text-cyan-400 font-mono">$HOME</code> dynamically resolved).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP Package</span>
            </button>
            <button
              onClick={onDownloadInstaller}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download install.sh</span>
            </button>
            <button
              onClick={onDownloadScript}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download claude_local_search.py</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step by step installation */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-2.5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                  {step.title}
                </h2>
                <p className="text-xs text-slate-400 ml-6">
                  {step.desc}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(step.command, idx)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors shrink-0 font-mono"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="ml-6">
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                {step.command}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Manual JSON Configuration for ~/.claude.json */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Manual Configuration File (~/.claude.json or claude_desktop_config.json)
            </h2>
            <p className="text-xs text-slate-400">
              If you configure MCP tools via JSON rather than the CLI command, add this block:
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(CLAUDE_JSON_CONFIG, 99)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors shrink-0 font-mono"
          >
            {copiedIndex === 99 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 99 ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>

        <pre className="p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-300 overflow-x-auto">
          {CLAUDE_JSON_CONFIG}
        </pre>
      </div>

      {/* Prompts to test in Claude Code */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Example Prompts to Try in Claude Code CLI
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-slate-500 font-medium">Regional Local Time &amp; Weather:</span>
            <div className="text-slate-200 font-mono">
              &quot;What is the current time and weather in Tokyo right now?&quot;
            </div>
            <p className="text-slate-500 text-[11px]">
              Claude Code will automatically invoke <code className="text-cyan-400">get_weather_and_local_time</code> or classify the query, returning exact regional local time from the weather API.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-slate-500 font-medium">Residential Web Search:</span>
            <div className="text-slate-200 font-mono">
              &quot;Search the web for the latest security patches in Debian 12 bookworm.&quot;
            </div>
            <p className="text-slate-500 text-[11px]">
              Claude Code executes <code className="text-cyan-400">web_search</code> through your residential ISP connection with rotating headers and human jitter pacing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
