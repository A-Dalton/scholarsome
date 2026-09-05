#!/bin/sh
# Bootstrap: the container starts as root so this script can hand /data (user
# media storage) to the unprivileged "node" user before the application starts.
# This makes updates from the older root-based image automatic: named volumes
# and bind mounts owned by root are fixed on startup, with no manual step.
#
# Running the container as a non-root user (e.g. compose `user: "1000:1000"`)
# skips the bootstrap, and /data is expected to already be writable.
set -e

if [ "$(id -u)" = "0" ]; then
  mkdir -p /data
  chown -R node:node /data
  export HOME=/home/node
  exec su-exec node "$@"
fi

exec "$@"
