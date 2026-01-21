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
    darkModeSwitch.addEventListener("click", function () {
        const isActive = this.classList.contains("active");
        const icon = this.querySelector("i");
        window.saafr.store.map.removeLayer(window.saafr.store.getActiveBase());
        window.saafr.store.setDarkMode(!isActive);
        var layer = window.saafr.store.getActiveBase();
        window.saafr.store.map.addLayer(layer);
        layer.bringToBack();
        this.classList.toggle("active");

        // Toggle icon between sun and moon
        if (icon.classList.contains("bi-sun-fill")) {
            icon.classList.remove("bi-sun-fill");
            icon.classList.add("bi-moon-fill");
        } else {
            icon.classList.remove("bi-moon-fill");
            icon.classList.add("bi-sun-fill");
        }
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
    roadNetworkSwitch.addEventListener("click", function () {
        const willBeActive = !this.classList.contains("active");
        if (window.saafr.store.isRoadNetworkLayerVisible()) {
            window.saafr.store.map.removeLayer(window.saafr.store.getRoadNetworkLayer());
        }
        window.saafr.store.setRoadNetworkLayerVisibility(willBeActive);
        if (willBeActive) {
            window.saafr.store.map.addLayer(window.saafr.store.getRoadNetworkLayer());
        }
        this.classList.toggle("active");
    });

    //window.saafr.map.initLayerToggles(window.saafr.store);
};
window.unmountPage = function () {
    // 1. Layer Modal aufräumen
    const layerModalEl = document.getElementById("layerModal");
    if (layerModalEl) {
        const inst = bootstrap.Modal.getInstance(layerModalEl);
        if (inst) {
            inst.hide();
            inst.dispose();
        }
        layerModalEl.remove(); // WICHTIG: Element aus dem Body entfernen
    }

    // 2. Routing Modal aufräumen
    const routingModalEl = document.getElementById("routingModal");
    if (routingModalEl) {
        const inst = bootstrap.Modal.getInstance(routingModalEl);
        if (inst) {
            inst.hide();
            inst.dispose();
        }
        routingModalEl.remove(); // WICHTIG: Element aus dem Body entfernen
    }

    // 3. Modal-Backdrops entfernen (falls welche hängen geblieben sind)
    document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");

    // 4. KARTE ENTFERNEN (Der Hauptfehler)
    // Hier stand vorher "window.routingStore", das existiert aber nicht.
    // Es muss "window.saafr.store" heißen.
    if (window.saafr && window.saafr.store && window.saafr.store.map) {
        window.saafr.store.map.remove(); // Zerstört die Leaflet-Instanz
        window.saafr.store.map = null;   // Setzt die Referenz im Store auf null
    }
};
