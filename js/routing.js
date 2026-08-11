function parseCoordinates(text) {

    text = text.trim();

    // Formati accettati:
    // 45.123,11.456
    // 45.123 11.456
    // 45.123;11.456

    const match = text.match(
        /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/
    );

    if (!match) {

        return null;

    }

    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);

    if (
        lat < -90 || lat > 90 ||
        lon < -180 || lon > 180
    ) {

        return null;

    }

    return {

        lat: lat,

        lon: lon

    };

}






async function geocode(place) {

    const coordinates = parseCoordinates(place);

    if (coordinates) {

        return coordinates;

    }

    const url =
        "https://nominatim.openstreetmap.org/search?format=json&q=" +
        encodeURIComponent(place) +
        "&limit=1";


    const response = await fetch(url);

    const data = await response.json();


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
        "https://router.project-osrm.org/route/v1/driving/" +

        start.lon + "," + start.lat +

        ";" +

        end.lon + "," + end.lat +

        "?overview=full&geometries=geojson";


    const response = await fetch(url);

    const data = await response.json();



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
) {


    const url =
        "https://router.project-osrm.org/route/v1/driving/" +

        start.lon + "," + start.lat +

        ";" +

        waypoint.lon + "," + waypoint.lat +

        ";" +

        end.lon + "," + end.lat +

        "?overview=full&geometries=geojson";


    const response = await fetch(url);

    const data = await response.json();



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
) {


    const url =
        "https://nominatim.openstreetmap.org/reverse?format=json&lat=" +

        lat +

        "&lon=" +

        lon;



    const response = await fetch(url);

    const data = await response.json();



    const address = data.address || {};



    const placeName =

        address.city ||

        address.town ||

        address.village ||

        address.municipality ||

        address.hamlet ||

        "Località non identificata";


    const province =

        address.county ||

        address.state_district ||

        "";


    const name =

        province

        ?

        placeName + " (" + province + ")"

        :

        placeName;



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
) {


    if (!departureTime || !stopTime) {

        return null;

    }



    const startMinutes =
        timeToMinutes(departureTime);



    const stopMinutes =
        timeToMinutes(stopTime);



    let elapsedMinutes =
        stopMinutes - startMinutes;



    if (elapsedMinutes < 0) {

        elapsedMinutes += 1440;

    }



    const elapsedSeconds =
        elapsedMinutes * 60;



    const ratio =
        elapsedSeconds / camperDuration;



    if (ratio >= 1) {

        return {

            lat: coordinates[coordinates.length - 1][1],

            lon: coordinates[coordinates.length - 1][0]

        };

    }



    const targetDistance =
        calculateTotalDistance(coordinates)
        *
        ratio;



    let travelled = 0;



    for (
        let i = 1;
        i < coordinates.length;
        i++
    ) {


        const previous =
            coordinates[i - 1];


        const current =
            coordinates[i];



        const segment =
            distanceBetweenPoints(
                previous[1],
                previous[0],
                current[1],
                current[0]
            );



        travelled += segment;



        if (travelled >= targetDistance) {


            return {

                lat: current[1],

                lon: current[0]

            };


        }

    }



    return {

        lat: coordinates[coordinates.length - 1][1],

        lon: coordinates[coordinates.length - 1][0]

    };

}








function calculateTotalDistance(
    coordinates
) {


    let total = 0;



    for (
        let i = 1;
        i < coordinates.length;
        i++
    ) {


        total += distanceBetweenPoints(

            coordinates[i - 1][1],

            coordinates[i - 1][0],

            coordinates[i][1],

            coordinates[i][0]

        );


    }



    return total;

}







function distanceBetweenPoints(
    lat1,
    lon1,
    lat2,
    lon2
) {


    const R = 6371000;


    const p1 =
        lat1 * Math.PI / 180;


    const p2 =
        lat2 * Math.PI / 180;


    const deltaLat =
        (lat2 - lat1) * Math.PI / 180;


    const deltaLon =
        (lon2 - lon1) * Math.PI / 180;



    const a =

        Math.sin(deltaLat / 2) ** 2 +

        Math.cos(p1) *

        Math.cos(p2) *

        Math.sin(deltaLon / 2) ** 2;



    return R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

}







// Chiave API gratuita di OpenRouteService (piano Standard)
// Usata solo quando sono impostate le dimensioni del camper,
// per calcolare un percorso realmente adatto al veicolo.
const ORS_API_KEY =
    "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImRiNWU4YzYzNDQ3ZjRmMjRhY2U4MjRiZDQzZDExMjc5IiwiaCI6Im11cm11cjY0In0=";



async function getRouteORS(start, waypoint, end, camperProfile) {


    const coordinates = [
        [start.lon, start.lat]
    ];

    if (waypoint) {
        coordinates.push([waypoint.lon, waypoint.lat]);
    }

    coordinates.push([end.lon, end.lat]);



    const restrictions = {};

    if (camperProfile.height && camperProfile.height > 0) {
        restrictions.height = camperProfile.height;
    }

    if (camperProfile.width && camperProfile.width > 0) {
        restrictions.width = camperProfile.width;
    }

    if (camperProfile.length && camperProfile.length > 0) {
        restrictions.length = camperProfile.length;
    }



    const avoidFeatures = [];

    if (camperProfile.avoidHighways) {
        avoidFeatures.push("highways");
    }

    if (camperProfile.avoidTolls) {
        avoidFeatures.push("tollways");
    }

    if (camperProfile.avoidFerries) {
        avoidFeatures.push("ferries");
    }



    const options = {
        profile_params: {
            restrictions: restrictions
        }
    };

    if (avoidFeatures.length > 0) {
        options.avoid_features = avoidFeatures;
    }



    const body = {
        coordinates: coordinates,
        options: options
    };


    const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-hgv/geojson",
        {
            method: "POST",
            headers: {
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }
    );


    if (!response.ok) {

        let message;

        if (response.status === 429) {

            message =
                "Hai raggiunto il limite giornaliero di calcoli con " +
                "dimensioni del camper (OpenRouteService). Riprova domani, " +
                "oppure rimuovi temporaneamente le dimensioni per un " +
                "calcolo standard.";

        } else if (response.status === 401 || response.status === 403) {

            message =
                "La chiave API di OpenRouteService non è valida o non è " +
                "autorizzata per questo tipo di calcolo.";

        } else {

            message =
                "Nessun percorso trovato compatibile con le dimensioni " +
                "inserite. Provare a modificarle o a rimuoverle.";

        }

        const error = new Error(message);

        error.orsStatus = response.status;

        throw error;

    }


    const data = await response.json();

    if (!data.features || !data.features.length) {

        const error = new Error(
            "Nessun percorso trovato compatibile con le dimensioni inserite."
        );

        error.orsStatus = "no-route";

        throw error;

    }


    const feature = data.features[0];


    return {

        distance: feature.properties.summary.distance,

        duration: feature.properties.summary.duration,

        geometry: {
            coordinates: feature.geometry.coordinates
        }

    };

}



async function computeRoute(start, waypoint, end, camperProfile) {

    if (camperProfile) {
        return await getRouteORS(start, waypoint, end, camperProfile);
    }

    if (waypoint) {
        return await getRouteWithWaypoint(start, waypoint, end);
    }

    return await getRoute(start, end);

}


function timeToMinutes(time) {

    const parts =
        time.split(":");



    return (

        Number(parts[0]) * 60

        +

        Number(parts[1])

    );

}
