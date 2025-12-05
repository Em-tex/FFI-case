/* js/map-logic.js */

let map;
let marker;

// Initialiserer kartet (Kalles fra auth-logic.js når skjemaet vises)
function initMap() {
    // Sjekk om kartet allerede er lastet for å unngå "Map container is already initialized" feil
    if (map) {
        map.invalidateSize(); // Viktig fiks: Sikrer at kartet tegnes riktig hvis det var skjult
        return;
    }

    // Startposisjon: Kjeller (FFI) - Du kan endre dette til en annen default
    const startLat = 59.9700; 
    const startLon = 11.0500;

    // Opprett kartet i <div id="map">
    map = L.map('map').setView([startLat, startLon], 13);

    // Legg til OpenStreetMap bakgrunnskart (Gratis, krever ingen API-nøkkel)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Lytt etter klikk på kartet
    map.on('click', function(e) {
        placeMarker(e.latlng);
    });
}

// Funksjon for å plassere markør
function placeMarker(latlng) {
    // Fjern gammel markør hvis den finnes
    if (marker) {
        map.removeLayer(marker);
    }

    // Legg til ny markør
    marker = L.marker(latlng).addTo(map);

    // Oppdater input-feltet i skjemaet med koordinater
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        // Formaterer til "Lat: 59.1234, Lon: 10.1234"
        locationInput.value = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
        // Fjern evt. rød ramme hvis feltet var markert som ugyldig
        locationInput.classList.remove('input-warning', 'input-danger');
    }
}

// Funksjon for å nullstille kartet (Knappen "Clear")
function clearMap() {
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
    const locationInput = document.getElementById('locationInput');
    if (locationInput) locationInput.value = '';
}

// Eksporter funksjonen slik at den kan nås fra andre scripts hvis nødvendig
window.initMap = initMap;
window.clearMap = clearMap;