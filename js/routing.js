async function geocode(place) {


    const url =
    "https://nominatim.openstreetmap.org/search?format=json&q="
    + encodeURIComponent(place)
    + "&limit=1";



    const response =
    await fetch(url);



    const data =
    await response.json();



    if (!data.length) {

        throw new Error(
            "Località non trovata: " + place
        );

    }



    return {

        lat: Number(data[0].lat),

        lon: Number(data[0].lon)

    };


}





async function getRoute(start, end) {


    const url =

    "https://router.project-osrm.org/route/v1/driving/"

    + start.lon
    + ","
    + start.lat

    + ";"

    + end.lon
    + ","
    + end.lat

    + "?overview=full&geometries=geojson";



    const response =
    await fetch(url);



    const data =
    await response.json();



    if (!data.routes || !data.routes.length) {

        throw new Error(
            "Percorso non trovato"
        );

    }



    return data.routes[0];


}






async function getRouteWithWaypoint(
    start,
    waypoint,
    end
){


    const url =

    "https://router.project-osrm.org/route/v1/driving/"

    + start.lon
    + ","
    + start.lat

    + ";"

    + waypoint.lon
    + ","
    + waypoint.lat

    + ";"

    + end.lon
    + ","
    + end.lat

    + "?overview=full&geometries=geojson";



    const response =
    await fetch(url);



    const data =
    await response.json();



    if (!data.routes || !data.routes.length) {

        throw new Error(
            "Percorso con tappa non trovato"
        );

    }



    return data.routes[0];


}








async function reverseGeocode(
    lat,
    lon
){


    const url =

    "https://nominatim.openstreetmap.org/reverse?format=json&lat="

    + lat

    + "&lon="

    + lon;



    const response =
    await fetch(url);



    const data =
    await response.json();




    let address =
    data.address;



    let name =

    address.city
    ||
    address.town
    ||
    address.village
    ||
    address.municipality
    ||
    address.county
    ||
    "Località non identificata";



    return {

        name: name,

        lat: lat,

        lon: lon

    };


}







function calculateStopPoint(
    coordinates,
    camperDuration,
    departureTime,
    stopTime
){


    if(
        !departureTime
        ||
        !stopTime
    ){

        return null;

    }



    const startMinutes =

    timeToMinutes(
        departureTime
    );



    const targetMinutes =

    timeToMinutes(
        stopTime
    );



    let elapsedMinutes =

    targetMinutes - startMinutes;



    if(elapsedMinutes < 0){

        elapsedMinutes += 24 * 60;

    }




    const targetSeconds =

    elapsedMinutes * 60;




    const totalSeconds =

    camperDuration;




    let ratio =

    targetSeconds / totalSeconds;



    if(ratio < 0){

        ratio = 0;

    }



    if(ratio > 1){

        ratio = 1;

    }





    const index =

    Math.floor(
        coordinates.length * ratio
    );



    const point =

    coordinates[index];



    if(!point){

        return null;

    }



    return {


        lat: point[1],

        lon: point[0]


    };


}








function timeToMinutes(time){


    const parts =
    time.split(":");



    return (

        Number(parts[0]) * 60

        +

        Number(parts[1])

    );


}
