CREATE TABLE IF NOT EXISTS anxiety_areas (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    reason TEXT,
    approved BOOLEAN DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    geometry GEOMETRY(POINT, 4326),
    active_days TEXT[],          -- Array von Wochentagen
    lighting INTEGER,            -- Lichtverhältnisse
    likes INTEGER DEFAULT 0,     -- Likes
    location_type VARCHAR(100),  -- z.B. Park, Straße, etc.
    remark TEXT,                 -- Bemerkung
    severity INTEGER,            -- z.B. 1-5
    trigger_type VARCHAR(100)    -- Typ des Triggers
);

CREATE INDEX idx_anxiety_areas_geometry 
ON anxiety_areas USING GIST(geometry);


