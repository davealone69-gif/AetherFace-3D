#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")" || exit 1
command -v python >/dev/null 2>&1 || { echo "Install Python: pkg install python"; exit 1; }
exec python start.py "$@"
