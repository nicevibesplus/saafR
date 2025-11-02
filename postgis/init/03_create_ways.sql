DROP TABLE IF EXISTS ways;

CREATE TABLE ways AS
SELECT
    osm_id AS id,
    ST_Transform(way, 3857) AS the_geom,
    ST_Length(ST_Transform(way, 3857)) AS cost
FROM planet_osm_line
WHERE highway IS NOT NULL

