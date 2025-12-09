#!/bin/bash
set -e

echo "Exporting Shapefile …"

ogr2ogr -f "ESRI Shapefile" streets/streets_export.shp \
    PG:"dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD" \
    "streets" \
    -lco ENCODING=UTF-8