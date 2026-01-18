#!/bin/bash
set -e

ls -R /data

echo "1. Importing streets to postgis:"
ogr2ogr -f "PostgreSQL" \
    PG:"dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD" \
    /data/roads/roads.shp \
    -lco GEOMETRY_NAME=geom \
    -nln public.roads \
    -nlt PROMOTE_TO_MULTI \
    --config SHAPE_ENCODING "CP1252"
echo "   -> Import completed."

echo "2. Importing crashes to postgis:"
ogr2ogr -f "PostgreSQL" \
    PG:"dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD" \
    /data/crashes/crashes.shp \
    -lco GEOMETRY_NAME=geom \
    -nln public.crashes \
    -nlt PROMOTE_TO_MULTI \
    --config SHAPE_ENCODING "CP1252"
echo "   -> Import completed."
