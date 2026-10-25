import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, FileText } from 'lucide-react';
import { PYTHON_SCRIPT_CONTENT, INSTALL_SH_CONTENT, CLAUDE_JSON_CONFIG } from '../data/scriptData';

interface ScriptViewerProps {
  onDownloadFile: (filename: string, content: string) => void;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({ onDownloadFile }) => {
  const [activeFile, setActiveFile] = useState<'python' | 'install' | 'config' | 'requirements'>('python');
  const [copied, setCopied] = useState(false);

  const getActiveContent = () => {
    switch (activeFile) {
      case 'python':
        return { filename: 'claude_local_search.py', content: PYTHON_SCRIPT_CONTENT, lang: 'python' };
      case 'install':
        return { filename: 'install.sh', content: INSTALL_SH_CONTENT, lang: 'bash' };
      case 'config':
        return { filename: '.claude.json', content: CLAUDE_JSON_CONFIG, lang: 'json' };
      case 'requirements':
        return { filename: 'requirements.txt', content: 'requests>=2.31.0\nbeautifulsoup4>=4.12.0\nurllib3>=2.0.0\n', lang: 'text' };
    }
  };

  const { filename, content } = getActiveContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Script Source Code &amp; Config Inspector
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Inspect, copy, or download the production Debian Python script and bash installer.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : `Copy ${filename}`}</span>
            </button>
            <button
              onClick={() => onDownloadFile(filename, content)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {filename}</span>
            </button>
          </div>
        </div>

        {/* Tab selection for files */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveFile('python')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
              activeFile === 'python'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>claude_local_search.py</span>
          </button>

          <button
            onClick={() => setActiveFile('install')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
              activeFile === 'install'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>install.sh</span>
          </button>

          <button
            onClick={() => setActiveFile('config')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
              activeFile === 'config'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.claude.json</span>
          </button>

          <button
            onClick={() => setActiveFile('requirements')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
              activeFile === 'requirements'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>requirements.txt</span>
          </button>
        </div>

        {/* Code display */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-t border-x border-slate-800 rounded-t-lg text-xs font-mono text-slate-400">
            <span>{filename}</span>
            <span className="text-slate-500">{content.split('\n').length} lines · UTF-8</span>
          </div>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-b-lg text-xs font-mono text-slate-200 overflow-x-auto max-h-[620px] leading-relaxed">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};
