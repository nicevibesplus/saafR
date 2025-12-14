/*
Initialites and manages the leaflet map

* Create a new map instanve
* removes any existing map to avoid duplicates
* sets basemaps
* touch behaviour is optimized for mobile devices
* switch between maps

*/
(function () {
    window.saafr = window.saafr || {};
    window.saafr.map = window.saafr.map || {};

    window.saafr.map.createMap = function (mapDivId, center, zoom, store) {
        if (store.map) {
            store.map.remove();
            store.map = null;
        }

        const map = L.map(mapDivId).setView(center, zoom);

        store.base.cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            attribution: "&copy; OpenStreetMap &copy; CARTO",
            maxZoom: 19
        });

        store.base.cartoDark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: "&copy; OpenStreetMap &copy; CARTO",
            maxZoom: 19
        });

        store.base.active = store.base.cartoLight;
        store.base.active.addTo(map);

        const mapElement = document.getElementById(mapDivId);
        if (mapElement) {
            mapElement.style.touchAction = "pan-x pan-y";
            mapElement.addEventListener("touchstart", function (e) {
                e.stopPropagation();
            }, { passive: true });
        }

        store.map = map;
        return map;
    };

    window.saafr.map.setBasemap = function (store, isDark) {
        const map = store.map;
        if (!map) return;

        if (store.base.active) {
            map.removeLayer(store.base.active);
        }
        store.base.active = isDark ? store.base.cartoDark : store.base.cartoLight;
        map.addLayer(store.base.active);

        store.base.darkMode = isDark;
        localStorage.setItem("saafrDarkMode", isDark ? "1" : "0");
        document.body.classList.toggle("dark-mode", isDark);
    };
})();
