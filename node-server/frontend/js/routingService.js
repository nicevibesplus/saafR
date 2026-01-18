/*
 Provides helper functions for routing tasks.

 Includes utilities to parse latitude longitude input strings,
 geocode textual addresses into geographic coordinates using the
 OpenStreetMap Nominatim service, and request a route from the local
 routing backend API. All functions are exposed via the
 window.saafr.routing namespace for reuse across the application.
*/

(function () {
    window.saafr = window.saafr || {};
    window.saafr.routing = window.saafr.routing || {};

    window.saafr.routing.parseLatLngOrNull = function (value) {
        const parts = value.split(",").map(v => Number(v.trim()));
        if (parts.length !== 2) return null;
        if (!Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
        return { lat: parts[0], lng: parts[1] };
    };

    window.saafr.routing.geocodeAddress = async function (query) {
        const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(query);
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        const results = await response.json();
        if (!Array.isArray(results) || results.length === 0) return null;
        return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
    };

    window.saafr.routing.requestRoute = async function (start, end) {
        const response = await fetch("http://localhost:3000/routing_customGH", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                start: start, 
                end: end,
                points_encoded: false,
                profile: "bikesafe",
                instructions: true,
                include_crashes: true,
                req_year: new Date().getFullYear(),
                req_month: new Date().getMonth() + 1, // JavaScript months are 0-indexed
                req_hour: new Date().getHours(),
                req_weekday: new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
            })
        });
        return await response.json();
    };
})();
