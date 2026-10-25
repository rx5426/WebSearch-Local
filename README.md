# Claude Code CLI: Local Web Search & Weather/Time MCP Tool

A local residential web search tool and real-time regional weather/clock engine built specifically for **Claude Code CLI** and **Claude Desktop** on **Debian / Ubuntu / Linux**.

## Why Local Search?
- **Residential ISP IP**: Outbound traffic originates from your local machine, not datacenter server racks (AWS/GCP/Azure) that get blocked by Cloudflare, Datadome, and CAPTCHAs.
- **Fingerprinting Evasion**: Rotates realistic modern desktop browser headers (Chrome 124 Linux/X11, Firefox 125, Windows 11) with matching `Sec-CH-UA`, `Sec-CH-UA-Platform`, and `Sec-Fetch-*` client hints.
- **Human Latency Pacing**: Injects randomized delay (0.8s - 2.2s) between requests to prevent heuristic rate limiting.
- **Real-Time Regional Weather & Clock**: Automatically resolves exact local time and meteorological conditions worldwide via Open-Meteo's sensor API.

## Quick Installation

### Option 1: Using the bundled `install.sh` (from zip)
Unzip and run:
```bash
unzip claude-local-search.zip -d claude-local-search
cd claude-local-search
chmod +x install.sh
./install.sh
```

### Option 2: Direct one-line command (curl)
```bash
curl -fsSL https://ais-dev-6ypcdnepobjgsb6cueivwo-775521355023.asia-northeast1.run.app/install.sh | bash
```

## How It Configures Claude Code
`install.sh` automatically:
1. Copies `claude_local_search.py` to `~/.local/share/claude-local-search/claude_local_search.py`
2. Creates a symlink at `~/.local/bin/claude-local-search`
3. Registers the tool with Claude Code CLI via:
   ```bash
   claude mcp add local-search python3 ~/.local/share/claude-local-search/claude_local_search.py
   ```
4. Dynamically writes `~/.claude.json` using your actual `$HOME` and `$USER` paths (never hardcoded!).

## Test Commands
```bash
# Verify local setup and connection:
claude-local-search --test

# Query exact regional time & weather:
claude-local-search --weather "Tokyo, Japan"
claude-local-search --time "London, UK"

# Perform evasive search:
claude-local-search --query "Debian 13 trixie release notes"
```

## In Claude Code CLI
In your Claude Code CLI prompt, you can now ask:
- *"What is the current time and weather in Tokyo right now?"*
- *"Search the web for the latest updates on Linux kernel 6.x security patches"*
Claude Code will automatically invoke the local MCP tool through your local machine's connection!
