#!/bin/sh
set -e

# /app/data ist ein Bind-Mount. Auf Linux-Hosts legt Docker den Ordner als
# root:root an — der App-User (nextjs, uid 1001) kann dann nicht schreiben
# (SQLITE_CANTOPEN). Rechte hier einmalig korrigieren, dann Privilegien abgeben.
mkdir -p /app/data
if [ "$(stat -c %u /app/data)" != "1001" ]; then
  chown -R nextjs:nodejs /app/data
fi

exec su-exec nextjs:nodejs "$@"
