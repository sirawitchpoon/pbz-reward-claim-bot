#!/bin/bash
# Use a new project name and port so we don't need to remove the stuck container.
# Dashboard will be at http://localhost:3457 (or run with ADMIN_HTTP_PORT=3458 for 3458).
set -e
cd "$(dirname "$0")"
export ADMIN_HTTP_PORT="${ADMIN_HTTP_PORT:-3457}"
echo "Starting reward-claim-bot on port $ADMIN_HTTP_PORT (project: rcb2)..."
docker compose -p rcb2 up -d --build
echo "Done. Open http://localhost:$ADMIN_HTTP_PORT for the admin dashboard."
echo "To stop: docker compose -p rcb2 down"
