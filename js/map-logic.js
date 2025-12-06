/* js/map-logic.js */

let map;
let marker;

function initMap() {
    if (map) {
        map.invalidateSize(); 
        return;
    }

    // Startposisjon: Sentrert over Norge (Justert vestover fra Sverige)
    // 65.0, 10.0 treffer bedre midt på landet visuelt ved zoom 4
    const startLat = 65.0000; 
    const startLon = 10.0000;
    const zoomLevel = 4; 

    map = L.map('map').setView([startLat, startLon], zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', function(e) {
        placeMarker(e.latlng);
    });
}

function placeMarker(latlng) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker(latlng).addTo(map);

    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.value = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
        locationInput.classList.remove('input-missing'); 
    }
    // Oppdater risikoskjemaet hvis funksjonen er tilgjengelig
    if (typeof calculateRisk === "function") {
        calculateRisk(); 
    }
}

function clearMap() {
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.value = '';
        if (typeof calculateRisk === "function") {
            calculateRisk(); 
        }
    }
    
    // Reset view til Norge
    if(map) map.setView([65.0000, 10.0000], 4);
}

window.initMap = initMap;
window.clearMap = clearMap;