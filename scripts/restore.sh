#!/bin/sh
# Restores a database backup made by backup.sh (or a mongodump archive from your PC).
#   sh scripts/restore.sh backups/hrms-db-2026-10-12_0200.archive.gz
# WARNING: replaces the current HRMS database with the backup.
set -e
cd "$(dirname "$0")/.."
FILE="$1"
[ -f "$FILE" ] || { echo "Usage: sh scripts/restore.sh <backup-file.archive.gz>"; exit 1; }
env_value() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
MONGO_USER=$(env_value MONGO_ROOT_USER); MONGO_USER=${MONGO_USER:-hrms}
MONGO_PASS=$(env_value MONGO_ROOT_PASSWORD)
printf "This replaces the current database with %s. Type YES to continue: " "$FILE"; read -r answer
[ "$answer" = "YES" ] || { echo "Cancelled."; exit 1; }
docker compose exec -T mongo mongorestore --username "$MONGO_USER" --password "$MONGO_PASS" \
  --authenticationDatabase admin --archive --gzip --drop < "$FILE"
echo "Restore finished."
