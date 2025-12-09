ALTER TABLE streets 
ADD COLUMN crashcount INTEGER DEFAULT 0;

UPDATE streets s
SET crashcount = sub.crashcount
FROM (
    SELECT osm_id, count(*) as crashcount
    FROM crash_streets_match
    GROUP BY osm_id
) sub
WHERE s.osm_id = sub.osm_id;