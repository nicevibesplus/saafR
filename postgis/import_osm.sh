#!/bin/bash
# import_osm.sh
set -e

# Environment variables inside the container
DB_NAME="${POSTGRES_DB}"       # Default to 'saafr' if not set
DB_USER="${POSTGRES_USER}"     # Default to 'admin' if not set
DB_HOST="localhost" # Default to localhost
OSM_URL="https://download.geofabrik.de/europe/germany/nordrhein-westfalen/muenster-regbez-latest.osm.pbf"
OSM_FILE="/tmp/muenster-regbez-latest.osm.pbf"
MAP_CONFIG="/mapconfig.xml"

echo "Waiting for Postgres ($DB_HOST) to be ready..."
until pg_isready -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done

echo
echo "Postgres is ready. Downloading OSM file..."
curl -L "$OSM_URL" -o "$OSM_FILE"

echo "Converting PBF to OSM format..."
osmconvert "$OSM_FILE" --drop-author --drop-version --out-osm -o="$OSM_FILE.osm"

echo "Starting osm2pgrouting import..."
osm2pgrouting \
    --f "$OSM_FILE.osm" \
    --conf "$MAP_CONFIG" \
    --dbname "$DB_NAME" \
    --username "$DB_USER" \
    --host "$DB_HOST" \
    --clean

echo "OSM import finished!"
