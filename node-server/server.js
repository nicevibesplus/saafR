const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const OSR_API_KEY = process.env.OSR_API_KEY;

app.use(express.json());

const path = require('path');

app.use(express.static(path.join(__dirname, 'frontend')));

// SPA fallback (serve index.html for all unknown GET requests)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// PostgreSQL/PostGIS connection pool
const pool = new Pool({
    host: process.env.POSTGRES_SERVER || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'gis_user',
    password: process.env.POSTGRES_PASSWORD || 'gis_password',
    database: process.env.POSTGRES_DB || 'gis_database',
});

// Test database connection
pool.on('connect', () => {
    console.log('Connected to PostGIS database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

app.get('/streets', (req, res) => {
    const query = `SELECT geom FROM streets`;
    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error executing query', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(result.rows);
        }
    });
});

app.get('/get_anxiety_areas', async (req, res) => {
  const query = `SELECT *, ST_AsGeoJSON(geometry) as geom_as_json FROM anxiety_areas`;

  pool.query(query, (err, result) => {
    if (err) return res.status(500).send('Internal Server Error');

    let int_day = {
      0: "Monday",
      1: "Tuesday",
      2: "Wednesday",
      3: "Thursday",
      4: "Friday",
      5: "Saturday",
      6: "Sunday"
    };

    const features = result.rows.map(row => {
      // Convert active_days integers → strings
      let active_days_string = [];
      for (const day of row.active_days) {
        for (const key in int_day) {
          if (Number(key) === day) active_days_string.push(int_day[key]);
        }
      }

      // Convert geom_as_json string → object
      const geometry = row.geom_as_json ? JSON.parse(row.geom_as_json) : null;

      return {
        type: "Feature",
        geometry,
        properties: {
          uuid: row.uuid,
          approved: row.approved,
          start_time: row.start_time,
          end_time: row.end_time,
          active_days: active_days_string,
          lighting: row.lighting,
          likes: row.likes,
          location_type: row.location_type,
          remark: row.remark,
          severity: row.severity,
          trigger_type: row.trigger_type
        }
      };
    });

    res.json({
      type: "FeatureCollection",
      features
    });
  });
});


app.get('/get_edges_with_accidents', async (req, res) => {
    const query = `SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', jsonb_agg(
        jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(row.geom)::jsonb,
            'properties', to_jsonb(row) - 'geom'
        )
    )
    ) AS featurecollection
    FROM (
        SELECT 
            s.osm_id, 
            s.geom, 
            COUNT(c.osm_id) AS crash_count
        FROM streets s
        LEFT JOIN crashes c 
            ON s.osm_id = c.osm_id
        GROUP BY s.osm_id, s.geom
        ORDER BY crash_count DESC
    ) row;`;

    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error executing query', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(result.rows);
        }
    });
});


app.post('/routing', async (req, res) => {
    try {
        // req.body is already parsed - don't use JSON.parse()
        const { start, end, dodge_anxiety = false } = req.body;
        const { lat: start_lat, lng: start_lng } = start;
        const { lat: end_lat, lng: end_lng } = end;

        let anxiety_areas = null;

        if (dodge_anxiety) {
            const query = `
                SELECT ST_AsGeoJSON(
                    ST_Union(
                        CASE 
                            WHEN ST_GeometryType(geometry) = 'ST_Point' THEN 
                                ST_Buffer(geometry::geography, 10)::geometry
                            WHEN ST_GeometryType(geometry) = 'ST_LineString' THEN 
                                ST_Buffer(geometry::geography, 10)::geometry
                            WHEN ST_GeometryType(geometry) IN ('ST_Polygon', 'ST_MultiPolygon') THEN 
                                ST_Buffer(geometry::geography, 5)::geometry
                            ELSE 
                                ST_Buffer(geometry::geography, 5)::geometry
                        END
                    )
                ) AS merged_multipolygon
                FROM anxiety_areas;`;

            // Use await with promise-based query
            const result = await pool.query(query);
            anxiety_areas = JSON.parse(result.rows[0].merged_multipolygon);
        }

        const routingBody = {
            "points": [
                [start_lng, start_lat],
                [end_lng, end_lat]
            ],
            "profile": "bike",
            "points_encoded": false,
            "instructions": true
        };

        if (dodge_anxiety && anxiety_areas) {
            // Initialize areas object
            routingBody["ch.disable"] = true; // Disable contraction hierarchies for custom models
            routingBody.custom_model = {
                "priority": [
                    {
                        "if": "in_avoid_area",
                        "multiply_by": "0.1"
                    }
                ],
                "areas": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": anxiety_areas,
                            "properties": {},
                            "id": "avoid_area"
                        }
                    ]
                }
            }
        }

        console.log('Routing body:', JSON.stringify(routingBody, null, 2));

        const route = await fetch(`http://graphhopper:8989/route?ch.disable=true`, {
            method: 'POST',
            body: JSON.stringify(routingBody),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const answer = await route.json();
        res.json(answer);

    } catch (error) {
        console.error('Error in routing:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.post('/route', async (req, res) => {
    try {
        const { start, end, useCrashModel = false } = req.body;
        const { lat: start_lat, lng: start_lng } = start;
        const { lat: end_lat, lng: end_lng } = end;

        const routingBody = {
            "points": [
                [start_lng, start_lat],
                [end_lng, end_lat]
            ],
            "profile": useCrashModel ? "bike_crash" : "bike",
            "points_encoded": false,
            "instructions": true
        };

        console.log('Routing body:', JSON.stringify(routingBody, null, 2));
        console.log('Sending request to custom GH:', `http://graphhopper:8989/route`);
        const route = await fetch(`http://graphhopper:8990/route`, {
            method: 'POST',
            body: JSON.stringify(routingBody),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Received response from custom GH:', route);
        const answer = await route.json();
        res.json(answer);

    } catch (error) {
        console.error('Error in /route:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }

});

app.post('/routing_customGH', async (req, res) => {
    try {
        const { 
            start, 
            end,
            include_crashes,
        } = req.body;
        
        const { lat: start_lat, lng: start_lng } = start;
        const { lat: end_lat, lng: end_lng } = end;

        // Build URL with proper array handling for multiple points
        const params = new URLSearchParams();
        params.append('point', `${start_lat},${start_lng}`);
        params.append('point', `${end_lat},${end_lng}`);
        params.append('profile', "bikesafe");
        params.append('points_encoded', false);
        params.append('instructions', true);
        params.append('include_crashes', include_crashes);
        if (include_crashes) {
            const date = new Date();
            params.append('req_year', date.getFullYear());
            params.append('req_month', date.getMonth() + 1);
            params.append('req_hour', date.getHours());
            params.append('req_weekday', date.getDay());
        }

        const url = `http://graphhopper:8989/route?${params.toString()}`;

        console.log('Routing URL:', url);

        const route = await fetch(url, {
            method: 'GET'
        });

        if (!route.ok) {
            const errorText = await route.text();
            console.error('GraphHopper error:', errorText);
            return res.status(route.status).json({ error: 'GraphHopper error', details: errorText });
        }

        const answer = await route.json();
        
        res.json(answer);

    } catch (error) {
        console.error('Error in routing_customGH:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.post('/routing2', async (req, res) => {
    try {
        const { start, end, avoid_polygon = null } = req.body;
        const { lat: start_lat, lng: start_lng } = start;
        const { lat: end_lat, lng: end_lng } = end;

        const routingBody = {
            "points": [
                [start_lng, start_lat],
                [end_lng, end_lat]
            ],
            "profile": "bike",
            "points_encoded": false,
            "instructions": true
        };

        // If avoid_polygon is provided → use custom model
        if (avoid_polygon) {
            routingBody["ch.disable"] = true;
            routingBody.custom_model = {
                "priority": [
                    {
                        "if": "in_avoid_area",
                        "multiply_by": 0.1
                    }
                ],
                "areas": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "id": "avoid_area",
                            "type": "Feature",
                            "properties": {},
                            "geometry": avoid_polygon
                        }
                    ]
                }
            };
        }

        console.log('Routing3 body:', JSON.stringify(routingBody, null, 2));

        const route = await fetch(`http://graphhopper:8989/route?ch.disable=true`, {
            method: 'POST',
            body: JSON.stringify(routingBody),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const answer = await route.json();
        res.json(answer);

    } catch (error) {
        console.error('Error in routing3:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.post("/upload-anxiety-areas", async (req, res) => {
  try {
    const {
      active_time_start,
      active_time_end,
      active_days,
      lighting,
      likes,
      location_type,
      remark,
      severity,
      trigger_type,
      geometry
    } = req.body;
  
    let approved = false


    console.log("Received anxiety area data:", req.body);

    let active_days_int = []
    let day_int = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6
        };

    for (day of active_days) {
        for (key in day_int) {
            if (day === key) {
            active_days_int.push(day_int[key]);
            }
        }
    }

    let geomWKT = null;

    if (geometry) {
    // GeoJSON Point
    if (geometry.type === "Point") {
        const [lng, lat] = geometry.coordinates;
        geomWKT = `POINT(${lng} ${lat})`;
    }

    // GeoJSON Polygon
    else if (geometry.type === "Polygon") {
        const ring = geometry.coordinates[0]; // outer ring
        const coords = ring
        .map(([lng, lat]) => `${lng} ${lat}`)
        .join(", ");

        geomWKT = `POLYGON((${coords}))`;
    }
    }


    const query = `
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
            $1, $2, $3,
            ST_SetSRID(ST_GeomFromGeoJSON($4), 4326),
            $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING *;
        `;

    console.log(typeof(lighting))
    const values = [         
        approved ?? false,          
        active_time_start || null,  
        active_time_end || null,    
        JSON.stringify(geometry),   
        active_days_int || null,        
        lighting || null,          
        likes || 0,                 
        location_type || null,      
        remark || null,             
        severity || null,          
        trigger_type || null        
    ];


    const result = await pool.query(query, values);

    res.status(200).json({ success: true, data: result.rows[0], message: "Data uploaded to db." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/increase_community_rating', async (req, res) => {
    try{
        let {uuid} = req.body;
        let query = 'UPDATE anxiety_areas SET likes = likes + 1 WHERE uuid = $1 RETURNING likes';
        let result = await pool.query(query, [uuid]);
        res.status(200).json({
            success: true,
            newLikes: result.rows[0].likes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/decrease_community_rating', async (req, res) => {
    try{
        let {uuid} = req.body;
        let query = 'UPDATE anxiety_areas SET likes = likes - 1 WHERE uuid = $1 AND likes <> 0 RETURNING likes';
        let result = await pool.query(query, [uuid]);
        res.status(200).json({ success: true, newLikes: result.rows[0].likes });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});




// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Available endpoints:`);

});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database pool closed');
    });
});