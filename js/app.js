const map = L.map('map').setView([45.4384, 10.9916], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);


let marker = L.marker([45.4384, 10.9916])
    .addTo(map)
    .bindPopup("Camper Planner")
    .openPopup();


document.getElementById("routeButton").addEventListener("click", function(){

    const start = document.getElementById("start").value;
    const waypoint = document.getElementById("waypoint").value;
    const end = document.getElementById("end").value;

    alert(
        "Partenza: " + start +
        "\nTappa: " + waypoint +
        "\nArrivo: " + end
    );

});
