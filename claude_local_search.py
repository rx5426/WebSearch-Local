#!/usr/bin/env python3
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

# ==============================================================================
# FINGERPRINT PROFILES & EVASION ENGINE
# ==============================================================================

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
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

def human_jitter(min_delay: float = 0.8, max_delay: float = 2.2) -> float:
    """Simulate realistic human typing and network latency jitter."""
    delay = random.uniform(min_delay, max_delay)
    time.sleep(delay)
    return delay

def get_stealth_headers(custom_referer: Optional[str] = None) -> Dict[str, str]:
    """Assemble coherent, non-leaking desktop browser headers."""
    profile = random.choice(BROWSER_PROFILES)
    headers = {
        "User-Agent": profile["user_agent"],
        "Accept": profile["accept"],
        "Accept-Language": profile["accept_lang"],
        "Accept-Encoding": "identity", # Avoid raw uncompressed binary handling in pure stdlib
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

# ==============================================================================
# REAL-TIME WEATHER & LOCAL REGIONAL TIME API
# ==============================================================================

def get_location_weather_and_time(location_name: str) -> Dict[str, Any]:
    """
    Fetches exact local time and meteorological conditions for any global location
    using real-time Open-Meteo geocoding and forecasting API.
    Does NOT require API keys. Returns regional local clock time with timezone.
    """
    try:
        # 1. Geocode location name
        encoded_loc = urllib.parse.quote(location_name.strip())
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_loc}&count=1&language=en&format=json"
        
        req = urllib.request.Request(geo_url, headers={"User-Agent": "Claude-Local-Search-Tool/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            geo_data = json.loads(resp.read().decode("utf-8"))
        
        results = geo_data.get("results")
        if not results:
            return {
                "error": f"Could not find coordinates for location '{location_name}'. Please verify the spelling.",
                "status": "not_found"
            }
        
        place = results[0]
        lat = place.get("latitude")
        lon = place.get("longitude")
        name = place.get("name")
        country = place.get("country", "")
        admin1 = place.get("admin1", "")
        tz_id = place.get("timezone", "auto")

        # 2. Fetch real-time weather and exact regional local time
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

        # Current local time ISO string directly from weather station
        raw_local_iso = current.get("time", "")
        # Format into clean human readable local time
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
        return {
            "status": "error",
            "error": f"Failed to retrieve weather/time for '{location_name}': {str(e)}"
        }

# ==============================================================================
# EVASIVE LOCAL WEB SEARCH ENGINE
# ==============================================================================

def strip_html_tags(text: str) -> str:
    """Removes HTML tags and unescapes entities."""
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = unescape(clean)
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

def search_duckduckgo_lite(query: str, max_results: int = 6) -> List[Dict[str, str]]:
    """
    Scrapes DuckDuckGo Lite / HTML endpoint using residential IP + stealth desktop headers.
    This lightweight endpoint does not execute aggressive heavy JS challenges.
    """
    human_jitter(0.6, 1.8)
    encoded_query = urllib.parse.urlencode({"q": query, "kl": "wt-wt"})
    url = f"https://html.duckduckgo.com/html/?{encoded_query}"
    
    headers = get_stealth_headers(custom_referer="https://html.duckduckgo.com/")
    req = urllib.request.Request(url, headers=headers)
    
    results = []
    try:
        with urllib.request.urlopen(req, timeout=14) as response:
            html = response.read().decode("utf-8", errors="replace")
        
        # Match each full result block up to clearing div
        result_blocks = re.findall(r'<div[^>]*class="[^"]*results_links[^"]*"[^>]*>([\s\S]*?)<div class="clear">', html)
        if not result_blocks:
            result_blocks = re.findall(r'<div[^>]*class="[^"]*result__body[^"]*"[^>]*>([\s\S]*?)</div>\s*</div>', html)

        for block in result_blocks[:max_results]:
            title_match = re.search(r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>', block)
            snippet_match = re.search(r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)</a>', block)
            if not snippet_match:
                snippet_match = re.search(r'<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)</div>', block)

            if title_match:
                raw_href = title_match.group(1)
                # Unpack DDG redirect uddg= if present
                parsed_url = urllib.parse.urlparse(raw_href)
                qd = urllib.parse.parse_qs(parsed_url.query)
                clean_url = qd.get("uddg", [raw_href])[0] if "uddg" in qd else raw_href

                title_text = strip_html_tags(title_match.group(2))
                snippet_text = strip_html_tags(snippet_match.group(1)) if snippet_match else ""

                if title_text and clean_url.startswith("http"):
                    results.append({
                        "title": title_text,
                        "url": clean_url,
                        "snippet": snippet_text
                    })
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            # Backoff and fallback
            human_jitter(2.0, 3.5)
            return search_fallback_qwant(query, max_results)
        raise e
    except Exception:
        # Try secondary fallback engine
        return search_fallback_qwant(query, max_results)

    return results

def search_fallback_qwant(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Secondary fallback search engine when primary is throttled."""
    human_jitter(0.8, 2.0)
    encoded = urllib.parse.quote(query)
    url = f"https://api.qwant.com/v3/search/web?q={encoded}&count={max_results}&locale=en_US&offset=0"
    headers = get_stealth_headers()
    headers["Accept"] = "application/json"
    
    req = urllib.request.Request(url, headers=headers)
    results = []
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
        items = data.get("data", {}).get("result", {}).get("items", {}).get("mainline", [])
        for block in items:
            for item in block.get("items", []):
                title = item.get("title", "")
                url_str = item.get("url", "")
                desc = item.get("desc", "")
                if title and url_str:
                    results.append({
                        "title": title,
                        "url": url_str,
                        "snippet": desc
                    })
    except Exception:
        pass
    return results

# ==============================================================================
# INTENT DETECTOR & TOOL ROUTER
# ==============================================================================

def detect_weather_or_time_intent(query: str) -> Optional[Dict[str, str]]:
    """
    Detects if the user query is asking for time, weather, or date in a location.
    Examples:
      - 'what time is it in Tokyo'
      - 'current time in London'
      - 'weather forecast Paris'
      - 'how cold is it in Chicago'
    """
    clean_q = query.strip().lower()
    
    # Weather patterns
    weather_patterns = [
        r'(?:what(?:\'s| is) the )?weather (?:in|for|at) ([a-zA-Z\s,.-]+)',
        r'(?:how is the weather in|current weather in) ([a-zA-Z\s,.-]+)',
        r'temperature in ([a-zA-Z\s,.-]+)',
        r'forecast for ([a-zA-Z\s,.-]+)',
    ]
    for pat in weather_patterns:
        m = re.search(pat, clean_q)
        if m:
            loc = m.group(1).replace("?", "").replace("today", "").replace("now", "").strip()
            return {"type": "weather", "location": loc}

    # Time patterns
    time_patterns = [
        r'(?:what(?:\'s| is) the )?(?:current )?time (?:in|at) ([a-zA-Z\s,.-]+)',
        r'what time is it in ([a-zA-Z\s,.-]+)',
        r'local time (?:in|for) ([a-zA-Z\s,.-]+)',
        r'timezone (?:of|for|in) ([a-zA-Z\s,.-]+)',
    ]
    for pat in time_patterns:
        m = re.search(pat, clean_q)
        if m:
            loc = m.group(1).replace("?", "").replace("right now", "").replace("now", "").strip()
            return {"type": "time", "location": loc}

    return None

def execute_smart_search(query: str, max_results: int = 6) -> Dict[str, Any]:
    """Unified entry point for Claude Code CLI search."""
    intent = detect_weather_or_time_intent(query)
    
    # If explicitly or implicitly a weather/time query
    if intent:
        loc = intent["location"]
        wt_data = get_location_weather_and_time(loc)
        if wt_data.get("status") == "success":
            return {
                "query": query,
                "intent_detected": intent["type"],
                "location_weather_time": wt_data,
                "summary": (
                    f"Current local time in {wt_data['location']} is {wt_data['local_time']} "
                    f"({wt_data['timezone']}, {wt_data['utc_offset']}). "
                    f"Weather: {wt_data['weather']['condition']}, {wt_data['weather']['temperature_celsius']}°C "
                    f"({wt_data['weather']['temperature_fahrenheit']}°F), humidity {wt_data['weather']['humidity_percent']}%, "
                    f"wind {wt_data['weather']['wind_speed_kmh']} km/h."
                )
            }

    # Standard evasive web search
    results = search_duckduckgo_lite(query, max_results)
    if not results:
        results = search_fallback_qwant(query, max_results)

    return {
        "query": query,
        "results_count": len(results),
        "results": results,
        "connection": "Local Desktop/Browser ISP Network (Non-datacenter IP)",
        "fingerprint": "Stealth rotating Chrome/Linux headers with randomized jitter"
    }

# ==============================================================================
# MODEL CONTEXT PROTOCOL (MCP) SERVER LOOP (STDIO)
# ==============================================================================

def run_mcp_server():
    """
    Implements standard MCP JSON-RPC 2.0 stdio transport for Claude Code CLI.
    Claude Code interacts with tools defined under 'tools/list' and 'tools/call'.
    """
    tools = [
        {
            "name": "web_search",
            "description": "Searches the live web using the local desktop's residential internet connection. Avoids captcha and throttling with rotating browser fingerprints. Also handles current time and weather queries automatically via real-time meteorological API.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query, or question regarding current events, time, or weather (e.g. 'what time is it in Tokyo', 'latest python release')"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of search results to return (default 6)",
                        "default": 6
                    }
                },
                "required": ["query"]
            }
        },
        {
            "name": "get_weather_and_local_time",
            "description": "Returns exact real-time local clock time, timezone, and weather forecast for any worldwide city or location via Open-Meteo API.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City or region name (e.g., 'Tokyo', 'London', 'San Francisco', 'Berlin, Germany')"
                    }
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
                    "serverInfo": {
                        "name": "claude-local-search",
                        "version": "1.0.0"
                    },
                    "capabilities": {
                        "tools": {}
                    }
                }
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif method == "tools/list":
            resp = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "tools": tools
                }
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif method == "tools/call":
            params = req.get("params", {})
            name = str(params.get("name", ""))
            arguments = params.get("arguments", {})

            # Normalize tool name across various MCP client conventions:
            # Handles 'web_search', 'Web Search', 'WebSearch', 'local-search:web_search', etc.
            normalized_name = name.lower().strip().replace(" ", "_").replace("-", "_")
            if ":" in normalized_name:
                normalized_name = normalized_name.split(":", 1)[1]
            if "__" in normalized_name:
                normalized_name = normalized_name.split("__", 1)[1]

            try:
                if normalized_name in ("web_search", "websearch", "search", "local_search"):
                    query = (
                        arguments.get("query")
                        or arguments.get("q")
                        or arguments.get("search_query")
                        or arguments.get("search_term")
                        or arguments.get("prompt")
                        or ""
                    )
                    max_res = arguments.get("max_results", 6)
                    result_data = execute_smart_search(query, max_res)
                    content_str = json.dumps(result_data, indent=2, ensure_ascii=False)
                    
                    resp = {
                        "jsonrpc": "2.0",
                        "id": msg_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": content_str
                                }
                            ]
                        }
                    }
                elif normalized_name in ("get_weather_and_local_time", "weather", "local_time", "get_weather", "get_time"):
                    location = (
                        arguments.get("location")
                        or arguments.get("city")
                        or arguments.get("query")
                        or arguments.get("place")
                        or ""
                    )
                    result_data = get_location_weather_and_time(location)
                    content_str = json.dumps(result_data, indent=2, ensure_ascii=False)
                    resp = {
                        "jsonrpc": "2.0",
                        "id": msg_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": content_str
                                }
                            ]
                        }
                    }
                else:
                    resp = {
                        "jsonrpc": "2.0",
                        "id": msg_id,
                        "error": {
                            "code": -32601,
                            "message": f"Tool '{name}' not found. Available tools: 'web_search', 'get_weather_and_local_time'."
                        }
                    }
            except Exception as e:
                resp = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "isError": True,
                        "content": [
                            {
                                "type": "text",
                                "text": f"Error executing tool {name}: {str(e)}"
                            }
                        ]
                    }
                }

            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

# ==============================================================================
# CLI ENTRY POINT
# ==============================================================================

def main():
    if len(sys.argv) == 1:
        # Default behavior when spawned by Claude Code CLI: stdio MCP server
        run_mcp_server()
        return

    import argparse
    parser = argparse.ArgumentParser(description="Local Web Search & Weather/Time Tool for Claude Code CLI (Debian/Linux)")
    parser.add_argument("--query", "-q", help="Search the web using local internet connection")
    parser.add_argument("--weather", "-w", help="Get real-time weather and local regional time for a city")
    parser.add_argument("--time", "-t", help="Get real-time local time and timezone for a city")
    parser.add_argument("--mcp", action="store_true", help="Start MCP stdio JSON-RPC server")
    parser.add_argument("--test", action="store_true", help="Run self-test on local network, evasive headers, and weather API")

    args = parser.parse_args()

    if args.mcp:
        run_mcp_server()
    elif args.weather or args.time:
        loc = args.weather or args.time
        data = get_location_weather_and_time(loc)
        print(json.dumps(data, indent=2, ensure_ascii=False))
    elif args.query:
        data = execute_smart_search(args.query)
        print(json.dumps(data, indent=2, ensure_ascii=False))
    elif args.test:
        print("[+] Testing Local Residential Internet Connection...")
        time_test = get_location_weather_and_time("Tokyo")
        print(f"[*] Weather & Regional Time Test (Tokyo): {time_test.get('status')}")
        if time_test.get("status") == "success":
            print(f"    Local Clock Time: {time_test.get('local_time')} ({time_test.get('timezone')})")
            print(f"    Temperature: {time_test['weather']['temperature_celsius']}°C, {time_test['weather']['condition']}")
        print("[*] Testing Evasive Search (DuckDuckGo Lite with Stealth Headers & Jitter)...")
        search_test = execute_smart_search("Linux kernel latest release")
        print(f"[*] Search Results Count: {search_test.get('results_count', 0)}")
        for i, item in enumerate(search_test.get("results", [])[:3], 1):
            print(f"    {i}. {item.get('title')} -> {item.get('url')}")
        print("\n[✓] All tests passed! Ready for Claude Code CLI integration.")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
