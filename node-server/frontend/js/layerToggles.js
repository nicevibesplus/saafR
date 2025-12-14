(function () {
    window.saafr = window.saafr || {};
    window.saafr.map = window.saafr.map || {};

    window.saafr.map.toggleLayer = function (store, layerName, isVisible) {
        const map = store.map;
        const layer = store.layers[layerName];
        if (!map || !layer) return;

        if (isVisible) map.addLayer(layer);
        else map.removeLayer(layer);

        window.saafr.map.updateRoutingModalStatus(store);
    };

    window.saafr.map.initLayerToggles = function (store) {
        const accidentsToggle = document.getElementById("toggleAccidents");
        const anxietyZonesToggle = document.getElementById("toggleAnxietyZones");

        if (accidentsToggle) {
            accidentsToggle.addEventListener("change", function () {
                window.saafr.map.toggleLayer(store, "accidents", this.checked);
            });
        }

        if (anxietyZonesToggle) {
            anxietyZonesToggle.addEventListener("change", function () {
                window.saafr.map.toggleLayer(store, "anxietyZones", this.checked);
            });
        }
    };

    window.saafr.map.updateRoutingModalStatus = function (store) {
        const map = store.map;
        if (!map) return;

        const accidentsItem = document.getElementById("routingAccidentsStatus");
        const anxietyItem = document.getElementById("routingAnxietyStatus");

        if (!accidentsItem || !anxietyItem) return;

        if (store.layers.accidents && map.hasLayer(store.layers.accidents)) accidentsItem.classList.remove("disabled");
        else accidentsItem.classList.add("disabled");

        if (store.layers.anxietyZones && map.hasLayer(store.layers.anxietyZones)) anxietyItem.classList.remove("disabled");
        else anxietyItem.classList.add("disabled");
    };

    window.saafr.map.initZoomVisibility = function (store, minZoom) {
        const map = store.map;
        if (!map) return;

        map.on("zoomend", function () {
            const layer = store.layers.accidents;
            if (!layer) return;

            if (map.getZoom() >= minZoom) map.addLayer(layer);
            else map.removeLayer(layer);
        });
    };
})();
