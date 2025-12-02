#!/bin/bash
set -e

echo "Importing Shapefile …"

ogr2ogr -f "PostgreSQL" \
  PG:"dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD" \
  /crash/CrashDataWithOSMID.shp \
  -nln public.crashes \
  -lco GEOMETRY_NAME=geom \
  -nlt PROMOTE_TO_MULTI
