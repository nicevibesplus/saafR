#!/bin/bash
set -e

echo "Importing Shapefile …"

ogr2ogr -f "PostgreSQL" \
  PG:"dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD" \
  /streets/StreetsMuenster.shp \
  -lco GEOMETRY_NAME=geom \
  -nln public.streets \
  -nlt PROMOTE_TO_MULTI \
  --config SHAPE_ENCODING "CP1252"
