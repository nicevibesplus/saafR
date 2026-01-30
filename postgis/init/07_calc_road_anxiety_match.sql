CREATE INDEX IF NOT EXISTS idx_roads_25832 
    ON roads USING GIST (ST_Transform(geom, 25832));

CREATE INDEX IF NOT EXISTS idx_anxiety_areas_25832 
    ON anxiety_areas USING GIST (ST_Transform(geometry, 25832));

DROP TABLE IF EXISTS anxiety_road_match;

CREATE TABLE anxiety_road_match AS
SELECT
    s.osm_id AS osm_id,
    a.uuid AS anxiety_id
FROM
    roads s
JOIN
    anxiety_areas a
    ON ST_DWithin(ST_Transform(s.geom, 25832), ST_Transform(a.geometry, 25832), 20);