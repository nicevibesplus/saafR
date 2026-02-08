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

    // Münster area bounds
    var muensterBounds = L.latLngBounds(
        [51.8, 7.45],  // Southwest
        [52.1, 7.80]   // Northeast
    );

    const map = L.map('map', {
        maxBounds: muensterBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 10.5,
        zoomSnap: 0.5,
        zoomDelta: 0.5
    }).setView([51.9607, 7.6261], 13); // Münster coordinates
    window.addPageStore.map = map;

    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    async function loadAnxietyZones() {
        try {
            const response = await fetch('http://localhost:3000/get_anxiety_areas');
            const geojsonData = await response.json();

            if (window.addPageStore.anxietyLayer) {
                map.removeLayer(window.addPageStore.anxietyLayer);
            }

            const anxietyLayer = L.geoJSON(geojsonData, {
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
                // Polygon- and LineString-Features
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
                    layer.on('click', function (e) {
                        showAnxietyZonePopup(feature, layer);
                    });
                }
            });

            anxietyLayer.addTo(map);
            window.addPageStore.anxietyLayer = anxietyLayer;

        } catch (error) {
            console.error('Error loading anxiety zones:', error);
        }
    }


    // Load anxiety zones on page load
    loadAnxietyZones();



    function showAnxietyZonePopup(feature, layer) {
        const props = feature.properties

        // Build trigger tags display
        let triggers = props.trigger_type || [];  // already an array
        let triggersHTML = triggers.map(t =>
            `<span class="badge bg-primary me-1 mb-1">${t.trim()}</span>`
        ).join('');


        // Build active days display
        const days = props.active_days || [];
        const daysHTML = days.length === 7 ?
            '<span class="text-muted">All days</span>' :
            days.join(', ');

        // Build time display
        const timeHTML = (!props.active_time_start && !props.active_time_end) ?
            '<span class="text-muted">All day</span>' :
            `${props.active_time_start || '00:00'} - ${props.active_time_end || '23:59'}`;

        // Severity label
        const severityLabels = {
            1: 'Very Low',
            2: 'Low',
            3: 'Medium',
            4: 'High',
            5: 'Very High'
        };

        // Lighting label
        const lightingLabels = {
            1: 'Poor',
            2: 'Moderate',
            3: 'Good'
        };

        const popupContent = `
            <div class="anxiety-popup" style="min-width: 280px;">
                <h6 class="mb-2 pb-2 border-bottom">
                    <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                    Anxiety Zone
                </h6>
                
                <div class="mb-2">
                    <strong>Severity:</strong> 
                    <span class="badge bg-warning">${severityLabels[props.severity] || props.severity}</span>
                </div>
                
                <div class="mb-2">
                    <strong>Location Type:</strong> ${props.location_type || 'N/A'}
                </div>
                
                <div class="mb-2">
                    <strong>Triggers:</strong><br>
                    ${triggersHTML || '<span class="text-muted">None specified</span>'}
                </div>
                
                <div class="mb-2">
                    <strong>Active:</strong> ${daysHTML}
                    ${props.active_time_start ? `<br><small class="text-muted">${timeHTML}</small>` : ''}
                </div>
                
                <div class="mb-2">
                    <strong>Lighting:</strong> ${lightingLabels[props.lighting] || props.lighting}
                </div>
                
                ${props.remark ? `
                    <div class="mb-2">
                        <strong>Remarks:</strong><br>
                        <small class="text-muted">${props.remark}</small>
                    </div>
                ` : ''}
                
                <hr class="my-2">
                
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Community Rating:</strong>
                        <span class="ms-2 badge ${props.likes >= 0 ? 'bg-success' : 'bg-danger'}" id="likesDisplay-${props.uuid}">
                            ${props.likes || 0}
                        </span>
                    </div>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-success" onclick="increaseLikes('${props.uuid}', this)">
                            <i class="bi bi-hand-thumbs-up-fill"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="decreaseLikes('${props.uuid}', this, ${props.likes})">
                            <i class="bi bi-hand-thumbs-down-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        layer.bindPopup(popupContent, {
            maxWidth: 350,
            className: 'anxiety-zone-popup'
        }).openPopup();
    }


    // Like/Dislike Handler
    window.increaseLikes = async function (zoneId, buttonElement) {
        // Disable button during request
        buttonElement.disabled = true;

        try {
            const response = await fetch(`http://localhost:3000/increase_community_rating`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uuid: zoneId })
            });

            if (response.ok) {
                const data = await response.json();

                // Update the display immediately
                const likesDisplay = document.getElementById(`likesDisplay-${zoneId}`);
                if (likesDisplay) {
                    likesDisplay.textContent = data.newLikes;

                    // Update badge color
                    likesDisplay.className = `ms-2 badge ${data.newLikes >= 0 ? 'bg-success' : 'bg-danger'}`;
                }
                loadAnxietyZones();
                // Visual feedback - briefly highlight the button
                buttonElement.classList.add('active');
                setTimeout(() => {
                    buttonElement.classList.remove('active');
                    buttonElement.disabled = false;
                }, 300);

            } else {
                alert('Error updating rating. Please try again.');
                buttonElement.disabled = false;
            }

        } catch (error) {
            console.error('Error updating likes:', error);
            alert('Network error. Please check your connection.');
            buttonElement.disabled = false;
        }
    };

    window.decreaseLikes = async function (zoneId, buttonElement, likeNumber) {
        // Disable button during request
        buttonElement.disabled = true;

        try {
            if (likeNumber <= 0) {
                alert('Cannot decrease rating below zero.');
            }
            else {
                const response = await fetch(`http://localhost:3000/decrease_community_rating`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uuid: zoneId })
                });

                if (response.ok) {
                    const data = await response.json();

                    // Update the display immediately
                    const likesDisplay = document.getElementById(`likesDisplay-${zoneId}`);
                    if (likesDisplay) {
                        likesDisplay.textContent = data.newLikes;

                        // Update badge color
                        likesDisplay.className = `ms-2 badge ${data.newLikes >= 0 ? 'bg-success' : 'bg-danger'}`;
                    }

                    // Visual feedback - briefly highlight the button
                    buttonElement.classList.add('active');
                    setTimeout(() => {
                        buttonElement.classList.remove('active');
                        buttonElement.disabled = false;
                    }, 300);

                    loadAnxietyZones();

                } else {
                    alert('Error updating rating. Please try again.');
                    buttonElement.disabled = false;
                }
            }

        } catch (error) {
            console.error('Error updating likes:', error);
            alert('Network error. Please check your connection.');
            buttonElement.disabled = false;
        }
    };


    // Initialize mobile guards
    if (window.saafr && window.saafr.ui && window.saafr.ui.initMobileGuards) {
        window.saafr.ui.initMobileGuards();
    }

    // Drawing functionality
    let isDrawing = false;
    let polygonPoints = [];
    let tempPolygon = null;

    // Point drawing button
    document.getElementById('drawPointBtn').addEventListener('click', function () {
        activateDrawingMode('point');
    });

    // Polygon drawing button
    document.getElementById('drawPolygonBtn').addEventListener('click', function () {
        activateDrawingMode('polygon');
    });

    // Cancel drawing button
    document.getElementById('cancelDrawBtn').addEventListener('click', function () {
        cancelDrawing();
    });

    // Finish drawing button
    document.getElementById('finishDrawBtn').addEventListener('click', function () {
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
    map.on('click', function (e) {
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
            const marker = L.marker(e.latlng, { icon: customIcon }).addTo(window.addPageStore.drawnItems);
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
    map.on('dblclick', function (e) {
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

        // Clear form
        document.getElementById('dataForm').reset();

        // Clear selected tags
        selectedTags.clear();
        document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
        updateSelectedTagsDisplay();

        // Reset sliders to defaults
        document.getElementById('anxietySeverity').value = 3;
        document.getElementById('anxietySeverity').dispatchEvent(new Event('input'));
        document.getElementById('lighting').value = 2;
        document.getElementById('lighting').dispatchEvent(new Event('input'));

        // Reset "Always Active" to default
        document.getElementById('alwaysActive').checked = true;
        document.getElementById('alwaysActive').dispatchEvent(new Event('change'));

        modal.show();
    }

    // Save data button
    document.getElementById('saveDataBtn').addEventListener('click', async function () {
        const feature = window.addPageStore.currentDrawing;
        if (!feature) return;

        // Validate form
        const form = document.getElementById('dataForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Collect active days
        const activeDays = [];
        const dayCheckboxes = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'];
        const alwaysActiveChecked = document.getElementById('alwaysActive').checked;

        if (alwaysActiveChecked) {
            activeDays.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
        } else {
            dayCheckboxes.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox.checked) {
                    activeDays.push(checkbox.value);
                }
            });
        }

        // Collect form data
        let trigger_type_string = document.getElementById('triggerType').value;
        let trigger_type_array = trigger_type_string.split(",");
        const formData = {
            severity: parseInt(document.getElementById('anxietySeverity').value),
            active_days: activeDays,
            active_time_start: document.getElementById('timeStart').value || null,
            active_time_end: document.getElementById('timeEnd').value || null,
            location_type: document.getElementById('locationType').value,
            trigger_type: trigger_type_array,
            lighting: parseInt(document.getElementById('lighting').value),
            remark: document.getElementById('remark').value,
            likes: 0,
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
            const coords = latlngs.map(ll => [ll.lng, ll.lat]);

            // GeoJSON Polygone is closed
            if (coords.length > 0 &&
                (coords[0][0] !== coords[coords.length - 1][0] ||
                    coords[0][1] !== coords[coords.length - 1][1])) {
                coords.push(coords[0]);
            }

            formData.geometry = {
                type: 'Polygon',
                coordinates: [coords]
            };
        }

        console.log('Data to save:', formData);
        console.log(JSON.stringify(formData));

        try {
            const response = await fetch('/upload-anxiety-areas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Close modal first
                bootstrap.Modal.getInstance(document.getElementById('dataInputModal')).hide();

                // Show success notification
                showSavedNotification();

                // Reload anxiety zones to show the new one
                await loadAnxietyZones();
            } else {
                alert('Error saving data. Server returned: ' + response.status);
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving data. Check console.');
        }
    });

    function showSavedNotification() {
        let toastEl = document.getElementById('toastdbsuccess');

        // Create if doesn't exist
        if (!toastEl) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
        <div aria-live="polite" aria-atomic="true" class="position-fixed top-0 end-0 p-3" style="z-index: 11">
            <div class="toast" id="toastdbsuccess">
                <div class="toast-header">
                    <strong class="me-auto">Success</strong>
                    <small>Just now</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Zone saved successfully!
                </div>
            </div>
        </div>
    `;
            document.body.appendChild(wrapper.firstElementChild);
            toastEl = document.getElementById('toastdbsuccess');
        }

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }


    // Delete geometry and cancel button
    document.getElementById('deleteGeometryBtn').addEventListener('click', function () {
        const feature = window.addPageStore.currentDrawing;

        if (feature) {
            // Remove the drawn feature from the map
            window.addPageStore.drawnItems.removeLayer(feature);

            // Clear reference
            window.addPageStore.currentDrawing = null;
        }

        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('dataInputModal')).hide();
    });



    // "Always Active" checkbox handler
    document.getElementById('alwaysActive').addEventListener('change', function () {
        const dayCheckboxes = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'];
        const timeStart = document.getElementById('timeStart');
        const timeEnd = document.getElementById('timeEnd');

        if (this.checked) {
            // Lock everything to "always active"
            dayCheckboxes.forEach(id => {
                const checkbox = document.getElementById(id);
                checkbox.checked = true;
                checkbox.disabled = true;
            });
            timeStart.value = '';
            timeStart.disabled = true;
            timeEnd.value = '';
            timeEnd.disabled = true;
        } else {
            // Unlock for customization (keep values but enable editing)
            dayCheckboxes.forEach(id => {
                const checkbox = document.getElementById(id);
                checkbox.disabled = false;
                // Keep checked state
            });
            timeStart.disabled = false;
            timeEnd.disabled = false;
            // Values remain as "All day" but now editable
        }
    });

    // Trigger on page load to set initial state
    document.getElementById('alwaysActive').dispatchEvent(new Event('change'));

    // Severity slider value display
    document.getElementById('anxietySeverity').addEventListener('input', function () {
        const severityLabels = {
            1: '1 - Very Low',
            2: '2 - Low',
            3: '3 - Medium',
            4: '4 - High',
            5: '5 - Very High'
        };
        document.getElementById('severityValue').textContent = severityLabels[this.value];
    });

    // Lighting slider value display
    document.getElementById('lighting').addEventListener('input', function () {
        const lightingLabels = {
            1: 'Poor',
            2: 'Moderate',
            3: 'Good'
        };
        document.getElementById('lightingValue').textContent = lightingLabels[this.value];
    });

    // Trigger Type Tag Selection System
    const selectedTags = new Set();

    function updateSelectedTagsDisplay() {
        const container = document.getElementById('selectedTags');
        const hiddenInput = document.getElementById('triggerType');

        container.innerHTML = '';

        selectedTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'selected-tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="remove-tag" data-tag="${tag}">×</span>
            `;
            container.appendChild(tagElement);
        });

        // Update hidden input with comma-separated values
        hiddenInput.value = Array.from(selectedTags).join(',');
    }

    // Predefined tag button clicks
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tag = this.dataset.tag;

            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
                this.classList.remove('active');
            } else {
                selectedTags.add(tag);
                this.classList.add('active');
            }

            updateSelectedTagsDisplay();
        });
    });

    // Remove tag from selected display
    document.getElementById('selectedTags').addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-tag')) {
            const tag = e.target.dataset.tag;
            selectedTags.delete(tag);

            // Also remove active state from button if it exists
            document.querySelectorAll('.tag-btn').forEach(btn => {
                if (btn.dataset.tag === tag) {
                    btn.classList.remove('active');
                }
            });

            updateSelectedTagsDisplay();
        }
    });

    // Custom tag addition
    document.getElementById('addCustomTagBtn').addEventListener('click', function () {
        const input = document.getElementById('customTagInput');
        const customTag = input.value.trim();

        if (customTag && !selectedTags.has(customTag)) {
            selectedTags.add(customTag);
            updateSelectedTagsDisplay();
            input.value = '';
        }
    });

    // Allow Enter key to add custom tag
    document.getElementById('customTagInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('addCustomTagBtn').click();
        }
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