#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
else
  echo "nvm not found at $NVM_DIR/nvm.sh" >&2
  exit 1
fi

nvm use 24.14.0 >/dev/null

echo "Project: $(pwd)"
echo "Node: $(node -v)"
echo "npm: $(npm -v)"

npm install

echo
echo "Ready."
echo "Next commands:"
echo "  npm run dev"
echo "  npm run lint"
echo "  npm run build"
