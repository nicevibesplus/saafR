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

    const layerModalEl = document.getElementById("layerModal");
    const routingModalEl = document.getElementById("routingModal");

    if (!layerModalEl || !routingModalEl) {
        console.error("Modal Elemente fehlen im DOM.");
        return;
    }

    document.body.appendChild(layerModalEl);
    document.body.appendChild(routingModalEl);

    bootstrap.Modal.getOrCreateInstance(layerModalEl).show();

    window.saafr.ui.initMobileGuards();

    window.saafr.store.getMap(); // Stelle sicher, dass die Karte initialisiert ist
    window.saafr.store.map.addLayer(window.saafr.store.getActiveBase());
    window.saafr.routing.initRoutingUI(window.saafr.store);


    const darkModeSwitch = document.getElementById("darkModeSwitch");
    darkModeSwitch.addEventListener("change", function () {
        window.saafr.store.map.removeLayer(window.saafr.store.getActiveBase());
        window.saafr.store.setDarkMode(this.checked);
        var layer = window.saafr.store.getActiveBase();
        window.saafr.store.map.addLayer(layer);
        layer.bringToBack();
    });

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

    const roadNetworkSwitch = document.getElementById("toggleRoadNetwork");
    roadNetworkSwitch.addEventListener("change", function () {
        if (window.saafr.store.isRoadNetworkLayerVisible()) {
            window.saafr.store.map.removeLayer(window.saafr.store.getRoadNetworkLayer());
        }
        window.saafr.store.setRoadNetworkLayerVisibility(!window.saafr.store.isRoadNetworkLayerVisible());
        if (window.saafr.store.isRoadNetworkLayerVisible()) {
            window.saafr.store.map.addLayer(window.saafr.store.getRoadNetworkLayer());
        }
    });

    //window.saafr.map.initLayerToggles(window.saafr.store);
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
