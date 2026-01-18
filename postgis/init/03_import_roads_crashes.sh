#!/bin/bash
set -e

ls -R /data


echo "0. Preparing Boundaries (Reprojecting to EPSG:4326)..."
ogr2ogr -f "ESRI Shapefile" \
    -t_srs EPSG:4326 \
    /tmp/boundaries.shp \
    /data/boundaries/boundaries.shp
echo "   -> Preparation completed."

echo "1. Importing streets to postgis:"
ogr2ogr -f "PostgreSQL" \
    PG:"dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD" \
    /data/roads/roads.shp \
    -t_srs EPSG:4326 \
    -clipsrc /tmp/boundaries.shp \
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
