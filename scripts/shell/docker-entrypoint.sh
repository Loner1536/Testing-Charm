#!/bin/bash
set -euo pipefail

WORKDIR="/workspaces/Anime-Reborn"

# Fix ownership issues when bind-mounted files are owned by root or another UID
if [ -d "$WORKDIR" ]; then
    # If any file under the workspace is not owned by the current numeric UID, fix just those
    if sudo find "$WORKDIR" -xdev -not -uid "$(id -u)" -print -quit | grep -q .; then
        echo "Fixing workspace ownership for $(id -u):$(id -g)"
        sudo find "$WORKDIR" -xdev -not -uid "$(id -u)" -exec chown -h "$(id -u):$(id -g)" {} + || true
    fi
fi

# Ensure include directory exists and is writable
mkdir -p "$WORKDIR/include" 2>/dev/null || sudo mkdir -p "$WORKDIR/include" 2>/dev/null || true
chmod 755 "$WORKDIR/include" 2>/dev/null || sudo chmod 755 "$WORKDIR/include" 2>/dev/null || true

# Execute the command passed to the container
exec "$@"