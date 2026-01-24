INSERT INTO anxiety_areas
(
    approved,
    start_time,
    end_time,
    geometry,
    active_days,
    lighting,
    likes,
    location_type,
    remark,
    severity,
    trigger_type
)
VALUES
(
    false,
    '17:00:00',
    '08:00:00',
    ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[7.616025209,51.957618959]}'), 4326),
    ARRAY[0,1,2,3,4,5,6],
    1,
    0,
    'Tunnel',
    'A very dark tunnel',
    5,
    ARRAY['Dark tunnel', 'Poor Visibility']
),
(
    false,
    '17:00:00',
    '08:00:00',
    ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[7.62547195,51.963658233]}'), 4326),
    ARRAY[0,1,2,3,4,5,6],
    1,
    0,
    'Allyway',
    NULL,
    3,
    ARRAY['Poor Visibility']
);
