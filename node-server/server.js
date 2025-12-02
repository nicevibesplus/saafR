const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const OSR_API_KEY = process.env.OSR_API_KEY;

app.use(express.json());

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

app.get('/anxiety_areas', (req, res) => {
    const query = `SELECT ST_AsText(geometry) FROM anxiety_areas`;
    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error executing query', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(result.rows);
        }
    });
});

app.get('/get_edges_with_accidents', async (req, res) => {
    const query = `SELECT s.osm_id, s.geom, count(*)
                    from crashes c, streets s
                    WHERE c.osm_id = s.osm_id
                    group by s.osm_id, s.geom
                    order by count(*) DESC`;
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