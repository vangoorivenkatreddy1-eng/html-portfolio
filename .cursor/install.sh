#!/usr/bin/env bash
set -euo pipefail

# Static HTML portfolio — verify core pages exist after checkout.
for page in index.html movie-ranking.html birthday-invite.html contact.html about.html; do
  test -f "$page"
done
