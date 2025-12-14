/**
Creates and returns a Leaflet GeoJSON layer for accident point data.
 
 The function fetches a GeoJSON file from the given URL and converts each feature
 into a styled circle marker using WGS84 coordinates. For every accident point,
 a popup is attached that displays basic information such as year, month,
 and accident category.
 */
(
    function () {
    window.saafr = window.saafr || {};
    window.saafr.layers = window.saafr.layers || {};

    window.saafr.layers.createAccidentsLayer = async function (geoJsonUrl) {
        const response = await fetch(geoJsonUrl);
        const data = await response.json();

        return L.geoJSON(data, {
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
    };
})();
