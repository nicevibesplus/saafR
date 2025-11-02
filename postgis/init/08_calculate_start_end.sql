-- Adjust tolerance depending on your projection (e.g., 0.1 meters in EPSG:3857)
UPDATE ways AS w
SET source = v.id
FROM ways_vertices AS v
WHERE ST_DWithin(w.start_pt, v.geom, 1);

UPDATE ways AS w
SET target = v.id
FROM ways_vertices AS v
WHERE ST_DWithin(w.end_pt, v.geom, 1);

WITH cc AS (
    SELECT id, component
    FROM pgr_connectedComponents(
        'SELECT id, source, target, cost, reverse_cost FROM ways'
    )
)
, largest AS (
    SELECT component
    FROM cc
    GROUP BY component
    ORDER BY COUNT(*) DESC
    LIMIT 1
)
DELETE FROM ways
WHERE id IN (
    SELECT id FROM cc WHERE component <> (SELECT component FROM largest)
);