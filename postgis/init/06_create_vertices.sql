DROP TABLE IF EXISTS ways_vertices;

CREATE TABLE ways_vertices AS
SELECT row_number() OVER () AS id, geom
FROM (
    SELECT ST_StartPoint(the_geom) AS geom FROM ways
    UNION
    SELECT ST_EndPoint(the_geom) AS geom FROM ways
) AS pts;

-- Add spatial index
CREATE INDEX idx_ways_vertices_geom ON ways_vertices USING GIST (geom);
ANALYZE ways_vertices;
