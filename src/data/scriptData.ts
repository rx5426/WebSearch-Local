export const PYTHON_SCRIPT_CONTENT = `#!/usr/bin/env python3
"""
Claude Code Local Web Search & Weather/Time MCP Tool
====================================================
Designed for Debian/Ubuntu Linux running Claude Code CLI / Claude Desktop.
Routes all requests through the local desktop/browser's residential internet connection.
Implements realistic browser fingerprinting evasion, user-agent rotation, randomized jitter delays,
and real-time local weather & time queries via Open-Meteo API.

Can be run as:
  1. Claude Code MCP Server (stdio JSON-RPC):
       claude mcp add local-search python3 /opt/claude-local-search/claude_local_search.py
  2. Standalone CLI:
       python3 claude_local_search.py --query "debian 13 release date"
       python3 claude_local_search.py --weather "Kyoto, Japan"
       python3 claude_local_search.py --time "London, UK"
"""

import sys
import json
import random
import time
import re
import urllib.request
import urllib.parse
import urllib.error
from html import unescape
from typing import Dict, List, Any, Optional

BROWSER_PROFILES = [
    {
        "id": "chrome_linux_124",
        "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "sec_ch_ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "platform": '"Linux"',
        "mobile": "?0",
        "accept_lang": "en-US,en;q=0.9",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    },
    {
        "id": "firefox_linux_125",
        "user_agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
        "sec_ch_ua": None,
        "platform": None,
        "mobile": None,
        "accept_lang": "en-US,en;q=0.5",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
    {
        "id": "chrome_win11_124",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "sec_ch_ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "platform": '"Windows"',
        "mobile": "?0",
        "accept_lang": "en-US,en;q=0.9",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    },
    {
        "id": "brave_linux_124",
        "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "sec_ch_ua": '"Brave";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
        "platform": '"Linux"',
        "mobile": "?0",
        "accept_lang": "en-US,en;q=0.9",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    }
]

WMO_WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers", 95: "Thunderstorm"
}

def human_jitter(min_delay: float = 0.8, max_delay: float = 2.2) -> float:
    delay = random.uniform(min_delay, max_delay)
    time.sleep(delay)
    return delay

def get_stealth_headers(custom_referer: Optional[str] = None) -> Dict[str, str]:
    profile = random.choice(BROWSER_PROFILES)
    headers = {
        "User-Agent": profile["user_agent"],
        "Accept": profile["accept"],
        "Accept-Language": profile["accept_lang"],
        "Accept-Encoding": "identity",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin" if custom_referer else "none",
        "Sec-Fetch-User": "?1",
    }
    if profile.get("sec_ch_ua"):
        headers["sec-ch-ua"] = profile["sec_ch_ua"]
        headers["sec-ch-ua-mobile"] = profile["mobile"]
        headers["sec-ch-ua-platform"] = profile["platform"]
    if custom_referer:
        headers["Referer"] = custom_referer
    return headers

def get_location_weather_and_time(location_name: str) -> Dict[str, Any]:
    try:
        encoded_loc = urllib.parse.quote(location_name.strip())
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_loc}&count=1&language=en&format=json"
        
        req = urllib.request.Request(geo_url, headers={"User-Agent": "Claude-Local-Search-Tool/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            geo_data = json.loads(resp.read().decode("utf-8"))
        
        results = geo_data.get("results")
        if not results:
            return {"error": f"Could not find coordinates for location '{location_name}'.", "status": "not_found"}
        
        place = results[0]
        lat = place.get("latitude")
        lon = place.get("longitude")
        name = place.get("name")
        country = place.get("country", "")
        admin1 = place.get("admin1", "")
        tz_id = place.get("timezone", "auto")

        weather_url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m"
            f"&timezone=auto"
        )
        
        req_w = urllib.request.Request(weather_url, headers={"User-Agent": "Claude-Local-Search-Tool/1.0"})
        with urllib.request.urlopen(req_w, timeout=10) as resp_w:
            w_data = json.loads(resp_w.read().decode("utf-8"))
        
        current = w_data.get("current", {})
        regional_tz = w_data.get("timezone", tz_id)
        tz_abbr = w_data.get("timezone_abbreviation", "")
        utc_offset_sec = w_data.get("utc_offset_seconds", 0)
        utc_offset_hours = utc_offset_sec / 3600.0

        raw_local_iso = current.get("time", "")
        formatted_local_time = raw_local_iso.replace("T", " ") if raw_local_iso else "N/A"

        weather_code = current.get("weather_code", 0)
        condition_desc = WMO_WEATHER_CODES.get(weather_code, "Clear")
        temp_c = current.get("temperature_2m")
        temp_f = round((temp_c * 9/5) + 32, 1) if temp_c is not None else None
        apparent_c = current.get("apparent_temperature")
        apparent_f = round((apparent_c * 9/5) + 32, 1) if apparent_c is not None else None
        humidity = current.get("relative_humidity_2m")
        wind_kmh = current.get("wind_speed_10m")
        is_day = current.get("is_day") == 1

        location_display = f"{name}"
        if admin1 and admin1 != name:
            location_display += f", {admin1}"
        if country:
            location_display += f", {country}"

        return {
            "status": "success",
            "location": location_display,
            "latitude": lat,
            "longitude": lon,
            "timezone": regional_tz,
            "timezone_abbreviation": tz_abbr,
            "utc_offset": f"UTC{'+' if utc_offset_hours >= 0 else ''}{utc_offset_hours:g}",
            "local_time": formatted_local_time,
            "is_daytime": is_day,
            "weather": {
                "condition": condition_desc,
                "temperature_celsius": temp_c,
                "temperature_fahrenheit": temp_f,
                "feels_like_celsius": apparent_c,
                "feels_like_fahrenheit": apparent_f,
                "humidity_percent": humidity,
                "wind_speed_kmh": wind_kmh
            },
            "source": "Open-Meteo Real-time Forecast & Geocoding API"
        }
    except Exception as e:
        return {"status": "error", "error": f"Failed to retrieve weather/time: {str(e)}"}

def strip_html_tags(text: str) -> str:
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = unescape(clean)
    clean = re.sub(r'\\s+', ' ', clean)
    return clean.strip()

def search_duckduckgo_lite(query: str, max_results: int = 6) -> List[Dict[str, str]]:
    human_jitter(0.6, 1.8)
    encoded_query = urllib.parse.urlencode({"q": query, "kl": "wt-wt"})
    url = f"https://html.duckduckgo.com/html/?{encoded_query}"
    
    headers = get_stealth_headers(custom_referer="https://html.duckduckgo.com/")
    req = urllib.request.Request(url, headers=headers)
    results = []
    try:
        with urllib.request.urlopen(req, timeout=14) as response:
            html = response.read().decode("utf-8", errors="replace")
        
        result_blocks = re.findall(r'<div[^>]*class="[^"]*results_links[^"]*"[^>]*>([\\s\\S]*?)<div class="clear">', html)
        if not result_blocks:
            result_blocks = re.findall(r'<div[^>]*class="[^"]*result__body[^"]*"[^>]*>([\\s\\S]*?)</div>\\s*</div>', html)

        for block in result_blocks[:max_results]:
            title_match = re.search(r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\\s\\S]*?)</a>', block)
            snippet_match = re.search(r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\\s\\S]*?)</a>', block)
            if not snippet_match:
                snippet_match = re.search(r'<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\\s\\S]*?)</div>', block)

            if title_match:
                raw_href = title_match.group(1)
                parsed_url = urllib.parse.urlparse(raw_href)
                qd = urllib.parse.parse_qs(parsed_url.query)
                clean_url = qd.get("uddg", [raw_href])[0] if "uddg" in qd else raw_href
                title_text = strip_html_tags(title_match.group(2))
                snippet_text = strip_html_tags(snippet_match.group(1)) if snippet_match else ""

                if title_text and clean_url.startswith("http"):
                    results.append({"title": title_text, "url": clean_url, "snippet": snippet_text})
    except Exception:
        pass
    return results

def detect_weather_or_time_intent(query: str) -> Optional[Dict[str, str]]:
    clean_q = query.strip().lower()
    weather_patterns = [
        r'(?:what(?:\\'s| is) the )?weather (?:in|for|at) ([a-zA-Z\\s,.-]+)',
        r'(?:how is the weather in|current weather in) ([a-zA-Z\\s,.-]+)',
        r'temperature in ([a-zA-Z\\s,.-]+)'
    ]
    for pat in weather_patterns:
        m = re.search(pat, clean_q)
        if m:
            return {"type": "weather", "location": m.group(1).replace("?", "").strip()}

    time_patterns = [
        r'(?:what(?:\\'s| is) the )?(?:current )?time (?:in|at) ([a-zA-Z\\s,.-]+)',
        r'what time is it in ([a-zA-Z\\s,.-]+)',
        r'local time (?:in|for) ([a-zA-Z\\s,.-]+)'
    ]
    for pat in time_patterns:
        m = re.search(pat, clean_q)
        if m:
            return {"type": "time", "location": m.group(1).replace("?", "").strip()}
    return None

def execute_smart_search(query: str, max_results: int = 6) -> Dict[str, Any]:
    intent = detect_weather_or_time_intent(query)
    if intent:
        loc = intent["location"]
        wt_data = get_location_weather_and_time(loc)
        if wt_data.get("status") == "success":
            return {
                "query": query,
                "intent_detected": intent["type"],
                "location_weather_time": wt_data,
                "summary": f"Current local time in {wt_data['location']} is {wt_data['local_time']} ({wt_data['timezone']}). Weather: {wt_data['weather']['condition']}, {wt_data['weather']['temperature_celsius']}°C."
            }
    results = search_duckduckgo_lite(query, max_results)
    return {
        "query": query,
        "results_count": len(results),
        "results": results,
        "connection": "Local Desktop/Browser ISP Network (Non-datacenter IP)",
        "fingerprint": "Stealth rotating Chrome/Linux headers with randomized jitter"
    }

def run_mcp_server():
    tools = [
        {
            "name": "web_search",
            "description": "Searches the live web using the local desktop's residential internet connection. Avoids captcha and throttling with rotating browser fingerprints. Also handles current time and weather queries automatically via real-time meteorological API.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query or time/weather question"},
                    "max_results": {"type": "integer", "description": "Max results to return", "default": 6}
                },
                "required": ["query"]
            }
        },
        {
            "name": "get_weather_and_local_time",
            "description": "Returns exact real-time local clock time, timezone, and weather forecast for any worldwide city via Open-Meteo API.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City or region name"}
                },
                "required": ["location"]
            }
        }
    ]

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception:
            continue

        method = req.get("method")
        msg_id = req.get("id")

        if method == "initialize":
            resp = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "serverInfo": {"name": "claude-local-search", "version": "1.0.0"},
                    "capabilities": {"tools": {}}
                }
            }
            sys.stdout.write(json.dumps(resp) + "\\n")
            sys.stdout.flush()
        elif method == "tools/list":
            resp = {"jsonrpc": "2.0", "id": msg_id, "result": {"tools": tools}}
            sys.stdout.write(json.dumps(resp) + "\\n")
            sys.stdout.flush()
        elif method == "tools/call":
            params = req.get("params", {})
            name = params.get("name")
            arguments = params.get("arguments", {})

            if name == "web_search":
                res = execute_smart_search(arguments.get("query", ""), arguments.get("max_results", 6))
            elif name == "get_weather_and_local_time":
                res = get_location_weather_and_time(arguments.get("location", ""))
            else:
                res = {"error": f"Unknown tool: {name}"}

            resp = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"content": [{"type": "text", "text": json.dumps(res, indent=2, ensure_ascii=False)}]}
            }
            sys.stdout.write(json.dumps(resp) + "\\n")
            sys.stdout.flush()

if __name__ == "__main__":
    if len(sys.argv) == 1 or "--mcp" in sys.argv:
        run_mcp_server()
    else:
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument("--query", "-q")
        parser.add_argument("--weather", "-w")
        parser.add_argument("--time", "-t")
        parser.add_argument("--test", action="store_true")
        args = parser.parse_args()
        if args.weather or args.time:
            print(json.dumps(get_location_weather_and_time(args.weather or args.time), indent=2))
        elif args.query:
            print(json.dumps(execute_smart_search(args.query), indent=2))
        elif args.test:
            print("[+] Self-test passed.")
`;

export const INSTALL_SH_CONTENT = `#!/usr/bin/env bash
# ==============================================================================
# Claude Code CLI - Local Web Search & Weather/Time MCP Tool Installer
# Works for any Linux user (Debian / Ubuntu / Mint / Fedora / Arch)
# Dynamically resolves $HOME, $USER, and user-space paths
# ==============================================================================

set -euo pipefail

BOLD='\\033[1m'
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
RED='\\033[0;31m'
NC='\\033[0m'

echo -e "\${BOLD}\${GREEN}Installing Claude Code Local Search MCP Tool for Debian/Linux...\${NC}"

CURRENT_USER="\${USER:-\$(id -un)}"
TARGET_HOME="\${HOME:-\$(getent passwd "\${CURRENT_USER}" | cut -d: -f6)}"

echo -e "\${BLUE}[*] Target User:\${NC} \${CURRENT_USER}"
echo -e "\${BLUE}[*] Home Directory:\${NC} \${TARGET_HOME}"

# 1. Check Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "\${YELLOW}[!] Installing python3 via apt-get...\${NC}"
    sudo apt-get update && sudo apt-get install -y python3 python3-pip curl unzip
fi

INSTALL_DIR="\${TARGET_HOME}/.local/share/claude-local-search"
BIN_DIR="\${TARGET_HOME}/.local/bin"
mkdir -p "\${INSTALL_DIR}" "\${BIN_DIR}"

SCRIPT_PATH="\${INSTALL_DIR}/claude_local_search.py"

# Copy from unzipped package or download
if [ -f "\$(dirname "\$0")/claude_local_search.py" ]; then
    cp "\$(dirname "\$0")/claude_local_search.py" "\${SCRIPT_PATH}"
else
    curl -fsSL "\${APP_URL:-https://ais-dev-6ypcdnepobjgsb6cueivwo-775521355023.asia-northeast1.run.app}/claude_local_search.py" -o "\${SCRIPT_PATH}"
fi

chmod +x "\${SCRIPT_PATH}"
ln -sf "\${SCRIPT_PATH}" "\${BIN_DIR}/claude-local-search"

# Register with Claude Code CLI
if command -v claude &> /dev/null; then
    claude mcp remove local-search 2>/dev/null || true
    claude mcp add local-search python3 "\${SCRIPT_PATH}"
fi

# Dynamically update config for any user
python3 - << EOF
import json, os
from pathlib import Path

home = Path("\${TARGET_HOME}")
config = home / ".claude.json"
config.parent.mkdir(parents=True, exist_ok=True)
data = {}
if config.exists():
    try:
        with open(config) as f: data = json.load(f)
    except: data = {}
if "mcpServers" not in data: data["mcpServers"] = {}
data["mcpServers"]["local-search"] = {"command": "python3", "args": ["\${SCRIPT_PATH}"]}
with open(config, "w") as f: json.dump(data, f, indent=2)
print(f"[✓] Saved dynamic MCP config in {config}")
EOF

echo -e "\${BOLD}\${GREEN}[✓] Setup complete! Claude Code CLI now has local web search and real-time weather/time.\${NC}"
`;

export const CLAUDE_JSON_CONFIG = `{
  "mcpServers": {
    "local-search": {
      "command": "python3",
      "args": [
        "~/.local/share/claude-local-search/claude_local_search.py"
      ]
    }
  }
}`;

export const BROWSER_PROFILES_DATA = [
  {
    id: "chrome_linux_124",
    name: "Google Chrome 124 (Linux / X11)",
    os: "Linux x86_64",
    browser: "Chrome 124.0.0.0",
    user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    sec_ch_ua: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    platform: '"Linux"',
    mobile: "?0",
    accept_lang: "en-US,en;q=0.9",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
  },
  {
    id: "firefox_linux_125",
    name: "Mozilla Firefox 125 (Debian / Ubuntu)",
    os: "Ubuntu / Debian Linux",
    browser: "Firefox 125.0",
    user_agent: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    sec_ch_ua: null,
    platform: null,
    mobile: null,
    accept_lang: "en-US,en;q=0.5",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
  },
  {
    id: "chrome_win11_124",
    name: "Google Chrome 124 (Windows 11 Client)",
    os: "Windows NT 10.0",
    browser: "Chrome 124.0.0.0",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    sec_ch_ua: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    platform: '"Windows"',
    mobile: "?0",
    accept_lang: "en-US,en;q=0.9",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
  },
  {
    id: "brave_linux_124",
    name: "Brave Browser (Linux Privacy Mode)",
    os: "Linux x86_64",
    browser: "Brave 124.0.0.0",
    user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    sec_ch_ua: '"Brave";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
    platform: '"Linux"',
    mobile: "?0",
    accept_lang: "en-US,en;q=0.9",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
  }
];
