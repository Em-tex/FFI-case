/* js/map-logic.js */

let map;
let marker;

function initMap() {
    if (map) {
        map.invalidateSize(); 
        return;
    }

    // Startposisjon: Sentrert over Norge, zoomet ut
    // Ca. Brønnøysund for å dekke hele landet
    const startLat = 65.0000; 
    const startLon = 13.0000;
    const zoomLevel = 4; // Zoomet ut for å se hele landet

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
        locationInput.classList.remove('input-missing'); // Fjern gul markering når valgt
    }
    calculateRisk(); // Oppdater skjemaet (fjerner "Awaiting" status hvis dette var siste felt)
}

function clearMap() {
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.value = '';
        // Trigge re-kalkulering for å sette feltet til gult igjen hvis nødvendig
        calculateRisk(); 
    }
}

window.initMap = initMap;
window.clearMap = clearMap;