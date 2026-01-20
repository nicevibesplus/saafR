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
    document.getElementById('saveDataBtn').addEventListener('click', async function() {
      const feature = window.addPageStore.currentDrawing;
      if (!feature) return;
      
      // Validate form
      const form = document.getElementById('dataForm');
      if (!form.checkValidity()) {
          form.reportValidity();
          return;
      }
      
      // Collect active days
      // Collect active days
      const activeDays = [];
      const dayCheckboxes = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'];
      const alwaysActiveChecked = document.getElementById('alwaysActive').checked;

      if (alwaysActiveChecked) {
          // If "Always Active" is checked, include all days
          activeDays.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
      } else {
          // Otherwise, only include checked days
          dayCheckboxes.forEach(id => {
              const checkbox = document.getElementById(id);
              if (checkbox.checked) {
                  activeDays.push(checkbox.value);
              }
          });
      }               
      
      // Collect form data
      const formData = {
          severity: parseInt(document.getElementById('anxietySeverity').value),
          active_days: activeDays,
          active_time_start: document.getElementById('timeStart').value || null,
          active_time_end: document.getElementById('timeEnd').value || null,
          location_type: document.getElementById('locationType').value,
          trigger_type: document.getElementById('triggerType').value,
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
      //     alert('Error saving data. Check console.');
      // }
      
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('dataInputModal')).hide();
      
      // Show success message (temporary)
      alert('Data prepared for database insertion. Check console for details.');
    });


    // Delete geometry and cancel button
    document.getElementById('deleteGeometryBtn').addEventListener('click', function() {
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
    document.getElementById('alwaysActive').addEventListener('change', function() {
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
    document.getElementById('anxietySeverity').addEventListener('input', function() {
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
    document.getElementById('lighting').addEventListener('input', function() {
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
        btn.addEventListener('click', function() {
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
    document.getElementById('selectedTags').addEventListener('click', function(e) {
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
    document.getElementById('addCustomTagBtn').addEventListener('click', function() {
        const input = document.getElementById('customTagInput');
        const customTag = input.value.trim();
        
        if (customTag && !selectedTags.has(customTag)) {
            selectedTags.add(customTag);
            updateSelectedTagsDisplay();
            input.value = '';
        }
    });

    // Allow Enter key to add custom tag
    document.getElementById('customTagInput').addEventListener('keypress', function(e) {
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