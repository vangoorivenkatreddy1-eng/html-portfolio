#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"

if ! command -v python3 >/dev/null; then
  echo "python3 is required to serve static files" >&2
  exit 1
fi

if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "Static server already listening on port ${PORT}"
  exit 0
fi

exec python3 -m http.server "$PORT" --bind 0.0.0.0
