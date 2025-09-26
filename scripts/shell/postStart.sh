#!/bin/bash
set -euo pipefail

# --- Step 1: Fix workspace permissions if needed ---
if [ "$(id -u)" != "$(stat -c '%u' /workspace)" ]; then
    echo "⚠ Fixing workspace permissions..."
    sudo chown -R "$(id -u):$(id -g)" /workspace || true
fi

# --- Step 2: Install node_modules if missing ---
if [ ! -d "node_modules" ]; then
    echo "➤ Installing node packages..."
    npm install
else
    echo "✔ Node modules already installed, skipping"
fi

# --- Step 3: Install rokit packages if missing ---
if [ ! -d "rokit_modules" ]; then
    echo "➤ Installing rokit packages..."
    rokit install --no-trust-check
else
    echo "✔ Rokit packages already installed, skipping"
fi
