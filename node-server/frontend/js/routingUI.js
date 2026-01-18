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

        function startPickMode(targetInputId) {
            const modalEl = document.getElementById("routingModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            const map = store.map;
            if (!map) return;

            map.getContainer().style.cursor = "crosshair";

            const onceClick = function (e) {
                const lat = e.latlng.lat.toFixed(6);
                const lng = e.latlng.lng.toFixed(6);

                const input = document.getElementById(targetInputId);
                if (input) input.value = `${lat},${lng}`;

                L.popup()
                    .setLatLng(e.latlng)
                    .setContent("Point selected")
                    .openOn(map);

                map.getContainer().style.cursor = "";
                map.off("click", onceClick);

                bootstrap.Modal.getOrCreateInstance(modalEl).show();
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

            // Show Bootstrap card
            const routeInfo = document.getElementById("routeInfoPanel");
            const routeTime = document.getElementById("routeTime");

            routeTime.textContent = `${minutes} min`;
            routeInfo.classList.remove("d-none");

            const startNavigationBtn = document.getElementById("startNavigationBtn");
            const navigationSteps = document.getElementById("navigationSteps");

            const routeList = document.getElementById('route-steps');
            navigationSteps.innerHTML = "";


            // Set icons for direction signs returned by graphhopper
            function getDirectionIcon(sign) {
                switch (sign) {
                    case -3: return '<i class="bi bi-arrow-counterclockwise"></i>'; // TURN_SHARP_LEFT
                    case -2: return '<i class="bi bi-arrow-90deg-left"></i>';            // TURN_LEFT
                    case -1: return '<i class="bi bi-arrow-up-left"></i>';         // TURN_SLIGHT_LEFT
                    case 0: return '<i class="bi bi-arrow-up"></i>';              // CONTINUE_ON_STREET
                    case 1: return '<i class="bi bi-arrow-up-right"></i>';        // TURN_SLIGHT_RIGHT
                    case 2: return '<i class="bi bi-arrow-90deg-right"></i>';           // TURN_RIGHT
                    case 3: return '<i class="bi bi-arrow-clockwise"></i>';       // TURN_SHARP_RIGHT
                    case 4: return '<i class="bi bi-flag-fill"></i>';             // FINISH
                    case 5: return '<i class="bi bi-circle-fill"></i>';           // VIA_REACHED
                    case 6: return '<i class="bi bi-arrow-return-right"></i>';    // USE_ROUNDABOUT
                    case 7: return '<i class="bi bi-arrow-right-circle"></i>';    // KEEP_RIGHT
                    default: return '<i class="bi bi-arrow-up"></i>';              // fallback
                }
            }

            // Create path instructions list (divs)
            path.instructions.forEach((inst, index) => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex align-items-center gap-3';
                li.style.animationDelay = `${index * 0.05}s`; // staggered animation
                li.innerHTML = `
            <span class="route-icon">${getDirectionIcon(inst.sign)}</span>
            <div class="flex-grow-1">
                <div class="fw-semibold">${inst.text}</div>
                <div class="small text-muted">${Math.round(inst.distance)} m</div>
            </div>
        `;
                routeList.appendChild(li);
            });


            // Expand route panel when scrolled 
            let expanded = false;

            const expandPanel = () => {
                if (expanded) return;

                const totalItems = routeList.children.length;
                const maxVisible = Math.min(5, totalItems);

                routeList.style.maxHeight = `calc(${maxVisible} * 3.5rem)`;
                expanded = true;
            };

            routeList.addEventListener('wheel', expandPanel, { once: true });

            routeList.addEventListener('touchstart', expandPanel, { once: true });


            startNavigationBtn.onclick = () => {
                path.instructions.forEach(step => {
                });
                map.setView(coords[0], 16);
            };


            //Adding marker for end point
            const targetLabel = endText || "Ziel";

            if (store.route.endMarker) {
                store.map.removeLayer(store.route.endMarker);
            }

            store.route.endMarker = L.marker([end.lat, end.lng])
                .addTo(store.map)
                .bindPopup(`${targetLabel}`);

            const modalEl = document.getElementById("routingModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            map.fitBounds(store.route.layer.getBounds());
        });


    };
})();