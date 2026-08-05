async function geocode(place) {

    const url =
    "https://nominatim.openstreetmap.org/search?format=json&q="
    + encodeURIComponent(place)
    + "&limit=1";

    const response = await fetch(url);

    const data = await response.json();

    if (data.length === 0) {
        throw new Error("Località non trovata: " + place);
    }


    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: data[0].display_name
    };

}



async function getRoute(start, end) {


    const url =
    "https://router.project-osrm.org/route/v1/driving/"
    + start.lon + "," + start.lat
    + ";"
    + end.lon + "," + end.lat
    + "?overview=full&geometries=geojson";


    const response = await fetch(url);

    const data = await response.json();


    if (data.code !== "Ok") {
        throw new Error("Percorso non disponibile");
    }


    return data.routes[0];

}
