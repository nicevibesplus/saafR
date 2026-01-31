CREATE INDEX IF NOT EXISTS idx_roads_25832 
    ON roads USING GIST (ST_Transform(geom, 25832));

CREATE INDEX IF NOT EXISTS idx_crashes_25832 
    ON crashes USING GIST (ST_Transform(geom, 25832));

CREATE TABLE crash_road_match AS
SELECT
    s.osm_id AS osm_id, 
    c.ogc_fid AS crash_id
FROM
    roads s
JOIN
    crashes c 
    ON ST_DWithin(ST_Transform(s.geom, 25832), ST_Transform(c.geom, 25832), 20);