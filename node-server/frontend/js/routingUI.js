/*
This module initializes the routing user interface

It handles the click on the route button, reads start and destination inputs,
converts them to coords, requests a route from the backend,
drwas resulting route on the maps, closes routing modal 
and zooms to the calculated route
*/
(function () {
    window.saafr = window.saafr || {};
    window.saafr.routing = window.saafr.routing || {};

    window.saafr.routing.initRoutingUI = function (store) {
        const routeBtn = document.getElementById("routeBtn");
        if (!routeBtn) return;

        routeBtn.addEventListener("click", async function () {
            const map = store.map;
            if (!map) return;

            const startEl = document.getElementById("startInput");
            const endEl = document.getElementById("endInput");
            if (!startEl || !endEl) return;

            const startText = startEl.value.trim();
            const endText = endEl.value.trim();

            const parse = window.saafr.routing.parseLatLngOrNull;
            const geocode = window.saafr.routing.geocodeAddress;

            const start = parse(startText) || await geocode(startText);
            const end = parse(endText) || await geocode(endText);

            if (!start || !end) {
                alert("Start or destination could not be found. Use lat, lng, or an address such as Prinzipalmarkt 10 Münster.");
                return;
            }

            const data = await window.saafr.routing.requestRoute(start, end);
            const path = data.paths[0];
            const coords = path.points.coordinates.map(c => [c[1], c[0]]);

            if (store.route.layer) map.removeLayer(store.route.layer);
            store.route.layer = L.polyline(coords, { weight: 5 }).addTo(map);

            const modalEl = document.getElementById("routingModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            map.fitBounds(store.route.layer.getBounds());
        });
    };
})();
