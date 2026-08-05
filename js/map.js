let map;
let routeLayer;

function initMap() {

    map = L.map('map').setView([45.4384, 10.9916], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

}


function drawRoute(coordinates) {

    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    routeLayer = L.polyline(coordinates, {
        weight: 5
    }).addTo(map);


    map.fitBounds(routeLayer.getBounds());

}


function addMarker(lat, lon, text) {

    L.marker([lat, lon])
        .addTo(map)
        .bindPopup(text);

}
