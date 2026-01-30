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
),
(
    false,
    '00:00:00',
    '24:00:00',
    ST_SetSRID(
        ST_GeomFromGeoJSON(
            '{
              "type": "Polygon",
              "coordinates": [
                [
                  [7.637954685723149, 51.95732076590641],
                  [7.637943957631414, 51.957324074199086],
                  [7.638534002676517, 51.95724136680916],
                  [7.638598371226886, 51.95702963519565],
                  [7.637874225035197, 51.95685098586899],
                  [7.637954685723149, 51.95732076590641]
                ]
              ]
            }'
        ),
        4326
    ),
    ARRAY[0,1,2,3,4,5,6],
    2,
    0,
    'Park',
    '',
    3,
    ARRAY['Poor Visibility', 'Alcohol']
);
