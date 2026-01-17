window.renderPage = async function () {
    const content = document.getElementById("content");
    try {
        const response = await fetch('addpagecontent.html');
        if (!response.ok) throw new Error("Could not load addpagecontent.html");
        const html = await response.text();
        content.innerHTML = html;
    } catch (error) {
        console.error(error);
        return;
    }

    // Initialize the map
    window.addPageStore = {
        map: null,
        anxietyLayer: null,
        drawingMode: null, // 'polygon' or 'point'
        currentDrawing: null,
        drawnItems: new L.FeatureGroup()
    };

    const map = L.map('map').setView([51.9607, 7.6261], 13); // Münster coordinates
    window.addPageStore.map = map;

    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add drawn items layer to map
    map.addLayer(window.addPageStore.drawnItems);

    // Add WMS anxiety zones layer
    const anxietyWMS = L.tileLayer.wms('YOUR_WMS_URL_HERE', {
        layers: 'anxiety_zones',
        format: 'image/png',
        transparent: true,
        attribution: 'Anxiety Zones Data'
    });
    map.addLayer(anxietyWMS);
    window.addPageStore.anxietyLayer = anxietyWMS;

    // Initialize mobile guards
    if (window.saafr && window.saafr.ui && window.saafr.ui.initMobileGuards) {
        window.saafr.ui.initMobileGuards();
    }

    // Drawing functionality
    let isDrawing = false;
    let polygonPoints = [];
    let tempPolygon = null;

    // Point drawing button
    document.getElementById('drawPointBtn').addEventListener('click', function() {
        activateDrawingMode('point');
    });

    // Polygon drawing button
    document.getElementById('drawPolygonBtn').addEventListener('click', function() {
        activateDrawingMode('polygon');
    });

    // Cancel drawing button
    document.getElementById('cancelDrawBtn').addEventListener('click', function() {
        cancelDrawing();
    });

    // Finish drawing button
    document.getElementById('finishDrawBtn').addEventListener('click', function() {
        if (window.addPageStore.drawingMode === 'polygon' && isDrawing && polygonPoints.length >= 3) {
            if (tempPolygon) {
                map.removeLayer(tempPolygon);
            }
            
            const polygon = L.polygon(polygonPoints, {
                color: '#3388ff',
                weight: 2,
                fillOpacity: 0.3
            }).addTo(window.addPageStore.drawnItems);
            
            showDataInputModal('polygon', polygon);
            
            isDrawing = false;
            polygonPoints = [];
            cancelDrawing();
        }
    });

    function activateDrawingMode(mode) {
        window.addPageStore.drawingMode = mode;
        document.getElementById('drawingControls').classList.remove('d-none');
        
        // Update button states
        document.querySelectorAll('.draw-fab').forEach(btn => btn.classList.remove('active'));
        if (mode === 'point') {
            document.getElementById('drawPointBtn').classList.add('active');
            map.getContainer().style.cursor = 'crosshair';
        } else if (mode === 'polygon') {
            document.getElementById('drawPolygonBtn').classList.add('active');
            isDrawing = true;
            polygonPoints = [];
            map.getContainer().style.cursor = 'crosshair';
        }
    }

    function cancelDrawing() {
        isDrawing = false;
        polygonPoints = [];
        window.addPageStore.drawingMode = null;
        map.getContainer().style.cursor = '';
        
        if (tempPolygon) {
            map.removeLayer(tempPolygon);
            tempPolygon = null;
        }
        
        document.getElementById('drawingControls').classList.add('d-none');
        document.querySelectorAll('.draw-fab').forEach(btn => btn.classList.remove('active'));
    }

    // Map click handler for drawing
    map.on('click', function(e) {
        if (window.addPageStore.drawingMode === 'point') {
            // Draw point
            const customIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            const marker = L.marker(e.latlng, {icon: customIcon}).addTo(window.addPageStore.drawnItems);
            showDataInputModal('point', marker);
            cancelDrawing();
        } else if (window.addPageStore.drawingMode === 'polygon' && isDrawing) {
            // Add point to polygon
            polygonPoints.push(e.latlng);
            
            // Draw temporary polygon
            if (tempPolygon) {
                map.removeLayer(tempPolygon);
            }
            
            if (polygonPoints.length > 2) {
                tempPolygon = L.polygon(polygonPoints, {
                    color: '#ff7800',
                    weight: 2,
                    fillOpacity: 0.3
                }).addTo(map);
            } else if (polygonPoints.length > 0) {
                tempPolygon = L.polyline(polygonPoints, {
                    color: '#ff7800',
                    weight: 2
                }).addTo(map);
            }
        }
    });

    // Finish polygon drawing on double click
    map.on('dblclick', function(e) {
        if (window.addPageStore.drawingMode === 'polygon' && isDrawing && polygonPoints.length >= 3) {
            L.DomEvent.stop(e);
            
            if (tempPolygon) {
                map.removeLayer(tempPolygon);
            }
            
            const polygon = L.polygon(polygonPoints, {
                color: '#3388ff',
                weight: 2,
                fillOpacity: 0.3
            }).addTo(window.addPageStore.drawnItems);
            
            showDataInputModal('polygon', polygon);
            
            isDrawing = false;
            polygonPoints = [];
            cancelDrawing();
        }
    });

    function showDataInputModal(geometryType, feature) {
        window.addPageStore.currentDrawing = feature;
        
        const modal = new bootstrap.Modal(document.getElementById('dataInputModal'));
        document.getElementById('geometryType').textContent = geometryType;
        
        // Clear form
        document.getElementById('dataForm').reset();
        
        modal.show();
    }

    // Save data button
    document.getElementById('saveDataBtn').addEventListener('click', async function() {
        const feature = window.addPageStore.currentDrawing;
        if (!feature) return;
        
        // Collect form data
        const formData = {
            name: document.getElementById('anxietyName').value,
            severity: document.getElementById('anxietySeverity').value,
            description: document.getElementById('anxietyDescription').value,
            category: document.getElementById('anxietyCategory').value,
            geometry: null
        };
        
        // Extract geometry
        if (feature instanceof L.Marker) {
            const latlng = feature.getLatLng();
            formData.geometry = {
                type: 'Point',
                coordinates: [latlng.lng, latlng.lat]
            };
        } else if (feature instanceof L.Polygon) {
            const latlngs = feature.getLatLngs()[0];
            formData.geometry = {
                type: 'Polygon',
                coordinates: [latlngs.map(ll => [ll.lng, ll.lat])]
            };
        }
        
        console.log('Data to save:', formData);
        
        // TODO: Send to PostGIS database
        // Example:
        // try {
        //     const response = await fetch('YOUR_API_ENDPOINT', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify(formData)
        //     });
        //     if (response.ok) {
        //         alert('Data saved successfully!');
        //     }
        // } catch (error) {
        //     console.error('Save error:', error);
        // }
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('dataInputModal')).hide();
        
        // Show success message (temporary)
        alert('Data prepared for database insertion. Check console for details.');
    });

    // Dark mode toggle
    const darkModeSwitch = document.getElementById("darkModeToggleFAB");
    let isDarkMode = false;
    darkModeSwitch.addEventListener("click", function () {
        isDarkMode = !isDarkMode;
        // Simple toggle - you can enhance this with your actual dark mode logic
        if (isDarkMode) {
            this.querySelector('i').classList.replace('bi-moon-fill', 'bi-sun-fill');
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap, © CartoDB'
            }).addTo(map);
        } else {
            this.querySelector('i').classList.replace('bi-sun-fill', 'bi-moon-fill');
            map.eachLayer(layer => {
                if (layer instanceof L.TileLayer && !layer.wmsParams) {
                    map.removeLayer(layer);
                }
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        }
    });
};

window.unmountPage = function () {
    // Close any open modals
    const dataInputModalEl = document.getElementById("dataInputModal");
    if (dataInputModalEl) {
        const inst = bootstrap.Modal.getInstance(dataInputModalEl);
        if (inst) {
            inst.hide();
            inst.dispose();
        }
    }

    // Remove modal backdrops
    document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");

    // Clean up map
    if (window.addPageStore && window.addPageStore.map) {
        window.addPageStore.map.remove();
        window.addPageStore.map = null;
    }

    window.addPageStore = null;
};