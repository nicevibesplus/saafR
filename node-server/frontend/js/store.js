window.saafr = window.saafr || {};

window.saafr.store = {
    map: null,
    base: {
        cartoLight: null,
        cartoDark: null,
        darkMode: false
    },
    layers: {
        accidents: [false, null],
        anxietyZones: [false, null],
        roadNetwork: [false, null]
    },
    ui: {
        popupsEnabled: true
    },
    route: {
        layer: null
    },

    getMap: function () {
        if (!this.map) {
            // Münster area bounds (with small buffer)
            var muensterBounds = L.latLngBounds(
                [51.8, 7.45],  // Southwest
                [52.1, 7.80]   // Northeast
            );

            this.map = L.map("map", {
                zoomControl: false,
                maxBounds: muensterBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 10.5,
                zoomSnap: 0.5,
                zoomDelta: 0.5
            }).setView([51.9607, 7.6261], 13);

            L.control.zoom({
                position: 'topleft'
            }).addTo(this.map);
        }
        return this.map;
    },

    getBaseLight: function () {
        if (!this.base.cartoLight) {
            this.base.cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
                attribution: "&copy; OpenStreetMap &copy; CARTO",
                maxZoom: 19
            });
        }
        return this.base.cartoLight;
    },

    getBaseDark: function () {
        if (!this.base.cartoDark) {
            this.base.cartoDark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                attribution: "&copy; OpenStreetMap &copy; CARTO",
                maxZoom: 19
            });
        }
        return this.base.cartoDark;
    },

    getActiveBase: function () {
        if (this.base.darkMode) {
            return this.getBaseDark();
        } else {
            return this.getBaseLight();
        }
    },

    setDarkMode: function (isDark) {
        this.base.darkMode = isDark;
    },

    getAccidentPointsLayer: async function () {
        if (!this.layers.accidents[1]) {
            const geoJsonUrl = "../test_data/munster_2020_2024_utm.geojson";
            const response = await fetch(geoJsonUrl);
            const data = await response.json();

            this.layers.accidents[1] = L.geoJSON(data, {
                pointToLayer: function (feature) {
                    const correctLatLng = L.latLng(
                        feature.properties.YGCSWGS84,
                        feature.properties.XGCSWGS84
                    );

                    return L.circleMarker(correctLatLng, {
                        radius: 6,
                        fillColor: "#dc3545",
                        color: "#fff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
                onEachFeature: function (feature, layer) {
                    if (!feature.properties) return;

                    let popupContent = '<div style="font-family: Arial; font-size: 14px;">';
                    popupContent += "<strong>Accident Info</strong><br>";
                    popupContent += "Year: " + feature.properties.UJAHR + "<br>";
                    popupContent += "Month: " + feature.properties.UMONAT + "<br>";
                    popupContent += "Category: " + feature.properties.UKATEGORIE;
                    popupContent += "</div>";

                    layer.bindPopup(popupContent);
                }
            });
        }
        return this.layers.accidents[1];
    },

    isAccidentPointsLayerVisible: function () {
        return this.layers.accidents[0];
    },

    setAccidentPointsLayerVisibility: function (isVisible) {
        this.layers.accidents[0] = isVisible;
    },

    getAnxietyZonesLayer: async function () {
        if (!this.layers.anxietyZones[1]) {
            const response = await fetch('http://localhost:3000/get_anxiety_areas');
            const data = await response.json();
            console.log(data);
            this.layers.anxietyZones[1] = L.geoJSON(data, {
                // Point-Features
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: "#ffc107",
                        color: "#fff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
                // Polygon-Features
                style: function (feature) {
                    return {
                        fillColor: "#ffc107",
                        color: "#ff9800",
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.5
                    };
                },
                onEachFeature: function (feature, layer) {
                    if (!feature.properties) return;
                    let popupContent = '<div style="font-family: Arial; font-size: 14px;">';
                    popupContent += '<strong>' + (feature.properties.name ?? 'Anxiety Zone') + '</strong><br>';
                    popupContent += 'Likes: ';
                    popupContent += '<span id="likesDisplay-' + feature.properties.uuid + '">';
                    popupContent += feature.properties.likes;
                    popupContent += '</span><br>';
                    popupContent += '</div>';
                    layer.bindPopup(popupContent);
                }
            });
        }
        return this.layers.anxietyZones[1];
    },


    isAnxietyZonesLayerVisible: function () {
        return this.layers.anxietyZones[0];
    },

    setAnxietyZonesLayerVisibility: function (isVisible) {
        this.layers.anxietyZones[0] = isVisible;
    },

    getRoadNetworkLayer: function () {
        if (!this.layers.roadNetwork[1]) {
            var wmsUrl = "http://localhost:8080/geoserver/wms";
            var layerName = "saafr:roads";

            this.layers.roadNetwork[1] = L.tileLayer.wms(wmsUrl, {
                layers: layerName,
                transparent: true,
                format: 'image/png',
                attribution: 'Map data © WMS Server'
            });
        }
        return this.layers.roadNetwork[1];
    },

    isRoadNetworkLayerVisible: function () {
        return this.layers.roadNetwork[0];
    },

    setRoadNetworkLayerVisibility: function (isVisible) {
        this.layers.roadNetwork[0] = isVisible;
    },

    isPopupVisible: function () {
        return this.ui.popupsEnabled;
    },

    setPopupVisibility: function (isEnabled) {
        this.ui.popupsEnabled = isEnabled;
    }
}