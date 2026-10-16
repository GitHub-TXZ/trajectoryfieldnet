#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${1:-8766}"
cd "$ROOT"
echo "Presentation folder: $ROOT"
echo "Open: http://127.0.0.1:${PORT}/index.html"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
