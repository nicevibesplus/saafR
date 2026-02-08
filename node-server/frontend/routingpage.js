window._saafrRoutingModalListener = window._saafrRoutingModalListener || null;

window.renderPage = async function () {
    const content = document.getElementById("content");
    try {
        const response = await fetch('routingpagecontent.html');
        if (!response.ok) throw new Error("Could not load routingpagecontent.html");
        const html = await response.text();
        content.innerHTML = html;
    } catch (error) {
        console.error(error);
        return; // Stop execution if HTML fails to load
    }

    window.saafr.ui.initMobileGuards();

    window.saafr.store.getMap(); // Stelle sicher, dass die Karte initialisiert ist
    window.saafr.store.map.addLayer(window.saafr.store.getActiveBase());
    window.saafr.routing.initRoutingUI(window.saafr.store);

    // Routing Bottom Sheet
    const openRoutingBtn = document.getElementById("openRoutingBtn");
    const routingBottomSheet = document.getElementById("routingBottomSheet");
    const routingSheetBackdrop = document.getElementById("routingSheetBackdrop");
    const bottomBarCenter = document.querySelector('.bottom-bar-center');
    const routeTimeDisplay = document.getElementById("routeTimeDisplay");
    const locationBtn = document.getElementById("locateMeBtn");

    function openRoutingSheetFn() {
        routingBottomSheet.classList.add('open');
        routingSheetBackdrop.classList.add('open');
        if (bottomBarCenter) bottomBarCenter.classList.add('hidden');
        if (routeTimeDisplay) routeTimeDisplay.classList.add('hidden', 'd-none');
        if (locationBtn) locationBtn.classList.add('hidden');

        // Clear previous route and markers
        var r = window.saafr.store.route;
        var map = window.saafr.store.map;
        ['layer', 'startMarker', 'endMarker', 'pickStartMarker', 'pickEndMarker'].forEach(function(k) {
            if (r[k]) { map.removeLayer(r[k]); r[k] = null; }
        });

        // Pre-fill start with user location if available, otherwise clear
        var loc = window.saafr.store.userLocation;
        document.getElementById("startInput").value = loc ? loc.lat.toFixed(6) + "," + loc.lng.toFixed(6) : "";
        document.getElementById("endInput").value = "";
    }

    function closeRoutingSheetFn() {
        routingBottomSheet.classList.remove('open');
        routingSheetBackdrop.classList.remove('open');
        if (bottomBarCenter) bottomBarCenter.classList.remove('hidden');
        if (routeTimeDisplay) routeTimeDisplay.classList.remove('hidden');
        if (locationBtn) locationBtn.classList.remove('hidden');
    }

    // Store close function globally for use after routing
    window.saafr.closeRoutingSheet = closeRoutingSheetFn;

    if (openRoutingBtn) openRoutingBtn.addEventListener("click", openRoutingSheetFn);
    if (routingSheetBackdrop) routingSheetBackdrop.addEventListener("click", closeRoutingSheetFn);

    // Layers Bottom Sheet
    const layersBtn = document.getElementById("layersBtn");
    const layersBottomSheet = document.getElementById("layersBottomSheet");
    const layersSheetBackdrop = document.getElementById("layersSheetBackdrop");
    const closeLayersSheet = document.getElementById("closeLayersSheet");

    function openLayersSheet() {
        layersBottomSheet.classList.add('open');
        layersSheetBackdrop.classList.add('open');
    }

    function closeLayersSheetFn() {
        layersBottomSheet.classList.remove('open');
        layersSheetBackdrop.classList.remove('open');
    }

    layersBtn.addEventListener("click", openLayersSheet);
    closeLayersSheet.addEventListener("click", closeLayersSheetFn);
    layersSheetBackdrop.addEventListener("click", closeLayersSheetFn);

    // Map Type Toggle (Light/Dark)
    const mapTypeLight = document.getElementById("mapTypeLight");
    const mapTypeDark = document.getElementById("mapTypeDark");

    mapTypeLight.addEventListener("click", function () {
        if (this.classList.contains("active")) return;
        window.saafr.store.map.removeLayer(window.saafr.store.getActiveBase());
        window.saafr.store.setDarkMode(false);
        var layer = window.saafr.store.getActiveBase();
        window.saafr.store.map.addLayer(layer);
        layer.bringToBack();
        this.classList.add("active");
        mapTypeDark.classList.remove("active");
    });

    mapTypeDark.addEventListener("click", function () {
        if (this.classList.contains("active")) return;
        window.saafr.store.map.removeLayer(window.saafr.store.getActiveBase());
        window.saafr.store.setDarkMode(true);
        var layer = window.saafr.store.getActiveBase();
        window.saafr.store.map.addLayer(layer);
        layer.bringToBack();
        this.classList.add("active");
        mapTypeLight.classList.remove("active");
    });

    // Accidents Toggle
    const accidentSwitch = document.getElementById("toggleAccidents");
    accidentSwitch.addEventListener("change", async function () {
        console.log("Accident layer toggle changed:", this.checked);
        console.log("Current is visible:", window.saafr.store.isAccidentPointsLayerVisible());
        if (window.saafr.store.isAccidentPointsLayerVisible()) {
            window.saafr.store.map.removeLayer(await window.saafr.store.getAccidentPointsLayer());
        }
        window.saafr.store.setAccidentPointsLayerVisibility(this.checked);
        console.log("New is visible:", window.saafr.store.isAccidentPointsLayerVisible());
        if (this.checked) {
            window.saafr.store.map.addLayer(await window.saafr.store.getAccidentPointsLayer());
        }
    });

    let anxietySwitch = document.getElementById("toggleAnxietyZones");
    anxietySwitch.addEventListener("change", async function () {
        console.log("Anxiety layer toggle changed:", this.checked);
        console.log("Current is visible:", window.saafr.store.isAnxietyZonesLayerVisible());
        if (window.saafr.store.isAnxietyZonesLayerVisible()) {
            window.saafr.store.map.removeLayer(await window.saafr.store.getAnxietyZonesLayer());
        }
        window.saafr.store.setAnxietyZonesLayerVisibility(this.checked);
        console.log("New is visible:", window.saafr.store.isAnxietyZonesLayerVisible());
        if (this.checked) {
            window.saafr.store.map.addLayer(await window.saafr.store.getAnxietyZonesLayer());
        }
    });

    // Road Network Toggle
    const roadNetworkSwitch = document.getElementById("toggleRoadNetwork");
    roadNetworkSwitch.addEventListener("change", function () {
        if (window.saafr.store.isRoadNetworkLayerVisible()) {
            window.saafr.store.map.removeLayer(window.saafr.store.getRoadNetworkLayer());
        }
        window.saafr.store.setRoadNetworkLayerVisibility(this.checked);
        if (this.checked) {
            window.saafr.store.map.addLayer(window.saafr.store.getRoadNetworkLayer());
        }
    });

    

    // Location "Here I Am" button
    const locateMeBtn = document.getElementById("locateMeBtn");
    let locationMarker = null;

    locateMeBtn.addEventListener("click", function () {
        const btn = this;
        const map = window.saafr.store.map;
        if (!map) return;

        // Show loading state
        btn.classList.add("locating");

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            btn.classList.remove("locating");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function (position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Remove previous location marker
                if (locationMarker) map.removeLayer(locationMarker);

                // Add location marker (blue dot like Google Maps)
                locationMarker = L.circleMarker([lat, lng], {
                    radius: 8,
                    color: '#fff',
                    fillColor: '#4285f4',
                    fillOpacity: 1,
                    weight: 3
                }).addTo(map);

                // Zoom to location
                map.setView([lat, lng], 16);

                // Update start input in routing form
                const startInput = document.getElementById("startInput");
                if (startInput) {
                    startInput.value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                }

                // Update button state
                btn.classList.remove("locating");
                btn.classList.add("active");

                // Store location reference
                window.saafr.store.userLocation = { lat, lng };
            },
            function (error) {
                btn.classList.remove("locating");
                let message = "Unable to get your location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location access denied. Please enable location permissions.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        message = "Location request timed out.";
                        break;
                }
                alert(message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });

    //window.saafr.map.initLayerToggles(window.saafr.store);
};
window.unmountPage = function () {
    // 1. Close layers bottom sheet if open
    const layersBottomSheet = document.getElementById("layersBottomSheet");
    const layersSheetBackdrop = document.getElementById("layersSheetBackdrop");
    if (layersBottomSheet) {
        layersBottomSheet.classList.remove('open');
    }
    if (layersSheetBackdrop) {
        layersSheetBackdrop.classList.remove('open');
    }

    // 2. Close routing bottom sheet if open
    const routingBottomSheet = document.getElementById("routingBottomSheet");
    const routingSheetBackdrop = document.getElementById("routingSheetBackdrop");
    if (routingBottomSheet) {
        routingBottomSheet.classList.remove('open');
    }
    if (routingSheetBackdrop) {
        routingSheetBackdrop.classList.remove('open');
    }

    // 3. KARTE ENTFERNEN
    if (window.saafr && window.saafr.store && window.saafr.store.map) {
        window.saafr.store.map.remove(); // Zerstört die Leaflet-Instanz
        window.saafr.store.map = null;   // Setzt die Referenz im Store auf null
    }
};
