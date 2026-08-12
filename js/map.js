let map;

let routeLayer1;

let routeLayer2;

let markers = [];

let stopIndex = null;

// Modalità selezione dalla mappa: null oppure "start" / "stop" / "end"
let selectionMode = null;

// Marker di conferma per ciascun campo: se l'utente sceglie di nuovo
// lo stesso campo, il marker precedente viene sostituito
let selectionMarkers = {};




function initMap(){

    map = L.map("map");

    map.on("click", function(e){

        if (!selectionMode) {
            return;
        }

        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        setSelectionMarker(selectionMode, lat, lon);

        if (typeof onMapPointSelected === "function") {
            onMapPointSelected(selectionMode, lat, lon);
        }

        selectionMode = null;

    });

    L.tileLayer(

        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            attribution:
            "&copy; OpenStreetMap contributors",

            crossOrigin: true

        }

    ).addTo(map);



    map.setView(
        [45.4642, 9.1900],
        6
    );


}








function clearMap(){


    if(routeLayer1){

        map.removeLayer(routeLayer1);

    }


    if(routeLayer2){

        map.removeLayer(routeLayer2);

    }



    markers.forEach(

        function(marker){

            map.removeLayer(marker);

        }

    );



    markers = [];

    selectionMarkers = {};


}








function drawRoute(
    coordinates
){


    clearMap();



    const latlngs =

    coordinates.map(

        function(point){

            return [

                point[1],

                point[0]

            ];

        }

    );



    routeLayer1 =

    L.polyline(

        latlngs,

        {

            weight: 5,

            color: "green"

        }

    ).addTo(map);



    map.fitBounds(

        routeLayer1.getBounds()

    );


}








function drawRouteSplit(
    coordinates,
    stopLat,
    stopLon
){


    clearMap();



    const stopPosition =

    findClosestPointIndex(

        coordinates,

        stopLat,

        stopLon

    );



    const firstPart =

    coordinates
    .slice(
        0,
        stopPosition + 1
    );



    const secondPart =

    coordinates
    .slice(
        stopPosition
    );





    routeLayer1 =

    L.polyline(

        convertCoordinates(firstPart),

        {

            weight: 6,

            color: "green"

        }

    ).addTo(map);





    routeLayer2 =

    L.polyline(

        convertCoordinates(secondPart),

        {

            weight: 6,

            color: "blue"

        }

    ).addTo(map);



    map.fitBounds(

        routeLayer1.getBounds()

    );


}








function convertCoordinates(
    coordinates
){


    return coordinates.map(

        function(point){

            return [

                point[1],

                point[0]

            ];

        }

    );


}








function findClosestPointIndex(
    coordinates,
    lat,
    lon
){


    let minimum = Infinity;

    let index = 0;



    coordinates.forEach(

        function(point, i){


            const distance =

            Math.sqrt(

                Math.pow(point[1]-lat,2)

                +

                Math.pow(point[0]-lon,2)

            );



            if(distance < minimum){

                minimum = distance;

                index = i;

            }


        }

    );



    return index;


}








function addMarker(
    lat,
    lon,
    text
){


    let color = "green";



    if(text === "Destinazione"){

        color = "red";

    }



    const icon =

    L.divIcon({

        className:
        "custom-marker",

        html:

        `<div style="
        background:${color};
        width:18px;
        height:18px;
        border-radius:50%;
        border:2px solid white;">
        </div>`


    });





    const marker =

    L.marker(

        [

            lat,

            lon

        ],

        {

            icon: icon

        }

    )

    .addTo(map)

    .bindPopup(text);



    markers.push(marker);


}








function addStopMarker(
    lat,
    lon
){


    const icon =

    L.divIcon({

        className:
        "stop-marker",

        html:

        `<div style="
        font-size:32px;">
        ⭐
        </div>`


    });



    const marker =

    L.marker(

        [

            lat,

            lon

        ],

        {

            icon: icon

        }

    )

    .addTo(map)

    .bindPopup(

        "<b>Sosta prevista</b>"

    );



    markers.push(marker);


}

function startMapSelection(field){

    selectionMode = field;

}



function stopMapSelection(){

    selectionMode = null;

}



function selectionIconFor(field){

    if(field === "start" || field.endsWith("-start")){
        return "🟢";
    }

    if(field === "stop" || field.endsWith("-stop")){
        return "🚩";
    }

    if(field === "end" || field.endsWith("-end")){
        return "🔵";
    }

    return "📍";

}



function setSelectionMarker(field, lat, lon){


    if(selectionMarkers[field]){

        map.removeLayer(selectionMarkers[field]);

        const index = markers.indexOf(selectionMarkers[field]);

        if(index > -1){
            markers.splice(index, 1);
        }

    }


    const icon = L.divIcon({

        className: "selection-marker",

        html: `<div style="font-size:28px; line-height:28px;">${selectionIconFor(field)}</div>`

    });


    const marker = L.marker(
        [lat, lon],
        { icon: icon }
    ).addTo(map);


    selectionMarkers[field] = marker;

    markers.push(marker);

}



function addWaypointMarker(lat, lon, text){


    const icon = L.divIcon({

        className: "waypoint-marker",

        html: `<div style="font-size:30px; line-height:30px;">🚩</div>`

    });


    const marker = L.marker(
        [lat, lon],
        { icon: icon }
    )
    .addTo(map)
    .bindPopup(text);


    markers.push(marker);

}



// --- Funzioni generiche per l'itinerario multi-tratta ---

function addColoredPolyline(coordinates, color){

    const latlngs = coordinates.map(function(point){
        return [point[1], point[0]];
    });

    const line = L.polyline(latlngs, {
        color: color,
        weight: 5,
        opacity: 0.85
    }).addTo(map);

    markers.push(line);

    return line;

}



function addLegMarker(lat, lon, text, color){

    const icon = L.divIcon({

        className: "leg-marker",

        html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 3px rgba(0,0,0,0.4);"></div>`

    });

    const marker = L.marker(
        [lat, lon],
        { icon: icon }
    )
    .addTo(map)
    .bindPopup(text);

    markers.push(marker);

    return marker;

}
