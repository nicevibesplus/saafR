#!/bin/bash
set -e

source /container.env

echo "$(date) - Start Update"

export PGHOST="$POSTGRES_SERVER"
export PGPORT="$POSTGRES_PORT"
export PGUSER="$POSTGRES_USER"
export PGPASSWORD="$POSTGRES_PASSWORD"
export PGDATABASE="$POSTGRES_DB"

psql -f /docker-entrypoint-initdb.d/07_calc_road_anxiety_match.sql  
      
echo "$(date) - Updating table finished."

echo "$(date)" > /shared/road_anxiety.done



