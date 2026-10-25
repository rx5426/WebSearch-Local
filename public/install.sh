#!/usr/bin/env bash
# ==============================================================================
# Claude Code CLI - Local Web Search & Weather/Time MCP Tool Installer
# Works for any Linux user (Debian / Ubuntu / Mint / Fedora / Arch)
# Dynamically resolves $HOME, $USER, and user-space paths
# ==============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}===================================================================${NC}"
echo -e "${BOLD}${GREEN} Claude Code CLI: Local Web Search & Weather/Time MCP Installer    ${NC}"
echo -e "${BOLD}${BLUE}===================================================================${NC}"
echo ""

CURRENT_USER="${USER:-$(id -un)}"
TARGET_HOME="${HOME:-$(getent passwd "${CURRENT_USER}" | cut -d: -f6)}"

if [ -z "${TARGET_HOME}" ] || [ ! -d "${TARGET_HOME}" ]; then
    echo -e "${RED}[ERROR] Could not resolve home directory for user: ${CURRENT_USER}${NC}"
    exit 1
fi

echo -e "${BLUE}[*] Detected User:${NC} ${CURRENT_USER}"
echo -e "${BLUE}[*] Home Directory:${NC} ${TARGET_HOME}"

if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}[!] Python 3 not found. Attempting to install via package manager...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y python3 python3-pip curl unzip
    else
        echo -e "${RED}[ERROR] Python 3 is required. Please install python3 and re-run this script.${NC}"
        exit 1
    fi
else
    PY_VER=$(python3 --version)
    echo -e "${GREEN}[✓] Found ${PY_VER}${NC}"
fi

INSTALL_DIR="${TARGET_HOME}/.local/share/claude-local-search"
BIN_DIR="${TARGET_HOME}/.local/bin"
CLAUDE_CONFIG_DIR="${TARGET_HOME}/.claude"

mkdir -p "${INSTALL_DIR}" "${BIN_DIR}" "${CLAUDE_CONFIG_DIR}"

SCRIPT_PATH="${INSTALL_DIR}/claude_local_search.py"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "${CURRENT_DIR}/claude_local_search.py" ]; then
    echo -e "${GREEN}[✓] Using bundled claude_local_search.py from package${NC}"
    cp "${CURRENT_DIR}/claude_local_search.py" "${SCRIPT_PATH}"
else
    echo -e "${YELLOW}[*] Downloading latest claude_local_search.py...${NC}"
    DOWNLOAD_URL="${APP_URL:-https://ais-dev-6ypcdnepobjgsb6cueivwo-775521355023.asia-northeast1.run.app}"
    curl -fsSL "${DOWNLOAD_URL}/claude_local_search.py" -o "${SCRIPT_PATH}" || {
        echo -e "${RED}[ERROR] Failed to download script.${NC}"
        exit 1
    }
fi

chmod +x "${SCRIPT_PATH}"
ln -sf "${SCRIPT_PATH}" "${BIN_DIR}/claude-local-search"
echo -e "${GREEN}[✓] Created CLI symlink: ${BIN_DIR}/claude-local-search${NC}"

if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
    BASHRC="${TARGET_HOME}/.bashrc"
    if [ -f "${BASHRC}" ] && ! grep -q 'PATH=.*\.local/bin' "${BASHRC}"; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "${BASHRC}"
        echo -e "${YELLOW}[*] Added ~/.local/bin to PATH in ${BASHRC}${NC}"
    fi
fi

echo ""
echo -e "${BLUE}[*] Registering with Claude Code CLI...${NC}"

if command -v claude &> /dev/null; then
    echo -e "${GREEN}[✓] Found claude CLI in PATH! Registering MCP server...${NC}"
    claude mcp remove local-search 2>/dev/null || true
    claude mcp add local-search python3 "${SCRIPT_PATH}"
    echo -e "${GREEN}[✓] MCP server 'local-search' registered successfully with Claude Code!${NC}"
else
    echo -e "${YELLOW}[!] 'claude' CLI command not found in current PATH.${NC}"
fi

python3 - << EOF_CONFIG
import json
import os
from pathlib import Path

home_dir = "${TARGET_HOME}"
config_file = Path(home_dir) / ".claude.json"
desktop_config_file = Path(home_dir) / ".config" / "Claude" / "claude_desktop_config.json"
script_file = "${SCRIPT_PATH}"

targets = [config_file, desktop_config_file]
for target in targets:
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        data = {}
        if target.exists():
            try:
                with open(target, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = {}
        
        if "mcpServers" not in data or not isinstance(data["mcpServers"], dict):
            data["mcpServers"] = {}
        
        data["mcpServers"]["local-search"] = {
            "command": "python3",
            "args": [script_file]
        }
        
        with open(target, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"[✓] Updated MCP config with dynamic path: {target}")
    except Exception as e:
        print(f"[!] Warning updating {target}: {e}")
EOF_CONFIG

echo ""
echo -e "${BLUE}[*] Running local residential internet connection self-test...${NC}"
python3 "${SCRIPT_PATH}" --test

echo ""
echo -e "${BOLD}${GREEN}===================================================================${NC}"
echo -e "${BOLD}${GREEN} Installation Complete for user ${CURRENT_USER}!                 ${NC}"
echo -e "${BOLD}${BLUE}===================================================================${NC}"
echo ""
echo -e "Script installed at: ${BOLD}${SCRIPT_PATH}${NC}"
echo -e "CLI Command:         ${BOLD}claude-local-search${NC}"
echo ""
