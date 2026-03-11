#!/bin/bash
# Try to remove a stuck reward-claim-bot container (permission denied fix).
# Usage: sudo ./docker-remove-stuck-container.sh [CONTAINER_ID]
# Example: sudo ./docker-remove-stuck-container.sh 56bf67ef5dda834f5fa595b779d2352734a3b2fe5400da5ab06f6811da12468d
set -e
CONTAINER_ID="${1:-56bf67ef5dda834f5fa595b779d2352734a3b2fe5400da5ab06f6811da12468d}"

echo "=== Step 1: Restarting Docker daemon ==="
systemctl restart docker
sleep 5

echo "=== Step 2: Force remove container $CONTAINER_ID ==="
if docker rm -f "$CONTAINER_ID" 2>/dev/null; then
  echo "Container removed successfully."
  exit 0
fi

echo "=== Still failed. Trying to remove container directory (requires Docker stopped) ==="
systemctl stop docker
CONTAINER_DIR="/var/lib/docker/containers/${CONTAINER_ID}"
if [ -d "$CONTAINER_DIR" ]; then
  echo "Removing $CONTAINER_DIR ..."
  rm -rf "$CONTAINER_DIR"
  echo "Removed. Starting Docker..."
fi
systemctl start docker
sleep 3

echo "=== Checking if container is gone ==="
docker ps -a | grep -q "$CONTAINER_ID" && echo "Container still listed - try rebooting the machine." || echo "Container no longer exists."
