CREATE TABLE crash_streets_match AS
WITH streets3857 AS (
  SELECT
    *,
    ST_Transform(geom, 3857) AS geom_trans
  FROM
    streets
), 
crashes3857 AS (
  SELECT
    *,
    ST_Transform(geom, 3857) AS geom_trans  
  FROM
    crashes_buffered
)
SELECT
    s.osm_id AS osm_id, 
    c.ogc_fid AS crash_id,
    c.ujahr AS crash_year,
    c.umonat AS crash_month,
    c.ustunde AS crash_hour,
    c.uwochentag AS crash_weekday
FROM
    streets3857 s
JOIN
    crashes3857 c ON ST_Intersects(s.geom_trans, c.geom_trans);