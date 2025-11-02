# Base PostGIS image
FROM postgis/postgis:15-3.4

# Install osm2pgsql, curl, and pgRouting
RUN apt-get update && \
    apt-get install -y osm2pgsql curl postgresql-15-pgrouting && \
    rm -rf /var/lib/apt/lists/*
