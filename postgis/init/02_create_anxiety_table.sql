DROP TABLE IF EXISTS anxiety_areas;

CREATE TABLE anxiety_areas (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    reason TEXT,
    start_time TIME,
    end_time TIME,
    geometry GEOMETRY(GEOMETRY, 4326)
);

-- Create a spatial index for better query performance
CREATE INDEX idx_anxiety_areas_geometry 
ON anxiety_areas USING GIST(geometry);

-- Optional: Create indexes on time columns if you'll query by time frequently
CREATE INDEX idx_anxiety_areas_start_time 
ON anxiety_areas(start_time);

CREATE INDEX idx_anxiety_areas_end_time 
ON anxiety_areas(end_time);

INSERT INTO anxiety_areas (name, reason, start_time, end_time, geometry)
VALUES (
    'Bahnhofstraße',
    'dark alley with poor lighting, junkies loitering',
    '20:00:00',
    '08:00:00',
    ST_SetSRID(ST_MakePoint(7.632271,51.955101), 4326)
);