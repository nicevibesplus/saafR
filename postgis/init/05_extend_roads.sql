ALTER TABLE roads
add crash_count int NOT NULL DEFAULT 0;

UPDATE roads
SET crash_count = sub.cnt
FROM (
    SELECT osm_id, COUNT(*) as cnt
    FROM crash_road_match
    GROUP BY osm_id
) sub
WHERE roads.osm_id = sub.osm_id;