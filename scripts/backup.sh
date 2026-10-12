#!/bin/sh
# Backs up the database and uploaded files into ./backups (run from the project folder on the server).
#   sh scripts/backup.sh
# Daily at 02:00 with cron:  0 2 * * * cd /opt/hrms && sh scripts/backup.sh >> backups/backup.log 2>&1
set -e
cd "$(dirname "$0")/.."

# Read only the values needed (safe even if other .env values contain spaces)
env_value() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
MONGO_USER=$(env_value MONGO_ROOT_USER); MONGO_USER=${MONGO_USER:-hrms}
MONGO_PASS=$(env_value MONGO_ROOT_PASSWORD)
[ -n "$MONGO_PASS" ] || { echo "MONGO_ROOT_PASSWORD not found in .env"; exit 1; }

STAMP=$(date +%Y-%m-%d_%H%M)
mkdir -p backups

docker compose exec -T mongo mongodump --username "$MONGO_USER" --password "$MONGO_PASS" \
  --authenticationDatabase admin --db hrms --archive --gzip > "backups/hrms-db-$STAMP.archive.gz"
docker compose exec -T backend tar czf - -C /app uploads > "backups/hrms-uploads-$STAMP.tar.gz"

# Keep the last 14 days
find backups -name "hrms-*" -mtime +14 -delete
echo "Backup done: backups/hrms-db-$STAMP.archive.gz, backups/hrms-uploads-$STAMP.tar.gz"
