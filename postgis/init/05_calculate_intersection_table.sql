CREATE INDEX idx_streets_3857 ON streets USING GIST (ST_Transform(geom, 3857));
CREATE INDEX idx_crashes_3857 ON crashes_buffered USING GIST (ST_Transform(geom, 3857));

CREATE TABLE crash_streets_match AS
SELECT
    s.osm_id AS osm_id, 
    c.ogc_fid AS crash_id,
    c.ujahr AS crash_year,
    c.umonat AS crash_month,
    c.ustunde AS crash_hour,
    c.uwochentag AS crash_weekday
FROM
    streets s
JOIN
    crashes_buffered c 
    -- Hier wird jetzt der funktionale Index genutzt:
    ON ST_Intersects(ST_Transform(s.geom, 3857), ST_Transform(c.geom, 3857));