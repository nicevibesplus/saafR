#!/bin/bash
# This script runs on first container startup

# Example PBF URL (you can replace it)
PBF_URL="https://download.geofabrik.de/europe/germany/nordrhein-westfalen/muenster-regbez-latest.osm.pbf"

PBF_FILE="/tmp/$(basename $PBF_URL)"
curl -L -o "$PBF_FILE" "$PBF_URL"

# Import into PostGIS
osm2pgsql \
  -d "$POSTGRES_DB" \
  -U "$POSTGRES_USER" \
  --create \
  --hstore \
  "$PBF_FILE"

