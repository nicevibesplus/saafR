window.routingStore = null;
window._saafrRoutingModalListener = window._saafrRoutingModalListener || null;

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
    window.routingStore = window.saafr.state.createStore();

    window.saafr.map.createMap("map", [51.9607, 7.6261], 13, window.routingStore);
    window.saafr.routing.initRoutingUI(window.routingStore);

    const saved = localStorage.getItem("saafrDarkMode");
    const initialDark = saved === "1";
    const switchEl = document.getElementById("darkModeSwitch");

    if (switchEl) {
        switchEl.checked = initialDark;
        window.saafr.map.setBasemap(window.routingStore, initialDark);
        switchEl.addEventListener("change", function () {
            window.saafr.map.setBasemap(window.routingStore, this.checked);
        });
    }

    window.routingStore.layers.accidents =
        await window.saafr.layers.createAccidentsLayer("test_data/munster_2020_2024_utm.geojson");

    //window.routingStore.layers.accidentWMS =
    //window.saafr.layers.createWmsLayer("http://localhost:8080/geoserver/wms", "streets");
    createWmsLayer = function (wmsUrl, layerName) {
        if (!wmsUrl || !layerName) {
            throw new Error("WMS URL und Layername müssen angegeben werden.");
        }

        const wmsLayer = L.tileLayer.wms(wmsUrl, {
            layers: layerName,
            transparent: true,
            format: 'image/png',
            attribution: 'Map data © WMS Server'
        });

        return wmsLayer;
    };
    window.routingStore.layers.accidentWMS = createWmsLayer("http://localhost:8080/geoserver/wms", "streets");
    // Tastendruck-Listener hinzufügen
    document.addEventListener("keydown", (event) => {
        // Prüfen, ob die Taste "m" gedrückt wurde
        if (event.key.toLowerCase() === "m") {
            const map = window.routingStore.map;
            const wmsLayer = window.routingStore.layers.accidentWMS;

            if (map.hasLayer(wmsLayer)) {
                map.removeLayer(wmsLayer); // Layer ausblenden, wenn schon sichtbar
            } else {
                map.addLayer(wmsLayer); // Layer hinzufügen, wenn noch nicht sichtbar
            }
        }
    });


    if (window.routingStore.map.getZoom() >= 13) {
        window.routingStore.map.addLayer(window.routingStore.layers.accidents);
    }

    window.saafr.map.initZoomVisibility(window.routingStore, 13);
    window.saafr.map.initLayerToggles(window.routingStore);

    if (!window._saafrRoutingModalListener) {
        window._saafrRoutingModalListener = function (event) {
            if (event.target && event.target.id === "routingModal") {
                if (window.routingStore) {
                    window.saafr.map.updateRoutingModalStatus(window.routingStore);
                }
            }
        };
        document.addEventListener("show.bs.modal", window._saafrRoutingModalListener);
    }
};

window.unmountPage = function () {
    const layerModalEl = document.getElementById("layerModal");
    if (layerModalEl) {
        const inst = bootstrap.Modal.getInstance(layerModalEl);
        if (inst) {
            inst.hide();
            inst.dispose();
        }
    }

    const routingModalEl = document.getElementById("routingModal");
    if (routingModalEl) {
        const inst = bootstrap.Modal.getInstance(routingModalEl);
        if (inst) {
            inst.hide();
            inst.dispose();
        }
    }

    document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");

    if (window.routingStore && window.routingStore.map) {
        window.routingStore.map.remove();
        window.routingStore.map = null;
    }

    window.routingStore = null;
};
