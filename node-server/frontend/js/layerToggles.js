/*
 This module manages layer visibility on the map.

 It allows map layers to be turned on or off based on user input,
 connects checkbox toggles to specific map layers, and keeps the
 routing modal in sync with the current layer state. The module
 also controls zoom-dependent visibility, showing or hiding layers
 automatically when the map zoom level crosses a defined threshold.
*/

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
})();
