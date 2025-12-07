/* js/map-logic.js */

// Vi bruker window.uavMap for å unngå konflikt med <div id="map">
// Nettlesere lager ofte automatisk en variabel 'map' av ID-en, som skaper krøll.
window.uavMap = null;
let marker;

function initMap() {
    // Sjekk om kartet allerede er initialisert
    if (window.uavMap) {
        window.uavMap.invalidateSize(); 
        return;
    }

    // Startposisjon: Sentrert over Norge
    const startLat = 65.0000; 
    const startLon = 10.0000;
    const zoomLevel = 4; 

    window.uavMap = L.map('map').setView([startLat, startLon], zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(window.uavMap);

    window.uavMap.on('click', function(e) {
        placeMarker(e.latlng);
    });
}

function placeMarker(latlng) {
    if (!window.uavMap) return;

    if (marker) {
        window.uavMap.removeLayer(marker);
    }
    marker = L.marker(latlng).addTo(window.uavMap);

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
    if (!window.uavMap) return;

    if (marker) {
        window.uavMap.removeLayer(marker);
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
    window.uavMap.setView([65.0000, 10.0000], 4);
}

// Eksporter funksjonene
window.initMap = initMap;
window.clearMap = clearMap;
document.addEventListener("DOMContentLoaded", initMap);