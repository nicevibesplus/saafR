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

        const pickStartBtn = document.getElementById("pickStartBtn");
        const pickEndBtn = document.getElementById("pickEndBtn");

        // Custom white marker with grey outline
        function createRouteMarker(latlng, label, isStart) {
            const marker = L.circleMarker(latlng, {
                radius: 10,
                color: '#666',
                weight: 2,
                fillColor: '#fff',
                fillOpacity: 1
            });
            marker.bindPopup(`<strong>${isStart ? 'Start' : 'Destination'}:</strong><br>${label}`);
            return marker;
        }

        function startPickMode(targetInputId) {
            // Close routing bottom sheet
            if (window.saafr.closeRoutingSheet) {
                window.saafr.closeRoutingSheet();
            }

            const map = store.map;
            if (!map) return;

            map.getContainer().style.cursor = "crosshair";

            const onceClick = function (e) {
                const lat = e.latlng.lat.toFixed(6);
                const lng = e.latlng.lng.toFixed(6);
                const coordsText = `${lat}, ${lng}`;

                const input = document.getElementById(targetInputId);
                if (input) input.value = `${lat},${lng}`;

                // Remove previous pick marker if exists
                store.route = store.route || {};
                const markerKey = targetInputId === 'startInput' ? 'pickStartMarker' : 'pickEndMarker';
                if (store.route[markerKey]) {
                    map.removeLayer(store.route[markerKey]);
                }

                // Create and add the marker
                const isStart = targetInputId === 'startInput';
                store.route[markerKey] = createRouteMarker([lat, lng], coordsText, isStart);
                store.route[markerKey].addTo(map).openPopup();

                map.getContainer().style.cursor = "";
                map.off("click", onceClick);

                // Reopen routing bottom sheet
                const routingBottomSheet = document.getElementById("routingBottomSheet");
                const routingSheetBackdrop = document.getElementById("routingSheetBackdrop");
                const bottomBarCenter = document.querySelector('.bottom-bar-center');
                const routeTimeDisplay = document.getElementById("routeTimeDisplay");
                const locationBtn = document.getElementById("locateMeBtn");
                if (routingBottomSheet) routingBottomSheet.classList.add('open');
                if (routingSheetBackdrop) routingSheetBackdrop.classList.add('open');
                if (bottomBarCenter) bottomBarCenter.classList.add('hidden');
                if (routeTimeDisplay) routeTimeDisplay.classList.add('hidden');
                if (locationBtn) locationBtn.classList.add('hidden');
            };

            map.on("click", onceClick);
        }

        if (pickStartBtn) {
            pickStartBtn.addEventListener("click", function () {
                startPickMode("startInput");
            });
        }

        if (pickEndBtn) {
            pickEndBtn.addEventListener("click", function () {
                startPickMode("endInput");
            });
        }

        routeBtn.addEventListener("click", async function () {
            const map = store.map;
            if (!map) return;

            const startEl = document.getElementById("startInput");
            const endEl = document.getElementById("endInput");
            if (!startEl || !endEl) return;

            store.route = store.route || {};

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
            console.log(start)
            const data = await window.saafr.routing.requestRoute(start, end);
            console.log(data);
            const path = data.paths[0];
            const coords = path.points.coordinates.map(c => [c[1], c[0]]);

            if (store.route.layer) map.removeLayer(store.route.layer);
            store.route.layer = L.polyline(coords, { weight: 5 }).addTo(map);

            const timeMs = path.time;
            const minutes = Math.round(timeMs / 60000);

            // Show route time in bottom bar
            const routeTimeDisplay = document.getElementById("routeTimeDisplay");
            const routeTime = document.getElementById("routeTime");

            routeTime.textContent = `${minutes} min`;
            routeTimeDisplay.classList.remove("d-none");


            // Remove pick markers if they exist
            if (store.route.pickStartMarker) {
                map.removeLayer(store.route.pickStartMarker);
                store.route.pickStartMarker = null;
            }
            if (store.route.pickEndMarker) {
                map.removeLayer(store.route.pickEndMarker);
                store.route.pickEndMarker = null;
            }

            // Adding marker for start point
            const startLabel = startText || "Start";
            if (store.route.startMarker) {
                store.map.removeLayer(store.route.startMarker);
            }
            store.route.startMarker = L.circleMarker([start.lat, start.lng], {
                radius: 10,
                color: '#666',
                weight: 2,
                fillColor: '#fff',
                fillOpacity: 1
            }).addTo(store.map).bindPopup(`<strong>Start:</strong><br>${startLabel}`);

            // Adding marker for end point
            const targetLabel = endText || "Destination";
            if (store.route.endMarker) {
                store.map.removeLayer(store.route.endMarker);
            }
            store.route.endMarker = L.circleMarker([end.lat, end.lng], {
                radius: 10,
                color: '#666',
                weight: 2,
                fillColor: '#fff',
                fillOpacity: 1
            }).addTo(store.map).bindPopup(`<strong>Destination:</strong><br>${targetLabel}`);

            // Close routing bottom sheet
            if (window.saafr.closeRoutingSheet) {
                window.saafr.closeRoutingSheet();
            }

            map.fitBounds(store.route.layer.getBounds());
        });


    };
})();