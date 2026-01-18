CREATE INDEX IF NOT EXISTS idx_roads_25832 
    ON roads USING GIST (ST_Transform(geom, 25832));

CREATE INDEX IF NOT EXISTS idx_crashes_25832 
    ON crashes USING GIST (ST_Transform(geom, 25832));

-- 2. Create the Match Table using ST_DWithin
CREATE TABLE crash_road_match AS
SELECT
    s.osm_id AS osm_id, 
    c.ogc_fid AS crash_id,
    c.ujahr AS crash_year,
    c.umonat AS crash_month,
    c.ustunde AS crash_hour,
    c.uwochentag AS crash_weekday
FROM
    roads s
JOIN
    crashes c 
    ON ST_DWithin(ST_Transform(s.geom, 25832), ST_Transform(c.geom, 25832), 20);