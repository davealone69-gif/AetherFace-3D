#!/data/data/com.termux/files/usr/bin/bash
set -e
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"
PYTHON=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PYTHON="$(command -v python)"
else
  printf '%s\n' "Python is missing. Install it in Termux with: pkg install python"
  exit 1
fi
exec "$PYTHON" "$SCRIPT_DIR/start.py" "$@"
