CREATE TABLE IF NOT EXISTS anxiety_areas (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approved BOOLEAN DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    geometry geometry(Geometry, 4326),
    active_days INTEGER[],         
    lighting INTEGER,          
    likes INTEGER DEFAULT 0,     
    location_type VARCHAR(100),  
    remark TEXT,                
    severity INTEGER,           
    trigger_type TEXT[]  
);

CREATE INDEX idx_anxiety_areas_geometry 
ON anxiety_areas USING GIST(geometry);


