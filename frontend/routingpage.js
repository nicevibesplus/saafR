
/* ========================================
   ROUTINGPAGE.JS - MAP VIEWER
   This script is loaded when user clicks "Routing" in navbar
   ======================================== */

// ============================================
// STEP 1: BUILD THE HTML CONTENT
// ============================================

// This immediately executes and injects HTML into the content div
(function() {
    const content = document.getElementById('content');
    
    // Build the HTML structure for the map page
    content.innerHTML = `
        <div class="map-page-container">
            <div id="map"></div>
            
            <div class="fab-container-top">
                <!-- Layer Toggle FAB -->
                <button class="fab" id="layerToggleFAB" data-bs-toggle="modal" data-bs-target="#layerModal" title="Layers">
                    <i class="bi bi-layers-fill"></i>
                </button>
                
                <!-- Popup Toggle FAB -->
                <button class="fab popup-fab active" id="popupToggleFAB" title="Toggle Accident Info">
                    <i class="bi bi-chat-square-text-fill"></i>
                </button>
            </div>

            <!-- Bottom Routing Button -->
            <div class="bottom-button-container">
                <button class="routing-button" data-bs-toggle="modal" data-bs-target="#routingModal">
                    <i class="bi bi-sign-turn-right-fill me-2"></i>
                    Routing
                </button>
            </div>

            <!-- Layer Selection Modal -->
            <div class="modal fade" id="layerModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">I want to avoid:</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Accidents Toggle -->
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="toggleAccidents" checked>
                                <label class="form-check-label" for="toggleAccidents">
                                    <span class="legend-marker accidents"></span>
                                    Accidents
                                </label>
                            </div>
                            
                            <!-- Anxiety Zones Toggle -->
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="toggleAnxietyZones" checked>
                                <label class="form-check-label" for="toggleAnxietyZones">
                                    <span class="legend-marker anxiety"></span>
                                    Anxiety Zones
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Let's take you on your journey</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Routing Modal -->
            <div class="modal fade" id="routingModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Route Calculation</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Placeholder inputs -->
                            <div class="mb-3">
                                <label class="form-label">Starting Point</label>
                                <input type="text" class="form-control" placeholder="Enter start location">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Destination</label>
                                <input type="text" class="form-control" placeholder="Enter destination">
                            </div>
                            <!-- Route Considerations Section -->
                            <div class="route-considerations mt-4">
                                <h6 class="mb-2">The routing considers:</h6>
                                <div class="consideration-list">
                                    <div class="consideration-item" id="routingAccidentsStatus">
                                        <span class="legend-marker accidents"></span>
                                        <span class="consideration-text">Accidents</span>
                                    </div>
                                    <div class="consideration-item" id="routingAnxietyStatus">
                                        <span class="legend-marker anxiety"></span>
                                        <span class="consideration-text">Anxiety Zones</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary">Calculate Route</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // popup toggle functionality
    setTimeout(() => {
        const popupBtn = document.getElementById('popupToggleFAB');
        let popupsEnabled = true;
        
        popupBtn.addEventListener('click', function() {
            popupsEnabled = !popupsEnabled;
            this.classList.toggle('active');
            
            // Update all accident layers
            if (layerGroups.accidents) {
                layerGroups.accidents.eachLayer(function(layer) {
                    if (popupsEnabled) {
                        layer.on('click', function() {
                            layer.openPopup();
                        });
                    } else {
                        layer.closePopup();
                        layer.off('click');
                    }
                });
            }
        });
        
        // Asking for layer modal on load
        const layerModal = new bootstrap.Modal(document.getElementById('layerModal'));
        layerModal.show();
        
        initializeMap();
    }, 100);
})();

// Why use an IIFE (Immediately Invoked Function Expression)?
// The () at the end means this function runs immediately when the script loads.
// This ensures the HTML is built right away.


// ============================================
// STEP 2: GLOBAL VARIABLES
// ============================================

// These variables store our map and layers so we can access them from any function
let map;  // The Leaflet map instance

// Layer groups object - stores references to each data layer
let layerGroups = {
    accidents: null,      // Will hold the accidents layer
    roadNetwork: null,    // Will hold the road network layer
    anxietyZones: null    // Will hold the anxiety zones layer
};


// ============================================
// STEP 3: MAP INITIALIZATION
// ============================================

function initializeMap() {
    // Check if map already exists (important when navigating back to this page)
    if (map) {
        map.remove();  // Remove old map instance to prevent errors
    }
    
    // Create a new Leaflet map
    // L.map('map') - Creates map in the div with id="map"
    // .setView([lat, lng], zoom) - Sets initial center and zoom level
    // You should change [51.9607, 7.6261] to your area of interest
    map = L.map('map').setView([51.9607, 7.6261], 13);
    
    // Add the base map tiles (OpenStreetMap)
    // This provides the background map showing streets, buildings, etc.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,  // Maximum zoom level
        minZoom: 10   // Minimum zoom level (prevents zooming out too far)
    }).addTo(map);
    


    // Zoom-level based visibility for Accidents layer
    const ACCIDENTS_MIN_ZOOM = 13;
    
    map.on('zoomend', function() {
        if (!layerGroups.accidents) return;
        
        if (map.getZoom() >= ACCIDENTS_MIN_ZOOM) {
            map.addLayer(layerGroups.accidents);
        } else {
            map.removeLayer(layerGroups.accidents);
        }
    });

    // Load all data layers onto the map
    loadAllLayers();
    
    // Set up the toggle switches to control layer visibility
    setupLayerToggles();
}

// Why the if(map) check?
// If user navigates: Home → Routing → Home → Routing
// The map object still exists from the first visit.
// We need to clean it up before creating a new one.


// ============================================
// STEP 4: LOAD ALL DATA LAYERS
// ============================================

function loadAllLayers() {
    // Call each layer loading function
    // These run asynchronously (don't block each other)
    loadAccidents();
    //loadRoadNetwork();
    //loadAnxietyZones();
}


// ============================================
// STEP 5: LOAD ACCIDENTS LAYER (POINTS)
// ============================================

function loadAccidents() {
    fetch('test_data/munster_2020_2024_utm.geojson')
        .then(response => response.json())
        .then(data => {
            layerGroups.accidents = L.geoJSON(data, {
                pointToLayer: function(feature, latlng) {
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

                onEachFeature: function(feature, layer) {
                    if (feature.properties) {
                        // Create simple popup content
                        let popupContent = '<div style="font-family: Arial; font-size: 14px;">';
                        popupContent += '<strong>Accident Info</strong><br>';
                        popupContent += 'Year: ' + feature.properties.UJAHR + '<br>';
                        popupContent += 'Month: ' + feature.properties.UMONAT + '<br>';
                        popupContent += 'Category: ' + feature.properties.UKATEGORIE;
                        popupContent += '</div>';
                        
                        // Attach popup to layer
                        layer.bindPopup(popupContent);
                        
                        
                    }
                }
            });
            // Check initial zoom level
            if (map.getZoom() >= 13) {
                map.addLayer(layerGroups.accidents);
                }
            console.log('Accidents loaded successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Could not load accidents');
        });
}


// About the .then() chain:
// fetch() returns a Promise - it doesn't block the code
// .then() defines what to do when the data arrives
// .catch() handles any errors


// ============================================
// STEP 6: LOAD ROAD NETWORK LAYER (LINES)
// ============================================

function loadRoadNetwork() {
    fetch('data/road-network.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error('Road network file not found');
            }
            return response.json();
        })
        .then(data => {
            // Create the road network layer
            layerGroups.roadNetwork = L.geoJSON(data, {
                
                // style: Customize how line features are displayed
                // This function is called for each line in your GeoJSON
                style: function(feature) {
                    // feature: Contains the geometry and properties
                    
                    // Return a style object
                    return {
                        color: '#0066cc',    // Blue line color
                        weight: 3,           // Line thickness (in pixels)
                        opacity: 0.7         // Line opacity (0-1)
                    };
                    
                    // Advanced: You could style differently based on properties:
                    // if (feature.properties.type === 'highway') {
                    //     return { color: 'red', weight: 5 };
                    // } else {
                    //     return { color: 'blue', weight: 2 };
                    // }
                },
                
                // Add popups to roads
                onEachFeature: function(feature, layer) {
                    if (feature.properties) {
                        let popupContent = '<div class="popup-content">';
                        popupContent += '<h6>Road Information</h6>';
                        
                        // ⚠️ Replace with your actual property names
                        if (feature.properties.name) {
                            popupContent += '<p><strong>Name:</strong> ' + feature.properties.name + '</p>';
                        }
                        if (feature.properties.type) {
                            popupContent += '<p><strong>Type:</strong> ' + feature.properties.type + '</p>';
                        }
                        if (feature.properties.speed_limit) {
                            popupContent += '<p><strong>Speed Limit:</strong> ' + feature.properties.speed_limit + ' km/h</p>';
                        }
                        
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);
        })
        .catch(error => {
            console.error('Error loading road network:', error);
            alert('Could not load road network layer. Check console for details.');
        });
}


// ============================================
// STEP 7: LOAD ANXIETY ZONES LAYER (POLYGONS)
// ============================================

function loadAnxietyZones() {
    fetch('data/anxiety-zones.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error('Anxiety zones file not found');
            }
            return response.json();
        })
        .then(data => {
            // Create the anxiety zones layer
            layerGroups.anxietyZones = L.geoJSON(data, {
                
                // style: Customize how polygon features are displayed
                style: function(feature) {
                    return {
                        fillColor: 'orange',     // Polygon fill color
                        fillOpacity: 0.4,        // Fill transparency (0-1)
                        color: 'orange',         // Border color
                        weight: 2,               // Border thickness
                        opacity: 0.8             // Border opacity
                    };
                    
                    // Advanced: Different colors based on risk level
                    // let color = 'yellow';
                    // if (feature.properties.risk === 'high') color = 'red';
                    // if (feature.properties.risk === 'medium') color = 'orange';
                    // return { fillColor: color, fillOpacity: 0.5, ... };
                },
                
                // Add popups to zones
                onEachFeature: function(feature, layer) {
                    if (feature.properties) {
                        let popupContent = '<div class="popup-content">';
                        popupContent += '<h6>Anxiety Zone</h6>';
                        
                        // ⚠️ Replace with your actual property names
                        if (feature.properties.name) {
                            popupContent += '<p><strong>Area:</strong> ' + feature.properties.name + '</p>';
                        }
                        if (feature.properties.risk_level) {
                            popupContent += '<p><strong>Risk Level:</strong> ' + feature.properties.risk_level + '</p>';
                        }
                        if (feature.properties.reason) {
                            popupContent += '<p><strong>Reason:</strong> ' + feature.properties.reason + '</p>';
                        }
                        
                        popupContent += '</div>';
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);
        })
        .catch(error => {
            console.error('Error loading anxiety zones:', error);
            alert('Could not load anxiety zones layer. Check console for details.');
        });
}


// ============================================
// STEP 8: SETUP LAYER TOGGLE CONTROLS
// ============================================

function setupLayerToggles() {
    const accidentsToggle = document.getElementById('toggleAccidents');
    const anxietyZonesToggle = document.getElementById('toggleAnxietyZones');
    
    if (accidentsToggle) {
        accidentsToggle.addEventListener('change', function() {
            toggleLayer('accidents', this.checked);
        });
    }
    
    if (anxietyZonesToggle) {
        anxietyZonesToggle.addEventListener('change', function() {
            toggleLayer('anxietyZones', this.checked);
        });
    }
}

// Why separate event listeners instead of one?
// Each toggle controls a different layer, so we need to know which one was clicked.
// We could use a single listener with event delegation, but this is clearer.


// ============================================
// STEP 9: TOGGLE LAYER VISIBILITY
// ============================================

function toggleLayer(layerName, isVisible) {
    // layerName: string ('accidents', 'roadNetwork', or 'anxietyZones')
    // isVisible: boolean (true = show, false = hide)
    
    // Get the layer from our layerGroups object
    const layer = layerGroups[layerName];
    
    // Check if the layer exists (it might not be loaded yet)
    if (layer) {
        if (isVisible) {
            // Add the layer to the map (make it visible)
            map.addLayer(layer);
        } else {
            // Remove the layer from the map (hide it)
            map.removeLayer(layer);
        }
    }

    updateRoutingModalStatus();
}

// Why check if(layer)?
// The layer might still be loading from the server when user toggles.
// If we don't check, we'll get an error trying to add/remove null.


// ============================================
// STEP 10: UTILITY FUNCTIONS (OPTIONAL)
// ============================================

// Function to automatically zoom to show all your data
function fitMapToData() {
    // Collect all layers that exist
    let allLayers = [];
    
    // Object.values() gets all values from the layerGroups object
    Object.values(layerGroups).forEach(layer => {
        if (layer) {  // Only add if layer exists
            allLayers.push(layer);
        }
    });
    
    // If we have at least one layer
    if (allLayers.length > 0) {
        // L.featureGroup() combines multiple layers
        let group = L.featureGroup(allLayers);
        
        // .getBounds() calculates the bounding box containing all features
        // .pad(0.1) adds 10% padding around the edges
        // .fitBounds() zooms/pans the map to show this area
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Function to update routing modal status display
function updateRoutingModalStatus() {
    const accidentsItem = document.getElementById('routingAccidentsStatus');
    const anxietyItem = document.getElementById('routingAnxietyStatus');
    
    if (accidentsItem && anxietyItem) {
        // Check if accidents layer is on the map
        if (layerGroups.accidents && map.hasLayer(layerGroups.accidents)) {
            accidentsItem.classList.remove('disabled');
        } else {
            accidentsItem.classList.add('disabled');
        }
        
        // Check if anxiety zones layer is on the map
        if (layerGroups.anxietyZones && map.hasLayer(layerGroups.anxietyZones)) {
            anxietyItem.classList.remove('disabled');
        } else {
            anxietyItem.classList.add('disabled');
        }
    }
}

// Update the status whenever routing modal is opened
document.addEventListener('show.bs.modal', function(event) {
    if (event.target.id === 'routingModal') {
        updateRoutingModalStatus();
    }
});


// ============================================
// CLEANUP WHEN LEAVING THE PAGE
// ============================================

// Optional but recommended: Clean up when user navigates away
// This prevents memory leaks
window.addEventListener('beforeunload', function() {
    if (map) {
        map.remove();
        map = null;
    }
});