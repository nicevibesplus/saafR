let routingStore = null;

window.renderPage = async function () {
    const content = document.getElementById("content");
    content.innerHTML = window.saafr.templates.getRoutingHtml();

    const layerModalEl = document.getElementById("layerModal");
    const routingModalEl = document.getElementById("routingModal");

    if (!layerModalEl || !routingModalEl) {
        console.error("Modal Elemente fehlen im DOM. Prüfen Sie routingTemplate.js.");
        return;
    }

    document.body.appendChild(layerModalEl);
    document.body.appendChild(routingModalEl);

    bootstrap.Modal.getOrCreateInstance(layerModalEl).show();

    window.saafr.ui.initMobileGuards();
    routingStore = window.saafr.state.createStore();

    window.saafr.map.createMap("map", [51.9607, 7.6261], 13, routingStore);

    const saved = localStorage.getItem("saafrDarkMode");
    const initialDark = saved === "1";
    const switchEl = document.getElementById("darkModeSwitch");

    if (switchEl) {
        switchEl.checked = initialDark;
        window.saafr.map.setBasemap(routingStore, initialDark);
        switchEl.addEventListener("change", function () {
            window.saafr.map.setBasemap(routingStore, this.checked);
        });
    }

    routingStore.layers.accidents =
        await window.saafr.layers.createAccidentsLayer("test_data/munster_2020_2024_utm.geojson");

    if (routingStore.map.getZoom() >= 13) {
        routingStore.map.addLayer(routingStore.layers.accidents);
    }

    window.saafr.map.initZoomVisibility(routingStore, 13);
    window.saafr.map.initLayerToggles(routingStore);
    window.saafr.routing.initRoutingUI(routingStore);

    document.addEventListener("show.bs.modal", function (event) {
        if (event.target && event.target.id === "routingModal") {
            window.saafr.map.updateRoutingModalStatus(routingStore);
        }
    });
};

window.unmountPage = function () {
    const layerModalEl = document.getElementById("layerModal");
    if (layerModalEl) {
        const inst = bootstrap.Modal.getInstance(layerModalEl);
        if (inst) inst.dispose();
    }

    const routingModalEl = document.getElementById("routingModal");
    if (routingModalEl) {
        const inst = bootstrap.Modal.getInstance(routingModalEl);
        if (inst) inst.dispose();
    }

    if (routingStore && routingStore.map) {
        routingStore.map.remove();
        routingStore.map = null;
    }

    routingStore = null;
};
