#!/bin/bash
set -e

# Container-ENV explizit übernehmen
export POSTGRES_USER=${POSTGRES_USER:-admin}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-admin}
export POSTGRES_DB=${POSTGRES_DB:-saafr}
export POSTGRES_SERVER=${POSTGRES_SERVER:-postgis}
export POSTGRES_PORT=${POSTGRES_PORT:-5432}

echo "$(date) - Start Update"

psql "postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_SERVER:$POSTGRES_PORT/$POSTGRES_DB" \
     -f /docker-entrypoint-initdb.d/07_calc_road_anxiety_match.sql

echo "$(date) - Updating table finished."

echo "$(date)" > /shared/road_anxiety.done



