# Base PostGIS image
FROM postgis/postgis:15-3.4

RUN apt-get update && apt-get install -y \
    postgresql-15-pgrouting \
    libpqxx-dev libboost-dev libboost-program-options-dev \
    libexpat1-dev expat cmake build-essential git \
    postgresql-server-dev-15 \
    curl \
    osmctools \
    && rm -rf /var/lib/apt/lists/*

    # Clone and build osm2pgrouting
RUN git clone https://github.com/pgRouting/osm2pgrouting.git /osm2pgrouting \
    && mkdir /osm2pgrouting/build \
    && cd /osm2pgrouting/build \
    && cmake .. \
    && make \
    && make install

    # Copy mapconfig.xml from osm2pgrouting repo
RUN cp /osm2pgrouting/mapconfig.xml /mapconfig.xml