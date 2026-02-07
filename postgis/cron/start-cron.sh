#!/bin/bash
# Cronjobs installieren
crontab /postgis/cron/road_anxiety.cron

# Cron im Hintergrund starten
cron

# Postgres starten (ENTRYPOINT-Skript)
exec docker-entrypoint.sh postgres
